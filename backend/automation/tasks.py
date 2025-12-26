"""
Celery tasks for automation.
"""
from celery import shared_task
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from datetime import timedelta


@shared_task
def check_overdue_and_escalate():
    """Check for overdue tasks and trigger escalations."""
    from .models import EscalationRule, Escalation
    from tasks.models import Task
    from users.models import Notification
    
    # Get all active escalation rules
    rules = EscalationRule.objects.filter(
        is_active=True,
        trigger_type='overdue'
    )
    
    for rule in rules:
        # Find matching overdue tasks
        tasks = Task.objects.filter(
            project__company=rule.company,
            deadline__lt=timezone.now() - timedelta(hours=rule.trigger_after_hours),
            status__in=['open', 'in_progress', 'blocked']
        )
        
        if rule.priority_filter:
            tasks = tasks.filter(priority=rule.priority_filter)
        
        if rule.project_filter:
            tasks = tasks.filter(project=rule.project_filter)
        
        for task in tasks:
            # Check if already escalated
            existing = Escalation.objects.filter(
                task=task,
                rule=rule,
                status__in=['pending', 'acknowledged', 'in_progress']
            ).exists()
            
            if not existing:
                # Create escalation
                escalation = Escalation.objects.create(
                    task=task,
                    rule=rule,
                    reason=f"Task '{task.title}' has been overdue for over {rule.trigger_after_hours} hours.",
                    suggested_actions=[
                        {'action': 'extend_deadline', 'description': 'Extend the deadline if needed'},
                        {'action': 'reassign', 'description': 'Consider reassigning to another team member'},
                        {'action': 'break_down', 'description': 'Break the task into smaller subtasks'},
                    ]
                )
                
                # Determine escalation recipients
                recipients = list(rule.escalate_to_users.all())
                
                if rule.escalate_to_manager and task.assigned_to and task.assigned_to.manager:
                    recipients.append(task.assigned_to.manager)
                
                for recipient in recipients:
                    escalation.escalated_to.add(recipient)
                    
                    # Send notification
                    if rule.send_notification:
                        Notification.objects.create(
                            user=recipient,
                            notification_type='task_overdue',
                            title=f'Escalation: {task.title}',
                            message=escalation.reason,
                            link=f'/tasks/{task.id}',
                            priority='high'
                        )
                    
                    # Send email
                    if rule.send_email:
                        send_escalation_email.delay(recipient.id, escalation.id)


@shared_task
def send_escalation_email(user_id, escalation_id):
    """Send escalation email."""
    from users.models import User
    from .models import Escalation
    
    try:
        user = User.objects.get(id=user_id)
        escalation = Escalation.objects.get(id=escalation_id)
    except (User.DoesNotExist, Escalation.DoesNotExist):
        return
    
    subject = f"🚨 Escalation: {escalation.task.title}"
    message = f"""
    Hello {user.name},
    
    An escalation has been triggered for the following task:
    
    Task: {escalation.task.title}
    Status: {escalation.task.status}
    Priority: {escalation.task.priority}
    Assigned To: {escalation.task.assigned_to.name if escalation.task.assigned_to else 'Unassigned'}
    
    Reason:
    {escalation.reason}
    
    Suggested Actions:
    {chr(10).join([f"- {a['description']}" for a in escalation.suggested_actions])}
    
    View the task: {settings.FRONTEND_URL}/tasks/{escalation.task.id}
    
    Best regards,
    Progress Tracker
    """
    
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=True
    )


@shared_task
def check_blocked_and_escalate():
    """Check for blocked tasks and trigger escalations."""
    from .models import EscalationRule, Escalation
    from tasks.models import Task
    from users.models import Notification
    
    rules = EscalationRule.objects.filter(
        is_active=True,
        trigger_type='blocked'
    )
    
    for rule in rules:
        # Find blocked tasks
        tasks = Task.objects.filter(
            project__company=rule.company,
            status='blocked',
            updated_at__lt=timezone.now() - timedelta(hours=rule.trigger_after_hours)
        )
        
        if rule.priority_filter:
            tasks = tasks.filter(priority=rule.priority_filter)
        
        for task in tasks:
            existing = Escalation.objects.filter(
                task=task,
                rule=rule,
                status__in=['pending', 'acknowledged', 'in_progress']
            ).exists()
            
            if not existing:
                escalation = Escalation.objects.create(
                    task=task,
                    rule=rule,
                    reason=f"Task '{task.title}' has been blocked for over {rule.trigger_after_hours} hours.",
                    suggested_actions=[
                        {'action': 'identify_blocker', 'description': 'Identify and address the blocking issue'},
                        {'action': 'escalate_further', 'description': 'Escalate to department head if needed'},
                        {'action': 'workaround', 'description': 'Find a workaround or alternative approach'},
                    ]
                )
                
                recipients = list(rule.escalate_to_users.all())
                if rule.escalate_to_manager and task.assigned_to and task.assigned_to.manager:
                    recipients.append(task.assigned_to.manager)
                
                for recipient in recipients:
                    escalation.escalated_to.add(recipient)
                    
                    if rule.send_notification:
                        Notification.objects.create(
                            user=recipient,
                            notification_type='task_blocked',
                            title=f'Blocked Task Escalation: {task.title}',
                            message=escalation.reason,
                            link=f'/tasks/{task.id}',
                            priority='high'
                        )


@shared_task
def detect_bottlenecks():
    """Detect bottlenecks in all active projects."""
    from .services import DependencyManager
    from projects.models import Project
    
    active_projects = Project.objects.filter(status='active')
    
    for project in active_projects:
        manager = DependencyManager(project)
        manager.detect_bottlenecks()


@shared_task
def analyze_team_burnout():
    """Analyze burnout risk for all active users."""
    from .ai_services import BurnoutDetectionService
    from users.models import User
    
    users = User.objects.filter(is_active=True)
    
    for user in users:
        service = BurnoutDetectionService(user)
        service.analyze_burnout_risk(days=14)


@shared_task
def capture_workload_snapshots():
    """Capture daily workload snapshots for all users."""
    from .models import WorkloadSnapshot
    from tasks.models import Task
    from progress.models import ProgressUpdate
    from analytics.models import TimeEntry
    from users.models import User
    
    today = timezone.now().date()
    users = User.objects.filter(is_active=True)
    
    for user in users:
        # Check if already captured today
        if WorkloadSnapshot.objects.filter(user=user, date=today).exists():
            continue
        
        # Gather metrics
        tasks = Task.objects.filter(assigned_to=user)
        
        active = tasks.filter(status__in=['open', 'in_progress']).count()
        completed = tasks.filter(
            status='completed',
            completed_at__date=today
        ).count()
        overdue = tasks.filter(
            deadline__lt=timezone.now(),
            status__in=['open', 'in_progress', 'blocked']
        ).count()
        blocked = tasks.filter(status='blocked').count()
        
        # Time entries today
        time_entries = TimeEntry.objects.filter(
            user=user,
            start_time__date=today
        )
        total_minutes = sum(t.duration_minutes for t in time_entries)
        hours_worked = total_minutes / 60
        overtime = max(0, hours_worked - 8)
        
        # Progress updates today
        updates = ProgressUpdate.objects.filter(
            user=user,
            created_at__date=today
        )
        
        WorkloadSnapshot.objects.create(
            user=user,
            date=today,
            active_tasks=active,
            completed_tasks=completed,
            overdue_tasks=overdue,
            blocked_tasks=blocked,
            hours_worked=hours_worked,
            overtime_hours=overtime,
            progress_updates=updates.count()
        )


@shared_task
def process_git_event(repo_id, event_type, event_data):
    """Process a Git webhook event."""
    from .models import GitRepository, GitEvent
    from tasks.models import Task
    from progress.models import ProgressUpdate
    import re
    
    try:
        repo = GitRepository.objects.get(id=repo_id)
    except GitRepository.DoesNotExist:
        return
    
    # Process based on event type
    if event_type == 'push':
        # Extract commit messages
        commits = event_data.get('commits', [])
        for commit in commits:
            message = commit.get('message', '')
            
            # Look for task references (e.g., #123, TASK-123)
            task_refs = re.findall(r'#(\d+)|TASK-(\d+)', message)
            
            for ref in task_refs:
                task_id = ref[0] or ref[1]
                try:
                    task = Task.objects.get(
                        id=task_id,
                        project=repo.project
                    )
                    
                    # Create progress update for the task
                    ProgressUpdate.objects.create(
                        task=task,
                        user=task.assigned_to or task.created_by,
                        work_done=f"Commit: {message[:200]}",
                        links=commit.get('url', '')
                    )
                    
                    # Link the event to the task
                    GitEvent.objects.filter(
                        repository=repo,
                        event_id=commit.get('id', '')
                    ).update(linked_task=task, is_processed=True)
                    
                except Task.DoesNotExist:
                    pass
    
    elif event_type == 'pull_request':
        pr = event_data.get('pull_request', {})
        action = event_data.get('action', '')
        title = pr.get('title', '')
        
        # Look for task references in PR title
        task_refs = re.findall(r'#(\d+)|TASK-(\d+)', title)
        
        for ref in task_refs:
            task_id = ref[0] or ref[1]
            try:
                task = Task.objects.get(
                    id=task_id,
                    project=repo.project
                )
                
                if action == 'closed' and pr.get('merged'):
                    # PR was merged, update task status
                    task.status = 'review' if task.status != 'completed' else 'completed'
                    task.save()
                
                ProgressUpdate.objects.create(
                    task=task,
                    user=task.assigned_to or task.created_by,
                    work_done=f"PR {action}: {title[:200]}",
                    links=pr.get('html_url', '')
                )
                
            except Task.DoesNotExist:
                pass


@shared_task
def send_daily_standup_messages():
    """Send daily standup summaries to chat integrations."""
    from .models import ChatIntegration
    from tasks.models import Task
    from users.models import User
    import requests
    
    integrations = ChatIntegration.objects.filter(
        is_active=True,
        notify_daily_standup=True
    )
    
    for integration in integrations:
        # Get company users and their tasks
        users = User.objects.filter(company=integration.company, is_active=True)
        
        summary_lines = ["📊 *Daily Standup Summary*\n"]
        
        for user in users[:20]:  # Limit to prevent huge messages
            active = Task.objects.filter(
                assigned_to=user,
                status='in_progress'
            ).count()
            
            completed_yesterday = Task.objects.filter(
                assigned_to=user,
                status='completed',
                completed_at__date=timezone.now().date() - timedelta(days=1)
            ).count()
            
            if active > 0 or completed_yesterday > 0:
                summary_lines.append(
                    f"• *{user.name}*: {active} active, {completed_yesterday} completed yesterday"
                )
        
        message = "\n".join(summary_lines)
        
        # Send to platform
        if integration.platform == 'slack':
            requests.post(
                'https://slack.com/api/chat.postMessage',
                headers={
                    'Authorization': f'Bearer {integration.access_token}',
                    'Content-Type': 'application/json'
                },
                json={
                    'channel': integration.default_channel_id,
                    'text': message
                }
            )


@shared_task
def generate_resource_suggestions():
    """Generate resource allocation suggestions for all companies."""
    from .ai_services import ResourceAllocationService
    from users.models import Company
    
    companies = Company.objects.filter(subscription_active=True)
    
    for company in companies:
        service = ResourceAllocationService(company)
        service.generate_suggestions()


@shared_task
def sync_calendar_events():
    """Sync calendar events with external calendars."""
    from users.models import CalendarIntegration
    from .models import CalendarEvent
    import requests
    
    integrations = CalendarIntegration.objects.filter(
        is_active=True,
        sync_tasks=True
    )
    
    for integration in integrations:
        if integration.calendar_type == 'google':
            # Sync with Google Calendar
            events = CalendarEvent.objects.filter(
                user=integration.user,
                is_synced=False
            )
            
            for event in events:
                # In production, this would use Google Calendar API
                # Here we just mark as synced
                event.is_synced = True
                event.last_synced = timezone.now()
                event.save()


@shared_task
def check_deadline_approaching():
    """Check for approaching deadlines and trigger workflows."""
    from .models import Workflow
    from .services import WorkflowTriggerService
    from tasks.models import Task
    
    # Find tasks with deadlines in the next 24 hours
    upcoming_deadline = timezone.now() + timedelta(hours=24)
    
    tasks = Task.objects.filter(
        deadline__lte=upcoming_deadline,
        deadline__gt=timezone.now(),
        status__in=['open', 'in_progress']
    )
    
    for task in tasks:
        # Get workflows for this trigger
        workflows = Workflow.objects.filter(
            company=task.project.company,
            trigger_type='deadline_approaching',
            is_active=True
        )
        
        for workflow in workflows:
            hours_until = (task.deadline - timezone.now()).total_seconds() / 3600
            config = workflow.trigger_config
            
            trigger_hours = config.get('hours_before', 24)
            
            if hours_until <= trigger_hours:
                context = {
                    'task': task,
                    'hours_until_deadline': hours_until
                }
                workflow.execute(context)


@shared_task
def run_scheduled_workflows():
    """Run workflows with schedule triggers."""
    from .models import Workflow
    
    workflows = Workflow.objects.filter(
        trigger_type='schedule',
        is_active=True
    )
    
    for workflow in workflows:
        config = workflow.trigger_config
        
        # Check if it's time to run
        schedule_hour = config.get('hour', 9)
        schedule_minute = config.get('minute', 0)
        schedule_days = config.get('days', [0, 1, 2, 3, 4])  # Weekdays by default
        
        now = timezone.now()
        
        if now.weekday() in schedule_days:
            if now.hour == schedule_hour and now.minute == schedule_minute:
                workflow.execute({'scheduled': True})
