from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.views import APIView
from django.utils import timezone
from django.db import transaction
from django.db.models import Count
from datetime import datetime, timedelta
import logging

from .models import PricingRequest
from .serializers import (
    PricingRequestSerializer,
    PricingRequestDetailSerializer,
    PricingRequestCreateSerializer
)
from .utils import (
    GeminiService,
    ImageOptimizer,
    PricingCacheService
)
from Core.utils import upload_image_to_supabase

logger = logging.getLogger(__name__)


class ImageUploadView(APIView):
    """Helper endpoint to upload images to Supabase"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Upload image and return URL"""
        if 'image' not in request.FILES:
            return Response(
                {'error': 'No image file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            image_file = request.FILES['image']
            image_url = upload_image_to_supabase(
                image_file,
                bucket_name='oldshop',
                folder='pricing_images'
            )
            return Response({'url': image_url}, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Error uploading image: {str(e)}")
            return Response(
                {'error': f'Failed to upload image: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PricingRequestViewSet(viewsets.ModelViewSet):
    """
    ViewSet for AI Pricing requests
    """
    permission_classes = [IsAuthenticated]
    queryset = PricingRequest.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return PricingRequestCreateSerializer
        elif self.action == 'retrieve':
            return PricingRequestDetailSerializer
        return PricingRequestSerializer
    
    def get_queryset(self):
        """Filter by current user, unless admin"""
        if self.request.user.is_staff or self.request.user.is_superuser:
            # Admin can see all requests
            return self.queryset.select_related('user').order_by('-created_at')
        return self.queryset.filter(user=self.request.user).order_by('-created_at')
    
    def _check_daily_limit(self, user):
        """
        Check if user has exceeded daily limit (3 requests per day)
        Returns: (is_allowed, count_today, limit)
        """
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        
        count_today = PricingRequest.objects.filter(
            user=user,
            created_at__gte=today_start,
            created_at__lt=today_end
        ).count()
        
        limit = 3
        return count_today < limit, count_today, limit
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """
        Create a new pricing request and process it
        """
        # Check daily limit
        is_allowed, count_today, limit = self._check_daily_limit(request.user)
        if not is_allowed:
            return Response(
                {
                    'error': f'1日あたり{limit}回の価格設定リクエストの上限に達しました。明日再度お試しください。',
                    'count_today': count_today,
                    'limit': limit,
                    'reset_time': (timezone.now().replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)).isoformat()
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Create pricing request
        pricing_request = PricingRequest.objects.create(
            user=request.user,
            **serializer.validated_data
        )
        
        # Generate image hash for caching
        try:
            first_image_url = serializer.validated_data['image_urls'][0]
            image_hash = ImageOptimizer.generate_image_hash(first_image_url)
            pricing_request.image_hash = image_hash
            pricing_request.save(update_fields=['image_hash'])
        except Exception as e:
            logger.warning(f"Could not generate image hash: {str(e)}")
        
        # Process in background (for now, synchronous)
        # In production, use Celery or similar
        try:
            self._process_pricing_request(pricing_request)
        except Exception as e:
            logger.error(f"Error processing pricing request: {str(e)}")
            pricing_request.status = 'error'
            pricing_request.error_message = str(e)
            pricing_request.save()
        
        # Return detailed serializer
        output_serializer = PricingRequestDetailSerializer(pricing_request)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)
    
    def _process_pricing_request(self, pricing_request):
        """
        Process pricing request: validate images, then price
        """
        pricing_request.status = 'pending'
        pricing_request.save()
        
        gemini_service = GeminiService()
        image_optimizer = ImageOptimizer()
        
        # Step 1: Validate first image
        try:
            first_image_url = pricing_request.image_urls[0]
            image_base64 = image_optimizer.image_url_to_base64(first_image_url)
            
            validation_result = gemini_service.validate_image(
                image_base64=image_base64,
                title=pricing_request.title,
                category=pricing_request.category,
                brand=pricing_request.brand,
                description=pricing_request.description
            )
            
            pricing_request.validation_result = validation_result
            
            # Check if valid
            if not validation_result.get('is_valid', False):
                pricing_request.status = 'rejected'
                pricing_request.error_message = validation_result.get('reason', 'Hình ảnh không hợp lệ')
                pricing_request.save()
                return
            
            pricing_request.status = 'validated'
            pricing_request.save()
            
        except Exception as e:
            logger.error(f"Error validating image: {str(e)}")
            pricing_request.status = 'error'
            pricing_request.error_message = f"Lỗi xác thực hình ảnh: {str(e)}"
            pricing_request.save()
            return
        
        # Step 2: Check cache
        cache_key = PricingCacheService.get_cache_key(
            category=pricing_request.category,
            brand=pricing_request.brand,
            condition=pricing_request.condition,
            description=pricing_request.description
        )
        
        cached_result = PricingCacheService.get_cached_pricing(cache_key)
        
        if cached_result:
            # Use cached result
            pricing_request.suggested_price = cached_result['suggested_price']
            pricing_request.price_min = cached_result.get('price_min')
            pricing_request.price_max = cached_result.get('price_max')
            pricing_request.pricing_reasoning = cached_result.get('reasoning_text', '')
            pricing_request.status = 'priced'
            pricing_request.save()
            logger.info(f"Used cached pricing for request {pricing_request.id}")
            return
        
        # Step 3: Get pricing from AI
        try:
            pricing_result = gemini_service.price_product(
                title=pricing_request.title,
                category=pricing_request.category,
                brand=pricing_request.brand,
                description=pricing_request.description,
                original_price=float(pricing_request.original_price),
                condition=pricing_request.condition,
                image_base64=image_base64
            )
            
            pricing_request.pricing_result = pricing_result
            pricing_request.suggested_price = pricing_result.get('suggested_price', 0)
            pricing_request.price_min = pricing_result.get('price_min')
            pricing_request.price_max = pricing_result.get('price_max')
            pricing_request.confidence_score = pricing_result.get('confidence_score', 0.5)
            pricing_request.pricing_reasoning = pricing_result.get('reasoning_text', '')
            pricing_request.status = 'priced'
            pricing_request.save()
            
            # Save to cache
            PricingCacheService.save_pricing_cache(
                cache_key=cache_key,
                category=pricing_request.category,
                brand=pricing_request.brand,
                condition=pricing_request.condition,
                pricing_result=pricing_result
            )
            
        except Exception as e:
            logger.error(f"Error pricing product: {str(e)}")
            pricing_request.status = 'error'
            pricing_request.error_message = f"Lỗi định giá: {str(e)}"
            pricing_request.save()
            return
    
    @action(detail=True, methods=['post'])
    def reprocess(self, request, pk=None):
        """
        Reprocess a pricing request
        """
        pricing_request = self.get_object()
        
        if pricing_request.user != request.user:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            self._process_pricing_request(pricing_request)
            serializer = PricingRequestDetailSerializer(pricing_request)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def my_requests(self, request):
        """
        Get all pricing requests for current user
        """
        queryset = self.get_queryset()
        serializer = PricingRequestSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def daily_limit_info(self, request):
        """
        Get daily limit information for current user
        """
        is_allowed, count_today, limit = self._check_daily_limit(request.user)
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        reset_time = (today_start + timedelta(days=1)).isoformat()
        
        return Response({
            'limit': limit,
            'count_today': count_today,
            'remaining': max(0, limit - count_today),
            'is_allowed': is_allowed,
            'reset_time': reset_time
        })
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated, IsAdminUser])
    def admin_update_status(self, request, pk=None):
        """
        Admin action to update status of a pricing request
        """
        pricing_request = self.get_object()
        new_status = request.data.get('status')
        
        if new_status not in dict(PricingRequest.STATUS_CHOICES):
            return Response(
                {'error': '無効なステータスです'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        pricing_request.status = new_status
        pricing_request.save()
        
        serializer = PricingRequestDetailSerializer(pricing_request)
        return Response(serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        """
        Delete pricing request - only owner or admin
        """
        pricing_request = self.get_object()
        
        # Only owner or admin can delete
        if pricing_request.user != request.user and not (request.user.is_staff or request.user.is_superuser):
            return Response(
                {'error': '権限がありません'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().destroy(request, *args, **kwargs)
