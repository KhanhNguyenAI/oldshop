import React from 'react';
import type { Product } from '../../types/product';
import { ProductCard } from './ProductCard';
import { PageLoader } from '../ui/PageLoader';

interface ProductListProps {
  products: Product[];
  isLoading: boolean;
}

export const ProductList: React.FC<ProductListProps> = ({ products, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-800"></div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-lg border border-amber-100">
        <p className="text-amber-900 font-serif text-lg mb-2">商品が見つかりませんでした。</p>
        <p className="text-gray-500 text-sm">検索条件を変更して再度お試しください。</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

