import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productService } from '../services/productService';
import type { Product } from '../types/product';
import { useCart } from '../contexts/CartContext';
import { Header } from '../components/Header';
import { PageLoader } from '../components/ui/PageLoader';
import { ProductReviews } from '../components/shop/ProductReviews';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const reviewsRef = useRef<HTMLDivElement>(null);
  const { addToCart, addToCartWithFlyEffect } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        const data = await productService.getProduct(id);
        setProduct(data);
        if (data.image) {
          setSelectedImage(data.image);
        } else if (data.images && data.images.length > 0) {
            setSelectedImage(data.images[0].image);
        }
      } catch (error) {
        console.error('Failed to fetch product:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const refreshProduct = async () => {
    if (id) {
        const data = await productService.getProduct(id);
        setProduct(data);
    }
  };

  const scrollToReviews = () => {
    reviewsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) return <PageLoader />;
  if (!product) return <div className="text-center py-20">商品が見つかりません</div>;

  const formatPrice = (price: string | number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(Number(price));
  };

  const conditionLabels: Record<string, string> = {
    new: '新品',
    like_new: '未使用に近い',
    good: '目立った傷や汚れなし',
    fair: 'やや傷や汚れあり',
    poor: '全体的に状態が悪い',
  };

  const renderSpecifications = () => {
    if (product.specifications && Object.keys(product.specifications).length > 0) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {Object.entries(product.specifications).map(([key, value]) => (
            <div key={key} className="flex justify-between border-b border-gray-100 py-2">
              <span className="text-gray-500">{key}</span>
              <span className="font-medium text-gray-900">{value as string}</span>
            </div>
          ))}
        </div>
      );
    }
    
    // Fallback or empty state
    return (
        <div className="text-gray-500 text-sm italic">
            詳細な仕様情報はありません。
        </div>
    );
  };

  const allImages = [
      ...(product.image ? [{ id: -1, image: product.image }] : []),
      ...(product.images || [])
  ];

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex text-sm text-gray-500 mb-6">
            <Link to="/" className="hover:text-amber-600">ホーム</Link>
            <span className="mx-2">/</span>
            <Link to="/shop" className="hover:text-amber-600">商品一覧</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium truncate max-w-[200px]">{product.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden relative group">
                {selectedImage ? (
                     <img 
                        src={selectedImage} 
                        alt={product.title} 
                        className="w-full h-full object-contain"
                     />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-200 bg-stone-50">
                        <span className="text-6xl">📷</span>
                    </div>
                )}
                {product.is_sold && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-white font-bold text-3xl border-4 border-white px-8 py-2 -rotate-12">SOLD OUT</span>
                  </div>
                )}
            </div>
            
            {/* Thumbnails */}
            {allImages.length > 0 && (
                <div className="grid grid-cols-5 gap-2">
                    {allImages.map((img, idx) => (
                        <button 
                            key={idx}
                            onClick={() => setSelectedImage(img.image)}
                            className={`aspect-square rounded-lg border-2 overflow-hidden bg-white ${selectedImage === img.image ? 'border-amber-500 ring-2 ring-amber-200' : 'border-transparent hover:border-amber-300'}`}
                        >
                            <img src={img.image} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            )}
          </div>

          {/* Right: Info */}
          <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-serif font-bold text-stone-900 mb-2 leading-tight">
                    {product.title}
                </h1>
                <div className="flex items-center gap-4 text-sm text-stone-500 mb-4">
                     <span className="flex items-center gap-1">
                        📍 {product.location || 'Tokyo, Japan'}
                     </span>
                     <span>•</span>
                     <span>出品: {new Date(product.created_at).toLocaleDateString('ja-JP')}</span>
                </div>
                
                <div className="flex items-end gap-3 mb-6">
                    {product.sale_price ? (
                        <>
                            <span className="text-4xl font-bold text-red-700 font-sans">
                                {formatPrice(product.sale_price)}
                            </span>
                            <span className="text-stone-400 text-lg mb-1 line-through">
                                {formatPrice(product.price)}
                            </span>
                            <span className="mb-2 bg-red-100 text-red-700 text-sm font-bold px-2 py-1 rounded">
                                {product.active_discount_percent}% OFF
                            </span>
                        </>
                    ) : (
                        <span className="text-4xl font-bold text-amber-700 font-sans">
                            {formatPrice(product.price)}
                        </span>
                    )}
                </div>

                <div className="flex flex-wrap gap-4 mb-6 text-sm">
                    {product.stock_quantity > 0 && (
                        <div className="px-3 py-1 bg-stone-100 rounded-lg text-stone-600 border border-stone-200">
                             残り <span className={`font-bold ${product.stock_quantity < 3 ? 'text-red-500' : 'text-stone-900'}`}>{product.stock_quantity}</span> 点
                        </div>
                    )}
                    <div className="px-3 py-1 bg-stone-100 rounded-lg text-stone-600 border border-stone-200">
                        販売済み <span className="font-bold text-stone-900">{product.sold_quantity}</span> 件
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                    <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium border border-amber-200">
                        {conditionLabels[product.condition] || product.condition}
                    </span>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium border border-green-200">
                        送料込み (出品者負担)
                    </span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium border border-blue-200">
                        匿名配送
                    </span>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 border-b border-stone-200 pb-8">
                {product.is_sold || product.stock_quantity <= 0 ? (
                    <button disabled className="w-full py-4 bg-stone-300 text-stone-500 rounded-xl font-bold text-lg cursor-not-allowed">
                        売り切れ (Sold Out)
                    </button>
                ) : (
                    <>
                        <button 
                            onClick={(e) => {
                                if (selectedImage) {
                                     const startEl = document.querySelector('.aspect-square.bg-white') as HTMLElement;
                                     addToCartWithFlyEffect(product, selectedImage, startEl || e.currentTarget);
                                } else {
                                     addToCart(product);
                                }
                            }}
                            className="flex-1 py-4 bg-amber-600 text-white rounded-xl font-bold text-lg hover:bg-amber-700 shadow-lg shadow-amber-200 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
                        >
                            <span>🛒</span> カートに入れる
                        </button>
                        <button 
                                onClick={scrollToReviews}
                                className="px-6 py-4 bg-white text-stone-700 border-2 border-stone-200 rounded-xl font-bold hover:bg-stone-50 hover:border-stone-300 transition-colors"
                            >
                                コメントする
                            </button>
                        </>
                    )}
                </div>

            {/* Detail Sections */}
            <div className="space-y-6">
                {/* Condition Detail */}
                <section className="bg-white p-6 rounded-xl border border-stone-100 shadow-sm">
                    <h3 className="text-lg font-serif font-bold text-stone-900 mb-4 flex items-center gap-2">
                        <span>🔍</span> 商品の状態
                    </h3>
                    <div className="space-y-3 text-stone-700">
                        <div className="flex justify-between border-b border-stone-100 pb-2">
                             <span className="text-stone-500">状態ランク</span>
                             <span className="font-medium">{conditionLabels[product.condition]}</span>
                        </div>
                        {product.condition_detail ? (
                             <div className="mt-4 bg-stone-50 p-4 rounded-lg text-sm leading-relaxed whitespace-pre-line">
                                {product.condition_detail}
                             </div>
                        ) : (
                            <>
                                <div className="flex justify-between border-b border-stone-100 pb-2">
                                     <span className="text-stone-500">傷・汚れ</span>
                                     <span className="font-medium">詳細は写真をご確認ください</span>
                                </div>
                                <div className="flex justify-between border-b border-stone-100 pb-2">
                                     <span className="text-stone-500">付属品</span>
                                     <span className="font-medium">本体のみ</span>
                                </div>
                            </>
                        )}
                    </div>
                </section>

                {/* Specifications */}
                <section className="bg-white p-6 rounded-xl border border-stone-100 shadow-sm">
                    <h3 className="text-lg font-serif font-bold text-stone-900 mb-4 flex items-center gap-2">
                        <span>⚙️</span> スペック・仕様
                    </h3>
                    {renderSpecifications()}
                </section>

                 {/* Description */}
                 <section className="bg-white p-6 rounded-xl border border-stone-100 shadow-sm">
                    <h3 className="text-lg font-serif font-bold text-stone-900 mb-4 flex items-center gap-2">
                        <span>📝</span> 商品説明
                    </h3>
                    <div className="prose prose-stone max-w-none text-stone-700 whitespace-pre-line leading-relaxed">
                        {product.description}
                    </div>
                </section>

                {/* Assurance */}
                <section className="bg-amber-50 p-6 rounded-xl border border-amber-100">
                     <h3 className="text-lg font-serif font-bold text-amber-900 mb-4 flex items-center gap-2">
                        <span>✅</span> OldShopの安心保証
                    </h3>
                    <ul className="space-y-2 text-sm text-amber-800">
                        <li className="flex items-start gap-2">
                            <span className="text-amber-600">✔</span>
                            <span>鑑定済み・正規品保証 (100% Authentic)</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-amber-600">✔</span>
                            <span>写真・説明通りの商品をお届け</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-amber-600">✔</span>
                            <span>到着後7日間の動作保証・返品対応</span>
                        </li>
                    </ul>
                </section>

                 {/* Shipping */}
                 <section className="bg-white p-6 rounded-xl border border-stone-100 shadow-sm">
                    <h3 className="text-lg font-serif font-bold text-stone-900 mb-4 flex items-center gap-2">
                        <span>🚚</span> 配送・送料について
                    </h3>
                    <div className="space-y-3 text-sm text-stone-600">
                        <div className="flex items-center gap-3">
                             <span className="w-20 text-stone-400">発送元</span>
                             <span className="font-medium text-stone-800">{product.location || '日本国内'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                             <span className="w-20 text-stone-400">発送までの日数</span>
                             <span className="font-medium text-stone-800">1〜2日で発送</span>
                        </div>
                        <div className="flex items-center gap-3">
                             <span className="w-20 text-stone-400">配送方法</span>
                             <span className="font-medium text-stone-800">らくらくメルカリ便 (匿名配送)</span>
                        </div>
                    </div>
                </section>
            </div>
            
            <div ref={reviewsRef}>
                <ProductReviews 
                    productId={product.id} 
                    avgRating={product.avg_rating}
                    ratingCount={product.rating_count}
                    userRating={product.user_rating}
                    onRatingUpdate={refreshProduct}
                />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

