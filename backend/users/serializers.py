from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Company, Notification, NotificationPreference, WebhookIntegration, CalendarIntegration

User = get_user_model()


class CompanySerializer(serializers.ModelSerializer):
    """Serializer for Company model."""
    
    user_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Company
        fields = [
            'id', 'name', 'description', 'website', 'logo',
            'subscription_plan', 'subscription_active', 'subscription_expires',
            'max_users', 'user_count', 'allow_google_oauth',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'user_count']
    
    def get_user_count(self, obj):
        return obj.users.count()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model."""
    
    company_name = serializers.CharField(source='company.name', read_only=True)
    manager_name = serializers.CharField(source='manager.name', read_only=True)
    team_members_count = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'name', 'role', 'avatar', 'phone',
            'department', 'position', 'is_active',
            'company', 'company_name', 'manager', 'manager_name',
            'team_members_count', 'date_joined', 'last_login'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login']
        extra_kwargs = {
            'password': {'write_only': True}
        }
    
    def get_team_members_count(self, obj):
        if obj.role == 'manager':
            return obj.team_members.count()
        return 0


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = User
        fields = ['email', 'name', 'password', 'password_confirm', 'role', 'company']
    
    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError("Passwords do not match")
        return data
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile updates."""
    
    class Meta:
        model = User
        fields = ['name', 'avatar', 'phone', 'department', 'position']


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for Notification model."""
    
    user_name = serializers.CharField(source='user.name', read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'user', 'user_name', 'notification_type',
            'title', 'message', 'link', 'priority', 'is_read',
            'is_email_sent', 'is_push_sent', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    """Serializer for notification preferences."""
    
    class Meta:
        model = NotificationPreference
        fields = [
            'id', 'user',
            # Email preferences
            'email_task_assigned', 'email_task_blocked', 'email_task_overdue',
            'email_progress_update', 'email_comment_added', 'email_reminder',
            'email_timesheet', 'email_milestone', 'email_report', 'email_frequency',
            # Push preferences
            'push_enabled', 'push_task_assigned', 'push_task_blocked',
            'push_task_overdue', 'push_progress_update', 'push_comment_added',
            'push_reminder',
            # In-app
            'inapp_enabled',
            # Quiet hours
            'quiet_hours_enabled', 'quiet_hours_start', 'quiet_hours_end',
            # Webhook
            'webhook_url', 'webhook_enabled',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class WebhookIntegrationSerializer(serializers.ModelSerializer):
    """Serializer for webhook integrations."""
    
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)
    integration_type_display = serializers.CharField(source='get_integration_type_display', read_only=True)
    
    class Meta:
        model = WebhookIntegration
        fields = [
            'id', 'company', 'name', 'integration_type', 'integration_type_display',
            'webhook_url', 'notify_task_assigned', 'notify_task_blocked',
            'notify_task_completed', 'notify_progress_update', 'notify_milestone',
            'is_active', 'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'company', 'created_by', 'created_at', 'updated_at']


class CalendarIntegrationSerializer(serializers.ModelSerializer):
    """Serializer for calendar integrations."""
    
    calendar_type_display = serializers.CharField(source='get_calendar_type_display', read_only=True)
    
    class Meta:
        model = CalendarIntegration
        fields = [
            'id', 'user', 'calendar_type', 'calendar_type_display',
            'sync_tasks', 'sync_deadlines', 'sync_milestones',
            'is_active', 'last_synced', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'last_synced', 'created_at', 'updated_at']
        extra_kwargs = {
            'access_token': {'write_only': True},
            'refresh_token': {'write_only': True}
        }


class TeamMemberSerializer(serializers.ModelSerializer):
    """Simplified serializer for team member listings."""
    
    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'role', 'avatar', 'department', 'position']
        read_only_fields = ['id']
