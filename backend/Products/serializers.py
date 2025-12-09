from rest_framework import serializers
from .models import Category, Product, ProductImage, Brand, ProductRating, ProductComment, CommentImage, Discount
from Users.serializers import UserSerializer
from Core.utils import upload_image_to_supabase
from django.db.models import Avg, Q
from django.utils import timezone

# Import for return status check
try:
    from Orders.models import Order, OrderItem
    from Orders.return_models import ReturnRequest, ReturnItem
except ImportError:
    Order = None
    OrderItem = None
    ReturnRequest = None
    ReturnItem = None

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'icon', 'description', 'parent']

class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = '__all__'

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image']

class ProductRatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductRating
        fields = ['id', 'score', 'created_at']
        read_only_fields = ['id', 'created_at']

class CommentImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommentImage
        fields = ['id', 'image', 'is_video']

class ProductCommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    replies = serializers.SerializerMethodField()
    images = CommentImageSerializer(many=True, read_only=True)
    
    class Meta:
        model = ProductComment
        fields = ['id', 'user', 'content', 'parent', 'replies', 'created_at', 'images']
        read_only_fields = ['id', 'user', 'created_at']

    def get_replies(self, obj):
        if obj.replies.exists():
            return ProductCommentSerializer(obj.replies.all(), many=True).data
        return []

class ProductSerializer(serializers.ModelSerializer):
    seller = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='category', write_only=True
    )
    
    # Brand support
    brand = BrandSerializer(read_only=True)
    brand_id = serializers.PrimaryKeyRelatedField(
        queryset=Brand.objects.all(), source='brand', write_only=True, required=False, allow_null=True
    )

    images = ProductImageSerializer(many=True, read_only=True)
    
    # Rating stats
    avg_rating = serializers.SerializerMethodField()
    rating_count = serializers.SerializerMethodField()

    # User's rating for this product (if authenticated)
    user_rating = serializers.SerializerMethodField()

    # Return status for current user (if authenticated)
    return_status = serializers.SerializerMethodField()

    # Write-only field for multiple images upload
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(max_length=1000000, allow_empty_file=False, use_url=False),
        write_only=True,
        required=False
    )
    
    # Write-only field for main image upload
    image_file = serializers.ImageField(write_only=True, required=False)

    # Sale Logic - New Discount System
    sale_price = serializers.SerializerMethodField()
    active_discount_percent = serializers.SerializerMethodField()
    active_discount = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'seller', 'category', 'category_id', 'brand', 'brand_id', 
            'title', 'description', 'price', 'sale_price', 'active_discount_percent', 'active_discount', 'discount_percent',
            'condition', 'condition_detail', 'specifications',
            'location', 'stock_quantity', 'sold_quantity', 'is_sold', 'is_verified',
            'created_at', 'updated_at', 'image', 'images', 'uploaded_images', 'image_file',
            'avg_rating', 'rating_count', 'user_rating', 'return_status'
        ]
        read_only_fields = ['seller', 'created_at', 'updated_at', 'is_sold', 'image', 'sale_price', 'active_discount_percent', 'active_discount']

    def get_best_discount(self, obj):
        """
        Tìm discount tốt nhất cho product theo thứ tự ưu tiên:
        1. Discount trực tiếp cho product (priority cao nhất)
        2. Discount cho category của product
        3. Discount cho parent category
        4. Fallback về discount_percent cũ nếu không có discount mới
        """
        now = timezone.now()
        best_discount = None
        best_priority = -1
        applied_from = None
        
        # 1. Check discounts trực tiếp cho product
        product_discounts = Discount.objects.filter(
            products=obj,
            is_active=True,
            start_date__lte=now
        ).filter(
            Q(end_date__isnull=True) | Q(end_date__gte=now)
        ).order_by('-priority', '-value')
        
        for discount in product_discounts:
            if discount.priority > best_priority:
                best_discount = discount
                best_priority = discount.priority
                applied_from = 'product'
        
        # 2. Check discounts cho category
        category_discounts = Discount.objects.filter(
            categories=obj.category,
            is_active=True,
            start_date__lte=now
        ).filter(
            Q(end_date__isnull=True) | Q(end_date__gte=now)
        ).order_by('-priority', '-value')
        
        for discount in category_discounts:
            if discount.priority > best_priority:
                best_discount = discount
                best_priority = discount.priority
                applied_from = 'category'
        
        # 3. Check discounts cho parent category
        if obj.category.parent:
            parent_discounts = Discount.objects.filter(
                parent_category=obj.category.parent,
                is_active=True,
                start_date__lte=now
            ).filter(
                Q(end_date__isnull=True) | Q(end_date__gte=now)
            ).order_by('-priority', '-value')
            
            for discount in parent_discounts:
                if discount.priority > best_priority:
                    best_discount = discount
                    best_priority = discount.priority
                    applied_from = 'parent_category'
        
        return best_discount, applied_from

    def get_active_discount(self, obj):
        """Trả về thông tin discount đang active"""
        best_discount, applied_from = self.get_best_discount(obj)
        
        if best_discount:
            return {
                'id': best_discount.id,
                'name': best_discount.name,
                'type': best_discount.discount_type,
                'value': float(best_discount.value),
                'applied_from': applied_from,
                'start_date': best_discount.start_date.isoformat() if best_discount.start_date else None,
                'end_date': best_discount.end_date.isoformat() if best_discount.end_date else None,
            }
        
        # Fallback về discount_percent cũ nếu không có discount mới
        old_discount_percent = self._get_old_discount_percent(obj)
        if old_discount_percent > 0:
            return {
                'id': None,
                'name': 'Legacy Discount',
                'type': 'percent',
                'value': old_discount_percent,
                'applied_from': self._get_old_discount_source(obj),
            }
        
        return None

    def _get_old_discount_percent(self, obj):
        """Lấy discount_percent cũ (backward compatibility)"""
        # 1. Product specific discount
        if obj.discount_percent > 0:
            return obj.discount_percent
            
        # 2. Category specific discount
        if obj.category.discount_percent > 0:
            return obj.category.discount_percent
            
        # 3. Parent Category specific discount
        if obj.category.parent and obj.category.parent.discount_percent > 0:
            return obj.category.parent.discount_percent
            
        return 0

    def _get_old_discount_source(self, obj):
        """Xác định nguồn discount cũ"""
        if obj.discount_percent > 0:
            return 'product'
        if obj.category.discount_percent > 0:
            return 'category'
        if obj.category.parent and obj.category.parent.discount_percent > 0:
            return 'parent_category'
        return None

    def get_active_discount_percent(self, obj):
        """Trả về phần trăm giảm giá (backward compatibility)"""
        best_discount, _ = self.get_best_discount(obj)
        
        if best_discount:
            if best_discount.discount_type == 'percent':
                return float(best_discount.value)
            else:  # amount - convert to percent for backward compatibility
                original_price = float(obj.price)
                if original_price > 0:
                    discount_percent = (float(best_discount.value) / original_price) * 100
                    return min(100, discount_percent)  # Cap at 100%
                return 0
        
        # Fallback về discount_percent cũ
        return self._get_old_discount_percent(obj)

    def get_sale_price(self, obj):
        """Tính giá sau khi giảm"""
        best_discount, _ = self.get_best_discount(obj)
        
        if best_discount:
            final_price = best_discount.calculate_final_price(obj.price)
            return round(final_price, 2)
        
        # Fallback về logic cũ
        discount_percent = self._get_old_discount_percent(obj)
        if discount_percent > 0:
            discounted_price = float(obj.price) * (1 - discount_percent / 100)
            return round(discounted_price, 2)
        
        return None

    def get_avg_rating(self, obj):
        avg = obj.ratings.aggregate(Avg('score'))['score__avg']
        return round(avg, 1) if avg else 0

    def get_rating_count(self, obj):
        return obj.ratings.count()

    def get_user_rating(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                rating = ProductRating.objects.get(user=request.user, product=obj)
                return rating.score
            except ProductRating.DoesNotExist:
                return None
        return None

    def get_return_status(self, obj):
        """
        Check return status for current user's orders containing this product.
        Returns: 'delivered' | 'returning' | 'returned' | None
        """
        if not Order or not ReturnRequest:
            return None
            
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        
        try:
            # Find orders containing this product for current user
            order_items = OrderItem.objects.filter(
                product=obj,
                order__user=request.user
            ).select_related('order')
            
            # Check for delivered orders
            delivered_orders = [item.order for item in order_items if item.order.status == 'delivered']
            
            if not delivered_orders:
                return None
            
            # Check for return requests
            has_returning = False
            has_returned = False
            
            for order in delivered_orders:
                # Get order items for this product
                product_order_items = OrderItem.objects.filter(
                    order=order,
                    product=obj
                )
                
                # Check return requests that include these order items
                for order_item in product_order_items:
                    return_items = ReturnItem.objects.filter(order_item=order_item)
                    for return_item in return_items:
                        return_request = return_item.return_request
                        if return_request.status in ['pending', 'under_review', 'approved', 'shipping', 'received', 'processing']:
                            has_returning = True
                        elif return_request.status == 'completed':
                            has_returned = True
            
            # Priority: returning > returned > delivered
            if has_returning:
                return 'returning'
            elif has_returned:
                return 'returned'
            else:
                # If delivered but no return request, return 'delivered'
                return 'delivered'
            
        except Exception as e:
            # Log error but don't fail
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error getting return status: {str(e)}")
            return None

    def create(self, validated_data):
        uploaded_images = validated_data.pop('uploaded_images', [])
        image_file = validated_data.pop('image_file', None)
        
        # 1. Handle main image upload
        if image_file:
            try:
                main_image_url = upload_image_to_supabase(image_file, folder='products_cover')
                validated_data['image'] = main_image_url
            except Exception as e:
                # Log error but continue creating product? Or fail?
                # For now, let's raise validation error
                raise serializers.ValidationError({"image_file": f"Failed to upload image: {str(e)}"})

        # Create product
        product = Product.objects.create(**validated_data)
        
        # 2. Handle additional images upload
        for img_file in uploaded_images:
            try:
                url = upload_image_to_supabase(img_file, folder='products_image')
                ProductImage.objects.create(product=product, image=url)
            except Exception as e:
                # Log error and skip this image
                print(f"Failed to upload product image: {e}")
            
        return product
