/**
 * DESCO Low Balance Alert
 *
 * Runs daily at 12:15 AM Bangladesh Standard Time (18:15 UTC) via GitHub Actions,
 * right after DESCO smart meters synchronize their midnight readings.
 * Checks prepaid balance for each DESCO account via the public API.
 * Only sends an email if at least one account is below its threshold.
 */

const https = require('https');

const ACCOUNTS = [
  {
    id: 'rupnagarDesco',
    name: 'Rupnagar DESCO',
    accountNo: '14010368',
    threshold: 200
  },
  {
    id: 'uttaraDesco',
    name: 'Uttara DESCO',
    accountNo: '25038654',
    threshold: 350
  }
];

const API_BASE_URLS = [
  'https://prepaid.desco.org.bd/api/unified/customer',
  'https://prepaid.desco.org.bd/api/tkdes/customer'
];

/**
 * Makes an HTTPS GET request with browser-like headers.
 */
function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://prepaid.desco.org.bd/',
        'Origin': 'https://prepaid.desco.org.bd'
      },
      timeout: 15000,
      rejectUnauthorized: false
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, json: JSON.parse(data) });
        } catch (e) {
          reject(new Error(`Invalid JSON response (status ${res.statusCode}): ${data.substring(0, 200)}`));
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
    req.end();
  });
}

async function fetchBalance(accountNo) {
  for (const baseUrl of API_BASE_URLS) {
    const url = `${baseUrl}/getBalance?accountNo=${accountNo}`;
    try {
      console.log(`    Trying: ${url}`);
      const res = await httpsGet(url);
      console.log(`    Response status: ${res.status}`);
      if (res.ok && res.json.code === 200 && res.json.data) {
        return res.json.data;
      }
    } catch (err) {
      console.warn(`    Failed: ${err.message}`);
    }
  }
  return null;
}

function buildAlertEmail(alerts) {
  const DASHBOARD_URL = 'https://36pro.github.io/';
  const FONT_SANS = "-apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  const FONT_MONO = "'JetBrains Mono', Consolas, Monaco, monospace";
  const FONT_AMOUNT = "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

  const alertCardsHtml = alerts.map(a => {
    return `
      <tr>
        <td style="padding: 12px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #050e20; border: 1px solid #1d3969; border-left: 4px solid #ff6077; border-radius: 14px; padding: 18px 20px;">
            <tr>
              <td>
                <div style="font-family: ${FONT_SANS}; font-size: 16px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.2px;">
                  ${a.name}
                </div>
                <div style="font-family: ${FONT_MONO}; font-size: 12px; color: #94a3b8; margin-top: 4px;">
                  Meter Account: <span style="color: #00C2FF;">${a.accountDisplay}</span>
                </div>
              </td>
              <td align="right" style="vertical-align: middle;">
                <div style="font-family: ${FONT_AMOUNT}; font-size: 26px; font-weight: 900; color: #ff6077; line-height: 1; letter-spacing: -0.5px;">
                  ৳ ${Math.round(a.balance).toLocaleString()}
                </div>
                <div style="font-family: ${FONT_SANS}; font-size: 11px; font-weight: 700; color: #FF7A00; text-transform: uppercase; margin-top: 4px; letter-spacing: 0.5px;">
                  Limit: ৳${a.threshold}
                </div>
              </td>
            </tr>
            <tr>
              <td colspan="2" style="padding-top: 12px; border-top: 1px solid rgba(29, 57, 105, 0.4); margin-top: 12px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="font-family: ${FONT_SANS}; font-size: 11px; color: #64748b;">
                      Midnight Reading: <span style="color: #94a3b8; font-family: ${FONT_MONO};">${a.readingTime || 'Just synced'}</span>
                    </td>
                    <td align="right">
                      <span style="display: inline-block; padding: 2px 8px; background: rgba(255, 96, 119, 0.15); border: 1px solid rgba(255, 96, 119, 0.3); border-radius: 6px; font-size: 10px; font-weight: 700; color: #ff6077; font-family: ${FONT_MONO}; text-transform: uppercase;">
                        Recharge Required
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="dark">
<title>Billzy — Low Balance Alert</title>
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
    ${alerts.length === 1 ? `${alerts[0].name} balance is low: ৳${Math.round(alerts[0].balance)} (Threshold: ৳${alerts[0].threshold})` : `${alerts.length} DESCO accounts dropped below their threshold after midnight reading.`}
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
                    <span style="display: inline-block; padding: 4px 10px; background: rgba(255, 96, 119, 0.15); border: 1px solid rgba(255, 96, 119, 0.3); border-radius: 999px; font-size: 11px; font-weight: 700; color: #ff6077; font-family: ${FONT_MONO}; text-transform: uppercase; letter-spacing: 0.5px;">
                      Low Balance Alert
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Alert Banner -->
              <div style="font-size: 22px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.3px; margin-bottom: 6px;">
                Prepaid Balance Below Threshold
              </div>
              <div style="font-size: 13.5px; color: #94a3b8; line-height: 1.5; margin-bottom: 20px;">
                Midnight meter reading indicates one or more accounts are running low. Please recharge soon to avoid disconnection.
              </div>

              <!-- Alert Cards -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 10px; margin-bottom: 24px;">
                ${alertCardsHtml}
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 24px;">
                <tr>
                  <td align="center">
                    <a href="${DASHBOARD_URL}" style="display: inline-block; background-color: #00E676; color: #020817; font-family: ${FONT_SANS}; font-weight: 800; font-size: 14px; padding: 14px 32px; border-radius: 12px; text-decoration: none; letter-spacing: 0.2px; box-shadow: 0 10px 20px rgba(0, 230, 118, 0.25);">
                      RECHARGE VIA BILLZY &rarr;
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
                Sent automatically by Billzy Actions Engine &middot; DESCO Midnight Monitor<br>
                Synced directly from official prepaid smart metering servers.
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

async function main() {
  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.MY_EMAIL;

  if (!apiKey || !toEmail) {
    console.error('Error: RESEND_API_KEY and MY_EMAIL environment variables must be set.');
    process.exit(1);
  }

  const alerts = [];

  for (const account of ACCOUNTS) {
    console.log(`Checking ${account.name} (${account.accountNo})...`);
    const data = await fetchBalance(account.accountNo);

    if (!data) {
      console.warn(`  Could not fetch balance for ${account.name}. Skipping.`);
      continue;
    }

    const balance = parseFloat(data.balance);
    console.log(`  Balance: ৳${balance} | Threshold: ৳${account.threshold}`);

    if (balance < account.threshold) {
      console.log(`  BELOW THRESHOLD — will alert.`);
      alerts.push({
        ...account,
        balance: balance,
        accountDisplay: account.accountNo.replace(/(\d{3})(\d{2})(\d{3})/, '$1-$2-$3'),
        readingTime: data.readingTime || null
      });
    } else {
      console.log(`  OK.`);
    }
  }

  if (alerts.length === 0) {
    console.log('\nAll balances are above their thresholds. No email sent.');
    return;
  }

  // Build and send alert email
  const htmlContent = buildAlertEmail(alerts);
  const accountNames = alerts.map(a => a.name).join(' & ');

  console.log(`\nSending low balance alert to ${toEmail}...`);
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Billzy Alerts <onboarding@resend.dev>',
        to: toEmail,
        subject: `Low Balance Alert: ${accountNames}`,
        html: htmlContent
      })
    });

    const resData = await response.json();
    if (response.ok) {
      console.log('Alert email sent successfully! Message ID:', resData.id);
    } else {
      console.error('Failed to send email. Resend API Error:', resData);
      process.exit(1);
    }
  } catch (err) {
    console.error('Error sending email:', err);
    process.exit(1);
  }
}

main();
