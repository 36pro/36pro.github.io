import React, { useState } from 'react';
import {
  User,
  Shield,
  Dumbbell,
  Bell,
  Sun,
  Moon,
  Palette,
  Sliders,
  Check,
  Save,
  RotateCcw,
  Sparkles
} from 'lucide-react';

interface SettingsPageProps {
  isDark: boolean;
  toggleTheme: () => void;
  triggerToast: (msg: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  isDark,
  toggleTheme,
  triggerToast
}) => {
  const [isGymPaused, setIsGymPaused] = useState(false);
  const [notifySms, setNotifySms] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [descoThreshold, setDescoThreshold] = useState('500');

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            System Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage household profiles, subscription rules, automated notification triggers & appearance.
          </p>
        </div>

        <button
          onClick={() => triggerToast('Configuration settings saved')}
          className="px-4 py-2 rounded-full bg-accent text-accent-foreground text-xs font-bold shadow-sm hover:opacity-95 transition-opacity flex items-center gap-1.5 self-start md:self-auto"
        >
          <Save size={14} />
          <span>Save Changes</span>
        </button>
      </div>

      {/* 3 HERO UI SETTINGS CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: User Profile & Household */}
        <div className="heroui-card p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full ring-2 ring-accent/30 overflow-hidden shrink-0">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                alt="Kate Moore"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Kate Moore</h3>
              <span className="text-xs text-slate-400">Head of Household • Dhaka</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                Email Address
              </label>
              <input
                type="email"
                defaultValue="kate.moore@billzy.io"
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs rounded-xl px-3 py-2 border-none focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                Monitored Premises
              </label>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                <div className="font-semibold text-slate-900 dark:text-white">1. Rupnagar Mirpur Residence</div>
                <div className="text-slate-400">2. Uttara Sector 11 Apartment</div>
                <div className="text-slate-400">3. Matuail Holding Plot 14/B</div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Subscription & Rules */}
        <div className="heroui-card p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Dumbbell size={18} className="text-accent" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Rules & Cycles
            </h3>
          </div>

          {/* Gym Pause Switch */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div className="font-semibold text-xs text-slate-900 dark:text-white">
                Gym Subscription Pause
              </div>
              <span className="text-[11px] text-slate-400">
                Cycle anchor: 20th–20th of each month
              </span>
            </div>
            <button
              onClick={() => {
                const next = !isGymPaused;
                setIsGymPaused(next);
                triggerToast(next ? 'Gym billing paused' : 'Gym billing resumed');
              }}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                isGymPaused ? 'bg-accent' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  isGymPaused ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* DESCO Alert Threshold */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
              Low Prepaid Balance Notification Threshold (৳)
            </label>
            <input
              type="number"
              value={descoThreshold}
              onChange={(e) => setDescoThreshold(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs rounded-xl px-3 py-2 border-none focus:outline-none focus:ring-2 focus:ring-accent font-amount font-bold"
            />
            <span className="text-[10px] text-slate-400">Alert triggers when balance drops below this amount</span>
          </div>

          {/* Notifications toggles */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-300">SMS Reminders</span>
              <input
                type="checkbox"
                checked={notifySms}
                onChange={(e) => setNotifySms(e.target.checked)}
                className="rounded accent-accent"
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-300">Email Digest (Weekly)</span>
              <input
                type="checkbox"
                checked={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.checked)}
                className="rounded accent-accent"
              />
            </div>
          </div>
        </div>

        {/* Card 3: HeroUI Appearance & Theme Customizer */}
        <div className="heroui-card p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Palette size={18} className="text-accent" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              HeroUI Appearance
            </h3>
          </div>

          {/* Mode Switcher */}
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">
              Color Theme
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  if (isDark) toggleTheme();
                }}
                className={`p-3 rounded-2xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                  !isDark
                    ? 'border-accent bg-accent/10 text-accent-foreground font-bold shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 text-slate-500'
                }`}
              >
                <Sun size={16} />
                <span>Light Mode</span>
              </button>
              <button
                onClick={() => {
                  if (!isDark) toggleTheme();
                }}
                className={`p-3 rounded-2xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                  isDark
                    ? 'border-accent bg-accent/20 text-white font-bold shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 text-slate-500'
                }`}
              >
                <Moon size={16} />
                <span>Dark Mode</span>
              </button>
            </div>
          </div>

          {/* Accent Color Circle Indicator */}
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">
              Active OKLCH Accent
            </span>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-accent ring-2 ring-accent/30 flex items-center justify-center text-white text-[10px]">
                <Check size={14} className="stroke-[3]" />
              </div>
              <span className="text-xs font-mono font-medium text-slate-600 dark:text-slate-300">
                oklch(78% 0.16 225) • Electric Cyan
              </span>
            </div>
          </div>

          {/* Font & Radius Info */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Font Family:</span>
              <span className="font-semibold text-slate-900 dark:text-white">Inter</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Base Radius:</span>
              <span className="font-semibold text-slate-900 dark:text-white">0.5rem (Medium)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Card Geometry:</span>
              <span className="font-semibold text-slate-900 dark:text-white">1.0rem (Rounded-2xl)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
