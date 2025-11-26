from django.contrib import admin
from .models import Coupon, CouponUsage

class CouponAdmin(admin.ModelAdmin):
    list_display = ('code', 'discount_type', 'get_discount_display', 'min_order_value', 'is_public', 'start_date', 'end_date', 'is_active', 'used_count')
    list_filter = ('discount_type', 'is_active', 'is_public', 'start_date', 'end_date')
    search_fields = ('code', 'description')
    filter_horizontal = ('applicable_categories', 'applicable_products')
    readonly_fields = ('used_count',)

    fieldsets = (
        ('Basic Info', {
            'fields': ('code', 'description', 'is_active', 'is_public')
        }),
        ('Discount', {
            'fields': ('discount_type', 'discount_percent', 'discount_amount', 'max_discount')
        }),
        ('Limits & Conditions', {
            'fields': ('min_order_value', 'usage_limit', 'usage_limit_per_user', 'applicable_categories', 'applicable_products')
        }),
        ('Timing', {
            'fields': ('start_date', 'end_date')
        }),
        ('Stats', {
            'fields': ('used_count',)
        }),
    )

admin.site.register(Coupon, CouponAdmin)
admin.site.register(CouponUsage)
