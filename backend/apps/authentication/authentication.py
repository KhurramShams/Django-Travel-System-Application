"""Native Django JWT Authentication for Khas Travels Management System."""

import datetime
import logging
import uuid
import jwt
from django.conf import settings
from rest_framework import authentication, exceptions
from .models import User

logger = logging.getLogger(__name__)


def generate_jwt_for_user(user: User, expiration_days: int = 30) -> str:
    """Generates standard HS256 JWT signed with Django SECRET_KEY."""
    jwt_secret = getattr(settings, "JWT_SECRET", settings.SECRET_KEY)
    algorithm = getattr(settings, "JWT_ALGORITHM", "HS256")
    now = datetime.datetime.now(datetime.timezone.utc)
    exp = now + datetime.timedelta(days=expiration_days)

    payload = {
        "sub": str(user.id),
        "user_id": str(user.id),
        "email": user.email,
        "role": user.role,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
    }
    token = jwt.encode(payload, jwt_secret, algorithm=algorithm)
    if isinstance(token, bytes):
        token = token.decode("utf-8")
    return token


class JWTAuthentication(authentication.BaseAuthentication):
    """Authenticate DRF requests by validating Django-issued JWT tokens.

    Extracts Bearer token from the 'Authorization' header, verifies the signature against
    Django's SECRET_KEY / JWT_SECRET, extracts the user ID, and retrieves the User from DB.
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
        jwt_secret = getattr(settings, "JWT_SECRET", settings.SECRET_KEY)
        algorithm = getattr(settings, "JWT_ALGORITHM", "HS256")

        try:
            payload = jwt.decode(
                raw_token,
                jwt_secret,
                algorithms=[algorithm],
                options={"verify_exp": True, "verify_aud": False},
            )
        except jwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed("Authentication token has expired.")
        except jwt.InvalidTokenError as err:
            logger.warning("Invalid JWT token: %s", err)
            raise exceptions.AuthenticationFailed(f"Invalid authentication token: {str(err)}")

        user_id = payload.get("user_id") or payload.get("sub")
        if not user_id:
            raise exceptions.AuthenticationFailed("Token payload missing user identifier ('sub').")

        # Resolve user by UUID primary key or legacy supabase_uid
        user = None
        try:
            val_uuid = uuid.UUID(str(user_id))
            user = User.objects.filter(id=val_uuid).first()
        except (ValueError, TypeError):
            pass

        if not user:
            user = User.objects.filter(supabase_uid=str(user_id)).first()

        if not user:
            email = payload.get("email")
            if email:
                user = User.objects.filter(email__iexact=email).first()

        if not user:
            raise exceptions.AuthenticationFailed("User not found in system database.")

        if not user.is_active:
            raise exceptions.AuthenticationFailed("User account is inactive or disabled.")

        return (user, payload)

    def authenticate_header(self, request):
        return self.keyword


# Alias for seamless backwards compatibility
SupabaseAuthentication = JWTAuthentication
