import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { productService } from '../../services/productService';
import type { Comment } from '../../types/comment';
import { Link } from 'react-router-dom';

interface ProductReviewsProps {
  productId: string;
  avgRating?: number;
  ratingCount?: number;
  userRating?: number | null;
  onRatingUpdate: () => void;
}

export const ProductReviews: React.FC<ProductReviewsProps> = ({ 
  productId, 
  avgRating = 0, 
  ratingCount = 0, 
  userRating,
  onRatingUpdate 
}) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [expandedVideo, setExpandedVideo] = useState<string | null>(null);
  const [showAllComments, setShowAllComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const COMMENTS_LIMIT = 5; // Giới hạn số bình luận hiển thị ban đầu

  useEffect(() => {
    fetchComments();
  }, [productId]);

  const fetchComments = async () => {
    try {
      const data = await productService.getComments(productId);
      setComments(data);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const handleRate = async (score: number) => {
    if (!user) return;
    setIsSubmittingRating(true);
    try {
      await productService.rateProduct(productId, score);
      onRatingUpdate();
    } catch (error) {
      console.error('Failed to rate product:', error);
      alert('評価の送信に失敗しました。');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedImages(prev => [...prev, ...newFiles]);
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      // Validate file size (50MB limit)
      const validFiles: File[] = [];
      for (const file of newFiles) {
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > 50) {
          alert(`動画ファイル "${file.name}" は50MBを超えています。別のファイルを選択してください。`);
          continue;
        }
        // Check if it's a video file
        const isVideo = file.type.startsWith('video/') || 
          /\.(mp4|mov|avi|mkv|webm|flv|wmv)$/i.test(file.name);
        if (isVideo) {
          validFiles.push(file);
        } else {
          alert(`ファイル "${file.name}" は動画ファイルではありません。`);
        }
      }
      setSelectedVideos(prev => [...prev, ...validFiles]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeVideo = (index: number) => {
    setSelectedVideos(prev => prev.filter((_, i) => i !== index));
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() && selectedImages.length === 0 && selectedVideos.length === 0) return;
    if (isSubmittingComment) return; // Prevent multiple submissions

    setIsSubmittingComment(true);
    try {
      // Combine images and videos for upload (processing happens on backend)
      const allMedia = [...selectedImages, ...selectedVideos];
      await productService.addComment(productId, newComment, undefined, allMedia);
      setNewComment('');
      setSelectedImages([]);
      setSelectedVideos([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (videoInputRef.current) videoInputRef.current.value = '';
      await fetchComments();
    } catch (error) {
      console.error('Failed to submit comment:', error);
      alert('コメントの送信に失敗しました。');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleReplySubmit = async (parentId: number) => {
    if (!replyContent.trim()) return;
    if (isSubmittingComment) return; // Prevent multiple submissions

    setIsSubmittingComment(true);
    try {
      await productService.addComment(productId, replyContent, parentId);
      setReplyContent('');
      setReplyTo(null);
      await fetchComments();
    } catch (error) {
      console.error('Failed to submit reply:', error);
      alert('返信の送信に失敗しました。');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const StarRating = ({ current, interactive = false }: { current: number, interactive?: boolean }) => (
    <div className="flex gap-1 text-amber-400">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive || !user || isSubmittingRating}
          onClick={() => interactive && handleRate(star)}
          onMouseEnter={() => interactive && setHoverRating(star)}
          onMouseLeave={() => interactive && setHoverRating(0)}
          className={`text-2xl ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
        >
          {star <= (interactive && hoverRating ? hoverRating : current) ? '★' : '☆'}
        </button>
      ))}
    </div>
  );

  // Filter comments to show (limit if not showing all)
  const displayedComments = showAllComments ? comments : comments.slice(0, COMMENTS_LIMIT);
  const hasMoreComments = comments.length > COMMENTS_LIMIT;

  return (
    <div className="bg-white p-8 rounded-xl border border-stone-100 shadow-sm">
      <h3 className="text-2xl font-serif font-bold text-stone-900 mb-8 flex items-center gap-2">
        <span>💬</span> レビュー・コメント
      </h3>

      {/* Rating Section */}
      <div className="flex flex-col md:flex-row gap-12 mb-12 border-b border-stone-100 pb-12">
        <div className="text-center md:text-left">
          <div className="text-5xl font-bold text-amber-600 mb-2">{avgRating.toFixed(1)}</div>
          <div className="flex justify-center md:justify-start mb-2">
            <StarRating current={Math.round(avgRating)} />
          </div>
          <div className="text-stone-500 text-sm">{ratingCount}件の評価</div>
        </div>

        <div className="flex-1 border-l border-stone-100 pl-0 md:pl-12 pt-8 md:pt-0">
          <h4 className="font-bold text-stone-800 mb-4">この商品を評価する</h4>
          {user ? (
            <div>
              <StarRating current={userRating || 0} interactive={true} />
              <p className="text-sm text-stone-500 mt-2">
                {userRating ? '評価済み (クリックして更新)' : 'クリックして評価'}
              </p>
            </div>
          ) : (
            <p className="text-stone-500">
              評価するには<Link to="/login" className="text-amber-600 font-bold hover:underline">ログイン</Link>が必要です。
            </p>
          )}
        </div>
      </div>

      {/* Comments Section */}
      <div className="space-y-8">
        {/* Comment Form */}
        {user ? (
          <form onSubmit={handleCommentSubmit} className="mb-8">
            <div className="relative">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="商品についての質問や感想を入力してください..."
                className="w-full p-4 pb-12 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none min-h-[100px]"
              />
              
              {/* Image and Video Upload Buttons */}
              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                 <button
                   type="button"
                   onClick={() => fileInputRef.current?.click()}
                   disabled={isSubmittingComment}
                   className="text-stone-400 hover:text-amber-600 transition-colors p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                   title="画像を追加"
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                     <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                   </svg>
                 </button>
                 <button
                   type="button"
                   onClick={() => videoInputRef.current?.click()}
                   disabled={isSubmittingComment}
                   className="text-stone-400 hover:text-amber-600 transition-colors p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                   title="動画を追加 (最大50MB)"
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                     <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                   </svg>
                 </button>
                 <span className="text-xs text-stone-400">
                   {selectedImages.length > 0 && `${selectedImages.length} 画像`}
                   {selectedImages.length > 0 && selectedVideos.length > 0 && ' / '}
                   {selectedVideos.length > 0 && `${selectedVideos.length} 動画`}
                 </span>
                 <input
                   type="file"
                   multiple
                   accept="image/*"
                   className="hidden"
                   ref={fileInputRef}
                   onChange={handleImageSelect}
                   disabled={isSubmittingComment}
                   aria-label="画像をアップロード"
                 />
                 <input
                   type="file"
                   multiple
                   accept="video/*,.mp4,.mov,.avi,.mkv,.webm,.flv,.wmv"
                   className="hidden"
                   ref={videoInputRef}
                   onChange={handleVideoSelect}
                   disabled={isSubmittingComment}
                   aria-label="動画をアップロード"
                 />
              </div>
            </div>

            {/* Selected Images and Videos Preview */}
            {(selectedImages.length > 0 || selectedVideos.length > 0) && (
              <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
                {selectedImages.map((file, index) => (
                  <div key={`img-${index}`} className="relative flex-shrink-0 w-20 h-20 rounded border border-stone-200 overflow-hidden group">
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-0 right-0 bg-black/50 text-white w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {selectedVideos.map((file, index) => {
                  const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
                  return (
                    <div key={`vid-${index}`} className="relative flex-shrink-0 w-20 h-20 rounded border border-stone-200 overflow-hidden group bg-stone-100">
                      <video 
                        src={URL.createObjectURL(file)} 
                        className="w-full h-full object-cover"
                        muted
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[8px] px-1 py-0.5">
                        {fileSizeMB}MB
                      </div>
                      <button
                        type="button"
                        onClick={() => removeVideo(index)}
                        className="absolute top-0 right-0 bg-black/50 text-white w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              type="submit"
              disabled={(!newComment.trim() && selectedImages.length === 0 && selectedVideos.length === 0) || isSubmittingComment}
              className="mt-2 px-6 py-2 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 min-w-[140px]"
            >
              {isSubmittingComment ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>送信中...</span>
                </>
              ) : (
                'コメントを送信'
              )}
            </button>
          </form>
        ) : (
          <div className="bg-stone-50 p-4 rounded-lg text-center mb-8 border border-stone-200">
            コメントするには<Link to="/login" className="text-amber-600 font-bold hover:underline">ログイン</Link>が必要です。
          </div>
        )}

        {/* Comment List */}
        <div className="space-y-6">
          {comments.length === 0 ? (
            <p className="text-center text-stone-500 py-8">まだコメントはありません。</p>
          ) : (
            <>
              {displayedComments.map((comment) => (
              <div key={comment.id} className="group">
                <div className="flex gap-4">
                  {comment.user.profile?.avatar_url ? (
                    <img
                      src={comment.user.profile.avatar_url}
                      alt={comment.user.username || comment.user.email.split('@')[0]}
                      className="w-10 h-10 rounded-full object-cover border border-amber-200 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold flex-shrink-0 border border-amber-200">
                      {comment.user.username?.[0]?.toUpperCase() || comment.user.email[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="bg-stone-50 p-4 rounded-lg rounded-tl-none border border-stone-100">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-stone-800">
                          {comment.user.username || comment.user.email.split('@')[0]}
                        </span>
                        <span className="text-xs text-stone-400">
                          {new Date(comment.created_at).toLocaleDateString('ja-JP')}
                        </span>
                      </div>
                      <p className="text-stone-700 whitespace-pre-wrap">{comment.content}</p>
                      
                      {/* Comment Images and Videos */}
                      {comment.images && comment.images.length > 0 && (
                        <div className="mt-3 flex gap-2 flex-wrap">
                           {comment.images.map((img) => (
                             img.is_video ? (
                               <button
                                 key={img.id}
                                 type="button"
                                 onClick={() => setExpandedVideo(img.image)}
                                 className="block w-48 h-32 rounded border border-stone-200 overflow-hidden hover:opacity-90 transition-opacity bg-stone-100 relative group cursor-pointer"
                                 aria-label="動画を拡大"
                               >
                                 <video 
                                   src={img.image} 
                                   className="w-full h-full object-cover"
                                   controls
                                   preload="metadata"
                                   onClick={(e) => e.stopPropagation()}
                                 />
                                 <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                     <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                                   </svg>
                                   拡大
                                 </div>
                               </button>
                             ) : (
                               <a 
                                 key={img.id} 
                                 href={img.image} 
                                 target="_blank" 
                                 rel="noopener noreferrer"
                                 className="block w-24 h-24 rounded border border-stone-200 overflow-hidden hover:opacity-90 transition-opacity"
                                 aria-label="画像を開く"
                               >
                                 <img 
                                   src={img.image} 
                                   alt="Comment attachment" 
                                   className="w-full h-full object-cover"
                                 />
                               </a>
                             )
                           ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Reply Button */}
                    {user && (
                      <button 
                        onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                        className="text-xs text-stone-500 font-bold hover:text-amber-600 mt-2 ml-2"
                      >
                        返信
                      </button>
                    )}

                    {/* Reply Form */}
                    {replyTo === comment.id && (
                      <div className="mt-4 ml-4 pl-4 border-l-2 border-stone-200">
                        <textarea
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="返信を入力..."
                          className="w-full p-3 border border-stone-200 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none text-sm"
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleReplySubmit(comment.id)}
                            disabled={isSubmittingComment}
                            className="px-4 py-1.5 bg-amber-600 text-white text-xs font-bold rounded hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                          >
                            {isSubmittingComment && (
                              <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            )}
                            {isSubmittingComment ? '送信中...' : '送信'}
                          </button>
                          <button
                            onClick={() => setReplyTo(null)}
                            disabled={isSubmittingComment}
                            className="px-4 py-1.5 bg-stone-200 text-stone-600 text-xs font-bold rounded hover:bg-stone-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            キャンセル
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Replies List */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-4 ml-8 space-y-4 border-l-2 border-stone-100 pl-4">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="flex gap-3">
                            {reply.user.profile?.avatar_url ? (
                              <img
                                src={reply.user.profile.avatar_url}
                                alt={reply.user.username || reply.user.email.split('@')[0]}
                                className="w-8 h-8 rounded-full object-cover border border-stone-200 flex-shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 text-xs font-bold flex-shrink-0 border border-stone-200">
                                {reply.user.username?.[0]?.toUpperCase() || reply.user.email[0].toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1 bg-stone-50 p-3 rounded-lg border border-stone-100">
                              <div className="flex justify-between items-start mb-1">
                                <span className="font-bold text-sm text-stone-800">
                                  {reply.user.username || reply.user.email.split('@')[0]}
                                </span>
                                <span className="text-xs text-stone-400">
                                  {new Date(reply.created_at).toLocaleDateString('ja-JP')}
                                </span>
                              </div>
                              <p className="text-sm text-stone-700 whitespace-pre-wrap">{reply.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              ))}
              
              {/* Show More/Less Button */}
              {hasMoreComments && (
                <div className="text-center pt-4">
                  <button
                    onClick={() => setShowAllComments(!showAllComments)}
                    className="px-6 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium rounded-lg transition-colors"
                  >
                    {showAllComments 
                      ? `コメントを折りたたむ (${comments.length}件)` 
                      : `さらに${comments.length - COMMENTS_LIMIT}件のコメントを表示`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

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
