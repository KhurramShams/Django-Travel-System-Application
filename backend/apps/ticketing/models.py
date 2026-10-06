"""Domain models for Agency Ticket Booking, Purchase Logs, and Refunds."""

from decimal import Decimal
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, RegexValidator
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from apps.common.models import BaseModel


class TicketStatus(models.TextChoices):
    ISSUED = "ISSUED", _("Issued")
    PARTIALLY_REFUNDED = "PARTIALLY_REFUNDED", _("Partially Refunded")
    REFUNDED = "REFUNDED", _("Refunded")
    CANCELLED = "CANCELLED", _("Cancelled")


class RefundMethod(models.TextChoices):
    CASH = "CASH", _("Cash")
    BANK_TRANSFER = "BANK_TRANSFER", _("Bank Transfer")
    CREDIT_ADJUSTMENT = "CREDIT_ADJUSTMENT", _("Agency Credit Adjustment")


pnr_validator = RegexValidator(
    regex=r"^[A-Z0-9]{5,12}$",
    message=_("PNR must be 5 to 12 uppercase alphanumeric characters."),
)


class AgencyTicket(BaseModel):
    """Wholesale flight ticket purchased or issued through consolidators or airlines."""

    agency_name = models.CharField(
        _("ticketing agency / consolidator"),
        max_length=200,
        db_index=True,
        help_text="Name of wholesale ticketing agency or distributor (e.g. Air Falcon, Gerry's)",
    )
    airline_name = models.CharField(
        _("airline name"),
        max_length=150,
        db_index=True,
        help_text="Operating airline carrier (e.g. PIA, Saudia, Emirates, Fly Jinnah)",
    )
    pnr_number = models.CharField(
        _("PNR booking code"),
        max_length=12,
        db_index=True,
        validators=[pnr_validator],
        help_text="Passenger Name Record alphanumeric identifier",
    )
    total_tickets = models.PositiveIntegerField(
        _("total passenger seats"),
        validators=[MinValueValidator(1)],
        help_text="Total number of seats issued under this PNR record",
    )
    issue_date = models.DateField(
        _("issue / purchase date"),
        default=timezone.localdate,
        db_index=True,
    )
    total_price = models.DecimalField(
        _("total purchase price"),
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
        help_text="Total wholesale invoice cost for all seats under this PNR",
    )
    status = models.CharField(
        _("ticket status"),
        max_length=25,
        choices=TicketStatus.choices,
        default=TicketStatus.ISSUED,
        db_index=True,
    )
    notes = models.TextField(
        _("routing / flight notes"),
        blank=True,
        default="",
        help_text="Sectors (e.g. KHI-JED-KHI), flight numbers, baggage allowance, or booking notes",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="issued_agency_tickets",
        help_text="Agent or user who booked this ticket",
    )

    class Meta:
        verbose_name = _("agency ticket")
        verbose_name_plural = _("agency tickets")
        ordering = ["-issue_date", "-created_at"]
        indexes = [
            models.Index(fields=["agency_name", "airline_name"]),
            models.Index(fields=["pnr_number", "status"]),
        ]

    def __str__(self):
        return f"{self.pnr_number} ({self.airline_name} - {self.total_tickets} seats)"

    def clean(self):
        super().clean()
        if self.pnr_number:
            self.pnr_number = self.pnr_number.strip().upper()

    def save(self, *args, **kwargs):
        if self.pnr_number:
            self.pnr_number = self.pnr_number.strip().upper()
        if hasattr(self.issue_date, "date"):
            self.issue_date = self.issue_date.date()
        super().save(*args, **kwargs)

    @property
    def refunded_seats_count(self) -> int:
        """Total number of passenger seats refunded under this ticket."""
        res = self.refunds.aggregate(total=models.Sum("refund_seats_count"))["total"]
        return res or 0

    @property
    def available_seats_to_refund(self) -> int:
        """Remaining active passenger seats eligible for refund."""
        return max(0, self.total_tickets - self.refunded_seats_count)

    @property
    def total_refunded_amount(self) -> Decimal:
        """Net total refunded capital returned or credited."""
        res = self.refunds.aggregate(total=models.Sum("net_refund_amount"))["total"]
        return res or Decimal("0.00")

    @property
    def total_penalty_paid(self) -> Decimal:
        """Total airline deduction fees incurred on refunds."""
        res = self.refunds.aggregate(total=models.Sum("penalty_fee"))["total"]
        return res or Decimal("0.00")

    @property
    def per_seat_cost(self) -> Decimal:
        """Average gross cost per passenger seat."""
        if self.total_tickets > 0:
            return (self.total_price / Decimal(self.total_tickets)).quantize(Decimal("0.01"))
        return Decimal("0.00")

    def sync_refund_status(self):
        """Recalculates and updates ticket status according to cumulative refunds."""
        refunded_seats = self.refunded_seats_count
        if refunded_seats >= self.total_tickets:
            new_status = TicketStatus.REFUNDED
        elif refunded_seats > 0:
            new_status = TicketStatus.PARTIALLY_REFUNDED
        else:
            new_status = TicketStatus.ISSUED

        if self.status != new_status and self.status != TicketStatus.CANCELLED:
            self.status = new_status
            self.save(update_fields=["status", "updated_at"])


class TicketRefund(BaseModel):
    """Record of partial or full refund on an issued agency ticket."""

    ticket = models.ForeignKey(
        AgencyTicket,
        on_delete=models.PROTECT,
        related_name="refunds",
        help_text="Agency ticket booking being refunded",
    )
    refund_seats_count = models.PositiveIntegerField(
        _("seats refunded"),
        validators=[MinValueValidator(1)],
        help_text="Number of seats cancelled in this refund transaction",
    )
    original_amount = models.DecimalField(
        _("gross amount"),
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
        help_text="Gross fare snapshot for the seats being refunded",
    )
    penalty_fee = models.DecimalField(
        _("airline penalty / deduction fine"),
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
        help_text="Airline or agency cancellation penalty",
    )
    net_refund_amount = models.DecimalField(
        _("net refund issued"),
        max_digits=12,
        decimal_places=2,
        help_text="Net amount refunded: original_amount - penalty_fee",
    )
    refund_date = models.DateField(
        _("refund date"),
        default=timezone.localdate,
        db_index=True,
    )
    refund_method = models.CharField(
        _("refund payment method"),
        max_length=25,
        choices=RefundMethod.choices,
        default=RefundMethod.CASH,
    )
    reason = models.TextField(
        _("refund reason"),
        blank=True,
        default="",
        help_text="Client cancellation, flight schedule cancellation, visa issue, etc.",
    )
    processed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="processed_ticket_refunds",
        help_text="Staff or accountant who processed this refund",
    )

    class Meta:
        verbose_name = _("ticket refund")
        verbose_name_plural = _("ticket refunds")
        ordering = ["-refund_date", "-created_at"]
        constraints = [
            models.CheckConstraint(
                check=models.Q(net_refund_amount__lte=models.F("original_amount")),
                name="net_refund_lte_original",
            ),
            models.CheckConstraint(
                check=models.Q(penalty_fee__gte=Decimal("0.00")),
                name="penalty_fee_non_negative",
            ),
        ]

    def __str__(self):
        return f"Refund {self.ticket.pnr_number}: PKR {self.net_refund_amount} ({self.refund_seats_count} seats)"

    def clean(self):
        super().clean()
        if self.penalty_fee > self.original_amount:
            raise ValidationError(
                {"penalty_fee": _("Penalty fee cannot exceed the original gross amount.")}
            )

        expected_net = self.original_amount - self.penalty_fee
        if self.net_refund_amount != expected_net:
            self.net_refund_amount = expected_net

        # Check seats limit
        if self.ticket_id:
            available = self.ticket.available_seats_to_refund
            # If editing existing instance, add back current instance seats
            if self.pk:
                current = TicketRefund.objects.filter(pk=self.pk).values_list("refund_seats_count", flat=True).first()
                if current:
                    available += current
            if self.refund_seats_count > available:
                raise ValidationError(
                    {
                        "refund_seats_count": _(
                            f"Cannot refund {self.refund_seats_count} seats. Only {available} active seats available."
                        )
                    }
                )

    def save(self, *args, **kwargs):
        if hasattr(self.refund_date, "date"):
            self.refund_date = self.refund_date.date()
        self.net_refund_amount = self.original_amount - self.penalty_fee
        super().save(*args, **kwargs)
        # Sync parent ticket status
        self.ticket.sync_refund_status()
