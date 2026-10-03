"""Serializers for User authentication and profiles."""

from rest_framework import serializers
from .models import User, RoleChoices


class UserSerializer(serializers.ModelSerializer):
    """Full user profile representation."""

    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "supabase_uid",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "phone_number",
            "role",
            "is_active",
            "is_staff",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "supabase_uid",
            "email",
            "is_staff",
            "created_at",
            "updated_at",
        ]


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for self-service user profile updates."""

    class Meta:
        model = User
        fields = [
            "first_name",
            "last_name",
            "phone_number",
        ]


class UserAdminUpdateSerializer(serializers.ModelSerializer):
    """Serializer for administrators to manage user roles and status."""

    class Meta:
        model = User
        fields = [
            "first_name",
            "last_name",
            "phone_number",
            "role",
            "is_active",
        ]

    def validate_role(self, value):
        if value not in RoleChoices.values:
            raise serializers.ValidationError(
                f"Invalid role. Must be one of: {', '.join(RoleChoices.values)}"
            )
        return value


class UserSyncSerializer(serializers.Serializer):
    """Payload serializer for frontend user sync endpoint."""

    supabase_uid = serializers.CharField(required=True, max_length=128)
    email = serializers.EmailField(required=True)
    first_name = serializers.CharField(required=False, allow_blank=True, default="")
    last_name = serializers.CharField(required=False, allow_blank=True, default="")
    phone_number = serializers.CharField(required=False, allow_blank=True, default="")
    role = serializers.ChoiceField(choices=RoleChoices.choices, default=RoleChoices.AGENT)
