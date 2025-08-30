from rest_framework import serializers
from core.models import UserAlias


class CustomTokenObtainPairSerializer(serializers.Serializer):
    """
    Validates that a UWA ID is provided and resolves it to a user.
    This is a temporary placeholder implementation for SSO authentication.
    Expects: { "uwa_id": "<uwa_id>" }
    Returns: { "user": <User instance> }
    """

    uwa_id = serializers.CharField(write_only=True)

    def validate(self, attrs):
        uwa_id = attrs.get("uwa_id")
        if not uwa_id:
            raise serializers.ValidationError("UWA ID is required")

        try:
            alias = UserAlias.objects.get(uwa_id=uwa_id)
        except UserAlias.DoesNotExist:
            raise serializers.ValidationError("User with given UWA ID does not exist")

        return {"user": alias.user}
