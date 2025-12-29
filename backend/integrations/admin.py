"""
Admin configuration for integrations app.
"""
from django.contrib import admin
from .models import (
    CalendarConnection, CalendarEvent, FileAttachment, FileVersion,
    APIKey, APIRequestLog, WebhookEndpoint, WebhookDelivery
)


@admin.register(CalendarConnection)
class CalendarConnectionAdmin(admin.ModelAdmin):
    list_display = ['user', 'provider', 'sync_status', 'last_sync', 'created_at']
    list_filter = ['provider', 'sync_status']
    search_fields = ['user__name', 'user__email']
    readonly_fields = ['access_token', 'refresh_token']


@admin.register(CalendarEvent)
class CalendarEventAdmin(admin.ModelAdmin):
    list_display = ['title', 'connection', 'start_time', 'end_time', 'task']
    list_filter = ['sync_direction', 'all_day']
    search_fields = ['title', 'connection__user__name']


@admin.register(FileAttachment)
class FileAttachmentAdmin(admin.ModelAdmin):
    list_display = ['original_filename', 'content_type', 'version', 'uploaded_by', 'created_at']
    list_filter = ['content_type', 'storage_provider', 'is_latest']
    search_fields = ['original_filename', 'uploaded_by__name']


@admin.register(FileVersion)
class FileVersionAdmin(admin.ModelAdmin):
    list_display = ['attachment', 'version_number', 'uploaded_by', 'created_at']
    search_fields = ['attachment__original_filename']


@admin.register(APIKey)
class APIKeyAdmin(admin.ModelAdmin):
    list_display = ['name', 'company', 'key_prefix', 'is_active', 'last_used', 'request_count']
    list_filter = ['is_active', 'company']
    search_fields = ['name', 'company__name']
    readonly_fields = ['key', 'key_prefix', 'request_count']


@admin.register(APIRequestLog)
class APIRequestLogAdmin(admin.ModelAdmin):
    list_display = ['api_key', 'method', 'endpoint', 'response_status', 'created_at']
    list_filter = ['method', 'response_status']
    search_fields = ['endpoint', 'api_key__name']


@admin.register(WebhookEndpoint)
class WebhookEndpointAdmin(admin.ModelAdmin):
    list_display = ['name', 'url', 'company', 'is_active', 'failure_count', 'last_triggered']
    list_filter = ['is_active', 'company']
    search_fields = ['name', 'url']


@admin.register(WebhookDelivery)
class WebhookDeliveryAdmin(admin.ModelAdmin):
    list_display = ['webhook', 'event_type', 'status', 'attempt_count', 'created_at']
    list_filter = ['status', 'event_type']
    search_fields = ['webhook__name']
