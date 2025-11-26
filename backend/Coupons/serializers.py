from rest_framework import serializers
from .models import Coupon, CouponUsage, UserCoupon

class CouponSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()
    display_text = serializers.CharField(source='get_discount_display', read_only=True)
    is_saved = serializers.SerializerMethodField()

    class Meta:
        model = Coupon
        fields = [
            'id', 'code', 'description', 'discount_type', 'discount_percent', 
            'discount_amount', 'min_order_value', 'max_discount', 
            'start_date', 'end_date', 'is_active', 'is_public', 
            'status', 'display_text', 'is_saved'
        ]

    def get_status(self, obj):
        if not obj.is_valid():
            return 'expired' # or inactive
        return 'active'

    def get_is_saved(self, obj):
        user = self.context.get('request').user if self.context.get('request') else None
        if user and user.is_authenticated:
            return UserCoupon.objects.filter(user=user, coupon=obj).exists()
        return False
