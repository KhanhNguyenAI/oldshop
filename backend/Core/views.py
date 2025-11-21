from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from django.core.mail import send_mail
from django.conf import settings
from .models import Contact
from .serializers import ContactSerializer

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
