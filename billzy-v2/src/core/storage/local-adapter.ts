import { PaymentRecord } from '../contracts/payment';
import { STORAGE_KEYS, DEFAULT_RATES } from '../contracts/storage';

class StorageAdapter {
  private memStore: Map<string, string> = new Map();

  private isAvailable(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  getItem(key: string): string | null {
    if (this.isAvailable()) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return this.memStore.get(key) || null;
      }
    }
    return this.memStore.get(key) || null;
  }

  setItem(key: string, value: string): void {
    if (this.isAvailable()) {
      try {
        window.localStorage.setItem(key, value);
        return;
      } catch {
        // Fallback to memory
      }
    }
    this.memStore.set(key, value);
  }

  removeItem(key: string): void {
    if (this.isAvailable()) {
      try {
        window.localStorage.removeItem(key);
        return;
      } catch {
        // Fallback to memory
      }
    }
    this.memStore.delete(key);
  }

  getPaymentsCache(): PaymentRecord[] {
    const raw = this.getItem(STORAGE_KEYS.FIRESTORE_CACHE);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  setPaymentsCache(payments: PaymentRecord[]): void {
    this.setItem(STORAGE_KEYS.FIRESTORE_CACHE, JSON.stringify(payments));
  }

  getLocalUnsyncedPayments(): PaymentRecord[] {
    const raw = this.getItem(STORAGE_KEYS.LOCAL_PAYMENTS);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  saveLocalPayment(record: PaymentRecord): void {
    const list = this.getLocalUnsyncedPayments();
    if (!list.some(item => item.uid === record.uid)) {
      list.push(record);
      this.setItem(STORAGE_KEYS.LOCAL_PAYMENTS, JSON.stringify(list));
    }
  }

  getMatuailRate(): number {
    const raw = this.getItem(STORAGE_KEYS.MATUAIL_RATE);
    return raw ? parseFloat(raw) || DEFAULT_RATES.MATUAIL_GAS : DEFAULT_RATES.MATUAIL_GAS;
  }

  setMatuailRate(rate: number): void {
    this.setItem(STORAGE_KEYS.MATUAIL_RATE, String(rate));
  }

  isGymPaused(): boolean {
    return this.getItem(STORAGE_KEYS.GYM_PAUSED) === 'true';
  }

  setGymPaused(paused: boolean): void {
    this.setItem(STORAGE_KEYS.GYM_PAUSED, paused ? 'true' : 'false');
  }

  getLandTaxRate(key: 'matuail' | 'uttarkhan' | 'keshurbag'): number {
    const storageKey =
      key === 'matuail'
        ? STORAGE_KEYS.LANDTAX_RATE_MATUAIL
        : key === 'uttarkhan'
        ? STORAGE_KEYS.LANDTAX_RATE_UTTARKHAN
        : STORAGE_KEYS.LANDTAX_RATE_KESHURBAG;
    const defaultRate =
      key === 'matuail'
        ? DEFAULT_RATES.LANDTAX_MATUAIL
        : key === 'uttarkhan'
        ? DEFAULT_RATES.LANDTAX_UTTARKHAN
        : DEFAULT_RATES.LANDTAX_KESHURBAG;
    const raw = this.getItem(storageKey);
    return raw ? parseFloat(raw) || defaultRate : defaultRate;
  }

  setLandTaxRate(key: 'matuail' | 'uttarkhan' | 'keshurbag', rate: number): void {
    const storageKey =
      key === 'matuail'
        ? STORAGE_KEYS.LANDTAX_RATE_MATUAIL
        : key === 'uttarkhan'
        ? STORAGE_KEYS.LANDTAX_RATE_UTTARKHAN
        : STORAGE_KEYS.LANDTAX_RATE_KESHURBAG;
    this.setItem(storageKey, String(rate));
  }
}

export const storageAdapter = new StorageAdapter();
