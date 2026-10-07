"""URL routing for Hotel Bookings and Accommodations."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import HotelBookingViewSet

app_name = "hotels"

router = DefaultRouter()
router.register(r"", HotelBookingViewSet, basename="hotel-booking")

urlpatterns = [
    path("", include(router.urls)),
]
