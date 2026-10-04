"""Django Admin registration for travelers."""

from django.contrib import admin
from .models import Traveler


class DependentInline(admin.TabularInline):
    model = Traveler
    fk_name = "guardian"
    extra = 0
    fields = ("full_name", "cnic", "age_category", "phone_number")
    readonly_fields = ("full_name", "cnic", "age_category", "phone_number")
    can_delete = False
    verbose_name = "Family Dependent / Child"
    verbose_name_plural = "Family Dependents / Children"


@admin.register(Traveler)
class TravelerAdmin(admin.ModelAdmin):
    list_display = (
        "full_name",
        "cnic",
        "age_category",
        "phone_number",
        "passport_number",
        "guardian",
        "has_active_package",
        "created_at",
    )
    list_filter = ("age_category", "created_at")
    search_fields = ("full_name", "cnic", "phone_number", "passport_number")
    raw_id_fields = ("guardian",)
    readonly_fields = ("id", "created_at", "updated_at")
    inlines = [DependentInline]
    fieldsets = (
        ("Personal Identification", {"fields": ("id", "full_name", "cnic", "age_category", "passport_number")}),
        ("Contact & Address", {"fields": ("phone_number", "address", "emergency_contact")}),
        ("Family & Guardianship", {"fields": ("guardian",)}),
        ("Operational Notes", {"fields": ("notes",)}),
        ("Audit Metadata", {"fields": ("created_at", "updated_at")}),
    )
