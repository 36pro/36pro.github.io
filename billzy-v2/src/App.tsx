import React from 'react';
import { HeroUIProvider } from '@heroui/react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { DatabaseView } from './components/DatabaseView';
import { AnalyticsView } from './components/AnalyticsView';
import { PaymentModal } from './components/PaymentModal';
import { EditModal } from './components/EditModal';
import { DescoModal } from './components/DescoModal';
import { ToastContainer } from './components/ToastContainer';

const MainContent: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-accent selection:text-accent-foreground w-full overflow-x-hidden">
      <Navbar />

      <main className="flex-1 w-full max-w-full overflow-x-hidden">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'database' && <DatabaseView />}
        {activeTab === 'analytics' && <AnalyticsView />}
      </main>

      <footer className="w-full border-t border-border/60 py-4 px-4 text-center text-xs text-muted font-medium bg-surface/50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>BILLZY • Dhaka Utility & Subscription Manager v2.0</span>
          <span className="font-mono-code text-[11px] text-muted/70">
            Engineered with HeroUI & Firebase Cloud
          </span>
        </div>
      </footer>

      {/* Global Modals & Notifications */}
      <PaymentModal />
      <EditModal />
      <DescoModal />
      <ToastContainer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <HeroUIProvider>
      <AppProvider>
        <MainContent />
      </AppProvider>
    </HeroUIProvider>
  );
};

export default App;
