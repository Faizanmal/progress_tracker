"""
Admin configuration for automation models.
"""
from django.contrib import admin
from .models import (
    Workflow, WorkflowCondition, WorkflowAction, WorkflowExecution,
    TaskDependency, DependencyBottleneck,
    EscalationRule, Escalation,
    CalendarEvent, ScheduleSuggestion,
    ChatIntegration, ChatCommand,
    GitIntegration, GitRepository, GitEvent,
    PersonalizedDashboard, DashboardWidget,
    BurnoutIndicator, WorkloadSnapshot,
    LocationBasedTracking, LocationCheckIn,
    VoiceCommand,
    ResourceAllocationSuggestion,
)


# ============================================================================
# WORKFLOW ADMIN
# ============================================================================

class WorkflowConditionInline(admin.TabularInline):
    model = WorkflowCondition
    extra = 0


class WorkflowActionInline(admin.TabularInline):
    model = WorkflowAction
    extra = 0


@admin.register(Workflow)
class WorkflowAdmin(admin.ModelAdmin):
    list_display = ['name', 'company', 'trigger_type', 'is_active', 'execution_count', 'last_executed']
    list_filter = ['is_active', 'trigger_type', 'company']
    search_fields = ['name', 'description']
    inlines = [WorkflowConditionInline, WorkflowActionInline]


@admin.register(WorkflowExecution)
class WorkflowExecutionAdmin(admin.ModelAdmin):
    list_display = ['workflow', 'status', 'started_at', 'completed_at']
    list_filter = ['status', 'workflow']


# ============================================================================
# DEPENDENCY ADMIN
# ============================================================================

@admin.register(TaskDependency)
class TaskDependencyAdmin(admin.ModelAdmin):
    list_display = ['predecessor', 'successor', 'dependency_type', 'lag_days', 'auto_adjust_dates']
    list_filter = ['dependency_type', 'auto_adjust_dates']
    search_fields = ['predecessor__title', 'successor__title']


@admin.register(DependencyBottleneck)
class DependencyBottleneckAdmin(admin.ModelAdmin):
    list_display = ['task', 'severity', 'blocking_count', 'delay_probability', 'is_resolved']
    list_filter = ['severity', 'is_resolved']


# ============================================================================
# ESCALATION ADMIN
# ============================================================================

@admin.register(EscalationRule)
class EscalationRuleAdmin(admin.ModelAdmin):
    list_display = ['name', 'company', 'trigger_type', 'trigger_after_hours', 'is_active']
    list_filter = ['is_active', 'trigger_type', 'company']
    search_fields = ['name', 'description']


@admin.register(Escalation)
class EscalationAdmin(admin.ModelAdmin):
    list_display = ['task', 'status', 'rule', 'created_at', 'resolved_at']
    list_filter = ['status', 'rule']
    search_fields = ['task__title', 'reason']


# ============================================================================
# CALENDAR ADMIN
# ============================================================================

@admin.register(CalendarEvent)
class CalendarEventAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'event_type', 'start_time', 'end_time', 'is_synced']
    list_filter = ['event_type', 'is_synced', 'is_recurring']
    search_fields = ['title', 'user__name']


@admin.register(ScheduleSuggestion)
class ScheduleSuggestionAdmin(admin.ModelAdmin):
    list_display = ['task', 'user', 'suggested_start', 'confidence_score', 'is_accepted']
    list_filter = ['is_accepted', 'is_dismissed']


# ============================================================================
# INTEGRATION ADMIN
# ============================================================================

@admin.register(ChatIntegration)
class ChatIntegrationAdmin(admin.ModelAdmin):
    list_display = ['company', 'platform', 'workspace_name', 'is_active']
    list_filter = ['platform', 'is_active']


@admin.register(GitIntegration)
class GitIntegrationAdmin(admin.ModelAdmin):
    list_display = ['company', 'platform', 'organization', 'is_active']
    list_filter = ['platform', 'is_active']


@admin.register(GitRepository)
class GitRepositoryAdmin(admin.ModelAdmin):
    list_display = ['repo_full_name', 'project', 'sync_enabled', 'last_synced']
    list_filter = ['sync_enabled', 'integration__platform']


@admin.register(GitEvent)
class GitEventAdmin(admin.ModelAdmin):
    list_display = ['repository', 'event_type', 'event_id', 'is_processed', 'created_at']
    list_filter = ['event_type', 'is_processed']


# ============================================================================
# DASHBOARD ADMIN
# ============================================================================

class DashboardWidgetInline(admin.TabularInline):
    model = DashboardWidget
    extra = 0


@admin.register(PersonalizedDashboard)
class PersonalizedDashboardAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'is_default', 'auto_refresh']
    list_filter = ['is_default', 'auto_refresh']
    inlines = [DashboardWidgetInline]


# ============================================================================
# BURNOUT ADMIN
# ============================================================================

@admin.register(BurnoutIndicator)
class BurnoutIndicatorAdmin(admin.ModelAdmin):
    list_display = ['user', 'risk_level', 'risk_score', 'manager_notified', 'is_addressed', 'created_at']
    list_filter = ['risk_level', 'is_addressed', 'manager_notified']
    search_fields = ['user__name', 'user__email']


@admin.register(WorkloadSnapshot)
class WorkloadSnapshotAdmin(admin.ModelAdmin):
    list_display = ['user', 'date', 'active_tasks', 'hours_worked', 'overtime_hours']
    list_filter = ['date']


# ============================================================================
# LOCATION & VOICE ADMIN
# ============================================================================

@admin.register(LocationBasedTracking)
class LocationBasedTrackingAdmin(admin.ModelAdmin):
    list_display = ['user', 'name', 'is_active', 'auto_start', 'auto_stop']
    list_filter = ['is_active', 'auto_start', 'auto_stop']


@admin.register(LocationCheckIn)
class LocationCheckInAdmin(admin.ModelAdmin):
    list_display = ['user', 'location_config', 'check_in_time', 'check_out_time']


@admin.register(VoiceCommand)
class VoiceCommandAdmin(admin.ModelAdmin):
    list_display = ['user', 'command_type', 'is_successful', 'created_at']
    list_filter = ['command_type', 'is_successful']


# ============================================================================
# RESOURCE ALLOCATION ADMIN
# ============================================================================

@admin.register(ResourceAllocationSuggestion)
class ResourceAllocationSuggestionAdmin(admin.ModelAdmin):
    list_display = ['suggestion_type', 'company', 'impact_score', 'is_applied', 'is_dismissed', 'created_at']
    list_filter = ['suggestion_type', 'is_applied', 'is_dismissed']
