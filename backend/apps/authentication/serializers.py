"""Serializers for User authentication and profiles."""

import uuid
from rest_framework import serializers
from .models import User, RoleChoices


class UserSerializer(serializers.ModelSerializer):
    """Full user profile representation."""

    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
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
            "is_staff",
            "created_at",
            "updated_at",
        ]


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for administrators to create new staff users with password."""

    password = serializers.CharField(write_only=True, required=True, min_length=6)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "password",
            "first_name",
            "last_name",
            "phone_number",
            "role",
            "is_active",
        ]
        read_only_fields = ["id"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        role = validated_data.get("role", RoleChoices.AGENT)
        is_staff = (role == RoleChoices.ADMIN)

        user = User.objects.create_user(
            password=password,
            is_staff=is_staff,
            **validated_data
        )
        return user


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
    """Serializer for administrators to manage user roles, status, and reset passwords."""

    password = serializers.CharField(write_only=True, required=False, min_length=6, allow_blank=True)

    class Meta:
        model = User
        fields = [
            "first_name",
            "last_name",
            "phone_number",
            "role",
            "is_active",
            "password",
        ]

    def validate_role(self, value):
        if value not in RoleChoices.values:
            raise serializers.ValidationError(
                f"Invalid role. Must be one of: {', '.join(RoleChoices.values)}"
            )
        return value

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        if password:
            instance.set_password(password)

        role = validated_data.get("role", instance.role)
        if role == RoleChoices.ADMIN:
            instance.is_staff = True

        return super().update(instance, validated_data)


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for password changes."""

    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=6)

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password does not match.")
        return value
