from django.contrib import admin
from .models import HotelBooking, HotelPayment


class HotelPaymentInline(admin.TabularInline):
    model = HotelPayment
    extra = 0
    readonly_fields = ["receipt_number", "recorded_by", "created_at"]
    can_delete = False


@admin.register(HotelBooking)
class HotelBookingAdmin(admin.ModelAdmin):
    list_display = [
        "booking_reference",
        "hotel_name",
        "location",
        "booking_date",
        "total_price",
        "advance_paid",
        "remaining_amount",
        "payment_status",
        "is_active",
    ]
    list_filter = ["location", "payment_status", "is_active", "booking_date"]
    search_fields = ["booking_reference", "hotel_name"]
    readonly_fields = ["booking_reference", "remaining_amount", "payment_status", "created_at", "updated_at"]
    inlines = [HotelPaymentInline]


@admin.register(HotelPayment)
class HotelPaymentAdmin(admin.ModelAdmin):
    list_display = [
        "receipt_number",
        "hotel_booking",
        "amount",
        "payment_date",
        "payment_method",
        "recorded_by",
    ]
    list_filter = ["payment_method", "payment_date"]
    search_fields = ["receipt_number", "hotel_booking__booking_reference", "hotel_booking__hotel_name"]
    readonly_fields = ["receipt_number", "created_at"]
