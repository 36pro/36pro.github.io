const fs = require('fs');
const path = require('path');
const { buildBillzyEmail } = require('./email-template.js');

// 1. Define utility bills configurations matching index.html
const bills = [
  { id: 'uttaraWater', name: 'Uttara Water (WASA)', type: 'postpaid' },
  { id: 'noakhaliPalli', name: 'Noakhali Palli (Palli Bidyut)', type: 'postpaid' },
  { id: 'matuailGas', name: 'Matuail Gas (Titas)', type: 'postpaid' },
  { id: 'inspireBroadband', name: 'Inspire Broadband', type: 'prepaid' },
  { id: 'rupnagarDesco', name: 'Rupnagar DESCO', type: 'prepaid_balance' },
  { id: 'rupnagarGas', name: 'Rupnagar Gas', type: 'prepaid_balance' },
  { id: 'uttaraDesco', name: 'Uttara DESCO', type: 'prepaid_balance' }
];

async function main() {
  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.MY_EMAIL;

  if (!apiKey || !toEmail) {
    console.error('Error: RESEND_API_KEY and MY_EMAIL environment variables must be set.');
    process.exit(1);
  }

  // 2. Load payments database
  const dataPath = path.join(__dirname, '../../data.json');
  if (!fs.existsSync(dataPath)) {
    console.error(`Error: data.json not found at ${dataPath}`);
    process.exit(1);
  }

  let payments = [];
  try {
    const rawData = fs.readFileSync(dataPath, 'utf8');
    payments = JSON.parse(rawData);
  } catch (err) {
    console.error('Error parsing data.json:', err);
    process.exit(1);
  }

  // 3. Determine current and previous billing months (e.g. "August 2026" / "July 2026")
  const now = new Date();
  
  const currentMonthName = now.toLocaleString('default', { month: 'long' });
  const currentYear = now.getFullYear();
  const currentMonthLabel = `${currentMonthName} ${currentYear}`;

  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthName = lastMonthDate.toLocaleString('default', { month: 'long' });
  const lastMonthYear = lastMonthDate.getFullYear();
  const lastMonthLabel = `${lastMonthName} ${lastMonthYear}`;

  const unpaidPostpaid = [];
  const unpaidPrepaid = [];
  const balanceCheckups = [];

function parseSingleMonth(str) {
  if (!str) return null;
  const parts = str.trim().split(' ');
  if (parts.length < 2) return null;
  const monthNames = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
  const mIdx = monthNames.findIndex(m => m.startsWith(parts[0].toLowerCase()));
  const y = parseInt(parts[1]);
  if (mIdx === -1 || isNaN(y)) return null;
  return new Date(y, mIdx, 1);
}

function isMonthCovered(billMonthStr, targetMonthLabel) {
  if (!billMonthStr || !targetMonthLabel) return false;
  const clean = billMonthStr.trim().toLowerCase();
  const target = targetMonthLabel.trim().toLowerCase();
  if (clean === target) return true;
  if (clean.includes(' - ') || clean.includes(' to ')) {
    const parts = clean.split(/ - | to /);
    const start = parseSingleMonth(parts[0]);
    const end = parseSingleMonth(parts[1]);
    const tgt = parseSingleMonth(target);
    if (start && end && tgt && tgt >= start && tgt <= end) {
      return true;
    }
  }
  return false;
}

  // 4. Check payment status for each bill
  bills.forEach(bill => {
    // Filter payments for this specific bill
    const billPayments = payments.filter(p => p.billId === bill.id);
    
    if (bill.type === 'postpaid') {
      // Postpaid: check if previous month was paid or covered in a multi-month range
      const paid = billPayments.some(p => isMonthCovered(p.billMonth, lastMonthLabel));
      if (!paid) {
        unpaidPostpaid.push(bill);
      }
    } else if (bill.type === 'prepaid') {
      // Prepaid: check if current month is paid
      const paid = billPayments.some(p => isMonthCovered(p.billMonth, currentMonthLabel));
      if (!paid) {
        unpaidPrepaid.push(bill);
      }
    } else if (bill.type === 'prepaid_balance') {
      // Balance-based: just flag as a checkup reminder
      balanceCheckups.push(bill);
    }
  });

  // 5. Build HTML Email Body using the template function
  const htmlContent = buildBillzyEmail({
    monthLabel: currentMonthLabel,
    lastMonthLabel: lastMonthLabel,
    unpaidPostpaid: [
      ...unpaidPrepaid.map(b => ({ name: `${b.name} (Prepaid)` })),
      ...unpaidPostpaid.map(b => ({ name: `${b.name} (Postpaid)` }))
    ],
    balanceCheckups: balanceCheckups,
    dashboardUrl: 'https://36pro.github.io/#home'
  });

  // 6. Send email using Resend API via native fetch
  console.log(`Sending reminder to ${toEmail}...`);
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Billzy Reminders <onboarding@resend.dev>',
        to: toEmail,
        subject: `Billzy: Payment Reminder for ${currentMonthLabel}`,
        html: htmlContent
      })
    });

    const resData = await response.json();
    if (response.ok) {
      console.log('Email sent successfully! Message ID:', resData.id);
    } else {
      console.error('Failed to send email. Resend API Error:', resData);
      process.exit(1);
    }
  } catch (err) {
    console.error('Error sending email request:', err);
    process.exit(1);
  }
}

main();
