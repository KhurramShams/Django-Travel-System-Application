"""Automated integration tests for Banking, Office Payments, Adjustments, and Expenses."""

from decimal import Decimal
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from apps.authentication.models import RoleChoices, User
from apps.finance.models import (
    BankAccount,
    ExpenseCategory,
    OfficeExpense,
    OfficePayment,
    OfficePaymentAdjustment,
    PaymentMode,
    TransactionType,
)


class FinanceModuleTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create Admin user
        self.admin_user = User.objects.create_user(
            email="admin@finance.test",
            password="adminpassword123",
            first_name="Admin",
            last_name="User",
            role=RoleChoices.ADMIN,
            supabase_uid="fin-admin-uid-123",
        )

        # Create Accountant user
        self.accountant_user = User.objects.create_user(
            email="accountant@finance.test",
            password="accountantpassword123",
            first_name="Accountant",
            last_name="User",
            role=RoleChoices.ACCOUNTANT,
            supabase_uid="fin-accountant-uid-456",
        )

        # Create Agent user (non-finance)
        self.agent_user = User.objects.create_user(
            email="agent@finance.test",
            password="agentpassword123",
            first_name="Agent",
            last_name="User",
            role=RoleChoices.AGENT,
            supabase_uid="fin-agent-uid-789",
        )

        # Create base test Bank Account
        self.bank = BankAccount.objects.create(
            bank_name="Meezan Bank",
            account_name="Khas Travels",
            account_number="PK12MEZN00012345678901",
            branch_code="0101",
            current_balance=Decimal("100000.00"),
            created_by=self.admin_user,
        )

    def test_create_office_payment_credit_increases_bank_balance(self):
        """Creating a CREDIT payment must atomically increase bank account balance."""
        self.client.force_authenticate(user=self.accountant_user)
        url = reverse("finance:office-payment-list")
        payload = {
            "person_name": "Haji Muhammad Aslam",
            "bank": str(self.bank.id),
            "transaction_type": "CREDIT",
            "payment_mode": "ONLINE_TRANSFER",
            "amount": "50000.00",
            "payment_date": "2026-10-06",
            "notes": "Pilgrim tour deposit",
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Check bank balance updated: 100,000 + 50,000 = 150,000
        self.bank.refresh_from_db()
        self.assertEqual(self.bank.current_balance, Decimal("150000.00"))

        payment_id = response.data["id"]
        payment = OfficePayment.objects.get(id=payment_id)
        self.assertEqual(payment.amount, Decimal("50000.00"))
        self.assertEqual(payment.bank_name_snapshot, "Meezan Bank")
        self.assertTrue(payment.payment_reference.startswith("KB-PAY-"))

    def test_create_office_payment_debit_decreases_bank_balance(self):
        """Creating a DEBIT payment must atomically decrease bank account balance."""
        self.client.force_authenticate(user=self.accountant_user)
        url = reverse("finance:office-payment-list")
        payload = {
            "person_name": "Saudi Visa Consolidator",
            "bank": str(self.bank.id),
            "transaction_type": "DEBIT",
            "payment_mode": "CHEQUE",
            "amount": "30000.00",
            "payment_date": "2026-10-06",
            "notes": "Visa processing fee payment",
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Check bank balance: 100,000 - 30,000 = 70,000
        self.bank.refresh_from_db()
        self.assertEqual(self.bank.current_balance, Decimal("70000.00"))

    def test_add_amount_increments_payment_and_updates_bank_balance(self):
        """Legacy Screen 12 Add Amount action must record audit adjustment and update bank balance."""
        payment = OfficePayment.objects.create(
            person_name="Al-Khair Services",
            bank=self.bank,
            transaction_type=TransactionType.CREDIT,
            payment_mode=PaymentMode.CASH,
            amount=Decimal("40000.00"),
            payment_date="2026-10-06",
            created_by=self.admin_user,
        )
        # Reflect initial deposit
        self.bank.current_balance += Decimal("40000.00")
        self.bank.save()
        self.assertEqual(self.bank.current_balance, Decimal("140000.00"))

        # Add Amount: +20,000
        self.client.force_authenticate(user=self.accountant_user)
        url = reverse("finance:office-payment-add-amount", kwargs={"pk": payment.pk})
        response = self.client.post(
            url,
            {"added_amount": "20000.00", "notes": "Additional client deposit"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        payment.refresh_from_db()
        self.assertEqual(payment.amount, Decimal("60000.00"))

        # Check adjustments ledger
        adjustments = OfficePaymentAdjustment.objects.filter(office_payment=payment)
        self.assertEqual(adjustments.count(), 1)
        self.assertEqual(adjustments.first().added_amount, Decimal("20000.00"))

        # Check bank balance: 140,000 + 20,000 = 160,000
        self.bank.refresh_from_db()
        self.assertEqual(self.bank.current_balance, Decimal("160000.00"))

    def test_delete_office_payment_reverses_bank_balance(self):
        """Deleting a transaction must reverse its balance effect on the bank account."""
        payment = OfficePayment.objects.create(
            person_name="PIA Ticket Distributor",
            bank=self.bank,
            transaction_type=TransactionType.CREDIT,
            payment_mode=PaymentMode.ONLINE_TRANSFER,
            amount=Decimal("25000.00"),
            payment_date="2026-10-06",
            created_by=self.admin_user,
        )
        self.bank.current_balance += Decimal("25000.00")
        self.bank.save()
        self.assertEqual(self.bank.current_balance, Decimal("125000.00"))

        # Delete transaction (Admin only)
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("finance:office-payment-detail", kwargs={"pk": payment.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # Bank balance reversed: 125,000 - 25,000 = 100,000
        self.bank.refresh_from_db()
        self.assertEqual(self.bank.current_balance, Decimal("100000.00"))

    def test_create_expense_and_daily_summary(self):
        """Screen 13: Logging expenses and querying daily summary must compute accurate aggregates."""
        self.client.force_authenticate(user=self.accountant_user)

        OfficeExpense.objects.create(
            person_name="Ali Khan (Office Admin)",
            item_name="K-Electric Office Bill",
            category=ExpenseCategory.UTILITIES,
            amount=Decimal("15000.00"),
            expense_date="2026-10-06",
            recorded_by=self.accountant_user,
        )
        OfficeExpense.objects.create(
            person_name="Ahmed Tea Vendor",
            item_name="Monthly Refreshment & Tea",
            category=ExpenseCategory.REFRESHMENTS,
            amount=Decimal("5000.00"),
            expense_date="2026-10-06",
            recorded_by=self.accountant_user,
        )

        # Fetch daily summary
        url = reverse("finance:office-expense-daily-summary") + "?date=2026-10-06"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Decimal(str(response.data["total_amount"])), Decimal("20000.00"))
        self.assertEqual(response.data["total_items"], 2)

    def test_rbac_agent_cannot_access_finance_endpoints(self):
        """Agents must be blocked (403 Forbidden) from accessing finance endpoints."""
        self.client.force_authenticate(user=self.agent_user)
        url = reverse("finance:bank-account-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
