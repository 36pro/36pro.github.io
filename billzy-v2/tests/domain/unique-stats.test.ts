import { describe, it, expect } from 'vitest';
import {
  get12RollingMonths,
  buildPrepaidCycles,
  computeForecastGauge,
  computeRateTrend,
  computeMonthlyTotal,
  computeBillLag,
  computeAmountVsDuration,
  UNIQUE_CHART_REGISTRY
} from '../../src/core/domain/unique-stats';
import { PaymentRecord } from '../../src/core/contracts/payment';

describe('Unique Utility Stats & Registry Engine', () => {
  const samplePayments: PaymentRecord[] = [
    {
      uid: 'u1',
      billId: 'rupnagarGas',
      billName: 'Rupnagar Gas',
      billType: 'prepaid',
      amount: '1000',
      payDate: '2026-05-01',
      billMonth: '2026-05'
    },
    {
      uid: 'u2',
      billId: 'rupnagarGas',
      billName: 'Rupnagar Gas',
      billType: 'prepaid',
      amount: '1000',
      payDate: '2026-05-25',
      billMonth: '2026-05'
    },
    {
      uid: 'u3',
      billId: 'rupnagarGas',
      billName: 'Rupnagar Gas',
      billType: 'prepaid',
      amount: '1000',
      payDate: '2026-06-20',
      billMonth: '2026-06'
    }
  ];

  it('generates 12 rolling months ending at reference date', () => {
    const refDate = new Date(2026, 9, 22); // Oct 2026
    const months = get12RollingMonths(refDate);
    expect(months.length).toBe(12);
    expect(months[months.length - 1].shortLabel).toBe("Oct '26");
    expect(months[0].shortLabel).toBe("Nov '25");
  });

  it('builds prepaid cycles with days until next and rate per 1000', () => {
    const cycles = buildPrepaidCycles(samplePayments);
    expect(cycles.length).toBe(3);

    // Cycle 1: 2026-05-01 to 2026-05-25 is 24 days. Amount 1000 => 24 days/1k
    expect(cycles[0].daysUntilNext).toBe(24);
    expect(cycles[0].daysPer1000).toBe(24);

    // Cycle 2: 2026-05-25 to 2026-06-20 is 26 days. Amount 1000 => 26 days/1k
    expect(cycles[1].daysUntilNext).toBe(26);
    expect(cycles[1].daysPer1000).toBe(26);

    // Cycle 3: last payment has no next payment
    expect(cycles[2].daysUntilNext).toBeNull();
    expect(cycles[2].daysPer1000).toBeNull();
  });

  it('computes forecast gauge with days left and estimated exhaustion date', () => {
    const refDate = new Date('2026-07-05T00:00:00Z');
    const gauge = computeForecastGauge(samplePayments, refDate);
    expect(gauge).not.toBeNull();
    if (gauge) {
      // Avg rate = (24 + 26) / 2 = 25 days/1k. Last amount = 1000 => 25 est cycle days.
      // From 2026-06-20 to 2026-07-05 is 15 days elapsed. 25 - 15 = 10 days left.
      expect(gauge.estCycleDays).toBe(25);
      expect(gauge.daysLeft).toBe(10);
      expect(gauge.pctElapsed).toBeCloseTo(15 / 25, 2);
    }
  });

  it('computes rate trend and regression slope status', () => {
    const refDate = new Date(2026, 9, 22);
    const trend = computeRateTrend(samplePayments, refDate);
    expect(trend.labels.length).toBe(12);
    // Cycle 1 = 24, Cycle 2 = 26 => slope is positive (improving)
    expect(trend.slopeStatus).toBe('improving');
  });

  it('computes monthly totals for timeline', () => {
    const refDate = new Date(2026, 9, 22);
    const totals = computeMonthlyTotal(samplePayments, refDate);
    expect(totals.labels.length).toBe(12);

    const mayIdx = totals.labels.findIndex(l => l.includes('May'));
    const junIdx = totals.labels.findIndex(l => l.includes('Jun'));
    expect(totals.values[mayIdx]).toBe(2000); // 2 payments of 1000
    expect(totals.values[junIdx]).toBe(1000); // 1 payment of 1000
  });

  it('computes bill lag for postpaid utilities', () => {
    const postpaidPayments: PaymentRecord[] = [
      {
        uid: 'w1',
        billId: 'uttaraWater',
        billName: 'Uttara Water',
        billType: 'postpaid',
        amount: '850',
        payDate: '2026-06-05',
        billMonth: '2026-05' // Last day of May is May 31. Paid June 5 = +5 days lag
      }
    ];

    const refDate = new Date(2026, 9, 22);
    const lagData = computeBillLag(postpaidPayments, refDate);
    const mayIdx = lagData.labels.findIndex(l => l.includes('May'));
    expect(lagData.lags[mayIdx]).toBe(5);
    expect(lagData.colors[mayIdx]).toBe('#fb7185'); // red/coral for positive lag
  });

  it('computes amount vs duration combo chart data', () => {
    const refDate = new Date(2026, 9, 22);
    const combo = computeAmountVsDuration(samplePayments, refDate);
    expect(combo.labels.length).toBe(12);
    const mayIdx = combo.labels.findIndex(l => l.includes('May'));
    expect(combo.amounts[mayIdx]).toBe(2000);
    expect(combo.durations[mayIdx]).toBe(50);
  });

  it('includes all 5 charts in UNIQUE_CHART_REGISTRY', () => {
    expect(UNIQUE_CHART_REGISTRY.length).toBe(5);
    const ids = UNIQUE_CHART_REGISTRY.map(c => c.id);
    expect(ids).toContain('forecastGauge');
    expect(ids).toContain('rateTrend');
    expect(ids).toContain('monthlyTotal');
    expect(ids).toContain('billLag');
    expect(ids).toContain('amountVsDuration');
  });
});
