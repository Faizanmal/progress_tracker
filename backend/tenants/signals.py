"""
Signals for tenant management.
"""
from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver

from users.models import Company, User
from .models import Tenant, TenantUsageStats


@receiver(post_save, sender=Company)
def create_tenant_for_company(sender, instance, created, **kwargs):
    """Create a tenant when a company is created."""
    if created:
        # Generate slug from company name
        from django.utils.text import slugify
        base_slug = slugify(instance.name)[:90]
        slug = base_slug
        counter = 1
        
        while Tenant.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
        
        Tenant.objects.create(
            company=instance,
            slug=slug,
            subdomain=slug,
        )


@receiver(post_save, sender=User)
def update_tenant_user_count(sender, instance, created, **kwargs):
    """Update tenant user count when user is added."""
    if created and instance.company:
        try:
            tenant = instance.company.tenant
            tenant.current_users = User.objects.filter(
                company=instance.company,
                is_active=True
            ).count()
            tenant.save(update_fields=['current_users'])
        except Tenant.DoesNotExist:
            pass


@receiver(pre_delete, sender=User)
def decrement_tenant_user_count(sender, instance, **kwargs):
    """Update tenant user count when user is removed."""
    if instance.company:
        try:
            tenant = instance.company.tenant
            tenant.current_users = max(0, tenant.current_users - 1)
            tenant.save(update_fields=['current_users'])
        except Tenant.DoesNotExist:
            pass
