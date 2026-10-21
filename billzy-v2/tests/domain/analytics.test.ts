import { describe, it, expect } from 'vitest';
import {
  computeComprehensiveAnalytics,
  getShortenedBillName,
  formatDaysWithMonths
} from '../../src/core/domain/analytics';
import { PaymentRecord } from '../../src/core/contracts/payment';

describe('Global Analytics & Surcharge Intelligence', () => {
  const samplePayments: PaymentRecord[] = [
    {
      uid: 'u1',
      billId: 'rupnagarDesco',
      billName: 'Rupnagar DESCO',
      billType: 'prepaid',
      amount: '2000',
      amountNum: 2000,
      fee: '35',
      feeNum: 35,
      payDate: '2026-06-10',
      billMonth: '2026-06'
    },
    {
      uid: 'u2',
      billId: 'rupnagarDesco',
      billName: 'Rupnagar DESCO',
      billType: 'prepaid',
      amount: '2000',
      amountNum: 2000,
      fee: '35',
      feeNum: 35,
      payDate: '2026-07-10',
      billMonth: '2026-07'
    },
    {
      uid: 'u3',
      billId: 'uttaraWater',
      billName: 'Uttara Water',
      billType: 'postpaid',
      amount: '850',
      amountNum: 850,
      fee: '15',
      feeNum: 15,
      payDate: '2026-08-15',
      billMonth: '2026-08'
    },
    {
      uid: 'u4',
      billId: 'rupnagarGas',
      billName: 'Rupnagar Gas',
      billType: 'prepaid',
      amount: '1080',
      amountNum: 1080,
      fee: '0',
      feeNum: 0,
      payDate: '2025-11-20',
      billMonth: '2025-11'
    }
  ];

  it('computes lifetime and YTD spend accurately', () => {
    const refDate = new Date(2026, 9, 22); // Oct 22, 2026
    const res = computeComprehensiveAnalytics(samplePayments, refDate);

    // Lifetime: 2035 + 2035 + 865 + 1080 = 6015
    expect(res.kpi.lifetimeSpend).toBe(6015);

    // YTD (2026): 2035 + 2035 + 865 = 4935
    expect(res.kpi.ytdSpend).toBe(4935);
    expect(res.kpi.ytdSubtext).toBe('Jan — Oct 2026');

    // Highest Bill: 2035 (Rupnagar DESCO)
    expect(res.kpi.highestBill).toBe(2035);
    expect(res.kpi.highestBillLabel).toBe('Rupnagar DESCO');
  });

  it('computes surcharge intelligence and allocation ratio', () => {
    const refDate = new Date(2026, 9, 22);
    const res = computeComprehensiveAnalytics(samplePayments, refDate);

    // Total base: 2000 + 2000 + 850 + 1080 = 5930
    expect(res.surcharges.totalBaseSpend).toBe(5930);

    // Total fees: 35 + 35 + 15 = 85
    expect(res.surcharges.totalSurcharges).toBe(85);

    // Fee rate: (85 / 5930) * 100 = ~1.43%
    expect(res.surcharges.feeRate).toBeCloseTo(1.43, 1);

    // Fee transactions count: 3 (p1, p2, p3 have fees; p4 has 0)
    expect(res.surcharges.feeTransactionsCount).toBe(3);
    expect(res.surcharges.avgFeePerTransaction).toBeCloseTo(85 / 3, 1);

    // Category breakdown
    expect(res.surcharges.elecFees).toBe(70); // 35 + 35
    expect(res.surcharges.otherFees).toBe(15); // Uttara Water
    expect(res.surcharges.gasFees).toBe(0);
  });

  it('formats shortened bill names for ranking charts', () => {
    expect(getShortenedBillName('Uttara DESCO')).toBe('U.DESCO');
    expect(getShortenedBillName('Rupnagar DESCO')).toBe('R.DESCO');
    expect(getShortenedBillName('Uttara Water')).toBe('U.WATER');
    expect(getShortenedBillName('Inspire Broadband')).toBe('INSPIRE.B');
    expect(getShortenedBillName('Gym')).toBe('GYM');
    expect(getShortenedBillName('Land Tax')).toBe('L.TAX');
  });

  it('formats days with months properly', () => {
    expect(formatDaysWithMonths(14.5)).toBe('14.5 days');
    expect(formatDaysWithMonths(30)).toBe('1M 0 days');
    expect(formatDaysWithMonths(45)).toBe('1M 15 days');
    expect(formatDaysWithMonths(60)).toBe('2M 0 days');
  });

  it('computes 4D radar sums across utility dimensions', () => {
    const refDate = new Date(2026, 9, 22);
    const res = computeComprehensiveAnalytics(samplePayments, refDate);

    expect(res.charts.radar4D.totals.electricity).toBe(4070); // 2035 + 2035
    expect(res.charts.radar4D.totals.water).toBe(865);
    expect(res.charts.radar4D.totals.gas).toBe(1080);
    expect(res.charts.radar4D.totals.internet).toBe(0);
  });

  it('computes rolling 12-month and YoY cumulative comparison datasets', () => {
    const refDate = new Date(2026, 9, 22);
    const res = computeComprehensiveAnalytics(samplePayments, refDate);

    expect(res.charts.monthly12.labels.length).toBe(12);
    expect(res.charts.yoyCumulative.labels.length).toBe(12);
    expect(res.charts.yoyCumulative.currentYear).toBe(2026);
    expect(res.charts.yoyCumulative.prevYear).toBe(2025);
  });
});
