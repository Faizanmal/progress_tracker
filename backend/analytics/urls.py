from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TimeEntryViewSet, TimesheetViewSet, ReportViewSet,
    ProjectTemplateViewSet, TaskDependencyViewSet, MilestoneViewSet,
    AnalyticsDashboardView, ProductivityAnalyticsView, BurndownChartView
)

router = DefaultRouter()
router.register(r'time-entries', TimeEntryViewSet, basename='time-entry')
router.register(r'timesheets', TimesheetViewSet, basename='timesheet')
router.register(r'reports', ReportViewSet, basename='report')
router.register(r'templates', ProjectTemplateViewSet, basename='template')
router.register(r'dependencies', TaskDependencyViewSet, basename='dependency')
router.register(r'milestones', MilestoneViewSet, basename='milestone')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/', AnalyticsDashboardView.as_view(), name='analytics-dashboard'),
    path('productivity/', ProductivityAnalyticsView.as_view(), name='productivity'),
    path('burndown/<int:project_id>/', BurndownChartView.as_view(), name='burndown'),
]
