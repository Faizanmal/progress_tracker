"""
Django signals for workflow automation triggers.
"""
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone


@receiver(pre_save, sender='tasks.Task')
def task_pre_save(sender, instance, **kwargs):
    """Capture old values before save."""
    if instance.pk:
        try:
            old_instance = sender.objects.get(pk=instance.pk)
            instance._old_status = old_instance.status
            instance._old_assignee = old_instance.assigned_to
            instance._old_priority = old_instance.priority
        except sender.DoesNotExist:
            instance._old_status = None
            instance._old_assignee = None
            instance._old_priority = None
    else:
        instance._old_status = None
        instance._old_assignee = None
        instance._old_priority = None


@receiver(post_save, sender='tasks.Task')
def task_post_save(sender, instance, created, **kwargs):
    """Trigger workflows on task save."""
    from .services import WorkflowTriggerService
    
    if created:
        # Task created trigger
        WorkflowTriggerService.trigger_task_created(instance)
    else:
        # Check for status change
        old_status = getattr(instance, '_old_status', None)
        if old_status and old_status != instance.status:
            WorkflowTriggerService.trigger_task_status_change(
                instance, old_status, instance.status
            )
        
        # Check for assignee change
        old_assignee = getattr(instance, '_old_assignee', None)
        if old_assignee != instance.assigned_to:
            WorkflowTriggerService.trigger_task_assigned(
                instance, old_assignee, instance.assigned_to
            )


@receiver(post_save, sender='progress.ProgressUpdate')
def progress_update_post_save(sender, instance, created, **kwargs):
    """Trigger workflows on progress update."""
    if created:
        from .services import WorkflowTriggerService
        WorkflowTriggerService.trigger_progress_update(instance)


@receiver(post_save, sender='automation.TaskDependency')
def dependency_post_save(sender, instance, created, **kwargs):
    """Recalculate timeline when dependency is created."""
    if created and instance.auto_adjust_dates:
        from .services import DependencyManager
        manager = DependencyManager(instance.predecessor.project)
        manager.recalculate_from_task(instance.predecessor)
