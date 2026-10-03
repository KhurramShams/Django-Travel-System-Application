"""Role-Based Access Control (RBAC) permission classes."""

from rest_framework.permissions import BasePermission
from .models import RoleChoices


class IsAdmin(BasePermission):
    """Allows access only to users with the 'Admin' role or superuser status."""

    message = "Administrator privileges are required to perform this action."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user and user.is_authenticated and (user.role == RoleChoices.ADMIN or user.is_superuser)
        )


class IsAgent(BasePermission):
    """Allows access to users with 'Agent' or 'Admin' role."""

    message = "Agent or Administrator credentials are required to perform this action."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (user.role in [RoleChoices.AGENT, RoleChoices.ADMIN] or user.is_superuser)
        )


class IsAccountant(BasePermission):
    """Allows access to users with 'Accountant' or 'Admin' role."""

    message = "Accountant or Administrator credentials are required to perform this action."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (user.role in [RoleChoices.ACCOUNTANT, RoleChoices.ADMIN] or user.is_superuser)
        )


class HasRole:
    """Dynamic permission generator for specified roles."""

    def __init__(self, *allowed_roles):
        self.allowed_roles = allowed_roles

    def __call__(self):
        class DynamicRolePermission(BasePermission):
            message = f"One of the following roles is required: {', '.join(self.allowed_roles)}"

            def has_permission(self, request, view):
                user = request.user
                return bool(
                    user
                    and user.is_authenticated
                    and (user.role in self.allowed_roles or user.is_superuser)
                )

        return DynamicRolePermission


class IsSelfOrAdmin(BasePermission):
    """Allows access if the user is operating on their own record, or is an Administrator."""

    message = "You do not have permission to view or edit this resource."

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser or user.role == RoleChoices.ADMIN:
            return True
        return obj == user or getattr(obj, "user", None) == user
