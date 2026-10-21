import { appStore } from '../state';
import { parsePaymentRecord } from '../../core/domain/fee-splitting';
import { formatDateFriendly, formatDateFriendlyShort, formatLandTaxDisplayMonth, formatShortMonth } from '../../core/domain/bill-month';
import { downloadPaymentsCSV } from '../../core/storage/csv-exporter';

export function renderDatabaseView(): string {
  const filtered = appStore.getFilteredPayments();

  let totalBaseSum = 0;
  let totalFeeSum = 0;

  filtered.forEach(rawP => {
    const p = parsePaymentRecord(rawP);
    totalBaseSum += p.baseAmount;
    totalFeeSum += p.feeNum;
  });

  return `
    <div class="databaseViewContainer">
      <div class="dbHeaderSection">
        <div class="dbTitleRow">
          <div>
            <h1 class="dbMainTitle">Payment Records & Historical Database</h1>
            <p class="dbSubtitle">Comprehensive audit trail with multi-filter sorting and BOM-compliant CSV exports</p>
          </div>
          <button id="dbExportBtn" class="primaryTouchTarget exportActionBtn" title="Export CSV Backup">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Export CSV</span>
          </button>
        </div>

        <div class="dbFilterBar">
          <div class="filterSearchBox">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              id="dbSearchInput"
              class="dbSearchInput"
              placeholder="Search by bill, note, date, amount..."
              value="${appStore.searchQuery}"
            />
          </div>

          <div class="filterDropdowns">
            <select id="dbBillSelect" class="dbSelect">
              <option value="All Bills" ${appStore.billFilter === 'All Bills' ? 'selected' : ''}>All Utilities</option>
              <option value="Rupnagar DESCO" ${appStore.billFilter === 'Rupnagar DESCO' ? 'selected' : ''}>Rupnagar DESCO</option>
              <option value="Uttara DESCO" ${appStore.billFilter === 'Uttara DESCO' ? 'selected' : ''}>Uttara DESCO</option>
              <option value="Rupnagar Gas" ${appStore.billFilter === 'Rupnagar Gas' ? 'selected' : ''}>Rupnagar Gas</option>
              <option value="Uttara Water" ${appStore.billFilter === 'Uttara Water' ? 'selected' : ''}>Uttara Water</option>
              <option value="Matuail Gas" ${appStore.billFilter === 'Matuail Gas' ? 'selected' : ''}>Matuail Gas</option>
              <option value="Noakhali Palli" ${appStore.billFilter === 'Noakhali Palli' ? 'selected' : ''}>Noakhali Palli</option>
              <option value="Inspire Broadband" ${appStore.billFilter === 'Inspire Broadband' ? 'selected' : ''}>Inspire Broadband</option>
              <option value="Gym" ${appStore.billFilter === 'Gym' ? 'selected' : ''}>Gym</option>
              <option value="Land Tax" ${appStore.billFilter === 'Land Tax' ? 'selected' : ''}>Land Tax</option>
            </select>

            <select id="dbTypeSelect" class="dbSelect">
              <option value="All Types" ${appStore.typeFilter === 'All Types' ? 'selected' : ''}>All Types</option>
              <option value="prepaid" ${appStore.typeFilter === 'prepaid' ? 'selected' : ''}>Prepaid</option>
              <option value="postpaid" ${appStore.typeFilter === 'postpaid' ? 'selected' : ''}>Postpaid</option>
            </select>

            <input
              type="month"
              id="dbMonthInput"
              class="dbMonthInput"
              value="${appStore.monthFilter}"
              title="Filter by payment month"
            />

            <button id="dbResetFiltersBtn" class="dbResetBtn" title="Reset all filters">
              Clear
            </button>
          </div>
        </div>

        <div class="dbSummaryBar">
          <div class="summaryPill">Showing <strong>${filtered.length}</strong> records</div>
          <div class="summaryPill">Base: <strong>৳ ${totalBaseSum.toLocaleString()}</strong></div>
          ${
            totalFeeSum > 0
              ? `<div class="summaryPill feePill">Fees: <strong>৳ ${totalFeeSum.toLocaleString()}</strong></div>`
              : ''
          }
          <div class="summaryPill totalPill">Total: <strong>৳ ${(totalBaseSum + totalFeeSum).toLocaleString()}</strong></div>
        </div>
      </div>

      <div class="dbTableContainer">
        <div class="dbTableResponsive">
          <div class="dbTableHeaderRow">
            <div class="colDate">Date</div>
            <div class="colBill">Utility</div>
            <div class="colType">Type</div>
            <div class="colAmount">Amount</div>
            <div class="colMonth">Billing Cycle</div>
            <div class="colNote">Note / Receipt</div>
            <div class="colActions">Action</div>
          </div>

          <div class="dbTableBody">
            ${
              filtered.length === 0
                ? `
              <div class="dbEmptyState">
                <div class="emptyIcon">🔍</div>
                <h3>No payments match your filter criteria</h3>
                <p>Try clearing your search query or selecting "All Utilities".</p>
                <button class="primaryTouchTarget resetPromptBtn" id="emptyResetBtn">Reset Filters</button>
              </div>
            `
                : filtered
                    .map(rawP => {
                      const p = parsePaymentRecord(rawP);
                      const isLandTax = p.billId === 'landTax';

                      // Date formatting (stacked on mobile)
                      const parts = p.payDate.split('-');
                      const dayMonth = parts.length === 3 ? `${parts[2]}/${parts[1]}` : p.payDate;
                      const year = parts[0] || '';

                      // Month formatting
                      const desktopMonth = isLandTax
                        ? formatLandTaxDisplayMonth(p.billMonth, false)
                        : p.billMonth || '-';
                      const mobileMonth = isLandTax
                        ? formatLandTaxDisplayMonth(p.billMonth, true)
                        : formatShortMonth(p.billMonth);

                      // Note & Receipt HTML
                      let noteHtml = '-';
                      if (p.property) {
                        noteHtml = `<span class="propertyBadge bnFont">${p.property}</span>`;
                        if (p.receiptUrl) {
                          const href = p.receiptUrl.startsWith('http') ? p.receiptUrl : `https://${p.receiptUrl}`;
                          noteHtml += `<div><a href="${href}" target="_blank" rel="noopener noreferrer" class="receiptPillLink">🔗 Receipt ↗</a></div>`;
                        }
                      } else if (p.receiptUrl) {
                        const href = p.receiptUrl.startsWith('http') ? p.receiptUrl : `https://${p.receiptUrl}`;
                        noteHtml = `<a href="${href}" target="_blank" rel="noopener noreferrer" class="receiptPillLink">🔗 Receipt ↗</a>`;
                      } else if (p.note) {
                        noteHtml = `<span class="noteText">${p.note}</span>`;
                      }

                      return `
                    <div class="dbRow" data-record-uid="${p.uid}">
                      <div class="colDate">
                        <span class="desktopOnly">${formatDateFriendly(p.payDate)}</span>
                        <span class="mobileOnly mobileDateStack">
                          <span class="mobileDayMonth">${dayMonth}</span>
                          <span class="mobileYear">${year}</span>
                        </span>
                      </div>

                      <div class="colBill">
                        <div class="billTitle">${p.billName}</div>
                      </div>

                      <div class="colType">
                        <span class="cardBadge cardType-${p.billType}">${p.billType}</span>
                      </div>

                      <div class="colAmount">
                        <div class="amountVal">৳ ${p.baseAmount.toLocaleString()}</div>
                        ${
                          p.hasFee
                            ? `<div class="surchargeTag">+${p.fee} fee</div>`
                            : ''
                        }
                      </div>

                      <div class="colMonth">
                        <span class="desktopOnly">${desktopMonth}</span>
                        <span class="mobileOnly">${mobileMonth}</span>
                      </div>

                      <div class="colNote">${noteHtml}</div>

                      <div class="colActions">
                        <button class="rowActionBtn editRowBtn" data-edit-uid="${p.uid}" title="Edit Record">
                          Edit
                        </button>
                        <button class="rowActionBtn deleteRowBtn" data-delete-uid="${p.uid}" title="Delete Record">
                          ✕
                        </button>
                      </div>
                    </div>
                  `;
                    })
                    .join('')
            }
          </div>
        </div>
      </div>
    </div>
  `;
}

export function attachDatabaseEvents(root: HTMLElement): void {
  const searchInput = root.querySelector('#dbSearchInput') as HTMLInputElement | null;
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      appStore.setSearchQuery(searchInput.value);
    });
  }

  const billSelect = root.querySelector('#dbBillSelect') as HTMLSelectElement | null;
  if (billSelect) {
    billSelect.addEventListener('change', () => {
      appStore.setBillFilter(billSelect.value);
    });
  }

  const typeSelect = root.querySelector('#dbTypeSelect') as HTMLSelectElement | null;
  if (typeSelect) {
    typeSelect.addEventListener('change', () => {
      appStore.setTypeFilter(typeSelect.value);
    });
  }

  const monthInput = root.querySelector('#dbMonthInput') as HTMLInputElement | null;
  if (monthInput) {
    monthInput.addEventListener('change', () => {
      appStore.setMonthFilter(monthInput.value);
    });
  }

  const resetBtn = root.querySelector('#dbResetFiltersBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      appStore.resetFilters();
    });
  }

  const emptyResetBtn = root.querySelector('#emptyResetBtn');
  if (emptyResetBtn) {
    emptyResetBtn.addEventListener('click', () => {
      appStore.resetFilters();
    });
  }

  const exportBtn = root.querySelector('#dbExportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      downloadPaymentsCSV(appStore.getFilteredPayments());
      appStore.showToast(`Exported ${appStore.getFilteredPayments().length} records to CSV!`);
    });
  }

  root.querySelectorAll('[data-edit-uid]').forEach(btn => {
    btn.addEventListener('click', () => {
      const uid = (btn as HTMLElement).dataset.editUid;
      if (uid) {
        appStore.openEditModal(uid);
      }
    });
  });

  root.querySelectorAll('[data-delete-uid]').forEach(btn => {
    btn.addEventListener('click', () => {
      const uid = (btn as HTMLElement).dataset.deleteUid;
      if (uid) {
        appStore.deletePayment(uid);
      }
    });
  });
}
