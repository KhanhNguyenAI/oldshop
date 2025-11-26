import { useNavigate, Link } from 'react-router-dom';
import { RegisterForm } from '../components/RegisterForm';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from '../components/ui/Logo';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-100 via-orange-50 to-yellow-100 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Vintage paper texture overlay */}
      <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuOSIgbnVtT2N0YXZlcz0iNCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNub2lzZSkiIG9wYWNpdHk9IjAuNCIvPjwvc3ZnPg==')]"></div>
      
      {/* Logo Container - Separate from form */}
      <div className="relative z-10 mb-10">
        <Link to="/" className="inline-block">
          <Logo size="xl" />
        </Link>
      </div>

      <div className="max-w-md w-full space-y-6 relative z-10">
        {/* Header with vintage style */}
        <div className="text-center mb-2">
          <h2 className="text-3xl font-bold text-amber-900 font-serif border-b-4 border-amber-800 inline-block pb-2">
            新規登録
          </h2>
        </div>
        
        {/* Form container with vintage card style */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 py-8 px-8 shadow-[8px_8px_0px_0px_rgba(120,53,15,0.3)] border-4 border-amber-800 rounded-sm relative">
          {/* Corner decorations - Top Left */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t-4 border-l-4 border-amber-800"></div>
          {/* Corner decorations - Top Right */}
          <div className="absolute top-2 right-2 w-4 h-4 border-t-4 border-r-4 border-amber-800"></div>
          {/* Corner decorations - Bottom Left */}
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-4 border-l-4 border-amber-800"></div>
          {/* Corner decorations - Bottom Right */}
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-4 border-r-4 border-amber-800"></div>
          
          {/* Screw decorations */}
          <div className="absolute top-3 left-3 w-2 h-2 rounded-full bg-amber-900 opacity-40"></div>
          <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-amber-900 opacity-40"></div>
          <div className="absolute bottom-3 left-3 w-2 h-2 rounded-full bg-amber-900 opacity-40"></div>
          <div className="absolute bottom-3 right-3 w-2 h-2 rounded-full bg-amber-900 opacity-40"></div>
          
          <RegisterForm onSuccess={() => navigate('/')} />
          
          <div className="mt-6 text-center border-t-2 border-dashed border-amber-200 pt-4">
            <div className="bg-amber-100/50 rounded-sm py-2 border border-amber-200">
              <p className="text-sm text-amber-900 font-serif">
                すでにアカウントをお持ちの方は
              </p>
              <Link 
                to="/login" 
                className="text-amber-800 font-bold hover:text-amber-950 flex items-center justify-center gap-1 mt-1 group transition-colors"
              >
                <span>ログインはこちら</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Vintage footer */}
        <div className="text-center mt-8 opacity-70 hover:opacity-100 transition-opacity">
          <p className="text-xs text-amber-900 font-serif italic tracking-widest">
            EST. 2025 • 過去からの品質
          </p>
          <div className="w-16 h-0.5 bg-amber-800 mx-auto mt-2"></div>
        </div>
      </div>
    </div>
  );
};

