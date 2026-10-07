"""Serializers for Travel Packages, Enrollments, and Traveler Payments."""

from decimal import Decimal
import uuid
from django.utils import timezone
from rest_framework import serializers
from apps.travelers.serializers import TravelerSerializer, TravelerDependentSerializer
from .models import (
    TravelPackage,
    PackageEnrollment,
    TravelerPayment,
    LocationChoices,
    StarRatingChoices,
    PackageStatus,
    EnrollmentStatus,
    PaymentMethod,
)


class TravelPackageSerializer(serializers.ModelSerializer):
    """Full representation of a Travel Package."""

    duration_days = serializers.IntegerField(read_only=True)
    total_enrolled = serializers.IntegerField(read_only=True)
    seats_available = serializers.IntegerField(read_only=True)

    class Meta:
        model = TravelPackage
        fields = [
            "id",
            "title",
            "package_code",
            "location",
            "star_rating",
            "shuttle_service",
            "flight_name",
            "departure_date",
            "return_date",
            "adult_price",
            "child_price",
            "infant_price",
            "capacity",
            "status",
            "description",
            "duration_days",
            "total_enrolled",
            "seats_available",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "duration_days",
            "total_enrolled",
            "seats_available",
            "created_at",
            "updated_at",
        ]


class TravelPackageCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and modifying packages."""

    package_code = serializers.CharField(required=False, max_length=50)

    class Meta:
        model = TravelPackage
        fields = [
            "id",
            "title",
            "package_code",
            "location",
            "star_rating",
            "shuttle_service",
            "flight_name",
            "departure_date",
            "return_date",
            "adult_price",
            "child_price",
            "infant_price",
            "capacity",
            "status",
            "description",
        ]
        read_only_fields = ["id"]

    def validate(self, attrs):
        dep = attrs.get("departure_date") or getattr(self.instance, "departure_date", None)
        ret = attrs.get("return_date") or getattr(self.instance, "return_date", None)
        if dep and ret and dep > ret:
            raise serializers.ValidationError({"return_date": "Return date must be on or after departure date."})

        # Auto-generate package code if missing
        if not attrs.get("package_code") and not getattr(self.instance, "package_code", None):
            year = timezone.now().year
            rand_suffix = uuid.uuid4().hex[:5].upper()
            attrs["package_code"] = f"PKG-{year}-{rand_suffix}"

        return attrs


class TravelerPaymentSerializer(serializers.ModelSerializer):
    """Serializer for traveler payment receipts."""

    receipt_number = serializers.CharField(read_only=True)
    recorded_by_name = serializers.CharField(source="recorded_by.full_name", read_only=True, default=None)
    traveler_name = serializers.CharField(source="enrollment.traveler.full_name", read_only=True)
    enrollment_number = serializers.CharField(source="enrollment.enrollment_number", read_only=True)

    class Meta:
        model = TravelerPayment
        fields = [
            "id",
            "receipt_number",
            "enrollment",
            "amount",
            "payment_date",
            "payment_method",
            "reference_number",
            "notes",
            "recorded_by",
            "recorded_by_name",
            "traveler_name",
            "enrollment_number",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "receipt_number",
            "recorded_by",
            "recorded_by_name",
            "traveler_name",
            "enrollment_number",
            "created_at",
        ]

    def validate_amount(self, value):
        if value <= Decimal("0.00"):
            raise serializers.ValidationError("Payment amount must be greater than zero.")
        return value

    def create(self, validated_data):
        request = self.context.get("request")
        if request and hasattr(request, "user"):
            validated_data["recorded_by"] = request.user

        # Auto-generate receipt number
        year = timezone.now().year
        rand_suffix = uuid.uuid4().hex[:6].upper()
        validated_data["receipt_number"] = f"RCT-{year}-{rand_suffix}"

        return super().create(validated_data)


class PackageEnrollmentListSerializer(serializers.ModelSerializer):
    """Listing view of enrollments with traveler info and live financial summaries."""

    traveler_id = serializers.UUIDField(source="traveler.id", read_only=True)
    traveler_name = serializers.CharField(source="traveler.full_name", read_only=True)
    traveler_cnic = serializers.CharField(source="traveler.cnic", read_only=True)
    traveler_phone = serializers.CharField(source="traveler.phone_number", read_only=True)
    traveler_age_category = serializers.CharField(source="traveler.age_category", read_only=True)
    package_title = serializers.CharField(source="package.title", read_only=True)
    package_code = serializers.CharField(source="package.package_code", read_only=True)
    departure_date = serializers.DateField(source="package.departure_date", read_only=True)

    total_paid = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    remaining_balance = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    payment_status = serializers.CharField(read_only=True)

    class Meta:
        model = PackageEnrollment
        fields = [
            "id",
            "enrollment_number",
            "traveler_id",
            "traveler_name",
            "traveler_cnic",
            "traveler_phone",
            "traveler_age_category",
            "package_id",
            "package_title",
            "package_code",
            "departure_date",
            "enrolled_date",
            "base_price_applied",
            "extra_amount",
            "discount",
            "final_agreed_price",
            "total_paid",
            "remaining_balance",
            "payment_status",
            "status",
        ]


class PackageEnrollmentCreateSerializer(serializers.ModelSerializer):
    """Handles enrollment creation, age-based rate locking, and single active package validation."""

    enrollment_number = serializers.CharField(read_only=True)
    base_price_applied = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    final_agreed_price = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = PackageEnrollment
        fields = [
            "id",
            "enrollment_number",
            "traveler",
            "package",
            "enrolled_date",
            "base_price_applied",
            "extra_amount",
            "discount",
            "final_agreed_price",
            "special_requests",
            "status",
        ]
        read_only_fields = ["id", "enrollment_number", "final_agreed_price"]

    def validate(self, attrs):
        traveler = attrs.get("traveler")
        package = attrs.get("package")
        status_val = attrs.get("status", EnrollmentStatus.ACTIVE)

        # Enforce Business Rule: Single Active Package per Traveler
        if status_val == EnrollmentStatus.ACTIVE and traveler:
            active_existing = PackageEnrollment.objects.filter(
                traveler=traveler,
                status=EnrollmentStatus.ACTIVE,
            )
            if self.instance:
                active_existing = active_existing.exclude(pk=self.instance.pk)
            if active_existing.exists():
                active_pkg = active_existing.first().package.title
                raise serializers.ValidationError(
                    {
                        "traveler": (
                            f"Traveler '{traveler.full_name}' is already actively enrolled in package "
                            f"'{active_pkg}'. A traveler can only belong to ONE active package at a time."
                        )
                    }
                )

        # Ensure package has remaining quota
        if package and not self.instance:
            if package.seats_available <= 0:
                raise serializers.ValidationError(
                    {"package": f"Package '{package.title}' has reached its full quota ({package.capacity} seats)."}
                )

        # Auto-apply base price based on traveler's age category if not manually overridden
        if "base_price_applied" not in attrs or attrs["base_price_applied"] is None:
            if package and traveler:
                attrs["base_price_applied"] = package.get_price_for_age(traveler.age_category)

        # Ensure non-negative extras and discounts
        extra = attrs.get("extra_amount", Decimal("0.00"))
        discount = attrs.get("discount", Decimal("0.00"))
        if extra < 0:
            raise serializers.ValidationError({"extra_amount": "Extra amount cannot be negative."})
        if discount < 0:
            raise serializers.ValidationError({"discount": "Discount cannot be negative."})

        # Calculate final agreed price
        base = attrs.get("base_price_applied", Decimal("0.00"))
        attrs["final_agreed_price"] = (base + extra) - discount

        return attrs

    def create(self, validated_data):
        request = self.context.get("request")
        if request and hasattr(request, "user"):
            validated_data["created_by"] = request.user

        year = timezone.now().year
        rand_suffix = uuid.uuid4().hex[:6].upper()
        validated_data["enrollment_number"] = f"ENR-{year}-{rand_suffix}"

        return super().create(validated_data)


class PackageEnrollmentDetailSerializer(serializers.ModelSerializer):
    """Detailed enrollment contract representation including traveler profile and payment history."""

    traveler = TravelerSerializer(read_only=True)
    package = TravelPackageSerializer(read_only=True)
    payments = TravelerPaymentSerializer(many=True, read_only=True)
    total_paid = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    remaining_balance = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    payment_status = serializers.CharField(read_only=True)
    created_by_name = serializers.CharField(source="created_by.full_name", read_only=True, default=None)

    class Meta:
        model = PackageEnrollment
        fields = [
            "id",
            "enrollment_number",
            "traveler",
            "package",
            "enrolled_date",
            "base_price_applied",
            "extra_amount",
            "discount",
            "final_agreed_price",
            "total_paid",
            "remaining_balance",
            "payment_status",
            "status",
            "special_requests",
            "payments",
            "created_by_name",
            "created_at",
            "updated_at",
        ]
