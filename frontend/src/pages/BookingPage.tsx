import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Header } from '../components/Header';
import { BookingWizard } from '../components/booking/BookingWizard';
import { Logo } from '../components/ui/Logo';
import { useAuth } from '../contexts/AuthContext';

export const BookingPage: React.FC = () => {
  const location = useLocation();
  const [isBookingStarted, setIsBookingStarted] = useState(false);
  const { user } = useAuth();

  // Check if this is a rebook request
  useEffect(() => {
    if (location.state?.rebookFrom) {
      setIsBookingStarted(true);
    }
  }, [location.state]);

  // Show login message if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-stone-50 pb-20">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="bg-white p-8 rounded-xl shadow-md border border-stone-200 text-center">
            <span className="text-5xl block mb-6">🔒</span>
            <h2 className="text-2xl font-serif font-bold text-stone-900 mb-4">ログインが必要です</h2>
            <p className="text-stone-600 mb-8">
              予約手続きに進むには、ログインまたは新規登録が必要です。<br/>
              会員登録をすると、予約履歴の確認や住所の保存が可能になります。
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                to="/login" 
                state={{ from: '/booking' }} 
                className="px-8 py-3 bg-amber-900 text-white rounded-lg font-bold hover:bg-amber-800 transition-colors"
              >
                ログイン
              </Link>
              <Link 
                to="/register" 
                state={{ from: '/booking' }}
                className="px-8 py-3 border-2 border-amber-900 text-amber-900 rounded-lg font-bold hover:bg-amber-50 transition-colors"
              >
                新規登録
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-100 via-orange-50 to-yellow-100 relative overflow-hidden">
      {/* Vintage paper texture overlay */}
      <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuOSIgbnVtT2N0YXZlcz0iNCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNub2lzZSkiIG9wYWNpdHk9IjAuNCIvPjwvc3ZnPg==')]"></div>
      
      <Header />

      <main className="relative z-10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {!isBookingStarted ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
              <div className="bg-white p-8 md:p-12 rounded-sm shadow-[8px_8px_0px_0px_rgba(120,53,15,0.3)] border-4 border-amber-900 max-w-2xl w-full transform hover:scale-[1.01] transition-transform duration-300">
          
                <h1 className="text-3xl md:text-4xl font-bold text-amber-900 font-serif mt-8 mb-4">
                  不用品回収・お片付け
                </h1>
                <p className="text-lg text-amber-800 mb-8 font-serif leading-relaxed">
                  簡単5ステップで無料お見積もり。<br/>
                  あなたの生活空間をリフレッシュさせましょう。
                </p>
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-4 text-sm text-amber-700 font-bold font-mono">
                    <span className="bg-amber-100 px-3 py-1 rounded-full border border-amber-200">💰 明朗会計</span>
                    <span className="bg-amber-100 px-3 py-1 rounded-full border border-amber-200">⚡ 最短即日</span>
                    <span className="bg-amber-100 px-3 py-1 rounded-full border border-amber-200">🛡️ 秘密厳守</span>
                  </div>
                  <button
                    onClick={() => setIsBookingStarted(true)}
                    className="w-full md:w-auto px-12 py-4 bg-amber-800 text-amber-50 text-xl font-bold font-serif uppercase tracking-widest rounded-sm shadow-[4px_4px_0px_0px_rgba(69,26,3,1)] hover:bg-amber-700 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(69,26,3,1)] transition-all"
                  >
                    見積もりを始める
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-fade-in-up">
              <div className="flex items-center gap-4 mb-8">
                <button 
                  onClick={() => setIsBookingStarted(false)}
                  className="text-amber-900 font-bold hover:text-amber-700 flex items-center gap-2"
                >
                  ← 戻る
                </button>
                <h2 className="text-2xl font-bold text-amber-900 font-serif">無料お見積もり作成</h2>
              </div>
              <BookingWizard rebookData={location.state?.bookingData} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
