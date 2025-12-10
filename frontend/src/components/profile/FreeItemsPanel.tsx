import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { freeItemService } from '../../services/freeItemService';
import type { FreeItem, Conversation } from '../../types/freeItem';
import { FreeItemStatusBadge } from '../freeItem/FreeItemStatusBadge';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

type TabType = 'my-items' | 'exchanging';

export const FreeItemsPanel: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('my-items');
  const [myItems, setMyItems] = useState<FreeItem[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const filteredConversations = useMemo(() => {
    if (!user) return [];
    const currentUserId = String(user.id);

    // Lọc theo vai trò
    const filtered = conversations.filter((c) => {
      const isOwner = String(c.free_item.user.id) === currentUserId;
      // Chủ đăng: chỉ cần có other_user (người nhắn vào)
      if (isOwner) return Boolean(c.other_user);
      // Người nhận: có conversation
      return c.last_message !== null;
    });

    // Đảm bảo mỗi sản phẩm chỉ xuất hiện 1 lần
    const uniqueByItem = new Map<string, Conversation>();
    filtered.forEach((c) => {
      const key = c.free_item.id;
      if (!uniqueByItem.has(key)) {
        uniqueByItem.set(key, c);
      }
    });
    return Array.from(uniqueByItem.values());
  }, [conversations, user]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (activeTab === 'my-items') {
          const data = await freeItemService.getMyItems();
          setMyItems(data.results);
          
          // Fetch unread message counts for each item
          const counts: Record<string, number> = {};
          if (user) {
            const currentUserId = String(user.id);
            for (const item of data.results) {
              try {
                const messages = await freeItemService.getItemMessages(item.id);
                // Count unread messages where current user is the receiver
                const unread = messages.filter(msg => !msg.is_read && String(msg.receiver.id) === currentUserId).length;
                counts[item.id] = unread;
              } catch {
                counts[item.id] = 0;
              }
            }
          }
          setUnreadCounts(counts);
        } else {
          const convos = await freeItemService.getConversations();
          setConversations(convos);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
        toast.error('データの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [activeTab, user]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-stone-900 mb-4">🆓 無料あげます</h2>
        
        {/* Tabs */}
        <div className="flex border-b border-stone-200 mb-6">
          <button
            onClick={() => setActiveTab('my-items')}
            className={`px-6 py-3 font-medium transition-colors relative ${
              activeTab === 'my-items'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            投稿したアイテム
            {activeTab === 'my-items' && (() => {
              const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + (count || 0), 0);
              return totalUnread > 0 ? (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {totalUnread}
              </span>
              ) : null;
            })()}
          </button>
          <button
            onClick={() => setActiveTab('exchanging')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'exchanging'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            交換中のアイテム
            {activeTab === 'exchanging' && (() => {
              const totalUnread = filteredConversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);
              return totalUnread > 0 ? (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                  {totalUnread}
                </span>
              ) : null;
            })()}
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner />
        </div>
      ) : activeTab === 'my-items' ? (
        <div>
          {myItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-stone-500 mb-4">投稿したアイテムがありません</p>
              <Link
                to="/free-items/create"
                className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700"
              >
                最初のアイテムを投稿する
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {myItems.map((item) => (
                <div key={item.id} className="border border-stone-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <Link
                        to={`/free-items/${item.id}`}
                        className="text-lg font-bold text-stone-900 hover:text-green-700"
                      >
                        {item.title}
                      </Link>
                      <div className="flex items-center gap-2 mt-2">
                        <FreeItemStatusBadge status={item.status} />
                        <span className="text-sm text-stone-500">
                          {item.location_prefecture} {item.location_city}
                        </span>
                      </div>
                    </div>
                    {unreadCounts[item.id] > 0 && (
                      <Link
                        to={`/free-items/${item.id}`}
                        className="relative ml-4"
                      >
                        <div className="bg-red-500 text-white rounded-full px-3 py-1 text-sm font-bold hover:bg-red-600 transition-colors">
                          💬 {unreadCounts[item.id]}件の未読メッセージ
                        </div>
                      </Link>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to={`/free-items/${item.id}`}
                      className="px-4 py-2 bg-stone-200 text-stone-700 rounded text-sm font-medium hover:bg-stone-300"
                    >
                      詳細を見る
                    </Link>
                    <Link
                      to={`/free-items/${item.id}/edit`}
                      className="px-4 py-2 bg-green-100 text-green-700 rounded text-sm font-medium hover:bg-green-200"
                    >
                      編集
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          {filteredConversations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-stone-500 mb-4">交換中のアイテムがありません</p>
              <Link
                to="/free-items"
                className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700"
              >
                アイテムを探す
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.free_item.id}
                  className="border border-stone-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <Link
                        to={`/free-items/${conversation.free_item.id}`}
                        className="text-lg font-bold text-stone-900 hover:text-green-700"
                      >
                        {conversation.free_item.title}
                      </Link>
                      <div className="flex items-center gap-2 mt-2">
                        <FreeItemStatusBadge status={conversation.free_item.status} />
                        <span className="text-sm text-stone-500">
                          {conversation.free_item.location_prefecture} {conversation.free_item.location_city}
                        </span>
                      </div>
                      {conversation.other_user && (
                        <div className="mt-2 text-sm text-stone-600">
                          {String(conversation.free_item.user.id) === String(user?.id)
                            ? `問い合わせ者: ${conversation.other_user.profile?.full_name || conversation.other_user.email}`
                            : `投稿者: ${conversation.other_user.profile?.full_name || conversation.other_user.email}`
                          }
                        </div>
                      )}
                      {conversation.last_message && (
                        <div className="mt-2 text-sm text-stone-500 italic">
                          {String(conversation.last_message.sender.id) === String(user?.id) ? 'あなた: ' : ''}
                          "{conversation.last_message.message.substring(0, 50)}..."
                        </div>
                      )}
                    </div>
                    {conversation.unread_count > 0 && (
                      <Link
                        to={`/free-items/${conversation.free_item.id}`}
                        className="relative ml-4"
                      >
                        <div className="bg-red-500 text-white rounded-full px-3 py-1 text-sm font-bold hover:bg-red-600 transition-colors">
                          💬 {conversation.unread_count}件の未読
                        </div>
                      </Link>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-stone-500">
                      {conversation.last_message
                        ? new Date(conversation.last_message.created_at).toLocaleString('ja-JP')
                        : 'メッセージなし'}
                    </span>
                    <Link
                      to={`/free-items/${conversation.free_item.id}`}
                      className="px-4 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700"
                    >
                      メッセージを見る
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

