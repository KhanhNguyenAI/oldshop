import React, { useState, useEffect } from 'react';
import { addressService } from '../../services/addressService';
import { lookupAddressByPostalCode } from '../../services/japanPostalCodeService';
import type { Address } from '../../types/auth';

const PREFECTURES = [
  '北海道',
  '青森県',
  '岩手県',
  '宮城県',
  '秋田県',
  '山形県',
  '福島県',
  '茨城県',
  '栃木県',
  '群馬県',
  '埼玉県',
  '千葉県',
  '東京都',
  '神奈川県',
  '新潟県',
  '富山県',
  '石川県',
  '福井県',
  '山梨県',
  '長野県',
  '岐阜県',
  '静岡県',
  '愛知県',
  '三重県',
  '滋賀県',
  '京都府',
  '大阪府',
  '兵庫県',
  '奈良県',
  '和歌山県',
  '鳥取県',
  '島根県',
  '岡山県',
  '広島県',
  '山口県',
  '徳島県',
  '香川県',
  '愛媛県',
  '高知県',
  '福岡県',
  '佐賀県',
  '長崎県',
  '熊本県',
  '大分県',
  '宮崎県',
  '鹿児島県',
  '沖縄県',
];

export const AddressPanel: React.FC = () => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [addressForm, setAddressForm] = useState({
    recipient: '',
    postalCode: '',
    prefecture: '東京都',
    city: '',
    district: '',
    building: '',
    phone: '',
  });

  const formatPostalCode = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 7);
    return digits.length > 3 ? `${digits.slice(0, 3)}-${digits.slice(3)}` : digits;
  };

  const loadAddresses = async () => {
    try {
      setIsLoading(true);
      const data = await addressService.list();
      // Handle both array and paginated response
      const addressesArray = Array.isArray(data) ? data : (data.results || []);
      setAddresses(addressesArray);
    } catch (error) {
      console.error('Failed to load addresses', error);
      setAddresses([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  // Auto-lookup address when postal code is complete (7 digits)
  useEffect(() => {
    const rawPostal = addressForm.postalCode.replace(/\D/g, '');
    if (rawPostal.length === 7 && showForm) {
      const lookupAddress = async () => {
        setIsLookingUp(true);
        try {
          const result = await lookupAddressByPostalCode(addressForm.postalCode);
          if (result) {
            setAddressForm((prev) => ({
              ...prev,
              prefecture: result.prefecture,
              city: result.city,
              district: result.district,
              // Keep building and phone unchanged
            }));
          } else {
            // Not found - show alert but don't clear fields
            console.warn('Address not found for postal code:', addressForm.postalCode);
          }
        } catch (error) {
          console.error('Failed to lookup address:', error);
        } finally {
          setIsLookingUp(false);
        }
      };
      // Debounce: wait 500ms after user stops typing
      const timer = setTimeout(lookupAddress, 500);
      return () => clearTimeout(timer);
    }
  }, [addressForm.postalCode, showForm]);

  const resetForm = () => {
    setAddressForm({
      recipient: '',
      postalCode: '',
      prefecture: '東京都',
      city: '',
      district: '',
      building: '',
      phone: '',
    });
    setEditingAddressId(null);
    setShowForm(false);
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddressId(address.id);
    setAddressForm({
      recipient: address.recipient,
      postalCode: address.postal_code,
      prefecture: address.prefecture,
      city: address.city,
      district: address.district,
      building: address.building || '',
      phone: address.phone || '',
    });
    setShowForm(true);
  };

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    const rawPostal = addressForm.postalCode.replace(/\D/g, '');
    if (rawPostal.length !== 7) {
      alert('郵便番号は7桁で入力してください (e.g., 1600023).');
      return;
    }
    if (!addressForm.recipient.trim()) {
      alert('受取人を入力してください。');
      return;
    }
    if (!addressForm.city.trim() || !addressForm.district.trim()) {
      alert('市区町村と町・丁目を入力してください。');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      recipient: addressForm.recipient.trim(),
      postal_code: rawPostal,
      prefecture: addressForm.prefecture,
      city: addressForm.city.trim(),
      district: addressForm.district.trim(),
      building: addressForm.building.trim(),
      phone: addressForm.phone.trim(),
    };

    const promise = editingAddressId
      ? addressService.update(editingAddressId, payload)
      : addressService.create(payload);

    promise
      .then(() => {
        resetForm();
        loadAddresses();
      })
      .catch((error) => {
        console.error(error);
        alert(editingAddressId ? '住所の更新に失敗しました。' : '住所の保存に失敗しました。');
      })
      .finally(() => setIsSubmitting(false));
  };

  const handleDelete = (id: number) => {
    if (!window.confirm('この住所を削除しますか？')) return;
    addressService
      .delete(id)
      .then(() => loadAddresses())
      .catch((error) => {
        console.error(error);
        alert('住所の削除に失敗しました。');
      });
  };

  const handleSetDefault = (id: number) => {
    addressService
      .update(id, { is_default: true })
      .then(() => loadAddresses())
      .catch((error) => {
        console.error(error);
        alert('既定の住所に設定できません。');
      });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <h3 className="text-2xl font-serif font-bold text-amber-900 border-b-2 border-amber-200 pb-2">
        住所
      </h3>

      <div className="space-y-4">
        {isLoading ? (
          <p className="text-gray-500 italic font-serif">住所を読み込み中...</p>
        ) : !Array.isArray(addresses) || addresses.length === 0 ? (
          <p className="text-gray-500 italic font-serif">まだ住所が登録されていません。</p>
        ) : (
          <div className="space-y-4">
            {addresses.map((address) => (
              <div
                key={address.id}
                className={`border rounded-lg p-4 shadow-sm relative transition-all ${
                  editingAddressId === address.id
                    ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-200'
                    : 'border-amber-200 bg-white'
                }`}
              >
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <p className="font-serif font-bold text-amber-900">{address.recipient}</p>
                    <p className="text-sm text-gray-600 font-mono">〒{address.postal_code}</p>
                    <p className="text-sm text-gray-700">
                      {address.prefecture}
                      {address.city}
                      {address.district}
                      {address.building && ` ${address.building}`}
                    </p>
                    {address.phone && (
                      <p className="text-sm text-gray-600">
                        電話: <span className="font-mono">{address.phone}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 items-end text-xs font-serif">
                    {address.is_default ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full">
                        デフォルト
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSetDefault(address.id)}
                        className="px-2 py-0.5 rounded border border-amber-300 text-amber-900 hover:bg-amber-50 transition-colors"
                      >
                        デフォルトに設定
                      </button>
                    )}
                    <button
                      onClick={() => handleEditAddress(address)}
                      disabled={editingAddressId === address.id}
                      className={`transition-colors ${
                        editingAddressId === address.id
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-amber-700 hover:text-amber-900'
                      }`}
                    >
                      {editingAddressId === address.id ? '編集中...' : '編集'}
                    </button>
                    <button
                      onClick={() => handleDelete(address.id)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!showForm ? (
        <button
          className="w-full py-3 border-2 border-dashed border-amber-300 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 font-serif font-bold transition-colors"
          onClick={() => setShowForm(true)}
        >
          + 住所を追加
        </button>
      ) : (
        <div className="border border-amber-200 rounded-lg bg-amber-50/60 p-4 max-w-2xl">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-serif font-bold text-amber-900 uppercase tracking-[0.2em]">
              {editingAddressId ? '住所を編集' : '住所を追加'}
            </h4>
            <button
              onClick={resetForm}
              className="text-xs text-amber-700 hover:text-red-600 uppercase tracking-[0.2em]"
            >
              キャンセル
            </button>
          </div>

          <form onSubmit={handleAddAddress} className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-xs font-serif font-semibold text-amber-900 mb-1">受取人</label>
              <input
                type="text"
                value={addressForm.recipient}
                onChange={(e) => setAddressForm({ ...addressForm, recipient: e.target.value })}
                className="w-full p-2 text-sm border border-amber-300 rounded bg-white"
                placeholder="山田 太郎"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-serif font-semibold text-amber-900 mb-1">
                郵便番号
                {isLookingUp && (
                  <span className="ml-2 text-xs text-amber-600 italic">検索中...</span>
                )}
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={addressForm.postalCode}
                onChange={(e) => setAddressForm({ ...addressForm, postalCode: formatPostalCode(e.target.value) })}
                className="w-full p-2 text-sm border border-amber-300 rounded bg-white font-mono"
                placeholder="160-0023"
                required
              />
              <p className="text-[0.65rem] text-gray-500 mt-1 font-serif">
                7桁の郵便番号を入力すると、住所が自動入力されます
              </p>
            </div>

            <div>
              <label className="block text-xs font-serif font-semibold text-amber-900 mb-1">
                都道府県
                {addressForm.postalCode.replace(/\D/g, '').length === 7 && addressForm.prefecture !== '東京都' && (
                  <span className="ml-2 text-[0.65rem] text-emerald-600 italic">自動入力</span>
                )}
              </label>
              <select
                value={addressForm.prefecture}
                onChange={(e) => setAddressForm({ ...addressForm, prefecture: e.target.value })}
                className="w-full p-2 text-sm border border-amber-300 rounded bg-white"
              >
                {PREFECTURES.map((pref) => (
                  <option key={pref} value={pref}>
                    {pref}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-serif font-semibold text-amber-900 mb-1">
                市区町村
                {addressForm.postalCode.replace(/\D/g, '').length === 7 && addressForm.city && (
                  <span className="ml-2 text-[0.65rem] text-emerald-600 italic">自動入力</span>
                )}
              </label>
              <input
                type="text"
                value={addressForm.city}
                onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                className="w-full p-2 text-sm border border-amber-300 rounded bg-white"
                placeholder="新宿区"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-serif font-semibold text-amber-900 mb-1">
                町・丁目
                {addressForm.postalCode.replace(/\D/g, '').length === 7 && addressForm.district && (
                  <span className="ml-2 text-[0.65rem] text-emerald-600 italic">自動入力</span>
                )}
              </label>
              <input
                type="text"
                value={addressForm.district}
                onChange={(e) => setAddressForm({ ...addressForm, district: e.target.value })}
                className="w-full p-2 text-sm border border-amber-300 rounded bg-white"
                placeholder="西新宿2-8-1"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-serif font-semibold text-amber-900 mb-1">
                建物名・部屋番号
              </label>
              <input
                type="text"
                value={addressForm.building}
                onChange={(e) => setAddressForm({ ...addressForm, building: e.target.value })}
                className="w-full p-2 text-sm border border-amber-300 rounded bg-white"
                placeholder="都庁第一本庁舎 32F"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-serif font-semibold text-amber-900 mb-1">電話番号</label>
              <input
                type="tel"
                value={addressForm.phone}
                onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                className="w-full p-2 text-sm border border-amber-300 rounded bg-white"
                placeholder="03-1234-5678"
              />
            </div>

            <div className="md:col-span-2 pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-5 py-2 bg-amber-800 text-amber-50 text-xs font-serif font-bold uppercase tracking-[0.2em] rounded shadow transition-colors ${
                  isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-amber-700'
                }`}
              >
                {isSubmitting 
                  ? (editingAddressId ? '更新中...' : '保存中...') 
                  : (editingAddressId ? '住所を更新' : '住所を保存')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};



