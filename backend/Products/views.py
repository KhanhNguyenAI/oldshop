from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from datetime import timedelta
import os
from decouple import config
import google.generativeai as genai
from .models import Category, Product, Brand, ProductRating, ProductComment, CommentImage, UserHistory, Accessory, CategoryAccessory, ProductGeminiAnswer
from .serializers import CategorySerializer, ProductSerializer, BrandSerializer, ProductCommentSerializer
from .filters import ProductFilter
from Core.utils import upload_image_to_supabase, upload_video_to_supabase


def cleanup_old_user_history():
    """
    Tự động xóa lịch sử cũ hơn 7 ngày (chỉ cho authenticated users)
    Chỉ xóa một số lượng nhỏ mỗi lần để không làm chậm request
    """
    try:
        seven_days_ago = timezone.now() - timedelta(days=7)
        # Chỉ cleanup lịch sử của authenticated users (user__isnull=False)
        # Bỏ qua anonymous users (user=None) nếu có dữ liệu cũ
        old_count = UserHistory.objects.filter(
            user__isnull=False,  # Chỉ lấy records có user
            viewed_at__lt=seven_days_ago
        ).count()
        
        if old_count > 0:
            # Xóa tối đa 50 records mỗi lần để không làm chậm request
            # Sẽ tự động cleanup dần dần qua nhiều requests
            old_history = UserHistory.objects.filter(
                user__isnull=False,  # Chỉ xóa records có user
                viewed_at__lt=seven_days_ago
            )[:50]
            deleted_count, _ = old_history.delete()
            return deleted_count
    except Exception as e:
        # Log error nhưng không làm fail request
        print(f"Error cleaning up old user history: {e}")
    return 0
 
class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None  # Disable pagination for categories - need all for tree structure

class BrandViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None  # Disable pagination for brands - usually few items

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by('-created_at')
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ['title', 'description', 'brand__name']
    ordering_fields = ['price', 'created_at']

    def retrieve(self, request, *args, **kwargs):
        """Override retrieve để track view history"""
        instance = self.get_object()
        
        # Track view history - CHỈ lưu cho authenticated users để tiết kiệm database
        # Chỉ lưu 1 record/user/product: lần đầu insert, xem lại thì update viewed_at
        if request.user.is_authenticated:
            UserHistory.objects.update_or_create(
                user=request.user,
                product=instance,
                defaults={'viewed_at': timezone.now()}  # Update viewed_at mỗi lần xem
            )
            
            # Tự động cleanup dữ liệu cũ hơn 7 ngày
            # Cleanup mỗi lần nhưng chỉ xóa 50 records để không làm chậm request
            # Sẽ tự động cleanup dần dần qua nhiều requests
            cleanup_old_user_history()
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def perform_create(self, serializer):
        user = self.request.user
        # Check if location is provided in validated_data
        location = serializer.validated_data.get('location')
        
        if not location:
            # Default to 'OldShop' if not provided
            location = "OldShop"
        
        serializer.save(seller=user, location=location)

    @action(detail=False, methods=['get'])
    def my_products(self, request):
        user = request.user
        if not user.is_authenticated:
            return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)
        queryset = self.queryset.filter(seller=user)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def rate(self, request, pk=None):
        product = self.get_object()
        user = request.user
        score = request.data.get('score')

        if not score:
            return Response({'detail': 'Score is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            score = int(score)
            if not (1 <= score <= 5):
                raise ValueError
        except ValueError:
             return Response({'detail': 'Score must be an integer between 1 and 5.'}, status=status.HTTP_400_BAD_REQUEST)

        # Update or Create
        rating, created = ProductRating.objects.update_or_create(
            user=user,
            product=product,
            defaults={'score': score}
        )
        
        return Response({
            'detail': 'Rating updated.' if not created else 'Rating created.',
            'score': rating.score
        })

    @action(detail=True, methods=['get'])
    def comments(self, request, pk=None):
        product = self.get_object()
        # Only fetch top-level comments (parent=None)
        comments = ProductComment.objects.filter(product=product, parent=None, is_active=True).order_by('-created_at')
        serializer = ProductCommentSerializer(comments, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def add_comment(self, request, pk=None):
        product = self.get_object()
        user = request.user
        content = request.data.get('content')
        parent_id = request.data.get('parent_id')
        uploaded_images = request.FILES.getlist('uploaded_images')

        if not content:
            return Response({'detail': 'Content is required.'}, status=status.HTTP_400_BAD_REQUEST)

        parent = None
        if parent_id:
            try:
                parent = ProductComment.objects.get(id=parent_id, product=product)
            except ProductComment.DoesNotExist:
                return Response({'detail': 'Parent comment not found.'}, status=status.HTTP_404_NOT_FOUND)

        comment = ProductComment.objects.create(
            user=user,
            product=product,
            content=content,
            parent=parent
        )

        # Handle Image and Video Uploads
        upload_errors = []
        for media_file in uploaded_images:
            try:
                # Check if file is video by content type or extension
                content_type = media_file.content_type or ''
                file_name = media_file.name.lower()
                is_video = (
                    content_type.startswith('video/') or
                    file_name.endswith(('.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv'))
                )
                
                if is_video:
                    # Upload and compress video (only when user submits)
                    # Will upload original if ffmpeg not available
                    try:
                        video_url = upload_video_to_supabase(media_file, folder='review', max_size_mb=50)
                        CommentImage.objects.create(comment=comment, image=video_url, is_video=True)
                    except ValueError as ve:
                        # If it's a size error or ffmpeg error, log but continue
                        error_msg = str(ve)
                        upload_errors.append(f"Video '{file_name}': {error_msg}")
                        print(f"Failed to upload video: {error_msg}")
                else:
                    # Upload and compress image
                    image_url = upload_image_to_supabase(media_file, folder='review')
                    CommentImage.objects.create(comment=comment, image=image_url, is_video=False)
            except Exception as e:
                # Log error but don't fail the whole request
                error_msg = str(e)
                upload_errors.append(f"Media '{media_file.name}': {error_msg}")
                print(f"Failed to upload comment media: {error_msg}")
        
        # Prepare response
        serializer = ProductCommentSerializer(comment)
        response_data = serializer.data
        if upload_errors:
            response_data['upload_warnings'] = upload_errors

        return Response(response_data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], permission_classes=[permissions.AllowAny])
    def recommendations(self, request, pk=None):
        """
        Gợi ý sản phẩm:
        - Nếu user đã mua sản phẩm này (delivered) → trả về phụ kiện (accessories)
        - Nếu chưa mua → trả về sản phẩm cùng category
        """
        product = self.get_object()
        user = request.user if request.user.is_authenticated else None
        
        # Kiểm tra xem user đã mua sản phẩm này chưa (delivered)
        has_purchased = False
        if user:
            from Orders.models import OrderItem
            purchased_items = OrderItem.objects.filter(
                product=product,
                order__user=user,
                order__status='delivered'
            ).exists()
            has_purchased = purchased_items
        
        if has_purchased:
            # Nếu đã mua → trả về phụ kiện dựa trên CategoryAccessory
            accessory_categories = CategoryAccessory.objects.filter(
                category=product.category
            ).values_list('accessory_category', flat=True)
            
            if accessory_categories:
                accessory_products = Product.objects.filter(
                    category_id__in=accessory_categories,
                    is_sold=False
                ).exclude(id=product.id).order_by('-created_at')[:10]
            else:
                # Fallback: cùng category
                accessory_products = Product.objects.filter(
                    category=product.category,
                    is_sold=False
                ).exclude(id=product.id).order_by('-created_at')[:10]
            
            serializer = self.get_serializer(accessory_products, many=True)
            return Response({
                'type': 'accessories',
                'category': CategorySerializer(product.category).data,
                'recommendations': serializer.data,
                'count': len(serializer.data)
            })
        else:
            # Nếu chưa mua → trả về sản phẩm cùng category
            category = product.category
            
            recommended_products = Product.objects.filter(
                category=category
            ).exclude(
                id=product.id
            ).exclude(
                is_sold=True
            ).order_by(
                '-created_at'
            )[:10]
            
            serializer = self.get_serializer(recommended_products, many=True)
            return Response({
                'type': 'same_category',
                'category': CategorySerializer(category).data,
                'recommendations': serializer.data,
                'count': len(serializer.data)
            })

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def accessories(self, request):
        """
        Gợi ý phụ kiện liên quan khi người dùng ĐÃ MUA sản phẩm
        Lấy danh sách sản phẩm user đã mua từ orders
        Trả về phụ kiện tương ứng từ bảng accessory
        """
        user = request.user
        
        # Lấy tất cả sản phẩm user đã mua từ orders
        from Orders.models import OrderItem
        
        purchased_products = OrderItem.objects.filter(
            order__user=user,
            order__status__in=['delivered', 'shipped', 'processing']  # Chỉ lấy đơn đã giao hoặc đang xử lý
        ).values_list('product_id', flat=True).distinct()
        
        if not purchased_products:
            return Response({
                'message': 'Bạn chưa mua sản phẩm nào.',
                'accessories': []
            })
        
        # Lấy categories của các sản phẩm đã mua
        purchased_product_categories = Product.objects.filter(
            id__in=purchased_products
        ).values_list('category', flat=True).distinct()
        
        # Lấy accessory categories từ CategoryAccessory
        accessory_category_ids = CategoryAccessory.objects.filter(
            category_id__in=purchased_product_categories
        ).values_list('accessory_category_id', flat=True).distinct()
        
        if accessory_category_ids:
            accessory_products = Product.objects.filter(
                category_id__in=accessory_category_ids,
                is_sold=False
            ).order_by('-created_at')[:20]
        else:
            # Fallback: không có accessories
            accessory_products = Product.objects.none()
        
        serializer = self.get_serializer(accessory_products, many=True)
        return Response({
            'purchased_count': len(purchased_products),
            'accessories': serializer.data,
            'count': len(serializer.data)
        })

    def list(self, request, *args, **kwargs):
        """
        Override list để sắp xếp sản phẩm theo thứ tự ưu tiên:
        1. Sản phẩm đã xem gần đây (từ UserHistory)
        2. Sản phẩm cùng category với những sản phẩm đã xem
        3. Sản phẩm liên quan (accessories)
        4. Còn lại (sản phẩm khác)
        """
        user = request.user if request.user.is_authenticated else None
        
        # Lấy base queryset (đã apply filters)
        # Giữ lại cả sản phẩm đã sold out để người dùng biết có sản phẩm này
        queryset = self.filter_queryset(self.get_queryset())
        
        # 1. Sản phẩm đã xem gần đây (nếu user đã đăng nhập)
        # Chỉ lấy lịch sử trong 7 ngày gần nhất
        viewed_product_ids = []
        if user:
            seven_days_ago = timezone.now() - timedelta(days=7)
            recent_views = UserHistory.objects.filter(
                user=user,
                viewed_at__gte=seven_days_ago  # Chỉ lấy trong 7 ngày
            ).order_by('-viewed_at').values_list('product_id', flat=True).distinct()[:50]
            viewed_product_ids = list(recent_views)
        
        # 2. Lấy categories của sản phẩm đã xem
        viewed_categories = set()
        if viewed_product_ids:
            viewed_categories = set(
                Product.objects.filter(id__in=viewed_product_ids)
                .values_list('category_id', flat=True)
            )
        
        # 3. Lấy accessories của sản phẩm đã xem dựa trên CategoryAccessory
        accessory_product_ids = set()
        if viewed_product_ids:
            # Lấy categories của sản phẩm đã xem
            viewed_category_ids = set(
                Product.objects.filter(id__in=viewed_product_ids)
                .values_list('category_id', flat=True)
            )
            
            # Lấy accessory category IDs từ CategoryAccessory
            accessory_category_ids = CategoryAccessory.objects.filter(
                category_id__in=viewed_category_ids
            ).values_list('accessory_category_id', flat=True).distinct()
            
            if accessory_category_ids:
                # Lấy products từ accessory categories
                accessory_products = Product.objects.filter(
                    category_id__in=accessory_category_ids,
                    is_sold=False
                )[:50]  # Get more to have enough for scoring
                accessory_product_ids = set(accessory_products.values_list('id', flat=True))
        
        # Phân loại sản phẩm từ queryset đã filter
        viewed_products = []
        same_category_products = []
        related_products = []
        other_products = []
        
        viewed_ids_set = set(viewed_product_ids)
        
        for product in queryset:
            if product.id in viewed_ids_set:
                # Ưu tiên 1: Đã xem gần đây
                viewed_products.append(product)
            elif product.category_id in viewed_categories:
                # Ưu tiên 2: Cùng category
                same_category_products.append(product)
            elif product.id in accessory_product_ids:
                # Ưu tiên 3: Phụ kiện liên quan
                related_products.append(product)
            else:
                # Ưu tiên 4: Còn lại
                other_products.append(product)
        
        # Sắp xếp viewed_products theo thời gian xem gần nhất
        if viewed_product_ids:
            viewed_products.sort(key=lambda p: viewed_product_ids.index(p.id) if p.id in viewed_product_ids else 999)
        
        # Hàm helper để sắp xếp: sản phẩm chưa bán trước, sold out sau
        def sort_by_availability(products):
            available = [p for p in products if not p.is_sold]
            sold_out = [p for p in products if p.is_sold]
            return available + sold_out
        
        # Sắp xếp từng nhóm: chưa bán trước, sold out sau
        viewed_products = sort_by_availability(viewed_products)
        same_category_products = sort_by_availability(same_category_products)
        related_products = sort_by_availability(related_products)
        other_products = sort_by_availability(other_products)
        
        # Kết hợp tất cả theo thứ tự ưu tiên
        prioritized_products = (
            viewed_products +
            same_category_products +
            related_products +
            other_products
        )
        
        # Pagination
        page = self.paginate_queryset(prioritized_products)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(prioritized_products, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def robot_suggestions(self, request):
        """
        Lấy sản phẩm để robot giới thiệu:
        - Nếu user đã đăng nhập và có lịch sử: lấy sản phẩm đã xem
        - Nếu không: lấy sản phẩm bán chạy nhất
        Giới hạn 4 sản phẩm
        """
        user = request.user if request.user.is_authenticated else None
        
        products = []
        
        if user:
            # Kiểm tra xem user có lịch sử xem không
            seven_days_ago = timezone.now() - timedelta(days=7)
            has_history = UserHistory.objects.filter(
                user=user,
                viewed_at__gte=seven_days_ago
            ).exists()
            
            if has_history:
                # Lấy sản phẩm đã xem gần đây
                recent_views = UserHistory.objects.filter(
                    user=user,
                    viewed_at__gte=seven_days_ago
                ).order_by('-viewed_at').values_list('product_id', flat=True).distinct()[:4]
                
                products = Product.objects.filter(
                    id__in=recent_views
                ).order_by('-created_at')[:4]
            else:
                # Chưa có lịch sử, lấy sản phẩm bán chạy
                products = Product.objects.filter(
                    is_sold=False
                ).order_by('-sold_quantity', '-created_at')[:4]
        else:
            # User chưa đăng nhập, lấy sản phẩm bán chạy
            products = Product.objects.filter(
                is_sold=False
            ).order_by('-sold_quantity', '-created_at')[:4]
        
        serializer = self.get_serializer(products, many=True)
        return Response({
            'products': serializer.data,
            'count': len(serializer.data),
            'type': 'viewed' if user and UserHistory.objects.filter(user=user, viewed_at__gte=timezone.now() - timedelta(days=7)).exists() else 'bestselling'
        })


@api_view(['POST'])
@permission_classes([AllowAny])
def ask_gemini(request):
    """
    Ask Gemini AI a question about a product
    If the product has been asked before, return cached answer from database
    """
    try:
        question = request.data.get('question', '')
        product_id = request.data.get('product_id', '')
        
        if not question:
            return Response(
                {'detail': '質問が必要です。'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not product_id:
            return Response(
                {'detail': '商品IDが必要です。'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Try to get existing answer from database
        try:
            product = Product.objects.get(id=product_id)
            gemini_answer_obj = ProductGeminiAnswer.objects.filter(product=product).first()
            
            if gemini_answer_obj:
                # Kiểm tra xem câu trả lời có cũ hơn 1 ngày không
                one_day_ago = timezone.now() - timedelta(days=1)
                
                if gemini_answer_obj.created_at < one_day_ago:
                    # Xóa câu trả lời cũ để lấy câu trả lời mới
                    gemini_answer_obj.delete()
                    # Tiếp tục để gọi Gemini API
                else:
                    # Trả về câu trả lời đã cache nếu còn mới (dưới 1 ngày)
                    return Response({
                        'answer': gemini_answer_obj.answer,
                        'cached': True
                    })
        except Product.DoesNotExist:
            return Response(
                {'detail': '商品が見つかりません。'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"Error checking cached answer: {e}")
            # Continue to call Gemini API if there's an error checking cache

        # If no cached answer or cached answer is older than 1 day, call Gemini API
        gemini_api_key = config('GEMINI_API_KEY', default='')
        if not gemini_api_key:
            return Response(
                {'detail': 'Gemini API keyが設定されていません。'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Configure Gemini API
        genai.configure(api_key=gemini_api_key)
        
        # Create model instance
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Thêm thời gian hiện tại vào prompt để Gemini có thể đưa ra câu trả lời dựa trên thị trường hiện tại
        current_time = timezone.now().strftime('%Y年%m月%d日 %H:%M:%S')
        prompt = f"現在の日時: {current_time}\n\n{question}\n\n重要: 必ず日本語で回答してください。回答は5-6行程度にまとめてください。現在の市場状況を考慮して回答してください。"
        
        # Generate content
        response = model.generate_content(prompt)
        
        if response and response.text:
            answer_text = response.text
            
            # Save answer to database
            try:
                ProductGeminiAnswer.objects.update_or_create(
                    product=product,
                    defaults={
                        'answer': answer_text,
                        'question': question
                    }
                )
            except Exception as e:
                print(f"Error saving Gemini answer to database: {e}")
                # Continue even if saving fails
            
            return Response({
                'answer': answer_text,
                'cached': False
            })
        else:
            return Response(
                {'detail': 'Geminiからの回答を取得できませんでした。'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    except Exception as e:
        print(f"Gemini API error: {e}")
        return Response(
            {'detail': f'Gemini APIへの接続に失敗しました: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
