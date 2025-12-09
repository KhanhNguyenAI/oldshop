from rest_framework import serializers
from .return_models import ReturnRequest, ReturnItem
from .models import Order, OrderItem
from Products.serializers import ProductSerializer
from django.utils import timezone
from decimal import Decimal

class ReturnItemSerializer(serializers.ModelSerializer):
    order_item_id = serializers.IntegerField(source='order_item.id', read_only=True)
    product_title = serializers.CharField(source='order_item.product.title', read_only=True)
    product_image = serializers.CharField(source='order_item.product.image', read_only=True, allow_null=True)
    product_id = serializers.UUIDField(source='order_item.product.id', read_only=True, allow_null=True)
    original_price = serializers.DecimalField(source='order_item.price', max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = ReturnItem
        fields = [
            'id', 'order_item_id', 'product_id', 'product_title', 'product_image',
            'quantity', 'original_condition', 'days_since_delivery',
            'baseline_refund_percent', 'baseline_refund_amount',
            'final_refund_percent', 'final_refund_amount',
            'condition_at_return', 'status', 'admin_notes', 'original_price',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'original_condition', 'days_since_delivery',
            'baseline_refund_percent', 'baseline_refund_amount',
            'final_refund_percent', 'final_refund_amount',
            'status', 'created_at', 'updated_at'
        ]


class ReturnRequestSerializer(serializers.ModelSerializer):
    items = ReturnItemSerializer(many=True, read_only=True)
    order_id = serializers.UUIDField(source='order.id', read_only=True)
    order_total = serializers.DecimalField(source='order.total_amount', max_digits=10, decimal_places=2, read_only=True)
    order_status = serializers.CharField(source='order.status', read_only=True)
    fault_confirmed_by_email = serializers.EmailField(source='fault_confirmed_by.email', read_only=True, allow_null=True)
    
    # Order field - accepts UUID string and converts to Order object
    order = serializers.PrimaryKeyRelatedField(
        queryset=Order.objects.all(),
        write_only=False  # Allow read and write
    )
    
    # Write-only fields for creating return request
    items_data = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=True,
        help_text="List of order items to return: [{'order_item_id': 1, 'quantity': 1}]"
    )
    
    class Meta:
        model = ReturnRequest
        fields = [
            'id', 'order', 'order_id', 'order_total', 'order_status',
            'user', 'status', 'return_type', 'reason', 'reason_detail',
            'images', 'fault_type', 'fault_confirmed_by', 'fault_confirmed_by_email',
            'fault_confirmed_at', 'fault_notes', 'days_since_delivery',
            'baseline_refund_amount', 'baseline_refund_percent',
            'final_refund_amount', 'final_refund_percent',
            'return_shipping_label', 'tracking_number', 'shipping_cost',
            'admin_notes', 'rejected_reason', 'items', 'items_data',
            'created_at', 'updated_at', 'requested_at'
        ]
        read_only_fields = [
            'id', 'user', 'status', 'fault_type', 'fault_confirmed_by',
            'fault_confirmed_at', 'days_since_delivery',
            'baseline_refund_amount', 'baseline_refund_percent',
            'final_refund_amount', 'final_refund_percent',
            'return_shipping_label', 'tracking_number', 'admin_notes',
            'rejected_reason', 'created_at', 'updated_at', 'requested_at'
        ]

    def validate(self, data):
        order = data.get('order')
        items_data = data.get('items_data', [])
        user = self.context['request'].user
        
        if not order:
            raise serializers.ValidationError({"order": "Order is required"})
        
        # Check if order belongs to current user
        if order.user != user:
            raise serializers.ValidationError({"order": "You can only create return requests for your own orders"})
        
        # Check if order is delivered
        if order.status != 'delivered':
            raise serializers.ValidationError({"order": "Chỉ có thể hoàn trả đơn hàng đã được giao (delivered)"})
        
        # Auto-set delivered_at if missing (for old orders that were marked as delivered before this field existed)
        if not order.delivered_at:
            # Use updated_at as fallback, or current time if updated_at is also missing
            order.delivered_at = order.updated_at if order.updated_at else timezone.now()
            order.save(update_fields=['delivered_at'])
        
        # Check if items_data is provided
        if not items_data:
            raise serializers.ValidationError({"items_data": "Vui lòng chọn ít nhất một sản phẩm để hoàn trả"})
        
        # Validate each item
        for idx, item_data in enumerate(items_data):
            order_item_id = item_data.get('order_item_id')
            quantity = item_data.get('quantity', 1)
            
            if not order_item_id:
                raise serializers.ValidationError({"items_data": f"Item {idx + 1}: order_item_id is required"})
            
            try:
                order_item = OrderItem.objects.get(id=order_item_id, order=order)
            except OrderItem.DoesNotExist:
                raise serializers.ValidationError({"items_data": f"Item {idx + 1}: Order item {order_item_id} không tồn tại trong đơn hàng này"})
            
            if quantity > order_item.quantity:
                raise serializers.ValidationError({"items_data": f"Item {idx + 1}: Số lượng hoàn trả ({quantity}) không thể lớn hơn số lượng đã mua ({order_item.quantity})"})
            
            # Check if product condition is poor (cannot return unless shop_fault)
            if order_item.product and order_item.product.condition == 'poor':
                # Allow but will be reviewed by admin
                pass
        
        return data

    def create(self, validated_data):
        order = validated_data['order']
        items_data = validated_data.pop('items_data')
        user = self.context['request'].user
        
        # Calculate days since delivery (delivered_at is required, validated above)
        days_since = (timezone.now() - order.delivered_at).days
        
        # Create return request
        return_request = ReturnRequest.objects.create(
            order=order,
            user=user,
            reason=validated_data['reason'],
            reason_detail=validated_data.get('reason_detail', ''),
            images=validated_data.get('images', []),
            return_type=validated_data.get('return_type', 'full'),
            days_since_delivery=days_since
        )
        
        # Calculate total baseline refund
        total_baseline_amount = Decimal('0')
        total_baseline_percent = Decimal('0')
        
        # Create return items
        for item_data in items_data:
            order_item_id = item_data['order_item_id']
            quantity = item_data.get('quantity', 1)
            
            order_item = OrderItem.objects.get(id=order_item_id, order=order)
            
            # Calculate baseline refund for this item
            baseline_amount, baseline_percent = ReturnRequest.calculate_baseline_refund(
                order_item, days_since
            )
            
            # Create return item
            return_item = ReturnItem.objects.create(
                return_request=return_request,
                order_item=order_item,
                quantity=quantity,
                original_condition=order_item.product.condition if order_item.product else 'unknown',
                days_since_delivery=days_since,
                baseline_refund_amount=baseline_amount,
                baseline_refund_percent=baseline_percent
            )
            
            total_baseline_amount += baseline_amount
            if baseline_percent > total_baseline_percent:
                total_baseline_percent = baseline_percent
        
        # Update return request with total baseline
        return_request.baseline_refund_amount = total_baseline_amount
        return_request.baseline_refund_percent = total_baseline_percent
        return_request.save()
        
        return return_request


class ReturnRequestListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list view"""
    order_id = serializers.UUIDField(source='order.id', read_only=True)
    items_count = serializers.SerializerMethodField()
    items = serializers.SerializerMethodField()  # Add items as empty array for list view
    
    class Meta:
        model = ReturnRequest
        fields = [
            'id', 'order_id', 'status', 'return_type', 'reason',
            'fault_type', 'baseline_refund_amount', 'baseline_refund_percent',
            'final_refund_amount', 'final_refund_percent',
            'days_since_delivery', 'items_count', 'items', 'created_at'
        ]
    
    def get_items_count(self, obj):
        return obj.items.count()
    
    def get_items(self, obj):
        # Return empty array for list view to avoid loading all items
        return []

