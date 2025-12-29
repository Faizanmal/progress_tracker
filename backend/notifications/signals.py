"""
Signals for notification rule evaluation.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

from tasks.models import Task
from progress.models import ProgressUpdate

from .models import NotificationRule, NotificationDelivery


def evaluate_rules_for_trigger(trigger_type, context):
    """
    Evaluate all active notification rules for a given trigger.
    """
    rules = NotificationRule.objects.filter(
        trigger_type=trigger_type,
        is_active=True
    )
    
    for rule in rules:
        if not rule.can_trigger():
            continue
        
        # Check conditions
        if should_trigger(rule, context):
            send_notification(rule, context)


def should_trigger(rule, context):
    """
    Check if rule conditions are met.
    """
    conditions = rule.conditions
    trigger_type = rule.trigger_type
    
    if trigger_type == 'task_overdue_days':
        days_threshold = conditions.get('days', 2)
        task = context.get('task')
        if task and task.deadline:
            days_overdue = (timezone.now() - task.deadline).days
            return days_overdue >= days_threshold
    
    elif trigger_type == 'progress_below_threshold':
        threshold = conditions.get('threshold', 50)
        progress = context.get('progress_percentage', 0)
        return progress < threshold
    
    elif trigger_type == 'budget_threshold':
        threshold = conditions.get('threshold', 80)
        budget_percentage = context.get('budget_percentage', 0)
        return budget_percentage >= threshold
    
    # Default: trigger if type matches
    return True


def send_notification(rule, context):
    """
    Create and send notification based on rule configuration.
    """
    recipients = get_recipients(rule, context)
    
    for recipient in recipients:
        for channel in rule.channels:
            # Create delivery record
            delivery = NotificationDelivery.objects.create(
                rule=rule,
                recipient=recipient,
                channel=channel,
                title=format_message(rule.name, context),
                message=format_message(rule.message_template or rule.name, context),
                related_object_type=context.get('object_type', ''),
                related_object_id=str(context.get('object_id', '')),
                action_url=context.get('action_url', ''),
            )
            
            # Send through channel
            try:
                if channel == 'in_app':
                    send_in_app(delivery)
                elif channel == 'email':
                    send_email(delivery)
                elif channel == 'push':
                    send_push(delivery)
                elif channel == 'sms':
                    send_sms(delivery)
                
                delivery.status = 'sent'
                delivery.sent_at = timezone.now()
            except Exception as e:
                delivery.status = 'failed'
                delivery.error_message = str(e)
            
            delivery.save()
    
    # Update rule
    rule.last_triggered = timezone.now()
    rule.trigger_count += 1
    rule.save(update_fields=['last_triggered', 'trigger_count'])


def get_recipients(rule, context):
    """Get list of recipients based on rule configuration."""
    from users.models import User
    
    recipients = []
    
    if rule.notify_self:
        recipients.append(rule.user)
    
    if rule.notify_assignee and context.get('assignee'):
        recipients.append(context['assignee'])
    
    if rule.notify_manager and rule.user.manager:
        recipients.append(rule.user.manager)
    
    if rule.notify_team and context.get('team_members'):
        recipients.extend(context['team_members'])
    
    for user_id in rule.additional_recipients:
        try:
            user = User.objects.get(pk=user_id)
            recipients.append(user)
        except User.DoesNotExist:
            pass
    
    # Deduplicate
    return list(set(recipients))


def format_message(template, context):
    """Format message template with context values."""
    message = template
    
    for key, value in context.items():
        if hasattr(value, 'title'):
            message = message.replace(f'{{{{{key}.title}}}}', value.title)
        if hasattr(value, 'name'):
            message = message.replace(f'{{{{{key}.name}}}}', value.name)
        message = message.replace(f'{{{{{key}}}}}', str(value))
    
    return message


def send_in_app(delivery):
    """Create in-app notification."""
    from users.models import Notification
    
    Notification.objects.create(
        user=delivery.recipient,
        notification_type='reminder',
        title=delivery.title,
        message=delivery.message,
        link=delivery.action_url,
    )


def send_email(delivery):
    """Send email notification."""
    from django.core.mail import send_mail
    from django.conf import settings
    
    send_mail(
        subject=delivery.title,
        message=delivery.message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[delivery.recipient.email],
        fail_silently=False,
    )


def send_push(delivery):
    """Send push notification."""
    # Implementation depends on push service
    pass


def send_sms(delivery):
    """Send SMS notification."""
    # Implementation depends on SMS provider
    pass


# ============================================================================
# Signal Handlers
# ============================================================================

@receiver(post_save, sender=Task)
def task_saved_notification(sender, instance, created, **kwargs):
    """Evaluate notification rules when task is saved."""
    context = {
        'task': instance,
        'object_type': 'task',
        'object_id': instance.pk,
        'assignee': instance.assigned_to,
        'action_url': f'/tasks/{instance.pk}/',
    }
    
    if created:
        evaluate_rules_for_trigger('task_assigned', context)
    else:
        # Check for status change
        if instance.status == 'blocked':
            evaluate_rules_for_trigger('task_blocked', context)
        elif instance.status == 'completed':
            evaluate_rules_for_trigger('task_completed', context)
        
        # Check for overdue
        if instance.is_overdue:
            evaluate_rules_for_trigger('task_overdue', context)


@receiver(post_save, sender=ProgressUpdate)
def progress_saved_notification(sender, instance, created, **kwargs):
    """Evaluate notification rules when progress is submitted."""
    if created:
        context = {
            'progress': instance,
            'task': instance.task,
            'object_type': 'progress_update',
            'object_id': instance.pk,
            'progress_percentage': instance.progress_percentage,
            'action_url': f'/progress/{instance.pk}/',
        }
        evaluate_rules_for_trigger('progress_submitted', context)
