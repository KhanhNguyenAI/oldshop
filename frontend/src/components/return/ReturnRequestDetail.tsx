import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { returnService } from '../../services/returnService';
import type { ReturnRequest, ReturnRequestStatus } from '../../types/return';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface ReturnRequestDetailProps {
  returnId: string;
  onBack?: () => void;
}

export const ReturnRequestDetail: React.FC<ReturnRequestDetailProps> = ({
  returnId,
  onBack,
}) => {
  const [returnRequest, setReturnRequest] = useState<ReturnRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const fetchReturnRequest = async () => {
    try {
      const data = await returnService.get(returnId);
      setReturnRequest(data);
    } catch (error: any) {
      console.error('Failed to fetch return request:', error);
      toast.error('返品リクエストの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturnRequest();
  }, [returnId]);

  const handleCancelReturn = async () => {
    if (!window.confirm('本当にこの返品リクエストをキャンセルしますか？')) return;

    setCancelling(true);
    try {
      await returnService.cancel(returnId);
      toast.success('返品リクエストをキャンセルしました');
      if (onBack) {
        onBack();
      } else {
        fetchReturnRequest(); // Refresh
      }
    } catch (error: any) {
      console.error('Failed to cancel return request:', error);
      toast.error(error.response?.data?.error || '返品リクエストのキャンセルに失敗しました');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!returnRequest) {
    return <div className="text-center py-8">返品リクエストが見つかりませんでした</div>;
  }

  const statusLabels: Record<string, string> = {
    pending: '保留中',
    under_review: '審査中',
    approved: '承認済み',
    rejected: '拒否',
    shipping: '配送中',
    received: '受領済み',
    processing: '処理中',
    completed: '完了',
    cancelled: 'キャンセル',
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    under_review: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    shipping: 'bg-purple-100 text-purple-800',
    received: 'bg-indigo-100 text-indigo-800',
    processing: 'bg-amber-100 text-amber-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800',
  };

  const faultTypeLabels: Record<string, string> = {
    shop_fault: '店舗の過失',
    customer_fault: 'お客様の過失',
    no_fault: '過失なし（気が変わった）',
    pending_review: '審査待ち',
  };

  // Return Timeline Component
  const ReturnTimeline: React.FC<{ status: ReturnRequestStatus }> = ({ status }) => {
    const steps = [
      { key: 'pending', label: 'リクエスト作成', icon: '📝' },
      { key: 'under_review', label: '審査中', icon: '🔍' },
      { key: 'approved', label: '承認済み', icon: '✅' },
      { key: 'shipping', label: '配送中', icon: '🚚' },
      { key: 'received', label: '受領済み', icon: '📦' },
      { key: 'processing', label: '処理中', icon: '⚙️' },
      { key: 'completed', label: '完了', icon: '🎉' },
    ];

    const statusOrder: Record<string, number> = {
      pending: 0,
      under_review: 1,
      approved: 2,
      shipping: 3,
      received: 4,
      processing: 5,
      completed: 6,
      rejected: -1,
      cancelled: -1,
    };

    const currentIndex = statusOrder[status] ?? -1;
    const isRejected = status === 'rejected';
    const isCancelled = status === 'cancelled';

    if (isRejected || isCancelled) {
      return (
        <div className={`text-sm font-bold px-4 py-2 rounded border ${
          isRejected 
            ? 'text-red-600 bg-red-50 border-red-200' 
            : 'text-gray-600 bg-gray-50 border-gray-200'
        }`}>
          {isRejected ? '❌ 返品リクエストが拒否されました' : '🚫 返品リクエストがキャンセルされました'}
        </div>
      );
    }

    return (
      <div className="w-full overflow-x-auto">
        <div className="flex items-center min-w-max py-4">
          {steps.map((step, idx) => {
            const isActive = idx <= currentIndex;
            const isCurrent = idx === currentIndex;
            
            return (
              <div key={step.key} className="flex items-center min-w-[120px]">
                <div className="flex flex-col items-center relative z-10">
                  <div className={`
                    w-10 h-10 rounded-full mb-2 transition-all duration-500 flex items-center justify-center text-lg
                    ${isActive ? 'bg-amber-600 text-white scale-110 shadow-lg' : 'bg-gray-200 text-gray-400'}
                    ${isCurrent ? 'ring-4 ring-amber-100' : ''}
                  `}>
                    {step.icon}
                  </div>
                  <span className={`
                    text-xs font-medium transition-colors duration-300 text-center px-2
                    ${isActive ? 'text-amber-900 font-bold' : 'text-gray-400'}
                  `}>
                    {step.label}
                  </span>
                </div>
                {/* Connector Line */}
                {idx !== steps.length - 1 && (
                  <div className="mx-2 w-16 h-1 bg-gray-200 relative -mt-6">
                    <div 
                      className="h-full bg-amber-600 transition-all duration-700 ease-out"
                      style={{ 
                        width: idx < currentIndex ? '100%' : '0%' 
                      }}
                    ></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {onBack && (
        <button
          onClick={onBack}
          className="text-amber-600 hover:text-amber-800 font-medium flex items-center gap-2"
        >
          ← 戻る
        </button>
      )}

      <div className="border-b border-amber-200 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-serif font-bold text-amber-900">
              返品リクエスト詳細
            </h2>
            <p className="text-sm text-stone-600 mt-2">
              リクエストID: #{returnRequest.id.slice(0, 8)} | 注文ID: #{returnRequest.order_id.slice(0, 8)}
            </p>
          </div>
          <span
            className={`px-4 py-2 rounded-full text-sm font-bold ${statusColors[returnRequest.status] || 'bg-gray-100 text-gray-800'}`}
          >
            {statusLabels[returnRequest.status] || returnRequest.status}
          </span>
        </div>
      </div>

      {/* Return Timeline */}
      <div className="bg-white rounded-lg border border-stone-200 p-6">
        <h3 className="font-bold text-stone-900 mb-4">返品プロセス</h3>
        <ReturnTimeline status={returnRequest.status} />
      </div>

      {/* Status Timeline */}
      <div className="bg-stone-50 rounded-lg p-6 border border-stone-200">
        <h3 className="font-bold text-stone-900 mb-4">ステータス</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-stone-600">作成日:</span>
            <span className="font-medium">
              {new Date(returnRequest.created_at).toLocaleString('ja-JP')}
            </span>
          </div>
          {returnRequest.fault_confirmed_at && (
            <div className="flex justify-between">
              <span className="text-stone-600">確認日:</span>
              <span className="font-medium">
                {new Date(returnRequest.fault_confirmed_at).toLocaleString('ja-JP')}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-stone-600">配達からの日数:</span>
            <span className="font-medium">{returnRequest.days_since_delivery}日</span>
          </div>
        </div>
      </div>

      {/* Fault Type */}
      <div className="bg-stone-50 rounded-lg p-6 border border-stone-200">
        <h3 className="font-bold text-stone-900 mb-4">過失の確認</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-stone-600">過失タイプ:</span>
            <span className="font-medium">
              {faultTypeLabels[returnRequest.fault_type] || returnRequest.fault_type}
            </span>
          </div>
          {returnRequest.fault_confirmed_by_email && (
            <div className="flex justify-between">
              <span className="text-stone-600">確認者:</span>
              <span className="font-medium">{returnRequest.fault_confirmed_by_email}</span>
            </div>
          )}
          {returnRequest.fault_notes && (
            <div className="mt-2">
              <span className="text-stone-600 block mb-1">備考:</span>
              <p className="text-sm text-stone-700 bg-white p-3 rounded border border-stone-200">
                {returnRequest.fault_notes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Refund Information */}
      <div className="bg-stone-50 rounded-lg p-6 border border-stone-200">
        <h3 className="font-bold text-stone-900 mb-4">返金情報</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-stone-600">予想返金額（条件基準）:</span>
            <div className="text-right">
              <span className="font-bold text-lg text-amber-700">
                ¥{Number(returnRequest.baseline_refund_amount).toLocaleString()}
              </span>
              <span className="text-sm text-stone-500 ml-2">
                ({returnRequest.baseline_refund_percent}%)
              </span>
            </div>
          </div>
          {returnRequest.final_refund_amount !== null && (
            <div className="flex justify-between items-center pt-3 border-t border-stone-300">
              <span className="text-stone-600 font-bold">最終返金額:</span>
              <div className="text-right">
                <span className="font-bold text-xl text-green-700">
                  ¥{Number(returnRequest.final_refund_amount).toLocaleString()}
                </span>
                <span className="text-sm text-stone-500 ml-2">
                  ({returnRequest.final_refund_percent}%)
                </span>
              </div>
            </div>
          )}
          {returnRequest.final_refund_amount === null && (
            <p className="text-sm text-amber-600 mt-2">
              ※ 最終返金額は過失確認後に決定されます
            </p>
          )}
        </div>
      </div>

      {/* Return Items */}
      <div className="bg-white rounded-lg border border-stone-200 p-6">
        <h3 className="font-bold text-stone-900 mb-4">返品商品</h3>
        <div className="space-y-4">
          {returnRequest.items.map((item) => (
            <div key={item.id} className="border border-stone-200 rounded-lg p-4">
              <div className="flex gap-4">
                <div className="w-20 h-20 bg-stone-100 rounded border border-stone-200 overflow-hidden flex-shrink-0">
                  {/* Handle product link only if product ID exists (product might be deleted) */}
                  {item.product_id ? (
                    <Link to={`/products/${item.product_id}`}>
                      {item.product_image ? (
                        <img
                          src={item.product_image}
                          alt={item.product_title}
                          className="w-full h-full object-contain p-1 hover:opacity-80 transition-opacity"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-300 text-2xl">📷</div>
                      )}
                    </Link>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-300 text-2xl">
                      {item.product_image ? (
                        <img
                          src={item.product_image}
                          alt={item.product_title}
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <span>🚫</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  {item.product_id ? (
                    <Link
                      to={`/products/${item.product_id}`}
                      className="font-medium text-stone-900 text-base line-clamp-2 hover:text-amber-600 transition-colors block"
                    >
                      {item.product_title || '商品名なし'}
                    </Link>
                  ) : (
                    <span className="font-medium text-stone-400 text-base line-clamp-2">
                      {item.product_title} (削除された商品)
                    </span>
                  )}
                  <p className="text-sm text-stone-500 mt-1">
                    数量: {item.quantity} | 元の状態: {item.original_condition}
                  </p>
                  <div className="mt-2 flex gap-4 text-sm">
                    <div>
                      <span className="text-stone-600">予想返金:</span>
                      <span className="font-medium text-amber-700 ml-2">
                        ¥{Number(item.baseline_refund_amount).toLocaleString()} ({item.baseline_refund_percent}%)
                      </span>
                    </div>
                    {item.final_refund_amount !== null && (
                      <div>
                        <span className="text-stone-600">最終返金:</span>
                        <span className="font-medium text-green-700 ml-2">
                          ¥{Number(item.final_refund_amount).toLocaleString()} ({item.final_refund_percent}%)
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-2">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        item.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : item.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reason & Evidence */}
      <div className="bg-white rounded-lg border border-stone-200 p-6">
        <h3 className="font-bold text-stone-900 mb-4">返品理由</h3>
        <div className="space-y-3">
          <div>
            <span className="text-stone-600">理由:</span>
            <span className="font-medium ml-2">{returnRequest.reason}</span>
          </div>
          {returnRequest.reason_detail && (
            <div>
              <span className="text-stone-600 block mb-1">詳細:</span>
              <p className="text-sm text-stone-700 bg-stone-50 p-3 rounded border border-stone-200">
                {returnRequest.reason_detail}
              </p>
            </div>
          )}
          {returnRequest.images.length > 0 && (
            <div>
              <span className="text-stone-600 block mb-2">証拠写真・動画:</span>
              <div className="grid grid-cols-4 gap-4">
                {returnRequest.images.map((url, index) => (
                  <div key={index} className="relative">
                    {url.includes('video') ? (
                      <video
                        src={url}
                        controls
                        className="w-full h-32 object-cover rounded border border-stone-200"
                      />
                    ) : (
                      <img
                        src={url}
                        alt={`Evidence ${index + 1}`}
                        className="w-full h-32 object-cover rounded border border-stone-200"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tracking */}
      {returnRequest.tracking_number && (
        <div className="bg-stone-50 rounded-lg p-6 border border-stone-200">
          <h3 className="font-bold text-stone-900 mb-2">配送情報</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-stone-600">追跡番号:</span>
              <span className="font-medium">{returnRequest.tracking_number}</span>
            </div>
            {returnRequest.return_shipping_label && (
              <div className="flex justify-between">
                <span className="text-stone-600">配送ラベル:</span>
                <span className="font-medium">{returnRequest.return_shipping_label}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rejected Reason */}
      {returnRequest.status === 'rejected' && returnRequest.rejected_reason && (
        <div className="bg-red-50 rounded-lg p-6 border border-red-200">
          <h3 className="font-bold text-red-900 mb-2">拒否理由</h3>
          <p className="text-sm text-red-700">{returnRequest.rejected_reason}</p>
        </div>
      )}

      {/* Cancel Button for pending/under_review */}
      {(returnRequest.status === 'pending' || returnRequest.status === 'under_review') && (
        <div className="bg-stone-50 rounded-lg p-6 border border-stone-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-stone-900 mb-1">返品リクエストをキャンセル</h3>
              <p className="text-sm text-stone-600">
                返品リクエストがまだ承認されていない場合は、キャンセルできます。
              </p>
            </div>
            <button
              onClick={handleCancelReturn}
              disabled={cancelling}
              className="text-sm text-red-600 hover:text-red-800 font-medium border border-red-200 bg-white px-4 py-2 rounded hover:bg-red-50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelling ? 'キャンセル中...' : '✕ 返品リクエストをキャンセル'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

