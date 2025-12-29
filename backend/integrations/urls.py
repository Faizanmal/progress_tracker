"""
URL configuration for integrations app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    CalendarConnectionViewSet, CalendarEventViewSet,
    FileAttachmentViewSet, APIKeyViewSet, WebhookEndpointViewSet
)

router = DefaultRouter()
router.register(r'calendar/connections', CalendarConnectionViewSet, basename='calendar-connection')
router.register(r'calendar/events', CalendarEventViewSet, basename='calendar-event')
router.register(r'files', FileAttachmentViewSet, basename='file-attachment')
router.register(r'api-keys', APIKeyViewSet, basename='api-key')
router.register(r'webhooks', WebhookEndpointViewSet, basename='webhook')

urlpatterns = [
    path('', include(router.urls)),
]
