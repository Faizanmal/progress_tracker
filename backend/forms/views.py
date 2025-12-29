"""
Forms app views.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Count, Q
from django.db.models.functions import TruncDate

from .models import Form, FormField, FormSubmission, FormTemplate
from .serializers import (
    FormSerializer, FormCreateSerializer,
    FormFieldSerializer, FormSubmissionSerializer,
    FormSubmissionCreateSerializer, FormTemplateSerializer
)


class FormViewSet(viewsets.ModelViewSet):
    """ViewSet for managing forms."""
    
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return FormCreateSerializer
        return FormSerializer
    
    def get_queryset(self):
        user = self.request.user
        queryset = Form.objects.filter(company=user.company)
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by type
        form_type = self.request.query_params.get('form_type')
        if form_type:
            queryset = queryset.filter(form_type=form_type)
        
        # Filter by project
        project_id = self.request.query_params.get('project')
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(
            created_by=self.request.user,
            company=self.request.user.company
        )
    
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publish a form."""
        form = self.get_object()
        
        if form.status == 'published':
            return Response(
                {'error': 'Form is already published'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        form.status = 'published'
        form.published_at = timezone.now()
        form.save()
        
        return Response(FormSerializer(form).data)
    
    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """Archive a form."""
        form = self.get_object()
        form.status = 'archived'
        form.save()
        return Response(FormSerializer(form).data)
    
    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """Duplicate a form."""
        original = self.get_object()
        
        # Create new form
        new_form = Form.objects.create(
            title=f"{original.title} (Copy)",
            description=original.description,
            form_type=original.form_type,
            schema=original.schema,
            status='draft',
            allow_anonymous=original.allow_anonymous,
            allow_multiple_submissions=original.allow_multiple_submissions,
            created_by=request.user,
            company=request.user.company
        )
        
        # Duplicate fields
        for field in original.fields.all():
            FormField.objects.create(
                form=new_form,
                label=field.label,
                field_type=field.field_type,
                placeholder=field.placeholder,
                help_text=field.help_text,
                required=field.required,
                min_length=field.min_length,
                max_length=field.max_length,
                min_value=field.min_value,
                max_value=field.max_value,
                pattern=field.pattern,
                options=field.options,
                order=field.order,
                conditional_logic=field.conditional_logic
            )
        
        return Response(FormSerializer(new_form).data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get'])
    def analytics(self, request, pk=None):
        """Get form analytics."""
        form = self.get_object()
        submissions = form.submissions.all()
        
        # Submissions by status
        submissions_by_status = dict(
            submissions.values_list('status').annotate(count=Count('id'))
        )
        
        # Submissions over time (last 30 days)
        from datetime import timedelta
        thirty_days_ago = timezone.now() - timedelta(days=30)
        submissions_over_time = list(
            submissions.filter(created_at__gte=thirty_days_ago)
            .annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(count=Count('id'))
            .order_by('date')
        )
        
        # Convert dates to strings
        for item in submissions_over_time:
            item['date'] = item['date'].isoformat()
        
        analytics = {
            'total_submissions': submissions.count(),
            'submissions_by_status': submissions_by_status,
            'submissions_over_time': submissions_over_time,
            'average_completion_time': 0,
            'field_analytics': {}
        }
        
        return Response(analytics)
    
    @action(detail=True, methods=['get', 'post'])
    def submissions(self, request, pk=None):
        """Get or create submissions for a form."""
        form = self.get_object()
        
        if request.method == 'GET':
            submissions = form.submissions.all()
            
            # Filter by status
            status_filter = request.query_params.get('status')
            if status_filter:
                submissions = submissions.filter(status=status_filter)
            
            serializer = FormSubmissionSerializer(submissions, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            if not form.is_accepting_submissions:
                return Response(
                    {'error': 'Form is not accepting submissions'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check for existing submission if multiple not allowed
            if not form.allow_multiple_submissions and request.user.is_authenticated:
                existing = form.submissions.filter(submitted_by=request.user).exists()
                if existing:
                    return Response(
                        {'error': 'You have already submitted this form'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            serializer = FormSubmissionCreateSerializer(data=request.data)
            if serializer.is_valid():
                submission = serializer.save(
                    form=form,
                    submitted_by=request.user if request.user.is_authenticated else None,
                    ip_address=request.META.get('REMOTE_ADDR'),
                    user_agent=request.META.get('HTTP_USER_AGENT', '')
                )
                return Response(
                    FormSubmissionSerializer(submission).data,
                    status=status.HTTP_201_CREATED
                )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FormFieldViewSet(viewsets.ModelViewSet):
    """ViewSet for managing form fields."""
    
    serializer_class = FormFieldSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        form_id = self.kwargs.get('form_pk')
        return FormField.objects.filter(form_id=form_id, form__company=self.request.user.company)
    
    def perform_create(self, serializer):
        form_id = self.kwargs.get('form_pk')
        form = Form.objects.get(id=form_id, company=self.request.user.company)
        serializer.save(form=form)


class FormSubmissionViewSet(viewsets.ModelViewSet):
    """ViewSet for managing form submissions."""
    
    serializer_class = FormSubmissionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = FormSubmission.objects.filter(form__company=user.company)
        
        # Filter by form
        form_id = self.request.query_params.get('form')
        if form_id:
            queryset = queryset.filter(form_id=form_id)
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a submission."""
        submission = self.get_object()
        submission.status = 'approved'
        submission.reviewed_by = request.user
        submission.reviewed_at = timezone.now()
        submission.review_notes = request.data.get('notes', '')
        submission.save()
        return Response(FormSubmissionSerializer(submission).data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a submission."""
        submission = self.get_object()
        submission.status = 'rejected'
        submission.reviewed_by = request.user
        submission.reviewed_at = timezone.now()
        submission.review_notes = request.data.get('notes', '')
        submission.save()
        return Response(FormSubmissionSerializer(submission).data)


class FormTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet for managing form templates."""
    
    serializer_class = FormTemplateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        # Show public templates and user's company templates
        return FormTemplate.objects.filter(
            Q(is_public=True) | Q(company=user.company)
        )
    
    def perform_create(self, serializer):
        serializer.save(
            created_by=self.request.user,
            company=self.request.user.company
        )
    
    @action(detail=True, methods=['post'])
    def create_form(self, request, pk=None):
        """Create a form from a template."""
        template = self.get_object()
        
        form = Form.objects.create(
            title=request.data.get('title', template.name),
            description=template.description,
            form_type='custom',
            schema=template.schema,
            status='draft',
            created_by=request.user,
            company=request.user.company
        )
        
        return Response(FormSerializer(form).data, status=status.HTTP_201_CREATED)
