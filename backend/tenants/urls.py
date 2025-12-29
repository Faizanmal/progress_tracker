"""
URL configuration for tenants app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    TenantViewSet, TenantBrandingViewSet, TenantInvitationViewSet,
    TenantAuditLogViewSet, TenantUsageStatsViewSet
)

router = DefaultRouter()
router.register(r'tenants', TenantViewSet, basename='tenant')
router.register(r'branding', TenantBrandingViewSet, basename='branding')
router.register(r'invitations', TenantInvitationViewSet, basename='invitation')
router.register(r'admin-logs', TenantAuditLogViewSet, basename='admin-log')
router.register(r'usage-stats', TenantUsageStatsViewSet, basename='usage-stats')

urlpatterns = [
    path('', include(router.urls)),
]
