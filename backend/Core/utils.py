import io
import uuid
import subprocess
import tempfile
import os
from PIL import Image
from supabase import create_client, Client
from storage3.exceptions import StorageApiError
from django.conf import settings

def upload_image_to_supabase(file_obj, bucket_name=None, folder='avatars', max_width=1920, max_height=1920, quality=80):
    """
    Uploads an image file to Supabase Storage, converting it to WebP.
    Resizes images if they exceed max_width or max_height.
    Returns the public URL of the uploaded file.
    """
    # 1. Initialize Supabase Client
    supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    
    if not bucket_name:
        bucket_name = getattr(settings, 'SUPABASE_AVATAR_BUCKET', 'oldshop')
    
    # 2. Process Image (Convert to WebP and resize if needed)
    try:
        # Open image using Pillow
        image = Image.open(file_obj)
        original_format = image.format
        
        # Convert to RGB mode if necessary (WebP supports RGBA but converting RGBA to RGB for better compatibility)
        if image.mode in ('RGBA', 'LA'):
            background = Image.new('RGB', image.size, (255, 255, 255))
            background.paste(image, mask=image.split()[-1] if image.mode in ('RGBA', 'LA') else None)
            image = background
        elif image.mode == 'P':
            image = image.convert('RGBA')
            background = Image.new('RGB', image.size, (255, 255, 255))
            background.paste(image, mask=image.split()[-1])
            image = background
        elif image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Resize if image is too large
        width, height = image.size
        if width > max_width or height > max_height:
            ratio = min(max_width / width, max_height / height)
            new_size = (int(width * ratio), int(height * ratio))
            image = image.resize(new_size, Image.Resampling.LANCZOS)
        
        # Save to BytesIO as WebP
        output = io.BytesIO()
        image.save(output, format='WEBP', quality=quality, method=6)
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

def upload_video_to_supabase(file_obj, bucket_name=None, folder='review', max_size_mb=50):
    """
    Uploads a video file to Supabase Storage, compressing it to H.265/HEVC format.
    Only processes when user submits (not on file select).
    Returns the public URL of the uploaded file.
    
    Args:
        file_obj: Video file object
        bucket_name: Supabase bucket name (default: 'oldshop')
        folder: Folder path in bucket
        max_size_mb: Maximum file size in MB (default: 50MB)
    
    Returns:
        str: Public URL of uploaded video
    """
    # 1. Initialize Supabase Client
    supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    
    if not bucket_name:
        bucket_name = getattr(settings, 'SUPABASE_AVATAR_BUCKET', 'oldshop')
    
    # 2. Check file size (50MB limit)
    # Reset file pointer to beginning
    if hasattr(file_obj, 'seek'):
        file_obj.seek(0, os.SEEK_END)
        file_size = file_obj.tell()
        file_obj.seek(0)
    else:
        # For Django InMemoryUploadedFile, use size attribute
        file_size = getattr(file_obj, 'size', 0)
        if file_size == 0:
            # Try reading to get size
            content = file_obj.read()
            file_size = len(content)
            # Reset if possible
            if hasattr(file_obj, 'seek'):
                file_obj.seek(0)
            else:
                # Create new file-like object from content
                file_obj = io.BytesIO(content)
    
    file_size_mb = file_size / (1024 * 1024)
    
    if file_size_mb > max_size_mb:
        raise ValueError(f"Video file size ({file_size_mb:.2f}MB) exceeds maximum allowed size ({max_size_mb}MB)")
    
    # 3. Create temporary files for input and output
    temp_input = None
    temp_output = None
    
    try:
        # Save uploaded file to temporary location
        temp_input = tempfile.NamedTemporaryFile(delete=False, suffix='.mp4')
        # Read file content
        if hasattr(file_obj, 'read'):
            file_content = file_obj.read()
        else:
            file_content = file_obj
        temp_input.write(file_content)
        temp_input.close()
        
        # Create output temporary file
        temp_output = tempfile.NamedTemporaryFile(delete=False, suffix='.mp4')
        temp_output.close()
        
        # 4. Compress video to H.265/HEVC using ffmpeg
        # Check if ffmpeg is available
        ffmpeg_available = False
        try:
            subprocess.run(['ffmpeg', '-version'], capture_output=True, check=True, timeout=5)
            ffmpeg_available = True
        except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
            # ffmpeg not available, will upload original video
            import warnings
            warnings.warn("ffmpeg is not installed. Uploading original video without compression.")
            ffmpeg_available = False
        
        if ffmpeg_available:
            # Compress video with H.265/HEVC codec
            # -c:v libx265: Use H.265/HEVC codec
            # -crf 28: Quality setting (lower = better quality, higher = smaller file, 28 is a good balance)
            # -preset medium: Encoding speed vs compression ratio
            # -c:a copy: Copy audio without re-encoding (faster)
            # -movflags +faststart: Optimize for web streaming
            ffmpeg_cmd = [
                'ffmpeg',
                '-i', temp_input.name,
                '-c:v', 'libx265',  # H.265/HEVC codec
                '-crf', '28',  # Quality (18-28 is good range, 28 is smaller file)
                '-preset', 'medium',  # Encoding speed
                '-c:a', 'copy',  # Copy audio
                '-movflags', '+faststart',  # Web optimization
                '-y',  # Overwrite output file
                temp_output.name
            ]
            
            result = subprocess.run(
                ffmpeg_cmd,
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout
            )
            
            if result.returncode != 0:
                # Compression failed, use original video
                import warnings
                warnings.warn(f"Video compression failed: {result.stderr}. Uploading original video.")
                ffmpeg_available = False
        
        # 5. Read video (compressed or original)
        if ffmpeg_available and os.path.exists(temp_output.name):
            # Use compressed video
            with open(temp_output.name, 'rb') as f:
                video_content = f.read()
        else:
            # Use original video
            with open(temp_input.name, 'rb') as f:
                video_content = f.read()
        
        # 6. Generate filename
        filename = f"{folder}/{uuid.uuid4()}.mp4"
        
        # 7. Upload to Supabase
        try:
            response = supabase.storage.from_(bucket_name).upload(
                path=filename,
                file=video_content,
                file_options={"content-type": "video/mp4", "upsert": "false"}
            )
            
            # Get public URL
            public_url = supabase.storage.from_(bucket_name).get_public_url(filename)
            return public_url
            
        except StorageApiError as exc:
            raise Exception(f"Supabase Upload Error: {exc.message}") from exc
        except Exception as e:
            raise Exception(f"Supabase Upload Error: {str(e)}") from e
            
    finally:
        # Clean up temporary files
        if temp_input and os.path.exists(temp_input.name):
            os.unlink(temp_input.name)
        if temp_output and os.path.exists(temp_output.name):
            os.unlink(temp_output.name)

