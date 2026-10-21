import { PaymentRecord } from '../contracts/payment';
import { DueCalculationResult } from '../contracts/cycles';
import { parseBillMonth, formatDateFriendlyShort, formatLocalDate } from './bill-month';
import { getMatuailGasDueInfo, formatOverdueMonths } from './titas-gas';
import { getGymNextCycle } from './gym-cycle';
import { getLandTaxNextCycle } from './land-tax';

export function calculateNextDue(
  billId: string,
  payments: PaymentRecord[],
  options: {
    gymPaused?: boolean;
    referenceDate?: Date;
    matuailRate?: number;
  } = {}
): DueCalculationResult {
  const now = options.referenceDate ? new Date(options.referenceDate) : new Date();
  now.setHours(0, 0, 0, 0);

  const billPayments = payments
    .filter(p => p.billId === billId)
    .sort((a, b) => (b.payDate || '').localeCompare(a.payDate || ''));

  const lastPayment = billPayments[0];

  // 1. Gym
  if (billId === 'gym') {
    if (options.gymPaused) {
      return {
        nextDueDate: null,
        dueText: 'Subscription Paused',
        statusClass: 'muted',
        diffDays: 0,
        isOverdue: false,
        isDueSoon: false,
        isPaused: true
      };
    }
    const gymCycle = getGymNextCycle(billPayments, 1, now);
    const nextDueDate = new Date(gymCycle.dueDate);
    nextDueDate.setHours(0, 0, 0, 0);

    const diffTime = nextDueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        nextDueDate,
        dueText: `Overdue by ${Math.abs(diffDays)}d`,
        statusClass: 'overdue',
        diffDays,
        isOverdue: true,
        isDueSoon: false
      };
    } else if (diffDays === 0) {
      return {
        nextDueDate,
        dueText: 'Due Today (21st)',
        statusClass: 'warning',
        diffDays: 0,
        isOverdue: false,
        isDueSoon: true
      };
    } else {
      const isDueSoon = diffDays <= 5;
      return {
        nextDueDate,
        dueText: `In ${diffDays}d (${formatDateFriendlyShort(formatLocalDate(nextDueDate))})`,
        statusClass: isDueSoon ? 'warning' : 'paid',
        diffDays,
        isOverdue: false,
        isDueSoon
      };
    }
  }

  // 2. Land Tax
  if (billId === 'landTax') {
    const cycle = getLandTaxNextCycle(billPayments, 'মাতুয়াইল', 1, now);
    const nextDueDate = new Date(cycle.dueDate);
    nextDueDate.setHours(0, 0, 0, 0);

    const diffTime = nextDueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const isOverdue = diffDays < 0;
    const isDueSoon = diffDays >= 0 && diffDays <= 30;

    return {
      nextDueDate,
      dueText: isOverdue ? `Overdue by ${Math.abs(diffDays)}d` : `In ${diffDays}d (1 Apr)`,
      statusClass: isOverdue ? 'overdue' : (isDueSoon ? 'warning' : 'paid'),
      diffDays,
      isOverdue,
      isDueSoon
    };
  }

  // 3. Matuail Gas (Titas Gas Postpaid)
  if (billId === 'matuailGas') {
    const gasDue = getMatuailGasDueInfo(lastPayment, options.matuailRate || 1080, now);
    const parsedMonth = lastPayment ? parseBillMonth(lastPayment.billMonth) : null;
    let nextDueDate: Date;
    if (parsedMonth) {
      nextDueDate = new Date(parsedMonth.getFullYear(), parsedMonth.getMonth() + 1, 21);
    } else {
      nextDueDate = new Date(now.getFullYear(), now.getMonth(), 21);
    }
    nextDueDate.setHours(0, 0, 0, 0);

    const diffTime = nextDueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const isOverdue = diffDays < 0;
    const isDueSoon = diffDays >= 0 && diffDays <= 5;

    let dueText = gasDue.dueText;
    if (isOverdue) {
      dueText = `Overdue ${formatOverdueMonths(Math.abs(diffDays))}`;
    }

    return {
      nextDueDate,
      dueText,
      statusClass: isOverdue ? 'overdue' : (isDueSoon ? 'warning' : 'paid'),
      diffDays,
      isOverdue,
      isDueSoon
    };
  }

  // 4. Inspire Broadband (Prepaid monthly subscription, respects billing month)
  if (billId === 'inspireBroadband') {
    let nextDueDate: Date;
    const parsedLastMonth = lastPayment ? parseBillMonth(lastPayment.billMonth) : null;
    if (parsedLastMonth) {
      nextDueDate = new Date(parsedLastMonth.getFullYear(), parsedLastMonth.getMonth() + 1, 1);
    } else if (lastPayment && lastPayment.payDate) {
      const pDate = new Date(lastPayment.payDate);
      nextDueDate = new Date(pDate.getFullYear(), pDate.getMonth() + 1, 1);
    } else {
      nextDueDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }
    nextDueDate.setHours(0, 0, 0, 0);

    const diffTime = nextDueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const isOverdue = diffDays < 0;
    const isDueSoon = diffDays >= 0 && diffDays <= 5;

    return {
      nextDueDate,
      dueText: isOverdue ? `Overdue by ${Math.abs(diffDays)}d` : `In ${diffDays}d`,
      statusClass: isOverdue ? 'overdue' : (isDueSoon ? 'warning' : 'paid'),
      diffDays,
      isOverdue,
      isDueSoon
    };
  }

  // 5. Postpaid Utilities (Noakhali Palli, Uttara Water)
  if (billId === 'noakhaliPalli' || billId === 'uttaraWater') {
    let nextDueDate: Date | null = null;
    if (lastPayment && lastPayment.billMonth) {
      const paidMonthDate = parseBillMonth(lastPayment.billMonth);
      if (paidMonthDate) {
        // Postpaid monthly due logic (e.g. WASA, Palli Bidyut): paidMonth + 2 months, 1st
        nextDueDate = new Date(paidMonthDate.getFullYear(), paidMonthDate.getMonth() + 2, 1);
      }
    }
    if (!nextDueDate) {
      nextDueDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }
    nextDueDate.setHours(0, 0, 0, 0);

    const diffTime = nextDueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const isOverdue = diffDays < 0;
    const isDueSoon = diffDays >= 0 && diffDays <= 5;

    return {
      nextDueDate,
      dueText: isOverdue ? `Overdue by ${Math.abs(diffDays)}d` : `In ${diffDays}d`,
      statusClass: isOverdue ? 'overdue' : (isDueSoon ? 'warning' : 'paid'),
      diffDays,
      isOverdue,
      isDueSoon
    };
  }

  // 6. Prepaid Recharge Meters (Rupnagar DESCO, Uttara DESCO, Rupnagar Gas)
  if (lastPayment && lastPayment.payDate) {
    const payDate = new Date(lastPayment.payDate);
    payDate.setHours(0, 0, 0, 0);
    const diffTime = now.getTime() - payDate.getTime();
    const daysSince = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return {
      nextDueDate: null,
      dueText: daysSince === 0 ? 'Today' : `${daysSince}d ago`,
      statusClass: daysSince > 25 ? 'warning' : 'paid',
      diffDays: -daysSince,
      isOverdue: false,
      isDueSoon: false
    };
  }

  return {
    nextDueDate: null,
    dueText: 'No Records',
    statusClass: 'muted',
    diffDays: 0,
    isOverdue: false,
    isDueSoon: false
  };
}
