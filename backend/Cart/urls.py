from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CartViewSet

router = DefaultRouter()
# We use a singleton-like resource 'cart', so no PK needed for main endpoints
# But ViewSet usually expects PK for detail.
# We only have list-like endpoints (my_cart) and custom actions.
# We can register it as 'cart' but we need to handle the URL structure.
# Simpler: Just use manual paths or register as 'cart' and access via actions.

# Since we don't list *all* carts, we can just map methods manually or use a singleton viewset approach.
# But standard router is fine if we use @action.

urlpatterns = [
    path('cart/my/', CartViewSet.as_view({'get': 'my_cart'}), name='my-cart'),
    path('cart/add/', CartViewSet.as_view({'post': 'add_item'}), name='add-item'),
    path('cart/update/', CartViewSet.as_view({'post': 'update_item'}), name='update-item'),
    path('cart/remove/', CartViewSet.as_view({'post': 'remove_item'}), name='remove-item'),
    path('cart/sync/', CartViewSet.as_view({'post': 'sync'}), name='sync-cart'),
    path('cart/clear/', CartViewSet.as_view({'post': 'clear'}), name='clear-cart'),
]

