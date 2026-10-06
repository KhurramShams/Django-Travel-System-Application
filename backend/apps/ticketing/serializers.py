"""Serializers for Agency Tickets and Ticket Refunds."""

from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers
from .models import AgencyTicket, TicketRefund, TicketStatus, RefundMethod


class TicketRefundListSerializer(serializers.ModelSerializer):
    """Listing view of ticket refunds for the audit ledger."""

    ticket_id = serializers.UUIDField(source="ticket.id", read_only=True)
    ticket_pnr = serializers.CharField(source="ticket.pnr_number", read_only=True)
    agency_name = serializers.CharField(source="ticket.agency_name", read_only=True)
    airline_name = serializers.CharField(source="ticket.airline_name", read_only=True)
    processed_by_name = serializers.CharField(source="processed_by.full_name", read_only=True, default=None)

    class Meta:
        model = TicketRefund
        fields = [
            "id",
            "ticket_id",
            "ticket_pnr",
            "agency_name",
            "airline_name",
            "refund_seats_count",
            "original_amount",
            "penalty_fee",
            "net_refund_amount",
            "refund_date",
            "refund_method",
            "reason",
            "processed_by_name",
            "created_at",
        ]


class AgencyTicketListSerializer(serializers.ModelSerializer):
    """Listing representation of agency tickets with dynamic refund totals."""

    created_by_name = serializers.CharField(source="created_by.full_name", read_only=True, default=None)
    refunded_seats_count = serializers.IntegerField(read_only=True)
    available_seats_to_refund = serializers.IntegerField(read_only=True)
    total_refunded_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    per_seat_cost = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = AgencyTicket
        fields = [
            "id",
            "agency_name",
            "airline_name",
            "pnr_number",
            "total_tickets",
            "issue_date",
            "total_price",
            "status",
            "notes",
            "refunded_seats_count",
            "available_seats_to_refund",
            "total_refunded_amount",
            "per_seat_cost",
            "created_by_name",
            "created_at",
        ]


class AgencyTicketCreateSerializer(serializers.ModelSerializer):
    """Serializer for purchasing / issuing a new agency ticket."""

    per_seat_cost = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = AgencyTicket
        fields = [
            "id",
            "agency_name",
            "airline_name",
            "pnr_number",
            "total_tickets",
            "issue_date",
            "total_price",
            "status",
            "notes",
            "per_seat_cost",
        ]
        read_only_fields = ["id", "status", "per_seat_cost"]

    def to_internal_value(self, data):
        if isinstance(data, dict) or hasattr(data, "get"):
            data = data.copy()
            if "pnr_number" in data and isinstance(data["pnr_number"], str):
                data["pnr_number"] = data["pnr_number"].strip().upper()
        return super().to_internal_value(data)

    def validate_pnr_number(self, value):
        cleaned = value.strip().upper()
        if len(cleaned) < 5 or len(cleaned) > 12:
            raise serializers.ValidationError("PNR code must be 5 to 12 alphanumeric characters.")
        return cleaned

    def validate_total_tickets(self, value):
        if value < 1:
            raise serializers.ValidationError("Total tickets count must be at least 1.")
        return value

    def validate_total_price(self, value):
        if value <= Decimal("0.00"):
            raise serializers.ValidationError("Total price must be greater than zero.")
        return value

    def create(self, validated_data):
        request = self.context.get("request")
        if request and hasattr(request, "user") and request.user.is_authenticated:
            validated_data["created_by"] = request.user
        validated_data["pnr_number"] = validated_data["pnr_number"].strip().upper()
        return super().create(validated_data)


class AgencyTicketUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating an existing agency ticket with refund bounds checking."""

    per_seat_cost = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = AgencyTicket
        fields = [
            "id",
            "agency_name",
            "airline_name",
            "pnr_number",
            "total_tickets",
            "issue_date",
            "total_price",
            "status",
            "notes",
            "per_seat_cost",
        ]
        read_only_fields = ["id", "status", "per_seat_cost"]

    def to_internal_value(self, data):
        if isinstance(data, dict) or hasattr(data, "get"):
            data = data.copy()
            if "pnr_number" in data and isinstance(data["pnr_number"], str):
                data["pnr_number"] = data["pnr_number"].strip().upper()
        return super().to_internal_value(data)

    def validate_pnr_number(self, value):
        cleaned = value.strip().upper()
        if len(cleaned) < 5 or len(cleaned) > 12:
            raise serializers.ValidationError("PNR code must be 5 to 12 alphanumeric characters.")
        return cleaned

    def validate_total_tickets(self, value):
        if value < 1:
            raise serializers.ValidationError("Total tickets count must be at least 1.")
        return value

    def validate_total_price(self, value):
        if Decimal(str(value)) <= Decimal("0.00"):
            raise serializers.ValidationError("Total price must be greater than zero.")
        return value

    def validate(self, attrs):
        instance = getattr(self, "instance", None)
        if instance:
            refunded_seats = instance.refunded_seats_count
            total_refunded_amount = instance.total_refunded_amount
            new_tickets = attrs.get("total_tickets", instance.total_tickets)
            new_price = attrs.get("total_price", instance.total_price)

            if new_tickets < refunded_seats:
                raise serializers.ValidationError({
                    "total_tickets": f"Cannot reduce total tickets to {new_tickets}. Already refunded seats: {refunded_seats}."
                })

            if Decimal(str(new_price)) < Decimal(str(total_refunded_amount)):
                raise serializers.ValidationError({
                    "total_price": f"Cannot reduce total price to {new_price}. Already refunded amount: {total_refunded_amount}."
                })

        return attrs

    def update(self, instance, validated_data):
        if "pnr_number" in validated_data:
            validated_data["pnr_number"] = validated_data["pnr_number"].strip().upper()
        instance = super().update(instance, validated_data)

        # Synchronize status based on updated total_tickets and existing refunds
        refunded_seats = instance.refunded_seats_count
        if refunded_seats == 0:
            if instance.status in [TicketStatus.PARTIALLY_REFUNDED, TicketStatus.REFUNDED]:
                instance.status = TicketStatus.ISSUED
                instance.save(update_fields=["status", "updated_at"])
        elif refunded_seats >= instance.total_tickets:
            if instance.status != TicketStatus.REFUNDED:
                instance.status = TicketStatus.REFUNDED
                instance.save(update_fields=["status", "updated_at"])
        else:
            if instance.status != TicketStatus.PARTIALLY_REFUNDED:
                instance.status = TicketStatus.PARTIALLY_REFUNDED
                instance.save(update_fields=["status", "updated_at"])

        return instance


class AgencyTicketDetailSerializer(serializers.ModelSerializer):
    """Full detail view of an agency ticket including all refund transaction history."""

    created_by_name = serializers.CharField(source="created_by.full_name", read_only=True, default=None)
    refunded_seats_count = serializers.IntegerField(read_only=True)
    available_seats_to_refund = serializers.IntegerField(read_only=True)
    total_refunded_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total_penalty_paid = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    per_seat_cost = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    refunds = TicketRefundListSerializer(many=True, read_only=True)

    class Meta:
        model = AgencyTicket
        fields = [
            "id",
            "agency_name",
            "airline_name",
            "pnr_number",
            "total_tickets",
            "issue_date",
            "total_price",
            "status",
            "notes",
            "refunded_seats_count",
            "available_seats_to_refund",
            "total_refunded_amount",
            "total_penalty_paid",
            "per_seat_cost",
            "created_by_name",
            "refunds",
            "created_at",
            "updated_at",
        ]


class AgencyTicketLookupSerializer(serializers.ModelSerializer):
    """Quick lookup serializer for PNR search in refund processing modals."""

    available_seats_to_refund = serializers.IntegerField(read_only=True)
    per_seat_cost = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = AgencyTicket
        fields = [
            "id",
            "pnr_number",
            "agency_name",
            "airline_name",
            "total_tickets",
            "total_price",
            "status",
            "available_seats_to_refund",
            "per_seat_cost",
            "issue_date",
        ]


class TicketRefundCreateSerializer(serializers.ModelSerializer):
    """Handles ticket refund processing with strict quota and calculation enforcement."""

    original_amount = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    net_refund_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = TicketRefund
        fields = [
            "id",
            "ticket",
            "refund_seats_count",
            "original_amount",
            "penalty_fee",
            "net_refund_amount",
            "refund_date",
            "refund_method",
            "reason",
        ]
        read_only_fields = ["id", "net_refund_amount"]

    def validate(self, attrs):
        ticket = attrs.get("ticket")
        seats = attrs.get("refund_seats_count", 1)
        penalty = attrs.get("penalty_fee", Decimal("0.00"))

        if not ticket:
            raise serializers.ValidationError({"ticket": "Ticket reference is required."})

        # Ensure ticket is eligible for refund
        if ticket.status in [TicketStatus.REFUNDED, TicketStatus.CANCELLED]:
            raise serializers.ValidationError(
                {"ticket": f"Ticket '{ticket.pnr_number}' is marked as {ticket.status} and cannot be refunded."}
            )

        # Enforce quota check
        available = ticket.available_seats_to_refund
        if seats > available:
            raise serializers.ValidationError(
                {
                    "refund_seats_count": (
                        f"Cannot refund {seats} seats. Only {available} active seats remaining for PNR '{ticket.pnr_number}'."
                    )
                }
            )

        # Auto-compute original gross fare if omitted
        if "original_amount" not in attrs or attrs["original_amount"] is None:
            attrs["original_amount"] = (ticket.per_seat_cost * Decimal(seats)).quantize(Decimal("0.01"))

        original = attrs["original_amount"]

        if penalty < Decimal("0.00"):
            raise serializers.ValidationError({"penalty_fee": "Penalty deduction fee cannot be negative."})

        if penalty > original:
            raise serializers.ValidationError(
                {
                    "penalty_fee": (
                        f"Penalty fee (PKR {penalty}) cannot exceed the gross refund amount (PKR {original})."
                    )
                }
            )

        # Enforce net refund amount calculation
        attrs["net_refund_amount"] = (original - penalty).quantize(Decimal("0.01"))
        return attrs

    def create(self, validated_data):
        request = self.context.get("request")
        if request and hasattr(request, "user") and request.user.is_authenticated:
            validated_data["processed_by"] = request.user

        if "refund_date" not in validated_data or not validated_data["refund_date"]:
            validated_data["refund_date"] = timezone.localdate()

        with transaction.atomic():
            refund = super().create(validated_data)
            refund.ticket.sync_refund_status()
            return refund
