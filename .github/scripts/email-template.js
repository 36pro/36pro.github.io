/**
 * Billzy Payment Reminder & Utility Briefing Email Template
 *
 * Fully unified with the Billzy Cyber/Trefoil Brand Identity:
 * - Trefoil Mobius Ribbon mark (#00E676, #00C2FF, #FF7A00) + billzy° wordmark
 * - Dark Navy (#020817 / #0b1730) with High Contrast Card Containers
 * - Outfit 900 numbers & JetBrains Mono typography
 */

function buildBillzyEmail({ monthLabel, lastMonthLabel, unpaidPostpaid, balanceCheckups, dashboardUrl }) {
  const DASHBOARD_URL = dashboardUrl || 'https://36pro.github.io/';
  const hasUnpaid = unpaidPostpaid && unpaidPostpaid.length > 0;
  const hasBalance = balanceCheckups && balanceCheckups.length > 0;
  
  const FONT_SANS = "-apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  const FONT_MONO = "'JetBrains Mono', Consolas, Monaco, monospace";

  let unpaidListHtml = '';
  if (hasUnpaid) {
    unpaidListHtml = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 18px; background-color: #050e20; border: 1px solid #1d3969; border-left: 4px solid #ff6077; border-radius: 14px; padding: 18px 20px;">
        <tr>
          <td>
            <div style="font-family: ${FONT_MONO}; font-size: 11px; font-weight: 700; color: #ff6077; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
              Action Required &middot; Due for ${lastMonthLabel}
            </div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              ${unpaidPostpaid.map(b => `
                <tr>
                  <td style="padding: 8px 0; font-family: ${FONT_SANS}; font-size: 15px; font-weight: 600; color: #f8fafc; border-bottom: 1px solid rgba(29, 57, 105, 0.4);">
                    ${b.name}
                  </td>
                  <td align="right" style="padding: 8px 0; border-bottom: 1px solid rgba(29, 57, 105, 0.4);">
                    <span style="display: inline-block; padding: 2px 8px; background: rgba(255, 96, 119, 0.15); border-radius: 6px; font-size: 11px; font-weight: 700; color: #ff6077; font-family: ${FONT_MONO};">
                      Pending
                    </span>
                  </td>
                </tr>
              `).join('')}
            </table>
          </td>
        </tr>
      </table>
    `;
  }

  let balanceListHtml = '';
  if (hasBalance) {
    balanceListHtml = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 18px; background-color: #050e20; border: 1px solid #1d3969; border-left: 4px solid #00C2FF; border-radius: 14px; padding: 18px 20px;">
        <tr>
          <td>
            <div style="font-family: ${FONT_MONO}; font-size: 11px; font-weight: 700; color: #00C2FF; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">
              Prepaid Meter Monitoring &middot; Active
            </div>
            <div style="font-family: ${FONT_SANS}; font-size: 12.5px; color: #94a3b8; margin-bottom: 8px;">
              Automatic threshold watch active for balance-based utilities.
            </div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              ${balanceCheckups.map(b => `
                <tr>
                  <td style="padding: 6px 0; font-family: ${FONT_SANS}; font-size: 14px; color: #cbd5e1; border-bottom: 1px solid rgba(29, 57, 105, 0.3);">
                    ${b.name}
                  </td>
                </tr>
              `).join('')}
            </table>
          </td>
        </tr>
      </table>
    `;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="dark">
<title>Billzy — Monthly Payment Reminder</title>
<style>
  body, table, td, p, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  body { margin: 0; padding: 0; background-color: #020817; font-family: ${FONT_SANS}; }
  a { text-decoration: none; }
  @media only screen and (max-width: 620px) {
    .billzy-wrapper { width: 100% !important; }
    .billzy-card { padding: 24px 18px !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background-color:#020817; color:#f8fafc;">
  <!-- Hidden Preheader -->
  <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
    ${hasUnpaid ? `${unpaidPostpaid.length} bill${unpaidPostpaid.length > 1 ? 's' : ''} awaiting payment for ${lastMonthLabel}.` : `Your ${monthLabel} utility status check-in from Billzy.`}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#020817; padding: 32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" class="billzy-wrapper" width="580" cellpadding="0" cellspacing="0" border="0" style="width:580px; max-width:580px;">

          <!-- Main Container Card -->
          <tr>
            <td class="billzy-card" style="background-color: #0b1730; border: 1px solid #1d3969; border-radius: 20px; padding: 36px 36px 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
              
              <!-- Brand Header Bar -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 28px;">
                <tr>
                  <td align="left" style="vertical-align: middle;">
                    <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="vertical-align: middle;">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" width="32" height="32" fill="none">
                            <path d="M30 30 C30 10, 42 6, 30 6 C18 6, 30 10, 30 30 Z" stroke="#00E676" stroke-width="4.5" stroke-linecap="round" fill="none"/>
                            <path d="M30 30 C46 22, 54 36, 46 44 C38 52, 38 38, 30 30 Z" stroke="#00C2FF" stroke-width="4.5" stroke-linecap="round" fill="none"/>
                            <path d="M30 30 C14 22, 6 36, 14 44 C22 52, 22 38, 30 30 Z" stroke="#FF7A00" stroke-width="4.5" stroke-linecap="round" fill="none"/>
                            <circle cx="30" cy="30" r="4.5" fill="#FFFFFF"/>
                            <circle cx="30" cy="30" r="2" fill="#020817"/>
                          </svg>
                        </td>
                        <td style="padding-left: 10px; vertical-align: middle;">
                          <div style="font-family: ${FONT_SANS}; font-size: 22px; font-weight: 800; color: #FFFFFF; line-height: 1; letter-spacing: -0.5px;">
                            billzy<span style="color: #00E676;">°</span>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="display: inline-block; padding: 4px 10px; background: rgba(0, 230, 118, 0.15); border: 1px solid rgba(0, 230, 118, 0.3); border-radius: 999px; font-size: 11px; font-weight: 700; color: #00E676; font-family: ${FONT_MONO}; text-transform: uppercase; letter-spacing: 0.5px;">
                      Monthly Briefing
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Main Title -->
              <div style="font-size: 22px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.3px; margin-bottom: 6px;">
                Utility Status for ${monthLabel}
              </div>
              <div style="font-size: 13.5px; color: #94a3b8; line-height: 1.5; margin-bottom: 16px;">
                Monthly automated ledger briefing for all registered postpaid and prepaid accounts.
              </div>

              ${unpaidListHtml}
              ${balanceListHtml}

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 28px;">
                <tr>
                  <td align="center">
                    <a href="${DASHBOARD_URL}" style="display: inline-block; background-color: #00E676; color: #020817; font-family: ${FONT_SANS}; font-weight: 800; font-size: 14px; padding: 14px 32px; border-radius: 12px; text-decoration: none; letter-spacing: 0.2px; box-shadow: 0 10px 20px rgba(0, 230, 118, 0.25);">
                      OPEN BILLZY DASHBOARD &rarr;
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 24px;">
              <div style="font-family: ${FONT_SANS}; font-size: 11px; color: #64748b; line-height: 1.6;">
                Sent automatically by Billzy Actions Engine &middot; Treasury &amp; Utilities
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

module.exports = { buildBillzyEmail };
