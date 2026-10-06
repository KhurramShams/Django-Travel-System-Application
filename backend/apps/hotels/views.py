"""Views and ViewSets for Hotel Bookings, Accommodations, and Settlement Ledgers."""

from decimal import Decimal
from django.db.models import Count, Q, Sum
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.authentication.permissions import IsAdmin, IsAgent
from .models import HotelBooking, HotelLocation, HotelPayment, HotelPaymentStatus
from .serializers import (
    AddRemainingPaymentSerializer,
    HotelBookingCreateSerializer,
    HotelBookingDetailSerializer,
    HotelBookingListSerializer,
    HotelBookingUpdateSerializer,
    HotelPaymentSerializer,
)


class HotelBookingViewSet(viewsets.ModelViewSet):
    """Full CRUD and payment ledger management for hotel bookings."""

    queryset = HotelBooking.objects.all().select_related("created_by").prefetch_related("payments")

    def get_permissions(self):
        """Restricts mutating and deletion operations to Admin users."""
        if self.action in ["destroy", "update", "partial_update"]:
            permission_classes = [IsAdmin]
        else:
            permission_classes = [IsAgent]
        return [perm() for perm in permission_classes]

    def get_serializer_class(self):
        if self.action == "create":
            return HotelBookingCreateSerializer
        elif self.action in ["update", "partial_update"]:
            return HotelBookingUpdateSerializer
        elif self.action == "retrieve":
            return HotelBookingDetailSerializer
        elif self.action == "add_payment":
            return AddRemainingPaymentSerializer
        return HotelBookingListSerializer

    def get_queryset(self):
        qs = super().get_queryset()

        # Respect soft-delete unless explicitly queried with include_inactive=true
        include_inactive = self.request.query_params.get("include_inactive", "").lower() == "true"
        if not include_inactive:
            qs = qs.filter(is_active=True)

        # Filter by Location
        location = self.request.query_params.get("location")
        if location and location.upper() in HotelLocation.values:
            qs = qs.filter(location=location.upper())

        # Filter by Status (REMAINING or PAID for legacy screen alignment)
        status_filter = self.request.query_params.get("status")
        if status_filter:
            status_upper = status_filter.upper()
            if status_upper == "REMAINING":
                qs = qs.filter(remaining_amount__gt=Decimal("0.00"))
            elif status_upper == "PAID":
                qs = qs.filter(remaining_amount=Decimal("0.00"))
            elif status_upper in HotelPaymentStatus.values:
                qs = qs.filter(payment_status=status_upper)

        # Keyword Search
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(
                Q(booking_reference__icontains=search)
                | Q(hotel_name__icontains=search)
                | Q(room_details__icontains=search)
            )

        return qs

    def perform_destroy(self, instance):
        """Soft-deletes reservation by default; supports hard-delete via force=true parameter."""
        force = self.request.query_params.get("force", "").lower() == "true"
        if force:
            instance.delete()
        else:
            instance.is_active = False
            instance.save(update_fields=["is_active", "updated_at"])

    @action(detail=True, methods=["post"], url_path="add-payment", permission_classes=[IsAgent])
    def add_payment(self, request, pk=None):
        """Records an incremental installment settlement (Add Remaining) for the hotel."""
        booking = self.get_object()

        if booking.remaining_amount <= Decimal("0.00"):
            return Response(
                {"detail": "This hotel booking has already been fully paid."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = AddRemainingPaymentSerializer(data=request.data, context={"booking": booking, "request": request})
        serializer.is_valid(raise_exception=True)
        payment = serializer.save()

        # Refresh booking from database to get updated balance and payment status
        booking.refresh_from_db()
        detail_serializer = HotelBookingDetailSerializer(booking, context={"request": request})

        return Response(
            {
                "message": f"Settlement of PKR {payment.amount} successfully recorded under receipt {payment.receipt_number}.",
                "payment": HotelPaymentSerializer(payment).data,
                "booking": detail_serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=["get"], url_path="summary", permission_classes=[IsAgent])
    def summary(self, request):
        """Provides executive dashboard KPIs across all active hotel bookings."""
        active_bookings = HotelBooking.objects.filter(is_active=True)

        aggregates = active_bookings.aggregate(
            total_contracted=Sum("total_price"),
            total_advance_paid=Sum("advance_paid"),
            total_remaining=Sum("remaining_amount"),
            total_count=Count("id"),
            remaining_count=Count("id", filter=Q(remaining_amount__gt=Decimal("0.00"))),
            paid_count=Count("id", filter=Q(remaining_amount=Decimal("0.00"))),
        )

        return Response(
            {
                "total_contracted": aggregates["total_contracted"] or Decimal("0.00"),
                "total_advance_paid": aggregates["total_advance_paid"] or Decimal("0.00"),
                "total_remaining": aggregates["total_remaining"] or Decimal("0.00"),
                "total_count": aggregates["total_count"] or 0,
                "remaining_count": aggregates["remaining_count"] or 0,
                "paid_count": aggregates["paid_count"] or 0,
            }
        )
