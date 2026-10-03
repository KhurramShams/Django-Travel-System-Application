"""URL routing for authentication and user management."""

from django.urls import path
from .views import (
    CurrentUserView,
    SyncUserView,
    UserListView,
    UserDetailView,
)

app_name = "authentication"

urlpatterns = [
    path("me/", CurrentUserView.as_view(), name="current-user"),
    path("sync/", SyncUserView.as_view(), name="sync-user"),
    path("users/", UserListView.as_view(), name="user-list"),
    path("users/<uuid:pk>/", UserDetailView.as_view(), name="user-detail"),
]
