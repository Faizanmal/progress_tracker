"""
Views for audit app.
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
from datetime import timedelta

from .models import AuditLog, ChangeSnapshot, AuditLogSearch
from .serializers import (
    AuditLogSerializer, AuditLogListSerializer,
    ChangeSnapshotSerializer, AuditLogSearchSerializer
)


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """View audit logs."""
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = AuditLog.objects.filter(company=self.request.user.company)
        
        # Apply filters
        user_id = self.request.query_params.get('user')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        action = self.request.query_params.get('action')
        if action:
            queryset = queryset.filter(action=action)
        
        action_category = self.request.query_params.get('category')
        if action_category:
            queryset = queryset.filter(action_category=action_category)
        
        severity = self.request.query_params.get('severity')
        if severity:
            queryset = queryset.filter(severity=severity)
        
        # Date range filters
        start_date = self.request.query_params.get('start_date')
        if start_date:
            queryset = queryset.filter(timestamp__date__gte=start_date)
        
        end_date = self.request.query_params.get('end_date')
        if end_date:
            queryset = queryset.filter(timestamp__date__lte=end_date)
        
        # Object filters
        object_type = self.request.query_params.get('object_type')
        if object_type:
            queryset = queryset.filter(content_type__model=object_type)
        
        object_id = self.request.query_params.get('object_id')
        if object_id:
            queryset = queryset.filter(object_id=object_id)
        
        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(user_name__icontains=search) |
                Q(object_repr__icontains=search) |
                Q(message__icontains=search)
            )
        
        return queryset.select_related('user', 'content_type')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return AuditLogListSerializer
        return AuditLogSerializer
    
    @action(detail=False, methods=['get'])
    def object_history(self, request):
        """Get full history for a specific object."""
        object_type = request.query_params.get('object_type')
        object_id = request.query_params.get('object_id')
        
        if not object_type or not object_id:
            return Response(
                {'error': 'object_type and object_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        logs = self.get_queryset().filter(
            content_type__model=object_type,
            object_id=object_id
        )
        
        return Response(AuditLogSerializer(logs, many=True).data)
    
    @action(detail=False, methods=['get'])
    def user_activity(self, request):
        """Get activity for a specific user."""
        user_id = request.query_params.get('user_id')
        if not user_id:
            user_id = request.user.id
        
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now() - timedelta(days=days)
        
        logs = self.get_queryset().filter(
            user_id=user_id,
            timestamp__gte=start_date
        )
        
        return Response(AuditLogListSerializer(logs, many=True).data)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get summary statistics."""
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now() - timedelta(days=days)
        
        queryset = self.get_queryset().filter(timestamp__gte=start_date)
        
        # Count by action
        from django.db.models import Count
        by_action = queryset.values('action').annotate(count=Count('id'))
        
        # Count by category
        by_category = queryset.values('action_category').annotate(count=Count('id'))
        
        # Count by user
        by_user = queryset.values('user_name').annotate(count=Count('id')).order_by('-count')[:10]
        
        # Count by day
        from django.db.models.functions import TruncDate
        by_day = queryset.annotate(date=TruncDate('timestamp')).values('date').annotate(
            count=Count('id')
        ).order_by('date')
        
        return Response({
            'total_events': queryset.count(),
            'by_action': list(by_action),
            'by_category': list(by_category),
            'top_users': list(by_user),
            'by_day': list(by_day),
        })
    
    @action(detail=False, methods=['get'])
    def export(self, request):
        """Export audit logs to CSV."""
        import csv
        from django.http import HttpResponse
        
        queryset = self.get_queryset()[:10000]  # Limit export
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="audit_log.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'Timestamp', 'User', 'Action', 'Category', 'Object Type',
            'Object', 'Message', 'IP Address'
        ])
        
        for log in queryset:
            writer.writerow([
                log.timestamp.isoformat(),
                log.user_name,
                log.action,
                log.action_category,
                log.content_type.model,
                log.object_repr,
                log.message,
                log.ip_address,
            ])
        
        return response


class ChangeSnapshotViewSet(viewsets.ReadOnlyModelViewSet):
    """View change snapshots."""
    serializer_class = ChangeSnapshotSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return ChangeSnapshot.objects.filter(
            audit_log__company=self.request.user.company
        )
    
    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """Restore an object to this snapshot state."""
        snapshot = self.get_object()
        
        # This is a placeholder - actual implementation would depend on model
        # and would need proper validation and authorization
        return Response({
            'status': 'restore_not_implemented',
            'message': 'Restore functionality requires model-specific implementation',
            'snapshot_data': snapshot.snapshot_data,
        })


class AuditLogSearchViewSet(viewsets.ModelViewSet):
    """Manage saved audit log searches."""
    serializer_class = AuditLogSearchSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return AuditLogSearch.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(
            user=self.request.user,
            company=self.request.user.company
        )
    
    @action(detail=True, methods=['get'])
    def execute(self, request, pk=None):
        """Execute a saved search."""
        saved_search = self.get_object()
        filters = saved_search.filters
        
        queryset = AuditLog.objects.filter(company=request.user.company)
        
        # Apply saved filters
        if filters.get('user_id'):
            queryset = queryset.filter(user_id=filters['user_id'])
        if filters.get('action'):
            queryset = queryset.filter(action=filters['action'])
        if filters.get('category'):
            queryset = queryset.filter(action_category=filters['category'])
        if filters.get('object_type'):
            queryset = queryset.filter(content_type__model=filters['object_type'])
        
        # Apply date range if specified
        if filters.get('days'):
            start_date = timezone.now() - timedelta(days=filters['days'])
            queryset = queryset.filter(timestamp__gte=start_date)
        
        return Response(AuditLogListSerializer(queryset[:100], many=True).data)
