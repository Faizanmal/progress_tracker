from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from .models import Task
from .serializers import (
    TaskSerializer, TaskListSerializer, TaskCreateUpdateSerializer,
    TaskAttachmentSerializer, TaskCommentSerializer
)


class TaskViewSet(viewsets.ModelViewSet):
    """ViewSet for managing tasks."""
    
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter tasks based on user role and query parameters."""
        user = self.request.user
        queryset = Task.objects.none()
        
        if user.is_admin:
            # Admin sees all tasks in their company
            queryset = Task.objects.filter(project__company=user.company)
        elif user.is_manager:
            # Manager sees tasks for their team and projects
            queryset = Task.objects.filter(
                Q(project__team_members=user) |
                Q(assigned_to__manager=user) |
                Q(created_by=user)
            ).distinct()
        else:
            # Employee sees their own tasks
            queryset = Task.objects.filter(assigned_to=user)
        
        # Filter by query parameters
        project_id = self.request.query_params.get('project')
        status_filter = self.request.query_params.get('status')
        priority = self.request.query_params.get('priority')
        
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if priority:
            queryset = queryset.filter(priority=priority)
        
        return queryset
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'list':
            return TaskListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return TaskCreateUpdateSerializer
        return TaskSerializer
    
    def perform_create(self, serializer):
        """Set created_by to current user."""
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_tasks(self, request):
        """Get tasks assigned to current user."""
        tasks = Task.objects.filter(assigned_to=request.user)
        serializer = TaskListSerializer(tasks, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """Get overdue tasks."""
        from django.utils import timezone
        queryset = self.get_queryset().filter(
            deadline__lt=timezone.now(),
            status__in=['open', 'in_progress', 'blocked']
        )
        serializer = TaskListSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def blocked(self, request):
        """Get blocked tasks."""
        queryset = self.get_queryset().filter(status='blocked')
        serializer = TaskListSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def progress_history(self, request, pk=None):
        """Get progress update history for a task."""
        task = self.get_object()
        from progress.serializers import ProgressUpdateListSerializer
        updates = task.progress_updates.all()
        serializer = ProgressUpdateListSerializer(updates, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def comments(self, request, pk=None):
        """Get comments for a task."""
        task = self.get_object()
        comments = task.comments.all()
        serializer = TaskCommentSerializer(comments, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_comment(self, request, pk=None):
        """Add a comment to a task."""
        task = self.get_object()
        serializer = TaskCommentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(task=task, user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def attachments(self, request, pk=None):
        """Get attachments for a task."""
        task = self.get_object()
        attachments = task.attachments.all()
        serializer = TaskAttachmentSerializer(attachments, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def upload_attachment(self, request, pk=None):
        """Upload an attachment to a task."""
        task = self.get_object()
        serializer = TaskAttachmentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(task=task, uploaded_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
