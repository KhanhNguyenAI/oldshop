import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../../types/product';
import { useCart } from '../../contexts/CartContext';
import { StampedEffect } from '../ui/StampedEffect';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCartWithFlyEffect, isOpen: isCartOpen } = useCart();
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  
  const [showSaleTooltip, setShowSaleTooltip] = useState(false);
  const [saleTooltipPosition, setSaleTooltipPosition] = useState({ top: 0, left: 0 });
  const saleTooltipRef = useRef<HTMLDivElement>(null);
  const saleBadgeRef = useRef<HTMLDivElement>(null);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation to detail page
    const imgElement = (e.currentTarget.closest('.group')?.querySelector('img') as HTMLImageElement);
    if (imgElement && product.image) {
       addToCartWithFlyEffect(product, product.image, imgElement);
    } else {
        // Fallback if no image found
       // useCart().addToCart(product); // Need to import addToCart if using fallback
       // actually better to just destructure addToCart as well if needed, but for now let's rely on fly effect or just call it directly
       // To simplify, let's assume image exists or pass button itself as start point
       addToCartWithFlyEffect(product, product.image || '', e.currentTarget as HTMLElement);
    }
  };

  const formatPrice = (price: string | number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(Number(price));
  };

  const conditionLabel = {
    new: '新品',
    like_new: '未使用に近い',
    good: '目立った傷や汚れなし',
    fair: 'やや傷や汚れあり',
    poor: '全体的に状態が悪い',
  };

  // Note: Tooltips now use hover, so no need for click outside detection

  const handleBadgeMouseEnter = () => {
    // Disable tooltip when cart is open
    if (isCartOpen) return;
    
    if (badgeRef.current) {
      // Calculate position for fixed tooltip (relative to viewport, not document)
      const rect = badgeRef.current.getBoundingClientRect();
      setTooltipPosition({
        top: rect.bottom + 8, // No need for window.scrollY with fixed positioning
        left: rect.left, // No need for window.scrollX with fixed positioning
      });
      setShowTooltip(true);
    }
  };

  const handleBadgeMouseLeave = () => {
    setShowTooltip(false);
  };

  const handleSaleBadgeMouseEnter = () => {
    // Disable tooltip when cart is open
    if (isCartOpen) return;
    
    if (saleBadgeRef.current) {
      // Calculate position for fixed tooltip (relative to viewport, not document)
      const rect = saleBadgeRef.current.getBoundingClientRect();
      setSaleTooltipPosition({
        top: rect.bottom + 8, // No need for window.scrollY with fixed positioning
        left: rect.right - 256, // Align to right (tooltip width is 256px), no need for window.scrollX
      });
      setShowSaleTooltip(true);
    }
  };

  const handleSaleBadgeMouseLeave = () => {
    setShowSaleTooltip(false);
  };
  
  // Close tooltips when cart opens
  useEffect(() => {
    if (isCartOpen) {
      setShowTooltip(false);
      setShowSaleTooltip(false);
    }
  }, [isCartOpen]);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 border border-amber-100 overflow-hidden group">
      <Link to={`/products/${product.id}`} className="block relative aspect-square overflow-hidden bg-gray-100">
        {product.image ? (
          <img
            src={product.image}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-amber-300">
            <span className="text-4xl">📷</span>
          </div>
        )}
        {/* Stamped Effects - Overlay for sold out */}
        {product.is_sold && (
          <StampedEffect type="sold_out" variant="overlay" />
        )}
        
        {/* Stamped Effects - Small stamp for return status */}
        {!product.is_sold && product.return_status === 'delivered' && (
          <StampedEffect type="delivered" variant="stamp" />
        )}
        {!product.is_sold && product.return_status === 'returning' && (
          <StampedEffect type="returning" variant="stamp" />
        )}
        {!product.is_sold && product.return_status === 'returned' && (
          <StampedEffect type="returned" variant="stamp" />
        )}
        {/* Guarantee Badge - Always shown */}
        {!product.is_sold && (
          <div className="absolute top-2 left-2 z-20">
            <div
              ref={badgeRef}
              onMouseEnter={handleBadgeMouseEnter}
              onMouseLeave={handleBadgeMouseLeave}
              className={`text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-lg flex items-center gap-1.5 cursor-pointer hover:scale-105 transition-transform border ${
                product.is_verified 
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 border-emerald-500/30' 
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 border-amber-400/30'
              }`}
            >
              <span className="text-sm">{product.is_verified ? '🛡️' : '⏳'}</span>
              <span>{product.is_verified ? '保証' : 'checking'}</span>
            </div>
            
            {/* Tooltip - Fixed positioning to avoid overflow */}
            {showTooltip && (
              <div
                ref={tooltipRef}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className={`fixed w-64 p-3 rounded-lg shadow-xl z-50 animate-fadeIn ${
                  product.is_verified
                    ? 'bg-emerald-50 border-2 border-emerald-200'
                    : 'bg-amber-50 border-2 border-amber-200'
                }`}
                style={{
                  top: `${tooltipPosition.top}px`,
                  left: `${tooltipPosition.left}px`,
                }}
              >
                <div className="flex items-start gap-2">
                  <span className="text-xl">{product.is_verified ? '🛡️' : '⏳'}</span>
                  <div className="flex-1">
                    <h4 className={`font-bold text-sm mb-1 ${
                      product.is_verified ? 'text-emerald-800' : 'text-amber-800'
                    }`}>
                      {product.is_verified ? '保証済み' : '確認中'}
                    </h4>
                    <p className={`text-xs leading-relaxed ${
                      product.is_verified ? 'text-emerald-700' : 'text-amber-700'
                    }`}>
                      {product.is_verified
                        ? 'この商品は当社が品質を確認し、保証済みです。安心してお買い求めいただけます。'
                        : 'この商品は現在品質確認中です。確認が完了次第、保証マークが表示されます。'}
                    </p>
                  </div>
                </div>
                {/* Arrow */}
                <div
                  className={`absolute -top-2 left-4 w-4 h-4 rotate-45 ${
                    product.is_verified
                      ? 'bg-emerald-50 border-l-2 border-t-2 border-emerald-200'
                      : 'bg-amber-50 border-l-2 border-t-2 border-amber-200'
                  }`}
                />
              </div>
            )}
          </div>
        )}
        {/* Sale Badge */}
        {!product.is_sold && product.active_discount_percent && product.active_discount_percent > 0 ? (
          <div className="absolute top-2 right-2 z-20">
            <div
              ref={saleBadgeRef}
              onMouseEnter={handleSaleBadgeMouseEnter}
              onMouseLeave={handleSaleBadgeMouseLeave}
              className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow-md animate-pulse cursor-pointer hover:scale-105 transition-transform"
            >
              SALE {product.active_discount_percent}%
            </div>
            
            {/* Sale Tooltip */}
            {showSaleTooltip && (
              <div
                ref={saleTooltipRef}
                onMouseEnter={() => setShowSaleTooltip(true)}
                onMouseLeave={() => setShowSaleTooltip(false)}
                className="fixed w-64 p-3 rounded-lg shadow-xl z-50 animate-fadeIn bg-red-50 border-2 border-red-200"
                style={{
                  top: `${saleTooltipPosition.top}px`,
                  left: `${saleTooltipPosition.left}px`,
                }}
              >
                <div className="flex items-start gap-2">
                  <span className="text-xl">🏷️</span>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm mb-1 text-red-800">
                      {product.active_discount?.name || 'セール中'}
                    </h4>
                    <p className="text-xs leading-relaxed text-red-700 mb-2">
                      {product.active_discount?.type === 'percent'
                        ? `${product.active_discount.value}%割引`
                        : `¥${product.active_discount?.value}割引`}
                      {product.active_discount?.applied_from === 'product' && ' (この商品専用)'}
                      {product.active_discount?.applied_from === 'category' && ' (カテゴリー割引)'}
                      {product.active_discount?.applied_from === 'parent_category' && ' (親カテゴリー割引)'}
                    </p>
                    {product.sale_price && (
                      <div className="text-xs text-red-600 font-semibold mb-2">
                        <span className="line-through text-red-400 mr-2">
                          {formatPrice(product.price)}
                        </span>
                        <span className="text-red-800">
                          {formatPrice(product.sale_price)}
                        </span>
                      </div>
                    )}
                    {/* Thời gian sale */}
                    {(product.active_discount?.start_date || product.active_discount?.end_date) && (
                      <div className="text-xs text-red-600 space-y-1 border-t border-red-200 pt-2 mt-2">
                        {product.active_discount?.start_date && (
                          <div className="flex items-center gap-1">
                            <span>📅</span>
                            <span>開始: {formatDate(product.active_discount.start_date)}</span>
                          </div>
                        )}
                        {product.active_discount?.end_date && (
                          <div className="flex items-center gap-1">
                            <span>⏰</span>
                            <span>終了: {formatDate(product.active_discount.end_date)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {/* Arrow */}
                <div className="absolute -top-2 right-4 w-4 h-4 rotate-45 bg-red-50 border-l-2 border-t-2 border-red-200" />
              </div>
            )}
          </div>
        ) : null}
      </Link>
      
      <div className="p-4">
        <h3 className="font-serif font-medium text-gray-900 truncate mb-1" title={product.title}>
          {product.title}
        </h3>
        
        {product.sale_price ? (
            <div className="mb-2">
                <span className="text-lg font-bold text-red-700 mr-2">
                    {formatPrice(product.sale_price)}
                </span>
                <span className="text-sm text-gray-400 line-through">
                    {formatPrice(product.price)}
                </span>
            </div>
        ) : (
            <p className="text-lg font-bold text-amber-900 mb-2">
              {formatPrice(product.price)}
            </p>
        )}
        
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
            {conditionLabel[product.condition as keyof typeof conditionLabel] || product.condition}
          </span>
          <span className="flex items-center gap-1">
            📍 {product.location}
          </span>
        </div>

        {!product.is_sold && (
          <button
            onClick={handleAddToCart}
            className="w-full mt-2 bg-stone-900 text-amber-50 py-2 px-4 rounded hover:bg-amber-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
          >
            <span>🛒</span> カートに入れる
          </button>
        )}
      </div>
    </div>
  );
};

