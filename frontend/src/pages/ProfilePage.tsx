import React, { useState } from 'react';
import { Header } from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import { ProfileSidebar, type ProfileTab } from '../components/profile/ProfileSidebar';
import { ProfileInfoPanel } from '../components/profile/ProfileInfoPanel';
import { BankingPanel } from '../components/profile/BankingPanel';
import { AddressPanel } from '../components/profile/AddressPanel';
import { SecurityPanel } from '../components/profile/SecurityPanel';
import { OrdersPanel } from '../components/profile/OrdersPanel';
import CouponsPanel from '../components/profile/CouponsPanel';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>('profile');

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileInfoPanel />;
      case 'banking':
        return <BankingPanel />;
      case 'address':
        return <AddressPanel />;
      case 'security':
        return <SecurityPanel />;
      case 'orders':
        return <OrdersPanel />;
      case 'coupons':
        return <CouponsPanel />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl md:text-4xl font-bold text-amber-900 mb-8 font-serif text-center md:text-left">
          アカウント設定
        </h1>

        <div className="flex flex-col md:flex-row gap-8">
          <ProfileSidebar user={user} activeTab={activeTab} onChangeTab={setActiveTab} onLogout={logout} />

          {/* Main Content Area */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm border border-amber-200 p-6 md:p-8 min-h-[500px]">
              {renderContent()}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
