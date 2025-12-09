from rest_framework import serializers
from .models import Order, OrderItem
from Products.serializers import ProductSerializer
from Products.models import Product
from Coupons.models import Coupon, CouponUsage
from django.db import transaction
from .return_models import ReturnRequest

class OrderItemSerializer(serializers.ModelSerializer):
    product_title = serializers.ReadOnlyField(source='product.title')
    product_image = serializers.ReadOnlyField(source='product.image')
    product_condition = serializers.CharField(source='product.condition', read_only=True, allow_null=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_title', 'product_image', 'product_condition', 'quantity', 'price']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    has_active_return = serializers.SerializerMethodField()
    # Write-only field to accept items payload
    items_data = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False
    )
    coupon_code = serializers.CharField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Order
        fields = [
            'id', 'user', 'full_name', 'email', 'phone', 'address', 'postal_code', 'city',
            'total_amount', 'status', 'payment_method', 'payment_deadline', 'created_at', 'items', 'items_data',
            'coupon_code', 'has_active_return'
        ]
        read_only_fields = ['user', 'created_at', 'status', 'has_active_return']
    
    def get_has_active_return(self, obj):
        """Check if order has active return request (pending, under_review, approved, shipping)"""
        return ReturnRequest.objects.filter(
            order=obj,
            status__in=['pending', 'under_review', 'approved', 'shipping']
        ).exists()

    def validate(self, data):
        """Validate that address is in Tokyo for delivery"""
        city_field = data.get('city', '') or ''
        
        # Check if city field contains Tokyo (city field contains prefecture + city + district)
        tokyo_keywords = ['東京都', 'Tokyo', 'tokyo', 'TOKYO']
        is_tokyo = any(keyword in city_field for keyword in tokyo_keywords)
        
        # Only validate if city field is provided and not empty
        if city_field and not is_tokyo:
            raise serializers.ValidationError({
                'city': '東京都外のため配送不可です。直接取引のみ対応可能です。お問い合わせページからご連絡ください。'
            })
        
        return data

    def create(self, validated_data):
        items_data = validated_data.pop('items_data', [])
        coupon_code = validated_data.pop('coupon_code', None)
        
        with transaction.atomic():
            order = Order.objects.create(**validated_data)
            
            # Handle Coupon Usage
            if coupon_code:
                try:
                    coupon = Coupon.objects.get(code=coupon_code)
                    # Validate again to be safe
                    if coupon.is_valid():
                        # Check user limit
                        user_usage = CouponUsage.objects.filter(user=order.user, coupon=coupon).count()
                        if user_usage < coupon.usage_limit_per_user:
                            CouponUsage.objects.create(
                                user=order.user,
                                coupon=coupon,
                                order=order
                            )
                            coupon.used_count += 1
                            coupon.save()
                except Coupon.DoesNotExist:
                    pass # Or log error

            for item_data in items_data:
                # item_data structure: { product: id, quantity: 1, price: 1000 }
                product_id = item_data.pop('product')
                quantity = item_data.get('quantity', 1)
                
                # Create OrderItem
                OrderItem.objects.create(order=order, product_id=product_id, **item_data)
                
                # Update Product Stock
                try:
                    product = Product.objects.select_for_update().get(id=product_id)
                    if product.stock_quantity >= quantity:
                        product.stock_quantity -= quantity
                        product.sold_quantity += quantity
                        
                        # Automatically mark as sold if stock reaches 0
                        if product.stock_quantity == 0:
                            product.is_sold = True
                            
                        product.save()
                    else:
                        raise serializers.ValidationError(f"商品 '{product.title}' の在庫が不足しています。")
                except Product.DoesNotExist:
                    pass 
            
        return order
