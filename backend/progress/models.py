from django.db import models
from django.conf import settings


class ProgressUpdate(models.Model):
    """Progress updates submitted by employees for their tasks."""
    
    STATUS_CHOICES = [
        ('on_track', 'On Track'),
        ('at_risk', 'At Risk'),
        ('blocked', 'Blocked'),
        ('waiting', 'Waiting'),
        ('completed', 'Completed'),
    ]
    
    # Relationships
    task = models.ForeignKey(
        'tasks.Task',
        on_delete=models.CASCADE,
        related_name='progress_updates'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='progress_updates'
    )
    
    # Progress details
    progress_percentage = models.IntegerField(
        default=0,
        help_text="Current completion percentage (0-100)"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='on_track')
    
    # Work description
    work_done = models.TextField(help_text="Description of work completed")
    next_steps = models.TextField(blank=True, help_text="Planned next steps")
    blockers = models.TextField(blank=True, help_text="Any blockers or issues")
    
    # Time tracking
    hours_worked = models.FloatField(default=0, help_text="Hours worked since last update")
    
    # Links and references
    links = models.TextField(blank=True, help_text="Links to PRs, docs, etc. (one per line)")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Progress Update'
        verbose_name_plural = 'Progress Updates'
    
    def __str__(self):
        return f"{self.task.title} - {self.progress_percentage}% by {self.user.name}"
    
    def save(self, *args, **kwargs):
        """Update task progress when saving."""
        super().save(*args, **kwargs)
        
        # Update the task's progress percentage
        self.task.progress_percentage = self.progress_percentage
        
        # Update task status if blocked or completed
        if self.status == 'blocked':
            self.task.status = 'blocked'
        elif self.status == 'completed' and self.progress_percentage == 100:
            self.task.status = 'completed'
            from django.utils import timezone
            self.task.completed_at = timezone.now()
        elif self.task.status == 'open':
            self.task.status = 'in_progress'
            from django.utils import timezone
            self.task.started_at = timezone.now()
        
        self.task.actual_hours += self.hours_worked
        self.task.save()
        
        # Update project progress
        self.task.project.update_progress()


class ProgressAttachment(models.Model):
    """File attachments for progress updates."""
    
    progress_update = models.ForeignKey(
        ProgressUpdate,
        on_delete=models.CASCADE,
        related_name='attachments'
    )
    file = models.FileField(upload_to='progress_attachments/')
    filename = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-uploaded_at']
    
    def __str__(self):
        return f"{self.filename} - Update #{self.progress_update.id}"


class ProgressComment(models.Model):
    """Comments on progress updates (typically from managers)."""
    
    progress_update = models.ForeignKey(
        ProgressUpdate,
        on_delete=models.CASCADE,
        related_name='comments'
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Comment by {self.user.name} on progress update #{self.progress_update.id}"
