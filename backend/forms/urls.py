"""
URL configuration for forms app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    FormViewSet, FormFieldViewSet,
    FormSubmissionViewSet, FormTemplateViewSet
)

router = DefaultRouter()
router.register(r'forms', FormViewSet, basename='form')
router.register(r'submissions', FormSubmissionViewSet, basename='submission')
router.register(r'templates', FormTemplateViewSet, basename='form-template')

urlpatterns = [
    path('', include(router.urls)),
]
