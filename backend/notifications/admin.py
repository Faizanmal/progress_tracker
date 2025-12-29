"""
Admin configuration for notifications app.
"""
from django.contrib import admin
from .models import (
    NotificationRule, NotificationDelivery, SMSConfiguration,
    PushSubscription, NotificationDigest
)


@admin.register(NotificationRule)
class NotificationRuleAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'trigger_type', 'is_active', 'trigger_count', 'last_triggered']
    list_filter = ['trigger_type', 'is_active']
    search_fields = ['name', 'user__name']


@admin.register(NotificationDelivery)
class NotificationDeliveryAdmin(admin.ModelAdmin):
    list_display = ['rule', 'recipient', 'channel', 'status', 'created_at', 'sent_at']
    list_filter = ['channel', 'status']
    search_fields = ['title', 'recipient__name']


@admin.register(SMSConfiguration)
class SMSConfigurationAdmin(admin.ModelAdmin):
    list_display = ['company', 'provider', 'from_number', 'is_active', 'messages_sent_this_month']
    list_filter = ['provider', 'is_active']
    search_fields = ['company__name']


@admin.register(PushSubscription)
class PushSubscriptionAdmin(admin.ModelAdmin):
    list_display = ['user', 'device_name', 'is_active', 'last_used', 'created_at']
    list_filter = ['is_active']
    search_fields = ['user__name', 'device_name']


@admin.register(NotificationDigest)
class NotificationDigestAdmin(admin.ModelAdmin):
    list_display = ['user', 'frequency', 'notification_count', 'is_sent', 'period_start', 'period_end']
    list_filter = ['frequency', 'is_sent']
    search_fields = ['user__name']
