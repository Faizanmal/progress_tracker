"""
Forms app serializers.
"""
from rest_framework import serializers
from .models import Form, FormField, FormSubmission, FormTemplate


class FormFieldSerializer(serializers.ModelSerializer):
    """Serializer for form fields."""
    
    class Meta:
        model = FormField
        fields = [
            'id', 'label', 'field_type', 'placeholder', 'help_text',
            'required', 'min_length', 'max_length', 'min_value', 'max_value',
            'pattern', 'options', 'order', 'conditional_logic'
        ]


class FormSerializer(serializers.ModelSerializer):
    """Serializer for forms."""
    
    fields = FormFieldSerializer(many=True, read_only=True)
    submission_count = serializers.ReadOnlyField()
    is_accepting_submissions = serializers.ReadOnlyField()
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)
    
    class Meta:
        model = Form
        fields = [
            'id', 'title', 'description', 'form_type', 'schema', 'status',
            'allow_anonymous', 'allow_multiple_submissions', 'notification_email',
            'submission_limit', 'deadline', 'project', 'created_by', 'created_by_name',
            'created_at', 'updated_at', 'published_at', 'fields',
            'submission_count', 'is_accepting_submissions'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at', 'published_at']


class FormCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating forms."""
    
    fields = FormFieldSerializer(many=True, required=False)
    
    class Meta:
        model = Form
        fields = [
            'title', 'description', 'form_type', 'schema', 'status',
            'allow_anonymous', 'allow_multiple_submissions', 'notification_email',
            'submission_limit', 'deadline', 'project', 'fields'
        ]
    
    def create(self, validated_data):
        fields_data = validated_data.pop('fields', [])
        form = Form.objects.create(**validated_data)
        
        for i, field_data in enumerate(fields_data):
            field_data['order'] = field_data.get('order', i)
            FormField.objects.create(form=form, **field_data)
        
        return form
    
    def update(self, instance, validated_data):
        fields_data = validated_data.pop('fields', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if fields_data is not None:
            # Clear existing fields and recreate
            instance.fields.all().delete()
            for i, field_data in enumerate(fields_data):
                field_data['order'] = field_data.get('order', i)
                FormField.objects.create(form=instance, **field_data)
        
        return instance


class FormSubmissionSerializer(serializers.ModelSerializer):
    """Serializer for form submissions."""
    
    submitted_by_name = serializers.CharField(source='submitted_by.name', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.name', read_only=True)
    form_title = serializers.CharField(source='form.title', read_only=True)
    
    class Meta:
        model = FormSubmission
        fields = [
            'id', 'form', 'form_title', 'data', 'status',
            'submitted_by', 'submitted_by_name', 'submitter_email', 'submitter_name',
            'reviewed_by', 'reviewed_by_name', 'review_notes', 'reviewed_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'submitted_by', 'reviewed_by', 'reviewed_at', 'created_at', 'updated_at'
        ]


class FormSubmissionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating form submissions."""
    
    class Meta:
        model = FormSubmission
        fields = ['form', 'data', 'submitter_email', 'submitter_name']


class FormTemplateSerializer(serializers.ModelSerializer):
    """Serializer for form templates."""
    
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)
    
    class Meta:
        model = FormTemplate
        fields = [
            'id', 'name', 'description', 'category', 'schema', 'is_public',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']


class FormAnalyticsSerializer(serializers.Serializer):
    """Serializer for form analytics."""
    
    total_submissions = serializers.IntegerField()
    submissions_by_status = serializers.DictField()
    submissions_over_time = serializers.ListField()
    average_completion_time = serializers.FloatField()
    field_analytics = serializers.DictField()
