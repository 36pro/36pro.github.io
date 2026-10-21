import './ui/styles.css';
import { appStore } from './ui/state';
import { renderNavbar, attachNavbarEvents } from './ui/components/Navbar';
import { renderToastContainer } from './ui/components/ToastContainer';
import { renderLandingView, attachLandingEvents } from './ui/components/LandingView';
import { renderDashboardView, attachDashboardEvents } from './ui/components/DashboardView';
import { renderDatabaseView, attachDatabaseEvents } from './ui/components/DatabaseView';
import { renderAnalyticsView } from './ui/components/AnalyticsView';
import { renderPaymentModal, attachPaymentModalEvents } from './ui/components/PaymentModal';
import { renderEditModal, attachEditModalEvents } from './ui/components/EditModal';

function renderApp(): void {
  const root = document.getElementById('app');
  if (!root) return;

  const activeTab = appStore.getActiveTab();

  let viewHtml = '';
  if (activeTab === 'dashboard') {
    viewHtml = renderDashboardView();
  } else if (activeTab === 'database') {
    viewHtml = renderDatabaseView();
  } else if (activeTab === 'analytics') {
    viewHtml = renderAnalyticsView();
  } else {
    viewHtml = renderLandingView();
  }

  root.innerHTML = `
    ${renderNavbar()}
    <main class="appMain" id="mainContent">
      ${viewHtml}
    </main>
    ${renderPaymentModal()}
    ${renderEditModal()}
    ${renderToastContainer()}
  `;

  // Attach event handlers
  attachNavbarEvents(root);

  if (activeTab === 'dashboard') {
    attachDashboardEvents(root);
  } else if (activeTab === 'database') {
    attachDatabaseEvents(root);
  } else {
    attachLandingEvents(root);
  }

  attachPaymentModalEvents(root);
  attachEditModalEvents(root);
}

// Subscribe to store updates
appStore.subscribe(() => {
  renderApp();
});

// Bootstrap
window.addEventListener('DOMContentLoaded', () => {
  appStore.loadInitialData().then(() => {
    renderApp();
  });
});
