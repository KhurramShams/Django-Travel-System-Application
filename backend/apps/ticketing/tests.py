"""Automated integration tests for AgencyTicket CRUD, safeguards, and permissions."""

from decimal import Decimal
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from apps.authentication.models import User, RoleChoices
from apps.ticketing.models import AgencyTicket, TicketRefund, TicketStatus, RefundMethod


class AgencyTicketCRUDTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create Admin user
        self.admin_user = User.objects.create_user(
            email="admin@karwan.test",
            password="adminpassword123",
            first_name="Admin",
            last_name="User",
            role=RoleChoices.ADMIN,
            supabase_uid="test-admin-uid-123",
        )

        # Create Agent user (non-admin)
        self.agent_user = User.objects.create_user(
            email="agent@karwan.test",
            password="agentpassword123",
            first_name="Agent",
            last_name="User",
            role=RoleChoices.AGENT,
            supabase_uid="test-agent-uid-456",
        )

        # Create sample ticket
        self.ticket = AgencyTicket.objects.create(
            agency_name="Falcon Aviation",
            airline_name="PIA",
            pnr_number="PK786A",
            total_tickets=10,
            issue_date="2026-10-04",
            total_price=Decimal("1000000.00"),
            status=TicketStatus.ISSUED,
            created_by=self.admin_user,
        )

    def test_agent_cannot_update_or_delete_ticket(self):
        """Agents must receive HTTP 403 Forbidden on update or delete."""
        self.client.force_authenticate(user=self.agent_user)
        url = reverse("ticketing:ticket-detail", kwargs={"pk": self.ticket.pk})

        # Attempt PATCH
        response = self.client.patch(url, {"airline_name": "Saudia"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Attempt DELETE
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_update_ticket_without_refunds(self):
        """Admin can update airline, agency, PNR, seats, and fare."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("ticketing:ticket-detail", kwargs={"pk": self.ticket.pk})

        response = self.client.patch(
            url,
            {
                "airline_name": "Saudia",
                "agency_name": "Gerry's International",
                "pnr_number": "sv999x",
                "total_tickets": 15,
                "total_price": "1500000.00",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.ticket.refresh_from_db()
        self.assertEqual(self.ticket.airline_name, "Saudia")
        self.assertEqual(self.ticket.agency_name, "Gerry's International")
        self.assertEqual(self.ticket.pnr_number, "SV999X")  # Uppercased
        self.assertEqual(self.ticket.total_tickets, 15)
        self.assertEqual(self.ticket.total_price, Decimal("1500000.00"))

    def test_update_safeguard_blocks_seats_or_price_below_refunded_totals(self):
        """Updating total_tickets or total_price below refunded limits must be rejected with 400."""
        self.client.force_authenticate(user=self.admin_user)

        # Process a refund of 3 seats (PKR 300,000)
        TicketRefund.objects.create(
            ticket=self.ticket,
            refund_seats_count=3,
            original_amount=Decimal("300000.00"),
            penalty_fee=Decimal("30000.00"),
            net_refund_amount=Decimal("270000.00"),
            refund_date="2026-10-04",
            refund_method=RefundMethod.CASH,
            processed_by=self.admin_user,
        )
        self.ticket.refresh_from_db()
        self.assertEqual(self.ticket.refunded_seats_count, 3)
        self.assertEqual(self.ticket.total_refunded_amount, Decimal("270000.00"))

        url = reverse("ticketing:ticket-detail", kwargs={"pk": self.ticket.pk})

        # Attempt to reduce total_tickets to 2 (less than 3 refunded seats)
        response = self.client.patch(url, {"total_tickets": 2}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        details = response.data.get("error", {}).get("details", response.data)
        self.assertIn("total_tickets", details)

        # Attempt to reduce total_price to PKR 250,000 (less than PKR 270,000 refunded amount)
        response = self.client.patch(url, {"total_price": "250000.00"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        details = response.data.get("error", {}).get("details", response.data)
        self.assertIn("total_price", details)

        # Updating seats to 5 (>= 3) and price to PKR 500,000 (>= PKR 300,000) succeeds
        response = self.client.patch(
            url,
            {"total_tickets": 5, "total_price": "500000.00"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_delete_safeguard_blocks_ticket_with_refunds(self):
        """Deleting ticket with active refund records must return HTTP 400 with meaningful error."""
        self.client.force_authenticate(user=self.admin_user)

        # Create a refund
        TicketRefund.objects.create(
            ticket=self.ticket,
            refund_seats_count=2,
            original_amount=Decimal("200000.00"),
            penalty_fee=Decimal("20000.00"),
            net_refund_amount=Decimal("180000.00"),
            refund_date="2026-10-04",
            refund_method=RefundMethod.CASH,
            processed_by=self.admin_user,
        )

        url = reverse("ticketing:ticket-detail", kwargs={"pk": self.ticket.pk})
        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn(
            "Cannot delete ticket with active refund records",
            str(response.data),
        )
        # Ticket still exists in database
        self.assertTrue(AgencyTicket.objects.filter(pk=self.ticket.pk).exists())

    def test_delete_succeeds_when_no_refunds_exist(self):
        """Admin can delete a ticket cleanly if no refund records exist."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("ticketing:ticket-detail", kwargs={"pk": self.ticket.pk})

        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(AgencyTicket.objects.filter(pk=self.ticket.pk).exists())
