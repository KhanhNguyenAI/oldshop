from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction
from Orders.models import Order
from Orders.strike_payment import confirm_family_payment
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Tự động hủy đơn hàng FamilyMart payment sau 2 ngày nếu chưa thanh toán và vô hiệu hóa payment intent'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Chỉ hiển thị số lượng sẽ hủy, không thực sự hủy',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        # Tìm các đơn hàng FamilyMart payment đã quá hạn thanh toán (2 ngày)
        now = timezone.now()
        
        expired_orders = Order.objects.filter(
            payment_method='family',
            status='pending',
            payment_deadline__lt=now,
            payment_intent_id__isnull=False
        )
        
        count = expired_orders.count()
        
        if count == 0:
            self.stdout.write(self.style.SUCCESS(
                'Không có đơn hàng nào quá hạn thanh toán.'
            ))
            return
        
        if dry_run:
            self.stdout.write(self.style.WARNING(
                f'[DRY RUN] Sẽ hủy {count} đơn hàng quá hạn thanh toán:'
            ))
            for order in expired_orders:
                self.stdout.write(f'  - Order {order.id} (Deadline: {order.payment_deadline})')
        else:
            cancelled_count = 0
            failed_count = 0
            
            for order in expired_orders:
                try:
                    with transaction.atomic():
                        # Kiểm tra lại payment status trước khi hủy
                        try:
                            payment_info = confirm_family_payment(order.payment_intent_id)
                            
                            # Nếu đã thanh toán thành công, không hủy
                            if payment_info['status'] == 'succeeded':
                                logger.info(f"Order {order.id} already paid, skipping cancellation")
                                continue
                            
                            # Nếu payment intent đã bị cancel, chỉ cần cập nhật order status
                            if payment_info['status'] == 'canceled':
                                logger.info(f"Order {order.id} payment intent already canceled")
                        except Exception as e:
                            logger.warning(f"Could not check payment status for order {order.id}: {str(e)}")
                            # Tiếp tục hủy đơn hàng ngay cả khi không thể kiểm tra payment status
                        
                        # Hủy đơn hàng
                        order.status = 'cancelled'
                        order.save()
                        
                        # Restore stock for each item
                        for item in order.items.all():
                            if item.product:
                                product = item.product
                                product.stock_quantity += item.quantity
                                # Decrease sold quantity safely
                                if product.sold_quantity >= item.quantity:
                                    product.sold_quantity -= item.quantity
                                else:
                                    product.sold_quantity = 0
                                    
                                # Unmark 'is_sold' if stock becomes available
                                if product.stock_quantity > 0:
                                    product.is_sold = False
                                    
                                product.save()
                        
                        # Vô hiệu hóa payment intent bằng cách cancel nó
                        try:
                            import stripe
                            from django.conf import settings
                            
                            if hasattr(settings, 'STRIKE_SECRET_KEY') and settings.STRIKE_SECRET_KEY:
                                stripe.api_key = settings.STRIKE_SECRET_KEY
                                
                                # Cancel the payment intent
                                payment_intent = stripe.PaymentIntent.retrieve(order.payment_intent_id)
                                if payment_intent.status not in ['succeeded', 'canceled']:
                                    stripe.PaymentIntent.cancel(order.payment_intent_id)
                                    logger.info(f"Canceled payment intent {order.payment_intent_id} for order {order.id}")
                        except Exception as e:
                            logger.error(f"Error canceling payment intent for order {order.id}: {str(e)}")
                            # Tiếp tục dù có lỗi khi cancel payment intent
                        
                        cancelled_count += 1
                        logger.info(f"Auto-cancelled order {order.id} due to expired payment deadline")
                        
                except Exception as e:
                    failed_count += 1
                    logger.error(f"Error cancelling order {order.id}: {str(e)}")
                    self.stdout.write(self.style.ERROR(
                        f'❌ Lỗi khi hủy đơn hàng {order.id}: {str(e)}'
                    ))
            
            self.stdout.write(self.style.SUCCESS(
                f'✅ Đã hủy {cancelled_count} đơn hàng quá hạn thanh toán.'
            ))
            
            if failed_count > 0:
                self.stdout.write(self.style.WARNING(
                    f'⚠️ {failed_count} đơn hàng không thể hủy do lỗi.'
                ))

