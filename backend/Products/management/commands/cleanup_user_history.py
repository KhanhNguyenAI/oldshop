from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from Products.models import UserHistory


class Command(BaseCommand):
    help = 'Xóa lịch sử xem sản phẩm cũ hơn 7 ngày để tiết kiệm database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Chỉ hiển thị số lượng sẽ xóa, không thực sự xóa',
        )
        parser.add_argument(
            '--cleanup-anonymous',
            action='store_true',
            help='Xóa tất cả lịch sử của anonymous users (user=None)',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        cleanup_anonymous = options['cleanup_anonymous']
        
        # Xóa anonymous history nếu được yêu cầu
        if cleanup_anonymous:
            anonymous_count = UserHistory.objects.filter(user__isnull=True).count()
            if anonymous_count > 0:
                if dry_run:
                    self.stdout.write(self.style.WARNING(
                        f'[DRY RUN] Sẽ xóa {anonymous_count} records của anonymous users'
                    ))
                else:
                    deleted_count, _ = UserHistory.objects.filter(user__isnull=True).delete()
                    self.stdout.write(self.style.SUCCESS(
                        f'✅ Đã xóa {deleted_count} records của anonymous users.'
                    ))
            else:
                self.stdout.write(self.style.SUCCESS(
                    'Không có lịch sử của anonymous users để xóa.'
                ))
            if dry_run:
                return
        
        # Chỉ giữ lại 7 ngày cho authenticated users
        days = 7
        cutoff_date = timezone.now() - timedelta(days=days)
        
        # Chỉ cleanup lịch sử của authenticated users (user__isnull=False)
        old_history = UserHistory.objects.filter(
            user__isnull=False,  # Chỉ lấy records có user
            viewed_at__lt=cutoff_date
        )
        count = old_history.count()
        
        if count == 0:
            self.stdout.write(self.style.SUCCESS(
                f'Không có lịch sử nào cũ hơn {days} ngày.'
            ))
            return
        
        if dry_run:
            self.stdout.write(self.style.WARNING(
                f'[DRY RUN] Sẽ xóa {count} records cũ hơn {days} ngày (trước {cutoff_date.strftime("%Y-%m-%d %H:%M:%S")})'
            ))
            # Hiển thị thống kê
            total_history = UserHistory.objects.count()
            self.stdout.write(f'  - Tổng số records: {total_history}')
            self.stdout.write(f'  - Sẽ xóa: {count} ({count/total_history*100:.1f}%)')
            self.stdout.write(f'  - Giữ lại: {total_history - count}')
        else:
            # Thực sự xóa
            deleted_count, _ = old_history.delete()
            self.stdout.write(self.style.SUCCESS(
                f'✅ Đã xóa {deleted_count} records cũ hơn {days} ngày.'
            ))
            
            # Hiển thị thống kê sau khi xóa
            remaining = UserHistory.objects.count()
            self.stdout.write(f'  - Còn lại: {remaining} records')

