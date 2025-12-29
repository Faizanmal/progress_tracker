"""
Admin configuration for audit app.
"""
from django.contrib import admin
from .models import AuditLog, ChangeSnapshot, AuditLogSearch


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['user_name', 'action', 'content_type', 'object_repr', 'timestamp']
    list_filter = ['action', 'action_category', 'severity', 'content_type']
    search_fields = ['user_name', 'user_email', 'object_repr', 'message']
    readonly_fields = ['id', 'timestamp', 'changes', 'old_values', 'new_values']
    date_hierarchy = 'timestamp'


@admin.register(ChangeSnapshot)
class ChangeSnapshotAdmin(admin.ModelAdmin):
    list_display = ['audit_log', 'snapshot_type', 'created_at']
    list_filter = ['snapshot_type']


@admin.register(AuditLogSearch)
class AuditLogSearchAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'is_subscribed', 'created_at']
    list_filter = ['is_subscribed', 'notify_on_match']
    search_fields = ['name', 'user__name']
