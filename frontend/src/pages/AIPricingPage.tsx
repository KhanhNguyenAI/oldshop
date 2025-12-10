import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { pricingService } from '../services/pricingService';
import type { CreatePricingRequest, PricingRequest, Condition } from '../types/pricing';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import api from '../services/api';

const CATEGORIES = [
  'スマートフォン', 'ノートパソコン', 'タブレット', '時計', 'ヘッドフォン',
  'テレビ', '冷蔵庫', '洗濯機', 'エアコン', '扇風機',
  '机・椅子', 'ソファ', '棚', 'ベッド', 'マットレス',
  '衣類', '靴', 'バッグ', 'アクセサリー',
  '本', 'おもちゃ', 'スポーツ用品', 'その他'
];

const CONDITION_LABELS: Record<Condition, string> = {
  new: '新品',
  like_new: '新品同様',
  good: '良好',
  fair: '可',
  poor: '悪い',
};

export const AIPricingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pricingResult, setPricingResult] = useState<PricingRequest | null>(null);
  const [dailyLimit, setDailyLimit] = useState<{
    limit: number;
    count_today: number;
    remaining: number;
    is_allowed: boolean;
    reset_time: string;
  } | null>(null);
  
  const [formData, setFormData] = useState<CreatePricingRequest>({
    title: '',
    category: '',
    brand: '',
    description: '',
    original_price: 0,
    condition: 'good',
    image_urls: [],
  });
  
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: '/ai-pricing' } });
    }
  }, [user, navigate]);

  // Fetch daily limit info
  useEffect(() => {
    if (user) {
      pricingService.getDailyLimitInfo()
        .then(setDailyLimit)
        .catch(err => console.error('Failed to fetch daily limit:', err));
    }
  }, [user]);

  const handleInputChange = (field: keyof CreatePricingRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    if (imageFiles.length + files.length > 5) {
      toast.error('画像は最大5枚までです');
      return;
    }
    
    const newFiles = [...imageFiles, ...files];
    setImageFiles(newFiles);
    
    // Create previews
    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    setImagePreviews(newPreviews);
  };

  const removeImage = (index: number) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    
    // Revoke object URL
    URL.revokeObjectURL(imagePreviews[index]);
    
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  const uploadImages = async (): Promise<string[]> => {
    if (imageFiles.length === 0) {
      throw new Error('Vui lòng chọn ít nhất 1 hình ảnh');
    }

    setIsUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of imageFiles) {
        const formData = new FormData();
        formData.append('image', file);
        
        const response = await api.post('/ai/upload-image/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        uploadedUrls.push(response.data.url);
      }
      
      return uploadedUrls;
    } catch (error: any) {
      const message = error?.response?.data?.error || '画像のアップロードエラー';
      throw new Error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim()) {
      toast.error('商品名を入力してください');
      return;
    }
    if (formData.title.trim().length < 3) {
      toast.error('商品名は3文字以上である必要があります');
      return;
    }
    if (!formData.category) {
      toast.error('カテゴリを選択してください');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('商品説明を入力してください');
      return;
    }
    if (formData.original_price <= 0) {
      toast.error('新品時の価格を正しく入力してください');
      return;
    }
    if (imageFiles.length === 0) {
      toast.error('画像を少なくとも1枚選択してください');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Upload images first
      const imageUrls = await uploadImages();
      
      // Create pricing request
      const requestData: CreatePricingRequest = {
        ...formData,
        image_urls: imageUrls,
      };
      
      const result = await pricingService.createPricingRequest(requestData);
      setPricingResult(result);
      
      // Refresh daily limit info
      pricingService.getDailyLimitInfo()
        .then(setDailyLimit)
        .catch(err => console.error('Failed to refresh daily limit:', err));
      
      toast.success('価格設定を処理中...');
      
      // Poll for result (since processing is synchronous for now)
      const pollResult = async () => {
        let attempts = 0;
        const maxAttempts = 30; // 30 seconds max
        
        const interval = setInterval(async () => {
          attempts++;
          try {
            const updated = await pricingService.getPricingRequest(result.id);
            setPricingResult(updated);
            
            if (updated.status === 'priced' || updated.status === 'rejected' || updated.status === 'error') {
              clearInterval(interval);
              if (updated.status === 'priced') {
                toast.success('価格設定が完了しました！');
              } else if (updated.status === 'rejected') {
                toast.error(updated.error_message || '画像が無効です');
              } else {
                toast.error(updated.error_message || '価格設定エラー');
              }
            }
          } catch (error) {
            console.error('Error polling result:', error);
          }
          
          if (attempts >= maxAttempts) {
            clearInterval(interval);
            toast.error('価格設定処理がタイムアウトしました');
          }
        }, 1000);
      };
      
      pollResult();
      
    } catch (error: any) {
      console.error('Failed to create pricing request:', error);
      
      // Handle rate limit error (429)
      if (error?.response?.status === 429) {
        const errorData = error.response.data;
        toast.error(errorData.error || '1日の価格設定リクエストの上限に達しました');
        // Refresh daily limit info
        pricingService.getDailyLimitInfo()
          .then(setDailyLimit)
          .catch(err => console.error('Failed to refresh daily limit:', err));
      } else {
        const message = error?.message || error?.response?.data?.error || '価格設定リクエストの作成エラー';
        toast.error(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-stone-900 mb-2">
                  🤖 AIによる商品価格設定
                </h1>
                <p className="text-stone-600">
                  商品情報を入力すると、AIが公正な価格を提案します
                </p>
              </div>
              {dailyLimit && (
                <div className={`px-4 py-2 rounded-lg border ${
                  dailyLimit.remaining === 0 
                    ? 'bg-red-50 border-red-200 text-red-700' 
                    : dailyLimit.remaining <= 1
                    ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                    : 'bg-green-50 border-green-200 text-green-700'
                }`}>
                  <div className="text-sm font-bold">
                    {dailyLimit.remaining === 0 ? '⚠️ 上限到達' : `📊 残り: ${dailyLimit.remaining}回`}
                  </div>
                  <div className="text-xs mt-1">
                    今日: {dailyLimit.count_today}/{dailyLimit.limit}回
                  </div>
                </div>
              )}
            </div>
          </div>

          {!pricingResult ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  商品名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="例: iPhone 13 Pro Max 256GB"
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                  maxLength={255}
                />
                <p className="text-xs text-stone-500 mt-1">{formData.title.length}/255文字</p>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  カテゴリ <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                >
                  <option value="">カテゴリを選択</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Brand */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  ブランド
                </label>
                <input
                  type="text"
                  value={formData.brand || ''}
                  onChange={(e) => handleInputChange('brand', e.target.value || undefined)}
                  placeholder="例: Apple, Samsung, Sony..."
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  商品説明 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="商品の詳細を説明してください: 状態、機能、付属品など..."
                  rows={6}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>

              {/* Original Price */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  新品時の価格 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.original_price || ''}
                  onChange={(e) => handleInputChange('original_price', parseFloat(e.target.value) || 0)}
                  placeholder="例: 100000"
                  min="0"
                  step="1000"
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
                <p className="text-xs text-stone-500 mt-1">新品時の価格を入力してください（円）</p>
              </div>

              {/* Condition */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  状態 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {(Object.keys(CONDITION_LABELS) as Condition[]).map((condition) => (
                    <label key={condition} className="flex items-center p-3 border border-stone-300 rounded-lg cursor-pointer hover:bg-stone-50">
                      <input
                        type="radio"
                        name="condition"
                        value={condition}
                        checked={formData.condition === condition}
                        onChange={(e) => handleInputChange('condition', e.target.value as Condition)}
                        className="mr-2"
                        required
                      />
                      <span className="text-sm">{CONDITION_LABELS[condition]}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  画像 <span className="text-red-500">*</span>
                </label>
                <div className="space-y-4">
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-stone-300 rounded-lg cursor-pointer hover:bg-stone-50">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="w-10 h-10 mb-3 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="mb-2 text-sm text-stone-500">
                          <span className="font-semibold">クリックしてアップロード</span> またはドラッグ&ドロップ
                        </p>
                        <p className="text-xs text-stone-500">PNG, JPG, WEBP（最大5枚）</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        multiple
                        onChange={handleImageSelect}
                      />
                    </label>
                  </div>
                  
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full aspect-square object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || isUploading}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? '画像をアップロード中...' : isSubmitting ? '処理中...' : '価格を設定する'}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Status */}
              <div className={`p-4 rounded-lg ${
                pricingResult.status === 'priced' ? 'bg-green-50 border border-green-200' :
                pricingResult.status === 'rejected' ? 'bg-red-50 border border-red-200' :
                pricingResult.status === 'error' ? 'bg-red-50 border border-red-200' :
                'bg-blue-50 border border-blue-200'
              }`}>
                <div className="flex items-center gap-2">
                  {pricingResult.status === 'priced' && '✅'}
                  {pricingResult.status === 'rejected' && '❌'}
                  {pricingResult.status === 'error' && '⚠️'}
                  {(pricingResult.status === 'pending' || pricingResult.status === 'validated') && '⏳'}
                  <span className="font-bold">
                    {pricingResult.status === 'priced' && '価格設定完了'}
                    {pricingResult.status === 'rejected' && '画像が無効です'}
                    {pricingResult.status === 'error' && 'エラー'}
                    {(pricingResult.status === 'pending' || pricingResult.status === 'validated') && '処理中...'}
                  </span>
                </div>
                {pricingResult.error_message && (
                  <p className="mt-2 text-sm text-red-600">{pricingResult.error_message}</p>
                )}
              </div>

              {/* Pricing Result */}
              {pricingResult.status === 'priced' && pricingResult.suggested_price && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                  <h2 className="text-2xl font-bold text-green-900 mb-4">価格設定結果</h2>
                  
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4">
                      <div className="text-sm text-stone-600 mb-1">推奨価格</div>
                      <div className="text-3xl font-bold text-green-600">
                        {parseFloat(pricingResult.suggested_price).toLocaleString('ja-JP')} 円
                      </div>
                    </div>
                    
                    {pricingResult.price_min && pricingResult.price_max && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white rounded-lg p-4">
                          <div className="text-sm text-stone-600 mb-1">最低価格</div>
                          <div className="text-xl font-bold text-stone-700">
                            {parseFloat(pricingResult.price_min).toLocaleString('ja-JP')} 円
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-4">
                          <div className="text-sm text-stone-600 mb-1">最高価格</div>
                          <div className="text-xl font-bold text-stone-700">
                            {parseFloat(pricingResult.price_max).toLocaleString('ja-JP')} 円
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {pricingResult.pricing_reasoning && (
                      <div className="bg-white rounded-lg p-4">
                        <div className="text-sm font-bold text-stone-700 mb-2">価格設定の理由:</div>
                        <div className="text-sm text-stone-600 whitespace-pre-line">
                          {pricingResult.pricing_reasoning}
                        </div>
                      </div>
                    )}
                    
                    {pricingResult.confidence_score && (
                      <div className="text-xs text-stone-500">
                        信頼度: {(pricingResult.confidence_score * 100).toFixed(0)}%
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setPricingResult(null);
                    setImageFiles([]);
                    setImagePreviews([]);
                    setFormData({
                      title: '',
                      category: '',
                      brand: '',
                      description: '',
                      original_price: 0,
                      condition: 'good',
                      image_urls: [],
                    });
                  }}
                  className="flex-1 px-6 py-3 bg-stone-200 text-stone-700 rounded-lg font-bold hover:bg-stone-300"
                >
                  別の商品を価格設定
                </button>
                {pricingResult.status === 'rejected' && (
                  <button
                    onClick={async () => {
                      try {
                        await pricingService.reprocessPricingRequest(pricingResult.id);
                        toast.success('再処理中...');
                        // Poll for result
                        const pollResult = async () => {
                          let attempts = 0;
                          const maxAttempts = 30;
                          const interval = setInterval(async () => {
                            attempts++;
                            try {
                              const updated = await pricingService.getPricingRequest(pricingResult.id);
                              setPricingResult(updated);
                              if (updated.status === 'priced' || updated.status === 'rejected' || updated.status === 'error') {
                                clearInterval(interval);
                                if (updated.status === 'priced') {
                                  toast.success('価格設定が完了しました！');
                                }
                              }
                            } catch (error) {
                              console.error('Error polling result:', error);
                            }
                            if (attempts >= maxAttempts) {
                              clearInterval(interval);
                            }
                          }, 1000);
                        };
                        pollResult();
                      } catch (error: any) {
                        toast.error(error?.message || '再処理エラー');
                      }
                    }}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
                  >
                    再処理
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

