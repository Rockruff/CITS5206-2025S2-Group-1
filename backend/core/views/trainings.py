# core/views/trainings.py
from django.http import Http404
from django.db.models import Q, Prefetch
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from core.models import Training, User, UserAlias, TrainingRecord
from core.serializers.trainings import (
    TrainingSerializer,
    TrainingCreateSerializer,
    TrainingUpdateSerializer,
)
from core.serializers.groups import UserGroupSerializer, UserGroupBriefSerializer
from core.serializers.users import (
    UserSerializer,
)  # <-- provides completion_status via context
from core.permissions import IsAdmin


class TrainingViewSet(viewsets.GenericViewSet):
    """
    Endpoints:
      - POST   /api/trainings
      - GET    /api/trainings
      - GET    /api/trainings/{id}
      - PATCH  /api/trainings/{id}
      - DELETE /api/trainings/{id}
      - GET    /api/trainings/{id}/groups
      - GET    /api/trainings/{id}/users
      - POST   /api/trainings/{id}/upload-lms (Excel import -> TrainingRecord.details)
    """

    permission_classes = [IsAdmin]

    # ---------- helpers ----------
    def get_object(self) -> Training:
        pk = self.kwargs.get("pk")
        try:
            return Training.objects.get(id=pk)
        except Training.DoesNotExist:
            raise Http404

    # ---------- groups for a training ----------
    # GET /api/trainings/{id}/groups?search=
    @action(detail=True, methods=["get"], url_path="groups")
    def groups(self, request, pk=None):
        """
        Lists all groups linked to this training.
        Optional: ?search= (matches name/description, case-insensitive)
        Always returns a flat list (no pagination envelope).
        """
        training = self.get_object()
        qs = training.groups.all().order_by(
            "name"
        )  # if reverse differs: training.usergroup_set.all()

        s = request.query_params.get("search")
        if s:
            qs = qs.filter(Q(name__icontains=s) | Q(description__icontains=s))

        # Use brief serializer to keep payload small and stable
        return Response(UserGroupBriefSerializer(qs, many=True).data)

    # ---------- users for a training (with completion_status) ----------
    # GET /api/trainings/{id}/users?search=
    @action(detail=True, methods=["get"], url_path="users")
    def users(self, request, pk=None):
        """
        Returns users in any group assigned to this training, plus a derived
        `completion_status` for this specific training:
          "not_attempted" | "expired" | "failed" | "passed"

        Optional:
          - ?search= (matches user.name or user.id; case-insensitive)
        Respects DRF pagination if configured.
        """
        try:
            training = Training.objects.get(id=pk)
        except Training.DoesNotExist:
            raise Http404

        # Users who belong to groups linked to this training
        qs = (
            User.objects.filter(groups__in=training.groups.all())
            .distinct()
            .order_by("name")
            .prefetch_related(
                Prefetch(
                    "records",
                    queryset=TrainingRecord.objects.filter(training=training),
                    to_attr="records_for_training",
                )
            )
        )

        s = request.query_params.get("search")
        if s:
            qs = qs.filter(Q(name__icontains=s) | Q(id__icontains=s))

        page = self.paginate_queryset(qs)
        ser = UserSerializer(page or qs, many=True, context={"training": training})
        if page is not None:
            return self.get_paginated_response(ser.data)
        return Response(ser.data)

    # ---------- LMS upload ----------
    # POST /api/trainings/{id}/upload-lms  (multipart/form-data with file=*.xlsx)
    @action(detail=True, methods=["post"], url_path="upload-lms")
    def upload_lms(self, request, pk=None):
        """
        Accepts an Excel file and upserts TrainingRecord per user.
        Expected columns (best-effort): Username / User / UWA_ID, Score, Last Access
        - Resolve users by UserAlias(id=<value>) falling back to User(id=<value>).
        - Store row data inside TrainingRecord.details (JSON) to avoid schema churn.
        """
        training = self.get_object()
        excel_file = request.FILES.get("file")
        if not excel_file:
            return Response({"detail": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            import pandas as pd  # type: ignore
        except Exception as e:  # pragma: no cover
            return Response(
                {
                    "detail": "pandas is required on server to read Excel files.",
                    "error": str(e),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        try:
            df = pd.read_excel(excel_file)
        except Exception as e:
            return Response(
                {"detail": "Unable to read Excel file.", "error": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Normalize column names and locate likely headers
        cols = {str(c).strip().lower(): c for c in df.columns}
        col_username = cols.get("username") or cols.get("user") or cols.get("uwa_id")
        col_score = cols.get("score")
        col_last = cols.get("last access") or cols.get("completed at") or cols.get("date")

        if not col_username:
            return Response(
                {"detail": "Missing a username/uwa_id-like column (Username / User / UWA_ID)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        required_score = training.config.get("completance_score", 90)  # keep current key
        created, updated, skipped = 0, 0, 0

        for _, row in df.iterrows():
            raw_id_val = row.get(col_username)
            raw_id = str(raw_id_val).strip() if raw_id_val is not None else ""
            if not raw_id:
                skipped += 1
                continue

            # Resolve user via alias → canonical user
            alias = UserAlias.objects.filter(id=raw_id).select_related("user").first()
            user = alias.user if alias else User.objects.filter(id=raw_id).first()
            if not user:
                skipped += 1
                continue

            score = row.get(col_score) if col_score else None
            completed = False
            if isinstance(score, (int, float)) and isinstance(required_score, (int, float)):
                completed = score >= required_score
            completion_date = row.get(col_last) if col_last else None

            # Upsert by (user, training)
            _, was_created = TrainingRecord.objects.update_or_create(
                user=user,
                training=training,
                defaults={
                    "details": {
                        "source": "lms_upload",
                        "score": (float(score) if isinstance(score, (int, float)) else None),
                        "required_score": required_score,
                        "completed": completed,
                        "completion_date": (
                            str(completion_date) if completion_date is not None else None
                        ),
                    }
                },
            )
            if was_created:
                created += 1
            else:
                updated += 1

        return Response(
            {
                "message": "LMS upload processed",
                "created": created,
                "updated": updated,
                "skipped": skipped,
            },
            status=status.HTTP_200_OK,
        )

    # ---------- CRUD ----------
    # POST /api/trainings
    def create(self, request):
        serializer = TrainingCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        training = serializer.save()
        # prefetch for consistent payload shape if client reads immediately
        training = Training.objects.prefetch_related("groups").get(id=training.id)
        return Response(TrainingSerializer(training).data, status=status.HTTP_201_CREATED)

    # GET /api/trainings/{id}
    def retrieve(self, request, *args, **kwargs):
        training_id = self.kwargs.get("pk")
        training = Training.objects.filter(id=training_id).prefetch_related("groups").first()
        if not training:
            raise Http404
        return Response(TrainingSerializer(training).data)

    # GET /api/trainings  (paginated if configured)
    def list(self, request):
        qs = Training.objects.all().prefetch_related("groups").order_by("name")
        page = self.paginate_queryset(qs)
        if page is not None:
            ser = TrainingSerializer(page, many=True)
            return self.get_paginated_response(ser.data)
        ser = TrainingSerializer(qs, many=True)
        return Response(ser.data)

    # PATCH /api/trainings/{id}
    def partial_update(self, request, *args, **kwargs):
        training = self.get_object()
        serializer = TrainingUpdateSerializer(instance=training, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        # return with groups embedded
        training = Training.objects.prefetch_related("groups").get(id=training.id)
        return Response(TrainingSerializer(training).data)

    # DELETE /api/trainings/{id}
    def destroy(self, request, *args, **kwargs):
        training = self.get_object()
        training.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
