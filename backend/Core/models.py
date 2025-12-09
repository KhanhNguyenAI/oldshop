from django.db import models

class Contact(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField()
    message = models.TextField()
    admin_reply = models.TextField(blank=True, null=True, help_text="Admin's reply to this inquiry")
    replied_by = models.ForeignKey('Users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='replied_contacts', help_text="Admin who replied")
    replied_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_resolved = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.name} - {self.email}"
    
    class Meta:
        ordering = ['-created_at']
