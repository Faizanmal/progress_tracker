from rest_framework import serializers
from .models import ProgressUpdate, ProgressAttachment, ProgressComment


class ProgressCommentSerializer(serializers.ModelSerializer):
    """Serializer for progress update comments."""
    
    user_name = serializers.CharField(source='user.name', read_only=True)
    user_avatar = serializers.ImageField(source='user.avatar', read_only=True)
    user_role = serializers.CharField(source='user.role', read_only=True)
    
    class Meta:
        model = ProgressComment
        fields = [
            'id', 'progress_update', 'user', 'user_name',
            'user_avatar', 'user_role', 'text',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class ProgressAttachmentSerializer(serializers.ModelSerializer):
    """Serializer for progress update attachments."""
    
    class Meta:
        model = ProgressAttachment
        fields = ['id', 'progress_update', 'file', 'filename', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']


class ProgressUpdateSerializer(serializers.ModelSerializer):
    """Serializer for Progress Update model."""
    
    task_title = serializers.CharField(source='task.title', read_only=True)
    task_project = serializers.CharField(source='task.project.title', read_only=True)
    user_name = serializers.CharField(source='user.name', read_only=True)
    user_avatar = serializers.ImageField(source='user.avatar', read_only=True)
    comments = ProgressCommentSerializer(many=True, read_only=True)
    attachments = ProgressAttachmentSerializer(many=True, read_only=True)
    links_list = serializers.SerializerMethodField()
    
    class Meta:
        model = ProgressUpdate
        fields = [
            'id', 'task', 'task_title', 'task_project',
            'user', 'user_name', 'user_avatar',
            'progress_percentage', 'status',
            'work_done', 'next_steps', 'blockers',
            'hours_worked', 'links', 'links_list',
            'comments', 'attachments',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']
    
    def get_links_list(self, obj):
        """Convert newline-separated links to a list."""
        if obj.links:
            return [link.strip() for link in obj.links.split('\n') if link.strip()]
        return []


class ProgressUpdateListSerializer(serializers.ModelSerializer):
    """Simplified serializer for progress update listings."""
    
    task_title = serializers.CharField(source='task.title', read_only=True)
    user_name = serializers.CharField(source='user.name', read_only=True)
    
    class Meta:
        model = ProgressUpdate
        fields = [
            'id', 'task_title', 'user_name',
            'progress_percentage', 'status',
            'hours_worked', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class ProgressUpdateCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating progress updates."""
    
    class Meta:
        model = ProgressUpdate
        fields = [
            'task', 'progress_percentage', 'status',
            'work_done', 'next_steps', 'blockers',
            'hours_worked', 'links'
        ]
    
    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['user'] = request.user
        return super().create(validated_data)
    
    def validate_progress_percentage(self, value):
        """Validate progress percentage is between 0-100."""
        if value < 0 or value > 100:
            raise serializers.ValidationError("Progress percentage must be between 0 and 100")
        return value
    
    def validate(self, data):
        """Validate that blocked status requires blockers description."""
        if data.get('status') == 'blocked' and not data.get('blockers'):
            raise serializers.ValidationError({
                "blockers": "Please describe the blockers when marking as blocked"
            })
        return data
