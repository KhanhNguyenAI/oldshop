import React, { useState } from 'react';
import { Header } from '../components/Header';
import { Link } from 'react-router-dom';
import api from '../services/api';

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    try {
      await api.post('/contact/', formData);
      setStatus('success');
      setFormData({ name: '', email: '', message: '' });
    } catch (error: any) {
      console.error('Contact submission error:', error);
      setStatus('error');
      setErrorMessage(error.response?.data?.detail || '送信中にエラーが発生しました。もう一度お試しください。');
    }
  };

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
              お問い合わせ
            </h1>
            <p className="font-serif text-amber-800 italic text-lg tracking-widest">
              CONTACT REHOME MARKET
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Info Card */}
            <div className="bg-amber-100 border-4 border-amber-800 p-8 rounded-sm shadow-[8px_8px_0px_0px_rgba(120,53,15,0.3)] relative h-full">
              {/* Screws */}
              <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-amber-900 opacity-60"></div>
              <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-amber-900 opacity-60"></div>
              <div className="absolute bottom-2 left-2 w-3 h-3 rounded-full bg-amber-900 opacity-60"></div>
              <div className="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-amber-900 opacity-60"></div>

              <h2 className="text-2xl font-bold text-amber-900 font-serif mb-6 border-b-2 border-dashed border-amber-800 pb-2 inline-block">
                連絡先情報
              </h2>
              
              <div className="space-y-6 text-amber-900 font-serif">
                <div className="flex items-start gap-4">
                  <span className="text-2xl">📍</span>
                  <div>
                    <p className="font-bold mb-1">住所</p>
                    <p>〒197-0013</p>
                    <p>東京都福生市武蔵野台1-3-9</p>
                    <p>東福生マンション</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <span className="text-2xl">📞</span>
                  <div>
                    <p className="font-bold mb-1">電話番号</p>
                    <p>080-xxxx-xxxx</p>
                    <p className="text-sm opacity-80">（平日 10:00 - 18:00）</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <span className="text-2xl">✉️</span>
                  <div>
                    <p className="font-bold mb-1">メールアドレス</p>
                    <p className="break-all">9.7nguyenvantuankhanh@gmail.com</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form Section */}
            <div className="bg-white bg-opacity-60 p-8 border-l-4 border-amber-800 shadow-lg font-serif text-amber-950">
              <h2 className="text-xl font-bold text-amber-900 mb-6">
                お問い合わせフォーム
              </h2>
              
              {status === 'success' ? (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
                  <strong className="font-bold">送信完了！</strong>
                  <span className="block sm:inline"> お問い合わせありがとうございます。確認次第、ご連絡いたします。</span>
                  <button 
                    onClick={() => setStatus('idle')}
                    className="mt-2 text-sm underline hover:text-green-800"
                  >
                    新しいメッセージを送る
                  </button>
                </div>
              ) : (
                <form className="space-y-4" onSubmit={handleSubmit}>
                  {status === 'error' && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                      <span className="block sm:inline">{errorMessage}</span>
                    </div>
                  )}

                  <div>
                    <label htmlFor="name" className="block text-sm font-bold text-amber-800 mb-1">お名前</label>
                    <input 
                      type="text" 
                      id="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full bg-amber-50 border border-amber-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="山田 太郎"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-bold text-amber-800 mb-1">メールアドレス</label>
                    <input 
                      type="email" 
                      id="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full bg-amber-50 border border-amber-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="example@email.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-bold text-amber-800 mb-1">お問い合わせ内容</label>
                    <textarea 
                      id="message"
                      rows={4}
                      value={formData.message}
                      onChange={handleChange}
                      required
                      className="w-full bg-amber-50 border border-amber-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="ご自由にご記入ください..."
                    ></textarea>
                  </div>

                  <button 
                    type="submit"
                    disabled={status === 'submitting'}
                    className="w-full bg-amber-800 text-amber-50 px-6 py-3 rounded-sm font-bold shadow-[4px_4px_0px_0px_rgba(69,26,3,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(69,26,3,1)] transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {status === 'submitting' ? '送信中...' : '送信する'}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* FAQ Section (Optional Style) */}
          <div className="relative mt-12">
             <div className="absolute inset-0 bg-amber-900 transform skew-y-1 rounded-sm shadow-xl opacity-90"></div>
             <div className="relative bg-amber-50 p-8 rounded-sm border-2 border-amber-200">
                <div className="text-center mb-6">
                   <h3 className="text-xl font-bold text-amber-900 font-serif border-b-2 border-amber-300 inline-block pb-1">
                     よくあるご質問
                   </h3>
                </div>
                <div className="space-y-4">
                   <details className="group">
                      <summary className="flex justify-between items-center font-medium cursor-pointer list-none text-amber-900 border-b border-dashed border-amber-300 pb-2">
                         <span>Q. 営業時間を教えてください</span>
                         <span className="transition group-open:rotate-180">▼</span>
                      </summary>
                      <p className="text-amber-800 mt-3 group-open:animate-fadeIn text-sm leading-relaxed">
                         平日 10:00 から 18:00 までとなっております。土日祝日は定休日ですが、Webサイトからのご注文は24時間受け付けております。
                      </p>
                   </details>
                   <details className="group">
                      <summary className="flex justify-between items-center font-medium cursor-pointer list-none text-amber-900 border-b border-dashed border-amber-300 pb-2">
                         <span>Q. 返品・交換は可能ですか？</span>
                         <span className="transition group-open:rotate-180">▼</span>
                      </summary>
                      <p className="text-amber-800 mt-3 group-open:animate-fadeIn text-sm leading-relaxed">
                         商品到着後7日以内で、未使用の場合に限り対応させていただきます。詳細は利用規約をご確認ください。
                      </p>
                   </details>
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
