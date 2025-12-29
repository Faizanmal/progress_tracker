"""
Admin configuration for dashboards app.
"""
from django.contrib import admin
from .models import Dashboard, DashboardWidget, WidgetTemplate, DashboardTemplate


@admin.register(Dashboard)
class DashboardAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'is_default', 'is_shared', 'created_at']
    list_filter = ['is_default', 'is_shared', 'theme']
    search_fields = ['name', 'user__name']


@admin.register(DashboardWidget)
class DashboardWidgetAdmin(admin.ModelAdmin):
    list_display = ['title', 'dashboard', 'widget_type', 'size', 'is_visible', 'order']
    list_filter = ['widget_type', 'size', 'is_visible']
    search_fields = ['title', 'dashboard__name']


@admin.register(WidgetTemplate)
class WidgetTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'widget_type', 'category', 'is_premium', 'usage_count']
    list_filter = ['widget_type', 'category', 'is_premium']
    search_fields = ['name']


@admin.register(DashboardTemplate)
class DashboardTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'target_role', 'is_featured', 'is_premium', 'usage_count']
    list_filter = ['target_role', 'is_featured', 'is_premium']
    search_fields = ['name']
