"""
Middleware for multi-tenant support.
"""
from django.http import Http404
from django.utils.deprecation import MiddlewareMixin


class TenantMiddleware(MiddlewareMixin):
    """
    Middleware to identify and set the current tenant based on subdomain or header.
    """
    
    def process_request(self, request):
        from tenants.models import Tenant
        
        tenant = None
        
        # Try to get tenant from X-Tenant-ID header (for API access)
        tenant_id = request.META.get('HTTP_X_TENANT_ID')
        if tenant_id:
            try:
                tenant = Tenant.objects.select_related('company').get(id=tenant_id)
            except (Tenant.DoesNotExist, ValueError):
                pass
        
        # Try subdomain if no header
        if not tenant:
            host = request.get_host().split(':')[0]
            subdomain = host.split('.')[0] if '.' in host else None
            
            if subdomain and subdomain not in ['www', 'api', 'localhost']:
                try:
                    tenant = Tenant.objects.select_related('company').get(subdomain=subdomain)
                except Tenant.DoesNotExist:
                    pass
        
        # Try custom domain
        if not tenant:
            host = request.get_host().split(':')[0]
            try:
                tenant = Tenant.objects.select_related('company').get(custom_domain=host)
            except Tenant.DoesNotExist:
                pass
        
        # Set tenant on request
        request.tenant = tenant
        
        # If authenticated, verify user belongs to tenant
        if tenant and hasattr(request, 'user') and request.user.is_authenticated:
            if request.user.company_id != tenant.company_id:
                # User doesn't belong to this tenant
                request.tenant = None
        
        return None
    
    def process_response(self, request, response):
        # Add tenant info to response headers for debugging
        if hasattr(request, 'tenant') and request.tenant:
            response['X-Tenant-ID'] = str(request.tenant.id)
        return response


class TenantQuerysetMiddleware(MiddlewareMixin):
    """
    Middleware to automatically filter querysets by tenant.
    """
    
    def process_view(self, request, view_func, view_args, view_kwargs):
        if hasattr(request, 'tenant') and request.tenant:
            # Store tenant in thread local for model managers
            from threading import local
            _thread_locals = local()
            _thread_locals.tenant = request.tenant
        return None
