/**
 * Billzy Payment Reminder — email template (drop-in replacement)
 *
 * Design goals:
 *  - Table-based layout (Gmail app on iOS/Android ignores <div> box models,
 *    so tables + inline styles are the only way to get consistent rendering)
 *  - 600px max width, fluid down to mobile via a <style> media query
 *    (Gmail webmail + Gmail iOS/Android BOTH honor <style> blocks in <head>
 *    — it's Outlook desktop that strips them, which you don't need to support here)
 *  - Soothing dark navy/slate gradient card, single soft amber "action needed"
 *    banner instead of harsh red, calm blue for the balance-check section
 *  - One CTA button, centered, big enough to tap on mobile
 *
 * Variables expected (same names as your current script):
 *   monthLabel        e.g. "August 2026"
 *   lastMonthLabel     e.g. "July 2026"
 *   unpaidPostpaid     array of { name }
 *   balanceCheckups    array of { name }
 *   dashboardUrl       (optional — defaults to your GitHub Pages link below)
 */

function buildBillzyEmail({ monthLabel, lastMonthLabel, unpaidPostpaid, balanceCheckups, dashboardUrl }) {
  const DASHBOARD_URL = dashboardUrl || 'https://36pro.github.io/Billzy/';
  const hasUnpaid = unpaidPostpaid && unpaidPostpaid.length > 0;
  const hasBalance = balanceCheckups && balanceCheckups.length > 0;

  let htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="dark light">
<title>Billzy Payment Reminder</title>
<style>
  body, table, td { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  body { margin: 0; padding: 0; background-color: #05080f; }
  a { text-decoration: none; }

  @media only screen and (max-width: 620px) {
    .billzy-wrapper { width: 100% !important; }
    .billzy-card { border-radius: 0 !important; padding: 28px 20px !important; }
    .billzy-h1 { font-size: 20px !important; }
    .billzy-cta { display: block !important; width: 100% !important; box-sizing: border-box; }
    .billzy-badge-text { font-size: 15px !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background-color:#05080f;">
  <!-- preheader (hidden preview text) -->
  <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
    ${hasUnpaid ? `Action needed: ${unpaidPostpaid.length} bill${unpaidPostpaid.length > 1 ? 's' : ''} unpaid for ${lastMonthLabel}.` : `Your ${monthLabel} balance check-in is ready.`}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#05080f; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" class="billzy-wrapper" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px;">
          <tr>
            <td class="billzy-card" style="background:linear-gradient(160deg, #0b1220 0%, #0a1628 55%, #071019 100%); border:1px solid #1e293b; border-radius:20px; padding:40px 36px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

                <!-- Header -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td>
                      <span style="font-size:22px; vertical-align:middle;">⚡</span>
                      <span class="billzy-h1" style="font-size:22px; font-weight:700; color:#22d3ee; vertical-align:middle; margin-left:6px;">Billzy Payment Reminder</span>
                    </td>
                  </tr>
                </table>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:14px; border-top:1px solid #1e293b;">
                  <tr><td style="font-size:1px; line-height:1px;">&nbsp;</td></tr>
                </table>

                <p style="color:#94a3b8; font-size:15px; line-height:1.6; margin:22px 0 0 0;">
                  Here is your utility bills overview for <strong style="color:#e2e8f0;">${monthLabel}</strong>:
                </p>
`;

  // ---- Unpaid postpaid bills: soft amber urgency banner (calmer than red, still unmistakable) ----
  if (hasUnpaid) {
    htmlContent += `
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px; background-color:#1c1508; border:1px solid #78350f; border-radius:14px;">
                  <tr>
                    <td style="padding:20px 22px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="font-size:18px; padding-right:10px; vertical-align:top; width:26px;">🔔</td>
                          <td>
                            <span class="billzy-badge-text" style="color:#fbbf24; font-size:16px; font-weight:700;">Action needed &mdash; ${unpaidPostpaid.length} unpaid bill${unpaidPostpaid.length > 1 ? 's' : ''}</span>
                            <div style="color:#d1a35c; font-size:13px; margin-top:2px;">Due for ${lastMonthLabel}</div>
                          </td>
                        </tr>
                      </table>
                      <ul style="padding-left:20px; margin:14px 0 0 0; line-height:1.7;">
${unpaidPostpaid.map(b => `                        <li style="color:#fde68a; font-size:15px; font-weight:600;">${b.name}</li>`).join('\n')}
                      </ul>
                    </td>
                  </tr>
                </table>
`;
  }

  // ---- Balance-based accounts: calm blue informational section ----
  if (hasBalance) {
    htmlContent += `
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:${hasUnpaid ? '18' : '24'}px; background-color:#08131f; border:1px solid #1e3a52; border-radius:14px;">
                  <tr>
                    <td style="padding:20px 22px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="font-size:18px; padding-right:10px; vertical-align:top; width:26px;">🔌</td>
                          <td>
                            <span style="color:#38bdf8; font-size:15px; font-weight:700;">Balance-based accounts</span>
                            <div style="color:#7dabc4; font-size:13px; margin-top:2px;">Please check the live balances for these meters</div>
                          </td>
                        </tr>
                      </table>
                      <ul style="padding-left:20px; margin:14px 0 0 0; line-height:1.7;">
${balanceCheckups.map(b => `                        <li style="color:#cbd5e1; font-size:14.5px;">${b.name}</li>`).join('\n')}
                      </ul>
                    </td>
                  </tr>
                </table>
`;
  }

  // ---- CTA + footer ----
  htmlContent += `
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:34px;">
                  <tr>
                    <td align="center">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td class="billzy-cta" align="center" style="background-color:#22d3ee; border-radius:10px;">
                            <a href="${DASHBOARD_URL}" style="display:inline-block; padding:14px 32px; font-size:15px; font-weight:700; color:#04121a; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Open Billzy Dashboard &#8599;</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px; border-top:1px solid #1e293b;">
                  <tr>
                    <td style="padding-top:18px;" align="center">
                      <span style="color:#475569; font-size:12px;">Sent automatically by Billzy Actions Engine.</span>
                    </td>
                  </tr>
                </table>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return htmlContent;
}

module.exports = { buildBillzyEmail };
