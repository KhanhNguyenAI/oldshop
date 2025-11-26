import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/Header';
import toast from 'react-hot-toast';
import { addressService } from '../services/addressService';
import { orderService } from '../services/orderService';
import { paymentService } from '../services/paymentService';
import { lookupAddressByPostalCode } from '../services/japanPostalCodeService';
import { CouponSelector } from '../components/shop/CouponSelector';
import type { Address } from '../types/auth';
import type { PaymentMethod } from '../types/payment';

export const CheckoutPage: React.FC = () => {
  const { items, totalPrice, clearCart, subtotal, discountAmount, appliedCoupon, applyCoupon, removeCoupon } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | 'new'>('new');

  // Payment State
  const [savedCards, setSavedCards] = useState<PaymentMethod[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<number | 'new' | null>(null);
  const [showAddCardForm, setShowAddCardForm] = useState(false);
  const [newCardData, setNewCardData] = useState({
      cardNumber: '', // only for mock, we'll extract last4
      expiry: '', // MM/YY
      cardHolder: '',
      brand: 'visa'
  });

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [showCouponSelector, setShowCouponSelector] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    postalCode: '',
    prefecture: '',
    city: '',
    district: '', 
    address: '', 
    paymentMethod: 'cod'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-lookup address when postal code is complete (7 digits)
  useEffect(() => {
      const lookupAddress = async () => {
          if (!formData.postalCode) return;
          
          const rawPostal = formData.postalCode.replace(/\D/g, '');
          if (rawPostal.length === 7) {
              const result = await lookupAddressByPostalCode(formData.postalCode);
              if (result) {
                  setFormData(prev => ({
                      ...prev,
                      prefecture: result.prefecture,
                      city: result.city, 
                      district: result.district 
                  }));
                  toast.success('住所を自動入力しました');
              }
          }
      };
      
      const timer = setTimeout(lookupAddress, 500);
      return () => clearTimeout(timer);
  }, [formData.postalCode]);

  useEffect(() => {
    if (user) {
        addressService.list().then(addresses => {
            setSavedAddresses(addresses);
            if (addresses.length > 0) {
                // Select default or first address automatically
                const defaultAddr = addresses.find(a => a.is_default) || addresses[0];
                setSelectedAddressId(defaultAddr.id);
                fillFormWithAddress(defaultAddr);
            }
        }).catch(err => console.error("Failed to load addresses", err));
    }
  }, [user]);

  // Fetch cards when Credit Card is selected
  useEffect(() => {
      if (user && formData.paymentMethod === 'credit_card') {
          paymentService.list().then(cards => {
              setSavedCards(cards);
              if (cards.length > 0) {
                  const defaultCard = cards.find(c => c.is_default) || cards[0];
                  setSelectedCardId(defaultCard.id);
              } else {
                  setShowAddCardForm(true);
              }
          }).catch(err => console.error("Failed to load cards", err));
      }
  }, [user, formData.paymentMethod]);

  const handleAddNewCard = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          const last4 = newCardData.cardNumber.slice(-4);
          const [expMonth, expYear] = newCardData.expiry.split('/').map(Number);
          
          if (!last4 || last4.length !== 4) throw new Error("カード番号が無効です");
          if (!expMonth || !expYear) throw new Error("有効期限が無効です");

          const newCard = await paymentService.create({
              brand: newCardData.brand,
              last4: last4,
              exp_month: expMonth,
              exp_year: 2000 + expYear,
              card_holder_name: newCardData.cardHolder,
              gateway_payment_method_id: `tok_${Math.random().toString(36).substr(2, 9)}`,
          });

          setSavedCards(prev => [newCard, ...prev]);
          setSelectedCardId(newCard.id);
          setShowAddCardForm(false);
          setNewCardData({ cardNumber: '', expiry: '', cardHolder: '', brand: 'visa' });
          toast.success('カードを追加しました');
      } catch (error: unknown) {
          const err = error as Error;
          toast.error(err.message || 'カードの追加に失敗しました');
      }
  };

  const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        setApplyingCoupon(true);
        await applyCoupon(couponCode);
        setApplyingCoupon(false);
        setCouponCode('');
  };

  const fillFormWithAddress = (addr: Address) => {
      const names = addr.recipient.split(' ');
      const lastName = names[0] || '';
      const firstName = names.slice(1).join(' ') || '';

      setFormData(prev => ({
          ...prev,
          firstName: firstName, 
          lastName: lastName,
          phone: addr.phone || '',
          postalCode: addr.postal_code,
          prefecture: addr.prefecture,
          city: addr.city,
          district: addr.district || '',
          address: addr.building || '',
      }));
  };

  const handleAddressSelection = (id: number | 'new') => {
      setSelectedAddressId(id);
      if (id === 'new') {
          setFormData(prev => ({
              ...prev,
              firstName: '', lastName: '', phone: '', postalCode: '', prefecture: '', city: '', district: '', address: ''
          }));
      } else {
          const addr = savedAddresses.find(a => a.id === id);
          if (addr) fillFormWithAddress(addr);
      }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col">
         <Header />
         <div className="flex-grow flex flex-col items-center justify-center p-4">
            <span className="text-6xl mb-4">🛒</span>
            <h2 className="text-2xl font-serif font-bold text-stone-900 mb-2">カートは空です</h2>
            <Link to="/shop" className="text-amber-600 hover:underline">
                買い物を続ける
            </Link>
         </div>
      </div>
    );
  }

  if (!user) {
      return (
        <div className="min-h-screen bg-stone-50 pb-20">
            <Header />
            <div className="max-w-4xl mx-auto px-4 py-16">
                <div className="bg-white p-8 rounded-xl shadow-md border border-stone-200 text-center">
                    <span className="text-5xl block mb-6">🔒</span>
                    <h2 className="text-2xl font-serif font-bold text-stone-900 mb-4">ログインが必要です</h2>
                    <p className="text-stone-600 mb-8">
                        注文手続きに進むには、ログインまたは新規登録が必要です。<br/>
                        会員登録をすると、注文履歴の確認や住所の保存が可能になります。
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link 
                            to="/login" 
                            state={{ from: '/checkout' }} 
                            className="px-8 py-3 bg-amber-900 text-white rounded-lg font-bold hover:bg-amber-800 transition-colors"
                        >
                            ログイン
                        </Link>
                        <Link 
                            to="/register" 
                            state={{ from: '/checkout' }}
                            className="px-8 py-3 border-2 border-amber-900 text-amber-900 rounded-lg font-bold hover:bg-amber-50 transition-colors"
                        >
                            新規登録
                        </Link>
                    </div>
                </div>
            </div>
        </div>
      );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'postalCode') {
        const digits = value.replace(/\D/g, '');
        let formatted = digits;
        if (digits.length > 3) {
            formatted = `${digits.slice(0, 3)}-${digits.slice(3, 7)}`;
        }
        setFormData(prev => ({ ...prev, [name]: formatted }));
        return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Shipping calculation
  const shippingCost = totalPrice >= 10000 ? 0 : 800;
  const finalTotal = totalPrice + shippingCost; // totalPrice in context already includes discount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (formData.paymentMethod === 'credit_card' && !selectedCardId) {
          toast.error('クレジットカードを選択してください');
          setIsSubmitting(false);
          return;
      }

      const full_name = formData.lastName + ' ' + formData.firstName;

      if (selectedAddressId === 'new') {
          try {
              await addressService.create({
                  recipient: full_name.trim(),
                  postal_code: formData.postalCode,
                  prefecture: formData.prefecture,
                  city: formData.city,
                  district: formData.district,
                  building: formData.address,
                  phone: formData.phone,
                  is_default: false 
              });
              toast.success('新しい住所を保存しました');
          } catch (error) {
              console.error('Failed to save address:', error);
              toast.error('住所の保存に失敗しましたが、注文は続行します');
          }
      }

      const orderCity = `${formData.prefecture}${formData.city}${formData.district}`;
      const orderAddress = formData.address; 

      const orderData = {
          full_name: full_name.trim(),
          email: formData.email,
          phone: formData.phone,
          address: orderAddress,
          postal_code: formData.postalCode,
          city: orderCity,
          total_amount: finalTotal.toString(), 
          payment_method: formData.paymentMethod,
          items_data: items.map(item => ({
              product: item.product.id,
              quantity: item.quantity,
              price: (item.product.sale_price || item.product.price).toString()
          })),
          coupon_code: appliedCoupon ? appliedCoupon.code : null
      };

      await orderService.create(orderData);

      toast.success('注文が完了しました！');
      clearCart();
      navigate('/order-success');
      
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('注文処理に失敗しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-serif font-bold text-stone-900 mb-8 flex items-center gap-3">
          <span>🧾</span> チェックアウト
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Form */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* 1. Shipping Information */}
            <section className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
              <h2 className="text-xl font-serif font-bold text-stone-800 mb-6 flex items-center gap-2 border-b border-stone-100 pb-3">
                <span className="bg-stone-800 text-stone-50 w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
                お届け先情報
              </h2>

              {/* Saved Addresses Selector */}
              {user && savedAddresses.length > 0 && (
                  <div className="mb-8 space-y-3">
                      <p className="text-sm font-medium text-stone-700 mb-2">保存済みの住所から選択:</p>
                      {savedAddresses.map(addr => (
                          <label key={addr.id} className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${selectedAddressId === addr.id ? 'border-amber-500 bg-amber-50 ring-1 ring-amber-500' : 'border-stone-200 hover:bg-stone-50'}`}>
                              <input 
                                type="radio" 
                                name="addressSelection"
                                checked={selectedAddressId === addr.id}
                                onChange={() => handleAddressSelection(addr.id)}
                                className="mt-1 h-4 w-4 text-amber-600 border-gray-300 focus:ring-amber-500"
                              />
                              <div className="ml-3 text-sm">
                                  <div className="font-medium text-stone-900">{addr.recipient} <span className="text-stone-500 font-normal">({addr.phone})</span></div>
                                  <div className="text-stone-500 mt-1">
                                      〒{addr.postal_code} {addr.prefecture}{addr.city}{addr.district} {addr.building}
                                  </div>
                              </div>
                          </label>
                      ))}
                      <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${selectedAddressId === 'new' ? 'border-amber-500 bg-amber-50 ring-1 ring-amber-500' : 'border-stone-200 hover:bg-stone-50'}`}>
                          <input 
                            type="radio" 
                            name="addressSelection"
                            checked={selectedAddressId === 'new'}
                            onChange={() => handleAddressSelection('new')}
                            className="h-4 w-4 text-amber-600 border-gray-300 focus:ring-amber-500"
                          />
                          <span className="ml-3 text-sm font-medium text-stone-900">新しい住所を入力する</span>
                      </label>
                  </div>
              )}

              <form id="checkout-form" onSubmit={handleSubmit} className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${selectedAddressId !== 'new' ? 'opacity-50 pointer-events-none' : ''}`}>
                 <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-stone-700 mb-1">姓 (Last Name) *</label>
                    <input 
                        id="lastName"
                        type="text" 
                        name="lastName"
                        required={selectedAddressId === 'new'}
                        className="w-full rounded-md border-stone-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                        placeholder="山田"
                        value={formData.lastName}
                        onChange={handleInputChange}
                    />
                 </div>
                 <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-stone-700 mb-1">名 (First Name) *</label>
                    <input 
                        id="firstName"
                        type="text" 
                        name="firstName"
                        required={selectedAddressId === 'new'}
                        className="w-full rounded-md border-stone-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                        placeholder="太郎"
                        value={formData.firstName}
                        onChange={handleInputChange}
                    />
                 </div>

                 <div className="md:col-span-2">
                    <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-1">メールアドレス *</label>
                    <input 
                        id="email"
                        type="email" 
                        name="email"
                        required={selectedAddressId === 'new'}
                        className="w-full rounded-md border-stone-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                        value={formData.email}
                        onChange={handleInputChange}
                    />
                 </div>
                 
                 <div className="md:col-span-2">
                    <label htmlFor="phone" className="block text-sm font-medium text-stone-700 mb-1">電話番号 *</label>
                    <input 
                        id="phone"
                        type="tel" 
                        name="phone"
                        required={selectedAddressId === 'new'}
                        className="w-full rounded-md border-stone-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                        placeholder="090-1234-5678"
                        value={formData.phone}
                        onChange={handleInputChange}
                    />
                 </div>

                 <div className="md:col-span-2 grid grid-cols-3 gap-4">
                     <div>
                        <label htmlFor="postalCode" className="block text-sm font-medium text-stone-700 mb-1">郵便番号 *</label>
                        <input 
                            id="postalCode"
                            type="text" 
                            name="postalCode"
                            required={selectedAddressId === 'new'}
                            className="w-full rounded-md border-stone-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                            placeholder="123-4567"
                            value={formData.postalCode}
                            onChange={handleInputChange}
                        />
                     </div>
                     <div className="col-span-2">
                        <label htmlFor="prefecture" className="block text-sm font-medium text-stone-700 mb-1">都道府県 *</label>
                        <input 
                            id="prefecture"
                            type="text" 
                            name="prefecture"
                            required={selectedAddressId === 'new'}
                            className="w-full rounded-md border-stone-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                            placeholder="東京都"
                            value={formData.prefecture}
                            onChange={handleInputChange}
                        />
                     </div>
                 </div>

                 <div className="md:col-span-2">
                    <label htmlFor="city" className="block text-sm font-medium text-stone-700 mb-1">市区町村 (City) *</label>
                    <input 
                        id="city"
                        type="text" 
                        name="city"
                        required={selectedAddressId === 'new'}
                        className="w-full rounded-md border-stone-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                        placeholder="新宿区"
                        value={formData.city}
                        onChange={handleInputChange}
                    />
                 </div>

                 <div className="md:col-span-2">
                    <label htmlFor="district" className="block text-sm font-medium text-stone-700 mb-1">町名・番地 (District/Block) *</label>
                    <input 
                        id="district"
                        type="text" 
                        name="district"
                        required={selectedAddressId === 'new'}
                        className="w-full rounded-md border-stone-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                        placeholder="西新宿1-1-1"
                        value={formData.district}
                        onChange={handleInputChange}
                    />
                 </div>

                 <div className="md:col-span-2">
                    <label htmlFor="address" className="block text-sm font-medium text-stone-700 mb-1">建物名・部屋番号</label>
                    <input 
                        id="address"
                        type="text" 
                        name="address"
                        className="w-full rounded-md border-stone-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                        placeholder="OldShopビル 101"
                        value={formData.address}
                        onChange={handleInputChange}
                    />
                 </div>
              </form>
            </section>

            {/* 2. Payment Method */}
            <section className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
              <h2 className="text-xl font-serif font-bold text-stone-800 mb-6 flex items-center gap-2 border-b border-stone-100 pb-3">
                <span className="bg-stone-800 text-stone-50 w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
                お支払い方法
              </h2>

              <div className="space-y-4">
                  <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${formData.paymentMethod === 'cod' ? 'border-amber-500 bg-amber-50' : 'border-stone-200 hover:bg-stone-50'}`}>
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        value="cod" 
                        checked={formData.paymentMethod === 'cod'}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300"
                      />
                      <span className="ml-3 flex-1">
                          <span className="block text-sm font-medium text-gray-900">代金引換 (Cash on Delivery)</span>
                          <span className="block text-sm text-gray-500">手数料: 無料 (キャンペーン中)</span>
                      </span>
                      <span className="text-2xl">🚚</span>
                  </label>

                  <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${formData.paymentMethod === 'credit_card' ? 'border-amber-500 bg-amber-50' : 'border-stone-200 hover:bg-stone-50'}`}>
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        value="credit_card" 
                        checked={formData.paymentMethod === 'credit_card'}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300"
                      />
                      <span className="ml-3 flex-1">
                          <span className="block text-sm font-medium text-gray-900">クレジットカード</span>
                          <span className="block text-sm text-gray-500">Visa, Mastercard, JCB, Amex</span>
                      </span>
                      <span className="text-2xl">💳</span>
                  </label>

                  {/* Saved Cards List */}
                  {formData.paymentMethod === 'credit_card' && (
                      <div className="ml-8 mt-4 space-y-4 border-l-2 border-stone-200 pl-4">
                          {savedCards.map(card => (
                              <label key={card.id} className="flex items-center gap-3 cursor-pointer group">
                                  <input 
                                      type="radio" 
                                      name="cardSelection"
                                      checked={selectedCardId === card.id}
                                      onChange={() => setSelectedCardId(card.id)}
                                      className="text-amber-600 focus:ring-amber-500"
                                  />
                                  <div className="flex items-center gap-2 p-2 rounded-lg border border-stone-200 bg-white group-hover:border-amber-400 transition-colors w-full">
                                      <span className="font-bold text-xs uppercase bg-stone-100 px-2 py-1 rounded">{card.brand}</span>
                                      <span className="text-sm font-mono">•••• {card.last4}</span>
                                      <span className="text-xs text-stone-500 ml-auto">Exp: {card.exp_month}/{card.exp_year}</span>
                                  </div>
                              </label>
                          ))}
                          
                          {!showAddCardForm ? (
                              <button 
                                  type="button"
                                  onClick={() => setShowAddCardForm(true)}
                                  className="text-sm text-amber-600 font-medium hover:underline flex items-center gap-1"
                              >
                                  + 新しいカードを追加
                              </button>
                          ) : (
                              <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 animate-fadeIn">
                                  <h4 className="text-sm font-bold text-stone-700 mb-3">新しいカード情報</h4>
                                  <div className="space-y-3">
                                      <input 
                                          type="text" 
                                          placeholder="カード番号 (例: 4242...)" 
                                          className="w-full text-sm rounded border-stone-300"
                                          value={newCardData.cardNumber}
                                          onChange={e => setNewCardData({...newCardData, cardNumber: e.target.value})}
                                      />
                                      <div className="flex gap-2">
                                          <input 
                                              type="text" 
                                              placeholder="MM/YY" 
                                              className="w-1/3 text-sm rounded border-stone-300"
                                              value={newCardData.expiry}
                                              onChange={e => setNewCardData({...newCardData, expiry: e.target.value})}
                                          />
                                          <input 
                                              type="text" 
                                              placeholder="カード名義人" 
                                              className="flex-1 text-sm rounded border-stone-300"
                                              value={newCardData.cardHolder}
                                              onChange={e => setNewCardData({...newCardData, cardHolder: e.target.value})}
                                          />
                                      </div>
                                      <select 
                                          title="Card Brand"
                                          className="w-full text-sm rounded border-stone-300"
                                          value={newCardData.brand}
                                          onChange={e => setNewCardData({...newCardData, brand: e.target.value})}
                                      >
                                          <option value="visa">Visa</option>
                                          <option value="jcb">JCB</option>
                                          <option value="amex">Amex</option>
                                          <option value="mastercard">Mastercard</option>
                                      </select>
                                      <div className="flex gap-2 pt-2">
                                          <button 
                                              type="button" 
                                              onClick={handleAddNewCard}
                                              className="px-3 py-1 bg-amber-600 text-white text-xs rounded hover:bg-amber-700"
                                          >
                                              追加する
                                          </button>
                                          <button 
                                              type="button" 
                                              onClick={() => setShowAddCardForm(false)}
                                              className="px-3 py-1 bg-stone-200 text-stone-700 text-xs rounded hover:bg-stone-300"
                                          >
                                              キャンセル
                                          </button>
                                      </div>
                                  </div>
                              </div>
                          )}
                      </div>
                  )}

                  <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${formData.paymentMethod === 'bank_transfer' ? 'border-amber-500 bg-amber-50' : 'border-stone-200 hover:bg-stone-50'}`}>
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        value="bank_transfer" 
                        checked={formData.paymentMethod === 'bank_transfer'}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300"
                      />
                      <span className="ml-3 flex-1">
                          <span className="block text-sm font-medium text-gray-900">銀行振込</span>
                          <span className="block text-sm text-gray-500">ご入金確認後の発送となります</span>
                      </span>
                      <span className="text-2xl">🏦</span>
                  </label>
              </div>
            </section>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-4">
             <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-lg sticky top-8">
                <h3 className="text-lg font-serif font-bold text-stone-900 mb-4">注文内容</h3>
                
                {/* Items List */}
                <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2">
                    {items.map(item => (
                        <div key={item.product.id} className="flex gap-3">
                            <div className="w-16 h-16 bg-stone-100 rounded border border-stone-200 overflow-hidden flex-shrink-0">
                                {item.product.image ? (
                                    <img src={item.product.image} alt={item.product.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-stone-300 text-xs">No Img</div>
                                )}
                            </div>
                            <div className="flex-1 text-sm">
                                <p className="font-medium text-stone-900 line-clamp-2">{item.product.title}</p>
                                <p className="text-stone-500">数量: {item.quantity}</p>
                                <div className="flex flex-col items-start mt-1">
                                    {item.product.sale_price ? (
                                        <>
                                            <span className="text-xs text-stone-400 line-through">
                                                {formatPrice(parseFloat(item.product.price) * item.quantity)}
                                            </span>
                                            <span className="font-bold text-red-600">
                                                {formatPrice(item.product.sale_price * item.quantity)}
                                            </span>
                                        </>
                                    ) : (
                                        <span className="font-bold text-amber-700">
                                            {formatPrice(parseFloat(item.product.price) * item.quantity)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Coupon Section */}
                <div className="mb-4 pt-4 border-t border-stone-100">
                    {appliedCoupon ? (
                         <div className="flex items-center justify-between bg-green-50 p-2 rounded border border-green-200">
                             <div className="text-sm">
                                 <span className="text-green-700 font-bold block">クーポン適用中</span>
                                 <span className="text-green-600">{appliedCoupon.code}</span>
                             </div>
                             <button onClick={removeCoupon} className="text-xs text-red-500 hover:underline bg-white px-2 py-1 rounded border border-red-200">削除</button>
                         </div>
                    ) : (
                        <div className="flex gap-2 relative">
                            <input 
                                type="text" 
                                placeholder="クーポンコード" 
                                className="flex-1 px-3 py-2 text-sm border border-stone-300 rounded focus:ring-1 focus:ring-amber-500 outline-none"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value)}
                            />
                            <button 
                                type="button"
                                onClick={() => setShowCouponSelector(!showCouponSelector)}
                                className="px-3 bg-stone-100 text-stone-600 border border-stone-300 rounded hover:bg-stone-200"
                                title="保存済みクーポンから選択"
                            >
                                🎟️
                            </button>
                            <button 
                                type="button"
                                onClick={handleApplyCoupon}
                                disabled={applyingCoupon || !couponCode.trim()}
                                className="px-4 py-2 bg-stone-800 text-white text-sm rounded hover:bg-stone-700 disabled:opacity-50"
                            >
                                適用
                            </button>

                            {showCouponSelector && (
                                <CouponSelector 
                                    onSelect={(code) => {
                                        setCouponCode(code);
                                        setShowCouponSelector(false);
                                    }} 
                                    onCancel={() => setShowCouponSelector(false)} 
                                />
                            )}
                        </div>
                    )}
                </div>

                <div className="border-t border-stone-100 pt-4 space-y-2 text-sm">
                    <div className="flex justify-between text-stone-600">
                        <span>小計</span>
                        <span>{formatPrice(subtotal)}</span>
                    </div>
                    {appliedCoupon && (
                        <div className="flex justify-between text-green-600 font-medium">
                            <span>割引</span>
                            <span>-{formatPrice(discountAmount)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-stone-600">
                        <span>配送料</span>
                        <span>{shippingCost === 0 ? '無料' : formatPrice(shippingCost)}</span>
                    </div>
                </div>

                <div className="border-t border-stone-200 mt-4 pt-4 mb-6">
                    <div className="flex justify-between text-xl font-bold text-stone-900">
                        <span>合計</span>
                        <span>{formatPrice(finalTotal)}</span>
                    </div>
                    <p className="text-xs text-right text-stone-500 mt-1">税込</p>
                </div>

                <button 
                    type="submit" 
                    form="checkout-form"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-amber-600 text-white rounded-lg font-bold text-lg hover:bg-amber-700 shadow-lg shadow-amber-200 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                        <>
                            <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                            処理中...
                        </>
                    ) : (
                        '注文を確定する'
                    )}
                </button>
                
                <p className="text-xs text-stone-400 text-center mt-4">
                    注文を確定することで、利用規約とプライバシーポリシーに同意したことになります。
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
