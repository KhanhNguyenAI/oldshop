from django.db import models
from django.conf import settings
from .models import Order, OrderItem
import uuid
from django.utils import timezone
from decimal import Decimal

class ReturnRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('under_review', 'Under Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('shipping', 'Shipping'),
        ('received', 'Received'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    RETURN_TYPE_CHOICES = [
        ('full', 'Full Return'),
        ('partial', 'Partial Return'),
        ('exchange', 'Exchange'),
    ]
    
    FAULT_TYPE_CHOICES = [
        ('shop_fault', 'Shop Fault'),
        ('customer_fault', 'Customer Fault'),
        ('no_fault', 'No Fault (Change of Mind)'),
        ('pending_review', 'Pending Review'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='return_requests')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='return_requests')
    
    # Request information
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    return_type = models.CharField(max_length=20, choices=RETURN_TYPE_CHOICES, default='full')
    reason = models.CharField(max_length=100)  # Reason selected by customer
    reason_detail = models.TextField(blank=True)
    images = models.JSONField(default=list, blank=True)  # URLs of evidence images/videos
    
    # Fault confirmation (IMPORTANT)
    fault_type = models.CharField(
        max_length=20, 
        choices=FAULT_TYPE_CHOICES, 
        default='pending_review',
        help_text="Confirm fault cause: shop fault, customer fault, or no fault"
    )
    fault_confirmed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='confirmed_returns',
        help_text="Admin who confirmed the fault"
    )
    fault_confirmed_at = models.DateTimeField(null=True, blank=True)
    fault_notes = models.TextField(blank=True, help_text="Admin notes about the fault")
    
    # Refund calculation
    days_since_delivery = models.IntegerField(help_text="Days since delivery", default=0)
    
    # Expected refund amount (based on condition - baseline)
    baseline_refund_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0,
        help_text="Expected refund amount based on condition policy (baseline)"
    )
    baseline_refund_percent = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=0,
        help_text="Refund percentage based on condition (100% or 80%)"
    )
    
    # Final refund amount (after confirming fault_type)
    final_refund_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Final refund amount after confirming fault cause"
    )
    final_refund_percent = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Final refund percentage"
    )
    
    # Shipping
    return_shipping_label = models.CharField(max_length=255, blank=True)
    tracking_number = models.CharField(max_length=100, blank=True)
    shipping_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Admin
    admin_notes = models.TextField(blank=True)
    rejected_reason = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    requested_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Return Request'
        verbose_name_plural = 'Return Requests'

    def __str__(self):
        return f"Return Request {self.id} - Order {self.order.id}"

    @staticmethod
    def calculate_baseline_refund(order_item, days_since_delivery):
        """
        Calculate expected refund amount based on condition (baseline)
        """
        if not order_item.product:
            return Decimal('0'), Decimal('0')
            
        product = order_item.product
        condition = product.condition
        original_price = order_item.price
        quantity = order_item.quantity
        
        # Condition 1: New
        if condition == 'new':
            if days_since_delivery <= 7:
                return original_price * quantity * Decimal('1.0'), Decimal('100')
            elif days_since_delivery <= 30:
                return original_price * quantity * Decimal('0.8'), Decimal('80')
            else:
                return Decimal('0'), Decimal('0')
        
        # Condition 2: Like New
        elif condition == 'like_new':
            if days_since_delivery <= 3:
                return original_price * quantity * Decimal('1.0'), Decimal('100')
            elif days_since_delivery <= 7:
                return original_price * quantity * Decimal('0.8'), Decimal('80')
            else:
                return Decimal('0'), Decimal('0')
        
        # Condition 3: Good
        elif condition == 'good':
            if days_since_delivery <= 3:
                return original_price * quantity * Decimal('1.0'), Decimal('100')
            else:
                return Decimal('0'), Decimal('0')
        
        # Condition 4: Fair
        elif condition == 'fair':
            if days_since_delivery <= 3:
                return original_price * quantity * Decimal('1.0'), Decimal('100')
            else:
                return Decimal('0'), Decimal('0')
        
        # Condition 5: Poor
        elif condition == 'poor':
            return Decimal('0'), Decimal('0')
        
        return Decimal('0'), Decimal('0')

    @staticmethod
    def calculate_final_refund(baseline_amount, baseline_percent, fault_type, original_price, quantity):
        """
        Calculate final refund amount after confirming fault cause
        """
        # If shop fault → refund 100% (regardless of condition)
        if fault_type == 'shop_fault':
            return original_price * quantity * Decimal('1.0'), Decimal('100')
        
        # If customer fault → apply baseline (could be 0 if expired)
        elif fault_type == 'customer_fault':
            return baseline_amount, baseline_percent
        
        # If no fault (change of mind) → apply baseline
        elif fault_type == 'no_fault':
            return baseline_amount, baseline_percent
        
        # Pending confirmation
        else:
            return baseline_amount, baseline_percent


class ReturnItem(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('received', 'Received'),
        ('refunded', 'Refunded'),
    ]
    
    return_request = models.ForeignKey(ReturnRequest, on_delete=models.CASCADE, related_name='items')
    order_item = models.ForeignKey(OrderItem, on_delete=models.CASCADE, related_name='return_items')
    
    quantity = models.PositiveIntegerField(default=1)
    condition_at_return = models.CharField(
        max_length=20, 
        blank=True,
        help_text="Product condition when received back"
    )
    
    # Product information
    original_condition = models.CharField(max_length=20, help_text="Original condition")
    days_since_delivery = models.IntegerField()
    
    # Baseline calculation (based on condition)
    baseline_refund_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    baseline_refund_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Final calculation (after confirming fault)
    final_refund_percent = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    final_refund_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    admin_notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Return Item'
        verbose_name_plural = 'Return Items'

    def __str__(self):
        return f"Return Item {self.id} - {self.return_request.id}"

