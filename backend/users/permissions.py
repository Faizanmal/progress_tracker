from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """Permission class for admin users."""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_admin


class IsManager(permissions.BasePermission):
    """Permission class for manager users."""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            request.user.is_admin or request.user.is_manager
        )


class IsEmployee(permissions.BasePermission):
    """Permission class for employee users (all authenticated users)."""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated


class IsOwnerOrManager(permissions.BasePermission):
    """
    Permission to only allow owners of an object or managers to edit it.
    Assumes the model instance has a `user` or `assigned_to` attribute.
    """
    
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed for any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Admin can do anything
        if request.user.is_admin:
            return True
        
        # Check if user is the owner
        if hasattr(obj, 'user'):
            if obj.user == request.user:
                return True
        
        if hasattr(obj, 'assigned_to'):
            if obj.assigned_to == request.user:
                return True
        
        # Check if user is a manager of the owner
        if request.user.is_manager:
            if hasattr(obj, 'user') and obj.user.manager == request.user:
                return True
            if hasattr(obj, 'assigned_to') and obj.assigned_to and obj.assigned_to.manager == request.user:
                return True
        
        return False


class CanManageCompany(permissions.BasePermission):
    """Permission to manage company settings - admin only."""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_admin
    
    def has_object_permission(self, request, view, obj):
        # Admin can only manage their own company
        return request.user.is_admin and request.user.company == obj


class CanManageUsers(permissions.BasePermission):
    """Permission to manage users - admin and managers can add/edit users."""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            request.user.is_admin or request.user.is_manager
        )
    
    def has_object_permission(self, request, view, obj):
        # Admin can manage all users in their company
        if request.user.is_admin:
            return request.user.company == obj.company
        
        # Managers can only view/manage their team members
        if request.user.is_manager:
            return obj in request.user.team_members.all() or obj == request.user
        
        return False


class CanViewTeamProgress(permissions.BasePermission):
    """Permission to view team progress - managers can view their team's progress."""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            request.user.is_admin or request.user.is_manager
        )
    
    def has_object_permission(self, request, view, obj):
        # Admin can view all company progress
        if request.user.is_admin:
            return True
        
        # Managers can view their team's progress
        if request.user.is_manager:
            if hasattr(obj, 'user'):
                return obj.user.manager == request.user
            if hasattr(obj, 'assigned_to'):
                return obj.assigned_to and obj.assigned_to.manager == request.user
        
        return False
