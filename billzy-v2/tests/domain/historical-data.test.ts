import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { importPaymentsData, exportPaymentsData } from '@/core/storage/migration';
import { generatePaymentsCSV } from '@/core/storage/csv-exporter';
import { parsePaymentRecord } from '@/core/domain/fee-splitting';

describe('Historical Data Compatibility with data.json', () => {
  const dataPath = path.resolve(__dirname, '../../data.json');
  const rawFile = fs.readFileSync(dataPath, 'utf8');
  const rawJson = JSON.parse(rawFile);

  it('validates 100% of records in data.json with zero schema errors', () => {
    const result = importPaymentsData(rawJson);
    expect(result.invalidCount).toBe(0);
    expect(result.errors).toHaveLength(0);
    expect(result.validRecords.length).toBe(rawJson.length);
    expect(result.validRecords.length).toBeGreaterThan(15);
  });

  it('preserves exact round-trip fidelity with zero data loss or timestamp drift', () => {
    const result = importPaymentsData(rawJson);
    const reSerialized = exportPaymentsData(result.validRecords);
    const reParsed = JSON.parse(reSerialized);

    expect(reParsed).toEqual(rawJson);
  });

  it('parses all historical payments through parsePaymentRecord without runtime errors', () => {
    const result = importPaymentsData(rawJson);
    result.validRecords.forEach(p => {
      const enriched = parsePaymentRecord(p);
      expect(typeof enriched.baseAmount).toBe('number');
      expect(isNaN(enriched.baseAmount)).toBe(false);
      expect(typeof enriched.feeNum).toBe('number');
      expect(typeof enriched.total).toBe('number');
      expect(enriched.baseAmount + enriched.feeNum).toBe(enriched.total);
    });
  });

  it('generates compliant CSV with UTF-8 BOM and correct columns from data.json', () => {
    const result = importPaymentsData(rawJson);
    const csv = generatePaymentsCSV(result.validRecords);

    // Verify UTF-8 BOM
    expect(csv.startsWith('\uFEFF')).toBe(true);

    // Verify Header
    expect(csv).toContain('Transaction ID,Date Paid,Utility Name,Category,Account / Meter No,Billing Type,Billing Month,Main Amount (BDT),Fee (BDT),Total Paid (BDT),Property / Note,Receipt Link / File,Created At (UTC)');

    // Verify lines count
    const lines = csv.trim().split('\n');
    expect(lines.length).toBe(result.validRecords.length + 1); // Header + all records
  });
});
