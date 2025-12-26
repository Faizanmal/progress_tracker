from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Project
from .serializers import (
    ProjectSerializer, ProjectListSerializer,
    ProjectCreateUpdateSerializer, ProjectCommentSerializer
)


class ProjectViewSet(viewsets.ModelViewSet):
    """ViewSet for managing projects."""
    
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter projects based on user role."""
        user = self.request.user
        
        if user.is_admin:
            # Admin sees all projects in their company
            return Project.objects.filter(company=user.company)
        elif user.is_manager:
            # Manager sees projects they created or are part of
            return Project.objects.filter(company=user.company).filter(
                team_members=user
            ).distinct() | Project.objects.filter(created_by=user)
        else:
            # Employee sees projects they're assigned to
            return Project.objects.filter(team_members=user)
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'list':
            return ProjectListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ProjectCreateUpdateSerializer
        return ProjectSerializer
    
    def perform_create(self, serializer):
        """Set created_by to current user."""
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['get'])
    def tasks(self, request, pk=None):
        """Get all tasks for a project."""
        project = self.get_object()
        from tasks.serializers import TaskListSerializer
        tasks = project.tasks.all()
        serializer = TaskListSerializer(tasks, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def comments(self, request, pk=None):
        """Get comments for a project."""
        project = self.get_object()
        comments = project.comments.all()
        serializer = ProjectCommentSerializer(comments, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_comment(self, request, pk=None):
        """Add a comment to a project."""
        project = self.get_object()
        serializer = ProjectCommentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(project=project, user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        """Add a team member to the project (managers/admins only)."""
        if not (request.user.is_admin or request.user.is_manager):
            return Response(
                {'detail': 'Only managers and admins can add team members'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        project = self.get_object()
        user_id = request.data.get('user_id')
        
        if not user_id:
            return Response(
                {'detail': 'user_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        try:
            user = User.objects.get(id=user_id, company=request.user.company)
            project.team_members.add(user)
            return Response({'status': 'member added'})
        except User.DoesNotExist:
            return Response(
                {'detail': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def remove_member(self, request, pk=None):
        """Remove a team member from the project (managers/admins only)."""
        if not (request.user.is_admin or request.user.is_manager):
            return Response(
                {'detail': 'Only managers and admins can remove team members'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        project = self.get_object()
        user_id = request.data.get('user_id')
        
        if not user_id:
            return Response(
                {'detail': 'user_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        try:
            user = User.objects.get(id=user_id)
            project.team_members.remove(user)
            return Response({'status': 'member removed'})
        except User.DoesNotExist:
            return Response(
                {'detail': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
