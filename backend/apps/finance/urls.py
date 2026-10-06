"""URL configuration for Finance, Banking, Payments, and Expenses."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import BankAccountViewSet, OfficeExpenseViewSet, OfficePaymentViewSet

app_name = "finance"

router = DefaultRouter()
router.register(r"accounts", BankAccountViewSet, basename="bank-account")
router.register(r"payments", OfficePaymentViewSet, basename="office-payment")
router.register(r"expenses", OfficeExpenseViewSet, basename="office-expense")

urlpatterns = [
    path("", include(router.urls)),
]
