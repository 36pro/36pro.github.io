import { describe, it, expect } from 'vitest';
import { getLandTaxNextCycle, LAND_TAX_PROPERTIES } from '@/core/domain/land-tax';
import { formatLandTaxDisplayMonth } from '@/core/domain/bill-month';
import { PaymentRecord } from '@/core/contracts/payment';

describe('Land Tax Fiscal Year Cycles & Multi-Property Invariants', () => {
  it('has 3 official Bengali properties with configured rates', () => {
    expect(LAND_TAX_PROPERTIES).toHaveLength(3);
    expect(LAND_TAX_PROPERTIES.find(p => p.key === 'matuail')?.defaultRate).toBe(1500);
    expect(LAND_TAX_PROPERTIES.find(p => p.key === 'uttarkhan')?.defaultRate).toBe(2000);
    expect(LAND_TAX_PROPERTIES.find(p => p.key === 'keshurbag')?.defaultRate).toBe(850);
  });

  it('calculates Bangladeshi Fiscal Year next cycle correctly with April 1st due date', () => {
    const payments: PaymentRecord[] = [
      {
        uid: 'mr-tax-1',
        billId: 'landTax',
        billName: 'Land Tax',
        billType: 'prepaid',
        billMonth: 'FY 2024-2025',
        property: 'মাতুয়াইল',
        amount: '1500',
        payDate: '2024-05-10'
      }
    ];

    const cycle = getLandTaxNextCycle(payments, 'মাতুয়াইল', 1);
    expect(cycle.startYear).toBe(2026);
    expect(cycle.endYear).toBe(2026);
    expect(cycle.displayRange).toBe('FY 2026');
    expect(cycle.dueYear).toBe(2027);
    expect(cycle.dueDate.getMonth()).toBe(3); // April
    expect(cycle.dueDate.getDate()).toBe(1); // 1st
    expect(cycle.dueLabel).toBe('01 Apr 2027');
  });

  it('supports multi-year duration ranges', () => {
    const cycle3Yrs = getLandTaxNextCycle([], 'উত্তরখান', 3, new Date(2026, 4, 1));
    expect(cycle3Yrs.duration).toBe(3);
    expect(cycle3Yrs.startYear).toBe(2026);
    expect(cycle3Yrs.endYear).toBe(2028);
    expect(cycle3Yrs.displayRange).toBe('FY 2026 - 2028');
    expect(cycle3Yrs.dueYear).toBe(2029);
    expect(cycle3Yrs.dueLabel).toBe('01 Apr 2029');
  });

  it('formats display strings for desktop and mobile table columns', () => {
    expect(formatLandTaxDisplayMonth('2025 to 2026', false)).toBe('FY 2025 - 2026');
    expect(formatLandTaxDisplayMonth('2025 to 2026', true)).toBe("FY '25-'26");
    expect(formatLandTaxDisplayMonth('2026', false)).toBe('FY 2026');
    expect(formatLandTaxDisplayMonth('2026', true)).toBe("FY '26");
  });
});
