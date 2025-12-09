from django.contrib import admin
from .models import Order, OrderItem
from .return_models import ReturnRequest, ReturnItem

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['product', 'quantity', 'price']

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'total_amount', 'status', 'created_at', 'delivered_at')
    list_filter = ('status', 'created_at')
    search_fields = ('user__email', 'id', 'full_name')
    inlines = [OrderItemInline]
    readonly_fields = ('created_at', 'updated_at', 'delivered_at')
    list_editable = ('status',) # Allow quick status update
    
    def save_model(self, request, obj, form, change):
        # Automatically set delivered_at when status changes to 'delivered'
        if obj.status == 'delivered' and not obj.delivered_at:
            from django.utils import timezone
            obj.delivered_at = timezone.now()
        super().save_model(request, obj, form, change)

class ReturnItemInline(admin.TabularInline):
    model = ReturnItem
    extra = 0
    readonly_fields = ['order_item', 'quantity', 'original_condition', 'days_since_delivery',
                       'baseline_refund_amount', 'baseline_refund_percent',
                       'final_refund_amount', 'final_refund_percent', 'status']

@admin.register(ReturnRequest)
class ReturnRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'order', 'user', 'status', 'fault_type', 'baseline_refund_amount', 
                    'final_refund_amount', 'created_at')
    list_filter = ('status', 'fault_type', 'return_type', 'created_at')
    search_fields = ('user__email', 'order__id', 'id', 'reason')
    inlines = [ReturnItemInline]
    readonly_fields = ('id', 'created_at', 'updated_at', 'requested_at', 'days_since_delivery',
                       'baseline_refund_amount', 'baseline_refund_percent',
                       'fault_confirmed_at')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'order', 'user', 'status', 'return_type', 'reason', 'reason_detail', 'images')
        }),
        ('Fault Confirmation', {
            'fields': ('fault_type', 'fault_confirmed_by', 'fault_confirmed_at', 'fault_notes')
        }),
        ('Refund Calculation', {
            'fields': ('days_since_delivery', 'baseline_refund_amount', 'baseline_refund_percent',
                      'final_refund_amount', 'final_refund_percent')
        }),
        ('Shipping', {
            'fields': ('return_shipping_label', 'tracking_number', 'shipping_cost')
        }),
        ('Admin', {
            'fields': ('admin_notes', 'rejected_reason')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'requested_at')
        }),
    )
