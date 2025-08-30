from django.urls import path
from .views import CustomTokenObtainPairView, CustomTokenRefreshView

urlpatterns = [
    path("login", CustomTokenObtainPairView.as_view(), name="custom_token_obtain_pair"),
    path("refresh", CustomTokenRefreshView.as_view(), name="token_refresh"),
    # No logout endpoint for JWT (handled client-side)
]
