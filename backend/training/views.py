from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
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
    UserCreateSerializer,
    UserDetailSerializer,
    UserUpdateSerializer,
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


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for User CRUD operations
    Corresponds to the Users table in database design

    Provides:
    - POST /api/users/          -> Create user
    - GET /api/users/{id}/      -> Get single user
    - PUT/PATCH /api/users/{id}/ -> Update user
    - DELETE /api/users/{id}/   -> Delete user
    """

    queryset = Person.objects.select_related("department").all()
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        """
        Return appropriate serializer class based on action
        """
        if self.action == "create":
            return UserCreateSerializer
        elif self.action in ["update", "partial_update"]:
            return UserUpdateSerializer
        return UserDetailSerializer

    def create(self, request, *args, **kwargs):
        """
        Create a new user
        POST /api/users/

        Expected input:
        {
            "first_name": "John",
            "last_name": "Doe",
            "email": "john.doe@uwa.edu.au",
            "external_id": "21234567",
            "person_type": "staff",
            "department": 1
        }
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Save the new user
        user = serializer.save()

        # Return detailed user information
        response_serializer = UserDetailSerializer(user)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    def retrieve(self, request, *args, **kwargs):
        """
        Get a single user by ID
        GET /api/users/{id}/

        Returns complete user information including computed fields
        """
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        """
        Update user profile
        PUT /api/users/{id}/     -> Full update
        PATCH /api/users/{id}/   -> Partial update

        Expected input (partial update example):
        {
            "first_name": "Jane",
            "email": "jane.doe@uwa.edu.au"
        }
        """
        partial = kwargs.pop("partial", False)
        instance = self.get_object()

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        # Save the updated user
        user = serializer.save()

        # Return detailed user information
        response_serializer = UserDetailSerializer(user)
        return Response(response_serializer.data)

    def destroy(self, request, *args, **kwargs):
        """
        Delete a user
        DELETE /api/users/{id}/

        Permanently removes user from database
        """
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


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
