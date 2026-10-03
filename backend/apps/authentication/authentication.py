"""Custom Supabase JWT Authentication class for Django REST Framework."""

import logging
import jwt
from django.conf import settings
from rest_framework import authentication, exceptions
from .models import User, RoleChoices

logger = logging.getLogger(__name__)


class SupabaseAuthentication(authentication.BaseAuthentication):
    """Authenticate DRF requests by validating Supabase Auth JWT tokens.

    Extracts Bearer token from the 'Authorization' header, verifies the signature against
    the Supabase JWT secret, extracts the user UID (`sub`), and retrieves or syncs
    the corresponding Django User record.
    """

    keyword = "Bearer"

    def authenticate(self, request):
        auth_header = authentication.get_authorization_header(request).split()

        if not auth_header:
            return None

        if len(auth_header) == 1:
            raise exceptions.AuthenticationFailed(
                "Invalid Authorization header. No credential provided."
            )
        elif len(auth_header) > 2:
            raise exceptions.AuthenticationFailed(
                "Invalid Authorization header. Token string should not contain spaces."
            )

        if auth_header[0].decode().lower() != self.keyword.lower():
            return None

        raw_token = auth_header[1].decode()
        return self.authenticate_credentials(raw_token)

    def authenticate_credentials(self, raw_token: str):
        jwt_secret = getattr(settings, "SUPABASE_JWT_SECRET", None)
        if not jwt_secret:
            logger.error("SUPABASE_JWT_SECRET is not configured in Django settings.")
            raise exceptions.AuthenticationFailed(
                "Authentication service misconfigured. Contact system administrator."
            )

        algorithm = getattr(settings, "SUPABASE_JWT_ALGORITHM", "HS256")
        audience = getattr(settings, "SUPABASE_JWT_AUDIENCE", "authenticated")

        try:
            # First attempt verification with audience
            try:
                payload = jwt.decode(
                    raw_token,
                    jwt_secret,
                    algorithms=[algorithm],
                    audience=audience,
                    options={"verify_exp": True},
                )
            except jwt.InvalidAudienceError:
                # Some Supabase setups do not set standard audience; fallback to signature verification
                payload = jwt.decode(
                    raw_token,
                    jwt_secret,
                    algorithms=[algorithm],
                    options={"verify_exp": True, "verify_aud": False},
                )
        except jwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed("Authentication token has expired.")
        except jwt.InvalidTokenError as err:
            logger.warning("Invalid Supabase JWT token: %s", err)
            raise exceptions.AuthenticationFailed(f"Invalid authentication token: {str(err)}")

        supabase_uid = payload.get("sub")
        if not supabase_uid:
            raise exceptions.AuthenticationFailed("Token payload missing user identifier ('sub').")

        # Extract user profile details from token claims
        email = payload.get("email") or f"{supabase_uid}@placeholder.supabase.co"
        user_metadata = payload.get("user_metadata") or {}
        app_metadata = payload.get("app_metadata") or {}

        # Determine role from metadata or fallback to default
        raw_role = app_metadata.get("role") or user_metadata.get("role") or RoleChoices.AGENT
        normalized_role = RoleChoices.AGENT
        for choice in RoleChoices.values:
            if choice.lower() == str(raw_role).lower():
                normalized_role = choice
                break

        first_name = user_metadata.get("first_name", "")
        last_name = user_metadata.get("last_name", "")
        phone_number = user_metadata.get("phone", "")

        # Synchronize Django User
        try:
            user, created = User.objects.get_or_create(
                supabase_uid=supabase_uid,
                defaults={
                    "email": email,
                    "first_name": first_name,
                    "last_name": last_name,
                    "phone_number": phone_number,
                    "role": normalized_role,
                    "is_active": True,
                },
            )

            # Update email or role if changed in Supabase
            updated_fields = []
            if user.email != email and email and not User.objects.filter(email=email).exclude(id=user.id).exists():
                user.email = email
                updated_fields.append("email")
            if first_name and user.first_name != first_name:
                user.first_name = first_name
                updated_fields.append("first_name")
            if last_name and user.last_name != last_name:
                user.last_name = last_name
                updated_fields.append("last_name")

            if updated_fields:
                user.save(update_fields=updated_fields)

            if not user.is_active:
                raise exceptions.AuthenticationFailed("User account is inactive or disabled.")

            return user, payload

        except Exception as exc:
            logger.exception("Error synchronizing Supabase user: %s", exc)
            raise exceptions.AuthenticationFailed("Could not resolve authenticated user account.")

    def authenticate_header(self, request):
        return self.keyword
