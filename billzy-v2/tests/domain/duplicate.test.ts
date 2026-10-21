import { describe, it, expect } from 'vitest';
import {
  checkDuplicatePayment,
  isBillingMonthMatch,
  isLandTaxFYMatch
} from '@/core/domain/duplicate';
import { PaymentRecord } from '@/core/contracts/payment';

describe('Universal Duplicate Entry Prevention Rules', () => {
  const existingPayments: PaymentRecord[] = [
    {
      uid: 'mr-palli-1',
      billId: 'noakhaliPalli',
      billName: 'Noakhali Palli',
      billType: 'postpaid',
      billMonth: 'July 2026',
      amount: '350',
      payDate: '2026-08-02'
    },
    {
      uid: 'mr-gas-1',
      billId: 'matuailGas',
      billName: 'Matuail Gas',
      billType: 'postpaid',
      billMonth: 'January 2026 - March 2026',
      amount: '3240',
      payDate: '2026-04-10'
    },
    {
      uid: 'mr-gym-1',
      billId: 'gym',
      billName: 'Gym',
      billType: 'prepaid',
      billMonth: '20 Jul 2026 - 20 Aug 2026',
      amount: '1700',
      payDate: '2026-07-20'
    },
    {
      uid: 'mr-tax-1',
      billId: 'landTax',
      billName: 'Land Tax',
      billType: 'prepaid',
      billMonth: 'FY 2025-2026',
      property: 'মাতুয়াইল',
      amount: '1500',
      payDate: '2025-05-10'
    }
  ];

  it('blocks duplicate payment for identical billing month', () => {
    const dup = checkDuplicatePayment(existingPayments, 'noakhaliPalli', 'July 2026');
    expect(dup).not.toBeNull();
    expect(dup?.message).toContain('already been recorded');
  });

  it('allows payment for a different billing month for the same utility', () => {
    const dup = checkDuplicatePayment(existingPayments, 'noakhaliPalli', 'August 2026');
    expect(dup).toBeNull();
  });

  it('detects overlapping month ranges for Matuail Gas', () => {
    // Existing is Jan 2026 - Mar 2026. Submitting Feb 2026 - Apr 2026 overlaps!
    const dup = checkDuplicatePayment(existingPayments, 'matuailGas', 'February 2026 - April 2026');
    expect(dup).not.toBeNull();
    expect(dup?.message).toContain('overlaps with an existing payment record');
  });

  it('allows non-overlapping subsequent ranges for Matuail Gas', () => {
    // Existing is Jan 2026 - Mar 2026. Submitting Apr 2026 - Jun 2026 is fine!
    const dup = checkDuplicatePayment(existingPayments, 'matuailGas', 'April 2026 - June 2026');
    expect(dup).toBeNull();
  });

  it('detects Land Tax duplicate for the same property and fiscal year', () => {
    const dup = checkDuplicatePayment(
      existingPayments,
      'landTax',
      'FY 2025-2026',
      { property: 'মাতুয়াইল' }
    );
    expect(dup).not.toBeNull();
    expect(dup?.message).toContain('Land Tax for মাতুয়াইল');
  });

  it('allows Land Tax for a DIFFERENT property for the same fiscal year', () => {
    const dup = checkDuplicatePayment(
      existingPayments,
      'landTax',
      'FY 2025-2026',
      { property: 'উত্তরখান' }
    );
    expect(dup).toBeNull();
  });

  it('bypasses duplicate detection when editing the existing record (matching excludeUid)', () => {
    const dup = checkDuplicatePayment(
      existingPayments,
      'noakhaliPalli',
      'July 2026',
      {},
      'mr-palli-1' // Same UID being edited
    );
    expect(dup).toBeNull();
  });
});
