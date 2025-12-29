"""
Views for resources and budget app.
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Sum, Q
from decimal import Decimal

from .models import (
    ResourceAllocation, UserCapacity, CapacityWarning,
    ProjectBudget, Expense, BudgetAlert, BudgetVarianceReport
)
from .serializers import (
    ResourceAllocationSerializer, UserCapacitySerializer, CapacityWarningSerializer,
    ProjectBudgetSerializer, ExpenseSerializer, BudgetAlertSerializer,
    BudgetVarianceReportSerializer
)


class ResourceAllocationViewSet(viewsets.ModelViewSet):
    """Manage resource allocations."""
    serializer_class = ResourceAllocationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = ResourceAllocation.objects.filter(
            Q(project__company=self.request.user.company) |
            Q(task__project__company=self.request.user.company)
        )
        
        # Filter by user
        user_id = self.request.query_params.get('user')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        # Filter by project
        project_id = self.request.query_params.get('project')
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        
        # Filter active only
        active_only = self.request.query_params.get('active', 'true').lower() == 'true'
        if active_only:
            queryset = queryset.filter(is_active=True)
        
        return queryset.select_related('user', 'project', 'task')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def gantt_data(self, request):
        """Get data formatted for Gantt chart visualization."""
        project_id = request.query_params.get('project')
        
        if not project_id:
            return Response({'error': 'project parameter required'}, status=400)
        
        allocations = self.get_queryset().filter(project_id=project_id)
        
        gantt_items = []
        for alloc in allocations:
            gantt_items.append({
                'id': str(alloc.id),
                'name': alloc.user.name,
                'role': alloc.role,
                'start': alloc.start_date.isoformat(),
                'end': alloc.end_date.isoformat() if alloc.end_date else None,
                'progress': alloc.percentage_allocation,
                'hours_per_week': float(alloc.allocated_hours_per_week),
            })
        
        return Response(gantt_items)
    
    @action(detail=False, methods=['get'])
    def team_workload(self, request):
        """Get team workload summary."""
        project_id = request.query_params.get('project')
        
        queryset = self.get_queryset()
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        
        # Group by user and sum allocations
        from django.db.models import Sum
        workload = queryset.values('user_id', 'user__name').annotate(
            total_hours=Sum('allocated_hours_per_week'),
            total_percentage=Sum('percentage_allocation')
        )
        
        result = []
        for item in workload:
            try:
                capacity = UserCapacity.objects.get(user_id=item['user_id'])
                capacity_hours = float(capacity.hours_per_week)
            except UserCapacity.DoesNotExist:
                capacity_hours = 40.0
            
            result.append({
                'user_id': item['user_id'],
                'user_name': item['user__name'],
                'allocated_hours': float(item['total_hours'] or 0),
                'capacity_hours': capacity_hours,
                'utilization_percentage': round(
                    (float(item['total_hours'] or 0) / capacity_hours) * 100, 1
                ) if capacity_hours > 0 else 0,
                'is_over_allocated': (item['total_hours'] or 0) > capacity_hours,
            })
        
        return Response(result)


class UserCapacityViewSet(viewsets.ModelViewSet):
    """Manage user capacity settings."""
    serializer_class = UserCapacitySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return UserCapacity.objects.filter(user__company=self.request.user.company)
    
    @action(detail=False, methods=['get'])
    def my_capacity(self, request):
        """Get current user's capacity."""
        capacity, created = UserCapacity.objects.get_or_create(
            user=request.user,
            defaults={'hours_per_week': Decimal('40.00')}
        )
        return Response(UserCapacitySerializer(capacity).data)
    
    @action(detail=False, methods=['post'])
    def update_my_capacity(self, request):
        """Update current user's capacity."""
        capacity, created = UserCapacity.objects.get_or_create(
            user=request.user,
            defaults={'hours_per_week': Decimal('40.00')}
        )
        serializer = UserCapacitySerializer(capacity, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class CapacityWarningViewSet(viewsets.ReadOnlyModelViewSet):
    """View capacity warnings."""
    serializer_class = CapacityWarningSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = CapacityWarning.objects.filter(
            user__company=self.request.user.company
        )
        
        # Filter by acknowledgement status
        acknowledged = self.request.query_params.get('acknowledged')
        if acknowledged is not None:
            queryset = queryset.filter(is_acknowledged=acknowledged.lower() == 'true')
        
        return queryset.select_related('user', 'project')
    
    @action(detail=True, methods=['post'])
    def acknowledge(self, request, pk=None):
        """Acknowledge a warning."""
        warning = self.get_object()
        warning.is_acknowledged = True
        warning.acknowledged_by = request.user
        warning.acknowledged_at = timezone.now()
        warning.save()
        return Response(CapacityWarningSerializer(warning).data)


class ProjectBudgetViewSet(viewsets.ModelViewSet):
    """Manage project budgets."""
    serializer_class = ProjectBudgetSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return ProjectBudget.objects.filter(
            project__company=self.request.user.company
        ).select_related('project')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['get'])
    def summary(self, request, pk=None):
        """Get budget summary with breakdown."""
        budget = self.get_object()
        
        # Get expense breakdown by category
        expense_by_category = Expense.objects.filter(
            project=budget.project,
            status__in=['approved', 'paid']
        ).values('category').annotate(
            total=Sum('amount')
        )
        
        return Response({
            'budget': ProjectBudgetSerializer(budget).data,
            'expense_breakdown': list(expense_by_category),
            'alerts': BudgetAlertSerializer(
                budget.alerts.filter(is_acknowledged=False),
                many=True
            ).data,
        })
    
    @action(detail=True, methods=['post'])
    def lock(self, request, pk=None):
        """Lock budget to prevent changes."""
        budget = self.get_object()
        budget.is_locked = True
        budget.save(update_fields=['is_locked'])
        return Response({'status': 'locked'})
    
    @action(detail=True, methods=['post'])
    def unlock(self, request, pk=None):
        """Unlock budget."""
        budget = self.get_object()
        budget.is_locked = False
        budget.save(update_fields=['is_locked'])
        return Response({'status': 'unlocked'})


class ExpenseViewSet(viewsets.ModelViewSet):
    """Manage expenses."""
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = Expense.objects.filter(
            project__company=self.request.user.company
        )
        
        # Filter by project
        project_id = self.request.query_params.get('project')
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        
        return queryset.select_related('project', 'task', 'submitted_by', 'approved_by')
    
    def perform_create(self, serializer):
        serializer.save(submitted_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve an expense."""
        expense = self.get_object()
        
        if expense.status != 'pending':
            return Response(
                {'error': 'Only pending expenses can be approved'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        expense.status = 'approved'
        expense.approved_by = request.user
        expense.approved_at = timezone.now()
        expense.save()
        
        return Response(ExpenseSerializer(expense).data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject an expense."""
        expense = self.get_object()
        reason = request.data.get('reason', '')
        
        if expense.status != 'pending':
            return Response(
                {'error': 'Only pending expenses can be rejected'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        expense.status = 'rejected'
        expense.rejection_reason = reason
        expense.save()
        
        return Response(ExpenseSerializer(expense).data)
    
    @action(detail=False, methods=['get'])
    def pending_approval(self, request):
        """Get expenses pending approval."""
        expenses = self.get_queryset().filter(status='pending')
        return Response(ExpenseSerializer(expenses, many=True).data)


class BudgetAlertViewSet(viewsets.ReadOnlyModelViewSet):
    """View budget alerts."""
    serializer_class = BudgetAlertSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return BudgetAlert.objects.filter(
            budget__project__company=self.request.user.company
        )
    
    @action(detail=True, methods=['post'])
    def acknowledge(self, request, pk=None):
        """Acknowledge an alert."""
        alert = self.get_object()
        alert.is_acknowledged = True
        alert.acknowledged_by = request.user
        alert.acknowledged_at = timezone.now()
        alert.save()
        return Response(BudgetAlertSerializer(alert).data)


class BudgetVarianceReportViewSet(viewsets.ModelViewSet):
    """Manage budget variance reports."""
    serializer_class = BudgetVarianceReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return BudgetVarianceReport.objects.filter(
            budget__project__company=self.request.user.company
        )
    
    @action(detail=False, methods=['post'])
    def generate(self, request):
        """Generate a new variance report."""
        budget_id = request.data.get('budget_id')
        period_start = request.data.get('period_start')
        period_end = request.data.get('period_end')
        
        if not all([budget_id, period_start, period_end]):
            return Response(
                {'error': 'budget_id, period_start, and period_end are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            budget = ProjectBudget.objects.get(
                id=budget_id,
                project__company=request.user.company
            )
        except ProjectBudget.DoesNotExist:
            return Response({'error': 'Budget not found'}, status=404)
        
        # Calculate variance
        actual_spend = Expense.objects.filter(
            project=budget.project,
            expense_date__gte=period_start,
            expense_date__lte=period_end,
            status__in=['approved', 'paid']
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
        
        # Assume linear budget distribution for planned spend
        from datetime import datetime
        start = datetime.fromisoformat(period_start)
        end = datetime.fromisoformat(period_end)
        total_days = (end - start).days + 1
        
        if budget.project.start_date and budget.project.end_date:
            project_days = (budget.project.end_date - budget.project.start_date).days + 1
            planned_spend = (budget.total_budget / project_days) * total_days
        else:
            planned_spend = Decimal('0')
        
        variance_amount = actual_spend - planned_spend
        variance_pct = (variance_amount / planned_spend * 100) if planned_spend else 0
        
        report = BudgetVarianceReport.objects.create(
            budget=budget,
            report_date=timezone.now().date(),
            period_start=period_start,
            period_end=period_end,
            planned_spend=planned_spend,
            actual_spend=actual_spend,
            variance_amount=variance_amount,
            variance_percentage=variance_pct,
            generated_by=request.user,
        )
        
        return Response(BudgetVarianceReportSerializer(report).data, status=201)
