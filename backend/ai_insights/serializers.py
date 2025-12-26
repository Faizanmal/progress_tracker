from rest_framework import serializers
from .models import TaskPrediction, TaskRecommendation, WeeklySummary, AnomalyDetection


class TaskPredictionSerializer(serializers.ModelSerializer):
    """Serializer for task predictions."""
    
    task_title = serializers.CharField(source='task.title', read_only=True)
    
    class Meta:
        model = TaskPrediction
        fields = [
            'id', 'task', 'task_title', 'predicted_completion_date',
            'confidence_score', 'estimated_hours_remaining',
            'risk_score', 'risk_factors', 'model_version', 'generated_at'
        ]


class TaskRecommendationSerializer(serializers.ModelSerializer):
    """Serializer for task recommendations."""
    
    task_title = serializers.CharField(source='task.title', read_only=True)
    recommended_users_detail = serializers.SerializerMethodField()
    recommendation_type_display = serializers.CharField(source='get_recommendation_type_display', read_only=True)
    
    class Meta:
        model = TaskRecommendation
        fields = [
            'id', 'task', 'task_title', 'recommendation_type', 'recommendation_type_display',
            'recommended_users', 'recommended_users_detail', 'reason', 'confidence_score',
            'factors', 'is_applied', 'applied_at', 'dismissed', 'created_at'
        ]
    
    def get_recommended_users_detail(self, obj):
        return [{'id': u.id, 'name': u.name, 'email': u.email} for u in obj.recommended_users.all()]


class WeeklySummarySerializer(serializers.ModelSerializer):
    """Serializer for weekly summaries."""
    
    user_name = serializers.CharField(source='user.name', read_only=True)
    
    class Meta:
        model = WeeklySummary
        fields = [
            'id', 'user', 'user_name', 'company', 'week_start', 'week_end',
            'summary_text', 'highlights', 'concerns', 'recommendations',
            'metrics', 'email_sent', 'email_sent_at', 'created_at'
        ]


class AnomalyDetectionSerializer(serializers.ModelSerializer):
    """Serializer for anomaly detections."""
    
    user_name = serializers.CharField(source='user.name', read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)
    anomaly_type_display = serializers.CharField(source='get_anomaly_type_display', read_only=True)
    severity_display = serializers.CharField(source='get_severity_display', read_only=True)
    
    class Meta:
        model = AnomalyDetection
        fields = [
            'id', 'anomaly_type', 'anomaly_type_display', 'severity', 'severity_display',
            'user', 'user_name', 'project', 'project_title', 'company',
            'title', 'description', 'data_points', 'suggested_actions',
            'is_resolved', 'resolved_at', 'resolution_notes', 'detected_at'
        ]
