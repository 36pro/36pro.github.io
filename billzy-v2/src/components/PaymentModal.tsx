import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  Chip
} from '@heroui/react';
import {
  CreditCard,
  AlertCircle,
  Dumbbell,
  Flame,
  Building,
  Info
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BillId } from '../core/contracts/payment';
import { BILL_DEFINITIONS, UtilityDefinition } from '../core/contracts/utility';
import { parseBillMonth, formatLocalDate, getBillingMonthOptions } from '../core/domain/bill-month';
import { calculateTitasGasDue } from '../core/domain/titas-gas';
import { getGymNextCycle } from '../core/domain/gym-cycle';
import { getLandTaxNextCycle, LAND_TAX_PROPERTIES } from '../core/domain/land-tax';
import { calculateEntryFee, AUTO_SPLIT_ELIGIBLE_BILLS } from '../core/domain/fee-splitting';
import { checkDuplicatePayment } from '../core/domain/duplicate';

export const PaymentModal: React.FC = () => {
  const {
    isPaymentModalOpen,
    closePaymentModal,
    selectedBillId,
    payments,
    addPayment,
    matuailRate
  } = useApp();

  // Responsive placement: bottom-sheet drawer on mobile, centered on desktop
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Form states
  const [billId, setBillId] = useState<BillId>('rupnagarDesco');
  const [amount, setAmount] = useState<string>('');
  const [fee, setFee] = useState<string>('');
  const [payDate, setPayDate] = useState<string>(formatLocalDate(new Date()));
  const [billMonth, setBillMonth] = useState<string>('');
  const [property, setProperty] = useState<string>('মাতুয়াইল');
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [receiptLocation, setReceiptLocation] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Gym-specific
  const [gymDuration, setGymDuration] = useState<number>(1);

  // Matuail Gas multi-month
  const [gasFromMonth, setGasFromMonth] = useState<string>('');
  const [gasToMonth, setGasToMonth] = useState<string>('');

  // Land Tax years
  const [landTaxDuration, setLandTaxDuration] = useState<number>(1);

  // Sync billId when modal opens with preselection
  useEffect(() => {
    if (selectedBillId && selectedBillId in BILL_DEFINITIONS) {
      setBillId(selectedBillId as BillId);
    }
    setErrorMessage(null);
  }, [selectedBillId, isPaymentModalOpen]);

  const currentBillDef: UtilityDefinition =
    BILL_DEFINITIONS[billId as keyof typeof BILL_DEFINITIONS] || BILL_DEFINITIONS.rupnagarDesco;

  // Payments for this bill
  const currentBillPayments = useMemo(() => {
    return payments
      .filter(p => p.billId === billId)
      .sort((a, b) => (b.payDate || '').localeCompare(a.payDate || ''));
  }, [payments, billId]);

  // Dropdown options for standard utilities
  const standardMonthOptions = useMemo(() => {
    const options = getBillingMonthOptions(new Date(), 2, 12);
    const paidMonths = new Set(
      currentBillPayments.map(p => (p.billMonth ? p.billMonth.trim().toLowerCase() : ''))
    );
    return options.map(opt => ({
      value: opt,
      label: opt,
      isPaid: paidMonths.has(opt.toLowerCase())
    }));
  }, [currentBillPayments]);

  const getPropDefaultRate = (propName: string) => {
    const match = LAND_TAX_PROPERTIES.find(p => p.name === propName);
    return match ? match.defaultRate : 1500;
  };

  // Reset & Prefill when billId changes
  useEffect(() => {
    setErrorMessage(null);
    const now = new Date();
    setPayDate(formatLocalDate(now));

    if (billId === 'gym') {
      const nextCycle = getGymNextCycle(currentBillPayments, gymDuration, now);
      setBillMonth(nextCycle.rangeLabel);
      setAmount('1700');
      setFee('');
    } else if (billId === 'matuailGas') {
      // Find last paid month
      const last = currentBillPayments[0];
      const parsedLast = last ? parseBillMonth(last.billMonth) : null;
      let start: Date;
      if (parsedLast) {
        start = new Date(parsedLast.getFullYear(), parsedLast.getMonth() + 1, 1);
      } else {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      const fromStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
      setGasFromMonth(fromStr);
      setGasToMonth(fromStr);

      const gasDue = calculateTitasGasDue(start, start, now);
      const totalAmount = matuailRate * gasDue.monthCount;
      setAmount(String(totalAmount));
      setFee(gasDue.totalFee > 0 ? String(gasDue.totalFee) : '');
    } else if (billId === 'landTax') {
      const cycle = getLandTaxNextCycle(currentBillPayments, property, landTaxDuration, now);
      setBillMonth(cycle.displayRange);
      const defaultAmt = getPropDefaultRate(property) * landTaxDuration;
      setAmount(String(defaultAmt));
      setFee('');
    } else if (currentBillDef.formType === 'postpaid') {
      if (standardMonthOptions.length > 0) {
        // Find first unpaid option
        const firstUnpaid = standardMonthOptions.find(o => !o.isPaid);
        setBillMonth(firstUnpaid ? firstUnpaid.value : standardMonthOptions[0].value);
      }
      setAmount(currentBillDef.defaultRate ? String(currentBillDef.defaultRate) : '');
      setFee('');
    } else {
      // Prepaid
      setBillMonth('');
      setAmount('');
      setFee('');
    }
  }, [billId, currentBillPayments, currentBillDef, isPaymentModalOpen, matuailRate, property]);

  // Update Gym cycle when duration changes
  useEffect(() => {
    if (billId === 'gym') {
      const nextCycle = getGymNextCycle(currentBillPayments, gymDuration, new Date());
      setBillMonth(nextCycle.rangeLabel);
    }
  }, [gymDuration, billId, currentBillPayments]);

  // Update Land Tax when property or duration changes
  useEffect(() => {
    if (billId === 'landTax') {
      const cycle = getLandTaxNextCycle(currentBillPayments, property, landTaxDuration, new Date());
      setBillMonth(cycle.displayRange);
      const defaultAmt = getPropDefaultRate(property) * landTaxDuration;
      setAmount(String(defaultAmt));
    }
  }, [property, landTaxDuration, billId, currentBillPayments]);

  // Update Matuail Gas when from/to month changes
  useEffect(() => {
    if (billId === 'matuailGas' && gasFromMonth && gasToMonth) {
      const [fromY, fromM] = gasFromMonth.split('-').map(Number);
      const [toY, toM] = gasToMonth.split('-').map(Number);
      const fromDate = new Date(fromY, fromM - 1, 1);
      const toDate = new Date(toY, toM - 1, 1);

      if (toDate >= fromDate) {
        const fromName = fromDate.toLocaleString('en-US', { month: 'short' });
        const toName = toDate.toLocaleString('en-US', { month: 'short' });
        const label =
          fromY === toY && fromM === toM
            ? `${fromName} ${fromY}`
            : `${fromName} ${fromY} - ${toName} ${toY}`;
        setBillMonth(label);

        const gasDue = calculateTitasGasDue(fromDate, toDate, new Date(payDate || new Date()));
        const baseAmt = matuailRate * gasDue.monthCount;
        setAmount(String(baseAmt));
        setFee(gasDue.totalFee > 0 ? String(gasDue.totalFee) : '');
      }
    }
  }, [gasFromMonth, gasToMonth, billId, matuailRate, payDate]);

  // Compute live breakdown per SPEC.md
  const feeCalculation = useMemo(() => {
    const rawAmt = parseFloat(amount) || 0;
    return calculateEntryFee(billId, rawAmt, fee);
  }, [billId, amount, fee]);

  const handleSubmit = async () => {
    setErrorMessage(null);
    const parsedAmt = parseFloat(amount);
    if (isNaN(parsedAmt) || parsedAmt <= 0) {
      setErrorMessage('Please enter a valid payment amount');
      return;
    }
    if (!payDate) {
      setErrorMessage('Please select a payment date');
      return;
    }

    // Check duplicate
    if (billMonth) {
      const dup = checkDuplicatePayment(
        payments,
        billId,
        billMonth,
        { property }
      );
      if (dup) {
        setErrorMessage(dup.message);
        return;
      }
    }

    const res = await addPayment({
      billId,
      amount: parsedAmt,
      payDate,
      billMonth,
      fee: fee !== '' ? fee : undefined,
      property: billId === 'landTax' ? property : undefined,
      receiptUrl,
      receiptLocation,
      note
    });

    if (!res.success && res.error) {
      setErrorMessage(res.error);
    }
  };

  const isAutoSplitEligible = AUTO_SPLIT_ELIGIBLE_BILLS.includes(
    billId as (typeof AUTO_SPLIT_ELIGIBLE_BILLS)[number]
  );

  return (
    <Modal
      isOpen={isPaymentModalOpen}
      onClose={closePaymentModal}
      placement={isMobile ? 'bottom' : 'center'}
      scrollBehavior="inside"
      size="lg"
      className="max-h-[92vh] sm:max-h-[85vh] bg-surface text-foreground border border-border rounded-t-2xl sm:rounded-[var(--radius)] shadow-2xl"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <CreditCard size={20} className="text-accent" />
            <h2 className="text-lg sm:text-xl font-bold font-sans">
              Log New Utility Payment
            </h2>
          </div>
          <span className="text-xs text-muted">
            Enforces strict Dhaka billing rules, auto-splitting & cycle boundaries per SPEC.md
          </span>
        </ModalHeader>

        <ModalBody className="space-y-4 py-4">
          {errorMessage && (
            <div className="p-3 rounded-[var(--field-radius)] bg-danger/15 border border-danger/30 text-danger text-xs sm:text-sm flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Service Selector */}
          <div>
            <label className="text-xs font-bold text-foreground/80 mb-1.5 block">
              Utility / Subscription Service
            </label>
            <Select
              selectedKeys={[billId]}
              onSelectionChange={keys => {
                const selected = Array.from(keys)[0] as BillId;
                if (selected) setBillId(selected);
              }}
              variant="flat"
              aria-label="Select Utility Service"
              classNames={{
                trigger: 'bg-surface-secondary border border-border rounded-[var(--field-radius)] h-11'
              }}
            >
              {Object.values(BILL_DEFINITIONS).map(b => (
                <SelectItem key={b.id} textValue={b.name}>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{b.name}</span>
                    <span className="text-xs text-muted font-mono-code">{b.account}</span>
                  </div>
                </SelectItem>
              ))}
            </Select>
          </div>

          {/* Dynamic Controls based on Service Type */}

          {/* A. GYM CONTROLS */}
          {billId === 'gym' && (
            <div className="p-3 rounded-[var(--field-radius)] bg-surface-secondary/70 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Dumbbell size={15} />
                  20th-to-20th Subscription Cycle
                </span>
                <span className="text-xs font-mono-code font-bold text-foreground">
                  {billMonth}
                </span>
              </div>

              <div>
                <label className="text-[11px] text-muted block mb-1">
                  Billing Duration (Months)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 6, 12].map(d => (
                    <Button
                      key={d}
                      size="sm"
                      variant={gymDuration === d ? 'solid' : 'flat'}
                      color={gymDuration === d ? 'primary' : 'default'}
                      className={`flex-1 rounded-[var(--field-radius)] h-9 text-xs font-bold ${
                        gymDuration === d
                          ? 'bg-accent text-accent-foreground'
                          : 'bg-surface text-foreground/80'
                      }`}
                      onClick={() => {
                        setGymDuration(d);
                        setAmount(String(1700 * d));
                      }}
                    >
                      {d}M
                    </Button>
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-muted leading-tight">
                Lump sum is evenly distributed ({Math.round((parseFloat(amount) || 0) / gymDuration)} Tk/mo) across half-open [start, end) cycles.
              </p>
            </div>
          )}

          {/* B. TITAS GAS (Matuail Gas) CONTROLS */}
          {billId === 'matuailGas' && (
            <div className="p-3 rounded-[var(--field-radius)] bg-surface-secondary/70 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-orange-400 flex items-center gap-1.5">
                  <Flame size={15} />
                  Titas Gas Multi-Month Tiered Fine
                </span>
                <span className="text-xs text-muted">Rate: {matuailRate} Tk/mo</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-muted block mb-1">From Month</label>
                  <Input
                    type="month"
                    value={gasFromMonth}
                    onChange={e => setGasFromMonth(e.target.value)}
                    classNames={{
                      inputWrapper: 'bg-surface border border-border rounded-[var(--field-radius)] h-10'
                    }}
                  />
                </div>
                <div>
                  <label className="text-[11px] text-muted block mb-1">To Month</label>
                  <Input
                    type="month"
                    value={gasToMonth}
                    onChange={e => setGasToMonth(e.target.value)}
                    classNames={{
                      inputWrapper: 'bg-surface border border-border rounded-[var(--field-radius)] h-10'
                    }}
                  />
                </div>
              </div>

              {feeCalculation.fee > 0 && (
                <div className="p-2 rounded bg-warning/15 border border-warning/30 text-[11px] text-warning flex items-center gap-2">
                  <Info size={14} />
                  <span>
                    Late fine calculated: ৳ {feeCalculation.fee} (Tiered: 10 Tk &le; 6m, 20 Tk &gt; 6m past 21st)
                  </span>
                </div>
              )}
            </div>
          )}

          {/* C. LAND TAX CONTROLS */}
          {billId === 'landTax' && (
            <div className="p-3 rounded-[var(--field-radius)] bg-surface-secondary/70 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                  <Building size={15} />
                  Bangladeshi Fiscal Year (Apr 1 - Mar 31)
                </span>
                <span className="text-xs font-mono-code font-bold text-foreground">
                  {billMonth}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-muted block mb-1">Property</label>
                  <Select
                    selectedKeys={[property]}
                    onSelectionChange={keys => {
                      const sel = Array.from(keys)[0] as string;
                      if (sel) setProperty(sel);
                    }}
                    classNames={{
                      trigger: 'bg-surface border border-border rounded-[var(--field-radius)] h-10 font-bangla'
                    }}
                    aria-label="Select Land Tax Property"
                  >
                    {LAND_TAX_PROPERTIES.map(p => (
                      <SelectItem key={p.name} textValue={p.name}>
                        <span className="font-bangla font-semibold text-sm">{p.name}</span>
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="text-[11px] text-muted block mb-1">Duration (Years)</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 5].map(y => (
                      <Button
                        key={y}
                        size="sm"
                        variant={landTaxDuration === y ? 'solid' : 'flat'}
                        color={landTaxDuration === y ? 'primary' : 'default'}
                        className={`flex-1 rounded-[var(--field-radius)] h-10 text-xs font-bold ${
                          landTaxDuration === y
                            ? 'bg-accent text-accent-foreground'
                            : 'bg-surface text-foreground/80'
                        }`}
                        onClick={() => setLandTaxDuration(y)}
                      >
                        {y}Y
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* D. GENERAL POSTPAID MONTH DROPDOWN */}
          {currentBillDef.formType === 'postpaid' && billId !== 'matuailGas' && (
            <div>
              <label className="text-xs font-bold text-foreground/80 mb-1.5 block">
                Billing Month
              </label>
              <Select
                selectedKeys={[billMonth]}
                onSelectionChange={keys => {
                  const sel = Array.from(keys)[0] as string;
                  if (sel) setBillMonth(sel);
                }}
                classNames={{
                  trigger: 'bg-surface-secondary border border-border rounded-[var(--field-radius)] h-11'
                }}
                aria-label="Select Billing Month"
              >
                {standardMonthOptions.map(opt => (
                  <SelectItem key={opt.value} textValue={opt.label}>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">{opt.label}</span>
                      {opt.isPaid && (
                        <Chip size="sm" variant="flat" color="success" className="text-[10px] h-5">
                          Paid
                        </Chip>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </Select>
            </div>
          )}

          {/* Amount & Fee Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-foreground/80 mb-1 block">
                Amount (BDT ৳)
              </label>
              <Input
                type="number"
                placeholder="e.g. 1000"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                startContent={<span className="text-muted font-mono-code text-sm">৳</span>}
                classNames={{
                  inputWrapper: 'bg-surface-secondary border border-border rounded-[var(--field-radius)] h-11 font-amount text-base font-bold'
                }}
              />
              {isAutoSplitEligible && !fee && (
                <span className="text-[11px] text-muted mt-1 block">
                  Auto-split active (remainder % 100 &le; 60 separated as fee)
                </span>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-foreground/80 mb-1 block">
                Fee / Surcharge (BDT ৳)
              </label>
              <Input
                type="number"
                placeholder="Optional manual fee"
                value={fee}
                onChange={e => setFee(e.target.value)}
                startContent={<span className="text-muted font-mono-code text-sm">৳</span>}
                classNames={{
                  inputWrapper: 'bg-surface-secondary border border-border rounded-[var(--field-radius)] h-11 font-amount text-base font-bold'
                }}
              />
            </div>
          </div>

          {/* Computed Monetary Summary Box */}
          <div className="p-3 rounded-[var(--field-radius)] bg-surface-secondary/90 border border-border flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-muted">Total Payment Required</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted">
                  Base: ৳ {feeCalculation.baseAmount.toLocaleString()}
                </span>
                {feeCalculation.fee > 0 && (
                  <span className="text-xs text-warning">
                    + Fee: ৳ {feeCalculation.fee.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xl sm:text-2xl font-black font-amount text-accent">
                ৳ {feeCalculation.total.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Payment Date */}
          <div>
            <label className="text-xs font-bold text-foreground/80 mb-1 block">
              Payment Date
            </label>
            <Input
              type="date"
              value={payDate}
              onChange={e => setPayDate(e.target.value)}
              classNames={{
                inputWrapper: 'bg-surface-secondary border border-border rounded-[var(--field-radius)] h-11 font-mono-code'
              }}
            />
          </div>

          {/* Land Tax Receipt / Notes */}
          {billId === 'landTax' && (
            <div className="space-y-2 pt-2 border-t border-border">
              <label className="text-xs font-bold text-foreground/80 block">
                Receipt Verification Link / Storage
              </label>
              <Input
                type="url"
                placeholder="https://... receipt URL"
                value={receiptUrl}
                onChange={e => setReceiptUrl(e.target.value)}
                classNames={{
                  inputWrapper: 'bg-surface-secondary border border-border rounded-[var(--field-radius)] h-10 text-xs'
                }}
              />
              <Input
                type="text"
                placeholder="Cabinet / folder location (optional)"
                value={receiptLocation}
                onChange={e => setReceiptLocation(e.target.value)}
                classNames={{
                  inputWrapper: 'bg-surface-secondary border border-border rounded-[var(--field-radius)] h-10 text-xs'
                }}
              />
            </div>
          )}

          {/* General Note */}
          <div>
            <label className="text-xs font-bold text-foreground/80 mb-1 block">
              Notes (Optional)
            </label>
            <Input
              type="text"
              placeholder="e.g. Paid via bKash / receipt code"
              value={note}
              onChange={e => setNote(e.target.value)}
              classNames={{
                inputWrapper: 'bg-surface-secondary border border-border rounded-[var(--field-radius)] h-10 text-xs'
              }}
            />
          </div>
        </ModalBody>

        <ModalFooter className="border-t border-border gap-2">
          <Button
            variant="flat"
            color="default"
            onClick={closePaymentModal}
            className="rounded-[var(--radius)] font-bold text-xs"
          >
            Cancel
          </Button>
          <Button
            color="primary"
            onClick={handleSubmit}
            className="bg-accent text-accent-foreground font-bold rounded-[var(--radius)] text-xs px-5 shadow-sm"
          >
            Save Record
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
