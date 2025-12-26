from rest_framework import serializers
from .models import Project, ProjectComment
from users.serializers import TeamMemberSerializer


class ProjectCommentSerializer(serializers.ModelSerializer):
    """Serializer for project comments."""
    
    user_name = serializers.CharField(source='user.name', read_only=True)
    user_avatar = serializers.ImageField(source='user.avatar', read_only=True)
    
    class Meta:
        model = ProjectComment
        fields = ['id', 'project', 'user', 'user_name', 'user_avatar', 'text', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class ProjectSerializer(serializers.ModelSerializer):
    """Serializer for Project model."""
    
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)
    company_name = serializers.CharField(source='company.name', read_only=True)
    team_members_detail = TeamMemberSerializer(source='team_members', many=True, read_only=True)
    task_count = serializers.SerializerMethodField()
    completed_task_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = [
            'id', 'title', 'description', 'status', 'priority',
            'created_by', 'created_by_name', 'company', 'company_name',
            'team_members', 'team_members_detail',
            'start_date', 'end_date', 'progress_percentage',
            'task_count', 'completed_task_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at', 'progress_percentage']
    
    def get_task_count(self, obj):
        return obj.tasks.count()
    
    def get_completed_task_count(self, obj):
        return obj.tasks.filter(status='completed').count()


class ProjectListSerializer(serializers.ModelSerializer):
    """Simplified serializer for project listings."""
    
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)
    task_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = [
            'id', 'title', 'status', 'priority',
            'created_by_name', 'progress_percentage',
            'task_count', 'start_date', 'end_date', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'progress_percentage']
    
    def get_task_count(self, obj):
        return obj.tasks.count()


class ProjectCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating projects."""
    
    class Meta:
        model = Project
        fields = [
            'title', 'description', 'status', 'priority',
            'company', 'team_members', 'start_date', 'end_date'
        ]
    
    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['created_by'] = request.user
        return super().create(validated_data)
