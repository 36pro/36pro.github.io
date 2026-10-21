import { appStore } from '../state';

export function renderToastContainer(): string {
  const toasts = appStore.toasts;
  if (toasts.length === 0) return '<div id="toastContainer" class="toastContainer"></div>';

  return `
    <div id="toastContainer" class="toastContainer" role="status" aria-live="polite">
      ${toasts
        .map(
          t => `
        <div class="toastItem toast-${t.type || 'success'}">
          <div class="toastIcon">
            ${
              t.type === 'error'
                ? '⚠️'
                : t.type === 'warning'
                ? '⚡'
                : '✓'
            }
          </div>
          <div class="toastMessage">${t.message}</div>
        </div>
      `
        )
        .join('')}
    </div>
  `;
}
