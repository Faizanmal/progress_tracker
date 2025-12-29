"""
Views for dashboards app.
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Count, Sum, Avg, Q
from datetime import timedelta

from .models import Dashboard, DashboardWidget, WidgetTemplate, DashboardTemplate, WidgetData
from .serializers import (
    DashboardSerializer, DashboardCreateSerializer, DashboardWidgetSerializer,
    WidgetTemplateSerializer, DashboardTemplateSerializer
)


class DashboardViewSet(viewsets.ModelViewSet):
    """Manage custom dashboards."""
    serializer_class = DashboardSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = Dashboard.objects.filter(
            Q(user=self.request.user) |
            Q(is_shared=True, company=self.request.user.company)
        )
        return queryset.prefetch_related('widgets')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return DashboardCreateSerializer
        return DashboardSerializer
    
    def perform_create(self, serializer):
        # If this is the first dashboard, make it default
        is_first = not Dashboard.objects.filter(user=self.request.user).exists()
        serializer.save(
            user=self.request.user,
            company=self.request.user.company,
            is_default=is_first
        )
    
    @action(detail=False, methods=['get'])
    def my_default(self, request):
        """Get user's default dashboard."""
        dashboard = Dashboard.objects.filter(
            user=request.user,
            is_default=True
        ).prefetch_related('widgets').first()
        
        if not dashboard:
            # Create default dashboard if none exists
            dashboard = self._create_default_dashboard(request.user)
        
        return Response(DashboardSerializer(dashboard).data)
    
    @action(detail=True, methods=['post'])
    def set_default(self, request, pk=None):
        """Set a dashboard as default."""
        dashboard = self.get_object()
        
        # Unset other defaults
        Dashboard.objects.filter(user=request.user, is_default=True).update(is_default=False)
        
        dashboard.is_default = True
        dashboard.save(update_fields=['is_default'])
        
        return Response(DashboardSerializer(dashboard).data)
    
    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """Duplicate a dashboard."""
        dashboard = self.get_object()
        
        # Create copy
        new_dashboard = Dashboard.objects.create(
            user=request.user,
            company=request.user.company,
            name=f"{dashboard.name} (Copy)",
            description=dashboard.description,
            layout=dashboard.layout,
            theme=dashboard.theme,
        )
        
        # Copy widgets
        for widget in dashboard.widgets.all():
            DashboardWidget.objects.create(
                dashboard=new_dashboard,
                widget_type=widget.widget_type,
                title=widget.title,
                subtitle=widget.subtitle,
                position_x=widget.position_x,
                position_y=widget.position_y,
                width=widget.width,
                height=widget.height,
                size=widget.size,
                config=widget.config,
                filters=widget.filters,
                auto_refresh=widget.auto_refresh,
                refresh_interval_seconds=widget.refresh_interval_seconds,
                order=widget.order,
            )
        
        return Response(DashboardSerializer(new_dashboard).data, status=201)
    
    @action(detail=True, methods=['post'])
    def update_layout(self, request, pk=None):
        """Update dashboard widget layout."""
        dashboard = self.get_object()
        layout = request.data.get('layout', {})
        widget_positions = request.data.get('widgets', [])
        
        dashboard.layout = layout
        dashboard.save(update_fields=['layout'])
        
        # Update widget positions
        for wp in widget_positions:
            DashboardWidget.objects.filter(
                id=wp.get('id'),
                dashboard=dashboard
            ).update(
                position_x=wp.get('position_x', 0),
                position_y=wp.get('position_y', 0),
                width=wp.get('width', 1),
                height=wp.get('height', 1),
                order=wp.get('order', 0),
            )
        
        return Response(DashboardSerializer(dashboard).data)
    
    def _create_default_dashboard(self, user):
        """Create a default dashboard with common widgets."""
        dashboard = Dashboard.objects.create(
            user=user,
            company=user.company,
            name='My Dashboard',
            is_default=True,
        )
        
        # Add default widgets based on role
        default_widgets = [
            {'widget_type': 'my_tasks', 'title': 'My Tasks', 'position_x': 0, 'position_y': 0, 'width': 2, 'height': 2},
            {'widget_type': 'task_completion_rate', 'title': 'Task Completion', 'position_x': 2, 'position_y': 0, 'width': 1, 'height': 1},
            {'widget_type': 'recent_activity', 'title': 'Recent Activity', 'position_x': 0, 'position_y': 2, 'width': 2, 'height': 1},
            {'widget_type': 'notifications', 'title': 'Notifications', 'position_x': 2, 'position_y': 1, 'width': 1, 'height': 2},
        ]
        
        if user.role in ['admin', 'manager']:
            default_widgets.extend([
                {'widget_type': 'team_workload', 'title': 'Team Workload', 'position_x': 3, 'position_y': 0, 'width': 1, 'height': 2},
                {'widget_type': 'project_health', 'title': 'Project Health', 'position_x': 3, 'position_y': 2, 'width': 1, 'height': 1},
            ])
        
        for i, w in enumerate(default_widgets):
            DashboardWidget.objects.create(dashboard=dashboard, order=i, **w)
        
        return dashboard


class DashboardWidgetViewSet(viewsets.ModelViewSet):
    """Manage dashboard widgets."""
    serializer_class = DashboardWidgetSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return DashboardWidget.objects.filter(
            dashboard__user=self.request.user
        )
    
    def perform_create(self, serializer):
        dashboard_id = self.request.data.get('dashboard')
        dashboard = Dashboard.objects.get(id=dashboard_id, user=self.request.user)
        serializer.save(dashboard=dashboard)
    
    @action(detail=True, methods=['get'])
    def data(self, request, pk=None):
        """Get widget data based on widget type."""
        widget = self.get_object()
        data = self._compute_widget_data(widget, request.user)
        
        # Cache the result
        expires = timezone.now() + timedelta(seconds=widget.refresh_interval_seconds)
        WidgetData.objects.update_or_create(
            widget=widget,
            defaults={'data': data, 'expires_at': expires}
        )
        
        return Response(data)
    
    def _compute_widget_data(self, widget, user):
        """Compute data for a widget based on its type."""
        from tasks.models import Task
        from projects.models import Project
        from progress.models import ProgressUpdate
        
        widget_type = widget.widget_type
        filters = widget.filters
        config = widget.config
        
        # Apply date filters
        date_range = filters.get('date_range', 'last_30_days')
        now = timezone.now()
        
        if date_range == 'today':
            start_date = now.replace(hour=0, minute=0, second=0)
        elif date_range == 'last_7_days':
            start_date = now - timedelta(days=7)
        elif date_range == 'last_30_days':
            start_date = now - timedelta(days=30)
        elif date_range == 'last_90_days':
            start_date = now - timedelta(days=90)
        else:
            start_date = now - timedelta(days=30)
        
        # Base querysets
        tasks = Task.objects.filter(project__company=user.company)
        projects = Project.objects.filter(company=user.company)
        
        if filters.get('project'):
            tasks = tasks.filter(project_id=filters['project'])
        
        if filters.get('assigned_to_me'):
            tasks = tasks.filter(assigned_to=user)
        
        # Compute based on widget type
        if widget_type == 'task_completion_rate':
            total = tasks.count()
            completed = tasks.filter(status='completed').count()
            return {
                'total': total,
                'completed': completed,
                'rate': round((completed / total * 100) if total > 0 else 0, 1),
            }
        
        elif widget_type == 'task_status_chart':
            return {
                'data': list(tasks.values('status').annotate(count=Count('id'))),
            }
        
        elif widget_type == 'tasks_by_priority':
            return {
                'data': list(tasks.values('priority').annotate(count=Count('id'))),
            }
        
        elif widget_type == 'overdue_tasks':
            overdue = tasks.filter(
                deadline__lt=now,
                status__in=['open', 'in_progress', 'blocked']
            )
            return {
                'count': overdue.count(),
                'tasks': list(overdue.values('id', 'title', 'deadline', 'priority')[:10]),
            }
        
        elif widget_type == 'my_tasks':
            my_tasks = tasks.filter(assigned_to=user).exclude(status='completed')
            return {
                'count': my_tasks.count(),
                'tasks': list(my_tasks.values(
                    'id', 'title', 'status', 'priority', 'deadline'
                )[:10]),
            }
        
        elif widget_type == 'time_spent_vs_estimated':
            data = tasks.filter(
                estimated_hours__isnull=False
            ).aggregate(
                total_estimated=Sum('estimated_hours'),
                total_actual=Sum('actual_hours')
            )
            return {
                'estimated': data['total_estimated'] or 0,
                'actual': data['total_actual'] or 0,
                'variance': (data['total_actual'] or 0) - (data['total_estimated'] or 0),
            }
        
        elif widget_type == 'project_health':
            project_stats = []
            for project in projects.filter(status='active')[:5]:
                total_tasks = project.tasks.count()
                completed = project.tasks.filter(status='completed').count()
                overdue = project.tasks.filter(
                    deadline__lt=now,
                    status__in=['open', 'in_progress']
                ).count()
                
                # Calculate health score
                completion_rate = (completed / total_tasks * 100) if total_tasks > 0 else 0
                overdue_rate = (overdue / total_tasks * 100) if total_tasks > 0 else 0
                health = max(0, min(100, completion_rate - (overdue_rate * 2)))
                
                project_stats.append({
                    'id': str(project.id),
                    'title': project.title,
                    'progress': project.progress_percentage,
                    'health': round(health),
                    'health_status': 'good' if health >= 70 else 'warning' if health >= 40 else 'critical',
                })
            
            return {'projects': project_stats}
        
        elif widget_type == 'team_workload':
            from users.models import User
            team_members = User.objects.filter(company=user.company, is_active=True)
            
            workload = []
            for member in team_members[:10]:
                task_count = tasks.filter(assigned_to=member).exclude(
                    status__in=['completed', 'cancelled']
                ).count()
                workload.append({
                    'id': str(member.id),
                    'name': member.name,
                    'task_count': task_count,
                })
            
            return {'team': workload}
        
        elif widget_type == 'recent_activity':
            updates = ProgressUpdate.objects.filter(
                task__project__company=user.company,
                created_at__gte=start_date
            ).select_related('user', 'task').order_by('-created_at')[:10]
            
            return {
                'updates': [
                    {
                        'id': str(u.id),
                        'user_name': u.user.name,
                        'task_title': u.task.title,
                        'progress': u.progress_percentage,
                        'created_at': u.created_at.isoformat(),
                    }
                    for u in updates
                ]
            }
        
        elif widget_type == 'budget_overview':
            from resources.models import ProjectBudget
            budgets = ProjectBudget.objects.filter(
                project__company=user.company
            )[:5]
            
            return {
                'budgets': [
                    {
                        'project': b.project.title,
                        'total': float(b.total_budget),
                        'spent': float(b.spent_amount),
                        'percentage': b.spent_percentage,
                        'status': b.budget_status,
                    }
                    for b in budgets
                ]
            }
        
        # Default: empty data
        return {}


class WidgetTemplateViewSet(viewsets.ReadOnlyModelViewSet):
    """View widget templates."""
    serializer_class = WidgetTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = WidgetTemplate.objects.all()
    
    def get_queryset(self):
        queryset = WidgetTemplate.objects.all()
        
        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        
        # Filter premium based on subscription
        # if not user.company.subscription_plan in ['pro', 'enterprise']:
        #     queryset = queryset.filter(is_premium=False)
        
        return queryset


class DashboardTemplateViewSet(viewsets.ReadOnlyModelViewSet):
    """View dashboard templates."""
    serializer_class = DashboardTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = DashboardTemplate.objects.all()
    
    def get_queryset(self):
        queryset = DashboardTemplate.objects.all()
        user = self.request.user
        
        # Filter by role
        queryset = queryset.filter(
            Q(target_role='all') | Q(target_role=user.role)
        )
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def apply(self, request, pk=None):
        """Apply a template to create a new dashboard."""
        template = self.get_object()
        
        dashboard = Dashboard.objects.create(
            user=request.user,
            company=request.user.company,
            name=template.name,
            description=template.description,
            layout=template.layout,
        )
        
        # Create widgets from template
        for i, widget_config in enumerate(template.widgets):
            DashboardWidget.objects.create(
                dashboard=dashboard,
                widget_type=widget_config.get('widget_type', 'text_note'),
                title=widget_config.get('title', ''),
                position_x=widget_config.get('position_x', 0),
                position_y=widget_config.get('position_y', i),
                width=widget_config.get('width', 1),
                height=widget_config.get('height', 1),
                config=widget_config.get('config', {}),
                filters=widget_config.get('filters', {}),
                order=i,
            )
        
        # Update usage count
        template.usage_count += 1
        template.save(update_fields=['usage_count'])
        
        return Response(DashboardSerializer(dashboard).data, status=201)
