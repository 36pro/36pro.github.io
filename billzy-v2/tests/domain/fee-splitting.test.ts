import { describe, it, expect } from 'vitest';
import {
  parsePaymentRecord,
  isAutoSplitEligible,
  calculateEntryFee
} from '@/core/domain/fee-splitting';
import { PaymentRecord } from '@/core/contracts/payment';

describe('Surcharge & Fee Auto-Splitting Logic', () => {
  it('correctly identifies eligible vs non-eligible utilities', () => {
    expect(isAutoSplitEligible('rupnagarDesco')).toBe(true);
    expect(isAutoSplitEligible('uttaraDesco')).toBe(true);
    expect(isAutoSplitEligible('rupnagarGas')).toBe(true);

    expect(isAutoSplitEligible('inspireBroadband')).toBe(false);
    expect(isAutoSplitEligible('matuailGas')).toBe(false);
    expect(isAutoSplitEligible('uttaraWater')).toBe(false);
    expect(isAutoSplitEligible('noakhaliPalli')).toBe(false);
    expect(isAutoSplitEligible('gym')).toBe(false);
    expect(isAutoSplitEligible('landTax')).toBe(false);
  });

  it('auto-splits gateway fee strictly when fee is empty, amount > 100, and remainder <= 60 for eligible bills', () => {
    const descoPayment: PaymentRecord = {
      uid: 'mr-test-desco',
      billId: 'rupnagarDesco',
      billName: 'Rupnagar DESCO',
      billType: 'prepaid',
      amount: '1015',
      payDate: '2026-08-16'
    };

    const parsed = parsePaymentRecord(descoPayment);
    expect(parsed.baseAmount).toBe(1000);
    expect(parsed.feeNum).toBe(15);
    expect(parsed.fee).toBe('15');
    expect(parsed.total).toBe(1015);
    expect(parsed.hasFee).toBe(true);
  });

  it('does NOT auto-split if remainder > 60 even for eligible bills', () => {
    const largeRemainder: PaymentRecord = {
      uid: 'mr-test-large',
      billId: 'rupnagarDesco',
      billName: 'Rupnagar DESCO',
      billType: 'prepaid',
      amount: '1080',
      payDate: '2026-08-16'
    };

    const parsed = parsePaymentRecord(largeRemainder);
    expect(parsed.baseAmount).toBe(1080);
    expect(parsed.feeNum).toBe(0);
    expect(parsed.hasFee).toBe(false);
  });

  it('strictly preserves exact raw amount with 0 fee for non-eligible bills even if remainder <= 60', () => {
    const inspirePayment: PaymentRecord = {
      uid: 'mr-inspire',
      billId: 'inspireBroadband',
      billName: 'Inspire Broadband',
      billType: 'prepaid',
      billMonth: 'August 2026',
      amount: '840', // 840 % 100 = 40 (<= 60), but Inspire Broadband must NOT be split!
      payDate: '2026-08-01'
    };

    const parsed = parsePaymentRecord(inspirePayment);
    expect(parsed.baseAmount).toBe(840);
    expect(parsed.feeNum).toBe(0);
    expect(parsed.hasFee).toBe(false);
    expect(parsed.total).toBe(840);
  });

  it('respects manual fee input over auto-splitting', () => {
    const manualEntry = calculateEntryFee('rupnagarDesco', 1000, 25);
    expect(manualEntry.baseAmount).toBe(1000);
    expect(manualEntry.fee).toBe(25);
    expect(manualEntry.total).toBe(1025);
  });
});
