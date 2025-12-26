from rest_framework import status, generics, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, get_user_model
from .models import Company, Notification, NotificationPreference, WebhookIntegration, CalendarIntegration
from .serializers import (
    UserSerializer, UserCreateSerializer, UserProfileSerializer,
    CompanySerializer, NotificationSerializer, TeamMemberSerializer,
    NotificationPreferenceSerializer, WebhookIntegrationSerializer,
    CalendarIntegrationSerializer
)
from .permissions import IsAdmin, IsManager, CanManageCompany, CanManageUsers

User = get_user_model()


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Register a new user."""
    serializer = UserCreateSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Login user and return JWT tokens."""
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not email or not password:
        return Response(
            {'error': 'Please provide both email and password'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = authenticate(request, username=email, password=password)
    
    if user is not None:
        if not user.is_active:
            return Response(
                {'error': 'Account is disabled'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        })
    
    return Response(
        {'error': 'Invalid credentials'},
        status=status.HTTP_401_UNAUTHORIZED
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    """Get current authenticated user."""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """Update user profile."""
    serializer = UserProfileSerializer(
        request.user,
        data=request.data,
        partial=True
    )
    if serializer.is_valid():
        serializer.save()
        return Response(UserSerializer(request.user).data)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserViewSet(viewsets.ModelViewSet):
    """ViewSet for managing users."""
    
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, CanManageUsers]
    
    def get_queryset(self):
        """Filter users based on role."""
        user = self.request.user
        
        if user.is_admin:
            # Admin sees all users in their company
            return User.objects.filter(company=user.company)
        elif user.is_manager:
            # Manager sees their team members
            return user.team_members.all()
        else:
            # Employee sees only themselves
            return User.objects.filter(id=user.id)
    
    @action(detail=False, methods=['get'])
    def team_members(self, request):
        """Get list of team members for the current user."""
        if request.user.is_manager:
            team = request.user.team_members.all()
            serializer = TeamMemberSerializer(team, many=True)
            return Response(serializer.data)
        
        return Response(
            {'detail': 'Only managers can view team members'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    @action(detail=False, methods=['get'])
    def employees(self, request):
        """Get list of employees in the company."""
        if request.user.is_admin or request.user.is_manager:
            employees = User.objects.filter(
                company=request.user.company,
                role='employee'
            )
            serializer = TeamMemberSerializer(employees, many=True)
            return Response(serializer.data)
        
        return Response(
            {'detail': 'Only admins and managers can view employees'},
            status=status.HTTP_403_FORBIDDEN
        )


class CompanyViewSet(viewsets.ModelViewSet):
    """ViewSet for managing company."""
    
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [IsAuthenticated, CanManageCompany]
    
    def get_queryset(self):
        """Users can only see their own company."""
        return Company.objects.filter(id=self.request.user.company.id)


class NotificationViewSet(viewsets.ModelViewSet):
    """ViewSet for user notifications."""
    
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Users can only see their own notifications."""
        return Notification.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def unread(self, request):
        """Get unread notifications."""
        unread = self.get_queryset().filter(is_read=False)
        serializer = self.get_serializer(unread, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark a notification as read."""
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'marked as read'})
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read."""
        self.get_queryset().update(is_read=True)
        return Response({'status': 'all notifications marked as read'})

    @action(detail=False, methods=['delete'])
    def clear_all(self, request):
        """Delete all notifications for the user."""
        self.get_queryset().delete()
        return Response({'status': 'all notifications cleared'}, status=status.HTTP_204_NO_CONTENT)


class NotificationPreferenceViewSet(viewsets.ModelViewSet):
    """ViewSet for notification preferences."""
    
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Users can only see their own preferences."""
        return NotificationPreference.objects.filter(user=self.request.user)
    
    def get_object(self):
        """Get or create notification preferences for the user."""
        obj, created = NotificationPreference.objects.get_or_create(user=self.request.user)
        return obj
    
    def list(self, request):
        """Get current user's notification preferences."""
        obj = self.get_object()
        serializer = self.get_serializer(obj)
        return Response(serializer.data)
    
    def create(self, request):
        """Update notification preferences (create if not exists)."""
        obj = self.get_object()
        serializer = self.get_serializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['put', 'patch'])
    def update_preferences(self, request):
        """Update notification preferences."""
        obj = self.get_object()
        serializer = self.get_serializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class WebhookIntegrationViewSet(viewsets.ModelViewSet):
    """ViewSet for webhook integrations."""
    
    serializer_class = WebhookIntegrationSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def get_queryset(self):
        """Filter webhooks by company."""
        return WebhookIntegration.objects.filter(company=self.request.user.company)
    
    def perform_create(self, serializer):
        serializer.save(company=self.request.user.company, created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def test(self, request, pk=None):
        """Send a test message to the webhook."""
        webhook = self.get_object()
        # In production, send actual test message via requests
        return Response({'status': 'test message sent', 'webhook': webhook.name})
    
    @action(detail=True, methods=['post'])
    def toggle(self, request, pk=None):
        """Toggle webhook active status."""
        webhook = self.get_object()
        webhook.is_active = not webhook.is_active
        webhook.save()
        return Response({'status': 'toggled', 'is_active': webhook.is_active})


class CalendarIntegrationViewSet(viewsets.ModelViewSet):
    """ViewSet for calendar integrations."""
    
    serializer_class = CalendarIntegrationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Users can only see their own calendar integrations."""
        return CalendarIntegration.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def sync(self, request, pk=None):
        """Trigger a sync with the calendar."""
        integration = self.get_object()
        from django.utils import timezone
        integration.last_synced = timezone.now()
        integration.save()
        return Response({'status': 'sync initiated', 'last_synced': integration.last_synced})
    
    @action(detail=True, methods=['post'])
    def disconnect(self, request, pk=None):
        """Disconnect the calendar integration."""
        integration = self.get_object()
        integration.is_active = False
        integration.access_token = ''
        integration.refresh_token = ''
        integration.save()
        return Response({'status': 'disconnected'})
