import { PaymentRecord } from '../contracts/payment';
import { parsePaymentRecord } from './fee-splitting';
import { getSeason, getSeasonName, isSeasonalUtility } from './seasonal';
import { BILL_DEFINITIONS } from '../contracts/utility';

export interface SurchargeIntelligence {
  totalBaseSpend: number;
  totalSurcharges: number;
  feeRate: number; // percentage (e.g. 1.62)
  feeTransactionsCount: number;
  avgFeePerTransaction: number;
  elecFees: number;
  gasFees: number;
  otherFees: number;
  pureSpendPct: number; // percentage of total combined
  feeSpendPct: number;
  surchargeTrend: {
    labels: string[];
    values: number[];
  };
}

export interface SpendEfficiencySummary {
  overallDaysPer1k: number;
  overallDailyBurn: number;
  totalValidCycles: number;
  bestMeter: {
    billId: string;
    name: string;
    daysPer1k: number;
  } | null;
  efficiencyByBill: {
    billId: string;
    name: string;
    daysPer1k: number;
    dailyBurn: number;
    cycles: number;
    totalDays: number;
    totalAmt: number;
    isSeasonal: boolean;
    seasonName: string | null;
  }[];
}

export interface SpendRankingItem {
  name: string;
  shortName: string;
  amount: number;
  percent: number;
}

export interface GlobalKpiMetrics {
  lifetimeSpend: number;
  ytdSpend: number;
  ytdSubtext: string;
  highestBill: number;
  highestBillLabel: string;
  avgMonthlySpend: number;
}

export interface Chart12MonthSpend {
  labels: string[];
  values: number[];
}

export interface ChartYoyCumulative {
  currentYear: number;
  prevYear: number;
  labels: string[];
  currentYearCumulative: (number | null)[];
  prevYearCumulative: number[];
}

export interface ChartRadar4D {
  labels: string[];
  data: [number, number, number, number]; // [Electricity, Water, Gas, Internet]
  totals: {
    electricity: number;
    water: number;
    gas: number;
    internet: number;
  };
}

export interface ChartQuarterlyStacked {
  quarters: string[]; // ['Q1', 'Q2', 'Q3', 'Q4']
  accounts: string[];
  datasets: {
    label: string;
    data: number[];
  }[];
}

export interface CashFlowBubblePoint {
  x: number; // 1-31
  y: number; // Amount
  r: number; // Radius 6-22
  billName: string;
  payDate: string;
}

export interface ChartMomInflation {
  labels: string[];
  rates: number[];
}

export interface ComprehensiveAnalytics {
  kpi: GlobalKpiMetrics;
  surcharges: SurchargeIntelligence;
  efficiency: SpendEfficiencySummary;
  rankings: {
    lifetime: SpendRankingItem[];
    ytd: SpendRankingItem[];
  };
  charts: {
    monthly12: Chart12MonthSpend;
    yoyCumulative: ChartYoyCumulative;
    radar4D: ChartRadar4D;
    quarterly: ChartQuarterlyStacked;
    cashFlowBubbles: CashFlowBubblePoint[];
    momInflation: ChartMomInflation;
  };
}

export const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export function getShortenedBillName(fullName: string): string {
  const mapping: Record<string, string> = {
    'Uttara DESCO': 'U.DESCO',
    'Rupnagar DESCO': 'R.DESCO',
    'Uttara Water': 'U.WATER',
    'Rupnagar Gas': 'R.GAS',
    'Inspire Broadband': 'INSPIRE.B',
    'Noakhali Palli': 'N.PALLI',
    'Matuail Gas': 'M.GAS',
    'Gym': 'GYM',
    'Land Tax': 'L.TAX'
  };
  return mapping[fullName.trim()] || fullName;
}

export function formatDaysWithMonths(days: number): string {
  if (days >= 30) {
    const m = Math.floor(days / 30);
    const rem = Math.round(days % 30);
    return rem > 0 ? `${m}M ${rem} days` : `${m}M 0 days`;
  }
  return `${days.toFixed(1)} days`;
}

/**
 * Computes the complete Global Analytics payload from payments data.
 */
export function computeComprehensiveAnalytics(
  payments: PaymentRecord[],
  referenceDate: Date = new Date()
): ComprehensiveAnalytics {
  const now = referenceDate;
  const currentYear = now.getFullYear();
  const currentMonthIdx = now.getMonth();
  const currentMonthName = MONTH_NAMES[currentMonthIdx];

  // 1. KPI & Totals Accumulation
  let totalSpend = 0;
  let totalBaseSpend = 0;
  let totalSurcharges = 0;
  let elecFees = 0;
  let gasFees = 0;
  let otherFees = 0;
  let feeTransactionsCount = 0;

  let ytdSpend = 0;
  let highestBill = 0;
  let highestBillLabel = '-';
  let statsMonthsSum = 0;
  const statsStartDate = new Date(2026, 5, 1); // June 1, 2026

  const parsedPayments = payments.map(parsePaymentRecord);

  parsedPayments.forEach(p => {
    const feeVal = p.feeNum ?? (parseFloat(p.fee) || 0);
    totalSpend += p.total;
    totalBaseSpend += p.baseAmount;
    totalSurcharges += feeVal;

    if (p.hasFee && feeVal > 0) {
      feeTransactionsCount++;
      const bId = p.billId || '';
      if (bId.includes('Desco') || bId.includes('Palli')) {
        elecFees += feeVal;
      } else if (bId.includes('Gas')) {
        gasFees += feeVal;
      } else {
        otherFees += feeVal;
      }
    }

    const pDate = new Date(p.payDate);
    if (!isNaN(pDate.getTime())) {
      if (pDate.getFullYear() === currentYear) {
        ytdSpend += p.total;
      }

      if (p.total > highestBill) {
        highestBill = p.total;
        highestBillLabel = p.billName;
      }

      if (pDate >= statsStartDate && pDate <= now) {
        statsMonthsSum += p.total;
      }
    }
  });

  const elapsedMonths = Math.max(1, (now.getFullYear() - 2026) * 12 + (now.getMonth() - 5) + 1);
  const avgMonthlySpend = statsMonthsSum > 0 ? Math.round(statsMonthsSum / elapsedMonths) : 0;

  const totalCombined = totalBaseSpend + totalSurcharges;
  const pureSpendPct = totalCombined > 0 ? (totalBaseSpend / totalCombined) * 100 : 100;
  const feeSpendPct = totalCombined > 0 ? (totalSurcharges / totalCombined) * 100 : 0;
  const feeRate = totalBaseSpend > 0 ? (totalSurcharges / totalBaseSpend) * 100 : 0;
  const avgFeePerTransaction = feeTransactionsCount > 0 ? totalSurcharges / feeTransactionsCount : 0;

  // 2. Rolling 6-Month Surcharge Trend
  const surchargeMonths: string[] = [];
  const surchargeMonthlyFees: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = `${MONTH_NAMES[d.getMonth()]} '${String(d.getFullYear()).slice(-2)}`;
    surchargeMonths.push(label);
    surchargeMonthlyFees[label] = 0;
  }

  parsedPayments.forEach(p => {
    const feeVal = p.feeNum ?? (parseFloat(p.fee) || 0);
    if (p.hasFee && feeVal > 0) {
      const pDate = new Date(p.payDate);
      if (!isNaN(pDate.getTime())) {
        const label = `${MONTH_NAMES[pDate.getMonth()]} '${String(pDate.getFullYear()).slice(-2)}`;
        if (surchargeMonthlyFees[label] !== undefined) {
          surchargeMonthlyFees[label] += feeVal;
        }
      }
    }
  });

  // 3. Spend Efficiency (Days per 1,000 Tk)
  const eligibleBillIds = [
    'rupnagarDesco',
    'uttaraDesco',
    'rupnagarGas',
    'noakhaliPalli',
    'uttaraWater',
    'matuailGas'
  ];

  const currentSeason = getSeason(now);
  const currentSeasonName = getSeasonName(now);

  const efficiencyByBill: SpendEfficiencySummary['efficiencyByBill'] = [];
  let totalDaysSum = 0;
  let totalAmountSum = 0;
  let totalValidCycles = 0;

  eligibleBillIds.forEach(bId => {
    const billDef = BILL_DEFINITIONS[bId as keyof typeof BILL_DEFINITIONS];
    if (!billDef) return;

    const bPayments = parsedPayments
      .filter(p => p.billId === bId)
      .sort((a, b) => new Date(a.payDate).getTime() - new Date(b.payDate).getTime());

    const isSeasonal = isSeasonalUtility(bId);
    let allDays = 0;
    let allAmt = 0;
    let allCycles = 0;

    let seasonDays = 0;
    let seasonAmt = 0;
    let seasonCycles = 0;

    for (let i = 0; i < bPayments.length - 1; i++) {
      const p1 = bPayments[i];
      const p2 = bPayments[i + 1];
      const d1 = new Date(p1.payDate);
      const d2 = new Date(p2.payDate);
      const diffDays = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays > 0 && p1.baseAmount > 0) {
        allDays += diffDays;
        allAmt += p1.baseAmount;
        allCycles++;

        if (isSeasonal && getSeason(d1) === currentSeason) {
          seasonDays += diffDays;
          seasonAmt += p1.baseAmount;
          seasonCycles++;
        }
      }
    }

    const useSeasonal = isSeasonal && seasonCycles > 0 && seasonAmt > 0;
    const finalDays = useSeasonal ? seasonDays : allDays;
    const finalAmt = useSeasonal ? seasonAmt : allAmt;
    const finalCycles = useSeasonal ? seasonCycles : allCycles;

    if (finalCycles > 0 && finalAmt > 0) {
      const daysPer1k = finalDays / (finalAmt / 1000);
      const dailyBurn = finalDays > 0 ? finalAmt / finalDays : 0;
      efficiencyByBill.push({
        billId: bId,
        name: billDef.name,
        daysPer1k: Math.round(daysPer1k * 10) / 10,
        dailyBurn: Math.round(dailyBurn),
        cycles: finalCycles,
        totalDays: finalDays,
        totalAmt: finalAmt,
        isSeasonal: useSeasonal,
        seasonName: useSeasonal ? currentSeasonName : null
      });
      totalDaysSum += finalDays;
      totalAmountSum += finalAmt;
      totalValidCycles += finalCycles;
    }
  });

  efficiencyByBill.sort((a, b) => b.daysPer1k - a.daysPer1k);
  const overallDaysPer1k = totalAmountSum > 0 ? totalDaysSum / (totalAmountSum / 1000) : 0;
  const overallDailyBurn = totalDaysSum > 0 ? totalAmountSum / totalDaysSum : 0;
  const bestMeter = efficiencyByBill.length > 0 ? efficiencyByBill[0] : null;

  // 4. Lifetime & YTD Spend Rankings
  const spendByBillMap: Record<string, number> = {};
  const ytdByBillMap: Record<string, number> = {};

  Object.values(BILL_DEFINITIONS).forEach(b => {
    spendByBillMap[b.name] = 0;
    ytdByBillMap[b.name] = 0;
  });

  parsedPayments.forEach(p => {
    const bName = p.billName || 'Other';
    spendByBillMap[bName] = (spendByBillMap[bName] || 0) + p.total;

    const pDate = new Date(p.payDate);
    if (!isNaN(pDate.getTime()) && pDate.getFullYear() === currentYear) {
      ytdByBillMap[bName] = (ytdByBillMap[bName] || 0) + p.total;
    }
  });

  const lifetimeSorted = Object.entries(spendByBillMap)
    .filter(([_, amt]) => amt > 0)
    .sort((a, b) => b[1] - a[1]);
  const maxLifetimeSpend = Math.max(...lifetimeSorted.map(x => x[1]), 1);

  const lifetimeRankings: SpendRankingItem[] = lifetimeSorted.map(([name, amt]) => ({
    name,
    shortName: getShortenedBillName(name),
    amount: Math.round(amt),
    percent: Math.round((amt / maxLifetimeSpend) * 100)
  }));

  const ytdSorted = Object.entries(ytdByBillMap)
    .filter(([_, amt]) => amt > 0)
    .sort((a, b) => b[1] - a[1]);
  const maxYtdSpend = Math.max(...ytdSorted.map(x => x[1]), 1);

  const ytdRankings: SpendRankingItem[] = ytdSorted.map(([name, amt]) => ({
    name,
    shortName: getShortenedBillName(name),
    amount: Math.round(amt),
    percent: Math.round((amt / maxYtdSpend) * 100)
  }));

  // 5. Chart 1: 12-Month Spend Trend
  const monthsList12: string[] = [];
  const monthSums12: Record<string, number> = {};

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = `${MONTH_NAMES[d.getMonth()]} '${String(d.getFullYear()).slice(-2)}`;
    monthsList12.push(label);
    monthSums12[label] = 0;
  }

  parsedPayments.forEach(p => {
    const pDate = new Date(p.payDate);
    if (!isNaN(pDate.getTime())) {
      const label = `${MONTH_NAMES[pDate.getMonth()]} '${String(pDate.getFullYear()).slice(-2)}`;
      if (monthSums12[label] !== undefined) {
        monthSums12[label] += p.total;
      }
    }
  });

  // 6. Chart 2: YoY Cumulative Compare
  const prevYear = currentYear - 1;
  const currentYearMonthlySums = Array(12).fill(0);
  const prevYearMonthlySums = Array(12).fill(0);

  parsedPayments.forEach(p => {
    const pDate = new Date(p.payDate);
    if (!isNaN(pDate.getTime())) {
      const yr = pDate.getFullYear();
      const mo = pDate.getMonth();
      if (yr === currentYear) {
        currentYearMonthlySums[mo] += p.total;
      } else if (yr === prevYear) {
        prevYearMonthlySums[mo] += p.total;
      }
    }
  });

  const currentYearCumulative: (number | null)[] = Array(12).fill(null);
  const prevYearCumulative: number[] = Array(12).fill(0);
  let currentRunning = 0;
  let prevRunning = 0;

  for (let i = 0; i < 12; i++) {
    prevRunning += prevYearMonthlySums[i];
    prevYearCumulative[i] = prevRunning;

    if (i <= currentMonthIdx) {
      currentRunning += currentYearMonthlySums[i];
      currentYearCumulative[i] = currentRunning;
    }
  }

  // 7. Chart 3: 4D Spending Radar
  const radarSums = {
    electricity: 0,
    water: 0,
    gas: 0,
    internet: 0
  };

  parsedPayments.forEach(p => {
    const nameLower = (p.billName || '').toLowerCase();
    const amt = p.total;
    if (nameLower.includes('desco') || nameLower.includes('palli') || nameLower.includes('electric')) {
      radarSums.electricity += amt;
    } else if (nameLower.includes('water') || nameLower.includes('wasa')) {
      radarSums.water += amt;
    } else if (nameLower.includes('gas')) {
      radarSums.gas += amt;
    } else if (nameLower.includes('broadband') || nameLower.includes('internet') || nameLower.includes('inspire')) {
      radarSums.internet += amt;
    }
  });

  // 8. Chart 4: Quarterly Stacked by Account
  const quarterlySumsByAccount: Record<string, number[]> = {};

  parsedPayments.forEach(p => {
    const pDate = new Date(p.payDate);
    if (!isNaN(pDate.getTime()) && pDate.getFullYear() === currentYear) {
      const acc = p.billName || 'Other';
      const qIdx = Math.floor(pDate.getMonth() / 3);
      if (!quarterlySumsByAccount[acc]) {
        quarterlySumsByAccount[acc] = [0, 0, 0, 0];
      }
      quarterlySumsByAccount[acc][qIdx] += p.total;
    }
  });

  const quarterlyDatasets = Object.keys(quarterlySumsByAccount).map(acc => ({
    label: acc,
    data: quarterlySumsByAccount[acc].map(v => Math.round(v))
  }));

  // 9. Chart 5: Cash Flow Bubbles
  const cashFlowBubbles: CashFlowBubblePoint[] = parsedPayments
    .filter(p => p.total > 0)
    .map(p => {
      const pDate = new Date(p.payDate);
      const day = !isNaN(pDate.getTime()) ? pDate.getDate() : 1;
      const amt = p.total;
      const r = Math.max(6, Math.min(22, amt / 900 + 5));
      return {
        x: day,
        y: Math.round(amt),
        r: Math.round(r * 10) / 10,
        billName: p.billName || 'Utility',
        payDate: p.payDate || 'N/A'
      };
    });

  // 10. Chart 6: Month-over-Month Inflation %
  const momLabels: string[] = [];
  const momRates: number[] = [];

  for (let i = 1; i < monthsList12.length; i++) {
    const prev = monthSums12[monthsList12[i - 1]] || 0;
    const curr = monthSums12[monthsList12[i]] || 0;
    let rate = 0;
    if (prev > 0) {
      rate = Math.round(((curr - prev) / prev) * 1000) / 10;
    }
    momRates.push(rate);
    momLabels.push(monthsList12[i]);
  }

  return {
    kpi: {
      lifetimeSpend: Math.round(totalSpend),
      ytdSpend: Math.round(ytdSpend),
      ytdSubtext: `Jan — ${currentMonthName} ${currentYear}`,
      highestBill: Math.round(highestBill),
      highestBillLabel,
      avgMonthlySpend
    },
    surcharges: {
      totalBaseSpend: Math.round(totalBaseSpend),
      totalSurcharges: Math.round(totalSurcharges),
      feeRate: Math.round(feeRate * 100) / 100,
      feeTransactionsCount,
      avgFeePerTransaction: Math.round(avgFeePerTransaction * 10) / 10,
      elecFees: Math.round(elecFees),
      gasFees: Math.round(gasFees),
      otherFees: Math.round(otherFees),
      pureSpendPct: Math.round(pureSpendPct * 10) / 10,
      feeSpendPct: Math.round(feeSpendPct * 10) / 10,
      surchargeTrend: {
        labels: surchargeMonths,
        values: surchargeMonths.map(m => Math.round(surchargeMonthlyFees[m] || 0))
      }
    },
    efficiency: {
      overallDaysPer1k: Math.round(overallDaysPer1k * 10) / 10,
      overallDailyBurn: Math.round(overallDailyBurn),
      totalValidCycles,
      bestMeter: bestMeter ? {
        billId: bestMeter.billId,
        name: bestMeter.name,
        daysPer1k: bestMeter.daysPer1k
      } : null,
      efficiencyByBill
    },
    rankings: {
      lifetime: lifetimeRankings,
      ytd: ytdRankings
    },
    charts: {
      monthly12: {
        labels: monthsList12,
        values: monthsList12.map(m => Math.round(monthSums12[m] || 0))
      },
      yoyCumulative: {
        currentYear,
        prevYear,
        labels: MONTH_NAMES,
        currentYearCumulative: currentYearCumulative.map(v => v !== null ? Math.round(v) : null),
        prevYearCumulative: prevYearCumulative.map(v => Math.round(v))
      },
      radar4D: {
        labels: ['Electricity', 'Water', 'Gas', 'Internet'],
        data: [
          Math.round(radarSums.electricity),
          Math.round(radarSums.water),
          Math.round(radarSums.gas),
          Math.round(radarSums.internet)
        ],
        totals: {
          electricity: Math.round(radarSums.electricity),
          water: Math.round(radarSums.water),
          gas: Math.round(radarSums.gas),
          internet: Math.round(radarSums.internet)
        }
      },
      quarterly: {
        quarters: ['Q1', 'Q2', 'Q3', 'Q4'],
        accounts: Object.keys(quarterlySumsByAccount),
        datasets: quarterlyDatasets
      },
      cashFlowBubbles,
      momInflation: {
        labels: momLabels,
        rates: momRates
      }
    }
  };
}
