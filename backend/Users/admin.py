from django.contrib import admin
from .models import User, RefreshToken, OTP


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['email', 'is_email_verified', 'is_active', 'created_at']
    list_filter = ['is_active', 'is_email_verified', 'created_at']
    search_fields = ['email']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(RefreshToken)
class RefreshTokenAdmin(admin.ModelAdmin):
    list_display = ['user', 'token', 'is_revoked', 'expires_at', 'created_at']
    list_filter = ['is_revoked', 'expires_at']
    search_fields = ['user__email', 'token']
    readonly_fields = ['created_at']


@admin.register(OTP)
class OTPAdmin(admin.ModelAdmin):
    list_display = ['email', 'is_used', 'expires_at', 'created_at']
    list_filter = ['is_used', 'expires_at']
    search_fields = ['email']
    readonly_fields = ['created_at']
