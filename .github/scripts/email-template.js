/**
 * Billzy Payment Reminder — email template (drop-in replacement)
 *
 * This is a from-scratch visual redesign. Only the underlying approach is kept
 * (table-based layout + inline styles + a <style> media query), because that
 * part is what makes it render correctly in both Gmail desktop and Gmail
 * mobile apps — nothing about the look of the old dark/cyan version carries over.
 *
 * New direction: soft, warm, paper-like light theme. Calm cream background,
 * deep indigo header, a clay/terracotta accent for anything that needs action,
 * a muted sage accent for the "just check it" items. Meant to feel like a
 * gentle note, not a system alert.
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
  const FONT = "Georgia, 'Iowan Old Style', 'Times New Roman', serif";
  const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

  let htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light">
<title>Billzy Payment Reminder</title>
<style>
  body, table, td { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  body { margin: 0; padding: 0; background-color: #f3ede3; }
  a { text-decoration: none; }

  @media only screen and (max-width: 620px) {
    .billzy-wrapper { width: 100% !important; }
    .billzy-card { padding: 30px 22px !important; }
    .billzy-h1 { font-size: 22px !important; }
    .billzy-cta { display: block !important; width: 100% !important; box-sizing: border-box; }
  }
</style>
</head>
<body style="margin:0; padding:0; background-color:#f3ede3;">
  <!-- preheader (hidden preview text) -->
  <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
    ${hasUnpaid ? `${unpaidPostpaid.length} bill${unpaidPostpaid.length > 1 ? 's' : ''} still need paying from ${lastMonthLabel}.` : `Your ${monthLabel} check-in from Billzy.`}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3ede3; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" class="billzy-wrapper" width="580" cellpadding="0" cellspacing="0" border="0" style="width:580px; max-width:580px;">

          <!-- Top mark -->
          <tr>
            <td align="center" style="padding-bottom:22px;">
              <img src="https://36pro.github.io/assets/avatar.jpg" width="48" height="48" style="display:block; border-radius:50%; border:1px solid #e8dfd0;" alt="B">
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td class="billzy-card" style="background-color:#fffdf9; border:1px solid #e8dfd0; border-radius:6px; padding:44px 48px; font-family:${SANS};">

              <p class="billzy-h1" style="margin:0; font-family:${FONT}; font-size:25px; font-weight:400; color:#2f2440; letter-spacing:0.2px;">
                Your bills for ${monthLabel}
              </p>
              <p style="margin:10px 0 0 0; font-size:14px; line-height:1.6; color:#8a7f6f;">
                A quiet monthly note from Billzy — here's what needs your attention.
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;">
                <tr><td style="border-top:1px solid #ece3d3; font-size:1px; line-height:1px;">&nbsp;</td></tr>
              </table>
`;

  // ---- Unpaid postpaid bills: clay/terracotta accent, left rule instead of a boxed alert ----
  if (hasUnpaid) {
    htmlContent += `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:30px;">
                <tr>
                  <td style="border-left:3px solid #c1613f; padding-left:20px;">
                    <span style="display:inline-block; font-family:${SANS}; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:#c1613f; font-weight:700;">Needs payment &middot; due for ${lastMonthLabel}</span>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:12px;">
${unpaidPostpaid.map(b => `                      <tr><td style="padding:7px 0; font-family:${FONT}; font-size:17px; color:#2f2440; border-bottom:1px solid #f1e9dc;">${b.name}</td></tr>`).join('\n')}
                    </table>
                  </td>
                </tr>
              </table>
`;
  }

  // ---- Balance-based accounts: sage accent, quieter treatment since it's just a check-in ----
  if (hasBalance) {
    htmlContent += `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:30px;">
                <tr>
                  <td style="border-left:3px solid #7c9070; padding-left:20px;">
                    <span style="display:inline-block; font-family:${SANS}; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:#7c9070; font-weight:700;">Worth checking &middot; balance meters</span>
                    <p style="margin:10px 0 0 0; font-size:13.5px; color:#8a7f6f; line-height:1.5;">No action unless the balance is running low.</p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:10px;">
${balanceCheckups.map(b => `                      <tr><td style="padding:6px 0; font-family:${FONT}; font-size:16px; color:#4a4358; border-bottom:1px solid #f1e9dc;">${b.name}</td></tr>`).join('\n')}
                    </table>
                  </td>
                </tr>
              </table>
`;
  }

  // ---- CTA + footer ----
  htmlContent += `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:38px;">
                <tr>
                  <td align="center">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td class="billzy-cta" align="center" style="background-color:#2f2440; border-radius:4px;">
                          <a href="${DASHBOARD_URL}" style="display:inline-block; padding:15px 34px; font-family:${SANS}; font-size:14px; letter-spacing:0.4px; font-weight:600; color:#f3ede3;">VIEW DASHBOARD</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer, outside the card -->
          <tr>
            <td align="center" style="padding-top:26px;">
              <span style="font-family:${SANS}; font-size:11.5px; color:#a89d8a;">Sent automatically by Billzy Actions Engine</span>
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
