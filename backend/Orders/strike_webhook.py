"""
Strike Webhook Handler for payment events
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt
from .models import Order
from .strike_payment import handle_strike_webhook
import logging

logger = logging.getLogger(__name__)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def strike_webhook(request):
    """
    Handle webhook events from Strike/Stripe
    """
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    
    if not sig_header:
        return Response(
            {'error': 'Missing signature header'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        event = handle_strike_webhook(payload, sig_header)
        
        # Handle different event types
        if event['type'] == 'payment_intent.succeeded':
            payment_intent = event['data']['object']
            payment_intent_id = payment_intent['id']
            order_id = payment_intent.get('metadata', {}).get('order_id')
            
            order = None
            if order_id:
                try:
                    order = Order.objects.get(id=order_id)
                except Order.DoesNotExist:
                    logger.warning(f"Order {order_id} not found by ID, trying payment_intent_id")
            
            # Fallback: try to find order by payment_intent_id
            if not order:
                try:
                    order = Order.objects.get(payment_intent_id=payment_intent_id)
                    logger.info(f"Found order by payment_intent_id: {order.id}")
                except Order.DoesNotExist:
                    logger.warning(f"Order not found for payment_intent_id {payment_intent_id}")
                except Order.MultipleObjectsReturned:
                    # If multiple orders have same payment_intent_id, get the most recent one
                    order = Order.objects.filter(payment_intent_id=payment_intent_id).order_by('-created_at').first()
                    logger.warning(f"Multiple orders found for payment_intent_id {payment_intent_id}, using most recent: {order.id}")
            
            if order:
                order.status = 'processing'
                order.payment_intent_id = payment_intent_id
                order.save()
                logger.info(f"Order {order.id} payment succeeded and status updated to 'processing'")
            else:
                logger.error(f"Could not find order for payment_intent {payment_intent_id}")
        
        elif event['type'] == 'payment_intent.payment_failed':
            payment_intent = event['data']['object']
            payment_intent_id = payment_intent['id']
            order_id = payment_intent.get('metadata', {}).get('order_id')
            
            order = None
            if order_id:
                try:
                    order = Order.objects.get(id=order_id)
                except Order.DoesNotExist:
                    logger.warning(f"Order {order_id} not found by ID, trying payment_intent_id")
            
            # Fallback: try to find order by payment_intent_id
            if not order:
                try:
                    order = Order.objects.get(payment_intent_id=payment_intent_id)
                    logger.info(f"Found order by payment_intent_id: {order.id}")
                except Order.DoesNotExist:
                    logger.warning(f"Order not found for payment_intent_id {payment_intent_id}")
                except Order.MultipleObjectsReturned:
                    # If multiple orders have same payment_intent_id, get the most recent one
                    order = Order.objects.filter(payment_intent_id=payment_intent_id).order_by('-created_at').first()
                    logger.warning(f"Multiple orders found for payment_intent_id {payment_intent_id}, using most recent: {order.id}")
            
            if order:
                order.status = 'cancelled'
                order.payment_intent_id = payment_intent_id
                order.save()
                logger.info(f"Order {order.id} payment failed and status updated to 'cancelled'")
            else:
                logger.error(f"Could not find order for payment_intent {payment_intent_id}")
        
        return Response({'received': True}, status=status.HTTP_200_OK)
        
    except ValueError as e:
        logger.error(f"Invalid webhook payload: {str(e)}")
        return Response(
            {'error': 'Invalid payload'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

