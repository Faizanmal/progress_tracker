from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'updates', views.ProgressUpdateViewSet, basename='progress-update')

urlpatterns = [
    path('team-summary/', views.team_progress_summary, name='team-progress-summary'),
    path('dashboard/', views.user_progress_dashboard, name='user-dashboard'),
    path('', include(router.urls)),
]
