import React, { useState, useMemo } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Input,
  Select,
  SelectItem,
  Button,
  Chip,
  Card,
  CardHeader,
  CardBody,
  CardFooter
} from '@heroui/react';
import {
  Search,
  Filter,
  Download,
  RotateCcw,
  Edit2,
  Trash2,
  ExternalLink,
  Calendar,
  CreditCard,
  FileSpreadsheet
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PaymentRecord } from '../core/contracts/payment';
import { BILL_DEFINITIONS } from '../core/contracts/utility';
import { parsePaymentRecord } from '../core/domain/fee-splitting';
import { downloadPaymentsCSV } from '../core/storage/csv-exporter';

const ROWS_PER_PAGE = 12;

export const DatabaseView: React.FC = () => {
  const { payments, openEditModal, deletePayment, showToast } = useApp();

  // Multi-criteria filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [billFilter, setBillFilter] = useState('All Bills');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [monthFilter, setMonthFilter] = useState('');
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<'payDate' | 'amount'>('payDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const billOptions = useMemo(() => [
    { key: 'All Bills', label: 'All Bills' },
    ...Object.values(BILL_DEFINITIONS).map(b => ({ key: b.name, label: b.name }))
  ], []);
  const filteredPayments = useMemo(() => {
    const sLower = searchQuery.toLowerCase().trim();

    return payments.filter(p => {
      const pName = p.billName || '';
      const pMonth = p.billMonth || '';
      const pProp = p.property || '';
      const pDate = p.payDate || '';
      const pAmt = String(p.amount || '');
      const pNote = p.note || '';
      const pType = (p.billType || 'prepaid').toLowerCase();

      const matchesSearch =
        !sLower ||
        pName.toLowerCase().includes(sLower) ||
        pProp.toLowerCase().includes(sLower) ||
        pDate.includes(sLower) ||
        pAmt.includes(sLower) ||
        pMonth.toLowerCase().includes(sLower) ||
        pNote.toLowerCase().includes(sLower);

      const matchesBill =
        billFilter === 'All Bills' ||
        pName.toLowerCase() === billFilter.toLowerCase() ||
        (pProp && (pProp === billFilter || pProp.includes(billFilter))) ||
        (billFilter === 'Land Tax' && p.billId === 'landTax');

      const matchesType =
        typeFilter === 'All Types' || pType === typeFilter.toLowerCase();

      const matchesMonth = !monthFilter || pDate.startsWith(monthFilter);

      return matchesSearch && matchesBill && matchesType && matchesMonth;
    });
  }, [payments, searchQuery, billFilter, typeFilter, monthFilter]);

  // Sorted Payments
  const sortedPayments = useMemo(() => {
    return [...filteredPayments].sort((a, b) => {
      if (sortField === 'payDate') {
        const dA = a.payDate || '';
        const dB = b.payDate || '';
        return sortDirection === 'asc' ? dA.localeCompare(dB) : dB.localeCompare(dA);
      } else {
        const aAmt = a.totalPaid || a.amountNum || parseFloat(a.amount) || 0;
        const bAmt = b.totalPaid || b.amountNum || parseFloat(b.amount) || 0;
        return sortDirection === 'asc' ? aAmt - bAmt : bAmt - aAmt;
      }
    });
  }, [filteredPayments, sortField, sortDirection]);

  // Total amount of filtered
  const filteredTotalAmt = useMemo(() => {
    return filteredPayments.reduce((acc, p) => {
      return acc + (p.totalPaid || p.amountNum || parseFloat(p.amount) || 0);
    }, 0);
  }, [filteredPayments]);

  // Paginated items
  const totalPages = Math.ceil(sortedPayments.length / ROWS_PER_PAGE) || 1;
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    return sortedPayments.slice(start, start + ROWS_PER_PAGE);
  }, [sortedPayments, page]);

  const resetFilters = () => {
    setSearchQuery('');
    setBillFilter('All Bills');
    setTypeFilter('All Types');
    setMonthFilter('');
    setPage(1);
  };

  const handleExportCSV = () => {
    if (payments.length === 0) {
      showToast('No payment records to export', 'warning');
      return;
    }
    downloadPaymentsCSV(filteredPayments.length > 0 ? filteredPayments : payments);
    showToast('Exported CSV with UTF-8 BOM encoding', 'success');
  };

  const toggleSort = (field: 'payDate' | 'amount') => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground font-sans">
            Payment Records Database
          </h1>
          <p className="text-xs sm:text-sm text-muted">
            Search, filter, paginate, and audit historical utility transactions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="flat"
            className="bg-surface-secondary text-foreground border border-border rounded-[var(--radius)] font-bold text-xs h-9 px-3"
            startContent={<FileSpreadsheet size={16} className="text-emerald-400" />}
            onClick={handleExportCSV}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="p-4 rounded-[var(--radius)] bg-surface border border-border space-y-3 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Query */}
          <div>
            <label className="text-[11px] font-bold text-muted uppercase tracking-wider mb-1 block">
              Search Record
            </label>
            <Input
              size="sm"
              placeholder="Name, date, property, note..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              startContent={<Search size={15} className="text-muted" />}
              classNames={{
                inputWrapper: 'bg-surface-secondary border border-border rounded-[var(--field-radius)] h-9 text-xs'
              }}
            />
          </div>

          {/* Bill Filter */}
          <div>
            <label className="text-[11px] font-bold text-muted uppercase tracking-wider mb-1 block">
              Filter Service
            </label>
            <Select
              size="sm"
              selectedKeys={[billFilter]}
              onSelectionChange={keys => {
                const sel = Array.from(keys)[0] as string;
                if (sel) {
                  setBillFilter(sel);
                  setPage(1);
                }
              }}
              items={billOptions}
              aria-label="Filter by Service"
              classNames={{
                trigger: 'bg-surface-secondary border border-border rounded-[var(--field-radius)] h-9 text-xs'
              }}
            >
              {b => <SelectItem key={b.key}>{b.label}</SelectItem>}
            </Select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="text-[11px] font-bold text-muted uppercase tracking-wider mb-1 block">
              Billing Type
            </label>
            <Select
              size="sm"
              selectedKeys={[typeFilter]}
              onSelectionChange={keys => {
                const sel = Array.from(keys)[0] as string;
                if (sel) {
                  setTypeFilter(sel);
                  setPage(1);
                }
              }}
              aria-label="Filter by Billing Type"
              classNames={{
                trigger: 'bg-surface-secondary border border-border rounded-[var(--field-radius)] h-9 text-xs'
              }}
            >
              <SelectItem key="All Types">All Types</SelectItem>
              <SelectItem key="prepaid">Prepaid</SelectItem>
              <SelectItem key="postpaid">Postpaid</SelectItem>
            </Select>
          </div>

          {/* Month Filter */}
          <div>
            <label className="text-[11px] font-bold text-muted uppercase tracking-wider mb-1 block">
              Payment Month
            </label>
            <Input
              size="sm"
              type="month"
              value={monthFilter}
              onChange={e => {
                setMonthFilter(e.target.value);
                setPage(1);
              }}
              classNames={{
                inputWrapper: 'bg-surface-secondary border border-border rounded-[var(--field-radius)] h-9 text-xs font-mono-code'
              }}
            />
          </div>
        </div>

        {/* Results Info & Reset */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50 text-xs">
          <div className="flex items-center gap-3 text-muted">
            <span>
              Showing <b className="text-foreground">{filteredPayments.length}</b> of{' '}
              <b className="text-foreground">{payments.length}</b> transactions
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">
              Filtered Total:{' '}
              <b className="text-accent font-amount font-bold">
                ৳ {filteredTotalAmt.toLocaleString()}
              </b>
            </span>
          </div>

          {(searchQuery || billFilter !== 'All Bills' || typeFilter !== 'All Types' || monthFilter) && (
            <Button
              size="sm"
              variant="light"
              color="danger"
              className="text-xs h-7 px-2 font-semibold"
              startContent={<RotateCcw size={13} />}
              onClick={resetFilters}
            >
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* DESKTOP VIEW: Full HeroUI Table (Hidden on Mobile) */}
      <div className="hidden md:block">
        <Card className="bg-surface border border-border rounded-[var(--radius)] overflow-hidden shadow-sm">
          <Table
            aria-label="Payments Table"
            className="w-full"
            classNames={{
              th: 'bg-surface-secondary text-muted font-bold text-xs py-3 border-b border-border',
              td: 'py-3 text-xs border-b border-border/40 font-medium'
            }}
          >
            <TableHeader>
              <TableColumn
                className="cursor-pointer select-none"
                onClick={() => toggleSort('payDate')}
              >
                <div className="flex items-center gap-1">
                  <span>DATE PAID</span>
                  {sortField === 'payDate' && (
                    <span className="text-accent">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </TableColumn>
              <TableColumn>UTILITY & ACCOUNT</TableColumn>
              <TableColumn>TYPE</TableColumn>
              <TableColumn>BILLING MONTH / CYCLE</TableColumn>
              <TableColumn
                className="cursor-pointer select-none text-right"
                onClick={() => toggleSort('amount')}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>AMOUNT (BDT)</span>
                  {sortField === 'amount' && (
                    <span className="text-accent">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </TableColumn>
              <TableColumn className="text-right">FEE (BDT)</TableColumn>
              <TableColumn className="text-right">TOTAL PAID</TableColumn>
              <TableColumn>PROPERTY / NOTE</TableColumn>
              <TableColumn className="text-center">ACTIONS</TableColumn>
            </TableHeader>
            <TableBody items={paginatedItems} emptyContent="No matching payment records found.">
              {(rawP: PaymentRecord) => {
                const p = parsePaymentRecord(rawP);
                const billDef = BILL_DEFINITIONS[p.billId as keyof typeof BILL_DEFINITIONS];

                return (
                  <TableRow key={p.uid} className="hover:bg-surface-secondary/40 transition-colors">
                    <TableCell className="font-mono-code whitespace-nowrap">
                      {p.payDate}
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground">{p.billName}</span>
                        <span className="text-[11px] text-muted font-mono-code">
                          {billDef?.account || p.billId}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="sm"
                        variant="flat"
                        className="text-[10px] capitalize font-semibold h-5"
                      >
                        {p.billType || 'prepaid'}
                      </Chip>
                    </TableCell>

                    <TableCell>
                      <span className="text-xs text-foreground/90 font-medium">
                        {p.billMonth || <span className="text-muted">—</span>}
                      </span>
                    </TableCell>

                    <TableCell className="text-right font-amount font-bold text-foreground">
                      ৳ {p.baseAmount.toLocaleString()}
                    </TableCell>

                    <TableCell className="text-right font-amount text-muted">
                      {p.feeNum > 0 ? `৳ ${p.feeNum.toLocaleString()}` : '—'}
                    </TableCell>

                    <TableCell className="text-right font-amount font-bold text-accent">
                      ৳ {p.total.toLocaleString()}
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col max-w-[180px]">
                        {p.property && (
                          <span className="text-xs font-bangla font-semibold text-rose-400">
                            {p.property}
                          </span>
                        )}
                        {p.note && (
                          <span className="text-[11px] text-muted truncate">{p.note}</span>
                        )}
                        {p.receiptUrl && (
                          <a
                            href={p.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-accent hover:underline flex items-center gap-0.5 mt-0.5"
                          >
                            <span>Receipt</span>
                            <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          className="text-muted hover:text-foreground h-8 w-8"
                          onClick={() => openEditModal(rawP)}
                          aria-label="Edit Payment"
                        >
                          <Edit2 size={14} />
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="danger"
                          className="text-muted hover:text-danger h-8 w-8"
                          onClick={() => {
                            if (window.confirm(`Delete payment of ৳ ${p.amount} for ${p.billName}?`)) {
                              deletePayment(p.uid);
                            }
                          }}
                          aria-label="Delete Payment"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              }}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="py-3 px-4 flex justify-between items-center border-t border-border bg-surface-secondary/40">
              <span className="text-xs text-muted">
                Page {page} of {totalPages}
              </span>
              <Pagination
                page={page}
                total={totalPages}
                onChange={setPage}
                size="sm"
                color="primary"
                classNames={{
                  cursor: 'bg-accent text-accent-foreground font-bold'
                }}
              />
            </div>
          )}
        </Card>
      </div>

      {/* MOBILE VIEW: Stacked Responsive Card List (No horizontal table overflow at 360px) */}
      <div className="md:hidden space-y-3">
        {paginatedItems.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted bg-surface rounded-[var(--radius)] border border-border">
            No matching payment records found.
          </div>
        ) : (
          paginatedItems.map(rawP => {
            const p = parsePaymentRecord(rawP);
            const billDef = BILL_DEFINITIONS[p.billId as keyof typeof BILL_DEFINITIONS];

            return (
              <Card
                key={p.uid}
                className="bg-surface border border-border rounded-[var(--radius)] p-1 shadow-sm"
              >
                <CardHeader className="flex justify-between items-start pb-1">
                  <div>
                    <h3 className="font-bold text-sm text-foreground">{p.billName}</h3>
                    <span className="text-[11px] text-muted font-mono-code">
                      {p.payDate} • {billDef?.account || p.billId}
                    </span>
                  </div>
                  <Chip size="sm" variant="flat" className="text-[10px] capitalize h-5 font-semibold">
                    {p.billType || 'prepaid'}
                  </Chip>
                </CardHeader>

                <CardBody className="py-2 space-y-1.5 text-xs">
                  {p.billMonth && (
                    <div className="flex justify-between items-center bg-surface-secondary/60 p-2 rounded-[var(--field-radius)]">
                      <span className="text-muted">Month / Cycle:</span>
                      <span className="font-semibold text-foreground text-right">{p.billMonth}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-muted">Base Amount:</span>
                    <span className="font-amount font-bold text-foreground">
                      ৳ {p.baseAmount.toLocaleString()}
                    </span>
                  </div>

                  {p.feeNum > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted">Fee / Fine:</span>
                      <span className="font-amount text-warning">
                        ৳ {p.feeNum.toLocaleString()}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-1 border-t border-border/40 font-bold">
                    <span className="text-foreground">Total Paid:</span>
                    <span className="font-amount text-sm text-accent">
                      ৳ {p.total.toLocaleString()}
                    </span>
                  </div>

                  {p.property && (
                    <div className="text-[11px] font-bangla text-rose-400">
                      সম্পত্তি: {p.property}
                    </div>
                  )}

                  {p.note && (
                    <div className="text-[11px] text-muted italic">"{p.note}"</div>
                  )}
                </CardBody>

                <CardFooter className="pt-2 pb-1 flex justify-between items-center border-t border-border/40">
                  {p.receiptUrl ? (
                    <a
                      href={p.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-accent flex items-center gap-0.5 font-medium hover:underline"
                    >
                      <span>Receipt Link</span>
                      <ExternalLink size={11} />
                    </a>
                  ) : (
                    <span className="text-[11px] text-muted font-mono-code">{p.uid}</span>
                  )}

                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="flat"
                      className="h-7 text-xs px-2.5 rounded-[var(--radius)]"
                      onClick={() => openEditModal(rawP)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="flat"
                      color="danger"
                      className="h-7 text-xs px-2.5 rounded-[var(--radius)]"
                      onClick={() => {
                        if (window.confirm(`Delete payment of ৳ ${p.amount} for ${p.billName}?`)) {
                          deletePayment(p.uid);
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            );
          })
        )}

        {/* Mobile Pagination */}
        {totalPages > 1 && (
          <div className="py-2 flex justify-center">
            <Pagination
              page={page}
              total={totalPages}
              onChange={setPage}
              size="sm"
              color="primary"
              classNames={{
                cursor: 'bg-accent text-accent-foreground font-bold'
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
