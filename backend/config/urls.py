"""Root URL Configuration for Karwan-e-Asotvi Travels backend."""

from django.contrib import admin
from django.urls import path, include
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.utils import timezone


from django.db import connection


@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    """System health check endpoint verifying live database connectivity."""
    db_status = "connected"
    try:
        connection.ensure_connection()
    except Exception as exc:
        db_status = f"disconnected: {str(exc)}"

    status_str = "healthy" if db_status == "connected" else "degraded"
    status_code = 200 if db_status == "connected" else 503

    return Response(
        {
            "status": status_str,
            "database": db_status,
            "timestamp": timezone.now().isoformat(),
        },
        status=status_code,
    )


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/health/", health_check, name="health-check"),
    path("api/v1/auth/", include("apps.authentication.urls", namespace="authentication")),
]
