from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from decimal import Decimal
from .return_models import ReturnRequest, ReturnItem
from .return_serializers import ReturnRequestSerializer, ReturnRequestListSerializer, ReturnItemSerializer
from .models import Order, OrderItem
from Products.models import Product
from Core.utils import upload_image_to_supabase, upload_video_to_supabase
import logging

logger = logging.getLogger(__name__)


class ReturnRequestViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing return requests
    """
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Users can only see their own return requests
        # Admins can see all
        if self.request.user.is_staff:
            return ReturnRequest.objects.all()
        return ReturnRequest.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ReturnRequestListSerializer
        return ReturnRequestSerializer
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    def send_return_request_email(self, email: str, return_request_id: str, order_id: str, reason: str, items_count: int):
        """
        Send email notification when return request is created
        """
        subject = '返品リクエストを受け付けました - OldShop'
        
        message = f'''
こんにちは、

返品リクエストを受け付けました。

【返品リクエストID】
{return_request_id}

【注文番号】
{order_id}

【返品理由】
{reason}

【返品商品数】
{items_count}点

現在、返品リクエストを審査中です。
審査が完了次第、ご連絡いたします。

返品リクエストの詳細は、マイページの「返品リクエスト」からご確認いただけます。

ご不明な点がございましたら、お気軽にお問い合わせください。

OldShop Team
        '''
        
        try:
            send_mail(
                subject,
                message,
                settings.EMAIL_HOST_USER or 'noreply@oldshop.com',
                [email],
                fail_silently=False,
            )
            logger.info(f"Return request email sent to {email} for return {return_request_id}")
            return True
        except Exception as e:
            logger.error(f"Error sending return request email: {str(e)}")
            return False
    
    def create(self, request, *args, **kwargs):
        try:
            response = super().create(request, *args, **kwargs)
            return_request = ReturnRequest.objects.get(id=response.data['id'])
            
            # Send email notification
            try:
                self.send_return_request_email(
                    email=return_request.order.email,
                    return_request_id=str(return_request.id),
                    order_id=str(return_request.order.id),
                    reason=return_request.reason,
                    items_count=return_request.items.count()
                )
            except Exception as e:
                logger.error(f"Failed to send return request email: {str(e)}")
                # Don't fail the request if email fails
            
            return response
        except Exception as e:
            logger.error(f"Error creating return request: {str(e)}")
            logger.error(f"Request data: {request.data}")
            raise
    
    @action(detail=False, methods=['post'], url_path='upload-evidence')
    def upload_evidence(self, request):
        """
        Upload image/video evidence for return request
        Returns URL to be used in return request creation
        """
        if 'file' not in request.FILES:
            return Response(
                {'error': 'ファイルが提供されていません。'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        file = request.FILES['file']
        
        # Validate file type
        allowed_image_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        allowed_video_types = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm', 'video/x-flv', 'video/x-ms-wmv']
        allowed_types = allowed_image_types + allowed_video_types
        
        # Also check by file extension if content_type is not available
        file_name = file.name.lower() if hasattr(file, 'name') else ''
        is_allowed_by_extension = (
            file_name.endswith(('.jpg', '.jpeg', '.png', '.webp', '.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv'))
        )
        
        if file.content_type not in allowed_types and not is_allowed_by_extension:
            return Response(
                {'error': 'サポートされていないファイル形式です。画像（JPEG、PNG、WebP）または動画（MP4、MOV、AVI、MKV、WebM、FLV、WMV）のみ対応しています。'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if file is video
        content_type = file.content_type or ''
        file_name = file.name.lower() if hasattr(file, 'name') else ''
        is_video = (
            content_type.startswith('video/') or
            file_name.endswith(('.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv'))
        )
        
        # Validate file size
        if is_video:
            # Video: max 50MB
            if file.size > 50 * 1024 * 1024:
                return Response(
                    {'error': '動画ファイルサイズが大きすぎます。50MB以下にしてください。'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            # Image: max 10MB
            if file.size > 10 * 1024 * 1024:
                return Response(
                    {'error': '画像ファイルサイズが大きすぎます。10MB以下にしてください。'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        try:
            # Upload to Supabase
            folder = 'return-evidence'
            if is_video:
                # Upload and compress video (only when user submits)
                url = upload_video_to_supabase(file, folder=folder, max_size_mb=50)
            else:
                # Upload and compress image
                url = upload_image_to_supabase(file, folder=folder)
            
            return Response({
                'url': url,
                'message': 'ファイルが正常にアップロードされました。'
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error uploading evidence: {str(e)}")
            return Response(
                {'error': f'ファイルのアップロードに失敗しました: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'], url_path='confirm-fault')
    def confirm_fault(self, request, pk=None):
        """
        Admin action: Confirm fault type and approve/reject return request
        """
        return_request = self.get_object()
        
        # Only staff can confirm fault
        if not request.user.is_staff:
            return Response(
                {'error': 'この操作は管理者のみ実行できます。'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        fault_type = request.data.get('fault_type')
        fault_notes = request.data.get('fault_notes', '')
        approve = request.data.get('approve', True)
        
        if fault_type not in ['shop_fault', 'customer_fault', 'no_fault']:
            return Response(
                {'error': '無効なfault_typeです。shop_fault、customer_fault、またはno_faultを指定してください。'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                # Update fault type
                return_request.fault_type = fault_type
                return_request.fault_confirmed_by = request.user
                return_request.fault_confirmed_at = timezone.now()
                return_request.fault_notes = fault_notes
                
                # Calculate final refund for each item
                total_final_amount = Decimal('0')
                total_final_percent = Decimal('0')
                
                for return_item in return_request.items.all():
                    order_item = return_item.order_item
                    original_price = order_item.price
                    quantity = return_item.quantity
                    
                    # Calculate final refund
                    final_amount, final_percent = ReturnRequest.calculate_final_refund(
                        return_item.baseline_refund_amount,
                        return_item.baseline_refund_percent,
                        fault_type,
                        original_price,
                        quantity
                    )
                    
                    return_item.final_refund_amount = final_amount
                    return_item.final_refund_percent = final_percent
                    
                    if approve:
                        return_item.status = 'approved'
                    else:
                        return_item.status = 'rejected'
                    
                    return_item.save()
                    
                    total_final_amount += final_amount
                    if final_percent > total_final_percent:
                        total_final_percent = final_percent
                
                # Update return request
                return_request.final_refund_amount = total_final_amount
                return_request.final_refund_percent = total_final_percent
                
                if approve:
                    return_request.status = 'approved'
                else:
                    return_request.status = 'rejected'
                    return_request.rejected_reason = fault_notes
                
                return_request.save()
            
            serializer = self.get_serializer(return_request)
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error confirming fault: {str(e)}")
            return Response(
                {'error': f'エラーが発生しました: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'], url_path='mark-received')
    def mark_received(self, request, pk=None):
        """
        Admin action: Mark return items as received
        """
        return_request = self.get_object()
        
        if not request.user.is_staff:
            return Response(
                {'error': 'この操作は管理者のみ実行できます。'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if return_request.status != 'shipping':
            return Response(
                {'error': '返品リクエストは配送中である必要があります。'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                # Update items status
                for return_item in return_request.items.filter(status='approved'):
                    return_item.status = 'received'
                    return_item.condition_at_return = request.data.get('condition_at_return', '')
                    return_item.save()
                
                # Update return request status
                return_request.status = 'received'
                return_request.save()
            
            serializer = self.get_serializer(return_request)
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error marking received: {str(e)}")
            return Response(
                {'error': f'エラーが発生しました: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'], url_path='process-refund')
    def process_refund(self, request, pk=None):
        """
        Admin action: Process refund and restore stock
        """
        return_request = self.get_object()
        
        if not request.user.is_staff:
            return Response(
                {'error': 'この操作は管理者のみ実行できます。'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if return_request.status != 'received':
            return Response(
                {'error': '返品リクエストは受領済みである必要があります。'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                # Process each return item
                for return_item in return_request.items.filter(status='received'):
                    order_item = return_item.order_item
                    
                    # Restore stock if product exists
                    if order_item.product:
                        product = order_item.product
                        product.stock_quantity += return_item.quantity
                        
                        # Decrease sold quantity
                        if product.sold_quantity >= return_item.quantity:
                            product.sold_quantity -= return_item.quantity
                        else:
                            product.sold_quantity = 0
                        
                        # Unmark 'is_sold' if stock becomes available
                        if product.stock_quantity > 0:
                            product.is_sold = False
                        
                        product.save()
                    
                    # Mark item as refunded
                    return_item.status = 'refunded'
                    return_item.save()
                
                # Update return request status
                return_request.status = 'completed'
                return_request.save()
            
            serializer = self.get_serializer(return_request)
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error processing refund: {str(e)}")
            return Response(
                {'error': f'エラーが発生しました: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel(self, request, pk=None):
        """
        Cancel return request (only if pending or under_review)
        """
        return_request = self.get_object()
        
        # Only owner can cancel
        if return_request.user != request.user:
            return Response(
                {'error': 'この操作はリクエストの所有者のみ実行できます。'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if return_request.status not in ['pending', 'under_review']:
            return Response(
                {'error': 'キャンセルできるのは保留中または審査中のリクエストのみです。'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return_request.status = 'cancelled'
        return_request.save()
        
        serializer = self.get_serializer(return_request)
        return Response(serializer.data)

