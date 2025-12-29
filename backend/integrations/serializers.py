"""
Serializers for integrations app.
"""
from rest_framework import serializers
from .models import (
    CalendarConnection, CalendarEvent, FileAttachment, FileVersion,
    APIKey, APIRequestLog, WebhookEndpoint, WebhookDelivery
)


class CalendarConnectionSerializer(serializers.ModelSerializer):
    provider_display = serializers.CharField(source='get_provider_display', read_only=True)
    sync_status_display = serializers.CharField(source='get_sync_status_display', read_only=True)
    is_token_expired = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = CalendarConnection
        fields = [
            'id', 'provider', 'provider_display', 'calendar_id', 'calendar_name',
            'sync_tasks', 'sync_deadlines', 'sync_milestones', 'import_events_as_tasks',
            'two_way_sync', 'sync_status', 'sync_status_display', 'last_sync',
            'is_token_expired', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'last_sync', 'created_at', 'updated_at']


class CalendarEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = CalendarEvent
        fields = [
            'id', 'connection', 'external_event_id', 'task', 'project',
            'title', 'description', 'start_time', 'end_time', 'all_day',
            'location', 'sync_direction', 'last_synced'
        ]
        read_only_fields = ['id', 'last_synced']


class FileVersionSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.name', read_only=True)
    
    class Meta:
        model = FileVersion
        fields = [
            'id', 'version_number', 'file', 'file_size', 'change_summary',
            'uploaded_by', 'uploaded_by_name', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class FileAttachmentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.name', read_only=True)
    versions = FileVersionSerializer(many=True, read_only=True)
    file_size_display = serializers.SerializerMethodField()
    
    class Meta:
        model = FileAttachment
        fields = [
            'id', 'content_type', 'task', 'project', 'progress_update',
            'file', 'original_filename', 'file_size', 'file_size_display',
            'mime_type', 'storage_provider', 'external_url', 'version',
            'is_latest', 'uploaded_by', 'uploaded_by_name', 'description',
            'tags', 'versions', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'file_size', 'version', 'is_latest', 'created_at', 'updated_at']
    
    def get_file_size_display(self, obj):
        size = obj.file_size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024:
                return f"{size:.1f} {unit}"
            size /= 1024
        return f"{size:.1f} TB"


class FileAttachmentUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = FileAttachment
        fields = ['file', 'content_type', 'task', 'project', 'progress_update', 'description', 'tags']


class APIKeySerializer(serializers.ModelSerializer):
    key = serializers.CharField(read_only=True)
    
    class Meta:
        model = APIKey
        fields = [
            'id', 'name', 'key', 'key_prefix', 'permissions', 'rate_limit',
            'is_active', 'last_used', 'request_count', 'expires_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'key', 'key_prefix', 'last_used', 'request_count', 'created_at', 'updated_at']


class APIKeyCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = APIKey
        fields = ['name', 'permissions', 'rate_limit', 'expires_at']


class APIRequestLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = APIRequestLog
        fields = [
            'id', 'method', 'endpoint', 'response_status', 'response_time_ms',
            'ip_address', 'user_agent', 'created_at'
        ]


class WebhookEndpointSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebhookEndpoint
        fields = [
            'id', 'name', 'url', 'events', 'custom_headers', 'is_active',
            'last_triggered', 'failure_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'last_triggered', 'failure_count', 'created_at', 'updated_at']


class WebhookDeliverySerializer(serializers.ModelSerializer):
    class Meta:
        model = WebhookDelivery
        fields = [
            'id', 'webhook', 'event_type', 'payload', 'status',
            'response_status', 'response_body', 'error_message',
            'attempt_count', 'created_at', 'delivered_at'
        ]
