"""
Utilities for AI Pricing service
- Image optimization
- Gemini API integration
- Caching
"""
import os
import hashlib
import base64
import requests
from io import BytesIO
from PIL import Image
from django.conf import settings
from django.core.cache import cache
from django.core.files.uploadedfile import InMemoryUploadedFile
import google.generativeai as genai
import json
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class ImageOptimizer:
    """Optimize images before sending to Gemini API"""
    
    MAX_SIZE = (1024, 1024)
    JPEG_QUALITY = 80
    
    @staticmethod
    def optimize_image(image_file):
        """
        Optimize image: resize and compress
        Returns: BytesIO object with optimized image
        """
        try:
            # Open image
            img = Image.open(image_file)
            
            # Convert to RGB if necessary (for PNG with transparency)
            if img.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Resize if too large
            if img.size[0] > ImageOptimizer.MAX_SIZE[0] or img.size[1] > ImageOptimizer.MAX_SIZE[1]:
                img.thumbnail(ImageOptimizer.MAX_SIZE, Image.LANCZOS)
            
            # Save to BytesIO
            output = BytesIO()
            img.save(output, format='JPEG', quality=ImageOptimizer.JPEG_QUALITY, optimize=True)
            output.seek(0)
            
            return output
        except Exception as e:
            logger.error(f"Error optimizing image: {str(e)}")
            raise
    
    @staticmethod
    def image_to_base64(image_file):
        """Convert image to base64 string"""
        optimized = ImageOptimizer.optimize_image(image_file)
        return base64.b64encode(optimized.read()).decode('utf-8')
    
    @staticmethod
    def image_url_to_base64(image_url):
        """Download image from URL and convert to base64"""
        try:
            response = requests.get(image_url, timeout=10)
            response.raise_for_status()
            image_file = BytesIO(response.content)
            return ImageOptimizer.image_to_base64(image_file)
        except Exception as e:
            logger.error(f"Error downloading image from URL: {str(e)}")
            raise
    
    @staticmethod
    def generate_image_hash(image_data):
        """Generate hash for image caching"""
        if isinstance(image_data, str):
            # If it's a URL, download first
            try:
                response = requests.get(image_data, timeout=10)
                image_data = BytesIO(response.content)
            except:
                # If download fails, hash the URL
                return hashlib.sha256(image_data.encode()).hexdigest()
        
        if hasattr(image_data, 'read'):
            image_data.seek(0)
            data = image_data.read()
        else:
            data = image_data
        
        return hashlib.sha256(data).hexdigest()


class GeminiService:
    """Service to interact with Gemini API"""
    
    def __init__(self):
        api_key = getattr(settings, 'GEMINI_API_KEY', '')
        if not api_key:
            raise ValueError("GEMINI_API_KEY not set in settings")
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.5-flash')
    
    def validate_image(self, image_base64, title, category, brand, description):
        """
        Validate if image matches the product description
        Returns: dict with 'is_valid' and 'reason'
        """
        prompt = f"""あなたは製品認証の専門家です。あなたの任務は、画像が製品の説明と一致するかどうかを確認することです。

製品情報:
- 商品名: {title}
- カテゴリ: {category}
- ブランド: {brand if brand else '不明'}
- 説明: {description}

画像を分析して回答してください:
1. 画像は実際の製品ですか？（ストック写真、ネット画像、ウォーターマークではない）
2. 画像はカテゴリ「{category}」と一致しますか？
3. 画像は説明と一致しますか？

JSON形式で回答してください:
{{
    "is_valid": true/false,
    "reason": "詳細な理由",
    "matches_category": true/false,
    "matches_description": true/false,
    "is_real_product": true/false
}}

JSONのみを返してください。追加のテキストは不要です。"""
        
        try:
            # Convert base64 to image
            image_data = base64.b64decode(image_base64)
            image = Image.open(BytesIO(image_data))
            
            response = self.model.generate_content([prompt, image])
            result_text = response.text.strip()
            
            # Extract JSON from response
            if result_text.startswith('```json'):
                result_text = result_text[7:]
            if result_text.startswith('```'):
                result_text = result_text[3:]
            if result_text.endswith('```'):
                result_text = result_text[:-3]
            result_text = result_text.strip()
            
            result = json.loads(result_text)
            return result
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing Gemini response: {str(e)}")
            logger.error(f"Response text: {result_text}")
            return {
                "is_valid": False,
                "reason": "AIからの応答の解析エラー",
                "error": str(e)
            }
        except Exception as e:
            error_str = str(e)
            logger.error(f"Error calling Gemini API: {error_str}")
            
            # Check for quota errors
            if "quota" in error_str.lower() or "429" in error_str or "exceeded" in error_str.lower():
                return {
                    "is_valid": False,
                    "reason": "無料APIクォータが上限に達しました。後でもう一度お試しいただくか、APIキーの設定を確認してください。",
                    "error": "QUOTA_EXCEEDED",
                    "error_type": "quota"
                }
            
            return {
                "is_valid": False,
                "reason": f"API呼び出しエラー: {error_str[:200]}",
                "error": error_str
            }
    
    def price_product(self, title, category, brand, description, original_price, condition, image_base64=None):
        """
        Price a product using AI
        Returns: dict with pricing information
        """
        condition_map = {
            'new': '新品',
            'like_new': '新品同様',
            'good': '良好',
            'fair': '可',
            'poor': '悪い',
        }
        
        condition_jp = condition_map.get(condition, condition)
        
        # Get current date and time (Japan timezone)
        now = datetime.now()
        current_date = now.strftime("%Y年%m月%d日")
        current_month_year = now.strftime("%Y年%m月")
        current_datetime = now.strftime("%Y年%m月%d日 %H:%M:%S")
        
        prompt = f"""あなたは15年の経験を持つ中古品価格設定の専門家です。あなたの任務は、買い手に有利でありながら、売り手も販売できる公正な価格を設定することです。

製品情報:
- 商品名: {title}
- カテゴリ: {category}
- ブランド: {brand if brand else '不明'}
- 説明: {description}
- 新品時の価格: {original_price:,.0f} 円
- 状態: {condition_jp}

現在の日時: {current_datetime} ({current_month_year})

以下の基準に基づいて分析し、価格を提案してください:
1. 現在の状態での製品の実際の価値
2. 処理、配送、保証のコスト（該当する場合）
3. 中古品購入時のリスク
4. {current_month_year}時点での類似製品の現在の日本市場
5. 買い手が受け入れられる合理的な価格レベル
6. 現在の時点での価格トレンドと市場需要
7. 日本のリサイクル市場やメルカリ、ヤフオクなどの価格相場を参考にする

JSON形式で回答してください:
{{
    "suggested_price": 金額（円）,
    "price_min": 最低価格（円）,
    "price_max": 最高価格（円）,
    "confidence_score": 0.0-1.0,
    "reasoning": [
        "理由1",
        "理由2",
        "理由3"
    ],
    "factors": {{
        "depreciation": "減価の程度",
        "market_demand": "市場需要",
        "processing_cost": "処理コスト",
        "risk_factor": "リスク要因"
    }}
}}

JSONのみを返してください。追加のテキストは不要です。"""
        
        try:
            content = [prompt]
            
            # Add image if provided
            if image_base64:
                try:
                    image_data = base64.b64decode(image_base64)
                    image = Image.open(BytesIO(image_data))
                    content.append(image)
                except Exception as e:
                    logger.warning(f"Could not add image to pricing request: {str(e)}")
            
            response = self.model.generate_content(content)
            result_text = response.text.strip()
            
            # Extract JSON from response
            if result_text.startswith('```json'):
                result_text = result_text[7:]
            if result_text.startswith('```'):
                result_text = result_text[3:]
            if result_text.endswith('```'):
                result_text = result_text[:-3]
            result_text = result_text.strip()
            
            result = json.loads(result_text)
            
            # Format reasoning as text
            if isinstance(result.get('reasoning'), list):
                result['reasoning_text'] = '\n'.join([f"• {r}" for r in result['reasoning']])
            else:
                result['reasoning_text'] = str(result.get('reasoning', ''))
            
            return result
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing Gemini pricing response: {str(e)}")
            logger.error(f"Response text: {result_text}")
            raise ValueError(f"Lỗi phân tích phản hồi từ AI: {str(e)}")
        except Exception as e:
            error_str = str(e)
            logger.error(f"Error calling Gemini API for pricing: {error_str}")
            
            # Check for quota errors
            if "quota" in error_str.lower() or "429" in error_str or "exceeded" in error_str.lower():
                raise ValueError("無料APIクォータが上限に達しました。後でもう一度お試しいただくか、APIキーの設定を確認してください。")
            
            raise ValueError(f"価格設定API呼び出しエラー: {error_str[:200]}")


class PricingCacheService:
    """Service for caching pricing results"""
    
    CACHE_TIMEOUT = 60 * 60 * 24 * 7  # 7 days
    
    @staticmethod
    def get_cache_key(category, brand, condition, description):
        """Generate cache key"""
        cache_string = f"{category}|{brand}|{condition}|{description[:200]}"
        return hashlib.md5(cache_string.encode()).hexdigest()
    
    @staticmethod
    def get_cached_pricing(cache_key):
        """Get cached pricing result"""
        from .models import PricingCache
        
        try:
            cached = PricingCache.objects.get(cache_key=cache_key)
            cached.hit_count += 1
            cached.save(update_fields=['hit_count', 'last_used_at'])
            
            return {
                'suggested_price': float(cached.suggested_price),
                'price_min': float(cached.price_min),
                'price_max': float(cached.price_max),
                'reasoning_text': cached.pricing_reasoning,
                'from_cache': True,
            }
        except PricingCache.DoesNotExist:
            return None
    
    @staticmethod
    def save_pricing_cache(cache_key, category, brand, condition, pricing_result):
        """Save pricing result to cache"""
        from .models import PricingCache
        
        try:
            PricingCache.objects.update_or_create(
                cache_key=cache_key,
                defaults={
                    'category': category,
                    'brand': brand or '',
                    'condition': condition,
                    'suggested_price': pricing_result['suggested_price'],
                    'price_min': pricing_result.get('price_min', pricing_result['suggested_price'] * 0.8),
                    'price_max': pricing_result.get('price_max', pricing_result['suggested_price'] * 1.2),
                    'pricing_reasoning': pricing_result.get('reasoning_text', ''),
                }
            )
        except Exception as e:
            logger.error(f"Error saving pricing cache: {str(e)}")

