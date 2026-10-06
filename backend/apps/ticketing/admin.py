"""Django Admin configuration for Agency Tickets and Refunds."""

from django.contrib import admin
from .models import AgencyTicket, TicketRefund


class TicketRefundInline(admin.TabularInline):
    model = TicketRefund
    extra = 0
    readonly_fields = ["id", "net_refund_amount", "created_at"]
    fields = [
        "refund_seats_count",
        "original_amount",
        "penalty_fee",
        "net_refund_amount",
        "refund_date",
        "refund_method",
        "processed_by",
    ]


@admin.register(AgencyTicket)
class AgencyTicketAdmin(admin.ModelAdmin):
    list_display = [
        "pnr_number",
        "airline_name",
        "agency_name",
        "total_tickets",
        "total_price",
        "issue_date",
        "status",
        "available_seats_to_refund",
        "total_refunded_amount",
        "created_by",
    ]
    list_filter = ["status", "airline_name", "agency_name", "issue_date"]
    search_fields = ["pnr_number", "agency_name", "airline_name", "notes"]
    readonly_fields = [
        "id",
        "refunded_seats_count",
        "available_seats_to_refund",
        "total_refunded_amount",
        "total_penalty_paid",
        "per_seat_cost",
        "created_at",
        "updated_at",
    ]
    inlines = [TicketRefundInline]


@admin.register(TicketRefund)
class TicketRefundAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "ticket",
        "refund_seats_count",
        "original_amount",
        "penalty_fee",
        "net_refund_amount",
        "refund_date",
        "refund_method",
        "processed_by",
    ]
    list_filter = ["refund_method", "refund_date"]
    search_fields = ["ticket__pnr_number", "ticket__agency_name", "reason"]
    readonly_fields = ["id", "net_refund_amount", "created_at", "updated_at"]
