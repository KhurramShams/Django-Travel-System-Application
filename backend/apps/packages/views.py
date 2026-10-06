"""Views for Travel Packages, Enrollments, Payments, and Financial Ledger Reports."""

from decimal import Decimal
from django.db import models
from django.db.models import Sum, F, DecimalField, Value
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.authentication.permissions import IsAdmin, IsAgent, IsAccountant
from .models import (
    TravelPackage,
    PackageEnrollment,
    TravelerPayment,
    PackageStatus,
    EnrollmentStatus,
)
from .serializers import (
    TravelPackageSerializer,
    TravelPackageCreateUpdateSerializer,
    PackageEnrollmentListSerializer,
    PackageEnrollmentCreateSerializer,
    PackageEnrollmentDetailSerializer,
    TravelerPaymentSerializer,
)


class TravelPackageListCreateView(generics.ListCreateAPIView):
    """List travel package inventory or create a new package offering (Admin only for POST)."""

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAdmin()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return TravelPackageCreateUpdateSerializer
        return TravelPackageSerializer

    def get_queryset(self):
        queryset = TravelPackage.objects.all().prefetch_related("enrollments")
        search = self.request.query_params.get("search")
        pkg_status = self.request.query_params.get("status")
        location = self.request.query_params.get("location")
        star_rating = self.request.query_params.get("star_rating")

        if search:
            queryset = queryset.filter(
                models.Q(title__icontains=search)
                | models.Q(package_code__icontains=search)
                | models.Q(flight_name__icontains=search)
            )
        if pkg_status and pkg_status in PackageStatus.values:
            queryset = queryset.filter(status=pkg_status)
        if location:
            queryset = queryset.filter(location=location)
        if star_rating:
            queryset = queryset.filter(star_rating=star_rating)

        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        pkg = serializer.save()
        return Response(TravelPackageSerializer(pkg).data, status=status.HTTP_201_CREATED)


class TravelPackageDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve package details, update itinerary/pricing, or archive package."""

    queryset = TravelPackage.objects.all().prefetch_related("enrollments")
    lookup_field = "pk"

    def get_permissions(self):
        if self.request.method in ["PUT", "PATCH", "DELETE"]:
            return [IsAdmin()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.request.method in ["PUT", "PATCH"]:
            return TravelPackageCreateUpdateSerializer
        return TravelPackageSerializer

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", True)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(TravelPackageSerializer(instance).data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        active_enrolled_count = instance.enrollments.filter(status=EnrollmentStatus.ACTIVE).count()
        if active_enrolled_count > 0:
            return Response(
                {
                    "detail": f"Cannot delete package with {active_enrolled_count} active enrolled traveler(s). Remove travelers from package roster first.",
                    "error": f"Cannot delete package with {active_enrolled_count} active enrolled traveler(s). Remove travelers from package roster first.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        force = request.query_params.get("force") == "true"
        if instance.enrollments.exists() and not force:
            instance.status = PackageStatus.ARCHIVED
            instance.save(update_fields=["status", "updated_at"])
            return Response(status=status.HTTP_204_NO_CONTENT)
        if force:
            instance.enrollments.all().delete()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TravelPackageRosterView(APIView):
    """Retrieve full traveler roster for a designated travel package."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            package = TravelPackage.objects.get(pk=pk)
        except TravelPackage.DoesNotExist:
            return Response({"detail": "Package not found."}, status=status.HTTP_404_NOT_FOUND)

        enrollments = (
            package.enrollments.all()
            .select_related("traveler", "package")
            .prefetch_related("payments")
        )
        serializer = PackageEnrollmentListSerializer(enrollments, many=True)
        return Response(
            {
                "package_id": str(package.id),
                "package_title": package.title,
                "package_code": package.package_code,
                "capacity": package.capacity,
                "total_enrolled": package.total_enrolled,
                "seats_available": package.seats_available,
                "roster": serializer.data,
            }
        )


class PackageEnrollmentListCreateView(generics.ListCreateAPIView):
    """List travel enrollments with live financial summaries or enroll a new traveler."""

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAgent()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return PackageEnrollmentCreateSerializer
        return PackageEnrollmentListSerializer

    def get_queryset(self):
        queryset = (
            PackageEnrollment.objects.all()
            .select_related("traveler", "package")
            .prefetch_related("payments")
        )

        package_id = self.request.query_params.get("package_id")
        traveler_id = self.request.query_params.get("traveler_id")
        enr_status = self.request.query_params.get("status")
        search = self.request.query_params.get("search")

        if package_id:
            queryset = queryset.filter(package_id=package_id)
        if traveler_id:
            queryset = queryset.filter(traveler_id=traveler_id)
        if enr_status and enr_status in EnrollmentStatus.values:
            queryset = queryset.filter(status=enr_status)
        if search:
            queryset = queryset.filter(
                models.Q(enrollment_number__icontains=search)
                | models.Q(traveler__full_name__icontains=search)
                | models.Q(traveler__cnic__icontains=search)
                | models.Q(package__title__icontains=search)
            )

        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        enrollment = serializer.save()
        enrollment.refresh_from_db()
        return Response(
            PackageEnrollmentDetailSerializer(enrollment).data,
            status=status.HTTP_201_CREATED,
        )


class PackageEnrollmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve full enrollment contract, modify charges, or remove traveler from package."""

    lookup_field = "pk"

    def get_permissions(self):
        if self.request.method in ["PUT", "PATCH", "DELETE"]:
            return [IsAdmin()]
        return [IsAgent()]

    queryset = (
        PackageEnrollment.objects.all()
        .select_related("traveler", "package", "created_by")
        .prefetch_related("payments", "traveler__dependents")
    )
    serializer_class = PackageEnrollmentDetailSerializer

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        force = request.query_params.get("force") == "true"
        if instance.payments.exists() and not force:
            return Response(
                {
                    "detail": f"This traveler has PKR {instance.total_paid} recorded payments on this enrollment. Confirm removal with force=true to delete financial vouchers or cancel the enrollment instead.",
                    "error": f"This traveler has PKR {instance.total_paid} recorded payments on this enrollment. Confirm removal with force=true to delete financial vouchers or cancel the enrollment instead.",
                    "total_paid": str(instance.total_paid),
                    "payments_count": instance.payments.count(),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        if force:
            instance.payments.all().delete()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PackageEnrollmentCancelView(APIView):
    """Cancel an enrollment contract (Admin only)."""

    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            enrollment = PackageEnrollment.objects.get(pk=pk)
        except PackageEnrollment.DoesNotExist:
            return Response({"detail": "Enrollment not found."}, status=status.HTTP_404_NOT_FOUND)

        enrollment.status = EnrollmentStatus.CANCELLED
        enrollment.save(update_fields=["status", "updated_at"])

        return Response(
            {
                "success": True,
                "message": f"Enrollment {enrollment.enrollment_number} has been cancelled.",
                "enrollment": PackageEnrollmentDetailSerializer(enrollment).data,
            }
        )


class PackageEnrollmentInvoiceView(APIView):
    """Produces structured invoice payload for printable client receipt / voucher."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            enr = (
                PackageEnrollment.objects.select_related(
                    "traveler", "traveler__guardian", "package", "created_by"
                )
                .prefetch_related("payments", "traveler__dependents")
                .get(pk=pk)
            )
        except PackageEnrollment.DoesNotExist:
            return Response({"detail": "Enrollment not found."}, status=status.HTTP_404_NOT_FOUND)

        payments_data = [
            {
                "receipt_number": p.receipt_number,
                "amount": str(p.amount),
                "payment_date": p.payment_date,
                "payment_method": p.get_payment_method_display(),
                "reference_number": p.reference_number or "-",
                "notes": p.notes,
            }
            for p in enr.payments.all()
        ]

        dependents_data = [
            {
                "full_name": d.full_name,
                "cnic": d.cnic,
                "age_category": d.get_age_category_display(),
                "passport_number": d.passport_number or "-",
            }
            for d in enr.traveler.dependents.all()
        ]

        payload = {
            "agency": {
                "name": "Karwan-e-Asotvi Travels",
                "tagline": "Hajj, Umrah & International Tour Management",
                "contact": "+92 300 1234567 / info@karwan-travels.com",
                "address": "Main Boulevard, Gulberg III, Lahore, Pakistan",
            },
            "invoice": {
                "enrollment_number": enr.enrollment_number,
                "issue_date": timezone.now().date(),
                "enrolled_date": enr.enrolled_date,
                "status": enr.get_status_display(),
                "payment_status": enr.payment_status,
            },
            "traveler": {
                "id": str(enr.traveler.id),
                "full_name": enr.traveler.full_name,
                "cnic": enr.traveler.cnic,
                "phone_number": enr.traveler.phone_number,
                "passport_number": enr.traveler.passport_number or "N/A",
                "age_category": enr.traveler.get_age_category_display(),
                "guardian": enr.traveler.guardian.full_name if enr.traveler.guardian else None,
                "dependents": dependents_data,
            },
            "package": {
                "id": str(enr.package.id),
                "title": enr.package.title,
                "package_code": enr.package.package_code,
                "location": enr.package.get_location_display(),
                "star_rating": enr.package.get_star_rating_display(),
                "flight_name": enr.package.flight_name,
                "departure_date": enr.package.departure_date,
                "return_date": enr.package.return_date,
                "duration_days": enr.package.duration_days,
                "shuttle_service": enr.package.shuttle_service,
            },
            "financials": {
                "base_price_applied": str(enr.base_price_applied),
                "extra_amount": str(enr.extra_amount),
                "discount": str(enr.discount),
                "final_agreed_price": str(enr.final_agreed_price),
                "total_paid": str(enr.total_paid),
                "remaining_balance": str(enr.remaining_balance),
                "is_fully_paid": enr.remaining_balance <= Decimal("0.00"),
            },
            "payments_history": payments_data,
        }

        return Response(payload)


class TravelerPaymentListCreateView(generics.ListCreateAPIView):
    """List payment transactions or record a new client payment (Accountant/Admin only for POST)."""

    serializer_class = TravelerPaymentSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAccountant()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        queryset = (
            TravelerPayment.objects.all()
            .select_related("enrollment__traveler", "enrollment__package", "recorded_by")
        )
        enrollment_id = self.request.query_params.get("enrollment_id")
        method = self.request.query_params.get("payment_method")
        search = self.request.query_params.get("search")

        if enrollment_id:
            queryset = queryset.filter(enrollment_id=enrollment_id)
        if method:
            queryset = queryset.filter(payment_method=method)
        if search:
            queryset = queryset.filter(
                models.Q(receipt_number__icontains=search)
                | models.Q(reference_number__icontains=search)
                | models.Q(enrollment__traveler__full_name__icontains=search)
                | models.Q(enrollment__traveler__cnic__icontains=search)
            )

        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        payment = serializer.save()
        return Response(TravelerPaymentSerializer(payment).data, status=status.HTTP_201_CREATED)


class TravelerPaymentDetailView(generics.RetrieveAPIView):
    """Retrieve receipt details for an individual payment."""

    permission_classes = [permissions.IsAuthenticated]
    queryset = TravelerPayment.objects.all().select_related("enrollment__traveler", "recorded_by")
    serializer_class = TravelerPaymentSerializer
    lookup_field = "pk"


class RemainingBalancesReportView(APIView):
    """Report view listing all enrolled travelers with outstanding unpaid/partial balances."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        enrollments = (
            PackageEnrollment.objects.filter(status=EnrollmentStatus.ACTIVE)
            .select_related("traveler", "package")
            .prefetch_related("payments")
        )

        results = []
        for enr in enrollments:
            remaining = enr.remaining_balance
            if remaining > Decimal("0.00"):
                results.append(
                    {
                        "enrollment_id": str(enr.id),
                        "enrollment_number": enr.enrollment_number,
                        "traveler_id": str(enr.traveler.id),
                        "traveler_name": enr.traveler.full_name,
                        "traveler_cnic": enr.traveler.cnic,
                        "traveler_phone": enr.traveler.phone_number,
                        "package_title": enr.package.title,
                        "package_code": enr.package.package_code,
                        "departure_date": enr.package.departure_date,
                        "final_agreed_price": str(enr.final_agreed_price),
                        "total_paid": str(enr.total_paid),
                        "remaining_balance": str(remaining),
                        "payment_status": enr.payment_status,
                    }
                )

        return Response(
            {
                "count": len(results),
                "total_outstanding_amount": str(sum(Decimal(r["remaining_balance"]) for r in results)),
                "results": results,
            }
        )


class SettledBalancesReportView(APIView):
    """Report view listing all fully settled travelers (zero remaining balance)."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        enrollments = (
            PackageEnrollment.objects.all()
            .select_related("traveler", "package")
            .prefetch_related("payments")
        )

        results = []
        for enr in enrollments:
            remaining = enr.remaining_balance
            if remaining <= Decimal("0.00") and enr.total_paid > Decimal("0.00"):
                results.append(
                    {
                        "enrollment_id": str(enr.id),
                        "enrollment_number": enr.enrollment_number,
                        "traveler_id": str(enr.traveler.id),
                        "traveler_name": enr.traveler.full_name,
                        "traveler_cnic": enr.traveler.cnic,
                        "traveler_phone": enr.traveler.phone_number,
                        "package_title": enr.package.title,
                        "package_code": enr.package.package_code,
                        "departure_date": enr.package.departure_date,
                        "final_agreed_price": str(enr.final_agreed_price),
                        "total_paid": str(enr.total_paid),
                        "status": enr.status,
                    }
                )

        return Response(
            {
                "count": len(results),
                "total_settled_revenue": str(sum(Decimal(r["total_paid"]) for r in results)),
                "results": results,
            }
        )
