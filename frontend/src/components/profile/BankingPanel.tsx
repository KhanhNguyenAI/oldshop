import React, { useEffect, useState } from 'react';
import { paymentService } from '../../services/paymentService';
import type { PaymentMethod, PaymentBrand } from '../../types/auth';

type AddMethodType = 'card' | 'paypay';

export const BankingPanel: React.FC = () => {
  const [cards, setCards] = useState<PaymentMethod[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState(false);

  // Which method user is adding: VISA/card or PayPay
  const [activeAddMethod, setActiveAddMethod] = useState<AddMethodType>('card');
  const [showAddForm, setShowAddForm] = useState(false);

  // Card (VISA/Mastercard...) form
  const [cardForm, setCardForm] = useState({
    brand: 'visa' as PaymentBrand,
    card_number: '',
    cvc: '',
    expiry: '', // MM/YY
    card_holder_name: '',
  });

  // PayPay form
  const [paypayForm, setPaypayForm] = useState({
    accountId: '',
    nickname: '',
  });

  const loadCards = async () => {
    try {
      setIsLoadingCards(true);
      const data = await paymentService.list();
      setCards(data);
    } catch (error) {
      console.error('Failed to load cards', error);
    } finally {
      setIsLoadingCards(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, []);

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    const groups = digits.match(/.{1,4}/g);
    return groups ? groups.join(' ') : '';
  };

  const luhnCheck = (num: string) => {
    let sum = 0;
    let shouldDouble = false;
    for (let i = num.length - 1; i >= 0; i--) {
      let digit = parseInt(num[i], 10);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();

    const rawNumber = cardForm.card_number.replace(/\s/g, '');
    if (!/^\d{16}$/.test(rawNumber)) {
      alert('カード番号は16桁である必要があります。');
      return;
    }

    if (!luhnCheck(rawNumber)) {
      alert('カード番号が無効です（Luhnチェックに失敗しました）。');
      return;
    }

    if (cardForm.brand === 'visa' && !rawNumber.startsWith('4')) {
      alert('VISAカード番号は4で始まる必要があります。');
      return;
    }

    if (!/^\d{3}$/.test(cardForm.cvc)) {
      alert('CVCは3桁である必要があります。');
      return;
    }

    const expiryMatch = cardForm.expiry.match(/^(\d{2})\/(\d{2})$/);
    if (!expiryMatch) {
      alert('有効期限はMM/YY形式で入力してください。');
      return;
    }

    const month = Number(expiryMatch[1]);
    const year = Number(expiryMatch[2]);
    if (month < 1 || month > 12) {
      alert('有効期限の月は01から12の間である必要があります。');
      return;
    }

    const now = new Date();
    const currentYearYY = now.getFullYear() % 100;
    if (year < currentYearYY) {
      alert('有効期限の年が過去の日付です。');
      return;
    }

    const last4 = rawNumber.slice(-4);
    const fakeToken = 'demo_token';

    try {
      await paymentService.create({
        brand: cardForm.brand,
        last4,
        exp_month: month,
        exp_year: year,
        card_holder_name: cardForm.card_holder_name,
        gateway_payment_method_id: fakeToken,
        gateway: 'manual',
      });
      setCardForm({
        brand: 'visa',
        card_number: '',
        cvc: '',
        expiry: '',
        card_holder_name: '',
      });
      setShowAddForm(false);
      await loadCards();
      alert('カードが正常に保存されました。');
    } catch (error) {
      console.error(error);
      alert('カードの保存に失敗しました。');
    }
  };

  const handleDeleteCard = async (id: number) => {
    if (!window.confirm('このカードを削除しますか？')) return;
    try {
      await paymentService.delete(id);
      await loadCards();
    } catch (error) {
      console.error(error);
      alert('カードの削除に失敗しました。');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <h3 className="text-2xl font-serif font-bold text-amber-900 border-b-2 border-amber-200 pb-2">
        決済方法
      </h3>
      <p className="text-gray-500 italic font-serif">
        VISA/MastercardまたはPayPayの情報を安全に保存できます。システムはメタデータ（下4桁、有効期限、デモトークン）のみを保持します。完全なカード番号やCVCは保存されません。
      </p>

      {/* Danh sách thẻ */}
      <div className="space-y-4">
        {isLoadingCards ? (
          <p className="text-sm text-gray-500 font-serif">カードを読み込み中...</p>
        ) : cards.length === 0 ? (
          <p className="text-sm text-gray-500 font-serif">保存されたカードがありません。</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {cards.map((card) => (
              <div
                key={card.id}
                className="relative rounded-2xl overflow-hidden shadow-md bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 p-4 text-white"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-xs uppercase tracking-[0.2em] font-semibold bg-white/10 px-2 py-1 rounded-full">
                      {card.gateway === 'paypay' ? 'PayPay' : card.brand_display}
                    </span>
                    {card.is_default && (
                      <span className="ml-2 text-[0.65rem] uppercase tracking-[0.18em] bg-emerald-400/90 text-emerald-950 px-2 py-0.5 rounded-full font-semibold">
                        デフォルト
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteCard(card.id)}
                    className="text-xs text-white/70 hover:text-red-200 transition-colors"
                  >
                    削除
                  </button>
                </div>

                <div className="space-y-2 font-mono">
                  {card.gateway === 'paypay' ? (
                    <div className="text-sm text-white/90 select-none">PayPayアカウント</div>
                  ) : (
                    <div className="text-sm tracking-[0.25em] text-white/90 select-none">
                      •••• •••• •••• {card.last4}
                    </div>
                  )}
                  <div className="flex justify-between items-end text-xs text-white/80">
                    <div>
                      <span className="block text-[0.6rem] uppercase tracking-[0.2em] text-white/60">
                        {card.gateway === 'paypay' ? 'アカウント名' : 'カード名義人'}
                      </span>
                      <span className="block mt-0.5 font-semibold tracking-wider">
                        {card.card_holder_name || '—'}
                      </span>
                    </div>
                    {card.gateway !== 'paypay' && (
                      <div className="text-right">
                        <span className="block text-[0.6rem] uppercase tracking-[0.2em] text-white/60">有効期限</span>
                        <span className="block mt-0.5 font-semibold tracking-wider">
                          {String(card.exp_month).padStart(2, '0')}/{String(card.exp_year).padStart(2, '0')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!showAddForm ? (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="px-5 py-3 border-2 border-dashed border-amber-300 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 font-serif font-bold transition-colors"
        >
          + 決済方法を追加
        </button>
      ) : (
        <div className="mt-6 max-w-xl border border-amber-200 rounded-lg p-4 bg-amber-50/60">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-serif font-bold text-amber-900 mb-3 uppercase tracking-[0.2em]">
              決済方法を追加
            </h4>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setCardForm({
                  brand: 'visa',
                  card_number: '',
                  cvc: '',
                  expiry: '',
                  card_holder_name: '',
                });
                setPaypayForm({ accountId: '', nickname: '' });
              }}
              className="text-xs font-serif uppercase tracking-[0.2em] text-amber-800 hover:text-red-600"
            >
              キャンセル
            </button>
          </div>

          {/* Chọn loại method: Card (VISA, Mastercard...) hoặc PayPay */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setActiveAddMethod('card')}
              className={`px-3 py-1.5 text-xs font-serif font-bold uppercase tracking-[0.15em] rounded-sm border ${
                activeAddMethod === 'card'
                  ? 'bg-amber-800 text-amber-50 border-amber-900'
                  : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
              }`}
            >
              カード（VISA / Mastercard）
            </button>
            <button
              type="button"
              onClick={() => setActiveAddMethod('paypay')}
              className={`px-3 py-1.5 text-xs font-serif font-bold uppercase tracking-[0.15em] rounded-sm border ${
                activeAddMethod === 'paypay'
                  ? 'bg-amber-800 text-amber-50 border-amber-900'
                  : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
              }`}
            >
              PayPay
            </button>
          </div>

          {activeAddMethod === 'card' && (
          <form onSubmit={handleAddCard} className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="block text-xs font-serif font-semibold text-amber-900 mb-1">
              決済方法（ブランド）
            </label>
            <select
              value={cardForm.brand}
              onChange={(e) => setCardForm({ ...cardForm, brand: e.target.value as PaymentBrand })}
              className="w-full p-2 text-sm border border-amber-300 rounded bg-white"
            >
              <option value="visa">VISAカード</option>
              <option value="mastercard">Mastercard</option>
              <option value="jcb">JCB</option>
              <option value="amex">American Express</option>
              <option value="other">その他</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-serif font-semibold text-amber-900 mb-1">カード番号</label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="cc-number"
              value={cardForm.card_number}
              onChange={(e) =>
                setCardForm({
                  ...cardForm,
                  card_number: formatCardNumber(e.target.value),
                })
              }
              className="w-full p-2 text-sm border border-amber-300 rounded bg-white"
              placeholder="4242 4242 4242 4242"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-serif font-semibold text-amber-900 mb-1">有効期限（MM/YY）</label>
            <input
              type="text"
              inputMode="numeric"
              value={cardForm.expiry}
              onChange={(e) =>
                setCardForm({
                  ...cardForm,
                  expiry: e.target.value.replace(/[^\d/]/g, '').slice(0, 5),
                })
              }
              className="w-full p-2 text-sm border border-amber-300 rounded bg-white"
              placeholder="01/30"
              required
            />
          </div>

          <div className="flex flex-col md:flex-row md:items-end gap-3 md:col-span-2">
            <div className="flex-1">
              <label className="block text-xs font-serif font-semibold text-amber-900 mb-1">カード名義人</label>
              <input
                type="text"
                value={cardForm.card_holder_name}
                onChange={(e) => setCardForm({ ...cardForm, card_holder_name: e.target.value })}
                className="w-full p-2 text-sm border border-amber-300 rounded bg-white"
                placeholder="山田 太郎"
                required
              />
            </div>
            <div className="w-28">
              <label className="block text-xs font-serif font-semibold text-amber-900 mb-1">CVC</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={3}
                value={cardForm.cvc}
                onChange={(e) => setCardForm({ ...cardForm, cvc: e.target.value.replace(/\D/g, '').slice(0, 3) })}
                className="w-full p-2 text-sm border border-amber-300 rounded bg-white"
                placeholder="123"
                required
              />
            </div>
          </div>

          <div className="md:col-span-2 pt-1">
            <button
              type="submit"
              className="px-5 py-2 bg-amber-800 text-amber-50 text-xs font-serif font-bold uppercase tracking-[0.2em] rounded shadow hover:bg-amber-700 transition-colors"
            >
              カードを保存
            </button>
          </div>
          </form>
          )}

          {activeAddMethod === 'paypay' && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!paypayForm.accountId) {
                alert('PayPay ID / 電話番号が必要です。');
                return;
              }

              const now = new Date();
              const currentYearYY = now.getFullYear() % 100;
              const expYear = currentYearYY + 5;

              try {
                await paymentService.create({
                  brand: 'other',
                  last4: '0000',
                  exp_month: 1,
                  exp_year: expYear,
                  card_holder_name: paypayForm.nickname || 'PayPay',
                  gateway_payment_method_id: `paypay_${paypayForm.accountId}`,
                  gateway: 'paypay',
                });
                setPaypayForm({ accountId: '', nickname: '' });
                await loadCards();
                alert('PayPay決済方法が正常に保存されました。');
                setShowAddForm(false);
              } catch (error) {
                console.error(error);
                alert('PayPay決済方法の保存に失敗しました。');
              }
            }}
            className="grid gap-3"
          >
            <div>
              <label className="block text-xs font-serif font-semibold text-amber-900 mb-1">
                PayPay ID / 電話番号
              </label>
              <input
                type="text"
                value={paypayForm.accountId}
                onChange={(e) => setPaypayForm({ ...paypayForm, accountId: e.target.value })}
                className="w-full p-2 text-sm border border-amber-300 rounded bg-white"
                placeholder="PayPay IDまたは電話番号"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-serif font-semibold text-amber-900 mb-1">
                ニックネーム（任意）
              </label>
              <input
                type="text"
                value={paypayForm.nickname}
                onChange={(e) => setPaypayForm({ ...paypayForm, nickname: e.target.value })}
                className="w-full p-2 text-sm border border-amber-300 rounded bg-white"
                placeholder="マイPayPay"
              />
            </div>

            <p className="text-[0.7rem] text-amber-700 font-serif">
              これはデモ方法です：システムはPayPay IDを`paypay_...`形式のトークンとしてのみ保存し、機密データは保存しません。
            </p>

            <div className="pt-1">
              <button
                type="submit"
                className="px-5 py-2 bg-amber-800 text-amber-50 text-xs font-serif font-bold uppercase tracking-[0.2em] rounded shadow hover:bg-amber-700 transition-colors"
              >
                PayPay決済方法を保存
              </button>
            </div>
          </form>
          )}
        </div>
      )}
    </div>
  );
};


