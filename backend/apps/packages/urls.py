"""URL routing for packages, enrollments, payments, and financial reports."""

from django.urls import path
from .views import (
    TravelPackageListCreateView,
    TravelPackageDetailView,
    TravelPackageRosterView,
    PackageEnrollmentListCreateView,
    PackageEnrollmentDetailView,
    PackageEnrollmentCancelView,
    PackageEnrollmentInvoiceView,
    TravelerPaymentListCreateView,
    TravelerPaymentDetailView,
    RemainingBalancesReportView,
    SettledBalancesReportView,
)

app_name = "packages"

urlpatterns = [
    # Packages
    path("packages/", TravelPackageListCreateView.as_view(), name="package-list-create"),
    path("packages/<uuid:pk>/", TravelPackageDetailView.as_view(), name="package-detail"),
    path("packages/<uuid:pk>/roster/", TravelPackageRosterView.as_view(), name="package-roster"),

    # Enrollments
    path("enrollments/", PackageEnrollmentListCreateView.as_view(), name="enrollment-list-create"),
    path("enrollments/<uuid:pk>/", PackageEnrollmentDetailView.as_view(), name="enrollment-detail"),
    path("enrollments/<uuid:pk>/cancel/", PackageEnrollmentCancelView.as_view(), name="enrollment-cancel"),
    path("enrollments/<uuid:pk>/invoice/", PackageEnrollmentInvoiceView.as_view(), name="enrollment-invoice"),

    # Payments
    path("payments/", TravelerPaymentListCreateView.as_view(), name="payment-list-create"),
    path("payments/<uuid:pk>/", TravelerPaymentDetailView.as_view(), name="payment-detail"),

    # Reports
    path("reports/balances/remaining/", RemainingBalancesReportView.as_view(), name="report-remaining-balances"),
    path("reports/balances/settled/", SettledBalancesReportView.as_view(), name="report-settled-balances"),
]
