from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from Products.models import ProductGeminiAnswer


class Command(BaseCommand):
    help = 'Xóa câu trả lời Gemini cũ hơn 1 ngày để người dùng có thể nhận được kết quả mới nhất'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Chỉ hiển thị số lượng sẽ xóa, không thực sự xóa',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        # Xóa câu trả lời cũ hơn 1 ngày
        days = 1
        cutoff_date = timezone.now() - timedelta(days=days)
        
        # Đếm số lượng records sẽ bị xóa
        old_answers = ProductGeminiAnswer.objects.filter(created_at__lt=cutoff_date)
        count = old_answers.count()
        
        if count == 0:
            self.stdout.write(self.style.SUCCESS(
                f'Không có câu trả lời Gemini nào cũ hơn {days} ngày.'
            ))
            return
        
        if dry_run:
            self.stdout.write(self.style.WARNING(
                f'[DRY RUN] Sẽ xóa {count} câu trả lời Gemini cũ hơn {days} ngày (trước {cutoff_date.strftime("%Y-%m-%d %H:%M:%S")})'
            ))
            # Hiển thị thống kê
            total_answers = ProductGeminiAnswer.objects.count()
            self.stdout.write(f'  - Tổng số câu trả lời: {total_answers}')
            self.stdout.write(f'  - Sẽ xóa: {count} ({count/total_answers*100:.1f}%)')
            self.stdout.write(f'  - Giữ lại: {total_answers - count}')
        else:
            # Thực sự xóa
            deleted_count, _ = old_answers.delete()
            self.stdout.write(self.style.SUCCESS(
                f'✅ Đã xóa {deleted_count} câu trả lời Gemini cũ hơn {days} ngày.'
            ))
            
            # Hiển thị thống kê sau khi xóa
            remaining = ProductGeminiAnswer.objects.count()
            self.stdout.write(f'  - Còn lại: {remaining} câu trả lời')

