"""Domain models for Banking, Office Payments, and Operational Expense Management."""

import uuid
from decimal import Decimal
from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from apps.common.models import BaseModel


class TransactionType(models.TextChoices):
    CREDIT = "CREDIT", _("Credit (Deposit / Inflow)")
    DEBIT = "DEBIT", _("Debit (Withdrawal / Outflow)")
    TRANSFER = "TRANSFER", _("Transfer")


class PaymentMode(models.TextChoices):
    CASH = "CASH", _("Cash")
    ONLINE_TRANSFER = "ONLINE_TRANSFER", _("Online Transfer")
    CHEQUE = "CHEQUE", _("Cheque")
    DEPOSIT_SLIP = "DEPOSIT_SLIP", _("Bank Deposit Slip")


class ExpenseCategory(models.TextChoices):
    RENT = "RENT", _("Office Rent")
    UTILITIES = "UTILITIES", _("Electricity, Gas & Water")
    SALARIES = "SALARIES", _("Staff Salaries & Allowances")
    REFRESHMENTS = "REFRESHMENTS", _("Tea & Refreshments")
    OFFICE_SUPPLIES = "OFFICE_SUPPLIES", _("Stationery & Office Supplies")
    MAINTENANCE = "MAINTENANCE", _("Repairs & Maintenance")
    MARKETING = "MARKETING", _("Advertising & Printing")
    OTHER = "OTHER", _("Miscellaneous")


class BankAccount(BaseModel):
    """Company operating bank accounts with live balance reconciliation."""

    bank_name = models.CharField(
        _("bank name"),
        max_length=150,
        db_index=True,
        help_text="e.g. Meezan Bank, HBL, UBL, Bank Alfalah",
    )
    account_name = models.CharField(
        _("account title"),
        max_length=200,
        help_text="Official title registered on the account (e.g. Khas Travels)",
    )
    account_number = models.CharField(
        _("account number / IBAN"),
        max_length=50,
        unique=True,
        db_index=True,
    )
    branch_code = models.CharField(
        _("branch name or code"),
        max_length=100,
        blank=True,
        default="",
    )
    current_balance = models.DecimalField(
        _("running ledger balance"),
        max_digits=14,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    is_active = models.BooleanField(default=True, db_index=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="bank_accounts_created",
    )

    class Meta:
        ordering = ["bank_name", "account_name"]
        verbose_name = _("Bank Account")
        verbose_name_plural = _("Bank Accounts")

    def __str__(self):
        return f"{self.bank_name} - {self.account_name} ({self.account_number})"


class OfficePayment(BaseModel):
    """Office banking transaction records (Replacing Legacy Screens 11 & 12)."""

    payment_reference = models.CharField(
        _("payment reference ID"),
        max_length=25,
        unique=True,
        db_index=True,
        help_text="Human-readable transaction reference, e.g. KB-PAY-2026-0001",
    )
    person_name = models.CharField(
        _("person name / beneficiary / payer"),
        max_length=200,
        db_index=True,
    )
    bank = models.ForeignKey(
        BankAccount,
        on_delete=models.PROTECT,
        related_name="payments",
        verbose_name=_("bank account"),
    )
    bank_name_snapshot = models.CharField(max_length=150, blank=True, default="")
    account_name_snapshot = models.CharField(max_length=200, blank=True, default="")
    account_number_snapshot = models.CharField(max_length=50, blank=True, default="")

    transaction_type = models.CharField(
        _("transaction type"),
        max_length=15,
        choices=TransactionType.choices,
        default=TransactionType.CREDIT,
        db_index=True,
    )
    payment_mode = models.CharField(
        _("payment mode"),
        max_length=20,
        choices=PaymentMode.choices,
        default=PaymentMode.ONLINE_TRANSFER,
    )
    amount = models.DecimalField(
        _("transaction amount"),
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    payment_date = models.DateField(
        _("transaction date"),
        default=timezone.localdate,
        db_index=True,
    )
    notes = models.TextField(
        _("purpose / remarks"),
        blank=True,
        default="",
    )
    is_active = models.BooleanField(default=True, db_index=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="office_payments",
    )

    class Meta:
        ordering = ["-payment_date", "-created_at"]
        verbose_name = _("Office Payment")
        verbose_name_plural = _("Office Payments")
        indexes = [
            models.Index(fields=["payment_date", "transaction_type"]),
            models.Index(fields=["person_name", "payment_date"]),
        ]

    def __str__(self):
        return f"{self.payment_reference} - {self.person_name} ({self.amount} PKR)"

    def save(self, *args, **kwargs):
        if not self.payment_reference:
            year = timezone.now().year
            rand_suffix = uuid.uuid4().hex[:5].upper()
            self.payment_reference = f"KB-PAY-{year}-{rand_suffix}"
        if self.bank:
            self.bank_name_snapshot = self.bank.bank_name
            self.account_name_snapshot = self.bank.account_name
            self.account_number_snapshot = self.bank.account_number
        super().save(*args, **kwargs)


class OfficePaymentAdjustment(BaseModel):
    """Audit ledger tracking every 'Add Amount' operation on an OfficePayment record."""

    office_payment = models.ForeignKey(
        OfficePayment,
        on_delete=models.CASCADE,
        related_name="adjustments",
        verbose_name=_("office payment"),
    )
    added_amount = models.DecimalField(
        _("added amount"),
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    adjustment_date = models.DateField(
        _("adjustment date"),
        default=timezone.localdate,
    )
    notes = models.TextField(blank=True, default="")
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="payment_adjustments_recorded",
    )

    class Meta:
        ordering = ["-adjustment_date", "-created_at"]
        verbose_name = _("Office Payment Adjustment")
        verbose_name_plural = _("Office Payment Adjustments")

    def __str__(self):
        return f"+{self.added_amount} on {self.office_payment.payment_reference}"


class OfficeExpense(BaseModel):
    """Daily operational expenses log (Replacing Legacy Screen 13)."""

    expense_reference = models.CharField(
        _("expense voucher number"),
        max_length=25,
        unique=True,
        db_index=True,
        help_text="e.g. EXP-2026-0001",
    )
    person_name = models.CharField(
        _("spender / authorized staff"),
        max_length=200,
        db_index=True,
    )
    item_name = models.CharField(
        _("expense item / title"),
        max_length=200,
        help_text="e.g. Electricity Bill, Tea/Refreshment, Courier Charges",
    )
    category = models.CharField(
        _("category"),
        max_length=25,
        choices=ExpenseCategory.choices,
        default=ExpenseCategory.OTHER,
        db_index=True,
    )
    amount = models.DecimalField(
        _("expense amount"),
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    expense_date = models.DateField(
        _("expense date"),
        default=timezone.localdate,
        db_index=True,
    )
    payment_mode = models.CharField(
        _("payment channel"),
        max_length=20,
        choices=PaymentMode.choices,
        default=PaymentMode.CASH,
    )
    notes = models.TextField(blank=True, default="")
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="expenses_recorded",
    )

    class Meta:
        ordering = ["-expense_date", "-created_at"]
        verbose_name = _("Office Expense")
        verbose_name_plural = _("Office Expenses")
        indexes = [
            models.Index(fields=["expense_date", "category"]),
        ]

    def __str__(self):
        return f"{self.expense_reference} - {self.item_name} ({self.amount} PKR)"

    def save(self, *args, **kwargs):
        if not self.expense_reference:
            year = timezone.now().year
            rand_suffix = uuid.uuid4().hex[:5].upper()
            self.expense_reference = f"EXP-{year}-{rand_suffix}"
        super().save(*args, **kwargs)
