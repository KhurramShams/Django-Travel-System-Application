"""Django Admin configuration for travel packages, enrollments, and payments."""

from django.contrib import admin
from .models import TravelPackage, PackageEnrollment, TravelerPayment


class EnrollmentInline(admin.TabularInline):
    model = PackageEnrollment
    extra = 0
    fields = ("enrollment_number", "traveler", "base_price_applied", "final_agreed_price", "status", "enrolled_date")
    readonly_fields = ("enrollment_number", "traveler", "base_price_applied", "final_agreed_price", "status", "enrolled_date")
    can_delete = False
    show_change_link = True


class PaymentInline(admin.TabularInline):
    model = TravelerPayment
    extra = 0
    fields = ("receipt_number", "amount", "payment_date", "payment_method", "reference_number", "recorded_by")
    readonly_fields = ("receipt_number", "amount", "payment_date", "payment_method", "reference_number", "recorded_by")
    can_delete = False
    show_change_link = True


@admin.register(TravelPackage)
class TravelPackageAdmin(admin.ModelAdmin):
    list_display = (
        "package_code",
        "title",
        "location",
        "star_rating",
        "departure_date",
        "return_date",
        "adult_price",
        "capacity",
        "total_enrolled",
        "seats_available",
        "status",
    )
    list_filter = ("status", "location", "star_rating", "departure_date")
    search_fields = ("title", "package_code", "flight_name")
    readonly_fields = ("id", "created_at", "updated_at")
    inlines = [EnrollmentInline]
    fieldsets = (
        ("General Specification", {"fields": ("id", "title", "package_code", "status", "description")}),
        ("Itinerary & Accommodation", {"fields": ("location", "star_rating", "shuttle_service", "flight_name", "departure_date", "return_date")}),
        ("Base Tier Pricing (PKR)", {"fields": ("adult_price", "child_price", "infant_price", "capacity")}),
        ("Audit Metadata", {"fields": ("created_at", "updated_at")}),
    )


@admin.register(PackageEnrollment)
class PackageEnrollmentAdmin(admin.ModelAdmin):
    list_display = (
        "enrollment_number",
        "traveler",
        "package",
        "enrolled_date",
        "base_price_applied",
        "final_agreed_price",
        "total_paid",
        "remaining_balance",
        "payment_status",
        "status",
    )
    list_filter = ("status", "enrolled_date")
    search_fields = ("enrollment_number", "traveler__full_name", "traveler__cnic", "package__title")
    raw_id_fields = ("traveler", "package")
    readonly_fields = ("id", "final_agreed_price", "created_at", "updated_at")
    inlines = [PaymentInline]
    fieldsets = (
        ("Enrollment Reference", {"fields": ("id", "enrollment_number", "status", "created_by")}),
        ("Traveler & Tour Package", {"fields": ("traveler", "package", "enrolled_date")}),
        ("Financial Contract", {"fields": ("base_price_applied", "extra_amount", "discount", "final_agreed_price")}),
        ("Special Client Requests", {"fields": ("special_requests",)}),
        ("Audit Metadata", {"fields": ("created_at", "updated_at")}),
    )


@admin.register(TravelerPayment)
class TravelerPaymentAdmin(admin.ModelAdmin):
    list_display = (
        "receipt_number",
        "enrollment",
        "amount",
        "payment_method",
        "payment_date",
        "reference_number",
        "recorded_by",
    )
    list_filter = ("payment_method", "payment_date")
    search_fields = (
        "receipt_number",
        "reference_number",
        "enrollment__enrollment_number",
        "enrollment__traveler__full_name",
        "enrollment__traveler__cnic",
    )
    raw_id_fields = ("enrollment",)
    readonly_fields = ("id", "created_at", "updated_at")
    fieldsets = (
        ("Receipt Identification", {"fields": ("id", "receipt_number", "recorded_by")}),
        ("Enrollment Contract", {"fields": ("enrollment",)}),
        ("Payment Transaction Details", {"fields": ("amount", "payment_date", "payment_method", "reference_number")}),
        ("Narration / Notes", {"fields": ("notes",)}),
        ("Audit Metadata", {"fields": ("created_at", "updated_at")}),
    )
