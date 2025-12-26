"""
URL configuration for automation app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()

# Workflow endpoints
router.register(r'workflows', views.WorkflowViewSet, basename='workflow')
router.register(r'workflow-executions', views.WorkflowExecutionViewSet, basename='workflow-execution')

# Dependency endpoints
router.register(r'dependencies', views.TaskDependencyViewSet, basename='task-dependency')
router.register(r'bottlenecks', views.DependencyBottleneckViewSet, basename='bottleneck')

# Escalation endpoints
router.register(r'escalation-rules', views.EscalationRuleViewSet, basename='escalation-rule')
router.register(r'escalations', views.EscalationViewSet, basename='escalation')

# Calendar endpoints
router.register(r'calendar-events', views.CalendarEventViewSet, basename='calendar-event')
router.register(r'schedule-suggestions', views.ScheduleSuggestionViewSet, basename='schedule-suggestion')

# Integration endpoints
router.register(r'chat-integrations', views.ChatIntegrationViewSet, basename='chat-integration')
router.register(r'git-integrations', views.GitIntegrationViewSet, basename='git-integration')

# Dashboard endpoints
router.register(r'dashboards', views.PersonalizedDashboardViewSet, basename='dashboard')
router.register(r'widgets', views.DashboardWidgetViewSet, basename='widget')

# Burnout endpoints
router.register(r'burnout-indicators', views.BurnoutIndicatorViewSet, basename='burnout-indicator')

# Location & Voice endpoints
router.register(r'location-configs', views.LocationBasedTrackingViewSet, basename='location-config')
router.register(r'location-checkins', views.LocationCheckInViewSet, basename='location-checkin')
router.register(r'voice-commands', views.VoiceCommandViewSet, basename='voice-command')

# Resource allocation endpoints
router.register(r'resource-suggestions', views.ResourceAllocationSuggestionViewSet, basename='resource-suggestion')

urlpatterns = [
    path('', include(router.urls)),
    
    # Git webhook endpoint
    path('webhooks/git/<int:repo_id>/', views.GitWebhookView.as_view(), name='git-webhook'),
]
