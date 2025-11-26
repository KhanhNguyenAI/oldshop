import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings')
django.setup()

with connection.cursor() as cursor:
    print("Dropping Products_productimage...")
    cursor.execute('DROP TABLE IF EXISTS "Products_productimage" CASCADE')
    print("Dropping Products_product...")
    cursor.execute('DROP TABLE IF EXISTS "Products_product" CASCADE')
    print("Dropping Products_category...")
    cursor.execute('DROP TABLE IF EXISTS "Products_category" CASCADE')
    
print("Tables dropped.")
