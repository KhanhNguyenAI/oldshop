import React from 'react';
import type { User } from '../../types/auth';

export type ProfileTab = 'profile' | 'banking' | 'address' | 'security' | 'orders';

interface ProfileSidebarProps {
  user: User | null;
  activeTab: ProfileTab;
  onChangeTab: (tab: ProfileTab) => void;
  onLogout: () => void;
}

export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
  user,
  activeTab,
  onChangeTab,
  onLogout,
}) => {
  return (
    <aside className="w-full md:w-64 flex-shrink-0">
      <div className="bg-white rounded-lg shadow-sm border border-amber-200 overflow-hidden sticky top-24">
        <div className="p-4 bg-amber-100 border-b border-amber-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center text-amber-800 font-bold text-lg overflow-hidden">
            {user?.profile?.avatar_url ? (
              <img src={user.profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span>{user?.email?.[0].toUpperCase() || 'U'}</span>
            )}
          </div>
          <div className="overflow-hidden">
            <p className="font-bold text-amber-900 truncate" title={user?.email}>
              {user?.email}
            </p>
            <p className="text-xs text-amber-700">{user?.profile?.full_name || 'メンバー'}</p>
          </div>
        </div>
        <nav className="p-2 space-y-1">
          {[
            { id: 'profile', label: 'プロフィール', icon: '👤' },
            { id: 'banking', label: '決済方法', icon: '💳' },
            { id: 'address', label: '住所', icon: '📍' },
            { id: 'security', label: 'パスワード変更', icon: '🔒' },
            { id: 'orders', label: '購入履歴', icon: '🛍️' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => onChangeTab(item.id as ProfileTab)}
              className={`w-full text-left px-4 py-3 rounded-md transition-all flex items-center gap-3 font-serif ${
                activeTab === item.id ? 'bg-amber-800 text-white shadow-md' : 'text-amber-900 hover:bg-amber-50'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}

          <div className="border-t border-amber-100 my-2 pt-2">
            <button
              onClick={onLogout}
              className="w-full text-left px-4 py-3 rounded-md text-red-700 hover:bg-red-50 transition-all flex items-center gap-3 font-serif"
            >
              <span>🚪</span>
              <span className="font-medium">ログアウト</span>
            </button>
          </div>
        </nav>
      </div>
    </aside>
  );
};


