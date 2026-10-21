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
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BILL_DEFINITIONS, UtilityDefinition } from '../core/contracts/utility';
import { calculateNextDue } from '../core/domain/due-dates';
import { getStatusStyles, StatusType } from '../ui/tokens';

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
    openPaymentModal
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

  // Compute status for all utilities
  const billStatuses = useMemo(() => {
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

      return {
        bill,
        dueInfo,
        statusType,
        statusLabel
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

      {/* Actionable Due List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-accent" />
            <h2 className="text-lg sm:text-xl font-bold text-foreground">
              Actionable Utilities & Meters
            </h2>
          </div>
          <span className="text-xs text-muted font-mono-code">
            {billStatuses.length} Total Services
          </span>
        </div>

        {/* Responsive Grid of Utility Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {billStatuses.map(({ bill, dueInfo, statusType, statusLabel }) => {
            const statusStyle = getStatusStyles(statusType);
            const isRecharge = bill.type === 'prepaid' && bill.formType === 'prepaid';

            return (
              <Card
                key={bill.id}
                className="bg-surface border border-border hover:border-accent/40 transition-all rounded-[var(--radius)] shadow-sm flex flex-col justify-between"
              >
                <CardHeader className="flex justify-between items-start pb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-surface-secondary border border-border">
                      {UTILITY_ICONS[bill.utility] || <Zap size={18} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-foreground leading-snug">
                        {bill.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] text-muted font-mono-code">
                          {bill.account}
                        </span>
                        {bill.location && (
                          <span className="text-[10px] text-muted/70 truncate max-w-[120px]">
                            • {bill.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Chip */}
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
                </CardHeader>

                <CardBody className="py-2 space-y-2">
                  <div className="p-2.5 rounded-[var(--field-radius)] bg-surface-secondary/70 border border-border/60">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted flex items-center gap-1">
                        <Clock size={12} />
                        {isRecharge ? 'Last Recharge' : 'Cycle Status'}
                      </span>
                      <span className="font-bold font-sans text-foreground text-xs sm:text-sm text-right">
                        {dueInfo.dueText}
                      </span>
                    </div>
                    {bill.meterNumber && (
                      <div className="flex justify-between items-center text-[10px] text-muted mt-1 pt-1 border-t border-border/40 font-mono-code">
                        <span>Meter / ID</span>
                        <span>{bill.meterNumber}</span>
                      </div>
                    )}
                  </div>
                </CardBody>

                <CardFooter className="pt-1 flex items-center justify-between gap-2 border-t border-border/40">
                  {bill.portalUrl ? (
                    <a
                      href={bill.portalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-accent hover:underline flex items-center gap-0.5 font-medium"
                    >
                      <span>Portal</span>
                      <ArrowUpRight size={12} />
                    </a>
                  ) : (
                    <span className="text-[11px] text-muted">Local Record</span>
                  )}

                  <Button
                    size="sm"
                    color="primary"
                    variant="flat"
                    className="bg-accent/15 text-accent hover:bg-accent hover:text-accent-foreground font-bold rounded-[var(--radius)] h-8 px-3 text-xs"
                    onClick={() => openPaymentModal(bill.id)}
                  >
                    {isRecharge ? 'Recharge' : 'Pay Now'}
                  </Button>
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
