import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { RulesModal } from './components/RulesBanner';
import { OwnerDashboard } from './components/owner/OwnerDashboard';
import { AnalyticsView } from './components/owner/AnalyticsView';
import { MenuManager } from './components/owner/MenuManager';
import { UdharRegisterView } from './components/owner/UdharRegisterView';
import { StaffManagementView } from './components/owner/StaffManagementView';
import { EodCloseModal } from './components/owner/EodCloseModal';
import { OwnerPinModal } from './components/owner/OwnerPinModal';
import { OwnerEmailModal } from './components/owner/OwnerEmailModal';
import { CartDrawer } from './components/customer/CartDrawer';
import { WelcomeView } from './components/common/WelcomeView';
import { HOTEL_INFO } from './data/menuData';
import { Utensils } from 'lucide-react';

const MainContent = () => {
  const { lang, mode } = useApp();
  const [activeTab, setActiveTab] = useState('welcome'); // 'welcome', 'pos', 'kds', 'analytics', 'menu', 'udhar', 'staff'
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isEodModalOpen, setIsEodModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const effectiveTab = activeTab;

  return (
    <div className="min-h-screen flex flex-col justify-start bg-stone-950 text-stone-100">
      
      {/* Top Navigation & Staff Header (Hidden on Welcome Screen) */}
      {effectiveTab !== 'welcome' && (
        <Header
          activeTab={effectiveTab}
          setActiveTab={setActiveTab}
          onOpenRules={() => setIsRulesOpen(true)}
          onOpenEodModal={() => setIsEodModalOpen(true)}
          onOpenPinModal={() => setIsPinModalOpen(true)}
          onOpenEmailModal={() => setIsEmailModalOpen(true)}
          onOpenCart={() => setIsCartOpen(true)}
        />
      )}

      {/* Dynamic Restaurant Handling Workspace View */}
      <main className="animate-fade-in pb-4">
        {effectiveTab === 'welcome' && (
          <WelcomeView
            onEnterSystem={(tab) => setActiveTab(tab)}
            onOpenPinModal={() => setIsPinModalOpen(true)}
          />
        )}
        {effectiveTab === 'pos' && <OwnerDashboard initialTab="tables" />}
        {effectiveTab === 'waiter' && <OwnerDashboard initialTab="waiter" />}
        {effectiveTab === 'kds' && <OwnerDashboard initialTab="orders" />}
        {effectiveTab === 'analytics' && <AnalyticsView />}
        {effectiveTab === 'menu' && <MenuManager />}
        {effectiveTab === 'udhar' && <UdharRegisterView />}
        {effectiveTab === 'staff' && <StaffManagementView />}
      </main>

      {/* Restaurant Cart & Order Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />

      {/* Owner Email Manager Modal */}
      <OwnerEmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
      />

      {/* Secret Owner PIN Lock Vault Modal */}
      <OwnerPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
      />

      {/* EOD Closing Email Report Modal */}
      <EodCloseModal
        isOpen={isEodModalOpen}
        onClose={() => setIsEodModalOpen(false)}
      />

      {/* Rules Modal */}
      <RulesModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />

    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}

export default App;
