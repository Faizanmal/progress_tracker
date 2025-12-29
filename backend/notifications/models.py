"""
Models for Advanced Notification Rules.
Supports customizable rules for email, SMS, and push notifications.
"""
from django.db import models
from django.conf import settings
from django.utils import timezone
import uuid


class NotificationRule(models.Model):
    """
    Custom notification rules with conditions and triggers.
    Example: "Notify me if a task is overdue by 2 days"
    """
    
    TRIGGER_TYPE_CHOICES = [
        # Task triggers
        ('task_overdue', 'Task Becomes Overdue'),
        ('task_overdue_days', 'Task Overdue by X Days'),
        ('task_deadline_approaching', 'Task Deadline Approaching'),
        ('task_status_change', 'Task Status Changed'),
        ('task_assigned', 'Task Assigned'),
        ('task_blocked', 'Task Blocked'),
        ('task_completed', 'Task Completed'),
        
        # Progress triggers
        ('progress_submitted', 'Progress Update Submitted'),
        ('progress_below_threshold', 'Progress Below Threshold'),
        ('no_progress_days', 'No Progress for X Days'),
        
        # Project triggers
        ('project_deadline_approaching', 'Project Deadline Approaching'),
        ('project_status_change', 'Project Status Changed'),
        ('project_health_critical', 'Project Health Critical'),
        
        # Budget triggers
        ('budget_threshold', 'Budget Threshold Reached'),
        ('expense_submitted', 'Expense Submitted'),
        
        # Resource triggers
        ('over_allocation', 'Resource Over-Allocated'),
        ('capacity_warning', 'Capacity Warning'),
        
        # Custom triggers
        ('schedule', 'Scheduled Time'),
        ('custom', 'Custom Condition'),
    ]
    
    CHANNEL_CHOICES = [
        ('in_app', 'In-App Notification'),
        ('email', 'Email'),
        ('sms', 'SMS'),
        ('push', 'Push Notification'),
        ('slack', 'Slack'),
        ('teams', 'Microsoft Teams'),
        ('webhook', 'Webhook'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Owner
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notification_rules'
    )
    company = models.ForeignKey(
        'users.Company',
        on_delete=models.CASCADE,
        related_name='notification_rules'
    )
    
    # Rule definition
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    trigger_type = models.CharField(max_length=50, choices=TRIGGER_TYPE_CHOICES)
    
    # Condition configuration
    conditions = models.JSONField(
        default=dict,
        help_text="Condition parameters (e.g., {'days_overdue': 2})"
    )
    
    # Scope filters
    projects = models.ManyToManyField(
        'projects.Project',
        blank=True,
        related_name='notification_rules',
        help_text="Apply only to these projects (empty = all)"
    )
    apply_to_assigned_only = models.BooleanField(
        default=True,
        help_text="Only trigger for tasks assigned to the user"
    )
    
    # Notification channels
    channels = models.JSONField(
        default=list,
        help_text="List of channels to notify through"
    )
    
    # Recipients (for managers/admins)
    notify_self = models.BooleanField(default=True)
    notify_assignee = models.BooleanField(default=False)
    notify_manager = models.BooleanField(default=False)
    notify_team = models.BooleanField(default=False)
    additional_recipients = models.JSONField(
        default=list,
        help_text="Additional user IDs or emails to notify"
    )
    
    # Message template
    message_template = models.TextField(
        blank=True,
        help_text="Custom message template with placeholders like {{task.title}}"
    )
    
    # Throttling
    cooldown_minutes = models.PositiveIntegerField(
        default=60,
        help_text="Minimum minutes between notifications for same trigger"
    )
    max_notifications_per_day = models.PositiveIntegerField(
        default=10,
        help_text="Maximum notifications per day for this rule"
    )
    
    # Schedule (for scheduled triggers)
    schedule_cron = models.CharField(
        max_length=100,
        blank=True,
        help_text="Cron expression for scheduled triggers"
    )
    
    # Status
    is_active = models.BooleanField(default=True)
    last_triggered = models.DateTimeField(null=True, blank=True)
    trigger_count = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-is_active', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.get_trigger_type_display()})"
    
    def can_trigger(self):
        """Check if rule can trigger based on cooldown and limits."""
        if not self.is_active:
            return False
        
        now = timezone.now()
        
        # Check cooldown
        if self.last_triggered:
            cooldown_delta = timezone.timedelta(minutes=self.cooldown_minutes)
            if now - self.last_triggered < cooldown_delta:
                return False
        
        # Check daily limit
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_count = self.deliveries.filter(created_at__gte=today_start).count()
        if today_count >= self.max_notifications_per_day:
            return False
        
        return True


class NotificationDelivery(models.Model):
    """
    Track delivery of notifications from rules.
    """
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('delivered', 'Delivered'),
        ('failed', 'Failed'),
        ('read', 'Read'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    rule = models.ForeignKey(
        NotificationRule,
        on_delete=models.CASCADE,
        related_name='deliveries'
    )
    
    # Recipient
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notification_deliveries'
    )
    
    # Channel used
    channel = models.CharField(max_length=20)
    
    # Message content
    title = models.CharField(max_length=255)
    message = models.TextField()
    
    # Related entity
    related_object_type = models.CharField(max_length=50, blank=True)
    related_object_id = models.CharField(max_length=255, blank=True)
    action_url = models.URLField(blank=True)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    error_message = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Notification Delivery'
        verbose_name_plural = 'Notification Deliveries'


class SMSConfiguration(models.Model):
    """
    SMS provider configuration for companies.
    """
    
    PROVIDER_CHOICES = [
        ('twilio', 'Twilio'),
        ('nexmo', 'Nexmo/Vonage'),
        ('aws_sns', 'AWS SNS'),
        ('messagebird', 'MessageBird'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    company = models.OneToOneField(
        'users.Company',
        on_delete=models.CASCADE,
        related_name='sms_config'
    )
    
    provider = models.CharField(max_length=20, choices=PROVIDER_CHOICES)
    
    # Credentials (encrypted in production)
    account_sid = models.CharField(max_length=255)
    auth_token = models.CharField(max_length=255)
    from_number = models.CharField(max_length=20)
    
    # Limits
    monthly_limit = models.PositiveIntegerField(default=1000)
    messages_sent_this_month = models.PositiveIntegerField(default=0)
    
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'SMS Configuration'
        verbose_name_plural = 'SMS Configurations'


class PushSubscription(models.Model):
    """
    Web push notification subscriptions.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='push_subscriptions'
    )
    
    # Push subscription data
    endpoint = models.URLField(max_length=500)
    p256dh_key = models.CharField(max_length=255)
    auth_key = models.CharField(max_length=255)
    
    # Device info
    user_agent = models.CharField(max_length=500, blank=True)
    device_name = models.CharField(max_length=100, blank=True)
    
    is_active = models.BooleanField(default=True)
    last_used = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'endpoint']


class NotificationDigest(models.Model):
    """
    Aggregated notification digests for email delivery.
    """
    
    FREQUENCY_CHOICES = [
        ('hourly', 'Hourly'),
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notification_digests'
    )
    
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES)
    
    # Collected notifications
    notifications = models.JSONField(default=list)
    notification_count = models.PositiveIntegerField(default=0)
    
    # Period
    period_start = models.DateTimeField()
    period_end = models.DateTimeField()
    
    # Status
    is_sent = models.BooleanField(default=False)
    sent_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-period_end']
