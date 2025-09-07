# backend/core/routers.py
from rest_framework.routers import DefaultRouter

router = DefaultRouter()

try:
    from .views import UserViewSet, UserGroupViewSet, TrainingViewSet
    router.register(r'users', UserViewSet, basename='user')
    router.register(r'user-groups', UserGroupViewSet, basename='usergroup')
    router.register(r'trainings', TrainingViewSet, basename='training')
except Exception:
    # ViewSets not present yet — skip to prevent import errors.
    pass
