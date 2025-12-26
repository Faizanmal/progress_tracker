from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q, Sum, Avg, Count
from django.utils import timezone
from datetime import timedelta
from .models import ProgressUpdate, ProgressAttachment, ProgressComment
from .serializers import (
    ProgressUpdateSerializer, ProgressUpdateListSerializer,
    ProgressUpdateCreateSerializer, ProgressAttachmentSerializer,
    ProgressCommentSerializer
)
from users.permissions import CanViewTeamProgress


class ProgressUpdateViewSet(viewsets.ModelViewSet):
    """ViewSet for managing progress updates."""
    
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter progress updates based on user role."""
        user = self.request.user
        
        if user.is_admin:
            # Admin sees all progress updates in their company
            return ProgressUpdate.objects.filter(task__project__company=user.company)
        elif user.is_manager:
            # Manager sees progress from their team
            return ProgressUpdate.objects.filter(
                Q(user__manager=user) | Q(user=user)
            )
        else:
            # Employee sees their own progress updates
            return ProgressUpdate.objects.filter(user=user)
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'list':
            return ProgressUpdateListSerializer
        elif self.action == 'create':
            return ProgressUpdateCreateSerializer
        return ProgressUpdateSerializer
    
    def perform_create(self, serializer):
        """Set user to current user."""
        progress_update = serializer.save(user=self.request.user)
        
        # Create notification for manager if task is blocked
        if progress_update.status == 'blocked' and progress_update.user.manager:
            from users.models import Notification
            Notification.objects.create(
                user=progress_update.user.manager,
                notification_type='task_blocked',
                title=f'Task Blocked: {progress_update.task.title}',
                message=f'{progress_update.user.name} reported blockers: {progress_update.blockers}',
                link=f'/tasks/{progress_update.task.id}'
            )
    
    @action(detail=False, methods=['get'])
    def my_updates(self, request):
        """Get progress updates for current user."""
        updates = ProgressUpdate.objects.filter(user=request.user)
        serializer = ProgressUpdateListSerializer(updates, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recent progress updates."""
        days = int(request.query_params.get('days', 7))
        since = timezone.now() - timedelta(days=days)
        updates = self.get_queryset().filter(created_at__gte=since)
        serializer = ProgressUpdateListSerializer(updates, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def blocked_updates(self, request):
        """Get blocked progress updates (for managers)."""
        if not (request.user.is_admin or request.user.is_manager):
            return Response(
                {'detail': 'Only managers and admins can view this'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        updates = self.get_queryset().filter(status='blocked')
        serializer = ProgressUpdateSerializer(updates, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_comment(self, request, pk=None):
        """Add a comment to a progress update."""
        progress_update = self.get_object()
        serializer = ProgressCommentSerializer(data=request.data)
        if serializer.is_valid():
            comment = serializer.save(progress_update=progress_update, user=request.user)
            
            # Notify the update author if commenter is different
            if request.user != progress_update.user:
                from users.models import Notification
                Notification.objects.create(
                    user=progress_update.user,
                    notification_type='comment_added',
                    title='New Comment on Your Progress Update',
                    message=f'{request.user.name} commented: {comment.text[:100]}',
                    link=f'/tasks/{progress_update.task.id}'
                )
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def add_attachment(self, request, pk=None):
        """Add an attachment to a progress update."""
        progress_update = self.get_object()
        serializer = ProgressAttachmentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(progress_update=progress_update)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated, CanViewTeamProgress])
def team_progress_summary(request):
    """Get progress summary for the team (managers and admins only)."""
    user = request.user
    
    # Get team members
    if user.is_admin:
        team_members = user.company.users.all()
    else:
        team_members = user.team_members.all()
    
    # Calculate summary for each team member
    summary = []
    for member in team_members:
        tasks = member.assigned_tasks.all()
        recent_updates = ProgressUpdate.objects.filter(
            user=member,
            created_at__gte=timezone.now() - timedelta(days=7)
        )
        
        summary.append({
            'user_id': member.id,
            'user_name': member.name,
            'user_email': member.email,
            'total_tasks': tasks.count(),
            'completed_tasks': tasks.filter(status='completed').count(),
            'in_progress_tasks': tasks.filter(status='in_progress').count(),
            'blocked_tasks': tasks.filter(status='blocked').count(),
            'overdue_tasks': tasks.filter(
                deadline__lt=timezone.now(),
                status__in=['open', 'in_progress', 'blocked']
            ).count(),
            'recent_updates_count': recent_updates.count(),
            'avg_progress': tasks.aggregate(Avg('progress_percentage'))['progress_percentage__avg'] or 0,
            'total_hours_worked': recent_updates.aggregate(Sum('hours_worked'))['hours_worked__sum'] or 0,
        })
    
    return Response(summary)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_progress_dashboard(request):
    """Get progress dashboard data for current user."""
    user = request.user
    tasks = user.assigned_tasks.all()
    recent_updates = ProgressUpdate.objects.filter(
        user=user,
        created_at__gte=timezone.now() - timedelta(days=30)
    )
    
    dashboard = {
        'user': {
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'role': user.role,
        },
        'tasks': {
            'total': tasks.count(),
            'open': tasks.filter(status='open').count(),
            'in_progress': tasks.filter(status='in_progress').count(),
            'blocked': tasks.filter(status='blocked').count(),
            'completed': tasks.filter(status='completed').count(),
            'overdue': tasks.filter(
                deadline__lt=timezone.now(),
                status__in=['open', 'in_progress', 'blocked']
            ).count(),
        },
        'progress': {
            'updates_last_30_days': recent_updates.count(),
            'total_hours_worked': recent_updates.aggregate(Sum('hours_worked'))['hours_worked__sum'] or 0,
            'avg_progress': tasks.aggregate(Avg('progress_percentage'))['progress_percentage__avg'] or 0,
        },
        'recent_updates': ProgressUpdateListSerializer(
            recent_updates.order_by('-created_at')[:5],
            many=True
        ).data,
    }
    
    return Response(dashboard)
