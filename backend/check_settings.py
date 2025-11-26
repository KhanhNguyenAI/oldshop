import os
import django
from django.conf import settings

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "myproject.settings")
django.setup()

print(f"SUPABASE_URL: {settings.SUPABASE_URL}")
print(f"SUPABASE_KEY: {settings.SUPABASE_KEY}")
print(f"SUPABASE_AVATAR_BUCKET: {getattr(settings, 'SUPABASE_AVATAR_BUCKET', 'Not Set')}")

