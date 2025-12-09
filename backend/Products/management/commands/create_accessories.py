from django.core.management.base import BaseCommand
from Products.models import Product, Accessory, Category
from django.db.models import Q


class Command(BaseCommand):
    help = 'Tự động tạo accessories (phụ kiện) cho các sản phẩm dựa trên category và logic liên quan'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Xoa tat ca accessories hien co truoc khi tao moi',
        )
        parser.add_argument(
            '--max-per-product',
            type=int,
            default=5,
            help='So luong phu kien toi da cho moi san pham (default: 5)',
        )

    def handle(self, *args, **options):
        clear_existing = options['clear']
        max_per_product = options['max_per_product']

        if clear_existing:
            count = Accessory.objects.count()
            Accessory.objects.all().delete()
            self.stdout.write(self.style.WARNING(f'Da xoa {count} accessories cu'))

        # Lấy tất cả sản phẩm chưa bán
        products = Product.objects.filter(is_sold=False).select_related('category', 'brand')
        total_products = products.count()
        
        if total_products == 0:
            self.stdout.write(self.style.ERROR('Khong co san pham nao trong database'))
            return

        self.stdout.write(f'Bat dau tao accessories cho {total_products} san pham...')
        
        created_count = 0
        skipped_count = 0

        for product in products:
            accessories = self.find_accessories(product, max_per_product)
            
            for accessory_product in accessories:
                # Kiểm tra xem đã tồn tại chưa
                if not Accessory.objects.filter(
                    product=product,
                    accessory_product=accessory_product
                ).exists():
                    Accessory.objects.create(
                        product=product,
                        accessory_product=accessory_product
                    )
                    created_count += 1
                else:
                    skipped_count += 1

        self.stdout.write(self.style.SUCCESS(
            f'\nHoan thanh!\n'
            f'   - Da tao: {created_count} accessories\n'
            f'   - Da bo qua (trung lap): {skipped_count}'
        ))

    def find_accessories(self, product, max_count=5):
        """
        Tìm các sản phẩm phụ kiện phù hợp cho một sản phẩm dựa trên category mapping
        
        Logic:
        1. Kiểm tra category mapping - nếu có mapping thì tìm trong category được map
        2. Fallback: Cùng category hoặc cùng parent category
        3. Loại trừ: Chính sản phẩm đó, sản phẩm đã bán
        """
        category = product.category
        
        # Category mapping: Danh mục gốc → Danh mục phụ kiện gợi ý
        category_accessory_mapping = {
            '楽器 (Musical Instruments)': 'ヘッドフォン・スピーカー (Headphones & Speakers)',
            '模型 (Models)': 'ペンチ・ハンマー・ドライバーセット (Pliers, Hammers, Screwdriver Sets)',
            'デコレーション (Decorations)': 'カメラ・レンズ (Cameras & Lenses)',
            '衣類 (Clothing)': 'バッグ (Bags)',
            '靴 (Shoes)': '衣類 (Clothing)',
            'ジュエリー (Jewelry)': '時計 (Watches)',
            'バッグ (Bags)': 'ミラー・ロック・アクセサリー (Mirrors, Locks, Accessories)',
            '時計 (Watches)': 'ジュエリー (Jewelry)',
        }
        
        accessories = []
        
        # 1. Kiểm tra category mapping trước
        category_name = category.name
        if category_name in category_accessory_mapping:
            accessory_category_name = category_accessory_mapping[category_name]
            try:
                accessory_category = Category.objects.get(name=accessory_category_name)
                mapped_products = Product.objects.filter(
                    category=accessory_category,
                    is_sold=False
                ).exclude(id=product.id)
                
                # Nếu cùng brand, ưu tiên hơn
                if product.brand:
                    same_brand = mapped_products.filter(brand=product.brand)
                    diff_brand = mapped_products.exclude(brand=product.brand)
                    accessories = list(same_brand) + list(diff_brand)
                else:
                    accessories = list(mapped_products)
                
                if len(accessories) >= max_count:
                    return accessories[:max_count]
            except Category.DoesNotExist:
                self.stdout.write(self.style.WARNING(
                    f'  Category "{accessory_category_name}" not found for mapping from "{category_name}"'
                ))
        
        # 2. Fallback: Tìm sản phẩm cùng category (nếu chưa đủ)
        remaining = max_count - len(accessories)
        if remaining > 0:
            same_category = Product.objects.filter(
                category=category,
                is_sold=False
            ).exclude(id=product.id)
            
            # Nếu cùng brand, ưu tiên hơn
            if product.brand:
                same_brand_same_cat = same_category.filter(brand=product.brand)
                diff_brand_same_cat = same_category.exclude(brand=product.brand)
                same_category_list = list(same_brand_same_cat) + list(diff_brand_same_cat)
            else:
                same_category_list = list(same_category)
            
            accessories.extend(same_category_list[:remaining])
            remaining = max_count - len(accessories)
        
        # 3. Nếu vẫn chưa đủ, tìm trong parent category
        if remaining > 0 and category.parent:
            parent_products = Product.objects.filter(
                category__parent=category.parent,
                is_sold=False
            ).exclude(id=product.id).exclude(category=category)[:remaining]
            accessories.extend(list(parent_products))
            remaining = max_count - len(accessories)
        
        # 4. Nếu vẫn chưa đủ, tìm trong category con
        if remaining > 0 and category.children.exists():
            child_products = Product.objects.filter(
                category__parent=category,
                is_sold=False
            ).exclude(id=product.id)[:remaining]
            accessories.extend(list(child_products))
        
        return accessories[:max_count]

