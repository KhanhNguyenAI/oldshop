import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Header } from '../components/Header';

export const OrderSuccessPage: React.FC = () => {
  const location = useLocation();
  const state = location.state as {
    paymentMethod?: string;
    isCodAdvance?: boolean;
    advanceAmount?: number;
    remainingAmount?: number;
  } | null;
  
  const isFamilyPayment = state?.paymentMethod === 'family';
  
  return (
    <div className="min-h-screen bg-stone-50">
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-200">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
                ✓
            </div>
            <h1 className="text-3xl font-serif font-bold text-stone-900 mb-4">ご注文ありがとうございます！</h1>
            <p className="text-stone-600 mb-8 leading-relaxed">
                注文が正常に完了しました。<br/>
                確認メールをお送りしましたのでご確認ください。<br/>
                {isFamilyPayment && (
                    <>
                        <br/>
                        <span className="text-red-600 font-semibold">
                            ⚠️ ファミリーマート決済の支払い期限は注文から2日間です。<br/>
                            期限内にお支払いをお願いいたします。期限を過ぎると注文が自動的にキャンセルされます。
                        </span>
                    </>
                )}
                {!isFamilyPayment && (
                    <>
                        商品の発送準備ができ次第、再度ご連絡いたします。
                    </>
                )}
            </p>
            
            <div className="flex justify-center gap-4">
                <Link to="/shop" className="px-6 py-3 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700 transition-colors">
                    買い物を続ける
                </Link>
                <Link to="/profile?tab=orders" className="px-6 py-3 bg-stone-100 text-stone-700 rounded-lg font-bold hover:bg-stone-200 transition-colors">
                    注文履歴を見る
                </Link>
            </div>
        </div>
      </div>
    </div>
  );
};

