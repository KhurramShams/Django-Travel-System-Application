"""Authentication and User management views."""

import datetime
import jwt
from django.conf import settings
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


class LoginView(APIView):
    """Testing & Standard authentication endpoint supporting username 'admin' and password 'admin123'."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get("username") or request.data.get("email", "")
        password = request.data.get("password", "")

        username = str(username).strip().lower()

        # Support test credentials
        is_admin_test = (username in ["admin", "admin@karwan-travels.com"] and password == "admin123")
        is_agent_test = (username in ["agent", "agent@karwan-travels.com"] and password in ["agent123", "Agent@123456"])
        is_accountant_test = (username in ["accountant", "accountant@karwan-travels.com"] and password in ["accountant123", "Accountant@123456"])

        if not (is_admin_test or is_agent_test or is_accountant_test):
            return Response(
                {"error": "Invalid username or password. For testing use username 'admin' and password 'admin123'"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if is_admin_test:
            role = RoleChoices.ADMIN
            email = "admin@karwan-travels.com"
            first_name = "System"
            last_name = "Admin"
            uid = "00000000-0000-0000-0000-000000000001"
        elif is_agent_test:
            role = RoleChoices.AGENT
            email = "agent@karwan-travels.com"
            first_name = "Operations"
            last_name = "Agent"
            uid = "00000000-0000-0000-0000-000000000002"
        else:
            role = RoleChoices.ACCOUNTANT
            email = "accountant@karwan-travels.com"
            first_name = "Finance"
            last_name = "Accountant"
            uid = "00000000-0000-0000-0000-000000000003"

        user, _ = User.objects.get_or_create(
            email=email,
            defaults={
                "supabase_uid": uid,
                "first_name": first_name,
                "last_name": last_name,
                "role": role,
                "is_active": True,
            },
        )
        if not user.is_active:
            user.is_active = True
            user.save(update_fields=["is_active"])
        if user.role != role:
            user.role = role
            user.save(update_fields=["role"])

        jwt_secret = getattr(
            settings,
            "SUPABASE_JWT_SECRET",
            "super-secret-jwt-token-with-at-least-32-characters-for-supabase-hs256",
        )
        algorithm = getattr(settings, "SUPABASE_JWT_ALGORITHM", "HS256")
        now = datetime.datetime.now(datetime.timezone.utc)
        exp = now + datetime.timedelta(days=30)

        payload = {
            "sub": str(user.supabase_uid),
            "email": user.email,
            "role": "authenticated",
            "aud": "authenticated",
            "app_metadata": {"role": user.role},
            "user_metadata": {
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role,
            },
            "iat": int(now.timestamp()),
            "exp": int(exp.timestamp()),
        }

        token = jwt.encode(payload, jwt_secret, algorithm=algorithm)
        if isinstance(token, bytes):
            token = token.decode("utf-8")

        return Response(
            {
                "access_token": token,
                "user": UserSerializer(user).data,
                "role": user.role,
            }
        )

