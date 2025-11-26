from rest_framework import serializers
from .models import Order, OrderItem
from Products.serializers import ProductSerializer
from Products.models import Product
from Coupons.models import Coupon, CouponUsage
from django.db import transaction

class OrderItemSerializer(serializers.ModelSerializer):
    product_title = serializers.ReadOnlyField(source='product.title')
    product_image = serializers.ReadOnlyField(source='product.image')

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_title', 'product_image', 'quantity', 'price']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
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
            'total_amount', 'status', 'payment_method', 'created_at', 'items', 'items_data',
            'coupon_code'
        ]
        read_only_fields = ['user', 'created_at', 'status']

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
