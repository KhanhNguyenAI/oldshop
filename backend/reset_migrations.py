import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings')
django.setup()

with connection.cursor() as cursor:
    print("Clearing migration history for Products...")
    cursor.execute("DELETE FROM django_migrations WHERE app='Products'")
    
print("Done.")

