import os
import django
import random
from decimal import Decimal

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings')
django.setup()

from Products.models import Category, Product, Brand, ProductImage
from django.contrib.auth import get_user_model

def seed_products():
    User = get_user_model()
    # Get admin user as seller
    seller = User.objects.first()
    if not seller:
        print("No user found. Please create a user first.")
        return

    categories = Category.objects.all()
    
    # Data templates for different categories
    TEMPLATES = {
        'default': {
            'titles': ['Vintage Item', 'Rare Find', 'Classic Piece'],
            'images': ['https://images.unsplash.com/photo-1550948537-130a1ce83314?auto=format&fit=crop&q=80&w=800'],
            'desc': 'A wonderful vintage item in great condition.',
            'specs': {'Material': 'Mixed', 'Year': '2020'}
        },
        'smartphone': {
            'titles': ['iPhone 12', 'Samsung Galaxy S21', 'Google Pixel 6'],
            'images': ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=800'],
            'brand': 'Apple',
            'desc': 'Used smartphone in good working order. Minor scratches.',
            'specs': {'Screen': '6.1 inch', 'Storage': '128GB', 'Battery': '85%'}
        },
        'laptop': {
            'titles': ['MacBook Air M1', 'Dell XPS 13', 'ThinkPad X1 Carbon'],
            'images': ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&q=80&w=800'],
            'brand': 'Apple',
            'desc': 'Powerful laptop for work and play. Keyboard is clean.',
            'specs': {'CPU': 'M1', 'RAM': '8GB', 'SSD': '256GB'}
        },
        'camera': {
            'titles': ['Canon EOS R5', 'Sony A7III', 'Fujifilm X-T4'],
            'images': ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800'],
            'brand': 'Canon',
            'desc': 'Professional camera body. Low shutter count.',
            'specs': {'Sensor': 'Full Frame', 'Megapixels': '24MP', 'Shutter Count': '5000'}
        },
        'headphones': {
            'titles': ['Sony WH-1000XM4', 'Bose QC35 II', 'AirPods Max'],
            'images': ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800'],
            'brand': 'Sony',
            'desc': 'Noise cancelling headphones. Pads are slightly worn but comfortable.',
            'specs': {'Type': 'Over-ear', 'Connectivity': 'Bluetooth', 'Battery Life': '30h'}
        },
        'sofa': {
            'titles': ['Leather Chesterfield Sofa', 'Modern Grey Fabric Sofa', 'L-Shape Sectional'],
            'images': ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800'],
            'desc': 'Comfortable 3-seater sofa. Perfect for living room.',
            'specs': {'Material': 'Leather', 'Width': '200cm', 'Color': 'Brown'}
        },
        'chair': {
            'titles': ['Eames Lounge Chair Replica', 'Wooden Dining Chair', 'Ergonomic Office Chair'],
            'images': ['https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&q=80&w=800'],
            'desc': 'Sturdy and stylish chair.',
            'specs': {'Material': 'Wood/Plastic', 'Height': '90cm'}
        },
        'desk': {
            'titles': ['Standing Desk', 'Solid Oak Writing Desk', 'Minimalist Computer Desk'],
            'images': ['https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&q=80&w=800'],
            'desc': 'Spacious desk with some wear on surface.',
            'specs': {'Width': '120cm', 'Depth': '60cm', 'Material': 'Wood'}
        },
        'bicycle': {
            'titles': ['Giant Escape R3', 'Bianchi Road Bike', 'Tokyobike Single Speed'],
            'images': ['https://images.unsplash.com/photo-1485965120184-e224f723d621?auto=format&fit=crop&q=80&w=800'],
            'desc': 'City commuter bike. Recently serviced.',
            'specs': {'Frame Size': 'M', 'Gears': '21 speed', 'Color': 'Blue'}
        },
        'watch': {
            'titles': ['Seiko Presage', 'Casio G-Shock', 'Vintage Omega'],
            'images': ['https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80&w=800'],
            'desc': 'Automatic watch keeping good time.',
            'specs': {'Movement': 'Automatic', 'Case Size': '40mm', 'Strap': 'Leather'}
        },
        'clothes': {
            'titles': ['Vintage Denim Jacket', 'Wool Trench Coat', 'Silk Shirt'],
            'images': ['https://images.unsplash.com/photo-1551028919-380103094e41?auto=format&fit=crop&q=80&w=800'],
            'desc': 'High quality vintage clothing. Dry cleaned.',
            'specs': {'Size': 'L', 'Material': 'Cotton/Wool', 'Brand': 'Uniqlo'}
        },
        'shoes': {
            'titles': ['Leather Boots', 'Nike Air Max', 'Adidas Stan Smith'],
            'images': ['https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=800'],
            'desc': 'Worn a few times. Soles are in good condition.',
            'specs': {'Size': '27cm', 'Color': 'White', 'Material': 'Leather'}
        },
         'bag': {
            'titles': ['Leather Messenger Bag', 'Canvas Tote', 'Hiking Backpack'],
            'images': ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=800'],
            'desc': 'Durable bag for daily use.',
            'specs': {'Capacity': '20L', 'Material': 'Canvas', 'Color': 'Green'}
        },
        'musical instruments': {
            'titles': ['Yamaha Acoustic Guitar', 'Fender Stratocaster', 'Roland Keyboard'],
            'images': ['https://images.unsplash.com/photo-1550985543-f47f38aeee65?auto=format&fit=crop&q=80&w=800'],
            'desc': 'Sounds great. Comes with soft case.',
            'specs': {'Type': 'String', 'Condition': 'Good'}
        }
    }

    print(f"Found {categories.count()} categories.")

    for category in categories:
        # Check if product already exists to avoid spamming (optional, but requested 'create for each')
        # We'll just create one anyway
        
        # Determine template based on category name
        cat_key = 'default'
        for key in TEMPLATES.keys():
            if key in category.name.lower():
                cat_key = key
                break
        
        template = TEMPLATES[cat_key]
        
        title = random.choice(template['titles'])
        price = random.randint(1000, 100000)
        
        # Get or Create Brand if needed
        brand = None
        if 'brand' in template:
            brand, _ = Brand.objects.get_or_create(name=template['brand'], defaults={'slug': template['brand'].lower()})
        
        product = Product.objects.create(
            seller=seller,
            category=category,
            brand=brand,
            title=f"{title} ({category.name})",
            description=template['desc'] + "\n\n" + f"This is a sample product for category: {category.name}.",
            price=price,
            condition=random.choice(['good', 'like_new', 'fair']),
            location="Tokyo, Japan",
            specifications=template['specs'],
            condition_detail="- No major defects.\n- Cleaned and sanitized.\n- Ready to use.",
            image=template['images'][0]
        )
        
        print(f"Created product: {product.title} in {category.name}")

if __name__ == '__main__':
    seed_products()

