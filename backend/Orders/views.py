from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db import transaction
from decimal import Decimal
from django.core.mail import send_mail
from django.conf import settings
from .models import Order
from .serializers import OrderSerializer
from .strike_payment import create_family_payment_intent, confirm_family_payment, handle_strike_webhook, get_family_payment_code, confirm_family_payment_with_customer
import json
import logging

logger = logging.getLogger(__name__)

class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Admin can see all orders, regular users only their own
        if self.request.user.is_staff or self.request.user.is_superuser:
            return Order.objects.all()
        return Order.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Automatically associate order with current user
        serializer.save(user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        order = self.get_object()
        if order.status != 'cancelled':
             return Response(
                {'error': 'キャンセルされた注文のみ削除できます。'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """Admin can update order status"""
        order = self.get_object()
        new_status = request.data.get('status')
        
        if not new_status:
            return Response(
                {'error': 'status field is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if new_status not in dict(Order.STATUS_CHOICES):
            return Response(
                {'error': f'Invalid status. Must be one of: {", ".join(dict(Order.STATUS_CHOICES).keys())}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.status = new_status
        order.save()
        
        return Response(OrderSerializer(order).data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        order = self.get_object()
        
        if order.status not in ['pending', 'processing']:
            return Response(
                {'error': '発送済みまたは完了した注文はキャンセルできません。'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from django.db import transaction
        try:
            with transaction.atomic():
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
                
                # Vô hiệu hóa payment intent nếu có (cho FamilyMart payment)
                if order.payment_method == 'family' and order.payment_intent_id:
                    try:
                        import stripe
                        from django.conf import settings
                        
                        if hasattr(settings, 'STRIKE_SECRET_KEY') and settings.STRIKE_SECRET_KEY:
                            stripe.api_key = settings.STRIKE_SECRET_KEY
                            
                            # Kiểm tra payment intent status trước khi cancel
                            payment_intent = stripe.PaymentIntent.retrieve(order.payment_intent_id)
                            
                            # Chỉ cancel nếu chưa thanh toán
                            if payment_intent.status not in ['succeeded', 'canceled']:
                                stripe.PaymentIntent.cancel(order.payment_intent_id)
                                logger.info(f"Canceled payment intent {order.payment_intent_id} for order {order.id}")
                    except Exception as e:
                        logger.error(f"Error canceling payment intent for order {order.id}: {str(e)}")
                        # Tiếp tục dù có lỗi khi cancel payment intent
                        
            return Response({'message': '注文がキャンセルされました。在庫が復元されました。', 'status': order.status})
        except Exception as e:
            return Response(
                {'error': f'キャンセル処理中にエラーが発生しました: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def send_family_payment_email(self, email: str, payment_code: str, order_id: str, amount: Decimal, expires_at=None):
        """
        Send email with Family payment code to user
        """
        subject = 'ファミリーマート決済コード - OldShop'
        
        # Format expiration date if provided
        expiry_info = ''
        if expires_at:
            try:
                from datetime import datetime
                if isinstance(expires_at, int):
                    expiry_dt = datetime.fromtimestamp(expires_at)
                    expiry_info = f'\n【有効期限】\n{expiry_dt.strftime("%Y年%m月%d日 %H:%M")}まで\n'
            except:
                pass
        
        message = f'''
こんにちは、

ご注文ありがとうございます。

ファミリーマートでのお支払いコードをお送りします。

【決済コード】
{payment_code}

【注文番号】
{order_id}

【お支払い金額】
¥{amount:,.0f}
{expiry_info}
【お支払い方法】
1. 最寄りのファミリーマート店舗へお越しください
2. レジで「バーコード決済」または「番号決済」を選択してください
3. 上記の決済コードを提示してください
4. お支払いを完了してください

※ このコードは有効期限があります。期限内にお支払いをお願いいたします。

ご不明な点がございましたら、お気軽にお問い合わせください。

OldShop Team
        '''
        
        try:
            send_mail(
                subject,
                message,
                settings.EMAIL_HOST_USER or 'noreply@oldshop.com',
                [email],
                fail_silently=False,
            )
            logger.info(f"Family payment email sent to {email} for order {order_id}")
            return True
        except Exception as e:
            logger.error(f"Error sending family payment email: {str(e)}")
            return False

    @action(detail=False, methods=['post'], url_path='create-family-payment')
    def create_family_payment(self, request):
        """
        Create a Family payment intent for an order and send email with payment code
        """
        try:
            amount = Decimal(str(request.data.get('amount', 0)))
            order_id = request.data.get('order_id')
            metadata = request.data.get('metadata', {})
            
            if not amount or amount <= 0:
                return Response(
                    {'error': '有効な金額を入力してください。'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get email from metadata or request user
            user_email = metadata.get('email') or (request.user.email if request.user.is_authenticated else None)
            
            if not user_email:
                return Response(
                    {'error': 'メールアドレスが必要です。'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Add order_id to metadata if provided
            if order_id:
                metadata['order_id'] = str(order_id)
            
            payment_intent = create_family_payment_intent(
                amount=amount,
                currency='jpy',
                metadata=metadata
            )
            
            payment_intent_id = payment_intent['id']
            
            # Save payment_intent_id to order if order_id is provided
            if order_id:
                try:
                    from django.utils import timezone
                    from datetime import timedelta
                    order = Order.objects.get(id=order_id)
                    order.payment_intent_id = payment_intent_id
                    order.payment_method = 'family'
                    # Set payment deadline to 2 days from now
                    order.payment_deadline = timezone.now() + timedelta(days=2)
                    order.save()
                    logger.info(f"Saved payment_intent_id {payment_intent_id} to order {order_id} with deadline {order.payment_deadline}")
                except Order.DoesNotExist:
                    logger.warning(f"Order {order_id} not found when saving payment_intent_id")
            
            # Try to confirm the payment intent to get the konbini barcode
            # This requires customer information
            payment_code = None
            expires_at = None
            customer_name = metadata.get('full_name', '')
            
            try:
                # Try to confirm payment intent with customer info to get barcode immediately
                confirmed_intent = confirm_family_payment_with_customer(
                    payment_intent_id=payment_intent_id,
                    customer_name=customer_name,
                    customer_email=user_email
                )
                
                # Extract konbini details from confirmed intent
                if 'konbini_barcode' in confirmed_intent:
                    payment_code = confirmed_intent['konbini_barcode']
                elif 'konbini_number' in confirmed_intent:
                    payment_code = confirmed_intent['konbini_number']
                
                if 'expires_at' in confirmed_intent:
                    expires_at = confirmed_intent['expires_at']
                    
            except Exception as e:
                logger.warning(f"Could not confirm payment intent immediately: {str(e)}")
                # Fallback: try to get code without confirmation
                try:
                    konbini_details = get_family_payment_code(payment_intent_id)
                    if konbini_details:
                        payment_code = konbini_details.get('barcode') or konbini_details.get('number')
                        expires_at = konbini_details.get('expires_at')
                except Exception as e2:
                    logger.warning(f"Could not retrieve konbini code: {str(e2)}")
            
            # If we still don't have the code, use payment intent ID as reference
            # The user can check their order page or we can send another email when code is available
            if not payment_code:
                payment_code = payment_intent_id
                logger.info(f"Using payment intent ID as code for {payment_intent_id}")
            
            # Send email with payment code
            email_sent = self.send_family_payment_email(
                email=user_email,
                payment_code=payment_code,
                order_id=str(order_id) if order_id else payment_intent_id,
                amount=amount,
                expires_at=expires_at
            )
            
            response_data = {
                'client_secret': payment_intent['client_secret'],
                'payment_intent_id': payment_intent_id,
                'status': payment_intent['status'],
                'email_sent': email_sent
            }
            
            # Include konbini details if available
            if 'konbini_barcode' in payment_intent:
                response_data['konbini_barcode'] = payment_intent['konbini_barcode']
            if 'konbini_number' in payment_intent:
                response_data['konbini_number'] = payment_intent['konbini_number']
            
            return Response(response_data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error creating family payment: {str(e)}")
            return Response(
                {'error': f'支払い処理の作成に失敗しました: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post', 'get'], url_path='confirm-family-payment')
    def confirm_family_payment(self, request, pk=None):
        """
        Confirm Family payment status for an order
        Can be called with POST (with payment_intent_id) or GET (uses order's payment_intent_id)
        """
        order = self.get_object()
        
        # Get payment_intent_id from request data or from order
        payment_intent_id = request.data.get('payment_intent_id') if request.method == 'POST' else None
        
        if not payment_intent_id:
            # Try to get from order
            if order.payment_intent_id:
                payment_intent_id = order.payment_intent_id
            else:
                return Response(
                    {'error': 'payment_intent_idが必要です。注文にpayment_intent_idが設定されていません。'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        try:
            payment_info = confirm_family_payment(payment_intent_id)
            
            # Update order with payment intent ID if not already set
            if not order.payment_intent_id:
                order.payment_intent_id = payment_intent_id
                order.save()
            
            # Update order status based on payment status
            if payment_info['status'] == 'succeeded':
                if order.status == 'pending':
                    order.status = 'processing'
                    order.save()
                    logger.info(f"Order {order.id} payment confirmed, status updated to 'processing'")
            elif payment_info['status'] == 'canceled' or payment_info['status'] == 'payment_failed':
                if order.status == 'pending':
                    order.status = 'cancelled'
                    order.save()
                    logger.info(f"Order {order.id} payment failed, status updated to 'cancelled'")
            
            return Response({
                'payment_status': payment_info['status'],
                'order_status': order.status,
                'payment_intent_id': payment_info['id'],
                'order_id': str(order.id)
            })
            
        except Exception as e:
            logger.error(f"Error confirming family payment for order {order.id}: {str(e)}")
            return Response(
                {'error': f'支払い確認に失敗しました: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'], url_path='check-pending-family-payments')
    def check_pending_family_payments(self, request):
        """
        Check payment status for all pending orders with family payment method
        This is useful for polling or scheduled checks
        """
        try:
            # Get all pending orders with family payment method and payment_intent_id
            pending_orders = Order.objects.filter(
                status='pending',
                payment_method='family',
                payment_intent_id__isnull=False
            )
            
            updated_count = 0
            results = []
            
            for order in pending_orders:
                try:
                    payment_info = confirm_family_payment(order.payment_intent_id)
                    
                    # Update order status if payment succeeded
                    if payment_info['status'] == 'succeeded' and order.status == 'pending':
                        order.status = 'processing'
                        order.save()
                        updated_count += 1
                        logger.info(f"Order {order.id} payment confirmed via check_pending_family_payments")
                    
                    results.append({
                        'order_id': str(order.id),
                        'payment_status': payment_info['status'],
                        'order_status': order.status,
                        'updated': payment_info['status'] == 'succeeded' and order.status == 'processing'
                    })
                except Exception as e:
                    logger.error(f"Error checking payment for order {order.id}: {str(e)}")
                    results.append({
                        'order_id': str(order.id),
                        'error': str(e)
                    })
            
            return Response({
                'checked_orders': len(results),
                'updated_orders': updated_count,
                'results': results
            })
            
        except Exception as e:
            logger.error(f"Error checking pending family payments: {str(e)}")
            return Response(
                {'error': f'支払い確認処理に失敗しました: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
