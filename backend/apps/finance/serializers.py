"""Serializers for Banking, Office Payments, and Operational Expense Management."""

from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from .models import (
    BankAccount,
    ExpenseCategory,
    OfficeExpense,
    OfficePayment,
    OfficePaymentAdjustment,
    PaymentMode,
    TransactionType,
)


class BankAccountSerializer(serializers.ModelSerializer):
    """Serializer for operating bank accounts with balance monitoring."""

    payments_count = serializers.IntegerField(source="payments.count", read_only=True)
    created_by_name = serializers.CharField(source="created_by.full_name", read_only=True, default=None)

    class Meta:
        model = BankAccount
        fields = [
            "id",
            "bank_name",
            "account_name",
            "account_number",
            "branch_code",
            "current_balance",
            "is_active",
            "payments_count",
            "created_by_name",
            "created_at",
        ]
        read_only_fields = ["id", "current_balance", "created_by_name", "created_at"]

    def create(self, validated_data):
        request = self.context.get("request")
        user = request.user if request and hasattr(request, "user") else None
        validated_data["created_by"] = user
        return super().create(validated_data)


class OfficePaymentAdjustmentSerializer(serializers.ModelSerializer):
    """Audit serializer for incremental 'Add Amount' transactions."""

    recorded_by_name = serializers.CharField(source="recorded_by.full_name", read_only=True, default=None)
    payment_reference = serializers.CharField(source="office_payment.payment_reference", read_only=True)

    class Meta:
        model = OfficePaymentAdjustment
        fields = [
            "id",
            "office_payment",
            "payment_reference",
            "added_amount",
            "adjustment_date",
            "notes",
            "recorded_by",
            "recorded_by_name",
            "created_at",
        ]
        read_only_fields = ["id", "recorded_by", "recorded_by_name", "created_at"]


class OfficePaymentListSerializer(serializers.ModelSerializer):
    """Compact summary serializer for office payments registry."""

    bank_name = serializers.CharField(source="bank.bank_name", read_only=True)
    account_name = serializers.CharField(source="bank.account_name", read_only=True)
    account_number = serializers.CharField(source="bank.account_number", read_only=True)
    created_by_name = serializers.CharField(source="created_by.full_name", read_only=True, default=None)
    adjustments_count = serializers.IntegerField(source="adjustments.count", read_only=True)

    class Meta:
        model = OfficePayment
        fields = [
            "id",
            "payment_reference",
            "person_name",
            "bank",
            "bank_name",
            "account_name",
            "account_number",
            "transaction_type",
            "payment_mode",
            "amount",
            "payment_date",
            "notes",
            "is_active",
            "adjustments_count",
            "created_by_name",
            "created_at",
        ]


class OfficePaymentDetailSerializer(serializers.ModelSerializer):
    """Detailed transaction dossier including historical adjustment logs."""

    bank_name = serializers.CharField(source="bank.bank_name", read_only=True)
    account_name = serializers.CharField(source="bank.account_name", read_only=True)
    account_number = serializers.CharField(source="bank.account_number", read_only=True)
    created_by_name = serializers.CharField(source="created_by.full_name", read_only=True, default=None)
    adjustments = OfficePaymentAdjustmentSerializer(many=True, read_only=True)

    class Meta:
        model = OfficePayment
        fields = [
            "id",
            "payment_reference",
            "person_name",
            "bank",
            "bank_name",
            "account_name",
            "account_number",
            "transaction_type",
            "payment_mode",
            "amount",
            "payment_date",
            "notes",
            "is_active",
            "created_by_name",
            "adjustments",
            "created_at",
            "updated_at",
        ]


class OfficePaymentCreateSerializer(serializers.ModelSerializer):
    """Creates a new banking transaction and updates running bank account balance atomically."""

    class Meta:
        model = OfficePayment
        fields = [
            "id",
            "payment_reference",
            "person_name",
            "bank",
            "transaction_type",
            "payment_mode",
            "amount",
            "payment_date",
            "notes",
        ]
        read_only_fields = ["id", "payment_reference"]

    def validate_amount(self, value):
        if value <= Decimal("0.00"):
            raise serializers.ValidationError(_("Transaction amount must be greater than zero."))
        return value

    def validate_bank(self, value):
        if not value.is_active:
            raise serializers.ValidationError(_("Selected bank account is deactivated."))
        return value

    def create(self, validated_data):
        request = self.context.get("request")
        user = request.user if request and hasattr(request, "user") else None
        validated_data["created_by"] = user

        amount = validated_data["amount"]
        tx_type = validated_data["transaction_type"]
        bank = validated_data["bank"]

        with transaction.atomic():
            payment = OfficePayment.objects.create(**validated_data)

            # Lock the bank account row and apply financial balance delta
            locked_bank = BankAccount.objects.select_for_update().get(id=bank.id)
            if tx_type == TransactionType.CREDIT:
                locked_bank.current_balance += amount
            elif tx_type == TransactionType.DEBIT:
                locked_bank.current_balance -= amount
            locked_bank.save(update_fields=["current_balance", "updated_at"])

        return payment


class OfficePaymentUpdateSerializer(serializers.ModelSerializer):
    """Allows administrators to update transaction details."""

    class Meta:
        model = OfficePayment
        fields = [
            "person_name",
            "payment_mode",
            "payment_date",
            "notes",
            "is_active",
        ]


class AddPaymentAmountSerializer(serializers.Serializer):
    """Action serializer for adding incremental funds (Add Amount on Screen 12)."""

    added_amount = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=Decimal("0.01"),
    )
    adjustment_date = serializers.DateField(default=timezone.localdate)
    notes = serializers.CharField(required=False, allow_blank=True, default="")

    def save(self, **kwargs):
        payment = self.context["payment"]
        request = self.context.get("request")
        user = request.user if request and hasattr(request, "user") else None

        validated_data = self.validated_data
        added_amount = validated_data["added_amount"]
        adj_date = validated_data.get("adjustment_date", timezone.localdate())
        if hasattr(adj_date, "date") and callable(adj_date.date):
            adj_date = adj_date.date()
        notes = validated_data.get("notes", "")

        with transaction.atomic():
            # Lock payment and linked bank
            locked_payment = OfficePayment.objects.select_for_update().get(id=payment.id)
            locked_bank = BankAccount.objects.select_for_update().get(id=locked_payment.bank_id)

            adjustment = OfficePaymentAdjustment.objects.create(
                office_payment=locked_payment,
                added_amount=added_amount,
                adjustment_date=adj_date,
                notes=notes,
                recorded_by=user,
            )

            # Update payment total amount
            locked_payment.amount += added_amount
            locked_payment.save(update_fields=["amount", "updated_at"])

            # Reflect addition in bank balance
            if locked_payment.transaction_type == TransactionType.CREDIT:
                locked_bank.current_balance += added_amount
            elif locked_payment.transaction_type == TransactionType.DEBIT:
                locked_bank.current_balance -= added_amount
            locked_bank.save(update_fields=["current_balance", "updated_at"])

        return adjustment


class OfficeExpenseSerializer(serializers.ModelSerializer):
    """Serializer for daily operational expense tracking (Screen 13)."""

    recorded_by_name = serializers.CharField(source="recorded_by.full_name", read_only=True, default=None)

    class Meta:
        model = OfficeExpense
        fields = [
            "id",
            "expense_reference",
            "person_name",
            "item_name",
            "category",
            "amount",
            "expense_date",
            "payment_mode",
            "notes",
            "recorded_by_name",
            "created_at",
        ]
        read_only_fields = ["id", "expense_reference", "recorded_by_name", "created_at"]

    def validate_amount(self, value):
        if value <= Decimal("0.00"):
            raise serializers.ValidationError(_("Expense amount must be greater than zero."))
        return value

    def create(self, validated_data):
        request = self.context.get("request")
        user = request.user if request and hasattr(request, "user") else None
        validated_data["recorded_by"] = user
        return super().create(validated_data)
