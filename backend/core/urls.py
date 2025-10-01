from rest_framework.routers import DefaultRouter

from .views.users import UserViewSet
from .views.groups import UserGroupViewSet
from .views.trainings import TrainingViewSet
from .views.training_records import TrainingRecordViewSet

router = DefaultRouter(trailing_slash=False)
router.register("users", UserViewSet, basename="user")
router.register("groups", UserGroupViewSet, basename="group")
router.register("trainings", TrainingViewSet, basename="training")
router.register("training-records", TrainingRecordViewSet, basename="training-record")

urlpatterns = router.urls
