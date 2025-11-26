import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { ProductList } from '../components/shop/ProductList';
import { ProductFilter } from '../components/shop/ProductFilter';
import { productService } from '../services/productService';
import type { Product, ProductFilters } from '../types/product';

export const ShopPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize filters from URL params
  const initialFilters: ProductFilters = {
    category: searchParams.get('category') || undefined,
    search: searchParams.get('search') || undefined,
    condition: searchParams.get('condition') || undefined,
    ordering: searchParams.get('ordering') || undefined,
  };

  const [filters, setFilters] = useState<ProductFilters>(initialFilters);

  // Update URL when filters change
  useEffect(() => {
    const params: any = {};
    if (filters.category) params.category = filters.category;
    if (filters.search) params.search = filters.search;
    if (filters.condition) params.condition = filters.condition;
    if (filters.ordering) params.ordering = filters.ordering;
    setSearchParams(params);
  }, [filters, setSearchParams]);

  // Fetch products when filters change
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const data = await productService.getProducts(filters);
        setProducts(data);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce search
    const timer = setTimeout(() => {
      fetchProducts();
    }, 300);

    return () => clearTimeout(timer);
  }, [filters]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full md:w-64 flex-shrink-0">
            <div className="sticky top-24">
              <ProductFilter filters={filters} onFilterChange={setFilters} />
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            <div className="mb-6 flex justify-between items-center">
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-amber-900">
                商品一覧
                <span className="ml-2 text-sm font-sans font-normal text-amber-700">
                  ({products.length}件)
                </span>
              </h1>
            </div>

            <ProductList products={products} isLoading={isLoading} />
          </div>
        </div>
      </main>
    </div>
  );
};

