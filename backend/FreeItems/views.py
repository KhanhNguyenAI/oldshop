from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from django_filters import rest_framework as filters
from django.db.models import Q, Count
from django.utils import timezone
from .models import FreeItem, FreeItemImage, FreeItemMessage, FreeItemView
from .serializers import (
    FreeItemSerializer,
    FreeItemCreateSerializer,
    FreeItemUpdateSerializer,
    FreeItemImageSerializer,
    FreeItemMessageSerializer,
    FreeItemMessageCreateSerializer
)
from Users.serializers import UserSerializer


class FreeItemFilter(filters.FilterSet):
    location_prefecture = filters.CharFilter(field_name='location_prefecture', lookup_expr='icontains')
    location_city = filters.CharFilter(field_name='location_city', lookup_expr='icontains')
    category = filters.CharFilter(field_name='category', lookup_expr='icontains')
    condition = filters.CharFilter(field_name='condition')
    status = filters.CharFilter(field_name='status')
    pickup_method = filters.CharFilter(field_name='pickup_method')
    search = filters.CharFilter(method='filter_search')
    
    class Meta:
        model = FreeItem
        fields = ['location_prefecture', 'location_city', 'category', 'condition', 'status', 'pickup_method']
    
    def filter_search(self, queryset, name, value):
        """Search in title and description"""
        return queryset.filter(
            Q(title__icontains=value) | Q(description__icontains=value)
        )


class FreeItemViewSet(viewsets.ModelViewSet):
    queryset = FreeItem.objects.all()
    filter_backends = [DjangoFilterBackend]
    filterset_class = FreeItemFilter
    
    def get_serializer_class(self):
        if self.action == 'create':
            return FreeItemCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return FreeItemUpdateSerializer
        return FreeItemSerializer
    
    def get_permissions(self):
        """
        Allow anyone to view, but require authentication for create/update/delete
        """
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        queryset = FreeItem.objects.select_related('user').prefetch_related('images', 'messages')
        
        # Admin can see all items regardless of status
        is_admin = self.request.user.is_authenticated and (self.request.user.is_staff or self.request.user.is_superuser)
        
        # Filter by status - mặc định chỉ hiển thị available và reserved
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        else:
            # Mặc định chỉ hiển thị available và reserved cho public
            # Admin can see all statuses
            if not is_admin and (not self.request.user.is_authenticated or self.action == 'list'):
                queryset = queryset.filter(status__in=['available', 'reserved'])
        
        # Sort
        sort_by = self.request.query_params.get('sort', '-created_at')
        if sort_by in ['-created_at', 'created_at', '-views_count', 'views_count']:
            queryset = queryset.order_by(sort_by)
        
        return queryset
    
    def retrieve(self, request, *args, **kwargs):
        """Tăng views_count khi xem chi tiết (chỉ 1 lần mỗi user)"""
        instance = self.get_object()
        
        # Get user info
        user = request.user if request.user.is_authenticated else None
        ip_address = self._get_client_ip(request)
        
        # Try to create view record (only if doesn't exist)
        view_created = False
        try:
            if user:
                # For authenticated users - use get_or_create with unique constraint
                view, created = FreeItemView.objects.get_or_create(
                    free_item=instance,
                    user=user,
                    defaults={'ip_address': None}
                )
                view_created = created
            else:
                # For anonymous users - check if IP already viewed
                if not FreeItemView.objects.filter(
                    free_item=instance,
                    user__isnull=True,
                    ip_address=ip_address
                ).exists():
                    FreeItemView.objects.create(
                        free_item=instance,
                        user=None,
                        ip_address=ip_address
                    )
                    view_created = True
        except Exception as e:
            # Handle race condition or constraint violation
            # If view already exists, just skip increment
            print(f"View tracking error (likely duplicate): {e}")
            view_created = False
        
        # Only increment if view was just created
        if view_created:
            from django.db.models import F
            FreeItem.objects.filter(id=instance.id).update(
                views_count=F('views_count') + 1
            )
            # Refresh instance to get updated count
            instance.refresh_from_db()
        
        return super().retrieve(request, *args, **kwargs)
    
    def _get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    def perform_update(self, serializer):
        """Chỉ cho phép owner update"""
        instance = self.get_object()
        if instance.user != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("このアイテムを編集する権限がありません。")
        serializer.save()
    
    def perform_destroy(self, instance):
        """Chỉ cho phép owner hoặc admin delete"""
        is_admin = self.request.user.is_authenticated and (self.request.user.is_staff or self.request.user.is_superuser)
        if instance.user != self.request.user and not is_admin:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("このアイテムを削除する権限がありません。")
        instance.delete()
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def update_status(self, request, pk=None):
        """Update status của item (chỉ owner hoặc admin)"""
        item = self.get_object()
        is_admin = request.user.is_staff or request.user.is_superuser
        
        if item.user != request.user and not is_admin:
            return Response(
                {'error': 'このアイテムを編集する権限がありません。'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        new_status = request.data.get('status')
        if new_status not in dict(FreeItem.STATUS_CHOICES):
            return Response(
                {'error': '無効なステータスです。'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        item.status = new_status
        item.save()
        
        serializer = self.get_serializer(item)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated, IsAdminUser])
    def admin_update_status(self, request, pk=None):
        """Admin action to update status of a free item"""
        item = self.get_object()
        new_status = request.data.get('status')
        
        if new_status not in dict(FreeItem.STATUS_CHOICES):
            return Response(
                {'error': '無効なステータスです。'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        item.status = new_status
        item.save()
        
        serializer = self.get_serializer(item)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_items(self, request):
        """Lấy tất cả items của user hiện tại"""
        items = self.get_queryset().filter(user=request.user)
        page = self.paginate_queryset(items)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(items, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def messages(self, request, pk=None):
        """Lấy tất cả messages của một item (cho owner hoặc người đã có conversation)"""
        item = self.get_object()
        
        # Lấy tất cả messages của conversation này
        # Bao gồm cả owner và người đã gửi message đầu tiên
        user_messages = item.messages.filter(
            Q(sender=request.user) | Q(receiver=request.user)
        ).order_by('created_at')
        
        # Đánh dấu messages là đã đọc (chỉ messages nhận được)
        user_messages.filter(receiver=request.user, is_read=False).update(is_read=True)
        
        serializer = FreeItemMessageSerializer(user_messages, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def send_message(self, request, pk=None):
        """Gửi message cho item"""
        item = self.get_object()
        serializer = FreeItemMessageCreateSerializer(data={
            'message': request.data.get('message'),
            'free_item_id': str(item.id)
        })
        
        if serializer.is_valid():
            message_serializer = FreeItemMessageSerializer(
                data={
                    'free_item': item.id,
                    'message': serializer.validated_data['message']
                },
                context={'request': request}
            )
            
            if message_serializer.is_valid():
                message = message_serializer.save()
                return Response(
                    FreeItemMessageSerializer(message).data,
                    status=status.HTTP_201_CREATED
                )
            return Response(message_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FreeItemMessageViewSet(viewsets.ModelViewSet):
    serializer_class = FreeItemMessageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Chỉ lấy messages mà user là sender hoặc receiver"""
        return FreeItemMessage.objects.filter(
            Q(sender=self.request.user) | Q(receiver=self.request.user)
        ).select_related('sender', 'receiver', 'free_item').order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)
    
    @action(detail=False, methods=['get'])
    def conversations(self, request):
        """Lấy tất cả conversations của user"""
        # Lấy tất cả unique free_items mà user đã có conversation
        free_item_ids = FreeItemMessage.objects.filter(
            Q(sender=request.user) | Q(receiver=request.user)
        ).values_list('free_item_id', flat=True).distinct()
        
        conversations = []
        for item_id in free_item_ids:
            item = FreeItem.objects.get(id=item_id)
            messages = FreeItemMessage.objects.filter(
                free_item=item
            ).filter(
                Q(sender=request.user) | Q(receiver=request.user)
            ).order_by('created_at')
            
            # Lấy người đối thoại (không phải user hiện tại)
            other_user = item.user if item.user != request.user else messages.first().sender if messages.exists() else None
            
            unread_count = messages.filter(receiver=request.user, is_read=False).count()
            last_message = messages.last()
            
            conversations.append({
                'free_item': FreeItemSerializer(item).data,
                'other_user': UserSerializer(other_user).data if other_user else None,
                'last_message': FreeItemMessageSerializer(last_message).data if last_message else None,
                'unread_count': unread_count,
                'message_count': messages.count()
            })
        
        # Sort by last message time
        conversations.sort(key=lambda x: x['last_message']['created_at'] if x['last_message'] else '', reverse=True)
        
        return Response(conversations)
    
    @action(detail=True, methods=['patch'])
    def mark_read(self, request, pk=None):
        """Đánh dấu message là đã đọc"""
        message = self.get_object()
        if message.receiver == request.user:
            message.is_read = True
            message.save()
        return Response(FreeItemMessageSerializer(message).data)
