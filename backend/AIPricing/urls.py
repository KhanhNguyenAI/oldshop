from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PricingRequestViewSet, ImageUploadView

router = DefaultRouter()
router.register(r'pricing', PricingRequestViewSet, basename='pricing')

urlpatterns = [
    path('', include(router.urls)),
    path('upload-image/', ImageUploadView.as_view(), name='upload-image'),
]

