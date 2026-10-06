from django.contrib import admin
from .models import BankAccount, OfficePayment, OfficePaymentAdjustment, OfficeExpense


class OfficePaymentAdjustmentInline(admin.TabularInline):
    model = OfficePaymentAdjustment
    extra = 0
    readonly_fields = ["added_amount", "adjustment_date", "recorded_by", "created_at"]
    can_delete = False


@admin.register(BankAccount)
class BankAccountAdmin(admin.ModelAdmin):
    list_display = ["bank_name", "account_name", "account_number", "branch_code", "current_balance", "is_active"]
    list_filter = ["is_active", "bank_name"]
    search_fields = ["bank_name", "account_name", "account_number"]


@admin.register(OfficePayment)
class OfficePaymentAdmin(admin.ModelAdmin):
    list_display = [
        "payment_reference",
        "person_name",
        "bank",
        "transaction_type",
        "payment_mode",
        "amount",
        "payment_date",
        "is_active",
    ]
    list_filter = ["transaction_type", "payment_mode", "payment_date", "is_active"]
    search_fields = ["payment_reference", "person_name", "account_name_snapshot", "account_number_snapshot"]
    readonly_fields = ["payment_reference", "bank_name_snapshot", "account_name_snapshot", "account_number_snapshot", "created_at"]
    inlines = [OfficePaymentAdjustmentInline]


@admin.register(OfficeExpense)
class OfficeExpenseAdmin(admin.ModelAdmin):
    list_display = ["expense_reference", "item_name", "person_name", "category", "amount", "expense_date", "payment_mode"]
    list_filter = ["category", "payment_mode", "expense_date"]
    search_fields = ["expense_reference", "item_name", "person_name"]
    readonly_fields = ["expense_reference", "created_at"]
