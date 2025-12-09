from rest_framework import serializers
from .models import Contact

class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = ['id', 'name', 'email', 'message', 'created_at']
        read_only_fields = ['created_at']

class ContactAdminSerializer(serializers.ModelSerializer):
    replied_by_email = serializers.EmailField(source='replied_by.email', read_only=True)
    
    class Meta:
        model = Contact
        fields = ['id', 'name', 'email', 'message', 'admin_reply', 'replied_by', 'replied_by_email', 'replied_at', 'created_at', 'is_resolved']
        read_only_fields = ['created_at', 'replied_at']

