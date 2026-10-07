"""Serializers for Hotel Bookings, Accommodations, and Settlement Ledgers."""

from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from .models import (
    HotelBooking,
    HotelLocation,
    HotelPayment,
    HotelPaymentMethod,
    HotelPaymentStatus,
)


class HotelPaymentSerializer(serializers.ModelSerializer):
    """Serializer for individual incremental hotel settlement ledger entries."""

    recorded_by_name = serializers.CharField(source="recorded_by.full_name", read_only=True, default=None)
    booking_reference = serializers.CharField(source="hotel_booking.booking_reference", read_only=True)
    hotel_name = serializers.CharField(source="hotel_booking.hotel_name", read_only=True)

    class Meta:
        model = HotelPayment
        fields = [
            "id",
            "hotel_booking",
            "booking_reference",
            "hotel_name",
            "amount",
            "payment_date",
            "payment_method",
            "receipt_number",
            "reference_number",
            "notes",
            "recorded_by",
            "recorded_by_name",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "receipt_number",
            "recorded_by",
            "recorded_by_name",
            "booking_reference",
            "hotel_name",
            "created_at",
        ]

    def validate_amount(self, value):
        if value <= Decimal("0.00"):
            raise serializers.ValidationError(_("Settlement installment must be greater than zero."))
        return value


class HotelBookingListSerializer(serializers.ModelSerializer):
    """Compact summary serializer for hotel directory and tabbed tables."""

    created_by_name = serializers.CharField(source="created_by.full_name", read_only=True, default=None)
    payments_count = serializers.IntegerField(source="payments.count", read_only=True)

    class Meta:
        model = HotelBooking
        fields = [
            "id",
            "booking_reference",
            "hotel_name",
            "location",
            "booking_date",
            "check_in",
            "check_out",
            "room_details",
            "total_price",
            "advance_paid",
            "remaining_amount",
            "payment_status",
            "is_active",
            "payments_count",
            "created_by_name",
            "created_at",
        ]


class HotelBookingDetailSerializer(serializers.ModelSerializer):
    """Comprehensive reservation dossier including nested payment settlements history."""

    created_by_name = serializers.CharField(source="created_by.full_name", read_only=True, default=None)
    payments = HotelPaymentSerializer(many=True, read_only=True)

    class Meta:
        model = HotelBooking
        fields = [
            "id",
            "booking_reference",
            "hotel_name",
            "location",
            "booking_date",
            "check_in",
            "check_out",
            "room_details",
            "total_price",
            "advance_paid",
            "remaining_amount",
            "payment_status",
            "is_active",
            "notes",
            "created_by",
            "created_by_name",
            "payments",
            "created_at",
            "updated_at",
        ]


class HotelBookingCreateSerializer(serializers.ModelSerializer):
    """Handles reservation creation with instant balance validation and atomic initial ledger entry."""

    payment_method = serializers.ChoiceField(
        choices=HotelPaymentMethod.choices,
        default=HotelPaymentMethod.CASH,
        write_only=True,
        required=False,
    )
    reference_number = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=True,
        default="",
        write_only=True,
    )

    class Meta:
        model = HotelBooking
        fields = [
            "id",
            "booking_reference",
            "hotel_name",
            "location",
            "booking_date",
            "check_in",
            "check_out",
            "room_details",
            "total_price",
            "advance_paid",
            "payment_method",
            "reference_number",
            "notes",
        ]
        read_only_fields = ["id", "booking_reference"]

    def validate(self, attrs):
        total_price = attrs.get("total_price", Decimal("0.00"))
        advance_paid = attrs.get("advance_paid", Decimal("0.00"))

        if total_price <= Decimal("0.00"):
            raise serializers.ValidationError({"total_price": _("Total price must be greater than zero.")})

        if advance_paid > total_price:
            raise serializers.ValidationError(
                {"advance_paid": _("Advance paid cannot exceed the total contracted price.")}
            )

        check_in = attrs.get("check_in")
        check_out = attrs.get("check_out")
        if check_in and check_out and check_in > check_out:
            raise serializers.ValidationError(
                {"check_out": _("Check-out date must occur on or after check-in date.")}
            )

        return attrs

    def create(self, validated_data):
        payment_method = validated_data.pop("payment_method", HotelPaymentMethod.CASH)
        reference_number = validated_data.pop("reference_number", "")
        request = self.context.get("request")
        user = request.user if request and hasattr(request, "user") else None

        validated_data["created_by"] = user

        with transaction.atomic():
            booking = HotelBooking.objects.create(**validated_data)

            # If an advance was deposited at booking time, immediately create the first ledger entry
            if booking.advance_paid > Decimal("0.00"):
                HotelPayment.objects.create(
                    hotel_booking=booking,
                    amount=booking.advance_paid,
                    payment_date=booking.booking_date,
                    payment_method=payment_method,
                    reference_number=reference_number,
                    notes=_("Initial advance payment recorded at booking creation"),
                    recorded_by=user,
                )

        return booking


class HotelBookingUpdateSerializer(serializers.ModelSerializer):
    """Allows administrators to update property information and contracted price with cost protection."""

    class Meta:
        model = HotelBooking
        fields = [
            "hotel_name",
            "location",
            "booking_date",
            "check_in",
            "check_out",
            "room_details",
            "total_price",
            "notes",
            "is_active",
        ]

    def validate(self, attrs):
        instance = self.instance
        new_total = attrs.get("total_price", instance.total_price if instance else Decimal("0.00"))

        if instance and new_total < instance.advance_paid:
            raise serializers.ValidationError(
                {
                    "total_price": _(
                        f"Cannot reduce total price to {new_total} because {instance.advance_paid} has already been paid."
                    )
                }
            )

        check_in = attrs.get("check_in", instance.check_in if instance else None)
        check_out = attrs.get("check_out", instance.check_out if instance else None)
        if check_in and check_out and check_in > check_out:
            raise serializers.ValidationError(
                {"check_out": _("Check-out date must occur on or after check-in date.")}
            )

        return attrs

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.recalculate_balances()
        instance.save()
        return instance


class AddRemainingPaymentSerializer(serializers.Serializer):
    """Dedicated serializer for recording an incremental installment (Add Remaining action)."""

    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal("0.01"))
    payment_date = serializers.DateField(default=timezone.now)
    payment_method = serializers.ChoiceField(choices=HotelPaymentMethod.choices, default=HotelPaymentMethod.CASH)
    reference_number = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")
    notes = serializers.CharField(required=False, allow_blank=True, default="")

    def validate_amount(self, value):
        booking = self.context.get("booking")
        if not booking:
            raise serializers.ValidationError(_("Booking reference is missing from context."))

        if value > booking.remaining_amount:
            raise serializers.ValidationError(
                _(
                    f"Installment amount ({value}) exceeds the current outstanding balance of {booking.remaining_amount}."
                )
            )
        return value

    def save(self, **kwargs):
        booking = self.context["booking"]
        request = self.context.get("request")
        user = request.user if request and hasattr(request, "user") else None

        validated_data = self.validated_data
        amount = validated_data["amount"]

        with transaction.atomic():
            payment = HotelPayment.objects.create(
                hotel_booking=booking,
                amount=amount,
                payment_date=validated_data.get("payment_date", timezone.now().date()),
                payment_method=validated_data.get("payment_method", HotelPaymentMethod.CASH),
                reference_number=validated_data.get("reference_number", ""),
                notes=validated_data.get("notes", ""),
                recorded_by=user,
            )

            booking.advance_paid += amount
            booking.recalculate_balances()
            booking.save()

        return payment
