"""Traveler and dependent relationship models."""

from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator
from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.common.models import BaseModel

cnic_validator = RegexValidator(
    regex=r"^\d{5}-\d{7}-\d{1}$",
    message=_("CNIC / B-Form must follow the standard 13-digit format: XXXXX-XXXXXXX-X"),
)


class AgeCategory(models.TextChoices):
    """Traveler age tiers determining base package price and visa policies."""

    ADULT = "ADULT", _("Adult (Age 12+)")
    CHILD = "CHILD", _("Child (Age 2-11)")
    INFANT = "INFANT", _("Infant (Under 2)")


class Traveler(BaseModel):
    """Client entity representing a pilgrim or tour passenger."""

    full_name = models.CharField(
        _("full name"),
        max_length=200,
        db_index=True,
        help_text="Official name as printed on passport or government ID",
    )
    cnic = models.CharField(
        _("CNIC / B-Form number"),
        max_length=15,
        unique=True,
        db_index=True,
        validators=[cnic_validator],
        help_text="Pakistani CNIC or juvenile B-Form number (e.g. 35202-1234567-1)",
    )
    phone_number = models.CharField(
        _("phone / WhatsApp number"),
        max_length=32,
        db_index=True,
        help_text="Primary contact number",
    )
    passport_number = models.CharField(
        _("passport number"),
        max_length=30,
        unique=True,
        blank=True,
        null=True,
        db_index=True,
        help_text="International travel passport identifier (optional at pre-registration)",
    )
    age_category = models.CharField(
        _("age category"),
        max_length=10,
        choices=AgeCategory.choices,
        default=AgeCategory.ADULT,
        db_index=True,
    )
    guardian = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="dependents",
        help_text="Designated primary guardian or head of family unit",
    )
    address = models.TextField(
        _("residential address"),
        blank=True,
        default="",
    )
    emergency_contact = models.CharField(
        _("emergency contact"),
        max_length=100,
        blank=True,
        default="",
        help_text="Name and phone of emergency family contact in Pakistan",
    )
    notes = models.TextField(
        _("operational notes"),
        blank=True,
        default="",
        help_text="Medical requirements, mobility assistance, wheelchair, dietary preferences",
    )

    class Meta:
        verbose_name = _("traveler")
        verbose_name_plural = _("travelers")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["cnic", "full_name"]),
            models.Index(fields=["age_category", "created_at"]),
        ]

    def __str__(self):
        return f"{self.full_name} ({self.cnic})"

    def clean(self):
        super().clean()
        if self.guardian_id and self.guardian_id == self.id:
            raise ValidationError({"guardian": _("A traveler cannot be assigned as their own guardian.")})

    @property
    def has_active_package(self) -> bool:
        """Determines whether traveler is currently booked into an ongoing package."""
        return self.enrollments.filter(status="ACTIVE").exists()

    @property
    def current_active_enrollment(self):
        """Returns the current active enrollment instance if present."""
        return self.enrollments.filter(status="ACTIVE").select_related("package").first()
