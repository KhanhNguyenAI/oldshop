import React from 'react';
import { Header } from '../components/Header';
import { Link } from 'react-router-dom';

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-amber-50 relative overflow-hidden flex flex-col">
      {/* Vintage paper texture overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuOSIgbnVtT2N0YXZlcz0iNCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNub2lzZSkiIG9wYWNpdHk9IjAuNCIvPjwvc3ZnPg==')]"></div>

      <Header />

      <main className="flex-grow relative z-10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-12">
          
          {/* Hero / Title Section */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-amber-900 border-b-4 border-double border-amber-800 inline-block pb-2">
              私たちについて
            </h1>
            <p className="font-serif text-amber-800 italic text-lg tracking-widest">
              ABOUT REHOME MARKET
            </p>
          </div>

          {/* Philosophy Card */}
          <div className="bg-amber-100 border-4 border-amber-800 p-8 rounded-sm shadow-[8px_8px_0px_0px_rgba(120,53,15,0.3)] relative">
            {/* Screws */}
            <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-amber-900 opacity-60"></div>
            <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-amber-900 opacity-60"></div>
            <div className="absolute bottom-2 left-2 w-3 h-3 rounded-full bg-amber-900 opacity-60"></div>
            <div className="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-amber-900 opacity-60"></div>

            <div className="text-center">
              <h2 className="text-2xl font-bold text-amber-900 font-serif mb-4">
                PHILOSOPHY
              </h2>
              <p className="text-3xl md:text-4xl font-bold text-amber-800 font-serif tracking-wide border-y-2 border-dashed border-amber-600 py-4 mb-4">
                Recycle • Refresh • Rebuild
              </p>
              <p className="text-amber-900 font-serif leading-relaxed">
                私たちは、地域社会、お客様、そして地球環境に<br className="hidden md:inline"/>
                価値を生み出すことを使命としています。
              </p>
            </div>
          </div>

          {/* Main Narrative */}
          <div className="bg-white bg-opacity-60 p-8 md:p-12 border-l-4 border-amber-800 shadow-lg space-y-6 font-serif text-amber-950 leading-loose text-justify">
            <p>
              <span className="font-bold text-xl text-amber-800">ReHome Market（リホームマーケット）</span> は、日本国内で高品質な中古品の販売と、プロによるハウスクリーニングサービスを提供するオンラインプラットフォームです。
            </p>
            <p>
              私たちは、「安心して購入できる良質な中古品」と「快適な住まいを実現するサービス」をお届けすることを目的に設立されました。
            </p>
            
            <div className="grid md:grid-cols-2 gap-8 my-8">
              <div className="bg-amber-50 p-6 rounded border border-amber-200 shadow-inner">
                <h3 className="text-lg font-bold text-amber-900 mb-3 border-b border-amber-300 pb-1 flex items-center gap-2">
                  <span>🛒</span> 中古品販売
                </h3>
                <p className="text-sm">
                  当社が取り扱う中古商品は、すべて丁寧な検品を行い、状態に応じた透明性の高い価格を設定しています。実物写真を掲載することで、購入前に商品の状態をしっかりとご確認いただけます。
                </p>
              </div>
              <div className="bg-amber-50 p-6 rounded border border-amber-200 shadow-inner">
                <h3 className="text-lg font-bold text-amber-900 mb-3 border-b border-amber-300 pb-1 flex items-center gap-2">
                  <span>🧹</span> ハウスクリーニング
                </h3>
                <p className="text-sm">
                  経験豊富なスタッフが時間厳守・丁寧な作業・プライバシーの尊重を徹底し、お客様のご自宅をより住みやすい空間へ整えます。
                </p>
              </div>
            </div>

            <p>
              中古品の活用は、家計に優しいだけでなく、資源の循環につながり、環境保護にも大きく貢献します。
              ReHome Market は、あなたの住まいと暮らしをより良くするための、信頼できるパートナーとして心を込めてサポートいたします。
            </p>
          </div>

          {/* Mission Section */}
          <div className="relative mt-12">
            <div className="absolute inset-0 bg-amber-900 transform -skew-y-2 rounded-sm shadow-xl"></div>
            <div className="relative bg-amber-50 p-8 md:p-12 rounded-sm border-2 border-amber-200">
              <div className="text-center mb-8">
                <span className="bg-amber-800 text-amber-50 px-4 py-1 text-sm font-bold tracking-widest rounded-full shadow-md">
                  OUR MISSION
                </span>
                <h2 className="text-2xl md:text-3xl font-bold text-amber-900 mt-4 font-serif">
                  私たちの使命
                </h2>
              </div>

              <ul className="space-y-4">
                {[
                  "高品質な中古品を適正価格で提供すること",
                  "信頼できるプロフェッショナルなハウスクリーニングサービスを提供すること",
                  "お客様の快適で心地よい生活空間づくりをサポートすること",
                  "持続可能なライフスタイルを推進し、環境保全に寄与すること"
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-4 p-4 border-b border-dashed border-amber-300 hover:bg-amber-100 transition-colors group">
                    <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-amber-800 text-amber-50 font-bold rounded-full font-mono group-hover:scale-110 transition-transform">
                      {index + 1}
                    </span>
                    <span className="text-amber-900 font-bold pt-1">{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 text-center">
                <div className="inline-block border-2 border-amber-900 px-8 py-3 transform rotate-1 opacity-80 font-serif font-bold text-amber-900 text-xl border-double">
                  ReHome Market
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center py-8">
            <Link 
              to="/"
              className="inline-block bg-amber-800 text-amber-50 px-8 py-3 rounded-sm font-bold shadow-[4px_4px_0px_0px_rgba(69,26,3,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(69,26,3,1)] transition-all font-serif"
            >
              ホームに戻る
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
};

