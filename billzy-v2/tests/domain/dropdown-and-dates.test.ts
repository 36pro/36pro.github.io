import { describe, it, expect } from 'vitest';
import {
  getBillingMonthOptions,
  parseBillMonth,
  parseSingleBillMonth,
  parseBillMonthRange
} from '@/core/domain/bill-month';
import { getSeason, getSeasonName, isSeasonalUtility } from '@/core/domain/seasonal';
import { calculateNextDue } from '@/core/domain/due-dates';
import { PaymentRecord } from '@/core/contracts/payment';

describe('Dropdown Limits, Date Parsers & Seasonal Intelligence', () => {
  it('restricts billing month dropdown to strictly 2 earlier months (pastCount = 2)', () => {
    // Anchor: August 2026
    const anchor = new Date(2026, 7, 1);
    const options = getBillingMonthOptions(anchor, 2, 12);

    // Should include: June 2026 (-2), July 2026 (-1), August 2026 (0), plus 12 future months
    expect(options[0]).toBe('June 2026');
    expect(options[1]).toBe('July 2026');
    expect(options[2]).toBe('August 2026');
    expect(options).toHaveLength(15); // 2 past + 1 current + 12 future
  });

  it('parses single billing months across various formats', () => {
    const d1 = parseSingleBillMonth('August 2026');
    expect(d1?.getFullYear()).toBe(2026);
    expect(d1?.getMonth()).toBe(7);

    const d2 = parseSingleBillMonth('Aug 26');
    expect(d2?.getFullYear()).toBe(2026);
    expect(d2?.getMonth()).toBe(7);

    const d3 = parseSingleBillMonth('20 Aug 2026');
    expect(d3?.getDate()).toBe(20);
    expect(d3?.getMonth()).toBe(7);
  });

  it('parses month ranges and returns duration count', () => {
    const range = parseBillMonthRange('January 2026 - March 2026');
    expect(range?.count).toBe(3);
    expect(range?.start.getMonth()).toBe(0);
    expect(range?.end.getMonth()).toBe(2);
  });

  it('correctly classifies summer (Mar-Sep) vs winter (Oct-Feb)', () => {
    expect(getSeason(new Date(2026, 2, 15))).toBe('summer'); // March
    expect(getSeason(new Date(2026, 6, 1))).toBe('summer'); // July
    expect(getSeason(new Date(2026, 8, 30))).toBe('summer'); // September

    expect(getSeason(new Date(2026, 9, 1))).toBe('winter'); // October
    expect(getSeason(new Date(2026, 11, 25))).toBe('winter'); // December
    expect(getSeason(new Date(2026, 0, 10))).toBe('winter'); // January
    expect(getSeason(new Date(2026, 1, 28))).toBe('winter'); // February

    expect(getSeasonName(new Date(2026, 5, 1))).toBe('Summer');
    expect(getSeasonName(new Date(2026, 10, 1))).toBe('Winter');
  });

  it('respects subscription pause state for Gym due date calculations', () => {
    const payments: PaymentRecord[] = [
      {
        uid: 'mr-gym-paused',
        billId: 'gym',
        billName: 'Gym',
        billType: 'prepaid',
        amount: '1700',
        billMonth: '20 Jul 2026 - 20 Aug 2026',
        payDate: '2026-07-20'
      }
    ];

    const activeDue = calculateNextDue('gym', payments, { gymPaused: false });
    expect(activeDue.isPaused).toBeUndefined();

    const pausedDue = calculateNextDue('gym', payments, { gymPaused: true });
    expect(pausedDue.isPaused).toBe(true);
    expect(pausedDue.dueText).toBe('Subscription Paused');
    expect(pausedDue.statusClass).toBe('muted');
  });
});
