"""Base abstract models providing timestamps and UUID primary keys."""

import uuid
from django.db import models


class UUIDModel(models.Model):
    """Abstract base model providing a UUID primary key."""

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="Globally unique identifier",
    )

    class Meta:
        abstract = True


class TimeStampedModel(models.Model):
    """Abstract base model tracking creation and update timestamps."""

    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text="Timestamp when record was created",
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Timestamp when record was last updated",
    )

    class Meta:
        abstract = True
        ordering = ["-created_at"]


class BaseModel(UUIDModel, TimeStampedModel):
    """Abstract base model combining UUID primary key and audit timestamps."""

    class Meta:
        abstract = True
        ordering = ["-created_at"]
