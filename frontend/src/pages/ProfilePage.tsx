import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import { ProfileSidebar, type ProfileTab } from '../components/profile/ProfileSidebar';
import { ProfileInfoPanel } from '../components/profile/ProfileInfoPanel';
import { BankingPanel } from '../components/profile/BankingPanel';
import { AddressPanel } from '../components/profile/AddressPanel';
import { SecurityPanel } from '../components/profile/SecurityPanel';
import { OrdersPanel } from '../components/profile/OrdersPanel';
import { ReturnsPanel } from '../components/profile/ReturnsPanel';
import CouponsPanel from '../components/profile/CouponsPanel';
import { BookingsPanel } from '../components/profile/BookingsPanel';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as ProfileTab | null;
  const [activeTab, setActiveTab] = useState<ProfileTab>(tabParam || 'profile');

  // Update activeTab when tab query parameter changes
  useEffect(() => {
    if (tabParam && ['profile', 'banking', 'address', 'security', 'orders', 'returns', 'coupons', 'bookings'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Update URL when activeTab changes (but don't override if coming from URL)
  const handleTabChange = (tab: ProfileTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

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
      case 'returns':
        return <ReturnsPanel />;
      case 'coupons':
        return <CouponsPanel />;
      case 'bookings':
        return <BookingsPanel />;
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
          <ProfileSidebar user={user} activeTab={activeTab} onChangeTab={handleTabChange} onLogout={logout} />

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
