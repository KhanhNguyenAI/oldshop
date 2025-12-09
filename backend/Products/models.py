from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
import uuid

class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    icon = models.CharField(max_length=50, blank=True, null=True)
    description = models.TextField(blank=True)
    
    # Parent category for hierarchical structure (Level 1 & Level 2)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')
    discount_percent = models.PositiveIntegerField(default=0, validators=[MaxValueValidator(100)], help_text="Sale % for all products in this category")

    class Meta:
        verbose_name_plural = "Categories"

    def __str__(self):
        if self.parent:
            return f"{self.parent.name} -> {self.name}"
        return self.name

class Brand(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    
    def __str__(self):
        return self.name

class Product(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    CONDITION_CHOICES = [
        ('new', 'New'),
        ('like_new', 'Like New'),
        ('good', 'Good'),
        ('fair', 'Fair'),
        ('poor', 'Poor'),
    ]

    seller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='products')
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    brand = models.ForeignKey(Brand, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    title = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES, default='good')
    
    # New fields for detailed info
    condition_detail = models.TextField(blank=True, help_text="Detailed description of condition (e.g. scratches, battery health)")
    specifications = models.JSONField(default=dict, blank=True, help_text="JSON data for specs (e.g. screen_size, ram, etc.)")
    
    location = models.CharField(max_length=255, blank=True)
    stock_quantity = models.PositiveIntegerField(default=1)
    sold_quantity = models.PositiveIntegerField(default=0)
    is_sold = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False, help_text="Đánh dấu sản phẩm đã được kiểm tra và đảm bảo chất lượng")
    discount_percent = models.PositiveIntegerField(default=0, validators=[MaxValueValidator(100)], help_text="Sale % for this specific product (Overrides category sale)")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Store Supabase URL
    image = models.CharField(max_length=500, blank=True, null=True)

    def __str__(self):
        return self.title

class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    # Store Supabase URL
    image = models.CharField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image for {self.product.title}"

class ProductRating(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ratings')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='ratings')
    score = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'product')
        indexes = [
            models.Index(fields=['user', 'product']),
        ]

    def __str__(self):
        return f"{self.user} rated {self.product} - {self.score}"

class ProductComment(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='comments')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='comments')
    content = models.TextField()
    # Support threading
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    
    is_active = models.BooleanField(default=True) # For moderation
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Comment by {self.user} on {self.product}"

class CommentImage(models.Model):
    comment = models.ForeignKey(ProductComment, on_delete=models.CASCADE, related_name='images')
    image = models.CharField(max_length=500) # URL from Supabase
    is_video = models.BooleanField(default=False, help_text="True if this is a video file")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        media_type = "Video" if self.is_video else "Image"
        return f"{media_type} for comment {self.comment.id}"

class UserHistory(models.Model):
    """Lưu lịch sử xem sản phẩm của người dùng - chỉ 1 record/user/product"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='view_history',
        null=True, 
        blank=True  # Cho phép anonymous users
    )
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='view_history')
    viewed_at = models.DateTimeField(auto_now=True)  # Tự động update mỗi khi save
    
    class Meta:
        ordering = ['-viewed_at']
        indexes = [
            models.Index(fields=['user', '-viewed_at']),
            models.Index(fields=['product', '-viewed_at']),
        ]
        # Chỉ cho phép 1 record duy nhất cho mỗi cặp (user, product)
        unique_together = [['user', 'product']]
    
    def __str__(self):
        user_email = self.user.email if self.user else "Anonymous"
        return f"{user_email} viewed {self.product.title} at {self.viewed_at}"

class CategoryAccessory(models.Model):
    """
    Quan hệ phụ kiện giữa các categories
    category: Category chính (user mua sản phẩm ở category này)
    accessory_category: Category phụ kiện (gợi ý sản phẩm từ category này)
    """
    category = models.ForeignKey(
        Category, 
        on_delete=models.CASCADE, 
        related_name='accessory_categories'  # category.accessory_categories.all() để lấy accessory categories
    )
    accessory_category = models.ForeignKey(
        Category, 
        on_delete=models.CASCADE, 
        related_name='main_categories'  # category.main_categories.all() để lấy categories nào có phụ kiện này
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('category', 'accessory_category')  # Tránh duplicate
        verbose_name_plural = "Category Accessories"
        indexes = [
            models.Index(fields=['category']),
        ]
    
    def __str__(self):
        return f"{self.category.name} → {self.accessory_category.name}"


class Accessory(models.Model):
    """
    DEPRECATED: Use CategoryAccessory instead
    Bảng map sản phẩm → phụ kiện liên quan (old model, kept for backward compatibility)
    """
    product = models.ForeignKey(
        Product, 
        on_delete=models.CASCADE, 
        related_name='accessories'
    )
    accessory_product = models.ForeignKey(
        Product, 
        on_delete=models.CASCADE, 
        related_name='accessory_for'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('product', 'accessory_product')
        verbose_name_plural = "Accessories (Deprecated)"
        indexes = [
            models.Index(fields=['product']),
        ]
    
    def __str__(self):
        return f"{self.product.title} → {self.accessory_product.title}"

class Discount(models.Model):
    """Model quản lý các chương trình giảm giá linh hoạt"""
    DISCOUNT_TYPE_CHOICES = [
        ('percent', 'Phần trăm (%)'),
        ('amount', 'Số tiền cố định (¥)'),
    ]
    
    # Thông tin cơ bản
    name = models.CharField(max_length=255, help_text="Tên chương trình giảm giá")
    description = models.TextField(blank=True, help_text="Mô tả chi tiết")
    
    # Loại giảm giá
    discount_type = models.CharField(
        max_length=10, 
        choices=DISCOUNT_TYPE_CHOICES, 
        default='percent',
        help_text="Loại giảm giá: phần trăm hoặc số tiền cố định"
    )
    value = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        help_text="Giá trị giảm (phần trăm hoặc số tiền)"
    )
    
    # Thời gian
    start_date = models.DateTimeField(help_text="Ngày bắt đầu")
    end_date = models.DateTimeField(
        null=True, 
        blank=True, 
        help_text="Ngày kết thúc (null = không giới hạn)"
    )
    
    # Trạng thái
    is_active = models.BooleanField(
        default=True, 
        help_text="Kích hoạt/không kích hoạt"
    )
    
    # Áp dụng cho (ManyToMany - có thể chọn nhiều)
    products = models.ManyToManyField(
        'Product', 
        blank=True, 
        related_name='discounts',
        help_text="Áp dụng cho các sản phẩm cụ thể"
    )
    categories = models.ManyToManyField(
        'Category', 
        blank=True, 
        related_name='discounts',
        help_text="Áp dụng cho các danh mục"
    )
    
    # Áp dụng cho parent category (ForeignKey - chỉ 1)
    parent_category = models.ForeignKey(
        'Category', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True, 
        related_name='parent_discounts',
        help_text="Áp dụng cho tất cả sản phẩm trong parent category và các sub-categories"
    )
    
    # Priority (ưu tiên khi có nhiều discount)
    priority = models.PositiveIntegerField(
        default=0, 
        help_text="Độ ưu tiên (số càng cao càng ưu tiên)"
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Discount"
        verbose_name_plural = "Discounts"
        ordering = ['-priority', '-created_at']
        indexes = [
            models.Index(fields=['is_active', 'start_date', 'end_date']),
            models.Index(fields=['is_active', 'priority']),
        ]
    
    def __str__(self):
        discount_value = f"{self.value}%" if self.discount_type == 'percent' else f"¥{self.value}"
        return f"{self.name} - {discount_value}"
    
    def is_valid_now(self):
        """Kiểm tra discount có đang hiệu lực không"""
        now = timezone.now()
        if not self.is_active:
            return False
        if self.start_date > now:
            return False
        if self.end_date and self.end_date < now:
            return False
        return True
    
    def calculate_discount_amount(self, original_price):
        """Tính số tiền được giảm từ giá gốc"""
        if not self.is_valid_now():
            return 0
        
        if self.discount_type == 'percent':
            return float(original_price) * (float(self.value) / 100)
        else:  # amount
            return float(self.value)
    
    def calculate_final_price(self, original_price):
        """Tính giá cuối cùng sau khi giảm"""
        discount_amount = self.calculate_discount_amount(original_price)
        final_price = float(original_price) - discount_amount
        return max(0, final_price)  # Đảm bảo giá không âm

class ProductGeminiAnswer(models.Model):
    """Lưu câu trả lời từ Gemini AI cho mỗi sản phẩm"""
    product = models.OneToOneField(
        Product,
        on_delete=models.CASCADE,
        related_name='gemini_answer',
        primary_key=True
    )
    answer = models.TextField(help_text="Câu trả lời từ Gemini AI")
    question = models.TextField(help_text="Câu hỏi đã được gửi đến Gemini")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Product Gemini Answer"
        verbose_name_plural = "Product Gemini Answers"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Gemini answer for {self.product.title}"