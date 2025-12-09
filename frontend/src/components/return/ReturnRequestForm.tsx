import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { returnService } from '../../services/returnService';
import { orderService } from '../../services/orderService';
import type { Order, OrderItem } from '../../types/order';
import type { CreateReturnRequestData } from '../../types/return';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface ReturnRequestFormProps {
  orderId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ReturnRequestForm: React.FC<ReturnRequestFormProps> = ({
  orderId,
  onSuccess,
  onCancel,
}) => {
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [returnType, setReturnType] = useState<'full' | 'partial' | 'exchange'>('full');
  const [reason, setReason] = useState('');
  const [reasonDetail, setReasonDetail] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]); // Image files
  const [selectedVideos, setSelectedVideos] = useState<File[]>([]); // Video files
  const [previewUrls, setPreviewUrls] = useState<Map<string, string>>(new Map()); // Object URLs for preview
  const [expandedVideo, setExpandedVideo] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await orderService.get(orderId);
        setOrder(data);
        
        // Auto-select all items for full return
        if (data.items.length > 0) {
          const allItemIds = new Set(data.items.map(item => item.id));
          setSelectedItems(allItemIds);
        }
      } catch (error: any) {
        console.error('Failed to fetch order:', error);
        toast.error('注文情報の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrder();
  }, [orderId]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, [previewUrls]);

  const handleItemToggle = (itemId: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
    
    // Update return type
    if (newSelected.size === 0) {
      setReturnType('full');
    } else if (newSelected.size === order?.items.length) {
      setReturnType('full');
    } else {
      setReturnType('partial');
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedImages(prev => [...prev, ...newFiles]);
    }
    e.target.value = '';
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      // Validate file size (50MB limit)
      const validFiles: File[] = [];
      for (const file of newFiles) {
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > 50) {
          toast.error(`動画ファイル "${file.name}" は50MBを超えています。別のファイルを選択してください。`);
          continue;
        }
        // Check if it's a video file
        const isVideo = file.type.startsWith('video/') || 
          /\.(mp4|mov|avi|mkv|webm|flv|wmv)$/i.test(file.name);
        if (isVideo) {
          validFiles.push(file);
        } else {
          toast.error(`ファイル "${file.name}" は動画ファイルではありません。`);
        }
      }
      setSelectedVideos(prev => [...prev, ...validFiles]);
    }
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    const file = selectedImages[index];
    const fileKey = `img-${index}`;
    if (previewUrls.has(fileKey)) {
      URL.revokeObjectURL(previewUrls.get(fileKey)!);
      setPreviewUrls(prev => {
        const newMap = new Map(prev);
        newMap.delete(fileKey);
        return newMap;
      });
    }
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeVideo = (index: number) => {
    const file = selectedVideos[index];
    const fileKey = `vid-${index}`;
    if (previewUrls.has(fileKey)) {
      URL.revokeObjectURL(previewUrls.get(fileKey)!);
      setPreviewUrls(prev => {
        const newMap = new Map(prev);
        newMap.delete(fileKey);
        return newMap;
      });
    }
    setSelectedVideos(prev => prev.filter((_, i) => i !== index));
  };

  const getFilePreviewUrl = (file: File, type: 'img' | 'vid', index: number): string => {
    const fileKey = `${type}-${index}`;
    if (!previewUrls.has(fileKey)) {
      const url = URL.createObjectURL(file);
      setPreviewUrls(prev => new Map(prev).set(fileKey, url));
      return url;
    }
    return previewUrls.get(fileKey)!;
  };

  const calculateDaysSinceDelivery = (): number => {
    if (!order) return 0;
    const deliveredDate = order.updated_at; // Fallback to updated_at if delivered_at not available
    const now = new Date();
    const delivered = new Date(deliveredDate);
    const diffTime = now.getTime() - delivered.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const getConditionPolicy = (condition: string, days: number): { canReturn: boolean; percent: number; message: string } => {
    switch (condition) {
      case 'new':
        if (days <= 7) return { canReturn: true, percent: 100, message: '0-7日: 100%返金' };
        if (days <= 30) return { canReturn: true, percent: 80, message: '7-30日: 80%返金' };
        return { canReturn: false, percent: 0, message: '30日を超えています' };
      case 'like_new':
        if (days <= 3) return { canReturn: true, percent: 100, message: '0-3日: 100%返金' };
        if (days <= 7) return { canReturn: true, percent: 80, message: '3-7日: 80%返金' };
        return { canReturn: false, percent: 0, message: '7日を超えています（無料修理のみ）' };
      case 'good':
      case 'fair':
        if (days <= 3) return { canReturn: true, percent: 100, message: '0-3日: 100%返金' };
        return { canReturn: false, percent: 0, message: '3日を超えています' };
      case 'poor':
        return { canReturn: false, percent: 0, message: 'Poor状態は返品不可（店舗の過失の場合を除く）' };
      default:
        return { canReturn: false, percent: 0, message: '不明な状態' };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedItems.size === 0) {
      toast.error('少なくとも1つの商品を選択してください');
      return;
    }

    if (!reason.trim()) {
      toast.error('返品理由を選択してください');
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading('返品リクエストを作成中...');

    try {
      // Upload files first (only when submitting)
      let imageUrls: string[] = [];
      const allFiles = [...selectedImages, ...selectedVideos];
      if (allFiles.length > 0) {
        toast.loading('ファイルをアップロード中...', { id: toastId });
        try {
          const uploadPromises = allFiles.map(async (file) => {
            const result = await returnService.uploadEvidence(file);
            return result.url;
          });
          imageUrls = await Promise.all(uploadPromises);
        } catch (uploadError: any) {
          toast.dismiss(toastId);
          toast.error(uploadError.message || 'ファイルのアップロードに失敗しました');
          setSubmitting(false);
          return;
        }
      }

      // Create return request with uploaded image URLs
      toast.loading('返品リクエストを作成中...', { id: toastId });
      
      const items_data = Array.from(selectedItems).map(itemId => {
        const item = order?.items.find(i => i.id === itemId);
        return {
          order_item_id: itemId,
          quantity: item?.quantity || 1,
        };
      });

      const data: CreateReturnRequestData = {
        order: orderId,
        return_type: returnType,
        reason,
        reason_detail: reasonDetail,
        images: imageUrls,
        items_data,
      };

      const result = await returnService.create(data);
      
      // Clean up object URLs
      previewUrls.forEach(url => {
        URL.revokeObjectURL(url);
      });
      setSelectedImages([]);
      setSelectedVideos([]);
      setPreviewUrls(new Map());
      
      toast.dismiss(toastId);
      toast.success('返品リクエストを作成しました');
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate(`/profile?tab=returns`);
      }
    } catch (error: any) {
      toast.dismiss(toastId);
      toast.error(error.response?.data?.error || '返品リクエストの作成に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!order) {
    return <div className="text-center py-8">注文が見つかりませんでした</div>;
  }

  if (order.status !== 'delivered') {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">配達済みの注文のみ返品できます</p>
        <button
          onClick={onCancel}
          className="mt-4 text-amber-600 hover:text-amber-800"
        >
          戻る
        </button>
      </div>
    );
  }

  const daysSinceDelivery = calculateDaysSinceDelivery();

  return (
    <div className="space-y-6">
      <div className="border-b border-amber-200 pb-4">
        <h2 className="text-2xl font-serif font-bold text-amber-900">
          返品リクエスト
        </h2>
        <p className="text-sm text-stone-600 mt-2">
          注文番号: #{order.id.slice(0, 8)} | 注文日: {new Date(order.created_at).toLocaleDateString('ja-JP')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Select Items */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-3">
            返品する商品を選択してください
          </label>
          <div className="space-y-4">
            {order.items.map((item) => {
              const condition = item.product_condition || 'unknown';
              const policy = getConditionPolicy(condition, daysSinceDelivery);
              const isSelected = selectedItems.has(item.id);

              return (
                <div
                  key={item.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-stone-200 bg-white hover:border-amber-300'
                  }`}
                  onClick={() => handleItemToggle(item.id)}
                >
                  <div className="flex gap-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleItemToggle(item.id)}
                      className="mt-1"
                      aria-label={`${item.product_title}を選択`}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="w-20 h-20 bg-stone-100 rounded border border-stone-200 overflow-hidden flex-shrink-0">
                      {/* Handle product link only if product ID exists (product might be deleted) */}
                      {item.product ? (
                        <Link to={`/products/${item.product}`} onClick={(e) => e.stopPropagation()}>
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
                      {item.product ? (
                        <Link
                          to={`/products/${item.product}`}
                          onClick={(e) => e.stopPropagation()}
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
                        数量: {item.quantity}
                      </p>
                      <div className="mt-2 flex items-center gap-4">
                        <div className="text-base font-bold text-amber-700">
                          {new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(Number(item.price))}
                        </div>
                        <div>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              policy.canReturn
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {policy.message}
                          </span>
                          {!policy.canReturn && (
                            <p className="text-xs text-amber-600 mt-1">
                              ※ 店舗の過失の場合は100%返金可能
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Return Type */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            返品タイプ
          </label>
          <select
            value={returnType}
            onChange={(e) => setReturnType(e.target.value as any)}
            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            disabled={selectedItems.size === order.items.length}
            aria-label="返品タイプを選択"
          >
            <option value="full">全額返品</option>
            <option value="partial">一部返品</option>
            <option value="exchange">交換</option>
          </select>
        </div>

        {/* Reason */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            返品理由 <span className="text-red-500">*</span>
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            aria-label="返品理由を選択"
          >
            <option value="">選択してください</option>
            <option value="product_defect">商品不良</option>
            <option value="wrong_item">間違った商品</option>
            <option value="missing_accessories">付属品不足</option>
            <option value="not_as_described">説明と異なる</option>
            <option value="change_of_mind">気が変わった</option>
            <option value="other">その他</option>
          </select>
        </div>

        {/* Reason Detail */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            詳細説明
          </label>
          <textarea
            value={reasonDetail}
            onChange={(e) => setReasonDetail(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            placeholder="返品理由の詳細を記入してください..."
            aria-label="返品理由の詳細"
          />
        </div>

        {/* Upload Evidence */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            証拠写真・動画（任意）
          </label>
          
          {/* Upload Buttons */}
          <div className="flex gap-2 mb-2">
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={submitting}
              className="px-4 py-2 border border-stone-300 rounded-lg hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              画像を追加
            </button>
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              disabled={submitting}
              className="px-4 py-2 border border-stone-300 rounded-lg hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
              </svg>
              動画を追加 (最大50MB)
            </button>
          </div>

          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            ref={imageInputRef}
            onChange={handleImageSelect}
            disabled={submitting}
            aria-label="画像をアップロード"
          />
          <input
            type="file"
            accept="video/*,.mp4,.mov,.avi,.mkv,.webm,.flv,.wmv"
            multiple
            className="hidden"
            ref={videoInputRef}
            onChange={handleVideoSelect}
            disabled={submitting}
            aria-label="動画をアップロード"
          />

          <p className="text-xs text-stone-500 mt-1">
            画像（JPEG、PNG、WebP）または動画（MP4、最大50MB）を選択できます。送信時にアップロード・圧縮されます。
          </p>

          {/* Display selected files (preview before upload) */}
          {(selectedImages.length > 0 || selectedVideos.length > 0) && (
            <div className="mt-4">
              <p className="text-xs text-amber-600 mb-2">
                {selectedImages.length + selectedVideos.length}件のファイルが選択されています（送信時にアップロードされます）
              </p>
              <div className="grid grid-cols-4 gap-4">
                {selectedImages.map((file, index) => {
                  const previewUrl = getFilePreviewUrl(file, 'img', index);
                  return (
                    <div key={`img-${index}`} className="relative group">
                      <img
                        src={previewUrl}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded border border-stone-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        disabled={submitting}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                      >
                        ×
                      </button>
                      <p className="text-xs text-stone-500 mt-1 truncate" title={file.name}>
                        {file.name}
                      </p>
                    </div>
                  );
                })}
                {selectedVideos.map((file, index) => {
                  const previewUrl = getFilePreviewUrl(file, 'vid', index);
                  const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
                  return (
                    <div key={`vid-${index}`} className="relative group">
                      <button
                        type="button"
                        onClick={() => setExpandedVideo(previewUrl)}
                        disabled={submitting}
                        className="w-full h-24 rounded border border-stone-200 overflow-hidden bg-stone-100 relative cursor-pointer disabled:opacity-50"
                      >
                        <video
                          src={previewUrl}
                          className="w-full h-full object-cover"
                          muted
                          preload="metadata"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[8px] px-1 py-0.5">
                          {fileSizeMB}MB
                        </div>
                        <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                          </svg>
                          拡大
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeVideo(index)}
                        disabled={submitting}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 z-10"
                      >
                        ×
                      </button>
                      <p className="text-xs text-stone-500 mt-1 truncate" title={file.name}>
                        {file.name}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4 pt-4 border-t border-stone-200">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-amber-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>送信中...</span>
              </>
            ) : (
              '返品リクエストを送信'
            )}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="px-6 py-3 border border-stone-300 rounded-lg font-medium text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              キャンセル
            </button>
          )}
        </div>
      </form>

      {/* Video Expansion Modal */}
      {expandedVideo && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setExpandedVideo(null)}
        >
          <div 
            className="relative max-w-6xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setExpandedVideo(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors text-2xl font-bold w-10 h-10 flex items-center justify-center bg-black/50 rounded-full z-10"
              aria-label="閉じる"
            >
              ×
            </button>
            
            {/* Video Player */}
            <div className="bg-black rounded-lg overflow-hidden">
              <video 
                src={expandedVideo} 
                className="w-full h-full max-h-[90vh] object-contain"
                controls
                autoPlay
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
