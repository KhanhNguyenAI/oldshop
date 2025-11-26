import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';

export const ProfileInfoPanel: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    phone_number: '',
    avatar_url: '',
  });

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
          <p className="text-xs text-amber-700 mt-1">メールアドレスは変更できません。</p>
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
    </div>
  );
};


