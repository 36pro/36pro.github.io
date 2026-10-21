import { parseBillMonth, formatDateFriendly, formatLocalDate } from './bill-month';
import { PaymentRecord } from '../contracts/payment';
import { GymCycleInfo } from '../contracts/cycles';

/**
 * Calculates the next Gym 20th-to-20th cycle and 21st monthly due date.
 */
export function getGymNextCycle(
  existingPayments: PaymentRecord[] = [],
  duration = 1,
  currentDate: Date = new Date()
): GymCycleInfo {
  const gymPayments = existingPayments.filter(p => p.billId === 'gym');

  let latestEndDate: Date | null = null;
  for (const p of gymPayments) {
    if (p.billMonth) {
      const parsed = parseBillMonth(p.billMonth);
      if (parsed && (!latestEndDate || parsed > latestEndDate)) {
        latestEndDate = parsed;
      }
    }
  }

  let startCycleDate: Date | null = null;
  if (latestEndDate) {
    startCycleDate = new Date(latestEndDate.getFullYear(), latestEndDate.getMonth(), 20);
  }

  if (!startCycleDate) {
    const now = currentDate;
    const startMonth = now.getDate() >= 20 ? now.getMonth() : now.getMonth() - 1;
    startCycleDate = new Date(now.getFullYear(), startMonth, 20);
  }

  const endCycleDate = new Date(
    startCycleDate.getFullYear(),
    startCycleDate.getMonth() + duration,
    20
  );
  const dueDate = new Date(
    startCycleDate.getFullYear(),
    startCycleDate.getMonth() + duration,
    21
  );

  const startFormatted = formatDateFriendly(formatLocalDate(startCycleDate));
  const endFormatted = formatDateFriendly(formatLocalDate(endCycleDate));
  const dueFormatted = formatDateFriendly(formatLocalDate(dueDate));

  return {
    startDate: startCycleDate,
    endDate: endCycleDate,
    dueDate,
    rangeLabel: `${startFormatted} - ${endFormatted}`,
    dueLabel: dueFormatted
  };
}

/**
 * Splits variable lump sum payment evenly across selected duration
 */
export function calculateGymSplit(
  totalAmount: number,
  duration = 1
): { monthlySplit: number; totalAmount: number; duration: number } {
  const cleanDuration = Math.max(1, duration);
  const monthlySplit = Math.round(totalAmount / cleanDuration);
  return {
    monthlySplit,
    totalAmount,
    duration: cleanDuration
  };
}
