"""
Views for automation API endpoints.
"""
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db.models import Q

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
from .serializers import (
    WorkflowSerializer, WorkflowCreateSerializer, WorkflowExecutionSerializer,
    WorkflowConditionSerializer, WorkflowActionSerializer,
    TaskDependencySerializer, DependencyBottleneckSerializer,
    EscalationRuleSerializer, EscalationSerializer,
    CalendarEventSerializer, ScheduleSuggestionSerializer,
    ChatIntegrationSerializer,
    GitIntegrationSerializer, GitRepositorySerializer, GitEventSerializer,
    PersonalizedDashboardSerializer, PersonalizedDashboardCreateSerializer,
    DashboardWidgetSerializer,
    BurnoutIndicatorSerializer, WorkloadSnapshotSerializer,
    LocationBasedTrackingSerializer, LocationCheckInSerializer,
    VoiceCommandSerializer, VoiceCommandInputSerializer,
    ResourceAllocationSuggestionSerializer,
)


# ============================================================================
# WORKFLOW VIEWS
# ============================================================================

class WorkflowViewSet(viewsets.ModelViewSet):
    """ViewSet for managing workflows."""
    
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Workflow.objects.filter(company=self.request.user.company)
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return WorkflowCreateSerializer
        return WorkflowSerializer
    
    def perform_create(self, serializer):
        serializer.save(
            company=self.request.user.company,
            created_by=self.request.user
        )
    
    @action(detail=True, methods=['post'])
    def test_run(self, request, pk=None):
        """Test run a workflow with sample data."""
        workflow = self.get_object()
        
        # Create mock context
        context = {
            'task': None,
            'user': request.user,
            'test_mode': True,
        }
        
        execution = workflow.execute(context)
        
        return Response(WorkflowExecutionSerializer(execution).data)
    
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Toggle workflow active state."""
        workflow = self.get_object()
        workflow.is_active = not workflow.is_active
        workflow.save()
        
        return Response({'is_active': workflow.is_active})
    
    @action(detail=True, methods=['get'])
    def executions(self, request, pk=None):
        """Get execution history for a workflow."""
        workflow = self.get_object()
        executions = workflow.executions.all()[:50]
        
        return Response(WorkflowExecutionSerializer(executions, many=True).data)
    
    @action(detail=True, methods=['post'])
    def add_condition(self, request, pk=None):
        """Add a condition to the workflow."""
        workflow = self.get_object()
        serializer = WorkflowConditionSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(workflow=workflow)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def add_action(self, request, pk=None):
        """Add an action to the workflow."""
        workflow = self.get_object()
        
        # Set order to last
        last_order = workflow.actions.count()
        
        serializer = WorkflowActionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(workflow=workflow, order=last_order)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class WorkflowExecutionViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing workflow executions."""
    
    permission_classes = [IsAuthenticated]
    serializer_class = WorkflowExecutionSerializer
    
    def get_queryset(self):
        return WorkflowExecution.objects.filter(
            workflow__company=self.request.user.company
        )


# ============================================================================
# TASK DEPENDENCY VIEWS
# ============================================================================

class TaskDependencyViewSet(viewsets.ModelViewSet):
    """ViewSet for managing task dependencies."""
    
    permission_classes = [IsAuthenticated]
    serializer_class = TaskDependencySerializer
    
    def get_queryset(self):
        user = self.request.user
        return TaskDependency.objects.filter(
            predecessor__project__company=user.company
        )
    
    @action(detail=False, methods=['get'])
    def for_task(self, request):
        """Get dependencies for a specific task."""
        task_id = request.query_params.get('task_id')
        if not task_id:
            return Response({'error': 'task_id required'}, status=400)
        
        predecessors = TaskDependency.objects.filter(successor_id=task_id)
        successors = TaskDependency.objects.filter(predecessor_id=task_id)
        
        return Response({
            'predecessors': TaskDependencySerializer(predecessors, many=True).data,
            'successors': TaskDependencySerializer(successors, many=True).data,
        })
    
    @action(detail=False, methods=['post'])
    def recalculate_timeline(self, request):
        """Recalculate timeline for a project."""
        from tasks.models import Task
        from .services import DependencyManager
        
        project_id = request.data.get('project_id')
        if not project_id:
            return Response({'error': 'project_id required'}, status=400)
        
        try:
            from projects.models import Project
            project = Project.objects.get(id=project_id, company=request.user.company)
        except Project.DoesNotExist:
            return Response({'error': 'Project not found'}, status=404)
        
        manager = DependencyManager(project)
        
        # Start from tasks without predecessors
        root_tasks = Task.objects.filter(
            project=project
        ).exclude(
            id__in=TaskDependency.objects.values_list('successor_id', flat=True)
        )
        
        for task in root_tasks:
            manager.recalculate_from_task(task)
        
        return Response({'status': 'Timeline recalculated'})


class DependencyBottleneckViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing bottlenecks."""
    
    permission_classes = [IsAuthenticated]
    serializer_class = DependencyBottleneckSerializer
    
    def get_queryset(self):
        return DependencyBottleneck.objects.filter(
            task__project__company=self.request.user.company,
            is_resolved=False
        )
    
    @action(detail=False, methods=['post'])
    def detect(self, request):
        """Detect bottlenecks for a project."""
        from .services import DependencyManager
        from projects.models import Project
        
        project_id = request.data.get('project_id')
        if not project_id:
            return Response({'error': 'project_id required'}, status=400)
        
        try:
            project = Project.objects.get(id=project_id, company=request.user.company)
        except Project.DoesNotExist:
            return Response({'error': 'Project not found'}, status=404)
        
        manager = DependencyManager(project)
        bottlenecks = manager.detect_bottlenecks()
        
        return Response(DependencyBottleneckSerializer(bottlenecks, many=True).data)
    
    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """Mark bottleneck as resolved."""
        bottleneck = self.get_object()
        bottleneck.is_resolved = True
        bottleneck.resolved_at = timezone.now()
        bottleneck.save()
        
        return Response({'status': 'resolved'})


# ============================================================================
# ESCALATION VIEWS
# ============================================================================

class EscalationRuleViewSet(viewsets.ModelViewSet):
    """ViewSet for managing escalation rules."""
    
    permission_classes = [IsAuthenticated]
    serializer_class = EscalationRuleSerializer
    
    def get_queryset(self):
        return EscalationRule.objects.filter(company=self.request.user.company)
    
    def perform_create(self, serializer):
        serializer.save(company=self.request.user.company)


class EscalationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing escalations."""
    
    permission_classes = [IsAuthenticated]
    serializer_class = EscalationSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        # Users see escalations sent to them or for their tasks
        return Escalation.objects.filter(
            Q(escalated_to=user) |
            Q(task__assigned_to=user) |
            Q(task__project__created_by=user)
        ).distinct()
    
    @action(detail=True, methods=['post'])
    def acknowledge(self, request, pk=None):
        """Acknowledge an escalation."""
        escalation = self.get_object()
        escalation.acknowledge(request.user)
        
        return Response({'status': 'acknowledged'})
    
    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """Resolve an escalation."""
        escalation = self.get_object()
        notes = request.data.get('notes', '')
        escalation.resolve(request.user, notes)
        
        return Response({'status': 'resolved'})
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get pending escalations for current user."""
        escalations = self.get_queryset().filter(status='pending')
        return Response(EscalationSerializer(escalations, many=True).data)


# ============================================================================
# CALENDAR VIEWS
# ============================================================================

class CalendarEventViewSet(viewsets.ModelViewSet):
    """ViewSet for managing calendar events."""
    
    permission_classes = [IsAuthenticated]
    serializer_class = CalendarEventSerializer
    
    def get_queryset(self):
        return CalendarEvent.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get upcoming events."""
        days = int(request.query_params.get('days', 7))
        end_date = timezone.now() + timezone.timedelta(days=days)
        
        events = self.get_queryset().filter(
            start_time__gte=timezone.now(),
            start_time__lte=end_date
        )
        
        return Response(CalendarEventSerializer(events, many=True).data)
    
    @action(detail=False, methods=['post'])
    def sync_from_tasks(self, request):
        """Sync calendar events from user's tasks with deadlines."""
        from tasks.models import Task
        
        tasks = Task.objects.filter(
            assigned_to=request.user,
            deadline__isnull=False,
            status__in=['open', 'in_progress']
        )
        
        created = 0
        for task in tasks:
            event, is_new = CalendarEvent.objects.update_or_create(
                user=request.user,
                task=task,
                event_type='task_deadline',
                defaults={
                    'title': f"Deadline: {task.title}",
                    'description': task.description,
                    'start_time': task.deadline - timezone.timedelta(hours=1),
                    'end_time': task.deadline,
                    'project': task.project,
                }
            )
            if is_new:
                created += 1
        
        return Response({'created': created})


class ScheduleSuggestionViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for schedule suggestions."""
    
    permission_classes = [IsAuthenticated]
    serializer_class = ScheduleSuggestionSerializer
    
    def get_queryset(self):
        return ScheduleSuggestion.objects.filter(
            user=self.request.user,
            is_accepted=False,
            is_dismissed=False
        )
    
    @action(detail=False, methods=['post'])
    def generate(self, request):
        """Generate schedule suggestion for a task."""
        from tasks.models import Task
        from .ai_services import CalendarSchedulingService
        
        task_id = request.data.get('task_id')
        duration = request.data.get('duration_hours', 2)
        
        try:
            task = Task.objects.get(id=task_id, assigned_to=request.user)
        except Task.DoesNotExist:
            return Response({'error': 'Task not found'}, status=404)
        
        service = CalendarSchedulingService(request.user)
        suggestion = service.suggest_schedule(task, duration)
        
        if suggestion:
            return Response(ScheduleSuggestionSerializer(suggestion).data)
        return Response({'error': 'No available slots found'}, status=404)
    
    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """Accept a schedule suggestion."""
        suggestion = self.get_object()
        suggestion.is_accepted = True
        suggestion.save()
        
        # Create calendar event
        CalendarEvent.objects.create(
            user=request.user,
            title=f"Work: {suggestion.task.title}",
            event_type='task_deadline',
            start_time=suggestion.suggested_start,
            end_time=suggestion.suggested_end,
            task=suggestion.task,
            project=suggestion.task.project
        )
        
        return Response({'status': 'accepted'})
    
    @action(detail=True, methods=['post'])
    def dismiss(self, request, pk=None):
        """Dismiss a schedule suggestion."""
        suggestion = self.get_object()
        suggestion.is_dismissed = True
        suggestion.save()
        
        return Response({'status': 'dismissed'})


# ============================================================================
# INTEGRATION VIEWS
# ============================================================================

class ChatIntegrationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing chat integrations."""
    
    permission_classes = [IsAuthenticated]
    serializer_class = ChatIntegrationSerializer
    
    def get_queryset(self):
        return ChatIntegration.objects.filter(company=self.request.user.company)
    
    @action(detail=False, methods=['get'])
    def oauth_url(self, request):
        """Get OAuth URL for integration."""
        platform = request.query_params.get('platform', 'slack')
        
        # In production, these would be actual OAuth URLs
        oauth_urls = {
            'slack': 'https://slack.com/oauth/v2/authorize?client_id=YOUR_CLIENT_ID&scope=chat:write,channels:read',
            'teams': 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=YOUR_CLIENT_ID',
        }
        
        return Response({'url': oauth_urls.get(platform, '')})
    
    @action(detail=True, methods=['post'])
    def test_connection(self, request, pk=None):
        """Test the integration connection."""
        integration = self.get_object()
        
        # In production, this would actually test the connection
        return Response({'status': 'connected', 'workspace': integration.workspace_name})


class GitIntegrationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing Git integrations."""
    
    permission_classes = [IsAuthenticated]
    serializer_class = GitIntegrationSerializer
    
    def get_queryset(self):
        return GitIntegration.objects.filter(company=self.request.user.company)
    
    def perform_create(self, serializer):
        serializer.save(
            company=self.request.user.company,
            created_by=self.request.user
        )
    
    @action(detail=True, methods=['get'])
    def repositories(self, request, pk=None):
        """Get repositories for this integration."""
        integration = self.get_object()
        repos = integration.repositories.all()
        
        return Response(GitRepositorySerializer(repos, many=True).data)
    
    @action(detail=True, methods=['post'])
    def link_repository(self, request, pk=None):
        """Link a repository to a project."""
        integration = self.get_object()
        
        serializer = GitRepositorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(integration=integration)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GitWebhookView(APIView):
    """Webhook endpoint for Git events."""
    
    permission_classes = []  # No auth for webhooks
    
    def post(self, request, repo_id):
        """Handle incoming Git webhook."""
        try:
            repo = GitRepository.objects.get(id=repo_id, sync_enabled=True)
        except GitRepository.DoesNotExist:
            return Response({'error': 'Repository not found'}, status=404)
        
        # Parse event type
        event_type = request.headers.get('X-GitHub-Event', 'push')
        event_id = request.headers.get('X-GitHub-Delivery', '')
        
        # Store event
        GitEvent.objects.create(
            repository=repo,
            event_type=event_type,
            event_id=event_id,
            event_data=request.data
        )
        
        # Process event asynchronously
        from .tasks import process_git_event
        process_git_event.delay(repo.id, event_type, request.data)
        
        return Response({'status': 'received'})


# ============================================================================
# DASHBOARD VIEWS
# ============================================================================

class PersonalizedDashboardViewSet(viewsets.ModelViewSet):
    """ViewSet for managing personalized dashboards."""
    
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return PersonalizedDashboard.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return PersonalizedDashboardCreateSerializer
        return PersonalizedDashboardSerializer
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def set_default(self, request, pk=None):
        """Set this dashboard as default."""
        dashboard = self.get_object()
        
        # Unset other defaults
        PersonalizedDashboard.objects.filter(
            user=request.user,
            is_default=True
        ).update(is_default=False)
        
        dashboard.is_default = True
        dashboard.save()
        
        return Response({'status': 'default set'})
    
    @action(detail=True, methods=['post'])
    def add_widget(self, request, pk=None):
        """Add a widget to the dashboard."""
        dashboard = self.get_object()
        
        serializer = DashboardWidgetSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(dashboard=dashboard)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def update_layout(self, request, pk=None):
        """Update widget layout."""
        dashboard = self.get_object()
        
        widgets_data = request.data.get('widgets', [])
        
        for widget_data in widgets_data:
            widget_id = widget_data.get('id')
            if widget_id:
                DashboardWidget.objects.filter(
                    id=widget_id,
                    dashboard=dashboard
                ).update(
                    position_x=widget_data.get('position_x', 0),
                    position_y=widget_data.get('position_y', 0),
                    width=widget_data.get('width', 4),
                    height=widget_data.get('height', 2),
                )
        
        return Response({'status': 'layout updated'})


class DashboardWidgetViewSet(viewsets.ModelViewSet):
    """ViewSet for managing dashboard widgets."""
    
    permission_classes = [IsAuthenticated]
    serializer_class = DashboardWidgetSerializer
    
    def get_queryset(self):
        return DashboardWidget.objects.filter(
            dashboard__user=self.request.user
        )
    
    @action(detail=True, methods=['post'])
    def toggle_visibility(self, request, pk=None):
        """Toggle widget visibility."""
        widget = self.get_object()
        widget.is_visible = not widget.is_visible
        widget.save()
        
        return Response({'is_visible': widget.is_visible})


# ============================================================================
# BURNOUT VIEWS
# ============================================================================

class BurnoutIndicatorViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing burnout indicators."""
    
    permission_classes = [IsAuthenticated]
    serializer_class = BurnoutIndicatorSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        if user.is_manager or user.is_admin:
            # Managers see their team's indicators
            return BurnoutIndicator.objects.filter(
                Q(user=user) |
                Q(user__manager=user) |
                Q(user__company=user.company)
            )
        
        return BurnoutIndicator.objects.filter(user=user)
    
    @action(detail=False, methods=['post'])
    def analyze(self, request):
        """Analyze burnout risk for current user or team member."""
        from .ai_services import BurnoutDetectionService
        
        user_id = request.data.get('user_id')
        days = request.data.get('days', 30)
        
        if user_id and request.user.is_manager:
            from users.models import User
            try:
                target_user = User.objects.get(
                    id=user_id,
                    company=request.user.company
                )
            except User.DoesNotExist:
                return Response({'error': 'User not found'}, status=404)
        else:
            target_user = request.user
        
        service = BurnoutDetectionService(target_user)
        indicator = service.analyze_burnout_risk(days=days)
        
        return Response(BurnoutIndicatorSerializer(indicator).data)
    
    @action(detail=True, methods=['post'])
    def address(self, request, pk=None):
        """Mark burnout indicator as addressed."""
        indicator = self.get_object()
        
        indicator.is_addressed = True
        indicator.addressed_at = timezone.now()
        indicator.addressed_notes = request.data.get('notes', '')
        indicator.save()
        
        return Response({'status': 'addressed'})
    
    @action(detail=False, methods=['get'])
    def team_summary(self, request):
        """Get burnout summary for manager's team."""
        if not request.user.is_manager and not request.user.is_admin:
            return Response({'error': 'Managers only'}, status=403)
        
        from users.models import User
        from django.db.models import Count
        
        # Get team members
        if request.user.is_admin:
            team = User.objects.filter(company=request.user.company)
        else:
            team = User.objects.filter(manager=request.user)
        
        # Get latest indicator for each user
        summaries = []
        for user in team:
            latest = BurnoutIndicator.objects.filter(user=user).first()
            if latest:
                summaries.append({
                    'user_id': user.id,
                    'user_name': user.name,
                    'risk_level': latest.risk_level,
                    'risk_score': latest.risk_score,
                    'is_addressed': latest.is_addressed,
                    'created_at': latest.created_at,
                })
        
        # Sort by risk score descending
        summaries.sort(key=lambda x: x['risk_score'], reverse=True)
        
        return Response({
            'team_count': team.count(),
            'indicators': summaries
        })


# ============================================================================
# LOCATION & VOICE VIEWS
# ============================================================================

class LocationBasedTrackingViewSet(viewsets.ModelViewSet):
    """ViewSet for managing location-based tracking configs."""
    
    permission_classes = [IsAuthenticated]
    serializer_class = LocationBasedTrackingSerializer
    
    def get_queryset(self):
        return LocationBasedTracking.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class LocationCheckInViewSet(viewsets.ModelViewSet):
    """ViewSet for location check-ins."""
    
    permission_classes = [IsAuthenticated]
    serializer_class = LocationCheckInSerializer
    
    def get_queryset(self):
        return LocationCheckIn.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def check_in(self, request):
        """Record a check-in."""
        from analytics.models import TimeEntry
        
        lat = request.data.get('latitude')
        lon = request.data.get('longitude')
        config_id = request.data.get('location_config_id')
        
        try:
            config = LocationBasedTracking.objects.get(
                id=config_id,
                user=request.user,
                is_active=True
            )
        except LocationBasedTracking.DoesNotExist:
            return Response({'error': 'Location config not found'}, status=404)
        
        # Create check-in
        checkin = LocationCheckIn.objects.create(
            user=request.user,
            location_config=config,
            check_in_time=timezone.now(),
            check_in_lat=lat,
            check_in_lon=lon
        )
        
        # Start time entry if configured
        if config.auto_start:
            time_entry = TimeEntry.objects.create(
                user=request.user,
                task=config.default_task,
                start_time=timezone.now(),
                is_running=True
            )
            checkin.time_entry = time_entry
            checkin.save()
        
        return Response(LocationCheckInSerializer(checkin).data)
    
    @action(detail=False, methods=['post'])
    def check_out(self, request):
        """Record a check-out."""
        lat = request.data.get('latitude')
        lon = request.data.get('longitude')
        
        # Find latest open check-in
        checkin = LocationCheckIn.objects.filter(
            user=request.user,
            check_out_time__isnull=True
        ).first()
        
        if not checkin:
            return Response({'error': 'No active check-in'}, status=404)
        
        checkin.check_out_time = timezone.now()
        checkin.check_out_lat = lat
        checkin.check_out_lon = lon
        checkin.save()
        
        # Stop time entry if exists
        if checkin.time_entry and checkin.time_entry.is_running:
            checkin.time_entry.stop_timer()
        
        return Response(LocationCheckInSerializer(checkin).data)


class VoiceCommandViewSet(viewsets.ModelViewSet):
    """ViewSet for voice commands."""
    
    permission_classes = [IsAuthenticated]
    serializer_class = VoiceCommandSerializer
    
    def get_queryset(self):
        return VoiceCommand.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def process(self, request):
        """Process a voice command."""
        serializer = VoiceCommandInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        
        transcript = serializer.validated_data['transcript']
        
        # Parse the voice command
        result = self._parse_and_execute(request.user, transcript)
        
        return Response(result)
    
    def _parse_and_execute(self, user, transcript):
        """Parse and execute voice command."""
        from tasks.models import Task
        
        transcript_lower = transcript.lower()
        
        # Determine command type
        if any(word in transcript_lower for word in ['create task', 'new task', 'add task']):
            return self._create_task_from_voice(user, transcript)
        
        elif any(word in transcript_lower for word in ['update progress', 'log progress', 'progress update']):
            return self._update_progress_from_voice(user, transcript)
        
        elif any(word in transcript_lower for word in ['log time', 'track time', 'record time']):
            return self._log_time_from_voice(user, transcript)
        
        elif any(word in transcript_lower for word in ['my tasks', 'list tasks', 'show tasks']):
            return self._list_tasks_from_voice(user)
        
        elif any(word in transcript_lower for word in ['summary', 'status', 'overview']):
            return self._get_summary_from_voice(user)
        
        else:
            VoiceCommand.objects.create(
                user=user,
                command_type='get_summary',
                raw_transcript=transcript,
                parsed_intent={'action': 'unknown'},
                is_successful=False,
                result_message="I didn't understand that command. Try: create task, update progress, log time, or get summary."
            )
            return {
                'success': False,
                'message': "I didn't understand that command. Try: create task, update progress, log time, or get summary."
            }
    
    def _create_task_from_voice(self, user, transcript):
        """Create task from voice command."""
        from tasks.models import Task
        from projects.models import Project
        
        # Simple parsing - extract task title after "create task" or similar
        for phrase in ['create task', 'new task', 'add task']:
            if phrase in transcript.lower():
                title = transcript.lower().split(phrase)[-1].strip()
                break
        else:
            title = transcript
        
        # Get default project
        project = Project.objects.filter(
            company=user.company,
            team_members=user,
            status='active'
        ).first()
        
        if not project:
            project = Project.objects.filter(company=user.company).first()
        
        if not project:
            return {'success': False, 'message': 'No project found to add task to.'}
        
        task = Task.objects.create(
            title=title.title(),
            project=project,
            created_by=user,
            assigned_to=user,
            priority='medium'
        )
        
        VoiceCommand.objects.create(
            user=user,
            command_type='create_task',
            raw_transcript=transcript,
            parsed_intent={'action': 'create_task', 'title': title},
            is_successful=True,
            result_message=f"Created task: {task.title}",
            linked_task=task
        )
        
        return {
            'success': True,
            'message': f"Created task: {task.title}",
            'task_id': task.id
        }
    
    def _update_progress_from_voice(self, user, transcript):
        """Update progress from voice."""
        from tasks.models import Task
        from progress.models import ProgressUpdate
        import re
        
        # Extract percentage if mentioned
        percentage_match = re.search(r'(\d+)\s*%', transcript)
        percentage = int(percentage_match.group(1)) if percentage_match else 50
        
        # Get most recently worked on task
        task = Task.objects.filter(
            assigned_to=user,
            status='in_progress'
        ).first()
        
        if not task:
            task = Task.objects.filter(
                assigned_to=user,
                status='open'
            ).first()
        
        if not task:
            return {'success': False, 'message': 'No active task found.'}
        
        update = ProgressUpdate.objects.create(
            task=task,
            user=user,
            progress_percentage=min(100, percentage),
            work_done=f"Voice update: {transcript}"
        )
        
        VoiceCommand.objects.create(
            user=user,
            command_type='update_progress',
            raw_transcript=transcript,
            parsed_intent={'action': 'update_progress', 'percentage': percentage},
            is_successful=True,
            result_message=f"Updated {task.title} to {percentage}%",
            linked_task=task
        )
        
        return {
            'success': True,
            'message': f"Updated {task.title} to {percentage}%"
        }
    
    def _log_time_from_voice(self, user, transcript):
        """Log time from voice."""
        from analytics.models import TimeEntry
        from tasks.models import Task
        import re
        
        # Extract hours/minutes
        hours_match = re.search(r'(\d+)\s*hour', transcript.lower())
        minutes_match = re.search(r'(\d+)\s*minute', transcript.lower())
        
        hours = int(hours_match.group(1)) if hours_match else 0
        minutes = int(minutes_match.group(1)) if minutes_match else 0
        
        total_minutes = hours * 60 + minutes
        if total_minutes == 0:
            total_minutes = 60  # Default to 1 hour
        
        # Get current task
        task = Task.objects.filter(
            assigned_to=user,
            status='in_progress'
        ).first()
        
        if not task:
            task = Task.objects.filter(assigned_to=user).first()
        
        if not task:
            return {'success': False, 'message': 'No task found.'}
        
        time_entry = TimeEntry.objects.create(
            user=user,
            task=task,
            start_time=timezone.now() - timezone.timedelta(minutes=total_minutes),
            end_time=timezone.now(),
            duration_minutes=total_minutes,
            description=f"Voice logged: {transcript}"
        )
        
        VoiceCommand.objects.create(
            user=user,
            command_type='log_time',
            raw_transcript=transcript,
            parsed_intent={'action': 'log_time', 'minutes': total_minutes},
            is_successful=True,
            result_message=f"Logged {total_minutes} minutes on {task.title}",
            linked_task=task
        )
        
        return {
            'success': True,
            'message': f"Logged {total_minutes} minutes on {task.title}"
        }
    
    def _list_tasks_from_voice(self, user):
        """List tasks for voice response."""
        from tasks.models import Task
        
        tasks = Task.objects.filter(
            assigned_to=user,
            status__in=['open', 'in_progress']
        )[:5]
        
        if not tasks:
            message = "You have no active tasks."
        else:
            task_list = ", ".join([t.title for t in tasks])
            message = f"You have {tasks.count()} active tasks: {task_list}"
        
        VoiceCommand.objects.create(
            user=user,
            command_type='list_tasks',
            raw_transcript='list tasks',
            parsed_intent={'action': 'list_tasks'},
            is_successful=True,
            result_message=message
        )
        
        return {
            'success': True,
            'message': message,
            'tasks': [{'id': t.id, 'title': t.title, 'status': t.status} for t in tasks]
        }
    
    def _get_summary_from_voice(self, user):
        """Get summary for voice response."""
        from tasks.models import Task
        
        active = Task.objects.filter(
            assigned_to=user,
            status__in=['open', 'in_progress']
        ).count()
        
        completed_today = Task.objects.filter(
            assigned_to=user,
            status='completed',
            completed_at__date=timezone.now().date()
        ).count()
        
        overdue = Task.objects.filter(
            assigned_to=user,
            deadline__lt=timezone.now(),
            status__in=['open', 'in_progress', 'blocked']
        ).count()
        
        message = f"You have {active} active tasks. {completed_today} completed today."
        if overdue > 0:
            message += f" Warning: {overdue} overdue."
        
        VoiceCommand.objects.create(
            user=user,
            command_type='get_summary',
            raw_transcript='get summary',
            parsed_intent={'action': 'summary'},
            is_successful=True,
            result_message=message
        )
        
        return {
            'success': True,
            'message': message,
            'active_tasks': active,
            'completed_today': completed_today,
            'overdue_tasks': overdue
        }


# ============================================================================
# RESOURCE ALLOCATION VIEWS
# ============================================================================

class ResourceAllocationSuggestionViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for resource allocation suggestions."""
    
    permission_classes = [IsAuthenticated]
    serializer_class = ResourceAllocationSuggestionSerializer
    
    def get_queryset(self):
        return ResourceAllocationSuggestion.objects.filter(
            company=self.request.user.company,
            is_applied=False,
            is_dismissed=False
        )
    
    @action(detail=False, methods=['post'])
    def generate(self, request):
        """Generate new resource allocation suggestions."""
        from .ai_services import ResourceAllocationService
        
        if not request.user.is_manager and not request.user.is_admin:
            return Response({'error': 'Managers only'}, status=403)
        
        service = ResourceAllocationService(request.user.company)
        suggestions = service.generate_suggestions()
        
        return Response(ResourceAllocationSuggestionSerializer(suggestions, many=True).data)
    
    @action(detail=False, methods=['post'])
    def recommend_assignee(self, request):
        """Get assignee recommendations for a task."""
        from .ai_services import ResourceAllocationService
        from tasks.models import Task
        
        task_id = request.data.get('task_id')
        
        try:
            task = Task.objects.get(
                id=task_id,
                project__company=request.user.company
            )
        except Task.DoesNotExist:
            return Response({'error': 'Task not found'}, status=404)
        
        service = ResourceAllocationService(request.user.company)
        recommendations = service.recommend_assignee(task)
        
        return Response({
            'task_id': task.id,
            'recommendations': [
                {
                    'user_id': r['user'].id,
                    'user_name': r['user'].name,
                    'score': r['score'],
                    'factors': r['factors']
                }
                for r in recommendations
            ]
        })
    
    @action(detail=True, methods=['post'])
    def apply(self, request, pk=None):
        """Apply a suggestion."""
        suggestion = self.get_object()
        
        if suggestion.suggestion_type == 'reassign' and suggestion.task:
            suggestion.task.assigned_to = suggestion.to_user
            suggestion.task.save()
        
        suggestion.is_applied = True
        suggestion.applied_at = timezone.now()
        suggestion.applied_by = request.user
        suggestion.save()
        
        return Response({'status': 'applied'})
    
    @action(detail=True, methods=['post'])
    def dismiss(self, request, pk=None):
        """Dismiss a suggestion."""
        suggestion = self.get_object()
        suggestion.is_dismissed = True
        suggestion.save()
        
        return Response({'status': 'dismissed'})
