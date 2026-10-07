"""Integration tests for Dashboard Analytics and Central Transaction Ledger."""

from decimal import Decimal
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from apps.authentication.models import User
from apps.travelers.models import Traveler, AgeCategory
from apps.packages.models import (
    TravelPackage,
    PackageEnrollment,
    TravelerPayment,
    EnrollmentStatus,
    LocationChoices,
    StarRatingChoices,
)
from apps.finance.models import (
    BankAccount,
    OfficePayment,
    OfficeExpense,
    TransactionType,
    ExpenseCategory,
)


class DashboardAnalyticsTestCase(TestCase):
    """Verifies all dashboard metrics and consolidated transaction endpoints."""

    def setUp(self):
        self.user = User.objects.create_user(
            email="manager@karwan.com",
            supabase_uid="sub-uid-dashboard-manager-1",
            first_name="Operations",
            last_name="Manager",
            role="Admin",
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        # 1. Create Traveler
        self.traveler = Traveler.objects.create(
            full_name="Haji Abdul Ghafoor",
            cnic="35202-9988771-1",
            phone_number="+923001234567",
            passport_number="PK1122334",
            age_category=AgeCategory.ADULT,
        )

        # 2. Create Tour Package
        self.package = TravelPackage.objects.create(
            title="15-Day Economy Umrah Group",
            package_code="PKG-2026-TEST-01",
            location=LocationChoices.MAKKAH_MADINAH,
            star_rating=StarRatingChoices.FOUR_STAR,
            flight_name="Saudia Airlines",
            departure_date=timezone.localdate() + timezone.timedelta(days=10),
            return_date=timezone.localdate() + timezone.timedelta(days=25),
            adult_price=Decimal("250000.00"),
            child_price=Decimal("200000.00"),
            infant_price=Decimal("80000.00"),
            capacity=40,
        )

        # 3. Create Package Enrollment
        self.enrollment = PackageEnrollment.objects.create(
            enrollment_number="ENR-2026-TEST-01",
            traveler=self.traveler,
            package=self.package,
            base_price_applied=Decimal("250000.00"),
            extra_amount=Decimal("10000.00"),
            discount=Decimal("5000.00"),
            status=EnrollmentStatus.ACTIVE,
        )

        # 4. Create Traveler Payment (Credit 100,000)
        self.payment = TravelerPayment.objects.create(
            receipt_number="RCT-2026-TEST-01",
            enrollment=self.enrollment,
            amount=Decimal("100000.00"),
            payment_date=timezone.localdate(),
            reference_number="CHQ-991122",
            recorded_by=self.user,
        )

        # 5. Create Bank Account
        self.bank = BankAccount.objects.create(
            bank_name="Meezan Bank Ltd",
            account_name="Karwan Enterprise Operating",
            account_number="01019988776655",
            current_balance=Decimal("500000.00"),
            created_by=self.user,
        )

        # 6. Create Office Payment (Debit 25,000)
        self.office_payment = OfficePayment.objects.create(
            payment_reference="KB-PAY-2026-TEST-01",
            person_name="Visa Processing Facilitator",
            bank=self.bank,
            transaction_type=TransactionType.DEBIT,
            payment_mode="ONLINE_TRANSFER",
            amount=Decimal("25000.00"),
            payment_date=timezone.localdate(),
            notes="Visa processing fee",
            created_by=self.user,
        )

        # 7. Create Office Expense (Debit 3,500)
        self.office_expense = OfficeExpense.objects.create(
            expense_reference="EXP-2026-TEST-01",
            person_name="Office Staff",
            item_name="Office Tea and Refreshments",
            category=ExpenseCategory.REFRESHMENTS,
            amount=Decimal("3500.00"),
            expense_date=timezone.localdate(),
            payment_mode="CASH",
            recorded_by=self.user,
        )

    def test_dashboard_metrics_endpoint(self):
        """Verifies high-level KPIs aggregation."""
        res = self.client.get("/api/v1/dashboard/metrics/")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        metrics = data["metrics"]

        # Travelers count
        self.assertEqual(metrics["total_customers"], 1)

        # Received amount: 100,000 (TravelerPayment)
        self.assertEqual(Decimal(metrics["received_amount"]), Decimal("100000.00"))

        # Remaining receivables: (250000 + 10000 - 5000) - 100000 = 155000
        self.assertEqual(Decimal(metrics["remaining_amount"]), Decimal("155000.00"))

        # Today's expense: 3,500
        self.assertEqual(Decimal(metrics["today_expense"]), Decimal("3500.00"))

        # Secondary
        self.assertEqual(Decimal(metrics["secondary"]["bank_liquidity"]), Decimal("500000.00"))
        self.assertEqual(metrics["secondary"]["active_packages"], 1)

    def test_dashboard_metrics_date_filtering(self):
        """Verifies dashboard metrics filtered by date range."""
        today = timezone.localdate()
        today_str = today.isoformat()
        yesterday_str = (today - timezone.timedelta(days=1)).isoformat()
        tomorrow_str = (today + timezone.timedelta(days=1)).isoformat()

        # Query for today's window: should include today's records
        res_today = self.client.get(f"/api/v1/dashboard/metrics/?start_date={today_str}&end_date={today_str}")
        self.assertEqual(res_today.status_code, 200)
        data_today = res_today.json()["metrics"]
        self.assertEqual(Decimal(data_today["received_amount"]), Decimal("100000.00"))
        self.assertEqual(Decimal(data_today["today_expense"]), Decimal("3500.00"))

        # Query for past window (yesterday only): should have 0 received and 0 expense
        res_past = self.client.get(f"/api/v1/dashboard/metrics/?start_date={yesterday_str}&end_date={yesterday_str}")
        self.assertEqual(res_past.status_code, 200)
        data_past = res_past.json()["metrics"]
        self.assertEqual(Decimal(data_past["received_amount"]), Decimal("0.00"))
        self.assertEqual(Decimal(data_past["today_expense"]), Decimal("0.00"))

    def test_monthly_cashflow_endpoint(self):
        """Verifies monthly cashflow calculation."""
        res = self.client.get("/api/v1/dashboard/charts/monthly-cashflow/?months=6")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertEqual(len(data["data"]), 6)

        # Current month should reflect our inflows and outflows
        current_month_data = data["data"][-1]
        self.assertGreaterEqual(current_month_data["inflow"], 100000.00)
        self.assertGreaterEqual(current_month_data["outflow"], 28500.00)  # 25000 + 3500

    def test_package_occupancy_endpoint(self):
        """Verifies package enrollment capacity metrics."""
        res = self.client.get("/api/v1/dashboard/charts/package-distribution/")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertEqual(len(data["data"]), 1)
        self.assertEqual(data["data"][0]["enrolled"], 1)
        self.assertEqual(data["data"][0]["capacity"], 40)

    def test_receivables_breakdown_endpoint(self):
        """Verifies Paid / Partial / Unpaid classification."""
        res = self.client.get("/api/v1/dashboard/charts/receivables-breakdown/")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        # With 100k paid out of 255k, enrollment is PARTIAL
        self.assertEqual(data["data"]["partial"]["count"], 1)
        self.assertEqual(Decimal(data["data"]["partial"]["amount"]), Decimal("155000.00"))

    def test_central_transactions_ledger(self):
        """Verifies multi-stream transaction consolidation."""
        res = self.client.get("/api/v1/transactions/")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertIn("results", data)
        self.assertIn("pagination", data)
        self.assertIn("summary", data)

        # 3 transactions created: TravelerPayment (CREDIT), OfficePayment (DEBIT), OfficeExpense (DEBIT)
        self.assertGreaterEqual(data["pagination"]["count"], 3)
        self.assertGreaterEqual(Decimal(data["summary"]["total_credit"]), Decimal("100000.00"))
        self.assertGreaterEqual(Decimal(data["summary"]["total_debit"]), Decimal("28500.00"))

    def test_central_transactions_filtering(self):
        """Verifies filtering by transaction type."""
        res = self.client.get("/api/v1/transactions/?transaction_type=CREDIT")
        self.assertEqual(res.status_code, 200)
        results = res.json()["results"]
        for item in results:
            self.assertEqual(item["transaction_type"], "CREDIT")

        res_debit = self.client.get("/api/v1/transactions/?transaction_type=DEBIT")
        self.assertEqual(res_debit.status_code, 200)
        for item in res_debit.json()["results"]:
            self.assertEqual(item["transaction_type"], "DEBIT")
