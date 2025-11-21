import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'lg' }) => {
  const sizeClasses = {
    sm: 'text-2xl px-3 py-1 border-2 shadow-[3px_3px_0px_0px_rgba(120,53,15,1)]',
    md: 'text-3xl px-4 py-2 border-2 shadow-[4px_4px_0px_0px_rgba(120,53,15,1)]',
    lg: 'text-4xl px-6 py-3 border-4 shadow-[5px_5px_0px_0px_rgba(120,53,15,1)]',
    xl: 'text-5xl px-8 py-4 border-4 shadow-[6px_6px_0px_0px_rgba(120,53,15,1)]',
  };

  return (
    <div className={`relative inline-block group transform hover:scale-105 transition-transform duration-300 ${className}`}>
      {/* Logo Container */}
      <div className={`
        relative z-10 bg-amber-800 text-amber-50 rounded-sm 
        border-amber-900 rotate-[-2deg] group-hover:rotate-0 transition-transform duration-300
        ${sizeClasses[size]}
      `}>
        {/* Screw decorations */}
        <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-amber-950 opacity-60"></div>
        <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-950 opacity-60"></div>
        <div className="absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full bg-amber-950 opacity-60"></div>
        <div className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-950 opacity-60"></div>

        {/* Logo Text */}
        <div className="flex items-center gap-2 font-serif font-bold tracking-[0.1em] drop-shadow-md">
          <span className="text-amber-200 transform -translate-y-0.5">🏠</span>
          <div className="flex flex-col items-center leading-none">
            <span className="uppercase">ReHome</span>
            <span className="text-[0.4em] tracking-[0.3em] text-amber-200 border-t border-amber-600 w-full text-center mt-0.5 pt-0.5">
              MARKET
            </span>
          </div>
        </div>
      </div>
      
      {/* Shadow element for depth */}
      <div className={`
        absolute inset-0 bg-amber-950 rounded-sm opacity-20 
        transform translate-x-2 translate-y-2 rotate-[-2deg] group-hover:rotate-0 -z-10 transition-transform duration-300
      `}></div>
    </div>
  );
};

