from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FreeItemViewSet, FreeItemMessageViewSet

router = DefaultRouter()
router.register(r'free-items', FreeItemViewSet, basename='freeitem')
router.register(r'free-item-messages', FreeItemMessageViewSet, basename='freeitemmessage')

urlpatterns = [
    path('', include(router.urls)),
]

