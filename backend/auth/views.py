from rest_framework_simplejwt.views import TokenViewBase, TokenRefreshView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import CustomTokenObtainPairSerializer


class CustomTokenObtainPairView(TokenViewBase):
    """
    Custom login view: authenticate via UWA ID.
    Expects: { "uwa_id": "<uwa_id>" }
    Returns: { "refresh": ..., "access": ... }
    """

    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]

        refresh = RefreshToken().for_user(user)
        access = refresh.access_token

        return Response(
            {
                "refresh": str(refresh),
                "access": str(access),
            },
        )


class CustomTokenRefreshView(TokenRefreshView):
    """
    Uses SimpleJWT's built-in serializer to refresh tokens.
    Expects: { "refresh": "<refresh_token>" }
    Returns: { "access": "<new_access_token>" }
    """

    pass
