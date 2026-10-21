import { appStore } from '../state';
import { BILL_DEFINITIONS, UtilityDefinition } from '../../core/contracts/utility';
import { calculateNextDue } from '../../core/domain/due-dates';
import { formatDateFriendly } from '../../core/domain/bill-month';
import { parsePaymentRecord } from '../../core/domain/fee-splitting';
import { getStatusStyles } from '../tokens';

export function renderLandingView(): string {
  const payments = appStore.getPayments();
  const gymPaused = appStore.isGymPaused();
  const matuailRate = appStore.getMatuailRate();

  const categories = [
    {
      title: 'Electricity & Power',
      description: 'DESCO Prepaid Smart Meters & BREB Palli Bidyut Postpaid',
      billIds: ['rupnagarDesco', 'uttaraDesco', 'noakhaliPalli']
    },
    {
      title: 'Gas & Thermal Energy',
      description: 'Prepaid Cylinder Meters & Titas Gas Postpaid Dual-Unit Range',
      billIds: ['rupnagarGas', 'matuailGas']
    },
    {
      title: 'Water Supply',
      description: 'Dhaka WASA Uttara Revenue Circle',
      billIds: ['uttaraWater']
    },
    {
      title: 'Connectivity, Fitness & Municipal Tax',
      description: 'Inspire Broadband, 20th Gym Cycles & Bangladeshi Land Revenue',
      billIds: ['inspireBroadband', 'gym', 'landTax']
    }
  ];

  return `
    <div class="landingViewContainer">
      <div class="heroSection">
        <div class="heroContent">
          <div class="heroBadge">
            <span class="liveDot"></span>
            <span>SYSTEM ACTIVE • DHAKA UTILITY NETWORK</span>
          </div>
          <h1 class="heroTitle">Dhaka Utility & Subscription Hub</h1>
          <p class="heroSubtitle">
            Unified billing intelligence, tiered delay fine tracking, 20th gym cycle overlap prevention, and Bangladeshi fiscal year automation.
          </p>
        </div>
      </div>

      <div class="categoriesGrid">
        ${categories
          .map(
            cat => `
          <section class="categorySection">
            <div class="categoryHeader">
              <h2 class="categoryTitle">${cat.title}</h2>
              <p class="categoryDesc">${cat.description}</p>
            </div>

            <div class="cardsGrid">
              ${cat.billIds
                .map(billId => {
                  const bill = BILL_DEFINITIONS[billId as keyof typeof BILL_DEFINITIONS];
                  if (!bill) return '';

                  const dueInfo = calculateNextDue(billId, payments, {
                    gymPaused,
                    matuailRate
                  });
                  const statusStyles = getStatusStyles(dueInfo.statusClass);

                  const billPayments = payments.filter(p => p.billId === billId);
                  const lastPayment = billPayments[0] ? parsePaymentRecord(billPayments[0]) : null;

                  return renderUtilityCard(bill, dueInfo, lastPayment, statusStyles);
                })
                .join('')}
            </div>
          </section>
        `
          )
          .join('')}
      </div>
    </div>
  `;
}

function renderUtilityCard(
  bill: UtilityDefinition,
  dueInfo: ReturnType<typeof calculateNextDue>,
  lastPayment: ReturnType<typeof parsePaymentRecord> | null,
  statusStyles: ReturnType<typeof getStatusStyles>
): string {
  const isGym = bill.id === 'gym';
  const isPaused = isGym && appStore.isGymPaused();

  let lastPaidLine = '-';
  if (lastPayment) {
    const feeBadge = lastPayment.hasFee
      ? `<span class="cardFeeBadge">+${lastPayment.fee} fee</span>`
      : '';
    lastPaidLine = `
      <div class="lastPaidAmount">
        <span>৳ ${lastPayment.baseAmount.toLocaleString()}</span>
        ${feeBadge}
      </div>
      <div class="lastPaidMeta">
        <span>${formatDateFriendly(lastPayment.payDate)}</span>
        ${lastPayment.billMonth ? `• <span class="cardMonthTag">${lastPayment.billMonth}</span>` : ''}
      </div>
    `;
  }

  return `
    <article class="utilityCard" data-bill-id="${bill.id}">
      <div class="cardHeader">
        <div class="cardMeta">
          <span class="cardBadge cardType-${bill.type}">${bill.type.toUpperCase()}</span>
          ${bill.location ? `<span class="cardLocation">${bill.location}</span>` : ''}
        </div>
        <div class="cardStatusBadge" style="color:${statusStyles.color}; background:${statusStyles.bg}; border-color:${statusStyles.borderColor};">
          <span class="statusDot" style="background:${statusStyles.color};"></span>
          <span>${dueInfo.dueText}</span>
        </div>
      </div>

      <div class="cardBody">
        <h3 class="cardTitle">${bill.name}</h3>
        <div class="accountNumberRow">
          <span class="accountLabel">A/C:</span>
          <code class="accountCode">${bill.account}</code>
        </div>

        <div class="lastPaymentBlock">
          <div class="blockLabel">Last Recorded Payment</div>
          ${lastPaidLine}
        </div>
      </div>

      <div class="cardFooter">
        <button class="payNowBtn primaryTouchTarget" data-open-bill="${bill.id}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Record Payment</span>
        </button>

        ${
          bill.portalUrl
            ? `
          <a href="${bill.portalUrl}" target="_blank" rel="noopener noreferrer" class="portalBtn" title="${bill.portalLabel || 'Portal'}">
            <span>Portal</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>
        `
            : ''
        }

        ${
          isGym
            ? `
          <button class="gymPauseToggleBtn ${isPaused ? 'isPaused' : ''}" id="gymPauseToggleBtn" title="${isPaused ? 'Resume Gym' : 'Pause Gym'}">
            ${isPaused ? '▶️ Resume' : '🔒 Pause'}
          </button>
        `
            : ''
        }
      </div>
    </article>
  `;
}

export function attachLandingEvents(root: HTMLElement): void {
  root.querySelectorAll('[data-open-bill]').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      const billId = (el as HTMLElement).dataset.openBill;
      if (billId) {
        appStore.openBillModal(billId);
      }
    });
  });

  const pauseBtn = root.querySelector('#gymPauseToggleBtn');
  if (pauseBtn) {
    pauseBtn.addEventListener('click', e => {
      e.stopPropagation();
      appStore.toggleGymPause();
    });
  }
}
