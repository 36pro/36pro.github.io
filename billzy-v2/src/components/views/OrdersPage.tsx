import React, { useState, useMemo } from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Receipt,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  Edit2
} from 'lucide-react';

interface Transaction {
  id: string;
  invoiceNo: string;
  billName: string;
  account: string;
  category: string;
  payDate: string;
  amount: number;
  method: 'bKash' | 'Nagad' | 'City Bank' | 'BRAC Bank';
  status: 'Completed' | 'Pending' | 'Flagged';
  receiptNo: string;
}

const SEEDED_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-101',
    invoiceNo: 'INV-2026-0891',
    billName: 'Rupnagar Smart Prepaid',
    account: 'Meter #3829104',
    category: 'Electricity',
    payDate: '18 Oct 2026',
    amount: 2000,
    method: 'bKash',
    status: 'Completed',
    receiptNo: 'REC-9021-A'
  },
  {
    id: 'tx-102',
    invoiceNo: 'INV-2026-0885',
    billName: 'Uttara Residence Power',
    account: 'Meter #4928172',
    category: 'Electricity',
    payDate: '12 Oct 2026',
    amount: 1500,
    method: 'Nagad',
    status: 'Completed',
    receiptNo: 'REC-8841-B'
  },
  {
    id: 'tx-103',
    invoiceNo: 'INV-2026-0872',
    billName: 'Common Area Generator',
    account: 'Society Meter C-2',
    category: 'Electricity',
    payDate: '08 Oct 2026',
    amount: 850,
    method: 'bKash',
    status: 'Completed',
    receiptNo: 'REC-8711-X'
  },
  {
    id: 'tx-104',
    invoiceNo: 'INV-2026-0860',
    billName: 'Titas Household Gas',
    account: 'Cust ID #902188',
    category: 'Gas',
    payDate: '05 Oct 2026',
    amount: 1080,
    method: 'City Bank',
    status: 'Completed',
    receiptNo: 'REC-8600-T'
  },
  {
    id: 'tx-105',
    invoiceNo: 'INV-2026-0842',
    billName: 'DWASA Water & Sewerage',
    account: 'Bill Zone 04-982',
    category: 'Water',
    payDate: '02 Oct 2026',
    amount: 940,
    method: 'bKash',
    status: 'Completed',
    receiptNo: 'REC-8420-W'
  },
  {
    id: 'tx-106',
    invoiceNo: 'INV-2026-0831',
    billName: 'Waste & Sanitation Levy',
    account: 'Sector 11 Holding',
    category: 'Tax',
    payDate: '01 Oct 2026',
    amount: 600,
    method: 'bKash',
    status: 'Completed',
    receiptNo: 'REC-8311-D'
  },
  {
    id: 'tx-107',
    invoiceNo: 'INV-2026-0819',
    billName: 'Carnation Fiber 100Mbps',
    account: 'User: MH_Res_Optic',
    category: 'Internet',
    payDate: '26 Sep 2026',
    amount: 1200,
    method: 'BRAC Bank',
    status: 'Completed',
    receiptNo: 'REC-8190-C'
  },
  {
    id: 'tx-108',
    invoiceNo: 'INV-2026-0805',
    billName: 'Fitness Plus Membership',
    account: 'Member ID #FP-884',
    category: 'Gym',
    payDate: '20 Sep 2026',
    amount: 2000,
    method: 'bKash',
    status: 'Completed',
    receiptNo: 'REC-8051-F'
  },
  {
    id: 'tx-109',
    invoiceNo: 'INV-2026-0792',
    billName: 'Matuail Holding Tax',
    account: 'Plot #14/B South',
    category: 'Tax',
    payDate: '15 Aug 2026',
    amount: 4500,
    method: 'City Bank',
    status: 'Completed',
    receiptNo: 'REC-7920-M'
  }
];

interface OrdersPageProps {
  onOpenPaymentModal: () => void;
  triggerToast: (msg: string) => void;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({
  onOpenPaymentModal,
  triggerToast
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const filteredTransactions = useMemo(() => {
    return SEEDED_TRANSACTIONS.filter(t => {
      const matchCat = activeCategory === 'All' || t.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        t.billName.toLowerCase().includes(q) ||
        t.invoiceNo.toLowerCase().includes(q) ||
        t.account.toLowerCase().includes(q) ||
        t.method.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div className="space-y-6">
      {/* HEADER & TOP ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Bills & Invoices
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Complete database of utility expenditures, settlement receipts and payment audits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => triggerToast('Exported 24 transaction records to CSV')}
            className="px-4 py-2 rounded-full bg-white dark:bg-[#121826] text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-[0_2px_12px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,255,255,0.06)] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onOpenPaymentModal}
            className="px-4 py-2 rounded-full bg-accent text-accent-foreground text-xs font-bold shadow-sm hover:opacity-95 transition-opacity flex items-center gap-1.5"
          >
            <Plus size={15} className="stroke-[2.5]" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* 4 HERO UI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="heroui-card heroui-card-hover p-6 flex flex-col justify-between min-h-[125px]">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Settled</span>
          <div className="flex items-center gap-3">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
              ৳ 203,133
            </span>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold heroui-chip-success">
              <ArrowUpRight size={13} className="stroke-[2.5]" />
              4.1%
            </span>
          </div>
        </div>

        <div className="heroui-card heroui-card-hover p-6 flex flex-col justify-between min-h-[125px]">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pending Dues</span>
          <div className="flex items-center gap-3">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
              ৳ 4,500
            </span>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold heroui-chip-danger">
              <ArrowDownRight size={13} className="stroke-[2.5]" />
              2 Bills
            </span>
          </div>
        </div>

        <div className="heroui-card heroui-card-hover p-6 flex flex-col justify-between min-h-[125px]">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Average Transaction</span>
          <div className="flex items-center gap-3">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
              ৳ 1,840
            </span>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold heroui-chip-success">
              <ArrowUpRight size={13} className="stroke-[2.5]" />
              1.8%
            </span>
          </div>
        </div>

        <div className="heroui-card heroui-card-hover p-6 flex flex-col justify-between min-h-[125px]">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Surcharges Protected</span>
          <div className="flex items-center gap-3">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
              ৳ 3,250
            </span>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold heroui-chip-cyan">
              100% On Time
            </span>
          </div>
        </div>
      </div>

      {/* DATA TABLE HERO UI CARD */}
      <div className="heroui-card p-6 space-y-4">
        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['All', 'Electricity', 'Gas', 'Water', 'Internet', 'Gym', 'Tax'].map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeCategory === cat
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative min-w-[220px]">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search invoice, meter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs rounded-full pl-9 pr-3 py-1.5 border-none focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-3">Invoice #</th>
                <th className="py-3 px-3">Utility Account</th>
                <th className="py-3 px-3">Payment Date</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3">Method</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3.5 px-3 font-mono font-medium text-slate-500 dark:text-slate-400">
                    {tx.invoiceNo}
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {tx.billName}
                    </div>
                    <span className="text-[11px] text-slate-400">{tx.account}</span>
                  </td>
                  <td className="py-3.5 px-3 text-slate-600 dark:text-slate-300">
                    {tx.payDate}
                  </td>
                  <td className="py-3.5 px-3 font-bold text-slate-900 dark:text-white font-amount text-sm">
                    ৳ {tx.amount.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold">
                      {tx.method}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold heroui-chip-success">
                      <CheckCircle2 size={12} />
                      {tx.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <div className="inline-flex items-center gap-2 justify-end">
                      <button
                        onClick={() => triggerToast(`Viewing receipt ${tx.receiptNo}`)}
                        className="p-1.5 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="View Receipt"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => triggerToast(`Edit record ${tx.invoiceNo}`)}
                        className="p-1.5 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Edit Record"
                      >
                        <Edit2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
          <span>Showing 1 to {filteredTransactions.length} of 24 records</span>
          <div className="flex items-center gap-1">
            <button
              disabled
              className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 opacity-50 cursor-not-allowed"
            >
              <ChevronLeft size={14} />
            </button>
            <button className="w-7 h-7 rounded-full bg-accent text-accent-foreground font-bold flex items-center justify-center">
              1
            </button>
            <button
              onClick={() => triggerToast('Page 2')}
              className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-200"
            >
              2
            </button>
            <button
              onClick={() => triggerToast('Page 3')}
              className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-200"
            >
              3
            </button>
            <button
              onClick={() => triggerToast('Page 2')}
              className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
