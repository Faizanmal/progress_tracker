"""
Serializers for audit app.
"""
from rest_framework import serializers
from .models import AuditLog, ChangeSnapshot, AuditLogSearch


class ChangeSnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChangeSnapshot
        fields = ['id', 'snapshot_type', 'snapshot_data', 'created_at']


class AuditLogSerializer(serializers.ModelSerializer):
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    content_type_name = serializers.CharField(source='content_type.model', read_only=True)
    snapshots = ChangeSnapshotSerializer(many=True, read_only=True)
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'user_email', 'user_name', 'content_type_name',
            'object_id', 'object_repr', 'action', 'action_display',
            'action_category', 'severity', 'changes', 'message', 'metadata',
            'ip_address', 'user_agent', 'request_id', 'snapshots', 'timestamp'
        ]


class AuditLogListSerializer(serializers.ModelSerializer):
    """Lighter serializer for list views."""
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    content_type_name = serializers.CharField(source='content_type.model', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'user_name', 'content_type_name', 'object_repr',
            'action', 'action_display', 'severity', 'message', 'timestamp'
        ]


class AuditLogSearchSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLogSearch
        fields = [
            'id', 'name', 'description', 'filters', 'is_subscribed',
            'notify_on_match', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
