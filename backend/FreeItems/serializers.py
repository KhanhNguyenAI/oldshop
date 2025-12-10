from rest_framework import serializers
from .models import FreeItem, FreeItemImage, FreeItemMessage
from Users.serializers import UserSerializer
from Core.utils import upload_image_to_supabase


class FreeItemImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = FreeItemImage
        fields = ['id', 'image_url', 'order']
        read_only_fields = ['id']


class FreeItemSerializer(serializers.ModelSerializer):
    images = FreeItemImageSerializer(many=True, read_only=True)
    user = UserSerializer(read_only=True)
    message_count = serializers.SerializerMethodField()
    
    class Meta:
        model = FreeItem
        fields = [
            'id', 'user', 'title', 'description', 'condition', 'category',
            'location_prefecture', 'location_city', 'location_detail',
            'pickup_method', 'status', 'show_email', 'views_count', 'images', 'message_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'views_count', 'created_at', 'updated_at']
    
    def get_message_count(self, obj):
        """Số lượng message cho item này"""
        return obj.messages.count()


class FreeItemCreateSerializer(serializers.ModelSerializer):
    images = serializers.ListField(
        child=serializers.ImageField(),
        write_only=True,
        required=False,
        allow_empty=True
    )
    
    class Meta:
        model = FreeItem
        fields = [
            'title', 'description', 'condition', 'category',
            'location_prefecture', 'location_city', 'location_detail',
            'pickup_method', 'show_email', 'images'
        ]
    
    def validate_title(self, value):
        if len(value.strip()) < 3:
            raise serializers.ValidationError("タイトルは3文字以上で入力してください。")
        return value.strip()
    
    def validate_description(self, value):
        if len(value.strip()) < 20:
            raise serializers.ValidationError("説明は20文字以上で入力してください。")
        return value.strip()
    
    def validate_images(self, value):
        if len(value) > 4:
            raise serializers.ValidationError("画像は最大4枚までアップロードできます。")
        return value
    
    def create(self, validated_data):
        images_data = validated_data.pop('images', [])
        user = self.context['request'].user
        
        # Remove user from validated_data if it exists (shouldn't, but to be safe)
        validated_data.pop('user', None)
        
        # Tạo FreeItem
        free_item = FreeItem.objects.create(user=user, **validated_data)
        
        # Upload và tạo images
        for index, image_file in enumerate(images_data):
            try:
                image_url = upload_image_to_supabase(
                    image_file,
                    bucket_name='oldshop',
                    folder='free-items',
                    max_width=1920,
                    max_height=1920,
                    quality=85
                )
                FreeItemImage.objects.create(
                    free_item=free_item,
                    image_url=image_url,
                    order=index
                )
            except Exception as e:
                # Log error nhưng không fail toàn bộ request
                print(f"Error uploading image {index}: {e}")
        
        return free_item


class FreeItemUpdateSerializer(serializers.ModelSerializer):
    images = serializers.ListField(
        child=serializers.ImageField(),
        write_only=True,
        required=False,
        allow_empty=True
    )
    delete_image_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False,
        allow_empty=True
    )
    
    class Meta:
        model = FreeItem
        fields = [
            'title', 'description', 'condition', 'category',
            'location_prefecture', 'location_city', 'location_detail',
            'pickup_method', 'status', 'show_email', 'images', 'delete_image_ids'
        ]
    
    def validate_title(self, value):
        if value and len(value.strip()) < 3:
            raise serializers.ValidationError("タイトルは3文字以上で入力してください。")
        return value.strip() if value else value
    
    def validate_description(self, value):
        if value and len(value.strip()) < 20:
            raise serializers.ValidationError("説明は20文字以上で入力してください。")
        return value.strip() if value else value
    
    def validate_images(self, value):
        if value and len(value) > 4:
            raise serializers.ValidationError("画像は最大4枚までアップロードできます。")
        return value
    
    def update(self, instance, validated_data):
        images_data = validated_data.pop('images', [])
        delete_image_ids = validated_data.pop('delete_image_ids', [])
        
        # Xóa images được chỉ định
        if delete_image_ids:
            FreeItemImage.objects.filter(
                id__in=delete_image_ids,
                free_item=instance
            ).delete()
        
        # Thêm images mới
        existing_images_count = instance.images.count()
        for index, image_file in enumerate(images_data):
            if existing_images_count + index >= 4:
                break
            try:
                image_url = upload_image_to_supabase(
                    image_file,
                    bucket_name='oldshop',
                    folder='free-items',
                    max_width=1920,
                    max_height=1920,
                    quality=85
                )
                FreeItemImage.objects.create(
                    free_item=instance,
                    image_url=image_url,
                    order=existing_images_count + index
                )
            except Exception as e:
                print(f"Error uploading image {index}: {e}")
        
        # Update các fields khác
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        return instance


class FreeItemMessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    receiver = UserSerializer(read_only=True)
    
    class Meta:
        model = FreeItemMessage
        fields = ['id', 'free_item', 'sender', 'receiver', 'message', 'is_read', 'created_at']
        read_only_fields = ['id', 'sender', 'receiver', 'is_read', 'created_at']
    
    def validate_message(self, value):
        if len(value.strip()) < 1:
            raise serializers.ValidationError("メッセージを入力してください。")
        return value.strip()
    
    def create(self, validated_data):
        free_item = validated_data['free_item']
        sender = self.context['request'].user
        is_owner = sender == free_item.user
        
        # Kiểm tra đã có conversation chưa
        existing_messages = free_item.messages.all()
        has_conversation = existing_messages.exists()
        
        # Xác định receiver
        if has_conversation:
            # Đã có conversation: receiver là người đối thoại (người không phải sender)
            # Tìm message gần nhất từ người khác
            if is_owner:
                # Owner reply: tìm người đã gửi message đầu tiên (không phải owner)
                other_user_message = existing_messages.exclude(sender=free_item.user).order_by('created_at').first()
                if other_user_message:
                    receiver = other_user_message.sender
                else:
                    raise serializers.ValidationError("返信するメッセージがありません。")
            else:
                # Người không phải owner reply: receiver là owner
                receiver = free_item.user
        else:
            # Chưa có conversation: chỉ cho phép người không phải owner gửi message đầu tiên
            if is_owner:
                raise serializers.ValidationError("自分のアイテムにはメッセージを送れません。")
            receiver = free_item.user
        
        # Chỉ cho phép message khi item còn available hoặc reserved
        if free_item.status not in ['available', 'reserved']:
            raise serializers.ValidationError("このアイテムは既に終了しています。")
        
        message = FreeItemMessage.objects.create(
            free_item=free_item,
            sender=sender,
            receiver=receiver,
            message=validated_data['message']
        )
        
        # Nếu item đang available, tự động chuyển sang reserved khi có message đầu tiên từ người không phải owner
        if free_item.status == 'available' and not is_owner and not has_conversation:
            free_item.status = 'reserved'
            free_item.save()
        
        return message


class FreeItemMessageCreateSerializer(serializers.Serializer):
    message = serializers.CharField()
    free_item_id = serializers.UUIDField()
    
    def validate_message(self, value):
        if len(value.strip()) < 1:
            raise serializers.ValidationError("メッセージを入力してください。")
        return value.strip()

