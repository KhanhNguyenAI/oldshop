from rest_framework import serializers
from .models import Booking, BookingImage
from Core.utils import upload_image_to_supabase
from django.core.mail import send_mail
from django.conf import settings
from decimal import Decimal

class BookingImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingImage
        fields = ['id', 'image_url', 'uploaded_at']


def send_booking_confirmation_email(booking):
    """
    Send confirmation email to user with all booking details
    """
    # Room size labels
    room_size_labels = {
        '1R': '1R',
        '1K': '1K',
        '1DK': '1DK',
        '1LDK': '1LDK',
        '2DK': '2DK',
        '2LDK': '2LDK',
        '3LDK': '3LDK',
        'house': '戸建て (House)'
    }
    
    # Trash level labels
    trash_level_labels = {
        'low': '少なめ / 整理済み',
        'medium': '普通 / 散らかっている',
        'high': 'ゴミ屋敷 / 大量'
    }
    
    # Truck type labels
    truck_type_labels = {
        'light': '軽トラック',
        '1t': '1t トラック',
        '2t': '2t トラック',
        '2t_full': '2t トラック (満載)',
        '2_trucks': '2t トラック × 2台'
    }
    
    # Format date
    booking_date_str = booking.booking_date.strftime('%Y年%m月%d日')
    
    # Format price
    total_price = float(booking.total_price)
    price_str = f"{total_price:,.0f} 円"
    
    # Build email message
    subject = f'【OldShop】予約確認 - 予約番号 #{booking.id}'
    
    message = f'''
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  OldShop - 不用品回収・お片付けサービス
  予約確認メール
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{booking.customer_name} 様

この度は、OldShopの不用品回収・お片付けサービスをご利用いただき、
誠にありがとうございます。

以下の内容で予約を承りました。

【予約情報】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
予約番号: #{booking.id}
予約日時: {booking_date_str} {booking.time_slot}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【お部屋・サービス詳細】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
お部屋の広さ: {room_size_labels.get(booking.room_size, booking.room_size)}
ゴミの量: {trash_level_labels.get(booking.trash_level, booking.trash_level)}
トラックサイズ: {truck_type_labels.get(booking.truck_type, booking.truck_type)}
エレベーター: {'あり' if booking.has_elevator else 'なし'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【お客様情報】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
お名前: {booking.customer_name}
電話番号: {booking.customer_phone}
メールアドレス: {booking.customer_email}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【お届け先住所】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{booking.address}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【見積もり金額】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
概算合計: {price_str}
※現地調査により変動する場合があります
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
'''
    
    if booking.notes:
        message += f'''
【その他・ご要望】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{booking.notes}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
'''
    
    message += f'''
【次のステップ】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. 予約内容を確認いただき、問題がなければそのままお待ちください。
2. 担当者より、予約日の前日までにご連絡させていただきます。
3. 当日は指定の時間帯にご指定の住所へお伺いいたします。

【予約の確認・変更について】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
予約の確認や変更をご希望の場合は、以下の方法でお問い合わせください。

・お問い合わせページ: http://localhost:5173/ReHomeMarket/contact
・電話番号: 080-xxxx-xxxx

【重要事項】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
・予約日の変更やキャンセルは、予約日の3日前までにご連絡ください。
・当日のキャンセルはキャンセル料が発生する場合があります。
・現地調査により、見積もり金額が変動する場合があります。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
このメールは自動送信されています。
ご不明な点がございましたら、お気軽にお問い合わせください。

OldShop チーム
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
'''
    
    try:
        send_mail(
            subject,
            message,
            'noreply@oldshop.com',  # From email
            [booking.customer_email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Error sending booking confirmation email: {e}")
        return False

class BookingSerializer(serializers.ModelSerializer):
    images = BookingImageSerializer(many=True, read_only=True)
    image_files = serializers.ListField(
        child=serializers.ImageField(max_length=1000000, allow_empty_file=False, use_url=False),
        write_only=True,
        required=False
    )

    class Meta:
        model = Booking
        fields = [
            'id', 'user', 'room_size', 'trash_level', 'truck_type',
            'booking_date', 'time_slot', 'address', 'has_elevator',
            'customer_name', 'customer_phone', 'customer_email', 'notes',
            'total_price', 'status', 'created_at', 'images', 'image_files'
        ]
        read_only_fields = ['user', 'status', 'created_at']

    def create(self, validated_data):
        image_files = validated_data.pop('image_files', [])
        # Remove 'user' from validated_data if it exists to avoid duplicate argument
        validated_data.pop('user', None)
        user = self.context['request'].user
        booking = Booking.objects.create(user=user, **validated_data)
        
        # Process and upload images
        for image_file in image_files:
            try:
                # Upload to Supabase (will compress to WebP automatically)
                # Use existing avatar bucket with booking-images folder
                bucket_name = getattr(settings, 'SUPABASE_AVATAR_BUCKET', 'oldshop')
                public_url = upload_image_to_supabase(image_file, bucket_name=bucket_name, folder=f'booking-images/user_{user.id}')
                
                # Create BookingImage with URL
                BookingImage.objects.create(booking=booking, image_url=public_url)
            except Exception as e:
                # Log error but continue with other images
                print(f"Error processing image: {str(e)}")
                # Optionally, you might want to skip this image or raise an error
                continue
        
        # Send confirmation email to user
        try:
            send_booking_confirmation_email(booking)
            print(f"Booking confirmation email sent to {booking.customer_email}")
        except Exception as e:
            # Log error but don't fail the booking creation
            print(f"Error sending booking confirmation email: {str(e)}")
            
        return booking
