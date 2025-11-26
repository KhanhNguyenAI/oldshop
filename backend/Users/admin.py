from django.contrib import admin
from .models import User, RefreshToken, OTP, UserProfile, PaymentMethod, Address

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['email', 'is_email_verified', 'is_active', 'created_at']
    list_filter = ['is_active', 'is_email_verified', 'created_at']
    search_fields = ['email']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'full_name', 'phone_number']
    search_fields = ['user__email', 'full_name', 'phone_number']

@admin.register(PaymentMethod)
class PaymentMethodAdmin(admin.ModelAdmin):
    list_display = ['user', 'brand', 'last4', 'is_default', 'is_active', 'created_at']
    list_filter = ['brand', 'is_default', 'is_active']
    search_fields = ['user__email', 'last4']

@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ['user', 'recipient', 'postal_code', 'prefecture', 'city', 'is_default']
    list_filter = ['prefecture', 'is_default']
    search_fields = ['user__email', 'recipient', 'postal_code', 'city', 'phone']

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
