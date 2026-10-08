"""Production settings for Khas Travels backend."""

import os
from .base import *  # noqa: F401, F403

DEBUG = False

SECRET_KEY = os.environ.get("SECRET_KEY", "django-insecure-khas-travels-production-build-key")

raw_hosts = os.environ.get("ALLOWED_HOSTS", "*,.vercel.app,localhost,127.0.0.1")
ALLOWED_HOSTS = [h.strip() for h in raw_hosts.split(",") if h.strip()]

# CSRF Trusted Origins for Vercel and production domains
raw_csrf = os.environ.get("CSRF_TRUSTED_ORIGINS", "https://*.vercel.app")
CSRF_TRUSTED_ORIGINS = [o.strip().rstrip("/") for o in raw_csrf.split(",") if o.strip()]

# Static files serving with WhiteNoise
MIDDLEWARE.insert(1, "whitenoise.middleware.WhiteNoiseMiddleware")  # noqa: F405
STATICFILES_STORAGE = "whitenoise.storage.CompressedStaticFilesStorage"
WHITENOISE_USE_FINDERS = True
WHITENOISE_MANIFEST_STRICT = False

# Security enhancements
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = os.environ.get("SECURE_SSL_REDIRECT", "True").lower() == "true"
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"

# CORS configuration for Vercel deployments
CORS_ALLOW_ALL_ORIGINS = os.environ.get("CORS_ALLOW_ALL_ORIGINS", "False").lower() == "true"
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https:\/\/.*\.vercel\.app$",
]
