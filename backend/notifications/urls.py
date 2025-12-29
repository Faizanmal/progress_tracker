"""
URL configuration for notifications app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    NotificationRuleViewSet, NotificationDeliveryViewSet,
    SMSConfigurationViewSet, PushSubscriptionViewSet,
    NotificationDigestViewSet
)

router = DefaultRouter()
router.register(r'rules', NotificationRuleViewSet, basename='notification-rule')
router.register(r'deliveries', NotificationDeliveryViewSet, basename='notification-delivery')
router.register(r'sms-config', SMSConfigurationViewSet, basename='sms-config')
router.register(r'push-subscriptions', PushSubscriptionViewSet, basename='push-subscription')
router.register(r'digests', NotificationDigestViewSet, basename='notification-digest')

urlpatterns = [
    path('', include(router.urls)),
]
