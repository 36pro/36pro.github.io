import { describe, it, expect } from 'vitest';
import { getGymNextCycle, calculateGymSplit } from '@/core/domain/gym-cycle';
import { doGymCyclesOverlap } from '@/core/domain/duplicate';
import { PaymentRecord } from '@/core/contracts/payment';

describe('Gym 20th-to-20th Billing Cycles & Overlap Detection', () => {
  it('half-open interval [start, end) prevents false overlap on consecutive 20th-to-20th cycles', () => {
    // Cycle 1: 20 Oct 2026 to 20 Nov 2026
    const c1Start = new Date(2026, 9, 20);
    const c1End = new Date(2026, 10, 20);

    // Cycle 2: 20 Nov 2026 to 20 Dec 2026 (consecutive next cycle)
    const c2Start = new Date(2026, 10, 20);
    const c2End = new Date(2026, 11, 20);

    // With [start, end), c1End == c2Start should NOT overlap!
    const overlaps = doGymCyclesOverlap(c1Start, c1End, c2Start, c2End);
    expect(overlaps).toBe(false);
  });

  it('detects true overlaps between conflicting gym cycles', () => {
    // Cycle 1: 20 Oct 2026 to 20 Nov 2026
    const c1Start = new Date(2026, 9, 20);
    const c1End = new Date(2026, 10, 20);

    // Overlapping cycle: 25 Oct 2026 to 25 Nov 2026
    const c2Start = new Date(2026, 9, 25);
    const c2End = new Date(2026, 10, 25);

    expect(doGymCyclesOverlap(c1Start, c1End, c2Start, c2End)).toBe(true);
  });

  it('calculates the next gym cycle starting on the 20th of the end month of the last payment', () => {
    const payments: PaymentRecord[] = [
      {
        uid: 'mr-gym-1',
        billId: 'gym',
        billName: 'Gym',
        billType: 'prepaid',
        billMonth: '20 Sep 2026 - 20 Oct 2026',
        amount: '1700',
        payDate: '2026-09-20'
      }
    ];

    const nextCycle = getGymNextCycle(payments, 1);
    expect(nextCycle.startDate.getDate()).toBe(20);
    expect(nextCycle.startDate.getMonth()).toBe(9); // October
    expect(nextCycle.endDate.getDate()).toBe(20);
    expect(nextCycle.endDate.getMonth()).toBe(10); // November
    expect(nextCycle.dueDate.getDate()).toBe(21);
    expect(nextCycle.dueDate.getMonth()).toBe(10); // November 21st
    expect(nextCycle.rangeLabel).toBe('20 Oct 2026 - 20 Nov 2026');
    expect(nextCycle.dueLabel).toBe('21 Nov 2026');
  });

  it('splits variable total amount evenly across duration', () => {
    const split3Months = calculateGymSplit(5000, 3);
    expect(split3Months.monthlySplit).toBe(1667); // Math.round(5000 / 3)
    expect(split3Months.totalAmount).toBe(5000);
    expect(split3Months.duration).toBe(3);

    const split1Month = calculateGymSplit(1700, 1);
    expect(split1Month.monthlySplit).toBe(1700);
  });
});
