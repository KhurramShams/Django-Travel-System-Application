"""Views for Traveler directory, registration, and debounced autocomplete."""

from django.db import models
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.authentication.permissions import IsAdmin, IsAgent
from apps.packages.models import EnrollmentStatus
from .models import Traveler, AgeCategory
from .serializers import (
    TravelerSerializer,
    TravelerCreateUpdateSerializer,
    TravelerLookupSerializer,
)


class TravelerListCreateView(generics.ListCreateAPIView):
    """List all registered travelers with family units or register a new traveler."""

    permission_classes = [IsAgent]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return TravelerCreateUpdateSerializer
        return TravelerSerializer

    def get_queryset(self):
        queryset = (
            Traveler.objects.all()
            .select_related("guardian")
            .prefetch_related("dependents", "enrollments__package")
        )
        search = self.request.query_params.get("search")
        age = self.request.query_params.get("age_category")
        has_guardian = self.request.query_params.get("has_guardian")

        if search:
            queryset = queryset.filter(
                models.Q(full_name__icontains=search)
                | models.Q(cnic__icontains=search)
                | models.Q(phone_number__icontains=search)
                | models.Q(passport_number__icontains=search)
            )
        if age and age in AgeCategory.values:
            queryset = queryset.filter(age_category=age)
        if has_guardian == "true":
            queryset = queryset.filter(guardian__isnull=False)
        elif has_guardian == "false":
            queryset = queryset.filter(guardian__isnull=True)

        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        traveler = serializer.save()
        return Response(TravelerSerializer(traveler).data, status=status.HTTP_201_CREATED)


class TravelerDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve full traveler dossier, update profile details, or archive profile."""

    queryset = (
        Traveler.objects.all()
        .select_related("guardian")
        .prefetch_related("dependents", "enrollments__package")
    )
    lookup_field = "pk"

    def get_permissions(self):
        if self.request.method in ["PUT", "PATCH", "DELETE"]:
            return [IsAdmin()]
        return [IsAgent()]

    def get_serializer_class(self):
        if self.request.method in ["PUT", "PATCH"]:
            return TravelerCreateUpdateSerializer
        return TravelerSerializer

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", True)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(TravelerSerializer(instance).data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        # Prevent deletion if active package enrollments exist
        active_enrollments = instance.enrollments.filter(status=EnrollmentStatus.ACTIVE)
        if active_enrollments.exists():
            pkg_title = active_enrollments.first().package.title
            return Response(
                {
                    "detail": f"Cannot delete traveler enrolled in active package '{pkg_title}'. Remove traveler from the package first.",
                    "error": f"Cannot delete traveler enrolled in active package '{pkg_title}'. Remove traveler from the package first.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        # Reassign dependents to avoid orphan foreign key errors
        instance.dependents.update(guardian=None)
        # Clean historical/cancelled enrollments
        instance.enrollments.all().delete()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TravelerLookupView(APIView):
    """Asynchronous lookup endpoint for traveler autocomplete in booking workflows."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        query = request.query_params.get("q", "").strip()
        if not query:
            return Response([])

        queryset = (
            Traveler.objects.filter(
                models.Q(full_name__icontains=query)
                | models.Q(cnic__icontains=query)
                | models.Q(phone_number__icontains=query)
                | models.Q(passport_number__icontains=query)
            )
            .select_related("guardian")
            .prefetch_related("enrollments__package")[:15]
        )

        serializer = TravelerLookupSerializer(queryset, many=True)
        return Response(serializer.data)


class TravelerHistoryView(APIView):
    """Retrieve complete tour history and financial contracts for a client."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            traveler = (
                Traveler.objects.select_related("guardian")
                .prefetch_related(
                    "dependents",
                    "enrollments__package",
                    "enrollments__payments__recorded_by",
                )
                .get(pk=pk)
            )
        except Traveler.DoesNotExist:
            return Response(
                {"detail": "Traveler not found."}, status=status.HTTP_404_NOT_FOUND
            )

        enrollments_data = []
        for enr in traveler.enrollments.all():
            enrollments_data.append(
                {
                    "id": str(enr.id),
                    "enrollment_number": enr.enrollment_number,
                    "package_title": enr.package.title,
                    "package_code": enr.package.package_code,
                    "departure_date": enr.package.departure_date,
                    "return_date": enr.package.return_date,
                    "enrolled_date": enr.enrolled_date,
                    "final_agreed_price": str(enr.final_agreed_price),
                    "total_paid": str(enr.total_paid),
                    "remaining_balance": str(enr.remaining_balance),
                    "payment_status": enr.payment_status,
                    "status": enr.status,
                    "payments_count": enr.payments.count(),
                }
            )

        return Response(
            {
                "traveler": TravelerSerializer(traveler).data,
                "enrollments": enrollments_data,
            }
        )
