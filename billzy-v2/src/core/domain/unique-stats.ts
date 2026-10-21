import { PaymentRecord } from '../contracts/payment';
import { parsePaymentRecord } from './fee-splitting';
import { getSeason, getSeasonName } from './seasonal';
import { MONTH_NAMES, formatDaysWithMonths } from './analytics';

export { formatDaysWithMonths };

export interface PrepaidCycleItem {
  payDate: string;
  amount: number;
  daysUntilNext: number | null;
  daysPer1000: number | null;
}

export interface RollingMonthItem {
  shortLabel: string;
  fullLabel: string;
  shortMonthName: string;
  fullMonthName: string;
  year: number;
  yearShort: string;
  monthIndex: number; // 0-11
}

export function get12RollingMonths(referenceDate: Date = new Date()): RollingMonthItem[] {
  const fullMonthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const list: RollingMonthItem[] = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - i, 1);
    const mIdx = d.getMonth();
    const y = d.getFullYear();
    const yStrShort = String(y).slice(-2);
    list.push({
      shortLabel: `${MONTH_NAMES[mIdx]} '${yStrShort}`,
      fullLabel: `${fullMonthNames[mIdx]} ${y}`,
      shortMonthName: MONTH_NAMES[mIdx],
      fullMonthName: fullMonthNames[mIdx],
      year: y,
      yearShort: yStrShort,
      monthIndex: mIdx
    });
  }
  return list;
}

export function buildPrepaidCycles(payments: PaymentRecord[]): PrepaidCycleItem[] {
  const sorted = [...payments]
    .map(parsePaymentRecord)
    .sort((a, b) => new Date(a.payDate).getTime() - new Date(b.payDate).getTime());

  return sorted.map((p, i) => {
    const next = sorted[i + 1];
    const amount = p.baseAmount || p.total;
    const daysUntilNext = next
      ? Math.round((new Date(next.payDate).getTime() - new Date(p.payDate).getTime()) / 86400000)
      : null;
    return {
      payDate: p.payDate,
      amount,
      daysUntilNext,
      daysPer1000:
        daysUntilNext !== null && amount > 0
          ? Math.round((daysUntilNext / (amount / 1000)) * 10) / 10
          : null
    };
  });
}

export interface ForecastGaugeData {
  pctElapsed: number; // 0 to 1
  daysLeft: number;
  estCycleDays: number;
  estExhaustionDateStr: string;
  color: string;
  avgRate: number;
}

export function computeForecastGauge(
  payments: PaymentRecord[],
  referenceDate: Date = new Date()
): ForecastGaugeData | null {
  const cycles = buildPrepaidCycles(payments);
  const validCycles = cycles.filter(c => c.daysPer1000 !== null);
  if (validCycles.length === 0) return null;

  const currentSeason = getSeason(referenceDate);
  const seasonalCycles = validCycles.filter(c => getSeason(new Date(c.payDate)) === currentSeason);
  const cyclesToUse = seasonalCycles.length > 0 ? seasonalCycles : validCycles;
  const avgRate =
    cyclesToUse.reduce((sum, c) => sum + (c.daysPer1000 || 0), 0) / cyclesToUse.length;

  const sorted = [...payments]
    .map(parsePaymentRecord)
    .sort((a, b) => new Date(a.payDate).getTime() - new Date(b.payDate).getTime());
  const lastPayment = sorted[sorted.length - 1];
  if (!lastPayment) return null;

  const lastPayDate = new Date(lastPayment.payDate);
  const lastAmount = lastPayment.baseAmount || lastPayment.total;
  const estCycleDays = Math.max(1, Math.round(avgRate * (lastAmount / 1000)));

  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);
  lastPayDate.setHours(0, 0, 0, 0);
  const elapsedDays = Math.floor((today.getTime() - lastPayDate.getTime()) / 86400000);
  const daysLeft = estCycleDays - elapsedDays;
  const pctElapsed = Math.min(Math.max(elapsedDays / estCycleDays, 0), 1);

  const estDateObj = new Date(lastPayDate.getTime() + estCycleDays * 86400000);
  const estExhaustionDateStr = estDateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });

  const color = daysLeft < 0 ? '#fb7185' : daysLeft <= 3 ? '#ff6368' : daysLeft <= 7 ? '#fbbf24' : '#00E676';

  return {
    pctElapsed,
    daysLeft,
    estCycleDays,
    estExhaustionDateStr,
    color,
    avgRate: Math.round(avgRate * 10) / 10
  };
}

export interface RateTrendData {
  labels: string[];
  values: (number | null)[];
  slope: number;
  slopeStatus: 'improving' | 'declining';
}

export function computeRateTrend(
  payments: PaymentRecord[],
  referenceDate: Date = new Date()
): RateTrendData {
  const rolling12 = get12RollingMonths(referenceDate);
  const cycles = buildPrepaidCycles(payments);
  const validCycles = cycles.filter(c => c.daysPer1000 !== null);

  const labels = rolling12.map(m => m.shortLabel);
  const values: (number | null)[] = [];

  rolling12.forEach(m => {
    const matching = validCycles.filter(c => {
      const pDate = new Date(c.payDate);
      return pDate.getFullYear() === m.year && pDate.getMonth() === m.monthIndex;
    });
    if (matching.length > 0) {
      const avg = matching.reduce((sum, c) => sum + (c.daysPer1000 || 0), 0) / matching.length;
      values.push(Math.round(avg * 10) / 10);
    } else {
      values.push(null);
    }
  });

  const n = validCycles.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  validCycles.forEach((pt, i) => {
    const yVal = pt.daysPer1000 || 0;
    sumX += i;
    sumY += yVal;
    sumXY += i * yVal;
    sumXX += i * i;
  });

  const slope = n > 1 && (n * sumXX - sumX * sumX) !== 0
    ? (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    : 0;

  return {
    labels,
    values,
    slope: Math.round(slope * 100) / 100,
    slopeStatus: slope >= 0 ? 'improving' : 'declining'
  };
}

export interface MonthlyTotalData {
  labels: string[];
  values: number[];
  hasData: boolean[];
}

export function computeMonthlyTotal(
  payments: PaymentRecord[],
  referenceDate: Date = new Date()
): MonthlyTotalData {
  const rolling12 = get12RollingMonths(referenceDate);
  const labels = rolling12.map(m => m.shortLabel);
  const values: number[] = [];
  const hasData: boolean[] = [];

  rolling12.forEach(m => {
    const matching = payments.filter(p => {
      const pDate = new Date(p.payDate);
      return pDate.getFullYear() === m.year && pDate.getMonth() === m.monthIndex;
    });

    if (matching.length > 0) {
      const sum = matching.reduce((acc, p) => acc + (p.totalPaid || parseFloat(p.amount) || 0), 0);
      values.push(Math.round(sum));
      hasData.push(true);
    } else {
      values.push(0);
      hasData.push(false);
    }
  });

  return {
    labels,
    values,
    hasData
  };
}

export interface BillLagData {
  labels: string[];
  lags: number[];
  colors: string[];
  hasData: boolean[];
}

export function computeBillLag(
  payments: PaymentRecord[],
  referenceDate: Date = new Date()
): BillLagData {
  const rolling12 = get12RollingMonths(referenceDate);
  const labels = rolling12.map(m => m.shortLabel);
  const lags: number[] = [];
  const colors: string[] = [];
  const hasData: boolean[] = [];

  rolling12.forEach(m => {
    const matchingPayment = payments.find(p => {
      if (p.billMonth) {
        if (/^\d{4}-\d{2}$/.test(p.billMonth)) {
          const [y, mo] = p.billMonth.split('-').map(Number);
          if (y === m.year && mo === m.monthIndex + 1) return true;
        }
        const bm = p.billMonth.toLowerCase();
        const mShort = m.shortMonthName.toLowerCase();
        const mFull = m.fullMonthName.toLowerCase();
        const matchMonth = bm.includes(mShort) || bm.includes(mFull);
        const matchYear = bm.includes(String(m.year)) || bm.includes(m.yearShort);
        if (matchMonth && matchYear) return true;
      }
      const pDate = new Date(p.payDate);
      return pDate.getFullYear() === m.year && pDate.getMonth() === m.monthIndex;
    });

    if (matchingPayment) {
      const lastDayOfBillMonth = new Date(m.year, m.monthIndex + 1, 0);
      const payDate = new Date(matchingPayment.payDate);
      const lag = Math.round((payDate.getTime() - lastDayOfBillMonth.getTime()) / 86400000);
      lags.push(lag);
      colors.push(lag > 0 ? '#fb7185' : '#2dd4bf');
      hasData.push(true);
    } else {
      lags.push(0);
      colors.push('transparent');
      hasData.push(false);
    }
  });

  return {
    labels,
    lags,
    colors,
    hasData
  };
}

export interface AmountVsDurationData {
  labels: string[];
  amounts: number[];
  durations: (number | null)[];
  hasData: boolean[];
}

export function computeAmountVsDuration(
  payments: PaymentRecord[],
  referenceDate: Date = new Date()
): AmountVsDurationData {
  const rolling12 = get12RollingMonths(referenceDate);
  const labels = rolling12.map(m => m.shortLabel);
  const cycles = buildPrepaidCycles(payments);

  const amounts: number[] = [];
  const durations: (number | null)[] = [];
  const hasData: boolean[] = [];

  rolling12.forEach(m => {
    const matchingPayments = payments.filter(p => {
      const pDate = new Date(p.payDate);
      return pDate.getFullYear() === m.year && pDate.getMonth() === m.monthIndex;
    });

    const matchingCycles = cycles.filter(c => {
      const pDate = new Date(c.payDate);
      return (
        pDate.getFullYear() === m.year &&
        pDate.getMonth() === m.monthIndex &&
        c.daysUntilNext !== null
      );
    });

    if (matchingPayments.length > 0) {
      const sumAmt = matchingPayments.reduce(
        (acc, p) => acc + (p.totalPaid || parseFloat(p.amount) || 0),
        0
      );
      const sumDur = matchingCycles.reduce((acc, c) => acc + (c.daysUntilNext || 0), 0);
      amounts.push(Math.round(sumAmt));
      durations.push(sumDur > 0 ? Math.round(sumDur) : null);
      hasData.push(true);
    } else {
      amounts.push(0);
      durations.push(null);
      hasData.push(false);
    }
  });

  return {
    labels,
    amounts,
    durations,
    hasData
  };
}

export interface UniqueChartMeta {
  id: string;
  title: string;
  appliesTo: ('prepaid' | 'postpaid')[];
  minPayments: number;
  accent: string;
}

export const UNIQUE_CHART_REGISTRY: UniqueChartMeta[] = [
  {
    id: 'forecastGauge',
    title: 'Next Recharge Forecast',
    appliesTo: ['prepaid'],
    minPayments: 2,
    accent: '#fbbf24'
  },
  {
    id: 'rateTrend',
    title: 'Usage Rate Trend',
    appliesTo: ['prepaid'],
    minPayments: 3,
    accent: '#a78bfa'
  },
  {
    id: 'monthlyTotal',
    title: 'Monthly Total',
    appliesTo: ['prepaid', 'postpaid'],
    minPayments: 1,
    accent: '#2dd4bf'
  },
  {
    id: 'billLag',
    title: 'Bill Month vs. Pay Date',
    appliesTo: ['postpaid'],
    minPayments: 1,
    accent: '#fb7185'
  },
  {
    id: 'amountVsDuration',
    title: 'Amount vs. Duration',
    appliesTo: ['prepaid'],
    minPayments: 2,
    accent: '#818cf8'
  }
];
