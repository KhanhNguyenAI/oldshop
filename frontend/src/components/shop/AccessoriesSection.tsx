import React, { useEffect, useState } from 'react';
import { productService } from '../../services/productService';
import type { Product } from '../../types/product';
import { ProductCard } from './ProductCard';
import { PageLoader } from '../ui/PageLoader';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

export const AccessoriesSection: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [accessories, setAccessories] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasedCount, setPurchasedCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const fetchAccessories = async () => {
      try {
        setLoading(true);
        const data = await productService.getAccessories();
        setAccessories(data.accessories);
        setPurchasedCount(data.purchased_count);
      } catch (error: any) {
        // Nếu user chưa mua sản phẩm nào, API sẽ trả về message
        if (error.response?.status === 401) {
          // User chưa đăng nhập hoặc token hết hạn
          setAccessories([]);
        } else {
          console.error('Failed to fetch accessories:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAccessories();
  }, [isAuthenticated]);

  // Không hiển thị nếu user chưa đăng nhập
  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="py-12">
        <PageLoader />
      </div>
    );
  }

  // Không hiển thị nếu không có accessories
  if (accessories.length === 0) {
    return null;
  }

  return (
    <section className="mt-12 pt-12 border-t border-stone-200">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold text-stone-900 mb-2">
            あなたにおすすめのアクセサリー
          </h2>
          <p className="text-stone-600 text-sm">
            購入した商品に関連するアクセサリー ({purchasedCount} 商品購入済み)
          </p>
        </div>
        <Link
          to="/shop"
          className="text-amber-700 hover:text-amber-800 text-sm font-medium"
        >
          すべて見る →
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {accessories.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};

