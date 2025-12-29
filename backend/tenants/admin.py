"""
Admin configuration for tenants app.
"""
from django.contrib import admin
from .models import Tenant, TenantBranding, TenantInvitation, TenantAuditLog, TenantUsageStats


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ['company', 'slug', 'plan', 'status', 'current_users', 'max_users', 'created_at']
    list_filter = ['plan', 'status']
    search_fields = ['company__name', 'slug', 'subdomain']
    readonly_fields = ['current_users', 'current_projects', 'storage_used_bytes']


@admin.register(TenantBranding)
class TenantBrandingAdmin(admin.ModelAdmin):
    list_display = ['tenant', 'primary_color', 'font_family', 'updated_at']
    search_fields = ['tenant__company__name']


@admin.register(TenantInvitation)
class TenantInvitationAdmin(admin.ModelAdmin):
    list_display = ['email', 'tenant', 'role', 'status', 'invited_by', 'expires_at']
    list_filter = ['status', 'role']
    search_fields = ['email', 'tenant__company__name']


@admin.register(TenantAuditLog)
class TenantAuditLogAdmin(admin.ModelAdmin):
    list_display = ['tenant', 'user', 'action', 'resource_type', 'created_at']
    list_filter = ['action', 'resource_type']
    search_fields = ['tenant__company__name', 'user__name']


@admin.register(TenantUsageStats)
class TenantUsageStatsAdmin(admin.ModelAdmin):
    list_display = ['tenant', 'date', 'active_users', 'tasks_created', 'api_requests']
    list_filter = ['date']
    search_fields = ['tenant__company__name']
