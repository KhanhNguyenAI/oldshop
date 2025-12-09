from django.core.management.base import BaseCommand
from Products.models import Product, Category, Brand, ProductImage
from Users.models import User
from decimal import Decimal
import json
import os
import sys
from django.conf import settings

# Fix encoding for Windows console
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

class Command(BaseCommand):
    help = 'Import products from JSON data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--json-data',
            type=str,
            help='JSON string containing products data',
        )
        parser.add_argument(
            '--json-file',
            type=str,
            help='Path to JSON file containing products data',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Run without actually creating products (for testing)',
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear all existing products before importing',
        )

    def handle(self, *args, **options):
        json_data = options.get('json_data')
        json_file = options.get('json_file')
        dry_run = options.get('dry_run', False)
        clear_existing = options.get('clear', False)

        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No products will be created'))

        # Clear existing products if requested
        if clear_existing and not dry_run:
            count = Product.objects.count()
            self.stdout.write(self.style.WARNING(f'Clearing {count} existing products...'))
            Product.objects.all().delete()
            self.stdout.write(self.style.SUCCESS(f'✓ Cleared {count} products'))
        elif clear_existing and dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN: Would clear all existing products'))

        # Load JSON data
        if json_file:
            json_file_path = os.path.abspath(json_file)
            with open(json_file_path, 'r', encoding='utf-8') as f:
                products_data = json.load(f)
        elif json_data:
            products_data = json.loads(json_data)
        else:
            self.stdout.write(self.style.ERROR('Please provide --json-data or --json-file'))
            return

        # Ensure products_data is a list
        if not isinstance(products_data, list):
            products_data = [products_data]

        created_count = 0
        error_count = 0
        errors = []

        for idx, product_data in enumerate(products_data, 1):
            try:
                self.stdout.write(f'\nProcessing product {idx}/{len(products_data)}: {product_data.get("title", "Unknown")}')
                
                # Validate required fields
                required_fields = ['title', 'description', 'price', 'main_image']
                missing_fields = [field for field in required_fields if field not in product_data]
                
                # Check if category is provided (either category_id or category_name)
                if 'category_id' not in product_data and 'category_name' not in product_data:
                    missing_fields.append('category_id or category_name')
                
                # Check if seller is provided (either seller_id or seller_email)
                if 'seller_id' not in product_data and 'seller_email' not in product_data:
                    missing_fields.append('seller_id or seller_email')
                
                if missing_fields:
                    error_msg = f"Missing required fields: {', '.join(missing_fields)}"
                    self.stdout.write(self.style.ERROR(f'  ERROR: {error_msg}'))
                    errors.append(f"Product {idx}: {error_msg}")
                    error_count += 1
                    continue

                # Get or create category
                category = None
                category_id = product_data.get('category_id')
                category_name = product_data.get('category_name')
                
                if category_id:
                    try:
                        category = Category.objects.get(id=category_id)
                    except Category.DoesNotExist:
                        category_name = category_name or f'Category {category_id}'
                        self.stdout.write(self.style.WARNING(f'  Category ID {category_id} not found. Creating new category: {category_name}'))
                        category = Category.objects.create(
                            name=category_name,
                            slug=category_name.lower().replace(' ', '-').replace('、', '-')
                        )
                elif category_name:
                    # Try to find by name first
                    category = Category.objects.filter(name=category_name).first()
                    if not category:
                        # Create new category
                        self.stdout.write(self.style.WARNING(f'  Creating new category: {category_name}'))
                        category = Category.objects.create(
                            name=category_name,
                            slug=category_name.lower().replace(' ', '-').replace('、', '-')
                        )
                else:
                    error_msg = "Category not specified"
                    self.stdout.write(self.style.ERROR(f'  ERROR: {error_msg}'))
                    errors.append(f"Product {idx}: {error_msg}")
                    error_count += 1
                    continue

                # Get seller
                seller_id = product_data.get('seller_id')
                seller_email = product_data.get('seller_email')
                
                seller = None
                if seller_id:
                    try:
                        seller = User.objects.get(id=seller_id)
                    except User.DoesNotExist:
                        # Try to find by email if seller_email provided
                        if seller_email:
                            try:
                                seller = User.objects.get(email=seller_email)
                                self.stdout.write(self.style.WARNING(f'  Seller ID {seller_id} not found, using seller with email {seller_email} (ID: {seller.id})'))
                            except User.DoesNotExist:
                                pass
                        
                        if not seller:
                            # Use first available user as fallback
                            seller = User.objects.first()
                            if seller:
                                self.stdout.write(self.style.WARNING(f'  Seller ID {seller_id} not found, using fallback seller: {seller.email} (ID: {seller.id})'))
                            else:
                                error_msg = f"Seller ID {seller_id} not found and no users available"
                                self.stdout.write(self.style.ERROR(f'  ERROR: {error_msg}'))
                                errors.append(f"Product {idx}: {error_msg}")
                                error_count += 1
                                continue
                elif seller_email:
                    try:
                        seller = User.objects.get(email=seller_email)
                    except User.DoesNotExist:
                        seller = User.objects.first()
                        if seller:
                            self.stdout.write(self.style.WARNING(f'  Seller email {seller_email} not found, using fallback seller: {seller.email} (ID: {seller.id})'))
                        else:
                            error_msg = f"Seller email {seller_email} not found and no users available"
                            self.stdout.write(self.style.ERROR(f'  ERROR: {error_msg}'))
                            errors.append(f"Product {idx}: {error_msg}")
                            error_count += 1
                            continue
                else:
                    # No seller specified, use first available user
                    seller = User.objects.first()
                    if not seller:
                        error_msg = "No seller specified and no users available"
                        self.stdout.write(self.style.ERROR(f'  ERROR: {error_msg}'))
                        errors.append(f"Product {idx}: {error_msg}")
                        error_count += 1
                        continue

                # Get or create brand
                brand = None
                brand_name = product_data.get('brand_name')
                if brand_name:
                    brand, created = Brand.objects.get_or_create(
                        name=brand_name,
                        defaults={'slug': brand_name.lower().replace(' ', '-')}
                    )
                    if created:
                        self.stdout.write(self.style.SUCCESS(f'  Created new brand: {brand_name}'))

                # Prepare product data
                product_kwargs = {
                    'seller': seller,
                    'category': category,
                    'title': product_data['title'],
                    'description': product_data['description'],
                    'price': Decimal(str(product_data['price'])),
                    'condition': product_data.get('condition', 'good'),
                    'location': product_data.get('location', ''),
                    'stock_quantity': product_data.get('stock_quantity', 1),
                    'sold_quantity': product_data.get('sold_quantity', 0),
                    'is_sold': product_data.get('is_sold', False),
                    'is_verified': product_data.get('is_verified', False),
                    'discount_percent': product_data.get('discount_percent', 0),
                }

                # Add optional fields
                if brand:
                    product_kwargs['brand'] = brand
                
                if product_data.get('condition_detail'):
                    product_kwargs['condition_detail'] = product_data['condition_detail']

                if product_data.get('specifications'):
                    product_kwargs['specifications'] = product_data['specifications']

                # Create product
                if not dry_run:
                    product = Product.objects.create(**product_kwargs)
                    
                    # Set main image
                    main_image_url = product_data.get('main_image')
                    if main_image_url:
                        product.image = main_image_url
                        product.save()

                    # Add additional images
                    images = product_data.get('images', [])
                    if isinstance(images, str):
                        # If images is a string (comma or semicolon separated), split it
                        images = [img.strip() for img in images.replace(';', ',').split(',') if img.strip()]
                    
                    for img_url in images:
                        if img_url:
                            ProductImage.objects.create(product=product, image=img_url)

                    created_count += 1
                    self.stdout.write(self.style.SUCCESS(f'  ✓ Created product: {product.title} (ID: {product.id})'))
                else:
                    self.stdout.write(self.style.WARNING(f'  [DRY RUN] Would create: {product_kwargs["title"]}'))

            except Exception as e:
                error_msg = f"Error creating product: {str(e)}"
                self.stdout.write(self.style.ERROR(f'  ERROR: {error_msg}'))
                errors.append(f"Product {idx} ({product_data.get('title', 'Unknown')}): {error_msg}")
                error_count += 1
                import traceback
                traceback.print_exc()

        # Summary
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS(f'Import completed!'))
        self.stdout.write(f'  Created: {created_count}')
        self.stdout.write(f'  Errors: {error_count}')
        
        if errors:
            self.stdout.write('\nErrors:')
            for error in errors:
                self.stdout.write(self.style.ERROR(f'  - {error}'))

