import os
import sys
import django
import random

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from Products.models import Product

def seed_stock():
    products = Product.objects.all()
    count = 0
    
    print(f"Updating stock for {products.count()} products...")
    
    for product in products:
        # Giả lập: 20% sản phẩm đã hết hàng (sold out)
        if random.random() < 0.2:
            product.stock_quantity = 0
            product.is_sold = True
        else:
            # Random stock từ 1 đến 10 (đồ cũ thường ít)
            product.stock_quantity = random.randint(1, 10)
            product.is_sold = False
            
        # Random sold quantity (đã bán) từ 0 đến 50
        product.sold_quantity = random.randint(0, 50)
        
        product.save()
        count += 1
        
    print(f"Successfully updated {count} products.")

if __name__ == "__main__":
    seed_stock()

