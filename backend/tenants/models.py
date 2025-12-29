"""
Models for Multi-Tenant Support.
Enables isolated workspaces for organizations with separate data and configurations.
"""
from django.db import models
from django.conf import settings
from django.utils import timezone
import uuid


class Tenant(models.Model):
    """
    Multi-tenant organization with isolated data and configuration.
    Extends the existing Company model with tenant-specific features.
    """
    
    PLAN_CHOICES = [
        ('free', 'Free'),
        ('starter', 'Starter'),
        ('professional', 'Professional'),
        ('enterprise', 'Enterprise'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('suspended', 'Suspended'),
        ('trial', 'Trial'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Link to company
    company = models.OneToOneField(
        'users.Company',
        on_delete=models.CASCADE,
        related_name='tenant'
    )
    
    # Tenant identification
    slug = models.SlugField(max_length=100, unique=True, help_text="URL-safe identifier")
    subdomain = models.CharField(max_length=100, unique=True, blank=True)
    custom_domain = models.CharField(max_length=255, unique=True, null=True, blank=True)
    
    # Subscription
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default='free')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    trial_ends_at = models.DateTimeField(null=True, blank=True)
    subscription_ends_at = models.DateTimeField(null=True, blank=True)
    
    # Limits based on plan
    max_users = models.PositiveIntegerField(default=5)
    max_projects = models.PositiveIntegerField(default=10)
    max_storage_gb = models.PositiveIntegerField(default=5)
    
    # Usage tracking
    current_users = models.PositiveIntegerField(default=0)
    current_projects = models.PositiveIntegerField(default=0)
    storage_used_bytes = models.BigIntegerField(default=0)
    
    # Features enabled
    features = models.JSONField(
        default=dict,
        help_text="Feature flags for this tenant"
    )
    
    # Branding (white-labeling)
    branding = models.JSONField(
        default=dict,
        help_text="Custom branding configuration"
    )
    
    # Data isolation
    database_name = models.CharField(
        max_length=100,
        blank=True,
        help_text="Separate database for enterprise tenants"
    )
    schema_name = models.CharField(
        max_length=100,
        blank=True,
        help_text="Database schema for isolation"
    )
    
    # Settings
    settings = models.JSONField(default=dict)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['company__name']
        verbose_name = 'Tenant'
        verbose_name_plural = 'Tenants'
    
    def __str__(self):
        return f"{self.company.name} ({self.slug})"
    
    @property
    def is_active(self):
        return self.status == 'active'
    
    @property
    def is_trial(self):
        return self.status == 'trial'
    
    @property
    def trial_expired(self):
        if self.trial_ends_at:
            return timezone.now() > self.trial_ends_at
        return False
    
    def has_feature(self, feature_name):
        """Check if tenant has a specific feature enabled."""
        # Default features by plan
        plan_features = {
            'free': ['basic_tasks', 'basic_projects'],
            'starter': ['basic_tasks', 'basic_projects', 'file_attachments', 'basic_reports'],
            'professional': ['basic_tasks', 'basic_projects', 'file_attachments', 
                           'advanced_reports', 'calendar_sync', 'api_access'],
            'enterprise': ['all'],
        }
        
        if 'all' in plan_features.get(self.plan, []):
            return True
        
        # Check plan features
        if feature_name in plan_features.get(self.plan, []):
            return True
        
        # Check custom features
        return self.features.get(feature_name, False)
    
    def can_add_user(self):
        return self.current_users < self.max_users
    
    def can_add_project(self):
        return self.current_projects < self.max_projects
    
    def get_storage_remaining_gb(self):
        used_gb = self.storage_used_bytes / (1024 ** 3)
        return max(0, self.max_storage_gb - used_gb)


class TenantBranding(models.Model):
    """
    White-labeling configuration for enterprise tenants.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    tenant = models.OneToOneField(
        Tenant,
        on_delete=models.CASCADE,
        related_name='branding_config'
    )
    
    # Logos
    logo_light = models.URLField(blank=True, help_text="Logo for light backgrounds")
    logo_dark = models.URLField(blank=True, help_text="Logo for dark backgrounds")
    favicon = models.URLField(blank=True)
    
    # Colors
    primary_color = models.CharField(max_length=7, default='#3B82F6')
    secondary_color = models.CharField(max_length=7, default='#6366F1')
    accent_color = models.CharField(max_length=7, default='#10B981')
    
    # Typography
    font_family = models.CharField(max_length=100, default='Inter')
    heading_font = models.CharField(max_length=100, blank=True)
    
    # Email branding
    email_header_image = models.URLField(blank=True)
    email_footer_text = models.TextField(blank=True)
    
    # Custom CSS
    custom_css = models.TextField(blank=True)
    
    # Legal
    terms_url = models.URLField(blank=True)
    privacy_url = models.URLField(blank=True)
    support_email = models.EmailField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Tenant Branding'
        verbose_name_plural = 'Tenant Brandings'


class TenantInvitation(models.Model):
    """
    Invitations to join a tenant organization.
    """
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('expired', 'Expired'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='invitations'
    )
    
    email = models.EmailField()
    role = models.CharField(
        max_length=20,
        choices=[
            ('admin', 'Admin'),
            ('manager', 'Manager'),
            ('employee', 'Employee'),
        ],
        default='employee'
    )
    
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_invitations'
    )
    
    # Invitation token
    token = models.CharField(max_length=100, unique=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    expires_at = models.DateTimeField()
    
    # Accepted user
    accepted_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='accepted_invitations'
    )
    accepted_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def is_expired(self):
        return timezone.now() > self.expires_at


class TenantAuditLog(models.Model):
    """
    Tenant-level audit logs for admin actions.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='admin_audit_logs'
    )
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )
    
    action = models.CharField(max_length=50)
    resource_type = models.CharField(max_length=50)
    resource_id = models.CharField(max_length=255, blank=True)
    details = models.JSONField(default=dict)
    
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']


class TenantUsageStats(models.Model):
    """
    Daily usage statistics for tenants.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='usage_stats'
    )
    
    date = models.DateField()
    
    # Activity metrics
    active_users = models.PositiveIntegerField(default=0)
    tasks_created = models.PositiveIntegerField(default=0)
    tasks_completed = models.PositiveIntegerField(default=0)
    projects_active = models.PositiveIntegerField(default=0)
    progress_updates = models.PositiveIntegerField(default=0)
    
    # API usage
    api_requests = models.PositiveIntegerField(default=0)
    
    # Storage
    files_uploaded = models.PositiveIntegerField(default=0)
    storage_added_bytes = models.BigIntegerField(default=0)
    
    class Meta:
        unique_together = ['tenant', 'date']
        ordering = ['-date']
