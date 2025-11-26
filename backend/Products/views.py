from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Category, Product, Brand, ProductRating, ProductComment
from .serializers import CategorySerializer, ProductSerializer, BrandSerializer, ProductCommentSerializer
from .filters import ProductFilter

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]

class BrandViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer
    permission_classes = [permissions.AllowAny]

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by('-created_at')
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ['title', 'description', 'brand__name']
    ordering_fields = ['price', 'created_at']

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

        serializer = ProductCommentSerializer(comment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
