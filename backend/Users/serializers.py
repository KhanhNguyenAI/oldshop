from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.validators import EmailValidator
from django.utils import timezone
from datetime import timedelta
from django.conf import settings
from .models import User, OTP, RefreshToken
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


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'is_email_verified', 'created_at']
        read_only_fields = ['id', 'email', 'is_email_verified', 'created_at']

