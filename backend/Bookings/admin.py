from django.contrib import admin
from .models import Booking, BookingImage

class BookingImageInline(admin.TabularInline):
    model = BookingImage
    extra = 0

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer_name', 'booking_date', 'room_size', 'total_price', 'status', 'created_at')
    list_filter = ('status', 'booking_date', 'room_size', 'truck_type')
    search_fields = ('customer_name', 'customer_email', 'address', 'id')
    inlines = [BookingImageInline]
    readonly_fields = ('created_at', 'updated_at')



























