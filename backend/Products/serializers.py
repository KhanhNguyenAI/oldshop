from rest_framework import serializers
from .models import Category, Product, ProductImage, Brand, ProductRating, ProductComment
from Users.serializers import UserSerializer
from Core.utils import upload_image_to_supabase
from django.db.models import Avg

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

class ProductCommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    replies = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductComment
        fields = ['id', 'user', 'content', 'parent', 'replies', 'created_at']
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

    # Write-only field for multiple images upload
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(max_length=1000000, allow_empty_file=False, use_url=False),
        write_only=True,
        required=False
    )
    
    # Write-only field for main image upload
    image_file = serializers.ImageField(write_only=True, required=False)

    # Sale Logic
    sale_price = serializers.SerializerMethodField()
    active_discount_percent = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'seller', 'category', 'category_id', 'brand', 'brand_id', 
            'title', 'description', 'price', 'sale_price', 'active_discount_percent', 'discount_percent',
            'condition', 'condition_detail', 'specifications',
            'location', 'stock_quantity', 'sold_quantity', 'is_sold', 
            'created_at', 'updated_at', 'image', 'images', 'uploaded_images', 'image_file',
            'avg_rating', 'rating_count', 'user_rating'
        ]
        read_only_fields = ['seller', 'created_at', 'updated_at', 'is_sold', 'image', 'sale_price', 'active_discount_percent']

    def get_active_discount_percent(self, obj):
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

    def get_sale_price(self, obj):
        discount = self.get_active_discount_percent(obj)
        if discount > 0:
            discounted_price = float(obj.price) * (1 - discount / 100)
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
