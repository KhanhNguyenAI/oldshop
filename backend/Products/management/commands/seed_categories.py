from django.core.management.base import BaseCommand
from Products.models import Category

class Command(BaseCommand):
    help = 'Seeds the database with initial categories'

    def handle(self, *args, **options):
        categories = [
            {
                'name': 'Electronics (Điện tử)',
                'slug': 'electronics',
                'description': 'Phones, Laptops, Tablets, Screens, Headphones, Cameras, Smartwatches, TV, Consoles, Accessories, Printers'
            },
            {
                'name': 'Furniture (Nội thất)',
                'slug': 'furniture',
                'description': 'Sofas, Chairs, Desks, Wardrobes, Bookshelves, Gaming Chairs'
            },
            {
                'name': 'Kitchen & Appliances (Nhà bếp – Gia dụng nhỏ)',
                'slug': 'kitchen-appliances',
                'description': 'Fridges, Washing Machines, Microwaves, Rice Cookers, Stoves, Air Fryers, Blenders, Pots/Pans, Cutlery, Glassware'
            },
            {
                'name': 'Vehicles & Accessories (Xe cộ)',
                'slug': 'vehicles',
                'description': 'Bicycles, Used Motorbikes, Helmets, Mirrors, Locks, Accessories'
            },
            {
                'name': 'Fashion (Thời trang)',
                'slug': 'fashion',
                'description': 'Clothing, Shoes, Bags, Jewelry, Watches'
            },
            {
                'name': 'Hobby (Đồ giải trí / hobby)',
                'slug': 'hobby',
                'description': 'Instruments, Decor, Models/Figures'
            },
            {
                'name': 'Hardware & Tools (Đồ xây dựng – Dụng cụ sửa chữa)',
                'slug': 'hardware-tools',
                'description': 'Drills, Saws, Welding Machines, Ladders, Multi-tools, Pliers/Hammers/Screwdrivers, Laser Measures, Painting Tools, Wrenches, Blowers, Air Compressors, Pumps'
            }
        ]

        for cat_data in categories:
            category, created = Category.objects.get_or_create(
                slug=cat_data['slug'],
                defaults={
                    'name': cat_data['name'],
                    'description': cat_data['description']
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created category "{category.slug}"'))
            else:
                self.stdout.write(self.style.WARNING(f'Category "{category.slug}" already exists'))

