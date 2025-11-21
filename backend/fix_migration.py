"""
Script để fix lỗi InconsistentMigrationHistory
Chạy script này để fake migration Users.0001_initial
"""

import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings')
django.setup()

from django.core.management import call_command

print("Đang fake migration Users.0001_initial...")
try:
    call_command('migrate', 'Users', '0001_initial', fake=True)
    print("✅ Fake migration thành công!")
    print("\nBây giờ chạy: python manage.py migrate")
except Exception as e:
    print(f"❌ Lỗi: {e}")
    print("\nThử giải pháp khác trong FIX_MIGRATION.md")

