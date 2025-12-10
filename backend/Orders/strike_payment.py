"""
Strike Payment Integration for Family payment method
"""
try:
    import stripe
    STRIPE_AVAILABLE = True
except ImportError:
    STRIPE_AVAILABLE = False
    stripe = None

from django.conf import settings
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)

# Initialize Stripe with API key
if STRIPE_AVAILABLE:
    stripe.api_key = settings.STRIKE_SECRET_KEY if hasattr(settings, 'STRIKE_SECRET_KEY') and settings.STRIKE_SECRET_KEY else None


def create_family_payment_intent(amount: Decimal, currency: str = 'jpy', metadata: dict = None):
    """
    Create a PaymentIntent for FamilyMart (Konbini) payment via Stripe
    
    Args:
        amount: Amount in smallest currency unit (e.g., yen)
        currency: Currency code (default: 'jpy')
        metadata: Additional metadata to attach to the payment
    
    Returns:
        dict: PaymentIntent object with client_secret and konbini details
    """
    if not STRIPE_AVAILABLE:
        raise ValueError("Stripe package is not installed. Please run: pip install stripe")
    
    if not stripe.api_key:
        raise ValueError("Strike API key is not configured. Please set STRIKE_SECRET_KEY in .env")
    
    try:
        # Convert Decimal to int (Stripe uses smallest currency unit)
        amount_int = int(float(amount))
        
        payment_intent = stripe.PaymentIntent.create(
            amount=amount_int,
            currency=currency.lower(),
            payment_method_types=['konbini'],  # Konbini includes FamilyMart
            metadata=metadata or {},
        )
        
        # Retrieve the full payment intent to get konbini details
        # For konbini payments, we need to confirm it first to get the barcode
        # But we can return the payment intent ID and client_secret for now
        # The barcode will be available after confirmation
        
        logger.info(f"Created Family payment intent: {payment_intent.id}")
        
        result = {
            'id': payment_intent.id,
            'client_secret': payment_intent.client_secret,
            'status': payment_intent.status,
        }
        
        # Try to get konbini display details if available
        # This might be available after confirmation
        if hasattr(payment_intent, 'next_action') and payment_intent.next_action:
            if hasattr(payment_intent.next_action, 'konbini_display_details'):
                konbini_details = payment_intent.next_action.konbini_display_details
                if konbini_details:
                    result['konbini_barcode'] = getattr(konbini_details, 'barcode', None)
                    result['konbini_number'] = getattr(konbini_details, 'number', None)
                    result['expires_at'] = getattr(konbini_details, 'expires_at', None)
        
        return result
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error creating payment intent: {str(e)}")
        raise Exception(f"Payment processing error: {str(e)}")


def confirm_family_payment(payment_intent_id: str):
    """
    Confirm/Retrieve payment intent status
    
    Args:
        payment_intent_id: Stripe PaymentIntent ID
    
    Returns:
        dict: PaymentIntent status and details including konbini barcode
    """
    if not STRIPE_AVAILABLE:
        raise ValueError("Stripe package is not installed. Please run: pip install stripe")
    
    if not stripe.api_key:
        raise ValueError("Strike API key is not configured")
    
    try:
        payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        
        result = {
            'id': payment_intent.id,
            'status': payment_intent.status,
            'amount': payment_intent.amount,
            'currency': payment_intent.currency,
            'metadata': payment_intent.metadata,
        }
        
        # Extract konbini display details if available
        if hasattr(payment_intent, 'next_action') and payment_intent.next_action:
            if hasattr(payment_intent.next_action, 'konbini_display_details'):
                konbini_details = payment_intent.next_action.konbini_display_details
                if konbini_details:
                    result['konbini_barcode'] = getattr(konbini_details, 'barcode', None)
                    result['konbini_number'] = getattr(konbini_details, 'number', None)
                    result['expires_at'] = getattr(konbini_details, 'expires_at', None)
        
        return result
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error retrieving payment intent: {str(e)}")
        raise Exception(f"Payment retrieval error: {str(e)}")


def confirm_family_payment_with_customer(payment_intent_id: str, customer_name: str = None, customer_email: str = None):
    """
    Confirm a Family payment intent with customer information to get the barcode
    
    Args:
        payment_intent_id: Stripe PaymentIntent ID
        customer_name: Customer name (optional)
        customer_email: Customer email (optional)
    
    Returns:
        dict: Updated PaymentIntent with konbini details
    """
    if not STRIPE_AVAILABLE:
        raise ValueError("Stripe package is not installed")
    
    if not stripe.api_key:
        raise ValueError("Strike API key is not configured")
    
    try:
        # Create or retrieve customer if email/name provided
        customer_id = None
        if customer_email:
            # Try to find existing customer by email
            customers = stripe.Customer.list(email=customer_email, limit=1)
            if customers.data:
                customer_id = customers.data[0].id
            else:
                # Create new customer
                customer = stripe.Customer.create(
                    email=customer_email,
                    name=customer_name or '',
                )
                customer_id = customer.id
        
        # Create payment method for konbini
        payment_method_data = {
            'type': 'konbini',
        }

        # Stripe's confirm endpoint for PaymentIntents running the default API
        # version used by this account does not accept a top-level `customer`
        # parameter (it raised "Received unknown parameter: customer"). To keep
        # the customer association while avoiding that error, update the
        # PaymentIntent first, then confirm with only the allowed fields.
        if customer_id:
            stripe.PaymentIntent.modify(
                payment_intent_id,
                customer=customer_id,
            )

        # Add billing details so konbini receipts are sent correctly
        billing_details = {}
        if customer_email:
            billing_details['email'] = customer_email
        if customer_name:
            billing_details['name'] = customer_name
        if billing_details:
            payment_method_data['billing_details'] = billing_details

        confirm_params = {
            'payment_method_data': payment_method_data,
        }
        
        # Confirm the payment intent
        payment_intent = stripe.PaymentIntent.confirm(
            payment_intent_id,
            **confirm_params
        )
        
        result = {
            'id': payment_intent.id,
            'status': payment_intent.status,
        }
        
        # Extract konbini display details
        if hasattr(payment_intent, 'next_action') and payment_intent.next_action:
            if hasattr(payment_intent.next_action, 'konbini_display_details'):
                konbini_details = payment_intent.next_action.konbini_display_details
                if konbini_details:
                    result['konbini_barcode'] = getattr(konbini_details, 'barcode', None)
                    result['konbini_number'] = getattr(konbini_details, 'number', None)
                    result['expires_at'] = getattr(konbini_details, 'expires_at', None)
        
        return result
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error confirming payment intent: {str(e)}")
        raise Exception(f"Payment confirmation error: {str(e)}")


def get_family_payment_code(payment_intent_id: str):
    """
    Get the Family payment code (barcode/number) from a payment intent
    
    Args:
        payment_intent_id: Stripe PaymentIntent ID
    
    Returns:
        dict: Konbini payment details (barcode, number, expires_at)
    """
    if not STRIPE_AVAILABLE:
        raise ValueError("Stripe package is not installed")
    
    if not stripe.api_key:
        raise ValueError("Strike API key is not configured")
    
    try:
        payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        
        # Check for konbini display details
        if hasattr(payment_intent, 'next_action') and payment_intent.next_action:
            if hasattr(payment_intent.next_action, 'konbini_display_details'):
                konbini_details = payment_intent.next_action.konbini_display_details
                if konbini_details:
                    return {
                        'barcode': getattr(konbini_details, 'barcode', None),
                        'number': getattr(konbini_details, 'number', None),
                        'expires_at': getattr(konbini_details, 'expires_at', None),
                    }
        
        # If not in next_action, check payment_method
        if hasattr(payment_intent, 'payment_method') and payment_intent.payment_method:
            pm = stripe.PaymentMethod.retrieve(payment_intent.payment_method)
            if hasattr(pm, 'konbini'):
                return {
                    'barcode': getattr(pm.konbini, 'barcode', None),
                    'number': getattr(pm.konbini, 'number', None),
                }
        
        return None
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error retrieving payment code: {str(e)}")
        raise Exception(f"Payment code retrieval error: {str(e)}")


def handle_strike_webhook(payload: bytes, signature: str):
    """
    Handle webhook events from Stripe
    
    Args:
        payload: Raw webhook payload
        signature: Stripe signature header
    
    Returns:
        dict: Event data
    """
    if not STRIPE_AVAILABLE:
        raise ValueError("Stripe package is not installed. Please run: pip install stripe")
    
    if not stripe.api_key:
        raise ValueError("Strike API key is not configured")
    
    webhook_secret = getattr(settings, 'STRIKE_WEBHOOK_SECRET', None)
    
    try:
        if webhook_secret:
            event = stripe.Webhook.construct_event(
                payload, signature, webhook_secret
            )
        else:
            # For development, decode without verification
            import json
            event = json.loads(payload.decode('utf-8'))
        
        logger.info(f"Received webhook event: {event.get('type')}")
        return event
    except ValueError as e:
        logger.error(f"Invalid webhook payload: {str(e)}")
        raise
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Invalid webhook signature: {str(e)}")
        raise

