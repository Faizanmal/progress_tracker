from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    """Custom user manager for email-based authentication."""
    
    def create_user(self, email, password=None, **extra_fields):
        """Create and save a regular user."""
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        """Create and save a superuser."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Custom User model with role-based access."""
    
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('manager', 'Manager'),
        ('employee', 'Employee'),
    ]
    
    email = models.EmailField(unique=True, db_index=True)
    name = models.CharField(max_length=255)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='employee')
    
    # Profile information
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    department = models.CharField(max_length=100, blank=True)
    position = models.CharField(max_length=100, blank=True)
    
    # Account status
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    
    # Timestamps
    date_joined = models.DateTimeField(default=timezone.now)
    last_login = models.DateTimeField(null=True, blank=True)
    
    # Company/Organization
    company = models.ForeignKey(
        'users.Company',
        on_delete=models.CASCADE,
        related_name='users',
        null=True,
        blank=True
    )
    
    # Manager relationship
    manager = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='team_members'
    )
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']
    
    class Meta:
        ordering = ['-date_joined']
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return f"{self.name} ({self.email})"
    
    @property
    def is_admin(self):
        """Check if user is an admin."""
        return self.role == 'admin'
    
    @property
    def is_manager(self):
        """Check if user is a manager."""
        return self.role == 'manager'
    
    @property
    def is_employee(self):
        """Check if user is an employee."""
        return self.role == 'employee'


class Company(models.Model):
    """Company/Organization model."""
    
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    website = models.URLField(blank=True)
    logo = models.ImageField(upload_to='company_logos/', null=True, blank=True)
    
    # Subscription info
    subscription_plan = models.CharField(
        max_length=50,
        choices=[
            ('free', 'Free'),
            ('basic', 'Basic'),
            ('pro', 'Professional'),
            ('enterprise', 'Enterprise'),
        ],
        default='free'
    )
    subscription_active = models.BooleanField(default=True)
    subscription_expires = models.DateTimeField(null=True, blank=True)
    
    # Settings
    max_users = models.IntegerField(default=10)
    allow_google_oauth = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        verbose_name = 'Company'
        verbose_name_plural = 'Companies'
    
    def __str__(self):
        return self.name


class Notification(models.Model):
    """User notification model."""
    
    NOTIFICATION_TYPES = [
        ('task_assigned', 'Task Assigned'),
        ('task_blocked', 'Task Blocked'),
        ('task_overdue', 'Task Overdue'),
        ('progress_update', 'Progress Update'),
        ('comment_added', 'Comment Added'),
        ('reminder', 'Reminder'),
        ('timesheet_approved', 'Timesheet Approved'),
        ('timesheet_rejected', 'Timesheet Rejected'),
        ('milestone_due', 'Milestone Due'),
        ('report_ready', 'Report Ready'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('normal', 'Normal'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    link = models.CharField(max_length=500, blank=True)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='normal')
    
    is_read = models.BooleanField(default=False)
    is_email_sent = models.BooleanField(default=False)
    is_push_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.notification_type} - {self.user.name}"


class NotificationPreference(models.Model):
    """User notification preferences."""
    
    FREQUENCY_CHOICES = [
        ('immediate', 'Immediate'),
        ('hourly', 'Hourly Digest'),
        ('daily', 'Daily Digest'),
        ('weekly', 'Weekly Digest'),
        ('never', 'Never'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_preferences')
    
    # Email preferences
    email_task_assigned = models.BooleanField(default=True)
    email_task_blocked = models.BooleanField(default=True)
    email_task_overdue = models.BooleanField(default=True)
    email_progress_update = models.BooleanField(default=True)
    email_comment_added = models.BooleanField(default=True)
    email_reminder = models.BooleanField(default=True)
    email_timesheet = models.BooleanField(default=True)
    email_milestone = models.BooleanField(default=True)
    email_report = models.BooleanField(default=True)
    email_frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='immediate')
    
    # Push notification preferences
    push_enabled = models.BooleanField(default=True)
    push_task_assigned = models.BooleanField(default=True)
    push_task_blocked = models.BooleanField(default=True)
    push_task_overdue = models.BooleanField(default=True)
    push_progress_update = models.BooleanField(default=False)
    push_comment_added = models.BooleanField(default=True)
    push_reminder = models.BooleanField(default=True)
    
    # In-app notification preferences
    inapp_enabled = models.BooleanField(default=True)
    
    # Quiet hours
    quiet_hours_enabled = models.BooleanField(default=False)
    quiet_hours_start = models.TimeField(null=True, blank=True)
    quiet_hours_end = models.TimeField(null=True, blank=True)
    
    # Webhook for external integrations (Slack, Teams)
    webhook_url = models.URLField(blank=True)
    webhook_enabled = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Notification Preference'
        verbose_name_plural = 'Notification Preferences'
    
    def __str__(self):
        return f"Preferences for {self.user.name}"


class WebhookIntegration(models.Model):
    """External webhook integrations for companies."""
    
    INTEGRATION_TYPES = [
        ('slack', 'Slack'),
        ('teams', 'Microsoft Teams'),
        ('discord', 'Discord'),
        ('custom', 'Custom Webhook'),
    ]
    
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='webhooks')
    name = models.CharField(max_length=100)
    integration_type = models.CharField(max_length=20, choices=INTEGRATION_TYPES)
    webhook_url = models.URLField()
    
    # Events to notify
    notify_task_assigned = models.BooleanField(default=True)
    notify_task_blocked = models.BooleanField(default=True)
    notify_task_completed = models.BooleanField(default=True)
    notify_progress_update = models.BooleanField(default=False)
    notify_milestone = models.BooleanField(default=True)
    
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Webhook Integration'
        verbose_name_plural = 'Webhook Integrations'
    
    def __str__(self):
        return f"{self.name} ({self.get_integration_type_display()})"


class CalendarIntegration(models.Model):
    """Calendar integrations for users."""
    
    CALENDAR_TYPES = [
        ('google', 'Google Calendar'),
        ('outlook', 'Microsoft Outlook'),
        ('apple', 'Apple Calendar'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='calendar_integrations')
    calendar_type = models.CharField(max_length=20, choices=CALENDAR_TYPES)
    
    # OAuth tokens (encrypted in production)
    access_token = models.TextField(blank=True)
    refresh_token = models.TextField(blank=True)
    token_expires_at = models.DateTimeField(null=True, blank=True)
    
    # Sync settings
    sync_tasks = models.BooleanField(default=True)
    sync_deadlines = models.BooleanField(default=True)
    sync_milestones = models.BooleanField(default=True)
    
    is_active = models.BooleanField(default=True)
    last_synced = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'calendar_type']
        verbose_name = 'Calendar Integration'
        verbose_name_plural = 'Calendar Integrations'
    
    def __str__(self):
        return f"{self.user.name} - {self.get_calendar_type_display()}"
