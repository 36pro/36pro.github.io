import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Chip
} from '@heroui/react';
import {
  Zap,
  Flame,
  Droplets,
  Wifi,
  Dumbbell,
  FileText,
  ExternalLink,
  Plus,
  BarChart2,
  Edit3,
  Calendar,
  Clock,
  ShieldCheck,
  Building
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BILL_DEFINITIONS } from '../core/contracts/utility';
import {
  computeUtilityDetailStats,
  getCompanyForBill
} from '../core/domain/utility-detail';
import { parsePaymentRecord } from '../core/domain/fee-splitting';
import { formatDateFriendly } from '../core/domain/bill-month';

const UTILITY_ICONS: Record<string, React.ReactNode> = {
  electric: <Zap size={18} className="text-amber-400" />,
  gas: <Flame size={18} className="text-orange-400" />,
  water: <Droplets size={18} className="text-cyan-400" />,
  internet: <Wifi size={18} className="text-purple-400" />,
  gym: <Dumbbell size={18} className="text-emerald-400" />,
  tax: <FileText size={18} className="text-rose-400" />
};

export const UtilityDetailModal: React.FC = () => {
  const {
    isUtilityDetailOpen,
    selectedUtilityDetailBillId,
    closeUtilityDetail,
    payments,
    isGymPaused,
    matuailRate,
    openPaymentModal,
    openEditModal,
    openDescoModal,
    openUniqueStats
  } = useApp();

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const billDef = selectedUtilityDetailBillId
    ? BILL_DEFINITIONS[selectedUtilityDetailBillId as keyof typeof BILL_DEFINITIONS]
    : null;

  // Filter payments for this utility
  const utilityPayments = useMemo(() => {
    if (!selectedUtilityDetailBillId) return [];
    return payments
      .filter(p => p.billId === selectedUtilityDetailBillId)
      .map(parsePaymentRecord)
      .sort((a, b) => new Date(b.payDate).getTime() - new Date(a.payDate).getTime());
  }, [payments, selectedUtilityDetailBillId]);

  // Compute 4 key stats
  const keyStats = useMemo(() => {
    if (!selectedUtilityDetailBillId) return null;
    return computeUtilityDetailStats(selectedUtilityDetailBillId, payments, {
      isGymPaused,
      matuailRate,
      referenceDate: new Date()
    });
  }, [selectedUtilityDetailBillId, payments, isGymPaused, matuailRate]);

  if (!isUtilityDetailOpen || !billDef || !keyStats) {
    return null;
  }

  const isDesco = billDef.id === 'rupnagarDesco' || billDef.id === 'uttaraDesco';
  const companyName = getCompanyForBill(billDef.id);

  const getColorClass = (colorClass: string) => {
    switch (colorClass) {
      case 'green':
        return 'text-emerald-400';
      case 'warning':
        return 'text-warning';
      case 'danger':
        return 'text-danger';
      case 'muted':
        return 'text-muted';
      default:
        return 'text-foreground';
    }
  };

  return (
    <Modal
      isOpen={isUtilityDetailOpen}
      onClose={closeUtilityDetail}
      placement={isMobile ? 'bottom' : 'center'}
      scrollBehavior="inside"
      size="4xl"
      classNames={{
        base: 'bg-surface border border-border max-h-[92vh] text-foreground',
        header: 'border-b border-border/60 py-3.5 px-6 bg-surface/90 backdrop-blur-md',
        body: 'p-4 sm:p-6 space-y-6',
        footer: 'border-t border-border/60 py-3 px-6 bg-surface/80'
      }}
    >
      <ModalContent>
        {onClose => (
          <>
            <ModalHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-surface-secondary border border-border flex items-center justify-center shrink-0">
                  {UTILITY_ICONS[billDef.utility] || <Building size={20} />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-foreground truncate">
                      {billDef.name}
                    </h2>
                    <Chip size="sm" variant="flat" className="capitalize text-[10px] h-5 border border-border font-semibold">
                      {billDef.type}
                    </Chip>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted mt-0.5">
                    <span className="font-semibold text-accent">{companyName}</span>
                    <span>•</span>
                    <span className="font-mono-code">{billDef.account}</span>
                    {billDef.location && (
                      <>
                        <span>•</span>
                        <span className="truncate">{billDef.location}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Launchers in Header */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                {isDesco ? (
                  <Button
                    size="sm"
                    variant="flat"
                    color="primary"
                    className="bg-amber-400/15 text-amber-500 dark:text-amber-400 font-bold text-xs h-8 px-2.5"
                    startContent={<Zap size={13} />}
                    onClick={() => {
                      onClose();
                      openDescoModal(billDef.id);
                    }}
                  >
                    Live Telemetry
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="flat"
                    color="primary"
                    className="bg-accent/15 text-accent font-bold text-xs h-8 px-2.5"
                    startContent={<BarChart2 size={13} />}
                    onClick={() => {
                      onClose();
                      openUniqueStats(billDef.id);
                    }}
                  >
                    Historical Stats
                  </Button>
                )}

                {billDef.portalUrl && (
                  <Button
                    size="sm"
                    variant="light"
                    as="a"
                    href={billDef.portalUrl}
                    target="_blank"
                    rel="noreferrer"
                    endContent={<ExternalLink size={13} />}
                    className="text-xs text-muted hover:text-foreground h-8"
                  >
                    Portal
                  </Button>
                )}

                <Button
                  size="sm"
                  color="primary"
                  className="bg-accent text-accent-foreground font-bold text-xs h-8 px-3"
                  startContent={<Plus size={14} />}
                  onClick={() => openPaymentModal(billDef.id)}
                >
                  Pay Now
                </Button>
              </div>
            </ModalHeader>

            <ModalBody>
              {/* 1. The 4 Key Stats Hero Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-[var(--field-radius)] bg-surface-raised border border-border/80 shadow-sm space-y-1">
                  <div className="text-[10px] text-muted uppercase font-bold tracking-wider">
                    {keyStats.stat1.label}
                  </div>
                  <div className={`text-base sm:text-lg font-extrabold font-sans leading-tight ${getColorClass(keyStats.stat1.colorClass)}`}>
                    {keyStats.stat1.value}
                  </div>
                </div>

                <div className="p-3.5 rounded-[var(--field-radius)] bg-surface-raised border border-border/80 shadow-sm space-y-1">
                  <div className="text-[10px] text-muted uppercase font-bold tracking-wider">
                    {keyStats.stat2.label}
                  </div>
                  <div className="text-base sm:text-lg font-extrabold font-amount text-emerald-400 leading-tight">
                    {keyStats.stat2.value}
                  </div>
                </div>

                <div className="p-3.5 rounded-[var(--field-radius)] bg-surface-raised border border-border/80 shadow-sm space-y-1">
                  <div className="text-[10px] text-muted uppercase font-bold tracking-wider">
                    {keyStats.stat3.label}
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-foreground leading-tight">
                    {keyStats.stat3.value}
                  </div>
                </div>

                <div className="p-3.5 rounded-[var(--field-radius)] bg-surface-raised border border-border/80 shadow-sm space-y-1">
                  <div className="text-[10px] text-muted uppercase font-bold tracking-wider">
                    {keyStats.stat4.label}
                  </div>
                  <div className="text-xs font-semibold text-foreground/90 leading-tight">
                    {keyStats.stat4.value}
                  </div>
                </div>
              </div>

              {/* 2. Dedicated Payment History Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-accent" />
                    <h3 className="text-sm font-bold text-foreground">
                      Payment Logs for {billDef.name}
                    </h3>
                  </div>
                  <span className="text-xs text-muted font-mono-code">
                    {utilityPayments.length} Total Records
                  </span>
                </div>

                {utilityPayments.length === 0 ? (
                  <div className="p-8 rounded-xl border border-dashed border-border/80 text-center space-y-2">
                    <Calendar className="w-8 h-8 mx-auto text-muted" />
                    <p className="text-xs font-semibold text-foreground">
                      No payment records logged yet for {billDef.name}
                    </p>
                    <p className="text-[11px] text-muted">
                      Click "Pay Now" above to record the initial billing transaction.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-border/70 shadow-sm">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-surface-secondary/80 text-[11px] text-muted font-bold border-b border-border/60 uppercase">
                        <tr>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Bill Month</th>
                          <th className="py-2.5 px-3">Base</th>
                          <th className="py-2.5 px-3">Fee</th>
                          <th className="py-2.5 px-3">Total Paid</th>
                          <th className="py-2.5 px-3">Method / Note</th>
                          <th className="py-2.5 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 font-mono-code">
                        {utilityPayments.map(p => (
                          <tr key={p.uid} className="hover:bg-surface/50 transition-colors">
                            <td className="py-2.5 px-3 whitespace-nowrap text-foreground font-semibold">
                              {p.payDate}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap text-muted">
                              {p.billMonth || '-'}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap text-foreground">
                              ৳ {p.baseAmount.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap text-orange-400">
                              {p.hasFee ? `৳ ${p.fee}` : '৳ 0'}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap font-bold text-emerald-400">
                              ৳ {p.total.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-muted max-w-xs truncate">
                              {p.property ? (
                                <span className="text-accent font-semibold">{p.property} </span>
                              ) : null}
                              {p.note || '-'}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap text-right">
                              <Button
                                size="sm"
                                variant="light"
                                isIconOnly
                                className="h-6 w-6 min-w-6 text-muted hover:text-accent"
                                onClick={() => openEditModal(p)}
                                title="Edit this record"
                              >
                                <Edit3 size={13} />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </ModalBody>

            <ModalFooter className="flex items-center justify-between">
              <span className="text-[11px] text-muted">
                Meter No: <span className="font-mono-code">{billDef.meterNumber || billDef.account}</span>
              </span>
              <Button size="sm" variant="flat" onPress={onClose}>
                Close
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
