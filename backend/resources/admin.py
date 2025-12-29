"""
Admin configuration for resources app.
"""
from django.contrib import admin
from .models import (
    ResourceAllocation, UserCapacity, CapacityWarning,
    ProjectBudget, Expense, BudgetAlert, BudgetVarianceReport
)


@admin.register(ResourceAllocation)
class ResourceAllocationAdmin(admin.ModelAdmin):
    list_display = ['user', 'project', 'task', 'allocated_hours_per_week', 'start_date', 'is_active']
    list_filter = ['is_active', 'allocation_type']
    search_fields = ['user__name', 'project__title']


@admin.register(UserCapacity)
class UserCapacityAdmin(admin.ModelAdmin):
    list_display = ['user', 'hours_per_week', 'hourly_rate', 'billable_rate']
    search_fields = ['user__name', 'user__email']


@admin.register(CapacityWarning)
class CapacityWarningAdmin(admin.ModelAdmin):
    list_display = ['user', 'warning_type', 'severity', 'is_acknowledged', 'created_at']
    list_filter = ['warning_type', 'severity', 'is_acknowledged']
    search_fields = ['user__name']


@admin.register(ProjectBudget)
class ProjectBudgetAdmin(admin.ModelAdmin):
    list_display = ['project', 'budget_type', 'total_budget', 'spent_amount', 'spent_percentage', 'is_locked']
    list_filter = ['budget_type', 'currency', 'is_locked']
    search_fields = ['project__title']


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ['description', 'project', 'category', 'amount', 'status', 'expense_date']
    list_filter = ['status', 'category', 'is_billable']
    search_fields = ['description', 'project__title', 'vendor']


@admin.register(BudgetAlert)
class BudgetAlertAdmin(admin.ModelAdmin):
    list_display = ['budget', 'alert_type', 'threshold_percentage', 'is_acknowledged', 'created_at']
    list_filter = ['alert_type', 'is_acknowledged']


@admin.register(BudgetVarianceReport)
class BudgetVarianceReportAdmin(admin.ModelAdmin):
    list_display = ['budget', 'report_date', 'planned_spend', 'actual_spend', 'variance_percentage']
    list_filter = ['report_date']
