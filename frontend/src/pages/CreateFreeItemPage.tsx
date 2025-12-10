import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { FreeItemImageUpload } from '../components/freeItem/FreeItemImageUpload';
import { freeItemService } from '../services/freeItemService';
import type { CreateFreeItemRequest, FreeItemCondition, FreeItemPickupMethod } from '../types/freeItem';
import { CONDITION_LABELS, PICKUP_METHOD_LABELS } from '../types/freeItem';
import { useAuth } from '../contexts/AuthContext';
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

export const CreateFreeItemPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<CreateFreeItemRequest>({
    title: '',
    description: '',
    condition: 'like_new',
    category: '',
    location_prefecture: '',
    location_city: '',
    location_detail: '',
    pickup_method: 'direct',
    show_email: false,
    images: [],
  });
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Redirect if not logged in
  React.useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: '/free-items/create' } });
    }
  }, [user, navigate]);

  const handleInputChange = (field: keyof CreateFreeItemRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImagesChange = (images: File[]) => {
    setFormData(prev => ({ ...prev, images }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (formData.images.length === 0) {
          toast.error('画像を少なくとも1枚アップロードしてください');
          return false;
        }
        return true;
      case 2:
        if (!formData.title.trim() || formData.title.trim().length < 3) {
          toast.error('タイトルは3文字以上で入力してください');
          return false;
        }
        if (!formData.description.trim() || formData.description.trim().length < 20) {
          toast.error('説明は20文字以上で入力してください');
          return false;
        }
        return true;
      case 3:
        if (!formData.location_prefecture) {
          toast.error('都道府県を選択してください');
          return false;
        }
        if (!formData.location_city.trim()) {
          toast.error('市区町村を入力してください');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(2) || !validateStep(3)) {
      setCurrentStep(2);
      return;
    }
    if (!agreeTerms) {
      toast.error('利用規約に同意してください');
      return;
    }

    setIsSubmitting(true);
    try {
      await freeItemService.createFreeItem(formData);
      toast.success('アイテムを投稿しました！');
      navigate('/free-items');
    } catch (error: unknown) {
      console.error('Failed to create free item:', error);
      const message = (error as any)?.response?.data?.error || '投稿に失敗しました';
      toast.error(message);
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
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-stone-900 mb-2">無料であげる</h1>
            <p className="text-stone-600">使わないものを誰かに譲りましょう</p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[1, 2, 3, 4].map((step) => (
                <React.Fragment key={step}>
                  <div className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        currentStep >= step
                          ? 'bg-green-600 text-white'
                          : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {step}
                    </div>
                    <span className="ml-2 text-sm text-stone-600 hidden sm:block">
                      {step === 1 && '画像'}
                      {step === 2 && '基本情報'}
                      {step === 3 && '場所・状態'}
                      {step === 4 && '確認'}
                    </span>
                  </div>
                  {step < 4 && (
                    <div
                      className={`flex-1 h-1 mx-2 ${
                        currentStep > step ? 'bg-green-600' : 'bg-stone-200'
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="min-h-[400px]">
            {currentStep === 1 && (
              <div>
                <h2 className="text-2xl font-bold text-stone-900 mb-4">画像をアップロード</h2>
                <FreeItemImageUpload
                  images={formData.images || []}
                  onImagesChange={handleImagesChange}
                  maxImages={4}
                />
                <div className="mt-4 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.show_email}
                    onChange={(e) => handleInputChange('show_email', e.target.checked)}
                  />
                  <span className="text-sm text-stone-700">メールアドレスを公開する（任意）</span>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-stone-900 mb-4">基本情報</h2>
                
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    タイトル <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="例: ソファー（無料）"
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    maxLength={50}
                  />
                  <p className="text-xs text-stone-500 mt-1">{formData.title.length}/50</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    説明 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="アイテムの詳細を説明してください（20文字以上）"
                    rows={6}
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    maxLength={500}
                  />
                  <p className="text-xs text-stone-500 mt-1">{formData.description.length}/500</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    カテゴリ
                  </label>
                  <select
                    value={formData.category || ''}
                    onChange={(e) => handleInputChange('category', e.target.value || undefined)}
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">選択してください</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-stone-900 mb-4">場所・状態</h2>
                
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    都道府県 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.location_prefecture}
                    onChange={(e) => handleInputChange('location_prefecture', e.target.value)}
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
                    value={formData.location_city}
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
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-stone-900 mb-4">確認</h2>
                
                <div className="bg-stone-50 rounded-lg p-6 space-y-4">
                  <div>
                    <h3 className="font-bold text-stone-900 mb-2">画像</h3>
                    <div className="grid grid-cols-4 gap-2">
                      {formData.images?.map((img, idx) => (
                        <img
                          key={idx}
                          src={URL.createObjectURL(img)}
                          alt={`Preview ${idx + 1}`}
                          className="w-full aspect-square object-cover rounded"
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-stone-900 mb-2">タイトル</h3>
                    <p className="text-stone-700">{formData.title}</p>
                  </div>

                  <div>
                    <h3 className="font-bold text-stone-900 mb-2">説明</h3>
                    <p className="text-stone-700 whitespace-pre-wrap">{formData.description}</p>
                  </div>

                  <div>
                    <h3 className="font-bold text-stone-900 mb-2">場所</h3>
                    <p className="text-stone-700">
                      {formData.location_prefecture} {formData.location_city}
                      {formData.location_detail && ` ${formData.location_detail}`}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-stone-900 mb-2">状態</h3>
                    <p className="text-stone-700">{CONDITION_LABELS[formData.condition]}</p>
                  </div>

                  <div>
                    <h3 className="font-bold text-stone-900 mb-2">受け取り方法</h3>
                    <p className="text-stone-700">{PICKUP_METHOD_LABELS[formData.pickup_method]}</p>
                  </div>

                  <div>
                    <h3 className="font-bold text-stone-900 mb-2">メール公開</h3>
                    <p className="text-stone-700">{formData.show_email ? '公開する' : '公開しない'}</p>
                  </div>

                  <div className="border-t border-stone-200 pt-4">
                    <h3 className="font-bold text-stone-900 mb-2">【無料あげます・交換コーナー 利用規約】</h3>
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
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-stone-200">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="px-6 py-2 border border-stone-300 rounded-lg text-stone-700 hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              戻る
            </button>
            
            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700"
              >
                次へ
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50"
              >
                {isSubmitting ? '投稿中...' : '投稿する'}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

