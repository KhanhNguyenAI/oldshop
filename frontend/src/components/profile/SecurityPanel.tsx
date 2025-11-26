import React, { useState } from 'react';
import { authService } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';

export const SecurityPanel: React.FC = () => {
  const { logout } = useAuth();
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setError('すべての情報を入力してください。');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('新しいパスワードと確認パスワードが一致しません。');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setError('新しいパスワードは8文字以上である必要があります。');
      return;
    }

    setIsLoading(true);

    try {
      await authService.changePassword({
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword,
      });

      setSuccess('パスワードが正常に変更されました。再度ログインするためにログアウトされます。');
      
      // Reset form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      // Logout after 2 seconds
      setTimeout(async () => {
        await logout();
      }, 2000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.current_password?.[0] 
        || err.response?.data?.new_password?.[0]
        || err.response?.data?.error
        || err.response?.data?.detail
        || 'パスワードの変更中にエラーが発生しました。もう一度お試しください。';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <h3 className="text-2xl font-serif font-bold text-amber-900 border-b-2 border-amber-200 pb-2">
        セキュリティ（パスワード変更）
      </h3>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      <form onSubmit={handlePasswordUpdate} className="max-w-lg space-y-4">
        <div>
          <label className="block text-sm font-bold text-amber-900 mb-1 font-serif">
            現在のパスワード
          </label>
          <input
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
            className="w-full p-2 bg-white border border-amber-300 rounded outline-none focus:border-amber-500"
            disabled={isLoading}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-amber-900 mb-1 font-serif">
            新しいパスワード
          </label>
          <input
            type="password"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            className="w-full p-2 bg-white border border-amber-300 rounded outline-none focus:border-amber-500"
            disabled={isLoading}
            required
            minLength={8}
          />
          <p className="text-xs text-amber-700 mt-1">
            パスワードは8文字以上で、大文字、小文字、数字を含む必要があります。
          </p>
        </div>
        <div>
          <label className="block text-sm font-bold text-amber-900 mb-1 font-serif">
            新しいパスワード（確認）
          </label>
          <input
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
            className="w-full p-2 bg-white border border-amber-300 rounded outline-none focus:border-amber-500"
            disabled={isLoading}
            required
            minLength={8}
          />
        </div>
        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-amber-800 text-white font-serif font-bold rounded shadow hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '処理中...' : 'パスワードを更新'}
          </button>
        </div>
      </form>
    </div>
  );
};


