import React, { useState, useEffect } from 'react';
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
import { Edit3, Trash2, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BillId } from '../core/contracts/payment';
import { BILL_DEFINITIONS } from '../core/contracts/utility';
import { calculateEntryFee } from '../core/domain/fee-splitting';
import { LAND_TAX_PROPERTIES } from '../core/domain/land-tax';

export const EditModal: React.FC = () => {
  const {
    isEditModalOpen,
    closeEditModal,
    editingRecord,
    updatePayment,
    deletePayment
  } = useApp();

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [amount, setAmount] = useState<string>('');
  const [fee, setFee] = useState<string>('');
  const [payDate, setPayDate] = useState<string>('');
  const [billMonth, setBillMonth] = useState<string>('');
  const [property, setProperty] = useState<string>('');
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [receiptLocation, setReceiptLocation] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (editingRecord) {
      setAmount(String(editingRecord.amountNum || editingRecord.amount || ''));
      setFee(editingRecord.fee || '');
      setPayDate(editingRecord.payDate || '');
      setBillMonth(editingRecord.billMonth || '');
      setProperty(editingRecord.property || '');
      setReceiptUrl(editingRecord.receiptUrl || '');
      setReceiptLocation(editingRecord.receiptLocation || '');
      setNote(editingRecord.note || '');
      setErrorMessage(null);
    }
  }, [editingRecord, isEditModalOpen]);

  if (!editingRecord) return null;

  const billDef = BILL_DEFINITIONS[editingRecord.billId as keyof typeof BILL_DEFINITIONS];
  const billName = billDef ? billDef.name : editingRecord.billName;

  const handleUpdate = async () => {
    setErrorMessage(null);
    const parsedAmt = parseFloat(amount);
    if (isNaN(parsedAmt) || parsedAmt <= 0) {
      setErrorMessage('Please enter a valid amount');
      return;
    }
    if (!payDate) {
      setErrorMessage('Please enter a valid payment date');
      return;
    }

    const res = await updatePayment(editingRecord.uid, {
      amount: String(parsedAmt),
      fee,
      payDate,
      billMonth,
      property: editingRecord.billId === 'landTax' ? property : editingRecord.property,
      receiptUrl,
      receiptLocation,
      note
    });

    if (!res.success && res.error) {
      setErrorMessage(res.error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete payment of ৳ ${editingRecord.amount} for ${billName}?`)) {
      await deletePayment(editingRecord.uid);
    }
  };

  return (
    <Modal
      isOpen={isEditModalOpen}
      onClose={closeEditModal}
      placement={isMobile ? 'bottom' : 'center'}
      scrollBehavior="inside"
      size="md"
      className="max-h-[92vh] sm:max-h-[85vh] bg-surface text-foreground border border-border rounded-t-2xl sm:rounded-[var(--radius)] shadow-2xl"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 pb-2 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Edit3 size={18} className="text-accent" />
              <h2 className="text-lg font-bold font-sans">Edit Payment Record</h2>
            </div>
            <Chip size="sm" variant="flat" className="font-mono-code text-[11px]">
              {editingRecord.uid}
            </Chip>
          </div>
          <span className="text-xs text-muted">
            {billName} • {editingRecord.payDate}
          </span>
        </ModalHeader>

        <ModalBody className="space-y-4 py-4">
          {errorMessage && (
            <div className="p-3 rounded-[var(--field-radius)] bg-danger/15 border border-danger/30 text-danger text-xs flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Amount & Fee */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-foreground/80 mb-1 block">
                Amount (BDT ৳)
              </label>
              <Input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                startContent={<span className="text-muted font-mono-code text-sm">৳</span>}
                classNames={{
                  inputWrapper: 'bg-surface-secondary border border-border rounded-[var(--field-radius)] h-11 font-amount font-bold'
                }}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-foreground/80 mb-1 block">
                Fee / Fine (৳)
              </label>
              <Input
                type="number"
                value={fee}
                onChange={e => setFee(e.target.value)}
                startContent={<span className="text-muted font-mono-code text-sm">৳</span>}
                classNames={{
                  inputWrapper: 'bg-surface-secondary border border-border rounded-[var(--field-radius)] h-11 font-amount font-bold'
                }}
              />
            </div>
          </div>

          {/* Billing Month / Cycle */}
          <div>
            <label className="text-xs font-bold text-foreground/80 mb-1 block">
              Billing Month / Cycle Label
            </label>
            <Input
              type="text"
              value={billMonth}
              onChange={e => setBillMonth(e.target.value)}
              placeholder="e.g. July 2026 or Oct 20 - Nov 20, 2026"
              classNames={{
                inputWrapper: 'bg-surface-secondary border border-border rounded-[var(--field-radius)] h-11'
              }}
            />
          </div>

          {/* Land Tax Property */}
          {editingRecord.billId === 'landTax' && (
            <div>
              <label className="text-xs font-bold text-foreground/80 mb-1 block">Property</label>
              <Select
                selectedKeys={[property]}
                onSelectionChange={keys => {
                  const sel = Array.from(keys)[0] as string;
                  if (sel) setProperty(sel);
                }}
                classNames={{
                  trigger: 'bg-surface-secondary border border-border rounded-[var(--field-radius)] h-11 font-bangla'
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
          )}

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

          {/* Receipt Link & Location */}
          <div className="space-y-2 pt-2 border-t border-border">
            <label className="text-xs font-bold text-foreground/80 block">
              Receipt URL / Storage
            </label>
            <Input
              type="url"
              placeholder="Receipt HTTPS link"
              value={receiptUrl}
              onChange={e => setReceiptUrl(e.target.value)}
              classNames={{
                inputWrapper: 'bg-surface-secondary border border-border rounded-[var(--field-radius)] h-10 text-xs'
              }}
            />
            <Input
              type="text"
              placeholder="Receipt storage drawer / location"
              value={receiptLocation}
              onChange={e => setReceiptLocation(e.target.value)}
              classNames={{
                inputWrapper: 'bg-surface-secondary border border-border rounded-[var(--field-radius)] h-10 text-xs'
              }}
            />
          </div>

          {/* Note */}
          <div>
            <label className="text-xs font-bold text-foreground/80 mb-1 block">Note</label>
            <Input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              classNames={{
                inputWrapper: 'bg-surface-secondary border border-border rounded-[var(--field-radius)] h-10 text-xs'
              }}
            />
          </div>
        </ModalBody>

        <ModalFooter className="border-t border-border flex items-center justify-between">
          <Button
            color="danger"
            variant="flat"
            size="sm"
            startContent={<Trash2 size={15} />}
            className="rounded-[var(--radius)] font-bold text-xs"
            onClick={handleDelete}
          >
            Delete
          </Button>

          <div className="flex gap-2">
            <Button
              variant="flat"
              color="default"
              size="sm"
              onClick={closeEditModal}
              className="rounded-[var(--radius)] font-bold text-xs"
            >
              Cancel
            </Button>
            <Button
              color="primary"
              size="sm"
              onClick={handleUpdate}
              className="bg-accent text-accent-foreground font-bold rounded-[var(--radius)] text-xs px-4"
            >
              Save Changes
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
