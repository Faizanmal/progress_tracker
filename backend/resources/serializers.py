"""
Serializers for resources and budget app.
"""
from rest_framework import serializers
from .models import (
    ResourceAllocation, UserCapacity, CapacityWarning,
    ProjectBudget, Expense, BudgetAlert, BudgetVarianceReport
)


class ResourceAllocationSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.name', read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)
    task_title = serializers.CharField(source='task.title', read_only=True)
    
    class Meta:
        model = ResourceAllocation
        fields = [
            'id', 'user', 'user_name', 'allocation_type', 'project', 'project_title',
            'task', 'task_title', 'allocated_hours_per_week', 'percentage_allocation',
            'role', 'start_date', 'end_date', 'is_active', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class UserCapacitySerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.name', read_only=True)
    allocated_hours = serializers.SerializerMethodField()
    available_hours = serializers.SerializerMethodField()
    is_over_allocated = serializers.SerializerMethodField()
    
    class Meta:
        model = UserCapacity
        fields = [
            'id', 'user', 'user_name', 'hours_per_week', 'hourly_rate',
            'billable_rate', 'skills', 'time_off_days', 'allocated_hours',
            'available_hours', 'is_over_allocated', 'updated_at'
        ]
        read_only_fields = ['id', 'updated_at']
    
    def get_allocated_hours(self, obj):
        return float(obj.get_allocated_hours())
    
    def get_available_hours(self, obj):
        return float(obj.get_available_hours())
    
    def get_is_over_allocated(self, obj):
        return obj.is_over_allocated()


class CapacityWarningSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.name', read_only=True)
    
    class Meta:
        model = CapacityWarning
        fields = [
            'id', 'user', 'user_name', 'warning_type', 'severity', 'message',
            'project', 'period_start', 'period_end', 'allocated_hours',
            'capacity_hours', 'over_allocation_percentage', 'is_acknowledged',
            'acknowledged_by', 'acknowledged_at', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class ProjectBudgetSerializer(serializers.ModelSerializer):
    project_title = serializers.CharField(source='project.title', read_only=True)
    remaining_budget = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    spent_percentage = serializers.FloatField(read_only=True)
    is_over_budget = serializers.BooleanField(read_only=True)
    budget_status = serializers.CharField(read_only=True)
    
    class Meta:
        model = ProjectBudget
        fields = [
            'id', 'project', 'project_title', 'budget_type', 'currency',
            'total_budget', 'labor_budget', 'expense_budget', 'contingency_budget',
            'spent_amount', 'committed_amount', 'remaining_budget', 'spent_percentage',
            'warning_threshold_percentage', 'critical_threshold_percentage',
            'is_over_budget', 'budget_status', 'is_locked', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'spent_amount', 'committed_amount', 'created_at', 'updated_at']


class ExpenseSerializer(serializers.ModelSerializer):
    project_title = serializers.CharField(source='project.title', read_only=True)
    task_title = serializers.CharField(source='task.title', read_only=True)
    submitted_by_name = serializers.CharField(source='submitted_by.name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    
    class Meta:
        model = Expense
        fields = [
            'id', 'project', 'project_title', 'task', 'task_title',
            'description', 'category', 'category_display', 'amount', 'currency',
            'expense_date', 'receipt', 'vendor', 'invoice_number',
            'status', 'status_display', 'submitted_by', 'submitted_by_name',
            'approved_by', 'approved_by_name', 'approved_at', 'rejection_reason',
            'is_billable', 'billed_to_client', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'approved_by', 'approved_at', 'created_at', 'updated_at']


class BudgetAlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = BudgetAlert
        fields = [
            'id', 'budget', 'alert_type', 'message', 'threshold_percentage',
            'actual_percentage', 'is_acknowledged', 'acknowledged_by',
            'acknowledged_at', 'created_at'
        ]


class BudgetVarianceReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = BudgetVarianceReport
        fields = [
            'id', 'budget', 'report_date', 'period_start', 'period_end',
            'planned_spend', 'actual_spend', 'variance_amount', 'variance_percentage',
            'category_breakdown', 'notes', 'created_at'
        ]
