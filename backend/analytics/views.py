from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Sum, Count, Q
from django.db.models.functions import TruncDate, TruncWeek
from django.utils import timezone
from datetime import timedelta
from .models import (
    TimeEntry, Report, ReportSnapshot, Timesheet,
    ProjectTemplate, TaskDependency, Milestone
)
from .serializers import (
    TimeEntrySerializer, TimeEntryCreateSerializer, TimerStartSerializer,
    ReportSerializer, ReportSnapshotSerializer, TimesheetSerializer,
    ProjectTemplateSerializer, TaskDependencySerializer, MilestoneSerializer
)
from tasks.models import Task
from projects.models import Project
from users.permissions import IsManager


class TimeEntryViewSet(viewsets.ModelViewSet):
    """ViewSet for managing time entries."""
    
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return TimeEntry.objects.filter(task__project__company=user.company)
        elif user.is_manager:
            return TimeEntry.objects.filter(
                Q(user__manager=user) | Q(user=user)
            )
        return TimeEntry.objects.filter(user=user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return TimeEntryCreateSerializer
        return TimeEntrySerializer
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def start_timer(self, request):
        """Start a new timer for a task."""
        serializer = TimerStartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Stop any running timers for this user
        TimeEntry.objects.filter(user=request.user, is_running=True).update(
            is_running=False,
            end_time=timezone.now()
        )
        
        # Create new timer
        task = Task.objects.get(id=serializer.validated_data['task'])
        entry = TimeEntry.objects.create(
            user=request.user,
            task=task,
            start_time=timezone.now(),
            description=serializer.validated_data.get('description', ''),
            is_billable=serializer.validated_data.get('is_billable', True),
            is_running=True
        )
        
        return Response(TimeEntrySerializer(entry).data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'])
    def stop_timer(self, request):
        """Stop the currently running timer."""
        entry = TimeEntry.objects.filter(user=request.user, is_running=True).first()
        if not entry:
            return Response(
                {'detail': 'No running timer found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        entry.stop_timer()
        
        # Update task actual hours
        entry.task.actual_hours += entry.duration_hours
        entry.task.save()
        
        return Response(TimeEntrySerializer(entry).data)
    
    @action(detail=False, methods=['get'])
    def current(self, request):
        """Get currently running timer."""
        entry = TimeEntry.objects.filter(user=request.user, is_running=True).first()
        if entry:
            return Response(TimeEntrySerializer(entry).data)
        return Response({'detail': 'No running timer'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['get'])
    def my_entries(self, request):
        """Get time entries for current user."""
        days = int(request.query_params.get('days', 7))
        since = timezone.now() - timedelta(days=days)
        entries = TimeEntry.objects.filter(user=request.user, start_time__gte=since)
        return Response(TimeEntrySerializer(entries, many=True).data)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get time summary for user."""
        days = int(request.query_params.get('days', 7))
        since = timezone.now() - timedelta(days=days)
        
        entries = TimeEntry.objects.filter(
            user=request.user,
            start_time__gte=since,
            is_running=False
        )
        
        summary = entries.aggregate(
            total_minutes=Sum('duration_minutes'),
            billable_minutes=Sum('duration_minutes', filter=Q(is_billable=True)),
            entry_count=Count('id')
        )
        
        # By project
        by_project = entries.values('task__project__title').annotate(
            minutes=Sum('duration_minutes')
        ).order_by('-minutes')
        
        # By day
        by_day = entries.annotate(
            date=TruncDate('start_time')
        ).values('date').annotate(
            minutes=Sum('duration_minutes')
        ).order_by('date')
        
        return Response({
            'total_hours': (summary['total_minutes'] or 0) / 60,
            'billable_hours': (summary['billable_minutes'] or 0) / 60,
            'entry_count': summary['entry_count'] or 0,
            'by_project': list(by_project),
            'by_day': list(by_day)
        })


class TimesheetViewSet(viewsets.ModelViewSet):
    """ViewSet for managing timesheets."""
    
    permission_classes = [IsAuthenticated]
    serializer_class = TimesheetSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.is_admin or user.is_manager:
            return Timesheet.objects.filter(
                Q(user__company=user.company)
            )
        return Timesheet.objects.filter(user=user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def generate_current_week(self, request):
        """Generate timesheet for current week."""
        today = timezone.now().date()
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)
        
        timesheet, created = Timesheet.objects.get_or_create(
            user=request.user,
            week_start=week_start,
            defaults={'week_end': week_end}
        )
        timesheet.calculate_totals()
        
        return Response(TimesheetSerializer(timesheet).data)
    
    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Submit timesheet for approval."""
        timesheet = self.get_object()
        if timesheet.status != 'draft':
            return Response(
                {'detail': 'Timesheet already submitted'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        timesheet.status = 'submitted'
        timesheet.submitted_at = timezone.now()
        timesheet.calculate_totals()
        timesheet.save()
        
        return Response(TimesheetSerializer(timesheet).data)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a submitted timesheet."""
        if not (request.user.is_admin or request.user.is_manager):
            return Response(
                {'detail': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        timesheet = self.get_object()
        if timesheet.status != 'submitted':
            return Response(
                {'detail': 'Timesheet must be submitted first'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        timesheet.status = 'approved'
        timesheet.approved_at = timezone.now()
        timesheet.approved_by = request.user
        timesheet.save()
        
        return Response(TimesheetSerializer(timesheet).data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a submitted timesheet."""
        if not (request.user.is_admin or request.user.is_manager):
            return Response(
                {'detail': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        timesheet = self.get_object()
        reason = request.data.get('reason', '')
        
        timesheet.status = 'rejected'
        timesheet.rejection_reason = reason
        timesheet.save()
        
        return Response(TimesheetSerializer(timesheet).data)


class ReportViewSet(viewsets.ModelViewSet):
    """ViewSet for managing reports."""
    
    permission_classes = [IsAuthenticated, IsManager]
    serializer_class = ReportSerializer
    
    def get_queryset(self):
        return Report.objects.filter(company=self.request.user.company)
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, company=self.request.user.company)
    
    @action(detail=True, methods=['post'])
    def generate(self, request, pk=None):
        """Generate report snapshot."""
        report = self.get_object()
        data = self._generate_report_data(report)
        
        snapshot = ReportSnapshot.objects.create(
            report=report,
            data=data
        )
        
        report.last_run = timezone.now()
        report.save()
        
        return Response(ReportSnapshotSerializer(snapshot).data)
    
    @action(detail=True, methods=['get'])
    def snapshots(self, request, pk=None):
        """Get report snapshots."""
        report = self.get_object()
        snapshots = report.snapshots.all()[:10]
        return Response(ReportSnapshotSerializer(snapshots, many=True).data)
    
    def _generate_report_data(self, report):
        """Generate report data based on type."""
        company = report.company
        config = report.config or {}
        days = config.get('days', 30)
        since = timezone.now() - timedelta(days=days)
        
        if report.report_type == 'productivity':
            return self._productivity_report(company, since)
        elif report.report_type == 'time_summary':
            return self._time_summary_report(company, since)
        elif report.report_type == 'task_completion':
            return self._task_completion_report(company, since)
        elif report.report_type == 'project_status':
            return self._project_status_report(company)
        elif report.report_type == 'team_performance':
            return self._team_performance_report(company, since)
        return {}
    
    def _productivity_report(self, company, since):
        tasks = Task.objects.filter(project__company=company)
        completed = tasks.filter(status='completed', completed_at__gte=since)
        
        # Average completion time
        completion_times = []
        for task in completed.filter(started_at__isnull=False):
            delta = task.completed_at - task.started_at
            completion_times.append(delta.days)
        
        avg_completion = sum(completion_times) / len(completion_times) if completion_times else 0
        
        # By priority
        by_priority = completed.values('priority').annotate(count=Count('id'))
        
        return {
            'total_completed': completed.count(),
            'average_completion_days': round(avg_completion, 1),
            'by_priority': list(by_priority),
            'period_days': (timezone.now() - since).days
        }
    
    def _time_summary_report(self, company, since):
        entries = TimeEntry.objects.filter(
            task__project__company=company,
            start_time__gte=since,
            is_running=False
        )
        
        summary = entries.aggregate(
            total=Sum('duration_minutes'),
            billable=Sum('duration_minutes', filter=Q(is_billable=True))
        )
        
        by_project = entries.values('task__project__title').annotate(
            hours=Sum('duration_minutes')
        ).order_by('-hours')
        
        by_user = entries.values('user__name').annotate(
            hours=Sum('duration_minutes')
        ).order_by('-hours')
        
        return {
            'total_hours': (summary['total'] or 0) / 60,
            'billable_hours': (summary['billable'] or 0) / 60,
            'by_project': [{
                'project': p['task__project__title'],
                'hours': round(p['hours'] / 60, 1)
            } for p in by_project],
            'by_user': [{
                'user': u['user__name'],
                'hours': round(u['hours'] / 60, 1)
            } for u in by_user]
        }
    
    def _task_completion_report(self, company, since):
        tasks = Task.objects.filter(project__company=company)
        
        total = tasks.count()
        completed = tasks.filter(status='completed').count()
        in_progress = tasks.filter(status='in_progress').count()
        blocked = tasks.filter(status='blocked').count()
        overdue = tasks.filter(deadline__lt=timezone.now()).exclude(status='completed').count()
        
        # Completion trend
        trend = tasks.filter(
            completed_at__gte=since
        ).annotate(
            week=TruncWeek('completed_at')
        ).values('week').annotate(
            count=Count('id')
        ).order_by('week')
        
        return {
            'total': total,
            'completed': completed,
            'in_progress': in_progress,
            'blocked': blocked,
            'overdue': overdue,
            'completion_rate': round((completed / total * 100) if total else 0, 1),
            'trend': list(trend)
        }
    
    def _project_status_report(self, company):
        projects = Project.objects.filter(company=company)
        
        return {
            'total': projects.count(),
            'by_status': list(projects.values('status').annotate(count=Count('id'))),
            'projects': [{
                'id': p.id,
                'title': p.title,
                'status': p.status,
                'progress': p.progress_percentage,
                'task_count': p.tasks.count(),
                'completed_tasks': p.tasks.filter(status='completed').count()
            } for p in projects[:20]]
        }
    
    def _team_performance_report(self, company, since):
        from users.models import User
        users = User.objects.filter(company=company, role='employee')
        
        performance = []
        for user in users:
            tasks = Task.objects.filter(assigned_to=user)
            time_entries = TimeEntry.objects.filter(user=user, start_time__gte=since, is_running=False)
            
            completed = tasks.filter(status='completed', completed_at__gte=since).count()
            total_minutes = time_entries.aggregate(total=Sum('duration_minutes'))['total'] or 0
            
            performance.append({
                'user_id': user.id,
                'user_name': user.name,
                'tasks_assigned': tasks.count(),
                'tasks_completed': completed,
                'hours_logged': round(total_minutes / 60, 1)
            })
        
        return {'team_performance': performance}


class ProjectTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet for managing project templates."""
    
    permission_classes = [IsAuthenticated, IsManager]
    serializer_class = ProjectTemplateSerializer
    
    def get_queryset(self):
        return ProjectTemplate.objects.filter(
            Q(company=self.request.user.company) | Q(is_public=True)
        )
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, company=self.request.user.company)
    
    @action(detail=True, methods=['post'])
    def create_project(self, request, pk=None):
        """Create a new project from template."""
        template = self.get_object()
        
        title = request.data.get('title', f"New {template.name} Project")
        description = request.data.get('description', template.description)
        
        project = Project.objects.create(
            title=title,
            description=description,
            status=template.default_status,
            priority=template.default_priority,
            created_by=request.user,
            company=request.user.company
        )
        
        # Create tasks from template
        for task_template in template.task_templates:
            Task.objects.create(
                project=project,
                title=task_template.get('title', 'New Task'),
                description=task_template.get('description', ''),
                priority=task_template.get('priority', 'medium'),
                estimated_hours=task_template.get('estimated_hours'),
                created_by=request.user
            )
        
        from projects.serializers import ProjectSerializer
        return Response(ProjectSerializer(project).data, status=status.HTTP_201_CREATED)


class TaskDependencyViewSet(viewsets.ModelViewSet):
    """ViewSet for managing task dependencies."""
    
    permission_classes = [IsAuthenticated]
    serializer_class = TaskDependencySerializer
    
    def get_queryset(self):
        return TaskDependency.objects.filter(
            task__project__company=self.request.user.company
        )


class MilestoneViewSet(viewsets.ModelViewSet):
    """ViewSet for managing milestones."""
    
    permission_classes = [IsAuthenticated]
    serializer_class = MilestoneSerializer
    
    def get_queryset(self):
        return Milestone.objects.filter(
            project__company=self.request.user.company
        )
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark milestone as complete."""
        milestone = self.get_object()
        milestone.is_completed = True
        milestone.completed_at = timezone.now()
        milestone.save()
        return Response(MilestoneSerializer(milestone).data)


class AnalyticsDashboardView(APIView):
    """Analytics dashboard with key metrics."""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        company = user.company
        days = int(request.query_params.get('days', 30))
        since = timezone.now() - timedelta(days=days)
        
        # Task metrics
        if user.is_admin:
            tasks = Task.objects.filter(project__company=company)
            time_entries = TimeEntry.objects.filter(task__project__company=company)
        elif user.is_manager:
            tasks = Task.objects.filter(
                Q(assigned_to__manager=user) | Q(assigned_to=user)
            )
            time_entries = TimeEntry.objects.filter(
                Q(user__manager=user) | Q(user=user)
            )
        else:
            tasks = Task.objects.filter(assigned_to=user)
            time_entries = TimeEntry.objects.filter(user=user)
        
        # Task stats
        task_stats = {
            'total': tasks.count(),
            'completed': tasks.filter(status='completed').count(),
            'in_progress': tasks.filter(status='in_progress').count(),
            'blocked': tasks.filter(status='blocked').count(),
            'overdue': tasks.filter(deadline__lt=timezone.now()).exclude(status='completed').count(),
            'completed_this_period': tasks.filter(completed_at__gte=since).count()
        }
        
        # Time stats
        time_stats = time_entries.filter(
            start_time__gte=since,
            is_running=False
        ).aggregate(
            total_minutes=Sum('duration_minutes'),
            billable_minutes=Sum('duration_minutes', filter=Q(is_billable=True))
        )
        
        # Completion trend (by week)
        completion_trend = tasks.filter(
            completed_at__gte=since
        ).annotate(
            week=TruncWeek('completed_at')
        ).values('week').annotate(
            count=Count('id')
        ).order_by('week')
        
        # Time by day
        time_by_day = time_entries.filter(
            start_time__gte=since,
            is_running=False
        ).annotate(
            date=TruncDate('start_time')
        ).values('date').annotate(
            minutes=Sum('duration_minutes')
        ).order_by('date')
        
        # Projects overview
        if user.is_admin:
            projects = Project.objects.filter(company=company)
        elif user.is_manager:
            projects = Project.objects.filter(
                Q(created_by=user) | Q(team_members=user)
            ).distinct()
        else:
            projects = Project.objects.filter(team_members=user)
        
        project_stats = {
            'total': projects.count(),
            'active': projects.filter(status='active').count(),
            'completed': projects.filter(status='completed').count()
        }
        
        return Response({
            'tasks': task_stats,
            'time': {
                'total_hours': round((time_stats['total_minutes'] or 0) / 60, 1),
                'billable_hours': round((time_stats['billable_minutes'] or 0) / 60, 1),
                'by_day': list(time_by_day)
            },
            'completion_trend': list(completion_trend),
            'projects': project_stats,
            'period_days': days
        })


class ProductivityAnalyticsView(APIView):
    """Detailed productivity analytics."""
    
    permission_classes = [IsAuthenticated, IsManager]
    
    def get(self, request):
        company = request.user.company
        days = int(request.query_params.get('days', 30))
        since = timezone.now() - timedelta(days=days)
        
        tasks = Task.objects.filter(project__company=company)
        completed_tasks = tasks.filter(status='completed', completed_at__gte=since)
        
        # Average time to complete
        completion_times = []
        for task in completed_tasks.filter(started_at__isnull=False):
            delta = task.completed_at - task.started_at
            completion_times.append(delta.total_seconds() / 86400)  # Days
        
        avg_completion = sum(completion_times) / len(completion_times) if completion_times else 0
        
        # Tasks by priority completed
        by_priority = completed_tasks.values('priority').annotate(
            count=Count('id')
        ).order_by('priority')
        
        # Completion rate by user
        from users.models import User
        users = User.objects.filter(company=company, role='employee')
        
        user_productivity = []
        for user in users:
            user_tasks = tasks.filter(assigned_to=user)
            total = user_tasks.count()
            completed = user_tasks.filter(status='completed').count()
            
            user_productivity.append({
                'user_id': user.id,
                'user_name': user.name,
                'total_tasks': total,
                'completed_tasks': completed,
                'completion_rate': round((completed / total * 100) if total else 0, 1)
            })
        
        return Response({
            'total_completed': completed_tasks.count(),
            'average_completion_days': round(avg_completion, 1),
            'by_priority': list(by_priority),
            'user_productivity': user_productivity,
            'period_days': days
        })


class BurndownChartView(APIView):
    """Burndown chart data for a project."""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request, project_id):
        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return Response({'detail': 'Project not found'}, status=404)
        
        tasks = project.tasks.all()
        total_tasks = tasks.count()
        
        if not project.start_date or not project.end_date:
            return Response({
                'detail': 'Project must have start and end dates',
                'data': []
            })
        
        start = project.start_date
        end = project.end_date
        duration = (end - start).days + 1
        
        # Generate ideal burndown
        data = []
        for i in range(duration):
            date = start + timedelta(days=i)
            ideal_remaining = total_tasks - (total_tasks * i / (duration - 1)) if duration > 1 else 0
            
            # Actual remaining (tasks not completed by this date)
            completed_by_date = tasks.filter(
                status='completed',
                completed_at__date__lte=date
            ).count()
            actual_remaining = total_tasks - completed_by_date
            
            data.append({
                'date': date.isoformat(),
                'ideal_remaining': round(ideal_remaining),
                'actual_remaining': actual_remaining,
                'completed': completed_by_date
            })
        
        return Response({
            'project_id': project.id,
            'project_title': project.title,
            'total_tasks': total_tasks,
            'data': data
        })
