import React, { useState, useEffect } from 'react';
import { Calendar } from './Calendar';
import type { 
  BookingState, 
  RoomSize, 
  TrashLevel,
  TruckType, 
  TimeSlot
} from '../../types/booking';
import {
  ROOM_PRICES,
  TRASH_PRICES,
  TRUCK_PRICES,
  ELEVATOR_FEE
} from '../../types/booking';
import { Logo } from '../ui/Logo';
import { useAuth } from '../../contexts/AuthContext';
import { addressService } from '../../services/addressService';
import { bookingService } from '../../services/bookingService';
import type { Address } from '../../types/auth';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// Helper for price formatting
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(price);
};

interface BookingWizardProps {
  rebookData?: {
    roomSize: string;
    trashLevel: string;
    truckType: string;
    address: string;
    hasElevator: boolean;
    customerInfo: {
      name: string;
      phone: string;
      email: string;
      notes: string;
    };
  };
}

export const BookingWizard: React.FC<BookingWizardProps> = ({ rebookData }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressMode, setSelectedAddressMode] = useState<'saved' | 'new'>('new');
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<BookingState & { acceptedTerms: boolean }>({
    roomSize: rebookData?.roomSize as RoomSize || null,
    trashLevel: rebookData?.trashLevel as TrashLevel || null,
    truckType: rebookData?.truckType as TruckType || null,
    date: null,
    timeSlot: null,
    address: rebookData?.address || '',
    hasElevator: rebookData?.hasElevator || false,
    images: [],
    customerInfo: {
      name: rebookData?.customerInfo.name || '',
      phone: rebookData?.customerInfo.phone || '',
      email: rebookData?.customerInfo.email || '',
      notes: rebookData?.customerInfo.notes || '',
    },
    acceptedTerms: false,
  });

  // Fetch user data and addresses on mount
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      try {
        // Pre-fill basic info from user profile
        setFormData(prev => ({
          ...prev,
          customerInfo: {
            ...prev.customerInfo,
            name: user.profile?.full_name || prev.customerInfo.name,
            email: user.email || prev.customerInfo.email,
            phone: user.profile?.phone_number || prev.customerInfo.phone,
          }
        }));

        // Fetch addresses
        const addresses = await addressService.list();
        setSavedAddresses(addresses);
        
        if (addresses.length > 0) {
          const defaultAddress = addresses.find(a => a.is_default) || addresses[0];
          setSelectedAddressMode('saved');
          setSelectedAddressId(defaultAddress.id);
          
          const formattedAddress = `〒${defaultAddress.postal_code} ${defaultAddress.prefecture}${defaultAddress.city}${defaultAddress.district}${defaultAddress.building ? ' ' + defaultAddress.building : ''}`;
          
          setFormData(prev => ({
            ...prev,
            address: formattedAddress,
            customerInfo: {
              ...prev.customerInfo,
              name: prev.customerInfo.name || defaultAddress.recipient,
              phone: prev.customerInfo.phone || defaultAddress.phone,
            }
          }));
        }
      } catch (error) {
        console.error('Failed to fetch user data for booking:', error);
      }
    };

    fetchUserData();
  }, [user]);

  // Handle address selection change
  const handleAddressSelect = (addressId: number) => {
    setSelectedAddressId(addressId);
    const selected = savedAddresses.find(a => a.id === addressId);
    if (selected) {
      const formattedAddress = `〒${selected.postal_code} ${selected.prefecture}${selected.city}${selected.district}${selected.building ? ' ' + selected.building : ''}`;
      setFormData(prev => ({
        ...prev,
        address: formattedAddress,
        customerInfo: {
          ...prev.customerInfo,
          phone: selected.phone || prev.customerInfo.phone, // Optionally update phone too
        }
      }));
    }
  };

  const handleModeChange = (mode: 'saved' | 'new') => {
    setSelectedAddressMode(mode);
    if (mode === 'new') {
      setFormData(prev => ({ ...prev, address: '' }));
      setSelectedAddressId(null);
    } else if (savedAddresses.length > 0) {
      handleAddressSelect(savedAddresses[0].id);
    }
  };

  // Calculate Total Price
  const calculateTotal = () => {
    let total = 0;
    if (formData.roomSize) total += ROOM_PRICES[formData.roomSize];
    if (formData.trashLevel) total += TRASH_PRICES[formData.trashLevel];
    if (formData.truckType) total += TRUCK_PRICES[formData.truckType];
    if (!formData.hasElevator && formData.roomSize && formData.roomSize !== 'house') total += ELEVATOR_FEE; 
    return total;
  };

  const getSuggestedTruck = (room: RoomSize | null, trash: TrashLevel | null): TruckType | null => {
    if (!room || !trash) return null;
    
    const isLargeRoom = ['2DK', '2LDK', '3LDK', 'house'].includes(room);
    const isMediumRoom = ['1LDK', '2DK'].includes(room);
    
    if (trash === 'high') {
      return isLargeRoom ? '2_trucks' : '2t_full';
    } else if (trash === 'medium') {
      return isLargeRoom ? '2t' : (isMediumRoom ? '1t' : 'light');
    } else {
      // Low trash
      return isLargeRoom ? '2t' : 'light';
    }
  };

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  const handleRoomSelect = (size: RoomSize) => {
    setFormData(prev => {
      const suggested = getSuggestedTruck(size, prev.trashLevel);
      return {
        ...prev,
        roomSize: size,
        truckType: !prev.truckType && suggested ? suggested : prev.truckType
      };
    });
  };

  const handleTrashSelect = (level: TrashLevel) => {
    setFormData(prev => {
      const suggested = getSuggestedTruck(prev.roomSize, level);
      return {
        ...prev,
        trashLevel: level,
        truckType: !prev.truckType && suggested ? suggested : prev.truckType
      };
    });
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-amber-900 font-serif border-b-2 border-amber-200 pb-2">
        STEP 1. お部屋の広さを選択してください
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(Object.keys(ROOM_PRICES) as RoomSize[]).map((size) => (
          <button
            key={size}
            onClick={() => handleRoomSelect(size)}
            className={`
              p-4 rounded-sm border-2 transition-all font-serif flex flex-col items-center justify-center gap-2 h-32
              ${formData.roomSize === size 
                ? 'bg-amber-800 text-amber-50 border-amber-900 shadow-inner' 
                : 'bg-white text-amber-900 border-amber-200 hover:border-amber-400 hover:bg-amber-50 shadow-sm'}
            `}
          >
            <span className="text-2xl font-bold">{size === 'house' ? '戸建て' : size}</span>
            <span className="text-xs opacity-80">
              {size === '1DK' && '25-35m²'}
              {size === 'house' && '1階〜3階'}
              {size === '1R' && '〜20m²'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-amber-900 font-serif border-b-2 border-amber-200 pb-2">
        STEP 2. お荷物・ゴミの量を選択してください
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => handleTrashSelect('low')}
          className={`
            p-6 rounded-sm border-2 text-left transition-all relative overflow-hidden group
            ${formData.trashLevel === 'low'
              ? 'bg-amber-100 border-amber-800 shadow-md'
              : 'bg-white border-amber-200 hover:border-amber-400'}
          `}
        >
          <div className="font-bold text-lg text-amber-900 mb-2">少なめ / 整理済み</div>
          <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
            <li>生活ゴミが中心</li>
            <li>足の踏み場は十分ある</li>
            <li>大型家具は少ない</li>
          </ul>
        </button>

        <button
          onClick={() => handleTrashSelect('medium')}
          className={`
            p-6 rounded-sm border-2 text-left transition-all relative overflow-hidden group
            ${formData.trashLevel === 'medium'
              ? 'bg-amber-100 border-amber-800 shadow-md'
              : 'bg-white border-amber-200 hover:border-amber-400'}
          `}
        >
          <div className="font-bold text-lg text-amber-900 mb-2">普通 / 散らかっている</div>
          <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
            <li>一部床が見えない</li>
            <li>家具や家電も処分したい</li>
            <li>分別があまりできていない</li>
          </ul>
        </button>

        <button
          onClick={() => handleTrashSelect('high')}
          className={`
            p-6 rounded-sm border-2 text-left transition-all relative overflow-hidden group
            ${formData.trashLevel === 'high'
              ? 'bg-red-50 border-red-800 shadow-md'
              : 'bg-white border-amber-200 hover:border-red-300'}
          `}
        >
          <div className="font-bold text-lg text-red-900 mb-2">ゴミ屋敷 / 大量</div>
          <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
            <li>床が全く見えない</li>
            <li>積み上げられている (30cm~)</li>
            <li>異臭がある・害虫がいる</li>
          </ul>
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-amber-900 font-serif border-b-2 border-amber-200 pb-2">
        STEP 3. トラックのサイズを選択してください
      </h3>
      <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded border border-amber-200">
        💡 選択された部屋の広さと荷物量から、最適なトラックを自動で選択しています。必要に応じて変更可能です。
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { id: 'light', label: '軽トラック', desc: '単身・少量' },
          { id: '1t', label: '1t トラック', desc: '1DK〜・中量' },
          { id: '2t', label: '2t トラック', desc: '2DK〜・多量' },
          { id: '2t_full', label: '2t トラック (満載)', desc: '2LDK〜・大量' },
          { id: '2_trucks', label: '2t トラック × 2台', desc: 'ゴミ屋敷・一軒家' },
        ].map((truck) => (
          <button
            key={truck.id}
            onClick={() => setFormData({ ...formData, truckType: truck.id as TruckType })}
            className={`
              p-4 rounded-sm border-2 transition-all flex flex-col items-start
              ${formData.truckType === truck.id
                ? 'bg-amber-800 text-amber-50 border-amber-900'
                : 'bg-white text-amber-900 border-amber-200 hover:bg-amber-50'}
            `}
          >
            <span className="font-bold text-lg">{truck.label}</span>
            <span className="text-sm opacity-80">{truck.desc}</span>
            <span className="mt-2 text-sm font-mono font-bold">
              +{formatPrice(TRUCK_PRICES[truck.id as TruckType])}
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-8">
      <h3 className="text-xl font-bold text-amber-900 font-serif border-b-2 border-amber-200 pb-2">
        STEP 4. 日時・場所・写真
      </h3>
      
      {/* Date & Time */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h4 className="font-bold text-amber-900 mb-4">希望日を選択</h4>
          <div className="transform scale-90 origin-top-left">
            <Calendar onDateSelect={(date) => setFormData({ ...formData, date })} />
          </div>
          {formData.date && (
            <p className="mt-2 text-amber-800 font-bold">
              選択中: {formData.date.toLocaleDateString('ja-JP')}
            </p>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h4 className="font-bold text-amber-900 mb-2">時間帯を選択</h4>
            <div className="space-y-2">
              {['9:00-12:00', '13:00-17:00'].map((slot) => (
                <button
                  key={slot}
                  onClick={() => setFormData({ ...formData, timeSlot: slot as TimeSlot })}
                  className={`
                    w-full p-3 rounded-sm border text-left transition-all
                    ${formData.timeSlot === slot
                      ? 'bg-amber-800 text-white border-amber-900'
                      : 'bg-white text-amber-900 border-amber-300 hover:bg-amber-50'}
                  `}
                >
                  {slot}
                </button>
              ))}
              
              {/* Custom Time Selection */}
              <div className="space-y-1">
                <input
                  type="time"
                  aria-label="その他の時間"
                  value={formData.timeSlot && !['9:00-12:00', '13:00-17:00'].includes(formData.timeSlot) ? formData.timeSlot : ''}
                  onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                  min="08:00"
                  max="15:00"
                  className={`
                    w-full p-3 rounded-sm border text-left transition-all
                    ${formData.timeSlot && !['9:00-12:00', '13:00-17:00'].includes(formData.timeSlot)
                      ? 'bg-amber-800 text-white border-amber-900 placeholder-amber-200'
                      : 'bg-white text-amber-900 border-amber-300 hover:bg-amber-50'}
                  `}
                />
                <p className="text-xs text-amber-700 ml-1">
                  ※ 8:00〜15:00の間で指定してください
                </p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-amber-900 mb-2">住所・建物情報</h4>
            
            {/* Saved Addresses Selection */}
            {savedAddresses.length > 0 && (
              <div className="mb-4 space-y-2">
                <div className="flex gap-4 mb-3">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={selectedAddressMode === 'saved'}
                      onChange={() => handleModeChange('saved')}
                      className="text-amber-800 focus:ring-amber-500"
                    />
                    <span className="text-amber-900 font-bold">登録済みの住所から選ぶ</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={selectedAddressMode === 'new'}
                      onChange={() => handleModeChange('new')}
                      className="text-amber-800 focus:ring-amber-500"
                    />
                    <span className="text-amber-900 font-bold">新しい住所を入力</span>
                  </label>
                </div>

                {selectedAddressMode === 'saved' && (
                  <div className="bg-amber-50 p-3 rounded border border-amber-200 max-h-40 overflow-y-auto">
                    {savedAddresses.map((addr) => (
                      <label key={addr.id} className="flex items-start space-x-3 p-2 hover:bg-amber-100 rounded cursor-pointer border-b border-amber-100 last:border-0">
                        <input
                          type="radio"
                          name="savedAddress"
                          checked={selectedAddressId === addr.id}
                          onChange={() => handleAddressSelect(addr.id)}
                          className="mt-1 text-amber-800 focus:ring-amber-500"
                        />
                        <div className="text-sm text-amber-900">
                          <div className="font-bold">〒{addr.postal_code}</div>
                          <div>{addr.prefecture}{addr.city}{addr.district}</div>
                          {addr.building && <div>{addr.building}</div>}
                          <div className="text-xs text-amber-700 mt-1">{addr.recipient} | {addr.phone}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            <input
              type="text"
              aria-label="住所"
              placeholder="住所を入力してください"
              value={formData.address}
              readOnly={selectedAddressMode === 'saved'}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className={`w-full p-3 border rounded-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent mb-4
                ${selectedAddressMode === 'saved' 
                  ? 'bg-gray-100 text-gray-600 border-gray-300 cursor-not-allowed' 
                  : 'border-amber-300 text-amber-900'
                }
              `}
            />
            
            <label className="flex items-center space-x-3 p-3 bg-white border border-amber-300 rounded-sm cursor-pointer hover:bg-amber-50">
              <input
                type="checkbox"
                checked={!formData.hasElevator}
                onChange={(e) => setFormData({ ...formData, hasElevator: !e.target.checked })}
                className="h-5 w-5 text-amber-800 focus:ring-amber-500 border-gray-300 rounded"
              />
              <span className="text-amber-900">エレベーターなし (+{formatPrice(ELEVATOR_FEE)})</span>
            </label>
          </div>
        </div>
      </div>

      {/* Photo Upload */}
      <div className="bg-amber-50 p-6 rounded-sm border-2 border-dashed border-amber-300">
        <h4 className="font-bold text-amber-900 mb-2">お部屋の写真 (任意)</h4>
        <p className="text-sm text-amber-700 mb-4">
          写真をアップロードしていただくと、より正確な見積もりが可能です。追加費用が発生するリスクを減らせます。
        </p>
        <input
          type="file"
          multiple
          accept="image/*"
          aria-label="写真アップロード"
          onChange={(e) => {
            if (e.target.files) {
              setFormData({ ...formData, images: Array.from(e.target.files) });
            }
          }}
          className="block w-full text-sm text-amber-900
            file:mr-4 file:py-2 file:px-4
            file:rounded-sm file:border-0
            file:text-sm file:font-semibold
            file:bg-amber-800 file:text-white
            hover:file:bg-amber-700
          "
        />
        {formData.images.length > 0 && (
          <div className="mt-4 text-sm text-amber-800">
            {formData.images.length} 枚の写真が選択されています
          </div>
        )}
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-amber-900 font-serif border-b-2 border-amber-200 pb-2">
        STEP 5. お客様情報
      </h3>
      <div className="grid grid-cols-1 gap-4 max-w-lg mx-auto">
        <div>
          <label className="block text-sm font-bold text-amber-900 mb-1">お名前</label>
          <input
            type="text"
            aria-label="お名前"
            value={formData.customerInfo.name}
            onChange={(e) => setFormData({ 
              ...formData, 
              customerInfo: { ...formData.customerInfo, name: e.target.value } 
            })}
            className="w-full p-3 border border-amber-300 rounded-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-amber-900 mb-1">電話番号</label>
          <input
            type="tel"
            aria-label="電話番号"
            value={formData.customerInfo.phone}
            onChange={(e) => setFormData({ 
              ...formData, 
              customerInfo: { ...formData.customerInfo, phone: e.target.value } 
            })}
            className="w-full p-3 border border-amber-300 rounded-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-amber-900 mb-1">メールアドレス</label>
          <input
            type="email"
            aria-label="メールアドレス"
            value={formData.customerInfo.email}
            onChange={(e) => setFormData({ 
              ...formData, 
              customerInfo: { ...formData.customerInfo, email: e.target.value } 
            })}
            className="w-full p-3 border border-amber-300 rounded-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-amber-900 mb-1">その他・ご要望</label>
          <textarea
            aria-label="その他・ご要望"
            value={formData.customerInfo.notes}
            onChange={(e) => setFormData({ 
              ...formData, 
              customerInfo: { ...formData.customerInfo, notes: e.target.value } 
            })}
            rows={4}
            className="w-full p-3 border border-amber-300 rounded-sm"
          />
        </div>

        {/* Terms and Conditions */}
        <div className="mt-6 border-t border-amber-200 pt-6">
          <label className="flex items-start space-x-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={formData.acceptedTerms}
              onChange={(e) => setFormData({ ...formData, acceptedTerms: e.target.checked })}
              className="mt-1 h-5 w-5 text-amber-800 focus:ring-amber-500 border-gray-300 rounded"
            />
            <div className="text-sm text-amber-900">
              <span className="font-bold">利用規約に同意する</span>
              <div className="mt-2 h-40 overflow-y-auto p-4 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 leading-relaxed font-mono">
                <p className="font-bold mb-2">【家財・不要物一括処分に関する利用規約】</p>
                <p className="mb-2">
                  本サービス「家全体の片付け（何も残さない）」をご利用いただくにあたり、お客様は室内にあるすべての家財、物品、不要物、家具、家電および設備等を「回収・処分の対象物」として扱うことに同意するものとします。
                </p>
                <p className="mb-2">
                  1. 当社は、以下を含むあらゆる処分方法を自社判断にて行う権限を有します（ただし、これに限定されません）。<br/>
                  ・回収<br/>
                  ・分別<br/>
                  ・運搬<br/>
                  ・リサイクル<br/>
                  ・法令に基づく適正処理施設での廃棄<br/>
                  ・法令遵守の上での焼却・処分
                </p>
                <p className="mb-2">
                  2. 作業開始後は、対象物はすべて「不要物」とみなされるため、お客様は一切の物品の返還を求めることはできません。
                </p>
                <p className="mb-2">
                  3. 作業開始前にお客様ご自身で保管されていない貴重品や私物の紛失について、当社は一切の責任を負いません。
                </p>
                <p className="mb-2">
                  4. 現金・貴金属・重要書類などの高価値品が発見された場合は、当社より速やかにお客様へご連絡いたします。ただし、これらの物品を事前に室内から取り出しておくことは、お客様の自己責任となります。
                </p>
                <p className="mb-2">
                  5. 当社は、すべての回収・処分作業において、日本国内の廃棄物処理法および各自治体のルールに従い、適切に対応いたします。
                </p>
                <p>
                  お客様は、予約申込を送信することにより、本規約の内容を理解し、同意したものとみなされます。
                </p>
              </div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );

  const isStepValid = () => {
    switch(step) {
      case 1: return !!formData.roomSize;
      case 2: return !!formData.trashLevel;
      case 3: return !!formData.truckType;
      case 4: {
        const isTimeValid = (() => {
          if (!formData.timeSlot) return false;
          if (['9:00-12:00', '13:00-17:00'].includes(formData.timeSlot)) return true;
          
          // Validate custom time (HH:mm) between 08:00 and 15:00
          if (!/^\d{2}:\d{2}$/.test(formData.timeSlot)) return false;
          const [hours, mins] = formData.timeSlot.split(':').map(Number);
          const totalMins = hours * 60 + mins;
          const minMins = 8 * 60; // 08:00
          const maxMins = 15 * 60; // 15:00
          return totalMins >= minMins && totalMins <= maxMins;
        })();

        return !!formData.date && isTimeValid && !!formData.address;
      }
      case 5: return !!formData.customerInfo.name && !!formData.customerInfo.phone && formData.acceptedTerms;
      default: return false;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Main Form Area */}
      <div className="flex-1 bg-white p-6 md:p-8 rounded-sm shadow-lg border border-amber-100">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}

        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-between pt-6 border-t border-amber-100">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className={`
              px-6 py-2 rounded-sm font-bold font-serif
              ${step === 1 
                ? 'text-gray-300 cursor-not-allowed' 
                : 'text-amber-900 border-2 border-amber-900 hover:bg-amber-50'}
            `}
          >
            戻る
          </button>
          
          {step < 5 ? (
            <button
              onClick={handleNext}
              disabled={!isStepValid()}
              className={`
                px-8 py-2 rounded-sm font-bold font-serif text-white shadow-md transition-all
                ${!isStepValid()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-amber-800 hover:bg-amber-700 hover:shadow-lg transform hover:-translate-y-0.5'}
              `}
            >
              次へ
            </button>
          ) : (
            <button
              onClick={async () => {
                if (!isStepValid() || isSubmitting) return;
                
                setIsSubmitting(true);
                try {
                  const totalPrice = calculateTotal();
                  const bookingData: BookingState = {
                    roomSize: formData.roomSize!,
                    trashLevel: formData.trashLevel!,
                    truckType: formData.truckType!,
                    date: formData.date!,
                    timeSlot: formData.timeSlot!,
                    address: formData.address,
                    hasElevator: formData.hasElevator,
                    images: formData.images,
                    customerInfo: formData.customerInfo,
                  };
                  
                  await bookingService.create(bookingData, totalPrice);
                  
                  toast.success('予約が正常に送信されました。確認メールをお送りしました。');
                  
                  // Navigate to profile bookings page after a short delay
                  setTimeout(() => {
                    navigate('/profile?tab=bookings');
                  }, 1500);
                } catch (error: any) {
                  console.error('Booking submission error:', error);
                  const errorMessage = error.response?.data?.booking_date?.[0] 
                    || error.response?.data?.error 
                    || error.message 
                    || '予約の送信に失敗しました。もう一度お試しください。';
                  toast.error(errorMessage);
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={!isStepValid() || isSubmitting}
              className={`
                px-8 py-2 rounded-sm font-bold font-serif text-white shadow-md transition-all
                ${!isStepValid() || isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-red-700 hover:bg-red-800 hover:shadow-lg transform hover:-translate-y-0.5'}
              `}
            >
              {isSubmitting ? '送信中...' : '見積もりを依頼する'}
            </button>
          )}
        </div>
      </div>

      {/* Summary / Price Card - Sticky on Desktop */}
      <div className="lg:w-80">
        <div className="sticky top-24 bg-amber-50 p-6 rounded-sm border-2 border-amber-200 shadow-[4px_4px_0px_0px_rgba(120,53,15,0.2)]">
          <div className="flex justify-center mb-4">
            <Logo size="md" />
          </div>
          <h4 className="text-lg font-bold text-amber-900 border-b-2 border-amber-800 pb-2 mb-4 font-serif text-center">
            見積もり内容
          </h4>
          
          <div className="space-y-4 text-sm font-mono">
            <div className="flex justify-between">
              <span className="text-amber-800">基本料金 ({formData.roomSize || '-'})</span>
              <span className="font-bold">{formatPrice(formData.roomSize ? ROOM_PRICES[formData.roomSize] : 0)}</span>
            </div>
            {formData.trashLevel && (
              <div className="flex justify-between">
                <span className="text-amber-800">ゴミ量オプション</span>
                <span className="font-bold">{formatPrice(TRASH_PRICES[formData.trashLevel])}</span>
              </div>
            )}
            {formData.truckType && (
              <div className="flex justify-between">
                <span className="text-amber-800">車両費 ({formData.truckType})</span>
                <span className="font-bold">{formatPrice(TRUCK_PRICES[formData.truckType])}</span>
              </div>
            )}
            {!formData.hasElevator && formData.roomSize && formData.roomSize !== 'house' && (
              <div className="flex justify-between text-amber-700">
                <span>エレベーターなし</span>
                <span>{formatPrice(ELEVATOR_FEE)}</span>
              </div>
            )}
            
            <div className="border-t-2 border-amber-800 pt-3 mt-4">
              <div className="flex justify-between items-end">
                <span className="font-bold text-amber-900">概算合計</span>
                <span className="text-2xl font-bold text-red-800 font-serif">
                  {formatPrice(calculateTotal())}
                </span>
              </div>
              <p className="text-xs text-amber-700 mt-2 text-right">※現地調査により変動する場合があります</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
