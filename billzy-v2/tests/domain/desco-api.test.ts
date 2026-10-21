import { describe, it, expect } from 'vitest';
import {
  computeDescoMetrics,
  calculateLtaTariff,
  DescoFullTelemetry
} from '@/core/services/desco-api';

describe('DESCO API Telemetry & Intelligence Calculations', () => {
  const mockTelemetry: DescoFullTelemetry = {
    accountNo: '14010368',
    cachedAt: Date.now(),
    balance: {
      accountNo: '14010368',
      balance: 1500,
      currentMonthConsumption: 120.5,
      readingTime: '2026-10-21 14:30:00',
      meterNo: '140-10-368'
    },
    monthly: [
      {
        month: '2025-08',
        consumedUnit: 250,
        consumedTaka: 2100,
        sanctionLoad: 2,
        tariffSolution: 'LT-A',
        customerName: 'MD. MEHEDI HASAN'
      },
      {
        month: '2026-08',
        consumedUnit: 260,
        consumedTaka: 2200,
        sanctionLoad: 2,
        tariffSolution: 'LT-A',
        customerName: 'MD. MEHEDI HASAN'
      }
    ],
    daily: [
      { date: '2026-10-18', consumedUnit: 100 },
      { date: '2026-10-19', consumedUnit: 110 },
      { date: '2026-10-20', consumedUnit: 122 }
    ],
    recharge: [
      {
        rechargeDate: '2026-10-15 10:00:00',
        totalAmount: 1000,
        energyAmount: 850,
        VAT: 50,
        tokenNo: '1234-5678-9012-3456-7890'
      }
    ]
  };

  it('computes daily difference units correctly from meter reads', () => {
    const metrics = computeDescoMetrics(mockTelemetry);
    expect(metrics.dailyUsage15.length).toBe(2);
    expect(metrics.dailyUsage15[0].units).toBe(10); // 110 - 100
    expect(metrics.dailyUsage15[1].units).toBe(12); // 122 - 110
  });

  it('computes days remaining and exhaustion date using seasonal telemetry', () => {
    const metrics = computeDescoMetrics(mockTelemetry);
    expect(metrics.balance).toBe(1500);
    expect(metrics.daysRemaining).toBeGreaterThan(0);
    expect(metrics.exhaustionDate).toBeInstanceOf(Date);
    expect(metrics.exhaustionDateStr).toBeDefined();
  });

  it('triggers critical low-balance alert when balance < 300 Tk', () => {
    const lowTelemetry: DescoFullTelemetry = {
      ...mockTelemetry,
      balance: {
        ...mockTelemetry.balance,
        balance: 150
      }
    };
    const metrics = computeDescoMetrics(lowTelemetry);
    expect(metrics.isLowBalance).toBe(true);
    expect(metrics.alertColor).toBe('#ff6368');
    expect(metrics.alertText).toContain('Critical');
  });

  it('calculates exact LT-A residential electricity tariff steps', () => {
    // 1. Lifeline (<= 50 units)
    const lifeline = calculateLtaTariff(40, 2);
    expect(lifeline.energyCost).toBe(Math.round(40 * 5.32));
    expect(lifeline.demandCharge).toBe(2 * 42);
    expect(lifeline.meterRent).toBe(40);

    // 2. Multi-tier step calculation (e.g. 150 units: 75 @ 6.18, 75 @ 8.50)
    const tiered = calculateLtaTariff(150, 2);
    const expectedEnergy = 75 * 6.18 + 75 * 8.5;
    expect(tiered.energyCost).toBe(Math.round(expectedEnergy));
    expect(tiered.steps.length).toBe(2);
  });
});
