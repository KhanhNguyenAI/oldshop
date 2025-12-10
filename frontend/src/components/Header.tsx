import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Logo } from './ui/Logo';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

export const Header: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { totalItems, toggleCart, cartIconRef, items, subtotal } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLAnchorElement>(null);
  
  const [showCartMenu, setShowCartMenu] = useState(false);
  const cartMenuRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { label: 'ホーム', path: '/' },
    { label: '商品一覧', path: '/shop' },
    { label: '無料あげます', path: '/free-items' },
    { label: '予約', path: '/booking' },
    { label: '概要', path: '/about' },
    { label: 'お問い合わせ', path: '/contact' },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Profile menu features
  const profileFeatures = [
    { icon: '👤', label: 'プロフィール', path: '/profile', tab: 'profile' },
    { icon: '💳', label: '決済方法', path: '/profile', tab: 'banking' },
    { icon: '📍', label: '住所', path: '/profile', tab: 'address' },
    { icon: '🎟️', label: 'クーポン', path: '/profile', tab: 'coupons' },
    { icon: '🔒', label: 'パスワード変更', path: '/profile', tab: 'security' },
    { icon: '🛍️', label: '購入履歴', path: '/profile', tab: 'orders' },
    { icon: '📅', label: '予約履歴', path: '/profile', tab: 'bookings' },
  ];

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        profileButtonRef.current &&
        !profileMenuRef.current.contains(event.target as Node) &&
        !profileButtonRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false);
      }
      
      if (
        cartMenuRef.current &&
        cartIconRef.current &&
        !cartMenuRef.current.contains(event.target as Node) &&
        !cartIconRef.current.contains(event.target as Node)
      ) {
        setShowCartMenu(false);
      }
    };

    if (showProfileMenu || showCartMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu, showCartMenu, cartIconRef]);

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(numPrice);
  };

  return (
    <header className="relative z-50 w-full">
      {/* Main Navigation Bar (Wood/Paper Texture) */}
      <div className="bg-amber-50 border-b-4 border-amber-900 shadow-md relative">
        {/* Paper Texture Overlay */}
        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuOSIgbnVtT2N0YXZlcz0iNCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNub2lzZSkiIG9wYWNpdHk9IjAuNCIvPjwvc3ZnPg==')]"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex justify-between items-center h-24">
            {/* Left: Logo */}
            <div className="flex-shrink-0 py-2">
              <Link to="/" className="block transform hover:scale-105 transition-transform duration-300">
                <Logo size="md" />
              </Link>
            </div>

            {/* Right: Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    px-4 py-2 rounded-sm font-serif font-bold tracking-wider text-sm transition-all duration-200
                    border-2 border-transparent hover:border-amber-800
                    ${isActive(item.path) 
                      ? 'bg-amber-800 text-amber-50 border-amber-900 shadow-[3px_3px_0px_0px_rgba(69,26,3,1)] transform -translate-y-0.5' 
                      : 'text-amber-900 hover:bg-amber-100 hover:shadow-[2px_2px_0px_0px_rgba(120,53,15,0.5)]'}
                  `}
                >
                  {item.label}
                </Link>
              ))}

              {/* Cart Button */}
              <div className="relative ml-2">
                <button
                  ref={cartIconRef}
                  onClick={toggleCart}
                  onMouseEnter={() => totalItems > 0 && setShowCartMenu(true)}
                  onMouseLeave={() => setShowCartMenu(false)}
                  className="relative p-2 text-amber-900 hover:text-amber-700 transition-colors"
                  aria-label="Cart"
                >
                  <span className="text-2xl">🛒</span>
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-amber-50">
                      {totalItems}
                    </span>
                  )}
                </button>
                
                {/* Cart Preview Dropdown */}
                {showCartMenu && totalItems > 0 && (
                  <div
                    ref={cartMenuRef}
                    onMouseEnter={() => setShowCartMenu(true)}
                    onMouseLeave={() => setShowCartMenu(false)}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border-2 border-amber-200 z-50 overflow-hidden animate-fadeIn"
                  >
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 border-b border-amber-200">
                      <h3 className="font-bold text-amber-900 text-sm font-serif flex items-center gap-2">
                        <span>🛒</span> ショッピングカート ({totalItems}点)
                      </h3>
                    </div>
                    
                    {/* Cart Items Preview (max 5 items) */}
                    <div className="max-h-96 overflow-y-auto">
                      {items.slice(0, 5).map((item) => (
                        <div key={item.product.id} className="flex gap-3 p-3 border-b border-amber-100 hover:bg-amber-50 transition-colors">
                          {/* Image */}
                          <div className="w-16 h-16 bg-stone-100 rounded-md overflow-hidden flex-shrink-0 border border-stone-200">
                            {item.product.image ? (
                              <img 
                                src={item.product.image} 
                                alt={item.product.title} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-stone-300 text-xs">📷</div>
                            )}
                          </div>
                          
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-stone-900 text-xs line-clamp-2 mb-1">
                              {item.product.title}
                            </h4>
                            <div className="flex items-center justify-between">
                              <span className="text-amber-700 font-bold text-xs">
                                {item.product.sale_price ? (
                                  <>
                                    <span className="text-red-600">{formatPrice(item.product.sale_price)}</span>
                                    <span className="text-stone-400 line-through text-xs ml-1">{formatPrice(item.product.price)}</span>
                                  </>
                                ) : (
                                  formatPrice(item.product.price)
                                )}
                              </span>
                              <span className="text-stone-500 text-xs">×{item.quantity}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {items.length > 5 && (
                        <div className="p-3 text-center text-xs text-amber-600 bg-amber-50 border-t border-amber-200">
                          他 {items.length - 5} 点の商品があります
                        </div>
                      )}
                    </div>
                    
                    {/* Footer with total and view cart button */}
                    <div className="bg-amber-50 border-t border-amber-200 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-amber-900">小計:</span>
                        <span className="text-lg font-bold text-amber-800">{formatPrice(subtotal)}</span>
                      </div>
                      <button
                        onClick={() => {
                          setShowCartMenu(false);
                          toggleCart();
                        }}
                        className="w-full py-2 bg-amber-800 text-white rounded-md font-bold text-sm hover:bg-amber-700 transition-colors"
                      >
                        カートを見る →
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Auth Buttons */}
              <div className="ml-2 pl-4 border-l-2 border-amber-200 h-8 flex items-center gap-3">
                {user ? (
                  <div className="flex items-center gap-4 relative">
                    <div className="relative">
                      <Link
                        ref={profileButtonRef}
                        to="/profile"
                        onMouseEnter={() => setShowProfileMenu(true)}
                        onMouseLeave={() => setShowProfileMenu(false)}
                        className="relative p-2 text-amber-900 hover:text-amber-700 transition-colors group block"
                        title="プロフィール"
                        aria-label="プロフィール"
                      >
                        <span className="text-2xl">👤</span>
                        <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-amber-700 group-hover:w-full transition-all duration-200"></span>
                      </Link>
                      
                      {/* Profile Features Dropdown */}
                      {showProfileMenu && (
                        <div
                          ref={profileMenuRef}
                          onMouseEnter={() => setShowProfileMenu(true)}
                          onMouseLeave={() => setShowProfileMenu(false)}
                          className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border-2 border-amber-200 z-100100 overflow-hidden animate-fadeIn"
                        >
                          <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 border-b border-amber-200">
                            <h3 className="font-bold text-amber-900 text-sm font-serif">プロフィール機能</h3><br />
                            <p className="text-xs text-amber-700 mt-1">利用可能な機能一覧</p>
                          </div>
                          <div className="py-2">
                            {profileFeatures.map((feature) => (
                              <Link
                                key={feature.tab}
                                to={`${feature.path}?tab=${feature.tab}`}
                                onClick={() => setShowProfileMenu(false)}
                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-amber-50 transition-colors group/item"
                              >
                                <span className="text-lg">{feature.icon}</span>
                                <span className="text-sm text-amber-900 font-medium group-hover/item:text-amber-700">
                                  {feature.label}
                                </span>
                                <span className="ml-auto text-xs text-amber-400 group-hover/item:text-amber-600">→</span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => logout()}
                      className="text-xs font-bold text-red-800 hover:text-red-600 font-serif uppercase tracking-widest border-b border-transparent hover:border-red-600 transition-all"
                    >
                      ログアウト
                    </button>
                  </div>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="text-xs font-bold text-amber-900 hover:text-amber-700 font-serif uppercase tracking-widest border-b border-transparent hover:border-amber-700 transition-all"
                    >
                      ログイン
                    </Link>
                    <Link
                      to="/register"
                      className="px-3 py-1 bg-amber-800 text-amber-50 text-xs font-bold font-serif uppercase tracking-widest rounded-sm shadow-sm hover:bg-amber-700 transition-all"
                    >
                      新規登録
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center gap-4">
              {/* Cart Button Mobile */}
              <div className="relative">
                <button
                  onClick={toggleCart}
                  onMouseEnter={() => totalItems > 0 && setShowCartMenu(true)}
                  onMouseLeave={() => setShowCartMenu(false)}
                  className="relative p-2 text-amber-900"
                >
                  <span className="text-2xl">🛒</span>
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-amber-50">
                      {totalItems}
                    </span>
                  )}
                </button>
                
                {/* Cart Preview Dropdown for Mobile (same as desktop) */}
                {showCartMenu && totalItems > 0 && (
                  <div
                    ref={cartMenuRef}
                    onMouseEnter={() => setShowCartMenu(true)}
                    onMouseLeave={() => setShowCartMenu(false)}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border-2 border-amber-200 z-50 overflow-hidden animate-fadeIn"
                  >
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 border-b border-amber-200">
                      <h3 className="font-bold text-amber-900 text-sm font-serif flex items-center gap-2">
                        <span>🛒</span> ショッピングカート ({totalItems}点)
                      </h3>
                    </div>
                    
                    {/* Cart Items Preview (max 5 items) */}
                    <div className="max-h-96 overflow-y-auto">
                      {items.slice(0, 5).map((item) => (
                        <div key={item.product.id} className="flex gap-3 p-3 border-b border-amber-100 hover:bg-amber-50 transition-colors">
                          {/* Image */}
                          <div className="w-16 h-16 bg-stone-100 rounded-md overflow-hidden flex-shrink-0 border border-stone-200">
                            {item.product.image ? (
                              <img 
                                src={item.product.image} 
                                alt={item.product.title} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-stone-300 text-xs">📷</div>
                            )}
                          </div>
                          
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-stone-900 text-xs line-clamp-2 mb-1">
                              {item.product.title}
                            </h4>
                            <div className="flex items-center justify-between">
                              <span className="text-amber-700 font-bold text-xs">
                                {item.product.sale_price ? (
                                  <>
                                    <span className="text-red-600">{formatPrice(item.product.sale_price)}</span>
                                    <span className="text-stone-400 line-through text-xs ml-1">{formatPrice(item.product.price)}</span>
                                  </>
                                ) : (
                                  formatPrice(item.product.price)
                                )}
                              </span>
                              <span className="text-stone-500 text-xs">×{item.quantity}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {items.length > 5 && (
                        <div className="p-3 text-center text-xs text-amber-600 bg-amber-50 border-t border-amber-200">
                          他 {items.length - 5} 点の商品があります
                        </div>
                      )}
                    </div>
                    
                    {/* Footer with total and view cart button */}
                    <div className="bg-amber-50 border-t border-amber-200 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-amber-900">小計:</span>
                        <span className="text-lg font-bold text-amber-800">{formatPrice(subtotal)}</span>
                      </div>
                      <button
                        onClick={() => {
                          setShowCartMenu(false);
                          toggleCart();
                        }}
                        className="w-full py-2 bg-amber-800 text-white rounded-md font-bold text-sm hover:bg-amber-700 transition-colors"
                      >
                        カートを見る →
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-amber-900 hover:text-amber-700 hover:bg-amber-100 focus:outline-none border-2 border-amber-900 shadow-sm"
              >
                <span className="sr-only">Open main menu</span>
                {isMenuOpen ? (
                  <span className="text-xl font-bold">✕</span>
                ) : (
                  <span className="text-xl font-bold">☰</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Info Ribbon (Address Bar) - Treo dưới header */}
      <div className="bg-amber-900 border-b-4 border-amber-950 shadow-lg relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 relative z-10">
          <div className="flex flex-col md:flex-row justify-center items-center gap-2 md:gap-8 text-amber-100 text-xs md:text-sm font-mono tracking-tight">
            
            {/* Address */}
            <a 
              href="https://www.google.com/maps/search/?api=1&query=東京都福生市武蔵野台1-3-9東福生マンション"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 group cursor-pointer hover:text-amber-50 transition-colors"
            >
              <span className="bg-amber-950 p-1 rounded text-amber-400 group-hover:text-amber-200 transition-colors text-xs">📍</span>
              <span className="border-b border-dashed border-amber-700 group-hover:border-amber-400 transition-colors truncate max-w-[200px] md:max-w-none">
                東京都福生市武蔵野台1-3-9...
              </span>
            </a>

            <span className="hidden md:inline text-amber-700 opacity-50">|</span>

            {/* Phone */}
            <a 
              href="tel:080-xxxx-xxxx"
              className="flex items-center gap-2 group cursor-pointer hover:text-amber-50 transition-colors"
            >
              <span className="bg-amber-950 p-1 rounded text-amber-400 group-hover:text-amber-200 transition-colors text-xs">📞</span>
              <span className="border-b border-dashed border-amber-700 group-hover:border-amber-400 transition-colors">
                080-xxxx-xxxx
              </span>
            </a>

            <span className="hidden md:inline text-amber-700 opacity-50">|</span>

            {/* Email */}
            <a 
              href="mailto:9.7nguyenvantuankhanh@gmail.com"
              className="flex items-center gap-2 group cursor-pointer hover:text-amber-50 transition-colors"
            >
              <span className="bg-amber-950 p-1 rounded text-amber-400 group-hover:text-amber-200 transition-colors text-xs">✉️</span>
              <span className="border-b border-dashed border-amber-700 group-hover:border-amber-400 transition-colors">
                9.7nguyenvantuankhanh@gmail.com
              </span>
            </a>

          </div>
        </div>
        
        {/* Decorative screws for the ribbon */}
        <div className="absolute top-1/2 left-2 md:left-4 transform -translate-y-1/2 w-2 h-2 rounded-full bg-amber-950 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] border border-amber-800"></div>
        <div className="absolute top-1/2 right-2 md:right-4 transform -translate-y-1/2 w-2 h-2 rounded-full bg-amber-950 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] border border-amber-800"></div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden bg-amber-50 border-b-4 border-amber-900 absolute w-full shadow-xl z-50">
          <div className="px-4 pt-4 pb-6 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMenuOpen(false)}
                className={`
                  block px-4 py-3 rounded-sm text-base font-bold font-serif uppercase tracking-wider border-2
                  ${isActive(item.path)
                    ? 'bg-amber-800 text-white border-amber-900 shadow-inner'
                    : 'text-amber-900 border-transparent hover:bg-amber-100 hover:border-amber-200'}
                `}
              >
                {item.label}
              </Link>
            ))}
            <div className="border-t border-amber-200 my-2 pt-2">
              {user ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full text-left px-4 py-3 rounded-sm text-base font-bold font-serif text-amber-900 hover:bg-amber-100 uppercase tracking-wider"
                  >
                    マイページ
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-3 rounded-sm text-base font-bold font-serif text-red-800 hover:bg-red-50 uppercase tracking-wider"
                  >
                    ログアウト
                  </button>
                </>
              ) : (
                <div className="space-y-2 px-4">
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full text-center py-2 text-amber-900 font-bold font-serif border-2 border-amber-900 rounded-sm hover:bg-amber-100 uppercase tracking-wider"
                  >
                    ログイン
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full text-center py-2 bg-amber-800 text-amber-50 font-bold font-serif rounded-sm shadow-sm hover:bg-amber-700 uppercase tracking-wider"
                  >
                    新規登録
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

