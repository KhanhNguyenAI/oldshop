import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { FreeItemImageUpload } from '../components/freeItem/FreeItemImageUpload';
import { freeItemService } from '../services/freeItemService';
import type { FreeItem, UpdateFreeItemRequest, FreeItemCondition, FreeItemPickupMethod, FreeItemStatus } from '../types/freeItem';
import { CONDITION_LABELS, PICKUP_METHOD_LABELS } from '../types/freeItem';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
];

const CATEGORIES = [
  '家具', '家電', '服飾', '本・雑誌', 'おもちゃ', 'スポーツ', 'その他'
];

export const EditFreeItemPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [item, setItem] = useState<FreeItem | null>(null);
  
  const [formData, setFormData] = useState<UpdateFreeItemRequest>({
    title: '',
    description: '',
    condition: 'like_new',
    category: '',
    location_prefecture: '',
    location_city: '',
    location_detail: '',
    pickup_method: 'direct',
    status: 'available',
    show_email: false,
    images: [],
    delete_image_ids: [],
  });

  const [existingImages, setExistingImages] = useState<Array<{ id: string; url: string }>>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [agreeTerms, setAgreeTerms] = useState(false);

  useEffect(() => {
    if (!id || !user) {
      navigate('/free-items');
      return;
    }

    const fetchItem = async () => {
      setIsLoading(true);
      try {
        const itemData = await freeItemService.getFreeItem(id);
        
        // Kiểm tra quyền sở hữu
        if (String(itemData.user.id) !== String(user.id)) {
          toast.error('このアイテムを編集する権限がありません');
          navigate('/free-items');
          return;
        }

        setItem(itemData);
        
        // Set form data từ item
        setFormData({
          title: itemData.title,
          description: itemData.description,
          condition: itemData.condition,
          category: itemData.category || '',
          location_prefecture: itemData.location_prefecture,
          location_city: itemData.location_city,
          location_detail: itemData.location_detail || '',
          pickup_method: itemData.pickup_method,
          status: itemData.status,
          show_email: itemData.show_email ?? false,
          images: [],
          delete_image_ids: [],
        });

        // Set existing images
        if (itemData.images && itemData.images.length > 0) {
          setExistingImages(
            itemData.images.map(img => ({
              id: img.id,
              url: img.image_url,
            }))
          );
        }
      } catch (error) {
        console.error('Failed to fetch item:', error);
        toast.error('アイテムの取得に失敗しました');
        navigate('/free-items');
      } finally {
        setIsLoading(false);
      }
    };

    fetchItem();
  }, [id, user, navigate]);

  const handleInputChange = <K extends keyof UpdateFreeItemRequest>(field: K, value: UpdateFreeItemRequest[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNewImagesChange = (images: File[]) => {
    setNewImages(images);
  };

  const handleDeleteExistingImage = (imageId: string) => {
    setExistingImages(prev => prev.filter(img => img.id !== imageId));
    setFormData(prev => ({
      ...prev,
      delete_image_ids: [...(prev.delete_image_ids || []), imageId],
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title?.trim() || formData.title.trim().length < 3) {
      toast.error('タイトルは3文字以上で入力してください');
      return;
    }

    if (!formData.description?.trim() || formData.description.trim().length < 20) {
      toast.error('説明は20文字以上で入力してください');
      return;
    }

    if (!formData.location_prefecture) {
      toast.error('都道府県を選択してください');
      return;
    }

    if (!formData.location_city?.trim()) {
      toast.error('市区町村を入力してください');
      return;
    }

    // Kiểm tra tổng số ảnh không vượt quá 4
    const totalImages = existingImages.length + newImages.length;
    if (totalImages > 4) {
      toast.error('画像は最大4枚までです');
      return;
    }

    if (totalImages === 0) {
      toast.error('画像を少なくとも1枚残してください');
      return;
    }
    if (!agreeTerms) {
      toast.error('利用規約に同意してください');
      return;
    }

    setIsSubmitting(true);
    try {
      const updateData: UpdateFreeItemRequest = {
        title: formData.title,
        description: formData.description,
        condition: formData.condition,
        category: formData.category || undefined,
        location_prefecture: formData.location_prefecture,
        location_city: formData.location_city,
        location_detail: formData.location_detail || undefined,
        pickup_method: formData.pickup_method,
        status: formData.status,
        show_email: formData.show_email,
        images: newImages.length > 0 ? newImages : undefined,
        delete_image_ids: formData.delete_image_ids && formData.delete_image_ids.length > 0 
          ? formData.delete_image_ids 
          : undefined,
      };

      await freeItemService.updateFreeItem(id!, updateData);
      toast.success('アイテムを更新しました！');
      navigate(`/free-items/${id}`);
    } catch (error: unknown) {
      console.error('Failed to update item:', error);
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        '更新に失敗しました';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50">
        <Header />
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!item) {
    return null;
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate(`/free-items/${id}`)}
            className="text-stone-600 hover:text-stone-900 flex items-center gap-2"
          >
            ← 戻る
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-stone-900 mb-2">アイテムを編集</h1>
            <p className="text-stone-600">アイテムの情報を更新できます</p>
          </div>

          <div className="space-y-6">
            {/* Images Section */}
            <div>
              <h2 className="text-xl font-bold text-stone-900 mb-4">画像</h2>
              
              {/* Existing Images */}
              {existingImages.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-stone-600 mb-2">現在の画像 ({existingImages.length}/4)</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {existingImages.map((img) => (
                      <div key={img.id} className="relative group">
                        <img
                          src={img.url}
                          alt="Existing"
                          className="w-full aspect-square object-cover rounded-lg border border-stone-300"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteExistingImage(img.id)}
                          aria-label="画像を削除"
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Images Upload */}
              {existingImages.length < 4 && (
                <div>
                  <p className="text-sm text-stone-600 mb-2">
                    新しい画像を追加 ({existingImages.length + newImages.length}/4)
                  </p>
                  <FreeItemImageUpload
                    images={newImages}
                    onImagesChange={handleNewImagesChange}
                    maxImages={4 - existingImages.length}
                  />
                </div>
              )}

              <div className="mt-4 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.show_email || false}
                  onChange={(e) => handleInputChange('show_email', e.target.checked)}
                  aria-label="メールアドレスを公開する"
                />
                <span className="text-sm text-stone-700">メールアドレスを公開する（任意）</span>
              </div>
            </div>

            {/* Basic Info */}
            <div>
              <h2 className="text-xl font-bold text-stone-900 mb-4">基本情報</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    タイトル <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="例: ソファー（無料）"
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    maxLength={50}
                  />
                  <p className="text-xs text-stone-500 mt-1">{(formData.title || '').length}/50</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    説明 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="アイテムの詳細を説明してください（20文字以上）"
                    rows={6}
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    maxLength={500}
                  />
                  <p className="text-xs text-stone-500 mt-1">{(formData.description || '').length}/500</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    カテゴリ
                  </label>
                  <select
                    value={formData.category || ''}
                    onChange={(e) => handleInputChange('category', e.target.value || undefined)}
                    aria-label="カテゴリ"
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">選択してください</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Location & Condition */}
            <div>
              <h2 className="text-xl font-bold text-stone-900 mb-4">場所・状態</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    都道府県 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.location_prefecture || ''}
                    onChange={(e) => handleInputChange('location_prefecture', e.target.value)}
                    aria-label="都道府県"
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">選択してください</option>
                    {PREFECTURES.map((pref) => (
                      <option key={pref} value={pref}>{pref}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    市区町村 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.location_city || ''}
                    onChange={(e) => handleInputChange('location_city', e.target.value)}
                    placeholder="例: 八王子市"
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    詳細住所（任意）
                  </label>
                  <input
                    type="text"
                    value={formData.location_detail || ''}
                    onChange={(e) => handleInputChange('location_detail', e.target.value || undefined)}
                    placeholder="例: 〇〇駅付近"
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    状態 <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {(Object.keys(CONDITION_LABELS) as FreeItemCondition[]).map((condition) => (
                      <label key={condition} className="flex items-center">
                        <input
                          type="radio"
                          name="condition"
                          value={condition}
                          checked={formData.condition === condition}
                          onChange={(e) => handleInputChange('condition', e.target.value as FreeItemCondition)}
                          className="mr-2"
                        />
                        <span>{CONDITION_LABELS[condition]}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    受け取り方法 <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {(Object.keys(PICKUP_METHOD_LABELS) as FreeItemPickupMethod[]).map((method) => (
                      <label key={method} className="flex items-center">
                        <input
                          type="radio"
                          name="pickup_method"
                          value={method}
                          checked={formData.pickup_method === method}
                          onChange={(e) => handleInputChange('pickup_method', e.target.value as FreeItemPickupMethod)}
                          className="mr-2"
                        />
                        <span>{PICKUP_METHOD_LABELS[method]}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    ステータス
                  </label>
                  <select
                    value={formData.status || 'available'}
                    onChange={(e) => handleInputChange('status', e.target.value as FreeItemStatus)}
                    aria-label="ステータス"
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="available">募集中</option>
                    <option value="reserved">予約済み</option>
                    <option value="completed">終了</option>
                    <option value="cancelled">キャンセル</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t border-stone-200 pt-4">
              <h3 className="text-xl font-bold text-stone-900 mb-2">【無料あげます・交換コーナー 利用規約】</h3>
              <div className="text-sm text-stone-700 space-y-2 max-h-48 overflow-y-auto">
                <p>1. 本サービスは無償譲渡・交換のコミュニティです。金銭取引は伴いません。</p>
                <p>2. 取引はユーザー間の自己責任です。当サイトは品質・トラブル等に関与しません。</p>
                <p>3. 危険物・違法物・著作権侵害物は禁止。虚偽や誤解を招く記載をしないこと。</p>
                <p>4. すべて無償。隠れた費用請求禁止。送料等は事前合意し当事者で解決。</p>
                <p>5. 受け渡し場所・日時・方法は当事者で相談。当サイトは関与・保証しません。</p>
                <p>6. 個人情報は自己責任で共有してください。流出について当サイトは責任を負いません。</p>
                <p>7. 禁止行為：販売、スパム、ハラスメント、違法・危険物、情報収集目的など。</p>
                <p>8. 規約違反・不正行為等は予告なく投稿削除や利用停止を行う場合があります。</p>
                <p>9. 免責：品質・安全・損害・データ消失・不正アクセス等、当サイトは責任を負いません。</p>
                <p>10. 規約は変更されることがあります。公開後も利用を続ける場合は同意したものとみなします。</p>
              </div>
              <label className="mt-3 flex items-center gap-2 text-sm text-stone-800">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                />
                利用規約に同意します
              </label>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-6 border-t border-stone-200">
              <button
                onClick={() => navigate(`/free-items/${id}`)}
                className="px-6 py-2 border border-stone-300 rounded-lg text-stone-700 hover:bg-stone-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50"
              >
                {isSubmitting ? '更新中...' : '更新する'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

