"""
Script to merge products from generate_products_with_images into products_backup.json
"""
import json
import os
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Merge products from generate script into products_backup.json'

    def handle(self, *args, **options):
        # Read existing backup
        backup_file = 'products_backup.json'
        if os.path.exists(backup_file):
            with open(backup_file, 'r', encoding='utf-8') as f:
                existing_products = json.load(f)
            self.stdout.write(self.style.SUCCESS(f'Loaded {len(existing_products)} existing products'))
        else:
            existing_products = []
            self.stdout.write(self.style.WARNING('No existing backup file found'))

        # Read generated products
        generated_file = 'products_generated.json'
        if os.path.exists(generated_file):
            with open(generated_file, 'r', encoding='utf-8') as f:
                generated_products = json.load(f)
            self.stdout.write(self.style.SUCCESS(f'Loaded {len(generated_products)} generated products'))
        else:
            self.stdout.write(self.style.ERROR(f'Generated file {generated_file} not found!'))
            self.stdout.write(self.style.WARNING('Run: python manage.py generate_products_with_images --output products_generated.json'))
            return

        # Merge (avoid duplicates by title)
        existing_titles = {p['title'] for p in existing_products}
        new_products = [p for p in generated_products if p['title'] not in existing_titles]
        
        merged_products = existing_products + new_products
        
        # Save merged file
        with open(backup_file, 'w', encoding='utf-8') as f:
            json.dump(merged_products, f, ensure_ascii=False, indent=2)
        
        self.stdout.write(self.style.SUCCESS(
            f'\n✅ Merged products!\n'
            f'   Existing: {len(existing_products)}\n'
            f'   New: {len(new_products)}\n'
            f'   Total: {len(merged_products)}\n'
            f'   Saved to: {backup_file}'
        ))

