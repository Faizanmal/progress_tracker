from celery import shared_task
from django.utils import timezone


@shared_task
def check_overdue_tasks():
    """Check for overdue tasks and notify managers."""
    from tasks.models import Task
    from users.models import Notification
    
    overdue_tasks = Task.objects.filter(
        deadline__lt=timezone.now(),
        status__in=['open', 'in_progress', 'blocked']
    )
    
    for task in overdue_tasks:
        # Notify assigned user
        if task.assigned_to:
            Notification.objects.get_or_create(
                user=task.assigned_to,
                notification_type='task_overdue',
                title=f'Task Overdue: {task.title}',
                defaults={
                    'message': f'Task "{task.title}" is overdue. Deadline was {task.deadline.strftime("%B %d, %Y")}',
                    'link': f'/tasks/{task.id}'
                }
            )
        
        # Notify manager
        if task.assigned_to and task.assigned_to.manager:
            Notification.objects.get_or_create(
                user=task.assigned_to.manager,
                notification_type='task_overdue',
                title=f'Team Task Overdue: {task.title}',
                defaults={
                    'message': f'{task.assigned_to.name}\'s task "{task.title}" is overdue',
                    'link': f'/tasks/{task.id}'
                }
            )


@shared_task
def notify_blocked_tasks():
    """Send notifications for blocked tasks to managers."""
    from tasks.models import Task
    from users.models import Notification
    
    blocked_tasks = Task.objects.filter(status='blocked')
    
    for task in blocked_tasks:
        if task.assigned_to and task.assigned_to.manager:
            # Check if notification already sent today
            today = timezone.now().date()
            existing = Notification.objects.filter(
                user=task.assigned_to.manager,
                notification_type='task_blocked',
                created_at__date=today,
                link=f'/tasks/{task.id}'
            ).exists()
            
            if not existing:
                Notification.objects.create(
                    user=task.assigned_to.manager,
                    notification_type='task_blocked',
                    title=f'Task Still Blocked: {task.title}',
                    message=f'{task.assigned_to.name}\'s task "{task.title}" is currently blocked',
                    link=f'/tasks/{task.id}'
                )


@shared_task
def send_task_deadline_reminder(task_id, days_before=2):
    """Send reminder for upcoming task deadline."""
    from tasks.models import Task
    from users.models import Notification
    
    try:
        task = Task.objects.get(id=task_id)
        
        if task.assigned_to and task.deadline:
            days_until = (task.deadline - timezone.now()).days
            
            if days_until <= days_before and days_until > 0:
                Notification.objects.create(
                    user=task.assigned_to,
                    notification_type='reminder',
                    title=f'Task Deadline Approaching: {task.title}',
                    message=f'Task "{task.title}" is due in {days_until} days',
                    link=f'/tasks/{task.id}'
                )
    except Task.DoesNotExist:
        pass
