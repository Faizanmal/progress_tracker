from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter(trailing_slash=False)
router.register(r'users', views.UserViewSet, basename='user')
router.register(r'companies', views.CompanyViewSet, basename='company')
router.register(r'notifications', views.NotificationViewSet, basename='notification')
router.register(r'notification-preferences', views.NotificationPreferenceViewSet, basename='notification-preference')
router.register(r'webhooks', views.WebhookIntegrationViewSet, basename='webhook')
router.register(r'calendar-integrations', views.CalendarIntegrationViewSet, basename='calendar-integration')

urlpatterns = [
    path('auth/register', views.register, name='register'),
    path('auth/login', views.login, name='login'),
    path('auth/me', views.get_current_user, name='current-user'),
    path('auth/profile', views.update_profile, name='update-profile'),
    path('', include(router.urls)),
]
