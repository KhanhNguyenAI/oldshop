import React, { useState } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

type Category = 'metal' | 'zappin' | 'plastic' | 'other' | 'wood';

interface PriceItem {
  name: string;
  unitPrice: string;
  note?: string;
}

const priceData: Record<Category, PriceItem[]> = {
  metal: [
    { name: '銅（1号銅）', unitPrice: '1,200円/kg' },
    { name: '銅（込銅）', unitPrice: '900円/kg' },
    { name: '真鍮（しんちゅう）', unitPrice: '650円/kg' },
    { name: 'アルミサッシ', unitPrice: '180円/kg' },
    { name: 'アルミ缶', unitPrice: '80円/kg' },
    { name: 'ステンレス', unitPrice: '130円/kg' },
    { name: '鉄（H鋼）', unitPrice: '50円/kg' },
  ],
  zappin: [
    { name: '雑品（ミックスメタル）', unitPrice: '40円/kg' },
    { name: '雑品家電（小型）', unitPrice: '20円/kg' },
    { name: '雑品家電（大型）', unitPrice: '10円/kg' },
  ],
  plastic: [
    { name: 'プラ雑品（プラざっぴん）', unitPrice: '5円/kg' },
    { name: 'ペットボトル（圧縮）', unitPrice: '30円/kg' },
    { name: 'PVC（硬質）', unitPrice: '20円/kg' },
  ],
  other: [
    { name: '電線（被覆線）', unitPrice: '200円/kg' },
    { name: 'モーター', unitPrice: '60円/kg' },
    { name: 'バッテリー', unitPrice: '50円/kg' },
  ],
  wood: [
    { name: '木材スクラップ（一般）', unitPrice: '5円/kg' },
    { name: 'パレット木材', unitPrice: '10円/kg' },
    { name: '建築廃材（混合）', unitPrice: '0円/kg', note: '処理困難物' },
    { name: 'MDF板・合板', unitPrice: '0円/kg', note: '処理困難物' },
    { name: '処理困難物', unitPrice: '受入不可', note: '—' },
  ],
};

const categoryInfo: Record<Category, { label: string; icon: string; activeBg: string; activeBorder: string; inactiveBg: string; inactiveBorder: string; inactiveText: string }> = {
  metal: { 
    label: '金属スクラップ', 
    icon: '🟦', 
    activeBg: 'bg-blue-600', 
    activeBorder: 'border-blue-800',
    inactiveBg: 'bg-white hover:bg-blue-50',
    inactiveBorder: 'border-blue-300',
    inactiveText: 'text-blue-800'
  },
  zappin: { 
    label: '雑品スクラップ', 
    icon: '🟪', 
    activeBg: 'bg-purple-600', 
    activeBorder: 'border-purple-800',
    inactiveBg: 'bg-white hover:bg-purple-50',
    inactiveBorder: 'border-purple-300',
    inactiveText: 'text-purple-800'
  },
  plastic: { 
    label: 'プラスチック', 
    icon: '🟩', 
    activeBg: 'bg-green-600', 
    activeBorder: 'border-green-800',
    inactiveBg: 'bg-white hover:bg-green-50',
    inactiveBorder: 'border-green-300',
    inactiveText: 'text-green-800'
  },
  other: { 
    label: 'その他', 
    icon: '🟧', 
    activeBg: 'bg-orange-600', 
    activeBorder: 'border-orange-800',
    inactiveBg: 'bg-white hover:bg-orange-50',
    inactiveBorder: 'border-orange-300',
    inactiveText: 'text-orange-800'
  },
  wood: { 
    label: '木材スクラップ', 
    icon: '🪵', 
    activeBg: 'bg-amber-600', 
    activeBorder: 'border-amber-800',
    inactiveBg: 'bg-white hover:bg-amber-50',
    inactiveBorder: 'border-amber-300',
    inactiveText: 'text-amber-800'
  },
};

export const BuybackPricePage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<Category>('metal');

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Page Title */}
        <div className="bg-gradient-to-r from-amber-800 to-amber-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-center mb-4">
              買取価格
            </h1>
            <p className="text-center text-amber-100 text-lg">
              当社のスクラップ買取価格一覧
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Category Tabs */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-3 justify-center">
              {(Object.keys(categoryInfo) as Category[]).map((category) => {
                const info = categoryInfo[category];
                const isActive = activeCategory === category;
                return (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`
                      px-6 py-3 rounded-lg font-bold text-sm md:text-base transition-all duration-200
                      border-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5
                      ${isActive
                        ? `${info.activeBg} text-white ${info.activeBorder} shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]`
                        : `${info.inactiveBg} ${info.inactiveText} ${info.inactiveBorder}`
                      }
                    `}
                  >
                    <span className="mr-2">{info.icon}</span>
                    {info.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price Table */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-amber-200 overflow-hidden mb-8">
            <div className={`
              px-6 py-4
              ${activeCategory === 'metal' ? 'bg-gradient-to-r from-blue-600 to-blue-700' : ''}
              ${activeCategory === 'zappin' ? 'bg-gradient-to-r from-purple-600 to-purple-700' : ''}
              ${activeCategory === 'plastic' ? 'bg-gradient-to-r from-green-600 to-green-700' : ''}
              ${activeCategory === 'other' ? 'bg-gradient-to-r from-orange-600 to-orange-700' : ''}
              ${activeCategory === 'wood' ? 'bg-gradient-to-r from-amber-600 to-amber-700' : ''}
            `}>
              <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
                <span>{categoryInfo[activeCategory].icon}</span>
                {categoryInfo[activeCategory].label}
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-amber-50">
                  <tr>
                    <th className="px-6 py-4 text-left font-bold text-amber-900 border-b-2 border-amber-200">
                      品名
                    </th>
                    <th className="px-6 py-4 text-center font-bold text-amber-900 border-b-2 border-amber-200">
                      単価
                    </th>
                    <th className="px-6 py-4 text-center font-bold text-amber-900 border-b-2 border-amber-200">
                      備考
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {priceData[activeCategory].map((item, index) => (
                    <tr
                      key={index}
                      className="border-b border-amber-100 hover:bg-amber-50 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-stone-900">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-amber-800">
                        {item.unitPrice}
                      </td>
                      <td className="px-6 py-4 text-center text-stone-500">
                        {item.note || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notice Section */}
          <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl border-2 border-amber-300 p-6 md:p-8 mb-8 shadow-md">
            <h3 className="text-xl font-serif font-bold text-amber-900 mb-4 flex items-center gap-2">
              <span>📢</span> お知らせ・注意事項
            </h3>
            <div className="space-y-3 text-stone-700 text-sm md:text-base">
              <div className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <p>価格は市場相場により変動する場合がございます。最新の価格はお問い合わせください。</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <p>買取価格は数量・品質・状態により異なります。現物確認後に正式な見積もりを提示いたします。</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <p>処理困難物や危険物は受入不可の場合がございます。事前にご確認ください。</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <p>大量のスクラップをお持ちの場合は、お気軽にお問い合わせください。特別価格をご提示できる場合がございます。</p>
              </div>
            </div>
          </div>

          {/* Access / Map Section */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-amber-200 overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-6 py-4">
              <h3 className="text-xl font-serif font-bold text-white flex items-center gap-2">
                <span>📍</span> アクセス・店舗情報
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-bold text-amber-900 mb-3">住所</h4>
                  <p className="text-stone-700 mb-4">
                    東京都福生市武蔵野台1-3-9東福生マンション
                  </p>
                  <h4 className="font-bold text-amber-900 mb-3">営業時間</h4>
                  <p className="text-stone-700">
                    平日: 9:00 - 18:00<br />
                    土曜: 9:00 - 17:00<br />
                    日曜・祝日: 休業
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-amber-900 mb-3">お問い合わせ</h4>
                  <p className="text-stone-700 mb-2">
                    📞 <a href="tel:080-xxxx-xxxx" className="hover:text-amber-600">080-xxxx-xxxx</a>
                  </p>
                  <p className="text-stone-700">
                    ✉️ <a href="mailto:9.7nguyenvantuankhanh@gmail.com" className="hover:text-amber-600">9.7nguyenvantuankhanh@gmail.com</a>
                  </p>
                </div>
              </div>
              
              {/* Map */}
              <div className="relative w-full h-80 rounded-lg border-4 border-amber-300 shadow-inner overflow-hidden bg-amber-100">
                <iframe 
                  src="https://maps.google.com/maps?q=東京都福生市武蔵野台1-3-9東福生マンション&t=&z=17&ie=UTF8&iwloc=&output=embed"
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Buyback Location"
                  className="filter sepia-[0.2] contrast-[1.1] opacity-90 hover:opacity-100 hover:sepia-0 transition-all duration-700"
                ></iframe>
                <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_30px_rgba(69,26,3,0.6)]"></div>
              </div>
              
              <div className="text-center mt-4">
                <a 
                  href="https://www.google.com/maps/search/?api=1&query=東京都福生市武蔵野台1-3-9東福生マンション"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-serif text-sm transition-colors group"
                >
                  <span>Google Maps で見る</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

