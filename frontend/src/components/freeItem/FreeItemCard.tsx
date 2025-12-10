import React from 'react';
import { Link } from 'react-router-dom';
import type { FreeItem } from '../../types/freeItem';
import { CONDITION_LABELS, STATUS_LABELS } from '../../types/freeItem';

interface FreeItemCardProps {
  item: FreeItem;
}

export const FreeItemCard: React.FC<FreeItemCardProps> = ({ item }) => {
  const mainImage = item.images && item.images.length > 0 ? item.images[0].image_url : null;
  const timeAgo = getTimeAgo(new Date(item.created_at));

  return (
    <Link
      to={`/free-items/${item.id}`}
      className="group bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-stone-200 hover:border-green-500"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-stone-100">
        {mainImage ? (
          <img
            src={mainImage}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-400">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* Free Badge */}
        <div className="absolute top-2 left-2 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
          🆓 無料
        </div>
        
        {/* Status Badge */}
        {item.status === 'reserved' && (
          <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-bold">
            {STATUS_LABELS[item.status]}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-stone-900 mb-2 line-clamp-2 group-hover:text-green-700 transition-colors">
          {item.title}
        </h3>
        
        <div className="flex items-center gap-2 text-sm text-stone-600 mb-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{item.location_prefecture} {item.location_city}</span>
        </div>
        
        <div className="flex items-center justify-between text-xs text-stone-500">
          <span>{timeAgo}</span>
          <div className="flex items-center gap-2">
            {item.message_count !== undefined && item.message_count > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-800 font-medium border border-green-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h6m5 8l-5-5H6a2 2 0 01-2-2V6a2 2 0 012-2h12a2 2 0 012 2v14z" />
                </svg>
                {item.message_count}
              </span>
            )}
          </div>
          {item.views_count > 0 && (
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>{item.views_count}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'たった今';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}分前`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}時間前`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}日前`;
  
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}/${day}`;
}

