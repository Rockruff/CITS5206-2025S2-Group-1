from rest_framework.routers import DefaultRouter

from .views.users import UserViewSet
from .views.groups import UserGroupViewSet
from .views.trainings import TrainingViewSet

router = DefaultRouter()
router.register("users", UserViewSet, basename="user")
router.register("groups", UserGroupViewSet, basename="group")
router.register("trainings", TrainingViewSet, basename="training")

urlpatterns = router.urls
