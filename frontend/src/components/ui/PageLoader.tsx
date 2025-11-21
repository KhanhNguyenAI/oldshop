import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

export const PageLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-amber-50 bg-opacity-90 backdrop-blur-sm">
      {/* Vintage paper texture overlay */}
      <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuOSIgbnVtT2N0YXZlcz0iNCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNub2lzZSkiIG9wYWNpdHk9IjAuNCIvPjwvc3ZnPg==')]"></div>
      
      {/* Content */}
      <div className="relative z-10 p-8 bg-white bg-opacity-80 rounded-sm border-4 border-amber-800 shadow-[8px_8px_0px_0px_rgba(120,53,15,0.3)]">
        {/* Corner decorations */}
        <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-amber-700"></div>
        <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-amber-700"></div>
        <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-amber-700"></div>
        <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-amber-700"></div>

        <LoadingSpinner size="lg" />
      </div>
    </div>
  );
};

