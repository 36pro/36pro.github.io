import { PaymentRecord } from '../core/contracts/payment';
import { storageAdapter } from '../core/storage/local-adapter';
import { importPaymentsData, exportPaymentsData } from '../core/storage/migration';
import { parsePaymentRecord, calculateEntryFee } from '../core/domain/fee-splitting';
import { checkDuplicatePayment } from '../core/domain/duplicate';
import { BILL_DEFINITIONS } from '../core/contracts/utility';

export type AppTab = 'home' | 'dashboard' | 'database' | 'analytics';

export interface ToastMessage {
  id: string;
  message: string;
  type?: 'success' | 'warning' | 'error' | 'info';
}

type StateListener = () => void;

class AppStore {
  private payments: PaymentRecord[] = [];
  private activeTab: AppTab = 'home';
  private selectedBillId: string | null = null;
  private editingUid: string | null = null;
  private listeners: Set<StateListener> = new Set();
  private isLoaded = false;

  // Filters for database view
  searchQuery = '';
  billFilter = 'All Bills';
  typeFilter = 'All Types';
  monthFilter = '';

  // Toasts
  toasts: ToastMessage[] = [];

  constructor() {
    // Check URL hash on startup
    if (typeof window !== 'undefined') {
      this.syncFromHash();
      window.addEventListener('hashchange', () => this.syncFromHash());
    }
  }

  private syncFromHash(): void {
    const hash = window.location.hash.toLowerCase();
    if (hash === '#dashboard') this.activeTab = 'dashboard';
    else if (hash === '#database') this.activeTab = 'database';
    else if (hash === '#analytics' || hash === '#stats') this.activeTab = 'analytics';
    else if (hash.startsWith('#bill/')) {
      const parts = hash.split('/');
      if (parts[1]) {
        this.selectedBillId = parts[1];
      }
      this.activeTab = 'home';
    } else {
      this.activeTab = 'home';
    }
    this.notify();
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(): void {
    this.listeners.forEach(fn => fn());
  }

  setSearchQuery(q: string): void {
    this.searchQuery = q;
    this.notify();
  }

  setBillFilter(b: string): void {
    this.billFilter = b;
    this.notify();
  }

  setTypeFilter(t: string): void {
    this.typeFilter = t;
    this.notify();
  }

  setMonthFilter(m: string): void {
    this.monthFilter = m;
    this.notify();
  }

  async loadInitialData(): Promise<void> {
    if (this.isLoaded) return;

    // 1. Try localStorage cache first
    const cached = storageAdapter.getPaymentsCache();
    if (cached && cached.length > 0) {
      this.payments = cached;
      this.isLoaded = true;
      this.notify();
      return;
    }

    // 2. Fallback to data.json
    try {
      const res = await fetch('./data.json');
      if (res.ok) {
        const json = await res.json();
        const { validRecords } = importPaymentsData(json);
        this.payments = validRecords;
        storageAdapter.setPaymentsCache(validRecords);
      }
    } catch (e) {
      console.warn('Could not fetch data.json, starting with empty store:', e);
      this.payments = [];
    }

    // 3. Merge local unsynced payments
    const local = storageAdapter.getLocalUnsyncedPayments();
    local.forEach(lp => {
      if (!this.payments.some(p => p.uid === lp.uid)) {
        this.payments.unshift(lp);
      }
    });

    this.isLoaded = true;
    this.notify();
  }

  getPayments(): PaymentRecord[] {
    return this.payments;
  }

  getActiveTab(): AppTab {
    return this.activeTab;
  }

  setActiveTab(tab: AppTab): void {
    this.activeTab = tab;
    if (tab === 'home') window.location.hash = '#home';
    else if (tab === 'dashboard') window.location.hash = '#dashboard';
    else if (tab === 'database') window.location.hash = '#database';
    else if (tab === 'analytics') window.location.hash = '#analytics';
    this.notify();
  }

  getSelectedBillId(): string | null {
    return this.selectedBillId;
  }

  openBillModal(billId: string): void {
    this.selectedBillId = billId;
    window.location.hash = `#bill/${billId}`;
    this.notify();
  }

  closeBillModal(): void {
    this.selectedBillId = null;
    window.location.hash = `#${this.activeTab}`;
    this.notify();
  }

  getEditingUid(): string | null {
    return this.editingUid;
  }

  openEditModal(uid: string): void {
    this.editingUid = uid;
    this.notify();
  }

  closeEditModal(): void {
    this.editingUid = null;
    this.notify();
  }

  isGymPaused(): boolean {
    return storageAdapter.isGymPaused();
  }

  toggleGymPause(): void {
    const newStatus = !this.isGymPaused();
    storageAdapter.setGymPaused(newStatus);
    this.showToast(newStatus ? 'Gym subscription paused 🔒' : 'Gym subscription active ▶️');
    this.notify();
  }

  getMatuailRate(): number {
    return storageAdapter.getMatuailRate();
  }

  setMatuailRate(rate: number): void {
    storageAdapter.setMatuailRate(rate);
    this.notify();
  }

  showToast(message: string, type: ToastMessage['type'] = 'success'): void {
    const id = Math.random().toString(36).substring(2, 9);
    this.toasts.push({ id, message, type });
    this.notify();

    setTimeout(() => {
      this.toasts = this.toasts.filter(t => t.id !== id);
      this.notify();
    }, 4000);
  }

  addPayment(params: {
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
  }): { success: boolean; error?: string } {
    const cleanMonth = params.billMonth ? params.billMonth.trim() : '';

    // Check duplicate
    if (cleanMonth) {
      const dup = checkDuplicatePayment(
        this.payments,
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

    this.payments.unshift(newRecord);
    storageAdapter.saveLocalPayment(newRecord);
    storageAdapter.setPaymentsCache(this.payments);

    this.showToast(`Saved payment of ৳ ${total.toLocaleString()} for ${billName}`);
    this.closeBillModal();
    this.notify();
    return { success: true };
  }

  updatePayment(uid: string, updates: Partial<PaymentRecord>): { success: boolean; error?: string } {
    const index = this.payments.findIndex(p => p.uid === uid);
    if (index === -1) return { success: false, error: 'Record not found' };

    const existing = this.payments[index];
    const targetMonth = updates.billMonth !== undefined ? updates.billMonth.trim() : existing.billMonth || '';
    const targetProperty = updates.property !== undefined ? updates.property : existing.property;

    if (targetMonth) {
      const dup = checkDuplicatePayment(
        this.payments,
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

    const updated: PaymentRecord = {
      ...existing,
      ...updates,
      amount: String(baseAmount),
      amountNum: baseAmount,
      fee: fee > 0 ? String(fee) : '',
      feeNum: fee,
      totalPaid: total,
      billMonth: targetMonth
    };

    this.payments[index] = updated;
    storageAdapter.setPaymentsCache(this.payments);

    this.showToast('Payment record updated successfully');
    this.closeEditModal();
    this.notify();
    return { success: true };
  }

  deletePayment(uid: string): void {
    const record = this.payments.find(p => p.uid === uid);
    if (!record) return;

    if (confirm(`Are you sure you want to delete payment of ৳ ${record.amount} for ${record.billName}?`)) {
      this.payments = this.payments.filter(p => p.uid !== uid);
      storageAdapter.setPaymentsCache(this.payments);
      this.showToast('Payment record deleted');
      this.closeEditModal();
      this.notify();
    }
  }

  getFilteredPayments(): PaymentRecord[] {
    const sLower = this.searchQuery.toLowerCase();

    return this.payments.filter(p => {
      const pName = p.billName || '';
      const pMonth = p.billMonth || '';
      const pProp = p.property || '';
      const pDate = p.payDate || '';
      const pAmt = String(p.amount || '');
      const pType = (p.billType || 'prepaid').toLowerCase();

      const matchesSearch =
        !sLower ||
        pName.toLowerCase().includes(sLower) ||
        pProp.toLowerCase().includes(sLower) ||
        pDate.includes(sLower) ||
        pAmt.includes(sLower) ||
        pMonth.toLowerCase().includes(sLower);

      const matchesBill =
        this.billFilter === 'All Bills' ||
        pName.toLowerCase() === this.billFilter.toLowerCase() ||
        (pProp && (pProp === this.billFilter || pProp.includes(this.billFilter))) ||
        (this.billFilter === 'Land Tax' && p.billId === 'landTax');

      const matchesType =
        this.typeFilter === 'All Types' || pType === this.typeFilter.toLowerCase();

      const matchesMonth = !this.monthFilter || pDate.startsWith(this.monthFilter);

      return matchesSearch && matchesBill && matchesType && matchesMonth;
    });
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.billFilter = 'All Bills';
    this.typeFilter = 'All Types';
    this.monthFilter = '';
    this.notify();
  }
}

export const appStore = new AppStore();
