"""API Views for Agency Tickets and Refunds."""

from decimal import Decimal
from django.db import models
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.authentication.permissions import IsAdmin, IsAgent, IsAccountant
from .models import AgencyTicket, TicketRefund, TicketStatus, RefundMethod
from .serializers import (
    AgencyTicketListSerializer,
    AgencyTicketCreateSerializer,
    AgencyTicketUpdateSerializer,
    AgencyTicketDetailSerializer,
    AgencyTicketLookupSerializer,
    TicketRefundListSerializer,
    TicketRefundCreateSerializer,
)


class AgencyTicketListCreateView(generics.ListCreateAPIView):
    """List purchased agency tickets or register a new agency ticket booking."""

    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return AgencyTicketCreateSerializer
        return AgencyTicketListSerializer

    def get_queryset(self):
        queryset = (
            AgencyTicket.objects.all()
            .select_related("created_by")
            .prefetch_related("refunds")
        )

        search = self.request.query_params.get("search")
        status_val = self.request.query_params.get("status")
        agency = self.request.query_params.get("agency")
        airline = self.request.query_params.get("airline")
        date_from = self.request.query_params.get("date_from")
        date_to = self.request.query_params.get("date_to")

        if search:
            search = search.strip()
            queryset = queryset.filter(
                models.Q(pnr_number__icontains=search)
                | models.Q(agency_name__icontains=search)
                | models.Q(airline_name__icontains=search)
                | models.Q(notes__icontains=search)
            )

        if status_val and status_val in TicketStatus.values:
            queryset = queryset.filter(status=status_val)

        if agency:
            queryset = queryset.filter(agency_name__icontains=agency.strip())

        if airline:
            queryset = queryset.filter(airline_name__icontains=airline.strip())

        if date_from:
            queryset = queryset.filter(issue_date__gte=date_from)

        if date_to:
            queryset = queryset.filter(issue_date__lte=date_to)

        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class AgencyTicketDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve full details, update metadata, or void an agency ticket."""

    lookup_field = "pk"

    def get_permissions(self):
        # Restrict update (PUT/PATCH) and delete (DELETE) exclusively to Admin users
        if self.request.method in ["PUT", "PATCH", "DELETE"]:
            return [IsAdmin()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.request.method in ["PUT", "PATCH"]:
            return AgencyTicketUpdateSerializer
        return AgencyTicketDetailSerializer

    def get_queryset(self):
        return (
            AgencyTicket.objects.all()
            .select_related("created_by")
            .prefetch_related("refunds__processed_by")
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        # Integrity Rule: If the ticket has associated refunds, block deletion and return HTTP 400
        if instance.refunds.exists():
            return Response(
                {
                    "detail": "Cannot delete ticket with active refund records. Remove or reverse refunds first.",
                    "error": "Cannot delete ticket with active refund records. Remove or reverse refunds first.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


class AgencyTicketLookupView(APIView):
    """Fast autocomplete/lookup by PNR or agency for refund modals."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        query = request.query_params.get("q", "").strip()
        if not query:
            return Response([])

        tickets = (
            AgencyTicket.objects.filter(
                models.Q(pnr_number__icontains=query)
                | models.Q(agency_name__icontains=query)
                | models.Q(airline_name__icontains=query)
            )
            .exclude(status__in=[TicketStatus.REFUNDED, TicketStatus.CANCELLED])
            .prefetch_related("refunds")[:15]
        )

        serializer = AgencyTicketLookupSerializer(tickets, many=True)
        return Response(serializer.data)


class TicketRefundListCreateView(generics.ListCreateAPIView):
    """List processed ticket refund records or process a new refund transaction."""

    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return TicketRefundCreateSerializer
        return TicketRefundListSerializer

    def get_queryset(self):
        queryset = (
            TicketRefund.objects.all()
            .select_related("ticket", "processed_by")
        )

        search = self.request.query_params.get("search")
        method = self.request.query_params.get("refund_method")
        ticket_id = self.request.query_params.get("ticket_id")
        date_from = self.request.query_params.get("date_from")
        date_to = self.request.query_params.get("date_to")

        if search:
            search = search.strip()
            queryset = queryset.filter(
                models.Q(ticket__pnr_number__icontains=search)
                | models.Q(ticket__agency_name__icontains=search)
                | models.Q(ticket__airline_name__icontains=search)
                | models.Q(reason__icontains=search)
            )

        if method and method in RefundMethod.values:
            queryset = queryset.filter(refund_method=method)

        if ticket_id:
            queryset = queryset.filter(ticket_id=ticket_id)

        if date_from:
            queryset = queryset.filter(refund_date__gte=date_from)

        if date_to:
            queryset = queryset.filter(refund_date__lte=date_to)

        return queryset

    def perform_create(self, serializer):
        serializer.save(processed_by=self.request.user)


class TicketRefundDetailView(generics.RetrieveAPIView):
    """Retrieve receipt details for a specific refund transaction."""

    permission_classes = [permissions.IsAuthenticated]
    queryset = TicketRefund.objects.all().select_related("ticket", "processed_by")
    serializer_class = TicketRefundListSerializer
    lookup_field = "pk"


class TicketingAnalyticsSummaryView(APIView):
    """Aggregate KPIs for ticket purchases and refund financial volume."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        tickets = AgencyTicket.objects.all()
        refunds = TicketRefund.objects.all()

        total_tickets_issued = tickets.aggregate(total=models.Sum("total_tickets"))["total"] or 0
        total_booking_volume = tickets.aggregate(total=models.Sum("total_price"))["total"] or Decimal("0.00")
        total_refunded_volume = refunds.aggregate(total=models.Sum("net_refund_amount"))["total"] or Decimal("0.00")
        total_penalties_deducted = refunds.aggregate(total=models.Sum("penalty_fee"))["total"] or Decimal("0.00")
        total_refunded_seats = refunds.aggregate(total=models.Sum("refund_seats_count"))["total"] or 0

        active_tickets_count = tickets.filter(status=TicketStatus.ISSUED).count()
        partially_refunded_count = tickets.filter(status=TicketStatus.PARTIALLY_REFUNDED).count()
        fully_refunded_count = tickets.filter(status=TicketStatus.REFUNDED).count()

        return Response(
            {
                "total_tickets_issued": total_tickets_issued,
                "total_booking_volume": total_booking_volume,
                "total_refunded_volume": total_refunded_volume,
                "total_penalties_deducted": total_penalties_deducted,
                "total_refunded_seats": total_refunded_seats,
                "active_tickets_count": active_tickets_count,
                "partially_refunded_count": partially_refunded_count,
                "fully_refunded_count": fully_refunded_count,
                "total_bookings_records": tickets.count(),
            }
        )
