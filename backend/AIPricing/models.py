from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from decimal import Decimal
import uuid
import hashlib


class PricingRequest(models.Model):
    """Model để lưu request định giá sản phẩm"""
    
    CONDITION_CHOICES = [
        ('new', 'Mới'),
        ('like_new', 'Như mới'),
        ('good', 'Tốt'),
        ('fair', 'Khá'),
        ('poor', 'Kém'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Đang xử lý'),
        ('validated', 'Đã xác thực'),
        ('priced', 'Đã định giá'),
        ('error', 'Lỗi'),
        ('rejected', 'Từ chối'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='pricing_requests')
    
    # Product information
    title = models.CharField(max_length=255, default='', help_text="Tên sản phẩm")
    category = models.CharField(max_length=100)
    brand = models.CharField(max_length=100, blank=True)
    description = models.TextField()
    original_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0'))])
    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES)
    
    # Image URLs (stored in Supabase)
    image_urls = models.JSONField(default=list, help_text="List of image URLs")
    image_hash = models.CharField(max_length=64, db_index=True, help_text="Hash of first image for caching")
    
    # Status and results
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    validation_result = models.JSONField(null=True, blank=True, help_text="Gemini validation response")
    pricing_result = models.JSONField(null=True, blank=True, help_text="Gemini pricing response")
    
    # Cached pricing
    suggested_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    price_min = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    price_max = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    confidence_score = models.FloatField(null=True, blank=True, help_text="0-1 confidence score")
    pricing_reasoning = models.TextField(blank=True, help_text="AI reasoning for the price")
    
    # Error handling
    error_message = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['image_hash']),
            models.Index(fields=['status']),
            models.Index(fields=['user', '-created_at']),
        ]
    
    def __str__(self):
        return f"Pricing Request {self.id} - {self.category} - {self.status}"
    
    def generate_cache_key(self):
        """Generate cache key for pricing based on product attributes"""
        cache_string = f"{self.category}|{self.brand}|{self.condition}|{self.description[:100]}"
        return hashlib.md5(cache_string.encode()).hexdigest()


class PricingCache(models.Model):
    """Cache table để lưu kết quả định giá đã tính toán"""
    
    cache_key = models.CharField(max_length=64, unique=True, db_index=True)
    category = models.CharField(max_length=100)
    brand = models.CharField(max_length=100, blank=True)
    condition = models.CharField(max_length=20)
    
    # Cached results
    suggested_price = models.DecimalField(max_digits=10, decimal_places=2)
    price_min = models.DecimalField(max_digits=10, decimal_places=2)
    price_max = models.DecimalField(max_digits=10, decimal_places=2)
    pricing_reasoning = models.TextField()
    
    # Metadata
    hit_count = models.PositiveIntegerField(default=0, help_text="Number of times this cache was used")
    created_at = models.DateTimeField(auto_now_add=True)
    last_used_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-last_used_at']
        indexes = [
            models.Index(fields=['cache_key']),
        ]
    
    def __str__(self):
        return f"Cache: {self.category} - {self.brand} - {self.condition}"
