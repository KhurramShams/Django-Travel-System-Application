"""URL routing for agency tickets and refunds."""

from django.urls import path
from .views import (
    AgencyTicketListCreateView,
    AgencyTicketDetailView,
    AgencyTicketLookupView,
    TicketRefundListCreateView,
    TicketRefundDetailView,
    TicketingAnalyticsSummaryView,
)

app_name = "ticketing"

urlpatterns = [
    path("", AgencyTicketListCreateView.as_view(), name="ticket-list-create"),
    path("lookup/", AgencyTicketLookupView.as_view(), name="ticket-lookup"),
    path("analytics/summary/", TicketingAnalyticsSummaryView.as_view(), name="ticketing-analytics-summary"),
    path("refunds/", TicketRefundListCreateView.as_view(), name="refund-list-create"),
    path("refunds/<uuid:pk>/", TicketRefundDetailView.as_view(), name="refund-detail"),
    path("<uuid:pk>/", AgencyTicketDetailView.as_view(), name="ticket-detail"),
]
