import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';
import { ResetPasswordForm } from '../components/ResetPasswordForm';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from '../components/ui/Logo';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [showResetPassword, setShowResetPassword] = useState(false);

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
            ログイン
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
          
          {!showResetPassword ? (
            <>
              <LoginForm onSuccess={() => navigate('/')} />
              <div className="mt-6 space-y-4 text-center border-t-2 border-dashed border-amber-200 pt-4">
                <div>
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(true)}
                    className="text-sm text-amber-700 hover:text-amber-900 flex items-center justify-center gap-2 mx-auto group transition-all mb-3"
                  >
                    <span className="group-hover:-translate-y-0.5 transition-transform">🔓</span> 
                    <span className="underline decoration-amber-300 hover:decoration-amber-600 underline-offset-2">パスワードをお忘れですか？</span>
                  </button>
                </div>
                
                <div className="bg-amber-100/50 rounded-sm py-2 border border-amber-200">
                  <p className="text-sm text-amber-900 font-serif">
                    アカウントをお持ちでない方は
                  </p>
                  <Link 
                    to="/register" 
                    className="text-amber-800 font-bold hover:text-amber-950 flex items-center justify-center gap-1 mt-1 group transition-colors"
                  >
                    <span>新規登録はこちら</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-6 relative">
                <h3 className="text-xl font-bold text-amber-900 font-serif inline-block relative z-10 bg-gradient-to-br from-amber-50 to-orange-50 px-4">
                  🔐 パスワードリセット
                </h3>
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-amber-200 -z-0"></div>
              </div>
              <ResetPasswordForm 
                onSuccess={() => {
                  setShowResetPassword(false);
                  navigate('/login');
                }}
                onCancel={() => setShowResetPassword(false)}
              />
            </>
          )}
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

