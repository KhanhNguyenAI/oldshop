import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-24 h-24',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      <div className={`relative ${sizeClasses[size]}`}>
        {/* Outer Ring - Gear like */}
        <div className="absolute inset-0 border-4 border-amber-200 rounded-full border-t-amber-800 animate-spin shadow-[2px_2px_4px_rgba(0,0,0,0.2)]"></div>
        
        {/* Inner Circle */}
        <div className="absolute inset-2 border-2 border-amber-100 rounded-full border-b-amber-600 animate-spin opacity-80" style={{ animationDirection: 'reverse', animationDuration: '3s' }}></div>
        
        {/* Center screw */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-amber-900 rounded-full shadow-inner"></div>
      </div>
      
      {size !== 'sm' && (
        <p className="text-amber-900 font-serif font-bold tracking-widest animate-pulse">
          LOADING...
        </p>
      )}
    </div>
  );
};

