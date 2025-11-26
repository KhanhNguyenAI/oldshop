from django.contrib import admin
from django.db.models import Count
from .models import Category, Product, ProductImage, Brand, ProductRating, ProductComment

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
    list_display = ('title', 'category', 'brand', 'seller', 'price', 'discount_percent', 'stock_quantity', 'sold_quantity', 'is_sold', 'created_at')
    list_filter = ('category', 'brand', 'condition', 'is_sold', 'created_at')
    search_fields = ('title', 'description', 'seller__email')
    list_editable = ('price', 'discount_percent', 'stock_quantity', 'is_sold')
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
