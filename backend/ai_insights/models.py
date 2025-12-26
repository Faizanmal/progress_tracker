from django.db import models
from django.conf import settings


class TaskPrediction(models.Model):
    """AI-generated predictions for tasks."""
    
    task = models.ForeignKey(
        'tasks.Task',
        on_delete=models.CASCADE,
        related_name='predictions'
    )
    
    # Predictions
    predicted_completion_date = models.DateTimeField(null=True, blank=True)
    confidence_score = models.FloatField(default=0)  # 0-1
    estimated_hours_remaining = models.FloatField(null=True, blank=True)
    
    # Risk assessment
    risk_score = models.FloatField(default=0)  # 0-1
    risk_factors = models.JSONField(default=list, blank=True)
    
    # Model info
    model_version = models.CharField(max_length=50, default='v1')
    generated_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-generated_at']
        get_latest_by = 'generated_at'
    
    def __str__(self):
        return f"Prediction for {self.task.title}"


class TaskRecommendation(models.Model):
    """AI-generated task assignment recommendations."""
    
    RECOMMENDATION_TYPES = [
        ('assignment', 'Task Assignment'),
        ('reassignment', 'Task Reassignment'),
        ('workload', 'Workload Balancing'),
        ('priority', 'Priority Adjustment'),
    ]
    
    task = models.ForeignKey(
        'tasks.Task',
        on_delete=models.CASCADE,
        related_name='recommendations'
    )
    recommendation_type = models.CharField(max_length=20, choices=RECOMMENDATION_TYPES)
    
    # Recommended user(s)
    recommended_users = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='task_recommendations'
    )
    
    # Explanation
    reason = models.TextField()
    confidence_score = models.FloatField(default=0)  # 0-1
    
    # Factors considered (JSON)
    factors = models.JSONField(default=dict, blank=True)
    
    # Status
    is_applied = models.BooleanField(default=False)
    applied_at = models.DateTimeField(null=True, blank=True)
    dismissed = models.BooleanField(default=False)
    dismissed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='dismissed_recommendations'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_recommendation_type_display()} for {self.task.title}"


class WeeklySummary(models.Model):
    """AI-generated weekly summaries."""
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='weekly_summaries'
    )
    company = models.ForeignKey(
        'users.Company',
        on_delete=models.CASCADE,
        related_name='weekly_summaries'
    )
    
    # Summary period
    week_start = models.DateField()
    week_end = models.DateField()
    
    # Generated content
    summary_text = models.TextField()
    highlights = models.JSONField(default=list)  # Key achievements
    concerns = models.JSONField(default=list)  # Potential issues
    recommendations = models.JSONField(default=list)  # Suggested actions
    
    # Metrics snapshot
    metrics = models.JSONField(default=dict)
    
    # Email sent
    email_sent = models.BooleanField(default=False)
    email_sent_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-week_start']
        unique_together = ['user', 'week_start']
    
    def __str__(self):
        return f"Summary for {self.user.name} - Week of {self.week_start}"


class AnomalyDetection(models.Model):
    """Detected anomalies in progress/productivity."""
    
    ANOMALY_TYPES = [
        ('blocked_pattern', 'Recurring Blocks'),
        ('productivity_drop', 'Productivity Drop'),
        ('overtime', 'Excessive Overtime'),
        ('missed_deadlines', 'Pattern of Missed Deadlines'),
        ('workload_imbalance', 'Workload Imbalance'),
    ]
    
    SEVERITY_LEVELS = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    anomaly_type = models.CharField(max_length=30, choices=ANOMALY_TYPES)
    severity = models.CharField(max_length=10, choices=SEVERITY_LEVELS)
    
    # Affected entities
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='anomalies'
    )
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='anomalies'
    )
    company = models.ForeignKey(
        'users.Company',
        on_delete=models.CASCADE,
        related_name='anomalies'
    )
    
    # Description
    title = models.CharField(max_length=255)
    description = models.TextField()
    data_points = models.JSONField(default=list)  # Evidence
    
    # Suggested actions
    suggested_actions = models.JSONField(default=list)
    
    # Resolution
    is_resolved = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='resolved_anomalies'
    )
    resolution_notes = models.TextField(blank=True)
    
    detected_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-detected_at']
        verbose_name = 'Anomaly Detection'
        verbose_name_plural = 'Anomaly Detections'
    
    def __str__(self):
        return f"{self.get_anomaly_type_display()} - {self.severity}"
