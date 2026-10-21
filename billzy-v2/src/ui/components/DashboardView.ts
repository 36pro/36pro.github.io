import { appStore } from '../state';
import { BILL_DEFINITIONS } from '../../core/contracts/utility';
import { calculateNextDue } from '../../core/domain/due-dates';
import { parsePaymentRecord } from '../../core/domain/fee-splitting';
import { formatDateFriendly } from '../../core/domain/bill-month';
import { getStatusStyles } from '../tokens';

export function renderDashboardView(): string {
  const payments = appStore.getPayments();
  const gymPaused = appStore.isGymPaused();
  const matuailRate = appStore.getMatuailRate();

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  let totalAllTimeBase = 0;
  let totalAllTimeFees = 0;
  let currentMonthBase = 0;
  let currentMonthFees = 0;

  const categorySpend: Record<string, number> = {
    electric: 0,
    gas: 0,
    water: 0,
    internet: 0,
    gym: 0,
    tax: 0
  };

  payments.forEach(rawP => {
    const p = parsePaymentRecord(rawP);
    totalAllTimeBase += p.baseAmount;
    totalAllTimeFees += p.feeNum;

    if (p.payDate && p.payDate.startsWith(currentMonthStr)) {
      currentMonthBase += p.baseAmount;
      currentMonthFees += p.feeNum;
    }

    const cat = p.utilityCategory || 'electric';
    if (categorySpend[cat] !== undefined) {
      categorySpend[cat] += p.total;
    } else {
      categorySpend[cat] = p.total;
    }
  });

  // Calculate overdue & due soon counts across all utilities
  let overdueCount = 0;
  let dueSoonCount = 0;
  const scheduleRows = Object.values(BILL_DEFINITIONS).map(bill => {
    const dueInfo = calculateNextDue(bill.id, payments, {
      gymPaused,
      matuailRate
    });

    if (dueInfo.isOverdue) overdueCount++;
    if (dueInfo.isDueSoon) dueSoonCount++;

    const billPayments = payments.filter(p => p.billId === bill.id);
    const lastPayment = billPayments[0] ? parsePaymentRecord(billPayments[0]) : null;

    return {
      bill,
      dueInfo,
      lastPayment
    };
  });

  return `
    <div class="dashboardViewContainer">
      <div class="metricsGrid">
        <div class="metricCard">
          <div class="metricHeader">
            <span class="metricLabel">This Month's Payments</span>
            <span class="metricPill activePill">Current</span>
          </div>
          <div class="metricValue">৳ ${(currentMonthBase + currentMonthFees).toLocaleString()}</div>
          <div class="metricSubtext">
            Base: ৳ ${currentMonthBase.toLocaleString()} • Fees: ৳ ${currentMonthFees.toLocaleString()}
          </div>
        </div>

        <div class="metricCard">
          <div class="metricHeader">
            <span class="metricLabel">All-Time Recorded Spend</span>
            <span class="metricPill">${payments.length} Records</span>
          </div>
          <div class="metricValue">৳ ${(totalAllTimeBase + totalAllTimeFees).toLocaleString()}</div>
          <div class="metricSubtext">
            Base: ৳ ${totalAllTimeBase.toLocaleString()} • Surcharges: ৳ ${totalAllTimeFees.toLocaleString()}
          </div>
        </div>

        <div class="metricCard ${overdueCount > 0 ? 'metricAlert' : ''}">
          <div class="metricHeader">
            <span class="metricLabel">Action Items</span>
            <span class="metricPill ${overdueCount > 0 ? 'overduePill' : 'activePill'}">
              ${overdueCount > 0 ? `${overdueCount} Overdue` : 'All Clean'}
            </span>
          </div>
          <div class="metricValue">${overdueCount + dueSoonCount} Bills</div>
          <div class="metricSubtext">
            ${overdueCount} Overdue • ${dueSoonCount} Due within 5 days
          </div>
        </div>

        <div class="metricCard">
          <div class="metricHeader">
            <span class="metricLabel">Active Utilities</span>
            <span class="metricPill activePill">9 Tracked</span>
          </div>
          <div class="metricValue">6 Accounts</div>
          <div class="metricSubtext">
            3 Electric • 2 Gas • 1 Water • 3 Subs & Taxes
          </div>
        </div>
      </div>

      <div class="dashboardSectionsGrid">
        <section class="scheduleSection">
          <div class="sectionHeaderRow">
            <h2 class="sectionTitle">Upcoming & Active Utility Schedule</h2>
            <span class="sectionBadge">Auto-Calculated</span>
          </div>

          <div class="scheduleTableWrapper">
            <table class="scheduleTable">
              <thead>
                <tr>
                  <th>Utility</th>
                  <th>Type</th>
                  <th>Status / Due</th>
                  <th>Last Payment</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${scheduleRows
                  .map(row => {
                    const statusStyles = getStatusStyles(row.dueInfo.statusClass);
                    const lastAmt = row.lastPayment
                      ? `৳ ${row.lastPayment.baseAmount.toLocaleString()}`
                      : '-';
                    const lastDate = row.lastPayment
                      ? formatDateFriendly(row.lastPayment.payDate)
                      : '-';

                    return `
                    <tr>
                      <td class="cellUtility">
                        <div class="scheduleBillName">${row.bill.name}</div>
                        <div class="scheduleAccount">${row.bill.account}</div>
                      </td>
                      <td class="cellType">
                        <span class="cardBadge cardType-${row.bill.type}">${row.bill.type}</span>
                      </td>
                      <td class="cellStatus">
                        <span class="cardStatusBadge" style="color:${statusStyles.color}; background:${statusStyles.bg}; border-color:${statusStyles.borderColor};">
                          ${row.dueInfo.dueText}
                        </span>
                      </td>
                      <td class="cellLastPay">
                        <div class="lastPayAmount">${lastAmt}</div>
                        <div class="lastPayDate">${lastDate}</div>
                      </td>
                      <td class="cellAction">
                        <button class="smallPayBtn" data-open-bill="${row.bill.id}">Pay</button>
                      </td>
                    </tr>
                  `;
                  })
                  .join('')}
              </tbody>
            </table>
          </div>
        </section>

        <section class="breakdownSection">
          <div class="sectionHeaderRow">
            <h2 class="sectionTitle">Spend by Category</h2>
            <span class="sectionBadge">All-Time</span>
          </div>

          <div class="categorySpendList">
            ${[
              { key: 'electric', label: 'Electricity (DESCO & BREB)', color: '#00C2FF' },
              { key: 'gas', label: 'Gas (Rupnagar & Titas)', color: '#FF7A00' },
              { key: 'water', label: 'Water (Dhaka WASA)', color: '#00E676' },
              { key: 'internet', label: 'Broadband (Inspire)', color: '#A855F7' },
              { key: 'gym', label: 'Fitness Subscription', color: '#EC4899' },
              { key: 'tax', label: 'Land Revenue & Tax', color: '#F59E0B' }
            ]
              .map(item => {
                const totalAll = totalAllTimeBase + totalAllTimeFees || 1;
                const amt = categorySpend[item.key] || 0;
                const pct = Math.round((amt / totalAll) * 100);

                return `
                <div class="categorySpendItem">
                  <div class="spendLabelRow">
                    <span class="spendCategoryName" style="display:flex; align-items:center; gap:8px;">
                      <span class="categoryColorIndicator" style="background:${item.color};"></span>
                      ${item.label}
                    </span>
                    <span class="spendAmount">৳ ${amt.toLocaleString()} (${pct}%)</span>
                  </div>
                  <div class="spendProgressBarTrack">
                    <div class="spendProgressBarFill" style="width:${pct}%; background:${item.color};"></div>
                  </div>
                </div>
              `;
              })
              .join('')}
          </div>
        </section>
      </div>
    </div>
  `;
}

export function attachDashboardEvents(root: HTMLElement): void {
  root.querySelectorAll('[data-open-bill]').forEach(btn => {
    btn.addEventListener('click', () => {
      const billId = (btn as HTMLElement).dataset.openBill;
      if (billId) {
        appStore.openBillModal(billId);
      }
    });
  });
}
