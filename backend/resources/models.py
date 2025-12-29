"""
Models for Resource Allocation, Capacity Planning, Budget and Cost Tracking.
"""
from django.db import models
from django.conf import settings
from django.utils import timezone
from decimal import Decimal
import uuid


# ============================================================================
# RESOURCE ALLOCATION & CAPACITY PLANNING
# ============================================================================

class ResourceAllocation(models.Model):
    """Assign team members to tasks/projects with capacity tracking."""
    
    ALLOCATION_TYPE_CHOICES = [
        ('project', 'Project Allocation'),
        ('task', 'Task Allocation'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Who is allocated
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='allocations'
    )
    
    # What they're allocated to
    allocation_type = models.CharField(max_length=20, choices=ALLOCATION_TYPE_CHOICES)
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='resource_allocations'
    )
    task = models.ForeignKey(
        'tasks.Task',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='resource_allocations'
    )
    
    # Capacity settings
    allocated_hours_per_week = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00')
    )
    percentage_allocation = models.PositiveIntegerField(
        default=100,
        help_text="Percentage of time allocated (0-100)"
    )
    
    # Role in this allocation
    role = models.CharField(max_length=100, blank=True, help_text="Role in this project/task")
    
    # Date range
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_allocations'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-start_date']
        indexes = [
            models.Index(fields=['user', 'start_date', 'end_date']),
            models.Index(fields=['project', 'is_active']),
        ]
    
    def __str__(self):
        target = self.project.title if self.project else self.task.title
        return f"{self.user.name} -> {target}"


class UserCapacity(models.Model):
    """Track user's total capacity and availability."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='capacity'
    )
    
    # Standard capacity
    hours_per_week = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('40.00')
    )
    
    # Cost rates for budgeting
    hourly_rate = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Internal hourly rate for cost calculations"
    )
    billable_rate = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="External billable hourly rate"
    )
    
    # Skills for resource matching
    skills = models.JSONField(default=list, help_text="List of skills")
    
    # Time off / unavailability
    time_off_days = models.JSONField(
        default=list,
        help_text="List of dates when user is unavailable"
    )
    
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'User Capacity'
        verbose_name_plural = 'User Capacities'
    
    def __str__(self):
        return f"{self.user.name} - {self.hours_per_week}h/week"
    
    def get_allocated_hours(self, date_from=None, date_to=None):
        """Calculate total allocated hours for a date range."""
        allocations = self.user.allocations.filter(is_active=True)
        
        if date_from:
            allocations = allocations.filter(end_date__gte=date_from)
        if date_to:
            allocations = allocations.filter(start_date__lte=date_to)
        
        return sum(a.allocated_hours_per_week for a in allocations)
    
    def get_available_hours(self, date_from=None, date_to=None):
        """Calculate available hours for a date range."""
        allocated = self.get_allocated_hours(date_from, date_to)
        return max(Decimal('0'), self.hours_per_week - allocated)
    
    def is_over_allocated(self, date_from=None, date_to=None):
        """Check if user is over-allocated."""
        return self.get_allocated_hours(date_from, date_to) > self.hours_per_week


class CapacityWarning(models.Model):
    """Warnings for resource over-allocation."""
    
    SEVERITY_CHOICES = [
        ('info', 'Info'),
        ('warning', 'Warning'),
        ('critical', 'Critical'),
    ]
    
    WARNING_TYPE_CHOICES = [
        ('over_allocation', 'Over Allocation'),
        ('near_capacity', 'Near Capacity'),
        ('skill_mismatch', 'Skill Mismatch'),
        ('timeline_conflict', 'Timeline Conflict'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='capacity_warnings'
    )
    
    warning_type = models.CharField(max_length=30, choices=WARNING_TYPE_CHOICES)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES)
    message = models.TextField()
    
    # Related entities
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    allocation = models.ForeignKey(
        ResourceAllocation,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    
    # Warning period
    period_start = models.DateField()
    period_end = models.DateField()
    
    # Calculated values
    allocated_hours = models.DecimalField(max_digits=6, decimal_places=2)
    capacity_hours = models.DecimalField(max_digits=6, decimal_places=2)
    over_allocation_percentage = models.PositiveIntegerField(default=0)
    
    # Status
    is_acknowledged = models.BooleanField(default=False)
    acknowledged_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='acknowledged_warnings'
    )
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']


# ============================================================================
# BUDGET & COST TRACKING
# ============================================================================

class ProjectBudget(models.Model):
    """Budget tracking for projects."""
    
    BUDGET_TYPE_CHOICES = [
        ('fixed', 'Fixed Budget'),
        ('time_and_materials', 'Time & Materials'),
        ('retainer', 'Retainer'),
    ]
    
    CURRENCY_CHOICES = [
        ('USD', 'US Dollar'),
        ('EUR', 'Euro'),
        ('GBP', 'British Pound'),
        ('INR', 'Indian Rupee'),
        ('JPY', 'Japanese Yen'),
        ('CAD', 'Canadian Dollar'),
        ('AUD', 'Australian Dollar'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.OneToOneField(
        'projects.Project',
        on_delete=models.CASCADE,
        related_name='budget'
    )
    
    # Budget settings
    budget_type = models.CharField(max_length=30, choices=BUDGET_TYPE_CHOICES, default='fixed')
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default='USD')
    
    # Amounts
    total_budget = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'))
    labor_budget = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'))
    expense_budget = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'))
    contingency_budget = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Reserve for unexpected costs"
    )
    
    # Tracking
    spent_amount = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'))
    committed_amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Approved but not yet spent"
    )
    
    # Alerts
    warning_threshold_percentage = models.PositiveIntegerField(
        default=80,
        help_text="Alert when budget reaches this percentage"
    )
    critical_threshold_percentage = models.PositiveIntegerField(
        default=95,
        help_text="Critical alert threshold"
    )
    
    # Status
    is_locked = models.BooleanField(default=False, help_text="Prevent further changes")
    
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Project Budget'
        verbose_name_plural = 'Project Budgets'
    
    def __str__(self):
        return f"{self.project.title} Budget"
    
    @property
    def remaining_budget(self):
        return self.total_budget - self.spent_amount - self.committed_amount
    
    @property
    def spent_percentage(self):
        if self.total_budget > 0:
            return round((self.spent_amount / self.total_budget) * 100, 2)
        return 0
    
    @property
    def is_over_budget(self):
        return self.spent_amount > self.total_budget
    
    @property
    def budget_status(self):
        pct = self.spent_percentage
        if pct >= 100:
            return 'over_budget'
        elif pct >= self.critical_threshold_percentage:
            return 'critical'
        elif pct >= self.warning_threshold_percentage:
            return 'warning'
        return 'healthy'


class Expense(models.Model):
    """Track expenses against projects/tasks."""
    
    CATEGORY_CHOICES = [
        ('labor', 'Labor'),
        ('software', 'Software/Licenses'),
        ('hardware', 'Hardware'),
        ('travel', 'Travel'),
        ('consulting', 'Consulting'),
        ('marketing', 'Marketing'),
        ('infrastructure', 'Infrastructure'),
        ('misc', 'Miscellaneous'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('paid', 'Paid'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Link to project/task
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        related_name='expenses'
    )
    task = models.ForeignKey(
        'tasks.Task',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='expenses'
    )
    
    # Expense details
    description = models.CharField(max_length=500)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    
    # Date and receipt
    expense_date = models.DateField()
    receipt = models.ForeignKey(
        'integrations.FileAttachment',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='expense_receipts'
    )
    
    # Vendor info
    vendor = models.CharField(max_length=255, blank=True)
    invoice_number = models.CharField(max_length=100, blank=True)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Approval workflow
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='submitted_expenses'
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_expenses'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    
    # Billable
    is_billable = models.BooleanField(default=False)
    billed_to_client = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-expense_date']
    
    def __str__(self):
        return f"{self.description} - {self.amount} {self.currency}"


class BudgetAlert(models.Model):
    """Alerts for budget thresholds."""
    
    ALERT_TYPE_CHOICES = [
        ('warning', 'Warning Threshold'),
        ('critical', 'Critical Threshold'),
        ('over_budget', 'Over Budget'),
        ('forecast', 'Forecast Alert'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    budget = models.ForeignKey(
        ProjectBudget,
        on_delete=models.CASCADE,
        related_name='alerts'
    )
    
    alert_type = models.CharField(max_length=20, choices=ALERT_TYPE_CHOICES)
    message = models.TextField()
    threshold_percentage = models.PositiveIntegerField()
    actual_percentage = models.DecimalField(max_digits=6, decimal_places=2)
    
    # Status
    is_acknowledged = models.BooleanField(default=False)
    acknowledged_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']


class BudgetVarianceReport(models.Model):
    """Periodic budget variance reports."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    budget = models.ForeignKey(
        ProjectBudget,
        on_delete=models.CASCADE,
        related_name='variance_reports'
    )
    
    report_date = models.DateField()
    period_start = models.DateField()
    period_end = models.DateField()
    
    # Planned vs Actual
    planned_spend = models.DecimalField(max_digits=15, decimal_places=2)
    actual_spend = models.DecimalField(max_digits=15, decimal_places=2)
    variance_amount = models.DecimalField(max_digits=15, decimal_places=2)
    variance_percentage = models.DecimalField(max_digits=6, decimal_places=2)
    
    # Breakdown by category
    category_breakdown = models.JSONField(default=dict)
    
    # Analysis
    notes = models.TextField(blank=True)
    generated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-report_date']
