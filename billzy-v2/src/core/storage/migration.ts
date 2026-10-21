import { PaymentRecord, PaymentRecordSchema } from '../contracts/payment';

export interface MigrationResult {
  validRecords: PaymentRecord[];
  invalidCount: number;
  errors: string[];
}

/**
 * Validates and imports JSON data (e.g. data.json) with zero data loss or timestamp drift.
 */
export function importPaymentsData(rawData: unknown): MigrationResult {
  if (!Array.isArray(rawData)) {
    return {
      validRecords: [],
      invalidCount: 0,
      errors: ['Input data is not an array']
    };
  }

  const validRecords: PaymentRecord[] = [];
  const errors: string[] = [];
  let invalidCount = 0;

  rawData.forEach((item, index) => {
    const result = PaymentRecordSchema.safeParse(item);
    if (result.success) {
      validRecords.push(result.data);
    } else {
      invalidCount++;
      errors.push(`Record #${index} (${(item as { uid?: string })?.uid || 'no-uid'}): ${result.error.message}`);
    }
  });

  return {
    validRecords,
    invalidCount,
    errors
  };
}

/**
 * Serializes payment records to JSON string with zero timestamp drift and indentation.
 */
export function exportPaymentsData(payments: PaymentRecord[]): string {
  return JSON.stringify(payments, null, 2) + '\n';
}
