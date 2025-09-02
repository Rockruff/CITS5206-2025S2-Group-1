from rest_framework import viewsets, permissions
from .models import (
    Department,
    Person,
    Position,
    UserPosition,
    Category,
    UserCategory,
    Training,
    TrainingFieldDef,
    TrainingRecord,
    TrainingRecordFieldValue,
    CategoryTrainingRequirement,
    TrainingEvent,
    TrainingAttendance,
)
from .serializers import (
    DepartmentSerializer,
    PersonSerializer,
    PositionSerializer,
    UserPositionSerializer,
    CategorySerializer,
    UserCategorySerializer,
    TrainingSerializer,
    TrainingFieldDefSerializer,
    TrainingRecordSerializer,
    TrainingRecordFieldValueSerializer,
    CategoryTrainingRequirementSerializer,
    TrainingEventSerializer,
    TrainingAttendanceSerializer,
)


class IsStaffOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return request.user.is_authenticated
        return request.user.is_staff


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all().order_by("name")
    serializer_class = DepartmentSerializer
    permission_classes = [IsStaffOrReadOnly]


class PersonViewSet(viewsets.ModelViewSet):
    queryset = Person.objects.select_related("department").all().order_by("id")
    serializer_class = PersonSerializer
    permission_classes = [IsStaffOrReadOnly]
    filterset_fields = ["person_type", "active", "email", "external_id", "department"]


class PositionViewSet(viewsets.ModelViewSet):
    queryset = Position.objects.all()
    serializer_class = PositionSerializer
    permission_classes = [IsStaffOrReadOnly]


class UserPositionViewSet(viewsets.ModelViewSet):
    queryset = UserPosition.objects.select_related("person", "position").all()
    serializer_class = UserPositionSerializer
    permission_classes = [IsStaffOrReadOnly]
    filterset_fields = ["person", "position"]


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by("name")
    serializer_class = CategorySerializer
    permission_classes = [IsStaffOrReadOnly]
    filterset_fields = ["scope", "active"]


class UserCategoryViewSet(viewsets.ModelViewSet):
    queryset = UserCategory.objects.select_related("person", "category").all()
    serializer_class = UserCategorySerializer
    permission_classes = [IsStaffOrReadOnly]
    filterset_fields = ["person", "category"]


class TrainingViewSet(viewsets.ModelViewSet):
    queryset = Training.objects.prefetch_related("categories").all()
    serializer_class = TrainingSerializer
    permission_classes = [IsStaffOrReadOnly]
    filterset_fields = ["active", "expiry_mode", "categories"]


class TrainingFieldDefViewSet(viewsets.ModelViewSet):
    queryset = TrainingFieldDef.objects.select_related("training").all()
    serializer_class = TrainingFieldDefSerializer
    permission_classes = [IsStaffOrReadOnly]
    filterset_fields = ["training", "data_type", "required", "active"]


class TrainingRecordViewSet(viewsets.ModelViewSet):
    queryset = TrainingRecord.objects.select_related("person", "training").all()
    serializer_class = TrainingRecordSerializer
    permission_classes = [IsStaffOrReadOnly]
    filterset_fields = ["person", "training", "status", "source"]
    ordering_fields = ["completed_at", "expiry_at", "updated_at"]


class TrainingRecordFieldValueViewSet(viewsets.ModelViewSet):
    queryset = TrainingRecordFieldValue.objects.select_related(
        "record", "field_def"
    ).all()
    serializer_class = TrainingRecordFieldValueSerializer
    permission_classes = [IsStaffOrReadOnly]
    filterset_fields = ["record", "field_def"]


class CategoryTrainingRequirementViewSet(viewsets.ModelViewSet):
    queryset = CategoryTrainingRequirement.objects.select_related(
        "category", "training"
    ).all()
    serializer_class = CategoryTrainingRequirementSerializer
    permission_classes = [IsStaffOrReadOnly]
    filterset_fields = ["category", "training", "required", "active"]


class TrainingEventViewSet(viewsets.ModelViewSet):
    queryset = TrainingEvent.objects.select_related("training").all()
    serializer_class = TrainingEventSerializer
    permission_classes = [IsStaffOrReadOnly]
    filterset_fields = ["training", "external_system"]


class TrainingAttendanceViewSet(viewsets.ModelViewSet):
    queryset = TrainingAttendance.objects.select_related("event", "person").all()
    serializer_class = TrainingAttendanceSerializer
    permission_classes = [IsStaffOrReadOnly]
    filterset_fields = ["event", "person", "status", "source"]
