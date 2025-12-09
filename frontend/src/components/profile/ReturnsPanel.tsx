import React, { useEffect, useState } from 'react';
import { returnService } from '../../services/returnService';
import type { ReturnRequest, ReturnRequestStatus } from '../../types/return';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ReturnRequestDetail } from '../return/ReturnRequestDetail';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export const ReturnsPanel: React.FC = () => {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReturnId, setSelectedReturnId] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchReturns = async () => {
    try {
      const data = await returnService.list();
      // Handle both array and paginated response
      const returnsArray = Array.isArray(data) ? data : (data.results || []);
      setReturns(returnsArray);
    } catch (error) {
      console.error('Failed to fetch returns:', error);
      toast.error('返品リクエストの取得に失敗しました');
      setReturns([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const handleCancelReturn = async (returnId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the onClick of parent div
    
    if (!window.confirm('本当にこの返品リクエストをキャンセルしますか？')) return;

    try {
      await returnService.cancel(returnId);
      toast.success('返品リクエストをキャンセルしました');
      fetchReturns(); // Refresh list
    } catch (error: any) {
      console.error('Failed to cancel return request:', error);
      toast.error(error.response?.data?.error || '返品リクエストのキャンセルに失敗しました');
    }
  };

  if (selectedReturnId) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <ReturnRequestDetail
          returnId={selectedReturnId}
          onBack={() => setSelectedReturnId(null)}
        />
      </div>
    );
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

  // Return Timeline Component (simplified for list view)
  const ReturnTimeline: React.FC<{ status: ReturnRequestStatus }> = ({ status }) => {
    const steps = [
      { key: 'pending', label: '作成', icon: '📝' },
      { key: 'under_review', label: '審査', icon: '🔍' },
      { key: 'approved', label: '承認', icon: '✅' },
      { key: 'shipping', label: '配送', icon: '🚚' },
      { key: 'received', label: '受領', icon: '📦' },
      { key: 'processing', label: '処理', icon: '⚙️' },
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
      return null; // Don't show timeline for rejected/cancelled
    }

    return (
      <div className="flex items-center gap-1 mt-2 text-xs">
        {steps.map((step, idx) => {
          const isActive = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          
          return (
            <div key={step.key} className="flex items-center">
              <div className={`
                w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all
                ${isActive ? 'bg-amber-600 text-white' : 'bg-gray-200 text-gray-400'}
                ${isCurrent ? 'ring-2 ring-amber-300' : ''}
              `}>
                {step.icon}
              </div>
              {idx !== steps.length - 1 && (
                <div className={`w-4 h-0.5 ${isActive ? 'bg-amber-600' : 'bg-gray-200'}`}></div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <h3 className="text-2xl font-serif font-bold text-amber-900 border-b-2 border-amber-200 pb-2">
        返品リクエスト
      </h3>

      {loading ? (
        <LoadingSpinner />
      ) : !Array.isArray(returns) || returns.length === 0 ? (
        <div className="text-center py-12 bg-stone-50 rounded-xl border border-stone-100">
          <span className="text-4xl block mb-4">📦</span>
          <p className="text-stone-500 font-serif">返品リクエストがありません。</p>
        </div>
      ) : (
        <div className="space-y-4">
          {returns.map((returnRequest) => (
            <div
              key={returnRequest.id}
              className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <div 
                className="p-6 cursor-pointer"
                onClick={() => setSelectedReturnId(returnRequest.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-stone-900">
                      返品リクエスト #{returnRequest.id.slice(0, 8)}
                    </h4>
                    <p className="text-sm text-stone-500 mt-1">
                      注文ID: #{returnRequest.order_id.slice(0, 8)} |{' '}
                      {new Date(returnRequest.created_at).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      statusColors[returnRequest.status] || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {statusLabels[returnRequest.status] || returnRequest.status}
                  </span>
                </div>

                {/* Timeline */}
                <div className="mt-3">
                  <ReturnTimeline status={returnRequest.status} />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-stone-600">理由:</span>
                    <span className="font-medium ml-2">{returnRequest.reason}</span>
                  </div>
                  <div>
                    <span className="text-stone-600">商品数:</span>
                    <span className="font-medium ml-2">
                      {returnRequest.items_count || returnRequest.items?.length || 0}点
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-600">予想返金額:</span>
                    <span className="font-medium text-amber-700 ml-2">
                      ¥{Number(returnRequest.baseline_refund_amount).toLocaleString()} ({returnRequest.baseline_refund_percent}%)
                    </span>
                  </div>
                  {returnRequest.final_refund_amount !== null && (
                    <div>
                      <span className="text-stone-600">最終返金額:</span>
                      <span className="font-medium text-green-700 ml-2">
                        ¥{Number(returnRequest.final_refund_amount).toLocaleString()} ({returnRequest.final_refund_percent}%)
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Cancel button for pending/under_review status */}
              {(returnRequest.status === 'pending' || returnRequest.status === 'under_review') && (
                <div className="px-6 pb-4 border-t border-stone-100 pt-4">
                  <button
                    onClick={(e) => handleCancelReturn(returnRequest.id, e)}
                    className="text-sm text-red-600 hover:text-red-800 font-medium border border-red-200 bg-white px-3 py-1 rounded hover:bg-red-50 transition-colors flex items-center gap-1"
                  >
                    ✕ 返品リクエストをキャンセル
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

