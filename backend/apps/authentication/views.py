"""Authentication and User management views using Native Django DB & JWT."""

from django.db import models
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .authentication import generate_jwt_for_user
from .models import User, RoleChoices
from .permissions import IsAdmin
from .serializers import (
    UserSerializer,
    UserCreateSerializer,
    UserProfileUpdateSerializer,
    UserAdminUpdateSerializer,
    ChangePasswordSerializer,
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
    """List all registered users or register new system users / admins (Admin only)."""

    permission_classes = [IsAdmin]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return UserCreateSerializer
        return UserSerializer

    def get_queryset(self):
        queryset = User.objects.all().order_by("-created_at")
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

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {
                "success": True,
                "message": f"User {user.email} successfully created.",
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


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


class ChangePasswordView(APIView):
    """Allow logged in user to update their account password."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = request.user
        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password", "updated_at"])
        return Response({"success": True, "message": "Password changed successfully."})


class LoginView(APIView):
    """Native authentication endpoint: Validates against Django User table and returns JWT."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        identifier = str(request.data.get("email") or request.data.get("username") or "").strip()
        password = str(request.data.get("password") or "")

        if not identifier or not password:
            return Response(
                {"error": "Please provide both email/username and password."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Lookup user by email (case-insensitive) or common alias prefixes
        user = User.objects.filter(email__iexact=identifier).first()
        if not user:
            # Check with domain aliases
            for domain in ["@khastravels.com", "@karwan-travels.com"]:
                user = User.objects.filter(email__iexact=f"{identifier}{domain}").first()
                if user:
                    break

        # Check default credentials fallback for initial admin setup if password not yet migrated
        if user and not user.has_usable_password():
            if identifier.lower() in ["admin", "admin@khastravels.com", "admin@karwan-travels.com"] and password == "admin123":
                user.set_password("admin123")
                user.save(update_fields=["password"])
            elif identifier.lower() in ["agent", "agent@khastravels.com", "agent@karwan-travels.com"] and password in ["agent123", "Agent@123456"]:
                user.set_password("agent123")
                user.save(update_fields=["password"])
            elif identifier.lower() in ["accountant", "accountant@khastravels.com", "accountant@karwan-travels.com"] and password in ["accountant123", "Accountant@123456"]:
                user.set_password("accountant123")
                user.save(update_fields=["password"])

        # Authenticate against hashed password stored in DB
        if not user or not user.check_password(password):
            return Response(
                {"error": "Invalid email/username or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.is_active:
            return Response(
                {"error": "This account is inactive. Please contact your system administrator."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Update last login timestamp
        user.last_login = timezone.now()
        user.save(update_fields=["last_login"])

        # Generate native JWT token
        token = generate_jwt_for_user(user, expiration_days=30)

        return Response(
            {
                "success": True,
                "access_token": token,
                "user": UserSerializer(user).data,
                "role": user.role,
            },
            status=status.HTTP_200_OK,
        )


class SyncUserView(APIView):
    """Deprecated legacy endpoint - maintained for backwards compatibility."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        return Response(
            {"success": True, "message": "User synchronization handled directly in database."},
            status=status.HTTP_200_OK,
        )
