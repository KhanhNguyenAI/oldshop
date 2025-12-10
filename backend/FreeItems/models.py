from django.db import models
from django.conf import settings
import uuid


class FreeItem(models.Model):
    CONDITION_CHOICES = [
        ('new_unused', '新品・未使用'),
        ('like_new', '未使用に近い'),
        ('no_damage', '目立った傷や汚れなし'),
        ('minor_damage', 'やや傷や汚れあり'),
        ('has_damage', '傷や汚れあり'),
    ]
    
    PICKUP_METHOD_CHOICES = [
        ('direct', '直接引き取り（手渡し）'),
        ('consult', '要相談'),
    ]
    
    STATUS_CHOICES = [
        ('available', '募集中'),
        ('reserved', '相談中'),
        ('completed', '終了'),
        ('cancelled', 'キャンセル'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='free_items'
    )
    title = models.CharField(max_length=255, verbose_name='タイトル')
    description = models.TextField(verbose_name='説明')
    condition = models.CharField(
        max_length=20,
        choices=CONDITION_CHOICES,
        default='like_new',
        verbose_name='状態'
    )
    category = models.CharField(max_length=100, blank=True, null=True, verbose_name='カテゴリ')
    location_prefecture = models.CharField(max_length=50, verbose_name='都道府県')
    location_city = models.CharField(max_length=100, verbose_name='市区町村')
    location_detail = models.CharField(max_length=255, blank=True, null=True, verbose_name='詳細住所')
    pickup_method = models.CharField(
        max_length=20,
        choices=PICKUP_METHOD_CHOICES,
        default='direct',
        verbose_name='受け取り方法'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='available',
        verbose_name='状態'
    )
    show_email = models.BooleanField(default=False, verbose_name='メール公開')
    views_count = models.PositiveIntegerField(default=0, verbose_name='閲覧数')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['location_prefecture', 'location_city']),
            models.Index(fields=['user']),
        ]
        verbose_name = '無料アイテム'
        verbose_name_plural = '無料アイテム'
    
    def __str__(self):
        return f"{self.title} - {self.user.email}"


class FreeItemImage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    free_item = models.ForeignKey(
        FreeItem,
        on_delete=models.CASCADE,
        related_name='images'
    )
    image_url = models.URLField(max_length=500, verbose_name='画像URL')
    order = models.PositiveIntegerField(default=0, verbose_name='順序')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['order', 'created_at']
        verbose_name = '無料アイテム画像'
        verbose_name_plural = '無料アイテム画像'
    
    def __str__(self):
        return f"Image {self.order} for {self.free_item.title}"


class FreeItemView(models.Model):
    """Track which users have viewed which items (1 view per user per item)"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    free_item = models.ForeignKey(
        FreeItem,
        on_delete=models.CASCADE,
        related_name='item_views'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='free_item_views',
        null=True,
        blank=True,
        help_text='Null for anonymous users'
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True, help_text='For anonymous users')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        # Unique constraint: one view per user per item (for authenticated users)
        # For anonymous users, we'll handle uniqueness in code
        unique_together = [['free_item', 'user']]
        indexes = [
            models.Index(fields=['free_item', 'user']),
            models.Index(fields=['free_item', 'ip_address']),
        ]
        verbose_name = '無料アイテム閲覧'
        verbose_name_plural = '無料アイテム閲覧'
    
    def __str__(self):
        user_str = self.user.email if self.user else f"Anonymous ({self.ip_address})"
        return f"View of {self.free_item.title} by {user_str}"


class FreeItemMessage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    free_item = models.ForeignKey(
        FreeItem,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_free_item_messages'
    )
    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='received_free_item_messages'
    )
    message = models.TextField(verbose_name='メッセージ')
    is_read = models.BooleanField(default=False, verbose_name='既読')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['free_item', 'created_at']),
            models.Index(fields=['sender', 'receiver']),
        ]
        verbose_name = '無料アイテムメッセージ'
        verbose_name_plural = '無料アイテムメッセージ'
    
    def __str__(self):
        return f"Message from {self.sender.email} to {self.receiver.email}"
