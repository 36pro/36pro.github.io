/**
 * DESCO Low Balance Alert
 *
 * Runs daily at 11:00 AM Bangladesh time via GitHub Actions.
 * Checks the prepaid balance for each DESCO account via the public API.
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
 * Uses the https module directly for better compatibility with
 * servers that may reject Node's native fetch.
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
      // Accept self-signed or problematic certs from DESCO's server
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
  const FONT = "Georgia, 'Iowan Old Style', 'Times New Roman', serif";
  const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  const DASHBOARD_URL = 'https://36pro.github.io/#home';

  const alertRows = alerts.map(a => {
    const balanceColor = '#c1613f';
    const thresholdNote = `Threshold: ৳${a.threshold.toLocaleString()}`;
    return `
      <tr>
        <td style="padding: 16px 20px; border-bottom: 1px solid #f1e9dc;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="font-family: ${FONT}; font-size: 17px; color: #2f2440; font-weight: 400;">
                ⚡ ${a.name}
              </td>
              <td align="right" style="font-family: ${SANS}; font-size: 22px; font-weight: 700; color: ${balanceColor};">
                ৳${Math.round(a.balance).toLocaleString()}
              </td>
            </tr>
            <tr>
              <td colspan="2" style="padding-top: 4px; font-family: ${SANS}; font-size: 12px; color: #a89d8a;">
                ${thresholdNote} · Account: ${a.accountDisplay} · Reading: ${a.readingTime || 'N/A'}
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
<meta name="color-scheme" content="light">
<title>DESCO Low Balance Alert</title>
<style>
  body, table, td { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  body { margin: 0; padding: 0; background-color: #f3ede3; }
  a { text-decoration: none; }
  @media only screen and (max-width: 620px) {
    .billzy-wrapper { width: 100% !important; }
    .billzy-card { padding: 30px 22px !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background-color:#f3ede3;">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
    ${alerts.length === 1 ? `${alerts[0].name} balance is low: ৳${Math.round(alerts[0].balance)}` : `${alerts.length} DESCO accounts have low balance`}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3ede3; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" class="billzy-wrapper" width="580" cellpadding="0" cellspacing="0" border="0" style="width:580px; max-width:580px;">

          <!-- Top mark -->
          <tr>
            <td align="center" style="padding-bottom:22px;">
              <span style="display:inline-block; width:40px; height:40px; line-height:40px; border-radius:50%; background-color:#c1613f; color:#f3ede3; font-family:${SANS}; font-size:17px; font-weight:700; text-align:center;">⚡</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td class="billzy-card" style="background-color:#fffdf9; border:1px solid #e8dfd0; border-radius:6px; padding:44px 48px; font-family:${SANS};">

              <p style="margin:0; font-family:${FONT}; font-size:25px; font-weight:400; color:#2f2440; letter-spacing:0.2px;">
                Low balance alert
              </p>
              <p style="margin:10px 0 0 0; font-size:14px; line-height:1.6; color:#8a7f6f;">
                One or more of your DESCO prepaid accounts has dropped below its set threshold. Consider recharging soon.
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;">
                <tr><td style="border-top:1px solid #ece3d3; font-size:1px; line-height:1px;">&nbsp;</td></tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:20px; border:1px solid #f1e9dc; border-radius:4px;">
                ${alertRows}
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:38px;">
                <tr>
                  <td align="center">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="background-color:#2f2440; border-radius:4px;">
                          <a href="${DASHBOARD_URL}" style="display:inline-block; padding:15px 34px; font-family:${SANS}; font-size:14px; letter-spacing:0.4px; font-weight:600; color:#f3ede3;">VIEW DASHBOARD</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:26px;">
              <span style="font-family:${SANS}; font-size:11.5px; color:#a89d8a;">Sent automatically by Billzy Actions Engine · Low Balance Monitor</span>
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
      console.warn(`  ⚠ Could not fetch balance for ${account.name}. Skipping.`);
      continue;
    }

    const balance = parseFloat(data.balance);
    console.log(`  Balance: ৳${balance} | Threshold: ৳${account.threshold}`);

    if (balance < account.threshold) {
      console.log(`  🔴 BELOW THRESHOLD — will alert.`);
      alerts.push({
        ...account,
        balance: balance,
        accountDisplay: account.accountNo.replace(/(\d{3})(\d{2})(\d{3})/, '$1-$2-$3'),
        readingTime: data.readingTime ? data.readingTime.split(' ')[0] : null
      });
    } else {
      console.log(`  ✅ OK.`);
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
        subject: `⚡ Low Balance: ${accountNames}`,
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
