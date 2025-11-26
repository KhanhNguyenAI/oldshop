from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Coupon, CouponUsage, UserCoupon
from .serializers import CouponSerializer
from django.db.models import Q

class CouponViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet to list available coupons and validate codes.
    """
    serializer_class = CouponSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Show active coupons that are either:
        # 1. Public
        # 2. Saved by the user (even if private)
        now = timezone.now()
        user = self.request.user
        
        return Coupon.objects.filter(
            Q(is_public=True) | Q(saved_by_users__user=user),
            is_active=True,
            start_date__lte=now,
            end_date__gte=now
        ).distinct()

    @action(detail=False, methods=['post'])
    def save_coupon(self, request):
        """
        Allows user to save a coupon by code (unlocking private coupons).
        """
        code = request.data.get('code')
        if not code:
            return Response({'error': 'Code is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            coupon = Coupon.objects.get(code=code)
        except Coupon.DoesNotExist:
            return Response({'error': 'Invalid coupon code'}, status=status.HTTP_404_NOT_FOUND)

        if not coupon.is_valid():
             return Response({'error': 'This coupon is expired or inactive'}, status=status.HTTP_400_BAD_REQUEST)

        # Create UserCoupon if not exists
        user_coupon, created = UserCoupon.objects.get_or_create(user=request.user, coupon=coupon)
        
        if created:
            message = "Coupon saved successfully"
        else:
            message = "You already have this coupon"

        serializer = self.get_serializer(coupon)
        return Response({
            'message': message,
            'coupon': serializer.data
        })

    @action(detail=False, methods=['post'])
    def validate(self, request):
        code = request.data.get('code')
        order_total = request.data.get('total_amount') # Assuming frontend sends this
        
        if not code:
            return Response({'error': 'Code is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            coupon = Coupon.objects.get(code=code)
        except Coupon.DoesNotExist:
            return Response({'error': 'Invalid coupon code'}, status=status.HTTP_404_NOT_FOUND)

        # 1. Check basic validity (active, dates, global limit)
        if not coupon.is_valid():
             return Response({'error': 'This coupon is expired or inactive'}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Check User Limit
        user_usage_count = CouponUsage.objects.filter(user=request.user, coupon=coupon).count()
        if user_usage_count >= coupon.usage_limit_per_user:
             return Response({'error': 'You have already used this coupon the maximum number of times'}, status=status.HTTP_400_BAD_REQUEST)

        # 3. Check Order Min Value
        if order_total is not None and float(order_total) < float(coupon.min_order_value):
             return Response({
                 'error': f'Minimum order value of {coupon.min_order_value} required'
             }, status=status.HTTP_400_BAD_REQUEST)

        # 4. Return Coupon Data for Frontend to Apply
        serializer = self.get_serializer(coupon)
        return Response({
            'valid': True,
            'coupon': serializer.data
        })
