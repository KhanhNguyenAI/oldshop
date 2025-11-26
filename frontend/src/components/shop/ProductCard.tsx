import React from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../../types/product';
import { useCart } from '../../contexts/CartContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCartWithFlyEffect } = useCart();

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
        {product.is_sold && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-bold text-xl border-2 border-white px-4 py-1 -rotate-12">SOLD</span>
          </div>
        )}
        {/* Sale Badge */}
        {!product.is_sold && product.active_discount_percent && product.active_discount_percent > 0 ? (
           <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow-md animate-pulse">
               SALE {product.active_discount_percent}%
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

