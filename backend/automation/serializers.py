"""
Serializers for automation models.
"""
from rest_framework import serializers
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
# WORKFLOW SERIALIZERS
# ============================================================================

class WorkflowConditionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkflowCondition
        fields = ['id', 'condition_type', 'config', 'is_active']


class WorkflowActionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkflowAction
        fields = ['id', 'action_type', 'config', 'order', 'is_active']


class WorkflowSerializer(serializers.ModelSerializer):
    conditions = WorkflowConditionSerializer(many=True, read_only=True)
    actions = WorkflowActionSerializer(many=True, read_only=True)
    trigger_type_display = serializers.CharField(source='get_trigger_type_display', read_only=True)
    
    class Meta:
        model = Workflow
        fields = [
            'id', 'name', 'description', 'trigger_type', 'trigger_type_display',
            'trigger_config', 'project_filter', 'is_active', 'execution_count',
            'last_executed', 'conditions', 'actions', 'created_at', 'updated_at'
        ]
        read_only_fields = ['execution_count', 'last_executed', 'created_at', 'updated_at']


class WorkflowCreateSerializer(serializers.ModelSerializer):
    conditions = WorkflowConditionSerializer(many=True, required=False)
    actions = WorkflowActionSerializer(many=True, required=False)
    
    class Meta:
        model = Workflow
        fields = [
            'id', 'name', 'description', 'trigger_type', 'trigger_config',
            'project_filter', 'is_active', 'conditions', 'actions'
        ]
    
    def create(self, validated_data):
        conditions_data = validated_data.pop('conditions', [])
        actions_data = validated_data.pop('actions', [])
        
        workflow = Workflow.objects.create(**validated_data)
        
        for condition_data in conditions_data:
            WorkflowCondition.objects.create(workflow=workflow, **condition_data)
        
        for i, action_data in enumerate(actions_data):
            action_data['order'] = i
            WorkflowAction.objects.create(workflow=workflow, **action_data)
        
        return workflow


class WorkflowExecutionSerializer(serializers.ModelSerializer):
    workflow_name = serializers.CharField(source='workflow.name', read_only=True)
    
    class Meta:
        model = WorkflowExecution
        fields = [
            'id', 'workflow', 'workflow_name', 'status', 'trigger_data',
            'result_data', 'started_at', 'completed_at'
        ]


# ============================================================================
# DEPENDENCY SERIALIZERS
# ============================================================================

class TaskDependencySerializer(serializers.ModelSerializer):
    predecessor_title = serializers.CharField(source='predecessor.title', read_only=True)
    successor_title = serializers.CharField(source='successor.title', read_only=True)
    dependency_type_display = serializers.CharField(source='get_dependency_type_display', read_only=True)
    
    class Meta:
        model = TaskDependency
        fields = [
            'id', 'predecessor', 'predecessor_title', 'successor', 'successor_title',
            'dependency_type', 'dependency_type_display', 'lag_days', 'auto_adjust_dates',
            'created_at'
        ]


class DependencyBottleneckSerializer(serializers.ModelSerializer):
    task_title = serializers.CharField(source='task.title', read_only=True)
    severity_display = serializers.CharField(source='get_severity_display', read_only=True)
    
    class Meta:
        model = DependencyBottleneck
        fields = [
            'id', 'task', 'task_title', 'severity', 'severity_display',
            'blocking_count', 'cascade_delay_days', 'affected_deadline',
            'delay_probability', 'suggested_actions', 'is_resolved',
            'resolved_at', 'created_at'
        ]


# ============================================================================
# ESCALATION SERIALIZERS
# ============================================================================

class EscalationRuleSerializer(serializers.ModelSerializer):
    trigger_type_display = serializers.CharField(source='get_trigger_type_display', read_only=True)
    
    class Meta:
        model = EscalationRule
        fields = [
            'id', 'name', 'description', 'trigger_type', 'trigger_type_display',
            'trigger_after_hours', 'priority_filter', 'project_filter',
            'escalate_to_manager', 'escalate_to_users', 'send_email',
            'send_notification', 'send_slack', 'auto_reassign', 'is_active',
            'created_at', 'updated_at'
        ]


class EscalationSerializer(serializers.ModelSerializer):
    task_title = serializers.CharField(source='task.title', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    escalated_to_names = serializers.SerializerMethodField()
    
    class Meta:
        model = Escalation
        fields = [
            'id', 'task', 'task_title', 'rule', 'status', 'status_display',
            'reason', 'suggested_actions', 'escalated_to', 'escalated_to_names',
            'resolved_by', 'resolution_notes', 'created_at', 'acknowledged_at',
            'resolved_at'
        ]
    
    def get_escalated_to_names(self, obj):
        return [user.name for user in obj.escalated_to.all()]


# ============================================================================
# CALENDAR SERIALIZERS
# ============================================================================

class CalendarEventSerializer(serializers.ModelSerializer):
    event_type_display = serializers.CharField(source='get_event_type_display', read_only=True)
    task_title = serializers.CharField(source='task.title', read_only=True, allow_null=True)
    project_title = serializers.CharField(source='project.title', read_only=True, allow_null=True)
    
    class Meta:
        model = CalendarEvent
        fields = [
            'id', 'title', 'description', 'event_type', 'event_type_display',
            'start_time', 'end_time', 'all_day', 'is_recurring', 'recurrence_rule',
            'task', 'task_title', 'project', 'project_title',
            'external_id', 'external_source', 'external_link',
            'is_synced', 'last_synced', 'created_at', 'updated_at'
        ]


class ScheduleSuggestionSerializer(serializers.ModelSerializer):
    task_title = serializers.CharField(source='task.title', read_only=True)
    
    class Meta:
        model = ScheduleSuggestion
        fields = [
            'id', 'task', 'task_title', 'suggested_start', 'suggested_end',
            'reason', 'confidence_score', 'conflicts_avoided',
            'is_accepted', 'is_dismissed', 'created_at'
        ]


# ============================================================================
# INTEGRATION SERIALIZERS
# ============================================================================

class ChatIntegrationSerializer(serializers.ModelSerializer):
    platform_display = serializers.CharField(source='get_platform_display', read_only=True)
    
    class Meta:
        model = ChatIntegration
        fields = [
            'id', 'platform', 'platform_display', 'workspace_id', 'workspace_name',
            'default_channel_id', 'notify_task_assigned', 'notify_task_completed',
            'notify_daily_standup', 'standup_time', 'is_active', 'created_at'
        ]
        read_only_fields = ['workspace_id', 'workspace_name', 'created_at']


class GitIntegrationSerializer(serializers.ModelSerializer):
    platform_display = serializers.CharField(source='get_platform_display', read_only=True)
    
    class Meta:
        model = GitIntegration
        fields = [
            'id', 'platform', 'platform_display', 'organization',
            'sync_issues', 'sync_pull_requests', 'auto_create_tasks',
            'auto_update_progress', 'is_active', 'created_at'
        ]


class GitRepositorySerializer(serializers.ModelSerializer):
    class Meta:
        model = GitRepository
        fields = [
            'id', 'integration', 'project', 'repo_id', 'repo_name',
            'repo_full_name', 'repo_url', 'sync_enabled', 'last_synced', 'created_at'
        ]


class GitEventSerializer(serializers.ModelSerializer):
    event_type_display = serializers.CharField(source='get_event_type_display', read_only=True)
    
    class Meta:
        model = GitEvent
        fields = [
            'id', 'repository', 'event_type', 'event_type_display',
            'event_id', 'event_data', 'linked_task', 'is_processed', 'created_at'
        ]


# ============================================================================
# DASHBOARD SERIALIZERS
# ============================================================================

class DashboardWidgetSerializer(serializers.ModelSerializer):
    widget_type_display = serializers.CharField(source='get_widget_type_display', read_only=True)
    
    class Meta:
        model = DashboardWidget
        fields = [
            'id', 'widget_type', 'widget_type_display', 'title',
            'position_x', 'position_y', 'width', 'height',
            'config', 'is_visible', 'created_at', 'updated_at'
        ]


class PersonalizedDashboardSerializer(serializers.ModelSerializer):
    widgets = DashboardWidgetSerializer(many=True, read_only=True)
    
    class Meta:
        model = PersonalizedDashboard
        fields = [
            'id', 'name', 'is_default', 'layout', 'auto_refresh',
            'refresh_interval_seconds', 'widgets', 'created_at', 'updated_at'
        ]


class PersonalizedDashboardCreateSerializer(serializers.ModelSerializer):
    widgets = DashboardWidgetSerializer(many=True, required=False)
    
    class Meta:
        model = PersonalizedDashboard
        fields = [
            'id', 'name', 'is_default', 'layout', 'auto_refresh',
            'refresh_interval_seconds', 'widgets'
        ]
    
    def create(self, validated_data):
        widgets_data = validated_data.pop('widgets', [])
        dashboard = PersonalizedDashboard.objects.create(**validated_data)
        
        for widget_data in widgets_data:
            DashboardWidget.objects.create(dashboard=dashboard, **widget_data)
        
        return dashboard


# ============================================================================
# BURNOUT SERIALIZERS
# ============================================================================

class BurnoutIndicatorSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.name', read_only=True)
    risk_level_display = serializers.CharField(source='get_risk_level_display', read_only=True)
    
    class Meta:
        model = BurnoutIndicator
        fields = [
            'id', 'user', 'user_name', 'risk_level', 'risk_level_display',
            'risk_score', 'factors', 'avg_hours_per_week', 'consecutive_overtime_weeks',
            'tasks_overdue', 'no_break_days', 'meeting_hours', 'progress_update_sentiment',
            'recommendations', 'manager_notified', 'manager_notified_at',
            'is_addressed', 'addressed_at', 'addressed_notes', 'created_at'
        ]


class WorkloadSnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkloadSnapshot
        fields = [
            'id', 'user', 'date', 'active_tasks', 'completed_tasks',
            'overdue_tasks', 'blocked_tasks', 'hours_worked', 'meeting_hours',
            'overtime_hours', 'tasks_started', 'tasks_completed_on_time',
            'progress_updates', 'avg_sentiment_score', 'created_at'
        ]


# ============================================================================
# LOCATION & VOICE SERIALIZERS
# ============================================================================

class LocationBasedTrackingSerializer(serializers.ModelSerializer):
    class Meta:
        model = LocationBasedTracking
        fields = [
            'id', 'name', 'latitude', 'longitude', 'radius_meters',
            'auto_start', 'auto_stop', 'default_task', 'is_active',
            'created_at', 'updated_at'
        ]


class LocationCheckInSerializer(serializers.ModelSerializer):
    location_name = serializers.CharField(source='location_config.name', read_only=True)
    
    class Meta:
        model = LocationCheckIn
        fields = [
            'id', 'location_config', 'location_name', 'check_in_time', 'check_out_time',
            'check_in_lat', 'check_in_lon', 'check_out_lat', 'check_out_lon',
            'time_entry', 'created_at'
        ]


class VoiceCommandSerializer(serializers.ModelSerializer):
    command_type_display = serializers.CharField(source='get_command_type_display', read_only=True)
    
    class Meta:
        model = VoiceCommand
        fields = [
            'id', 'command_type', 'command_type_display', 'raw_transcript',
            'parsed_intent', 'is_successful', 'result_message', 'linked_task',
            'created_at'
        ]


class VoiceCommandInputSerializer(serializers.Serializer):
    """Serializer for voice command input."""
    transcript = serializers.CharField()


# ============================================================================
# RESOURCE ALLOCATION SERIALIZERS
# ============================================================================

class ResourceAllocationSuggestionSerializer(serializers.ModelSerializer):
    suggestion_type_display = serializers.CharField(source='get_suggestion_type_display', read_only=True)
    task_title = serializers.CharField(source='task.title', read_only=True, allow_null=True)
    from_user_name = serializers.CharField(source='from_user.name', read_only=True, allow_null=True)
    to_user_name = serializers.CharField(source='to_user.name', read_only=True, allow_null=True)
    
    class Meta:
        model = ResourceAllocationSuggestion
        fields = [
            'id', 'suggestion_type', 'suggestion_type_display',
            'task', 'task_title', 'from_user', 'from_user_name',
            'to_user', 'to_user_name', 'reason', 'impact_score',
            'confidence_score', 'supporting_data', 'is_applied',
            'is_dismissed', 'applied_at', 'applied_by', 'created_at'
        ]
