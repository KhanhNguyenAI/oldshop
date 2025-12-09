from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import Booking
from .serializers import BookingSerializer
from django.db.models import Q
from datetime import date

class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Users see their own bookings, admins see all
        user = self.request.user
        if user.is_staff:
            return Booking.objects.all().order_by('-created_at')
        return Booking.objects.filter(user=user).order_by('-created_at')

    def perform_create(self, serializer):
        booking_date = serializer.validated_data.get('booking_date')
        
        # Check if date is already booked
        existing_booking = Booking.objects.filter(
            booking_date=booking_date,
            status__in=['pending', 'confirmed']  # Only count active bookings
        ).exclude(id=serializer.instance.id if serializer.instance else None)
        
        if existing_booking.exists():
            from rest_framework.exceptions import ValidationError
            raise ValidationError({
                'booking_date': 'この日付は既に予約されています。別の日付を選択してください。'
            })
        
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def update_status(self, request, pk=None):
        """Admin can update booking status"""
        booking = self.get_object()
        new_status = request.data.get('status')
        
        if not new_status:
            return Response(
                {'error': 'status field is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if new_status not in dict(Booking.STATUS_CHOICES):
            return Response(
                {'error': f'Invalid status. Must be one of: {", ".join(dict(Booking.STATUS_CHOICES).keys())}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        booking.status = new_status
        booking.save()
        
        return Response(self.get_serializer(booking).data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def cancel(self, request, pk=None):
        """
        Cancel a booking (only if status is pending)
        """
        try:
            booking = self.get_object()
            
            # Check if user owns this booking
            if booking.user != request.user and not request.user.is_staff:
                return Response(
                    {'error': 'この予約をキャンセルする権限がありません。'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Only allow cancellation if status is pending
            if booking.status != 'pending':
                return Response(
                    {'error': '保留中の予約のみキャンセルできます。'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Update status to cancelled
            booking.status = 'cancelled'
            booking.save()
            
            serializer = self.get_serializer(booking)
            return Response(serializer.data)
            
        except Booking.DoesNotExist:
            return Response(
                {'error': '予約が見つかりません。'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def rebook(self, request, pk=None):
        """
        Create a new booking from a cancelled booking
        """
        try:
            old_booking = self.get_object()
            
            # Check if user owns this booking
            if old_booking.user != request.user and not request.user.is_staff:
                return Response(
                    {'error': 'この予約を再予約する権限がありません。'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Only allow rebooking from cancelled bookings
            if old_booking.status != 'cancelled':
                return Response(
                    {'error': 'キャンセルされた予約のみ再予約できます。'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get new booking date from request (optional, defaults to old date)
            new_booking_date = request.data.get('booking_date', old_booking.booking_date)
            new_time_slot = request.data.get('time_slot', old_booking.time_slot)
            
            # Check if new date is already booked
            existing_booking = Booking.objects.filter(
                booking_date=new_booking_date,
                status__in=['pending', 'confirmed']
            ).exclude(id=old_booking.id)
            
            if existing_booking.exists():
                return Response(
                    {'error': 'この日付は既に予約されています。別の日付を選択してください。'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create new booking with same details
            new_booking = Booking.objects.create(
                user=old_booking.user,
                room_size=old_booking.room_size,
                trash_level=old_booking.trash_level,
                truck_type=old_booking.truck_type,
                booking_date=new_booking_date,
                time_slot=new_time_slot,
                address=old_booking.address,
                has_elevator=old_booking.has_elevator,
                customer_name=old_booking.customer_name,
                customer_phone=old_booking.customer_phone,
                customer_email=old_booking.customer_email,
                notes=old_booking.notes,
                total_price=old_booking.total_price,
                status='pending'
            )
            
            # Copy images from old booking
            for old_image in old_booking.images.all():
                from .models import BookingImage
                BookingImage.objects.create(
                    booking=new_booking,
                    image_url=old_image.image_url
                )
            
            serializer = self.get_serializer(new_booking)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Booking.DoesNotExist:
            return Response(
                {'error': '予約が見つかりません。'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

@api_view(['GET'])
@permission_classes([AllowAny])  # Allow anyone to check availability
def get_booked_dates(request):
    """
    Get list of dates that are already booked
    Returns list of dates in YYYY-MM-DD format
    """
    booked_dates = Booking.objects.filter(
        status__in=['pending', 'confirmed']  # Only count active bookings
    ).values_list('booking_date', flat=True).distinct()
    
    # Convert to list of strings
    booked_dates_list = [str(booking_date) for booking_date in booked_dates]
    
    return Response({'booked_dates': booked_dates_list})


