import React, { useState } from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  PieChart,
  Calendar,
  Zap,
  Flame,
  Droplets,
  Wifi,
  Sun,
  Snowflake,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';

interface AnalyticsPageProps {
  triggerToast: (msg: string) => void;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ triggerToast }) => {
  const [metricView, setMetricView] = useState<'Cost' | 'Consumption'>('Cost');

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Analytics & Forecasting
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Predictive seasonal billing variance, category distribution and surcharge avoidance benchmarks.
          </p>
        </div>

        <div className="flex items-center bg-white dark:bg-[#121826] p-1 rounded-full shadow-[0_2px_12px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,255,255,0.06)] self-start md:self-auto">
          {(['Cost', 'Consumption'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setMetricView(tab)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                metricView === tab
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* 4 HERO UI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="heroui-card heroui-card-hover p-6 flex flex-col justify-between min-h-[125px]">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Annual Run-Rate</span>
          <div className="flex items-center gap-3">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
              ৳ 310,500
            </span>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold heroui-chip-success">
              <ArrowUpRight size={13} className="stroke-[2.5]" />
              ± 2.4%
            </span>
          </div>
        </div>

        <div className="heroui-card heroui-card-hover p-6 flex flex-col justify-between min-h-[125px]">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Electricity Share</span>
          <div className="flex items-center gap-3">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
              58.4%
            </span>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold heroui-chip-cyan">
              ৳ 16.6k/mo
            </span>
          </div>
        </div>

        <div className="heroui-card heroui-card-hover p-6 flex flex-col justify-between min-h-[125px]">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Surcharge Penalties</span>
          <div className="flex items-center gap-3">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
              ৳ 0
            </span>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold heroui-chip-success">
              100% Protected
            </span>
          </div>
        </div>

        <div className="heroui-card heroui-card-hover p-6 flex flex-col justify-between min-h-[125px]">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Per Capita Cost</span>
          <div className="flex items-center gap-3">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
              ৳ 7,110
            </span>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold heroui-chip-cyan">
              4 Persons
            </span>
          </div>
        </div>
      </div>

      {/* 2 LARGE VISUAL CHART HERO UI CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 12-Month Bar Chart */}
        <div className="heroui-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                12-Month Expense Trend
              </h3>
              <span className="text-xs text-slate-400 font-mono">Jan – Dec 2026</span>
            </div>

            {/* Sub-metrics */}
            <div className="grid grid-cols-3 gap-2 pb-3 mb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs text-slate-400">Peak Month</span>
                <div className="text-sm font-bold text-slate-900 dark:text-white font-amount">৳ 34,200 (Jun)</div>
              </div>
              <div>
                <span className="text-xs text-slate-400">Low Month</span>
                <div className="text-sm font-bold text-slate-900 dark:text-white font-amount">৳ 21,800 (Jan)</div>
              </div>
              <div>
                <span className="text-xs text-slate-400">Monthly Avg</span>
                <div className="text-sm font-bold text-slate-900 dark:text-white font-amount">৳ 25,875</div>
              </div>
            </div>

            {/* 12 Bars */}
            <div className="h-44 w-full flex items-end justify-between gap-1 sm:gap-2 pt-2 px-1">
              {[
                { m: 'Jan', val: 55 },
                { m: 'Feb', val: 58 },
                { m: 'Mar', val: 68 },
                { m: 'Apr', val: 78 },
                { m: 'May', val: 92 },
                { m: 'Jun', val: 98 },
                { m: 'Jul', val: 86 },
                { m: 'Aug', val: 76 },
                { m: 'Sep', val: 72 },
                { m: 'Oct', val: 70 },
                { m: 'Nov', val: 62 },
                { m: 'Dec', val: 58 }
              ].map((b, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="w-full flex items-end justify-center h-36">
                    <div
                      style={{ height: `${b.val}%` }}
                      className={`w-full max-w-[13px] rounded-full transition-all group-hover:opacity-85 ${
                        b.val > 90 ? 'bg-accent' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{b.m}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category Dual Spline Chart */}
        <div className="heroui-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Category Variance: Electricity vs Fixed Utilities
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-accent" />
                  <span>Electricity</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-[#38bdf8]" />
                  <span>Fixed</span>
                </div>
              </div>
            </div>

            <div className="mb-2">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
                ৳ 28,441
              </span>
              <div className="text-xs text-slate-400">Total utility spend in current cycle</div>
            </div>

            {/* SVG Curves */}
            <div className="relative h-44 w-full pt-1">
              <svg className="w-full h-36 overflow-visible" viewBox="0 0 500 150">
                <line x1="0" y1="30" x2="500" y2="30" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray="3 3" />
                <line x1="0" y1="80" x2="500" y2="80" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray="3 3" />
                <line x1="0" y1="130" x2="500" y2="130" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray="3 3" />

                <path
                  d="M 10 120 Q 80 110, 160 60 T 300 20 T 400 70 T 490 85"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                <path
                  d="M 10 130 Q 80 130, 160 125 T 300 125 T 400 125 T 490 125"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                <circle cx="400" cy="70" r="4.5" fill="var(--accent)" stroke="#fff" strokeWidth="2" />
                <circle cx="400" cy="125" r="4.5" fill="#38bdf8" stroke="#fff" strokeWidth="2" />
              </svg>

              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-2">
                <span>Jan</span>
                <span>Mar</span>
                <span>May</span>
                <span>Jul</span>
                <span>Sep</span>
                <span className="font-bold text-slate-900 dark:text-white">Oct</span>
                <span>Dec</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SEASONAL INSIGHTS HERO UI CARD */}
      <div className="heroui-card p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Seasonal Intelligence & Efficiency Notes
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs">
              <Sun size={16} />
              <span>Summer AC Peak (May–Aug)</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              DESCO consumption averages 18.2 kWh/day during peak summer heatwaves. Consider inverter scheduling.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 space-y-2">
            <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-bold text-xs">
              <Droplets size={16} />
              <span>Monsoon Pump Season (Sep–Oct)</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              WASA water motor runtimes increase by 22%. Submersible pump health is optimal at 224V.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 space-y-2">
            <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-bold text-xs">
              <Snowflake size={16} />
              <span>Winter Off-Peak (Nov–Feb)</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Power expenditure drops to lowest band (~৳ 12,000/mo). Excellent window for prepaid balance stocking.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
