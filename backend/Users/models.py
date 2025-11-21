from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.core.validators import EmailValidator
from django.utils import timezone
import secrets
import hashlib


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('is_email_verified', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser):
    email = models.EmailField(
        unique=True,
        validators=[EmailValidator()],
        db_index=True
    )
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    is_email_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return self.email

    def has_perm(self, perm, obj=None):
        return self.is_superuser

    def has_module_perms(self, app_label):
        return self.is_superuser


class RefreshToken(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='refresh_tokens'
    )
    token = models.CharField(max_length=255, unique=True, db_index=True)
    expires_at = models.DateTimeField()
    is_revoked = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'refresh_tokens'
        verbose_name = 'Refresh Token'
        verbose_name_plural = 'Refresh Tokens'
        indexes = [
            models.Index(fields=['token', 'is_revoked']),
            models.Index(fields=['user', 'is_revoked']),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.token[:20]}..."

    def is_valid(self):
        return not self.is_revoked and self.expires_at > timezone.now()


class OTP(models.Model):
    email = models.EmailField(db_index=True)
    otp_code_hash = models.CharField(max_length=64)  # SHA256 hash
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'otps'
        verbose_name = 'OTP'
        verbose_name_plural = 'OTPs'
        indexes = [
            models.Index(fields=['email', 'is_used']),
            models.Index(fields=['expires_at']),
        ]

    def __str__(self):
        return f"{self.email} - {self.created_at}"

    @staticmethod
    def generate_otp(length=6):
        """Generate random OTP code"""
        return ''.join([str(secrets.randbelow(10)) for _ in range(length)])

    @staticmethod
    def hash_otp(otp_code):
        """Hash OTP code for storage"""
        return hashlib.sha256(otp_code.encode()).hexdigest()

    def verify_otp(self, otp_code):
        """Verify OTP code"""
        if self.is_used:
            return False
        if self.expires_at < timezone.now():
            return False
        return self.otp_code_hash == self.hash_otp(otp_code)

    def mark_as_used(self):
        """Mark OTP as used"""
        self.is_used = True
        self.save()
