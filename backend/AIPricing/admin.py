from django.contrib import admin
from .models import PricingRequest, PricingCache


@admin.register(PricingRequest)
class PricingRequestAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'title', 'category', 'brand', 'status', 'suggested_price', 'created_at']
    list_filter = ['status', 'condition', 'created_at']
    search_fields = ['title', 'category', 'brand', 'description', 'user__email']
    readonly_fields = ['id', 'created_at', 'updated_at', 'validation_result', 'pricing_result']
    fieldsets = (
        ('Thông tin cơ bản', {
            'fields': ('id', 'user', 'status', 'created_at', 'updated_at')
        }),
        ('Thông tin sản phẩm', {
            'fields': ('title', 'category', 'brand', 'description', 'original_price', 'condition', 'image_urls')
        }),
        ('Kết quả xác thực', {
            'fields': ('validation_result',)
        }),
        ('Kết quả định giá', {
            'fields': ('pricing_result', 'suggested_price', 'price_min', 'price_max', 
                      'confidence_score', 'pricing_reasoning')
        }),
        ('Lỗi', {
            'fields': ('error_message',)
        }),
    )


@admin.register(PricingCache)
class PricingCacheAdmin(admin.ModelAdmin):
    list_display = ['cache_key', 'category', 'brand', 'condition', 'suggested_price', 'hit_count', 'last_used_at']
    list_filter = ['condition', 'created_at']
    search_fields = ['category', 'brand', 'cache_key']
    readonly_fields = ['cache_key', 'created_at', 'last_used_at', 'hit_count']
    ordering = ['-hit_count', '-last_used_at']
