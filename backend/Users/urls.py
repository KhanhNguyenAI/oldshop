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
]

