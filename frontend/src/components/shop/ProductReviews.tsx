import React, { useState, useEffect } from 'react';
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

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await productService.addComment(productId, newComment);
      setNewComment('');
      fetchComments();
    } catch (error) {
      console.error('Failed to submit comment:', error);
      alert('コメントの送信に失敗しました。');
    }
  };

  const handleReplySubmit = async (parentId: number) => {
    if (!replyContent.trim()) return;

    try {
      await productService.addComment(productId, replyContent, parentId);
      setReplyContent('');
      setReplyTo(null);
      fetchComments();
    } catch (error) {
      console.error('Failed to submit reply:', error);
      alert('返信の送信に失敗しました。');
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

  return (
    <div className="bg-white p-8 rounded-xl border border-stone-100 shadow-sm mt-8">
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
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="商品についての質問や感想を入力してください..."
              className="w-full p-4 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none min-h-[100px]"
            />
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="mt-2 px-6 py-2 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              コメントを送信
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
            comments.map((comment) => (
              <div key={comment.id} className="group">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold flex-shrink-0 border border-amber-200">
                    {comment.user.username?.[0]?.toUpperCase() || comment.user.email[0].toUpperCase()}
                  </div>
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
                            className="px-4 py-1.5 bg-amber-600 text-white text-xs font-bold rounded hover:bg-amber-700"
                          >
                            送信
                          </button>
                          <button
                            onClick={() => setReplyTo(null)}
                            className="px-4 py-1.5 bg-stone-200 text-stone-600 text-xs font-bold rounded hover:bg-stone-300"
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
                            <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 text-xs font-bold flex-shrink-0 border border-stone-200">
                              {reply.user.username?.[0]?.toUpperCase() || reply.user.email[0].toUpperCase()}
                            </div>
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
            ))
          )}
        </div>
      </div>
    </div>
  );
};

