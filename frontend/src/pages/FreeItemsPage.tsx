import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { FreeItemCard } from '../components/freeItem/FreeItemCard';
import { freeItemService } from '../services/freeItemService';
import type { FreeItem, FreeItemFilters } from '../types/freeItem';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

// Japanese prefectures
const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
];

const CATEGORIES = [
  '家具', '家電', '服飾', '本・雑誌', 'おもちゃ', 'スポーツ', 'その他'
];

export const FreeItemsPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<FreeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Client-side visual filters
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [showMyItemsOnly, setShowMyItemsOnly] = useState(false);

  const initialFilters: FreeItemFilters = {
    location_prefecture: searchParams.get('prefecture') || undefined,
    location_city: searchParams.get('city') || undefined,
    category: searchParams.get('category') || undefined,
    condition: (searchParams.get('condition') as FreeItemFilters['condition']) || undefined,
    search: searchParams.get('search') || undefined,
    sort: searchParams.get('sort') || '-created_at',
  };

  const [filters, setFilters] = useState<FreeItemFilters>(initialFilters);

  // Update URL when filters change
  useEffect(() => {
    const params: Record<string, string> = {};
    if (filters.location_prefecture) params.prefecture = filters.location_prefecture;
    if (filters.location_city) params.city = filters.location_city;
    if (filters.category) params.category = filters.category;
    if (filters.condition) params.condition = filters.condition;
    if (filters.search) params.search = filters.search;
    if (filters.sort) params.sort = filters.sort;
    setSearchParams(params);
  }, [filters, setSearchParams]);

  // Fetch items
  useEffect(() => {
    const fetchItems = async () => {
      setIsLoading(true);
      setCurrentPage(1);
      try {
        const data = await freeItemService.getFreeItems(filters, 1);
        setItems(data.results);
        setTotalCount(data.count);
        setHasNextPage(data.next !== null);
      } catch (error) {
        console.error('Failed to fetch free items:', error);
        setItems([]);
        setTotalCount(0);
        setHasNextPage(false);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchItems();
    }, 300);

    return () => clearTimeout(timer);
  }, [filters]);

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasNextPage) return;

    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const data = await freeItemService.getFreeItems(filters, nextPage);
      setItems(prev => [...prev, ...data.results]);
      setCurrentPage(nextPage);
      setHasNextPage(data.next !== null);
    } catch (error) {
      console.error('Failed to load more items:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Client-side filtering for display
  const displayItems = useMemo(() => {
    let result = items;
    
    if (showAvailableOnly) {
      result = result.filter(item => item.status === 'available');
    }
    
    if (showMyItemsOnly && user) {
      const uid = String(user.id);
      result = result.filter(item => String(item.user.id) === uid);
    }

    return result;
  }, [items, showAvailableOnly, showMyItemsOnly, user]);

  return (
    <div className="min-h-screen bg-stone-50">
      <Header />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-green-600 to-emerald-700 text-white pt-12 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4 drop-shadow-sm">
            捨てないで、譲ろう。
          </h1>
          <p className="text-green-100 text-lg mb-8">
            あなたの不要品が、誰かの宝物に。<br className="md:hidden"/>地球にやさしいリサイクルコミュニティ。
          </p>
          
          {/* Main Search Bar */}
          <div className="max-w-2xl mx-auto relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-6 w-6 text-stone-400 group-focus-within:text-green-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value || undefined })}
              placeholder="何をお探しですか？（例: 自転車、ソファ、子供服）"
              className="block w-full pl-12 pr-4 py-4 rounded-full text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-4 focus:ring-green-500/30 shadow-lg text-lg"
            />
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 -mt-8 pb-12">
        {/* Filters Card */}
        <div className="bg-white rounded-xl shadow-lg border border-stone-100 p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-end gap-6">
            
            {/* Filters Grid */}
            <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wide mb-1">
                  都道府県
                </label>
                <div className="relative">
                  <select
                    value={filters.location_prefecture || ''}
                    onChange={(e) => setFilters({ ...filters, location_prefecture: e.target.value || undefined })}
                    aria-label="都道府県"
                    className="w-full pl-3 pr-8 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none text-stone-700 font-medium"
                  >
                    <option value="">全国</option>
                    {PREFECTURES.map((pref) => (
                      <option key={pref} value={pref}>{pref}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-stone-500">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wide mb-1">
                  カテゴリ
                </label>
                <div className="relative">
                  <select
                    value={filters.category || ''}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value || undefined })}
                    aria-label="カテゴリ"
                    className="w-full pl-3 pr-8 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none text-stone-700 font-medium"
                  >
                    <option value="">すべてのカテゴリ</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-stone-500">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wide mb-1">
                  並び替え
                </label>
                <div className="relative">
                  <select
                    value={filters.sort || '-created_at'}
                    onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
                    aria-label="並び替え"
                    className="w-full pl-3 pr-8 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none text-stone-700 font-medium"
                  >
                    <option value="-created_at">新着順</option>
                    <option value="created_at">古い順</option>
                    <option value="-views_count">閲覧数順</option>
                    <option value="views_count">閲覧数少ない順</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-stone-500">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="mt-6 pt-4 border-t border-stone-100 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap items-center gap-6">
              <label className="inline-flex items-center cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={showAvailableOnly}
                  onChange={(e) => setShowAvailableOnly(e.target.checked)}
                />
                <div className="relative w-11 h-6 bg-stone-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                <span className="ml-3 text-sm font-medium text-stone-700 group-hover:text-green-700 transition-colors">募集中のみ表示</span>
              </label>

              {user && (
                <label className="inline-flex items-center cursor-pointer group">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={showMyItemsOnly}
                    onChange={(e) => setShowMyItemsOnly(e.target.checked)}
                  />
                  <div className="relative w-11 h-6 bg-stone-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  <span className="ml-3 text-sm font-medium text-stone-700 group-hover:text-blue-700 transition-colors">自分の投稿のみ</span>
                </label>
              )}
            </div>

            {user && (
              <Link
                to="/free-items/create"
                className="hidden md:inline-flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-full font-bold hover:bg-green-700 hover:shadow-lg transition-all transform hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                出品する
              </Link>
            )}
          </div>
        </div>

        {/* Mobile FAB for Create */}
        {user && (
          <Link
            to="/free-items/create"
            className="md:hidden fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-green-600 text-white rounded-full shadow-xl hover:bg-green-700 transition-colors"
            aria-label="出品する"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </Link>
        )}

        {/* Terms Accordion (Collapsed by default, styled better) */}
        <details className="mb-8 group">
          <summary className="list-none flex items-center justify-center gap-2 text-xs font-bold text-stone-400 cursor-pointer hover:text-stone-600 transition-colors">
            <span>利用規約・ガイドラインを確認する</span>
            <svg className="w-4 h-4 transform group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="mt-4 p-6 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-600 leading-relaxed max-w-3xl mx-auto">
            <h3 className="font-bold text-stone-800 mb-2">【無料あげます・交換コーナー 利用規約】</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>本サービスは無償譲渡・交換のコミュニティです。金銭取引は伴いません。</li>
              <li>取引はユーザー間の自己責任です。当サイトは品質・トラブル等に関与しません。</li>
              <li>危険物・違法物・著作権侵害物は禁止。虚偽や誤解を招く記載をしないこと。</li>
              <li>送料等は事前合意し当事者で解決してください。隠れた費用請求は禁止です。</li>
              <li>個人情報は自己責任で共有してください。流出について当サイトは責任を負いません。</li>
            </ul>
          </div>
        </details>

        {/* Results Area */}
        <div className="space-y-6">
          {!isLoading && (
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
                <span>📦</span>
                {showMyItemsOnly ? '自分の投稿一覧' : 'アイテム一覧'}
              </h2>
              <span className="text-sm font-medium px-3 py-1 bg-stone-100 text-stone-600 rounded-full">
                {displayItems.length} <span className="text-stone-400 text-xs">/ {totalCount}件</span>
              </span>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <LoadingSpinner />
              <p className="mt-4 text-stone-400 animate-pulse">読み込み中...</p>
            </div>
          ) : displayItems.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-stone-300">
              <div className="text-6xl mb-4">🍃</div>
              <h3 className="text-xl font-bold text-stone-800 mb-2">アイテムが見つかりませんでした</h3>
              <p className="text-stone-500 mb-6">
                条件を変えて検索するか、<br/>最初のアイテムを出品してみませんか？
              </p>
              {user && (
                <Link
                  to="/free-items/create"
                  className="inline-flex items-center gap-2 px-6 py-2 bg-green-100 text-green-700 rounded-full font-bold hover:bg-green-200 transition-colors"
                >
                  出品する
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayItems.map((item) => (
                <div key={item.id} className={`relative transition-all duration-300 ${item.status === 'reserved' ? 'opacity-75 grayscale-[0.5]' : 'hover:-translate-y-1 hover:shadow-xl'}`}>
                  {/* Status Badges Overlay */}
                  <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                    {item.status === 'reserved' && (
                      <span className="px-2 py-1 bg-stone-800/80 text-white text-xs font-bold rounded backdrop-blur-sm">
                        相談中
                      </span>
                    )}
                    {user && String(item.user.id) === String(user.id) && (
                      <span className="px-2 py-1 bg-blue-600/90 text-white text-xs font-bold rounded backdrop-blur-sm shadow-sm">
                        あなたの投稿
                      </span>
                    )}
                  </div>
                  
                  {/* Card Component */}
                  <FreeItemCard item={item} />
                </div>
              ))}
            </div>
          )}

          {/* Load More Button */}
          {hasNextPage && !isLoading && !showAvailableOnly && !showMyItemsOnly && (
            <div className="text-center pt-8 pb-4">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="group relative inline-flex items-center gap-2 px-8 py-3 bg-white border border-stone-200 text-stone-600 rounded-full font-bold hover:border-green-500 hover:text-green-600 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
              >
                {isLoadingMore ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    読み込み中...
                  </span>
                ) : (
                  <>
                    もっと見る
                    <svg className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};