import React, { useState, useMemo } from 'react';
import {
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/react';
import {
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  MoreVertical,
  Filter,
  ArrowUpDown,
  Columns,
  Search,
  Zap,
  Flame,
  Droplets,
  Wifi,
  Dumbbell,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Download,
  Calendar
} from 'lucide-react';

interface UtilityItem {
  id: string;
  name: string;
  account: string;
  category: 'Electricity' | 'Gas' | 'Water' | 'Internet' | 'Gym' | 'Tax';
  provider: string;
  lastPayment: string;
  lastPaymentDate: string;
  daysAgo: number;
  nextDue: string;
  dueInDays: number;
  amount: number;
  status: 'Paid' | 'Due Soon' | 'Overdue';
  avatarBg: string;
  icon: React.ReactNode;
}

const SEEDED_UTILITIES: UtilityItem[] = [
  {
    id: 'rupnagar-desco',
    name: 'Rupnagar Smart Prepaid',
    account: 'Meter #3829104',
    category: 'Electricity',
    provider: 'DESCO Dhaka',
    lastPayment: '৳ 2,000',
    lastPaymentDate: '18 Oct 2026',
    daysAgo: 4,
    nextDue: '27 Oct 2026',
    dueInDays: 5,
    amount: 2000,
    status: 'Due Soon',
    avatarBg: 'bg-cyan-500/10 text-cyan-500',
    icon: <Zap size={18} />
  },
  {
    id: 'uttara-desco',
    name: 'Uttara Residence Power',
    account: 'Meter #4928172',
    category: 'Electricity',
    provider: 'DESCO Dhaka',
    lastPayment: '৳ 1,500',
    lastPaymentDate: '12 Oct 2026',
    daysAgo: 10,
    nextDue: '02 Nov 2026',
    dueInDays: 11,
    amount: 1500,
    status: 'Paid',
    avatarBg: 'bg-cyan-500/10 text-cyan-500',
    icon: <Zap size={18} />
  },
  {
    id: 'titas-gas',
    name: 'Titas Household Gas',
    account: 'Cust ID #902188',
    category: 'Gas',
    provider: 'Titas Gas T&D',
    lastPayment: '৳ 1,080',
    lastPaymentDate: '05 Oct 2026',
    daysAgo: 17,
    nextDue: '31 Oct 2026',
    dueInDays: 9,
    amount: 1080,
    status: 'Paid',
    avatarBg: 'bg-orange-500/10 text-orange-500',
    icon: <Flame size={18} />
  },
  {
    id: 'dwasa-water',
    name: 'DWASA Water & Sewerage',
    account: 'Bill Zone 04-982',
    category: 'Water',
    provider: 'Dhaka WASA',
    lastPayment: '৳ 940',
    lastPaymentDate: '02 Oct 2026',
    daysAgo: 20,
    nextDue: '05 Nov 2026',
    dueInDays: 14,
    amount: 940,
    status: 'Paid',
    avatarBg: 'bg-sky-500/10 text-sky-500',
    icon: <Droplets size={18} />
  },
  {
    id: 'carnation-internet',
    name: 'Carnation Fiber 100Mbps',
    account: 'User: MH_Res_Optic',
    category: 'Internet',
    provider: 'Carnation Net',
    lastPayment: '৳ 1,200',
    lastPaymentDate: '26 Sep 2026',
    daysAgo: 26,
    nextDue: '26 Oct 2026',
    dueInDays: 4,
    amount: 1200,
    status: 'Due Soon',
    avatarBg: 'bg-purple-500/10 text-purple-500',
    icon: <Wifi size={18} />
  },
  {
    id: 'fitness-plus',
    name: 'Fitness Plus Membership',
    account: 'Member ID #FP-884',
    category: 'Gym',
    provider: 'Gym Sub (20th-20th)',
    lastPayment: '৳ 2,000',
    lastPaymentDate: '20 Sep 2026',
    daysAgo: 32,
    nextDue: '20 Oct 2026',
    dueInDays: -2,
    amount: 2000,
    status: 'Overdue',
    avatarBg: 'bg-emerald-500/10 text-emerald-500',
    icon: <Dumbbell size={18} />
  },
  {
    id: 'matuail-tax',
    name: 'Matuail Holding Tax',
    account: 'Plot #14/B South',
    category: 'Tax',
    provider: 'DSCC Dhaka South',
    lastPayment: '৳ 4,500',
    lastPaymentDate: '15 Aug 2026',
    daysAgo: 68,
    nextDue: '30 Dec 2026',
    dueInDays: 69,
    amount: 4500,
    status: 'Paid',
    avatarBg: 'bg-rose-500/10 text-rose-500',
    icon: <FileText size={18} />
  },
  {
    id: 'dhaka-north-cleaning',
    name: 'Waste & Sanitation Levy',
    account: 'Sector 11 Holding',
    category: 'Tax',
    provider: 'DNCC Dhaka North',
    lastPayment: '৳ 600',
    lastPaymentDate: '01 Oct 2026',
    daysAgo: 21,
    nextDue: '10 Nov 2026',
    dueInDays: 19,
    amount: 600,
    status: 'Paid',
    avatarBg: 'bg-blue-500/10 text-blue-500',
    icon: <FileText size={18} />
  },
  {
    id: 'backup-generator',
    name: 'Common Area Generator',
    account: 'Society Meter C-2',
    category: 'Electricity',
    provider: 'Society Management',
    lastPayment: '৳ 850',
    lastPaymentDate: '08 Oct 2026',
    daysAgo: 14,
    nextDue: '08 Nov 2026',
    dueInDays: 17,
    amount: 850,
    status: 'Paid',
    avatarBg: 'bg-amber-500/10 text-amber-500',
    icon: <Zap size={18} />
  }
];

interface DashboardPageProps {
  onOpenPaymentModal: (utility?: UtilityItem) => void;
  triggerToast: (msg: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onOpenPaymentModal,
  triggerToast
}) => {
  const [activeCategory, setActiveCategory] = useState<'Overview' | 'Sales' | 'Expenses'>('Overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [period, setPeriod] = useState<'Monthly' | 'Quarterly' | 'Yearly'>('Monthly');

  const filteredUtilities = useMemo(() => {
    return SEEDED_UTILITIES.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.account.toLowerCase().includes(q) ||
        item.provider.toLowerCase().includes(q)
      );
    });
  }, [searchQuery]);

  return (
    <div className="space-y-6">
      {/* GREETING & CONTROLS ROW */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Good morning, Kate
          </h1>
        </div>

        {/* Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Segmented control tabs */}
          <div className="flex items-center bg-white dark:bg-[#121826] p-1 rounded-full shadow-[0_2px_12px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,255,255,0.06)]">
            {(['Overview', 'Sales', 'Expenses'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveCategory(tab)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeCategory === tab
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Refresh Icon */}
          <button
            onClick={() => triggerToast('DESCO Meters & Live Telemetry refreshed')}
            className="w-8 h-8 rounded-full bg-white dark:bg-[#121826] flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-[0_2px_12px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,255,255,0.06)] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw size={14} />
          </button>

          {/* Period Dropdown */}
          <Dropdown>
            <DropdownTrigger>
              <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#121826] text-xs font-medium text-slate-700 dark:text-slate-200 shadow-[0_2px_12px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,255,255,0.06)] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <Calendar size={13} className="text-slate-400" />
                <span>{period}</span>
                <ChevronDown size={12} className="text-slate-400" />
              </button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Period Selection" onAction={(key) => setPeriod(key as any)}>
              <DropdownItem key="Monthly">Monthly</DropdownItem>
              <DropdownItem key="Quarterly">Quarterly</DropdownItem>
              <DropdownItem key="Yearly">Yearly</DropdownItem>
            </DropdownMenu>
          </Dropdown>

          {/* Download Button */}
          <button
            onClick={() => triggerToast('Downloaded Payments Summary as CSV')}
            className="bg-accent text-accent-foreground font-semibold rounded-full px-4 py-1.5 text-xs shadow-sm hover:opacity-95 flex items-center gap-1.5 transition-all"
          >
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* ROW 1: 4 HERO UI INDIVIDUAL METRIC CARDS (EXACT REPLICA) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Revenue */}
        <div className="heroui-card heroui-card-hover p-6 flex flex-col justify-between min-h-[125px]">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Revenue
          </span>
          <div className="flex items-center gap-3">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
              US$228,441
            </span>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold heroui-chip-success">
              <ArrowUpRight size={13} className="stroke-[2.5]" />
              3.3%
            </span>
          </div>
        </div>

        {/* Card 2: Expenses */}
        <div className="heroui-card heroui-card-hover p-6 flex flex-col justify-between min-h-[125px]">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Expenses
          </span>
          <div className="flex items-center gap-3">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
              US$25,108
            </span>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold heroui-chip-danger">
              <ArrowDownRight size={13} className="stroke-[2.5]" />
              3.3%
            </span>
          </div>
        </div>

        {/* Card 3: Sales */}
        <div className="heroui-card heroui-card-hover p-6 flex flex-col justify-between min-h-[125px]">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Sales
          </span>
          <div className="flex items-center gap-3">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
              458
            </span>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold heroui-chip-success">
              <ArrowUpRight size={13} className="stroke-[2.5]" />
              3.3%
            </span>
          </div>
        </div>

        {/* Card 4: Profit */}
        <div className="heroui-card heroui-card-hover p-6 flex flex-col justify-between min-h-[125px]">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Profit
          </span>
          <div className="flex items-center gap-3">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
              US$203,133
            </span>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold heroui-chip-success">
              <ArrowUpRight size={13} className="stroke-[2.5]" />
              4.1%
            </span>
          </div>
        </div>
      </div>

      {/* ROW 2: 2 VISUAL CHART CARDS (SIDE BY SIDE) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Chart Card: Sales Performance */}
        <div className="heroui-card p-6 flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Sales Performance
              </h3>
              <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1 cursor-pointer">
                <span>Last 2 weeks</span>
                <ChevronDown size={12} />
              </div>
            </div>

            {/* Sub-metrics */}
            <div className="grid grid-cols-3 gap-3 pb-4 mb-2">
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    US$28,441
                  </span>
                  <span className="text-[10px] font-semibold text-[#00b46e] flex items-center">
                    ↑ 3.3%
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">Weekly Sales</span>
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    US$4,063
                  </span>
                  <span className="text-[10px] font-semibold text-[#00b46e] flex items-center">
                    ↑ 3.3%
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">Daily Sales</span>
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    278
                  </span>
                  <span className="text-[10px] font-semibold text-[#00b46e] flex items-center">
                    ↑ 3.3%
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">Total Sales</span>
              </div>
            </div>

            {/* Cyan Pill Bar Chart */}
            <div className="h-44 w-full flex items-end justify-between gap-1.5 sm:gap-2 pt-2 px-1">
              {[
                { day: '01', val: 32 },
                { day: '02', val: 78 },
                { day: '03', val: 46 },
                { day: '04', val: 24 },
                { day: '05', val: 62 },
                { day: '06', val: 38 },
                { day: '07', val: 45 },
                { day: '08', val: 54 },
                { day: '09', val: 14 },
                { day: '10', val: 82 },
                { day: '11', val: 72 },
                { day: '12', val: 56 }
              ].map((bar, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="w-full flex items-end justify-center h-36">
                    <div
                      style={{ height: `${bar.val}%` }}
                      className="w-full max-w-[13px] bg-accent group-hover:opacity-85 rounded-full transition-all relative"
                    >
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow pointer-events-none transition-opacity whitespace-nowrap z-10">
                        ${bar.val * 350}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{bar.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Chart Card: Traffic Source */}
        <div className="heroui-card p-6 flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Traffic Source
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-accent" />
                  <span>Organic</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-[#38bdf8]" />
                  <span>Paid Ads</span>
                </div>
                <button className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>

            {/* Main Stat */}
            <div className="mb-2">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
                231,856
              </span>
              <div className="text-xs text-slate-400">Sessions</div>
            </div>

            {/* Smooth Spline Chart with Floating Tooltip Card */}
            <div className="relative h-44 w-full pt-1">
              <svg className="w-full h-36 overflow-visible" viewBox="0 0 500 150">
                <line x1="0" y1="30" x2="500" y2="30" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray="3 3" />
                <line x1="0" y1="80" x2="500" y2="80" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray="3 3" />
                <line x1="0" y1="130" x2="500" y2="130" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray="3 3" />

                <line x1="380" y1="10" x2="380" y2="150" stroke="currentColor" className="text-slate-300 dark:text-slate-700" strokeDasharray="2 2" />

                {/* Cyan line (Organic) */}
                <path
                  d="M 10 140 Q 60 70, 110 90 T 210 65 T 310 80 T 380 40 T 430 20 T 490 60"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Sky Blue line (Paid Ads) */}
                <path
                  d="M 10 145 Q 60 110, 110 100 T 210 115 T 310 95 T 380 75 T 430 40 T 490 85"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                <circle cx="380" cy="40" r="4.5" fill="var(--accent)" stroke="#fff" strokeWidth="2" />
                <circle cx="380" cy="75" r="4.5" fill="#38bdf8" stroke="#fff" strokeWidth="2" />
              </svg>

              {/* Exact Floating Tooltip Card */}
              <div className="absolute top-1 right-24 bg-white dark:bg-[#182234] p-3 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.08)] text-xs space-y-1.5 z-10 min-w-[130px]">
                <div className="font-semibold text-[11px] text-slate-500 dark:text-slate-400">Aug</div>
                <div className="flex items-center justify-between gap-3 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                    <span className="text-slate-600 dark:text-slate-300">Organic</span>
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">18000</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />
                    <span className="text-slate-600 dark:text-slate-300">Paid Ads</span>
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">10000</span>
                </div>
              </div>

              {/* Month Labels */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-2">
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Apr</span>
                <span>May</span>
                <span>Jun</span>
                <span>Jul</span>
                <span className="font-bold text-slate-900 dark:text-white">Aug</span>
                <span>Sep</span>
                <span>Oct</span>
                <span>Nov</span>
                <span>Dec</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 3: ALL EMPLOYEES / UTILITIES DATA TABLE CARD */}
      <div className="heroui-card p-6 space-y-4">
        {/* Card Header & Controls Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              All Employees
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold">
              {filteredUtilities.length}
            </span>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => triggerToast('Filter dialog opened')}
              className="px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Filter size={13} />
              <span>Filter</span>
            </button>
            <button
              onClick={() => triggerToast('Sorted by Name')}
              className="px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
            >
              <ArrowUpDown size={13} />
              <span>Sort</span>
            </button>
            <button
              onClick={() => triggerToast('Columns settings')}
              className="px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Columns size={13} />
              <span>Columns</span>
            </button>

            {/* Search Pill Input */}
            <div className="relative min-w-[210px]">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs rounded-full pl-9 pr-3 py-1.5 border-none focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-3">Worker ID</th>
                <th className="py-3 px-3">Member</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Worker Type</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUtilities.map((item, idx) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                  onClick={() => onOpenPaymentModal(item)}
                >
                  <td className="py-3.5 px-3 font-mono text-slate-400">
                    #{1500000 + idx * 83}
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl shrink-0 ${item.avatarBg}`}>
                        {item.icon}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white group-hover:text-accent transition-colors">
                          {item.name}
                        </div>
                        <span className="text-[11px] text-slate-400">{item.account}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-slate-600 dark:text-slate-300 font-medium">
                    {item.provider}
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-medium">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        item.status === 'Paid'
                          ? 'heroui-chip-success'
                          : item.status === 'Due Soon'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'heroui-chip-danger'
                      }`}
                    >
                      {item.status === 'Paid' && <CheckCircle2 size={12} />}
                      {item.status === 'Due Soon' && <Clock size={12} />}
                      {item.status === 'Overdue' && <AlertTriangle size={12} />}
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => triggerToast(`Viewing ${item.name} details`)}
                        className="px-3 py-1 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium rounded-full"
                      >
                        Detail
                      </button>
                      <button
                        onClick={() => onOpenPaymentModal(item)}
                        className="px-3.5 py-1 text-xs font-semibold bg-accent text-accent-foreground rounded-full shadow-sm hover:opacity-90 transition-opacity"
                      >
                        {item.category === 'Electricity' ? 'Recharge' : 'Pay'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
