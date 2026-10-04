"""Travel Package, Enrollment contract, and Traveler Payment models."""

from decimal import Decimal
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Sum
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from apps.common.models import BaseModel
from apps.travelers.models import AgeCategory


class LocationChoices(models.TextChoices):
    """Tour destination and pilgrimage jurisdiction."""

    MAKKAH = "MAKKAH", _("Makkah Mukarramah")
    MADINAH = "MADINAH", _("Madinah Munawwarah")
    MAKKAH_MADINAH = "MAKKAH_MADINAH", _("Combined Makkah & Madinah")


class StarRatingChoices(models.TextChoices):
    """Hotel accommodation classification tier."""

    THREE_STAR = "3_STAR", _("3 Star Economy")
    FOUR_STAR = "4_STAR", _("4 Star Standard")
    FIVE_STAR = "5_STAR", _("5 Star Luxury VIP")


class PackageStatus(models.TextChoices):
    """Operational lifecycle status of a travel package."""

    DRAFT = "DRAFT", _("Draft")
    ACTIVE = "ACTIVE", _("Active (Open for Booking)")
    COMPLETED = "COMPLETED", _("Completed (Tour Concluded)")
    ARCHIVED = "ARCHIVED", _("Archived")


class EnrollmentStatus(models.TextChoices):
    """Status of traveler's enrollment in a package."""

    ACTIVE = "ACTIVE", _("Active Participant")
    CANCELLED = "CANCELLED", _("Cancelled")
    COMPLETED = "COMPLETED", _("Tour Completed")


class PaymentMethod(models.TextChoices):
    """Settlement instruments accepted for traveler payments."""

    CASH = "CASH", _("Cash in Office")
    BANK_TRANSFER = "BANK_TRANSFER", _("Online Bank Transfer / Wire")
    CHEQUE = "CHEQUE", _("Bank Cheque / Pay Order")


class TravelPackage(BaseModel):
    """Catalog specification for Hajj, Umrah, or international tour packages."""

    title = models.CharField(
        _("package title"),
        max_length=255,
        db_index=True,
        help_text="e.g. 15-Day Executive Umrah Group Tour",
    )
    package_code = models.CharField(
        _("package code"),
        max_length=50,
        unique=True,
        db_index=True,
        help_text="Unique inventory tracking reference (e.g. PKG-2026-UMR-01)",
    )
    location = models.CharField(
        _("location / itinerary"),
        max_length=20,
        choices=LocationChoices.choices,
        default=LocationChoices.MAKKAH_MADINAH,
    )
    star_rating = models.CharField(
        _("hotel tier"),
        max_length=10,
        choices=StarRatingChoices.choices,
        default=StarRatingChoices.FOUR_STAR,
    )
    shuttle_service = models.BooleanField(
        _("shuttle transport included"),
        default=False,
        help_text="Dedicated shuttle between hotel and Haramain grounds",
    )
    flight_name = models.CharField(
        _("airline & flight code"),
        max_length=150,
        help_text="e.g. Saudia SV-738 (Lahore to Jeddah)",
    )
    departure_date = models.DateField(_("departure date"), db_index=True)
    return_date = models.DateField(_("return date"), db_index=True)

    # Base pricing per category
    adult_price = models.DecimalField(
        _("adult base price"),
        max_digits=12,
        decimal_places=2,
        help_text="Base price for travelers aged 12 and above",
    )
    child_price = models.DecimalField(
        _("child base price"),
        max_digits=12,
        decimal_places=2,
        help_text="Base price for children aged 2-11 with separate bed/seat",
    )
    infant_price = models.DecimalField(
        _("infant base price"),
        max_digits=12,
        decimal_places=2,
        help_text="Base fare for infants under 2 years",
    )

    capacity = models.PositiveIntegerField(
        _("total passenger quota"),
        default=50,
        help_text="Maximum quota of passenger seats for this package departure",
    )
    status = models.CharField(
        _("status"),
        max_length=15,
        choices=PackageStatus.choices,
        default=PackageStatus.ACTIVE,
        db_index=True,
    )
    description = models.TextField(
        _("itinerary & package details"),
        blank=True,
        default="",
    )

    class Meta:
        verbose_name = _("travel package")
        verbose_name_plural = _("travel packages")
        ordering = ["-departure_date", "-created_at"]
        indexes = [
            models.Index(fields=["status", "departure_date"]),
        ]

    def __str__(self):
        return f"{self.title} ({self.package_code})"

    def clean(self):
        super().clean()
        if self.departure_date and self.return_date and self.departure_date > self.return_date:
            raise ValidationError({"return_date": _("Return date must be on or after departure date.")})

    @property
    def duration_days(self) -> int:
        if self.departure_date and self.return_date:
            return (self.return_date - self.departure_date).days + 1
        return 0

    @property
    def total_enrolled(self) -> int:
        return self.enrollments.filter(status=EnrollmentStatus.ACTIVE).count()

    @property
    def seats_available(self) -> int:
        return max(0, self.capacity - self.total_enrolled)

    def get_price_for_age(self, age_category: str) -> Decimal:
        """Resolves base rate corresponding to traveler's age category."""
        if age_category == AgeCategory.INFANT:
            return self.infant_price
        elif age_category == AgeCategory.CHILD:
            return self.child_price
        return self.adult_price


class PackageEnrollment(BaseModel):
    """Binding contract assigning a traveler to an active travel package with customized pricing."""

    enrollment_number = models.CharField(
        _("enrollment number"),
        max_length=64,
        unique=True,
        db_index=True,
        help_text="System-generated dossier identifier (e.g. ENR-2026-0001)",
    )
    traveler = models.ForeignKey(
        "travelers.Traveler",
        on_delete=models.PROTECT,
        related_name="enrollments",
        help_text="Enrolled passenger or pilgrim",
    )
    package = models.ForeignKey(
        TravelPackage,
        on_delete=models.PROTECT,
        related_name="enrollments",
        help_text="Assigned travel package itinerary",
    )
    enrolled_date = models.DateField(
        _("enrollment date"),
        default=timezone.localdate,
        db_index=True,
    )
    base_price_applied = models.DecimalField(
        _("base package price applied"),
        max_digits=12,
        decimal_places=2,
        help_text="Snapshot of the age-tiered rate at the time of booking",
    )
    extra_amount = models.DecimalField(
        _("extra services amount"),
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="Supplemental charges (room upgrades, private transport, quad to double room, etc.)",
    )
    discount = models.DecimalField(
        _("authorized discount"),
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="Authorized price reduction",
    )
    final_agreed_price = models.DecimalField(
        _("final agreed total"),
        max_digits=12,
        decimal_places=2,
        help_text="Calculated total: (base_price_applied + extra_amount) - discount",
    )
    status = models.CharField(
        _("enrollment status"),
        max_length=15,
        choices=EnrollmentStatus.choices,
        default=EnrollmentStatus.ACTIVE,
        db_index=True,
    )
    special_requests = models.TextField(
        _("special client requests"),
        blank=True,
        default="",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_enrollments",
    )

    class Meta:
        verbose_name = _("package enrollment")
        verbose_name_plural = _("package enrollments")
        ordering = ["-enrolled_date", "-created_at"]
        constraints = [
            # Strict Business Constraint: A traveler can belong to only ONE active package at a time
            models.UniqueConstraint(
                fields=["traveler"],
                condition=models.Q(status=EnrollmentStatus.ACTIVE),
                name="unique_active_package_per_traveler",
            )
        ]

    def __str__(self):
        return f"{self.enrollment_number} - {self.traveler.full_name} -> {self.package.title}"

    def clean(self):
        super().clean()
        # Enforce price invariant
        expected_final = (self.base_price_applied + self.extra_amount) - self.discount
        if self.final_agreed_price != expected_final:
            self.final_agreed_price = expected_final

        # Enforce single active package in model clean
        if self.status == EnrollmentStatus.ACTIVE:
            existing = PackageEnrollment.objects.filter(
                traveler=self.traveler,
                status=EnrollmentStatus.ACTIVE,
            )
            if self.pk:
                existing = existing.exclude(pk=self.pk)
            if existing.exists():
                raise ValidationError(
                    _("This traveler is already enrolled in an ongoing active package (%(existing)s)."),
                    params={"existing": existing.first().package.title},
                )

    def save(self, *args, **kwargs):
        # Ensure enrolled_date is a date object
        if hasattr(self.enrolled_date, "date"):
            self.enrolled_date = self.enrolled_date.date()
        # Auto-compute final agreed price
        self.final_agreed_price = (self.base_price_applied + self.extra_amount) - self.discount
        super().save(*args, **kwargs)

    @property
    def total_paid(self) -> Decimal:
        """Total payments received against this enrollment."""
        total = self.payments.aggregate(total=Sum("amount"))["total"]
        return total if total is not None else Decimal("0.00")

    @property
    def remaining_balance(self) -> Decimal:
        """Outstanding financial balance payable by client."""
        return self.final_agreed_price - self.total_paid

    @property
    def payment_status(self) -> str:
        """Computed financial clearance status."""
        paid = self.total_paid
        remaining = self.remaining_balance
        if remaining <= Decimal("0.00"):
            return "PAID"
        elif paid > Decimal("0.00"):
            return "PARTIAL"
        return "UNPAID"


class TravelerPayment(BaseModel):
    """Auditable receipt entry recording a monetary payment against an enrollment."""

    receipt_number = models.CharField(
        _("receipt voucher number"),
        max_length=64,
        unique=True,
        db_index=True,
        help_text="Unique auto-generated receipt code (e.g. RCT-2026-0001)",
    )
    enrollment = models.ForeignKey(
        PackageEnrollment,
        on_delete=models.PROTECT,
        related_name="payments",
        help_text="Target traveler enrollment contract",
    )
    amount = models.DecimalField(
        _("amount received"),
        max_digits=12,
        decimal_places=2,
        help_text="Monetary value received in transaction",
    )
    payment_date = models.DateField(
        _("transaction date"),
        default=timezone.localdate,
        db_index=True,
    )
    payment_method = models.CharField(
        _("payment instrument"),
        max_length=20,
        choices=PaymentMethod.choices,
        default=PaymentMethod.CASH,
    )
    reference_number = models.CharField(
        _("instrument / bank transaction reference"),
        max_length=100,
        blank=True,
        null=True,
        help_text="Cheque number, bank deposit slip, or online IBFT reference",
    )
    notes = models.TextField(
        _("payment narration"),
        blank=True,
        default="",
    )
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="recorded_payments",
        help_text="Staff or accountant who accepted and confirmed the funds",
    )

    class Meta:
        verbose_name = _("traveler payment receipt")
        verbose_name_plural = _("traveler payment receipts")
        ordering = ["-payment_date", "-created_at"]
        indexes = [
            models.Index(fields=["payment_date", "payment_method"]),
        ]

    def __str__(self):
        return f"{self.receipt_number}: {self.amount} ({self.enrollment.traveler.full_name})"

    def clean(self):
        super().clean()
        if self.amount <= Decimal("0.00"):
            raise ValidationError({"amount": _("Payment amount must be greater than zero.")})

    def save(self, *args, **kwargs):
        if hasattr(self.payment_date, "date"):
            self.payment_date = self.payment_date.date()
        super().save(*args, **kwargs)
