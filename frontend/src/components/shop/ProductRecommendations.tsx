import React, { useEffect, useState } from 'react';
import { productService } from '../../services/productService';
import type { Product } from '../../types/product';
import { ProductCard } from './ProductCard';
import { PageLoader } from '../ui/PageLoader';
import { translateCategoryName } from '../../utils/categoryTranslations';

interface ProductRecommendationsProps {
  productId: string;
  product?: Product; // Pass product to check return_status
}

export const ProductRecommendations: React.FC<ProductRecommendationsProps> = ({ 
  productId,
  product 
}) => {
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState<string>('');
  const [recommendationType, setRecommendationType] = useState<'same_category' | 'accessories'>('same_category');

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const data = await productService.getRecommendations(productId);
        setRecommendations(data.recommendations);
        setCategoryName(data.category.name);
        setRecommendationType(data.type || 'same_category');
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [productId]);

  if (loading) {
    return (
      <div className="py-12">
        <PageLoader />
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <section className="mt-16 pt-12 border-t border-stone-200">
      <div className="mb-8">
        <h2 className="text-2xl font-serif font-bold text-stone-900 mb-2">
          {recommendationType === 'accessories' 
            ? 'あなたにおすすめのアクセサリー'
            : '同じカテゴリーの商品'}
        </h2>
        <p className="text-stone-600 text-sm">
          {recommendationType === 'accessories' 
            ? 'この商品に関連するアクセサリー・付属品'
            : `${translateCategoryName(categoryName)} カテゴリーの他の商品`}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {recommendations.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};

