from rest_framework import serializers
from .models import Task, TaskAttachment, TaskComment


class TaskCommentSerializer(serializers.ModelSerializer):
    """Serializer for task comments."""
    
    user_name = serializers.CharField(source='user.name', read_only=True)
    user_avatar = serializers.ImageField(source='user.avatar', read_only=True)
    
    class Meta:
        model = TaskComment
        fields = ['id', 'task', 'user', 'user_name', 'user_avatar', 'text', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class TaskAttachmentSerializer(serializers.ModelSerializer):
    """Serializer for task attachments."""
    
    uploaded_by_name = serializers.CharField(source='uploaded_by.name', read_only=True)
    
    class Meta:
        model = TaskAttachment
        fields = ['id', 'task', 'file', 'filename', 'uploaded_by', 'uploaded_by_name', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_by', 'uploaded_at']


class TaskSerializer(serializers.ModelSerializer):
    """Serializer for Task model."""
    
    project_title = serializers.CharField(source='project.title', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.name', read_only=True)
    assigned_to_avatar = serializers.ImageField(source='assigned_to.avatar', read_only=True)
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    is_blocked = serializers.BooleanField(read_only=True)
    progress_updates_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'status', 'priority',
            'project', 'project_title',
            'assigned_to', 'assigned_to_name', 'assigned_to_avatar',
            'created_by', 'created_by_name',
            'progress_percentage', 'estimated_hours', 'actual_hours',
            'deadline', 'started_at', 'completed_at',
            'is_overdue', 'is_blocked', 'tags',
            'progress_updates_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'created_by', 'created_at', 'updated_at',
            'started_at', 'completed_at', 'actual_hours'
        ]
    
    def get_progress_updates_count(self, obj):
        return obj.progress_updates.count()


class TaskListSerializer(serializers.ModelSerializer):
    """Simplified serializer for task listings."""
    
    project_title = serializers.CharField(source='project.title', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.name', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'status', 'priority',
            'project_title', 'assigned_to_name',
            'progress_percentage', 'deadline', 'is_overdue',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class TaskCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating tasks."""
    
    class Meta:
        model = Task
        fields = [
            'title', 'description', 'status', 'priority',
            'project', 'assigned_to', 'estimated_hours',
            'deadline', 'tags'
        ]
    
    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['created_by'] = request.user
        return super().create(validated_data)
