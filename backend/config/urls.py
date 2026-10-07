"""Root URL Configuration for Khas Travels backend."""

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


@api_view(["GET"])
@permission_classes([AllowAny])
def root_view(request):
    """Root view providing service metadata and API directory for Khas Travels."""
    return Response(
        {
            "name": "Khas Travels API",
            "version": "1.0.0",
            "status": "running",
            "message": "Welcome to Khas Travels Enterprise Management Backend API",
            "health_check": request.build_absolute_uri("/api/v1/health/"),
            "admin_portal": request.build_absolute_uri("/admin/"),
            "api_v1_endpoints": {
                "auth": request.build_absolute_uri("/api/v1/auth/"),
                "travelers": request.build_absolute_uri("/api/v1/travelers/"),
                "packages": request.build_absolute_uri("/api/v1/packages/"),
                "enrollments": request.build_absolute_uri("/api/v1/enrollments/"),
                "payments": request.build_absolute_uri("/api/v1/payments/"),
                "tickets": request.build_absolute_uri("/api/v1/tickets/"),
                "hotels": request.build_absolute_uri("/api/v1/hotels/"),
                "finance": request.build_absolute_uri("/api/v1/finance/"),
                "dashboard": request.build_absolute_uri("/api/v1/dashboard/"),
            },
            "timestamp": timezone.now().isoformat(),
        }
    )


urlpatterns = [
    path("", root_view, name="api-root"),
    path("admin/", admin.site.urls),
    path("api/v1/health/", health_check, name="health-check"),
    path("api/v1/auth/", include("apps.authentication.urls", namespace="authentication")),
    path("api/v1/travelers/", include("apps.travelers.urls", namespace="travelers")),
    path("api/v1/tickets/", include("apps.ticketing.urls", namespace="ticketing")),
    path("api/v1/hotels/", include("apps.hotels.urls", namespace="hotels")),
    path("api/v1/finance/", include("apps.finance.urls", namespace="finance")),
    path("api/v1/dashboard/", include("apps.dashboard.urls", namespace="dashboard")),
    path("api/v1/transactions/", include("apps.dashboard.urls_transactions")),
    path("api/v1/", include("apps.packages.urls", namespace="packages")),
]
