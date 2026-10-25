import React, { useState } from 'react';
import {
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Sliders,
  BatteryCharging,
  Gauge,
  Activity,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Sparkles
} from 'lucide-react';

interface TrackerPageProps {
  onOpenPaymentModal: (utility?: any) => void;
  triggerToast: (msg: string) => void;
}

export const TrackerPage: React.FC<TrackerPageProps> = ({
  onOpenPaymentModal,
  triggerToast
}) => {
  const [selectedMeter, setSelectedMeter] = useState<'rupnagar' | 'uttara'>('rupnagar');

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Live Tracker & Telemetry
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              Live Feed
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time DESCO smart prepaid meters, load profiles, voltage stability & auto-recharge forecasting.
          </p>
        </div>

        <button
          onClick={() => triggerToast('DESCO API telemetry polled: 0 errors, 224.8V active')}
          className="px-4 py-2 rounded-full bg-accent text-accent-foreground text-xs font-bold shadow-sm hover:opacity-95 transition-opacity flex items-center gap-1.5 self-start md:self-auto"
        >
          <RefreshCw size={14} />
          <span>Poll Live Meters</span>
        </button>
      </div>

      {/* 4 HERO UI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="heroui-card heroui-card-hover p-6 flex flex-col justify-between min-h-[125px]">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Reserve</span>
          <div className="flex items-center gap-3">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
              ৳ 1,840
            </span>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold heroui-chip-success">
              <ArrowUpRight size={13} className="stroke-[2.5]" />
              ~14 Days
            </span>
          </div>
        </div>

        <div className="heroui-card heroui-card-hover p-6 flex flex-col justify-between min-h-[125px]">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Grid Voltage</span>
          <div className="flex items-center gap-3">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
              224.8 V
            </span>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold heroui-chip-cyan">
              Optimal
            </span>
          </div>
        </div>

        <div className="heroui-card heroui-card-hover p-6 flex flex-col justify-between min-h-[125px]">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Daily Burn Rate</span>
          <div className="flex items-center gap-3">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
              14.2 kWh
            </span>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold heroui-chip-success">
              <ArrowDownRight size={13} className="stroke-[2.5]" />
              -0.8 kWh
            </span>
          </div>
        </div>

        <div className="heroui-card heroui-card-hover p-6 flex flex-col justify-between min-h-[125px]">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Exhaustion Forecast</span>
          <div className="flex items-center gap-3">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
              02 Nov 2026
            </span>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400">
              In 11d
            </span>
          </div>
        </div>
      </div>

      {/* 2 DEDICATED SMART METER HERO UI CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Meter 1: Rupnagar DESCO */}
        <div className="heroui-card p-6 space-y-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center font-bold">
                <Zap size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Rupnagar Smart Prepaid
                </h3>
                <span className="text-xs text-slate-400 font-mono">DESCO Meter #3829104</span>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold heroui-chip-success">
              Online
            </span>
          </div>

          {/* Balance Display */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">Prepaid Balance</span>
              <div className="text-3xl font-bold text-slate-900 dark:text-white font-amount mt-0.5">
                ৳ 1,120
              </div>
              <span className="text-[11px] text-[#00b46e] font-semibold">
                ~9.2 days remaining at current load
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 font-medium">Daily Consumption</span>
              <div className="text-lg font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                8.5 kWh/d
              </div>
              <span className="text-[11px] text-slate-400 font-mono">226.4V • 0.94 PF</span>
            </div>
          </div>

          {/* Quick Recharge Pills */}
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">
              Quick Recharge Presets
            </span>
            <div className="grid grid-cols-3 gap-2">
              {['৳ 1,000', '৳ 2,000', '৳ 3,000'].map((amt) => (
                <button
                  key={amt}
                  onClick={() => onOpenPaymentModal()}
                  className="py-2 px-3 rounded-full bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 hover:border-accent hover:text-accent transition-colors shadow-xs"
                >
                  {amt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Meter 2: Uttara DESCO */}
        <div className="heroui-card p-6 space-y-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#38bdf8]/10 text-[#38bdf8] flex items-center justify-center font-bold">
                <Zap size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Uttara Residence Power
                </h3>
                <span className="text-xs text-slate-400 font-mono">DESCO Meter #4928172</span>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold heroui-chip-success">
              Online
            </span>
          </div>

          {/* Balance Display */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">Prepaid Balance</span>
              <div className="text-3xl font-bold text-slate-900 dark:text-white font-amount mt-0.5">
                ৳ 720
              </div>
              <span className="text-[11px] text-[#00b46e] font-semibold">
                ~5.1 days remaining at current load
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 font-medium">Daily Consumption</span>
              <div className="text-lg font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                5.7 kWh/d
              </div>
              <span className="text-[11px] text-slate-400 font-mono">223.2V • 0.96 PF</span>
            </div>
          </div>

          {/* Quick Recharge Pills */}
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">
              Quick Recharge Presets
            </span>
            <div className="grid grid-cols-3 gap-2">
              {['৳ 1,000', '৳ 1,500', '৳ 2,500'].map((amt) => (
                <button
                  key={amt}
                  onClick={() => onOpenPaymentModal()}
                  className="py-2 px-3 rounded-full bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 hover:border-accent hover:text-accent transition-colors shadow-xs"
                >
                  {amt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 24-HOUR HOURLY LOAD PROFILE HERO UI CARD */}
      <div className="heroui-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              24-Hour Load Telemetry Profile (kWh)
            </h3>
            <p className="text-xs text-slate-400">Peak load observed between 08:00 PM and 11:30 PM (Air conditioning & kitchen appliances)</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Peak: 1.82 kWh/h</span>
          </div>
        </div>

        {/* Hourly Bars */}
        <div className="h-44 w-full flex items-end justify-between gap-1 sm:gap-2 pt-4 px-1">
          {[
            { hour: '00', val: 20 },
            { hour: '02', val: 18 },
            { hour: '04', val: 15 },
            { hour: '06', val: 25 },
            { hour: '08', val: 45 },
            { hour: '10', val: 55 },
            { hour: '12', val: 68 },
            { hour: '14', val: 72 },
            { hour: '16', val: 58 },
            { hour: '18', val: 65 },
            { hour: '20', val: 92 },
            { hour: '22', val: 84 }
          ].map((bar, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
              <div className="w-full flex items-end justify-center h-36">
                <div
                  style={{ height: `${bar.val}%` }}
                  className={`w-full max-w-[14px] rounded-full transition-all group-hover:opacity-85 ${
                    bar.val > 75 ? 'bg-accent' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                />
              </div>
              <span className="text-[10px] text-slate-400 font-mono">{bar.hour}:00</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
