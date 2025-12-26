"""
WebSocket consumers for real-time collaboration.
"""
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone


class TaskConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time task updates.
    Enables live editing and instant notifications.
    """
    
    async def connect(self):
        """Handle WebSocket connection."""
        self.user = self.scope.get('user')
        
        if not self.user or not self.user.is_authenticated:
            await self.close()
            return
        
        # Join user-specific group
        self.user_group = f'user_{self.user.id}'
        await self.channel_layer.group_add(
            self.user_group,
            self.channel_name
        )
        
        # Join company-wide group for broadcasts
        if hasattr(self.user, 'company') and self.user.company:
            self.company_group = f'company_{self.user.company.id}'
            await self.channel_layer.group_add(
                self.company_group,
                self.channel_name
            )
        
        await self.accept()
        
        # Send connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'user_id': self.user.id,
            'timestamp': timezone.now().isoformat()
        }))
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection."""
        if hasattr(self, 'user_group'):
            await self.channel_layer.group_discard(
                self.user_group,
                self.channel_name
            )
        
        if hasattr(self, 'company_group'):
            await self.channel_layer.group_discard(
                self.company_group,
                self.channel_name
            )
        
        # Leave any task-specific rooms
        if hasattr(self, 'task_group'):
            await self.channel_layer.group_discard(
                self.task_group,
                self.channel_name
            )
    
    async def receive(self, text_data):
        """Handle incoming WebSocket messages."""
        try:
            data = json.loads(text_data)
            action = data.get('action')
            
            handlers = {
                'join_task': self.handle_join_task,
                'leave_task': self.handle_leave_task,
                'task_update': self.handle_task_update,
                'typing': self.handle_typing,
                'cursor_position': self.handle_cursor_position,
                'comment': self.handle_comment,
                'presence': self.handle_presence,
            }
            
            handler = handlers.get(action)
            if handler:
                await handler(data)
            else:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': f'Unknown action: {action}'
                }))
        
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON'
            }))
    
    async def handle_join_task(self, data):
        """Join a task-specific room for collaborative editing."""
        task_id = data.get('task_id')
        
        if not task_id:
            return
        
        # Verify access to task
        has_access = await self.verify_task_access(task_id)
        if not has_access:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Access denied'
            }))
            return
        
        self.task_group = f'task_{task_id}'
        await self.channel_layer.group_add(
            self.task_group,
            self.channel_name
        )
        
        # Notify others in the room
        await self.channel_layer.group_send(
            self.task_group,
            {
                'type': 'user_joined',
                'user_id': self.user.id,
                'user_name': self.user.name,
                'task_id': task_id,
                'timestamp': timezone.now().isoformat()
            }
        )
    
    async def handle_leave_task(self, data):
        """Leave a task-specific room."""
        task_id = data.get('task_id')
        
        if hasattr(self, 'task_group'):
            await self.channel_layer.group_send(
                self.task_group,
                {
                    'type': 'user_left',
                    'user_id': self.user.id,
                    'user_name': self.user.name,
                    'task_id': task_id,
                    'timestamp': timezone.now().isoformat()
                }
            )
            
            await self.channel_layer.group_discard(
                self.task_group,
                self.channel_name
            )
    
    async def handle_task_update(self, data):
        """Handle task field update from a user."""
        task_id = data.get('task_id')
        field = data.get('field')
        value = data.get('value')
        
        if not all([task_id, field]):
            return
        
        # Save the update
        success = await self.update_task_field(task_id, field, value)
        
        if success and hasattr(self, 'task_group'):
            # Broadcast to all users viewing this task
            await self.channel_layer.group_send(
                self.task_group,
                {
                    'type': 'task_field_updated',
                    'task_id': task_id,
                    'field': field,
                    'value': value,
                    'updated_by': self.user.id,
                    'updated_by_name': self.user.name,
                    'timestamp': timezone.now().isoformat()
                }
            )
    
    async def handle_typing(self, data):
        """Handle typing indicator."""
        task_id = data.get('task_id')
        field = data.get('field')
        is_typing = data.get('is_typing', True)
        
        if hasattr(self, 'task_group'):
            await self.channel_layer.group_send(
                self.task_group,
                {
                    'type': 'user_typing',
                    'task_id': task_id,
                    'field': field,
                    'is_typing': is_typing,
                    'user_id': self.user.id,
                    'user_name': self.user.name
                }
            )
    
    async def handle_cursor_position(self, data):
        """Handle cursor position for collaborative editing."""
        task_id = data.get('task_id')
        field = data.get('field')
        position = data.get('position')
        
        if hasattr(self, 'task_group'):
            await self.channel_layer.group_send(
                self.task_group,
                {
                    'type': 'cursor_moved',
                    'task_id': task_id,
                    'field': field,
                    'position': position,
                    'user_id': self.user.id,
                    'user_name': self.user.name
                }
            )
    
    async def handle_comment(self, data):
        """Handle real-time comment."""
        task_id = data.get('task_id')
        text = data.get('text')
        
        if not text:
            return
        
        # Save comment
        comment = await self.create_comment(task_id, text)
        
        if comment and hasattr(self, 'task_group'):
            await self.channel_layer.group_send(
                self.task_group,
                {
                    'type': 'new_comment',
                    'task_id': task_id,
                    'comment_id': comment.id,
                    'text': text,
                    'user_id': self.user.id,
                    'user_name': self.user.name,
                    'timestamp': timezone.now().isoformat()
                }
            )
    
    async def handle_presence(self, data):
        """Handle presence updates."""
        status = data.get('status', 'online')
        
        if hasattr(self, 'company_group'):
            await self.channel_layer.group_send(
                self.company_group,
                {
                    'type': 'presence_update',
                    'user_id': self.user.id,
                    'user_name': self.user.name,
                    'status': status,
                    'timestamp': timezone.now().isoformat()
                }
            )
    
    # Database operations
    @database_sync_to_async
    def verify_task_access(self, task_id):
        """Verify user has access to task."""
        from tasks.models import Task
        from django.db.models import Q
        
        return Task.objects.filter(
            Q(id=task_id) & (
                Q(assigned_to=self.user) |
                Q(created_by=self.user) |
                Q(project__team_members=self.user) |
                Q(project__created_by=self.user)
            )
        ).exists()
    
    @database_sync_to_async
    def update_task_field(self, task_id, field, value):
        """Update a task field."""
        from tasks.models import Task
        
        allowed_fields = ['title', 'description', 'status', 'priority', 'progress_percentage']
        
        if field not in allowed_fields:
            return False
        
        try:
            task = Task.objects.get(id=task_id)
            setattr(task, field, value)
            task.save(update_fields=[field, 'updated_at'])
            return True
        except Task.DoesNotExist:
            return False
    
    @database_sync_to_async
    def create_comment(self, task_id, text):
        """Create a task comment."""
        from tasks.models import Task, TaskComment
        
        try:
            task = Task.objects.get(id=task_id)
            comment = TaskComment.objects.create(
                task=task,
                user=self.user,
                text=text
            )
            return comment
        except Task.DoesNotExist:
            return None
    
    # Message handlers for channel layer
    async def user_joined(self, event):
        """Handle user joined event."""
        await self.send(text_data=json.dumps({
            'type': 'user_joined',
            **event
        }))
    
    async def user_left(self, event):
        """Handle user left event."""
        await self.send(text_data=json.dumps({
            'type': 'user_left',
            **event
        }))
    
    async def task_field_updated(self, event):
        """Handle task field updated event."""
        await self.send(text_data=json.dumps({
            'type': 'task_updated',
            **event
        }))
    
    async def user_typing(self, event):
        """Handle typing indicator event."""
        # Don't send to self
        if event['user_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'typing',
                **event
            }))
    
    async def cursor_moved(self, event):
        """Handle cursor moved event."""
        if event['user_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'cursor',
                **event
            }))
    
    async def new_comment(self, event):
        """Handle new comment event."""
        await self.send(text_data=json.dumps({
            'type': 'comment',
            **event
        }))
    
    async def presence_update(self, event):
        """Handle presence update event."""
        if event['user_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'presence',
                **event
            }))


class NotificationConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time notifications.
    """
    
    async def connect(self):
        """Handle WebSocket connection."""
        self.user = self.scope.get('user')
        
        if not self.user or not self.user.is_authenticated:
            await self.close()
            return
        
        self.notification_group = f'notifications_{self.user.id}'
        await self.channel_layer.group_add(
            self.notification_group,
            self.channel_name
        )
        
        await self.accept()
        
        # Send unread notification count
        count = await self.get_unread_count()
        await self.send(text_data=json.dumps({
            'type': 'initial',
            'unread_count': count
        }))
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection."""
        if hasattr(self, 'notification_group'):
            await self.channel_layer.group_discard(
                self.notification_group,
                self.channel_name
            )
    
    async def receive(self, text_data):
        """Handle incoming messages."""
        try:
            data = json.loads(text_data)
            action = data.get('action')
            
            if action == 'mark_read':
                notification_id = data.get('notification_id')
                await self.mark_notification_read(notification_id)
                
            elif action == 'mark_all_read':
                await self.mark_all_read()
                
        except json.JSONDecodeError:
            pass
    
    @database_sync_to_async
    def get_unread_count(self):
        """Get unread notification count."""
        from users.models import Notification
        return Notification.objects.filter(
            user=self.user,
            is_read=False
        ).count()
    
    @database_sync_to_async
    def mark_notification_read(self, notification_id):
        """Mark a notification as read."""
        from users.models import Notification
        Notification.objects.filter(
            id=notification_id,
            user=self.user
        ).update(is_read=True)
    
    @database_sync_to_async
    def mark_all_read(self):
        """Mark all notifications as read."""
        from users.models import Notification
        Notification.objects.filter(
            user=self.user,
            is_read=False
        ).update(is_read=True)
    
    async def notification(self, event):
        """Handle incoming notification."""
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'notification': event['data']
        }))


class ProjectConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for project-wide updates.
    """
    
    async def connect(self):
        """Handle WebSocket connection."""
        self.user = self.scope.get('user')
        self.project_id = self.scope['url_route']['kwargs'].get('project_id')
        
        if not self.user or not self.user.is_authenticated:
            await self.close()
            return
        
        # Verify project access
        has_access = await self.verify_project_access()
        if not has_access:
            await self.close()
            return
        
        self.project_group = f'project_{self.project_id}'
        await self.channel_layer.group_add(
            self.project_group,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        """Handle disconnection."""
        if hasattr(self, 'project_group'):
            await self.channel_layer.group_discard(
                self.project_group,
                self.channel_name
            )
    
    @database_sync_to_async
    def verify_project_access(self):
        """Verify user has access to project."""
        from projects.models import Project
        from django.db.models import Q
        
        return Project.objects.filter(
            Q(id=self.project_id) & (
                Q(team_members=self.user) |
                Q(created_by=self.user)
            )
        ).exists()
    
    async def task_created(self, event):
        """Handle task created event."""
        await self.send(text_data=json.dumps({
            'type': 'task_created',
            **event
        }))
    
    async def task_updated(self, event):
        """Handle task updated event."""
        await self.send(text_data=json.dumps({
            'type': 'task_updated',
            **event
        }))
    
    async def task_deleted(self, event):
        """Handle task deleted event."""
        await self.send(text_data=json.dumps({
            'type': 'task_deleted',
            **event
        }))
    
    async def progress_update(self, event):
        """Handle progress update event."""
        await self.send(text_data=json.dumps({
            'type': 'progress_update',
            **event
        }))
