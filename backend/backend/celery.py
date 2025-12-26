import os
from celery import Celery
from celery.schedules import crontab

# Set default Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

app = Celery('backend')

# Load configuration from Django settings
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks from all installed apps
app.autodiscover_tasks()

# Celery Beat schedule for periodic tasks
app.conf.beat_schedule = {
    # Send daily progress reminders at 9 AM
    'send-daily-reminders': {
        'task': 'users.tasks.send_daily_progress_reminders',
        'schedule': crontab(hour=9, minute=0),
    },
    # Send weekly summary every Monday at 8 AM
    'send-weekly-summary': {
        'task': 'progress.tasks.send_weekly_progress_summary',
        'schedule': crontab(hour=8, minute=0, day_of_week=1),
    },
    # Check for overdue tasks daily at 10 AM
    'check-overdue-tasks': {
        'task': 'tasks.tasks.check_overdue_tasks',
        'schedule': crontab(hour=10, minute=0),
    },
    # Send blocker notifications every 2 hours
    'notify-blocked-tasks': {
        'task': 'tasks.tasks.notify_blocked_tasks',
        'schedule': crontab(minute=0, hour='*/2'),
    },
    
    # ========== NEW AUTOMATION TASKS ==========
    
    # Check overdue tasks and trigger escalations every hour
    'check-overdue-escalations': {
        'task': 'automation.tasks.check_overdue_and_escalate',
        'schedule': crontab(minute=0),  # Every hour
    },
    # Check blocked tasks and escalate every 2 hours
    'check-blocked-escalations': {
        'task': 'automation.tasks.check_blocked_and_escalate',
        'schedule': crontab(minute=30, hour='*/2'),
    },
    # Detect bottlenecks daily at 8 AM
    'detect-bottlenecks': {
        'task': 'automation.tasks.detect_bottlenecks',
        'schedule': crontab(hour=8, minute=0),
    },
    # Analyze burnout risk weekly on Monday
    'analyze-burnout': {
        'task': 'automation.tasks.analyze_team_burnout',
        'schedule': crontab(hour=6, minute=0, day_of_week=1),
    },
    # Capture workload snapshots daily at midnight
    'capture-workload-snapshots': {
        'task': 'automation.tasks.capture_workload_snapshots',
        'schedule': crontab(hour=0, minute=5),
    },
    # Generate resource suggestions daily
    'generate-resource-suggestions': {
        'task': 'automation.tasks.generate_resource_suggestions',
        'schedule': crontab(hour=7, minute=0),
    },
    # Send daily standup messages at 9 AM
    'daily-standup-messages': {
        'task': 'automation.tasks.send_daily_standup_messages',
        'schedule': crontab(hour=9, minute=0),
    },
    # Check approaching deadlines every 4 hours
    'check-deadline-approaching': {
        'task': 'automation.tasks.check_deadline_approaching',
        'schedule': crontab(minute=0, hour='*/4'),
    },
    # Run scheduled workflows every minute
    'run-scheduled-workflows': {
        'task': 'automation.tasks.run_scheduled_workflows',
        'schedule': crontab(minute='*'),
    },
    # Sync calendar events every 15 minutes
    'sync-calendar-events': {
        'task': 'automation.tasks.sync_calendar_events',
        'schedule': crontab(minute='*/15'),
    },
}

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
