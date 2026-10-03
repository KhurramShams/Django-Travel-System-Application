"""Authentication and User management views."""

from django.db import models
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import User, RoleChoices
from .permissions import IsAdmin
from .serializers import (
    UserSerializer,
    UserProfileUpdateSerializer,
    UserAdminUpdateSerializer,
    UserSyncSerializer,
)


class CurrentUserView(generics.RetrieveUpdateAPIView):
    """Retrieve or update profile details of currently authenticated user."""

    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ["PUT", "PATCH"]:
            return UserProfileUpdateSerializer
        return UserSerializer

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", True)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(UserSerializer(instance).data)


class UserListView(generics.ListCreateAPIView):
    """List all registered users or register new system users (Admin only)."""

    permission_classes = [IsAdmin]
    serializer_class = UserSerializer

    def get_queryset(self):
        queryset = User.objects.all()
        role = self.request.query_params.get("role")
        search = self.request.query_params.get("search")

        if role and role in RoleChoices.values:
            queryset = queryset.filter(role=role)
        if search:
            queryset = queryset.filter(
                models.Q(email__icontains=search)
                | models.Q(first_name__icontains=search)
                | models.Q(last_name__icontains=search)
            )
        return queryset


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, modify role/status, or deactivate a specific user (Admin only)."""

    permission_classes = [IsAdmin]
    queryset = User.objects.all()
    lookup_field = "pk"

    def get_serializer_class(self):
        if self.request.method in ["PUT", "PATCH"]:
            return UserAdminUpdateSerializer
        return UserSerializer

    def perform_destroy(self, instance):
        # Soft delete by deactivating rather than hard deleting to preserve audit trails
        instance.is_active = False
        instance.save(update_fields=["is_active", "updated_at"])


class SyncUserView(APIView):
    """Explicitly synchronize user identity from Supabase Auth into Django."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = UserSyncSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        user, created = User.objects.get_or_create(
            supabase_uid=data["supabase_uid"],
            defaults={
                "email": data["email"],
                "first_name": data.get("first_name", ""),
                "last_name": data.get("last_name", ""),
                "phone_number": data.get("phone_number", ""),
                "role": data.get("role", RoleChoices.AGENT),
            },
        )

        if not created:
            user.email = data["email"]
            if data.get("first_name"):
                user.first_name = data["first_name"]
            if data.get("last_name"):
                user.last_name = data["last_name"]
            if data.get("phone_number"):
                user.phone_number = data["phone_number"]
            user.save()

        return Response(
            {
                "success": True,
                "created": created,
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )
