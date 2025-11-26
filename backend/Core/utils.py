import io
import uuid
from PIL import Image
from supabase import create_client, Client
from storage3.exceptions import StorageApiError
from django.conf import settings

def upload_image_to_supabase(file_obj, bucket_name=None, folder='avatars'):
    """
    Uploads an image file to Supabase Storage, converting it to WebP.
    Returns the public URL of the uploaded file.
    """
    # 1. Initialize Supabase Client
    supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    
    if not bucket_name:
        bucket_name = getattr(settings, 'SUPABASE_AVATAR_BUCKET', 'oldshop')
    
    # 2. Process Image (Convert to WebP)
    try:
        # Open image using Pillow
        image = Image.open(file_obj)
        
        # Convert to RGB mode if necessary
        if image.mode in ('RGBA', 'P'):
             image = image.convert('RGB')
        
        output = io.BytesIO()
        image.save(output, format='WEBP', quality=80)
        file_content = output.getvalue()
    except Exception as e:
        raise ValueError(f"Invalid image file: {e}")

    # 3. Generate Filename
    # Use UUID to ensure uniqueness
    filename = f"{folder}/{uuid.uuid4()}.webp"

    # 4. Ensure bucket exists (create automatically if missing)
    # Skip creating bucket if we know it exists (e.g., 'oldshop') to avoid 403 errors
    # or handle 403 gracefully if list/get fails
    # For now, assume bucket 'oldshop' exists as configured
    
    # 5. Upload to Supabase
    try:
        response = supabase.storage.from_(bucket_name).upload(
            path=filename,
            file=file_content,
            file_options={"content-type": "image/webp", "upsert": "false"}
        )
        
        # Get public URL
        public_url = supabase.storage.from_(bucket_name).get_public_url(filename)
        return public_url
        
    except StorageApiError as exc:
        raise Exception(f"Supabase Upload Error: {exc.message}") from exc
    except Exception as e:
        # Detailed error logging could go here
        raise Exception(f"Supabase Upload Error: {str(e)}")

# Alias for backward compatibility
upload_avatar_to_supabase = upload_image_to_supabase

