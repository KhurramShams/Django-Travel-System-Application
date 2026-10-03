"""User model and Role-Based Access Control definitions."""

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.common.models import BaseModel


class RoleChoices(models.TextChoices):
    """System-wide RBAC roles."""

    ADMIN = "Admin", _("Admin")
    AGENT = "Agent", _("Agent")
    ACCOUNTANT = "Accountant", _("Accountant")


class UserManager(BaseUserManager):
    """Custom manager for Karwan-e-Asotvi User model."""

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_("The Email field is required."))
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", RoleChoices.ADMIN)

        if extra_fields.get("is_staff") is not True:
            raise ValueError(_("Superuser must have is_staff=True."))
        if extra_fields.get("is_superuser") is not True:
            raise ValueError(_("Superuser must have is_superuser=True."))

        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin, BaseModel):
    """Custom User model synced with Supabase Auth identities."""

    supabase_uid = models.CharField(
        max_length=128,
        unique=True,
        db_index=True,
        help_text="Supabase Auth User UUID (sub claim)",
    )
    email = models.EmailField(
        _("email address"),
        unique=True,
        db_index=True,
    )
    first_name = models.CharField(_("first name"), max_length=150, blank=True)
    last_name = models.CharField(_("last name"), max_length=150, blank=True)
    phone_number = models.CharField(
        _("phone number"),
        max_length=32,
        blank=True,
        help_text="Contact telephone / WhatsApp number",
    )
    role = models.CharField(
        max_length=20,
        choices=RoleChoices.choices,
        default=RoleChoices.AGENT,
        db_index=True,
        help_text="Designated system role for RBAC permissions",
    )
    is_active = models.BooleanField(
        _("active"),
        default=True,
        help_text="Designates whether this user account should be treated as active.",
    )
    is_staff = models.BooleanField(
        _("staff status"),
        default=False,
        help_text="Designates whether the user can log into the Django admin site.",
    )

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = _("user")
        verbose_name_plural = _("users")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.email} ({self.role})"

    @property
    def full_name(self) -> str:
        name = f"{self.first_name} {self.last_name}".strip()
        return name if name else self.email

    def get_full_name(self) -> str:
        return self.full_name

    def get_short_name(self) -> str:
        return self.first_name or self.email

    @property
    def is_admin(self) -> bool:
        return self.role == RoleChoices.ADMIN or self.is_superuser

    @property
    def is_agent(self) -> bool:
        return self.role in [RoleChoices.ADMIN, RoleChoices.AGENT] or self.is_superuser

    @property
    def is_accountant(self) -> bool:
        return self.role in [RoleChoices.ADMIN, RoleChoices.ACCOUNTANT] or self.is_superuser
