"""Django Admin configuration for User model."""

from django.contrib import admin
from .models import User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = (
        "email",
        "full_name",
        "role",
        "is_active",
        "is_staff",
        "created_at",
    )
    list_filter = ("role", "is_active", "is_staff")
    search_fields = ("email", "first_name", "last_name", "supabase_uid")
    ordering = ("-created_at",)
    readonly_fields = ("id", "supabase_uid", "created_at", "updated_at")
    fieldsets = (
        (None, {"fields": ("id", "supabase_uid", "email")}),
        (
            "Personal Info",
            {"fields": ("first_name", "last_name", "phone_number")},
        ),
        (
            "Permissions & Role",
            {"fields": ("role", "is_active", "is_staff", "is_superuser")},
        ),
        ("Important Dates", {"fields": ("created_at", "updated_at")}),
    )
