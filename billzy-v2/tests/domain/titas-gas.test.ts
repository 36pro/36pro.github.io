import { describe, it, expect } from 'vitest';
import {
  calculateTitasGasDue,
  getMatuailGasDueInfo,
  formatOverdueMonths
} from '@/core/domain/titas-gas';
import { PaymentRecord } from '@/core/contracts/payment';

describe('Titas Gas Tiered Late Fee & Matuail Gas Calculations', () => {
  it('charges 0 BDT fee when paid on or before the 21st of the billing month', () => {
    // January 2026 bill paid on Jan 20, 2026
    const from = new Date(2026, 0, 1);
    const to = new Date(2026, 0, 1);
    const payDate = new Date(2026, 0, 20, 12, 0, 0);

    const due = calculateTitasGasDue(from, to, payDate);
    expect(due.monthCount).toBe(1);
    expect(due.overdueCount).toBe(0);
    expect(due.totalFee).toBe(0);
  });

  it('charges 10 BDT tier when overdue <= 6 months past due deadline (21st)', () => {
    // January 2026 bill due Jan 21, paid on March 15 (less than 6 months overdue)
    const from = new Date(2026, 0, 1);
    const to = new Date(2026, 0, 1);
    const payDate = new Date(2026, 2, 15, 12, 0, 0);

    const due = calculateTitasGasDue(from, to, payDate);
    expect(due.monthCount).toBe(1);
    expect(due.overdueCount).toBe(1);
    expect(due.billsAt10).toBe(1);
    expect(due.billsAt20).toBe(0);
    expect(due.totalFee).toBe(10);
  });

  it('charges 20 BDT tier when overdue > 6 months past due deadline (21st)', () => {
    // January 2026 bill due Jan 21, paid on August 25 (over 6 months past Jan 21)
    const from = new Date(2026, 0, 1);
    const to = new Date(2026, 0, 1);
    const payDate = new Date(2026, 7, 25, 12, 0, 0);

    const due = calculateTitasGasDue(from, to, payDate);
    expect(due.monthCount).toBe(1);
    expect(due.overdueCount).toBe(1);
    expect(due.billsAt10).toBe(0);
    expect(due.billsAt20).toBe(1);
    expect(due.totalFee).toBe(20);
  });

  it('correctly calculates mixed tiers across multi-month ranges', () => {
    // Range: Jan 2026 to Mar 2026 (3 months). Paid on August 25, 2026.
    // Jan 2026 due Jan 21 -> 6 months past is July 21 -> on Aug 25 is > 6 months -> 20 Tk
    // Feb 2026 due Feb 21 -> 6 months past is Aug 21 -> on Aug 25 is > 6 months -> 20 Tk
    // Mar 2026 due Mar 21 -> 6 months past is Sep 21 -> on Aug 25 is <= 6 months -> 10 Tk
    // Total fee = 20 + 20 + 10 = 50 Tk
    const from = new Date(2026, 0, 1);
    const to = new Date(2026, 2, 1);
    const payDate = new Date(2026, 7, 25, 12, 0, 0);

    const due = calculateTitasGasDue(from, to, payDate);
    expect(due.monthCount).toBe(3);
    expect(due.overdueCount).toBe(3);
    expect(due.billsAt20).toBe(2);
    expect(due.billsAt10).toBe(1);
    expect(due.totalFee).toBe(50);
  });

  it('formats overdue duration exclusively in fractional months for Matuail Gas', () => {
    expect(formatOverdueMonths(35)).toBe('1.1 months');
    expect(formatOverdueMonths(61)).toBe('2 months');
    expect(formatOverdueMonths(0)).toBe('0 months');
  });

  it('formats dual-unit status string correctly without currency symbol', () => {
    const mockPayment: PaymentRecord = {
      uid: 'mr-test-1',
      billId: 'matuailGas',
      billName: 'Matuail Gas',
      billType: 'postpaid',
      billMonth: 'December 2025',
      amount: '1080',
      payDate: '2026-01-05'
    };

    // Reference date: July 15, 2026 (over 6 months since next unpaid Jan 2026)
    const refDate = new Date(2026, 6, 15);
    const info = getMatuailGasDueInfo(mockPayment, 1080, refDate);

    expect(info.paidTill).toBe("Paid till Dec '25");
    expect(info.billedMonths).toBeGreaterThan(0);
    // Verifies the dual-unit format: e.g. "7,620 (6.5 M +60)"
    expect(info.dueText).toMatch(/^\d[\d,]* \(\d+(\.\d+)? M( \+\d+)?\)$/);
  });
});
