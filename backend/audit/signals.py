"""
Signals for automatic audit logging.
"""
from django.db.models.signals import pre_save, post_save, pre_delete, post_delete
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from django.forms.models import model_to_dict

from tasks.models import Task
from projects.models import Project
from progress.models import ProgressUpdate
from users.models import User

from .models import AuditLog, ChangeSnapshot

# Store pre-save state
_pre_save_state = {}


def get_model_diff(old_dict, new_dict, exclude_fields=None):
    """Compare two model dictionaries and return changes."""
    exclude_fields = exclude_fields or ['updated_at', 'last_login']
    changes = {}
    
    all_keys = set(old_dict.keys()) | set(new_dict.keys())
    
    for key in all_keys:
        if key in exclude_fields:
            continue
        old_val = old_dict.get(key)
        new_val = new_dict.get(key)
        if old_val != new_val:
            changes[key] = {'old': old_val, 'new': new_val}
    
    return changes


def serialize_instance(instance, exclude_fields=None):
    """Serialize a model instance to a dictionary."""
    exclude_fields = exclude_fields or []
    try:
        data = model_to_dict(instance)
        # Convert non-serializable types
        for key, value in data.items():
            if hasattr(value, 'pk'):
                data[key] = str(value.pk)
            elif hasattr(value, 'isoformat'):
                data[key] = value.isoformat()
        return data
    except Exception:
        return {}


# ============================================================================
# Task Audit Logging
# ============================================================================

@receiver(pre_save, sender=Task)
def task_pre_save(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_instance = Task.objects.get(pk=instance.pk)
            _pre_save_state[f'task_{instance.pk}'] = serialize_instance(old_instance)
        except Task.DoesNotExist:
            pass


@receiver(post_save, sender=Task)
def task_post_save(sender, instance, created, **kwargs):
    # Skip if no user context (would need middleware for request context)
    action = 'create' if created else 'update'
    
    old_state = _pre_save_state.pop(f'task_{instance.pk}', {})
    new_state = serialize_instance(instance)
    
    changes = {} if created else get_model_diff(old_state, new_state)
    
    # Determine action category based on changes
    action_category = 'task'
    if not created:
        if 'status' in changes:
            action = 'status_change'
            action_category = 'task_status'
        elif 'assigned_to' in changes:
            action = 'assign' if changes['assigned_to']['new'] else 'unassign'
            action_category = 'task_assignment'
    
    # Only log if there are actual changes or it's a create
    if created or changes:
        try:
            user = instance.created_by
            company = instance.project.company if instance.project else None
            
            if user and company:
                AuditLog.objects.create(
                    user=user,
                    user_email=user.email,
                    user_name=user.name,
                    company=company,
                    content_type=ContentType.objects.get_for_model(instance),
                    object_id=str(instance.pk),
                    object_repr=str(instance),
                    action=action,
                    action_category=action_category,
                    changes=changes,
                    old_values=old_state,
                    new_values=new_state,
                    message=f"Task '{instance.title}' was {action}d",
                )
        except Exception:
            pass


@receiver(post_delete, sender=Task)
def task_post_delete(sender, instance, **kwargs):
    try:
        user = instance.created_by
        company = instance.project.company if instance.project else None
        
        if user and company:
            AuditLog.objects.create(
                user=user,
                user_email=user.email,
                user_name=user.name,
                company=company,
                content_type=ContentType.objects.get_for_model(instance),
                object_id=str(instance.pk),
                object_repr=str(instance),
                action='delete',
                action_category='task',
                old_values=serialize_instance(instance),
                message=f"Task '{instance.title}' was deleted",
            )
    except Exception:
        pass


# ============================================================================
# Project Audit Logging
# ============================================================================

@receiver(pre_save, sender=Project)
def project_pre_save(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_instance = Project.objects.get(pk=instance.pk)
            _pre_save_state[f'project_{instance.pk}'] = serialize_instance(old_instance)
        except Project.DoesNotExist:
            pass


@receiver(post_save, sender=Project)
def project_post_save(sender, instance, created, **kwargs):
    action = 'create' if created else 'update'
    
    old_state = _pre_save_state.pop(f'project_{instance.pk}', {})
    new_state = serialize_instance(instance)
    
    changes = {} if created else get_model_diff(old_state, new_state)
    
    if 'status' in changes:
        action = 'status_change'
    
    if created or changes:
        try:
            user = instance.created_by
            company = instance.company
            
            if user and company:
                AuditLog.objects.create(
                    user=user,
                    user_email=user.email,
                    user_name=user.name,
                    company=company,
                    content_type=ContentType.objects.get_for_model(instance),
                    object_id=str(instance.pk),
                    object_repr=str(instance),
                    action=action,
                    action_category='project',
                    changes=changes,
                    old_values=old_state,
                    new_values=new_state,
                    message=f"Project '{instance.title}' was {action}d",
                )
        except Exception:
            pass


# ============================================================================
# Progress Update Audit Logging
# ============================================================================

@receiver(post_save, sender=ProgressUpdate)
def progress_post_save(sender, instance, created, **kwargs):
    if created:
        try:
            user = instance.user
            company = instance.task.project.company if instance.task and instance.task.project else None
            
            if user and company:
                AuditLog.objects.create(
                    user=user,
                    user_email=user.email,
                    user_name=user.name,
                    company=company,
                    content_type=ContentType.objects.get_for_model(instance),
                    object_id=str(instance.pk),
                    object_repr=str(instance),
                    action='submit',
                    action_category='progress_update',
                    new_values=serialize_instance(instance),
                    message=f"Progress update submitted for task '{instance.task.title}'",
                )
        except Exception:
            pass
