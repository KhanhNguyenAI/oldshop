import React from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { RobotAssistant } from '../components/RobotAssistant';
import { useAuth } from '../contexts/AuthContext';

export const HomePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-100 via-orange-50 to-yellow-100 relative overflow-hidden">
      {/* Vintage paper texture overlay */}
      <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuOSIgbnVtT2N0YXZlcz0iNCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNub2lzZSkiIG9wYWNpdHk9IjAuNCIvPjwvc3ZnPg==')]"></div>
      
      <Header />

      <main className="relative z-10">
        {/* Hero Section - Always visible */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
           <h1 className="text-5xl md:text-7xl font-bold text-amber-900 font-serif mb-6 drop-shadow-sm tracking-wider">
             ReHome Market
           </h1>
           <div className="w-24 h-1 bg-amber-800 mx-auto mb-8 rounded-full"></div>
           <p className="text-xl text-amber-800 font-serif italic mb-8 max-w-2xl mx-auto leading-relaxed">
             "あなたの生活に、時を超えた価値を。<br/>
             Reuse, Recycle, ReHome."
           </p>
           <div className="inline-block p-2 border-t-2 border-b-2 border-amber-800 mb-12">
             <span className="text-amber-900 font-bold tracking-[0.3em] uppercase text-sm">
               創業 2025年 • 東京, 日本
             </span>
           </div>

           {/* Call to Action (if not logged in) */}
           {!user && (
             <div className="flex justify-center gap-4">
               <Link
                 to="/shop"
                 className="px-8 py-3 bg-amber-800 text-amber-50 font-bold font-serif uppercase tracking-widest rounded-sm shadow-[4px_4px_0px_0px_rgba(69,26,3,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(69,26,3,1)] transition-all"
               >
                 お買い物へ
               </Link>
               <Link
                 to="/register"
                 className="px-8 py-3 bg-amber-100 text-amber-900 border-2 border-amber-800 font-bold font-serif uppercase tracking-widest rounded-sm shadow-[4px_4px_0px_0px_rgba(120,53,15,0.5)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(120,53,15,0.5)] transition-all"
               >
                 会員登録
               </Link>
             </div>
           )}
        </div>

        {/* Robot Assistant Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <RobotAssistant />
        </div>

        {/* User Dashboard Section (Only if logged in) */}
        {user && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 shadow-[8px_8px_0px_0px_rgba(120,53,15,0.3)] border-4 border-amber-800 rounded-sm p-8 relative">
              {/* Corner decorations */}
              <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-amber-700"></div>
              <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-amber-700"></div>
              <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-amber-700"></div>
              <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-amber-700"></div>
              
              <h2 className="text-2xl font-bold text-amber-900 mb-6 font-serif border-b-4 border-amber-800 inline-block pb-2">
                👋 おかえりなさい, {user.email.split('@')[0]}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Email Card */}
                <div className="bg-amber-100 border-2 border-amber-700 rounded-sm p-4 shadow-sm">
                  <p className="text-xs text-amber-800 font-bold uppercase tracking-wider font-serif mb-2">アカウント</p>
                  <p className="text-lg font-mono text-amber-900 truncate">{user.email}</p>
                </div>

                {/* Status Card */}
                <div className="bg-amber-100 border-2 border-amber-700 rounded-sm p-4 shadow-sm">
                  <p className="text-xs text-amber-800 font-bold uppercase tracking-wider font-serif mb-2">ステータス</p>
                  <p className="text-lg font-serif text-amber-900">
                    {user.is_email_verified ? '✅ 認証済み' : '❌ 未認証'}
                  </p>
                </div>

                {/* Member Since Card */}
                <div className="bg-amber-100 border-2 border-amber-700 rounded-sm p-4 shadow-sm">
                  <p className="text-xs text-amber-800 font-bold uppercase tracking-wider font-serif mb-2">登録年</p>
                  <p className="text-lg font-serif text-amber-900">
                    {new Date(user.created_at).getFullYear()}年
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Map Section */}
        <div className="mt-16 bg-amber-900 py-8 relative">
          {/* Section Title */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-amber-100 font-serif inline-block border-b-2 border-amber-500 pb-1">
              📍 店舗へのアクセス
            </h2>
          </div>

          {/* Map Container */}
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative w-full h-80 rounded-sm border-4 border-amber-950 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] overflow-hidden bg-amber-100">
              <iframe 
                src="https://maps.google.com/maps?q=東京都福生市武蔵野台1-3-9東福生マンション&t=&z=17&ie=UTF8&iwloc=&output=embed"
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title="ReHome Market Location"
                className="filter sepia-[0.2] contrast-[1.1] opacity-90 hover:opacity-100 hover:sepia-0 transition-all duration-700"
              ></iframe>
              
              {/* Vintage Vignette Effect */}
              <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_30px_rgba(69,26,3,0.6)]"></div>
            </div>
            
            <div className="text-center mt-4">
              <a 
                href="https://www.google.com/maps/search/?api=1&query=東京都福生市武蔵野台1-3-9東福生マンション"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-amber-200 hover:text-amber-50 font-serif text-sm transition-colors group"
              >
                <span>Google Maps で見る</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

