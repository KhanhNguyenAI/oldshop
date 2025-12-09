import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { ProductList } from '../components/shop/ProductList';
import { ProductFilter } from '../components/shop/ProductFilter';
import { AccessoriesSection } from '../components/shop/AccessoriesSection';
import { productService } from '../services/productService';
import type { Product, ProductFilters } from '../types/product';

export const ShopPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  
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
      setCurrentPage(1);
      try {
        const data = await productService.getProducts(filters, 1);
        setProducts(data.results);
        setTotalCount(data.count);
        setHasNextPage(data.next !== null);
      } catch (error) {
        console.error('Failed to fetch products:', error);
        setProducts([]);
        setTotalCount(0);
        setHasNextPage(false);
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

  // Load more products
  const handleLoadMore = async () => {
    if (isLoadingMore || !hasNextPage) return;

    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const data = await productService.getProducts(filters, nextPage);
      setProducts(prev => [...prev, ...data.results]);
      setCurrentPage(nextPage);
      setHasNextPage(data.next !== null);
      
      // Scroll down smoothly after loading to show new products
      setTimeout(() => {
        window.scrollBy({
          top: 400,
          behavior: 'smooth'
        });
      }, 100);
    } catch (error) {
      console.error('Failed to load more products:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full md:w-72 lg:w-80 flex-shrink-0">
            <div className="sticky top-24 z-10">
              <div className="bg-gradient-to-br from-white to-amber-50/30 rounded-xl shadow-lg border border-amber-200/50 backdrop-blur-sm p-1">
                <div className="bg-white/80 rounded-lg p-1">
                  <ProductFilter filters={filters} onFilterChange={setFilters} />
                </div>
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            <div className="mb-6 flex justify-between items-center">
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-amber-900">
                商品一覧
                <span className="ml-2 text-sm font-sans font-normal text-amber-700">
                  ({totalCount}件)
                </span>
              </h1>
            </div>

            <ProductList products={products} isLoading={isLoading} />

            {/* Load More Button */}
            {!isLoading && hasNextPage && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="px-6 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-serif font-bold rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed"
                >
                  {isLoadingMore ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      読み込み中...
                    </span>
                  ) : (
                    'もっと見る'
                  )}
                </button>
              </div>
            )}

            {/* Accessories Section for authenticated users */}
            <AccessoriesSection />
          </div>
        </div>
      </main>
    </div>
  );
};

