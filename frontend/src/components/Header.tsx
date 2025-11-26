import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Logo } from './ui/Logo';
import { useAuth } from '../contexts/AuthContext';

export const Header: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { label: 'HOME', path: '/' },
    { label: 'SHOP', path: '/shop' },
    { label: 'BOOKING', path: '/booking' },
    { label: 'ABOUT', path: '/about' },
    { label: 'CONTACT', path: '/contact' },
  ];

  const isActive = (path: string) => location.pathname === path;

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
              
              {/* Auth Buttons */}
              <div className="ml-4 pl-4 border-l-2 border-amber-200 h-8 flex items-center gap-3">
                {user ? (
                  <div className="flex items-center gap-4">
                    <Link
                      to="/profile"
                      className="text-xs font-bold text-amber-900 hover:text-amber-700 font-serif uppercase tracking-widest border-b border-transparent hover:border-amber-700 transition-all"
                    >
                      Profile
                    </Link>
                    <button
                      onClick={() => logout()}
                      className="text-xs font-bold text-red-800 hover:text-red-600 font-serif uppercase tracking-widest border-b border-transparent hover:border-red-600 transition-all"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="text-xs font-bold text-amber-900 hover:text-amber-700 font-serif uppercase tracking-widest border-b border-transparent hover:border-amber-700 transition-all"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="px-3 py-1 bg-amber-800 text-amber-50 text-xs font-bold font-serif uppercase tracking-widest rounded-sm shadow-sm hover:bg-amber-700 transition-all"
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
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
                    MY PROFILE
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-3 rounded-sm text-base font-bold font-serif text-red-800 hover:bg-red-50 uppercase tracking-wider"
                  >
                    LOGOUT
                  </button>
                </>
              ) : (
                <div className="space-y-2 px-4">
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full text-center py-2 text-amber-900 font-bold font-serif border-2 border-amber-900 rounded-sm hover:bg-amber-100 uppercase tracking-wider"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full text-center py-2 bg-amber-800 text-amber-50 font-bold font-serif rounded-sm shadow-sm hover:bg-amber-700 uppercase tracking-wider"
                  >
                    Register
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

