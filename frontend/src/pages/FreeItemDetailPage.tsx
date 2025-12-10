import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { FreeItemConditionBadge } from '../components/freeItem/FreeItemConditionBadge';
import { FreeItemStatusBadge } from '../components/freeItem/FreeItemStatusBadge';
import { freeItemService } from '../services/freeItemService';
import type { FreeItem, FreeItemMessage, FreeItemStatus } from '../types/freeItem';
import { CONDITION_LABELS, PICKUP_METHOD_LABELS } from '../types/freeItem';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

export const FreeItemDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [item, setItem] = useState<FreeItem | null>(null);
  const [messages, setMessages] = useState<FreeItemMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [statusValue, setStatusValue] = useState<FreeItemStatus>('available');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const itemData = await freeItemService.getFreeItem(id);
        setItem(itemData);
        setStatusValue(itemData.status);
        
        // Load messages nếu user đã đăng nhập
        if (user) {
          try {
            const messagesData = await freeItemService.getItemMessages(id);
            setMessages(messagesData);
          } catch (error) {
            // Nếu không có quyền xem messages, set empty array
            setMessages([]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch item:', error);
        toast.error('アイテムの取得に失敗しました');
        navigate('/free-items');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, user, navigate]);

  const handleSendMessage = async () => {
    if (!item || !messageText.trim() || !user) return;

    setIsSending(true);
    try {
      const newMessage = await freeItemService.sendMessage(item.id, messageText.trim());
      setMessages(prev => [...prev, newMessage]);
      setMessageText('');
      toast.success('メッセージを送信しました');
      
      // Reload messages để đảm bảo có đầy đủ
      try {
        const updatedMessages = await freeItemService.getItemMessages(item.id);
        setMessages(updatedMessages);
      } catch (error) {
        // Ignore error, messages đã được update ở trên
      }
    } catch (error: any) {
      console.error('Failed to send message:', error);
      toast.error(error.response?.data?.error || 'メッセージの送信に失敗しました');
    } finally {
      setIsSending(false);
    }
  };

  const isOwner = user && item && user.id === item.user.id;
  const hasConversation = messages.length > 0;
  // Có thể gửi message nếu:
  // 1. Không phải owner và chưa có conversation (gửi message đầu tiên)
  // 2. Đã có conversation (cả owner và người gửi message đầu tiên đều có thể reply)
  const canSendMessage = user && item && item.status !== 'completed' && (
    (!isOwner && !hasConversation) || hasConversation
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50">
        <Header />
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!item) {
    return null;
  }

  const images = item.images || [];
  const mainImage = images[currentImageIndex]?.image_url || null;

  return (
    <div className="min-h-screen bg-stone-50">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-4">
          <button
            onClick={() => navigate('/free-items')}
            className="text-stone-600 hover:text-stone-900 flex items-center gap-2"
          >
            ← 一覧に戻る
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Images */}
          <div>
            {mainImage ? (
              <div className="relative">
                <img
                  src={mainImage}
                  alt={item.title}
                  className="w-full aspect-square object-cover rounded-lg border border-stone-200"
                />
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex(prev => Math.max(0, prev - 1))}
                      disabled={currentImageIndex === 0}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 disabled:opacity-50"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex(prev => Math.min(images.length - 1, prev + 1))}
                      disabled={currentImageIndex === images.length - 1}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 disabled:opacity-50"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded">
                      {currentImageIndex + 1} / {images.length}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="w-full aspect-square bg-stone-200 rounded-lg flex items-center justify-center">
                <span className="text-stone-400">画像なし</span>
              </div>
            )}

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2 mt-4">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`aspect-square rounded border-2 overflow-hidden ${
                      currentImageIndex === idx ? 'border-green-600' : 'border-stone-300'
                    }`}
                  >
                    <img src={img.image_url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                  🆓 無料
                </span>
                <FreeItemStatusBadge status={item.status} />
              </div>
              <h1 className="text-3xl font-bold text-stone-900 mb-4">{item.title}</h1>
            </div>

            <div className="bg-white rounded-lg p-6 border border-stone-200 space-y-4">
              <div>
                <h3 className="font-bold text-stone-900 mb-2">説明</h3>
                <p className="text-stone-700 whitespace-pre-wrap">{item.description}</p>
              </div>

              <div>
                <h3 className="font-bold text-stone-900 mb-2">状態</h3>
                <FreeItemConditionBadge condition={item.condition} />
              </div>

              <div>
                <h3 className="font-bold text-stone-900 mb-2">場所</h3>
                <p className="text-stone-700">
                  {item.location_prefecture} {item.location_city}
                  {item.location_detail && ` ${item.location_detail}`}
                </p>
              </div>

              <div>
                <h3 className="font-bold text-stone-900 mb-2">受け取り方法</h3>
                <p className="text-stone-700">{PICKUP_METHOD_LABELS[item.pickup_method]}</p>
              </div>

              {item.show_email && (
                <div>
                  <h3 className="font-bold text-stone-900 mb-2">連絡先</h3>
                  <p className="text-stone-700 break-words">{item.user.email}</p>
                </div>
              )}

              <div>
                <h3 className="font-bold text-stone-900 mb-2">投稿者</h3>
                <div className="flex items-center gap-3">
                  {item.user.profile?.avatar_url ? (
                    <img
                      src={item.user.profile.avatar_url}
                      alt={item.user.profile.full_name || item.user.email}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-stone-300 flex items-center justify-center">
                      <span className="text-stone-600 font-bold">
                        {(item.user.profile?.full_name || (item.show_email ? item.user.email : '非公開'))[0]?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-stone-900">
                      {item.user.profile?.full_name || (item.show_email ? item.user.email : '非公開')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-sm text-stone-500">
                <p>投稿日: {new Date(item.created_at).toLocaleDateString('ja-JP')}</p>
                <p>閲覧数: {item.views_count}</p>
              </div>
            </div>

            {/* Message Section - Conversation */}
            {(hasConversation || canSendMessage) && (
              <div className="bg-white rounded-lg p-6 border border-stone-200">
                <h3 className="font-bold text-stone-900 mb-4">
                  メッセージ {hasConversation && `(${messages.length})`}
                </h3>
                
                {/* Conversation Thread */}
                {hasConversation ? (
                  <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                    {messages.map((msg) => {
                      const isMyMessage = user && msg.sender.id === user.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-4 ${
                              isMyMessage
                                ? 'bg-green-100 text-stone-900'
                                : 'bg-stone-100 text-stone-900'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium text-sm">
                                {isMyMessage
                                  ? 'あなた'
                                  : msg.sender.profile?.full_name || msg.sender.email}
                              </span>
                              <span className="text-xs text-stone-500">
                                {new Date(msg.created_at).toLocaleString('ja-JP')}
                              </span>
                            </div>
                            <p className="text-stone-700 whitespace-pre-wrap">{msg.message}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-stone-500 mb-4">まだメッセージがありません</p>
                )}

                {/* Reply Form */}
                {canSendMessage && (
                  <div className="border-t border-stone-200 pt-4">
                    <textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder={
                        hasConversation
                          ? '返信を入力してください...'
                          : 'いつ頃受け取り可能ですか？など、メッセージを送ってください'
                      }
                      rows={4}
                      className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 mb-4"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageText.trim() || isSending}
                      className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50"
                    >
                      {isSending
                        ? '送信中...'
                        : hasConversation
                        ? '返信する'
                        : 'メッセージを送る'}
                    </button>
                  </div>
                )}

                {isOwner && (
                  <Link
                    to="/free-items/my-items"
                    className="mt-4 inline-block text-green-600 hover:text-green-700 font-medium text-sm"
                  >
                    すべてのメッセージを見る →
                  </Link>
                )}
              </div>
            )}

            {isOwner && (
              <div className="space-y-4">
                {/* Status control */}
                <div className="bg-white rounded-lg border border-stone-200 p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:gap-4">
                    <div className="flex items-center gap-2 mb-3 md:mb-0">
                      <span className="text-sm font-medium text-stone-700">ステータス:</span>
                      <FreeItemStatusBadge status={statusValue} />
                    </div>
                    <div className="flex-1 flex flex-col md:flex-row md:items-center gap-3">
                      <select
                        value={statusValue}
                        onChange={(e) => setStatusValue(e.target.value as FreeItemStatus)}
                        className="px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="available">募集中</option>
                        <option value="reserved">予約済み</option>
                        <option value="completed">終了</option>
                        <option value="cancelled">キャンセル</option>
                      </select>
                      <button
                        onClick={async () => {
                          setIsUpdatingStatus(true);
                          try {
                            const updated = await freeItemService.updateStatus(item.id, statusValue);
                            setItem(updated);
                            setStatusValue(updated.status);
                            toast.success('ステータスを更新しました');
                          } catch (error: any) {
                            console.error('Failed to update status:', error);
                            toast.error(error?.response?.data?.error || '更新に失敗しました');
                          } finally {
                            setIsUpdatingStatus(false);
                          }
                        }}
                        disabled={isUpdatingStatus}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50"
                      >
                        {isUpdatingStatus ? '更新中...' : '保存'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Link
                    to={`/free-items/${item.id}/edit`}
                    className="flex-1 px-6 py-3 bg-stone-200 text-stone-700 rounded-lg font-bold hover:bg-stone-300 text-center"
                  >
                    編集
                  </Link>
                  <button
                    onClick={async () => {
                      if (confirm('このアイテムを終了にしますか？')) {
                        try {
                          const updated = await freeItemService.updateStatus(item.id, 'completed');
                          setItem(updated);
                          setStatusValue(updated.status);
                          toast.success('ステータスを更新しました');
                        } catch (error) {
                          toast.error('更新に失敗しました');
                        }
                      }
                    }}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700"
                  >
                    終了にする
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

