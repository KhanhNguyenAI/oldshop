from django.core.management.base import BaseCommand
from Products.models import Product, ProductImage, Category, Brand
from Users.models import User
from django.utils import timezone
import json
import os
import sys
from datetime import datetime

# Fix encoding for Windows console
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

class Command(BaseCommand):
    help = 'Backup products from database to JSON file'

    def add_arguments(self, parser):
        parser.add_argument(
            '--output',
            type=str,
            default=None,
            help='Output file path (default: products_backup_YYYYMMDD_HHMMSS.json)',
        )
        parser.add_argument(
            '--format',
            type=str,
            choices=['full', 'simple'],
            default='full',
            help='Backup format: full (all fields) or simple (essential fields only)',
        )
        parser.add_argument(
            '--include-images',
            action='store_true',
            default=True,
            help='Include product images in backup (default: True)',
        )
        parser.add_argument(
            '--no-include-images',
            action='store_false',
            dest='include_images',
            help='Exclude product images from backup',
        )

    def handle(self, *args, **options):
        output_file = options.get('output')
        format_type = options.get('format', 'full')
        include_images = options.get('include_images', True)

        # Generate default output filename if not provided
        if not output_file:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            output_file = f'products_backup_{timestamp}.json'
        
        # Ensure output file has .json extension
        if not output_file.endswith('.json'):
            output_file += '.json'

        # Get absolute path
        output_path = os.path.abspath(output_file)
        output_dir = os.path.dirname(output_path)
        
        # Create directory if it doesn't exist
        if output_dir and not os.path.exists(output_dir):
            os.makedirs(output_dir)
            self.stdout.write(self.style.SUCCESS(f'Created directory: {output_dir}'))

        self.stdout.write(f'\nĐang backup sản phẩm từ database...')
        self.stdout.write(f'Output file: {output_path}')
        self.stdout.write(f'Format: {format_type}')
        self.stdout.write(f'Include images: {include_images}\n')

        # Get all products with related data
        products = Product.objects.select_related(
            'seller', 'category', 'brand', 'category__parent'
        ).prefetch_related('images').all()

        total_products = products.count()
        self.stdout.write(f'Tổng số sản phẩm: {total_products}')

        if total_products == 0:
            self.stdout.write(self.style.WARNING('Không có sản phẩm nào để backup!'))
            return

        products_data = []
        processed = 0

        for product in products:
            try:
                # Base product data
                product_data = {
                    'id': str(product.id),
                    'title': product.title,
                    'description': product.description,
                    'price': str(product.price),
                    'condition': product.condition,
                    'location': product.location,
                    'stock_quantity': product.stock_quantity,
                    'sold_quantity': product.sold_quantity,
                    'is_sold': product.is_sold,
                    'is_verified': product.is_verified,
                    'discount_percent': product.discount_percent,
                    'created_at': product.created_at.isoformat() if product.created_at else None,
                    'updated_at': product.updated_at.isoformat() if product.updated_at else None,
                }

                # Add optional fields
                if product.condition_detail:
                    product_data['condition_detail'] = product.condition_detail
                
                if product.specifications:
                    product_data['specifications'] = product.specifications

                # Add main image
                if product.image:
                    product_data['main_image'] = product.image

                # Add seller info
                if product.seller:
                    product_data['seller_email'] = product.seller.email
                    product_data['seller_id'] = str(product.seller.id)

                # Add category info
                if product.category:
                    product_data['category_name'] = product.category.name
                    product_data['category_id'] = product.category.id
                    
                    # Add parent category if exists
                    if product.category.parent:
                        product_data['parent_category_name'] = product.category.parent.name
                        product_data['parent_category_id'] = product.category.parent.id

                # Add brand info
                if product.brand:
                    product_data['brand_name'] = product.brand.name
                    product_data['brand_id'] = product.brand.id

                # Add images if requested
                if include_images:
                    images = []
                    for img in product.images.all():
                        images.append(img.image)
                    if images:
                        product_data['images'] = images

                # Add full format data
                if format_type == 'full':
                    product_data['_backup_metadata'] = {
                        'backup_date': timezone.now().isoformat(),
                        'format_version': '1.0',
                    }

                products_data.append(product_data)
                processed += 1

                if processed % 10 == 0:
                    self.stdout.write(f'Đã xử lý: {processed}/{total_products} sản phẩm...')

            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Lỗi khi backup sản phẩm {product.id}: {str(e)}')
                )
                import traceback
                traceback.print_exc()

        # Create backup metadata
        backup_info = {
            'backup_date': timezone.now().isoformat(),
            'total_products': total_products,
            'format': format_type,
            'include_images': include_images,
            'products': products_data
        }

        # Write to JSON file
        try:
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(backup_info, f, ensure_ascii=False, indent=2)
            
            file_size = os.path.getsize(output_path)
            file_size_mb = file_size / (1024 * 1024)
            
            self.stdout.write('\n' + '='*50)
            self.stdout.write(self.style.SUCCESS('✓ Backup thành công!'))
            self.stdout.write(f'  File: {output_path}')
            self.stdout.write(f'  Số sản phẩm: {processed}/{total_products}')
            self.stdout.write(f'  Kích thước: {file_size_mb:.2f} MB')
            self.stdout.write('\nĐể restore lại, sử dụng lệnh:')
            self.stdout.write(f'  python manage.py import_products --json-file "{output_path}"')
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Lỗi khi ghi file: {str(e)}')
            )
            import traceback
            traceback.print_exc()


