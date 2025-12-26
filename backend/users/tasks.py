from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

User = get_user_model()


@shared_task
def send_daily_progress_reminders():
    """Send daily reminder to employees to update their progress."""
    from progress.models import ProgressUpdate
    
    employees = User.objects.filter(role='employee', is_active=True)
    yesterday = timezone.now() - timedelta(days=1)
    
    for employee in employees:
        # Check if employee has tasks but hasn't updated progress today
        has_tasks = employee.assigned_tasks.filter(
            status__in=['open', 'in_progress', 'blocked']
        ).exists()
        
        if has_tasks:
            recent_update = ProgressUpdate.objects.filter(
                user=employee,
                created_at__gte=yesterday
            ).exists()
            
            if not recent_update:
                send_progress_reminder_email.delay(employee.id)


@shared_task
def send_progress_reminder_email(user_id):
    """Send progress reminder email to a specific user."""
    try:
        user = User.objects.get(id=user_id)
        
        subject = "⏰ Time to Update Your Progress"
        message = f"""
        Hi {user.name},
        
        This is a friendly reminder to update your progress on your assigned tasks.
        
        Keeping your team informed helps everyone stay aligned and work together effectively.
        
        Update your progress: {settings.FRONTEND_URL}/dashboard
        
        Best regards,
        Progress Tracker Team
        """
        
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
    except User.DoesNotExist:
        pass


@shared_task
def send_task_assignment_email(user_id, task_id):
    """Send email when a task is assigned to a user."""
    try:
        user = User.objects.get(id=user_id)
        from tasks.models import Task
        task = Task.objects.get(id=task_id)
        
        subject = f"📋 New Task Assigned: {task.title}"
        message = f"""
        Hi {user.name},
        
        You have been assigned a new task:
        
        Task: {task.title}
        Project: {task.project.title}
        Priority: {task.get_priority_display()}
        Deadline: {task.deadline.strftime('%B %d, %Y') if task.deadline else 'Not set'}
        
        Description:
        {task.description}
        
        View task details: {settings.FRONTEND_URL}/tasks/{task.id}
        
        Best regards,
        Progress Tracker Team
        """
        
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
    except (User.DoesNotExist, Task.DoesNotExist):
        pass


@shared_task
def send_notification_email(notification_id):
    """Send email for a notification."""
    try:
        from users.models import Notification
        notification = Notification.objects.get(id=notification_id)
        
        send_mail(
            notification.title,
            notification.message,
            settings.DEFAULT_FROM_EMAIL,
            [notification.user.email],
            fail_silently=False,
        )
    except Notification.DoesNotExist:
        pass
