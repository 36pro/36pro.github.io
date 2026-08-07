const fs = require('fs');
const path = require('path');

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

  // 4. Check payment status for each bill
  bills.forEach(bill => {
    // Filter payments for this specific bill
    const billPayments = payments.filter(p => p.billId === bill.id);
    
    if (bill.type === 'postpaid') {
      // Postpaid: check if previous month was paid
      const paid = billPayments.some(p => p.billMonth && p.billMonth.trim().toLowerCase() === lastMonthLabel.toLowerCase());
      if (!paid) {
        unpaidPostpaid.push(bill);
      }
    } else if (bill.type === 'prepaid') {
      // Prepaid: check if current month is paid
      const paid = billPayments.some(p => p.billMonth && p.billMonth.trim().toLowerCase() === currentMonthLabel.toLowerCase());
      if (!paid) {
        unpaidPrepaid.push(bill);
      }
    } else if (bill.type === 'prepaid_balance') {
      // Balance-based: just flag as a checkup reminder
      balanceCheckups.push(bill);
    }
  });

  // 5. Build HTML Email Body
  let htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #030816; color: #f4f7ff; padding: 30px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b;">
      <h2 style="color: #22d3ee; border-bottom: 2px solid #1e293b; padding-bottom: 10px; margin-top: 0;">⚡ Billzy Payment Reminder</h2>
      <p style="color: #94a3b8; font-size: 1.05rem;">Here is your utility bills overview for <strong>${currentMonthLabel}</strong>:</p>
  `;

  if (unpaidPostpaid.length === 0 && unpaidPrepaid.length === 0) {
    htmlContent += `
      <div style="background-color: #064e3b; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <strong style="color: #34d399;">✓ All clear!</strong>
        <p style="margin: 5px 0 0 0; color: #a7f3d0; font-size: 0.95rem;">All monthly prepaid and postpaid utility bills are paid up to date.</p>
      </div>
    `;
  } else {
    if (unpaidPrepaid.length > 0) {
      htmlContent += `
        <h3 style="color: #f59e0b; margin-top: 25px; font-size: 1.15rem;">⚠️ Unpaid Prepaid Bills (Due for ${currentMonthLabel}):</h3>
        <ul style="padding-left: 20px; line-height: 1.6; color: #e2e8f0;">
          ${unpaidPrepaid.map(b => `<li style="margin-bottom: 8px;"><strong>${b.name}</strong></li>`).join('')}
        </ul>
      `;
    }

    if (unpaidPostpaid.length > 0) {
      htmlContent += `
        <h3 style="color: #ef4444; margin-top: 25px; font-size: 1.15rem;">🚨 Unpaid Postpaid Bills (Due for ${lastMonthLabel}):</h3>
        <ul style="padding-left: 20px; line-height: 1.6; color: #e2e8f0;">
          ${unpaidPostpaid.map(b => `<li style="margin-bottom: 8px;"><strong>${b.name}</strong></li>`).join('')}
        </ul>
      `;
    }
  }

  if (balanceCheckups.length > 0) {
    htmlContent += `
      <h3 style="color: #38bdf8; margin-top: 30px; font-size: 1.1rem; border-top: 1px solid #1e293b; padding-top: 15px;">🔌 Balance-Based Accounts (Reminder to Check):</h3>
      <p style="color: #94a3b8; font-size: 0.95rem; margin-bottom: 10px;">Please check the live balances for these meters:</p>
      <ul style="padding-left: 20px; line-height: 1.5; color: #cbd5e1; font-size: 0.95rem;">
        ${balanceCheckups.map(b => `<li style="margin-bottom: 5px;">${b.name}</li>`).join('')}
      </ul>
    `;
  }

  htmlContent += `
      <div style="margin-top: 35px; padding-top: 15px; border-top: 1px solid #1e293b; text-align: center;">
        <a href="https://36pro.github.io/Billzy/" style="background-color: #22d3ee; color: #030816; text-decoration: none; padding: 10px 20px; font-weight: bold; border-radius: 8px; display: inline-block;">Open Billzy Dashboard ↗</a>
      </div>
      <p style="font-size: 0.8rem; color: #475569; text-align: center; margin-top: 30px;">Sent automatically by Billzy Actions Engine.</p>
    </div>
  `;

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
