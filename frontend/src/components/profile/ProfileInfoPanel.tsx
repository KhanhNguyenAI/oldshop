import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';
import { authService } from '../../services/authService';

export const ProfileInfoPanel: React.FC = () => {
  const { user, refreshProfile, logout } = useAuth();
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    phone_number: '',
    avatar_url: '',
  });
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [emailUpdateStep, setEmailUpdateStep] = useState<'form' | 'otp'>('form');
  const [emailForm, setEmailForm] = useState({
    new_email: '',
    current_password: '',
    otp_code: '',
  });
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [isUpdatingEmailFinal, setIsUpdatingEmailFinal] = useState(false);

  const getDefaultAvatar = () => {
    const seed = user?.email?.split('@')[0] || 'guest';
    const encodedSeed = encodeURIComponent(seed);
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodedSeed}&backgroundColor=b6e3f4,c0aede,d1d4f9&backgroundType=gradientLinear&radius=50`;
  };

  useEffect(() => {
    if (user?.profile) {
      setProfileForm({
        full_name: user.profile.full_name || '',
        phone_number: user.profile.phone_number || '',
        avatar_url: user.profile.avatar_url || '',
      });
    } else if (user?.email) {
      setProfileForm((prev) => ({
        ...prev,
        avatar_url: getDefaultAvatar(),
      }));
    }
  }, [user]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('avatar', file);

      try {
        await userService.updateProfile(formData);
        await refreshProfile();
        alert('アバターが正常に更新されました。');
      } catch (error) {
        console.error(error);
        alert('アバターの更新に失敗しました。もう一度お試しください。');
      }
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('full_name', profileForm.full_name);
    formData.append('phone_number', profileForm.phone_number);

    try {
      await userService.updateProfile(formData);
      await refreshProfile();
      alert('プロフィールが正常に更新されました。');
    } catch (error) {
      console.error(error);
      alert('プロフィールの更新に失敗しました。');
    }
  };

  const handleStartEmailUpdate = () => {
    setIsUpdatingEmail(true);
    setEmailUpdateStep('form');
    setEmailForm({
      new_email: '',
      current_password: '',
      otp_code: '',
    });
    setEmailError(null);
    setEmailSuccess(null);
  };

  const handleCancelEmailUpdate = () => {
    setIsUpdatingEmail(false);
    setEmailUpdateStep('form');
    setEmailForm({
      new_email: '',
      current_password: '',
      otp_code: '',
    });
    setEmailError(null);
    setEmailSuccess(null);
  };

  const handleSendOTPForEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setEmailSuccess(null);

    if (!emailForm.new_email || !emailForm.current_password) {
      setEmailError('新しいメールアドレスと現在のパスワードを入力してください。');
      return;
    }

    if (emailForm.new_email.toLowerCase() === user?.email?.toLowerCase()) {
      setEmailError('新しいメールアドレスは現在のメールアドレスと異なる必要があります。');
      return;
    }

    setIsSendingOTP(true);

    try {
      await authService.sendOTPForEmailUpdate({ email: emailForm.new_email });
      setEmailUpdateStep('otp');
      setEmailSuccess('OTPが新しいメールアドレスに送信されました。');
    } catch (err: any) {
      const errorMessage = err.response?.data?.email?.[0] 
        || err.response?.data?.error
        || err.response?.data?.detail
        || 'OTPの送信に失敗しました。もう一度お試しください。';
      setEmailError(errorMessage);
    } finally {
      setIsSendingOTP(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setEmailSuccess(null);

    if (!emailForm.otp_code) {
      setEmailError('OTPコードを入力してください。');
      return;
    }

    if (emailForm.otp_code.length !== 6 || !/^\d+$/.test(emailForm.otp_code)) {
      setEmailError('OTPコードは6桁の数字である必要があります。');
      return;
    }

    setIsUpdatingEmailFinal(true);

    try {
      await authService.updateEmail({
        current_password: emailForm.current_password,
        new_email: emailForm.new_email,
        otp_code: emailForm.otp_code,
      });

      setEmailSuccess('メールアドレスが正常に更新されました。新しいメールアドレスで再度ログインしてください。');
      
      // Logout after 2 seconds
      setTimeout(async () => {
        await logout();
      }, 2000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.current_password?.[0]
        || err.response?.data?.otp_code?.[0]
        || err.response?.data?.new_email?.[0]
        || err.response?.data?.error
        || err.response?.data?.detail
        || 'メールアドレスの更新に失敗しました。もう一度お試しください。';
      setEmailError(errorMessage);
    } finally {
      setIsUpdatingEmailFinal(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <h3 className="text-2xl font-serif font-bold text-amber-900 border-b-2 border-amber-200 pb-2">
        プロフィール
      </h3>
      <form onSubmit={handleProfileUpdate} className="space-y-4 max-w-lg">
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative">
            <img
              src={profileForm.avatar_url || getDefaultAvatar()}
              alt="Avatar"
              className="w-20 h-20 rounded-full border-4 border-amber-200 object-cover"
            />
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              title="アバターを変更"
            />
          </div>
          <div>
            <p className="text-sm text-amber-900 font-bold font-serif">プロフィール写真を変更</p>
            <p className="text-xs text-amber-700">画像をクリックして新しい写真をアップロード</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-amber-900 mb-1 font-serif">メールアドレス</label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="w-full p-2 bg-amber-50 border border-amber-300 rounded text-gray-500 cursor-not-allowed"
          />
          <div className="mt-2">
            <button
              type="button"
              onClick={handleStartEmailUpdate}
              className="text-sm text-amber-800 hover:text-amber-900 font-serif font-bold underline"
            >
              メールアドレスを変更
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-amber-900 mb-1 font-serif">氏名</label>
          <input
            type="text"
            value={profileForm.full_name}
            onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
            className="w-full p-2 bg-white border border-amber-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
            placeholder="氏名を入力してください"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-amber-900 mb-1 font-serif">電話番号</label>
          <input
            type="tel"
            value={profileForm.phone_number}
            onChange={(e) => setProfileForm({ ...profileForm, phone_number: e.target.value })}
            className="w-full p-2 bg-white border border-amber-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
            placeholder="電話番号を入力してください"
          />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            className="px-6 py-2 bg-amber-800 text-white font-serif font-bold rounded shadow hover:bg-amber-700 transition-colors"
          >
            変更を保存
          </button>
        </div>
      </form>

      {/* Email Update Modal */}
      {isUpdatingEmail && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-fadeIn"
          onClick={handleCancelEmailUpdate}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-amber-600 to-amber-800 text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
              <h3 className="text-xl font-serif font-bold">
                {emailUpdateStep === 'form' ? 'メールアドレスを変更' : 'OTPコードを確認'}
              </h3>
              <button
                onClick={handleCancelEmailUpdate}
                disabled={isSendingOTP || isUpdatingEmailFinal}
                className="text-white hover:text-amber-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-2xl font-bold leading-none"
                aria-label="閉じる"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {emailUpdateStep === 'form' ? (
                <form onSubmit={handleSendOTPForEmailUpdate} className="space-y-4">
                  {emailError && (
                    <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded">
                      <p className="font-serif text-sm">{emailError}</p>
                    </div>
                  )}
                  {emailSuccess && (
                    <div className="bg-green-50 border-2 border-green-300 text-green-700 px-4 py-3 rounded">
                      <p className="font-serif text-sm">{emailSuccess}</p>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-bold text-amber-900 mb-2 font-serif">
                      現在のメールアドレス
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full p-3 bg-amber-50 border-2 border-amber-300 rounded text-gray-600 cursor-not-allowed font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-amber-900 mb-2 font-serif">
                      新しいメールアドレス
                    </label>
                    <input
                      type="email"
                      value={emailForm.new_email}
                      onChange={(e) => setEmailForm({ ...emailForm, new_email: e.target.value })}
                      className="w-full p-3 bg-white border-2 border-amber-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                      placeholder="新しいメールアドレスを入力"
                      required
                      disabled={isSendingOTP}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-amber-900 mb-2 font-serif">
                      現在のパスワード
                    </label>
                    <input
                      type="password"
                      value={emailForm.current_password}
                      onChange={(e) => setEmailForm({ ...emailForm, current_password: e.target.value })}
                      className="w-full p-3 bg-white border-2 border-amber-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                      placeholder="現在のパスワードを入力"
                      required
                      disabled={isSendingOTP}
                    />
                    <p className="text-xs text-amber-600 mt-1 font-serif">
                      セキュリティのため、現在のパスワードの確認が必要です。
                    </p>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      disabled={isSendingOTP}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-800 text-white font-serif font-bold rounded shadow-lg hover:from-amber-700 hover:to-amber-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
                    >
                      {isSendingOTP ? '送信中...' : 'OTPを送信'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEmailUpdate}
                      disabled={isSendingOTP}
                      className="px-6 py-3 bg-gray-200 text-gray-800 font-serif font-bold rounded shadow hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      キャンセル
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleUpdateEmail} className="space-y-4">
                  {emailError && (
                    <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded">
                      <p className="font-serif text-sm">{emailError}</p>
                    </div>
                  )}
                  {emailSuccess && (
                    <div className="bg-green-50 border-2 border-green-300 text-green-700 px-4 py-3 rounded">
                      <p className="font-serif text-sm">{emailSuccess}</p>
                    </div>
                  )}

                  <div className="bg-amber-50 border-2 border-amber-200 rounded p-4">
                    <p className="text-sm text-amber-800 font-serif mb-2">
                      <span className="font-bold">新しいメールアドレス:</span>
                    </p>
                    <p className="text-base font-mono text-amber-900 font-bold">{emailForm.new_email}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-amber-900 mb-2 font-serif">
                      OTPコード
                    </label>
                    <input
                      type="text"
                      value={emailForm.otp_code}
                      onChange={(e) => setEmailForm({ ...emailForm, otp_code: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                      className="w-full p-3 bg-white border-2 border-amber-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-center text-2xl font-mono tracking-widest"
                      placeholder="000000"
                      maxLength={6}
                      required
                      disabled={isUpdatingEmailFinal}
                    />
                    <p className="text-xs text-amber-600 mt-2 font-serif text-center">
                      新しいメールアドレスに送信された6桁のOTPコードを入力してください。
                    </p>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      disabled={isUpdatingEmailFinal}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-800 text-white font-serif font-bold rounded shadow-lg hover:from-amber-700 hover:to-amber-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
                    >
                      {isUpdatingEmailFinal ? '更新中...' : 'メールアドレスを更新'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEmailUpdateStep('form')}
                      disabled={isUpdatingEmailFinal}
                      className="px-6 py-3 bg-gray-200 text-gray-800 font-serif font-bold rounded shadow hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      戻る
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


