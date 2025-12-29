"""
Signals for integrations app.
"""
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.utils import timezone
import json
import requests

from tasks.models import Task
from projects.models import Project
from progress.models import ProgressUpdate

from .models import WebhookEndpoint, WebhookDelivery


def trigger_webhooks(event_type, payload, company):
    """Trigger all active webhooks for a given event type."""
    webhooks = WebhookEndpoint.objects.filter(
        company=company,
        is_active=True
    )
    
    for webhook in webhooks:
        events = webhook.events or []
        if event_type in events or 'all' in events:
            delivery = WebhookDelivery.objects.create(
                webhook=webhook,
                event_type=event_type,
                payload=payload,
                status='pending'
            )
            
            # Send webhook (in production, this would be async via Celery)
            send_webhook.delay(str(delivery.id))


def send_webhook_sync(delivery_id):
    """Send webhook synchronously (for development)."""
    try:
        delivery = WebhookDelivery.objects.get(id=delivery_id)
        webhook = delivery.webhook
        
        headers = {
            'Content-Type': 'application/json',
            'X-Webhook-Event': delivery.event_type,
            'X-Webhook-Delivery-ID': str(delivery.id),
        }
        
        # Add custom headers
        if webhook.custom_headers:
            headers.update(webhook.custom_headers)
        
        # Add signature if secret is set
        if webhook.secret:
            import hmac
            import hashlib
            signature = hmac.new(
                webhook.secret.encode(),
                json.dumps(delivery.payload).encode(),
                hashlib.sha256
            ).hexdigest()
            headers['X-Webhook-Signature'] = f'sha256={signature}'
        
        response = requests.post(
            webhook.url,
            json=delivery.payload,
            headers=headers,
            timeout=30
        )
        
        delivery.response_status = response.status_code
        delivery.response_body = response.text[:5000]
        delivery.status = 'success' if response.ok else 'failed'
        delivery.delivered_at = timezone.now()
        delivery.attempt_count += 1
        delivery.save()
        
        # Update webhook status
        if response.ok:
            webhook.failure_count = 0
        else:
            webhook.failure_count += 1
        webhook.last_triggered = timezone.now()
        webhook.save(update_fields=['last_triggered', 'failure_count'])
        
    except Exception as e:
        delivery.status = 'failed'
        delivery.error_message = str(e)
        delivery.attempt_count += 1
        delivery.save()


# Celery task for async webhook delivery
try:
    from celery import shared_task
    
    @shared_task
    def send_webhook(delivery_id):
        send_webhook_sync(delivery_id)
except ImportError:
    # Celery not available, use sync
    send_webhook = send_webhook_sync


# ============================================================================
# Webhook Triggers
# ============================================================================

@receiver(post_save, sender=Task)
def task_webhook_trigger(sender, instance, created, **kwargs):
    """Trigger webhooks when tasks are created/updated."""
    if not instance.project or not instance.project.company:
        return
    
    event_type = 'task.created' if created else 'task.updated'
    
    # Check for completion
    if not created and instance.status == 'completed':
        event_type = 'task.completed'
    
    payload = {
        'event': event_type,
        'timestamp': timezone.now().isoformat(),
        'data': {
            'id': str(instance.pk),
            'title': instance.title,
            'status': instance.status,
            'priority': instance.priority,
            'project_id': str(instance.project_id),
            'assigned_to_id': str(instance.assigned_to_id) if instance.assigned_to_id else None,
            'progress_percentage': instance.progress_percentage,
            'deadline': instance.deadline.isoformat() if instance.deadline else None,
        }
    }
    
    trigger_webhooks(event_type, payload, instance.project.company)


@receiver(post_delete, sender=Task)
def task_deleted_webhook(sender, instance, **kwargs):
    """Trigger webhooks when tasks are deleted."""
    if not instance.project or not instance.project.company:
        return
    
    payload = {
        'event': 'task.deleted',
        'timestamp': timezone.now().isoformat(),
        'data': {
            'id': str(instance.pk),
            'title': instance.title,
            'project_id': str(instance.project_id),
        }
    }
    
    trigger_webhooks('task.deleted', payload, instance.project.company)


@receiver(post_save, sender=Project)
def project_webhook_trigger(sender, instance, created, **kwargs):
    """Trigger webhooks when projects are created/updated."""
    if not instance.company:
        return
    
    event_type = 'project.created' if created else 'project.updated'
    
    if not created and instance.status == 'completed':
        event_type = 'project.completed'
    
    payload = {
        'event': event_type,
        'timestamp': timezone.now().isoformat(),
        'data': {
            'id': str(instance.pk),
            'title': instance.title,
            'status': instance.status,
            'progress_percentage': instance.progress_percentage,
            'start_date': instance.start_date.isoformat() if instance.start_date else None,
            'end_date': instance.end_date.isoformat() if instance.end_date else None,
        }
    }
    
    trigger_webhooks(event_type, payload, instance.company)


@receiver(post_save, sender=ProgressUpdate)
def progress_webhook_trigger(sender, instance, created, **kwargs):
    """Trigger webhooks when progress updates are submitted."""
    if not created:
        return
    
    if not instance.task or not instance.task.project or not instance.task.project.company:
        return
    
    payload = {
        'event': 'progress.submitted',
        'timestamp': timezone.now().isoformat(),
        'data': {
            'id': str(instance.pk),
            'task_id': str(instance.task_id),
            'task_title': instance.task.title,
            'progress_percentage': instance.progress_percentage,
            'status': instance.status,
            'user_id': str(instance.user_id),
            'hours_worked': float(instance.hours_worked),
        }
    }
    
    trigger_webhooks('progress.submitted', payload, instance.task.project.company)
