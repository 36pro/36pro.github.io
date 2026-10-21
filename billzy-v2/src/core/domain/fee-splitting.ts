import { PaymentRecord, EnrichedPaymentRecord } from '../contracts/payment';

export const AUTO_SPLIT_ELIGIBLE_BILLS = ['rupnagarDesco', 'uttaraDesco', 'rupnagarGas'] as const;

/**
 * Parses and enriches a payment record.
 * Handles legacy entries from data.json, extracts gateway fee remainder
 * strictly for eligible prepaid recharge bills when fee is left empty,
 * and preserves exact raw amounts for non-recharge bills.
 */
export function parsePaymentRecord(p: PaymentRecord): EnrichedPaymentRecord {
  const rawAmt = parseFloat(p.amount) || 0;

  let fee = 0;
  let baseAmount = rawAmt;

  // If an explicit fee was provided (manually entered by user in the Fee box)
  if (p.fee !== undefined && p.fee !== '' && p.fee !== null && parseFloat(p.fee) > 0) {
    fee = parseFloat(p.fee) || 0;
    baseAmount = p.amountNum !== undefined && p.amountNum !== null ? p.amountNum : rawAmt;
  }
  // Only auto-split lump sums for eligible prepaid recharge bills when fee box was left empty
  else if (AUTO_SPLIT_ELIGIBLE_BILLS.includes(p.billId as (typeof AUTO_SPLIT_ELIGIBLE_BILLS)[number])) {
    const remainder = rawAmt % 100;
    if (remainder > 0 && rawAmt > 100 && remainder <= 60) {
      fee = remainder;
      baseAmount = rawAmt - remainder;
    }
  } else {
    // Non-auto-split bills with empty fee box: exact raw amount, zero fee
    fee = 0;
    baseAmount = rawAmt;
  }

  const roundedBase = Math.round(baseAmount);
  const roundedFee = Math.round(fee);
  const roundedTotal = roundedBase + roundedFee;

  return {
    ...p,
    baseAmount: roundedBase,
    fee: roundedFee > 0 ? String(roundedFee) : '',
    feeNum: roundedFee,
    total: roundedTotal,
    totalPaid: roundedTotal,
    hasFee: roundedFee > 0
  };
}

/**
 * Checks if a utility bill is eligible for fee auto-splitting
 */
export function isAutoSplitEligible(billId: string): boolean {
  return AUTO_SPLIT_ELIGIBLE_BILLS.includes(billId as (typeof AUTO_SPLIT_ELIGIBLE_BILLS)[number]);
}

/**
 * Calculates base amount and fee for a new payment entry before saving
 */
export function calculateEntryFee(
  billId: string,
  rawAmount: number,
  manualFee?: number | string
): { baseAmount: number; fee: number; total: number } {
  const parsedManualFee = manualFee !== undefined && manualFee !== '' ? Math.round(parseFloat(String(manualFee))) || 0 : 0;

  let feeNumeric = parsedManualFee;
  let amountNumeric = Math.round(rawAmount) || 0;

  if (isAutoSplitEligible(billId) && feeNumeric === 0 && amountNumeric > 100) {
    const remainder = amountNumeric % 100;
    if (remainder > 0 && remainder <= 60) {
      feeNumeric = remainder;
      amountNumeric = amountNumeric - remainder;
    }
  }

  return {
    baseAmount: amountNumeric,
    fee: feeNumeric,
    total: amountNumeric + feeNumeric
  };
}
