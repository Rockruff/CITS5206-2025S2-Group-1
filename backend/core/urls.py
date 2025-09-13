# core/urls.py
from django.urls import path, include
from .routers import router

urlpatterns = router.urls
