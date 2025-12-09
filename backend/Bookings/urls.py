from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BookingViewSet, get_booked_dates

router = DefaultRouter()
router.register(r'bookings', BookingViewSet, basename='booking')

urlpatterns = [
    path('bookings/booked-dates/', get_booked_dates, name='booked-dates'),
    path('', include(router.urls)),
]


