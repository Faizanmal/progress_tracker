"""
Views for notifications app.
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone

from .models import (
    NotificationRule, NotificationDelivery, SMSConfiguration,
    PushSubscription, NotificationDigest
)
from .serializers import (
    NotificationRuleSerializer, NotificationRuleCreateSerializer,
    NotificationDeliverySerializer, SMSConfigurationSerializer,
    SMSConfigurationCreateSerializer, PushSubscriptionSerializer,
    NotificationDigestSerializer
)


class NotificationRuleViewSet(viewsets.ModelViewSet):
    """Manage notification rules."""
    serializer_class = NotificationRuleSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return NotificationRule.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return NotificationRuleCreateSerializer
        return NotificationRuleSerializer
    
    def perform_create(self, serializer):
        serializer.save(
            user=self.request.user,
            company=self.request.user.company
        )
    
    @action(detail=True, methods=['post'])
    def toggle(self, request, pk=None):
        """Toggle rule active status."""
        rule = self.get_object()
        rule.is_active = not rule.is_active
        rule.save(update_fields=['is_active'])
        return Response(NotificationRuleSerializer(rule).data)
    
    @action(detail=True, methods=['post'])
    def test(self, request, pk=None):
        """Test a notification rule."""
        rule = self.get_object()
        
        # Create a test delivery
        from .signals import send_notification
        
        context = {
            'task': None,
            'object_type': 'test',
            'object_id': 'test',
            'action_url': '/test/',
        }
        
        try:
            # Send to self only
            from .models import NotificationDelivery
            for channel in rule.channels:
                delivery = NotificationDelivery.objects.create(
                    rule=rule,
                    recipient=request.user,
                    channel=channel,
                    title=f"Test: {rule.name}",
                    message=f"This is a test notification for rule: {rule.name}",
                    status='sent',
                    sent_at=timezone.now(),
                )
            
            return Response({'status': 'test_sent'})
        except Exception as e:
            return Response({'error': str(e)}, status=400)
    
    @action(detail=False, methods=['get'])
    def templates(self, request):
        """Get predefined rule templates."""
        templates = [
            {
                'name': 'Task Overdue Alert',
                'trigger_type': 'task_overdue',
                'description': 'Get notified when a task becomes overdue',
                'channels': ['in_app', 'email'],
            },
            {
                'name': 'Task Overdue by 2 Days',
                'trigger_type': 'task_overdue_days',
                'description': 'Alert when task is overdue by more than 2 days',
                'conditions': {'days': 2},
                'channels': ['in_app', 'email'],
            },
            {
                'name': 'Low Progress Alert',
                'trigger_type': 'progress_below_threshold',
                'description': 'Alert when progress drops below 50%',
                'conditions': {'threshold': 50},
                'channels': ['in_app'],
            },
            {
                'name': 'Budget Warning',
                'trigger_type': 'budget_threshold',
                'description': 'Alert when budget reaches 80%',
                'conditions': {'threshold': 80},
                'channels': ['in_app', 'email'],
            },
            {
                'name': 'Daily Progress Reminder',
                'trigger_type': 'schedule',
                'description': 'Daily reminder to update progress',
                'schedule_cron': '0 17 * * 1-5',
                'channels': ['in_app'],
            },
        ]
        return Response(templates)


class NotificationDeliveryViewSet(viewsets.ReadOnlyModelViewSet):
    """View notification deliveries."""
    serializer_class = NotificationDeliverySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return NotificationDelivery.objects.filter(recipient=self.request.user)
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark a notification as read."""
        delivery = self.get_object()
        delivery.status = 'read'
        delivery.read_at = timezone.now()
        delivery.save(update_fields=['status', 'read_at'])
        return Response(NotificationDeliverySerializer(delivery).data)
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read."""
        self.get_queryset().filter(status__in=['sent', 'delivered']).update(
            status='read',
            read_at=timezone.now()
        )
        return Response({'status': 'all_marked_read'})
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread notifications."""
        count = self.get_queryset().filter(
            status__in=['sent', 'delivered', 'pending']
        ).count()
        return Response({'count': count})


class SMSConfigurationViewSet(viewsets.ModelViewSet):
    """Manage SMS configuration."""
    serializer_class = SMSConfigurationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return SMSConfiguration.objects.filter(company=self.request.user.company)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return SMSConfigurationCreateSerializer
        return SMSConfigurationSerializer
    
    def perform_create(self, serializer):
        serializer.save(company=self.request.user.company)
    
    @action(detail=True, methods=['post'])
    def test(self, request, pk=None):
        """Send a test SMS."""
        config = self.get_object()
        phone = request.data.get('phone')
        
        if not phone:
            return Response({'error': 'Phone number required'}, status=400)
        
        # Implementation depends on SMS provider
        return Response({'status': 'test_sms_sent', 'to': phone})


class PushSubscriptionViewSet(viewsets.ModelViewSet):
    """Manage push notification subscriptions."""
    serializer_class = PushSubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return PushSubscription.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def subscribe(self, request):
        """Subscribe to push notifications."""
        endpoint = request.data.get('endpoint')
        p256dh_key = request.data.get('p256dh_key')
        auth_key = request.data.get('auth_key')
        device_name = request.data.get('device_name', '')
        
        if not all([endpoint, p256dh_key, auth_key]):
            return Response(
                {'error': 'endpoint, p256dh_key, and auth_key are required'},
                status=400
            )
        
        subscription, created = PushSubscription.objects.update_or_create(
            user=request.user,
            endpoint=endpoint,
            defaults={
                'p256dh_key': p256dh_key,
                'auth_key': auth_key,
                'device_name': device_name,
                'is_active': True,
            }
        )
        
        return Response(
            PushSubscriptionSerializer(subscription).data,
            status=201 if created else 200
        )
    
    @action(detail=False, methods=['post'])
    def unsubscribe(self, request):
        """Unsubscribe from push notifications."""
        endpoint = request.data.get('endpoint')
        
        if endpoint:
            PushSubscription.objects.filter(
                user=request.user,
                endpoint=endpoint
            ).update(is_active=False)
        
        return Response({'status': 'unsubscribed'})


class NotificationDigestViewSet(viewsets.ReadOnlyModelViewSet):
    """View notification digests."""
    serializer_class = NotificationDigestSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return NotificationDigest.objects.filter(user=self.request.user)
