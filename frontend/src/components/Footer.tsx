import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-stone-900 text-amber-50 pt-16 pb-8 border-t border-amber-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div className="space-y-4">
            <h2 className="text-2xl font-serif font-bold text-amber-500 flex items-center gap-2">
              <span className="text-3xl">🕰️</span> OldShop
            </h2>
            <p className="text-stone-400 text-sm leading-relaxed">
              古き良きものの美しさを発見。私たちは、ヴィンテージを愛する人々をつなぎ、価値ある品々に第二の人生をもたらします。
            </p>
            <div className="flex space-x-4 pt-2">
              {/* Social Icons (SVG) */}
              <a href="https://www.facebook.com/profile.php?id=61575501615310" target="_blank" rel="noopener noreferrer" className="p-2 bg-stone-800 rounded-full hover:bg-amber-600 transition-colors" aria-label="Facebook">
                 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="https://x.com/" target="_blank" rel="noopener noreferrer" className="p-2 bg-stone-800 rounded-full hover:bg-amber-600 transition-colors" aria-label="Twitter">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.84 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
              </a>
              <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" className="p-2 bg-stone-800 rounded-full hover:bg-amber-600 transition-colors" aria-label="Instagram">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-amber-500 font-serif font-bold text-lg mb-4">探索</h3>
            <ul className="space-y-3">
              <li><Link to="/shop" className="text-stone-400 hover:text-amber-400 transition-colors">商品一覧</Link></li>
              <li><Link to="/about" className="text-stone-400 hover:text-amber-400 transition-colors">私たちについて</Link></li>
              <li><Link to="/contact" className="text-stone-400 hover:text-amber-400 transition-colors">お問い合わせ</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-amber-500 font-serif font-bold text-lg mb-4">サポート</h3>
            <ul className="space-y-3">
              <li><Link to="/contact" className="text-stone-400 hover:text-amber-400 transition-colors">よくある質問</Link></li>
              <li><Link to="#" className="text-stone-400 hover:text-amber-400 transition-colors">配送・送料</Link></li>
              <li><Link to="/return-policy" className="text-stone-400 hover:text-amber-400 transition-colors">返品・交換</Link></li>
              <li><Link to="#" className="text-stone-400 hover:text-amber-400 transition-colors">プライバシーポリシー</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-amber-500 font-serif font-bold text-lg mb-4">連絡先</h3>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3 text-stone-400">
                <span className="text-xl">📍</span>
                <a 
                  href="https://www.google.com/maps/search/?api=1&query=東京都福生市武蔵野台1-3-9東福生マンション" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-amber-400 transition-colors"
                >
                  東京都福生市武蔵野台1-3-9東福生マンション
                </a>
              </li>
              <li className="flex items-center space-x-3 text-stone-400">
                <span className="text-xl">📧</span>
                <a href="mailto:hello@oldshop.com" className="hover:text-amber-400">9.7nguyenvantuankhanh@gmail.com</a>
              </li>
              <li className="flex items-center space-x-3 text-stone-400">
                <span className="text-xl">📞</span>
                <a href="tel:+84123456789" className="hover:text-amber-400">080-xxxx-xxxxxxxx</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-stone-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-stone-500">
          <p>&copy; {new Date().getFullYear()} OldShop. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link to="#" className="hover:text-amber-500">利用規約</Link>
            <Link to="#" className="hover:text-amber-500">プライバシー</Link>
            <Link to="#" className="hover:text-amber-500">Cookie</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
