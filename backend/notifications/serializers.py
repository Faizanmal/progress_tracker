"""
Serializers for notifications app.
"""
from rest_framework import serializers
from .models import (
    NotificationRule, NotificationDelivery, SMSConfiguration,
    PushSubscription, NotificationDigest
)


class NotificationRuleSerializer(serializers.ModelSerializer):
    trigger_type_display = serializers.CharField(source='get_trigger_type_display', read_only=True)
    
    class Meta:
        model = NotificationRule
        fields = [
            'id', 'name', 'description', 'trigger_type', 'trigger_type_display',
            'conditions', 'projects', 'apply_to_assigned_only', 'channels',
            'notify_self', 'notify_assignee', 'notify_manager', 'notify_team',
            'additional_recipients', 'message_template', 'cooldown_minutes',
            'max_notifications_per_day', 'schedule_cron', 'is_active',
            'last_triggered', 'trigger_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'last_triggered', 'trigger_count', 'created_at', 'updated_at']


class NotificationRuleCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationRule
        fields = [
            'name', 'description', 'trigger_type', 'conditions', 'projects',
            'apply_to_assigned_only', 'channels', 'notify_self', 'notify_assignee',
            'notify_manager', 'notify_team', 'additional_recipients',
            'message_template', 'cooldown_minutes', 'max_notifications_per_day',
            'schedule_cron', 'is_active'
        ]


class NotificationDeliverySerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    recipient_name = serializers.CharField(source='recipient.name', read_only=True)
    
    class Meta:
        model = NotificationDelivery
        fields = [
            'id', 'rule', 'recipient', 'recipient_name', 'channel',
            'title', 'message', 'related_object_type', 'related_object_id',
            'action_url', 'status', 'status_display', 'error_message',
            'created_at', 'sent_at', 'delivered_at', 'read_at'
        ]


class SMSConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = SMSConfiguration
        fields = [
            'id', 'provider', 'from_number', 'monthly_limit',
            'messages_sent_this_month', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'messages_sent_this_month', 'created_at', 'updated_at']


class SMSConfigurationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SMSConfiguration
        fields = ['provider', 'account_sid', 'auth_token', 'from_number', 'monthly_limit']


class PushSubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PushSubscription
        fields = [
            'id', 'endpoint', 'p256dh_key', 'auth_key', 'device_name',
            'is_active', 'last_used', 'created_at'
        ]
        read_only_fields = ['id', 'last_used', 'created_at']


class NotificationDigestSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationDigest
        fields = [
            'id', 'frequency', 'notifications', 'notification_count',
            'period_start', 'period_end', 'is_sent', 'sent_at', 'created_at'
        ]
