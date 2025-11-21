from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken as JWTRefreshToken
from django.utils import timezone
from datetime import timedelta
from django.conf import settings
from django.core.mail import send_mail
from django.db.models import Q
from .models import User, OTP, RefreshToken
from .serializers import (
    EmailSerializer,
    OTPSerializer,
    RegisterSerializer,
    LoginSerializer,
    UserSerializer
)


def cleanup_expired_tokens():
    """Delete all expired or revoked refresh tokens from database"""
    now = timezone.now()
    expired_count = RefreshToken.objects.filter(
        Q(expires_at__lt=now) | Q(is_revoked=True)
    ).count()
    
    RefreshToken.objects.filter(
        Q(expires_at__lt=now) | Q(is_revoked=True)
    ).delete()
    
    if expired_count > 0:
        print(f"🧹 CLEANUP: Xóa {expired_count} RT hết hạn/revoked")
    
    return expired_count


def send_otp_email(email, otp_code):
    """Send OTP via email"""
    subject = 'Mã OTP xác thực email - OldShop'
    message = f'''
    Chào bạn,
    
    Mã OTP xác thực email của bạn là: {otp_code}
    
    Mã này có hiệu lực trong {settings.OTP_EXPIRY_MINUTES} phút.
    
    Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.
    
    Trân trọng,
    OldShop Team
    '''
    try:
        send_mail(
            subject,
            message,
            'noreply@oldshop.com',  # From email
            [email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False


@api_view(['POST'])
@permission_classes([AllowAny])
def send_otp(request):
    """Send OTP to email for registration"""
    serializer = EmailSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    email = serializer.validated_data['email']
    
    # Rate limiting: Check if too many OTP requests in last hour
    one_hour_ago = timezone.now() - timedelta(hours=1)
    recent_otps = OTP.objects.filter(
        email=email,
        created_at__gte=one_hour_ago
    ).count()
    
    if recent_otps >= settings.OTP_RATE_LIMIT_PER_HOUR:
        return Response(
            {'error': f'Bạn đã gửi quá nhiều yêu cầu OTP. Vui lòng thử lại sau.'},
            status=status.HTTP_429_TOO_MANY_REQUESTS
        )
    
    # Generate OTP
    otp_code = OTP.generate_otp(length=settings.OTP_LENGTH)
    otp_hash = OTP.hash_otp(otp_code)
    
    # Set expiry
    expires_at = timezone.now() + timedelta(minutes=settings.OTP_EXPIRY_MINUTES)
    
    # Save OTP
    OTP.objects.create(
        email=email,
        otp_code_hash=otp_hash,
        expires_at=expires_at
    )
    
    # Print OTP to console for development (remove in production)
    print(f"\n{'='*50}")
    print(f"OTP CODE FOR {email}: {otp_code}")
    print(f"Expires at: {expires_at}")
    print(f"{'='*50}\n")
    
    # Send email
    if send_otp_email(email, otp_code):
        return Response(
            {'message': 'OTP đã được gửi đến email của bạn.'},
            status=status.HTTP_200_OK
        )
    else:
        return Response(
            {'error': 'Không thể gửi email. Vui lòng thử lại.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp(request):
    """Verify OTP code"""
    serializer = OTPSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    otp_obj = serializer.validated_data['otp_obj']
    
    return Response(
        {'message': 'OTP hợp lệ.'},
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Register new user with OTP verification"""
    serializer = RegisterSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    user = serializer.save()
    
    # Generate tokens
    refresh = JWTRefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    refresh_token = str(refresh)
    
    # Delete any existing tokens for this user (shouldn't happen but just in case)
    RefreshToken.objects.filter(user=user).delete()
    
    # Save refresh token to database
    expires_at = timezone.now() + timedelta(minutes=5)  # Test: 5 minutes
    RefreshToken.objects.create(
        user=user,
        token=refresh_token,
        expires_at=expires_at
    )
    
    print(f"📝 REGISTER: User {user.email} đăng ký thành công | AT valid 1 min | RT valid 5 min")
    
    # Create response
    response = Response(
        {
            'message': 'Đăng ký thành công.',
            'user': UserSerializer(user).data,
            'access_token': access_token,
        },
        status=status.HTTP_201_CREATED
    )
    
    # Set refresh token in httpOnly cookie
    response.set_cookie(
        'refresh_token',
        refresh_token,
        max_age=300,  # 5 minutes in seconds
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite='Lax'
    )
    
    return response


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Login user"""
    serializer = LoginSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    user = serializer.validated_data['user']
    
    # Generate tokens
    refresh = JWTRefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    refresh_token = str(refresh)
    
    # Delete ALL old refresh tokens for this user (expired, revoked, or valid)
    old_tokens_count = RefreshToken.objects.filter(user=user).count()
    RefreshToken.objects.filter(user=user).delete()
    
    # Save new refresh token to database
    expires_at = timezone.now() + timedelta(minutes=5)  # Test: 5 minutes
    RefreshToken.objects.create(
        user=user,
        token=refresh_token,
        expires_at=expires_at
    )
    
    print(f"🔑 LOGIN: User {user.email} đăng nhập | Xóa {old_tokens_count} RT cũ | AT valid 1 min | RT valid 5 min")
    
    # Create response
    response = Response(
        {
            'message': 'Đăng nhập thành công.',
            'user': UserSerializer(user).data,
            'access_token': access_token,
        },
        status=status.HTTP_200_OK
    )
    
    # Set refresh token in httpOnly cookie
    response.set_cookie(
        'refresh_token',
        refresh_token,
        max_age=300,  # 5 minutes in seconds
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite='Lax'
    )
    
    return response


@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_token(request):
    """Refresh access token using refresh token from cookie"""
    # Cleanup expired tokens periodically
    cleanup_expired_tokens()
    
    refresh_token_value = request.COOKIES.get('refresh_token')
    
    if not refresh_token_value:
        return Response(
            {'error': 'Refresh token không tìm thấy.'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Check if refresh token exists in database
    try:
        db_refresh_token = RefreshToken.objects.get(
            token=refresh_token_value,
            is_revoked=False
        )
    except RefreshToken.DoesNotExist:
        return Response(
            {'error': 'Refresh token không hợp lệ.'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Check if refresh token is expired
    if not db_refresh_token.is_valid():
        db_refresh_token.is_revoked = True
        db_refresh_token.save()
        return Response(
            {'error': 'Refresh token đã hết hạn.'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    try:
        # Validate current refresh token (ensures signature & expiry)
        JWTRefreshToken(refresh_token_value)
        
        # Create new tokens
        new_refresh = JWTRefreshToken.for_user(db_refresh_token.user)
        new_access_token = str(new_refresh.access_token)
        new_refresh_token = str(new_refresh)
        
        # Delete ALL old/expired/revoked tokens for this user
        old_tokens_count = RefreshToken.objects.filter(user=db_refresh_token.user).count()
        RefreshToken.objects.filter(user=db_refresh_token.user).delete()
        
        # Save new refresh token
        expires_at = timezone.now() + timedelta(minutes=5)  # Test: 5 minutes
        RefreshToken.objects.create(
            user=db_refresh_token.user,
            token=new_refresh_token,
            expires_at=expires_at
        )
        
        print(f"🔄 REFRESH: User {db_refresh_token.user.email} | Xóa {old_tokens_count} RT cũ | New AT+RT valid")
        
        # Create response
        response = Response(
            {
                'access_token': new_access_token,
            },
            status=status.HTTP_200_OK
        )
        
        # Set new refresh token in httpOnly cookie
        response.set_cookie(
            'refresh_token',
            new_refresh_token,
            max_age=300,  # 5 minutes in seconds
            httponly=True,
            secure=False,  # Set to True in production with HTTPS
            samesite='Lax'
        )
        
        return response
        
    except Exception as e:
        return Response(
            {'error': 'Không thể refresh token.'},
            status=status.HTTP_401_UNAUTHORIZED
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """Logout user and delete all refresh tokens"""
    # Delete ALL refresh tokens for this user
    deleted_count = RefreshToken.objects.filter(user=request.user).count()
    RefreshToken.objects.filter(user=request.user).delete()
    
    print(f"🚪 LOGOUT: User {request.user.email} đã đăng xuất | Xóa {deleted_count} RT")
    
    # Create response
    response = Response(
        {'message': 'Đăng xuất thành công.'},
        status=status.HTTP_200_OK
    )
    
    # Delete refresh token cookie
    response.delete_cookie('refresh_token')
    
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    """Get current authenticated user"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    """Reset password with email and OTP verification"""
    from .serializers import ResetPasswordSerializer
    
    serializer = ResetPasswordSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    email = serializer.validated_data['email']
    password = serializer.validated_data['password']
    otp_obj = serializer.validated_data['otp_obj']
    
    # Get user
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response(
            {'error': 'ユーザーが見つかりません。'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Update password
    user.set_password(password)
    user.save()
    
    # Mark OTP as used
    otp_obj.mark_as_used()
    
    # Delete all refresh tokens for security
    deleted_count = RefreshToken.objects.filter(user=user).count()
    RefreshToken.objects.filter(user=user).delete()
    
    print(f"🔐 PASSWORD RESET: User {user.email} | Xóa {deleted_count} RT")
    
    return Response(
        {'message': 'パスワードがリセットされました。'},
        status=status.HTTP_200_OK
    )
