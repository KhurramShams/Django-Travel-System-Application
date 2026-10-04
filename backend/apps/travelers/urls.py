"""URL routing for travelers and family hierarchy."""

from django.urls import path
from .views import (
    TravelerListCreateView,
    TravelerDetailView,
    TravelerLookupView,
    TravelerHistoryView,
)

app_name = "travelers"

urlpatterns = [
    path("", TravelerListCreateView.as_view(), name="traveler-list-create"),
    path("lookup/", TravelerLookupView.as_view(), name="traveler-lookup"),
    path("<uuid:pk>/", TravelerDetailView.as_view(), name="traveler-detail"),
    path("<uuid:pk>/history/", TravelerHistoryView.as_view(), name="traveler-history"),
]
