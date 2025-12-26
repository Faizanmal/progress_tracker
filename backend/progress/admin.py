from django.contrib import admin
from .models import ProgressUpdate, ProgressAttachment, ProgressComment


@admin.register(ProgressUpdate)
class ProgressUpdateAdmin(admin.ModelAdmin):
    list_display = ('task', 'user', 'progress_percentage', 'status', 'hours_worked', 'created_at')
    list_filter = ('status', 'created_at', 'user')
    search_fields = ('task__title', 'user__name', 'work_done', 'blockers')
    ordering = ('-created_at',)


@admin.register(ProgressAttachment)
class ProgressAttachmentAdmin(admin.ModelAdmin):
    list_display = ('progress_update', 'filename', 'uploaded_at')
    list_filter = ('uploaded_at',)
    search_fields = ('filename',)
    ordering = ('-uploaded_at',)


@admin.register(ProgressComment)
class ProgressCommentAdmin(admin.ModelAdmin):
    list_display = ('progress_update', 'user', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__name', 'text')
    ordering = ('-created_at',)
