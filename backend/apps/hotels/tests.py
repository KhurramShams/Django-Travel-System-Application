"""Automated integration tests for HotelBooking CRUD, incremental payments, safeguards, and RBAC."""

from decimal import Decimal
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from apps.authentication.models import User, RoleChoices
from apps.hotels.models import (
    HotelBooking,
    HotelLocation,
    HotelPayment,
    HotelPaymentMethod,
    HotelPaymentStatus,
)


class HotelBookingTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create Admin user
        self.admin_user = User.objects.create_user(
            email="admin@hotels.test",
            password="adminpassword123",
            first_name="Admin",
            last_name="User",
            role=RoleChoices.ADMIN,
            supabase_uid="hotel-admin-uid-123",
        )

        # Create Agent user
        self.agent_user = User.objects.create_user(
            email="agent@hotels.test",
            password="agentpassword123",
            first_name="Agent",
            last_name="User",
            role=RoleChoices.AGENT,
            supabase_uid="hotel-agent-uid-456",
        )

        # Create base test booking
        self.booking = HotelBooking.objects.create(
            hotel_name="Pullman Zamzam Makkah",
            location=HotelLocation.MAKKAH,
            booking_date="2026-10-05",
            check_in="2026-11-01",
            check_out="2026-11-10",
            room_details="1 Quad Room",
            total_price=Decimal("100000.00"),
            advance_paid=Decimal("40000.00"),
            created_by=self.admin_user,
        )

    def test_create_hotel_booking_with_advance_generates_payment_ledger(self):
        """Creating a booking with advance_paid > 0 must generate an atomic HotelPayment ledger record."""
        self.client.force_authenticate(user=self.agent_user)
        url = reverse("hotels:hotel-booking-list")
        payload = {
            "hotel_name": "Swissotel Al Maqam",
            "location": "MAKKAH",
            "booking_date": "2026-10-05",
            "check_in": "2026-12-01",
            "check_out": "2026-12-08",
            "room_details": "2 Double Rooms",
            "total_price": "200000.00",
            "advance_paid": "50000.00",
            "payment_method": "BANK_TRANSFER",
            "reference_number": "TRX-78601",
            "notes": "Advance via HBL",
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.data

        # Verify balance calculations
        self.assertEqual(Decimal(str(data["advance_paid"])), Decimal("50000.00"))
        self.assertEqual(Decimal(str(data["total_price"])), Decimal("200000.00"))

        booking_id = data["id"]
        booking = HotelBooking.objects.get(id=booking_id)
        self.assertEqual(booking.remaining_amount, Decimal("150000.00"))
        self.assertEqual(booking.payment_status, HotelPaymentStatus.PARTIAL)

        # Verify HotelPayment ledger entry
        payments = HotelPayment.objects.filter(hotel_booking=booking)
        self.assertEqual(payments.count(), 1)
        first_payment = payments.first()
        self.assertEqual(first_payment.amount, Decimal("50000.00"))
        self.assertEqual(first_payment.payment_method, HotelPaymentMethod.BANK_TRANSFER)
        self.assertTrue(first_payment.receipt_number.startswith("HTL-RCT-"))

    def test_create_booking_fails_when_advance_exceeds_total(self):
        """Validation safeguard: advance_paid cannot exceed total_price."""
        self.client.force_authenticate(user=self.agent_user)
        url = reverse("hotels:hotel-booking-list")
        payload = {
            "hotel_name": "Dar Al Taqwa Madinah",
            "location": "MADINAH",
            "booking_date": "2026-10-05",
            "total_price": "50000.00",
            "advance_paid": "60000.00",
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        details = response.data.get("error", {}).get("details", response.data)
        self.assertIn("advance_paid", details)

    def test_add_remaining_installment(self):
        """Add Remaining action updates balances and updates status to PAID when settled."""
        self.client.force_authenticate(user=self.agent_user)
        url = reverse("hotels:hotel-booking-add-payment", kwargs={"pk": self.booking.pk})

        # Add partial installment of 30,000 (Remaining was 60,000 -> now 30,000)
        response = self.client.post(
            url,
            {
                "amount": "30000.00",
                "payment_date": "2026-10-06",
                "payment_method": "CASH",
                "notes": "Second installment",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.advance_paid, Decimal("70000.00"))
        self.assertEqual(self.booking.remaining_amount, Decimal("30000.00"))
        self.assertEqual(self.booking.payment_status, HotelPaymentStatus.PARTIAL)

        # Add final installment of 30,000 -> now remaining 0.00 and status PAID
        response = self.client.post(
            url,
            {
                "amount": "30000.00",
                "payment_date": "2026-10-07",
                "payment_method": "CHEQUE",
                "reference_number": "CHQ-9912",
                "notes": "Final settlement cheque",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.advance_paid, Decimal("100000.00"))
        self.assertEqual(self.booking.remaining_amount, Decimal("0.00"))
        self.assertEqual(self.booking.payment_status, HotelPaymentStatus.PAID)

    def test_add_remaining_exceeds_remaining_balance_fails(self):
        """Installment amount cannot exceed remaining balance."""
        self.client.force_authenticate(user=self.agent_user)
        url = reverse("hotels:hotel-booking-add-payment", kwargs={"pk": self.booking.pk})

        # Remaining balance is 60,000; attempting 65,000 must fail
        response = self.client.post(
            url,
            {"amount": "65000.00", "payment_method": "CASH"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        details = response.data.get("error", {}).get("details", response.data)
        self.assertIn("amount", details)

    def test_update_total_price_lower_than_advance_blocked(self):
        """Admin cannot decrease total_price below already paid amount (40,000)."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("hotels:hotel-booking-detail", kwargs={"pk": self.booking.pk})

        # Attempt to reduce total_price from 100,000 to 35,000 (advance_paid is 40,000)
        response = self.client.patch(url, {"total_price": "35000.00"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        details = response.data.get("error", {}).get("details", response.data)
        self.assertIn("total_price", details)

    def test_rbac_agent_cannot_delete_admin_can_soft_delete(self):
        """Non-admin cannot delete; Admin performs soft-delete by default."""
        # Agent attempt
        self.client.force_authenticate(user=self.agent_user)
        url = reverse("hotels:hotel-booking-detail", kwargs={"pk": self.booking.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Admin attempt
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        self.booking.refresh_from_db()
        self.assertFalse(self.booking.is_active)
