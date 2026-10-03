"""Global exception handling for consistent API error responses."""

import logging
from django.core.exceptions import ValidationError as DjangoValidationError
from django.http import Http404
from rest_framework import exceptions, status
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """Normalize DRF and unexpected system exceptions into standardized error envelopes."""
    # Convert Django core exceptions to DRF exceptions if needed
    if isinstance(exc, DjangoValidationError):
        if hasattr(exc, "message_dict"):
            exc = exceptions.ValidationError(detail=exc.message_dict)
        elif hasattr(exc, "messages"):
            exc = exceptions.ValidationError(detail=exc.messages)
        else:
            exc = exceptions.ValidationError(detail=str(exc))
    elif isinstance(exc, Http404):
        exc = exceptions.NotFound(detail="Requested resource was not found.")

    response = exception_handler(exc, context)

    if response is not None:
        error_code = getattr(exc, "default_code", "error")
        error_message = "An error occurred while processing your request."

        # Extract meaningful high-level message if available
        if isinstance(response.data, dict):
            if "detail" in response.data:
                error_message = str(response.data["detail"])
            elif len(response.data) > 0:
                first_key = next(iter(response.data))
                val = response.data[first_key]
                if isinstance(val, list) and len(val) > 0:
                    error_message = f"{first_key}: {val[0]}"
                else:
                    error_message = f"{first_key}: {val}"
        elif isinstance(response.data, list) and len(response.data) > 0:
            error_message = str(response.data[0])

        formatted_payload = {
            "success": False,
            "error": {
                "status_code": response.status_code,
                "code": str(error_code),
                "message": error_message,
                "details": response.data,
            },
        }
        response.data = formatted_payload
        return response

    # Handle unhandled 500 exceptions
    logger.exception("Unhandled server exception: %s", exc, exc_info=context.get("request"))
    return Response(
        {
            "success": False,
            "error": {
                "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
                "code": "internal_server_error",
                "message": "An unexpected server error occurred. Please contact system support.",
                "details": str(exc) if hasattr(exc, "message") else "Internal error",
            },
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
