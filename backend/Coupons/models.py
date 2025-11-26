from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from Products.models import Product, Category

class Coupon(models.Model):
    DISCOUNT_TYPE_CHOICES = [
        ('percent', 'Percentage'),
        ('fixed', 'Fixed Amount'),
    ]

    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    
    # Discount Logic
    discount_type = models.CharField(max_length=10, choices=DISCOUNT_TYPE_CHOICES, default='percent')
    discount_percent = models.PositiveIntegerField(
        default=0, 
        validators=[MaxValueValidator(100)], 
        help_text="Used if type is Percentage"
    )
    discount_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0, 
        help_text="Used if type is Fixed Amount"
    )

    # Limits
    min_order_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    max_discount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True, 
        help_text="Max discount amount for percentage coupons"
    )
    usage_limit = models.PositiveIntegerField(null=True, blank=True, help_text="Total times this coupon can be used globally")
    usage_limit_per_user = models.PositiveIntegerField(default=1, help_text="Times a single user can use this coupon")
    used_count = models.PositiveIntegerField(default=0, editable=False)

    # Timing
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    is_public = models.BooleanField(default=True, help_text="If checked, anyone can see this. If unchecked, user must enter code to save it.")

    # Conditions (Optional)
    applicable_categories = models.ManyToManyField(Category, blank=True, related_name='coupons')
    applicable_products = models.ManyToManyField(Product, blank=True, related_name='coupons')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.code} - {self.get_discount_display()}"

    def get_discount_display(self):
        if self.discount_type == 'percent':
            return f"{self.discount_percent}% OFF"
        return f"-{self.discount_amount}"

    def is_valid(self):
        from django.utils import timezone
        now = timezone.now()
        if not self.is_active:
            return False
        if self.start_date > now or self.end_date < now:
            return False
        if self.usage_limit is not None and self.used_count >= self.usage_limit:
            return False
        return True


class CouponUsage(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='coupon_usages')
    coupon = models.ForeignKey(Coupon, on_delete=models.CASCADE, related_name='usages')
    order = models.ForeignKey('Orders.Order', on_delete=models.SET_NULL, null=True, blank=True, related_name='applied_coupon')
    used_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'coupon', 'order')

    def __str__(self):
        return f"{self.user} used {self.coupon}"

class UserCoupon(models.Model):
    """
    Represents a coupon saved to a user's wallet.
    Required for Private coupons, optional for Public ones (if we want to track 'saved' status).
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='saved_coupons')
    coupon = models.ForeignKey(Coupon, on_delete=models.CASCADE, related_name='saved_by_users')
    saved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'coupon')

    def __str__(self):
        return f"{self.user} saved {self.coupon}"
