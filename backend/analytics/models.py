from django.db import models
from django.conf import settings
from django.utils import timezone


class TimeEntry(models.Model):
    """Time tracking entries for tasks."""
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='time_entries'
    )
    task = models.ForeignKey(
        'tasks.Task',
        on_delete=models.CASCADE,
        related_name='time_entries'
    )
    
    # Time tracking
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    duration_minutes = models.PositiveIntegerField(default=0)
    
    # Details
    description = models.TextField(blank=True)
    is_billable = models.BooleanField(default=True)
    
    # Timer state
    is_running = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-start_time']
        verbose_name = 'Time Entry'
        verbose_name_plural = 'Time Entries'
    
    def __str__(self):
        return f"{self.user.name} - {self.task.title} ({self.duration_minutes}min)"
    
    def save(self, *args, **kwargs):
        """Calculate duration when end_time is set."""
        if self.end_time and self.start_time:
            delta = self.end_time - self.start_time
            self.duration_minutes = int(delta.total_seconds() / 60)
            self.is_running = False
        super().save(*args, **kwargs)
    
    def stop_timer(self):
        """Stop the running timer."""
        if self.is_running:
            self.end_time = timezone.now()
            self.is_running = False
            self.save()
    
    @property
    def duration_hours(self):
        """Get duration in hours."""
        return round(self.duration_minutes / 60, 2)


class Report(models.Model):
    """Custom reports configuration."""
    
    REPORT_TYPES = [
        ('productivity', 'Productivity Report'),
        ('time_summary', 'Time Summary'),
        ('task_completion', 'Task Completion'),
        ('project_status', 'Project Status'),
        ('team_performance', 'Team Performance'),
        ('custom', 'Custom Report'),
    ]
    
    FREQUENCY_CHOICES = [
        ('once', 'One-time'),
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
    ]
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    report_type = models.CharField(max_length=50, choices=REPORT_TYPES)
    
    # Report configuration (JSON)
    config = models.JSONField(default=dict, blank=True)
    
    # Scheduling
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='once')
    next_run = models.DateTimeField(null=True, blank=True)
    last_run = models.DateTimeField(null=True, blank=True)
    
    # Recipients
    recipients = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='subscribed_reports',
        blank=True
    )
    send_email = models.BooleanField(default=True)
    
    # Ownership
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_reports'
    )
    company = models.ForeignKey(
        'users.Company',
        on_delete=models.CASCADE,
        related_name='reports'
    )
    
    # Status
    is_active = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Report'
        verbose_name_plural = 'Reports'
    
    def __str__(self):
        return f"{self.name} ({self.get_report_type_display()})"


class ReportSnapshot(models.Model):
    """Generated report snapshots."""
    
    report = models.ForeignKey(
        Report,
        on_delete=models.CASCADE,
        related_name='snapshots'
    )
    
    # Generated data
    data = models.JSONField()
    generated_at = models.DateTimeField(auto_now_add=True)
    
    # File export
    file_pdf = models.FileField(upload_to='reports/pdf/', null=True, blank=True)
    file_csv = models.FileField(upload_to='reports/csv/', null=True, blank=True)
    
    class Meta:
        ordering = ['-generated_at']
    
    def __str__(self):
        return f"{self.report.name} - {self.generated_at}"


class Timesheet(models.Model):
    """Weekly timesheets for approval."""
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='timesheets'
    )
    
    # Period
    week_start = models.DateField()
    week_end = models.DateField()
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    submitted_at = models.DateTimeField(null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_timesheets'
    )
    
    # Totals (calculated)
    total_hours = models.FloatField(default=0)
    billable_hours = models.FloatField(default=0)
    
    # Notes
    notes = models.TextField(blank=True)
    rejection_reason = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-week_start']
        unique_together = ['user', 'week_start']
        verbose_name = 'Timesheet'
        verbose_name_plural = 'Timesheets'
    
    def __str__(self):
        return f"{self.user.name} - Week of {self.week_start}"
    
    def calculate_totals(self):
        """Calculate total hours from time entries."""
        entries = TimeEntry.objects.filter(
            user=self.user,
            start_time__date__gte=self.week_start,
            start_time__date__lte=self.week_end,
            is_running=False
        )
        self.total_hours = sum(e.duration_hours for e in entries)
        self.billable_hours = sum(e.duration_hours for e in entries if e.is_billable)
        self.save()


class ProjectTemplate(models.Model):
    """Reusable project templates."""
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    # Template configuration
    default_status = models.CharField(max_length=20, default='planning')
    default_priority = models.CharField(max_length=20, default='medium')
    estimated_duration_days = models.PositiveIntegerField(default=30)
    
    # Task templates (JSON array)
    task_templates = models.JSONField(default=list, blank=True)
    
    # Workflow stages (JSON array)
    workflow_stages = models.JSONField(default=list, blank=True)
    
    # Ownership
    company = models.ForeignKey(
        'users.Company',
        on_delete=models.CASCADE,
        related_name='project_templates'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_templates'
    )
    
    # Visibility
    is_public = models.BooleanField(default=False)  # Available to all companies
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        verbose_name = 'Project Template'
        verbose_name_plural = 'Project Templates'
    
    def __str__(self):
        return self.name


class TaskDependency(models.Model):
    """Task dependencies for workflow management."""
    
    DEPENDENCY_TYPES = [
        ('blocks', 'Blocks'),  # Task A must complete before Task B can start
        ('blocked_by', 'Blocked By'),  # Task A is blocked by Task B
        ('related', 'Related To'),  # Tasks are related but not dependent
    ]
    
    task = models.ForeignKey(
        'tasks.Task',
        on_delete=models.CASCADE,
        related_name='dependencies'
    )
    depends_on = models.ForeignKey(
        'tasks.Task',
        on_delete=models.CASCADE,
        related_name='dependents'
    )
    dependency_type = models.CharField(
        max_length=20,
        choices=DEPENDENCY_TYPES,
        default='blocked_by'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['task', 'depends_on']
        verbose_name = 'Task Dependency'
        verbose_name_plural = 'Task Dependencies'
    
    def __str__(self):
        return f"{self.task.title} {self.dependency_type} {self.depends_on.title}"


class Milestone(models.Model):
    """Project milestones."""
    
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        related_name='milestones'
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    due_date = models.DateField()
    
    # Progress
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Tasks linked to this milestone
    tasks = models.ManyToManyField(
        'tasks.Task',
        related_name='milestones',
        blank=True
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['due_date']
        verbose_name = 'Milestone'
        verbose_name_plural = 'Milestones'
    
    def __str__(self):
        return f"{self.project.title} - {self.title}"
    
    @property
    def progress(self):
        """Calculate milestone progress based on tasks."""
        tasks = self.tasks.all()
        if not tasks.exists():
            return 0
        completed = tasks.filter(status='completed').count()
        return int((completed / tasks.count()) * 100)
