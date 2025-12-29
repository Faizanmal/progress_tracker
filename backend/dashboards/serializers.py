"""
Serializers for dashboards app.
"""
from rest_framework import serializers
from .models import Dashboard, DashboardWidget, WidgetTemplate, DashboardTemplate, WidgetData


class DashboardWidgetSerializer(serializers.ModelSerializer):
    widget_type_display = serializers.CharField(source='get_widget_type_display', read_only=True)
    cached_data = serializers.SerializerMethodField()
    
    class Meta:
        model = DashboardWidget
        fields = [
            'id', 'widget_type', 'widget_type_display', 'title', 'subtitle',
            'position_x', 'position_y', 'width', 'height', 'size',
            'config', 'filters', 'auto_refresh', 'refresh_interval_seconds',
            'is_visible', 'order', 'cached_data', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_cached_data(self, obj):
        try:
            if hasattr(obj, 'cached_data'):
                return obj.cached_data.data
        except WidgetData.DoesNotExist:
            pass
        return None


class DashboardSerializer(serializers.ModelSerializer):
    widgets = DashboardWidgetSerializer(many=True, read_only=True)
    user_name = serializers.CharField(source='user.name', read_only=True)
    
    class Meta:
        model = Dashboard
        fields = [
            'id', 'name', 'description', 'layout', 'is_default', 'is_shared',
            'shared_with_team', 'theme', 'user', 'user_name', 'widgets',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class DashboardCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dashboard
        fields = ['name', 'description', 'layout', 'is_default', 'is_shared', 'shared_with_team', 'theme']


class WidgetTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = WidgetTemplate
        fields = [
            'id', 'name', 'description', 'widget_type', 'default_config',
            'default_filters', 'default_size', 'category', 'icon',
            'is_premium', 'usage_count', 'created_at'
        ]


class DashboardTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = DashboardTemplate
        fields = [
            'id', 'name', 'description', 'target_role', 'layout', 'widgets',
            'thumbnail', 'is_featured', 'is_premium', 'usage_count', 'created_at'
        ]
