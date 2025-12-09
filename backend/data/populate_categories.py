import os
import django
from django.utils.text import slugify

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings')
django.setup()

from Products.models import Category

DATA = {
    "Electronics": [
        "Smartphone", "Laptop", "Tablet", "Monitor", "Camera", "Smartwatch",
        "Headphones", "Speakers", "Game Console", "Printer", "PC Accessories"
    ],
    "Furniture": [
        "Sofa", "Desk", "Chair", "Bookshelf", "Wardrobe", "Bed", "Gaming Chair"
    ],
    "Kitchen & Appliances": [
        "Refrigerator", "Washing Machine", "Microwave", "Rice Cooker", "Stove",
        "Air Fryer", "Blender", "Cookware Set", "Kitchen Tools"
    ],
    "Vehicles & Accessories": [
        "Bicycle", "Used Motorcycle", "Helmet", "Lock", "Mirrors", "Accessories"
    ],
    "Fashion": [
        "Clothes", "Shoes", "Bags", "Jewelry", "Watch", "Accessories"
    ],
    "Hobby": [
        "Musical Instruments", "Decor", "Model & Figures", "Board Games"
    ],
    "Hardware & Tools": [
        "Drill", "Cutter", "Welding Mini", "Ladder", "Tool Kits",
        "Screwdriver Set", "Laser Measure", "Paint Tools", "Wrenches",
        "Air Blower", "Mini Air Compressor", "Electric Pump"
    ]
}

def populate():
    print("Clearing old categories...")
    # Xóa hết category cũ để tạo lại cho sạch
    Category.objects.all().delete()
    
    print("Creating new categories structure...")
    
    for parent_name, children in DATA.items():
        # Create Parent
        parent_slug = slugify(parent_name)
        # Handle duplicates/collisions if any, but slugify is usually fine
        # 'Accessories' appears in multiple parents, so child slugs need to be unique or handled contextually.
        # However, Django SlugField unique=True requires global uniqueness.
        # We will append parent slug to child slug to ensure uniqueness: e.g. vehicles-accessories
        
        parent = Category.objects.create(
            name=parent_name,
            slug=parent_slug
        )
        print(f"Created Parent: {parent_name}")
        
        for child_name in children:
            child_slug = slugify(f"{child_name}")
            
            # Check collision (e.g. 'Accessories' in Vehicles and Fashion)
            if Category.objects.filter(slug=child_slug).exists():
                child_slug = slugify(f"{parent_slug}-{child_name}")
            
            Category.objects.create(
                name=child_name,
                slug=child_slug,
                parent=parent
            )
            print(f"  - Created Child: {child_name} ({child_slug})")

    print("Done!")

if __name__ == '__main__':
    populate()

