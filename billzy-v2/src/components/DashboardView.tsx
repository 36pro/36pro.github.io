import React, { useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
  Chip,
  Switch,
  Tooltip,
  Divider
} from '@heroui/react';
import {
  Flame,
  AlertCircle,
  CalendarClock,
  Dumbbell,
  ExternalLink,
  Plus,
  Zap,
  Droplets,
  Wifi,
  FileText,
  Clock,
  ArrowUpRight,
  TrendingUp,
  ShieldCheck,
  BarChart2,
  Calendar,
  ChevronRight,
  Info
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BILL_DEFINITIONS, UtilityDefinition } from '../core/contracts/utility';
import { calculateNextDue } from '../core/domain/due-dates';
import { getStatusStyles, StatusType } from '../ui/tokens';
import { getCompanyForBill } from '../core/domain/utility-detail';
import { formatDateFriendlyShort } from '../core/domain/bill-month';

const UTILITY_ICONS: Record<string, React.ReactNode> = {
  electric: <Zap size={18} className="text-amber-400" />,
  gas: <Flame size={18} className="text-orange-400" />,
  water: <Droplets size={18} className="text-cyan-400" />,
  internet: <Wifi size={18} className="text-purple-400" />,
  gym: <Dumbbell size={18} className="text-emerald-400" />,
  tax: <FileText size={18} className="text-rose-400" />
};

export const DashboardView: React.FC = () => {
  const {
    payments,
    isGymPaused,
    toggleGymPause,
    matuailRate,
    openPaymentModal,
    descoMetrics,
    openDescoModal,
    openUniqueStats,
    openUtilityDetail
  } = useApp();

  // 1. Calculate monthly burn
  const { currentMonthTotal, previousMonthTotal, overdueCount, upcomingCount } = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const currMonthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const prevMonthPrefix = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;

    let currTotal = 0;
    let prevTotal = 0;

    payments.forEach(p => {
      const pAmt = p.totalPaid || p.amountNum || parseFloat(p.amount) || 0;
      if (p.payDate && p.payDate.startsWith(currMonthPrefix)) {
        currTotal += pAmt;
      } else if (p.payDate && p.payDate.startsWith(prevMonthPrefix)) {
        prevTotal += pAmt;
      }
    });

    // Count overdues and upcoming
    let overdues = 0;
    let upcoming = 0;

    Object.values(BILL_DEFINITIONS).forEach(bill => {
      const dueInfo = calculateNextDue(bill.id, payments, { gymPaused: isGymPaused, matuailRate });
      if (dueInfo.isOverdue) overdues++;
      else if (dueInfo.isDueSoon) upcoming++;
    });

    return {
      currentMonthTotal: currTotal,
      previousMonthTotal: prevTotal,
      overdueCount: overdues,
      upcomingCount: upcoming
    };
  }, [payments, isGymPaused, matuailRate]);

  const todayStr = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }, []);

  // Compute status for all utilities
  const billStatuses = useMemo(() => {
    const nowTime = new Date().getTime();

    return Object.values(BILL_DEFINITIONS).map(bill => {
      const dueInfo = calculateNextDue(bill.id, payments, {
        gymPaused: isGymPaused,
        matuailRate
      });

      let statusType: StatusType = 'muted';
      let statusLabel = 'Up to Date';

      if (dueInfo.isPaused) {
        statusType = 'muted';
        statusLabel = 'Paused';
      } else if (dueInfo.isOverdue) {
        statusType = 'overdue';
        statusLabel = 'Overdue';
      } else if (dueInfo.isDueSoon) {
        statusType = 'warning';
        statusLabel = 'Due Soon';
      } else if (dueInfo.statusClass === 'paid') {
        statusType = 'paid';
        statusLabel = 'Paid';
      } else if (dueInfo.statusClass === 'warning') {
        statusType = 'warning';
        statusLabel = 'Pending';
      }

      const billPayments = payments
        .filter(p => p.billId === bill.id)
        .sort((a, b) => (b.payDate || '').localeCompare(a.payDate || ''));
      const lastPayment = billPayments[0];

      let lastPayTop = 'Never';
      let lastPaySub = '-';
      let lastPayClass = 'text-muted';

      if (lastPayment) {
        const days = Math.floor((nowTime - new Date(lastPayment.payDate).getTime()) / 86400000);
        lastPayTop = days === 0 ? 'Today' : `${days} days ago`;
        lastPaySub = formatDateFriendlyShort(lastPayment.payDate);

        if (days <= 5) lastPayClass = 'text-emerald-400 font-bold';
        else if (days <= 15) lastPayClass = 'text-warning font-semibold';
        else lastPayClass = 'text-danger font-semibold';
      }

      const company = getCompanyForBill(bill.id);
      const isRecharge = bill.type === 'prepaid' && bill.formType === 'prepaid';
      const isDescoBill = bill.id === 'rupnagarDesco' || bill.id === 'uttaraDesco';

      return {
        bill,
        dueInfo,
        statusType,
        statusLabel,
        lastPayment,
        lastPayTop,
        lastPaySub,
        lastPayClass,
        company,
        isRecharge,
        isDescoBill
      };
    });
  }, [payments, isGymPaused, matuailRate]);

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground font-sans">
            Overview & Telemetry
          </h1>
          <p className="text-xs sm:text-sm text-muted">
            Real-time status of 9 Dhaka utility meters, subscriptions, and municipal dues.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="md"
            color="primary"
            className="w-full sm:w-auto bg-accent text-accent-foreground font-bold rounded-[var(--radius)] shadow-md hover:opacity-95"
            startContent={<Plus size={18} />}
            onClick={() => openPaymentModal()}
          >
            Record Payment
          </Button>
        </div>
      </div>

      {/* Top Date Banner + Summary Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-[var(--radius)] bg-surface border border-border shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold text-foreground">
          <Calendar size={16} className="text-accent" />
          <span>{todayStr}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Chip
            size="sm"
            variant="flat"
            className={overdueCount > 0 ? 'bg-danger/15 text-danger font-bold text-xs border border-danger/30' : 'bg-surface-secondary text-muted text-xs'}
          >
            Overdue: {overdueCount}
          </Chip>
          <Chip
            size="sm"
            variant="flat"
            className={upcomingCount > 0 ? 'bg-warning/15 text-warning font-bold text-xs border border-warning/30' : 'bg-surface-secondary text-muted text-xs'}
          >
            Due Soon: {upcomingCount}
          </Chip>
          <Chip
            size="sm"
            variant="flat"
            className="bg-emerald-500/15 text-emerald-400 font-bold text-xs border border-emerald-500/30"
          >
            All Accounts Synced
          </Chip>
        </div>
      </div>

      {/* HeroUI Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Monthly Burn */}
        <Card className="bg-surface/90 border border-border rounded-[var(--radius)] p-1 shadow-sm hover:border-accent/40 transition-colors">
          <CardHeader className="flex justify-between items-start pb-2">
            <div>
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                This Month Burn
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xs font-mono-code text-muted">৳</span>
                <span className="text-2xl sm:text-3xl font-black font-amount text-foreground">
                  {currentMonthTotal.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-accent/10 text-accent">
              <TrendingUp size={20} />
            </div>
          </CardHeader>
          <CardBody className="py-1">
            <span className="text-[11px] text-muted">
              Prev Month: ৳ {previousMonthTotal.toLocaleString()}
            </span>
          </CardBody>
        </Card>

        {/* Metric 2: Overdue Actionable */}
        <Card className="bg-surface/90 border border-border rounded-[var(--radius)] p-1 shadow-sm hover:border-danger/40 transition-colors">
          <CardHeader className="flex justify-between items-start pb-2">
            <div>
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                Overdue Bills
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className={`text-2xl sm:text-3xl font-black font-amount ${overdueCount > 0 ? 'text-danger' : 'text-foreground'}`}>
                  {overdueCount}
                </span>
                <span className="text-xs text-muted">requiring action</span>
              </div>
            </div>
            <div className={`p-2 rounded-lg ${overdueCount > 0 ? 'bg-danger/10 text-danger' : 'bg-surface-secondary text-muted'}`}>
              <AlertCircle size={20} />
            </div>
          </CardHeader>
          <CardBody className="py-1">
            <span className="text-[11px] text-muted">
              {overdueCount > 0 ? 'Late surcharges may apply' : 'All accounts settled on time'}
            </span>
          </CardBody>
        </Card>

        {/* Metric 3: Upcoming Dues */}
        <Card className="bg-surface/90 border border-border rounded-[var(--radius)] p-1 shadow-sm hover:border-warning/40 transition-colors">
          <CardHeader className="flex justify-between items-start pb-2">
            <div>
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                Upcoming Dues
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl sm:text-3xl font-black font-amount text-warning">
                  {upcomingCount}
                </span>
                <span className="text-xs text-muted">next 5–30 days</span>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-warning/10 text-warning">
              <CalendarClock size={20} />
            </div>
          </CardHeader>
          <CardBody className="py-1">
            <span className="text-[11px] text-muted">Scheduled cycles monitored</span>
          </CardBody>
        </Card>

        {/* Metric 4: Gym Subscription Status Card */}
        <Card className="bg-surface/90 border border-border rounded-[var(--radius)] p-1 shadow-sm hover:border-emerald-500/40 transition-colors">
          <CardHeader className="flex justify-between items-start pb-2">
            <div>
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                Gym Subscription
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-sm font-bold ${isGymPaused ? 'text-muted' : 'text-emerald-400'}`}>
                  {isGymPaused ? 'Paused 🔒' : 'Active (20th–20th)'}
                </span>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Dumbbell size={20} />
            </div>
          </CardHeader>
          <CardBody className="py-1 flex flex-row items-center justify-between">
            <span className="text-[11px] text-muted">Pause Billing</span>
            <Switch
              size="sm"
              isSelected={isGymPaused}
              onValueChange={toggleGymPause}
              color="warning"
              aria-label="Toggle Gym subscription pause"
            />
          </CardBody>
        </Card>
      </div>

      {/* DESCO Prepaid Quick Telemetry Bar */}
      <div className="p-4 rounded-[var(--radius)] bg-surface border border-border space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-400/10 text-amber-400">
              <Zap size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Live DESCO Electricity Telemetry
              </h3>
              <p className="text-[11px] text-muted">
                Real-time prepaid balance, daily consumption & seasonal exhaustion forecasting
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono-code text-muted hidden sm:inline">
            Dhaka Electric Supply Company
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(['rupnagarDesco', 'uttaraDesco'] as const).map(bId => {
            const bDef = BILL_DEFINITIONS[bId];
            const m = descoMetrics[bId];
            return (
              <div
                key={bId}
                onClick={() => openDescoModal(bId)}
                className="p-3 rounded-[var(--field-radius)] bg-surface-secondary/70 border border-border/80 hover:border-accent/60 cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-foreground group-hover:text-accent transition-colors truncate">
                      {bDef.name}
                    </span>
                    <span className="text-[10px] text-muted font-mono-code shrink-0">
                      ({bDef.account})
                    </span>
                  </div>
                  {m ? (
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className="font-mono-code font-bold"
                        style={{ color: m.alertColor }}
                      >
                        ৳ {m.formattedBalance}
                      </span>
                      <span className="text-muted">•</span>
                      <span className="text-muted text-[11px] truncate">
                        ~{m.daysRemaining}d left ({m.avgDailyUnits} kWh/d)
                      </span>
                    </div>
                  ) : (
                    <div className="text-xs text-muted">Click to view telemetry & calculator</div>
                  )}
                </div>

                <Button
                  size="sm"
                  variant="flat"
                  color="primary"
                  className="h-7 px-2 text-[11px] font-bold shrink-0 ml-2"
                  endContent={<ArrowUpRight size={12} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    openDescoModal(bId);
                  }}
                >
                  Live Stats
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actionable Due List Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-accent" />
            <h2 className="text-lg sm:text-xl font-bold text-foreground">
              Actionable Utilities & Meters
            </h2>
          </div>
          <span className="text-xs text-muted font-mono-code">
            Click any service row to open its Detail Hub
          </span>
        </div>

        {/* Desktop / Tablet Comprehensive Table View */}
        <div className="hidden md:block overflow-x-auto rounded-[var(--radius)] border border-border shadow-sm bg-surface">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-secondary/80 text-[11px] text-muted font-bold border-b border-border/60 uppercase">
              <tr>
                <th className="py-3 px-4">Bill</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Last Payment</th>
                <th className="py-3 px-4">Next Due</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {billStatuses.map(item => {
                const {
                  bill,
                  dueInfo,
                  statusType,
                  statusLabel,
                  lastPayTop,
                  lastPaySub,
                  lastPayClass,
                  company,
                  isDescoBill,
                  isRecharge
                } = item;
                const statusStyle = getStatusStyles(statusType);

                return (
                  <tr
                    key={bill.id}
                    onClick={() => openUtilityDetail(bill.id)}
                    className="hover:bg-surface-secondary/50 cursor-pointer transition-colors group"
                  >
                    {/* Bill & Company Cell */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-surface-secondary border border-border/70 shrink-0">
                          {UTILITY_ICONS[bill.utility] || <Zap size={16} />}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-foreground group-hover:text-accent transition-colors flex items-center gap-1">
                            <span>{bill.name}</span>
                            <ChevronRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity text-accent" />
                          </div>
                          <div className="text-[11px] text-muted flex items-center gap-1.5 mt-0.5">
                            <span className="font-semibold text-accent/90">{company}</span>
                            <span>•</span>
                            <span className="font-mono-code">{bill.account}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Type Cell */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Chip
                        size="sm"
                        variant="flat"
                        className="capitalize font-mono-code text-[10px] h-5 border border-border/60"
                      >
                        {bill.type}
                      </Chip>
                    </td>

                    {/* Last Payment Cell */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className={`text-xs ${lastPayClass}`}>{lastPayTop}</div>
                      <div className="text-[11px] text-muted font-mono-code">{lastPaySub}</div>
                    </td>

                    {/* Next Due Cell */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="text-xs font-bold text-foreground">{dueInfo.dueText}</div>
                      <div className="text-[11px] text-muted font-mono-code">
                        {dueInfo.diffDays !== undefined
                          ? dueInfo.diffDays < 0
                            ? `Overdue by ${Math.abs(dueInfo.diffDays)}d`
                            : `In ${dueInfo.diffDays}d`
                          : 'Cycle tracked'}
                      </div>
                    </td>

                    {/* Status Pill Cell */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Chip
                        size="sm"
                        variant="flat"
                        className="font-semibold text-[11px] px-2 h-6 border"
                        style={{
                          backgroundColor: statusStyle.bg,
                          color: statusStyle.color,
                          borderColor: statusStyle.borderColor
                        }}
                      >
                        {statusLabel}
                      </Chip>
                    </td>

                    {/* Actions Cell */}
                    <td className="py-3 px-4 whitespace-nowrap text-right">
                      <div
                        className="inline-flex items-center gap-1.5 justify-end"
                        onClick={e => e.stopPropagation()}
                      >
                        <Button
                          size="sm"
                          variant="light"
                          className="h-7 px-2 text-xs font-semibold text-muted hover:text-foreground"
                          onClick={() => openUtilityDetail(bill.id)}
                        >
                          Detail
                        </Button>

                        {isDescoBill ? (
                          <Button
                            size="sm"
                            variant="flat"
                            color="primary"
                            className="bg-amber-400/10 text-amber-500 dark:text-amber-400 hover:bg-amber-400/20 font-bold rounded-[var(--radius)] h-7 px-2.5 text-xs"
                            startContent={<Zap size={12} />}
                            onClick={() => openDescoModal(bill.id)}
                          >
                            Live
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="flat"
                            color="primary"
                            className="bg-accent/10 text-accent hover:bg-accent/20 font-bold rounded-[var(--radius)] h-7 px-2.5 text-xs"
                            startContent={<BarChart2 size={12} />}
                            onClick={() => openUniqueStats(bill.id)}
                          >
                            Stats
                          </Button>
                        )}

                        <Button
                          size="sm"
                          color="primary"
                          className="bg-accent text-accent-foreground font-bold rounded-[var(--radius)] h-7 px-3 text-xs"
                          onClick={() => openPaymentModal(bill.id)}
                        >
                          {isRecharge ? 'Recharge' : 'Pay'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Vertical Responsive Cards */}
        <div className="md:hidden grid grid-cols-1 gap-4">
          {billStatuses.map(item => {
            const {
              bill,
              dueInfo,
              statusType,
              statusLabel,
              lastPayTop,
              lastPaySub,
              lastPayClass,
              company,
              isDescoBill,
              isRecharge
            } = item;
            const statusStyle = getStatusStyles(statusType);

            return (
              <Card
                key={bill.id}
                onClick={() => openUtilityDetail(bill.id)}
                className="bg-surface border border-border hover:border-accent/40 cursor-pointer transition-all rounded-[var(--radius)] shadow-sm flex flex-col justify-between"
              >
                <CardHeader className="flex justify-between items-start pb-2 gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-lg bg-surface-secondary border border-border shrink-0">
                      {UTILITY_ICONS[bill.utility] || <Zap size={18} />}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-foreground leading-snug truncate">
                        {bill.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5 truncate">
                        <span className="text-[11px] text-accent font-semibold shrink-0">
                          {company}
                        </span>
                        <span className="text-muted/60">•</span>
                        <span className="text-[11px] text-muted font-mono-code truncate">
                          {bill.account}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Chip */}
                  <Chip
                    size="sm"
                    variant="flat"
                    className="font-semibold text-[11px] px-2 h-6 border shrink-0"
                    style={{
                      backgroundColor: statusStyle.bg,
                      color: statusStyle.color,
                      borderColor: statusStyle.borderColor
                    }}
                  >
                    {statusLabel}
                  </Chip>
                </CardHeader>

                <CardBody className="py-2 space-y-2">
                  <div className="p-2.5 rounded-[var(--field-radius)] bg-surface-secondary/70 border border-border/60">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted flex items-center gap-1">
                        <Clock size={12} />
                        {isRecharge ? 'Last Recharge' : 'Cycle Status'}
                      </span>
                      <span className="font-bold font-sans text-foreground text-xs text-right">
                        {dueInfo.dueText}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-muted mt-1 pt-1 border-t border-border/40 font-mono-code">
                      <span>Last Payment:</span>
                      <span className={lastPayClass}>{lastPayTop} ({lastPaySub})</span>
                    </div>
                  </div>

                  {/* DESCO Live Telemetry Quick Pill */}
                  {isDescoBill && descoMetrics[bill.id] && (
                    <div className="p-2 rounded-[var(--field-radius)] bg-surface-secondary/50 border border-border/80 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full inline-block animate-pulse shrink-0"
                          style={{
                            backgroundColor: descoMetrics[bill.id]?.alertColor,
                            boxShadow: `0 0 6px ${descoMetrics[bill.id]?.alertColor}`
                          }}
                        />
                        <div>
                          <span className="text-[10px] text-muted block leading-none">Live Balance</span>
                          <span
                            className="font-bold font-mono-code leading-tight"
                            style={{ color: descoMetrics[bill.id]?.alertColor }}
                          >
                            ৳ {descoMetrics[bill.id]?.formattedBalance}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-muted block leading-none">Days Left</span>
                        <span className="font-bold text-foreground text-[11px] leading-tight">
                          ~{descoMetrics[bill.id]?.daysRemaining}d
                        </span>
                      </div>
                    </div>
                  )}
                </CardBody>

                <CardFooter
                  className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-border/40"
                  onClick={e => e.stopPropagation()}
                >
                  <Button
                    size="sm"
                    variant="light"
                    className="h-8 px-2 text-xs text-muted"
                    onClick={() => openUtilityDetail(bill.id)}
                  >
                    Detail
                  </Button>

                  <div className="flex items-center gap-1.5">
                    {isDescoBill ? (
                      <Button
                        size="sm"
                        variant="flat"
                        color="primary"
                        className="bg-amber-400/10 text-amber-500 dark:text-amber-400 hover:bg-amber-400/20 font-bold rounded-[var(--radius)] h-8 px-2.5 text-xs"
                        startContent={<Zap size={13} />}
                        onClick={() => openDescoModal(bill.id)}
                      >
                        Telemetry
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="flat"
                        color="primary"
                        className="bg-accent/10 text-accent hover:bg-accent/20 font-bold rounded-[var(--radius)] h-8 px-2.5 text-xs"
                        startContent={<BarChart2 size={13} />}
                        onClick={() => openUniqueStats(bill.id)}
                      >
                        Stats
                      </Button>
                    )}
                    <Button
                      size="sm"
                      color="primary"
                      className="bg-accent text-accent-foreground font-bold rounded-[var(--radius)] h-8 px-3 text-xs"
                      onClick={() => openPaymentModal(bill.id)}
                    >
                      {isRecharge ? 'Recharge' : 'Pay Now'}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Floating Action Button (FAB) on Mobile */}
      <div className="fixed bottom-6 right-6 z-40 sm:hidden">
        <Button
          isIconOnly
          size="lg"
          color="primary"
          className="w-14 h-14 rounded-full bg-accent text-accent-foreground shadow-2xl flex items-center justify-center border-2 border-surface"
          aria-label="Add Payment"
          onClick={() => openPaymentModal()}
        >
          <Plus size={26} />
        </Button>
      </div>
    </div>
  );
};
