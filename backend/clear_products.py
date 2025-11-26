import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings')
django.setup()

from Products.models import Product

print("Deleting all products to prepare for UUID migration...")
Product.objects.all().delete()
print("Done.")

