from django.contrib import admin
from .models import Project, ProjectComment


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('title', 'status', 'priority', 'created_by', 'company', 'progress_percentage', 'created_at')
    list_filter = ('status', 'priority', 'company', 'created_at')
    search_fields = ('title', 'description', 'created_by__name')
    ordering = ('-created_at',)
    filter_horizontal = ('team_members',)


@admin.register(ProjectComment)
class ProjectCommentAdmin(admin.ModelAdmin):
    list_display = ('project', 'user', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('project__title', 'user__name', 'text')
    ordering = ('-created_at',)
