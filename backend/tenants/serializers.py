"""
Serializers for tenants app.
"""
from rest_framework import serializers
from .models import Tenant, TenantBranding, TenantInvitation, TenantAuditLog, TenantUsageStats


class TenantBrandingSerializer(serializers.ModelSerializer):
    class Meta:
        model = TenantBranding
        fields = [
            'id', 'logo_light', 'logo_dark', 'favicon', 'primary_color',
            'secondary_color', 'accent_color', 'font_family', 'heading_font',
            'email_header_image', 'email_footer_text', 'custom_css',
            'terms_url', 'privacy_url', 'support_email', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TenantSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    branding_config = TenantBrandingSerializer(read_only=True)
    storage_remaining_gb = serializers.SerializerMethodField()
    
    class Meta:
        model = Tenant
        fields = [
            'id', 'company', 'company_name', 'slug', 'subdomain', 'custom_domain',
            'plan', 'status', 'trial_ends_at', 'subscription_ends_at',
            'max_users', 'max_projects', 'max_storage_gb', 'current_users',
            'current_projects', 'storage_used_bytes', 'features', 'settings',
            'branding_config', 'storage_remaining_gb', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'current_users', 'current_projects', 'storage_used_bytes',
            'created_at', 'updated_at'
        ]
    
    def get_storage_remaining_gb(self, obj):
        return obj.get_storage_remaining_gb()


class TenantUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = ['subdomain', 'custom_domain', 'settings', 'features']


class TenantInvitationSerializer(serializers.ModelSerializer):
    invited_by_name = serializers.CharField(source='invited_by.name', read_only=True)
    tenant_name = serializers.CharField(source='tenant.company.name', read_only=True)
    
    class Meta:
        model = TenantInvitation
        fields = [
            'id', 'tenant', 'tenant_name', 'email', 'role', 'invited_by',
            'invited_by_name', 'status', 'expires_at', 'created_at'
        ]
        read_only_fields = ['id', 'token', 'status', 'created_at']


class TenantInvitationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TenantInvitation
        fields = ['email', 'role']


class TenantAuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.name', read_only=True)
    
    class Meta:
        model = TenantAuditLog
        fields = [
            'id', 'user', 'user_name', 'action', 'resource_type',
            'resource_id', 'details', 'ip_address', 'created_at'
        ]


class TenantUsageStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = TenantUsageStats
        fields = [
            'id', 'date', 'active_users', 'tasks_created', 'tasks_completed',
            'projects_active', 'progress_updates', 'api_requests',
            'files_uploaded', 'storage_added_bytes'
        ]
