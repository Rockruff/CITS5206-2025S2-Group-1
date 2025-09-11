from django.http import Http404
from rest_framework import viewsets, status
from rest_framework.response import Response

from core.models import Training
from core.serializers.trainings import (
    TrainingSerializer,
    TrainingCreateSerializer,
    TrainingUpdateSerializer,
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
    def retrieve(self, request, pk=None):
        training = self.get_object()
        return Response(TrainingSerializer(training).data)

    # PATCH /trainings/{id}
    def partial_update(self, request, pk=None):
        training = self.get_object()
        serializer = TrainingUpdateSerializer(instance=training, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(TrainingSerializer(training).data)

    # DELETE /trainings/{id}
    def destroy(self, request, pk=None):
        training = self.get_object()
        training.delete()
        return Response()
