from rest_framework import generics, status, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from django.db.models import Count, Sum, Q
from django.db.models.functions import TruncDate
from datetime import timedelta
from .models import Contact
from .serializers import ContactSerializer, ContactAdminSerializer
from Orders.models import Order
from Bookings.models import Booking
from AIPricing.models import PricingRequest
from FreeItems.models import FreeItem

class ContactRateThrottle(AnonRateThrottle):
    rate = '3/day'

class ContactCreateView(generics.CreateAPIView):
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer
    permission_classes = [AllowAny]
    throttle_classes = [ContactRateThrottle]

    def perform_create(self, serializer):
        # Save the contact message to the database
        contact = serializer.save()
        
        # Prepare email content
        subject = f"New Contact Inquiry from {contact.name}"
        message = f"""
        You have received a new inquiry from the contact form:
        
        Name: {contact.name}
        Email: {contact.email}
        
        Message:
        {contact.message}
        """
        
        # Send email notification
        try:
            # If EMAIL_HOST_USER is set, use it as sender. Otherwise use a default.
            from_email = settings.EMAIL_HOST_USER if settings.EMAIL_HOST_USER else 'noreply@rehomemarket.com'
            # Send to the admin email (using EMAIL_HOST_USER for now as destination too, or a specific admin email)
            # For development/demo, sending to the same configured email or a placeholder admin email
            recipient_list = [settings.EMAIL_HOST_USER] if settings.EMAIL_HOST_USER else ['admin@rehomemarket.com']
            
            send_mail(
                subject,
                message,
                from_email,
                recipient_list,
                fail_silently=True, # Don't crash the request if email fails
            )
        except Exception as e:
            print(f"Failed to send contact email: {e}")

class ContactAdminViewSet(viewsets.ModelViewSet):
    queryset = Contact.objects.all()
    serializer_class = ContactAdminSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        # Filter by resolved status if provided
        is_resolved = self.request.query_params.get('is_resolved')
        if is_resolved is not None:
            return Contact.objects.filter(is_resolved=is_resolved.lower() == 'true')
        return Contact.objects.all()
    
    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        """Admin replies to a contact inquiry"""
        contact = self.get_object()
        admin_reply = request.data.get('admin_reply', '')
        
        if not admin_reply:
            return Response(
                {'error': 'admin_reply is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        contact.admin_reply = admin_reply
        contact.replied_by = request.user
        contact.replied_at = timezone.now()
        contact.is_resolved = True
        contact.save()
        
        # Send email to customer
        try:
            send_mail(
                f'Re: Your inquiry to OldShop',
                f'''Dear {contact.name},

Thank you for contacting us. Here is our response:

{admin_reply}

Best regards,
OldShop Team''',
                settings.EMAIL_HOST_USER or 'noreply@oldshop.com',
                [contact.email],
                fail_silently=True,
            )
        except Exception as e:
            print(f"Failed to send reply email: {e}")
        
        return Response(ContactAdminSerializer(contact).data)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_dashboard_stats(request):
    """Get dashboard statistics for admin"""
    now = timezone.now()
    today = now.date()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)
    
    # Orders stats
    total_orders = Order.objects.count()
    pending_orders = Order.objects.filter(status='pending').count()
    processing_orders = Order.objects.filter(status='processing').count()
    today_orders = Order.objects.filter(created_at__date=today).count()
    week_orders = Order.objects.filter(created_at__date__gte=week_ago).count()
    month_orders = Order.objects.filter(created_at__date__gte=month_ago).count()
    total_revenue = Order.objects.filter(status__in=['processing', 'shipped', 'delivered']).aggregate(
        total=Sum('total_amount')
    )['total'] or 0
    
    # Bookings stats
    total_bookings = Booking.objects.count()
    pending_bookings = Booking.objects.filter(status='pending').count()
    confirmed_bookings = Booking.objects.filter(status='confirmed').count()
    today_bookings = Booking.objects.filter(created_at__date=today).count()
    week_bookings = Booking.objects.filter(created_at__date__gte=week_ago).count()
    
    # Inquiries stats
    total_inquiries = Contact.objects.count()
    unresolved_inquiries = Contact.objects.filter(is_resolved=False).count()
    today_inquiries = Contact.objects.filter(created_at__date=today).count()
    week_inquiries = Contact.objects.filter(created_at__date__gte=week_ago).count()
    
    # AI Pricing stats
    total_pricing_requests = PricingRequest.objects.count()
    pending_pricing = PricingRequest.objects.filter(status='pending').count()
    priced_requests = PricingRequest.objects.filter(status='priced').count()
    error_pricing = PricingRequest.objects.filter(status='error').count()
    today_pricing = PricingRequest.objects.filter(created_at__date=today).count()
    week_pricing = PricingRequest.objects.filter(created_at__date__gte=week_ago).count()
    month_pricing = PricingRequest.objects.filter(created_at__date__gte=month_ago).count()
    
    # Free Items stats
    total_free_items = FreeItem.objects.count()
    available_items = FreeItem.objects.filter(status='available').count()
    reserved_items = FreeItem.objects.filter(status='reserved').count()
    completed_items = FreeItem.objects.filter(status='completed').count()
    today_free_items = FreeItem.objects.filter(created_at__date=today).count()
    week_free_items = FreeItem.objects.filter(created_at__date__gte=week_ago).count()
    month_free_items = FreeItem.objects.filter(created_at__date__gte=month_ago).count()
    
    # Recent orders (last 10)
    recent_orders = Order.objects.order_by('-created_at')[:10].values(
        'id', 'total_amount', 'status', 'payment_method', 'created_at', 'full_name'
    )
    
    # Recent bookings (last 10)
    recent_bookings = Booking.objects.order_by('-created_at')[:10].values(
        'id', 'customer_name', 'booking_date', 'status', 'total_price', 'created_at'
    )
    
    # Recent pricing requests (last 10)
    recent_pricing = PricingRequest.objects.order_by('-created_at')[:10].values(
        'id', 'title', 'category', 'status', 'suggested_price', 'created_at', 'user__email'
    )
    
    # Recent free items (last 10)
    recent_free_items = FreeItem.objects.order_by('-created_at')[:10].values(
        'id', 'title', 'category', 'status', 'location_prefecture', 'created_at', 'user__email'
    )
    
    return Response({
        'orders': {
            'total': total_orders,
            'pending': pending_orders,
            'processing': processing_orders,
            'today': today_orders,
            'week': week_orders,
            'month': month_orders,
            'revenue': float(total_revenue),
            'recent': list(recent_orders)
        },
        'bookings': {
            'total': total_bookings,
            'pending': pending_bookings,
            'confirmed': confirmed_bookings,
            'today': today_bookings,
            'week': week_bookings,
            'recent': list(recent_bookings)
        },
        'inquiries': {
            'total': total_inquiries,
            'unresolved': unresolved_inquiries,
            'today': today_inquiries,
            'week': week_inquiries
        },
        'ai_pricing': {
            'total': total_pricing_requests,
            'pending': pending_pricing,
            'priced': priced_requests,
            'error': error_pricing,
            'today': today_pricing,
            'week': week_pricing,
            'month': month_pricing,
            'recent': list(recent_pricing)
        },
        'free_items': {
            'total': total_free_items,
            'available': available_items,
            'reserved': reserved_items,
            'completed': completed_items,
            'today': today_free_items,
            'week': week_free_items,
            'month': month_free_items,
            'recent': list(recent_free_items)
        }
    })
