import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { adminService, type DashboardStats, type Contact } from '../services/adminService';
import { orderService } from '../services/orderService';
import { bookingService } from '../services/bookingService';
import { pricingService } from '../services/pricingService';
import { freeItemService } from '../services/freeItemService';
import api from '../services/api';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import type { Order } from '../types/order';
import type { Booking } from '../types/booking';
import type { PricingRequest } from '../types/pricing';
import type { FreeItem } from '../types/freeItem';

type Tab = 'dashboard' | 'orders' | 'bookings' | 'inquiries' | 'ai_pricing' | 'free_items';

export const AdminPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [inquiries, setInquiries] = useState<Contact[]>([]);
  const [pricingRequests, setPricingRequests] = useState<PricingRequest[]>([]);
  const [freeItems, setFreeItems] = useState<FreeItem[]>([]);
  const [selectedInquiry, setSelectedInquiry] = useState<Contact | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!user?.is_staff && !user?.is_superuser) {
      navigate('/');
      toast.error('管理者権限が必要です');
      return;
    }

    loadData();
  }, [isAuthenticated, user, navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'dashboard') {
        const dashboardStats = await adminService.getDashboardStats();
        setStats(dashboardStats);
      } else if (activeTab === 'orders') {
        const ordersData = await orderService.list();
        const ordersArray = Array.isArray(ordersData) ? ordersData : (ordersData.results || []);
        setOrders(ordersArray);
      } else if (activeTab === 'bookings') {
        const bookingsData = await bookingService.list();
        const bookingsArray = Array.isArray(bookingsData) ? bookingsData : (bookingsData.results || []);
        setBookings(bookingsArray);
      } else if (activeTab === 'inquiries') {
        const inquiriesData = await adminService.getContacts();
        // adminService.getContacts already handles pagination and returns array
        setInquiries(Array.isArray(inquiriesData) ? inquiriesData : []);
      } else if (activeTab === 'ai_pricing') {
        const pricingData = await pricingService.getAllPricingRequests();
        setPricingRequests(Array.isArray(pricingData) ? pricingData : (pricingData?.results || []));
      } else if (activeTab === 'free_items') {
        const freeItemsData = await freeItemService.getAllFreeItems();
        setFreeItems(Array.isArray(freeItemsData) ? freeItemsData : (freeItemsData?.results || []));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleReplyToInquiry = async (inquiryId: number) => {
    if (!replyText.trim()) {
      toast.error('返信内容を入力してください');
      return;
    }

    try {
      await adminService.replyToContact(inquiryId, replyText);
      toast.success('返信を送信しました');
      setReplyText('');
      setSelectedInquiry(null);
      loadData();
    } catch (error) {
      console.error('Error replying to inquiry:', error);
      toast.error('返信の送信に失敗しました');
    }
  };

  const formatPrice = (price: number | string) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(typeof price === 'string' ? parseFloat(price) : price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP');
  };

  if (!isAuthenticated || (!user?.is_staff && !user?.is_superuser)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-100 via-orange-50 to-yellow-100 relative overflow-hidden">
      {/* Vintage paper texture overlay */}
      <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuOSIgbnVtT2N0YXZlcz0iNCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNub2lzZSkiIG9wYWNpdHk9IjAuNCIvPjwvc3ZnPg==')] pointer-events-none"></div>
      
      {/* Header */}
      <div className="relative z-10 bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900 text-amber-50 shadow-[0_4px_8px_rgba(0,0,0,0.2)] border-b-4 border-amber-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-700 rounded-full flex items-center justify-center text-2xl border-2 border-amber-950 shadow-lg">
                ⚙️
              </div>
              <div>
                <h1 className="text-3xl font-serif font-bold tracking-wide">管理者ダッシュボード</h1>
                <p className="text-sm text-amber-200 mt-1 font-serif italic">Admin Dashboard</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-amber-700 hover:bg-amber-600 text-white font-bold font-serif rounded-sm border-2 border-amber-950 shadow-[4px_4px_0px_0px_rgba(69,26,3,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(69,26,3,1)] transition-all"
            >
              🏠 サイトに戻る
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="relative z-10 bg-white/80 backdrop-blur-sm border-b-4 border-amber-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-2 overflow-x-auto">
            {(['dashboard', 'orders', 'bookings', 'inquiries', 'ai_pricing', 'free_items'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 font-serif font-bold text-sm transition-all relative whitespace-nowrap ${
                  activeTab === tab
                    ? 'text-amber-900 bg-amber-50 border-b-4 border-amber-800 shadow-[0_2px_4px_rgba(0,0,0,0.1)]'
                    : 'text-stone-600 hover:text-amber-900 hover:bg-amber-50/50'
                }`}
              >
                {tab === 'dashboard' && '📊 ダッシュボード'}
                {tab === 'orders' && '📦 注文管理'}
                {tab === 'bookings' && '📅 予約管理'}
                {tab === 'inquiries' && '💬 お問い合わせ'}
                {tab === 'ai_pricing' && '🤖 AI価格設定'}
                {tab === 'free_items' && '🎁 無料あげます'}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && stats && (
              <DashboardTab stats={stats} formatPrice={formatPrice} formatDate={formatDate} />
            )}
            {activeTab === 'orders' && (
              <OrdersTab orders={orders} formatPrice={formatPrice} formatDate={formatDate} onUpdate={loadData} />
            )}
            {activeTab === 'bookings' && (
              <BookingsTab bookings={bookings} formatPrice={formatPrice} formatDate={formatDate} onUpdate={loadData} />
            )}
            {activeTab === 'inquiries' && (
              <InquiriesTab
                inquiries={inquiries}
                selectedInquiry={selectedInquiry}
                replyText={replyText}
                onSelectInquiry={setSelectedInquiry}
                onReplyTextChange={setReplyText}
                onReply={handleReplyToInquiry}
                formatDate={formatDate}
                onUpdate={loadData}
              />
            )}
            {activeTab === 'ai_pricing' && (
              <AIPricingTab
                requests={pricingRequests}
                formatPrice={formatPrice}
                formatDate={formatDate}
                onUpdate={loadData}
              />
            )}
            {activeTab === 'free_items' && (
              <FreeItemsTab
                items={freeItems}
                formatDate={formatDate}
                onUpdate={loadData}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Dashboard Tab Component
const DashboardTab: React.FC<{
  stats: DashboardStats;
  formatPrice: (price: number | string) => string;
  formatDate: (date: string) => string;
}> = ({ stats, formatPrice, formatDate }) => {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <div className="bg-white/90 backdrop-blur-sm p-6 rounded-sm border-4 border-amber-800 shadow-[4px_4px_0px_0px_rgba(120,53,15,0.3)] hover:shadow-[6px_6px_0px_0px_rgba(120,53,15,0.3)] transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-2xl border-2 border-amber-800">
              📦
            </div>
            <h3 className="text-sm font-serif font-bold text-amber-900 uppercase tracking-wide">総注文数</h3>
          </div>
          <p className="text-4xl font-serif font-bold text-amber-900">{stats.orders.total}</p>
          <p className="text-sm text-amber-700 mt-2 font-serif italic">今月: {stats.orders.month}件</p>
        </div>
        <div className="bg-white/90 backdrop-blur-sm p-6 rounded-sm border-4 border-amber-800 shadow-[4px_4px_0px_0px_rgba(120,53,15,0.3)] hover:shadow-[6px_6px_0px_0px_rgba(120,53,15,0.3)] transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl border-2 border-green-800">
              💰
            </div>
            <h3 className="text-sm font-serif font-bold text-amber-900 uppercase tracking-wide">総売上</h3>
          </div>
          <p className="text-4xl font-serif font-bold text-green-700">{formatPrice(stats.orders.revenue)}</p>
          <p className="text-sm text-amber-700 mt-2 font-serif italic">今週: {stats.orders.week}件</p>
        </div>
        <div className="bg-white/90 backdrop-blur-sm p-6 rounded-sm border-4 border-amber-800 shadow-[4px_4px_0px_0px_rgba(120,53,15,0.3)] hover:shadow-[6px_6px_0px_0px_rgba(120,53,15,0.3)] transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-2xl border-2 border-red-800">
              ⚠️
            </div>
            <h3 className="text-sm font-serif font-bold text-amber-900 uppercase tracking-wide">未解決のお問い合わせ</h3>
          </div>
          <p className="text-4xl font-serif font-bold text-red-700">{stats.inquiries.unresolved}</p>
          <p className="text-sm text-amber-700 mt-2 font-serif italic">総数: {stats.inquiries.total}件</p>
        </div>
        <div className="bg-white/90 backdrop-blur-sm p-6 rounded-sm border-4 border-blue-800 shadow-[4px_4px_0px_0px_rgba(30,58,138,0.3)] hover:shadow-[6px_6px_0px_0px_rgba(30,58,138,0.3)] transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl border-2 border-blue-800">
              🤖
            </div>
            <h3 className="text-sm font-serif font-bold text-blue-900 uppercase tracking-wide">AI価格設定</h3>
          </div>
          <p className="text-4xl font-serif font-bold text-blue-700">{stats.ai_pricing.total}</p>
          <p className="text-sm text-blue-700 mt-2 font-serif italic">今月: {stats.ai_pricing.month}件</p>
        </div>
        <div className="bg-white/90 backdrop-blur-sm p-6 rounded-sm border-4 border-purple-800 shadow-[4px_4px_0px_0px_rgba(107,33,168,0.3)] hover:shadow-[6px_6px_0px_0px_rgba(107,33,168,0.3)] transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-2xl border-2 border-purple-800">
              🎁
            </div>
            <h3 className="text-sm font-serif font-bold text-purple-900 uppercase tracking-wide">無料あげます</h3>
          </div>
          <p className="text-4xl font-serif font-bold text-purple-700">{stats.free_items.total}</p>
          <p className="text-sm text-purple-700 mt-2 font-serif italic">今月: {stats.free_items.month}件</p>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white/90 backdrop-blur-sm rounded-sm border-4 border-amber-800 shadow-[4px_4px_0px_0px_rgba(120,53,15,0.3)]">
        <div className="p-6 border-b-4 border-amber-800 bg-gradient-to-r from-amber-50 to-orange-50">
          <h2 className="text-xl font-serif font-bold text-amber-900 tracking-wide">📋 最近の注文</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-amber-100 to-orange-100 border-b-2 border-amber-800">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-serif font-bold text-amber-900 uppercase tracking-wider">注文ID</th>
                <th className="px-6 py-4 text-left text-xs font-serif font-bold text-amber-900 uppercase tracking-wider">顧客名</th>
                <th className="px-6 py-4 text-left text-xs font-serif font-bold text-amber-900 uppercase tracking-wider">金額</th>
                <th className="px-6 py-4 text-left text-xs font-serif font-bold text-amber-900 uppercase tracking-wider">ステータス</th>
                <th className="px-6 py-4 text-left text-xs font-serif font-bold text-amber-900 uppercase tracking-wider">日時</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-amber-200">
              {stats.orders.recent.map((order) => (
                <tr key={order.id} className="hover:bg-amber-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono font-bold text-amber-900">#{order.id.slice(0, 8)}</td>
                  <td className="px-6 py-4 text-sm font-serif text-amber-800">{order.full_name}</td>
                  <td className="px-6 py-4 text-sm font-serif font-bold text-green-700">{formatPrice(order.total_amount)}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-sm text-xs font-serif font-bold border-2 ${
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-900 border-yellow-800' :
                      order.status === 'processing' ? 'bg-blue-100 text-blue-900 border-blue-800' :
                      order.status === 'shipped' ? 'bg-purple-100 text-purple-900 border-purple-800' :
                      order.status === 'delivered' ? 'bg-green-100 text-green-900 border-green-800' :
                      'bg-red-100 text-red-900 border-red-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-amber-700 font-serif">{formatDate(order.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Pricing & Free Items Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Pricing Stats */}
        <div className="bg-white/90 backdrop-blur-sm rounded-sm border-4 border-blue-800 shadow-[4px_4px_0px_0px_rgba(30,58,138,0.3)]">
          <div className="p-6 border-b-4 border-blue-800 bg-gradient-to-r from-blue-50 to-indigo-50">
            <h2 className="text-xl font-serif font-bold text-blue-900 tracking-wide">🤖 AI価格設定 統計</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50/50 p-4 rounded-sm border-2 border-blue-200">
                <p className="text-xs font-serif font-bold text-blue-700 uppercase tracking-wide mb-1">総リクエスト</p>
                <p className="text-3xl font-serif font-bold text-blue-900">{stats.ai_pricing.total}</p>
              </div>
              <div className="bg-green-50/50 p-4 rounded-sm border-2 border-green-200">
                <p className="text-xs font-serif font-bold text-green-700 uppercase tracking-wide mb-1">完了</p>
                <p className="text-3xl font-serif font-bold text-green-900">{stats.ai_pricing.priced}</p>
              </div>
              <div className="bg-yellow-50/50 p-4 rounded-sm border-2 border-yellow-200">
                <p className="text-xs font-serif font-bold text-yellow-700 uppercase tracking-wide mb-1">処理中</p>
                <p className="text-3xl font-serif font-bold text-yellow-900">{stats.ai_pricing.pending}</p>
              </div>
              <div className="bg-red-50/50 p-4 rounded-sm border-2 border-red-200">
                <p className="text-xs font-serif font-bold text-red-700 uppercase tracking-wide mb-1">エラー</p>
                <p className="text-3xl font-serif font-bold text-red-900">{stats.ai_pricing.error}</p>
              </div>
            </div>
            <div className="border-t-2 border-blue-200 pt-4">
              <h3 className="text-sm font-serif font-bold text-blue-900 mb-3">最近のリクエスト</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {stats.ai_pricing.recent.length > 0 ? (
                  stats.ai_pricing.recent.map((request) => (
                    <div key={request.id} className="bg-blue-50/30 p-3 rounded-sm border border-blue-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-serif font-bold text-blue-900">{request.title}</p>
                          <p className="text-xs text-blue-700 font-serif">{request.category}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-sm text-xs font-serif font-bold border ${
                          request.status === 'priced' ? 'bg-green-100 text-green-900 border-green-800' :
                          request.status === 'pending' ? 'bg-yellow-100 text-yellow-900 border-yellow-800' :
                          'bg-red-100 text-red-900 border-red-800'
                        }`}>
                          {request.status === 'priced' ? '完了' : request.status === 'pending' ? '処理中' : 'エラー'}
                        </span>
                      </div>
                      {request.suggested_price && (
                        <p className="text-xs text-blue-600 font-serif mt-1">
                          提案価格: {formatPrice(request.suggested_price)}
                        </p>
                      )}
                      <p className="text-xs text-blue-500 font-serif mt-1">{formatDate(request.created_at)}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-blue-600 font-serif text-center py-4">リクエストがありません</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Free Items Stats */}
        <div className="bg-white/90 backdrop-blur-sm rounded-sm border-4 border-purple-800 shadow-[4px_4px_0px_0px_rgba(107,33,168,0.3)]">
          <div className="p-6 border-b-4 border-purple-800 bg-gradient-to-r from-purple-50 to-pink-50">
            <h2 className="text-xl font-serif font-bold text-purple-900 tracking-wide">🎁 無料あげます 統計</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-purple-50/50 p-4 rounded-sm border-2 border-purple-200">
                <p className="text-xs font-serif font-bold text-purple-700 uppercase tracking-wide mb-1">総アイテム</p>
                <p className="text-3xl font-serif font-bold text-purple-900">{stats.free_items.total}</p>
              </div>
              <div className="bg-green-50/50 p-4 rounded-sm border-2 border-green-200">
                <p className="text-xs font-serif font-bold text-green-700 uppercase tracking-wide mb-1">募集中</p>
                <p className="text-3xl font-serif font-bold text-green-900">{stats.free_items.available}</p>
              </div>
              <div className="bg-yellow-50/50 p-4 rounded-sm border-2 border-yellow-200">
                <p className="text-xs font-serif font-bold text-yellow-700 uppercase tracking-wide mb-1">相談中</p>
                <p className="text-3xl font-serif font-bold text-yellow-900">{stats.free_items.reserved}</p>
              </div>
              <div className="bg-blue-50/50 p-4 rounded-sm border-2 border-blue-200">
                <p className="text-xs font-serif font-bold text-blue-700 uppercase tracking-wide mb-1">終了</p>
                <p className="text-3xl font-serif font-bold text-blue-900">{stats.free_items.completed}</p>
              </div>
            </div>
            <div className="border-t-2 border-purple-200 pt-4">
              <h3 className="text-sm font-serif font-bold text-purple-900 mb-3">最近のアイテム</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {stats.free_items.recent.length > 0 ? (
                  stats.free_items.recent.map((item) => (
                    <div key={item.id} className="bg-purple-50/30 p-3 rounded-sm border border-purple-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-serif font-bold text-purple-900">{item.title}</p>
                          <p className="text-xs text-purple-700 font-serif">{item.category || 'カテゴリなし'}</p>
                          <p className="text-xs text-purple-600 font-serif">{item.location_prefecture}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-sm text-xs font-serif font-bold border ${
                          item.status === 'available' ? 'bg-green-100 text-green-900 border-green-800' :
                          item.status === 'reserved' ? 'bg-yellow-100 text-yellow-900 border-yellow-800' :
                          item.status === 'completed' ? 'bg-blue-100 text-blue-900 border-blue-800' :
                          'bg-red-100 text-red-900 border-red-800'
                        }`}>
                          {item.status === 'available' ? '募集中' :
                           item.status === 'reserved' ? '相談中' :
                           item.status === 'completed' ? '終了' : 'キャンセル'}
                        </span>
                      </div>
                      <p className="text-xs text-purple-500 font-serif mt-1">{formatDate(item.created_at)}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-purple-600 font-serif text-center py-4">アイテムがありません</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Orders Tab Component
const OrdersTab: React.FC<{
  orders: Order[];
  formatPrice: (price: number | string) => string;
  formatDate: (date: string) => string;
  onUpdate: () => void;
}> = ({ orders, formatPrice, formatDate, onUpdate }) => {
  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await api.patch(`/orders/${orderId}/update_status/`, { status: newStatus });
      toast.success('注文ステータスを更新しました');
      onUpdate();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('更新に失敗しました');
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-sm border-4 border-amber-800 shadow-[4px_4px_0px_0px_rgba(120,53,15,0.3)]">
      <div className="p-6 border-b-4 border-amber-800 bg-gradient-to-r from-amber-50 to-orange-50">
        <h2 className="text-xl font-serif font-bold text-amber-900 tracking-wide">📦 注文一覧 ({orders.length})</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-amber-100 to-orange-100 border-b-2 border-amber-800">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-serif font-bold text-amber-900 uppercase tracking-wider">注文ID</th>
              <th className="px-6 py-4 text-left text-xs font-serif font-bold text-amber-900 uppercase tracking-wider">顧客名</th>
              <th className="px-6 py-4 text-left text-xs font-serif font-bold text-amber-900 uppercase tracking-wider">金額</th>
              <th className="px-6 py-4 text-left text-xs font-serif font-bold text-amber-900 uppercase tracking-wider">ステータス</th>
              <th className="px-6 py-4 text-left text-xs font-serif font-bold text-amber-900 uppercase tracking-wider">支払い方法</th>
              <th className="px-6 py-4 text-left text-xs font-serif font-bold text-amber-900 uppercase tracking-wider">日時</th>
              <th className="px-6 py-4 text-left text-xs font-serif font-bold text-amber-900 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-amber-200">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-amber-50/50 transition-colors">
                <td className="px-6 py-4 text-sm font-mono font-bold text-amber-900">#{order.id.slice(0, 8)}</td>
                <td className="px-6 py-4 text-sm font-serif text-amber-800">{order.full_name}</td>
                <td className="px-6 py-4 text-sm font-serif font-bold text-green-700">{formatPrice(order.total_amount)}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-3 py-1 rounded-sm text-xs font-serif font-bold border-2 ${
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-900 border-yellow-800' :
                    order.status === 'processing' ? 'bg-blue-100 text-blue-900 border-blue-800' :
                    order.status === 'shipped' ? 'bg-purple-100 text-purple-900 border-purple-800' :
                    order.status === 'delivered' ? 'bg-green-100 text-green-900 border-green-800' :
                    'bg-red-100 text-red-900 border-red-800'
                  }`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-serif text-amber-700">{order.payment_method}</td>
                <td className="px-6 py-4 text-sm text-amber-700 font-serif">{formatDate(order.created_at)}</td>
                <td className="px-6 py-4 text-sm">
                  <select
                    value={order.status}
                    onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                    className="text-xs border-2 border-amber-800 rounded-sm px-2 py-1 font-serif font-bold bg-white hover:bg-amber-50 transition-colors"
                  >
                    <option value="pending">pending</option>
                    <option value="processing">processing</option>
                    <option value="shipped">shipped</option>
                    <option value="delivered">delivered</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Bookings Tab Component
const BookingsTab: React.FC<{
  bookings: Booking[];
  formatPrice: (price: number | string) => string;
  formatDate: (date: string) => string;
  onUpdate: () => void;
}> = ({ bookings, formatPrice, formatDate, onUpdate }) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'incomplete' | 'completed' | 'cancelled'>('all');

  const handleUpdateStatus = async (bookingId: number, newStatus: string) => {
    try {
      await api.patch(`/bookings/${bookingId}/update_status/`, { status: newStatus });
      toast.success('予約ステータスを更新しました');
      onUpdate();
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast.error('更新に失敗しました');
    }
  };

  // Filter bookings by status
  const filteredBookings = React.useMemo(() => {
    let filtered = bookings;
    
    if (filterStatus === 'incomplete') {
      // Chưa hoàn thành = pending + confirmed
      filtered = bookings.filter(booking => 
        booking.status === 'pending' || booking.status === 'confirmed'
      );
    } else if (filterStatus === 'completed') {
      filtered = bookings.filter(booking => booking.status === 'completed');
    } else if (filterStatus === 'cancelled') {
      filtered = bookings.filter(booking => booking.status === 'cancelled');
    }
    
    // Sort by created_at descending (newest first) - từ gần đến xa nhất
    return [...filtered].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA; // Descending order (newest first)
    });
  }, [bookings, filterStatus]);

  // Count bookings by status
  const statusCounts = React.useMemo(() => {
    const incomplete = bookings.filter(b => 
      b.status === 'pending' || b.status === 'confirmed'
    ).length;
    
    return {
      all: bookings.length,
      incomplete: incomplete,
      completed: bookings.filter(b => b.status === 'completed').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
    };
  }, [bookings]);

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="bg-white/90 backdrop-blur-sm rounded-sm border-4 border-amber-800 shadow-[4px_4px_0px_0px_rgba(120,53,15,0.3)]">
        <div className="flex border-b-4 border-amber-800">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-6 py-4 font-serif font-bold text-sm transition-all ${
              filterStatus === 'all'
                ? 'border-b-4 border-amber-800 text-amber-900 bg-gradient-to-b from-amber-50 to-orange-50 shadow-inner'
                : 'text-stone-600 hover:text-amber-900 hover:bg-amber-50/50'
            }`}
          >
            すべて ({statusCounts.all})
          </button>
          <button
            onClick={() => setFilterStatus('incomplete')}
            className={`px-6 py-4 font-serif font-bold text-sm transition-all ${
              filterStatus === 'incomplete'
                ? 'border-b-4 border-yellow-800 text-yellow-900 bg-gradient-to-b from-yellow-50 to-orange-50 shadow-inner'
                : 'text-stone-600 hover:text-yellow-900 hover:bg-yellow-50/50'
            }`}
          >
            未完了 ({statusCounts.incomplete})
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-6 py-4 font-serif font-bold text-sm transition-all ${
              filterStatus === 'completed'
                ? 'border-b-4 border-green-800 text-green-900 bg-gradient-to-b from-green-50 to-emerald-50 shadow-inner'
                : 'text-stone-600 hover:text-green-900 hover:bg-green-50/50'
            }`}
          >
            完了 ({statusCounts.completed})
          </button>
          <button
            onClick={() => setFilterStatus('cancelled')}
            className={`px-6 py-4 font-serif font-bold text-sm transition-all ${
              filterStatus === 'cancelled'
                ? 'border-b-4 border-red-800 text-red-900 bg-gradient-to-b from-red-50 to-rose-50 shadow-inner'
                : 'text-stone-600 hover:text-red-900 hover:bg-red-50/50'
            }`}
          >
            キャンセル ({statusCounts.cancelled})
          </button>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white/90 backdrop-blur-sm rounded-sm border-4 border-amber-800 shadow-[4px_4px_0px_0px_rgba(120,53,15,0.3)]">
        <div className="p-6 border-b-4 border-amber-800 bg-gradient-to-r from-amber-50 to-orange-50">
          <h2 className="text-xl font-serif font-bold text-amber-900 tracking-wide">
            {filterStatus === 'all' && `📅 予約一覧 (${filteredBookings.length})`}
            {filterStatus === 'incomplete' && `⏳ 未完了の予約 (${filteredBookings.length})`}
            {filterStatus === 'completed' && `✅ 完了した予約 (${filteredBookings.length})`}
            {filterStatus === 'cancelled' && `❌ キャンセルされた予約 (${filteredBookings.length})`}
          </h2>
        </div>
        <div className="overflow-x-auto">
          {filteredBookings.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gradient-to-r from-amber-100 to-orange-100 border-b-2 border-amber-800">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-serif font-bold text-amber-900 uppercase tracking-wider">予約ID</th>
                  <th className="px-6 py-4 text-left text-xs font-serif font-bold text-amber-900 uppercase tracking-wider">顧客名</th>
                  <th className="px-6 py-4 text-left text-xs font-serif font-bold text-amber-900 uppercase tracking-wider">予約日</th>
                  <th className="px-6 py-4 text-left text-xs font-serif font-bold text-amber-900 uppercase tracking-wider">時間</th>
                  <th className="px-6 py-4 text-left text-xs font-serif font-bold text-amber-900 uppercase tracking-wider">金額</th>
                  <th className="px-6 py-4 text-left text-xs font-serif font-bold text-amber-900 uppercase tracking-wider">ステータス</th>
                  <th className="px-6 py-4 text-left text-xs font-serif font-bold text-amber-900 uppercase tracking-wider">作成日時</th>
                  <th className="px-6 py-4 text-left text-xs font-serif font-bold text-amber-900 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-amber-200">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-amber-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono font-bold text-amber-900">#{booking.id}</td>
                    <td className="px-6 py-4 text-sm font-serif text-amber-800">{booking.customer_name}</td>
                    <td className="px-6 py-4 text-sm font-serif text-amber-700">{new Date(booking.booking_date).toLocaleDateString('ja-JP')}</td>
                    <td className="px-6 py-4 text-sm font-serif text-amber-700">{booking.time_slot}</td>
                    <td className="px-6 py-4 text-sm font-serif font-bold text-green-700">{formatPrice(booking.total_price)}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-sm text-xs font-serif font-bold border-2 ${
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-900 border-yellow-800' :
                        booking.status === 'confirmed' ? 'bg-blue-100 text-blue-900 border-blue-800' :
                        booking.status === 'completed' ? 'bg-green-100 text-green-900 border-green-800' :
                        'bg-red-100 text-red-900 border-red-800'
                      }`}>
                        {booking.status === 'pending' ? '保留中' :
                         booking.status === 'confirmed' ? '確認済み' :
                         booking.status === 'completed' ? '完了' :
                         'キャンセル'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-amber-700 font-serif">{formatDate(booking.created_at)}</td>
                    <td className="px-6 py-4 text-sm">
                      <select
                        value={booking.status}
                        onChange={(e) => handleUpdateStatus(booking.id, e.target.value)}
                        className="text-xs border-2 border-amber-800 rounded-sm px-2 py-1 font-serif font-bold bg-white hover:bg-amber-50 transition-colors"
                      >
                        <option value="pending">pending</option>
                        <option value="confirmed">confirmed</option>
                        <option value="completed">completed</option>
                        <option value="cancelled">cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-amber-700">
              <span className="text-5xl block mb-4">📅</span>
              <p className="font-serif text-lg">該当する予約がありません</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Inquiries Tab Component
const InquiriesTab: React.FC<{
  inquiries: Contact[];
  selectedInquiry: Contact | null;
  replyText: string;
  onSelectInquiry: (inquiry: Contact | null) => void;
  onReplyTextChange: (text: string) => void;
  onReply: (inquiryId: number) => void;
  formatDate: (date: string) => string;
  onUpdate: () => void;
}> = ({ inquiries, selectedInquiry, replyText, onSelectInquiry, onReplyTextChange, onReply, formatDate, onUpdate }) => {
  const handleMarkResolved = async (inquiryId: number, isResolved: boolean) => {
    try {
      await adminService.updateContactResolved(inquiryId, isResolved);
      toast.success(isResolved ? '解決済みにマークしました' : '未解決に戻しました');
      onUpdate();
    } catch (error) {
      toast.error('更新に失敗しました');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Inquiries List */}
      <div className="bg-white/90 backdrop-blur-sm rounded-sm border-4 border-amber-800 shadow-[4px_4px_0px_0px_rgba(120,53,15,0.3)]">
        <div className="p-6 border-b-4 border-amber-800 bg-gradient-to-r from-amber-50 to-orange-50">
          <h2 className="text-xl font-serif font-bold text-amber-900 tracking-wide">💬 お問い合わせ一覧 ({Array.isArray(inquiries) ? inquiries.length : 0})</h2>
        </div>
        <div className="divide-y-2 divide-amber-200 max-h-[600px] overflow-y-auto">
          {Array.isArray(inquiries) && inquiries.length > 0 ? inquiries.map((inquiry) => (
            <div
              key={inquiry.id}
              onClick={() => onSelectInquiry(inquiry)}
              className={`p-4 cursor-pointer hover:bg-amber-50/50 transition-all ${
                selectedInquiry?.id === inquiry.id ? 'bg-amber-100 border-l-4 border-amber-800 shadow-inner' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif font-bold text-amber-900">{inquiry.name}</h3>
                    {!inquiry.is_resolved && (
                      <span className="px-2 py-1 bg-red-100 text-red-900 text-xs rounded-sm border-2 border-red-800 font-serif font-bold">未解決</span>
                    )}
                  </div>
                  <p className="text-sm text-amber-700 mt-1 font-serif">{inquiry.email}</p>
                  <p className="text-sm text-amber-600 mt-2 line-clamp-2 font-serif">{inquiry.message}</p>
                  <p className="text-xs text-amber-500 mt-2 font-serif italic">{formatDate(inquiry.created_at)}</p>
                </div>
              </div>
            </div>
          )) : (
            <div className="p-12 text-center text-amber-700">
              <span className="text-5xl block mb-4">💬</span>
              <p className="font-serif text-lg">お問い合わせがありません</p>
            </div>
          )}
        </div>
      </div>

      {/* Inquiry Detail & Reply */}
      <div className="bg-white/90 backdrop-blur-sm rounded-sm border-4 border-amber-800 shadow-[4px_4px_0px_0px_rgba(120,53,15,0.3)]">
        {selectedInquiry ? (
          <div className="p-6 space-y-6">
            <div className="border-b-4 border-amber-800 pb-4">
              <h2 className="text-xl font-serif font-bold text-amber-900 tracking-wide mb-4">📋 お問い合わせ詳細</h2>
              <div className="space-y-4">
                <div className="bg-amber-50/50 p-4 rounded-sm border-2 border-amber-200">
                  <label className="text-sm font-serif font-bold text-amber-900 uppercase tracking-wide block mb-1">お名前</label>
                  <p className="text-amber-900 font-serif">{selectedInquiry.name}</p>
                </div>
                <div className="bg-amber-50/50 p-4 rounded-sm border-2 border-amber-200">
                  <label className="text-sm font-serif font-bold text-amber-900 uppercase tracking-wide block mb-1">メールアドレス</label>
                  <p className="text-amber-900 font-serif">{selectedInquiry.email}</p>
                </div>
                <div className="bg-amber-50/50 p-4 rounded-sm border-2 border-amber-200">
                  <label className="text-sm font-serif font-bold text-amber-900 uppercase tracking-wide block mb-1">お問い合わせ内容</label>
                  <p className="text-amber-800 font-serif whitespace-pre-wrap leading-relaxed">{selectedInquiry.message}</p>
                </div>
                {selectedInquiry.admin_reply && (
                  <div className="bg-green-50/50 p-4 rounded-sm border-2 border-green-300">
                    <label className="text-sm font-serif font-bold text-green-900 uppercase tracking-wide block mb-1">返信内容</label>
                    <p className="text-green-900 font-serif whitespace-pre-wrap leading-relaxed">
                      {selectedInquiry.admin_reply}
                    </p>
                    {selectedInquiry.replied_by_email && (
                      <p className="text-xs text-green-700 mt-2 font-serif italic">
                        返信者: {selectedInquiry.replied_by_email} ({formatDate(selectedInquiry.replied_at || '')})
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {!selectedInquiry.is_resolved && (
              <div className="border-t-4 border-amber-800 pt-6">
                <label className="block text-sm font-serif font-bold text-amber-900 uppercase tracking-wide mb-3">返信内容</label>
                <textarea
                  value={replyText}
                  onChange={(e) => onReplyTextChange(e.target.value)}
                  rows={6}
                  className="w-full border-2 border-amber-800 rounded-sm p-4 font-serif focus:ring-2 focus:ring-amber-500 focus:border-amber-600 bg-white/90"
                  placeholder="返信内容を入力してください..."
                />
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => onReply(selectedInquiry.id)}
                    className="px-6 py-3 bg-amber-800 text-white font-serif font-bold rounded-sm border-2 border-amber-950 shadow-[4px_4px_0px_0px_rgba(69,26,3,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(69,26,3,1)] transition-all"
                  >
                    ✉️ 返信を送信
                  </button>
                  <button
                    onClick={() => handleMarkResolved(selectedInquiry.id, true)}
                    className="px-6 py-3 bg-stone-200 text-stone-900 font-serif font-bold rounded-sm border-2 border-stone-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] transition-all"
                  >
                    ✅ 解決済みにする
                  </button>
                </div>
              </div>
            )}

            {selectedInquiry.is_resolved && (
              <div className="border-t-4 border-amber-800 pt-6">
                <button
                  onClick={() => handleMarkResolved(selectedInquiry.id, false)}
                  className="px-6 py-3 bg-stone-200 text-stone-900 font-serif font-bold rounded-sm border-2 border-stone-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] transition-all"
                >
                  🔄 未解決に戻す
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-12 text-center text-amber-700">
            <span className="text-5xl block mb-4">💬</span>
            <p className="font-serif text-lg">お問い合わせを選択してください</p>
          </div>
        )}
      </div>
    </div>
  );
};

// AI Pricing Tab Component
const AIPricingTab: React.FC<{
  requests: PricingRequest[];
  formatPrice: (price: number | string) => string;
  formatDate: (date: string) => string;
  onUpdate: () => void;
}> = ({ requests, formatPrice, formatDate, onUpdate }) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'priced' | 'error' | 'rejected'>('all');

  const handleUpdateStatus = async (requestId: string, newStatus: string) => {
    try {
      await pricingService.adminUpdateStatus(requestId, newStatus);
      toast.success('ステータスを更新しました');
      onUpdate();
    } catch (error) {
      console.error('Error updating pricing request status:', error);
      toast.error('更新に失敗しました');
    }
  };

  const handleDelete = async (requestId: string) => {
    if (!confirm('このリクエストを削除してもよろしいですか？')) {
      return;
    }
    try {
      await pricingService.adminDelete(requestId);
      toast.success('削除しました');
      onUpdate();
    } catch (error) {
      console.error('Error deleting pricing request:', error);
      toast.error('削除に失敗しました');
    }
  };

  const filteredRequests = React.useMemo(() => {
    if (filterStatus === 'all') {
      return requests;
    }
    return requests.filter(request => request.status === filterStatus);
  }, [requests, filterStatus]);

  const statusCounts = React.useMemo(() => {
    return {
      all: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      priced: requests.filter(r => r.status === 'priced').length,
      error: requests.filter(r => r.status === 'error').length,
      rejected: requests.filter(r => r.status === 'rejected').length,
    };
  }, [requests]);

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'pending': '処理中',
      'validated': '検証済み',
      'priced': '完了',
      'error': 'エラー',
      'rejected': '拒否',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-900 border-yellow-800',
      'validated': 'bg-blue-100 text-blue-900 border-blue-800',
      'priced': 'bg-green-100 text-green-900 border-green-800',
      'error': 'bg-red-100 text-red-900 border-red-800',
      'rejected': 'bg-gray-100 text-gray-900 border-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-900 border-gray-800';
  };

  return (
    <div className="space-y-4">
      <div className="bg-white/90 backdrop-blur-sm rounded-sm border-4 border-blue-800 shadow-[4px_4px_0px_0px_rgba(30,58,138,0.3)]">
        <div className="flex border-b-4 border-blue-800 overflow-x-auto">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-6 py-4 font-serif font-bold text-sm transition-all whitespace-nowrap ${
              filterStatus === 'all'
                ? 'border-b-4 border-blue-800 text-blue-900 bg-gradient-to-b from-blue-50 to-indigo-50 shadow-inner'
                : 'text-stone-600 hover:text-blue-900 hover:bg-blue-50/50'
            }`}
          >
            すべて ({statusCounts.all})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-6 py-4 font-serif font-bold text-sm transition-all whitespace-nowrap ${
              filterStatus === 'pending'
                ? 'border-b-4 border-yellow-800 text-yellow-900 bg-gradient-to-b from-yellow-50 to-orange-50 shadow-inner'
                : 'text-stone-600 hover:text-yellow-900 hover:bg-yellow-50/50'
            }`}
          >
            処理中 ({statusCounts.pending})
          </button>
          <button
            onClick={() => setFilterStatus('priced')}
            className={`px-6 py-4 font-serif font-bold text-sm transition-all whitespace-nowrap ${
              filterStatus === 'priced'
                ? 'border-b-4 border-green-800 text-green-900 bg-gradient-to-b from-green-50 to-emerald-50 shadow-inner'
                : 'text-stone-600 hover:text-green-900 hover:bg-green-50/50'
            }`}
          >
            完了 ({statusCounts.priced})
          </button>
          <button
            onClick={() => setFilterStatus('error')}
            className={`px-6 py-4 font-serif font-bold text-sm transition-all whitespace-nowrap ${
              filterStatus === 'error'
                ? 'border-b-4 border-red-800 text-red-900 bg-gradient-to-b from-red-50 to-rose-50 shadow-inner'
                : 'text-stone-600 hover:text-red-900 hover:bg-red-50/50'
            }`}
          >
            エラー ({statusCounts.error})
          </button>
          <button
            onClick={() => setFilterStatus('rejected')}
            className={`px-6 py-4 font-serif font-bold text-sm transition-all whitespace-nowrap ${
              filterStatus === 'rejected'
                ? 'border-b-4 border-gray-800 text-gray-900 bg-gradient-to-b from-gray-50 to-slate-50 shadow-inner'
                : 'text-stone-600 hover:text-gray-900 hover:bg-gray-50/50'
            }`}
          >
            拒否 ({statusCounts.rejected})
          </button>
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur-sm rounded-sm border-4 border-blue-800 shadow-[4px_4px_0px_0px_rgba(30,58,138,0.3)]">
        <div className="p-6 border-b-4 border-blue-800 bg-gradient-to-r from-blue-50 to-indigo-50">
          <h2 className="text-xl font-serif font-bold text-blue-900 tracking-wide">
            🤖 AI価格設定リクエスト ({filteredRequests.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          {filteredRequests.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-100 to-indigo-100 border-b-2 border-blue-800">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-serif font-bold text-blue-900 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-4 text-left text-xs font-serif font-bold text-blue-900 uppercase tracking-wider">製品名</th>
                  <th className="px-6 py-4 text-left text-xs font-serif font-bold text-blue-900 uppercase tracking-wider">カテゴリ</th>
                  <th className="px-6 py-4 text-left text-xs font-serif font-bold text-blue-900 uppercase tracking-wider">提案価格</th>
                  <th className="px-6 py-4 text-left text-xs font-serif font-bold text-blue-900 uppercase tracking-wider">ステータス</th>
                  <th className="px-6 py-4 text-left text-xs font-serif font-bold text-blue-900 uppercase tracking-wider">作成日時</th>
                  <th className="px-6 py-4 text-left text-xs font-serif font-bold text-blue-900 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-blue-200">
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono font-bold text-blue-900">#{request.id.slice(0, 8)}</td>
                    <td className="px-6 py-4 text-sm font-serif text-blue-800">{request.title}</td>
                    <td className="px-6 py-4 text-sm font-serif text-blue-700">{request.category}</td>
                    <td className="px-6 py-4 text-sm font-serif font-bold text-green-700">
                      {request.suggested_price ? formatPrice(request.suggested_price) : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-sm text-xs font-serif font-bold border-2 ${getStatusColor(request.status)}`}>
                        {getStatusLabel(request.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-blue-700 font-serif">{formatDate(request.created_at)}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <select
                          value={request.status}
                          onChange={(e) => handleUpdateStatus(request.id, e.target.value)}
                          className="text-xs border-2 border-blue-800 rounded-sm px-2 py-1 font-serif font-bold bg-white hover:bg-blue-50 transition-colors"
                          title="ステータスを変更"
                        >
                          <option value="pending">処理中</option>
                          <option value="validated">検証済み</option>
                          <option value="priced">完了</option>
                          <option value="error">エラー</option>
                          <option value="rejected">拒否</option>
                        </select>
                        <button
                          onClick={() => handleDelete(request.id)}
                          className="px-3 py-1 bg-red-100 text-red-900 text-xs rounded-sm border-2 border-red-800 font-serif font-bold hover:bg-red-200 transition-colors"
                        >
                          削除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-blue-700">
              <span className="text-5xl block mb-4">🤖</span>
              <p className="font-serif text-lg">該当するリクエストがありません</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Free Items Tab Component
const FreeItemsTab: React.FC<{
  items: FreeItem[];
  formatDate: (date: string) => string;
  onUpdate: () => void;
}> = ({ items, formatDate, onUpdate }) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'reserved' | 'completed' | 'cancelled'>('all');

  const handleUpdateStatus = async (itemId: string, newStatus: string) => {
    try {
      await freeItemService.adminUpdateStatus(itemId, newStatus);
      toast.success('ステータスを更新しました');
      onUpdate();
    } catch (error) {
      console.error('Error updating free item status:', error);
      toast.error('更新に失敗しました');
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('このアイテムを削除してもよろしいですか？')) {
      return;
    }
    try {
      await freeItemService.adminDelete(itemId);
      toast.success('削除しました');
      onUpdate();
    } catch (error) {
      console.error('Error deleting free item:', error);
      toast.error('削除に失敗しました');
    }
  };

  const filteredItems = React.useMemo(() => {
    if (filterStatus === 'all') {
      return items;
    }
    return items.filter(item => item.status === filterStatus);
  }, [items, filterStatus]);

  const statusCounts = React.useMemo(() => {
    return {
      all: items.length,
      available: items.filter(i => i.status === 'available').length,
      reserved: items.filter(i => i.status === 'reserved').length,
      completed: items.filter(i => i.status === 'completed').length,
      cancelled: items.filter(i => i.status === 'cancelled').length,
    };
  }, [items]);

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'available': '募集中',
      'reserved': '相談中',
      'completed': '終了',
      'cancelled': 'キャンセル',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'available': 'bg-green-100 text-green-900 border-green-800',
      'reserved': 'bg-yellow-100 text-yellow-900 border-yellow-800',
      'completed': 'bg-blue-100 text-blue-900 border-blue-800',
      'cancelled': 'bg-red-100 text-red-900 border-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-900 border-gray-800';
  };

  return (
    <div className="space-y-4">
      <div className="bg-white/90 backdrop-blur-sm rounded-sm border-4 border-purple-800 shadow-[4px_4px_0px_0px_rgba(107,33,168,0.3)]">
        <div className="flex border-b-4 border-purple-800 overflow-x-auto">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-6 py-4 font-serif font-bold text-sm transition-all whitespace-nowrap ${
              filterStatus === 'all'
                ? 'border-b-4 border-purple-800 text-purple-900 bg-gradient-to-b from-purple-50 to-pink-50 shadow-inner'
                : 'text-stone-600 hover:text-purple-900 hover:bg-purple-50/50'
            }`}
          >
            すべて ({statusCounts.all})
          </button>
          <button
            onClick={() => setFilterStatus('available')}
            className={`px-6 py-4 font-serif font-bold text-sm transition-all whitespace-nowrap ${
              filterStatus === 'available'
                ? 'border-b-4 border-green-800 text-green-900 bg-gradient-to-b from-green-50 to-emerald-50 shadow-inner'
                : 'text-stone-600 hover:text-green-900 hover:bg-green-50/50'
            }`}
          >
            募集中 ({statusCounts.available})
          </button>
          <button
            onClick={() => setFilterStatus('reserved')}
            className={`px-6 py-4 font-serif font-bold text-sm transition-all whitespace-nowrap ${
              filterStatus === 'reserved'
                ? 'border-b-4 border-yellow-800 text-yellow-900 bg-gradient-to-b from-yellow-50 to-orange-50 shadow-inner'
                : 'text-stone-600 hover:text-yellow-900 hover:bg-yellow-50/50'
            }`}
          >
            相談中 ({statusCounts.reserved})
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-6 py-4 font-serif font-bold text-sm transition-all whitespace-nowrap ${
              filterStatus === 'completed'
                ? 'border-b-4 border-blue-800 text-blue-900 bg-gradient-to-b from-blue-50 to-indigo-50 shadow-inner'
                : 'text-stone-600 hover:text-blue-900 hover:bg-blue-50/50'
            }`}
          >
            終了 ({statusCounts.completed})
          </button>
          <button
            onClick={() => setFilterStatus('cancelled')}
            className={`px-6 py-4 font-serif font-bold text-sm transition-all whitespace-nowrap ${
              filterStatus === 'cancelled'
                ? 'border-b-4 border-red-800 text-red-900 bg-gradient-to-b from-red-50 to-rose-50 shadow-inner'
                : 'text-stone-600 hover:text-red-900 hover:bg-red-50/50'
            }`}
          >
            キャンセル ({statusCounts.cancelled})
          </button>
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur-sm rounded-sm border-4 border-purple-800 shadow-[4px_4px_0px_0px_rgba(107,33,168,0.3)]">
        <div className="p-6 border-b-4 border-purple-800 bg-gradient-to-r from-purple-50 to-pink-50">
          <h2 className="text-xl font-serif font-bold text-purple-900 tracking-wide">
            🎁 無料アイテム ({filteredItems.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          {filteredItems.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-100 to-pink-100 border-b-2 border-purple-800">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-serif font-bold text-purple-900 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-4 text-left text-xs font-serif font-bold text-purple-900 uppercase tracking-wider">タイトル</th>
                  <th className="px-6 py-4 text-left text-xs font-serif font-bold text-purple-900 uppercase tracking-wider">カテゴリ</th>
                  <th className="px-6 py-4 text-left text-xs font-serif font-bold text-purple-900 uppercase tracking-wider">場所</th>
                  <th className="px-6 py-4 text-left text-xs font-serif font-bold text-purple-900 uppercase tracking-wider">閲覧数</th>
                  <th className="px-6 py-4 text-left text-xs font-serif font-bold text-purple-900 uppercase tracking-wider">ステータス</th>
                  <th className="px-6 py-4 text-left text-xs font-serif font-bold text-purple-900 uppercase tracking-wider">作成日時</th>
                  <th className="px-6 py-4 text-left text-xs font-serif font-bold text-purple-900 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-purple-200">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-purple-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono font-bold text-purple-900">#{item.id.slice(0, 8)}</td>
                    <td className="px-6 py-4 text-sm font-serif text-purple-800">{item.title}</td>
                    <td className="px-6 py-4 text-sm font-serif text-purple-700">{item.category || '-'}</td>
                    <td className="px-6 py-4 text-sm font-serif text-purple-700">
                      {item.location_prefecture} {item.location_city}
                    </td>
                    <td className="px-6 py-4 text-sm font-serif text-purple-700">{item.views_count}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-sm text-xs font-serif font-bold border-2 ${getStatusColor(item.status)}`}>
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-purple-700 font-serif">{formatDate(item.created_at)}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <select
                          value={item.status}
                          onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                          className="text-xs border-2 border-purple-800 rounded-sm px-2 py-1 font-serif font-bold bg-white hover:bg-purple-50 transition-colors"
                          title="ステータスを変更"
                        >
                          <option value="available">募集中</option>
                          <option value="reserved">相談中</option>
                          <option value="completed">終了</option>
                          <option value="cancelled">キャンセル</option>
                        </select>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="px-3 py-1 bg-red-100 text-red-900 text-xs rounded-sm border-2 border-red-800 font-serif font-bold hover:bg-red-200 transition-colors"
                        >
                          削除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-purple-700">
              <span className="text-5xl block mb-4">🎁</span>
              <p className="font-serif text-lg">該当するアイテムがありません</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

