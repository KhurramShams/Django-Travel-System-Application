"""Views and ViewSets for Banking, Office Payments, and Operational Expense Management."""

from decimal import Decimal
from django.conf import settings
from django.db import transaction
from django.db.models import Count, Q, Sum
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.authentication.permissions import IsAccountant, IsAdmin
from .models import (
    BankAccount,
    ExpenseCategory,
    OfficeExpense,
    OfficePayment,
    OfficePaymentAdjustment,
    PaymentMode,
    TransactionType,
)
from .serializers import (
    AddPaymentAmountSerializer,
    BankAccountSerializer,
    OfficeExpenseSerializer,
    OfficePaymentAdjustmentSerializer,
    OfficePaymentCreateSerializer,
    OfficePaymentDetailSerializer,
    OfficePaymentListSerializer,
    OfficePaymentUpdateSerializer,
)


class BankAccountViewSet(viewsets.ModelViewSet):
    """Management of company operational bank accounts."""

    queryset = BankAccount.objects.all().select_related("created_by").prefetch_related("payments")
    serializer_class = BankAccountSerializer

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            permission_classes = [IsAdmin]
        else:
            permission_classes = [IsAccountant]
        return [perm() for perm in permission_classes]

    def get_queryset(self):
        qs = super().get_queryset()
        include_inactive = self.request.query_params.get("include_inactive", "").lower() == "true"
        if not include_inactive:
            qs = qs.filter(is_active=True)
        return qs


class OfficePaymentViewSet(viewsets.ModelViewSet):
    """Full CRUD, ID lookup, and incremental adjustment of office banking payments."""

    queryset = (
        OfficePayment.objects.all()
        .select_related("bank", "created_by")
        .prefetch_related("adjustments", "adjustments__recorded_by")
    )

    def get_permissions(self):
        if self.action in ["destroy", "update", "partial_update"]:
            permission_classes = [IsAdmin]
        else:
            permission_classes = [IsAccountant]
        return [perm() for perm in permission_classes]

    def get_serializer_class(self):
        if self.action == "create":
            return OfficePaymentCreateSerializer
        elif self.action in ["update", "partial_update"]:
            return OfficePaymentUpdateSerializer
        elif self.action == "retrieve":
            return OfficePaymentDetailSerializer
        elif self.action == "add_amount":
            return AddPaymentAmountSerializer
        return OfficePaymentListSerializer

    def get_queryset(self):
        qs = super().get_queryset()

        include_inactive = self.request.query_params.get("include_inactive", "").lower() == "true"
        if not include_inactive:
            qs = qs.filter(is_active=True)

        # Filter by Bank Account
        bank_id = self.request.query_params.get("bank")
        if bank_id:
            qs = qs.filter(bank_id=bank_id)

        # Filter by Transaction Type (CREDIT, DEBIT, TRANSFER)
        tx_type = self.request.query_params.get("transaction_type")
        if tx_type and tx_type.upper() in TransactionType.values:
            qs = qs.filter(transaction_type=tx_type.upper())

        # Filter by Payment Mode
        mode = self.request.query_params.get("payment_mode")
        if mode and mode.upper() in PaymentMode.values:
            qs = qs.filter(payment_mode=mode.upper())

        # Date Filtering
        payment_date = self.request.query_params.get("payment_date")
        if payment_date:
            qs = qs.filter(payment_date=payment_date)

        start_date = self.request.query_params.get("start_date")
        end_date = self.request.query_params.get("end_date")
        if start_date:
            qs = qs.filter(payment_date__gte=start_date)
        if end_date:
            qs = qs.filter(payment_date__lte=end_date)

        # Search Query
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(
                Q(payment_reference__icontains=search)
                | Q(person_name__icontains=search)
                | Q(bank_name_snapshot__icontains=search)
                | Q(account_name_snapshot__icontains=search)
                | Q(account_number_snapshot__icontains=search)
                | Q(notes__icontains=search)
            )

        return qs

    def perform_destroy(self, instance):
        """Deletes payment and reverses financial impact on the associated bank account."""
        with transaction.atomic():
            locked_bank = BankAccount.objects.select_for_update().get(id=instance.bank_id)
            if instance.transaction_type == TransactionType.CREDIT:
                locked_bank.current_balance -= instance.amount
            elif instance.transaction_type == TransactionType.DEBIT:
                locked_bank.current_balance += instance.amount
            locked_bank.save(update_fields=["current_balance", "updated_at"])

            instance.delete()

    @action(detail=True, methods=["post"], url_path="add-amount", permission_classes=[IsAccountant])
    def add_amount(self, request, pk=None):
        """Legacy Screen 12: Adds incremental funds to an existing payment record and updates bank balance."""
        payment = self.get_object()
        serializer = AddPaymentAmountSerializer(
            data=request.data,
            context={"payment": payment, "request": request},
        )
        serializer.is_valid(raise_exception=True)
        adjustment = serializer.save()

        payment.refresh_from_db()
        detail_serializer = OfficePaymentDetailSerializer(payment, context={"request": request})

        return Response(
            {
                "message": f"Successfully added PKR {adjustment.added_amount} to payment {payment.payment_reference}.",
                "adjustment": OfficePaymentAdjustmentSerializer(adjustment).data,
                "payment": detail_serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["get"], url_path="lookup", permission_classes=[IsAccountant])
    def lookup(self, request):
        """Legacy Screen 12: Fast search by exact or partial Payment Reference ID."""
        query = request.query_params.get("q", "").strip()
        if not query:
            return Response([])

        matches = (
            OfficePayment.objects.filter(is_active=True)
            .filter(Q(payment_reference__icontains=query) | Q(person_name__icontains=query))[:10]
        )
        return Response(OfficePaymentListSerializer(matches, many=True).data)


class OfficeExpenseViewSet(viewsets.ModelViewSet):
    """Daily operational expenses log, filtering, and reporting (Screen 13)."""

    queryset = OfficeExpense.objects.all().select_related("recorded_by")
    serializer_class = OfficeExpenseSerializer

    def get_permissions(self):
        if self.action in ["destroy", "update", "partial_update"]:
            permission_classes = [IsAdmin]
        else:
            permission_classes = [IsAccountant]
        return [perm() for perm in permission_classes]

    def get_queryset(self):
        qs = super().get_queryset()

        expense_date = self.request.query_params.get("expense_date")
        if expense_date:
            qs = qs.filter(expense_date=expense_date)

        start_date = self.request.query_params.get("start_date")
        end_date = self.request.query_params.get("end_date")
        if start_date:
            qs = qs.filter(expense_date__gte=start_date)
        if end_date:
            qs = qs.filter(expense_date__lte=end_date)

        category = self.request.query_params.get("category")
        if category and category.upper() in ExpenseCategory.values:
            qs = qs.filter(category=category.upper())

        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(
                Q(expense_reference__icontains=search)
                | Q(item_name__icontains=search)
                | Q(person_name__icontains=search)
                | Q(notes__icontains=search)
            )

        return qs

    @action(detail=False, methods=["get"], url_path="daily-summary", permission_classes=[IsAccountant])
    def daily_summary(self, request):
        """Aggregates total daily expenditure and breakdown for a target date."""
        target_date = request.query_params.get("date") or timezone.now().date().isoformat()
        daily_expenses = OfficeExpense.objects.filter(expense_date=target_date)

        aggregates = daily_expenses.aggregate(
            total_amount=Sum("amount"),
            total_items=Count("id"),
        )

        categories = (
            daily_expenses.values("category")
            .annotate(category_total=Sum("amount"), count=Count("id"))
            .order_by("-category_total")
        )

        return Response(
            {
                "date": target_date,
                "total_amount": aggregates["total_amount"] or Decimal("0.00"),
                "total_items": aggregates["total_items"] or 0,
                "category_breakdown": list(categories),
            }
        )

    @action(detail=False, methods=["get"], url_path="report", permission_classes=[IsAccountant])
    def report(self, request):
        """Returns structured data for the selected date's printable expense PDF report."""
        target_date = request.query_params.get("date") or timezone.now().date().isoformat()
        daily_expenses = OfficeExpense.objects.filter(expense_date=target_date).order_by("created_at")

        total_amount = daily_expenses.aggregate(total=Sum("amount"))["total"] or Decimal("0.00")

        agency_cfg = getattr(settings, "AGENCY_CONFIG", {
            "name": "Khas Travels",
            "phone": "0334-3020868",
            "address": "Office No 5, Hyderabad Road, Mirpurkhas, Sindh",
            "footer_text": "Powered by Innosoft Technologies",
        })

        return Response(
            {
                "date": target_date,
                "total_amount": total_amount,
                "total_items": daily_expenses.count(),
                "expenses": OfficeExpenseSerializer(daily_expenses, many=True).data,
                "agency": agency_cfg,
            }
        )
