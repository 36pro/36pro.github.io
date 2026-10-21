export function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDateFriendly(dateStr?: string | null): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    const year = parseInt(parts[0], 10);
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, monthIndex, day);
    const monthName = date.toLocaleString('default', { month: 'short' });
    const formattedDay = day < 10 ? '0' + day : String(day);
    return `${formattedDay} ${monthName} ${year}`;
  }
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'short' });
  const year = date.getFullYear();
  const formattedDay = day < 10 ? '0' + day : String(day);
  return `${formattedDay} ${month} ${year}`;
}

export function formatDateFriendlyShort(dateStr?: string | null): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    const year = parseInt(parts[0], 10);
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, monthIndex, day);
    const monthName = date.toLocaleString('default', { month: 'short' });
    const formattedDay = day < 10 ? '0' + day : String(day);
    return `${formattedDay} ${monthName}`;
  }
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'short' });
  const formattedDay = day < 10 ? '0' + day : String(day);
  return `${formattedDay} ${month}`;
}

export function formatShortSingleMonth(str?: string | null): string {
  if (!str) return '-';
  const clean = str.replace(/\s+/g, ' ').trim();
  const parts = clean.split(' ');
  if (parts.length >= 2) {
    const m = parts[0].slice(0, 3);
    const y = parts[1].length === 4 ? parts[1].slice(2) : parts[1];
    return `${m} '${y}`;
  }
  return clean;
}

export function formatShortMonth(billMonthStr?: string | null): string {
  if (!billMonthStr) return '-';
  const cleanStr = billMonthStr.replace(/\s+/g, ' ').trim();
  if (cleanStr.includes(' - ')) {
    const parts = cleanStr.split(' - ');
    return `${formatShortSingleMonth(parts[0])} - ${formatShortSingleMonth(parts[1])}`;
  }
  if (cleanStr.includes(' to ')) {
    const parts = cleanStr.split(' to ');
    return `${formatShortSingleMonth(parts[0])} - ${formatShortSingleMonth(parts[1])}`;
  }
  return formatShortSingleMonth(cleanStr);
}

export function formatLandTaxDisplayMonth(billMonthStr?: string | null, isShort = false): string {
  if (!billMonthStr) return '-';
  const clean = billMonthStr.replace(/\s+/g, ' ').trim();
  const years = clean.match(/\b\d{4}\b/g);
  if (years && years.length > 0) {
    if (years.length === 1) {
      const yr = years[0];
      return isShort ? `FY '${yr.slice(2)}` : `FY ${yr}`;
    }
    const sYr = years[0];
    const eYr = years[years.length - 1];
    return isShort ? `FY '${sYr.slice(2)}-'${eYr.slice(2)}` : `FY ${sYr} - ${eYr}`;
  }
  return clean;
}

export function parseSingleBillMonth(billMonthStr?: string | null): Date | null {
  if (!billMonthStr) return null;
  const cleanStr = billMonthStr.replace(/\s+/g, ' ').trim();
  const parts = cleanStr.split(/[\s-]+/);
  if (parts.length < 2) return null;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const monthPartIdx = parts.findIndex(p =>
    monthNames.some(m => m.toLowerCase().startsWith(p.toLowerCase()))
  );
  if (monthPartIdx === -1) return null;

  const monthIndex = monthNames.findIndex(m =>
    m.toLowerCase().startsWith(parts[monthPartIdx].toLowerCase())
  );
  const numericParts = parts.filter((_, idx) => idx !== monthPartIdx).filter(p => /^\d+$/.test(p));

  let yearStr = '';
  let dayNum = 1;

  if (numericParts.length === 1) {
    yearStr = numericParts[0].length === 2 ? '20' + numericParts[0] : numericParts[0];
    dayNum = 1;
  } else if (numericParts.length >= 2) {
    dayNum = parseInt(numericParts[0], 10);
    yearStr = numericParts[1].length === 2 ? '20' + numericParts[1] : numericParts[1];
  }

  if (monthIndex === -1 || !yearStr) return null;
  return new Date(parseInt(yearStr, 10), monthIndex, dayNum);
}

export function parseBillMonth(billMonthStr?: string | null): Date | null {
  if (!billMonthStr) return null;
  const cleanStr = billMonthStr.replace(/\s+/g, ' ').trim();

  const fourDigitYears = cleanStr.match(/\b\d{4}\b/g);
  const monthNames = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december',
    'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
  ];
  const hasMonthName = monthNames.some(m => cleanStr.toLowerCase().includes(m));

  if (hasMonthName && (cleanStr.includes('-') || cleanStr.includes('to'))) {
    if (cleanStr.includes(' - ')) {
      const parts = cleanStr.split(' - ');
      return parseSingleBillMonth(parts[1]) || parseSingleBillMonth(parts[0]);
    }
    if (cleanStr.includes(' to ')) {
      const parts = cleanStr.split(' to ');
      return parseSingleBillMonth(parts[1]) || parseSingleBillMonth(parts[0]);
    }
  }

  if (fourDigitYears && fourDigitYears.length > 0) {
    if (cleanStr.toUpperCase().includes('FY') || !hasMonthName) {
      const endYear = parseInt(fourDigitYears[fourDigitYears.length - 1], 10);
      return new Date(endYear, 3, 1);
    }
  }

  if (cleanStr.toUpperCase().includes('FY') || /\d{2,4}-\d{2,4}/.test(cleanStr)) {
    const match2 = cleanStr.match(/FY\s*(\d{2})/i) || cleanStr.match(/(\d{2})-\d{2}/);
    if (match2) {
      const year = parseInt('20' + match2[1], 10);
      return new Date(year, 3, 1); // 1st April of Fiscal Year
    }
  }

  if (cleanStr.includes(' - ')) {
    const parts = cleanStr.split(' - ');
    return parseSingleBillMonth(parts[1]) || parseSingleBillMonth(parts[0]);
  }
  if (cleanStr.includes(' to ')) {
    const parts = cleanStr.split(' to ');
    return parseSingleBillMonth(parts[1]) || parseSingleBillMonth(parts[0]);
  }
  return parseSingleBillMonth(cleanStr);
}

export interface MonthRange {
  start: Date;
  end: Date;
  startLabel: string;
  endLabel: string;
  count: number;
}

export function parseBillMonthRange(billMonthStr?: string | null): MonthRange | null {
  if (!billMonthStr) return null;
  const cleanStr = billMonthStr.replace(/\s+/g, ' ').trim();
  let startStr = cleanStr;
  let endStr = cleanStr;
  if (cleanStr.includes(' - ')) {
    const parts = cleanStr.split(' - ');
    startStr = parts[0];
    endStr = parts[1];
  } else if (cleanStr.includes(' to ')) {
    const parts = cleanStr.split(' to ');
    startStr = parts[0];
    endStr = parts[1];
  }
  const startDate = parseSingleBillMonth(startStr);
  const endDate = parseSingleBillMonth(endStr);
  if (!startDate || !endDate) return null;

  const monthsDiff =
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth() - startDate.getMonth()) +
    1;
  return {
    start: startDate,
    end: endDate,
    startLabel: `${startDate.toLocaleString('default', { month: 'long' })} ${startDate.getFullYear()}`,
    endLabel: `${endDate.toLocaleString('default', { month: 'long' })} ${endDate.getFullYear()}`,
    count: Math.max(1, monthsDiff)
  };
}

/**
 * Dropdown limit: strictly includes only 2 earlier paid months (pastCount = 2)
 * as committed in 8172810.
 */
export function getBillingMonthOptions(
  baseDate: Date | number = new Date(),
  pastCount = 2,
  futureCount = 12
): string[] {
  let anchor = new Date();
  let past = pastCount;
  let future = futureCount;

  if (typeof baseDate === 'number') {
    past = baseDate;
    future = typeof pastCount === 'number' ? pastCount : 12;
    anchor = new Date();
  } else if (baseDate instanceof Date && !isNaN(baseDate.getTime())) {
    anchor = baseDate;
  }

  const options: string[] = [];
  for (let i = -past; i <= future; i++) {
    const d = new Date(anchor.getFullYear(), anchor.getMonth() + i, 1);
    const monthStr = d.toLocaleString('default', { month: 'long' });
    const yearStr = d.getFullYear();
    options.push(`${monthStr} ${yearStr}`);
  }
  return options;
}
