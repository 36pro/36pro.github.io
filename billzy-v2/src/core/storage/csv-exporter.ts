import { PaymentRecord } from '../contracts/payment';
import { parsePaymentRecord } from '../domain/fee-splitting';
import { formatLandTaxDisplayMonth } from '../domain/bill-month';
import { BILL_DEFINITIONS } from '../contracts/utility';

const CATEGORY_MAP: Record<string, string> = {
  rupnagarDesco: 'Electricity',
  uttaraDesco: 'Electricity',
  noakhaliPalli: 'Electricity',
  uttaraWater: 'Water Supply',
  rupnagarGas: 'Gas & Thermal',
  matuailGas: 'Gas & Thermal',
  inspireBroadband: 'Internet / ISP',
  gym: 'Fitness / Subscription',
  landTax: 'Tax & Municipal'
};

/**
 * Generates BOM-compliant CSV with exact legacy format.
 */
export function generatePaymentsCSV(payments: PaymentRecord[]): string {
  const sorted = [...payments].sort((a, b) => {
    return (b.payDate || '').localeCompare(a.payDate || '');
  });

  let csv = '\uFEFF';
  csv +=
    'Transaction ID,Date Paid,Utility Name,Category,Account / Meter No,Billing Type,Billing Month,Main Amount (BDT),Fee (BDT),Total Paid (BDT),Property / Note,Receipt Link / File,Created At (UTC)\n';

  sorted.forEach(rawP => {
    const p = parsePaymentRecord(rawP);
    const amt = p.baseAmount;
    const fee = p.feeNum;
    const total = p.total;

    const cat = p.utilityCategory
      ? p.utilityCategory.charAt(0).toUpperCase() + p.utilityCategory.slice(1)
      : CATEGORY_MAP[p.billId] || 'Utility';
    const billDef = BILL_DEFINITIONS[p.billId as keyof typeof BILL_DEFINITIONS];
    const meter = billDef?.meterNumber || p.billId;
    const bMonth =
      p.billId === 'landTax' ? formatLandTaxDisplayMonth(p.billMonth, false) : p.billMonth || '-';
    const bType = p.billType
      ? p.billType.charAt(0).toUpperCase() + p.billType.slice(1)
      : 'Prepaid';
    const createdAt = p.savedAt || (p.timestamp ? new Date(p.timestamp).toISOString() : '-');

    const cleanUid = (p.uid || '').replace(/"/g, '""');
    const cleanName = (p.billName || '').replace(/<br>/gi, ' ').replace(/"/g, '""');
    const cleanProp = (p.property || p.note || '').replace(/"/g, '""');
    const cleanReceipt = (p.receiptUrl || p.receiptFileName || '').replace(/"/g, '""');

    csv += `"${cleanUid}","${p.payDate}","${cleanName}","${cat}","${meter}","${bType}","${bMonth}",${Math.round(amt)},${Math.round(fee)},${Math.round(total)},"${cleanProp}","${cleanReceipt}","${createdAt}"\n`;
  });

  return csv;
}

export function downloadPaymentsCSV(payments: PaymentRecord[]): void {
  const csv = generatePaymentsCSV(payments);
  const todayStr = new Date().toISOString().split('T')[0];
  const filename = `billzy_payments_${todayStr}.csv`;

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
