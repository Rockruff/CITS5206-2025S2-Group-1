# core/views/trainings.py
from django.http import Http404
from django.db.models import Prefetch
from core.utils import paginate_qs
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from core.models import Training, User, TrainingRecord
from core.serializers.trainings import (
    TrainingSerializer,
    TrainingCreateSerializer,
    TrainingUpdateSerializer,
    TrainingUserStatusSerializer,
)
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
    """

    permission_classes = [IsAdmin]

    # ---------- helpers ----------
    def get_object(self) -> Training:
        pk = self.kwargs.get("pk")
        try:
            return Training.objects.get(id=pk)
        except Training.DoesNotExist:
            raise Http404

    # ---------- users for a training (with completion_status) ----------
    # GET /api/trainings/{id}/users
    @action(detail=True, methods=["get"], url_path="users")
    def users(self, request, pk=None):
        training = self.get_object()

        qs = User.objects.filter(groups__in=training.groups.all()).distinct()

        order_by = request.query_params.get("order_by", "id")
        if order_by in {"id", "-id", "name", "-name"}:
            qs = qs.order_by(order_by)

        id_kw = request.query_params.get("id")
        if id_kw:
            qs = qs.filter(aliases__id__icontains=id_kw).distinct()
        name_kw = request.query_params.get("name")
        if name_kw:
            keywords = name_kw.split()
            for kw in keywords:
                qs = qs.filter(name__icontains=kw)

        qs = qs.prefetch_related(
            Prefetch(
                "records",
                queryset=TrainingRecord.objects.filter(training=training),
                to_attr="records_for_training",
            )
        )
        status_filter = request.query_params.get("status")
        users = []
        for user in qs:
            records = getattr(user, "records_for_training", [])
            if not records:
                completion_status = "PENDING"
            else:
                # Assume only one record per user-training pair
                # Currently we only store one latest record per user-training
                record = records[0]
                completion_status = record.status
            if status_filter:
                if completion_status != status_filter:
                    continue
            user.status = completion_status
            users.append(user)

        return paginate_qs(users, request.query_params, 10, TrainingUserStatusSerializer, Response)

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
        training = Training.objects.filter(id=training_id).first()
        if not training:
            raise Http404
        return Response(TrainingSerializer(training).data)

    # GET /api/trainings  (paginated if configured)
    def list(self, request):
        qs = Training.objects.all()
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
