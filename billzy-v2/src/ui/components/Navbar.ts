import { appStore, AppTab } from '../state';
import { downloadPaymentsCSV } from '../../core/storage/csv-exporter';

export function renderNavbar(): string {
  const currentTab = appStore.getActiveTab();
  const payments = appStore.getPayments();

  return `
    <header class="appHeader">
      <div class="headerContainer">
        <div class="brandBlock" onclick="window.location.hash='#home'" style="cursor:pointer;">
          <div class="brandLogo">
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
              <path d="M16 3L28 9.5V22.5L16 29L4 22.5V9.5L16 3Z" stroke="#00E676" stroke-width="2.5" stroke-linejoin="round"/>
              <path d="M16 11L22 14.5V21.5L16 25L10 21.5V14.5L16 11Z" fill="url(#brandGrad)" />
              <defs>
                <linearGradient id="brandGrad" x1="10" y1="11" x2="22" y2="25" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#00E676"/>
                  <stop offset="1" stop-color="#00C2FF"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div class="brandText">
            <span class="brandTitle">BILLZY</span>
            <span class="brandSubtitle">DHAKA UTILITY HQ</span>
          </div>
        </div>

        <nav class="navPills" aria-label="Main Navigation">
          <button class="navPill ${currentTab === 'home' ? 'active' : ''}" data-tab="home">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
              <rect x="14" y="3" width="7" height="7" rx="1.5"></rect>
              <rect x="14" y="14" width="7" height="7" rx="1.5"></rect>
              <rect x="3" y="14" width="7" height="7" rx="1.5"></rect>
            </svg>
            <span>Utilities</span>
          </button>

          <button class="navPill ${currentTab === 'dashboard' ? 'active' : ''}" data-tab="dashboard">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 3v18h18"></path>
              <path d="m19 9-5 5-4-4-3 3"></path>
            </svg>
            <span>Dashboard</span>
          </button>

          <button class="navPill ${currentTab === 'database' ? 'active' : ''}" data-tab="database">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2C6.5 2 2 3.8 2 6v12c0 2.2 4.5 4 10 4s10-1.8 10-4V6c0-2.2-4.5-4-10-4z"></path>
              <path d="M2 12c0 2.2 4.5 4 10 4s10-1.8 10-4"></path>
              <path d="M2 17c0 2.2 4.5 4 10 4s10-1.8 10-4"></path>
            </svg>
            <span>Database</span>
            <span class="badgeCount">${payments.length}</span>
          </button>

          <button class="navPill ${currentTab === 'analytics' ? 'active' : ''}" data-tab="analytics">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 6v6l4 2"></path>
            </svg>
            <span>Analytics</span>
          </button>
        </nav>

        <div class="headerActions">
          <button id="quickExportBtn" class="actionBtn exportBtn" title="Export CSV Backup">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span class="btnText">Export CSV</span>
          </button>
        </div>
      </div>
    </header>
  `;
}

export function attachNavbarEvents(root: HTMLElement): void {
  root.querySelectorAll('.navPill').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = (btn as HTMLElement).dataset.tab as AppTab;
      if (tab) {
        appStore.setActiveTab(tab);
      }
    });
  });

  const exportBtn = root.querySelector('#quickExportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      downloadPaymentsCSV(appStore.getPayments());
      appStore.showToast(`Exported ${appStore.getPayments().length} records to CSV!`);
    });
  }
}
