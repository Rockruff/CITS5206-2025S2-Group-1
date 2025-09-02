from rest_framework.routers import DefaultRouter
from .views import (
    DepartmentViewSet,
    PersonViewSet,
    PositionViewSet,
    UserPositionViewSet,
    CategoryViewSet,
    UserCategoryViewSet,
    TrainingViewSet,
    TrainingFieldDefViewSet,
    TrainingRecordViewSet,
    TrainingRecordFieldValueViewSet,
    CategoryTrainingRequirementViewSet,
    TrainingEventViewSet,
    TrainingAttendanceViewSet,
)

router = DefaultRouter()
router.register(r"departments", DepartmentViewSet)
router.register(r"people", PersonViewSet)
router.register(r"positions", PositionViewSet)
router.register(r"user_positions", UserPositionViewSet)
router.register(r"categories", CategoryViewSet)
router.register(r"user_categories", UserCategoryViewSet)
router.register(r"trainings", TrainingViewSet)
router.register(r"training_field_defs", TrainingFieldDefViewSet)
router.register(r"training_records", TrainingRecordViewSet)
router.register(r"training_record_field_values", TrainingRecordFieldValueViewSet)
router.register(r"category_training_requirements", CategoryTrainingRequirementViewSet)
router.register(r"training_events", TrainingEventViewSet)
router.register(r"training_attendance", TrainingAttendanceViewSet)

urlpatterns = router.urls
