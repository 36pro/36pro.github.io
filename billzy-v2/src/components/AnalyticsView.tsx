import React, { useMemo } from 'react';
import { Card, CardHeader, CardBody, Progress, Chip } from '@heroui/react';
import {
  BarChart3,
  TrendingUp,
  Zap,
  Flame,
  Droplets,
  Wifi,
  Dumbbell,
  FileText,
  Sun,
  Snowflake,
  Gauge
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { calculatePrepaidEfficiency, getSeasonName } from '../core/domain/seasonal';
import { BILL_DEFINITIONS } from '../core/contracts/utility';
import { parsePaymentRecord } from '../core/domain/fee-splitting';

export const AnalyticsView: React.FC = () => {
  const { payments } = useApp();

  // 1. Overall stats & category breakdown
  const { categoryTotals, grandTotal, monthlyTrends } = useMemo(() => {
    const catMap: Record<string, number> = {
      electric: 0,
      gas: 0,
      water: 0,
      internet: 0,
      gym: 0,
      tax: 0
    };

    const monthMap: Record<string, number> = {};
    let total = 0;

    payments.forEach(rawP => {
      const p = parsePaymentRecord(rawP);
      const amt = p.total;
      total += amt;

      const cat = p.utilityCategory || 'electric';
      if (cat in catMap) {
        catMap[cat] += amt;
      } else {
        catMap[cat] = (catMap[cat] || 0) + amt;
      }

      if (p.payDate && p.payDate.length >= 7) {
        const ym = p.payDate.substring(0, 7);
        monthMap[ym] = (monthMap[ym] || 0) + amt;
      }
    });

    // Last 6 months trend sorted chronologically
    const sortedMonths = Object.keys(monthMap)
      .sort()
      .slice(-6)
      .map(ym => ({
        month: ym,
        total: monthMap[ym]
      }));

    return {
      categoryTotals: catMap,
      grandTotal: total,
      monthlyTrends: sortedMonths
    };
  }, [payments]);

  // Max month for progress bars
  const maxMonthVal = useMemo(() => {
    return Math.max(...monthlyTrends.map(m => m.total), 1);
  }, [monthlyTrends]);

  // Prepaid efficiencies
  const prepaidEfficiencies = useMemo(() => {
    const prepaidBills = ['rupnagarDesco', 'uttaraDesco', 'rupnagarGas'];
    return prepaidBills.map(bId => {
      const eff = calculatePrepaidEfficiency(payments, bId);
      const billDef = BILL_DEFINITIONS[bId as keyof typeof BILL_DEFINITIONS];
      return {
        billId: bId,
        name: billDef ? billDef.name : bId,
        eff: eff || {
          billId: bId,
          daysPer1k: 0,
          dailyBurn: 0,
          cycles: 0,
          totalDays: 0,
          totalAmt: 0,
          isSeasonal: false,
          seasonName: null
        }
      };
    });
  }, [payments]);

  const currentSeason = getSeasonName(new Date());

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground font-sans">
            Consumption & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-muted">
            Prepaid burn efficiency, seasonal variation, and multi-year expenditure analysis.
          </p>
        </div>

        <Chip
          size="md"
          variant="flat"
          className="font-semibold text-xs border border-border"
          startContent={
            currentSeason === 'Summer' ? (
              <Sun size={15} className="text-amber-400 mr-1" />
            ) : (
              <Snowflake size={15} className="text-cyan-400 mr-1" />
            )
          }
        >
          Dhaka Season: {currentSeason} Intelligence Active
        </Chip>
      </div>

      {/* Grid: Category Breakdown + Monthly Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Card */}
        <Card className="bg-surface border border-border rounded-[var(--radius)] shadow-sm">
          <CardHeader className="flex justify-between items-center pb-2 border-b border-border/50">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-accent" />
              <h2 className="font-bold text-base text-foreground">Expenditure by Utility</h2>
            </div>
            <span className="text-xs font-amount font-bold text-muted">
              Total: ৳ {grandTotal.toLocaleString()}
            </span>
          </CardHeader>

          <CardBody className="py-4 space-y-4">
            {[
              { id: 'electric', label: 'Electricity (DESCO & REB)', icon: <Zap size={16} className="text-amber-400" />, color: 'primary' },
              { id: 'gas', label: 'Gas (Prepaid & Titas)', icon: <Flame size={16} className="text-orange-400" />, color: 'warning' },
              { id: 'water', label: 'Water Supply (DWASA)', icon: <Droplets size={16} className="text-cyan-400" />, color: 'primary' },
              { id: 'internet', label: 'Broadband ISP', icon: <Wifi size={16} className="text-purple-400" />, color: 'secondary' },
              { id: 'gym', label: 'Gym Subscriptions', icon: <Dumbbell size={16} className="text-emerald-400" />, color: 'success' },
              { id: 'tax', label: 'Land & Municipal Tax', icon: <FileText size={16} className="text-rose-400" />, color: 'danger' }
            ].map(cat => {
              const amt = categoryTotals[cat.id] || 0;
              const pct = grandTotal > 0 ? Math.round((amt / grandTotal) * 100) : 0;

              return (
                <div key={cat.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-foreground font-semibold">
                      {cat.icon}
                      {cat.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-amount font-bold text-foreground">
                        ৳ {amt.toLocaleString()}
                      </span>
                      <span className="text-[11px] text-muted font-mono-code">({pct}%)</span>
                    </div>
                  </div>
                  <Progress
                    value={pct}
                    color={cat.color as 'primary' | 'warning' | 'secondary' | 'success' | 'danger'}
                    size="sm"
                    className="h-1.5 rounded-full"
                  />
                </div>
              );
            })}
          </CardBody>
        </Card>

        {/* Monthly Trend Progress Bars */}
        <Card className="bg-surface border border-border rounded-[var(--radius)] shadow-sm">
          <CardHeader className="flex justify-between items-center pb-2 border-b border-border/50">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-accent" />
              <h2 className="font-bold text-base text-foreground">Recent Monthly Burn</h2>
            </div>
            <span className="text-xs text-muted">Last 6 Months</span>
          </CardHeader>

          <CardBody className="py-4 space-y-4">
            {monthlyTrends.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted">
                No monthly payment trends recorded yet.
              </div>
            ) : (
              monthlyTrends.map(item => {
                const pct = Math.round((item.total / maxMonthVal) * 100);
                return (
                  <div key={item.month} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-mono-code font-bold text-foreground">
                        {item.month}
                      </span>
                      <span className="font-amount font-bold text-accent">
                        ৳ {item.total.toLocaleString()}
                      </span>
                    </div>
                    <Progress
                      value={pct}
                      color="primary"
                      size="sm"
                      className="h-2 rounded-full"
                      classNames={{
                        indicator: 'bg-accent'
                      }}
                    />
                  </div>
                );
              })
            )}
          </CardBody>
        </Card>
      </div>

      {/* Prepaid Efficiency & Burn Rate Telemetry */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Gauge size={18} className="text-accent" />
          <h2 className="font-bold text-base sm:text-lg text-foreground">
            Prepaid Burn Efficiency Telemetry
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {prepaidEfficiencies.map(({ billId, name, eff }) => (
            <Card
              key={billId}
              className="bg-surface border border-border rounded-[var(--radius)] p-1 shadow-sm"
            >
              <CardHeader className="flex justify-between items-start pb-1">
                <div>
                  <h3 className="font-bold text-sm text-foreground">{name}</h3>
                  <span className="text-[11px] text-muted">
                    {eff.cycles > 0 ? `${eff.cycles} recorded cycles` : 'No telemetry data'}
                  </span>
                </div>
                <Chip size="sm" variant="flat" className="font-mono-code text-[10px] h-5">
                  Prepaid
                </Chip>
              </CardHeader>

              <CardBody className="py-2 space-y-2">
                <div className="p-3 rounded-[var(--field-radius)] bg-surface-secondary/70 border border-border/60 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-muted">Efficiency (Days / 1K):</span>
                    <span className="font-amount font-bold text-accent text-sm">
                      {eff.daysPer1k > 0 ? `${eff.daysPer1k} days` : '—'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted">Daily Burn Rate:</span>
                    <span className="font-amount font-semibold text-foreground">
                      {eff.dailyBurn > 0 ? `৳ ${eff.dailyBurn} / day` : '—'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-1 border-t border-border/40 text-[11px] text-muted">
                    <span>Observed Days:</span>
                    <span className="font-mono-code">{eff.totalDays}d</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
