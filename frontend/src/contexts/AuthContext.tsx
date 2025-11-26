import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import type { AuthContextType, User } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

let refreshTimer: NodeJS.Timeout | null = null;

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Store access token in memory and window object for axios interceptor
  const setTokenInMemory = useCallback((token: string | null) => {
    setAccessToken(token);
    (window as any).__accessToken = token;
  }, []);

  // Auto refresh token before AT expires (AT: 5 minutes, refresh when < 1 minute left)
  const setupAutoRefresh = useCallback(() => {
    if (refreshTimer) {
      clearInterval(refreshTimer);
    }

    // Refresh every 4 minutes (240000 ms) - before AT expires at 5 min
    // This ensures we refresh when AT has < 1 minute left
    refreshTimer = setInterval(async () => {
      try {
        console.log('🔄 Frontend: Auto-refresh token (AT còn < 1 phút)...');
        const response = await authService.refreshToken();
        setTokenInMemory(response.access_token);
        console.log('✅ Frontend: Đã nhận AT mới');
      } catch (error) {
        console.error('❌ Frontend: Auto refresh failed:', error);
        // If refresh fails, clear everything
        setUser(null);
        setTokenInMemory(null);
        if (refreshTimer) {
          clearInterval(refreshTimer);
          refreshTimer = null;
        }
      }
    }, 4 * 60 * 1000); // 4 minutes (refresh before 5 min expiry)
  }, [setTokenInMemory]);

  // Check if user is authenticated on mount
  useEffect(() => {
    let isMounted = true;
    
    const checkAuth = async () => {
      // Don't check auth if we're on login/register pages
      const currentPath = location.pathname;
      if (currentPath === '/login' || currentPath === '/register') {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }
      
      try {
        // Try to refresh token to get new access token
        // This will fail silently if no refresh token exists
        const response = await authService.refreshToken();
        
        if (isMounted) {
          setTokenInMemory(response.access_token);
          
          // After getting token, get current user
          try {
            const currentUser = await authService.getCurrentUser();
            if (isMounted) {
              setUser(currentUser);
              setupAutoRefresh();
            }
          } catch (error) {
            // If get user fails, clear everything
            if (isMounted) {
              setUser(null);
              setTokenInMemory(null);
            }
          }
        }
      } catch (error) {
        // If refresh fails (no refresh token or expired), user is not authenticated
        // This is normal for users who haven't logged in yet - just silently fail
        if (isMounted) {
          setUser(null);
          setTokenInMemory(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkAuth();
    
    return () => {
      isMounted = false;
    };
  }, [setTokenInMemory, setupAutoRefresh]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (refreshTimer) {
        clearInterval(refreshTimer);
      }
    };
  }, []);

  const sendOTP = async (email: string): Promise<void> => {
    await authService.sendOTP({ email });
  };

  const verifyOTP = async (email: string, otpCode: string): Promise<void> => {
    await authService.verifyOTP({ email, otp_code: otpCode });
  };

  const register = async (email: string, password: string, otpCode: string): Promise<void> => {
    const response = await authService.register({ email, password, otp_code: otpCode });
    console.log('📝 Frontend: Đăng ký thành công | AT: 1 min | RT: 5 min');
    setUser(response.user);
    setTokenInMemory(response.access_token);
    setupAutoRefresh();
  };

  const login = async (email: string, password: string): Promise<void> => {
    const response = await authService.login({ email, password });
    console.log('🔑 Frontend: Đăng nhập thành công | AT: 1 min | RT: 5 min');
    setUser(response.user);
    setTokenInMemory(response.access_token);
    setupAutoRefresh();
  };

  const handleLogout = async (): Promise<void> => {
    try {
      await authService.logout();
      console.log('🚪 Frontend: Đăng xuất thành công');
    } catch (error) {
      console.error('❌ Frontend: Logout error:', error);
    } finally {
      setUser(null);
      setTokenInMemory(null);
      if (refreshTimer) {
        clearInterval(refreshTimer);
        refreshTimer = null;
      }
    }
  };

  const refreshToken = async (): Promise<void> => {
    const response = await authService.refreshToken();
    setTokenInMemory(response.access_token);
  };

  const refreshProfile = async (): Promise<void> => {
     try {
       const currentUser = await authService.getCurrentUser();
       setUser(currentUser);
     } catch (error) {
       console.error("Failed to refresh profile", error);
     }
  };

  const value: AuthContextType = {
    user,
    accessToken,
    isLoading,
    isAuthenticated: !!user && !!accessToken,
    login,
    register,
    logout: handleLogout,
    sendOTP,
    verifyOTP,
    refreshToken,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthProvider, useAuth };
