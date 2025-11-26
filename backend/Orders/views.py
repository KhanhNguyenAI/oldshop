from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Order
from .serializers import OrderSerializer

class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Users can only see their own orders
        return Order.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Automatically associate order with current user
        serializer.save(user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        order = self.get_object()
        if order.status != 'cancelled':
             return Response(
                {'error': 'キャンセルされた注文のみ削除できます。'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        order = self.get_object()
        
        if order.status not in ['pending', 'processing']:
            return Response(
                {'error': '発送済みまたは完了した注文はキャンセルできません。'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from django.db import transaction
        try:
            with transaction.atomic():
                order.status = 'cancelled'
                order.save()
                
                # Restore stock for each item
                for item in order.items.all():
                    if item.product:
                        product = item.product
                        product.stock_quantity += item.quantity
                        # Decrease sold quantity safely
                        if product.sold_quantity >= item.quantity:
                            product.sold_quantity -= item.quantity
                        else:
                            product.sold_quantity = 0
                            
                        # Unmark 'is_sold' if stock becomes available
                        if product.stock_quantity > 0:
                            product.is_sold = False
                            
                        product.save()
                        
            return Response({'message': '注文がキャンセルされました。在庫が復元されました。', 'status': order.status})
        except Exception as e:
            return Response(
                {'error': f'キャンセル処理中にエラーが発生しました: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
