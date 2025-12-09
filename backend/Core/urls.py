from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ContactCreateView, ContactAdminViewSet, admin_dashboard_stats

router = DefaultRouter()
router.register(r'admin/contacts', ContactAdminViewSet, basename='admin-contact')

urlpatterns = [
    path('contact/', ContactCreateView.as_view(), name='contact-create'),
    path('admin/dashboard/stats/', admin_dashboard_stats, name='admin-dashboard-stats'),
    path('', include(router.urls)),
]

