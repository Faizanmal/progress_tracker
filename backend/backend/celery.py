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
}

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
