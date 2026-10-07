"""Service for compiling, filtering, and paginating the Central Master Transaction Ledger."""

from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional

from django.db.models import Q
from django.utils import timezone

from apps.packages.models import TravelerPayment
from apps.ticketing.models import AgencyTicket, TicketRefund
from apps.hotels.models import HotelPayment
from apps.finance.models import OfficeExpense, OfficePayment, TransactionType


def get_consolidated_ledger(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    source_module: Optional[str] = None,
    transaction_type: Optional[str] = None,
    payment_mode: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
) -> Dict[str, Any]:
    """Compiles chronological transaction records from all domain modules."""
    entries: List[Dict[str, Any]] = []

    # 1. CLIENT PAYMENTS (TravelerPackage installments -> CREDIT)
    if not source_module or source_module in ["ALL", "CLIENT_PAYMENT"]:
        if not transaction_type or transaction_type in ["ALL", "CREDIT"]:
            qs = TravelerPayment.objects.select_related(
                "enrollment__traveler",
                "enrollment__package",
                "recorded_by",
            ).all()

            if start_date:
                qs = qs.filter(payment_date__gte=start_date)
            if end_date:
                qs = qs.filter(payment_date__lte=end_date)
            if payment_mode and payment_mode != "ALL":
                qs = qs.filter(payment_method=payment_mode)
            if search:
                qs = qs.filter(
                    Q(receipt_number__icontains=search)
                    | Q(enrollment__traveler__full_name__icontains=search)
                    | Q(enrollment__package__title__icontains=search)
                    | Q(reference_number__icontains=search)
                )

            for p in qs[:500]:
                tr_name = p.enrollment.traveler.full_name if p.enrollment else "Unknown Traveler"
                pkg_title = p.enrollment.package.title if p.enrollment else ""
                recorded = p.recorded_by.get_full_name() or p.recorded_by.email if p.recorded_by else "Staff"
                iso_ts = p.created_at.isoformat() if p.created_at else f"{p.payment_date}T00:00:00Z"

                entries.append({
                    "id": p.receipt_number or str(p.id),
                    "timestamp": iso_ts,
                    "date": p.payment_date.isoformat(),
                    "source_module": "CLIENT_PAYMENT",
                    "description": f"Package Installment: {tr_name} ({pkg_title})",
                    "transaction_type": "CREDIT",
                    "amount": str(p.amount),
                    "payment_mode": p.payment_method,
                    "account_or_bank": p.reference_number or "Office Cash/Bank",
                    "party_name": tr_name,
                    "recorded_by": recorded,
                })

    # 2. AIRLINE TICKET PURCHASES (AgencyTicket wholesale cost -> DEBIT)
    if not source_module or source_module in ["ALL", "TICKET_PURCHASE"]:
        if not transaction_type or transaction_type in ["ALL", "DEBIT"]:
            qs = AgencyTicket.objects.select_related("created_by").all()

            if start_date:
                qs = qs.filter(issue_date__gte=start_date)
            if end_date:
                qs = qs.filter(issue_date__lte=end_date)
            if search:
                qs = qs.filter(
                    Q(pnr_number__icontains=search)
                    | Q(airline_name__icontains=search)
                    | Q(agency_name__icontains=search)
                )

            for t in qs[:500]:
                recorded = t.created_by.get_full_name() or t.created_by.email if t.created_by else "Ticketing Agent"
                iso_ts = t.created_at.isoformat() if t.created_at else f"{t.issue_date}T00:00:00Z"

                entries.append({
                    "id": f"PNR-{t.pnr_number}",
                    "timestamp": iso_ts,
                    "date": t.issue_date.isoformat(),
                    "source_module": "TICKET_PURCHASE",
                    "description": f"Air Ticket Wholesale: {t.airline_name} ({t.total_tickets} seats) - PNR: {t.pnr_number}",
                    "transaction_type": "DEBIT",
                    "amount": str(t.total_price),
                    "payment_mode": "BANK_TRANSFER",
                    "account_or_bank": t.agency_name,
                    "party_name": t.agency_name,
                    "recorded_by": recorded,
                })

    # 3. AIRLINE TICKET REFUNDS (TicketRefund recovery -> CREDIT)
    if not source_module or source_module in ["ALL", "TICKET_REFUND"]:
        if not transaction_type or transaction_type in ["ALL", "CREDIT"]:
            qs = TicketRefund.objects.select_related("ticket", "processed_by").all()

            if start_date:
                qs = qs.filter(created_at__date__gte=start_date)
            if end_date:
                qs = qs.filter(created_at__date__lte=end_date)
            if payment_mode and payment_mode != "ALL":
                qs = qs.filter(refund_method=payment_mode)
            if search:
                qs = qs.filter(
                    Q(ticket__pnr_number__icontains=search)
                    | Q(ticket__airline_name__icontains=search)
                    | Q(reason__icontains=search)
                )

            for r in qs[:500]:
                recorded = r.processed_by.get_full_name() or r.processed_by.email if r.processed_by else "Staff"
                pnr = r.ticket.pnr_number if r.ticket else "N/A"
                d_str = r.created_at.date().isoformat() if r.created_at else str(timezone.localdate())

                entries.append({
                    "id": f"REF-{pnr}-{str(r.id)[:6]}",
                    "timestamp": r.created_at.isoformat() if r.created_at else f"{d_str}T00:00:00Z",
                    "date": d_str,
                    "source_module": "TICKET_REFUND",
                    "description": f"Ticket Refund PNR: {pnr} ({r.refund_seats_count} seats)",
                    "transaction_type": "CREDIT",
                    "amount": str(r.net_refund_amount),
                    "payment_mode": r.refund_method,
                    "account_or_bank": r.ticket.agency_name if r.ticket else "Consolidator",
                    "party_name": r.ticket.airline_name if r.ticket else "Airline",
                    "recorded_by": recorded,
                })

    # 4. HOTEL SETTLEMENT PAYMENTS (HotelPayment -> DEBIT)
    if not source_module or source_module in ["ALL", "HOTEL_PAYMENT"]:
        if not transaction_type or transaction_type in ["ALL", "DEBIT"]:
            qs = HotelPayment.objects.select_related("hotel_booking", "recorded_by").all()

            if start_date:
                qs = qs.filter(payment_date__gte=start_date)
            if end_date:
                qs = qs.filter(payment_date__lte=end_date)
            if payment_mode and payment_mode != "ALL":
                qs = qs.filter(payment_method=payment_mode)
            if search:
                qs = qs.filter(
                    Q(receipt_number__icontains=search)
                    | Q(hotel_booking__hotel_name__icontains=search)
                    | Q(hotel_booking__booking_reference__icontains=search)
                )

            for hp in qs[:500]:
                h_name = hp.hotel_booking.hotel_name if hp.hotel_booking else "Hotel Vendor"
                b_ref = hp.hotel_booking.booking_reference if hp.hotel_booking else ""
                recorded = hp.recorded_by.get_full_name() or hp.recorded_by.email if hp.recorded_by else "Staff"
                iso_ts = hp.created_at.isoformat() if hp.created_at else f"{hp.payment_date}T00:00:00Z"

                entries.append({
                    "id": hp.receipt_number or str(hp.id),
                    "timestamp": iso_ts,
                    "date": hp.payment_date.isoformat(),
                    "source_module": "HOTEL_PAYMENT",
                    "description": f"Hotel Booking Payment: {h_name} ({b_ref})",
                    "transaction_type": "DEBIT",
                    "amount": str(hp.amount),
                    "payment_mode": hp.payment_method,
                    "account_or_bank": hp.reference_number or h_name,
                    "party_name": h_name,
                    "recorded_by": recorded,
                })

    # 5. OFFICE BANKING PAYMENTS (OfficePayment -> CREDIT, DEBIT, TRANSFER)
    if not source_module or source_module in ["ALL", "OFFICE_PAYMENT"]:
        qs = OfficePayment.objects.select_related("bank", "created_by").filter(is_active=True)

        if transaction_type and transaction_type != "ALL":
            qs = qs.filter(transaction_type=transaction_type)
        if start_date:
            qs = qs.filter(payment_date__gte=start_date)
        if end_date:
            qs = qs.filter(payment_date__lte=end_date)
        if payment_mode and payment_mode != "ALL":
            qs = qs.filter(payment_mode=payment_mode)
        if search:
            qs = qs.filter(
                Q(payment_reference__icontains=search)
                | Q(person_name__icontains=search)
                | Q(notes__icontains=search)
                | Q(bank__bank_name__icontains=search)
            )

        for op in qs[:500]:
            bank_str = f"{op.bank.bank_name} ({op.bank.account_number[-4:]})" if op.bank else "Bank"
            recorded = op.created_by.get_full_name() or op.created_by.email if op.created_by else "Staff"
            iso_ts = op.created_at.isoformat() if op.created_at else f"{op.payment_date}T00:00:00Z"

            entries.append({
                "id": op.payment_reference or str(op.id),
                "timestamp": iso_ts,
                "date": op.payment_date.isoformat(),
                "source_module": "OFFICE_PAYMENT",
                "description": f"Office Transaction: {op.person_name} ({op.notes or 'Banking flow'})",
                "transaction_type": op.transaction_type,
                "amount": str(op.amount),
                "payment_mode": op.payment_mode,
                "account_or_bank": bank_str,
                "party_name": op.person_name,
                "recorded_by": recorded,
            })

    # 6. DAILY OPERATIONAL EXPENSES (OfficeExpense -> DEBIT)
    if not source_module or source_module in ["ALL", "OFFICE_EXPENSE"]:
        if not transaction_type or transaction_type in ["ALL", "DEBIT"]:
            qs = OfficeExpense.objects.select_related("recorded_by").all()

            if start_date:
                qs = qs.filter(expense_date__gte=start_date)
            if end_date:
                qs = qs.filter(expense_date__lte=end_date)
            if payment_mode and payment_mode != "ALL":
                qs = qs.filter(payment_mode=payment_mode)
            if search:
                qs = qs.filter(
                    Q(expense_reference__icontains=search)
                    | Q(item_name__icontains=search)
                    | Q(person_name__icontains=search)
                    | Q(category__icontains=search)
                )

            for exp in qs[:500]:
                recorded = exp.recorded_by.get_full_name() or exp.recorded_by.email if exp.recorded_by else "Cashier"
                iso_ts = exp.created_at.isoformat() if exp.created_at else f"{exp.expense_date}T00:00:00Z"

                entries.append({
                    "id": exp.expense_reference or str(exp.id),
                    "timestamp": iso_ts,
                    "date": exp.expense_date.isoformat(),
                    "source_module": "OFFICE_EXPENSE",
                    "description": f"Office Expense: {exp.item_name} [{exp.category}] ({exp.person_name})",
                    "transaction_type": "DEBIT",
                    "amount": str(exp.amount),
                    "payment_mode": exp.payment_mode,
                    "account_or_bank": "Cash / Petty Cash",
                    "party_name": exp.person_name,
                    "recorded_by": recorded,
                })

    # Sort consolidated entries chronologically DESC (most recent first)
    entries.sort(key=lambda x: x["timestamp"], reverse=True)

    # Calculate summary metrics for current filtered selection
    total_count = len(entries)
    total_credit = sum(Decimal(e["amount"]) for e in entries if e["transaction_type"] == "CREDIT")
    total_debit = sum(Decimal(e["amount"]) for e in entries if e["transaction_type"] == "DEBIT")
    net_flow = total_credit - total_debit

    # Pagination slice
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    paginated_results = entries[start_idx:end_idx]
    total_pages = max(1, (total_count + page_size - 1) // page_size)

    return {
        "pagination": {
            "count": total_count,
            "total_pages": total_pages,
            "current_page": page,
            "page_size": page_size,
        },
        "summary": {
            "total_count": total_count,
            "total_credit": str(total_credit),
            "total_debit": str(total_debit),
            "net_flow": str(net_flow),
        },
        "results": paginated_results,
    }
