import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { PaymentRecord, EnrichedPaymentRecord } from '../core/contracts/payment';
import { BILL_DEFINITIONS } from '../core/contracts/utility';
import { storageAdapter } from '../core/storage/local-adapter';
import { importPaymentsData } from '../core/storage/migration';
import { parsePaymentRecord, calculateEntryFee } from '../core/domain/fee-splitting';
import { checkDuplicatePayment } from '../core/domain/duplicate';
import {
  signInWithGoogle,
  logoutFirebase,
  subscribeToAuthState,
  subscribeToPayments,
  savePaymentToCloud,
  updatePaymentInCloud,
  deletePaymentFromCloud,
  updateUserCloudProfile
} from '../core/services/firebase';
import {
  fetchDESCOTelemetry,
  computeDescoMetrics,
  getCachedDescoTelemetry,
  DescoComputedMetrics
} from '../core/services/desco-api';

export type AppTab = 'dashboard' | 'database' | 'analytics';

export interface ToastItem {
  id: string;
  message: string;
  type?: 'success' | 'warning' | 'error' | 'info';
}

interface AppContextValue {
  payments: PaymentRecord[];
  enrichedPayments: EnrichedPaymentRecord[];
  user: User | null;
  authLoading: boolean;
  isCloudConnected: boolean;
  syncStatus: 'online' | 'offline' | 'syncing';
  recordCount: number;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  isGymPaused: boolean;
  toggleGymPause: () => Promise<void>;
  matuailRate: number;
  setMatuailRate: (rate: number) => void;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  addPayment: (params: {
    billId: string;
    amount: number;
    payDate: string;
    billMonth?: string;
    fee?: string | number;
    property?: string;
    receiptUrl?: string;
    receiptFileName?: string;
    receiptLocation?: string;
    note?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  updatePayment: (
    uid: string,
    updates: Partial<PaymentRecord>
  ) => Promise<{ success: boolean; error?: string }>;
  deletePayment: (uid: string) => Promise<{ success: boolean; error?: string }>;
  // Modals
  isPaymentModalOpen: boolean;
  openPaymentModal: (billId?: string) => void;
  closePaymentModal: () => void;
  selectedBillId: string | null;
  isEditModalOpen: boolean;
  editingRecord: PaymentRecord | null;
  openEditModal: (record: PaymentRecord) => void;
  closeEditModal: () => void;
  // Toasts
  toasts: ToastItem[];
  showToast: (message: string, type?: ToastItem['type']) => void;
  removeToast: (id: string) => void;
  // DESCO Live Telemetry
  descoMetrics: Record<string, import('../core/services/desco-api').DescoComputedMetrics | null>;
  descoLoading: Record<string, boolean>;
  refreshDescoTelemetry: (billId: string, accountNo: string) => Promise<void>;
  isDescoModalOpen: boolean;
  selectedDescoBillId: string | null;
  openDescoModal: (billId: string) => void;
  closeDescoModal: () => void;
  // Per-Utility Unique Stats
  isUniqueStatsOpen: boolean;
  selectedUniqueStatsBillId: string | null;
  openUniqueStats: (billId: string) => void;
  closeUniqueStats: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'online' | 'offline' | 'syncing'>('offline');
  const [activeTab, setActiveTabState] = useState<AppTab>('dashboard');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isGymPaused, setIsGymPausedState] = useState(false);
  const [matuailRate, setMatuailRateState] = useState(1080);

  // Modals state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PaymentRecord | null>(null);

  // DESCO Telemetry state
  const [descoMetrics, setDescoMetrics] = useState<Record<string, DescoComputedMetrics | null>>({});
  const [descoLoading, setDescoLoading] = useState<Record<string, boolean>>({});
  const [isDescoModalOpen, setIsDescoModalOpen] = useState(false);
  const [selectedDescoBillId, setSelectedDescoBillId] = useState<string | null>(null);

  const openDescoModal = useCallback((billId: string) => {
    setSelectedDescoBillId(billId);
    setIsDescoModalOpen(true);
    window.location.hash = `#desco-analytics/${billId}`;
  }, []);

  const closeDescoModal = useCallback(() => {
    setIsDescoModalOpen(false);
    setSelectedDescoBillId(null);
    if (window.location.hash.startsWith('#desco-analytics')) {
      window.location.hash = '#dashboard';
    }
  }, []);

  // Per-Utility Unique Stats state
  const [isUniqueStatsOpen, setIsUniqueStatsOpen] = useState(false);
  const [selectedUniqueStatsBillId, setSelectedUniqueStatsBillId] = useState<string | null>(null);

  const openUniqueStats = useCallback((billId: string) => {
    setSelectedUniqueStatsBillId(billId);
    setIsUniqueStatsOpen(true);
    window.location.hash = `#unique-stats/${billId}`;
  }, []);

  const closeUniqueStats = useCallback(() => {
    setIsUniqueStatsOpen(false);
    setSelectedUniqueStatsBillId(null);
    if (window.location.hash.startsWith('#unique-stats')) {
      window.location.hash = '#dashboard';
    }
  }, []);

  const refreshDescoTelemetry = useCallback(async (billId: string, accountNo: string) => {
    setDescoLoading(prev => ({ ...prev, [billId]: true }));
    try {
      const data = await fetchDESCOTelemetry(accountNo);
      const metrics = computeDescoMetrics(data);
      setDescoMetrics(prev => ({ ...prev, [billId]: metrics }));
    } catch (err) {
      console.warn(`Could not refresh DESCO telemetry for ${billId}:`, err);
      const cached = getCachedDescoTelemetry(accountNo);
      if (cached) {
        setDescoMetrics(prev => ({ ...prev, [billId]: computeDescoMetrics(cached) }));
      }
    } finally {
      setDescoLoading(prev => ({ ...prev, [billId]: false }));
    }
  }, []);

  // Initialize DESCO accounts on mount
  useEffect(() => {
    const accounts: Record<string, string> = {
      rupnagarDesco: '140-10-368',
      uttaraDesco: '250-38-654'
    };

    Object.entries(accounts).forEach(([bId, acc]) => {
      const cached = getCachedDescoTelemetry(acc);
      if (cached) {
        try {
          const metrics = computeDescoMetrics(cached);
          setDescoMetrics(prev => ({ ...prev, [bId]: metrics }));
        } catch {
          // Ignore cache parse error
        }
      }
      refreshDescoTelemetry(bId, acc);
    });
  }, [refreshDescoTelemetry]);

  // Toasts
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastItem['type'] = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Sync tab with URL hash
  const setActiveTab = useCallback((tab: AppTab) => {
    setActiveTabState(tab);
    window.location.hash = `#${tab}`;
  }, []);

  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('billzy_theme') as 'dark' | 'light' | null;
    const initialTheme = savedTheme || 'dark';
    setTheme(initialTheme);
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }

    // Load initial settings
    setIsGymPausedState(storageAdapter.isGymPaused());
    setMatuailRateState(storageAdapter.getMatuailRate());

    // Listen to hash changes
    const handleHash = () => {
      const rawHash = window.location.hash;
      const h = rawHash.toLowerCase();

      if (h.startsWith('#unique-stats/')) {
        const parts = rawHash.split('/');
        if (parts.length >= 2 && parts[1]) {
          setSelectedUniqueStatsBillId(parts[1]);
          setIsUniqueStatsOpen(true);
        }
      } else if (h.startsWith('#desco-analytics/')) {
        const parts = rawHash.split('/');
        if (parts.length >= 2 && parts[1]) {
          setSelectedDescoBillId(parts[1]);
          setIsDescoModalOpen(true);
        }
      } else if (h === '#database') {
        setActiveTabState('database');
      } else if (h === '#analytics' || h === '#stats') {
        setActiveTabState('analytics');
      } else {
        setActiveTabState('dashboard');
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('billzy_theme', next);
      if (next === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
      }
      return next;
    });
  }, []);

  // Offline bootstrap fallback
  const loadFallbackData = useCallback(async () => {
    const cached = storageAdapter.getPaymentsCache();
    if (cached && cached.length > 0) {
      setPayments(cached);
      return;
    }

    try {
      const res = await fetch('./data.json');
      if (res.ok) {
        const json = await res.json();
        const { validRecords } = importPaymentsData(json);
        if (validRecords.length > 0) {
          setPayments(validRecords);
          storageAdapter.setPaymentsCache(validRecords);
        }
      }
    } catch (e) {
      console.warn('Fallback data.json fetch error:', e);
    }
  }, []);

  // Firebase Auth & Firestore Real-Time Listener
  useEffect(() => {
    // 1. Load initial cache right away for zero latency
    loadFallbackData();

    // 2. Auth state observer
    let unsubscribeFirestore: (() => void) | null = null;

    const unsubscribeAuth = subscribeToAuthState(currentUser => {
      setUser(currentUser);
      setAuthLoading(false);

      if (currentUser) {
        setSyncStatus('syncing');
        // Subscribe to Firestore payments
        if (unsubscribeFirestore) unsubscribeFirestore();
        unsubscribeFirestore = subscribeToPayments(
          currentUser.uid,
          cloudRecords => {
            if (cloudRecords && cloudRecords.length > 0) {
              setPayments(cloudRecords);
              storageAdapter.setPaymentsCache(cloudRecords);
            } else {
              // Cloud is empty for this user, fallback to local and cache
              loadFallbackData();
            }
            setIsCloudConnected(true);
            setSyncStatus('online');
          },
          err => {
            console.warn('Firestore sync failed, operating with local offline cache:', err);
            setIsCloudConnected(false);
            setSyncStatus('offline');
            loadFallbackData();
          }
        );
      } else {
        if (unsubscribeFirestore) {
          unsubscribeFirestore();
          unsubscribeFirestore = null;
        }
        setIsCloudConnected(false);
        setSyncStatus('offline');
        loadFallbackData();
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, [loadFallbackData]);

  const loginWithGoogle = useCallback(async () => {
    try {
      const loggedUser = await signInWithGoogle();
      showToast(`Welcome back, ${loggedUser.displayName || 'Friend'}!`, 'success');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      showToast(`Google Sign-In failed: ${msg}`, 'error');
    }
  }, [showToast]);

  const logout = useCallback(async () => {
    try {
      await logoutFirebase();
      showToast('Signed out of Firebase Cloud.', 'info');
    } catch (e) {
      console.error('Logout error:', e);
    }
  }, [showToast]);

  const toggleGymPause = useCallback(async () => {
    const nextVal = !isGymPaused;
    setIsGymPausedState(nextVal);
    storageAdapter.setGymPaused(nextVal);
    if (user) {
      await updateUserCloudProfile(user.uid, { gymPaused: nextVal });
    }
    showToast(nextVal ? 'Gym subscription paused 🔒' : 'Gym subscription resumed ▶️', 'info');
  }, [isGymPaused, user, showToast]);

  const setMatuailRate = useCallback((rate: number) => {
    setMatuailRateState(rate);
    storageAdapter.setMatuailRate(rate);
  }, []);

  const openPaymentModal = useCallback((billId?: string) => {
    setSelectedBillId(billId || null);
    setIsPaymentModalOpen(true);
  }, []);

  const closePaymentModal = useCallback(() => {
    setIsPaymentModalOpen(false);
    setSelectedBillId(null);
  }, []);

  const openEditModal = useCallback((record: PaymentRecord) => {
    setEditingRecord(record);
    setIsEditModalOpen(true);
  }, []);

  const closeEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingRecord(null);
  }, []);

  const addPayment = useCallback(
    async (params: {
      billId: string;
      amount: number;
      payDate: string;
      billMonth?: string;
      fee?: string | number;
      property?: string;
      receiptUrl?: string;
      receiptFileName?: string;
      receiptLocation?: string;
      note?: string;
    }): Promise<{ success: boolean; error?: string }> => {
      const cleanMonth = params.billMonth ? params.billMonth.trim() : '';

      // Check duplicate
      if (cleanMonth) {
        const dup = checkDuplicatePayment(
          payments,
          params.billId,
          cleanMonth,
          { property: params.property }
        );
        if (dup) {
          return { success: false, error: dup.message };
        }
      }

      const { baseAmount, fee, total } = calculateEntryFee(
        params.billId,
        params.amount,
        params.fee
      );

      const billDef = BILL_DEFINITIONS[params.billId as keyof typeof BILL_DEFINITIONS];
      const billName = billDef ? billDef.name : params.billId;
      const billType = billDef ? billDef.type : 'prepaid';
      const utilityCategory = billDef ? billDef.utility : 'electric';

      const newRecord: PaymentRecord = {
        uid: 'mr' + Math.random().toString(36).substring(2, 12),
        billId: params.billId,
        billName,
        billType,
        utilityCategory,
        billMonth: cleanMonth,
        amount: String(baseAmount),
        amountNum: baseAmount,
        fee: fee > 0 ? String(fee) : '',
        feeNum: fee,
        totalPaid: total,
        payDate: params.payDate,
        savedAt: new Date().toISOString(),
        timestamp: new Date(params.payDate).getTime() || Date.now(),
        property: params.property || '',
        receiptUrl: params.receiptUrl || '',
        receiptFileName: params.receiptFileName || '',
        receiptLocation: params.receiptLocation || '',
        note: params.note || (params.property ? params.property : '')
      };

      const nextPayments = [newRecord, ...payments];
      setPayments(nextPayments);
      storageAdapter.saveLocalPayment(newRecord);
      storageAdapter.setPaymentsCache(nextPayments);

      if (user && isCloudConnected) {
        try {
          await savePaymentToCloud(user.uid, newRecord);
        } catch (err) {
          console.warn('Failed to sync payment to cloud, saved locally:', err);
        }
      }

      showToast(`Saved ৳ ${total.toLocaleString()} for ${billName}!`, 'success');
      closePaymentModal();
      return { success: true };
    },
    [payments, user, isCloudConnected, closePaymentModal, showToast]
  );

  const updatePayment = useCallback(
    async (
      uid: string,
      updates: Partial<PaymentRecord>
    ): Promise<{ success: boolean; error?: string }> => {
      const index = payments.findIndex(p => p.uid === uid);
      if (index === -1) return { success: false, error: 'Record not found' };

      const existing = payments[index];
      const targetMonth = updates.billMonth !== undefined ? updates.billMonth.trim() : existing.billMonth || '';
      const targetProperty = updates.property !== undefined ? updates.property : existing.property;

      if (targetMonth) {
        const dup = checkDuplicatePayment(
          payments,
          existing.billId,
          targetMonth,
          { property: targetProperty },
          uid
        );
        if (dup) {
          return { success: false, error: dup.message };
        }
      }

      const rawAmt = updates.amount !== undefined ? parseFloat(updates.amount) : parseFloat(existing.amount);
      const manualFee = updates.fee !== undefined ? updates.fee : existing.fee;
      const { baseAmount, fee, total } = calculateEntryFee(existing.billId, rawAmt, manualFee);

      const updatedRecord: PaymentRecord = {
        ...existing,
        ...updates,
        amount: String(baseAmount),
        amountNum: baseAmount,
        fee: fee > 0 ? String(fee) : '',
        feeNum: fee,
        totalPaid: total,
        billMonth: targetMonth
      };

      const nextPayments = [...payments];
      nextPayments[index] = updatedRecord;
      setPayments(nextPayments);
      storageAdapter.setPaymentsCache(nextPayments);

      if (user && isCloudConnected) {
        try {
          await updatePaymentInCloud(user.uid, updatedRecord);
        } catch (err) {
          console.warn('Failed to update record in cloud, updated locally:', err);
        }
      }

      showToast('Payment record updated successfully.', 'success');
      closeEditModal();
      return { success: true };
    },
    [payments, user, isCloudConnected, closeEditModal, showToast]
  );

  const deletePayment = useCallback(
    async (uid: string): Promise<{ success: boolean; error?: string }> => {
      const nextPayments = payments.filter(p => p.uid !== uid);
      setPayments(nextPayments);
      storageAdapter.setPaymentsCache(nextPayments);

      if (user && isCloudConnected) {
        try {
          await deletePaymentFromCloud(user.uid, uid);
        } catch (err) {
          console.warn('Failed to delete payment from cloud, deleted locally:', err);
        }
      }

      showToast('Payment record deleted.', 'info');
      closeEditModal();
      return { success: true };
    },
    [payments, user, isCloudConnected, closeEditModal, showToast]
  );

  // Compute enriched records
  const enrichedPayments = payments.map(parsePaymentRecord);

  const value: AppContextValue = {
    payments,
    enrichedPayments,
    user,
    authLoading,
    isCloudConnected,
    syncStatus,
    recordCount: payments.length,
    theme,
    toggleTheme,
    activeTab,
    setActiveTab,
    isGymPaused,
    toggleGymPause,
    matuailRate,
    setMatuailRate,
    loginWithGoogle,
    logout,
    addPayment,
    updatePayment,
    deletePayment,
    isPaymentModalOpen,
    openPaymentModal,
    closePaymentModal,
    selectedBillId,
    isEditModalOpen,
    editingRecord,
    openEditModal,
    closeEditModal,
    toasts,
    showToast,
    removeToast,
    descoMetrics,
    descoLoading,
    refreshDescoTelemetry,
    isDescoModalOpen,
    selectedDescoBillId,
    openDescoModal,
    closeDescoModal,
    isUniqueStatsOpen,
    selectedUniqueStatsBillId,
    openUniqueStats,
    closeUniqueStats
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
