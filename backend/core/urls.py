# core/urls.py
from django.urls import path, include
from .routers import router
from core.views.users import UsersListView, UsersBatchCreateView

urlpatterns = [
    path("", include(router.urls)),
    path("users", UsersListView.as_view(), name="users-list"),
    path("users/batch", UsersBatchCreateView.as_view(), name="users-batch"),
]
