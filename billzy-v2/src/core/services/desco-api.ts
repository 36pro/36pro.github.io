import { getSeason, getSeasonName } from '../domain/seasonal';
import { formatDateFriendly, formatLocalDate } from '../domain/bill-month';

export interface DescoBalanceData {
  accountNo?: string;
  balance: number;
  currentMonthConsumption?: number;
  readingTime?: string;
  meterNo?: string;
  [key: string]: unknown;
}

export interface DescoMonthlyRecord {
  month: string; // YYYY-MM
  customerName?: string;
  meterNo?: string;
  tariffSolution?: string;
  sanctionLoad?: number;
  consumedUnit: number;
  consumedTaka: number;
  maximumDemand?: number;
  [key: string]: unknown;
}

export interface DescoDailyRecord {
  date: string; // YYYY-MM-DD
  consumedUnit: number;
  [key: string]: unknown;
}

export interface DescoRechargeRecord {
  rechargeDate: string;
  totalAmount: number;
  energyAmount: number;
  VAT?: number;
  tokenNo?: string;
  meterNo?: string;
  [key: string]: unknown;
}

export interface DescoFullTelemetry {
  accountNo: string;
  balance: DescoBalanceData;
  monthly: DescoMonthlyRecord[];
  daily: DescoDailyRecord[];
  recharge: DescoRechargeRecord[];
  cachedAt: number;
}

export interface DescoComputedMetrics {
  balance: number;
  formattedBalance: string;
  isLowBalance: boolean;
  alertText: string;
  alertColor: string;
  readingTime: string;
  ownerName: string;
  meterNo: string;
  sanctionLoad: number;
  tariff: string;
  avgDailyUnits: number;
  avgDailyCost: number;
  daysRemaining: number;
  exhaustionDate: Date | null;
  exhaustionDateStr: string;
  fillPercent: number;
  seasonName: string;
  dailyUsage15: { date: string; units: number }[];
  lastRecharges: DescoRechargeRecord[];
  monthlyTrends: {
    labels: string[];
    currTaka: number[];
    prevTaka: number[];
    currUnit: number[];
    prevUnit: number[];
    maxDemand: number[];
  };
}

const BASE_URLS = [
  'https://prepaid.desco.org.bd/api/unified/customer',
  'https://prepaid.desco.org.bd/api/tkdes/customer'
];

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes TTL

/**
 * Robust fetch helper that attempts direct request first, then falls back to a CORS proxy if blocked.
 */
async function fetchWithCorsFallback(url: string): Promise<any> {
  try {
    const res = await fetch(url);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // If browser CORS blocks direct request, attempt via public CORS proxy
    try {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      const pRes = await fetch(proxyUrl);
      if (pRes.ok) {
        return await pRes.json();
      }
    } catch (proxyErr) {
      console.warn(`Fetch failed for ${url} directly and via proxy:`, err, proxyErr);
    }
  }
  return null;
}

/**
 * Retrieves cached telemetry from localStorage if valid within TTL.
 */
export function getCachedDescoTelemetry(accountNo: string): DescoFullTelemetry | null {
  if (typeof window === 'undefined') return null;
  const cleanAccountNo = accountNo.replace(/-/g, '');
  const key = `billzy_desco_cache_${cleanAccountNo}`;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DescoFullTelemetry;
    if (parsed && parsed.cachedAt && Date.now() - parsed.cachedAt < CACHE_TTL_MS) {
      return parsed;
    }
  } catch (e) {
    console.warn('Error reading Desco cache:', e);
  }
  return null;
}

/**
 * Saves telemetry to localStorage.
 */
export function setCachedDescoTelemetry(accountNo: string, data: DescoFullTelemetry): void {
  if (typeof window === 'undefined') return;
  const cleanAccountNo = accountNo.replace(/-/g, '');
  const key = `billzy_desco_cache_${cleanAccountNo}`;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('Error saving Desco cache:', e);
  }
}

/**
 * Fetches all live balance, 24-month consumption, daily reads, and recharge tokens from DESCO API.
 */
export async function fetchDESCOTelemetry(
  accountNo: string,
  forceRefresh = false
): Promise<DescoFullTelemetry> {
  const cleanAccountNo = accountNo.replace(/-/g, '');

  if (!forceRefresh) {
    const cached = getCachedDescoTelemetry(cleanAccountNo);
    if (cached) return cached;
  }

  const today = new Date();

  // 1. Monthly consumption date ranges (last 24 months)
  const monthTo1 = today.toISOString().slice(0, 7);
  const oneYearAgo = new Date(today.getFullYear(), today.getMonth() - 11, 1);
  const monthFrom1 = oneYearAgo.toISOString().slice(0, 7);

  const monthTo2 = new Date(today.getFullYear(), today.getMonth() - 12, 1).toISOString().slice(0, 7);
  const twoYearsAgo = new Date(today.getFullYear(), today.getMonth() - 23, 1);
  const monthFrom2 = twoYearsAgo.toISOString().slice(0, 7);

  // 2. Daily consumption date range (last 16 days to diff 15 days)
  const dateTo = today.toISOString().slice(0, 10);
  const sixteenDaysAgo = new Date(today.getTime() - 16 * 24 * 60 * 60 * 1000);
  const dateFrom = sixteenDaysAgo.toISOString().slice(0, 10);

  // 3. Recharge history (last 180 days)
  const rechargeDateFrom = new Date(today.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  for (const baseUrl of BASE_URLS) {
    const balanceUrl = `${baseUrl}/getBalance?accountNo=${cleanAccountNo}`;
    const balanceJson = await fetchWithCorsFallback(balanceUrl);

    if (balanceJson && balanceJson.code === 200 && balanceJson.data) {
      const [mRes1, mRes2, dRes, rRes] = await Promise.all([
        fetchWithCorsFallback(
          `${baseUrl}/getCustomerMonthlyConsumption?accountNo=${cleanAccountNo}&monthFrom=${monthFrom1}&monthTo=${monthTo1}`
        ),
        fetchWithCorsFallback(
          `${baseUrl}/getCustomerMonthlyConsumption?accountNo=${cleanAccountNo}&monthFrom=${monthFrom2}&monthTo=${monthTo2}`
        ),
        fetchWithCorsFallback(
          `${baseUrl}/getCustomerDailyConsumption?accountNo=${cleanAccountNo}&dateFrom=${dateFrom}&dateTo=${dateTo}`
        ),
        fetchWithCorsFallback(
          `${baseUrl}/getRechargeHistory?accountNo=${cleanAccountNo}&dateFrom=${rechargeDateFrom}&dateTo=${dateTo}`
        )
      ]);

      const monthly1 = mRes1 && mRes1.code === 200 && Array.isArray(mRes1.data) ? mRes1.data : [];
      const monthly2 = mRes2 && mRes2.code === 200 && Array.isArray(mRes2.data) ? mRes2.data : [];
      const daily = dRes && dRes.code === 200 && Array.isArray(dRes.data) ? dRes.data : [];
      const recharge = rRes && rRes.code === 200 && Array.isArray(rRes.data) ? rRes.data : [];

      const monthlyMap: Record<string, DescoMonthlyRecord> = {};
      [...monthly1, ...monthly2].forEach(m => {
        if (m.month) monthlyMap[m.month] = m;
      });
      const mergedMonthly = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));

      const telemetry: DescoFullTelemetry = {
        accountNo: cleanAccountNo,
        balance: balanceJson.data,
        monthly: mergedMonthly,
        daily,
        recharge,
        cachedAt: Date.now()
      };

      setCachedDescoTelemetry(cleanAccountNo, telemetry);
      return telemetry;
    }
  }

  // Fallback to cached even if expired
  const stale = getCachedDescoTelemetry(cleanAccountNo);
  if (stale) return stale;

  throw new Error(`Failed to retrieve live DESCO telemetry for account ${cleanAccountNo}`);
}

/**
 * Computes deep intelligence metrics from DESCO API response:
 * - 60% live daily reads + 40% 24-month seasonal history blend
 * - Burn rate efficiency & exhaustion date
 * - 15-day daily units, 12-month trends, YoY comparisons
 */
export function computeDescoMetrics(apiData: DescoFullTelemetry): DescoComputedMetrics {
  const balance = apiData.balance;
  const monthly = apiData.monthly || [];
  const daily = [...(apiData.daily || [])].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const recharge = apiData.recharge || [];

  const latestMonthInfo = monthly.length > 0 ? monthly[monthly.length - 1] : ({} as DescoMonthlyRecord);
  const ownerName = latestMonthInfo.customerName || 'DESCO Customer';
  const meterNo = balance.meterNo || latestMonthInfo.meterNo || 'N/A';
  const sanctionLoad = latestMonthInfo.sanctionLoad || 2;
  const tariff = latestMonthInfo.tariffSolution || 'LT-A';

  const avgUnitCost =
    latestMonthInfo.consumedUnit > 0
      ? latestMonthInfo.consumedTaka / latestMonthInfo.consumedUnit
      : 7.5;

  // 1. Process daily consumption
  const dailyUsage15: { date: string; units: number }[] = [];
  let totalDailyDiffUnits = 0;
  let validDiffCount = 0;

  for (let i = 1; i < daily.length; i++) {
    const diff = daily[i].consumedUnit - daily[i - 1].consumedUnit;
    if (diff >= 0 && diff < 100) {
      const parts = (daily[i].date || '').split('-');
      const label = parts.length >= 3 ? `${parts[1]}-${parts[2]}` : daily[i].date;
      dailyUsage15.push({
        date: label,
        units: Math.round(diff * 100) / 100
      });
      totalDailyDiffUnits += diff;
      validDiffCount++;
    }
  }

  const trimmedDaily15 = dailyUsage15.slice(-15);
  const recentDailyUnits = validDiffCount > 0 ? totalDailyDiffUnits / validDiffCount : 10;
  const recentDailyCost = recentDailyUnits * avgUnitCost;

  // 2. Seasonal Electricity Intelligence (Summer: Mar-Sep, Winter: Oct-Feb)
  const currentSeason = getSeason(new Date());
  const seasonName = getSeasonName(new Date());

  const seasonalMonthly = monthly.filter(m => {
    if (!m.month) return false;
    const parts = m.month.split('-');
    if (parts.length < 2) return false;
    const mIdx = parseInt(parts[1], 10) - 1;
    return currentSeason === 'summer' ? mIdx >= 2 && mIdx <= 8 : mIdx < 2 || mIdx >= 9;
  });

  let seasonTotalTaka = 0;
  let seasonTotalUnits = 0;
  let seasonMonthCount = 0;

  seasonalMonthly.forEach(m => {
    if (m.consumedTaka > 0 && m.consumedUnit > 0) {
      seasonTotalTaka += m.consumedTaka;
      seasonTotalUnits += m.consumedUnit;
      seasonMonthCount++;
    }
  });

  const seasonAvgDailyCost =
    seasonMonthCount > 0 ? seasonTotalTaka / seasonMonthCount / 30.416 : 0;
  const seasonAvgDailyUnits =
    seasonMonthCount > 0 ? seasonTotalUnits / seasonMonthCount / 30.416 : 0;

  // 3. 60/40 blend of recent daily meter reads + historical seasonal pattern
  const effectiveDailyCost =
    seasonAvgDailyCost > 0
      ? recentDailyCost * 0.6 + seasonAvgDailyCost * 0.4
      : recentDailyCost;
  const effectiveDailyUnits =
    seasonAvgDailyUnits > 0
      ? recentDailyUnits * 0.6 + seasonAvgDailyUnits * 0.4
      : recentDailyUnits;

  const rawBalance = balance.balance || 0;
  const daysRemaining = effectiveDailyCost > 0 ? rawBalance / effectiveDailyCost : 30;

  const exhaustionDate = new Date();
  exhaustionDate.setTime(Date.now() + daysRemaining * 24 * 60 * 60 * 1000);
  const exhaustionDateStr = formatDateFriendly(formatLocalDate(exhaustionDate));

  const isLowBalance = rawBalance < 300;
  let alertColor = '#00E676';
  let alertText = 'Healthy: Sufficient balance';

  if (daysRemaining <= 3 || isLowBalance) {
    alertColor = '#ff6368';
    alertText = 'Critical: Low balance, recharge immediately!';
  } else if (daysRemaining <= 7) {
    alertColor = '#ffe663';
    alertText = 'Warning: Recharge recommended soon';
  }

  const fillPercent = Math.min(100, Math.max(0, (daysRemaining / 15) * 100));

  // 4. YoY comparisons (last 12 months)
  const last12 = monthly.slice(-12);
  const mNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const labels: string[] = [];
  const currTaka: number[] = [];
  const prevTaka: number[] = [];
  const currUnit: number[] = [];
  const prevUnit: number[] = [];
  const maxDemand: number[] = [];

  last12.forEach(currItem => {
    const parts = (currItem.month || '').split('-');
    if (parts.length >= 2) {
      const year = parseInt(parts[0], 10);
      const monthIdx = parseInt(parts[1], 10) - 1;
      const label = `${mNames[monthIdx]} '${String(year).slice(-2)}`;
      labels.push(label);
      currTaka.push(Math.round(currItem.consumedTaka || 0));
      currUnit.push(Math.round(currItem.consumedUnit || 0));
      maxDemand.push(currItem.maximumDemand || 0);

      const prevMonthStr = `${year - 1}-${parts[1]}`;
      const prevItem = monthly.find(m => m.month === prevMonthStr);
      if (prevItem) {
        prevTaka.push(Math.round(prevItem.consumedTaka || 0));
        prevUnit.push(Math.round(prevItem.consumedUnit || 0));
      } else {
        prevTaka.push(0);
        prevUnit.push(0);
      }
    }
  });

  return {
    balance: rawBalance,
    formattedBalance: Math.round(rawBalance).toLocaleString(),
    isLowBalance,
    alertText,
    alertColor,
    readingTime: balance.readingTime ? balance.readingTime.split(' ')[0] : 'N/A',
    ownerName,
    meterNo,
    sanctionLoad,
    tariff,
    avgDailyUnits: Math.round(effectiveDailyUnits * 100) / 100,
    avgDailyCost: Math.round(effectiveDailyCost),
    daysRemaining: Math.round(daysRemaining * 10) / 10,
    exhaustionDate,
    exhaustionDateStr,
    fillPercent,
    seasonName,
    dailyUsage15: trimmedDaily15,
    lastRecharges: recharge.slice(0, 10),
    monthlyTrends: {
      labels,
      currTaka,
      prevTaka,
      currUnit,
      prevUnit,
      maxDemand
    }
  };
}

/**
 * Interactive LT-A Residential Tariff Calculator
 * Implements the exact stepped residential tiers for Dhaka electricity.
 */
export function calculateLtaTariff(units: number, demandKw = 2): {
  energyCost: number;
  demandCharge: number;
  meterRent: number;
  vat: number;
  total: number;
  steps: { name: string; units: number; rate: number; cost: number }[];
} {
  const steps: { name: string; units: number; rate: number; cost: number }[] = [];
  let remaining = Math.max(0, units);
  let energyCost = 0;

  if (units <= 50) {
    const c = units * 5.32;
    energyCost += c;
    steps.push({ name: 'Lifeline (0-50 units)', units, rate: 5.32, cost: c });
  } else {
    // Step 1: 0 - 75 units @ 6.18
    const u1 = Math.min(remaining, 75);
    const c1 = u1 * 6.18;
    energyCost += c1;
    steps.push({ name: 'Step 1 (0-75 units)', units: u1, rate: 6.18, cost: c1 });
    remaining -= u1;

    // Step 2: 76 - 200 units (125 units) @ 8.50
    if (remaining > 0) {
      const u2 = Math.min(remaining, 125);
      const c2 = u2 * 8.5;
      energyCost += c2;
      steps.push({ name: 'Step 2 (76-200 units)', units: u2, rate: 8.5, cost: c2 });
      remaining -= u2;
    }

    // Step 3: 201 - 300 units (100 units) @ 9.10
    if (remaining > 0) {
      const u3 = Math.min(remaining, 100);
      const c3 = u3 * 9.1;
      energyCost += c3;
      steps.push({ name: 'Step 3 (201-300 units)', units: u3, rate: 9.1, cost: c3 });
      remaining -= u3;
    }

    // Step 4: 301 - 400 units (100 units) @ 9.62
    if (remaining > 0) {
      const u4 = Math.min(remaining, 100);
      const c4 = u4 * 9.62;
      energyCost += c4;
      steps.push({ name: 'Step 4 (301-400 units)', units: u4, rate: 9.62, cost: c4 });
      remaining -= u4;
    }

    // Step 5: 401 - 600 units (200 units) @ 15.01
    if (remaining > 0) {
      const u5 = Math.min(remaining, 200);
      const c5 = u5 * 15.01;
      energyCost += c5;
      steps.push({ name: 'Step 5 (401-600 units)', units: u5, rate: 15.01, cost: c5 });
      remaining -= u5;
    }

    // Step 6: Above 600 units @ 17.35
    if (remaining > 0) {
      const c6 = remaining * 17.35;
      energyCost += c6;
      steps.push({ name: 'Step 6 (Above 600 units)', units: remaining, rate: 17.35, cost: c6 });
      remaining = 0;
    }
  }

  const demandCharge = demandKw * 42;
  const meterRent = 40;
  const subtotal = energyCost + demandCharge + meterRent;
  const vat = subtotal * 0.05;
  const total = Math.round(subtotal + vat);

  return {
    energyCost: Math.round(energyCost),
    demandCharge,
    meterRent,
    vat: Math.round(vat),
    total,
    steps
  };
}
