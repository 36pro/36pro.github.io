import { PaymentRecord } from '../contracts/payment';
import { parsePaymentRecord } from './fee-splitting';

export type Season = 'summer' | 'winter';

/**
 * Returns season for Bangladesh utility intelligence:
 * Summer: March to September (months 2 to 8)
 * Winter: October to February (months 9, 10, 11, 0, 1)
 */
export function getSeason(dateObj: Date | string | number = new Date()): Season {
  const d = typeof dateObj === 'string' || typeof dateObj === 'number' ? new Date(dateObj) : dateObj;
  if (isNaN(d.getTime())) return 'summer';
  const month = d.getMonth(); // 0 = Jan, 1 = Feb, ... 11 = Dec
  return month >= 2 && month <= 8 ? 'summer' : 'winter';
}

export function getSeasonName(dateObj: Date | string | number = new Date()): 'Summer' | 'Winter' {
  return getSeason(dateObj) === 'summer' ? 'Summer' : 'Winter';
}

export function isSeasonalUtility(billId: string): boolean {
  const seasonalIds = [
    'rupnagarDesco',
    'uttaraDesco',
    'noakhaliPalli',
    'rupnagarGas',
    'matuailGas',
    'uttaraWater'
  ];
  return seasonalIds.includes(billId);
}

export interface EfficiencyMetric {
  billId: string;
  daysPer1k: number;
  dailyBurn: number;
  cycles: number;
  totalDays: number;
  totalAmt: number;
  isSeasonal: boolean;
  seasonName: string | null;
}

/**
 * Calculates burn rate and days per 1000 Tk, with seasonal intelligence prioritization
 */
export function calculatePrepaidEfficiency(
  payments: PaymentRecord[],
  billId: string,
  referenceDate: Date = new Date()
): EfficiencyMetric | null {
  const currentSeason = getSeason(referenceDate);
  const currentSeasonName = getSeasonName(referenceDate);
  const isSeasonal = isSeasonalUtility(billId);

  const bPayments = payments
    .filter(p => p.billId === billId)
    .map(parsePaymentRecord)
    .sort((a, b) => new Date(a.payDate).getTime() - new Date(b.payDate).getTime());

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

  if (finalCycles === 0 || finalAmt === 0) return null;

  const daysPer1k = finalDays / (finalAmt / 1000);
  const dailyBurn = finalDays > 0 ? finalAmt / finalDays : 0;

  return {
    billId,
    daysPer1k: Math.round(daysPer1k * 10) / 10,
    dailyBurn: Math.round(dailyBurn),
    cycles: finalCycles,
    totalDays: finalDays,
    totalAmt: finalAmt,
    isSeasonal: useSeasonal,
    seasonName: useSeasonal ? currentSeasonName : null
  };
}
