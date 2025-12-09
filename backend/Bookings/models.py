from django.db import models
from django.conf import settings

class Booking(models.Model):
    ROOM_SIZES = [
        ('1R', '1R'), ('1K', '1K'), ('1DK', '1DK'), ('1LDK', '1LDK'),
        ('2DK', '2DK'), ('2LDK', '2LDK'), ('3LDK', '3LDK'), ('house', 'House')
    ]
    
    TRASH_LEVELS = [
        ('low', 'Low'), ('medium', 'Medium'), ('high', 'High')
    ]
    
    TRUCK_TYPES = [
        ('light', 'Light Truck'),
        ('1t', '1t Truck'),
        ('2t', '2t Truck'),
        ('2t_full', '2t Full Load'),
        ('2_trucks', '2 Trucks')
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled')
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bookings')
    
    # Booking Details
    room_size = models.CharField(max_length=20, choices=ROOM_SIZES)
    trash_level = models.CharField(max_length=20, choices=TRASH_LEVELS)
    truck_type = models.CharField(max_length=20, choices=TRUCK_TYPES)
    
    # Schedule
    booking_date = models.DateField()
    time_slot = models.CharField(max_length=50) # e.g., "9:00-12:00" or "14:30"
    
    # Location
    address = models.CharField(max_length=255)
    has_elevator = models.BooleanField(default=False)
    
    # Customer Info (Snapshot in case profile changes)
    customer_name = models.CharField(max_length=100)
    customer_phone = models.CharField(max_length=50)
    customer_email = models.EmailField()
    notes = models.TextField(blank=True, null=True)
    
    # Price
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Booking #{self.id} - {self.customer_name} ({self.booking_date})"

class BookingImage(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='images')
    image_url = models.URLField(max_length=500, default='')  # URL to Supabase storage
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image for Booking #{self.booking.id}"
