import React from 'react';

export type StampType = 'sold_out' | 'delivered' | 'returning' | 'returned';

interface StampedEffectProps {
  type: StampType;
  className?: string;
  variant?: 'overlay' | 'stamp'; // overlay: full overlay, stamp: con dấu nhỏ góc
}

export const StampedEffect: React.FC<StampedEffectProps> = ({ 
  type, 
  className = '',
  variant = 'overlay'
}) => {
  const stampConfig = {
    sold_out: {
      text: 'SOLD OUT',
      bgColor: 'bg-black/50',
      textColor: 'text-white',
      borderColor: 'border-white',
      rotation: '-rotate-12',
      stampBg: 'bg-red-600',
      stampBorder: 'border-red-800',
    },
    delivered: {
      text: '配達完了',
      bgColor: 'bg-green-600/50',
      textColor: 'text-white',
      borderColor: 'border-green-300',
      rotation: '-rotate-12',
      stampBg: 'bg-green-600',
      stampBorder: 'border-green-800',
    },
    returning: {
      text: '返品中',
      bgColor: 'bg-amber-600/50',
      textColor: 'text-white',
      borderColor: 'border-amber-300',
      rotation: 'rotate-12',
      stampBg: 'bg-amber-600',
      stampBorder: 'border-amber-800',
    },
    returned: {
      text: '返品済み',
      bgColor: 'bg-blue-600/50',
      textColor: 'text-white',
      borderColor: 'border-blue-300',
      rotation: '-rotate-12',
      stampBg: 'bg-blue-600',
      stampBorder: 'border-blue-800',
    },
  };

  const config = stampConfig[type];

  if (variant === 'stamp') {
    // Con dấu nhỏ ở góc (giống con dấu thật)
    return (
      <div className={`absolute top-3 right-3 z-30 ${className}`}>
        <div 
          className={`
            ${config.stampBg} 
            ${config.stampBorder}
            border-[3px] 
            rounded-full 
            px-3 py-1.5 
            ${config.rotation}
            shadow-[0_8px_16px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-1px_0_rgba(0,0,0,0.2)]
            transform
            hover:scale-110
            transition-transform
            backdrop-blur-sm
            relative
            overflow-hidden
          `}
        >
          {/* Texture effect like a real stamp */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.3)_1px,transparent_1px)] bg-[length:4px_4px]"></div>
          
          <div className="flex flex-col items-center justify-center relative z-10">
            {/* Outer decorative circle */}
            <div className="absolute inset-0 rounded-full border border-white/30"></div>
            
            {/* Text */}
            <span className={`${config.textColor} font-bold text-xs whitespace-nowrap relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]`}>
              {config.text}
            </span>
            
            {/* Decorative line like a real stamp */}
            <div className="w-10 h-[2px] bg-white/50 mt-0.5 rounded-full shadow-sm"></div>
          </div>
        </div>
      </div>
    );
  }

  // Overlay variant (full screen overlay)
  return (
    <div className={`absolute inset-0 ${config.bgColor} flex items-center justify-center ${className}`}>
      <span className={`${config.textColor} font-bold text-3xl border-4 ${config.borderColor} px-8 py-2 ${config.rotation} shadow-2xl`}>
        {config.text}
      </span>
    </div>
  );
};

