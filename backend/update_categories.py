import os
import django
import sys

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings')
django.setup()

from Products.models import Category

# Force UTF-8 for stdout just in case (though difficult in some Windows consoles)
sys.stdout.reconfigure(encoding='utf-8')

def update_categories():
    updates = {
        'electronics': 'Electronics',
        'furniture': 'Furniture',
        'kitchen-appliances': 'Kitchen & Appliances',
        'vehicles': 'Vehicles & Accessories',
        'fashion': 'Fashion',
        'hobby': 'Hobby',
        'hardware-tools': 'Hardware & Tools'
    }

    print("Starting category update...")
    
    for slug, new_name in updates.items():
        try:
            category = Category.objects.get(slug=slug)
            # Just print slug to avoid encoding errors with old Vietnamese names
            category.name = new_name
            category.save()
            print(f"Updated slug '{slug}' -> Name: '{new_name}'")
        except Category.DoesNotExist:
            print(f"Skipped: Category with slug '{slug}' not found.")
        except Exception as e:
            print(f"Error updating '{slug}': {e}")

    print("Update completed.")

if __name__ == '__main__':
    update_categories()
