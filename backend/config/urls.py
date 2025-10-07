# config/urls.py
from django.urls import path, include

urlpatterns = [
    # JWT auth
    path("api/auth/", include("auth.urls")),
    # API routers
    path("api/", include("core.urls")),
]
