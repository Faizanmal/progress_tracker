"""
Models for Audit Logs and Change History tracking.
"""
from django.db import models
from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from django.utils import timezone
import uuid
import json


class AuditLog(models.Model):
    """
    Comprehensive audit log for tracking all changes to tasks, projects, and user actions.
    Supports full change history with before/after values.
    """
    
    ACTION_CHOICES = [
        ('create', 'Created'),
        ('update', 'Updated'),
        ('delete', 'Deleted'),
        ('view', 'Viewed'),
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('export', 'Exported'),
        ('import', 'Imported'),
        ('assign', 'Assigned'),
        ('unassign', 'Unassigned'),
        ('approve', 'Approved'),
        ('reject', 'Rejected'),
        ('submit', 'Submitted'),
        ('comment', 'Commented'),
        ('attach', 'Attached File'),
        ('status_change', 'Status Changed'),
        ('permission_change', 'Permission Changed'),
        ('bulk_update', 'Bulk Updated'),
        ('revert', 'Reverted'),
    ]
    
    SEVERITY_CHOICES = [
        ('info', 'Info'),
        ('warning', 'Warning'),
        ('critical', 'Critical'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Who performed the action
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='audit_logs'
    )
    user_email = models.EmailField(help_text="Preserved for history if user is deleted")
    user_name = models.CharField(max_length=255)
    
    # Company context (for multi-tenant)
    company = models.ForeignKey(
        'users.Company',
        on_delete=models.CASCADE,
        related_name='audit_logs'
    )
    
    # What was affected (generic foreign key)
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE
    )
    object_id = models.CharField(max_length=255)
    content_object = GenericForeignKey('content_type', 'object_id')
    object_repr = models.CharField(max_length=500, help_text="String representation of object")
    
    # Action details
    action = models.CharField(max_length=30, choices=ACTION_CHOICES)
    action_category = models.CharField(max_length=50, blank=True)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='info')
    
    # Change data
    changes = models.JSONField(
        default=dict,
        help_text="Dict of {field: {'old': value, 'new': value}}"
    )
    old_values = models.JSONField(default=dict, help_text="Complete old state")
    new_values = models.JSONField(default=dict, help_text="Complete new state")
    
    # Additional context
    message = models.TextField(blank=True, help_text="Human-readable description")
    metadata = models.JSONField(default=dict, help_text="Additional context data")
    
    # Request info
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=500, blank=True)
    request_id = models.CharField(max_length=100, blank=True)
    
    # Timestamps
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)
    
    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'Audit Log'
        verbose_name_plural = 'Audit Logs'
        indexes = [
            models.Index(fields=['company', 'timestamp']),
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['content_type', 'object_id']),
            models.Index(fields=['action', 'timestamp']),
        ]
    
    def __str__(self):
        return f"{self.user_name} {self.action} {self.object_repr}"
    
    @classmethod
    def log(cls, user, action, obj, changes=None, message='', metadata=None, request=None):
        """Helper method to create audit log entry."""
        content_type = ContentType.objects.get_for_model(obj)
        
        # Get company from user or object
        company = None
        if hasattr(user, 'company') and user.company:
            company = user.company
        elif hasattr(obj, 'company') and obj.company:
            company = obj.company
        
        log_entry = cls(
            user=user,
            user_email=user.email if user else '',
            user_name=user.name if user else 'System',
            company=company,
            content_type=content_type,
            object_id=str(obj.pk),
            object_repr=str(obj)[:500],
            action=action,
            changes=changes or {},
            message=message,
            metadata=metadata or {},
        )
        
        if request:
            log_entry.ip_address = cls.get_client_ip(request)
            log_entry.user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]
            log_entry.request_id = request.META.get('HTTP_X_REQUEST_ID', '')
        
        log_entry.save()
        return log_entry
    
    @staticmethod
    def get_client_ip(request):
        """Extract client IP from request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')


class ChangeSnapshot(models.Model):
    """
    Store complete object snapshots for point-in-time recovery.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    audit_log = models.ForeignKey(
        AuditLog,
        on_delete=models.CASCADE,
        related_name='snapshots'
    )
    
    # Full serialized state
    snapshot_data = models.JSONField()
    snapshot_type = models.CharField(
        max_length=20,
        choices=[('before', 'Before'), ('after', 'After')],
        default='after'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def restore(self):
        """Restore the object to this snapshot state."""
        # Implementation depends on model serialization
        pass


class AuditLogSearch(models.Model):
    """Saved searches for audit log queries."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='saved_audit_searches'
    )
    company = models.ForeignKey(
        'users.Company',
        on_delete=models.CASCADE
    )
    
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    
    # Search criteria
    filters = models.JSONField(
        default=dict,
        help_text="Saved filter criteria"
    )
    
    # Subscription for alerts
    is_subscribed = models.BooleanField(default=False)
    notify_on_match = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} - {self.user.name}"
