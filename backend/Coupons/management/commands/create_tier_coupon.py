from django.core.management.base import BaseCommand
from django.utils import timezone
from Coupons.models import Coupon
import datetime

class Command(BaseCommand):
    help = 'Creates a sample tiered coupon (Purchase > X get Y% off)'

    def handle(self, *args, **kwargs):
        # Configuration
        CODE = 'BIGSPENDER'
        MIN_ORDER_VALUE = 10000
        DISCOUNT_PERCENT = 15
        
        # Cleanup existing
        Coupon.objects.filter(code=CODE).delete()
        
        # Create new
        start_date = timezone.now()
        end_date = start_date + datetime.timedelta(days=365)
        
        coupon = Coupon.objects.create(
            code=CODE,
            description=f'Get {DISCOUNT_PERCENT}% off on orders over ¥{MIN_ORDER_VALUE}',
            discount_type='percent',
            discount_percent=DISCOUNT_PERCENT,
            min_order_value=MIN_ORDER_VALUE,
            start_date=start_date,
            end_date=end_date,
            is_active=True,
            is_public=True,
            usage_limit=1000,
            usage_limit_per_user=1
        )
        
        self.stdout.write(self.style.SUCCESS(f'Successfully created coupon "{CODE}": {DISCOUNT_PERCENT}% off for orders > {MIN_ORDER_VALUE}'))

