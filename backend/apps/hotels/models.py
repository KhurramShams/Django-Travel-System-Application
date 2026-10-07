"""Domain models for Hotel Bookings, Accommodations, and Settlement Ledgers."""

import uuid
from decimal import Decimal
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from apps.common.models import BaseModel


class HotelLocation(models.TextChoices):
    MAKKAH = "MAKKAH", _("Makkah")
    MADINAH = "MADINAH", _("Madinah")
    OTHER = "OTHER", _("Other")


class HotelPaymentStatus(models.TextChoices):
    PAID = "PAID", _("Paid")
    PARTIAL = "PARTIAL", _("Partial")
    UNPAID = "UNPAID", _("Unpaid")


class HotelPaymentMethod(models.TextChoices):
    CASH = "CASH", _("Cash")
    BANK_TRANSFER = "BANK_TRANSFER", _("Bank Transfer")
    CHEQUE = "CHEQUE", _("Cheque")


class HotelBooking(BaseModel):
    """Hotel reservation tracking property specifications, costs, and incremental payments."""

    booking_reference = models.CharField(
        _("booking reference"),
        max_length=25,
        unique=True,
        db_index=True,
        help_text="Human-readable booking reference, e.g. KB-HTL-2026-0001",
    )
    hotel_name = models.CharField(
        _("hotel property name"),
        max_length=200,
        db_index=True,
        help_text="Name of hotel property (e.g. Pullman Zamzam, Swissotel, Dar Al Taqwa)",
    )
    location = models.CharField(
        _("city / location"),
        max_length=20,
        choices=HotelLocation.choices,
        default=HotelLocation.MAKKAH,
        db_index=True,
    )
    booking_date = models.DateField(
        _("booking date"),
        default=timezone.now,
        db_index=True,
    )
    check_in = models.DateField(
        _("check-in date"),
        null=True,
        blank=True,
    )
    check_out = models.DateField(
        _("check-out date"),
        null=True,
        blank=True,
    )
    room_details = models.CharField(
        _("room details / bedding"),
        max_length=255,
        blank=True,
        default="",
        help_text="Optional room configuration (e.g. 2 Quad Rooms, 1 Double Bed)",
    )
    total_price = models.DecimalField(
        _("total contracted price"),
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    advance_paid = models.DecimalField(
        _("advance / total paid"),
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    remaining_amount = models.DecimalField(
        _("outstanding remaining amount"),
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    payment_status = models.CharField(
        _("payment status"),
        max_length=15,
        choices=HotelPaymentStatus.choices,
        default=HotelPaymentStatus.UNPAID,
        db_index=True,
    )
    is_active = models.BooleanField(
        _("is active"),
        default=True,
        db_index=True,
        help_text="Soft-delete status flag",
    )
    notes = models.TextField(
        _("operational notes"),
        blank=True,
        default="",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="hotel_bookings",
        verbose_name=_("booked by"),
    )

    class Meta:
        ordering = ["-booking_date", "-created_at"]
        verbose_name = _("Hotel Booking")
        verbose_name_plural = _("Hotel Bookings")
        indexes = [
            models.Index(fields=["is_active", "payment_status"]),
            models.Index(fields=["location", "booking_date"]),
        ]

    def __str__(self):
        return f"{self.booking_reference} - {self.hotel_name} ({self.location})"

    def recalculate_balances(self):
        """Calculates live remaining balance and updates payment status."""
        self.remaining_amount = max(Decimal("0.00"), self.total_price - self.advance_paid)
        if self.advance_paid >= self.total_price:
            self.payment_status = HotelPaymentStatus.PAID
        elif self.advance_paid > Decimal("0.00"):
            self.payment_status = HotelPaymentStatus.PARTIAL
        else:
            self.payment_status = HotelPaymentStatus.UNPAID

    def clean(self):
        super().clean()
        if self.advance_paid > self.total_price:
            raise ValidationError(
                {"advance_paid": _("Advance paid cannot exceed the total contracted price.")}
            )
        if self.check_in and self.check_out and self.check_in > self.check_out:
            raise ValidationError(
                {"check_out": _("Check-out date must occur on or after check-in date.")}
            )

    def save(self, *args, **kwargs):
        if not self.booking_reference:
            year = timezone.now().year
            rand_suffix = uuid.uuid4().hex[:5].upper()
            self.booking_reference = f"KB-HTL-{year}-{rand_suffix}"
        self.recalculate_balances()
        self.full_clean()
        super().save(*args, **kwargs)


class HotelPayment(BaseModel):
    """Incremental settlement ledger for hotel reservations (Add Remaining logs)."""

    hotel_booking = models.ForeignKey(
        HotelBooking,
        on_delete=models.CASCADE,
        related_name="payments",
        verbose_name=_("hotel booking"),
    )
    amount = models.DecimalField(
        _("settlement amount"),
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    payment_date = models.DateField(
        _("payment date"),
        default=timezone.now,
        db_index=True,
    )
    payment_method = models.CharField(
        _("payment method"),
        max_length=20,
        choices=HotelPaymentMethod.choices,
        default=HotelPaymentMethod.CASH,
    )
    receipt_number = models.CharField(
        _("receipt voucher number"),
        max_length=30,
        unique=True,
        db_index=True,
    )
    reference_number = models.CharField(
        _("cheque / transaction reference"),
        max_length=100,
        blank=True,
        default="",
    )
    notes = models.TextField(
        _("ledger notes"),
        blank=True,
        default="",
    )
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="hotel_payments_recorded",
        verbose_name=_("recorded by"),
    )

    class Meta:
        ordering = ["-payment_date", "-created_at"]
        verbose_name = _("Hotel Payment")
        verbose_name_plural = _("Hotel Payments")

    def __str__(self):
        return f"{self.receipt_number} - {self.amount} for {self.hotel_booking.booking_reference}"

    def save(self, *args, **kwargs):
        if not self.receipt_number:
            year = timezone.now().year
            rand_suffix = uuid.uuid4().hex[:6].upper()
            self.receipt_number = f"HTL-RCT-{year}-{rand_suffix}"
        super().save(*args, **kwargs)
