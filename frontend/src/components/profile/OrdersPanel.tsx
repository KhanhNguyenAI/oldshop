import React from 'react';

export const OrdersPanel: React.FC = () => {
  return (
    <div className="space-y-6 animate-fadeIn">
      <h3 className="text-2xl font-serif font-bold text-amber-900 border-b-2 border-amber-200 pb-2">
        購入履歴
      </h3>
      <p className="text-center text-gray-500 py-8 italic font-serif">注文が見つかりませんでした。</p>
      {/* Implement real order data here when backend is ready. */}
    </div>
  );
};


