import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import { productService } from '../../services/productService';
import type { Order } from '../../types/order';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { useCart } from '../../contexts/CartContext';
import { ReturnRequestForm } from '../return/ReturnRequestForm';

export const OrdersPanel: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [returnOrderId, setReturnOrderId] = useState<string | null>(null);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await orderService.list();
        // Handle both array and paginated response
        const ordersArray = Array.isArray(data) ? data : (data.results || []);
        setOrders(ordersArray);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
        setOrders([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handleCancelOrder = async (orderId: string) => {
      if (!window.confirm('本当にこの注文をキャンセルしますか？')) return;

      try {
          const updatedOrder = await orderService.cancel(orderId);
          // Update order list locally
          setOrders(prevOrders => prevOrders.map(o => 
              o.id === orderId ? { ...o, status: 'cancelled' } : o
          ));
          toast.success('注文をキャンセルしました。');
      } catch (error: any) {
          console.error('Failed to cancel order:', error);
          toast.error(error.response?.data?.error || '注文のキャンセルに失敗しました。');
      }
  };

  const handleReorder = async (order: Order) => {
      const toastId = toast.loading('在庫を確認中...');
      let addedCount = 0;
      let outOfStockCount = 0;

      try {
          for (const item of order.items) {
              if (!item.product) continue; // Skip deleted products

              try {
                  const product = await productService.getProduct(item.product);
                  if (product.stock_quantity > 0) {
                      // Add to cart (max available stock if requested qty > stock)
                      const qtyToAdd = Math.min(item.quantity, product.stock_quantity);
                      addToCart(product, qtyToAdd);
                      addedCount++;
                  } else {
                      outOfStockCount++;
                  }
              } catch (err) {
                  console.error(`Failed to fetch product ${item.product}`, err);
                  outOfStockCount++;
              }
          }

          toast.dismiss(toastId);

          if (addedCount > 0) {
              if (outOfStockCount > 0) {
                  toast(`在庫切れの商品を除いてカートに追加しました (${outOfStockCount}点不足)`, { icon: '⚠️' });
              } else {
                  toast.success('すべての商品をカートに追加しました');
              }
              navigate('/checkout');
          } else {
              toast.error('すべての商品が在庫切れです');
          }

      } catch (error) {
          console.error('Reorder failed', error);
          toast.dismiss(toastId);
          toast.error('再注文処理に失敗しました');
      }
  };

  const handleDeleteOrder = async (orderId: string) => {
      if (!window.confirm('この注文履歴を削除しますか？この操作は取り消せません。')) return;

      try {
          await orderService.delete(orderId);
          setOrders(prevOrders => prevOrders.filter(o => o.id !== orderId));
          toast.success('注文履歴を削除しました');
      } catch (error: any) {
          console.error('Failed to delete order:', error);
          toast.error(error.response?.data?.error || '削除に失敗しました');
      }
  };

  const statusLabels: Record<string, string> = {
    pending: '保留中',
    processing: '処理中',
    shipped: '発送済み',
    delivered: '配達完了',
    cancelled: 'キャンセル',
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  // Helper component for Timeline
  const OrderTimeline: React.FC<{ status: string }> = ({ status }) => {
      const steps = [
          { key: 'pending', label: '注文済' },
          { key: 'processing', label: '処理中' },
          { key: 'shipped', label: '発送済' },
          { key: 'delivered', label: '配達完了' },
      ];
      
      // Map current status to step index (0-3). Cancelled is special case.
      const currentIndex = steps.findIndex(s => s.key === status);
      const isCancelled = status === 'cancelled';

      if (isCancelled) {
          return <div className="text-red-600 font-bold text-sm bg-red-50 px-3 py-1 rounded border border-red-100">注文キャンセル</div>;
      }

      return (
          <div className="flex items-center w-full max-w-md mt-2 text-xs">
              {steps.map((step, idx) => (
                  <div key={step.key} className={`flex-1 relative ${idx !== steps.length - 1 ? 'pr-4' : ''}`}>
                      <div className="flex flex-col items-center relative z-10">
                          <div className={`
                              w-3 h-3 rounded-full mb-1 transition-all duration-500
                              ${idx <= currentIndex ? 'bg-amber-600 scale-110' : 'bg-gray-200'}
                              ${idx === currentIndex ? 'ring-4 ring-amber-100' : ''}
                          `}></div>
                          <span className={`
                              font-medium transition-colors duration-300
                              ${idx <= currentIndex ? 'text-amber-900 font-bold' : 'text-gray-400'}
                          `}>{step.label}</span>
                      </div>
                      {/* Connector Line */}
                      {idx !== steps.length - 1 && (
                          <div className="absolute top-1.5 left-1/2 w-full h-0.5 bg-gray-200 -z-0">
                              <div 
                                  className="h-full bg-amber-600 transition-all duration-700 ease-out"
                                  style={{ 
                                      width: idx < currentIndex ? '100%' : '0%' 
                                  }}
                              ></div>
                          </div>
                      )}
                  </div>
              ))}
          </div>
      );
  };

  if (returnOrderId) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <button
          onClick={() => setReturnOrderId(null)}
          className="text-amber-600 hover:text-amber-800 font-medium flex items-center gap-2 mb-4"
        >
          ← 戻る
        </button>
        <ReturnRequestForm
          orderId={returnOrderId}
          onSuccess={() => {
            setReturnOrderId(null);
            // Refresh orders
            orderService.list().then(data => {
              const ordersArray = Array.isArray(data) ? data : (data.results || []);
              setOrders(ordersArray);
            }).catch(console.error);
          }}
          onCancel={() => setReturnOrderId(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <h3 className="text-2xl font-serif font-bold text-amber-900 border-b-2 border-amber-200 pb-2">
        購入履歴
      </h3>

      {!Array.isArray(orders) || orders.length === 0 ? (
        <div className="text-center py-12 bg-stone-50 rounded-xl border border-stone-100">
            <span className="text-4xl block mb-4">📦</span>
            <p className="text-stone-500 font-serif">注文履歴がありません。</p>
        </div>
      ) : (
        <div className="space-y-6">
            {orders.map(order => (
                <div key={order.id} className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                    <div className="bg-stone-50 px-6 py-4 border-b border-stone-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="text-sm text-stone-600">
                            <span className="block font-bold text-stone-900 mb-1">注文日: {new Date(order.created_at).toLocaleDateString('ja-JP')}</span>
                            <span>注文番号: #{order.id.slice(0, 8)}</span>
                        </div>
                        
                        {/* Timeline for Desktop/Tablet */}
                        <div className="hidden md:block flex-1 px-8">
                            <OrderTimeline status={order.status} />
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="font-bold text-lg text-amber-900">
                                {new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(Number(order.total_amount))}
                            </span>
                            {/* Mobile status badge */}
                            <span className={`md:hidden px-3 py-1 rounded-full text-xs font-bold ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                                {statusLabels[order.status] || order.status}
                            </span>
                        </div>
                    </div>
                    
                    {/* Mobile Timeline */}
                    <div className="md:hidden px-6 pt-4 pb-2 border-b border-stone-50">
                         <OrderTimeline status={order.status} />
                    </div>
                    
                    <div className="p-6">
                        <div className="space-y-4">
                            {order.items.map(item => (
                                <div key={item.id} className="flex gap-4">
                                    <div className="w-20 h-20 bg-stone-100 rounded border border-stone-200 overflow-hidden flex-shrink-0">
                                        {/* Handle product link only if product ID exists (product might be deleted) */}
                                        {item.product ? (
                                            <Link to={`/products/${item.product}`}>
                                                {item.product_image ? (
                                                    <img src={item.product_image} alt={item.product_title} className="w-full h-full object-contain p-1 hover:opacity-80 transition-opacity" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-stone-300 text-2xl">📷</div>
                                                )}
                                            </Link>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-stone-300 text-2xl">🚫</div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        {item.product ? (
                                            <Link to={`/products/${item.product}`} className="font-medium text-stone-900 text-base line-clamp-2 hover:text-amber-600 transition-colors">
                                                {item.product_title || '商品名なし'}
                                            </Link>
                                        ) : (
                                            <span className="font-medium text-stone-400 text-base line-clamp-2">
                                                {item.product_title} (削除された商品)
                                            </span>
                                        )}
                                        <p className="text-sm text-stone-500 mt-1">数量: {item.quantity}</p>
                                    </div>
                                    <div className="text-base font-bold text-amber-700">
                                        {new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(Number(item.price))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="bg-stone-50 px-6 py-3 border-t border-stone-200 flex justify-between items-center">
                        <div className="text-xs text-stone-500">
                            <div>
                                お支払い方法: {order.payment_method === 'cod' ? '代金引換' : order.payment_method === 'credit_card' ? 'クレジットカード' : order.payment_method === 'family' ? 'ファミリーマート決済' : order.payment_method}
                            </div>
                            {order.payment_method === 'family' && order.payment_deadline && (
                                <div className="mt-1 text-red-600 font-semibold">
                                    支払い期限: {new Date(order.payment_deadline).toLocaleString('ja-JP', { 
                                        year: 'numeric', 
                                        month: '2-digit', 
                                        day: '2-digit', 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                    })}
                                    {new Date(order.payment_deadline) < new Date() && (
                                        <span className="ml-2 text-red-700">(期限切れ)</span>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="flex gap-4">
                            {(order.status === 'pending' || order.status === 'processing') && (
                                <button 
                                    onClick={() => handleCancelOrder(order.id)}
                                    className="text-sm text-red-600 hover:text-red-800 font-medium border border-red-200 bg-white px-3 py-1 rounded hover:bg-red-50 transition-colors"
                                >
                                    ✕ 注文をキャンセル
                                </button>
                            )}
                            {order.status === 'shipped' && (
                                <button className="text-sm text-amber-600 hover:underline font-medium flex items-center gap-1">
                                    🚚 配送状況を確認する
                                </button>
                            )}
                            {order.status === 'delivered' && (
                                <>
                                    {order.has_active_return ? (
                                        <button 
                                            disabled
                                            className="text-sm text-stone-400 font-medium border border-stone-200 bg-stone-50 px-3 py-1 rounded cursor-not-allowed flex items-center gap-1"
                                            title="返品リクエストが既に存在します"
                                        >
                                            🔄 返品リクエスト済み
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => setReturnOrderId(order.id)}
                                            className="text-sm text-amber-600 hover:text-amber-800 font-medium border border-amber-200 bg-white px-3 py-1 rounded hover:bg-amber-50 transition-colors flex items-center gap-1"
                                        >
                                            🔄 返品リクエスト
                                        </button>
                                    )}
                                </>
                            )}
                            {order.status === 'cancelled' && (
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleReorder(order)}
                                        className="text-sm text-amber-600 hover:text-amber-800 font-medium border border-amber-200 bg-white px-3 py-1 rounded hover:bg-amber-50 transition-colors flex items-center gap-1"
                                    >
                                        🔄 再注文する
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteOrder(order.id)}
                                        className="text-sm text-stone-500 hover:text-red-600 font-medium border border-stone-200 bg-white px-3 py-1 rounded hover:bg-stone-50 transition-colors flex items-center gap-1"
                                    >
                                        🗑️ 削除
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  );
};
