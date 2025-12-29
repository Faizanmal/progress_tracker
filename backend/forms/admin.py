from django.contrib import admin
from .models import Form, FormField, FormSubmission, FormTemplate


class FormFieldInline(admin.TabularInline):
    model = FormField
    extra = 1


@admin.register(Form)
class FormAdmin(admin.ModelAdmin):
    list_display = ['title', 'form_type', 'status', 'created_by', 'created_at']
    list_filter = ['status', 'form_type', 'created_at']
    search_fields = ['title', 'description']
    inlines = [FormFieldInline]


@admin.register(FormSubmission)
class FormSubmissionAdmin(admin.ModelAdmin):
    list_display = ['form', 'submitted_by', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['form__title', 'submitted_by__name']


@admin.register(FormTemplate)
class FormTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'is_public', 'created_by']
    list_filter = ['category', 'is_public']
    search_fields = ['name', 'description']
