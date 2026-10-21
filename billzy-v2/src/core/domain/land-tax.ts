import { parseBillMonth, formatDateFriendly, formatLocalDate } from './bill-month';
import { PaymentRecord } from '../contracts/payment';
import { LandTaxCycleInfo } from '../contracts/cycles';

export const LAND_TAX_PROPERTIES = [
  { name: 'মাতুয়াইল', key: 'matuail', defaultRate: 1500 },
  { name: 'উত্তরখান', key: 'uttarkhan', defaultRate: 2000 },
  { name: 'কেশুরবাগ', key: 'keshurbag', defaultRate: 850 }
] as const;

/**
 * Calculates Bangladeshi Fiscal Year (April 1 - March 31) dues and next cycle.
 */
export function getLandTaxNextCycle(
  existingPayments: PaymentRecord[] = [],
  selectedProperty: string,
  duration = 1,
  currentDate: Date = new Date()
): LandTaxCycleInfo {
  const propPayments = existingPayments.filter(
    p =>
      p.billId === 'landTax' &&
      (p.property === selectedProperty ||
        (p.property && p.property.includes(selectedProperty)) ||
        (p.note && p.note.includes(selectedProperty)))
  );

  let startYear: number | null = null;
  const lastPayment = propPayments[0];

  if (lastPayment && lastPayment.billMonth) {
    const parsedEnd = parseBillMonth(lastPayment.billMonth);
    if (parsedEnd) {
      if (parsedEnd.getMonth() === 2) {
        startYear = parsedEnd.getFullYear();
      } else {
        startYear = parsedEnd.getFullYear() + 1;
      }
    }
  }

  if (!startYear) {
    const now = currentDate;
    const curMonth = now.getMonth();
    startYear = curMonth >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  }

  const cleanDuration = Math.max(1, duration);
  const endYear = startYear + (cleanDuration - 1);
  const dueYear = endYear + 1;
  const dueDate = new Date(dueYear, 3, 1);
  const dueFormatted = formatDateFriendly(formatLocalDate(dueDate));

  const rangeLabel = startYear === endYear ? `${startYear}` : `${startYear} to ${endYear}`;
  const displayRange = startYear === endYear ? `FY ${startYear}` : `FY ${startYear} - ${endYear}`;

  return {
    startYear,
    endYear,
    duration: cleanDuration,
    rangeLabel,
    displayRange,
    dueYear,
    dueDate,
    dueLabel: dueFormatted
  };
}
