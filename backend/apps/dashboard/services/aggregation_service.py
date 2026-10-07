"""Aggregation service for executive financial KPIs and analytical charts."""

import calendar
from datetime import date, timedelta
from decimal import Decimal
from typing import Any, Dict, List

from django.db.models import DecimalField, Sum, Value
from django.db.models.functions import Coalesce
from django.utils import timezone

from apps.travelers.models import Traveler
from apps.packages.models import (
    EnrollmentStatus,
    PackageEnrollment,
    TravelPackage,
    TravelerPayment,
)
from apps.ticketing.models import AgencyTicket, TicketRefund
from apps.hotels.models import HotelBooking, HotelPayment
from apps.finance.models import (
    BankAccount,
    OfficeExpense,
    OfficePayment,
    TransactionType,
)


def get_dashboard_metrics(
    start_date: Any = None,
    end_date: Any = None,
) -> Dict[str, Any]:
    """Computes high-level financial KPIs and operational counters with optional date window."""
    today = timezone.localdate()

    # 1. Total Customers (Filtered by registration date if range provided)
    travelers_qs = Traveler.objects.all()
    if start_date:
        travelers_qs = travelers_qs.filter(created_at__date__gte=start_date)
    if end_date:
        travelers_qs = travelers_qs.filter(created_at__date__lte=end_date)
    total_customers = travelers_qs.count()

    # 2. Total Received Amount (Client Payments + Office Bank Credits within range)
    client_pay_qs = TravelerPayment.objects.all()
    if start_date:
        client_pay_qs = client_pay_qs.filter(payment_date__gte=start_date)
    if end_date:
        client_pay_qs = client_pay_qs.filter(payment_date__lte=end_date)

    client_received = client_pay_qs.aggregate(
        total=Coalesce(Sum("amount"), Value(Decimal("0.00"), output_field=DecimalField()))
    )["total"]

    office_pay_qs = OfficePayment.objects.filter(
        transaction_type=TransactionType.CREDIT,
        is_active=True,
    )
    if start_date:
        office_pay_qs = office_pay_qs.filter(payment_date__gte=start_date)
    if end_date:
        office_pay_qs = office_pay_qs.filter(payment_date__lte=end_date)

    office_credits = office_pay_qs.aggregate(
        total=Coalesce(Sum("amount"), Value(Decimal("0.00"), output_field=DecimalField()))
    )["total"]

    received_amount = (client_received or Decimal("0.00")) + (office_credits or Decimal("0.00"))

    # 3. Remaining Receivables on active enrollments (filtered by enrollment date if range provided)
    enrollments_qs = PackageEnrollment.objects.filter(status=EnrollmentStatus.ACTIVE)
    if start_date:
        enrollments_qs = enrollments_qs.filter(enrolled_date__gte=start_date)
    if end_date:
        enrollments_qs = enrollments_qs.filter(enrolled_date__lte=end_date)

    active_agreed = enrollments_qs.aggregate(
        total=Coalesce(Sum("final_agreed_price"), Value(Decimal("0.00"), output_field=DecimalField()))
    )["total"] or Decimal("0.00")

    active_collected = TravelerPayment.objects.filter(
        enrollment__in=enrollments_qs
    ).aggregate(
        total=Coalesce(Sum("amount"), Value(Decimal("0.00"), output_field=DecimalField()))
    )["total"] or Decimal("0.00")

    remaining_amount = max(Decimal("0.00"), active_agreed - active_collected)

    # 4. Period / Today's Operational Office Expense (Timezone aware)
    expenses_qs = OfficeExpense.objects.all()
    if start_date or end_date:
        if start_date:
            expenses_qs = expenses_qs.filter(expense_date__gte=start_date)
        if end_date:
            expenses_qs = expenses_qs.filter(expense_date__lte=end_date)
    else:
        expenses_qs = expenses_qs.filter(expense_date=today)

    period_expense = expenses_qs.aggregate(
        total=Coalesce(Sum("amount"), Value(Decimal("0.00"), output_field=DecimalField()))
    )["total"] or Decimal("0.00")

    # 5. Secondary Operational Metrics
    bank_liquidity = BankAccount.objects.filter(
        is_active=True
    ).aggregate(
        total=Coalesce(Sum("current_balance"), Value(Decimal("0.00"), output_field=DecimalField()))
    )["total"] or Decimal("0.00")

    active_packages = TravelPackage.objects.filter(status="ACTIVE").count()
    issued_tickets_count = AgencyTicket.objects.count()
    hotel_bookings_count = HotelBooking.objects.count()

    return {
        "total_customers": total_customers,
        "received_amount": str(received_amount),
        "remaining_amount": str(remaining_amount),
        "today_expense": str(period_expense),
        "secondary": {
            "bank_liquidity": str(bank_liquidity),
            "active_packages": active_packages,
            "issued_tickets_count": issued_tickets_count,
            "hotel_bookings_count": hotel_bookings_count,
        },
    }


def get_monthly_cashflow(num_months: int = 6) -> List[Dict[str, Any]]:
    """Calculates chronological cash inflow vs. outflow for the past N months."""
    today = timezone.localdate()
    result = []

    for i in range(num_months - 1, -1, -1):
        # Calculate target year and month
        target_year = today.year
        target_month = today.month - i
        while target_month <= 0:
            target_month += 12
            target_year -= 1

        _, last_day = calendar.monthrange(target_year, target_month)
        start_date = date(target_year, target_month, 1)
        end_date = date(target_year, target_month, last_day)

        # Inflows: Client payments + Office Credits + Ticket Refunds
        client_inflow = TravelerPayment.objects.filter(
            payment_date__gte=start_date,
            payment_date__lte=end_date,
        ).aggregate(
            s=Coalesce(Sum("amount"), Value(Decimal("0.00"), output_field=DecimalField()))
        )["s"] or Decimal("0.00")

        office_inflow = OfficePayment.objects.filter(
            transaction_type=TransactionType.CREDIT,
            is_active=True,
            payment_date__gte=start_date,
            payment_date__lte=end_date,
        ).aggregate(
            s=Coalesce(Sum("amount"), Value(Decimal("0.00"), output_field=DecimalField()))
        )["s"] or Decimal("0.00")

        refund_inflow = TicketRefund.objects.filter(
            created_at__date__gte=start_date,
            created_at__date__lte=end_date,
        ).aggregate(
            s=Coalesce(Sum("net_refund_amount"), Value(Decimal("0.00"), output_field=DecimalField()))
        )["s"] or Decimal("0.00")

        total_inflow = client_inflow + office_inflow + refund_inflow

        # Outflows: Ticket Purchases + Hotel Settlements + Office Debits + Daily Expenses
        ticket_outflow = AgencyTicket.objects.filter(
            issue_date__gte=start_date,
            issue_date__lte=end_date,
        ).aggregate(
            s=Coalesce(Sum("total_price"), Value(Decimal("0.00"), output_field=DecimalField()))
        )["s"] or Decimal("0.00")

        hotel_outflow = HotelPayment.objects.filter(
            payment_date__gte=start_date,
            payment_date__lte=end_date,
        ).aggregate(
            s=Coalesce(Sum("amount"), Value(Decimal("0.00"), output_field=DecimalField()))
        )["s"] or Decimal("0.00")

        office_outflow = OfficePayment.objects.filter(
            transaction_type=TransactionType.DEBIT,
            is_active=True,
            payment_date__gte=start_date,
            payment_date__lte=end_date,
        ).aggregate(
            s=Coalesce(Sum("amount"), Value(Decimal("0.00"), output_field=DecimalField()))
        )["s"] or Decimal("0.00")

        expense_outflow = OfficeExpense.objects.filter(
            expense_date__gte=start_date,
            expense_date__lte=end_date,
        ).aggregate(
            s=Coalesce(Sum("amount"), Value(Decimal("0.00"), output_field=DecimalField()))
        )["s"] or Decimal("0.00")

        total_outflow = ticket_outflow + hotel_outflow + office_outflow + expense_outflow

        month_str = f"{target_year}-{target_month:02d}"
        month_label = start_date.strftime("%b %Y")

        result.append({
            "month": month_str,
            "label": month_label,
            "inflow": float(total_inflow),
            "outflow": float(total_outflow),
            "net_margin": float(total_inflow - total_outflow),
        })

    return result


def get_package_occupancy() -> List[Dict[str, Any]]:
    """Returns enrollment occupancy for active packages."""
    packages = TravelPackage.objects.filter(
        status="ACTIVE"
    ).order_by("-departure_date")[:6]

    res = []
    for pkg in packages:
        enrolled = pkg.total_enrolled
        capacity = pkg.capacity
        rate = round((enrolled / capacity) * 100, 1) if capacity > 0 else 0.0
        res.append({
            "id": str(pkg.id),
            "title": pkg.title,
            "package_code": pkg.package_code,
            "capacity": capacity,
            "enrolled": enrolled,
            "occupancy_rate": rate,
            "departure_date": pkg.departure_date.isoformat() if pkg.departure_date else None,
        })
    return res


def get_receivables_breakdown() -> Dict[str, Any]:
    """Categorizes active package enrollments into Paid, Partial, and Unpaid."""
    active_enrollments = PackageEnrollment.objects.filter(
        status=EnrollmentStatus.ACTIVE
    ).select_related("traveler", "package").prefetch_related("payments")

    paid_count = 0
    paid_sum = Decimal("0.00")
    partial_count = 0
    partial_sum = Decimal("0.00")
    unpaid_count = 0
    unpaid_sum = Decimal("0.00")

    for enr in active_enrollments:
        status = enr.payment_status
        rem = enr.remaining_balance
        if status == "PAID":
            paid_count += 1
            paid_sum += enr.final_agreed_price
        elif status == "PARTIAL":
            partial_count += 1
            partial_sum += rem
        else:
            unpaid_count += 1
            unpaid_sum += rem

    return {
        "paid": {"count": paid_count, "amount": str(paid_sum)},
        "partial": {"count": partial_count, "amount": str(partial_sum)},
        "unpaid": {"count": unpaid_count, "amount": str(unpaid_sum)},
        "total_active_enrollments": active_enrollments.count(),
    }
