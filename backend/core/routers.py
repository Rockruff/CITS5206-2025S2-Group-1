from rest_framework.routers import DefaultRouter
from .views import UserViewSet, UserGroupViewSet, TrainingViewSet

router = DefaultRouter()
router.register(r"users", UserViewSet, basename="user")
router.register(r"user-groups", UserGroupViewSet, basename="user-group")
router.register(r"trainings", TrainingViewSet, basename="training")

urlpatterns = router.urls
