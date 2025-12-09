import React from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';

export const ReturnPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-amber-50 relative overflow-hidden flex flex-col">
      {/* Vintage paper texture overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuOSIgbnVtT2N0YXZlcz0iNCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNub2lzZSkiIG9wYWNpdHk9IjAuNCIvPjwvc3ZnPg==')]"></div>

      <Header />
      
      <main className="flex-grow relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav className="flex text-sm text-gray-500 mb-8">
          <Link to="/" className="hover:text-amber-600">ホーム</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">返品・交換について</span>
        </nav>

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-serif font-bold text-stone-900 mb-4">
            返品・交換について
          </h1>
          <p className="text-lg text-stone-600">
            OldShopでは、お客様に安心してお買い物いただけるよう、明確な返品・交換ポリシーを設けています。
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Overview Section */}
          <section className="bg-white p-8 rounded-xl border border-stone-200 shadow-sm">
            <h2 className="text-2xl font-serif font-bold text-stone-900 mb-4 flex items-center gap-2">
              <span>📋</span> 返品・交換ポリシー概要
            </h2>
            <div className="space-y-4 text-stone-700 leading-relaxed">
              <p>
                OldShopでは、商品の状態（コンディション）とお届けからの経過日数に応じて、返品・交換を受け付けています。
                商品の状態が良いほど、またお届けからの日数が短いほど、返金率が高くなります。
              </p>
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg mt-4">
                <p className="font-semibold text-amber-900 mb-2">重要なお知らせ</p>
                <p className="text-amber-800 text-sm">
                  返品・交換の可否と返金率は、商品の状態とお届けからの経過日数によって自動的に計算されます。
                  返品理由（ショップ側の不備、お客様側の不備、または単なる気持ちの変化）によっても、最終的な返金率が決定されます。
                </p>
              </div>
            </div>
          </section>

          {/* Return Policy by Condition */}
          <section className="bg-white p-8 rounded-xl border border-stone-200 shadow-sm">
            <h2 className="text-2xl font-serif font-bold text-stone-900 mb-6 flex items-center gap-2">
              <span>📦</span> 商品の状態別返品ポリシー
            </h2>
            
            <div className="space-y-6">
              {/* New Condition */}
              <div className="border border-stone-200 rounded-lg p-6 bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">✨</span>
                  <h3 className="text-xl font-bold text-stone-900">新品 (New)</h3>
                </div>
                <div className="space-y-2 text-stone-700">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span><strong>お届けから7日以内:</strong> 100%返金</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span><strong>お届けから8〜30日以内:</strong> 80%返金</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-600 font-bold">✗</span>
                    <span><strong>お届けから31日以降:</strong> 返品不可</span>
                  </div>
                </div>
              </div>

              {/* Like New Condition */}
              <div className="border border-stone-200 rounded-lg p-6 bg-gradient-to-r from-blue-50 to-cyan-50">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">🌟</span>
                  <h3 className="text-xl font-bold text-stone-900">未使用に近い (Like New)</h3>
                </div>
                <div className="space-y-2 text-stone-700">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span><strong>お届けから3日以内:</strong> 100%返金</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span><strong>お届けから4〜7日以内:</strong> 80%返金</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-600 font-bold">✗</span>
                    <span><strong>お届けから8日以降:</strong> 返品不可</span>
                  </div>
                </div>
              </div>

              {/* Good Condition */}
              <div className="border border-stone-200 rounded-lg p-6 bg-gradient-to-r from-amber-50 to-yellow-50">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">👍</span>
                  <h3 className="text-xl font-bold text-stone-900">目立った傷や汚れなし (Good)</h3>
                </div>
                <div className="space-y-2 text-stone-700">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span><strong>お届けから3日以内:</strong> 100%返金</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-600 font-bold">✗</span>
                    <span><strong>お届けから4日以降:</strong> 返品不可</span>
                  </div>
                </div>
              </div>

              {/* Fair Condition */}
              <div className="border border-stone-200 rounded-lg p-6 bg-gradient-to-r from-orange-50 to-amber-50">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">⚠️</span>
                  <h3 className="text-xl font-bold text-stone-900">やや傷や汚れあり (Fair)</h3>
                </div>
                <div className="space-y-2 text-stone-700">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span><strong>お届けから3日以内:</strong> 100%返金</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-600 font-bold">✗</span>
                    <span><strong>お届けから4日以降:</strong> 返品不可</span>
                  </div>
                </div>
              </div>

              {/* Poor Condition */}
              <div className="border border-stone-200 rounded-lg p-6 bg-gradient-to-r from-red-50 to-pink-50">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">❌</span>
                  <h3 className="text-xl font-bold text-stone-900">全体的に状態が悪い (Poor)</h3>
                </div>
                <div className="space-y-2 text-stone-700">
                  <div className="flex items-center gap-2">
                    <span className="text-red-600 font-bold">✗</span>
                    <span><strong>返品不可</strong> - この状態の商品は返品・交換を受け付けておりません</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Fault Type Section */}
          <section className="bg-white p-8 rounded-xl border border-stone-200 shadow-sm">
            <h2 className="text-2xl font-serif font-bold text-stone-900 mb-6 flex items-center gap-2">
              <span>🔍</span> 返品理由による最終返金率
            </h2>
            
            <div className="space-y-4 text-stone-700">
              <p className="mb-4">
                返品理由が確認された後、最終的な返金率が決定されます。以下のルールが適用されます：
              </p>
              
              <div className="space-y-4">
                <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded-lg">
                  <h4 className="font-bold text-red-900 mb-2">ショップ側の不備 (Shop Fault)</h4>
                  <p className="text-red-800 text-sm">
                    商品の不具合、説明と異なる商品、破損など、ショップ側に責任がある場合：
                    <strong className="ml-2">100%返金（商品の状態や経過日数に関係なく）</strong>
                  </p>
                </div>

                <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-bold text-blue-900 mb-2">お客様側の不備 (Customer Fault)</h4>
                  <p className="text-blue-800 text-sm">
                    お客様の使用による損傷、誤った使用方法など：
                    <strong className="ml-2">上記の状態別ポリシーに基づく返金率が適用されます</strong>
                  </p>
                </div>

                <div className="border-l-4 border-amber-500 bg-amber-50 p-4 rounded-lg">
                  <h4 className="font-bold text-amber-900 mb-2">気持ちの変化 (No Fault - Change of Mind)</h4>
                  <p className="text-amber-800 text-sm">
                    単なる気持ちの変化による返品：
                    <strong className="ml-2">上記の状態別ポリシーに基づく返金率が適用されます</strong>
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Return Process Section */}
          <section className="bg-white p-8 rounded-xl border border-stone-200 shadow-sm">
            <h2 className="text-2xl font-serif font-bold text-stone-900 mb-6 flex items-center gap-2">
              <span>📝</span> 返品・交換の手順
            </h2>
            
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-amber-600 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-stone-900 mb-2">返品申請</h4>
                  <p className="text-stone-700 text-sm">
                    マイページの「注文履歴」から返品したい商品を選択し、返品申請を行ってください。
                    返品理由と詳細を記入し、必要に応じて写真や動画を添付してください。
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-amber-600 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-stone-900 mb-2">審査・承認</h4>
                  <p className="text-stone-700 text-sm">
                    申請内容を審査し、返品理由を確認します。承認後、返品ラベルと返送先住所をお知らせします。
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-amber-600 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-stone-900 mb-2">商品返送</h4>
                  <p className="text-stone-700 text-sm">
                    提供された返品ラベルを使用して商品を返送してください。
                    返送費用は、返品理由によって異なります。
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-amber-600 text-white rounded-full flex items-center justify-center font-bold">
                  4
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-stone-900 mb-2">返金処理</h4>
                  <p className="text-stone-700 text-sm">
                    商品到着後、状態を確認し、最終的な返金率を決定します。
                    返金は、元の支払い方法に返金されます。
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Important Notes */}
          <section className="bg-amber-50 p-8 rounded-xl border-2 border-amber-200">
            <h2 className="text-2xl font-serif font-bold text-amber-900 mb-4 flex items-center gap-2">
              <span>⚠️</span> 重要な注意事項
            </h2>
            <ul className="space-y-3 text-amber-900">
              <li className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <span>返品期限は、商品の状態とお届けからの経過日数によって異なります。上記の表をご確認ください。</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <span>返品商品は、元の状態で返送してください。使用による追加の損傷がある場合、返金率が下がる可能性があります。</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <span>返送費用は、返品理由によって異なります。ショップ側の不備の場合は、返送費用を当社が負担します。</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <span>返金処理には、商品到着後3〜5営業日かかります。</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <span>返品・交換に関するご質問は、お問い合わせページからご連絡ください。</span>
              </li>
            </ul>
          </section>

          {/* Contact Section */}
          <section className="bg-white p-8 rounded-xl border border-stone-200 shadow-sm">
            <h2 className="text-2xl font-serif font-bold text-stone-900 mb-4 flex items-center gap-2">
              <span>📧</span> お問い合わせ
            </h2>
            <p className="text-stone-700 mb-4">
              返品・交換に関するご質問やご不明な点がございましたら、お気軽にお問い合わせください。
            </p>
            <Link 
              to="/contact" 
              className="inline-block px-6 py-3 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 transition-colors"
            >
              お問い合わせページへ
            </Link>
          </section>
        </div>
      </main>
    </div>
  );
};

