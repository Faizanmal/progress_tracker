from django.contrib import admin
from .models import (
    TimeEntry, Report, ReportSnapshot, Timesheet,
    ProjectTemplate, TaskDependency, Milestone
)


@admin.register(TimeEntry)
class TimeEntryAdmin(admin.ModelAdmin):
    list_display = ['user', 'task', 'start_time', 'duration_minutes', 'is_billable', 'is_running']
    list_filter = ['is_billable', 'is_running', 'start_time']
    search_fields = ['user__name', 'task__title', 'description']
    date_hierarchy = 'start_time'


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ['name', 'report_type', 'frequency', 'created_by', 'is_active', 'last_run']
    list_filter = ['report_type', 'frequency', 'is_active']
    search_fields = ['name', 'description']
    filter_horizontal = ['recipients']


@admin.register(ReportSnapshot)
class ReportSnapshotAdmin(admin.ModelAdmin):
    list_display = ['report', 'generated_at']
    list_filter = ['generated_at']


@admin.register(Timesheet)
class TimesheetAdmin(admin.ModelAdmin):
    list_display = ['user', 'week_start', 'week_end', 'status', 'total_hours', 'billable_hours']
    list_filter = ['status', 'week_start']
    search_fields = ['user__name']


@admin.register(ProjectTemplate)
class ProjectTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'company', 'created_by', 'is_public', 'created_at']
    list_filter = ['is_public', 'created_at']
    search_fields = ['name', 'description']


@admin.register(TaskDependency)
class TaskDependencyAdmin(admin.ModelAdmin):
    list_display = ['task', 'depends_on', 'dependency_type', 'created_at']
    list_filter = ['dependency_type']
    search_fields = ['task__title', 'depends_on__title']


@admin.register(Milestone)
class MilestoneAdmin(admin.ModelAdmin):
    list_display = ['title', 'project', 'due_date', 'is_completed']
    list_filter = ['is_completed', 'due_date']
    search_fields = ['title', 'project__title']
    filter_horizontal = ['tasks']
