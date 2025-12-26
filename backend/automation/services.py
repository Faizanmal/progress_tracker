"""
Workflow automation services.
Handles execution of workflow actions and triggers.
"""
import json
import requests
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from datetime import timedelta


class WorkflowActionExecutor:
    """Executes individual workflow actions."""
    
    def __init__(self, action, context, execution):
        self.action = action
        self.context = context
        self.execution = execution
    
    def execute(self):
        """Execute the action based on its type."""
        action_handlers = {
            'send_notification': self._send_notification,
            'send_email': self._send_email,
            'send_slack': self._send_slack,
            'send_teams': self._send_teams,
            'send_webhook': self._send_webhook,
            'update_task_status': self._update_task_status,
            'update_task_priority': self._update_task_priority,
            'assign_task': self._assign_task,
            'create_subtask': self._create_subtask,
            'add_comment': self._add_comment,
            'update_dependent_tasks': self._update_dependent_tasks,
            'recalculate_timeline': self._recalculate_timeline,
            'update_project_status': self._update_project_status,
            'escalate_to_manager': self._escalate_to_manager,
            'create_escalation': self._create_escalation,
            'sync_calendar': self._sync_calendar,
            'update_github_issue': self._update_github_issue,
        }
        
        handler = action_handlers.get(self.action.action_type)
        if handler:
            return handler()
        return False
    
    def _send_notification(self):
        """Send in-app notification."""
        from users.models import Notification
        
        config = self.action.config
        task = self.context.get('task')
        recipients = self._get_recipients(config)
        
        for user in recipients:
            Notification.objects.create(
                user=user,
                notification_type=config.get('notification_type', 'reminder'),
                title=self._render_template(config.get('title', 'Workflow Notification')),
                message=self._render_template(config.get('message', '')),
                link=config.get('link', f'/tasks/{task.id}' if task else ''),
                priority=config.get('priority', 'normal')
            )
        return True
    
    def _send_email(self):
        """Send email notification."""
        config = self.action.config
        recipients = self._get_recipients(config)
        
        subject = self._render_template(config.get('subject', 'Workflow Notification'))
        message = self._render_template(config.get('body', ''))
        
        for user in recipients:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True
            )
        return True
    
    def _send_slack(self):
        """Send Slack message."""
        from .models import ChatIntegration
        
        config = self.action.config
        task = self.context.get('task')
        
        if not task or not task.project.company:
            return False
        
        try:
            integration = ChatIntegration.objects.get(
                company=task.project.company,
                platform='slack',
                is_active=True
            )
        except ChatIntegration.DoesNotExist:
            return False
        
        channel = config.get('channel') or integration.default_channel_id
        message = self._render_template(config.get('message', ''))
        
        payload = {
            'channel': channel,
            'text': message,
            'attachments': [{
                'color': self._get_priority_color(task.priority),
                'title': task.title,
                'title_link': f"{settings.FRONTEND_URL}/tasks/{task.id}",
                'fields': [
                    {'title': 'Status', 'value': task.status, 'short': True},
                    {'title': 'Priority', 'value': task.priority, 'short': True},
                    {'title': 'Assigned To', 'value': task.assigned_to.name if task.assigned_to else 'Unassigned', 'short': True},
                ]
            }]
        }
        
        response = requests.post(
            'https://slack.com/api/chat.postMessage',
            headers={
                'Authorization': f'Bearer {integration.access_token}',
                'Content-Type': 'application/json'
            },
            json=payload
        )
        return response.ok
    
    def _send_teams(self):
        """Send Microsoft Teams message."""
        from .models import ChatIntegration
        
        config = self.action.config
        task = self.context.get('task')
        
        if not task or not task.project.company:
            return False
        
        try:
            integration = ChatIntegration.objects.get(
                company=task.project.company,
                platform='teams',
                is_active=True
            )
        except ChatIntegration.DoesNotExist:
            return False
        
        webhook_url = config.get('webhook_url') or integration.default_channel_id
        message = self._render_template(config.get('message', ''))
        
        payload = {
            '@type': 'MessageCard',
            '@context': 'http://schema.org/extensions',
            'themeColor': self._get_priority_color(task.priority).lstrip('#'),
            'summary': message,
            'sections': [{
                'activityTitle': task.title,
                'facts': [
                    {'name': 'Status', 'value': task.status},
                    {'name': 'Priority', 'value': task.priority},
                    {'name': 'Assigned To', 'value': task.assigned_to.name if task.assigned_to else 'Unassigned'},
                ],
                'text': message
            }],
            'potentialAction': [{
                '@type': 'OpenUri',
                'name': 'View Task',
                'targets': [{'os': 'default', 'uri': f"{settings.FRONTEND_URL}/tasks/{task.id}"}]
            }]
        }
        
        response = requests.post(webhook_url, json=payload)
        return response.ok
    
    def _send_webhook(self):
        """Send generic webhook."""
        config = self.action.config
        url = config.get('url')
        
        if not url:
            return False
        
        payload = {
            'event': self.action.workflow.trigger_type,
            'timestamp': timezone.now().isoformat(),
            'data': self._serialize_context()
        }
        
        headers = config.get('headers', {})
        headers['Content-Type'] = 'application/json'
        
        response = requests.post(url, json=payload, headers=headers)
        return response.ok
    
    def _update_task_status(self):
        """Update task status."""
        config = self.action.config
        task = self.context.get('task')
        
        if not task:
            return False
        
        new_status = config.get('status')
        if new_status:
            task.status = new_status
            if new_status == 'completed':
                task.completed_at = timezone.now()
            elif new_status == 'in_progress' and not task.started_at:
                task.started_at = timezone.now()
            task.save()
        return True
    
    def _update_task_priority(self):
        """Update task priority."""
        config = self.action.config
        task = self.context.get('task')
        
        if not task:
            return False
        
        new_priority = config.get('priority')
        if new_priority:
            task.priority = new_priority
            task.save()
        return True
    
    def _assign_task(self):
        """Assign task to user."""
        from users.models import User
        
        config = self.action.config
        task = self.context.get('task')
        
        if not task:
            return False
        
        assign_to_id = config.get('user_id')
        if assign_to_id:
            try:
                user = User.objects.get(id=assign_to_id)
                task.assigned_to = user
                task.save()
            except User.DoesNotExist:
                return False
        
        # Or assign to manager
        elif config.get('assign_to_manager') and task.created_by.manager:
            task.assigned_to = task.created_by.manager
            task.save()
        
        return True
    
    def _create_subtask(self):
        """Create a subtask."""
        from tasks.models import Task
        
        config = self.action.config
        parent_task = self.context.get('task')
        
        if not parent_task:
            return False
        
        Task.objects.create(
            title=self._render_template(config.get('title', 'Follow-up task')),
            description=self._render_template(config.get('description', '')),
            project=parent_task.project,
            assigned_to=parent_task.assigned_to,
            created_by=parent_task.created_by,
            priority=config.get('priority', parent_task.priority),
            tags=f"subtask,parent:{parent_task.id}"
        )
        return True
    
    def _add_comment(self):
        """Add comment to task."""
        from tasks.models import TaskComment
        
        config = self.action.config
        task = self.context.get('task')
        user = self.context.get('user')
        
        if not task:
            return False
        
        TaskComment.objects.create(
            task=task,
            user=user or task.created_by,
            text=self._render_template(config.get('comment', 'Automated comment from workflow'))
        )
        return True
    
    def _update_dependent_tasks(self):
        """Update dependent tasks status."""
        from .models import TaskDependency
        
        task = self.context.get('task')
        if not task:
            return False
        
        config = self.action.config
        new_status = config.get('status', 'open')
        
        # Find tasks that depend on this one
        dependencies = TaskDependency.objects.filter(
            predecessor=task,
            dependency_type='finish_to_start'
        )
        
        for dep in dependencies:
            successor = dep.successor
            if successor.status == 'blocked' or config.get('force_update'):
                successor.status = new_status
                if new_status == 'in_progress' and not successor.started_at:
                    successor.started_at = timezone.now()
                successor.save()
        
        return True
    
    def _recalculate_timeline(self):
        """Recalculate timeline for dependent tasks."""
        from .services import DependencyManager
        
        task = self.context.get('task')
        if not task:
            return False
        
        manager = DependencyManager(task.project)
        manager.recalculate_from_task(task)
        return True
    
    def _update_project_status(self):
        """Update project status."""
        config = self.action.config
        task = self.context.get('task')
        
        if not task or not task.project:
            return False
        
        new_status = config.get('status')
        if new_status:
            task.project.status = new_status
            task.project.save()
        return True
    
    def _escalate_to_manager(self):
        """Escalate to manager."""
        from users.models import Notification
        from .models import Escalation
        
        task = self.context.get('task')
        if not task or not task.assigned_to:
            return False
        
        manager = task.assigned_to.manager
        if not manager:
            # Try project manager
            manager = task.project.created_by
        
        if manager:
            config = self.action.config
            
            escalation = Escalation.objects.create(
                task=task,
                reason=self._render_template(config.get('reason', 'Task requires attention')),
                suggested_actions=config.get('suggested_actions', [])
            )
            escalation.escalated_to.add(manager)
            
            Notification.objects.create(
                user=manager,
                notification_type='task_blocked',
                title=f"Escalation: {task.title}",
                message=escalation.reason,
                link=f'/tasks/{task.id}',
                priority='high'
            )
        
        return True
    
    def _create_escalation(self):
        """Create escalation ticket."""
        from .models import Escalation
        
        task = self.context.get('task')
        if not task:
            return False
        
        config = self.action.config
        
        Escalation.objects.create(
            task=task,
            reason=self._render_template(config.get('reason', 'Automated escalation')),
            suggested_actions=config.get('suggested_actions', [])
        )
        return True
    
    def _sync_calendar(self):
        """Sync task to calendar."""
        from .models import CalendarEvent
        
        task = self.context.get('task')
        if not task or not task.deadline:
            return False
        
        config = self.action.config
        
        CalendarEvent.objects.update_or_create(
            task=task,
            event_type='task_deadline',
            defaults={
                'user': task.assigned_to or task.created_by,
                'title': f"Deadline: {task.title}",
                'description': task.description,
                'start_time': task.deadline - timedelta(hours=1),
                'end_time': task.deadline,
                'project': task.project
            }
        )
        return True
    
    def _update_github_issue(self):
        """Update linked GitHub issue."""
        from .models import GitRepository, GitEvent
        
        task = self.context.get('task')
        if not task:
            return False
        
        config = self.action.config
        
        # Find linked repository
        repos = GitRepository.objects.filter(project=task.project, sync_enabled=True)
        if not repos.exists():
            return False
        
        # This would require actual GitHub API integration
        # Placeholder for now
        return True
    
    def _get_recipients(self, config):
        """Get list of recipient users."""
        from users.models import User
        
        recipients = []
        task = self.context.get('task')
        
        if config.get('notify_assignee') and task and task.assigned_to:
            recipients.append(task.assigned_to)
        
        if config.get('notify_creator') and task:
            recipients.append(task.created_by)
        
        if config.get('notify_manager') and task and task.assigned_to and task.assigned_to.manager:
            recipients.append(task.assigned_to.manager)
        
        if config.get('notify_team') and task:
            recipients.extend(task.project.team_members.all())
        
        user_ids = config.get('user_ids', [])
        if user_ids:
            recipients.extend(User.objects.filter(id__in=user_ids))
        
        # Remove duplicates
        return list(set(recipients))
    
    def _render_template(self, template):
        """Render template with context variables."""
        if not template:
            return ''
        
        task = self.context.get('task')
        user = self.context.get('user')
        
        replacements = {
            '{{task_title}}': task.title if task else '',
            '{{task_status}}': task.status if task else '',
            '{{task_priority}}': task.priority if task else '',
            '{{task_deadline}}': str(task.deadline) if task and task.deadline else '',
            '{{assignee_name}}': task.assigned_to.name if task and task.assigned_to else 'Unassigned',
            '{{project_name}}': task.project.title if task else '',
            '{{user_name}}': user.name if user else '',
            '{{timestamp}}': timezone.now().strftime('%Y-%m-%d %H:%M'),
        }
        
        result = template
        for key, value in replacements.items():
            result = result.replace(key, str(value))
        
        return result
    
    def _get_priority_color(self, priority):
        """Get color code for priority."""
        colors = {
            'low': '#28a745',
            'medium': '#ffc107',
            'high': '#fd7e14',
            'urgent': '#dc3545',
        }
        return colors.get(priority, '#6c757d')
    
    def _serialize_context(self):
        """Serialize context for webhook."""
        task = self.context.get('task')
        user = self.context.get('user')
        
        data = {}
        
        if task:
            data['task'] = {
                'id': task.id,
                'title': task.title,
                'status': task.status,
                'priority': task.priority,
                'progress': task.progress_percentage,
                'assignee': task.assigned_to.name if task.assigned_to else None,
                'project': task.project.title,
            }
        
        if user:
            data['user'] = {
                'id': user.id,
                'name': user.name,
                'email': user.email,
            }
        
        return data


class WorkflowTriggerService:
    """Service to check and trigger workflows."""
    
    @staticmethod
    def trigger_task_status_change(task, old_status, new_status, user=None):
        """Trigger workflows for task status change."""
        from .models import Workflow
        
        workflows = Workflow.objects.filter(
            company=task.project.company,
            trigger_type='task_status_change',
            is_active=True
        ).filter(
            models.Q(project_filter__isnull=True) | models.Q(project_filter=task.project)
        )
        
        for workflow in workflows:
            trigger_config = workflow.trigger_config
            
            # Check if trigger matches
            from_status = trigger_config.get('from_status')
            to_status = trigger_config.get('to_status')
            
            if from_status and from_status != old_status:
                continue
            if to_status and to_status != new_status:
                continue
            
            # Execute workflow
            context = {
                'task': task,
                'user': user,
                'old_status': old_status,
                'new_status': new_status,
            }
            workflow.execute(context)
    
    @staticmethod
    def trigger_task_created(task, user=None):
        """Trigger workflows for task creation."""
        from .models import Workflow
        
        workflows = Workflow.objects.filter(
            company=task.project.company,
            trigger_type='task_created',
            is_active=True
        ).filter(
            models.Q(project_filter__isnull=True) | models.Q(project_filter=task.project)
        )
        
        for workflow in workflows:
            context = {
                'task': task,
                'user': user,
            }
            workflow.execute(context)
    
    @staticmethod
    def trigger_task_assigned(task, old_assignee, new_assignee, user=None):
        """Trigger workflows for task assignment."""
        from .models import Workflow
        
        workflows = Workflow.objects.filter(
            company=task.project.company,
            trigger_type='task_assigned',
            is_active=True
        ).filter(
            models.Q(project_filter__isnull=True) | models.Q(project_filter=task.project)
        )
        
        for workflow in workflows:
            context = {
                'task': task,
                'user': user,
                'old_assignee': old_assignee,
                'new_assignee': new_assignee,
            }
            workflow.execute(context)
    
    @staticmethod
    def trigger_task_overdue(task):
        """Trigger workflows for overdue tasks."""
        from .models import Workflow
        
        workflows = Workflow.objects.filter(
            company=task.project.company,
            trigger_type='task_overdue',
            is_active=True
        ).filter(
            models.Q(project_filter__isnull=True) | models.Q(project_filter=task.project)
        )
        
        for workflow in workflows:
            context = {
                'task': task,
            }
            workflow.execute(context)
    
    @staticmethod
    def trigger_progress_update(progress_update, user=None):
        """Trigger workflows for progress updates."""
        from .models import Workflow
        
        task = progress_update.task
        
        workflows = Workflow.objects.filter(
            company=task.project.company,
            trigger_type='progress_update',
            is_active=True
        ).filter(
            models.Q(project_filter__isnull=True) | models.Q(project_filter=task.project)
        )
        
        for workflow in workflows:
            context = {
                'task': task,
                'progress_update': progress_update,
                'user': user or progress_update.user,
            }
            workflow.execute(context)


class DependencyManager:
    """Manages task dependencies and timeline calculations."""
    
    def __init__(self, project):
        self.project = project
    
    def recalculate_from_task(self, task):
        """Recalculate timeline starting from a task."""
        from .models import TaskDependency
        from collections import deque
        
        # BFS to update all dependent tasks
        queue = deque([task])
        visited = set()
        
        while queue:
            current_task = queue.popleft()
            
            if current_task.id in visited:
                continue
            visited.add(current_task.id)
            
            # Get successor dependencies
            dependencies = TaskDependency.objects.filter(
                predecessor=current_task,
                auto_adjust_dates=True
            )
            
            for dep in dependencies:
                successor = dep.successor
                new_deadline = self._calculate_deadline(dep, current_task)
                
                if new_deadline and (not successor.deadline or new_deadline > successor.deadline):
                    successor.deadline = new_deadline
                    successor.save()
                
                queue.append(successor)
    
    def _calculate_deadline(self, dependency, predecessor):
        """Calculate deadline for successor based on dependency type."""
        from datetime import timedelta
        
        if dependency.dependency_type == 'finish_to_start':
            # Successor can't start until predecessor finishes
            base_date = predecessor.completed_at or predecessor.deadline
            if base_date:
                return base_date + timedelta(days=dependency.lag_days)
        
        elif dependency.dependency_type == 'start_to_start':
            # Successor can't start until predecessor starts
            base_date = predecessor.started_at or timezone.now()
            return base_date + timedelta(days=dependency.lag_days)
        
        elif dependency.dependency_type == 'finish_to_finish':
            # Successor can't finish until predecessor finishes
            base_date = predecessor.completed_at or predecessor.deadline
            if base_date:
                return base_date + timedelta(days=dependency.lag_days)
        
        return None
    
    def detect_bottlenecks(self):
        """Detect potential bottlenecks in the project."""
        from .models import TaskDependency, DependencyBottleneck
        from tasks.models import Task
        
        tasks = Task.objects.filter(
            project=self.project,
            status__in=['open', 'in_progress', 'blocked']
        )
        
        bottlenecks = []
        
        for task in tasks:
            # Count how many tasks depend on this one
            blocking_count = TaskDependency.objects.filter(predecessor=task).count()
            
            if blocking_count >= 2:  # Threshold for bottleneck
                # Calculate cascade delay
                cascade_delay = self._calculate_cascade_delay(task)
                
                # Determine severity
                if blocking_count >= 5 or cascade_delay >= 10:
                    severity = 'critical'
                elif blocking_count >= 3 or cascade_delay >= 5:
                    severity = 'high'
                elif blocking_count >= 2 or cascade_delay >= 2:
                    severity = 'medium'
                else:
                    severity = 'low'
                
                # Check for existing bottleneck
                bottleneck, created = DependencyBottleneck.objects.update_or_create(
                    task=task,
                    is_resolved=False,
                    defaults={
                        'severity': severity,
                        'blocking_count': blocking_count,
                        'cascade_delay_days': cascade_delay,
                        'delay_probability': self._calculate_delay_probability(task),
                        'suggested_actions': self._generate_bottleneck_suggestions(task, blocking_count),
                    }
                )
                bottlenecks.append(bottleneck)
        
        return bottlenecks
    
    def _calculate_cascade_delay(self, task):
        """Calculate potential cascade delay if task is late."""
        from .models import TaskDependency
        
        total_delay = 0
        visited = set()
        stack = [(task, 0)]
        
        while stack:
            current, depth = stack.pop()
            if current.id in visited:
                continue
            visited.add(current.id)
            
            deps = TaskDependency.objects.filter(predecessor=current)
            for dep in deps:
                total_delay += dep.lag_days + 1  # +1 for minimum transition time
                stack.append((dep.successor, depth + 1))
        
        return total_delay
    
    def _calculate_delay_probability(self, task):
        """Calculate probability of task causing delays."""
        probability = 0.0
        
        # Factor 1: Current progress vs expected
        if task.deadline:
            days_until_deadline = (task.deadline - timezone.now()).days
            if days_until_deadline <= 0:
                probability += 0.5  # Already overdue
            elif days_until_deadline <= 2:
                probability += 0.3  # Very close to deadline
            elif days_until_deadline <= 7:
                probability += 0.1
        
        # Factor 2: Task status
        if task.status == 'blocked':
            probability += 0.3
        elif task.status == 'open':
            probability += 0.1  # Not started
        
        # Factor 3: Progress percentage
        if task.progress_percentage < 50 and task.deadline:
            days_elapsed = (timezone.now() - task.created_at).days if task.created_at else 0
            if days_elapsed > 7:
                probability += 0.2
        
        return min(1.0, probability)
    
    def _generate_bottleneck_suggestions(self, task, blocking_count):
        """Generate AI suggestions for resolving bottleneck."""
        suggestions = []
        
        if task.status == 'blocked':
            suggestions.append({
                'action': 'resolve_blocker',
                'description': 'Resolve the blocker preventing progress on this task',
                'priority': 'high'
            })
        
        if not task.assigned_to:
            suggestions.append({
                'action': 'assign_task',
                'description': 'Assign this task to a team member',
                'priority': 'high'
            })
        
        if blocking_count >= 3:
            suggestions.append({
                'action': 'split_task',
                'description': 'Consider splitting this task to reduce dependencies',
                'priority': 'medium'
            })
            suggestions.append({
                'action': 'parallel_work',
                'description': 'Identify work that can be done in parallel',
                'priority': 'medium'
            })
        
        if task.priority != 'urgent':
            suggestions.append({
                'action': 'increase_priority',
                'description': f'Increase priority (currently {task.priority})',
                'priority': 'low'
            })
        
        return suggestions


# Import models for type hints
from django.db import models
