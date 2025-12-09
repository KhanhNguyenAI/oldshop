from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrderViewSet
from .return_views import ReturnRequestViewSet
from .strike_webhook import strike_webhook

router = DefaultRouter()
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'returns', ReturnRequestViewSet, basename='return')

urlpatterns = [
    path('', include(router.urls)),
    path('strike-webhook/', strike_webhook, name='strike-webhook'),
]

