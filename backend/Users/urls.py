from django.urls import path
from . import views

app_name = 'users'

urlpatterns = [
    path('send-otp/', views.send_otp, name='send-otp'),
    path('verify-otp/', views.verify_otp, name='verify-otp'),
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    path('refresh/', views.refresh_token, name='refresh-token'),
    path('logout/', views.logout, name='logout'),
    path('me/', views.get_current_user, name='current-user'),
    path('reset-password/', views.reset_password, name='reset-password'),
    path('change-password/', views.change_password, name='change-password'),
    path('send-otp-email-update/', views.send_otp_for_email_update, name='send-otp-email-update'),
    path('update-email/', views.update_email, name='update-email'),
    path('profile/', views.UserProfileView.as_view(), name='user-profile'),
    # Payment methods (VISA / cards)
    path('payments/', views.PaymentMethodListCreateView.as_view(), name='payment-method-list-create'),
    path('payments/<int:pk>/', views.PaymentMethodDetailView.as_view(), name='payment-method-detail'),
    # Addresses
    path('addresses/', views.AddressListCreateView.as_view(), name='address-list-create'),
    path('addresses/<int:pk>/', views.AddressDetailView.as_view(), name='address-detail'),
]
