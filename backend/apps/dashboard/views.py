"""Views for executive dashboard analytics and Central Transaction Ledger."""

from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.dashboard.services.aggregation_service import (
    get_dashboard_metrics,
    get_monthly_cashflow,
    get_package_occupancy,
    get_receivables_breakdown,
)
from apps.dashboard.services.ledger_service import get_consolidated_ledger
from apps.dashboard.serializers import (
    DashboardMetricsSerializer,
    MonthlyCashflowItemSerializer,
    PackageOccupancyItemSerializer,
    ReceivablesBreakdownSerializer,
    LedgerEntrySerializer,
)


class DashboardMetricsAPIView(APIView):
    """Returns aggregated high-level KPIs for executive cards."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")
        data = get_dashboard_metrics(start_date=start_date, end_date=end_date)
        serializer = DashboardMetricsSerializer(data)
        return Response({
            "success": True,
            "metrics": serializer.data,
        })


class MonthlyCashflowAPIView(APIView):
    """Returns chronological cash inflows, outflows, and net margin."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        months = int(request.query_params.get("months", 6))
        months = min(max(months, 3), 12)
        data = get_monthly_cashflow(num_months=months)
        serializer = MonthlyCashflowItemSerializer(data, many=True)
        return Response({
            "success": True,
            "data": serializer.data,
        })


class PackageOccupancyAPIView(APIView):
    """Returns enrollment counts vs capacity for active packages."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        data = get_package_occupancy()
        serializer = PackageOccupancyItemSerializer(data, many=True)
        return Response({
            "success": True,
            "data": serializer.data,
        })


class ReceivablesBreakdownAPIView(APIView):
    """Returns count and values of enrollments in Paid, Partial, and Unpaid status."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        data = get_receivables_breakdown()
        serializer = ReceivablesBreakdownSerializer(data)
        return Response({
            "success": True,
            "data": serializer.data,
        })


class CentralLedgerAPIView(APIView):
    """Unified read-only ledger consolidating transactions across all modules."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")
        source_module = request.query_params.get("source_module")
        transaction_type = request.query_params.get("transaction_type")
        payment_mode = request.query_params.get("payment_mode")
        search = request.query_params.get("search")

        try:
            page = int(request.query_params.get("page", 1))
        except (ValueError, TypeError):
            page = 1

        try:
            page_size = int(request.query_params.get("page_size", 20))
        except (ValueError, TypeError):
            page_size = 20

        data = get_consolidated_ledger(
            start_date=start_date,
            end_date=end_date,
            source_module=source_module,
            transaction_type=transaction_type,
            payment_mode=payment_mode,
            search=search,
            page=page,
            page_size=page_size,
        )

        serializer = LedgerEntrySerializer(data["results"], many=True)

        return Response({
            "success": True,
            "pagination": data["pagination"],
            "summary": data["summary"],
            "results": serializer.data,
        })
