"""
Models for Custom Dashboard Widgets.
Enables users to create personalized dashboard views with drag-and-drop widgets.
"""
from django.db import models
from django.conf import settings
from django.utils import timezone
import uuid


class Dashboard(models.Model):
    """
    User's custom dashboard configuration.
    Each user can have multiple dashboards.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='custom_dashboards'
    )
    company = models.ForeignKey(
        'users.Company',
        on_delete=models.CASCADE,
        related_name='custom_dashboards'
    )
    
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    
    # Dashboard layout
    layout = models.JSONField(
        default=dict,
        help_text="Grid layout configuration for widgets"
    )
    
    # Sharing
    is_default = models.BooleanField(default=False, help_text="Default dashboard for user")
    is_shared = models.BooleanField(default=False)
    shared_with_team = models.BooleanField(default=False)
    
    # Styling
    theme = models.CharField(max_length=50, default='default')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-is_default', 'name']
        unique_together = ['user', 'name']
    
    def __str__(self):
        return f"{self.name} - {self.user.name}"


class DashboardWidget(models.Model):
    """
    Individual widget on a dashboard.
    Supports various widget types with customizable configurations.
    """
    
    WIDGET_TYPE_CHOICES = [
        # Task metrics
        ('task_completion_rate', 'Task Completion Rate'),
        ('task_status_chart', 'Task Status Chart'),
        ('tasks_by_priority', 'Tasks by Priority'),
        ('overdue_tasks', 'Overdue Tasks'),
        ('my_tasks', 'My Tasks'),
        ('team_tasks', 'Team Tasks'),
        
        # Time metrics
        ('time_spent_vs_estimated', 'Time Spent vs Estimated'),
        ('time_tracking_summary', 'Time Tracking Summary'),
        ('weekly_hours', 'Weekly Hours Chart'),
        ('billable_hours', 'Billable Hours'),
        
        # Project metrics
        ('project_health', 'Project Health Score'),
        ('project_progress', 'Project Progress'),
        ('project_timeline', 'Project Timeline (Gantt)'),
        ('project_milestones', 'Project Milestones'),
        
        # Team metrics
        ('team_performance', 'Team Performance'),
        ('team_workload', 'Team Workload'),
        ('resource_allocation', 'Resource Allocation'),
        
        # Budget metrics
        ('budget_overview', 'Budget Overview'),
        ('expense_breakdown', 'Expense Breakdown'),
        ('budget_variance', 'Budget Variance'),
        
        # Activity feeds
        ('recent_activity', 'Recent Activity'),
        ('recent_updates', 'Recent Progress Updates'),
        ('notifications', 'Notifications'),
        
        # Charts
        ('burndown_chart', 'Burndown Chart'),
        ('velocity_chart', 'Velocity Chart'),
        ('trend_chart', 'Custom Trend Chart'),
        
        # Other
        ('calendar', 'Calendar View'),
        ('quick_actions', 'Quick Actions'),
        ('custom_metric', 'Custom Metric'),
        ('text_note', 'Text/Note Widget'),
        ('iframe', 'Embedded Content'),
    ]
    
    SIZE_CHOICES = [
        ('small', 'Small (1x1)'),
        ('medium', 'Medium (2x1)'),
        ('large', 'Large (2x2)'),
        ('wide', 'Wide (3x1)'),
        ('tall', 'Tall (1x2)'),
        ('full', 'Full Width (4x1)'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    dashboard = models.ForeignKey(
        Dashboard,
        on_delete=models.CASCADE,
        related_name='widgets'
    )
    
    # Widget type and configuration
    widget_type = models.CharField(max_length=50, choices=WIDGET_TYPE_CHOICES)
    title = models.CharField(max_length=100)
    subtitle = models.CharField(max_length=200, blank=True)
    
    # Position and size (for grid layout)
    position_x = models.PositiveIntegerField(default=0)
    position_y = models.PositiveIntegerField(default=0)
    width = models.PositiveIntegerField(default=1)
    height = models.PositiveIntegerField(default=1)
    size = models.CharField(max_length=20, choices=SIZE_CHOICES, default='medium')
    
    # Configuration
    config = models.JSONField(
        default=dict,
        help_text="Widget-specific configuration options"
    )
    
    # Filters
    filters = models.JSONField(
        default=dict,
        help_text="Data filters (project, date range, team members, etc.)"
    )
    
    # Refresh settings
    auto_refresh = models.BooleanField(default=True)
    refresh_interval_seconds = models.PositiveIntegerField(default=300)
    
    # Visibility
    is_visible = models.BooleanField(default=True)
    
    # Order for rendering
    order = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order', 'position_y', 'position_x']
    
    def __str__(self):
        return f"{self.title} ({self.get_widget_type_display()})"


class WidgetTemplate(models.Model):
    """
    Pre-built widget templates for quick dashboard setup.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    widget_type = models.CharField(max_length=50)
    
    # Default configuration
    default_config = models.JSONField(default=dict)
    default_filters = models.JSONField(default=dict)
    default_size = models.CharField(max_length=20, default='medium')
    
    # Metadata
    category = models.CharField(max_length=50, blank=True)
    icon = models.CharField(max_length=50, blank=True)
    is_premium = models.BooleanField(default=False)
    
    # Usage tracking
    usage_count = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['category', 'name']
    
    def __str__(self):
        return self.name


class DashboardTemplate(models.Model):
    """
    Complete dashboard templates with pre-configured widgets.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    
    # Target audience
    target_role = models.CharField(
        max_length=20,
        choices=[
            ('admin', 'Admin'),
            ('manager', 'Manager'),
            ('employee', 'Employee'),
            ('all', 'All Roles'),
        ],
        default='all'
    )
    
    # Template configuration
    layout = models.JSONField(default=dict)
    widgets = models.JSONField(
        default=list,
        help_text="List of widget configurations"
    )
    
    # Metadata
    thumbnail = models.URLField(blank=True)
    is_featured = models.BooleanField(default=False)
    is_premium = models.BooleanField(default=False)
    
    usage_count = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-is_featured', 'name']
    
    def __str__(self):
        return self.name


class WidgetData(models.Model):
    """
    Cached widget data for performance.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    widget = models.OneToOneField(
        DashboardWidget,
        on_delete=models.CASCADE,
        related_name='cached_data'
    )
    
    data = models.JSONField(default=dict)
    last_calculated = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField()
    
    class Meta:
        verbose_name = 'Widget Data Cache'
        verbose_name_plural = 'Widget Data Caches'
