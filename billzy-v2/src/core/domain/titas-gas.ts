import { parseSingleBillMonth, formatShortSingleMonth } from './bill-month';
import { PaymentRecord } from '../contracts/payment';
import { TitasGasDueInfo, MatuailGasStatus } from '../contracts/cycles';
import { DEFAULT_RATES } from '../contracts/storage';

/**
 * Calculates Titas Gas tiered late fee per bill
 * 10 taka when due <= 6 months, 20 taka when due > 6 months.
 * Delayed fee applies after 21st of each month.
 */
export function calculateTitasGasDue(
  fromDate: Date | null,
  toDate: Date | null,
  paymentDate: Date = new Date()
): TitasGasDueInfo {
  if (!fromDate || !toDate || isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    return { monthCount: 1, overdueCount: 0, billsAt10: 0, billsAt20: 0, totalFee: 0 };
  }
  if (toDate < fromDate) {
    return { monthCount: 1, overdueCount: 0, billsAt10: 0, billsAt20: 0, totalFee: 0 };
  }

  const months: Date[] = [];
  let curr = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
  const end = new Date(toDate.getFullYear(), toDate.getMonth(), 1);
  while (curr <= end) {
    months.push(new Date(curr.getFullYear(), curr.getMonth(), 1));
    curr = new Date(curr.getFullYear(), curr.getMonth() + 1, 1);
  }

  let totalFee = 0;
  let billsAt10 = 0;
  let billsAt20 = 0;
  let overdueCount = 0;

  months.forEach(m => {
    // Due deadline is 21st of that month
    const dueDeadline = new Date(m.getFullYear(), m.getMonth(), 21, 23, 59, 59, 999);
    if (paymentDate > dueDeadline) {
      overdueCount++;
      // Six months past due deadline
      const sixMonthsPastDue = new Date(m.getFullYear(), m.getMonth() + 6, 21, 23, 59, 59, 999);
      if (paymentDate > sixMonthsPastDue) {
        billsAt20++;
        totalFee += 20;
      } else {
        billsAt10++;
        totalFee += 10;
      }
    }
  });

  return {
    monthCount: months.length,
    overdueCount,
    billsAt10,
    billsAt20,
    totalFee
  };
}

/**
 * Format Overdue duration in months exclusively for Matuail Gas
 * (e.g. "1.2 months", "4.5 months", "5.2 months")
 */
export function formatOverdueMonths(days?: number): string {
  if (!days || days <= 0) return '0 months';
  const num = Math.max(0.1, Math.round((days / 30.4375) * 10) / 10);
  return `${num} ${num === 1 ? 'month' : 'months'}`;
}

/**
 * Calculates Matuail Gas "Paid till <Month>" and Current Due amount with tiered delay fine
 * Formats dual-unit output: `${totalDue.toLocaleString()} (${monthsFraction} M${fineLabel})`
 */
export function getMatuailGasDueInfo(
  lastPayment?: PaymentRecord | null,
  rate: number = DEFAULT_RATES.MATUAIL_GAS,
  today: Date = new Date()
): MatuailGasStatus {
  if (!lastPayment || !lastPayment.billMonth) {
    return {
      paidTill: 'No Records',
      dueText: 'No Dues',
      dueColor: '#94a3b8',
      totalDue: 0,
      fee: 0,
      monthsFraction: 0,
      billedMonths: 0,
      fine: 0
    };
  }

  const rawMonthStr = lastPayment.billMonth.trim();
  let endMonthStr = rawMonthStr;
  if (rawMonthStr.includes(' - ')) {
    endMonthStr = rawMonthStr.split(' - ')[1].trim();
  } else if (rawMonthStr.includes(' to ')) {
    endMonthStr = rawMonthStr.split(' to ')[1].trim();
  }

  const endMonthDate = parseSingleBillMonth(endMonthStr);
  const shortEnd = formatShortSingleMonth(endMonthStr);
  const paidTill = `Paid till ${shortEnd}`;

  if (!endMonthDate) {
    return {
      paidTill: `Paid for ${rawMonthStr}`,
      dueText: 'Current Due: -',
      dueColor: '#94a3b8',
      totalDue: 0,
      fee: 0,
      monthsFraction: 0,
      billedMonths: 0,
      fine: 0
    };
  }

  const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  // Next unpaid month starts on 1st of month following endMonthDate
  const nextUnpaidStart = new Date(endMonthDate.getFullYear(), endMonthDate.getMonth() + 1, 1);
  const currentMonthStart = new Date(normalizedToday.getFullYear(), normalizedToday.getMonth(), 1);

  if (normalizedToday < nextUnpaidStart) {
    return {
      paidTill,
      dueText: 'No Dues (Up to date)',
      dueColor: '#00E676',
      totalDue: 0,
      fee: 0,
      monthsFraction: 0,
      billedMonths: 0,
      fine: 0
    };
  }

  const targetEnd = currentMonthStart >= nextUnpaidStart ? currentMonthStart : nextUnpaidStart;
  const dueCalc = calculateTitasGasDue(nextUnpaidStart, targetEnd, normalizedToday);
  const billedMonths = dueCalc.monthCount;
  const baseAmount = billedMonths * rate;
  const fine = dueCalc.totalFee;
  const totalDue = baseAmount + fine;

  // Days elapsed since start of first unpaid month
  const diffTime = normalizedToday.getTime() - nextUnpaidStart.getTime();
  const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1);
  const monthsFraction = Math.max(0.1, Math.round((diffDays / 30.4375) * 10) / 10);

  const fineLabel = fine > 0 ? ` +${fine}` : '';
  const dueText = `${totalDue.toLocaleString()} (${monthsFraction} M${fineLabel})`;
  const dueColor = dueCalc.overdueCount > 0 ? '#ff6368' : (totalDue > 0 ? '#ffe663' : '#00E676');

  return {
    paidTill,
    dueText,
    dueColor,
    totalDue,
    fee: fine,
    monthsFraction,
    billedMonths,
    fine,
    dueCalc
  };
}
