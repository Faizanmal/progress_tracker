from rest_framework import serializers
from .models import (
    TimeEntry, Report, ReportSnapshot, Timesheet,
    ProjectTemplate, TaskDependency, Milestone
)


class TimeEntrySerializer(serializers.ModelSerializer):
    """Serializer for time entries."""
    
    user_name = serializers.CharField(source='user.name', read_only=True)
    task_title = serializers.CharField(source='task.title', read_only=True)
    project_title = serializers.CharField(source='task.project.title', read_only=True)
    duration_hours = serializers.FloatField(read_only=True)
    
    class Meta:
        model = TimeEntry
        fields = [
            'id', 'user', 'user_name', 'task', 'task_title', 'project_title',
            'start_time', 'end_time', 'duration_minutes', 'duration_hours',
            'description', 'is_billable', 'is_running',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'duration_minutes', 'is_running']


class TimeEntryCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating time entries."""
    
    class Meta:
        model = TimeEntry
        fields = ['task', 'start_time', 'end_time', 'description', 'is_billable']
    
    def validate(self, data):
        """Validate time entry data."""
        if data.get('end_time') and data.get('start_time'):
            if data['end_time'] <= data['start_time']:
                raise serializers.ValidationError("End time must be after start time")
        return data


class TimerStartSerializer(serializers.Serializer):
    """Serializer for starting a timer."""
    
    task = serializers.IntegerField()
    description = serializers.CharField(required=False, allow_blank=True)
    is_billable = serializers.BooleanField(default=True)


class ReportSerializer(serializers.ModelSerializer):
    """Serializer for reports."""
    
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)
    report_type_display = serializers.CharField(source='get_report_type_display', read_only=True)
    
    class Meta:
        model = Report
        fields = [
            'id', 'name', 'description', 'report_type', 'report_type_display',
            'config', 'frequency', 'next_run', 'last_run',
            'recipients', 'send_email', 'created_by', 'created_by_name',
            'company', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by', 'company', 'last_run']


class ReportSnapshotSerializer(serializers.ModelSerializer):
    """Serializer for report snapshots."""
    
    report_name = serializers.CharField(source='report.name', read_only=True)
    
    class Meta:
        model = ReportSnapshot
        fields = ['id', 'report', 'report_name', 'data', 'generated_at', 'file_pdf', 'file_csv']
        read_only_fields = ['data', 'generated_at']


class TimesheetSerializer(serializers.ModelSerializer):
    """Serializer for timesheets."""
    
    user_name = serializers.CharField(source='user.name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Timesheet
        fields = [
            'id', 'user', 'user_name', 'week_start', 'week_end',
            'status', 'status_display', 'submitted_at', 'approved_at',
            'approved_by', 'approved_by_name', 'total_hours', 'billable_hours',
            'notes', 'rejection_reason', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'total_hours', 'billable_hours', 'submitted_at', 'approved_at', 'approved_by']


class ProjectTemplateSerializer(serializers.ModelSerializer):
    """Serializer for project templates."""
    
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)
    
    class Meta:
        model = ProjectTemplate
        fields = [
            'id', 'name', 'description', 'default_status', 'default_priority',
            'estimated_duration_days', 'task_templates', 'workflow_stages',
            'company', 'created_by', 'created_by_name', 'is_public',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by', 'company']


class TaskDependencySerializer(serializers.ModelSerializer):
    """Serializer for task dependencies."""
    
    task_title = serializers.CharField(source='task.title', read_only=True)
    depends_on_title = serializers.CharField(source='depends_on.title', read_only=True)
    dependency_type_display = serializers.CharField(source='get_dependency_type_display', read_only=True)
    
    class Meta:
        model = TaskDependency
        fields = [
            'id', 'task', 'task_title', 'depends_on', 'depends_on_title',
            'dependency_type', 'dependency_type_display', 'created_at'
        ]


class MilestoneSerializer(serializers.ModelSerializer):
    """Serializer for milestones."""
    
    project_title = serializers.CharField(source='project.title', read_only=True)
    progress = serializers.IntegerField(read_only=True)
    task_count = serializers.IntegerField(source='tasks.count', read_only=True)
    
    class Meta:
        model = Milestone
        fields = [
            'id', 'project', 'project_title', 'title', 'description',
            'due_date', 'is_completed', 'completed_at', 'tasks', 'task_count',
            'progress', 'created_at', 'updated_at'
        ]


# Analytics Response Serializers
class ProductivityMetricsSerializer(serializers.Serializer):
    """Serializer for productivity metrics response."""
    
    total_tasks_completed = serializers.IntegerField()
    average_completion_time_days = serializers.FloatField()
    tasks_by_priority = serializers.DictField()
    completion_trend = serializers.ListField()
    productivity_score = serializers.FloatField()


class TimeAnalyticsSerializer(serializers.Serializer):
    """Serializer for time analytics response."""
    
    total_hours = serializers.FloatField()
    billable_hours = serializers.FloatField()
    non_billable_hours = serializers.FloatField()
    hours_by_project = serializers.ListField()
    hours_by_user = serializers.ListField()
    daily_breakdown = serializers.ListField()


class TeamPerformanceSerializer(serializers.Serializer):
    """Serializer for team performance metrics."""
    
    user_id = serializers.IntegerField()
    user_name = serializers.CharField()
    tasks_completed = serializers.IntegerField()
    tasks_in_progress = serializers.IntegerField()
    avg_completion_time = serializers.FloatField()
    total_hours_logged = serializers.FloatField()
    productivity_score = serializers.FloatField()


class BurndownDataSerializer(serializers.Serializer):
    """Serializer for burndown chart data."""
    
    date = serializers.DateField()
    ideal_remaining = serializers.IntegerField()
    actual_remaining = serializers.IntegerField()
    completed = serializers.IntegerField()
