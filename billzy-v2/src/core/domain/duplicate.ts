import { parseBillMonthRange, parseSingleBillMonth } from './bill-month';
import { PaymentRecord } from '../contracts/payment';
import { BILL_DEFINITIONS } from '../contracts/utility';

export interface DuplicateCheckResult {
  existing: PaymentRecord;
  message: string;
}

/**
 * Checks if two month ranges overlap using closed month bounds [start, end]
 */
export function doMonthRangesOverlap(
  start1?: Date | null,
  end1?: Date | null,
  start2?: Date | null,
  end2?: Date | null
): boolean {
  if (!start1 || !end1 || !start2 || !end2) return false;
  const s1 = new Date(start1.getFullYear(), start1.getMonth(), 1).getTime();
  const e1 = new Date(end1.getFullYear(), end1.getMonth() + 1, 0).getTime();
  const s2 = new Date(start2.getFullYear(), start2.getMonth(), 1).getTime();
  const e2 = new Date(end2.getFullYear(), end2.getMonth() + 1, 0).getTime();
  return s1 <= e2 && s2 <= e1;
}

/**
 * Checks if two day-exact cycles overlap using half-open interval [start, end)
 * Crucial fix from commit b1fb76a:
 * Consecutive 20th-to-20th billing periods (e.g. Oct 20 - Nov 20, and Nov 20 - Dec 20)
 * must NOT trigger false duplicates.
 */
export function doGymCyclesOverlap(
  start1?: Date | null,
  end1?: Date | null,
  start2?: Date | null,
  end2?: Date | null
): boolean {
  if (!start1 || !end1 || !start2 || !end2) return false;
  const s1 = new Date(start1.getFullYear(), start1.getMonth(), start1.getDate()).getTime();
  const e1 = new Date(end1.getFullYear(), end1.getMonth(), end1.getDate()).getTime();
  const s2 = new Date(start2.getFullYear(), start2.getMonth(), start2.getDate()).getTime();
  const e2 = new Date(end2.getFullYear(), end2.getMonth(), end2.getDate()).getTime();
  return s1 < e2 && s2 < e1;
}

/**
 * Checks if two Land Tax fiscal year strings match or overlap
 */
export function isLandTaxFYMatch(m1?: string | null, m2?: string | null): boolean {
  if (!m1 || !m2) return false;
  if (m1.trim().toLowerCase() === m2.trim().toLowerCase()) return true;

  const y1 = m1.match(/\b\d{4}\b/g) || (m1.match(/\b\d{2}\b/g) || []).map(y => '20' + y);
  const y2 = m2.match(/\b\d{4}\b/g) || (m2.match(/\b\d{2}\b/g) || []).map(y => '20' + y);
  if (y1.length > 0 && y2.length > 0) {
    const s1 = parseInt(y1[0], 10);
    const s2 = parseInt(y2[0], 10);
    return s1 === s2;
  }
  return false;
}

/**
 * Checks if two billing months or month ranges match
 */
export function isBillingMonthMatch(m1?: string | null, m2?: string | null): boolean {
  if (!m1 || !m2) return false;
  const clean1 = m1.trim().toLowerCase();
  const clean2 = m2.trim().toLowerCase();
  if (clean1 === clean2) return true;

  const r1 = parseBillMonthRange(m1);
  const r2 = parseBillMonthRange(m2);
  if (r1 && r2) {
    const hasSpecificDays =
      r1.start.getDate() !== 1 ||
      r1.end.getDate() !== 1 ||
      r2.start.getDate() !== 1 ||
      r2.end.getDate() !== 1;
    if (hasSpecificDays) {
      return doGymCyclesOverlap(r1.start, r1.end, r2.start, r2.end);
    }
    return doMonthRangesOverlap(r1.start, r1.end, r2.start, r2.end);
  }
  const d1 = parseSingleBillMonth(m1);
  const d2 = parseSingleBillMonth(m2);
  if (d1 && d2) {
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();
  }
  return false;
}

/**
 * Universal Duplicate Entry Detector for all month/cycle-based utilities
 */
export function checkDuplicatePayment(
  existingPayments: PaymentRecord[],
  billId: string,
  monthVal?: string | null,
  extra: { property?: string } = {},
  excludeUid?: string | null
): DuplicateCheckResult | null {
  if (!monthVal || !monthVal.trim()) return null;
  const cleanMonth = monthVal.trim();
  const relevantPayments = existingPayments.filter(
    (p): p is PaymentRecord & { billMonth: string } =>
      p.billId === billId && p.uid !== excludeUid && Boolean(p.billMonth)
  );

  if (billId === 'landTax') {
    const prop = extra.property || '';
    const propPayments = relevantPayments.filter(
      p => !prop || p.property === prop || p.property === 'সকল ৩টি সম্পত্তি'
    );
    for (const p of propPayments) {
      if (isLandTaxFYMatch(p.billMonth, cleanMonth)) {
        return {
          existing: p,
          message: `Land Tax for ${prop ? prop + ' ' : ''}(${p.billMonth}) has already been recorded.`
        };
      }
    }
    return null;
  }

  if (billId === 'gym') {
    const newRange = parseBillMonthRange(cleanMonth);
    for (const p of relevantPayments) {
      const existRange = parseBillMonthRange(p.billMonth);
      if (newRange && existRange) {
        if (doGymCyclesOverlap(newRange.start, newRange.end, existRange.start, existRange.end)) {
          return {
            existing: p,
            message: `Selected gym cycle "${cleanMonth}" overlaps with an existing payment record ("${p.billMonth}").`
          };
        }
      } else if (cleanMonth.toLowerCase() === p.billMonth.toLowerCase()) {
        return {
          existing: p,
          message: `A Gym payment for "${cleanMonth}" has already been recorded.`
        };
      }
    }
    return null;
  }

  if (billId === 'matuailGas') {
    const newRange = parseBillMonthRange(cleanMonth);
    for (const p of relevantPayments) {
      const existRange = parseBillMonthRange(p.billMonth);
      if (newRange && existRange && doMonthRangesOverlap(newRange.start, newRange.end, existRange.start, existRange.end)) {
        return {
          existing: p,
          message: `Selected billing period "${cleanMonth}" overlaps with an existing payment record ("${p.billMonth}").`
        };
      } else if (isBillingMonthMatch(p.billMonth, cleanMonth)) {
        return {
          existing: p,
          message: `A Matuail Gas payment for "${cleanMonth}" is already recorded.`
        };
      }
    }
    return null;
  }

  for (const p of relevantPayments) {
    if (isBillingMonthMatch(p.billMonth, cleanMonth)) {
      const billObj = BILL_DEFINITIONS[billId as keyof typeof BILL_DEFINITIONS];
      const bName = billObj ? billObj.name : billId;
      return {
        existing: p,
        message: `A payment for ${bName} for "${cleanMonth}" has already been recorded.`
      };
    }
  }

  return null;
}
