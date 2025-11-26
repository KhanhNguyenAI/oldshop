from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.validators import EmailValidator
from django.utils import timezone
from datetime import timedelta
from django.conf import settings
from .models import User, OTP, RefreshToken, UserProfile, PaymentMethod, Address
from urllib.parse import quote
import re


class EmailSerializer(serializers.Serializer):
    email = serializers.EmailField(validators=[EmailValidator()])

    def validate_email(self, value):
        # Check if email already exists
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email đã được sử dụng.")
        return value


class OTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp_code = serializers.CharField(max_length=6, min_length=6)

    def validate_otp_code(self, value):
        if not value.isdigit():
            raise serializers.ValidationError("OTP phải là 6 chữ số.")
        return value

    def validate(self, attrs):
        email = attrs.get('email')
        otp_code = attrs.get('otp_code')

        # Find latest unused OTP for this email
        otp_obj = OTP.objects.filter(
            email=email,
            is_used=False,
            expires_at__gt=timezone.now()
        ).order_by('-created_at').first()

        if not otp_obj:
            raise serializers.ValidationError({
                'otp_code': 'OTP không hợp lệ hoặc đã hết hạn.'
            })

        if not otp_obj.verify_otp(otp_code):
            raise serializers.ValidationError({
                'otp_code': 'OTP không đúng.'
            })

        attrs['otp_obj'] = otp_obj
        return attrs


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField(validators=[EmailValidator()])
    password = serializers.CharField(write_only=True, min_length=8)
    otp_code = serializers.CharField(max_length=6, min_length=6, write_only=True)

    def validate_password(self, value):
        validate_password(value)
        # Additional custom validation
        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError(
                "Mật khẩu phải có ít nhất một chữ hoa."
            )
        if not re.search(r'[a-z]', value):
            raise serializers.ValidationError(
                "Mật khẩu phải có ít nhất một chữ thường."
            )
        if not re.search(r'\d', value):
            raise serializers.ValidationError(
                "Mật khẩu phải có ít nhất một chữ số."
            )
        return value

    def validate(self, attrs):
        email = attrs.get('email')
        otp_code = attrs.get('otp_code')

        # Check if user already exists
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError({
                'email': 'Email đã được sử dụng.'
            })

        # Verify OTP
        otp_obj = OTP.objects.filter(
            email=email,
            is_used=False,
            expires_at__gt=timezone.now()
        ).order_by('-created_at').first()

        if not otp_obj:
            raise serializers.ValidationError({
                'otp_code': 'OTP không hợp lệ hoặc đã hết hạn.'
            })

        if not otp_obj.verify_otp(otp_code):
            raise serializers.ValidationError({
                'otp_code': 'OTP không đúng.'
            })

        attrs['otp_obj'] = otp_obj
        return attrs

    def create(self, validated_data):
        email = validated_data['email']
        password = validated_data['password']
        otp_obj = validated_data['otp_obj']

        # Create user
        user = User.objects.create_user(
            email=email,
            password=password,
            is_email_verified=True
        )

        # Mark OTP as used
        otp_obj.mark_as_used()

        # Create profile with beautiful default avatar (DiceBear, deterministic by email)
        seed = email.split('@')[0] if '@' in email else email
        encoded_seed = quote(seed)
        avatar_url = (
            "https://api.dicebear.com/7.x/avataaars/svg"
            f"?seed={encoded_seed}"
            "&backgroundColor=b6e3f4,c0aede,d1d4f9"
            "&backgroundType=gradientLinear"
            "&radius=50"
        )
        UserProfile.objects.create(user=user, avatar_url=avatar_url)

        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError({
                'email': 'Email hoặc mật khẩu không đúng.'
            })

        if not user.check_password(password):
            raise serializers.ValidationError({
                'password': 'Email hoặc mật khẩu không đúng.'
            })

        if not user.is_active:
            raise serializers.ValidationError({
                'email': 'Tài khoản đã bị khóa.'
            })

        attrs['user'] = user
        return attrs


class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    otp_code = serializers.CharField(max_length=6, min_length=6, write_only=True)

    def validate_email(self, value):
        # Check if user exists
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email không tồn tại.")
        return value

    def validate_password(self, value):
        validate_password(value)
        # Additional custom validation
        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError(
                "Mật khẩu phải có ít nhất một chữ hoa."
            )
        if not re.search(r'[a-z]', value):
            raise serializers.ValidationError(
                "Mật khẩu phải có ít nhất một chữ thường."
            )
        if not re.search(r'\d', value):
            raise serializers.ValidationError(
                "Mật khẩu phải có ít nhất một chữ số."
            )
        return value

    def validate(self, attrs):
        email = attrs.get('email')
        otp_code = attrs.get('otp_code')

        # Verify OTP
        otp_obj = OTP.objects.filter(
            email=email,
            is_used=False,
            expires_at__gt=timezone.now()
        ).order_by('-created_at').first()

        if not otp_obj:
            raise serializers.ValidationError({
                'otp_code': 'OTP không hợp lệ hoặc đã hết hạn.'
            })

        if not otp_obj.verify_otp(otp_code):
            raise serializers.ValidationError({
                'otp_code': 'OTP không đúng.'
            })

        attrs['otp_obj'] = otp_obj
        return attrs


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_new_password(self, value):
        validate_password(value)
        # Additional custom validation
        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError(
                "Mật khẩu phải có ít nhất một chữ hoa."
            )
        if not re.search(r'[a-z]', value):
            raise serializers.ValidationError(
                "Mật khẩu phải có ít nhất một chữ thường."
            )
        if not re.search(r'\d', value):
            raise serializers.ValidationError(
                "Mật khẩu phải có ít nhất một chữ số."
            )
        return value

    def validate(self, attrs):
        current_password = attrs.get('current_password')
        new_password = attrs.get('new_password')
        
        # Check if new password is different from current password
        if current_password == new_password:
            raise serializers.ValidationError({
                'new_password': 'Mật khẩu mới phải khác mật khẩu hiện tại.'
            })
        
        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    avatar = serializers.ImageField(write_only=True, required=False)

    class Meta:
        model = UserProfile
        fields = ['id', 'email', 'full_name', 'phone_number', 'avatar_url', 'avatar']
        read_only_fields = ['email', 'avatar_url']


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'is_email_verified', 'created_at', 'profile']
        read_only_fields = ['id', 'email', 'is_email_verified', 'created_at']


class PaymentMethodSerializer(serializers.ModelSerializer):
    brand_display = serializers.CharField(source='get_brand_display', read_only=True)

    class Meta:
        model = PaymentMethod
        fields = [
            'id',
            'brand',
            'brand_display',
            'last4',
            'exp_month',
            'exp_year',
            'card_holder_name',
            'gateway',
            'gateway_customer_id',
            'gateway_payment_method_id',
            'fingerprint',
            'country',
            'is_default',
            'is_active',
            'created_at',
        ]
        read_only_fields = [
            'id',
            'brand_display',
            'created_at',
            'fingerprint',
            'country',
        ]
        extra_kwargs = {
            # Token/id từ gateway – chỉ ghi, không trả ra client
            'gateway_payment_method_id': {'write_only': True},
            'gateway_customer_id': {'write_only': True, 'required': False, 'allow_blank': True},
        }

    def validate_last4(self, value):
        if not value.isdigit() or len(value) != 4:
            raise serializers.ValidationError("last4 phải là 4 chữ số.")
        return value

    def validate(self, attrs):
        exp_month = attrs.get('exp_month')
        exp_year = attrs.get('exp_year')

        if exp_month < 1 or exp_month > 12:
            raise serializers.ValidationError({'exp_month': 'Tháng hết hạn không hợp lệ.'})

        current_year = timezone.now().year % 100  # YY
        if exp_year < current_year:
            raise serializers.ValidationError({'exp_year': 'Năm hết hạn đã qua.'})

        return attrs


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = [
            'id',
            'recipient',
            'postal_code',
            'prefecture',
            'city',
            'district',
            'building',
            'phone',
            'is_default',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_postal_code(self, value):
        digits = ''.join(filter(str.isdigit, value))
        if len(digits) != 7:
            raise serializers.ValidationError("郵便番号は7桁で入力してください。")
        return f"{digits[:3]}-{digits[3:]}"

    def create(self, validated_data):
        request = self.context['request']
        user = request.user
        is_default = validated_data.get('is_default', False)
        if is_default or not Address.objects.filter(user=user).exists():
            validated_data['is_default'] = True
            Address.objects.filter(user=user, is_default=True).update(is_default=False)
        return Address.objects.create(user=user, **validated_data)

    def update(self, instance, validated_data):
        is_default = validated_data.get('is_default', instance.is_default)
        if is_default and not instance.is_default:
            Address.objects.filter(user=instance.user, is_default=True).update(is_default=False)
        return super().update(instance, validated_data)
