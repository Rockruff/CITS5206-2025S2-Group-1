"""
Minimal Django settings for a pure API server using DRF + JWT.
No admin, no sessions, no CSRF, no static files.
"""

from pathlib import Path
from datetime import timedelta

# ---------------------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = "django-insecure-qo)_gzi#xoz-w+skepb$lq*k5u$sli4o5_gaauyf_iq5$c(8s3"
DEBUG = True
ALLOWED_HOSTS = []

# ---------------------------------------------------------------------

INSTALLED_APPS = [
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "rest_framework",
    "core",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.middleware.common.CommonMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"

# ---------------------------------------------------------------------

REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "AUTH_HEADER_TYPES": ["Bearer"],
}

# ---------------------------------------------------------------------

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

AUTH_USER_MODEL = "core.User"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ---------------------------------------------------------------------

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Australia/Perth"
USE_I18N = True
USE_TZ = True
