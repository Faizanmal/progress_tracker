"""
Views for tenants app.
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
import secrets

from .models import Tenant, TenantBranding, TenantInvitation, TenantAuditLog, TenantUsageStats
from .serializers import (
    TenantSerializer, TenantUpdateSerializer, TenantBrandingSerializer,
    TenantInvitationSerializer, TenantInvitationCreateSerializer,
    TenantAuditLogSerializer, TenantUsageStatsSerializer
)


class TenantViewSet(viewsets.ModelViewSet):
    """Manage tenant settings."""
    serializer_class = TenantSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Tenant.objects.filter(company=self.request.user.company)
    
    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return TenantUpdateSerializer
        return TenantSerializer
    
    @action(detail=False, methods=['get'])
    def current(self, request):
        """Get current user's tenant."""
        try:
            tenant = Tenant.objects.get(company=request.user.company)
            return Response(TenantSerializer(tenant).data)
        except Tenant.DoesNotExist:
            return Response({'error': 'No tenant found'}, status=404)
    
    @action(detail=True, methods=['get'])
    def usage(self, request, pk=None):
        """Get tenant usage statistics."""
        tenant = self.get_object()
        
        return Response({
            'users': {
                'current': tenant.current_users,
                'max': tenant.max_users,
                'percentage': round((tenant.current_users / tenant.max_users) * 100, 1) if tenant.max_users > 0 else 0,
            },
            'projects': {
                'current': tenant.current_projects,
                'max': tenant.max_projects,
                'percentage': round((tenant.current_projects / tenant.max_projects) * 100, 1) if tenant.max_projects > 0 else 0,
            },
            'storage': {
                'used_gb': round(tenant.storage_used_bytes / (1024 ** 3), 2),
                'max_gb': tenant.max_storage_gb,
                'remaining_gb': tenant.get_storage_remaining_gb(),
            },
        })
    
    @action(detail=True, methods=['get'])
    def features(self, request, pk=None):
        """Get available features for tenant."""
        tenant = self.get_object()
        
        all_features = [
            'basic_tasks', 'basic_projects', 'file_attachments', 'basic_reports',
            'advanced_reports', 'calendar_sync', 'api_access', 'custom_dashboards',
            'budget_tracking', 'resource_allocation', 'audit_logs', 'sso',
            'white_labeling', 'multi_tenant', 'priority_support',
        ]
        
        feature_status = {
            feature: tenant.has_feature(feature)
            for feature in all_features
        }
        
        return Response({
            'plan': tenant.plan,
            'features': feature_status,
        })
    
    @action(detail=True, methods=['post'])
    def update_settings(self, request, pk=None):
        """Update tenant settings."""
        tenant = self.get_object()
        settings = request.data.get('settings', {})
        
        tenant.settings.update(settings)
        tenant.save(update_fields=['settings'])
        
        return Response(TenantSerializer(tenant).data)


class TenantBrandingViewSet(viewsets.ModelViewSet):
    """Manage tenant branding."""
    serializer_class = TenantBrandingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return TenantBranding.objects.filter(tenant__company=self.request.user.company)
    
    @action(detail=False, methods=['get'])
    def current(self, request):
        """Get current tenant's branding."""
        try:
            tenant = Tenant.objects.get(company=request.user.company)
            branding, created = TenantBranding.objects.get_or_create(tenant=tenant)
            return Response(TenantBrandingSerializer(branding).data)
        except Tenant.DoesNotExist:
            return Response({'error': 'No tenant found'}, status=404)
    
    @action(detail=False, methods=['post'])
    def update_branding(self, request):
        """Update tenant branding."""
        try:
            tenant = Tenant.objects.get(company=request.user.company)
            branding, created = TenantBranding.objects.get_or_create(tenant=tenant)
            
            serializer = TenantBrandingSerializer(branding, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            
            return Response(serializer.data)
        except Tenant.DoesNotExist:
            return Response({'error': 'No tenant found'}, status=404)


class TenantInvitationViewSet(viewsets.ModelViewSet):
    """Manage tenant invitations."""
    serializer_class = TenantInvitationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return TenantInvitation.objects.filter(
            tenant__company=self.request.user.company
        )
    
    def get_serializer_class(self):
        if self.action == 'create':
            return TenantInvitationCreateSerializer
        return TenantInvitationSerializer
    
    def perform_create(self, serializer):
        tenant = Tenant.objects.get(company=self.request.user.company)
        
        # Generate invitation token
        token = secrets.token_urlsafe(32)
        
        # Set expiration (7 days)
        expires_at = timezone.now() + timedelta(days=7)
        
        serializer.save(
            tenant=tenant,
            invited_by=self.request.user,
            token=token,
            expires_at=expires_at,
        )
    
    @action(detail=False, methods=['post'])
    def accept(self, request):
        """Accept an invitation."""
        token = request.data.get('token')
        
        if not token:
            return Response({'error': 'Token required'}, status=400)
        
        try:
            invitation = TenantInvitation.objects.get(
                token=token,
                status='pending'
            )
        except TenantInvitation.DoesNotExist:
            return Response({'error': 'Invalid or expired invitation'}, status=404)
        
        if invitation.is_expired():
            invitation.status = 'expired'
            invitation.save()
            return Response({'error': 'Invitation has expired'}, status=400)
        
        # Check if user can be added
        if not invitation.tenant.can_add_user():
            return Response({'error': 'Tenant has reached user limit'}, status=400)
        
        # Update user's company
        user = request.user
        user.company = invitation.tenant.company
        user.role = invitation.role
        user.save()
        
        # Mark invitation as accepted
        invitation.status = 'accepted'
        invitation.accepted_user = user
        invitation.accepted_at = timezone.now()
        invitation.save()
        
        return Response({
            'status': 'accepted',
            'tenant': TenantSerializer(invitation.tenant).data,
        })
    
    @action(detail=True, methods=['post'])
    def resend(self, request, pk=None):
        """Resend an invitation email."""
        invitation = self.get_object()
        
        if invitation.status != 'pending':
            return Response({'error': 'Cannot resend non-pending invitation'}, status=400)
        
        # Extend expiration
        invitation.expires_at = timezone.now() + timedelta(days=7)
        invitation.save()
        
        # Send email (implementation depends on email service)
        # send_invitation_email(invitation)
        
        return Response({'status': 'resent'})
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel an invitation."""
        invitation = self.get_object()
        
        if invitation.status != 'pending':
            return Response({'error': 'Cannot cancel non-pending invitation'}, status=400)
        
        invitation.status = 'cancelled'
        invitation.save()
        
        return Response({'status': 'cancelled'})


class TenantAuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """View tenant admin audit logs."""
    serializer_class = TenantAuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return TenantAuditLog.objects.filter(
            tenant__company=self.request.user.company
        )


class TenantUsageStatsViewSet(viewsets.ReadOnlyModelViewSet):
    """View tenant usage statistics."""
    serializer_class = TenantUsageStatsSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return TenantUsageStats.objects.filter(
            tenant__company=self.request.user.company
        )
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get usage summary for a date range."""
        days = int(request.query_params.get('days', 30))
        start_date = (timezone.now() - timedelta(days=days)).date()
        
        stats = self.get_queryset().filter(date__gte=start_date)
        
        from django.db.models import Sum, Avg
        summary = stats.aggregate(
            total_tasks_created=Sum('tasks_created'),
            total_tasks_completed=Sum('tasks_completed'),
            avg_active_users=Avg('active_users'),
            total_api_requests=Sum('api_requests'),
            total_files_uploaded=Sum('files_uploaded'),
        )
        
        return Response({
            'period_days': days,
            'summary': summary,
            'daily_stats': TenantUsageStatsSerializer(stats, many=True).data,
        })
