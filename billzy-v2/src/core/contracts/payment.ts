import { z } from 'zod';

export const UtilityCategoryEnum = z.enum([
  'electric',
  'gas',
  'water',
  'internet',
  'gym',
  'tax'
]);
export type UtilityCategory = z.infer<typeof UtilityCategoryEnum>;

export const BillTypeEnum = z.enum(['prepaid', 'postpaid']);
export type BillType = z.infer<typeof BillTypeEnum>;

export const BillIdEnum = z.enum([
  'rupnagarDesco',
  'uttaraDesco',
  'rupnagarGas',
  'uttaraWater',
  'matuailGas',
  'noakhaliPalli',
  'inspireBroadband',
  'gym',
  'landTax'
]);
export type BillId = z.infer<typeof BillIdEnum>;

/**
 * Strict schema for payment records stored in data.json and runtime state
 */
export const PaymentRecordSchema = z.object({
  uid: z.string().min(1),
  billId: z.string().min(1),
  billName: z.string().min(1),
  billType: z.string().toLowerCase(),
  utilityCategory: z.string().optional(),
  billMonth: z.string().optional(),
  amount: z.string(),
  amountNum: z.number().optional(),
  fee: z.string().optional(),
  feeNum: z.number().optional(),
  totalPaid: z.number().optional(),
  payDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  savedAt: z.string().optional(),
  timestamp: z.number().optional(),
  property: z.string().optional(),
  receiptUrl: z.string().optional(),
  receiptFileName: z.string().optional(),
  receiptLocation: z.string().optional(),
  note: z.string().optional()
});

export type PaymentRecord = z.infer<typeof PaymentRecordSchema>;

/**
 * Enriched payment record with computed monetary amounts
 */
export interface EnrichedPaymentRecord extends PaymentRecord {
  baseAmount: number;
  fee: string;
  feeNum: number;
  total: number;
  hasFee: boolean;
  totalPaid: number;
}
