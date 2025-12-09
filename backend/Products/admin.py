from django.contrib import admin
from django.db.models import Count
from django.utils import timezone
from .models import Category, Product, ProductImage, Brand, ProductRating, ProductComment, UserHistory, Accessory, CategoryAccessory, ProductGeminiAnswer, Discount

class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'icon', 'parent', 'product_count', 'discount_percent')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name',)
    list_filter = ('parent',)
    list_editable = ('discount_percent',)

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.annotate(product_count=Count('products'))

    def product_count(self, obj):
        return obj.product_count
    product_count.admin_order_field = 'product_count'
    product_count.short_description = 'Products Count'

@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name',)

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'brand', 'seller', 'price', 'discount_percent', 'stock_quantity', 'sold_quantity', 'is_sold', 'is_verified', 'created_at')
    list_filter = ('category', 'brand', 'condition', 'is_sold', 'is_verified', 'created_at')
    search_fields = ('title', 'description', 'seller__email')
    list_editable = ('price', 'discount_percent', 'stock_quantity', 'is_sold', 'is_verified')
    inlines = [ProductImageInline]
    readonly_fields = ('created_at', 'updated_at')
    actions = ['apply_10_percent_discount', 'remove_discount']

    def apply_10_percent_discount(self, request, queryset):
        queryset.update(discount_percent=10)
    apply_10_percent_discount.short_description = "Apply 10%% discount to selected products"

    def remove_discount(self, request, queryset):
        queryset.update(discount_percent=0)
    remove_discount.short_description = "Remove discount from selected products"

@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ('product', 'image', 'created_at')

@admin.register(ProductRating)
class ProductRatingAdmin(admin.ModelAdmin):
    list_display = ('user', 'product', 'score', 'created_at')
    list_filter = ('score', 'created_at')
    search_fields = ('user__email', 'product__title')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(ProductComment)
class ProductCommentAdmin(admin.ModelAdmin):
    list_display = ('user', 'product', 'content_short', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('user__email', 'product__title', 'content')
    actions = ['approve_comments', 'hide_comments']
    
    def content_short(self, obj):
        return obj.content[:50] + "..." if len(obj.content) > 50 else obj.content
    content_short.short_description = 'Content'

    def approve_comments(self, request, queryset):
        queryset.update(is_active=True)
    approve_comments.short_description = "Approve selected comments"

    def hide_comments(self, request, queryset):
        queryset.update(is_active=False)
    hide_comments.short_description = "Hide selected comments"

@admin.register(UserHistory)
class UserHistoryAdmin(admin.ModelAdmin):
    list_display = ('user', 'product', 'viewed_at')
    list_filter = ('viewed_at',)
    search_fields = ('user__email', 'product__title')
    readonly_fields = ('viewed_at',)
    date_hierarchy = 'viewed_at'

@admin.register(CategoryAccessory)
class CategoryAccessoryAdmin(admin.ModelAdmin):
    list_display = ('category', 'accessory_category', 'created_at')
    list_filter = ('created_at', 'category', 'accessory_category')
    search_fields = ('category__name', 'accessory_category__name')
    readonly_fields = ('created_at',)

@admin.register(Accessory)
class AccessoryAdmin(admin.ModelAdmin):
    list_display = ('product', 'accessory_product', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('product__title', 'accessory_product__title')
    readonly_fields = ('created_at',)

@admin.register(ProductGeminiAnswer)
class ProductGeminiAnswerAdmin(admin.ModelAdmin):
    list_display = ('product', 'answer_short', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('product__title', 'question', 'answer')
    readonly_fields = ('created_at', 'updated_at')
    fields = ('product', 'question', 'answer', 'created_at', 'updated_at')
    
    def answer_short(self, obj):
        return obj.answer[:100] + "..." if len(obj.answer) > 100 else obj.answer
    answer_short.short_description = 'Answer'

@admin.register(Discount)
class DiscountAdmin(admin.ModelAdmin):
    list_display = ('name', 'discount_type', 'value_display', 'is_active', 'status', 'priority', 'start_date', 'end_date', 'applied_to_display')
    list_filter = ('is_active', 'discount_type', 'start_date', 'end_date', 'created_at')
    search_fields = ('name', 'description')
    list_editable = ('is_active', 'priority')
    readonly_fields = ('created_at', 'updated_at')
    filter_horizontal = ('products', 'categories')
    date_hierarchy = 'start_date'
    
    fieldsets = (
        ('Thông tin cơ bản', {
            'fields': ('name', 'description', 'is_active', 'priority')
        }),
        ('Giảm giá', {
            'fields': ('discount_type', 'value')
        }),
        ('Thời gian', {
            'fields': ('start_date', 'end_date')
        }),
        ('Áp dụng cho', {
            'fields': ('products', 'categories', 'parent_category'),
            'description': 'Có thể chọn nhiều products/categories. Nếu chọn parent_category, sẽ áp dụng cho tất cả sub-categories.'
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['activate_discounts', 'deactivate_discounts']
    
    def value_display(self, obj):
        if obj.discount_type == 'percent':
            return f"{obj.value}%"
        return f"¥{obj.value}"
    value_display.short_description = 'Giá trị'
    
    def status(self, obj):
        now = timezone.now()
        if not obj.is_active:
            return '❌ Không kích hoạt'
        if obj.start_date > now:
            return '⏳ Chưa bắt đầu'
        if obj.end_date and obj.end_date < now:
            return '🔴 Đã hết hạn'
        return '✅ Đang hoạt động'
    status.short_description = 'Trạng thái'
    
    def applied_to_display(self, obj):
        parts = []
        if obj.products.exists():
            count = obj.products.count()
            parts.append(f"{count} sản phẩm")
        if obj.categories.exists():
            count = obj.categories.count()
            parts.append(f"{count} danh mục")
        if obj.parent_category:
            parts.append(f"Parent: {obj.parent_category.name}")
        return ", ".join(parts) if parts else "Chưa áp dụng"
    applied_to_display.short_description = 'Áp dụng cho'
    
    def activate_discounts(self, request, queryset):
        queryset.update(is_active=True)
        self.message_user(request, f"Đã kích hoạt {queryset.count()} discount(s).")
    activate_discounts.short_description = "Kích hoạt các discount đã chọn"
    
    def deactivate_discounts(self, request, queryset):
        queryset.update(is_active=False)
        self.message_user(request, f"Đã tắt {queryset.count()} discount(s).")
    deactivate_discounts.short_description = "Tắt các discount đã chọn"
