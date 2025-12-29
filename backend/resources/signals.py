"""
Signals for resources app.
"""
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.utils import timezone

from .models import ResourceAllocation, Expense, ProjectBudget, CapacityWarning


@receiver(post_save, sender=ResourceAllocation)
def check_capacity_on_allocation(sender, instance, created, **kwargs):
    """Check for over-allocation when a new allocation is created."""
    if not created:
        return
    
    user = instance.user
    
    # Check if user has capacity tracking
    if not hasattr(user, 'capacity'):
        return
    
    capacity = user.capacity
    allocated = capacity.get_allocated_hours(instance.start_date, instance.end_date)
    
    if allocated > capacity.hours_per_week:
        over_pct = int(((allocated - capacity.hours_per_week) / capacity.hours_per_week) * 100)
        
        CapacityWarning.objects.create(
            user=user,
            warning_type='over_allocation',
            severity='critical' if over_pct > 20 else 'warning',
            message=f"{user.name} is over-allocated by {over_pct}% for the period "
                    f"{instance.start_date} to {instance.end_date or 'ongoing'}",
            project=instance.project,
            allocation=instance,
            period_start=instance.start_date,
            period_end=instance.end_date or instance.start_date,
            allocated_hours=allocated,
            capacity_hours=capacity.hours_per_week,
            over_allocation_percentage=over_pct,
        )


@receiver(post_save, sender=Expense)
def update_budget_on_expense(sender, instance, **kwargs):
    """Update project budget when expense is approved."""
    if instance.status == 'approved':
        try:
            budget = instance.project.budget
            # Recalculate spent amount
            total_spent = Expense.objects.filter(
                project=instance.project,
                status__in=['approved', 'paid']
            ).aggregate(total=models.Sum('amount'))['total'] or 0
            
            budget.spent_amount = total_spent
            budget.save(update_fields=['spent_amount', 'updated_at'])
            
            # Check for budget alerts
            if budget.spent_percentage >= budget.critical_threshold_percentage:
                from .models import BudgetAlert
                BudgetAlert.objects.get_or_create(
                    budget=budget,
                    alert_type='critical',
                    defaults={
                        'message': f"Project {budget.project.title} has reached {budget.spent_percentage}% of budget",
                        'threshold_percentage': budget.critical_threshold_percentage,
                        'actual_percentage': budget.spent_percentage,
                    }
                )
        except ProjectBudget.DoesNotExist:
            pass
