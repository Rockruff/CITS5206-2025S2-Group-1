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
