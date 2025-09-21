from django.http import Http404
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from core.models import Training
from core.serializers.trainings import (
    TrainingSerializer,
    TrainingCreateSerializer,
    TrainingUpdateSerializer,
    TrainingGroupsPatchSerializer,
)
from core.permissions import ReadOnlyOrAdmin


class TrainingViewSet(viewsets.GenericViewSet):
    permission_classes = [ReadOnlyOrAdmin]

    def get_object(self):
        pk = self.kwargs.get("pk")
        try:
            return Training.objects.get(id=pk)
        except Training.DoesNotExist:
            raise Http404
    
     @action(detail=True, methods=["post"], url_path="upload-lms", parser_classes=[MultiPartParser])
    def upload_lms(self, request, pk=None):
        training = self.get_object()
        excel_file = request.FILES.get("file")

        if not excel_file:
            return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            df = pd.read_excel(excel_file)
            updated, created = 0, 0

            for _, row in df.iterrows():
                username = str(row.get("Username")).strip()
                score = row.get("Score")
                completion_date = row.get("Last Access")

                try:
                    user = User.objects.get(username=username)
                except User.DoesNotExist:
                    continue

                required_score = training.config.get("completance_score", 90)
                completed = bool(score and score >= required_score)

                # Assuming you already have TrainingRecord linked to Training
                record, was_created = training.trainingrecord_set.update_or_create(
                    user=user,
                    defaults={
                        "score": score,
                        "completion_date": completion_date,
                        "completed": completed,
                    },
                )

                if was_created:
                    created += 1
                else:
                    updated += 1

            return Response(
                {"message": "LMS upload processed", "created": created, "updated": updated},
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    # POST /trainings
    def create(self, request):
        serializer = TrainingCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        training = serializer.save()
        return Response(TrainingSerializer(training).data)

    # GET /trainings/{id}
    def retrieve(self, request, *args, **kwargs):
        training = self.get_object()
        return Response(TrainingSerializer(training).data)

    # GET /trainings
    def list(self, request):
        trainings = Training.objects.all().order_by("name")
        serializer = TrainingSerializer(trainings, many=True)
        return Response(serializer.data)

    # PATCH /trainings/{id}
    def partial_update(self, request, *args, **kwargs):
        training = self.get_object()
        serializer = TrainingUpdateSerializer(instance=training, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(TrainingSerializer(training).data)

    # DELETE /trainings/{id}
    def destroy(self, request, *args, **kwargs):
        training = self.get_object()
        training.delete()
        return Response()

    # PATCH /trainings/{id}/groups
    @action(detail=True, methods=["patch"], url_path="groups")
    def manage_groups(self, request, *args, **kwargs):
        training = self.get_object()
        serializer = TrainingGroupsPatchSerializer(instance=training, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(TrainingSerializer(training).data)
