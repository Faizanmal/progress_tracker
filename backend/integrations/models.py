"""
Models for external integrations including:
- Calendar Integration (Google, Outlook, Apple)
- File Attachments with version control
- Third-party API keys
"""
from django.db import models
from django.conf import settings
from django.utils import timezone
import uuid
import os


# ============================================================================
# CALENDAR INTEGRATION MODELS
# ============================================================================

class CalendarConnection(models.Model):
    """User's connected calendar accounts."""
    
    PROVIDER_CHOICES = [
        ('google', 'Google Calendar'),
        ('outlook', 'Microsoft Outlook'),
        ('apple', 'Apple Calendar'),
    ]
    
    SYNC_STATUS_CHOICES = [
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('error', 'Error'),
        ('disconnected', 'Disconnected'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='calendar_connections'
    )
    provider = models.CharField(max_length=20, choices=PROVIDER_CHOICES)
    
    # OAuth credentials (encrypted in production)
    access_token = models.TextField()
    refresh_token = models.TextField(blank=True)
    token_expires_at = models.DateTimeField(null=True, blank=True)
    
    # Calendar-specific settings
    calendar_id = models.CharField(max_length=255, blank=True, help_text="External calendar ID")
    calendar_name = models.CharField(max_length=255, blank=True)
    
    # Sync settings
    sync_tasks = models.BooleanField(default=True)
    sync_deadlines = models.BooleanField(default=True)
    sync_milestones = models.BooleanField(default=True)
    import_events_as_tasks = models.BooleanField(default=False)
    two_way_sync = models.BooleanField(default=False)
    
    # Sync status
    sync_status = models.CharField(max_length=20, choices=SYNC_STATUS_CHOICES, default='active')
    last_sync = models.DateTimeField(null=True, blank=True)
    last_sync_error = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'provider']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.name} - {self.get_provider_display()}"
    
    def is_token_expired(self):
        if self.token_expires_at:
            return timezone.now() >= self.token_expires_at
        return True


class CalendarEvent(models.Model):
    """Synced calendar events mapped to tasks."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    connection = models.ForeignKey(
        CalendarConnection,
        on_delete=models.CASCADE,
        related_name='events'
    )
    
    # External event data
    external_event_id = models.CharField(max_length=255)
    external_calendar_id = models.CharField(max_length=255, blank=True)
    
    # Linked internal entities
    task = models.ForeignKey(
        'tasks.Task',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='synced_calendar_events'
    )
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='synced_calendar_events'
    )
    
    # Event details
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    all_day = models.BooleanField(default=False)
    location = models.CharField(max_length=500, blank=True)
    
    # Sync metadata
    sync_direction = models.CharField(
        max_length=20,
        choices=[('imported', 'Imported'), ('exported', 'Exported'), ('bidirectional', 'Bidirectional')],
        default='exported'
    )
    last_synced = models.DateTimeField(auto_now=True)
    external_updated_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ['connection', 'external_event_id']
        ordering = ['start_time']
    
    def __str__(self):
        return f"{self.title} ({self.start_time})"


# ============================================================================
# FILE ATTACHMENT & DOCUMENT MANAGEMENT MODELS
# ============================================================================

def upload_to_path(instance, filename):
    """Generate upload path for attachments."""
    company_id = 'default'
    if hasattr(instance, 'company') and instance.company:
        company_id = str(instance.company.id)
    elif hasattr(instance, 'uploaded_by') and instance.uploaded_by and instance.uploaded_by.company:
        company_id = str(instance.uploaded_by.company.id)
    
    ext = os.path.splitext(filename)[1]
    unique_name = f"{uuid.uuid4()}{ext}"
    return f"attachments/{company_id}/{instance.content_type}/{unique_name}"


class FileAttachment(models.Model):
    """
    Universal file attachment model supporting version control.
    Can be attached to tasks, projects, or progress updates.
    """
    
    CONTENT_TYPE_CHOICES = [
        ('task', 'Task'),
        ('project', 'Project'),
        ('progress_update', 'Progress Update'),
        ('comment', 'Comment'),
    ]
    
    STORAGE_PROVIDER_CHOICES = [
        ('local', 'Local Storage'),
        ('s3', 'Amazon S3'),
        ('gcs', 'Google Cloud Storage'),
        ('azure', 'Azure Blob Storage'),
        ('gdrive', 'Google Drive'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Content type and object references
    content_type = models.CharField(max_length=20, choices=CONTENT_TYPE_CHOICES)
    task = models.ForeignKey(
        'tasks.Task',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='file_attachments'
    )
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='file_attachments'
    )
    progress_update = models.ForeignKey(
        'progress.ProgressUpdate',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='file_attachments'
    )
    
    # File info
    file = models.FileField(upload_to=upload_to_path)
    original_filename = models.CharField(max_length=255)
    file_size = models.BigIntegerField(default=0)  # in bytes
    mime_type = models.CharField(max_length=100, blank=True)
    
    # Storage info
    storage_provider = models.CharField(
        max_length=20,
        choices=STORAGE_PROVIDER_CHOICES,
        default='local'
    )
    external_url = models.URLField(blank=True, help_text="URL for cloud-stored files")
    
    # Version control
    version = models.PositiveIntegerField(default=1)
    parent_version = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='child_versions'
    )
    is_latest = models.BooleanField(default=True)
    
    # Metadata
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='uploaded_files'
    )
    company = models.ForeignKey(
        'users.Company',
        on_delete=models.CASCADE,
        related_name='files'
    )
    
    # Optional metadata
    description = models.TextField(blank=True)
    tags = models.CharField(max_length=500, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['content_type', 'task']),
            models.Index(fields=['content_type', 'project']),
            models.Index(fields=['company', 'content_type']),
        ]
    
    def __str__(self):
        return f"{self.original_filename} (v{self.version})"
    
    def save(self, *args, **kwargs):
        # Calculate file size if file exists
        if self.file and hasattr(self.file, 'size'):
            self.file_size = self.file.size
        super().save(*args, **kwargs)


class FileVersion(models.Model):
    """Track file version history."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    attachment = models.ForeignKey(
        FileAttachment,
        on_delete=models.CASCADE,
        related_name='versions'
    )
    version_number = models.PositiveIntegerField()
    file = models.FileField(upload_to='attachments/versions/')
    file_size = models.BigIntegerField(default=0)
    
    change_summary = models.TextField(blank=True)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['attachment', 'version_number']
        ordering = ['-version_number']
    
    def __str__(self):
        return f"{self.attachment.original_filename} v{self.version_number}"


# ============================================================================
# THIRD-PARTY API INTEGRATION
# ============================================================================

class APIKey(models.Model):
    """API keys for third-party integrations (Zapier, custom scripts, etc.)."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        'users.Company',
        on_delete=models.CASCADE,
        related_name='api_keys'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_api_keys'
    )
    
    name = models.CharField(max_length=100)
    key = models.CharField(max_length=64, unique=True, db_index=True)
    key_prefix = models.CharField(max_length=8, help_text="First 8 chars for identification")
    
    # Permissions
    permissions = models.JSONField(
        default=dict,
        help_text="API permissions: {'read': [...], 'write': [...]}"
    )
    rate_limit = models.PositiveIntegerField(default=1000, help_text="Requests per hour")
    
    # Status
    is_active = models.BooleanField(default=True)
    last_used = models.DateTimeField(null=True, blank=True)
    request_count = models.PositiveIntegerField(default=0)
    
    # Expiration
    expires_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'API Key'
        verbose_name_plural = 'API Keys'
    
    def __str__(self):
        return f"{self.name} ({self.key_prefix}...)"
    
    def is_expired(self):
        if self.expires_at:
            return timezone.now() >= self.expires_at
        return False


class APIRequestLog(models.Model):
    """Log API requests for monitoring and debugging."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    api_key = models.ForeignKey(
        APIKey,
        on_delete=models.CASCADE,
        related_name='request_logs'
    )
    
    method = models.CharField(max_length=10)
    endpoint = models.CharField(max_length=500)
    request_body = models.JSONField(null=True, blank=True)
    response_status = models.PositiveIntegerField()
    response_time_ms = models.PositiveIntegerField()
    
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=500, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['api_key', 'created_at']),
        ]


class WebhookEndpoint(models.Model):
    """Outgoing webhook endpoints for integrations."""
    
    EVENT_TYPES = [
        ('task.created', 'Task Created'),
        ('task.updated', 'Task Updated'),
        ('task.completed', 'Task Completed'),
        ('task.deleted', 'Task Deleted'),
        ('project.created', 'Project Created'),
        ('project.updated', 'Project Updated'),
        ('project.completed', 'Project Completed'),
        ('progress.submitted', 'Progress Update Submitted'),
        ('user.created', 'User Created'),
        ('budget.threshold', 'Budget Threshold Reached'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        'users.Company',
        on_delete=models.CASCADE,
        related_name='webhook_endpoints'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )
    
    name = models.CharField(max_length=100)
    url = models.URLField()
    secret = models.CharField(max_length=64, blank=True, help_text="Webhook signing secret")
    
    # Event subscriptions
    events = models.JSONField(default=list, help_text="List of event types to send")
    
    # Headers
    custom_headers = models.JSONField(default=dict, blank=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    last_triggered = models.DateTimeField(null=True, blank=True)
    failure_count = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} - {self.url}"


class WebhookDelivery(models.Model):
    """Track webhook delivery attempts."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    webhook = models.ForeignKey(
        WebhookEndpoint,
        on_delete=models.CASCADE,
        related_name='deliveries'
    )
    
    event_type = models.CharField(max_length=50)
    payload = models.JSONField()
    
    # Delivery status
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('success', 'Success'),
            ('failed', 'Failed'),
            ('retrying', 'Retrying'),
        ],
        default='pending'
    )
    response_status = models.PositiveIntegerField(null=True, blank=True)
    response_body = models.TextField(blank=True)
    error_message = models.TextField(blank=True)
    
    # Retry info
    attempt_count = models.PositiveIntegerField(default=0)
    next_retry = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
