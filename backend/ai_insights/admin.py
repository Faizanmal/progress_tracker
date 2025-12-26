from django.contrib import admin
from .models import TaskPrediction, TaskRecommendation, WeeklySummary, AnomalyDetection


@admin.register(TaskPrediction)
class TaskPredictionAdmin(admin.ModelAdmin):
    list_display = ['task', 'predicted_completion_date', 'confidence_score', 'risk_score', 'generated_at']
    list_filter = ['generated_at', 'model_version']
    search_fields = ['task__title']


@admin.register(TaskRecommendation)
class TaskRecommendationAdmin(admin.ModelAdmin):
    list_display = ['task', 'recommendation_type', 'confidence_score', 'is_applied', 'dismissed', 'created_at']
    list_filter = ['recommendation_type', 'is_applied', 'dismissed']
    search_fields = ['task__title', 'reason']
    filter_horizontal = ['recommended_users']


@admin.register(WeeklySummary)
class WeeklySummaryAdmin(admin.ModelAdmin):
    list_display = ['user', 'week_start', 'week_end', 'email_sent', 'created_at']
    list_filter = ['email_sent', 'week_start']
    search_fields = ['user__name', 'summary_text']


@admin.register(AnomalyDetection)
class AnomalyDetectionAdmin(admin.ModelAdmin):
    list_display = ['title', 'anomaly_type', 'severity', 'user', 'is_resolved', 'detected_at']
    list_filter = ['anomaly_type', 'severity', 'is_resolved']
    search_fields = ['title', 'description']
