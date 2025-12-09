import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productService } from '../services/productService';
import { geminiService } from '../services/geminiService';
import type { Product } from '../types/product';
import { useCart } from '../contexts/CartContext';
import { Header } from '../components/Header';
import { PageLoader } from '../components/ui/PageLoader';
import { ProductReviews } from '../components/shop/ProductReviews';
import { ProductRecommendations } from '../components/shop/ProductRecommendations';
import { StampedEffect } from '../components/ui/StampedEffect';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [isGeminiModalOpen, setIsGeminiModalOpen] = useState(false);
  const [geminiAnswer, setGeminiAnswer] = useState<string>('');
  const [isGeminiLoading, setIsGeminiLoading] = useState(false);
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

  const handleAskGemini = async () => {
    if (!product) return;
    
    setIsGeminiModalOpen(true);
    setIsGeminiLoading(true);
    setGeminiAnswer('');

    try {
      // Format câu hỏi với thông tin sản phẩm
      const price = product.sale_price || product.price;
      const formattedPrice = new Intl.NumberFormat('ja-JP', {
        style: 'currency',
        currency: 'JPY',
      }).format(Number(price));

      // Lấy description, nếu quá dài thì cắt ngắn
      const productDescription = product.description.length > 200 
        ? product.description.substring(0, 200) + '...' 
        : product.description;

      const question = `商品「${product.title}」について、説明「${productDescription}」で価格「${formattedPrice}」で購入する価値はありますか？この商品を購入して使用することをお勧めしますか？`;
      
      const answer = await geminiService.askQuestion(question, product.id);
      setGeminiAnswer(answer);
    } catch (error: unknown) {
      setGeminiAnswer('申し訳ございません。Gemini APIへの接続に失敗しました。しばらくしてから再度お試しください。');
      console.error('Failed to get Gemini response:', error);
    } finally {
      setIsGeminiLoading(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!product) return <div className="text-center py-20">商品が見つかりません</div>;

  const formatPrice = (price: string | number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(Number(price));
  };

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

  const conditionLabels: Record<string, string> = {
    new: '新品',
    like_new: '未使用に近い',
    good: '目立った傷や汚れなし',
    fair: 'やや傷や汚れあり',
    poor: '全体的に状態が悪い',
  };

  const getReturnPolicy = () => {
    switch (product.condition) {
      case 'new':
        return {
          title: '新品 (New)',
          icon: '✨',
          policies: [
            { period: 'お届けから7日以内', refund: '100%返金', color: 'text-green-600' },
            { period: 'お届けから8〜30日以内', refund: '80%返金', color: 'text-green-600' },
            { period: 'お届けから31日以降', refund: '返品不可', color: 'text-red-600' },
          ],
          bgColor: 'from-green-50 to-emerald-50',
        };
      case 'like_new':
        return {
          title: '未使用に近い (Like New)',
          icon: '🌟',
          policies: [
            { period: 'お届けから3日以内', refund: '100%返金', color: 'text-green-600' },
            { period: 'お届けから4〜7日以内', refund: '80%返金', color: 'text-green-600' },
            { period: 'お届けから8日以降', refund: '返品不可', color: 'text-red-600' },
          ],
          bgColor: 'from-blue-50 to-cyan-50',
        };
      case 'good':
        return {
          title: '目立った傷や汚れなし (Good)',
          icon: '👍',
          policies: [
            { period: 'お届けから3日以内', refund: '100%返金', color: 'text-green-600' },
            { period: 'お届けから4日以降', refund: '返品不可', color: 'text-red-600' },
          ],
          bgColor: 'from-amber-50 to-yellow-50',
        };
      case 'fair':
        return {
          title: 'やや傷や汚れあり (Fair)',
          icon: '⚠️',
          policies: [
            { period: 'お届けから3日以内', refund: '100%返金', color: 'text-green-600' },
            { period: 'お届けから4日以降', refund: '返品不可', color: 'text-red-600' },
          ],
          bgColor: 'from-orange-50 to-amber-50',
        };
      case 'poor':
        return {
          title: '全体的に状態が悪い (Poor)',
          icon: '❌',
          policies: [
            { period: '返品不可', refund: 'この状態の商品は返品・交換を受け付けておりません', color: 'text-red-600' },
          ],
          bgColor: 'from-red-50 to-pink-50',
        };
      default:
        return null;
    }
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
                {/* Ask Gemini Button */}
                <button
                  onClick={handleAskGemini}
                  className="absolute top-4 right-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 font-bold text-sm flex items-center gap-2 z-10"
                >
                  <span>🤖</span>
                  <span>専門家</span>
                </button>
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

                {/* Sale Information Card */}
                {product.active_discount && product.sale_price && (
                    <div className="mb-6 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-4 shadow-sm">
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">🏷️</span>
                            <div className="flex-1">
                                <h4 className="font-bold text-red-800 mb-2 text-lg">
                                    {product.active_discount.name || 'セール中'}
                                </h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2 text-red-700">
                                        <span className="font-semibold">
                                            {product.active_discount.type === 'percent'
                                                ? `${product.active_discount.value}%割引`
                                                : `¥${product.active_discount.value}割引`}
                                        </span>
                                        {product.active_discount.applied_from === 'product' && (
                                            <span className="bg-red-200 text-red-800 px-2 py-0.5 rounded text-xs font-medium">
                                                この商品専用
                                            </span>
                                        )}
                                        {product.active_discount.applied_from === 'category' && (
                                            <span className="bg-red-200 text-red-800 px-2 py-0.5 rounded text-xs font-medium">
                                                カテゴリー割引
                                            </span>
                                        )}
                                        {product.active_discount.applied_from === 'parent_category' && (
                                            <span className="bg-red-200 text-red-800 px-2 py-0.5 rounded text-xs font-medium">
                                                親カテゴリー割引
                                            </span>
                                        )}
                                    </div>
                                    {(product.active_discount.start_date || product.active_discount.end_date) && (
                                        <div className="pt-2 border-t border-red-200 space-y-1 text-red-600">
                                            {product.active_discount.start_date && (
                                                <div className="flex items-center gap-2">
                                                    <span>📅</span>
                                                    <span>開始: {formatDate(product.active_discount.start_date)}</span>
                                                </div>
                                            )}
                                            {product.active_discount.end_date && (
                                                <div className="flex items-center gap-2">
                                                    <span>⏰</span>
                                                    <span>終了: {formatDate(product.active_discount.end_date)}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

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

                {/* Return Policy */}
                {getReturnPolicy() && (
                    <section className={`bg-gradient-to-r ${getReturnPolicy()?.bgColor} p-6 rounded-xl border border-stone-200 shadow-sm`}>
                        <h3 className="text-lg font-serif font-bold text-stone-900 mb-4 flex items-center gap-2">
                            <span>{getReturnPolicy()?.icon}</span> 返品・交換ポリシー
                        </h3>
                        <div className="space-y-3 mb-4">
                            <p className="text-sm text-stone-700 font-medium mb-3">
                                {getReturnPolicy()?.title}
                            </p>
                            {getReturnPolicy()?.policies.map((policy, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm">
                                    <span className={policy.color === 'text-green-600' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                                        {policy.color === 'text-green-600' ? '✓' : '✗'}
                                    </span>
                                    <span className="text-stone-700">
                                        <strong>{policy.period}:</strong> {policy.refund}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="pt-3 border-t border-stone-200">
                            <Link 
                                to="/return-policy" 
                                className="text-sm text-amber-700 hover:text-amber-800 font-medium underline flex items-center gap-1"
                            >
                                詳細な返品・交換ポリシーを見る →
                            </Link>
                        </div>
                    </section>
                )}
            </div>
          </div>
        </div>

        {/* Reviews Section - Grid below images */}
        <div ref={reviewsRef} className="mt-12">
          <ProductReviews 
            productId={product.id} 
            avgRating={product.avg_rating}
            ratingCount={product.rating_count}
            userRating={product.user_rating}
            onRatingUpdate={refreshProduct}
          />
        </div>

        {/* Recommendations Section */}
        <ProductRecommendations productId={product.id} product={product} />
      </main>

      {/* Gemini Modal */}
      {isGeminiModalOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setIsGeminiModalOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🤖</span>
                <div>
                  <h3 className="text-white font-bold text-xl">Gemini AI</h3>
                  <p className="text-purple-100 text-sm">商品についてのアドバイス</p>
                </div>
              </div>
              <button
                onClick={() => setIsGeminiModalOpen(false)}
                className="text-white hover:text-purple-100 transition-colors text-2xl font-bold w-8 h-8 flex items-center justify-center"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {isGeminiLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
                  <p className="text-gray-600">Geminiが考えています...</p>
                </div>
              ) : (
                <div className="prose prose-stone max-w-none">
                  <div className="bg-purple-50 border-l-4 border-purple-600 p-4 rounded-lg mb-4">
                    <p className="text-sm text-purple-800 font-medium mb-2">質問:</p>
                    <p className="text-gray-700 text-sm">
                      商品「{product.title}」について、状態「{product.condition_detail || conditionLabels[product.condition]}」で価格「{formatPrice(product.sale_price || product.price)}」で購入する価値はありますか？
                    </p>
                  </div>
                  <div className="bg-white border border-gray-200 p-4 rounded-lg">
                    <p className="text-sm text-gray-800 font-medium mb-2">回答:</p>
                    <div className="text-gray-700 whitespace-pre-line leading-relaxed">
                      {geminiAnswer || '回答を取得できませんでした。'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

