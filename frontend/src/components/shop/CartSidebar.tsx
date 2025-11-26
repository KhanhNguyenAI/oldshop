import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { CouponSelector } from './CouponSelector';

export const CartSidebar: React.FC = () => {
  const { 
    items, isOpen, closeCart, removeFromCart, updateQuantity, 
    subtotal, discountAmount, totalPrice, appliedCoupon, applyCoupon, removeCoupon 
  } = useCart();
  
  const [couponCode, setCouponCode] = useState('');
  const [applying, setApplying] = useState(false);
  const [showSelector, setShowSelector] = useState(false);

  if (!isOpen) return null;

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(numPrice);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplying(true);
    await applyCoupon(couponCode);
    setApplying(false);
    setCouponCode('');
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-[60] transition-opacity"
        onClick={closeCart}
      />

      {/* Sidebar */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-stone-50 shadow-2xl z-[70] transform transition-transform duration-300 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-200 bg-white">
          <h2 className="text-xl font-serif font-bold text-stone-900 flex items-center gap-2">
            <span>🛒</span> ショッピングカート
          </h2>
          <button 
            onClick={closeCart}
            className="p-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-stone-400 space-y-4">
              <span className="text-6xl">🛍️</span>
              <p>カートに商品がありません</p>
              <button 
                onClick={closeCart}
                className="text-amber-600 font-bold hover:underline"
              >
                買い物を続ける
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.product.id} className="flex gap-4 bg-white p-3 rounded-lg border border-stone-100 shadow-sm">
                {/* Image */}
                <div className="w-20 h-20 bg-stone-100 rounded-md overflow-hidden flex-shrink-0 border border-stone-200">
                  {item.product.image ? (
                    <img 
                      src={item.product.image} 
                      alt={item.product.title} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                     <div className="w-full h-full flex items-center justify-center text-stone-300">📷</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-medium text-stone-900 text-sm line-clamp-2 mb-1">
                      {item.product.title}
                    </h3>
                    <p className="text-amber-700 font-bold text-sm">
                        {item.product.sale_price ? (
                            <>
                                <span className="text-red-600 mr-2">{formatPrice(item.product.sale_price)}</span>
                                <span className="text-stone-400 line-through text-xs">{formatPrice(item.product.price)}</span>
                            </>
                        ) : (
                            formatPrice(item.product.price)
                        )}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-3 bg-stone-50 rounded-lg px-2 py-1 border border-stone-200">
                      <button 
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center text-stone-500 hover:text-stone-800 disabled:opacity-30"
                        disabled={item.quantity <= 1}
                      >
                        -
                      </button>
                      <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center text-stone-500 hover:text-stone-800"
                        // Add stock check here if needed
                      >
                        +
                      </button>
                    </div>

                    <button 
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-xs text-red-500 hover:text-red-700 underline"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 bg-white border-t border-stone-200 space-y-4">
            
            {/* Coupon Section */}
            <div className="bg-stone-50 p-3 rounded-lg border border-stone-200">
                {appliedCoupon ? (
                    <div className="flex items-center justify-between">
                         <div className="text-sm">
                             <span className="text-green-600 font-bold block">クーポン適用中</span>
                             <span className="text-stone-600">{appliedCoupon.code} ({appliedCoupon.display_text})</span>
                         </div>
                         <button onClick={removeCoupon} className="text-xs text-red-500 hover:underline">削除</button>
                    </div>
                ) : (
                    <div className="flex gap-2 relative">
                        <input 
                            type="text" 
                            placeholder="クーポンコード" 
                            className="flex-1 px-3 py-1.5 text-sm border border-stone-300 rounded focus:ring-1 focus:ring-amber-500 outline-none"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                        />
                        <button 
                            onClick={() => setShowSelector(!showSelector)}
                            className="px-2 bg-stone-100 text-stone-600 border border-stone-300 rounded hover:bg-stone-200"
                            title="保存済みクーポンから選択"
                        >
                            🎟️
                        </button>
                        <button 
                            onClick={handleApplyCoupon}
                            disabled={applying || !couponCode.trim()}
                            className="px-3 py-1.5 bg-stone-800 text-white text-sm rounded hover:bg-stone-700 disabled:opacity-50"
                        >
                            適用
                        </button>
                        
                        {showSelector && (
                            <CouponSelector 
                                onSelect={(code) => {
                                    setCouponCode(code);
                                    setShowSelector(false);
                                }} 
                                onCancel={() => setShowSelector(false)} 
                            />
                        )}
                    </div>
                )}
            </div>

            <div className="space-y-1">
                 <div className="flex items-center justify-between text-stone-600">
                    <span>小計</span>
                    <span>{formatPrice(subtotal)}</span>
                 </div>
                 {appliedCoupon && (
                    <div className="flex items-center justify-between text-green-600 font-medium">
                        <span>割引</span>
                        <span>-{formatPrice(discountAmount)}</span>
                    </div>
                 )}
                 <div className="flex items-center justify-between text-lg font-bold text-stone-900 pt-2 border-t border-stone-100">
                    <span>合計</span>
                    <span>{formatPrice(totalPrice)}</span>
                 </div>
            </div>

            <p className="text-xs text-stone-500 text-center">
              送料・手数料はチェックアウト時に計算されます
            </p>
            <Link
              to="/checkout" 
              onClick={closeCart}
              className="block w-full py-3 bg-amber-600 text-white text-center font-bold rounded-lg shadow-lg shadow-amber-200 hover:bg-amber-700 transition-all hover:-translate-y-0.5"
            >
              レジに進む
            </Link>
          </div>
        )}
      </div>
    </>
  );
};
