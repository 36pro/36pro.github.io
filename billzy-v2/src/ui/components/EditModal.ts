import { appStore } from '../state';
import { parsePaymentRecord } from '../../core/domain/fee-splitting';

export function renderEditModal(): string {
  const uid = appStore.getEditingUid();
  if (!uid) return '';

  const payments = appStore.getPayments();
  const rawRecord = payments.find(p => p.uid === uid);
  if (!rawRecord) return '';

  const record = parsePaymentRecord(rawRecord);

  return `
    <div class="modalOverlay" id="editModalOverlay" role="dialog" aria-modal="true">
      <div class="modalContainer">
        <div class="modalHeader">
          <div class="modalTitleBlock">
            <h2 class="modalTitle">Edit Record: ${record.billName}</h2>
            <div class="modalAccountBadge">UID: <code>${record.uid}</code></div>
          </div>
          <button class="modalCloseBtn primaryTouchTarget" id="closeEditModalBtn" aria-label="Close Modal">✕</button>
        </div>

        <form id="editRecordForm" class="modalForm">
          <div class="formRow">
            <label class="formLabel" for="editAmountInput">Main Amount (BDT) *</label>
            <input
              type="number"
              id="editAmountInput"
              class="formInput amountHighlight"
              value="${record.baseAmount}"
              required
              min="1"
              step="any"
            />
          </div>

          <div class="formRow">
            <label class="formLabel" for="editFeeInput">Fee / Surcharge (BDT)</label>
            <input
              type="number"
              id="editFeeInput"
              class="formInput"
              value="${record.feeNum || ''}"
              placeholder="0"
              min="0"
              step="any"
            />
          </div>

          <div class="formRow">
            <label class="formLabel" for="editDateInput">Date Paid *</label>
            <input
              type="date"
              id="editDateInput"
              class="formInput"
              value="${record.payDate}"
              required
            />
          </div>

          <div class="formRow">
            <label class="formLabel" for="editMonthInput">Billing Month / Cycle</label>
            <input
              type="text"
              id="editMonthInput"
              class="formInput"
              value="${record.billMonth || ''}"
              placeholder="e.g. August 2026 or FY 2026"
            />
          </div>

          ${
            record.property
              ? `
            <div class="formRow">
              <label class="formLabel" for="editPropertyInput">Property (Land Tax)</label>
              <input
                type="text"
                id="editPropertyInput"
                class="formInput bnFont"
                value="${record.property}"
              />
            </div>
          `
              : ''
          }

          <div class="formRow">
            <label class="formLabel" for="editReceiptUrlInput">Receipt URL</label>
            <input
              type="url"
              id="editReceiptUrlInput"
              class="formInput"
              value="${record.receiptUrl || ''}"
              placeholder="https://..."
            />
          </div>

          <div class="formRow">
            <label class="formLabel" for="editNoteInput">Note</label>
            <input
              type="text"
              id="editNoteInput"
              class="formInput"
              value="${record.note || ''}"
            />
          </div>

          <div id="editModalError" class="modalFormError" style="display:none;"></div>

          <div class="modalFooter">
            <button type="button" class="btnDanger primaryTouchTarget" id="deleteFromEditModalBtn">
              Delete Record
            </button>
            <div style="display:flex; gap:10px; margin-left:auto;">
              <button type="button" class="btnSecondary primaryTouchTarget" id="cancelEditModalBtn">
                Cancel
              </button>
              <button type="submit" class="btnPrimary primaryTouchTarget" id="saveEditBtn">
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `;
}

export function attachEditModalEvents(root: HTMLElement): void {
  const overlay = root.querySelector('#editModalOverlay');
  if (!overlay) return;

  const closeBtn = root.querySelector('#closeEditModalBtn');
  const cancelBtn = root.querySelector('#cancelEditModalBtn');
  const deleteBtn = root.querySelector('#deleteFromEditModalBtn');
  const close = () => appStore.closeEditModal();

  closeBtn?.addEventListener('click', close);
  cancelBtn?.addEventListener('click', close);
  overlay.addEventListener('click', e => {
    if (e.target === overlay) close();
  });

  const uid = appStore.getEditingUid();
  if (!uid) return;

  deleteBtn?.addEventListener('click', () => {
    appStore.deletePayment(uid);
  });

  const form = root.querySelector('#editRecordForm') as HTMLFormElement | null;
  const errorBox = root.querySelector('#editModalError') as HTMLElement | null;

  form?.addEventListener('submit', e => {
    e.preventDefault();
    if (errorBox) errorBox.style.display = 'none';

    const amt = (root.querySelector('#editAmountInput') as HTMLInputElement)?.value;
    const fee = (root.querySelector('#editFeeInput') as HTMLInputElement)?.value;
    const payDate = (root.querySelector('#editDateInput') as HTMLInputElement)?.value;
    const billMonth = (root.querySelector('#editMonthInput') as HTMLInputElement)?.value;
    const propInput = root.querySelector('#editPropertyInput') as HTMLInputElement | null;
    const property = propInput ? propInput.value : undefined;
    const receiptUrl = (root.querySelector('#editReceiptUrlInput') as HTMLInputElement)?.value;
    const note = (root.querySelector('#editNoteInput') as HTMLInputElement)?.value;

    const result = appStore.updatePayment(uid, {
      amount: amt,
      fee,
      payDate,
      billMonth,
      property,
      receiptUrl,
      note
    });

    if (!result.success && errorBox) {
      errorBox.textContent = result.error || 'Failed to update record';
      errorBox.style.display = 'block';
    }
  });
}
