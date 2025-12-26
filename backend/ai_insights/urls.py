from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TaskPredictionViewSet, TaskRecommendationViewSet,
    WeeklySummaryViewSet, AnomalyDetectionViewSet,
    AIInsightsDashboardView
)

router = DefaultRouter()
router.register(r'predictions', TaskPredictionViewSet, basename='prediction')
router.register(r'recommendations', TaskRecommendationViewSet, basename='recommendation')
router.register(r'summaries', WeeklySummaryViewSet, basename='summary')
router.register(r'anomalies', AnomalyDetectionViewSet, basename='anomaly')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/', AIInsightsDashboardView.as_view(), name='ai-dashboard'),
]
