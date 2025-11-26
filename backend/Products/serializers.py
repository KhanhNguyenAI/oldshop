from rest_framework import serializers
from .models import Category, Product, ProductImage, Brand
from Users.serializers import UserSerializer
from Core.utils import upload_image_to_supabase

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
    
    # Write-only field for multiple images upload
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(max_length=1000000, allow_empty_file=False, use_url=False),
        write_only=True,
        required=False
    )
    
    # Write-only field for main image upload
    image_file = serializers.ImageField(write_only=True, required=False)

    class Meta:
        model = Product
        fields = [
            'id', 'seller', 'category', 'category_id', 'brand', 'brand_id', 
            'title', 'description', 'price', 'condition', 'location', 'is_sold', 
            'created_at', 'updated_at', 'image', 'images', 'uploaded_images', 'image_file'
        ]
        read_only_fields = ['seller', 'created_at', 'updated_at', 'is_sold', 'image']

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
