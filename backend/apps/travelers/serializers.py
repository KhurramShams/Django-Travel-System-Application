"""Serializers for Traveler entity and family/guardian hierarchy."""

import re
from rest_framework import serializers
from .models import Traveler, AgeCategory


class TravelerDependentSerializer(serializers.ModelSerializer):
    """Compact serializer for linked dependents."""

    class Meta:
        model = Traveler
        fields = [
            "id",
            "full_name",
            "cnic",
            "age_category",
            "phone_number",
            "passport_number",
        ]


class TravelerGuardianSerializer(serializers.ModelSerializer):
    """Compact serializer for primary guardian."""

    class Meta:
        model = Traveler
        fields = [
            "id",
            "full_name",
            "cnic",
            "phone_number",
        ]


class TravelerSerializer(serializers.ModelSerializer):
    """Comprehensive traveler profile with guardian and dependent relationships."""

    guardian_details = TravelerGuardianSerializer(source="guardian", read_only=True)
    dependents = TravelerDependentSerializer(many=True, read_only=True)
    has_active_package = serializers.BooleanField(read_only=True)
    active_package_title = serializers.SerializerMethodField()
    active_enrollment_id = serializers.SerializerMethodField()

    class Meta:
        model = Traveler
        fields = [
            "id",
            "full_name",
            "cnic",
            "phone_number",
            "passport_number",
            "age_category",
            "guardian",
            "guardian_details",
            "dependents",
            "address",
            "emergency_contact",
            "notes",
            "has_active_package",
            "active_package_title",
            "active_enrollment_id",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_active_package_title(self, obj):
        active = obj.current_active_enrollment
        return active.package.title if active else None

    def get_active_enrollment_id(self, obj):
        active = obj.current_active_enrollment
        return str(active.id) if active else None


class TravelerCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for registering or modifying client profiles."""

    class Meta:
        model = Traveler
        fields = [
            "id",
            "full_name",
            "cnic",
            "phone_number",
            "passport_number",
            "age_category",
            "guardian",
            "address",
            "emergency_contact",
            "notes",
        ]
        read_only_fields = ["id"]

    def validate_cnic(self, value):
        cleaned = value.strip()
        if not re.match(r"^\d{5}-\d{7}-\d{1}$", cleaned):
            raise serializers.ValidationError(
                "CNIC must follow the standard 13-digit format: XXXXX-XXXXXXX-X (e.g. 35202-1234567-1)"
            )
        return cleaned

    def validate(self, attrs):
        guardian = attrs.get("guardian")
        instance = getattr(self, "instance", None)

        if instance and guardian and guardian.id == instance.id:
            raise serializers.ValidationError({"guardian": "A traveler cannot be assigned as their own guardian."})

        return attrs


class TravelerLookupSerializer(serializers.ModelSerializer):
    """Fast lightweight serializer for asynchronous autocomplete during package booking."""

    has_active_package = serializers.BooleanField(read_only=True)
    active_package_title = serializers.SerializerMethodField()
    guardian_name = serializers.CharField(source="guardian.full_name", read_only=True, default=None)

    class Meta:
        model = Traveler
        fields = [
            "id",
            "full_name",
            "cnic",
            "phone_number",
            "age_category",
            "passport_number",
            "guardian_name",
            "has_active_package",
            "active_package_title",
        ]

    def get_active_package_title(self, obj):
        active = obj.current_active_enrollment
        return active.package.title if active else None
