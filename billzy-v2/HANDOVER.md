# Billzy: Master Architectural & Domain Handover Specification

> **Purpose of this Document**: This handover document provides an exhaustive, forensic guide to the **Billzy** utility tracking system. It details every business rule, account number, cycle formula, edge case, and data contract reverse-engineered from 193 git commits and the 11,839-line legacy implementation. Feed this document to any subsequent agent or engineer tasked with UI redesign or backend expansion.

---

## 1. Executive Context & System Overview

- **Application Name**: Billzy (Dhaka Utility & Subscription HQ)
- **Primary User / Remitter**: `Mehedium` / MD. Mahadi Hasan
- **Geographic Context**: Dhaka, Bangladesh (BST: UTC+6)
- **Core Mission**: Manage and track 9 distinct utility, broadband, fitness, and municipal land revenue accounts across Dhaka and Noakhali.
- **Key Challenge**: Each utility follows unique, idiosyncratic Bangladeshi municipal billing cycles, government agency deadlines, tiered delay fines, and custom subscription cycle rules.

---

## 2. Repository Topology & Folder Separation

The codebase is strictly separated into two independent directories:

```
Y:\stuff\Billzy\
│
├── [LEGACY WORKSPACE - Pristine & Untouched]
│   ├── index.html                 # Original 11,839-line legacy monolith
│   ├── data.json                  # Canonical historical payment records
│   ├── .github/                   # GitHub Actions workflows & scripts
│   │   ├── workflows/             # add-payment.yml, bill-reminder.yml, desco-balance-alert.yml
│   │   └── scripts/               # add-payment.js, check-desco-balance.js, send-email.js
│   ├── email-template.html        # Warm light paper-theme bill reminder template
│   ├── favicon.svg / favicon.ico  # Mobius brand icons
│   └── SPEC.md                    # Initial reverse-engineered specification
│
└── billzy-v2/                     # [MODERN OVERHAUL - Feed to Next Agent]
    ├── SPEC.md                    # Formal Invariants & Quirks Matrix
    ├── HANDOVER.md                # This complete handover guide
    ├── data.json                  # Isolated copy for regression tests & offline load
    ├── package.json               # Vite, Vitest, TypeScript, Zod configuration
    ├── tsconfig.json              # Strict TypeScript compiler options
    ├── vite.config.ts             # Path aliases (@/*) and Vitest setup
    ├── index.html                 # Modern entry point mounting <div id="app">
    │
    ├── src/
    │   ├── main.ts                # Application bootstrapper & reactive renderer
    │   ├── core/
    │   │   ├── contracts/         # Strict Zod schemas & TypeScript interfaces
    │   │   │   ├── payment.ts     # PaymentRecordSchema & EnrichedPaymentRecord
    │   │   │   ├── utility.ts     # Metadata for all 9 utility accounts
    │   │   │   ├── cycles.ts      # Domain interfaces for Gym, Titas, Land Tax, Due results
    │   │   │   └── storage.ts     # LocalStorage keys & default rates
    │   │   ├── domain/            # Pure, headless TypeScript business logic
    │   │   │   ├── bill-month.ts  # Parsers, formatters, dropdown window limits
    │   │   │   ├── duplicate.ts   # Half-open intervals, FY matching, collision detection
    │   │   │   ├── fee-splitting.ts# Recharge gateway fee extraction vs strict preserve
    │   │   │   ├── titas-gas.ts   # Tiered late fee math & dual-unit format
    │   │   │   ├── gym-cycle.ts   # 20th-to-20th cycle advance & amount splitting
    │   │   │   ├── land-tax.ts    # Bangladeshi Fiscal Year (Apr 1 - Mar 31) cycles
    │   │   │   ├── seasonal.ts    # Summer (Mar-Sep) vs Winter (Oct-Feb) intelligence
    │   │   │   └── due-dates.ts   # Next due date & status calculation for all utilities
    │   │   └── storage/           # Persistence adapters
    │   │       ├── csv-exporter.ts# UTF-8 BOM CSV generator (\uFEFF)
    │   │       ├── migration.ts   # data.json validation with zero timestamp drift
    │   │       └── local-adapter.ts# LocalStorage & offline memory cache
    │   └── ui/
    │       ├── tokens.ts          # Semantic status tokens & accessibility rules
    │       ├── state.ts           # Central reactive state store & filters
    │       ├── styles.css         # Cyber glass styling & mobile-first layout
    │       └── components/        # Decomposed UI views and dialogs
    │           ├── Navbar.ts
    │           ├── ToastContainer.ts
    │           ├── LandingView.ts
    │           ├── DashboardView.ts
    │           ├── DatabaseView.ts (Responsive stacked table & filters)
    │           ├── AnalyticsView.ts(Seasonal burn rate comparisons)
    │           ├── PaymentModal.ts (Tailored rapid entry modal)
    │           └── EditModal.ts    (Universal record editor)
    │
    └── tests/
        └── domain/                # 8 Vitest suites, 38 passing tests (100% coverage)
            ├── titas-gas.test.ts
            ├── gym-cycle.test.ts
            ├── fee-splitting.test.ts
            ├── duplicate.test.ts
            ├── land-tax.test.ts
            ├── dropdown-and-dates.test.ts
            ├── historical-data.test.ts
            └── design-tokens.test.ts
```

---

## 3. Account Registry & Domain Rules Matrix

| Utility ID | Utility Title | Category | Billing Type | Account / Meter | Location | Default Rate / Fee | Due Date & Cycle Formula | Late Fee & Surcharge Rules | Auto-Split Eligible? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `rupnagarDesco` | Rupnagar DESCO | Electric | Prepaid | `140-10-368` | Mirpur, Dhaka | Variable recharge | Measured in days since last payment (`now - payDate`). | Manual fee entry supported. | **YES** (auto-extracts remainder if $\% 100 \le 60$) |
| `uttaraDesco` | Uttara DESCO | Electric | Prepaid | `250-38-654` | Uttara Sec 4, Dhaka | Variable recharge | Days since last payment (`now - payDate`). | Manual fee entry supported. | **YES** (auto-extracts remainder if $\% 100 \le 60$) |
| `rupnagarGas` | Rupnagar Gas | Gas | Prepaid | `110-407-082-016` | Rupnagar, Dhaka | Variable recharge | Days since last payment (`now - payDate`). | Manual fee entry supported. | **YES** (auto-extracts remainder if $\% 100 \le 60$) |
| `uttaraWater` | Uttara Water | Water | Postpaid | `0901798991` | Uttara, Dhaka | Usage-based | Next due: 1st of month following 2 months after bill month (`paidMonth + 2 months, 1st`). Overdue in days (`{N}d`). | Manual fee entry only. | **NO** (Strictly preserves exact raw amount) |
| `noakhaliPalli` | Noakhali Palli | Electric | Postpaid | `103-102-312-7100` | Noakhali | Usage-based | Next due: 1st of month following 2 months after bill month (`paidMonth + 2 months, 1st`). Overdue in days (`{N}d`). | Manual fee entry only. | **NO** (Strictly preserves exact raw amount) |
| `matuailGas` | Matuail Gas | Gas | Postpaid | `108-26-719` | Matuail, Dhaka | `1080` Tk/mo | Next due: 21st of next month (`paidMonth + 1 month, 21st`). Multi-month selection allowed. Overdue in fractional months (`N.N M`). | **Tiered Titas Late Fee**: Due deadline is the 21st. If paid $> 21\text{st}$: $\le 6$ mo overdue = $10$ Tk/mo; $> 6$ mo overdue = $20$ Tk/mo. | **NO** (Fee box is explicit Titas surcharge/fine) |
| `inspireBroadband` | Inspire Broadband | Internet | Prepaid | `rpmehedi6` | Mirpur, Dhaka | `840` Tk/mo | Next due: 1st of next month (`paidMonth + 1 month, 1st`). Calculated strictly by billing month, **NOT** payDate (commit `bc2d5bc`). | Manual fee entry only. | **NO** (Commit `7e79bed` eliminated auto-split) |
| `gym` | Gym | Fitness | Prepaid | `1724` | Fitness Club | `1700` Tk/mo | **20th-to-20th cycle coverage**: starts on 20th of last recorded end month. Next due date is the 21st. | No gateway splitting. | **NO** (Variable lump sum split evenly across duration) |
| `landTax` | Land Tax | Tax | Prepaid | `LT-9921` | Dhaka Municipal | Per property | **Bangladeshi Fiscal Year**: April 1 to March 31 (`FY YY-YY (Apr 1 - Mar 31)`). Next due date is April 1st of next fiscal year. | Surcharge field beside amount box. | **NO** (Supports multi-year range 1-5 years) |

---

## 4. Invariants, Quirks & Algorithmic Specifications

### 4.1 Gym 20th-to-20th Cycles & Half-Open Overlap Detection
- **Cycle Math**:
  - `startCycleDate`: 20th of the anchor month (derived from the end month of last payment, or current month if today $\ge 20$).
  - `endCycleDate`: `startCycleDate + duration months` on the 20th.
  - `dueDate`: `startCycleDate + duration months` on the 21st.
- **Half-Open Interval Check (`doGymCyclesOverlap`)**:
  Two cycles $[s_1, e_1)$ and $[s_2, e_2)$ overlap if and only if:
  $$s_1 < e_2 \land s_2 < e_1$$
  *Invariant*: A cycle ending on Oct 20 ($e_1 = \text{Oct 20}$) and a subsequent cycle starting on Oct 20 ($s_2 = \text{Oct 20}$) evaluates to `false` (no false duplicate collision). Fixed in commit `b1fb76a`.
- **Variable Amount Split**:
  User can enter any total amount across $D$ months. The monthly split is computed as:
  $$\text{monthlySplit} = \text{round}(\text{totalAmount} / D)$$
- **Subscription Pause Toggle**:
  Stored in `billzy_gym_paused`. When paused, the status displays `"Subscription Paused" / "On Hold (No Dues)"`, suppressing overdue warnings.

### 4.2 Titas Gas Tiered Late Fee & Dual-Unit Output
- **Tiered Formula (`calculateTitasGasDue`)**:
  For each month $m$ in the billing range from $M_{\text{start}}$ to $M_{\text{end}}$:
  1. `dueDeadline` = `21st of month m at 23:59:59.999`.
  2. If `paymentDate > dueDeadline`:
     - `sixMonthsPastDue` = `21st of (month m + 6 months) at 23:59:59.999`.
     - If `paymentDate > sixMonthsPastDue`: fee $= 20\text{ BDT}$.
     - Else: fee $= 10\text{ BDT}$.
  3. Else: fee $= 0\text{ BDT}$.
- **Dual-Unit Formatting**:
  Matuail Gas displays:
  $$\text{dueText} = \text{totalDue.toLocaleString()} + \text{ " ("} + \text{monthsFraction} + \text{" M"} + (\text{fine} > 0 ? \text{" +" + fine} : \text{""}) + \text{")"}$$
  *Example*: `6,580 (6.2 M +100)`. Note: Currency prefix (৳) was removed in commit `6ba5061`.
- **Fractional Months Formula**:
  $$\text{diffDays} = \max\left(0, \left\lfloor \frac{\text{today} - \text{nextUnpaidStart}}{86400000} \right\rfloor + 1\right)$$
  $$\text{monthsFraction} = \max\left(0.1, \text{round}\left(\frac{\text{diffDays}}{30.4375} \times 10\right) / 10\right)$$
  *Invariant*: Overdue duration in months ($M$) is exclusive to Matuail Gas. All other utilities display days ($d$) (commit `9aa8b6b`).

### 4.3 Land Tax Bangladeshi Fiscal Year & Multi-Property Invariants
- **Bangladeshi Fiscal Year**: Defined strictly as **April 1 to March 31** (commit `9ea7da0`).
- **3 Bengali Properties**:
  1. `মাতুয়াইল` (Matuail) — Default rate: $1,500\text{ BDT}$ (`billzy_landtax_rate_matuail`).
  2. `উত্তরখান` (Uttarkhan) — Default rate: $2,000\text{ BDT}$ (`billzy_landtax_rate_uttarkhan`).
  3. `কেশুরবাগ` (Keshurbag) — Default rate: $850\text{ BDT}$ (`billzy_landtax_rate_keshurbag`).
- **Start Year Auto-Derivation**:
  Examining the last payment for the selected property:
  - If last payment ended in month 2 (March): `startYear = parsedEnd.getFullYear()`.
  - Else: `startYear = parsedEnd.getFullYear() + 1`.
  - Fallback if no payment: `currentMonth >= 3 ? currentYear : currentYear - 1`.
- **Due Date**: Always April 1st of `endYear + 1`.
- **Receipt Archival**: Supports receipt URL, file name, and drawer location metadata (`receiptUrl`, `receiptFileName`, `receiptLocation`).

### 4.4 Gateway Fee Auto-Splitting Engine
- **Eligible Bills**: `['rupnagarDesco', 'uttaraDesco', 'rupnagarGas']`
- **Condition**: User left fee box empty ($0$) AND `rawAmount > 100` AND `(rawAmount % 100) > 0` AND `(rawAmount % 100) <= 60`.
- **Split Formula**:
  $$\text{fee} = \text{rawAmount} \pmod{100}, \quad \text{baseAmount} = \text{rawAmount} - \text{fee}$$
  *Example*: A recharge of $1,015\text{ BDT}$ splits into $1,000\text{ BDT}$ base amount and $15\text{ BDT}$ gateway fee.
- **Excluded Utilities**: `['inspireBroadband', 'matuailGas', 'noakhaliPalli', 'uttaraWater', 'gym', 'landTax']`. These must preserve the exact raw amount. For example, Inspire Broadband ($840\text{ BDT}$) remainder is $40 \le 60$, but it is **NEVER** auto-split.

### 4.5 Billing Month Dropdown Window
- The month selector is restricted to strictly **2 earlier paid months** (`pastCount = 2`) relative to the anchor unpaid month, plus the current month and up to 12 future projection months (commit `8172810`).
- Generated options: `Month YYYY` (e.g. `June 2026`, `July 2026`, `August 2026`).

### 4.6 Universal Duplicate Entry Prevention (`checkDuplicatePayment`)
- **Gym**: Checks `doGymCyclesOverlap(newCycle, existingCycle)` using half-open $[s, e)$.
- **Matuail Gas**: Checks `doMonthRangesOverlap(newRange, existingRange)`.
- **Land Tax**: Checks `isLandTaxFYMatch(newFY, existingFY)` for the same property.
- **General Utilities**: Checks `isBillingMonthMatch(newMonth, existingMonth)`.
- **Edit Modal Bypass**: When editing an existing payment, `excludeUid === p.uid` allows saving changes without false self-collisions.

### 4.7 Seasonal Electricity & Utility Intelligence
- **Summer**: March to September (months index 2 to 8). High cooling and fan loads.
- **Winter**: October to February (months index 9, 10, 11, 0, 1). Low baseline consumption.
- **Days / 1,000 Tk Formula**:
  $$\text{daysPer1k} = \frac{\text{totalDays}}{\text{totalAmount} / 1000}, \quad \text{dailyBurn} = \frac{\text{totalAmount}}{\text{totalDays}}$$
- **Seasonal Prioritization**: When calculating prepaid burn rate efficiency, active seasonal cycles are prioritized over multi-year averages (commit `2d321c2`).
- **DESCO Live API Blending**: Blends recent daily meter reads ($60\%$ weight) with 24-month historical seasonal patterns ($40\%$ weight).

---

## 5. Automation, Shortcuts & Backend Integrations

1. **iOS Shortcut Payment Logging** (`.github/workflows/add-payment.yml` & `.github/scripts/add-payment.js`):
   - Accepts environment inputs: `INPUT_BILL_ID`, `INPUT_AMOUNT`, `INPUT_PAY_DATE`, `INPUT_BILL_MONTH`.
   - Resolves month keywords: `"auto"` (auto-detects next unpaid month for Inspire Broadband), `"last"` (previous month for postpaid), `"this"` (current month), or `"none"`.
   - Appends `"Added from iOS Shortcut"` note and writes directly to `data.json`.
2. **Daily DESCO Low Balance Alert** (`.github/workflows/desco-balance-alert.yml` & `.github/scripts/check-desco-balance.js`):
   - Runs on cron schedule using Node.js `https` with browser spoofing headers.
   - Queries DESCO customer portal for accounts `140-10-368` and `250-38-654`.
   - Dispatches HTML reminder email when balance drops below threshold.
3. **Monthly Bill Reminders** (`.github/workflows/bill-reminder.yml` & `.github/scripts/send-email.js`):
   - Injects pending utility statuses into `email-template.html` (warm paper light design) and sends via SMTP.

---

## 6. Data Contracts & LocalStorage Inventory

### 6.1 PaymentRecord Schema (Zod)
```typescript
export const PaymentRecordSchema = z.object({
  uid: z.string().min(1),
  billId: z.string().min(1),
  billName: z.string().min(1),
  billType: z.string().toLowerCase(),
  utilityCategory: z.string().optional(),
  billMonth: z.string().optional(),
  amount: z.string(),
  amountNum: z.number().optional(),
  fee: z.string().optional(),
  feeNum: z.number().optional(),
  totalPaid: z.number().optional(),
  payDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  savedAt: z.string().optional(),
  timestamp: z.number().optional(),
  property: z.string().optional(),
  receiptUrl: z.string().optional(),
  receiptFileName: z.string().optional(),
  receiptLocation: z.string().optional(),
  note: z.string().optional()
});
```

### 6.2 LocalStorage Keys
- `billzy_firestore_cache`: Serialized array of `PaymentRecord[]`.
- `billzy_local_payments`: Array of offline/locally added payment records awaiting cloud sync.
- `billzy_matuail_rate`: Stringified numeric monthly rate (default `'1080'`).
- `billzy_gym_paused`: `'true' | 'false'`.
- `billzy_landtax_rate_matuail`: Stringified rate (default `'1500'`).
- `billzy_landtax_rate_uttarkhan`: Stringified rate (default `'2000'`).
- `billzy_landtax_rate_keshurbag`: Stringified rate (default `'850'`).

### 6.3 CSV Export Schema
- **Format**: UTF-8 with BOM (`\uFEFF`).
- **Columns**: `Transaction ID,Date Paid,Utility Name,Category,Account / Meter No,Billing Type,Billing Month,Main Amount (BDT),Fee (BDT),Total Paid (BDT),Property / Note,Receipt Link / File,Created At (UTC)`.
- **Order**: Sorted descending by `payDate`.

---

## 7. Automated Test Suite & Verification Commands

All commands must be executed inside `Y:\stuff\Billzy\billzy-v2\`:

```powershell
# 1. Install dependencies
cd Y:\stuff\Billzy\billzy-v2
npm install

# 2. Run the 38 domain regression tests (100% passing)
npm test

# 3. Verify strict TypeScript compliance
npm run typecheck

# 4. Production build
npm run build

# 5. Start development preview server
npm run dev
```

### Verified Test Fixture Summary
1. `tests/domain/titas-gas.test.ts`: Verifies $0$ fee before 21st, $10$ Tk tier ($\le 6$ mo), $20$ Tk tier ($> 6$ mo), multi-month ranges, and `${totalDue} (${monthsFraction} M${fine})` formatting.
2. `tests/domain/gym-cycle.test.ts`: Verifies half-open $[s, e)$ consecutive cycle non-collision, true collision detection, and variable lump sum split.
3. `tests/domain/fee-splitting.test.ts`: Verifies auto-split eligibility on DESCO/Gas vs strict raw preservation on Inspire Broadband/WASA/Matuail.
4. `tests/domain/duplicate.test.ts`: Verifies duplicate month detection across all utilities, land tax per-property isolation, and edit modal UID bypass.
5. `tests/domain/land-tax.test.ts`: Verifies 3 Bengali properties, April 1 due date calculation, multi-year duration ranges, and display formatters.
6. `tests/domain/dropdown-and-dates.test.ts`: Verifies 2 earlier paid months limit, date parsers, summer/winter classification, and gym pause state.
7. `tests/domain/historical-data.test.ts`: Tests 100% of records in `data.json` against Zod schema, verifying zero data loss and zero timestamp drift.
8. `tests/domain/design-tokens.test.ts`: Verifies $\ge 48\text{px}$ touch target tokens, semantic status styles, and typography font families.

---

## 8. Guidance for the UI Redesign Agent

When undertaking the visual and interaction redesign:

1. **Keep Pure Domain Modules Intact**: Do not modify files in `src/core/domain/` or `src/core/contracts/`. All business calculations, late fees, and duplicate detection are proven by the 38 unit tests.
2. **Preserve Mobile Constraints**:
   - Every interactive element (inputs, buttons, select triggers, icon taps) must maintain a minimum touch target of $\ge 48\text{px}$.
   - Ensure zero horizontal scrolling on narrow $360\text{px}$ viewports.
   - Maintain responsive stacked column layouts for the database table on viewports $< 820\text{px}$.
3. **Typography Invariants**:
   - Currency and amount figures must use the tabular numeric font `Outfit`.
   - Bengali property names (`মাতুয়াইল`, `উত্তরখান`, `কেশুরবাগ`) must use `Tiro Bangla` with the `.bnFont` class.
   - Account numbers, transaction IDs, and meter identifiers must use `JetBrains Mono`.
4. **Status Design Tokens**: Use the semantic status mapping in `src/ui/tokens.ts` for all UI badges:
   - Green (`#00E676`): Paid, Up to date, Active.
   - Cyan (`#00C2FF`): Due soon, Electric utility, Informational.
   - Orange (`#FF7A00`): Gas utility, Surcharges, Gateway fees.
   - Red (`#ff6077`): Overdue bills, Negative balances.
   - Amber (`#ffb84d`): Warnings, Due within 5 days, Paused subscriptions.
5. **State Integration**: Use `src/ui/state.ts` (`appStore`) to trigger modals, filter table records, manage active tabs, and dispatch toasts.
