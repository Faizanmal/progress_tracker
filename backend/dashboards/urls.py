"""
URL configuration for dashboards app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    DashboardViewSet, DashboardWidgetViewSet,
    WidgetTemplateViewSet, DashboardTemplateViewSet
)

router = DefaultRouter()
router.register(r'dashboards', DashboardViewSet, basename='dashboard')
router.register(r'widgets', DashboardWidgetViewSet, basename='widget')
router.register(r'widget-templates', WidgetTemplateViewSet, basename='widget-template')
router.register(r'dashboard-templates', DashboardTemplateViewSet, basename='dashboard-template')

urlpatterns = [
    path('', include(router.urls)),
]
