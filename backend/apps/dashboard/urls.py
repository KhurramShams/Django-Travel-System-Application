"""URL configuration for dashboard analytics and central transactions."""

from django.urls import path

from apps.dashboard.views import (
    DashboardMetricsAPIView,
    MonthlyCashflowAPIView,
    PackageOccupancyAPIView,
    ReceivablesBreakdownAPIView,
    CentralLedgerAPIView,
)

app_name = "dashboard"

urlpatterns = [
    path("metrics/", DashboardMetricsAPIView.as_view(), name="metrics"),
    path("charts/monthly-cashflow/", MonthlyCashflowAPIView.as_view(), name="monthly-cashflow"),
    path("charts/package-distribution/", PackageOccupancyAPIView.as_view(), name="package-distribution"),
    path("charts/receivables-breakdown/", ReceivablesBreakdownAPIView.as_view(), name="receivables-breakdown"),
    path("transactions/", CentralLedgerAPIView.as_view(), name="transactions"),
]
