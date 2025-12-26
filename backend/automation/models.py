"""
Automation models for workflow engine, escalation, dependencies, and integrations.
"""
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.contrib.postgres.fields import ArrayField
import json


# ============================================================================
# 1. SMART WORKFLOW AUTOMATION ENGINE
# ============================================================================

class Workflow(models.Model):
    """
    Workflow definition with triggers, conditions, and actions.
    Allows users to create custom automated workflows.
    """
    
    TRIGGER_TYPES = [
        ('task_status_change', 'Task Status Changed'),
        ('task_created', 'Task Created'),
        ('task_assigned', 'Task Assigned'),
        ('task_overdue', 'Task Becomes Overdue'),
        ('task_blocked', 'Task Blocked'),
        ('progress_update', 'Progress Update Submitted'),
        ('deadline_approaching', 'Deadline Approaching'),
        ('project_status_change', 'Project Status Changed'),
        ('schedule', 'Scheduled Time'),
        ('webhook', 'Webhook Received'),
    ]
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    # Who can use this workflow
    company = models.ForeignKey(
        'users.Company',
        on_delete=models.CASCADE,
        related_name='workflows'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_workflows'
    )
    
    # Workflow trigger
    trigger_type = models.CharField(max_length=50, choices=TRIGGER_TYPES)
    trigger_config = models.JSONField(
        default=dict,
        help_text="Configuration for the trigger (e.g., specific status values)"
    )
    
    # Filter which items trigger this workflow
    project_filter = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text="Only trigger for tasks in this project (optional)"
    )
    
    # Workflow state
    is_active = models.BooleanField(default=True)
    execution_count = models.IntegerField(default=0)
    last_executed = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Workflow'
        verbose_name_plural = 'Workflows'
    
    def __str__(self):
        return f"{self.name} ({self.get_trigger_type_display()})"
    
    def execute(self, context):
        """Execute all workflow steps in order."""
        if not self.is_active:
            return None
        
        execution = WorkflowExecution.objects.create(
            workflow=self,
            trigger_data=context
        )
        
        try:
            # Check conditions
            for condition in self.conditions.filter(is_active=True):
                if not condition.evaluate(context):
                    execution.status = 'skipped'
                    execution.result_data = {'reason': 'Condition not met'}
                    execution.completed_at = timezone.now()
                    execution.save()
                    return execution
            
            # Execute actions
            for action in self.actions.filter(is_active=True).order_by('order'):
                action.execute(context, execution)
            
            execution.status = 'completed'
            execution.completed_at = timezone.now()
            execution.save()
            
            self.execution_count += 1
            self.last_executed = timezone.now()
            self.save(update_fields=['execution_count', 'last_executed'])
            
        except Exception as e:
            execution.status = 'failed'
            execution.result_data = {'error': str(e)}
            execution.completed_at = timezone.now()
            execution.save()
        
        return execution


class WorkflowCondition(models.Model):
    """Conditions that must be met for workflow to execute."""
    
    CONDITION_TYPES = [
        ('field_equals', 'Field Equals Value'),
        ('field_contains', 'Field Contains Value'),
        ('field_in_list', 'Field In List'),
        ('user_role', 'User Has Role'),
        ('time_range', 'Within Time Range'),
        ('custom', 'Custom Expression'),
    ]
    
    workflow = models.ForeignKey(
        Workflow,
        on_delete=models.CASCADE,
        related_name='conditions'
    )
    condition_type = models.CharField(max_length=50, choices=CONDITION_TYPES)
    config = models.JSONField(
        default=dict,
        help_text="Condition configuration"
    )
    is_active = models.BooleanField(default=True)
    
    def evaluate(self, context):
        """Evaluate if condition is met."""
        if self.condition_type == 'field_equals':
            field = self.config.get('field')
            expected = self.config.get('value')
            actual = context.get(field)
            return actual == expected
        
        elif self.condition_type == 'field_contains':
            field = self.config.get('field')
            expected = self.config.get('value')
            actual = context.get(field, '')
            return expected in str(actual)
        
        elif self.condition_type == 'field_in_list':
            field = self.config.get('field')
            allowed = self.config.get('values', [])
            actual = context.get(field)
            return actual in allowed
        
        elif self.condition_type == 'user_role':
            required_roles = self.config.get('roles', [])
            user = context.get('user')
            if user:
                return user.role in required_roles
            return False
        
        elif self.condition_type == 'time_range':
            start_hour = self.config.get('start_hour', 0)
            end_hour = self.config.get('end_hour', 24)
            current_hour = timezone.now().hour
            return start_hour <= current_hour < end_hour
        
        return True
    
    class Meta:
        ordering = ['id']


class WorkflowAction(models.Model):
    """Actions to perform when workflow is triggered."""
    
    ACTION_TYPES = [
        # Notifications
        ('send_notification', 'Send In-App Notification'),
        ('send_email', 'Send Email'),
        ('send_slack', 'Send Slack Message'),
        ('send_teams', 'Send Teams Message'),
        ('send_webhook', 'Send Webhook'),
        
        # Task Operations
        ('update_task_status', 'Update Task Status'),
        ('update_task_priority', 'Update Task Priority'),
        ('assign_task', 'Assign Task'),
        ('create_subtask', 'Create Subtask'),
        ('add_comment', 'Add Comment'),
        
        # Dependency Operations
        ('update_dependent_tasks', 'Update Dependent Tasks'),
        ('recalculate_timeline', 'Recalculate Timeline'),
        
        # Project Operations
        ('update_project_status', 'Update Project Status'),
        
        # Escalation
        ('escalate_to_manager', 'Escalate to Manager'),
        ('create_escalation', 'Create Escalation Ticket'),
        
        # Integration
        ('sync_calendar', 'Sync to Calendar'),
        ('update_github_issue', 'Update GitHub Issue'),
    ]
    
    workflow = models.ForeignKey(
        Workflow,
        on_delete=models.CASCADE,
        related_name='actions'
    )
    action_type = models.CharField(max_length=50, choices=ACTION_TYPES)
    config = models.JSONField(
        default=dict,
        help_text="Action configuration"
    )
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['order']
    
    def execute(self, context, execution):
        """Execute this action."""
        from .services import WorkflowActionExecutor
        executor = WorkflowActionExecutor(self, context, execution)
        return executor.execute()


class WorkflowExecution(models.Model):
    """Log of workflow executions."""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('skipped', 'Skipped'),
    ]
    
    workflow = models.ForeignKey(
        Workflow,
        on_delete=models.CASCADE,
        related_name='executions'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    trigger_data = models.JSONField(default=dict)
    result_data = models.JSONField(default=dict)
    
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-started_at']


# ============================================================================
# 2. INTELLIGENT TASK DEPENDENCY MANAGEMENT
# ============================================================================

class TaskDependency(models.Model):
    """
    Task dependency relationships for intelligent timeline management.
    """
    
    DEPENDENCY_TYPES = [
        ('finish_to_start', 'Finish to Start'),  # Task B can't start until Task A finishes
        ('start_to_start', 'Start to Start'),    # Task B can't start until Task A starts
        ('finish_to_finish', 'Finish to Finish'), # Task B can't finish until Task A finishes
        ('start_to_finish', 'Start to Finish'),  # Task B can't finish until Task A starts
    ]
    
    predecessor = models.ForeignKey(
        'tasks.Task',
        on_delete=models.CASCADE,
        related_name='successor_dependencies'
    )
    successor = models.ForeignKey(
        'tasks.Task',
        on_delete=models.CASCADE,
        related_name='predecessor_dependencies'
    )
    dependency_type = models.CharField(
        max_length=20,
        choices=DEPENDENCY_TYPES,
        default='finish_to_start'
    )
    
    # Lag time (can be negative for lead time)
    lag_days = models.IntegerField(
        default=0,
        help_text="Days of lag (positive) or lead (negative) time"
    )
    
    # Auto-adjustment settings
    auto_adjust_dates = models.BooleanField(
        default=True,
        help_text="Automatically adjust successor dates when predecessor changes"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['predecessor', 'successor']
        verbose_name = 'Task Dependency'
        verbose_name_plural = 'Task Dependencies'
    
    def __str__(self):
        return f"{self.predecessor.title} → {self.successor.title}"
    
    def clean(self):
        """Validate no circular dependencies."""
        from django.core.exceptions import ValidationError
        if self.predecessor == self.successor:
            raise ValidationError("A task cannot depend on itself.")
        # Check for circular dependency
        if self._creates_cycle():
            raise ValidationError("This dependency would create a circular dependency.")
    
    def _creates_cycle(self):
        """Check if adding this dependency would create a cycle."""
        visited = set()
        stack = [self.predecessor]
        
        while stack:
            current = stack.pop()
            if current == self.successor:
                return True
            if current.id not in visited:
                visited.add(current.id)
                # Get all predecessors of current task
                for dep in TaskDependency.objects.filter(successor=current):
                    stack.append(dep.predecessor)
        return False


class DependencyBottleneck(models.Model):
    """
    AI-detected bottlenecks in task dependencies.
    """
    
    SEVERITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    task = models.ForeignKey(
        'tasks.Task',
        on_delete=models.CASCADE,
        related_name='bottlenecks'
    )
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES)
    
    # Bottleneck details
    blocking_count = models.IntegerField(
        default=0,
        help_text="Number of tasks blocked by this task"
    )
    cascade_delay_days = models.FloatField(
        default=0,
        help_text="Estimated cascade delay in days if this task is late"
    )
    affected_deadline = models.DateTimeField(
        null=True,
        blank=True,
        help_text="The final deadline that would be affected"
    )
    
    # AI predictions
    delay_probability = models.FloatField(
        default=0,
        help_text="Probability this task will cause delays (0-1)"
    )
    suggested_actions = models.JSONField(
        default=list,
        help_text="AI-suggested actions to prevent bottleneck"
    )
    
    # Status
    is_resolved = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-severity', '-cascade_delay_days']


# ============================================================================
# 3. AUTOMATED ESCALATION SYSTEM
# ============================================================================

class EscalationRule(models.Model):
    """
    Rules for automatic escalation of tasks.
    """
    
    TRIGGER_TYPES = [
        ('overdue', 'Task Overdue'),
        ('blocked', 'Task Blocked'),
        ('no_progress', 'No Progress Updates'),
        ('approaching_deadline', 'Approaching Deadline'),
        ('high_priority_blocked', 'High Priority Blocked'),
    ]
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    company = models.ForeignKey(
        'users.Company',
        on_delete=models.CASCADE,
        related_name='escalation_rules'
    )
    
    trigger_type = models.CharField(max_length=50, choices=TRIGGER_TYPES)
    
    # Timing
    trigger_after_hours = models.IntegerField(
        default=24,
        help_text="Hours after condition is met before escalation triggers"
    )
    
    # Filter
    priority_filter = models.CharField(
        max_length=20,
        blank=True,
        help_text="Only escalate tasks with this priority (leave blank for all)"
    )
    project_filter = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    
    # Escalation target
    escalate_to_manager = models.BooleanField(default=True)
    escalate_to_users = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name='escalation_rules_recipient'
    )
    
    # Actions
    send_email = models.BooleanField(default=True)
    send_notification = models.BooleanField(default=True)
    send_slack = models.BooleanField(default=False)
    auto_reassign = models.BooleanField(default=False)
    
    # State
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        verbose_name = 'Escalation Rule'
        verbose_name_plural = 'Escalation Rules'
    
    def __str__(self):
        return f"{self.name} ({self.get_trigger_type_display()})"


class Escalation(models.Model):
    """
    Escalation instances created when rules are triggered.
    """
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('acknowledged', 'Acknowledged'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('dismissed', 'Dismissed'),
    ]
    
    task = models.ForeignKey(
        'tasks.Task',
        on_delete=models.CASCADE,
        related_name='escalations'
    )
    rule = models.ForeignKey(
        EscalationRule,
        on_delete=models.SET_NULL,
        null=True,
        related_name='escalations'
    )
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Escalation details
    reason = models.TextField()
    suggested_actions = models.JSONField(
        default=list,
        help_text="AI-suggested actions to resolve"
    )
    
    # Who was notified
    escalated_to = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='received_escalations'
    )
    
    # Resolution
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='resolved_escalations'
    )
    resolution_notes = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Escalation for {self.task.title}"
    
    def acknowledge(self, user):
        """Acknowledge the escalation."""
        self.status = 'acknowledged'
        self.acknowledged_at = timezone.now()
        self.save()
    
    def resolve(self, user, notes=''):
        """Resolve the escalation."""
        self.status = 'resolved'
        self.resolved_by = user
        self.resolution_notes = notes
        self.resolved_at = timezone.now()
        self.save()


# ============================================================================
# 8. INTEGRATED CALENDAR & SCHEDULING
# ============================================================================

class CalendarEvent(models.Model):
    """
    Calendar events synced from external calendars or created internally.
    """
    
    EVENT_TYPES = [
        ('task_deadline', 'Task Deadline'),
        ('meeting', 'Meeting'),
        ('milestone', 'Milestone'),
        ('reminder', 'Reminder'),
        ('external', 'External Event'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='calendar_events'
    )
    
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES)
    
    # Timing
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    all_day = models.BooleanField(default=False)
    
    # Recurrence
    is_recurring = models.BooleanField(default=False)
    recurrence_rule = models.CharField(
        max_length=255,
        blank=True,
        help_text="iCal RRULE format"
    )
    
    # Linked entities
    task = models.ForeignKey(
        'tasks.Task',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='calendar_events'
    )
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='calendar_events'
    )
    
    # External sync
    external_id = models.CharField(max_length=255, blank=True)
    external_source = models.CharField(max_length=50, blank=True)
    external_link = models.URLField(blank=True)
    
    # State
    is_synced = models.BooleanField(default=False)
    last_synced = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['start_time']
    
    def __str__(self):
        return f"{self.title} ({self.start_time.strftime('%Y-%m-%d %H:%M')})"


class ScheduleSuggestion(models.Model):
    """
    AI-generated scheduling suggestions to avoid conflicts.
    """
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='schedule_suggestions'
    )
    task = models.ForeignKey(
        'tasks.Task',
        on_delete=models.CASCADE,
        related_name='schedule_suggestions'
    )
    
    # Suggested time
    suggested_start = models.DateTimeField()
    suggested_end = models.DateTimeField()
    
    # Reasoning
    reason = models.TextField()
    confidence_score = models.FloatField(default=0.5)
    
    # Conflicts avoided
    conflicts_avoided = models.JSONField(
        default=list,
        help_text="List of events that would conflict"
    )
    
    # State
    is_accepted = models.BooleanField(default=False)
    is_dismissed = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-confidence_score', '-created_at']


# ============================================================================
# 9. SLACK/TEAMS INTEGRATION
# ============================================================================

class ChatIntegration(models.Model):
    """
    Chat platform integrations (Slack, Microsoft Teams).
    """
    
    PLATFORM_CHOICES = [
        ('slack', 'Slack'),
        ('teams', 'Microsoft Teams'),
        ('discord', 'Discord'),
    ]
    
    company = models.ForeignKey(
        'users.Company',
        on_delete=models.CASCADE,
        related_name='chat_integrations'
    )
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES)
    
    # OAuth tokens
    access_token = models.TextField()
    refresh_token = models.TextField(blank=True)
    token_expires_at = models.DateTimeField(null=True, blank=True)
    
    # Workspace/Team info
    workspace_id = models.CharField(max_length=255)
    workspace_name = models.CharField(max_length=255)
    
    # Bot info
    bot_user_id = models.CharField(max_length=255, blank=True)
    
    # Settings
    default_channel_id = models.CharField(max_length=255, blank=True)
    notify_task_assigned = models.BooleanField(default=True)
    notify_task_completed = models.BooleanField(default=True)
    notify_daily_standup = models.BooleanField(default=True)
    standup_time = models.TimeField(null=True, blank=True)
    
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['company', 'platform']
    
    def __str__(self):
        return f"{self.company.name} - {self.get_platform_display()}"


class ChatCommand(models.Model):
    """
    Commands received from chat platforms.
    """
    
    COMMAND_TYPES = [
        ('create_task', 'Create Task'),
        ('update_task', 'Update Task'),
        ('log_time', 'Log Time'),
        ('get_status', 'Get Status'),
        ('list_tasks', 'List Tasks'),
        ('standup', 'Daily Standup'),
    ]
    
    integration = models.ForeignKey(
        ChatIntegration,
        on_delete=models.CASCADE,
        related_name='commands'
    )
    
    command_type = models.CharField(max_length=50, choices=COMMAND_TYPES)
    raw_text = models.TextField()
    parsed_data = models.JSONField(default=dict)
    
    # User who sent command
    chat_user_id = models.CharField(max_length=255)
    linked_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    
    # Response
    response_text = models.TextField(blank=True)
    is_processed = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']


# ============================================================================
# 10. GITHUB/GITLAB INTEGRATION
# ============================================================================

class GitIntegration(models.Model):
    """
    Git platform integrations (GitHub, GitLab).
    """
    
    PLATFORM_CHOICES = [
        ('github', 'GitHub'),
        ('gitlab', 'GitLab'),
        ('bitbucket', 'Bitbucket'),
    ]
    
    company = models.ForeignKey(
        'users.Company',
        on_delete=models.CASCADE,
        related_name='git_integrations'
    )
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES)
    
    # OAuth tokens
    access_token = models.TextField()
    refresh_token = models.TextField(blank=True)
    token_expires_at = models.DateTimeField(null=True, blank=True)
    
    # Repository info
    organization = models.CharField(max_length=255, blank=True)
    
    # Settings
    sync_issues = models.BooleanField(default=True)
    sync_pull_requests = models.BooleanField(default=True)
    auto_create_tasks = models.BooleanField(default=False)
    auto_update_progress = models.BooleanField(default=True)
    
    is_active = models.BooleanField(default=True)
    
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['company', 'platform']
    
    def __str__(self):
        return f"{self.company.name} - {self.get_platform_display()}"


class GitRepository(models.Model):
    """
    Repositories linked to projects.
    """
    
    integration = models.ForeignKey(
        GitIntegration,
        on_delete=models.CASCADE,
        related_name='repositories'
    )
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        related_name='git_repositories'
    )
    
    repo_id = models.CharField(max_length=255)
    repo_name = models.CharField(max_length=255)
    repo_full_name = models.CharField(max_length=500)
    repo_url = models.URLField()
    
    # Webhook
    webhook_id = models.CharField(max_length=255, blank=True)
    webhook_secret = models.CharField(max_length=255, blank=True)
    
    # Sync settings
    sync_enabled = models.BooleanField(default=True)
    last_synced = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['integration', 'repo_id']
    
    def __str__(self):
        return self.repo_full_name


class GitEvent(models.Model):
    """
    Events received from Git webhooks.
    """
    
    EVENT_TYPES = [
        ('push', 'Push'),
        ('pull_request', 'Pull Request'),
        ('issue', 'Issue'),
        ('commit', 'Commit'),
        ('branch', 'Branch'),
        ('release', 'Release'),
    ]
    
    repository = models.ForeignKey(
        GitRepository,
        on_delete=models.CASCADE,
        related_name='events'
    )
    
    event_type = models.CharField(max_length=50, choices=EVENT_TYPES)
    event_id = models.CharField(max_length=255)
    event_data = models.JSONField(default=dict)
    
    # Linked entities
    linked_task = models.ForeignKey(
        'tasks.Task',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='git_events'
    )
    
    is_processed = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        unique_together = ['repository', 'event_id']


# ============================================================================
# 11. AUTOMATED PERSONALIZED DASHBOARDS
# ============================================================================

class PersonalizedDashboard(models.Model):
    """
    User-customizable dashboard configurations.
    """
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='dashboards'
    )
    
    name = models.CharField(max_length=255)
    is_default = models.BooleanField(default=False)
    
    # Layout configuration
    layout = models.JSONField(
        default=list,
        help_text="Dashboard widget layout configuration"
    )
    
    # Auto-refresh settings
    auto_refresh = models.BooleanField(default=True)
    refresh_interval_seconds = models.IntegerField(default=300)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-is_default', 'name']
    
    def __str__(self):
        return f"{self.user.name}'s {self.name}"


class DashboardWidget(models.Model):
    """
    Individual widgets on a dashboard.
    """
    
    WIDGET_TYPES = [
        ('task_summary', 'Task Summary'),
        ('progress_chart', 'Progress Chart'),
        ('time_tracking', 'Time Tracking'),
        ('upcoming_deadlines', 'Upcoming Deadlines'),
        ('team_activity', 'Team Activity'),
        ('project_health', 'Project Health'),
        ('productivity_metrics', 'Productivity Metrics'),
        ('burnout_indicator', 'Burnout Indicator'),
        ('ai_insights', 'AI Insights'),
        ('calendar', 'Calendar'),
        ('notifications', 'Recent Notifications'),
        ('quick_actions', 'Quick Actions'),
        ('custom_chart', 'Custom Chart'),
    ]
    
    dashboard = models.ForeignKey(
        PersonalizedDashboard,
        on_delete=models.CASCADE,
        related_name='widgets'
    )
    
    widget_type = models.CharField(max_length=50, choices=WIDGET_TYPES)
    title = models.CharField(max_length=255, blank=True)
    
    # Position and size
    position_x = models.IntegerField(default=0)
    position_y = models.IntegerField(default=0)
    width = models.IntegerField(default=4)  # Grid units
    height = models.IntegerField(default=2)  # Grid units
    
    # Widget-specific configuration
    config = models.JSONField(default=dict)
    
    # Visibility
    is_visible = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['position_y', 'position_x']
    
    def __str__(self):
        return f"{self.get_widget_type_display()} - {self.dashboard.name}"


# ============================================================================
# 12. PREDICTIVE BURNOUT DETECTION
# ============================================================================

class BurnoutIndicator(models.Model):
    """
    Burnout risk indicators for users.
    """
    
    RISK_LEVELS = [
        ('low', 'Low'),
        ('moderate', 'Moderate'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='burnout_indicators'
    )
    
    risk_level = models.CharField(max_length=20, choices=RISK_LEVELS)
    risk_score = models.FloatField(
        help_text="Risk score 0-100"
    )
    
    # Contributing factors
    factors = models.JSONField(
        default=dict,
        help_text="Breakdown of contributing factors"
    )
    
    # Metrics used
    avg_hours_per_week = models.FloatField(default=0)
    consecutive_overtime_weeks = models.IntegerField(default=0)
    tasks_overdue = models.IntegerField(default=0)
    no_break_days = models.IntegerField(default=0)
    meeting_hours = models.FloatField(default=0)
    progress_update_sentiment = models.FloatField(default=0)  # -1 to 1
    
    # Recommendations
    recommendations = models.JSONField(
        default=list,
        help_text="AI-generated recommendations"
    )
    
    # Manager notification
    manager_notified = models.BooleanField(default=False)
    manager_notified_at = models.DateTimeField(null=True, blank=True)
    
    # Resolution
    is_addressed = models.BooleanField(default=False)
    addressed_at = models.DateTimeField(null=True, blank=True)
    addressed_notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.name} - {self.get_risk_level_display()} Risk"


class WorkloadSnapshot(models.Model):
    """
    Daily workload snapshots for burnout prediction.
    """
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='workload_snapshots'
    )
    
    date = models.DateField()
    
    # Task metrics
    active_tasks = models.IntegerField(default=0)
    completed_tasks = models.IntegerField(default=0)
    overdue_tasks = models.IntegerField(default=0)
    blocked_tasks = models.IntegerField(default=0)
    
    # Time metrics
    hours_worked = models.FloatField(default=0)
    meeting_hours = models.FloatField(default=0)
    overtime_hours = models.FloatField(default=0)
    
    # Productivity metrics
    tasks_started = models.IntegerField(default=0)
    tasks_completed_on_time = models.IntegerField(default=0)
    progress_updates = models.IntegerField(default=0)
    
    # Sentiment (from progress update text)
    avg_sentiment_score = models.FloatField(default=0)  # -1 to 1
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'date']
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.user.name} - {self.date}"


# ============================================================================
# 5. MOBILE TIME TRACKING (Location-based)
# ============================================================================

class LocationBasedTracking(models.Model):
    """
    Configuration for location-based automatic time tracking.
    """
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='location_tracking_configs'
    )
    
    name = models.CharField(max_length=255)  # e.g., "Office", "Home"
    
    # Location
    latitude = models.FloatField()
    longitude = models.FloatField()
    radius_meters = models.IntegerField(default=100)  # Geofence radius
    
    # Behavior
    auto_start = models.BooleanField(default=True)
    auto_stop = models.BooleanField(default=True)
    default_task = models.ForeignKey(
        'tasks.Task',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Location Tracking Config'
        verbose_name_plural = 'Location Tracking Configs'
    
    def __str__(self):
        return f"{self.user.name} - {self.name}"


class LocationCheckIn(models.Model):
    """
    Check-in/check-out events for location-based tracking.
    """
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='location_checkins'
    )
    location_config = models.ForeignKey(
        LocationBasedTracking,
        on_delete=models.CASCADE,
        related_name='checkins'
    )
    
    check_in_time = models.DateTimeField()
    check_out_time = models.DateTimeField(null=True, blank=True)
    
    # Actual location recorded
    check_in_lat = models.FloatField()
    check_in_lon = models.FloatField()
    check_out_lat = models.FloatField(null=True, blank=True)
    check_out_lon = models.FloatField(null=True, blank=True)
    
    # Linked time entry
    time_entry = models.ForeignKey(
        'analytics.TimeEntry',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-check_in_time']


# ============================================================================
# 6. VOICE COMMAND LOG
# ============================================================================

class VoiceCommand(models.Model):
    """
    Log of voice commands processed.
    """
    
    COMMAND_TYPES = [
        ('create_task', 'Create Task'),
        ('update_progress', 'Update Progress'),
        ('log_time', 'Log Time'),
        ('get_summary', 'Get Summary'),
        ('list_tasks', 'List Tasks'),
        ('add_note', 'Add Note'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='voice_commands'
    )
    
    command_type = models.CharField(max_length=50, choices=COMMAND_TYPES)
    raw_transcript = models.TextField()
    parsed_intent = models.JSONField(default=dict)
    
    # Result
    is_successful = models.BooleanField(default=False)
    result_message = models.TextField(blank=True)
    
    # Linked entities created/modified
    linked_task = models.ForeignKey(
        'tasks.Task',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']


# ============================================================================
# 7. PREDICTIVE RESOURCE ALLOCATION
# ============================================================================

class ResourceAllocationSuggestion(models.Model):
    """
    AI-generated resource allocation suggestions.
    """
    
    SUGGESTION_TYPES = [
        ('reassign', 'Reassign Task'),
        ('redistribute', 'Redistribute Workload'),
        ('hire', 'Suggest Hiring'),
        ('skill_gap', 'Skill Gap Detected'),
        ('overload', 'Overload Warning'),
    ]
    
    company = models.ForeignKey(
        'users.Company',
        on_delete=models.CASCADE,
        related_name='resource_suggestions'
    )
    
    suggestion_type = models.CharField(max_length=50, choices=SUGGESTION_TYPES)
    
    # Affected entities
    task = models.ForeignKey(
        'tasks.Task',
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    from_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='resource_from_suggestions'
    )
    to_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='resource_to_suggestions'
    )
    
    # Reasoning
    reason = models.TextField()
    impact_score = models.FloatField(
        help_text="Expected positive impact (0-100)"
    )
    confidence_score = models.FloatField(
        help_text="AI confidence in suggestion (0-1)"
    )
    
    # Supporting data
    supporting_data = models.JSONField(default=dict)
    
    # State
    is_applied = models.BooleanField(default=False)
    is_dismissed = models.BooleanField(default=False)
    applied_at = models.DateTimeField(null=True, blank=True)
    applied_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='applied_suggestions'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-impact_score', '-created_at']
    
    def __str__(self):
        return f"{self.get_suggestion_type_display()} - {self.reason[:50]}"
