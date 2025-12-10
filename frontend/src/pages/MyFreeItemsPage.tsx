import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { FreeItemCard } from '../components/freeItem/FreeItemCard';
import { FreeItemStatusBadge } from '../components/freeItem/FreeItemStatusBadge';
import { freeItemService } from '../services/freeItemService';
import type { FreeItem } from '../types/freeItem';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

type TabType = 'all' | 'available' | 'reserved' | 'completed';

export const MyFreeItemsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [items, setItems] = useState<FreeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: '/free-items/my-items' } });
      return;
    }

    fetchItems();
  }, [user, navigate, activeTab]);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const data = await freeItemService.getMyItems();
      let filtered = data.results;
      
      if (activeTab !== 'all') {
        filtered = filtered.filter(item => item.status === activeTab);
      }
      
      setItems(filtered);
    } catch (error) {
      console.error('Failed to fetch items:', error);
      toast.error('アイテムの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('このアイテムを削除しますか？')) return;

    try {
      await freeItemService.deleteFreeItem(id);
      toast.success('削除しました');
      fetchItems();
    } catch (error) {
      toast.error('削除に失敗しました');
    }
  };

  if (!user) {
    return null;
  }

  const tabs: { key: TabType; label: string }[] = [
    { key: 'all', label: 'すべて' },
    { key: 'available', label: '募集中' },
    { key: 'reserved', label: '予約済み' },
    { key: 'completed', label: '終了' },
  ];

  return (
    <div className="min-h-screen bg-stone-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-stone-900 mb-2">マイアイテム</h1>
          <p className="text-stone-600">投稿したアイテムを管理できます</p>
        </div>

        <div className="mb-6">
          <Link
            to="/free-items/create"
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新しいアイテムを投稿
          </Link>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b border-stone-200">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'text-green-600 border-b-2 border-green-600'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Items */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg">
            <p className="text-stone-500 text-lg mb-4">アイテムがありません</p>
            <Link
              to="/free-items/create"
              className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700"
            >
              最初のアイテムを投稿する
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => (
              <div key={item.id} className="relative">
                <FreeItemCard item={item} />
                <div className="absolute top-2 right-2">
                  <FreeItemStatusBadge status={item.status} />
                </div>
                <div className="mt-2 flex gap-2">
                  <Link
                    to={`/free-items/${item.id}`}
                    className="flex-1 px-4 py-2 bg-stone-200 text-stone-700 rounded text-center text-sm font-medium hover:bg-stone-300"
                  >
                    詳細
                  </Link>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="px-4 py-2 bg-red-500 text-white rounded text-sm font-medium hover:bg-red-600"
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

