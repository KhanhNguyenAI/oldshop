from rest_framework import serializers
from .models import PricingRequest, PricingCache
from Products.models import Category, Brand


class PricingRequestSerializer(serializers.ModelSerializer):
    """Serializer for creating pricing requests"""
    
    image_urls = serializers.ListField(
        child=serializers.URLField(),
        allow_empty=False,
        min_length=1,
        max_length=5,
        help_text="List of image URLs (1-5 images)"
    )
    
    class Meta:
        model = PricingRequest
        fields = [
            'id', 'title', 'category', 'brand', 'description', 'original_price',
            'condition', 'image_urls', 'status', 'suggested_price',
            'price_min', 'price_max', 'confidence_score', 'pricing_reasoning',
            'error_message', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'status', 'suggested_price', 'price_min', 'price_max',
            'confidence_score', 'pricing_reasoning', 'error_message',
            'created_at', 'updated_at'
        ]
    
    def validate_title(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("商品名は必須です")
        if len(value.strip()) < 3:
            raise serializers.ValidationError("商品名は3文字以上である必要があります")
        return value.strip()
    
    def validate_original_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("新品時の価格は0より大きい必要があります")
        return value
    
    def validate_image_urls(self, value):
        if not value or len(value) == 0:
            raise serializers.ValidationError("画像は少なくとも1枚必要です")
        if len(value) > 5:
            raise serializers.ValidationError("画像は最大5枚までです")
        return value


class PricingRequestDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer with validation and pricing results"""
    
    validation_result = serializers.JSONField(read_only=True)
    pricing_result = serializers.JSONField(read_only=True)
    
    class Meta:
        model = PricingRequest
        fields = [
            'id', 'title', 'category', 'brand', 'description', 'original_price',
            'condition', 'image_urls', 'status', 'suggested_price',
            'price_min', 'price_max', 'confidence_score', 'pricing_reasoning',
            'validation_result', 'pricing_result', 'error_message',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'title', 'category', 'brand', 'description', 'original_price',
            'condition', 'image_urls', 'status', 'suggested_price',
            'price_min', 'price_max', 'confidence_score', 'pricing_reasoning',
            'validation_result', 'pricing_result', 'error_message',
            'created_at', 'updated_at'
        ]


class PricingRequestCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new pricing requests"""
    
    image_urls = serializers.ListField(
        child=serializers.URLField(),
        allow_empty=False,
        min_length=1,
        max_length=5
    )
    
    class Meta:
        model = PricingRequest
        fields = [
            'title', 'category', 'brand', 'description', 'original_price',
            'condition', 'image_urls'
        ]
    
    def validate_title(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("商品名は必須です")
        if len(value.strip()) < 3:
            raise serializers.ValidationError("商品名は3文字以上である必要があります")
        return value.strip()
    
    def validate_original_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("新品時の価格は0より大きい必要があります")
        return value

