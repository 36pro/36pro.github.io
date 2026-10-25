import React, { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Input,
  Button
} from '@heroui/react';
import {
  Sun,
  Moon,
  Bell,
  Plus,
  Check,
  Zap
} from 'lucide-react';
import { DashboardPage } from './views/DashboardPage';
import { OrdersPage } from './views/OrdersPage';
import { TrackerPage } from './views/TrackerPage';
import { AnalyticsPage } from './views/AnalyticsPage';
import { SettingsPage } from './views/SettingsPage';

export type AppTab = 'dashboard' | 'orders' | 'tracker' | 'analytics' | 'settings';

export const HollowHeroDashboard: React.FC = () => {
  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    return document.documentElement.classList.contains('dark');
  });

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  };

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');

  // Toast state
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Payment Modal State
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [modalUtility, setModalUtility] = useState<any>(null);

  const openPaymentModal = (utility?: any) => {
    setModalUtility(utility || {
      name: 'Rupnagar Smart Prepaid',
      account: 'Meter #3829104',
      amount: 2000,
      category: 'Electricity'
    });
    onOpen();
  };

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-accent selection:text-accent-foreground flex flex-col font-sans transition-colors duration-200">
      {/* 1. TOP NAVBAR (HERO UI GLASSMORPHISM & PILL STYLE) */}
      <nav className="sticky top-0 z-40 w-full bg-white/80 dark:bg-[#121826]/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 px-4 sm:px-8 py-2.5 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setActiveTab('dashboard')}
          >
            <div className="w-9 h-9 rounded-xl bg-accent text-accent-foreground font-black flex items-center justify-center text-lg font-logo shadow-sm ring-1 ring-accent/30">
              B
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-logo font-black tracking-tight text-lg text-slate-900 dark:text-white">
                  BILLZY
                </span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/15 text-accent-foreground ring-1 ring-accent/30">
                  v2.0
                </span>
              </div>
              <span className="text-[11px] text-slate-400 -mt-0.5 hidden sm:block">
                Dhaka Utility & Subscription HQ
              </span>
            </div>
          </div>

          {/* Center Navigation Pills */}
          <div className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/70 p-1 rounded-full border border-slate-200/60 dark:border-slate-700/60">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-accent text-accent-foreground font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Dashboard
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'orders'
                  ? 'bg-accent text-accent-foreground font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Bills & Invoices
            </button>

            <button
              onClick={() => setActiveTab('tracker')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'tracker'
                  ? 'bg-accent text-accent-foreground font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Live Tracker</span>
              <span className="bg-[#e6fbf2] text-[#00b46e] dark:bg-[#00b46e]/20 dark:text-[#34d399] text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                New
              </span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'analytics'
                  ? 'bg-accent text-accent-foreground font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Analytics
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'settings'
                  ? 'bg-accent text-accent-foreground font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Settings
            </button>
          </div>

          {/* Right Controls: Theme Switcher, Notifications, User Profile & Record Payment */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Toggle Theme"
            >
              {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} />}
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => triggerToast('Notification: 2 utility bills scheduled this week')}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 relative hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Notifications"
            >
              <Bell size={15} />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            </button>

            {/* User Profile Chip */}
            <div
              className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-slate-200 dark:border-slate-800 cursor-pointer"
              onClick={() => setActiveTab('settings')}
            >
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                alt="Kate Moore"
                className="w-8 h-8 rounded-full ring-2 ring-accent/30 object-cover"
              />
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  Kate Moore
                </span>
                <span className="text-[10px] text-slate-400 leading-tight">Admin</span>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              onClick={() => openPaymentModal()}
              className="bg-accent text-accent-foreground font-bold rounded-full px-4 py-1.5 shadow-sm hover:opacity-95 text-xs h-8 flex items-center gap-1.5 transition-all"
            >
              <Plus size={15} className="stroke-[3]" />
              <span className="hidden sm:inline">Record Payment</span>
              <span className="sm:hidden">Pay</span>
            </button>
          </div>
        </div>
      </nav>

      {/* 2. MAIN VIEW AREA */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
        {activeTab === 'dashboard' && (
          <DashboardPage
            onOpenPaymentModal={openPaymentModal}
            triggerToast={triggerToast}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersPage
            onOpenPaymentModal={() => openPaymentModal()}
            triggerToast={triggerToast}
          />
        )}

        {activeTab === 'tracker' && (
          <TrackerPage
            onOpenPaymentModal={openPaymentModal}
            triggerToast={triggerToast}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsPage triggerToast={triggerToast} />
        )}

        {activeTab === 'settings' && (
          <SettingsPage
            isDark={isDark}
            toggleTheme={toggleTheme}
            triggerToast={triggerToast}
          />
        )}

        {/* 3. HERO UI THEME INSPECTOR BAR (BOTTOM DOCK) */}
        <div className="heroui-card p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Accent:</span>
            <div className="w-5 h-5 rounded-full bg-accent ring-2 ring-accent/30" />
            <span className="font-mono text-[11px] text-slate-500">Electric Cyan</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Font:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
              Inter
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Radius:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
              Medium (0.5rem)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Cards:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
              Rounded-2xl (1.0rem)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Theme:</span>
            <button
              onClick={toggleTheme}
              className="px-3.5 py-1 rounded-full bg-accent text-accent-foreground font-bold shadow-xs hover:opacity-90 transition-opacity"
            >
              {isDark ? 'Dark Mode' : 'Light Mode'}
            </button>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="w-full border-t border-slate-200/60 dark:border-slate-800/60 py-4 px-4 text-center text-xs text-slate-400 font-medium bg-white/50 dark:bg-[#121826]/50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>BILLZY • Dhaka Utility & Subscription Manager v2.0</span>
          <span className="font-mono text-[11px]">
            Engineered with HeroUI Theme Variables
          </span>
        </div>
      </footer>

      {/* MODAL: PAYMENT / RECHARGE DIALOG */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        placement="center"
        backdrop="blur"
        classNames={{
          base: 'heroui-card border-none p-2'
        }}
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col gap-1 border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {modalUtility?.category === 'Electricity' ? 'Recharge Smart Prepaid Meter' : 'Record Bill Payment'}
                </h3>
                <p className="text-xs text-slate-400 font-normal">
                  {modalUtility?.name} • {modalUtility?.account}
                </p>
              </ModalHeader>
              <ModalBody className="py-4 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                    Amount (৳ BDT)
                  </label>
                  <Input
                    size="sm"
                    defaultValue={String(modalUtility?.amount || 2000)}
                    placeholder="Enter amount"
                    variant="bordered"
                    className="font-bold text-lg"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                    Payment Channel
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['bKash', 'Nagad', 'Card / Bank'].map((method, idx) => (
                      <button
                        key={method}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                          idx === 0
                            ? 'bg-accent/15 border-accent text-accent-foreground'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                    Transaction ID / Note
                  </label>
                  <Input
                    size="sm"
                    placeholder="e.g. TrxID #89281920 or Monthly Clearing"
                    variant="bordered"
                  />
                </div>
              </ModalBody>
              <ModalFooter className="border-t border-slate-100 dark:border-slate-800 pt-3">
                <Button size="sm" variant="flat" className="rounded-full" onClick={onClose}>
                  Cancel
                </Button>
                <button
                  className="bg-accent text-accent-foreground font-bold rounded-full px-5 py-2 text-xs shadow-sm hover:opacity-95"
                  onClick={() => {
                    onClose();
                    triggerToast(`Payment logged for ${modalUtility?.name}!`);
                  }}
                >
                  Confirm & Save
                </button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* TOAST NOTIFICATION PILL */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2.5 rounded-full shadow-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check size={14} className="text-accent stroke-[3]" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
};
