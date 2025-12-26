from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from .models import TaskPrediction, TaskRecommendation, WeeklySummary, AnomalyDetection
from .serializers import (
    TaskPredictionSerializer, TaskRecommendationSerializer,
    WeeklySummarySerializer, AnomalyDetectionSerializer
)
from .services import (
    TaskAssignmentRecommender, ProgressPredictor,
    SummaryGenerator, AnomalyDetector
)
from tasks.models import Task
from users.permissions import IsManager


class TaskPredictionViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing task predictions."""
    
    permission_classes = [IsAuthenticated]
    serializer_class = TaskPredictionSerializer
    
    def get_queryset(self):
        return TaskPrediction.objects.filter(
            task__project__company=self.request.user.company
        )
    
    @action(detail=False, methods=['post'])
    def predict(self, request):
        """Generate prediction for a specific task."""
        task_id = request.data.get('task_id')
        try:
            task = Task.objects.get(id=task_id, project__company=request.user.company)
        except Task.DoesNotExist:
            return Response({'detail': 'Task not found'}, status=404)
        
        predictor = ProgressPredictor()
        prediction_data = predictor.predict_completion(task)
        
        # Save prediction
        prediction = TaskPrediction.objects.create(
            task=task,
            predicted_completion_date=prediction_data['predicted_date'],
            confidence_score=prediction_data['confidence'],
            estimated_hours_remaining=prediction_data.get('estimated_hours_remaining'),
            risk_score=prediction_data['risk_score'],
            risk_factors=prediction_data['risk_factors']
        )
        
        return Response(TaskPredictionSerializer(prediction).data)


class TaskRecommendationViewSet(viewsets.ModelViewSet):
    """ViewSet for task recommendations."""
    
    permission_classes = [IsAuthenticated, IsManager]
    serializer_class = TaskRecommendationSerializer
    
    def get_queryset(self):
        return TaskRecommendation.objects.filter(
            task__project__company=self.request.user.company,
            dismissed=False
        )
    
    @action(detail=False, methods=['post'])
    def suggest_assignee(self, request):
        """Get assignment suggestions for a task."""
        task_id = request.data.get('task_id')
        try:
            task = Task.objects.get(id=task_id, project__company=request.user.company)
        except Task.DoesNotExist:
            return Response({'detail': 'Task not found'}, status=404)
        
        recommender = TaskAssignmentRecommender(request.user.company)
        suggestions = recommender.recommend_assignee(task)
        
        # Save recommendations
        recommendations = []
        for suggestion in suggestions:
            rec = TaskRecommendation.objects.create(
                task=task,
                recommendation_type='assignment',
                reason=f"Score: {suggestion['score']:.1f}/100 based on workload, performance, and availability",
                confidence_score=suggestion['score'] / 100,
                factors=suggestion['factors']
            )
            rec.recommended_users.add(suggestion['user'])
            recommendations.append(rec)
        
        return Response(TaskRecommendationSerializer(recommendations, many=True).data)
    
    @action(detail=True, methods=['post'])
    def apply(self, request, pk=None):
        """Apply a recommendation."""
        recommendation = self.get_object()
        
        # Apply the first recommended user
        recommended_user = recommendation.recommended_users.first()
        if recommended_user:
            recommendation.task.assigned_to = recommended_user
            recommendation.task.save()
        
        recommendation.is_applied = True
        recommendation.applied_at = timezone.now()
        recommendation.save()
        
        return Response(TaskRecommendationSerializer(recommendation).data)
    
    @action(detail=True, methods=['post'])
    def dismiss(self, request, pk=None):
        """Dismiss a recommendation."""
        recommendation = self.get_object()
        recommendation.dismissed = True
        recommendation.dismissed_by = request.user
        recommendation.save()
        
        return Response({'status': 'dismissed'})


class WeeklySummaryViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for weekly summaries."""
    
    permission_classes = [IsAuthenticated]
    serializer_class = WeeklySummarySerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.is_admin or user.is_manager:
            return WeeklySummary.objects.filter(company=user.company)
        return WeeklySummary.objects.filter(user=user)
    
    @action(detail=False, methods=['post'])
    def generate(self, request):
        """Generate a new weekly summary."""
        generator = SummaryGenerator(request.user)
        summary_data = generator.generate_weekly_summary()
        
        summary, created = WeeklySummary.objects.update_or_create(
            user=request.user,
            week_start=summary_data['week_start'],
            defaults={
                'company': request.user.company,
                'week_end': summary_data['week_end'],
                'summary_text': summary_data['summary_text'],
                'highlights': summary_data['highlights'],
                'concerns': summary_data['concerns'],
                'recommendations': summary_data['recommendations'],
                'metrics': summary_data['metrics']
            }
        )
        
        return Response(WeeklySummarySerializer(summary).data)
    
    @action(detail=False, methods=['get'])
    def my_summaries(self, request):
        """Get summaries for current user."""
        summaries = WeeklySummary.objects.filter(user=request.user)[:10]
        return Response(WeeklySummarySerializer(summaries, many=True).data)


class AnomalyDetectionViewSet(viewsets.ModelViewSet):
    """ViewSet for anomaly detections."""
    
    permission_classes = [IsAuthenticated, IsManager]
    serializer_class = AnomalyDetectionSerializer
    
    def get_queryset(self):
        return AnomalyDetection.objects.filter(
            company=self.request.user.company,
            is_resolved=False
        )
    
    @action(detail=False, methods=['post'])
    def scan(self, request):
        """Run anomaly detection scan."""
        detector = AnomalyDetector(request.user.company)
        anomalies_data = detector.detect_anomalies()
        
        created_anomalies = []
        for data in anomalies_data:
            anomaly = AnomalyDetection.objects.create(
                anomaly_type=data['type'],
                severity=data['severity'],
                user=data.get('user'),
                project=data.get('project'),
                company=request.user.company,
                title=data['title'],
                description=data['description'],
                suggested_actions=data['suggested_actions']
            )
            created_anomalies.append(anomaly)
        
        return Response({
            'scanned_at': timezone.now(),
            'anomalies_found': len(created_anomalies),
            'anomalies': AnomalyDetectionSerializer(created_anomalies, many=True).data
        })
    
    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """Mark an anomaly as resolved."""
        anomaly = self.get_object()
        anomaly.is_resolved = True
        anomaly.resolved_at = timezone.now()
        anomaly.resolved_by = request.user
        anomaly.resolution_notes = request.data.get('notes', '')
        anomaly.save()
        
        return Response(AnomalyDetectionSerializer(anomaly).data)


class AIInsightsDashboardView(APIView):
    """Dashboard view for AI insights."""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        company = user.company
        
        # Get recent predictions
        recent_predictions = TaskPrediction.objects.filter(
            task__project__company=company
        ).order_by('-generated_at')[:10]
        
        # High-risk tasks
        high_risk_predictions = TaskPrediction.objects.filter(
            task__project__company=company,
            risk_score__gte=0.6
        ).order_by('-risk_score')[:5]
        
        # Pending recommendations
        pending_recommendations = TaskRecommendation.objects.filter(
            task__project__company=company,
            is_applied=False,
            dismissed=False
        ).count()
        
        # Unresolved anomalies
        unresolved_anomalies = AnomalyDetection.objects.filter(
            company=company,
            is_resolved=False
        )
        
        # User's latest summary
        latest_summary = WeeklySummary.objects.filter(user=user).first()
        
        return Response({
            'predictions': {
                'recent': TaskPredictionSerializer(recent_predictions, many=True).data,
                'high_risk': TaskPredictionSerializer(high_risk_predictions, many=True).data
            },
            'recommendations': {
                'pending_count': pending_recommendations
            },
            'anomalies': {
                'unresolved_count': unresolved_anomalies.count(),
                'by_severity': {
                    'critical': unresolved_anomalies.filter(severity='critical').count(),
                    'high': unresolved_anomalies.filter(severity='high').count(),
                    'medium': unresolved_anomalies.filter(severity='medium').count(),
                    'low': unresolved_anomalies.filter(severity='low').count()
                },
                'recent': AnomalyDetectionSerializer(unresolved_anomalies[:5], many=True).data
            },
            'summary': WeeklySummarySerializer(latest_summary).data if latest_summary else None
        })
