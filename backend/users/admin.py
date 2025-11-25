from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Role

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "short_description")
    search_fields = ("name",)
    
    def short_description(self, obj):
        if not obj.description:
            return "-"
        return (obj.description[:60] + "...") if len(obj.description) > 60 else obj.description
    
    
class UserAdmin(BaseUserAdmin):
    """
    Konfiguracja panelu admina dla customowego modelu User.
    Oparta o wbudowany UserAdmin, ale z email jako username_field.
    """
    ordering = ("email",)
    list_display = ("email", "first_name", "last_name", "role", "is_staff", "is_active")
    list_filter = ("role", "is_staff", "is_active")
    
    readonly_fields = ("date_joined",)

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal info", {"fields": ("first_name", "last_name", "role")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Important dates", {"fields": ("last_login",),},),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "password1", "password2", "role", "is_staff", "is_active"),
            },
        ),
    )

    search_fields = ("email", "first_name", "last_name")


admin.site.register(User, UserAdmin)