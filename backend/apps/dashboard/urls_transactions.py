"""URL configuration for direct /api/v1/transactions/ endpoint."""

from django.urls import path
from apps.dashboard.views import CentralLedgerAPIView

urlpatterns = [
    path("", CentralLedgerAPIView.as_view(), name="central-transactions-root"),
]
