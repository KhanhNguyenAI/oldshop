from django.contrib import admin
from .models import FreeItem, FreeItemImage, FreeItemMessage, FreeItemView


@admin.register(FreeItem)
class FreeItemAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'status', 'show_email', 'location_prefecture', 'location_city', 'views_count', 'created_at']
    list_filter = ['status', 'condition', 'show_email', 'location_prefecture', 'created_at']
    search_fields = ['title', 'description', 'user__email']
    readonly_fields = ['id', 'views_count', 'created_at', 'updated_at']
    date_hierarchy = 'created_at'


@admin.register(FreeItemImage)
class FreeItemImageAdmin(admin.ModelAdmin):
    list_display = ['free_item', 'order', 'created_at']
    list_filter = ['created_at']
    search_fields = ['free_item__title']


@admin.register(FreeItemView)
class FreeItemViewAdmin(admin.ModelAdmin):
    list_display = ['free_item', 'user', 'ip_address', 'created_at']
    list_filter = ['created_at']
    search_fields = ['free_item__title', 'user__email', 'ip_address']
    readonly_fields = ['id', 'created_at']
    date_hierarchy = 'created_at'


@admin.register(FreeItemMessage)
class FreeItemMessageAdmin(admin.ModelAdmin):
    list_display = ['free_item', 'sender', 'receiver', 'is_read', 'created_at']
    list_filter = ['is_read', 'created_at']
    search_fields = ['message', 'sender__email', 'receiver__email', 'free_item__title']
    readonly_fields = ['id', 'created_at']
    date_hierarchy = 'created_at'
