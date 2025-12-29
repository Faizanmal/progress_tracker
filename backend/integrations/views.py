"""
Views for integrations app.
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.utils import timezone
from django.db import transaction
import secrets

from .models import (
    CalendarConnection, CalendarEvent, FileAttachment, FileVersion,
    APIKey, APIRequestLog, WebhookEndpoint, WebhookDelivery
)
from .serializers import (
    CalendarConnectionSerializer, CalendarEventSerializer,
    FileAttachmentSerializer, FileAttachmentUploadSerializer, FileVersionSerializer,
    APIKeySerializer, APIKeyCreateSerializer, APIRequestLogSerializer,
    WebhookEndpointSerializer, WebhookDeliverySerializer
)


class CalendarConnectionViewSet(viewsets.ModelViewSet):
    """Manage calendar connections for users."""
    serializer_class = CalendarConnectionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return CalendarConnection.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def connect_google(self, request):
        """Initiate Google Calendar OAuth flow."""
        # Return OAuth URL for frontend to redirect
        from django.conf import settings
        
        oauth_url = (
            f"https://accounts.google.com/o/oauth2/v2/auth?"
            f"client_id={settings.GOOGLE_OAUTH_CLIENT_ID}&"
            f"redirect_uri={settings.GOOGLE_OAUTH_REDIRECT_URI}&"
            f"response_type=code&"
            f"scope=https://www.googleapis.com/auth/calendar&"
            f"access_type=offline&"
            f"prompt=consent"
        )
        return Response({'oauth_url': oauth_url})
    
    @action(detail=False, methods=['post'])
    def callback(self, request):
        """Handle OAuth callback and create connection."""
        code = request.data.get('code')
        provider = request.data.get('provider', 'google')
        
        if not code:
            return Response(
                {'error': 'Authorization code required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Exchange code for tokens (implementation depends on provider)
        # This is a placeholder - actual implementation would call provider's token endpoint
        try:
            connection, created = CalendarConnection.objects.update_or_create(
                user=request.user,
                provider=provider,
                defaults={
                    'access_token': 'token_from_oauth',  # Replace with actual token
                    'refresh_token': 'refresh_token',
                    'sync_status': 'active',
                }
            )
            return Response(CalendarConnectionSerializer(connection).data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def sync(self, request, pk=None):
        """Manually trigger calendar sync."""
        connection = self.get_object()
        
        # Trigger sync (in production, this would be async via Celery)
        connection.last_sync = timezone.now()
        connection.save(update_fields=['last_sync'])
        
        return Response({'status': 'sync_started', 'last_sync': connection.last_sync})
    
    @action(detail=True, methods=['post'])
    def disconnect(self, request, pk=None):
        """Disconnect calendar integration."""
        connection = self.get_object()
        connection.sync_status = 'disconnected'
        connection.access_token = ''
        connection.refresh_token = ''
        connection.save()
        return Response({'status': 'disconnected'})


class CalendarEventViewSet(viewsets.ModelViewSet):
    """Manage synced calendar events."""
    serializer_class = CalendarEventSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return CalendarEvent.objects.filter(connection__user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def link_task(self, request, pk=None):
        """Link a calendar event to a task."""
        event = self.get_object()
        task_id = request.data.get('task_id')
        
        if task_id:
            from tasks.models import Task
            try:
                task = Task.objects.get(pk=task_id, project__team_members=request.user)
                event.task = task
                event.save(update_fields=['task'])
                return Response({'status': 'linked', 'task_id': str(task_id)})
            except Task.DoesNotExist:
                return Response(
                    {'error': 'Task not found or access denied'},
                    status=status.HTTP_404_NOT_FOUND
                )
        return Response({'error': 'task_id required'}, status=status.HTTP_400_BAD_REQUEST)


class FileAttachmentViewSet(viewsets.ModelViewSet):
    """Manage file attachments with version control."""
    serializer_class = FileAttachmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_queryset(self):
        queryset = FileAttachment.objects.filter(company=self.request.user.company)
        
        # Filter by content type
        content_type = self.request.query_params.get('content_type')
        if content_type:
            queryset = queryset.filter(content_type=content_type)
        
        # Filter by related object
        task_id = self.request.query_params.get('task')
        if task_id:
            queryset = queryset.filter(task_id=task_id)
        
        project_id = self.request.query_params.get('project')
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        
        # Only show latest versions by default
        show_all_versions = self.request.query_params.get('all_versions', 'false').lower() == 'true'
        if not show_all_versions:
            queryset = queryset.filter(is_latest=True)
        
        return queryset.select_related('uploaded_by')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return FileAttachmentUploadSerializer
        return FileAttachmentSerializer
    
    def perform_create(self, serializer):
        file_obj = self.request.FILES.get('file')
        serializer.save(
            uploaded_by=self.request.user,
            company=self.request.user.company,
            original_filename=file_obj.name if file_obj else '',
            mime_type=file_obj.content_type if file_obj else '',
        )
    
    @action(detail=True, methods=['post'])
    def upload_version(self, request, pk=None):
        """Upload a new version of an existing file."""
        attachment = self.get_object()
        file_obj = request.FILES.get('file')
        change_summary = request.data.get('change_summary', '')
        
        if not file_obj:
            return Response({'error': 'File required'}, status=status.HTTP_400_BAD_REQUEST)
        
        with transaction.atomic():
            # Create version record
            version = FileVersion.objects.create(
                attachment=attachment,
                version_number=attachment.version + 1,
                file=file_obj,
                file_size=file_obj.size,
                change_summary=change_summary,
                uploaded_by=request.user,
            )
            
            # Update main attachment
            attachment.version += 1
            attachment.file = file_obj
            attachment.file_size = file_obj.size
            attachment.save()
        
        return Response(FileVersionSerializer(version).data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get'])
    def versions(self, request, pk=None):
        """Get all versions of a file."""
        attachment = self.get_object()
        versions = attachment.versions.all()
        return Response(FileVersionSerializer(versions, many=True).data)
    
    @action(detail=True, methods=['post'])
    def restore_version(self, request, pk=None):
        """Restore a previous version."""
        attachment = self.get_object()
        version_number = request.data.get('version_number')
        
        try:
            version = attachment.versions.get(version_number=version_number)
            
            # Create new version from restored version
            new_version = FileVersion.objects.create(
                attachment=attachment,
                version_number=attachment.version + 1,
                file=version.file,
                file_size=version.file_size,
                change_summary=f'Restored from version {version_number}',
                uploaded_by=request.user,
            )
            
            attachment.version += 1
            attachment.file = version.file
            attachment.save()
            
            return Response(FileVersionSerializer(new_version).data)
        except FileVersion.DoesNotExist:
            return Response(
                {'error': 'Version not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class APIKeyViewSet(viewsets.ModelViewSet):
    """Manage API keys for third-party integrations."""
    serializer_class = APIKeySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return APIKey.objects.filter(company=self.request.user.company)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return APIKeyCreateSerializer
        return APIKeySerializer
    
    def create(self, request):
        """Create a new API key."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Generate secure key
        key = secrets.token_urlsafe(48)
        key_prefix = key[:8]
        
        api_key = APIKey.objects.create(
            company=request.user.company,
            created_by=request.user,
            key=key,
            key_prefix=key_prefix,
            **serializer.validated_data
        )
        
        # Return full key only on creation
        response_data = APIKeySerializer(api_key).data
        response_data['key'] = key  # Include full key only on create
        
        return Response(response_data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def regenerate(self, request, pk=None):
        """Regenerate an API key."""
        api_key = self.get_object()
        
        new_key = secrets.token_urlsafe(48)
        api_key.key = new_key
        api_key.key_prefix = new_key[:8]
        api_key.save()
        
        response_data = APIKeySerializer(api_key).data
        response_data['key'] = new_key
        
        return Response(response_data)
    
    @action(detail=True, methods=['get'])
    def logs(self, request, pk=None):
        """Get request logs for an API key."""
        api_key = self.get_object()
        logs = api_key.request_logs.all()[:100]  # Last 100 requests
        return Response(APIRequestLogSerializer(logs, many=True).data)


class WebhookEndpointViewSet(viewsets.ModelViewSet):
    """Manage webhook endpoints."""
    serializer_class = WebhookEndpointSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return WebhookEndpoint.objects.filter(company=self.request.user.company)
    
    def perform_create(self, serializer):
        # Generate webhook secret
        secret = secrets.token_urlsafe(32)
        serializer.save(
            company=self.request.user.company,
            created_by=self.request.user,
            secret=secret,
        )
    
    @action(detail=True, methods=['post'])
    def test(self, request, pk=None):
        """Send a test webhook."""
        webhook = self.get_object()
        
        payload = {
            'event': 'test',
            'timestamp': timezone.now().isoformat(),
            'data': {'message': 'This is a test webhook'}
        }
        
        delivery = WebhookDelivery.objects.create(
            webhook=webhook,
            event_type='test',
            payload=payload,
        )
        
        # Send synchronously for testing
        from .signals import send_webhook_sync
        send_webhook_sync(str(delivery.id))
        
        delivery.refresh_from_db()
        return Response(WebhookDeliverySerializer(delivery).data)
    
    @action(detail=True, methods=['get'])
    def deliveries(self, request, pk=None):
        """Get delivery history for a webhook."""
        webhook = self.get_object()
        deliveries = webhook.deliveries.all()[:50]
        return Response(WebhookDeliverySerializer(deliveries, many=True).data)
    
    @action(detail=True, methods=['post'])
    def regenerate_secret(self, request, pk=None):
        """Regenerate webhook secret."""
        webhook = self.get_object()
        webhook.secret = secrets.token_urlsafe(32)
        webhook.save(update_fields=['secret'])
        return Response({'secret': webhook.secret})
