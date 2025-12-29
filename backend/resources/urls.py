"""
URL configuration for resources app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    ResourceAllocationViewSet, UserCapacityViewSet, CapacityWarningViewSet,
    ProjectBudgetViewSet, ExpenseViewSet, BudgetAlertViewSet,
    BudgetVarianceReportViewSet
)

router = DefaultRouter()
router.register(r'allocations', ResourceAllocationViewSet, basename='allocation')
router.register(r'capacity', UserCapacityViewSet, basename='capacity')
router.register(r'capacity-warnings', CapacityWarningViewSet, basename='capacity-warning')
router.register(r'budgets', ProjectBudgetViewSet, basename='budget')
router.register(r'expenses', ExpenseViewSet, basename='expense')
router.register(r'budget-alerts', BudgetAlertViewSet, basename='budget-alert')
router.register(r'variance-reports', BudgetVarianceReportViewSet, basename='variance-report')

urlpatterns = [
    path('', include(router.urls)),
]
