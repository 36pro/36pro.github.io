import { describe, it, expect } from 'vitest';
import {
  formatEarlierBillDuration,
  computeUtilityDetailStats,
  getCompanyForBill
} from '../../src/core/domain/utility-detail';
import { PaymentRecord } from '../../src/core/contracts/payment';

describe('Utility Detail Hub & Stats Calculations', () => {
  it('formats earlier bill duration correctly across cycles', () => {
    // 0 payments
    expect(formatEarlierBillDuration([])).toBe('-');

    // 1 payment
    const singlePayment: PaymentRecord[] = [
      {
        uid: '1',
        billId: 'rupnagarGas',
        billName: 'Rupnagar Gas',
        billType: 'prepaid',
        amount: '1000',
        payDate: '2026-06-01'
      }
    ];
    expect(formatEarlierBillDuration(singlePayment)).toBe('Current active recharge');

    // 2 payments: diff 25 days
    const twoPayments: PaymentRecord[] = [
      {
        uid: '2',
        billId: 'rupnagarGas',
        billName: 'Rupnagar Gas',
        billType: 'prepaid',
        amount: '1000',
        payDate: '2026-06-26'
      },
      {
        uid: '1',
        billId: 'rupnagarGas',
        billName: 'Rupnagar Gas',
        billType: 'prepaid',
        amount: '1000',
        payDate: '2026-06-01'
      }
    ];
    expect(formatEarlierBillDuration(twoPayments)).toBe('৳ 1,000 lasted 25 Days');

    // 2 payments: diff 45 days (1 Month 15 Days)
    const longCycle: PaymentRecord[] = [
      {
        uid: '2',
        billId: 'rupnagarGas',
        billName: 'Rupnagar Gas',
        billType: 'prepaid',
        amount: '1500',
        payDate: '2026-07-16'
      },
      {
        uid: '1',
        billId: 'rupnagarGas',
        billName: 'Rupnagar Gas',
        billType: 'prepaid',
        amount: '1500',
        payDate: '2026-06-01'
      }
    ];
    expect(formatEarlierBillDuration(longCycle)).toBe('৳ 1,500 lasted 1 Month 15 Days');
  });

  it('computes utility detail 4 key stats for prepaid utilities', () => {
    const payments: PaymentRecord[] = [
      {
        uid: 'p1',
        billId: 'rupnagarDesco',
        billName: 'Rupnagar DESCO',
        billType: 'prepaid',
        amount: '2000',
        amountNum: 2000,
        payDate: '2026-06-20'
      }
    ];

    const refDate = new Date('2026-06-25T00:00:00Z');
    const stats = computeUtilityDetailStats('rupnagarDesco', payments, { referenceDate: refDate });

    expect(stats.stat1.label).toBe('Days Since Payment');
    expect(stats.stat1.value).toBe('5 Days Ago');
    expect(stats.stat2.label).toBe('Last Amount');
    expect(stats.stat2.value).toBe('৳ 2,000');
    expect(stats.stat4.label).toBe('Earlier Bill Duration');
    expect(stats.stat4.value).toBe('Current active recharge');
  });

  it('computes utility detail stats for gym with paused state', () => {
    const statsActive = computeUtilityDetailStats('gym', [], { isGymPaused: false });
    expect(statsActive.stat1.value).toBe('Active ▶️');

    const statsPaused = computeUtilityDetailStats('gym', [], { isGymPaused: true });
    expect(statsPaused.stat1.value).toBe('Paused 🔒');
  });

  it('returns appropriate company names for all utilities', () => {
    expect(getCompanyForBill('rupnagarDesco')).toBe('DESCO');
    expect(getCompanyForBill('uttaraWater')).toBe('DWASA');
    expect(getCompanyForBill('matuailGas')).toBe('Gas Utility');
    expect(getCompanyForBill('noakhaliPalli')).toBe('Palli Bidyut');
    expect(getCompanyForBill('gym')).toBe('Fitness Center');
    expect(getCompanyForBill('inspireBroadband')).toBe('Inspire Broadband');
    expect(getCompanyForBill('landTax')).toBe('Land Revenue Board');
  });
});
