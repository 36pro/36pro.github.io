import { appStore } from '../state';
import { BILL_DEFINITIONS } from '../../core/contracts/utility';
import { getBillingMonthOptions, formatLocalDate } from '../../core/domain/bill-month';
import { getGymNextCycle, calculateGymSplit } from '../../core/domain/gym-cycle';
import { getLandTaxNextCycle, LAND_TAX_PROPERTIES } from '../../core/domain/land-tax';
import { calculateTitasGasDue, getMatuailGasDueInfo } from '../../core/domain/titas-gas';
import { storageAdapter } from '../../core/storage/local-adapter';

export function renderPaymentModal(): string {
  const billId = appStore.getSelectedBillId();
  if (!billId) return '';

  const bill = BILL_DEFINITIONS[billId as keyof typeof BILL_DEFINITIONS];
  if (!bill) return '';

  const payments = appStore.getPayments();
  const todayStr = formatLocalDate(new Date());

  const billPayments = payments.filter(p => p.billId === billId);
  const lastPayment = billPayments[0];

  let specificFormHtml = '';

  if (bill.id === 'gym') {
    const cycle1 = getGymNextCycle(billPayments, 1);
    specificFormHtml = `
      <div class="formRow">
        <label class="formLabel">Duration (Months)</label>
        <select id="gymDurationSelect" class="formSelect">
          <option value="1" selected>1 Month</option>
          <option value="2">2 Months</option>
          <option value="3">3 Months</option>
          <option value="6">6 Months</option>
          <option value="12">12 Months (Annual)</option>
        </select>
      </div>

      <div class="cyclePreviewCard">
        <div class="cycleHeader">
          <span class="cycleLabel">Billing Coverage (20th to 20th)</span>
          <span id="gymDueDateBadge" class="cycleBadge">Due: ${cycle1.dueLabel}</span>
        </div>
        <div id="gymCycleRangeText" class="cycleRange">${cycle1.rangeLabel}</div>
        <div class="splitRow">
          <span>Monthly Rate Split:</span>
          <strong id="gymMonthlySplitText">৳ 1,700 / mo</strong>
        </div>
      </div>
    `;
  } else if (bill.id === 'landTax') {
    const defaultProp = LAND_TAX_PROPERTIES[0];
    const defaultRate = storageAdapter.getLandTaxRate('matuail');
    const cycle = getLandTaxNextCycle(billPayments, defaultProp.name, 1);

    specificFormHtml = `
      <div class="formRow">
        <label class="formLabel">Select Property</label>
        <select id="landTaxPropSelect" class="formSelect bnFont">
          ${LAND_TAX_PROPERTIES.map(
            p => `<option value="${p.name}">${p.name} (৳ ${storageAdapter.getLandTaxRate(p.key)})</option>`
          ).join('')}
        </select>
      </div>

      <div class="formRow">
        <label class="formLabel">Duration (Years)</label>
        <select id="landTaxDurationSelect" class="formSelect">
          <option value="1" selected>1 Year</option>
          <option value="2">2 Years</option>
          <option value="3">3 Years</option>
          <option value="4">4 Years</option>
          <option value="5">5 Years</option>
        </select>
      </div>

      <div class="cyclePreviewCard">
        <div class="cycleHeader">
          <span class="cycleLabel">Fiscal Year (Apr 1 - Mar 31)</span>
          <span id="landTaxDueDateBadge" class="cycleBadge">Due: ${cycle.dueLabel}</span>
        </div>
        <div id="landTaxRangeText" class="cycleRange">${cycle.displayRange}</div>
      </div>

      <div class="formRow">
        <label class="formLabel">Receipt URL / Link (Optional)</label>
        <input type="url" id="landTaxReceiptUrl" class="formInput" placeholder="https://..." />
      </div>
    `;
  } else if (bill.id === 'matuailGas') {
    const rate = appStore.getMatuailRate();
    const monthOptions = getBillingMonthOptions(new Date(), 2, 12);
    const gasDue = getMatuailGasDueInfo(lastPayment, rate, new Date());

    specificFormHtml = `
      <div class="formRow">
        <label class="formLabel">Monthly Fixed Rate (BDT)</label>
        <input type="number" id="matuailRateInput" class="formInput" value="${rate}" />
      </div>

      <div class="formRowSplit">
        <div class="formRow">
          <label class="formLabel">From Month</label>
          <select id="matuailFromSelect" class="formSelect">
            ${monthOptions.map(m => `<option value="${m}">${m}</option>`).join('')}
          </select>
        </div>
        <div class="formRow">
          <label class="formLabel">To Month</label>
          <select id="matuailToSelect" class="formSelect">
            ${monthOptions.map(m => `<option value="${m}">${m}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="titasDueBanner" id="matuailDueBanner">
        <div class="bannerTitle">Current Status: ${gasDue.paidTill}</div>
        <div class="bannerSub">${gasDue.dueText}</div>
        <div class="bannerCalcNote">Delay fine: 10 Tk ($\le$ 6m) / 20 Tk ($>$ 6m) after the 21st</div>
      </div>
    `;
  } else if (bill.formType === 'postpaid' || bill.id === 'inspireBroadband') {
    const monthOptions = getBillingMonthOptions(new Date(), 2, 12);
    specificFormHtml = `
      <div class="formRow">
        <label class="formLabel">Billing Month</label>
        <select id="postpaidMonthSelect" class="formSelect">
          ${monthOptions.map(m => `<option value="${m}">${m}</option>`).join('')}
        </select>
      </div>
    `;
  }

  const defaultAmt = bill.defaultRate || (lastPayment ? lastPayment.amount : '');

  return `
    <div class="modalOverlay" id="paymentModalOverlay" role="dialog" aria-modal="true">
      <div class="modalContainer">
        <div class="modalHeader">
          <div class="modalTitleBlock">
            <h2 class="modalTitle">Record Payment: ${bill.name}</h2>
            <div class="modalAccountBadge">Account: <code>${bill.account}</code></div>
          </div>
          <button class="modalCloseBtn primaryTouchTarget" id="closePaymentModalBtn" aria-label="Close Modal">✕</button>
        </div>

        <form id="paymentEntryForm" class="modalForm">
          <div class="formRow">
            <label class="formLabel" for="paymentAmountInput">Payment Amount (BDT) *</label>
            <input
              type="number"
              id="paymentAmountInput"
              class="formInput amountHighlight"
              placeholder="e.g. 1500"
              value="${defaultAmt}"
              required
              min="1"
              step="any"
            />
          </div>

          <div class="formRow">
            <label class="formLabel" for="paymentFeeInput">Gateway Surcharge / Fine (BDT)</label>
            <input
              type="number"
              id="paymentFeeInput"
              class="formInput"
              placeholder="0 (or auto-split on recharge)"
              min="0"
              step="any"
            />
          </div>

          <div class="formRow">
            <label class="formLabel" for="paymentDateInput">Payment Date *</label>
            <input
              type="date"
              id="paymentDateInput"
              class="formInput"
              value="${todayStr}"
              required
            />
          </div>

          ${specificFormHtml}

          <div class="formRow">
            <label class="formLabel" for="paymentNoteInput">Note / Reference (Optional)</label>
            <input
              type="text"
              id="paymentNoteInput"
              class="formInput"
              placeholder="e.g. bKash TxID or voucher note"
            />
          </div>

          <div id="modalFormError" class="modalFormError" style="display:none;"></div>

          <div class="modalFooter">
            <button type="button" class="btnSecondary primaryTouchTarget" id="cancelPaymentModalBtn">Cancel</button>
            <button type="submit" class="btnPrimary primaryTouchTarget" id="submitPaymentBtn">
              Save Payment Record
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

export function attachPaymentModalEvents(root: HTMLElement): void {
  const overlay = root.querySelector('#paymentModalOverlay');
  if (!overlay) return;

  const closeBtn = root.querySelector('#closePaymentModalBtn');
  const cancelBtn = root.querySelector('#cancelPaymentModalBtn');
  const close = () => appStore.closeBillModal();

  closeBtn?.addEventListener('click', close);
  cancelBtn?.addEventListener('click', close);
  overlay.addEventListener('click', e => {
    if (e.target === overlay) close();
  });

  const billId = appStore.getSelectedBillId();
  if (!billId) return;

  const payments = appStore.getPayments();
  const billPayments = payments.filter(p => p.billId === billId);

  // Dynamic calculations for Gym
  if (billId === 'gym') {
    const durationSelect = root.querySelector('#gymDurationSelect') as HTMLSelectElement | null;
    const amountInput = root.querySelector('#paymentAmountInput') as HTMLInputElement | null;
    const splitText = root.querySelector('#gymMonthlySplitText');
    const rangeText = root.querySelector('#gymCycleRangeText');
    const dueBadge = root.querySelector('#gymDueDateBadge');

    const updateGym = () => {
      const dur = parseInt(durationSelect?.value || '1', 10);
      const amt = parseFloat(amountInput?.value || '1700') || 1700;
      const cycle = getGymNextCycle(billPayments, dur);
      const split = calculateGymSplit(amt, dur);

      if (rangeText) rangeText.textContent = cycle.rangeLabel;
      if (dueBadge) dueBadge.textContent = `Due: ${cycle.dueLabel}`;
      if (splitText) splitText.textContent = `৳ ${split.monthlySplit.toLocaleString()} / mo`;
    };

    durationSelect?.addEventListener('change', updateGym);
    amountInput?.addEventListener('input', updateGym);
  }

  // Dynamic calculations for Land Tax
  if (billId === 'landTax') {
    const propSelect = root.querySelector('#landTaxPropSelect') as HTMLSelectElement | null;
    const durSelect = root.querySelector('#landTaxDurationSelect') as HTMLSelectElement | null;
    const amountInput = root.querySelector('#paymentAmountInput') as HTMLInputElement | null;
    const rangeText = root.querySelector('#landTaxRangeText');
    const dueBadge = root.querySelector('#landTaxDueDateBadge');

    const updateLandTax = () => {
      const prop = propSelect?.value || 'মাতুয়াইল';
      const dur = parseInt(durSelect?.value || '1', 10);
      const cycle = getLandTaxNextCycle(billPayments, prop, dur);

      if (rangeText) rangeText.textContent = cycle.displayRange;
      if (dueBadge) dueBadge.textContent = `Due: ${cycle.dueLabel}`;

      let key: 'matuail' | 'uttarkhan' | 'keshurbag' = 'matuail';
      if (prop.includes('উত্তরখান')) key = 'uttarkhan';
      if (prop.includes('কেশুরবাগ')) key = 'keshurbag';
      if (amountInput) {
        amountInput.value = String(storageAdapter.getLandTaxRate(key) * dur);
      }
    };

    propSelect?.addEventListener('change', updateLandTax);
    durSelect?.addEventListener('change', updateLandTax);
  }

  // Dynamic calculations for Matuail Gas
  if (billId === 'matuailGas') {
    const rateInput = root.querySelector('#matuailRateInput') as HTMLInputElement | null;
    const fromSelect = root.querySelector('#matuailFromSelect') as HTMLSelectElement | null;
    const toSelect = root.querySelector('#matuailToSelect') as HTMLSelectElement | null;
    const feeInput = root.querySelector('#paymentFeeInput') as HTMLInputElement | null;
    const amountInput = root.querySelector('#paymentAmountInput') as HTMLInputElement | null;

    const updateMatuail = () => {
      const rate = parseFloat(rateInput?.value || '1080') || 1080;
      appStore.setMatuailRate(rate);

      const fromVal = fromSelect?.value || '';
      const toVal = toSelect?.value || '';
      const payDate = new Date();

      // Parse from and to
      const monthNames = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
      ];
      const getMonthDate = (str: string) => {
        const parts = str.split(' ');
        if (parts.length < 2) return null;
        const m = monthNames.findIndex(mn => mn.startsWith(parts[0].toLowerCase()));
        const y = parseInt(parts[1], 10);
        return m !== -1 && y ? new Date(y, m, 1) : null;
      };

      const fromDate = getMonthDate(fromVal);
      const toDate = getMonthDate(toVal);

      if (fromDate && toDate && toDate >= fromDate) {
        const mCount =
          (toDate.getFullYear() - fromDate.getFullYear()) * 12 +
          (toDate.getMonth() - fromDate.getMonth()) +
          1;
        if (amountInput) amountInput.value = String(rate * mCount);

        const titasDue = calculateTitasGasDue(fromDate, toDate, payDate);
        if (feeInput && titasDue.totalFee > 0) {
          feeInput.value = String(titasDue.totalFee);
        }
      }
    };

    rateInput?.addEventListener('input', updateMatuail);
    fromSelect?.addEventListener('change', updateMatuail);
    toSelect?.addEventListener('change', updateMatuail);
  }

  // Handle Form Submission
  const form = root.querySelector('#paymentEntryForm') as HTMLFormElement | null;
  const errorBox = root.querySelector('#modalFormError') as HTMLElement | null;

  form?.addEventListener('submit', e => {
    e.preventDefault();
    if (errorBox) errorBox.style.display = 'none';

    const amt = parseFloat((root.querySelector('#paymentAmountInput') as HTMLInputElement)?.value || '0');
    const fee = (root.querySelector('#paymentFeeInput') as HTMLInputElement)?.value;
    const payDate = (root.querySelector('#paymentDateInput') as HTMLInputElement)?.value;
    const note = (root.querySelector('#paymentNoteInput') as HTMLInputElement)?.value;

    let billMonth = '';
    let property = '';
    let receiptUrl = '';

    if (billId === 'gym') {
      const dur = parseInt((root.querySelector('#gymDurationSelect') as HTMLSelectElement)?.value || '1', 10);
      const cycle = getGymNextCycle(billPayments, dur);
      billMonth = cycle.rangeLabel;
    } else if (billId === 'landTax') {
      property = (root.querySelector('#landTaxPropSelect') as HTMLSelectElement)?.value || 'মাতুয়াইল';
      const dur = parseInt((root.querySelector('#landTaxDurationSelect') as HTMLSelectElement)?.value || '1', 10);
      const cycle = getLandTaxNextCycle(billPayments, property, dur);
      billMonth = cycle.displayRange;
      receiptUrl = (root.querySelector('#landTaxReceiptUrl') as HTMLInputElement)?.value || '';
    } else if (billId === 'matuailGas') {
      const fromVal = (root.querySelector('#matuailFromSelect') as HTMLSelectElement)?.value;
      const toVal = (root.querySelector('#matuailToSelect') as HTMLSelectElement)?.value;
      billMonth = fromVal === toVal ? fromVal : `${fromVal} - ${toVal}`;
    } else if (root.querySelector('#postpaidMonthSelect')) {
      billMonth = (root.querySelector('#postpaidMonthSelect') as HTMLSelectElement)?.value || '';
    }

    const result = appStore.addPayment({
      billId,
      amount: amt,
      payDate,
      billMonth,
      fee,
      property,
      receiptUrl,
      note
    });

    if (!result.success && errorBox) {
      errorBox.textContent = result.error || 'Failed to save payment';
      errorBox.style.display = 'block';
    }
  });
}
