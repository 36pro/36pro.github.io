/**
 * Add Payment Entry
 *
 * Called by the add-payment GitHub Actions workflow.
 * Reads data.json, appends a new payment entry, and writes it back.
 * The workflow handles git commit and push.
 */

const fs = require('fs');
const path = require('path');

const BILL_MAP = {
  rupnagarDesco:    { name: 'Rupnagar DESCO',    type: 'prepaid',  needsMonth: false },
  uttaraDesco:      { name: 'Uttara DESCO',      type: 'prepaid',  needsMonth: false },
  rupnagarGas:      { name: 'Rupnagar Gas',      type: 'prepaid',  needsMonth: false },
  uttaraWater:      { name: 'Uttara Water',      type: 'postpaid', needsMonth: true  },
  noakhaliPalli:    { name: 'Noakhali Palli',    type: 'postpaid', needsMonth: true  },
  matuailGas:       { name: 'Matuail Gas',       type: 'postpaid', needsMonth: true  },
  inspireBroadband: { name: 'Inspire Broadband', type: 'prepaid',  needsMonth: true  }
};

function generateUID() {
  return 'mr' + Math.random().toString(36).substring(2, 14);
}

function main() {
  const billId = process.env.INPUT_BILL_ID;
  const amount = process.env.INPUT_AMOUNT;
  let payDate = process.env.INPUT_PAY_DATE || '';
  let billMonth = process.env.INPUT_BILL_MONTH || '';

  // Validate bill ID
  if (!billId || !BILL_MAP[billId]) {
    console.error(`Invalid bill ID: "${billId}"`);
    console.error(`Valid options: ${Object.keys(BILL_MAP).join(', ')}`);
    process.exit(1);
  }

  // Validate amount
  const parsedAmount = parseFloat(amount);
  if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
    console.error(`Invalid amount: "${amount}". Must be a positive number.`);
    process.exit(1);
  }

  // Default payDate to today (Bangladesh time, UTC+6)
  if (!payDate.trim()) {
    const now = new Date();
    const bdTime = new Date(now.getTime() + 6 * 60 * 60 * 1000);
    payDate = bdTime.toISOString().slice(0, 10);
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(payDate)) {
    console.error(`Invalid date format: "${payDate}". Use YYYY-MM-DD.`);
    process.exit(1);
  }

  const bill = BILL_MAP[billId];

  // Resolve billMonth keywords → full "Month Year" string
  // Accepts: "auto", "last", "this", "none", "" or a full string like "August 2026"
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const bdNow = new Date(new Date().getTime() + 6 * 60 * 60 * 1000);
  const keyword = billMonth.trim().toLowerCase();

  if (keyword === 'none' || keyword === '') {
    // For bills that need a month and keyword is 'auto' handled below, otherwise empty
    billMonth = '';
  }

  if (keyword === 'auto') {
    if (bill.needsMonth) {
      if (bill.type === 'postpaid') {
        // Postpaid: bill month is typically the previous month
        const prev = new Date(bdNow.getFullYear(), bdNow.getMonth() - 1, 1);
        billMonth = `${monthNames[prev.getMonth()]} ${prev.getFullYear()}`;
      } else {
        // Prepaid with month (e.g. Inspire Broadband): current month
        billMonth = `${monthNames[bdNow.getMonth()]} ${bdNow.getFullYear()}`;
      }
    } else {
      billMonth = '';
    }
  } else if (keyword === 'last') {
    const prev = new Date(bdNow.getFullYear(), bdNow.getMonth() - 1, 1);
    billMonth = `${monthNames[prev.getMonth()]} ${prev.getFullYear()}`;
  } else if (keyword === 'this') {
    billMonth = `${monthNames[bdNow.getMonth()]} ${bdNow.getFullYear()}`;
  }
  // Otherwise keep whatever the user typed (e.g. "August 2026")

  // Build the new payment entry
  const entry = {
    uid: generateUID(),
    billId: billId,
    billName: bill.name,
    billType: bill.type,
    billMonth: billMonth.trim() || '',
    amount: String(parsedAmount),
    payDate: payDate,
    note: 'Added from iOS Shortcut',
    savedAt: new Date().toISOString()
  };

  // Read existing data.json
  const dataPath = path.join(__dirname, '../../data.json');
  let payments = [];
  try {
    const raw = fs.readFileSync(dataPath, 'utf8');
    payments = JSON.parse(raw);
    if (!Array.isArray(payments)) {
      console.error('data.json is not an array. Resetting.');
      payments = [];
    }
  } catch (err) {
    console.error('Error reading data.json:', err.message);
    console.log('Creating new data.json...');
    payments = [];
  }

  // Prepend new entry (newest first, matching existing order)
  payments.unshift(entry);

  // Write back
  fs.writeFileSync(dataPath, JSON.stringify(payments, null, 2) + '\n', 'utf8');

  console.log('Payment added successfully!');
  console.log(`  Bill:    ${bill.name} (${billId})`);
  console.log(`  Amount:  ${parsedAmount}`);
  console.log(`  Date:    ${payDate}`);
  console.log(`  Month:   ${billMonth || '(none)'}`);
  console.log(`  UID:     ${entry.uid}`);
  console.log(`  Total entries: ${payments.length}`);
}

main();
