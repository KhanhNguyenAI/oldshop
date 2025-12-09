from django.db import models
from django.conf import settings
from Products.models import Product
from django.utils import timezone
import uuid

class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='orders')
    
    # Shipping Info
    full_name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    address = models.TextField()
    postal_code = models.CharField(max_length=10)
    city = models.CharField(max_length=100)
    
    # Order Info
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_method = models.CharField(max_length=50, default='cod')
    payment_intent_id = models.CharField(max_length=255, blank=True, null=True, help_text="Strike PaymentIntent ID for family payment")
    payment_deadline = models.DateTimeField(null=True, blank=True, help_text="Payment deadline for FamilyMart payment (2 days after creation)")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    delivered_at = models.DateTimeField(null=True, blank=True, help_text="Time when order was delivered to customer")

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Order {self.id} - {self.user.email}"
    
    def save(self, *args, **kwargs):
        # Automatically set delivered_at when status changes to 'delivered'
        if self.status == 'delivered' and not self.delivered_at:
            self.delivered_at = timezone.now()
        # Clear delivered_at if status changes away from 'delivered'
        elif self.status != 'delivered' and self.delivered_at:
            # Keep delivered_at for historical records, but you can uncomment to clear it:
            # self.delivered_at = None
            pass
        super().save(*args, **kwargs)

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2) # Price at time of purchase

    def __str__(self):
        return f"{self.quantity} x {self.product.title if self.product else 'Deleted Product'}"
