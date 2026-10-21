import { PaymentRecord } from '../contracts/payment';
import { parsePaymentRecord } from './fee-splitting';
import { formatDateFriendly, formatDateFriendlyShort, formatLocalDate } from './bill-month';
import { calculateNextDue } from './due-dates';
import { BILL_DEFINITIONS, UtilityDefinition } from '../contracts/utility';

export interface UtilityKeyStats {
  stat1: { label: string; value: string; colorClass: 'normal' | 'green' | 'warning' | 'danger' | 'muted' };
  stat2: { label: string; value: string; colorClass: 'normal' | 'green' | 'warning' | 'danger' | 'muted' };
  stat3: { label: string; value: string; colorClass: 'normal' | 'green' | 'warning' | 'danger' | 'muted' };
  stat4: { label: string; value: string; colorClass: 'normal' | 'green' | 'warning' | 'danger' | 'muted' };
}

export function formatEarlierBillDuration(billPayments: PaymentRecord[]): string {
  if (billPayments.length >= 2) {
    const mostRecent = billPayments[0];
    const previous = billPayments[1];

    const parsedPrev = parsePaymentRecord(previous);
    const prevAmountFormatted = `৳ ${parsedPrev.baseAmount.toLocaleString()}`;

    const recentDate = new Date(mostRecent.payDate);
    const prevDate = new Date(previous.payDate);
    const diffDays = Math.round((recentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays >= 30) {
      const months = Math.floor(diffDays / 30);
      const remDays = diffDays % 30;
      const monthPart = months === 1 ? '1 Month' : `${months} Months`;
      const dayPart = remDays > 0 ? (remDays === 1 ? '1 Day' : `${remDays} Days`) : '';
      const durationCombined = dayPart ? `${monthPart} ${dayPart}` : monthPart;
      return `${prevAmountFormatted} lasted ${durationCombined}`;
    } else if (diffDays > 0) {
      return `${prevAmountFormatted} lasted ${diffDays} Days`;
    } else {
      return `${prevAmountFormatted} (Same Day)`;
    }
  } else if (billPayments.length === 1) {
    return 'Current active recharge';
  }
  return '-';
}

export function computeUtilityDetailStats(
  billId: string,
  allPayments: PaymentRecord[],
  options: { isGymPaused?: boolean; matuailRate?: number; referenceDate?: Date } = {}
): UtilityKeyStats {
  const now = options.referenceDate || new Date();
  const billDef = BILL_DEFINITIONS[billId as keyof typeof BILL_DEFINITIONS];
  const billPayments = allPayments
    .filter(p => p.billId === billId)
    .sort((a, b) => new Date(b.payDate).getTime() - new Date(a.payDate).getTime());

  const lastPayment = billPayments[0];
  const lastAmountText = lastPayment
    ? `৳ ${(lastPayment.amountNum || parseFloat(lastPayment.amount) || 0).toLocaleString()}`
    : '-';
  const lastDateText = lastPayment ? formatDateFriendly(lastPayment.payDate) : '-';

  if (!billDef || billDef.type === 'prepaid') {
    let elapsedText = '-';
    let elapsedColor: UtilityKeyStats['stat1']['colorClass'] = 'normal';

    if (lastPayment) {
      const pDate = new Date(lastPayment.payDate);
      const days = Math.floor((now.getTime() - pDate.getTime()) / (1000 * 60 * 60 * 24));
      elapsedText = days === 0 ? 'Today' : `${days} Days Ago`;
      if (days > 25) elapsedColor = 'danger';
      else if (days > 15) elapsedColor = 'warning';
      else elapsedColor = 'green';
    }

    const durationText = formatEarlierBillDuration(billPayments);

    if (billId === 'gym') {
      const paused = !!options.isGymPaused;
      const dueInfo = calculateNextDue(billId, allPayments, {
        gymPaused: paused,
        matuailRate: options.matuailRate,
        referenceDate: now
      });

      return {
        stat1: {
          label: 'Subscription Status',
          value: paused ? 'Paused 🔒' : 'Active ▶️',
          colorClass: paused ? 'warning' : 'green'
        },
        stat2: {
          label: 'Next Gym Due',
          value: dueInfo.dueText,
          colorClass: dueInfo.isOverdue ? 'danger' : dueInfo.isDueSoon ? 'warning' : 'green'
        },
        stat3: {
          label: 'Last Amount',
          value: lastAmountText,
          colorClass: 'green'
        },
        stat4: {
          label: 'Last Cycle Paid',
          value: lastPayment?.billMonth || '-',
          colorClass: 'normal'
        }
      };
    }

    return {
      stat1: {
        label: 'Days Since Payment',
        value: elapsedText,
        colorClass: elapsedColor
      },
      stat2: {
        label: 'Last Amount',
        value: lastAmountText,
        colorClass: 'green'
      },
      stat3: {
        label: 'Last Pay Date',
        value: lastDateText,
        colorClass: 'normal'
      },
      stat4: {
        label: 'Earlier Bill Duration',
        value: durationText,
        colorClass: 'normal'
      }
    };
  }

  // Postpaid or Land Tax
  const dueInfo = calculateNextDue(billId, allPayments, {
    gymPaused: options.isGymPaused,
    matuailRate: options.matuailRate,
    referenceDate: now
  });

  if (billId === 'landTax') {
    return {
      stat1: {
        label: 'Next Tax Due',
        value: dueInfo.dueText,
        colorClass: dueInfo.isOverdue ? 'danger' : dueInfo.isDueSoon ? 'warning' : 'green'
      },
      stat2: {
        label: 'Last Amount',
        value: lastAmountText,
        colorClass: 'green'
      },
      stat3: {
        label: 'Last Pay Date',
        value: lastDateText,
        colorClass: 'normal'
      },
      stat4: {
        label: 'Last FY Paid',
        value: lastPayment?.billMonth || '-',
        colorClass: 'normal'
      }
    };
  }

  return {
    stat1: {
      label: 'Next Bill Due In',
      value: dueInfo.dueText,
      colorClass: dueInfo.isOverdue ? 'danger' : dueInfo.isDueSoon ? 'warning' : 'green'
    },
    stat2: {
      label: 'Last Amount',
      value: lastAmountText,
      colorClass: 'green'
    },
    stat3: {
      label: 'Last Pay Date',
      value: lastDateText,
      colorClass: 'normal'
    },
    stat4: {
      label: 'Last Payment Made For',
      value: lastPayment?.billMonth || '-',
      colorClass: 'normal'
    }
  };
}

export function getCompanyForBill(billId: string): string {
  if (billId === 'gym') return 'Fitness Center';
  if (billId.includes('Desco') || billId.includes('desco')) return 'DESCO';
  if (billId.includes('Gas') || billId.includes('gas')) return 'Gas Utility';
  if (billId.includes('Water')) return 'DWASA';
  if (billId.includes('Palli')) return 'Palli Bidyut';
  if (billId === 'landTax') return 'Land Revenue Board';
  if (billId === 'inspireBroadband') return 'Inspire Broadband';
  return 'Utility';
}
