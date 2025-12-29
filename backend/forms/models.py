"""
Forms app models for dynamic form creation and submissions.
"""
from django.db import models
from django.conf import settings
import uuid


class Form(models.Model):
    """Dynamic form model."""
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    ]
    
    FORM_TYPE_CHOICES = [
        ('survey', 'Survey'),
        ('feedback', 'Feedback'),
        ('checklist', 'Checklist'),
        ('assessment', 'Assessment'),
        ('review', 'Review'),
        ('custom', 'Custom'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    form_type = models.CharField(max_length=50, choices=FORM_TYPE_CHOICES, default='custom')
    schema = models.JSONField(default=dict, help_text="JSON Schema for form fields")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Settings
    allow_anonymous = models.BooleanField(default=False)
    allow_multiple_submissions = models.BooleanField(default=True)
    notification_email = models.EmailField(blank=True)
    submission_limit = models.IntegerField(null=True, blank=True)
    deadline = models.DateTimeField(null=True, blank=True)
    
    # Relations
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_forms'
    )
    company = models.ForeignKey(
        'users.Company',
        on_delete=models.CASCADE,
        related_name='forms',
        null=True,
        blank=True
    )
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        related_name='forms',
        null=True,
        blank=True
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Form'
        verbose_name_plural = 'Forms'
    
    def __str__(self):
        return self.title
    
    @property
    def submission_count(self):
        return self.submissions.count()
    
    @property
    def is_accepting_submissions(self):
        from django.utils import timezone
        if self.status != 'published':
            return False
        if self.deadline and self.deadline < timezone.now():
            return False
        if self.submission_limit and self.submission_count >= self.submission_limit:
            return False
        return True


class FormField(models.Model):
    """Individual form field."""
    
    FIELD_TYPE_CHOICES = [
        ('text', 'Text'),
        ('textarea', 'Text Area'),
        ('number', 'Number'),
        ('email', 'Email'),
        ('phone', 'Phone'),
        ('date', 'Date'),
        ('time', 'Time'),
        ('datetime', 'DateTime'),
        ('select', 'Select'),
        ('multiselect', 'Multi-Select'),
        ('radio', 'Radio'),
        ('checkbox', 'Checkbox'),
        ('rating', 'Rating'),
        ('file', 'File Upload'),
        ('signature', 'Signature'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    form = models.ForeignKey(Form, on_delete=models.CASCADE, related_name='fields')
    label = models.CharField(max_length=255)
    field_type = models.CharField(max_length=50, choices=FIELD_TYPE_CHOICES)
    placeholder = models.CharField(max_length=255, blank=True)
    help_text = models.TextField(blank=True)
    
    # Validation
    required = models.BooleanField(default=False)
    min_length = models.IntegerField(null=True, blank=True)
    max_length = models.IntegerField(null=True, blank=True)
    min_value = models.FloatField(null=True, blank=True)
    max_value = models.FloatField(null=True, blank=True)
    pattern = models.CharField(max_length=255, blank=True, help_text="Regex pattern")
    
    # Options for select/radio/checkbox
    options = models.JSONField(default=list, blank=True)
    
    # Ordering
    order = models.IntegerField(default=0)
    
    # Conditional logic
    conditional_logic = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"{self.form.title} - {self.label}"


class FormSubmission(models.Model):
    """Form submission model."""
    
    STATUS_CHOICES = [
        ('submitted', 'Submitted'),
        ('reviewed', 'Reviewed'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    form = models.ForeignKey(Form, on_delete=models.CASCADE, related_name='submissions')
    data = models.JSONField(default=dict, help_text="Submitted form data")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='submitted')
    
    # Submitter info
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='form_submissions'
    )
    submitter_email = models.EmailField(blank=True)
    submitter_name = models.CharField(max_length=255, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    # Review
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_submissions'
    )
    review_notes = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        submitter = self.submitted_by.name if self.submitted_by else self.submitter_email or 'Anonymous'
        return f"{self.form.title} - {submitter}"


class FormTemplate(models.Model):
    """Reusable form template."""
    
    CATEGORY_CHOICES = [
        ('hr', 'Human Resources'),
        ('project', 'Project Management'),
        ('feedback', 'Feedback'),
        ('survey', 'Survey'),
        ('assessment', 'Assessment'),
        ('other', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='other')
    schema = models.JSONField(default=dict)
    is_public = models.BooleanField(default=False)
    
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='form_templates'
    )
    company = models.ForeignKey(
        'users.Company',
        on_delete=models.CASCADE,
        related_name='form_templates',
        null=True,
        blank=True
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name
