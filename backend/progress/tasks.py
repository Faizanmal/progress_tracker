from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models import Avg, Sum, Count
from datetime import timedelta

User = get_user_model()


@shared_task
def send_weekly_progress_summary():
    """Send weekly progress summary to managers."""
    from progress.models import ProgressUpdate
    from tasks.models import Task
    
    managers = User.objects.filter(role__in=['manager', 'admin'], is_active=True)
    week_ago = timezone.now() - timedelta(days=7)
    
    for manager in managers:
        send_manager_weekly_summary.delay(manager.id)


@shared_task
def send_manager_weekly_summary(manager_id):
    """Send weekly summary email to a specific manager."""
    from progress.models import ProgressUpdate
    from tasks.models import Task
    
    try:
        manager = User.objects.get(id=manager_id)
        week_ago = timezone.now() - timedelta(days=7)
        
        # Get team members
        if manager.is_admin:
            team_members = manager.company.users.all()
        else:
            team_members = manager.team_members.all()
        
        if not team_members.exists():
            return
        
        # Calculate statistics
        total_tasks = Task.objects.filter(assigned_to__in=team_members).count()
        completed_this_week = Task.objects.filter(
            assigned_to__in=team_members,
            completed_at__gte=week_ago
        ).count()
        
        updates_this_week = ProgressUpdate.objects.filter(
            user__in=team_members,
            created_at__gte=week_ago
        )
        
        total_hours = updates_this_week.aggregate(Sum('hours_worked'))['hours_worked__sum'] or 0
        avg_progress = Task.objects.filter(
            assigned_to__in=team_members
        ).aggregate(Avg('progress_percentage'))['progress_percentage__avg'] or 0
        
        blocked_tasks = Task.objects.filter(
            assigned_to__in=team_members,
            status='blocked'
        ).count()
        
        # Build email
        subject = f"📊 Weekly Progress Summary - {timezone.now().strftime('%B %d, %Y')}"
        message = f"""
        Hi {manager.name},
        
        Here's your team's progress summary for the past week:
        
        📈 OVERVIEW
        -----------
        Total Active Tasks: {total_tasks}
        Completed This Week: {completed_this_week}
        Average Progress: {avg_progress:.1f}%
        Total Hours Logged: {total_hours:.1f}
        
        ⚠️ ATTENTION NEEDED
        -------------------
        Blocked Tasks: {blocked_tasks}
        
        🎯 TEAM ACTIVITY
        ----------------
        Progress Updates: {updates_this_week.count()}
        
        """
        
        # Add individual team member summaries
        message += "\n👥 TEAM MEMBER DETAILS\n" + "-" * 21 + "\n\n"
        
        for member in team_members:
            member_tasks = Task.objects.filter(assigned_to=member)
            member_updates = updates_this_week.filter(user=member)
            
            message += f"{member.name}:\n"
            message += f"  - Tasks: {member_tasks.count()} (Active), "
            message += f"{member_tasks.filter(status='completed').count()} (Completed)\n"
            message += f"  - Updates: {member_updates.count()}\n"
            message += f"  - Hours: {member_updates.aggregate(Sum('hours_worked'))['hours_worked__sum'] or 0:.1f}\n\n"
        
        message += f"\nView full dashboard: {settings.FRONTEND_URL}/dashboard\n\n"
        message += "Best regards,\nProgress Tracker Team"
        
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [manager.email],
            fail_silently=False,
        )
    except User.DoesNotExist:
        pass


@shared_task
def send_progress_update_notification(progress_update_id):
    """Send notification when employee submits progress update."""
    from progress.models import ProgressUpdate
    from users.models import Notification
    
    try:
        update = ProgressUpdate.objects.get(id=progress_update_id)
        
        # Notify manager
        if update.user.manager:
            Notification.objects.create(
                user=update.user.manager,
                notification_type='progress_update',
                title=f'Progress Update: {update.task.title}',
                message=f'{update.user.name} updated progress to {update.progress_percentage}%',
                link=f'/tasks/{update.task.id}'
            )
    except ProgressUpdate.DoesNotExist:
        pass
