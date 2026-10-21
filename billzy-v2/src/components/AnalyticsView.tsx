import React, { useMemo, useRef, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Progress,
  Chip,
  Button
} from '@heroui/react';
import {
  TrendingUp,
  Calendar,
  Zap,
  Gauge,
  Sun,
  Snowflake,
  ShieldAlert,
  Flame,
  Droplets,
  Wifi,
  Activity,
  ArrowUpRight,
  PieChart,
  BarChart2
} from 'lucide-react';
import Chart from 'chart.js/auto';
import { useApp } from '../context/AppContext';
import {
  computeComprehensiveAnalytics,
  formatDaysWithMonths,
  ComprehensiveAnalytics
} from '../core/domain/analytics';
import { getSeasonName } from '../core/domain/seasonal';

export const AnalyticsView: React.FC = () => {
  const { payments, openDescoModal } = useApp();

  const currentSeason = getSeasonName(new Date());

  const analyticsData: ComprehensiveAnalytics = useMemo(() => {
    return computeComprehensiveAnalytics(payments, new Date());
  }, [payments]);

  // Canvas Refs for Chart.js
  const surchargeChartRef = useRef<HTMLCanvasElement | null>(null);
  const monthly12ChartRef = useRef<HTMLCanvasElement | null>(null);
  const yoyCumulativeChartRef = useRef<HTMLCanvasElement | null>(null);
  const radarChartRef = useRef<HTMLCanvasElement | null>(null);
  const quarterlyChartRef = useRef<HTMLCanvasElement | null>(null);
  const bubbleChartRef = useRef<HTMLCanvasElement | null>(null);
  const momInflationChartRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize and update charts
  useEffect(() => {
    const charts: Chart[] = [];

    // Chart 0: 6-Month Rolling Surcharges Bar Chart
    if (surchargeChartRef.current && analyticsData.surcharges.surchargeTrend.labels.length > 0) {
      const ctx = surchargeChartRef.current.getContext('2d');
      if (ctx) {
        const c = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: analyticsData.surcharges.surchargeTrend.labels,
            datasets: [
              {
                label: 'Surcharges (৳)',
                data: analyticsData.surcharges.surchargeTrend.values,
                backgroundColor: 'rgba(255, 122, 0, 0.45)',
                borderColor: '#FF7A00',
                borderWidth: 1.5,
                borderRadius: 4
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: ctx => ` Surcharge: ৳ ${Math.round(ctx.parsed.y ?? 0)}`
                }
              }
            },
            scales: {
              x: {
                grid: { display: false },
                ticks: { color: 'rgba(150, 150, 150, 0.8)', font: { size: 10 } }
              },
              y: {
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: {
                  color: 'rgba(150, 150, 150, 0.8)',
                  font: { size: 10 },
                  callback: val => `৳${val}`
                }
              }
            }
          }
        });
        charts.push(c);
      }
    }

    // Chart 1: 12-Month Monthly Spend Area Chart
    if (monthly12ChartRef.current && analyticsData.charts.monthly12.labels.length > 0) {
      const ctx = monthly12ChartRef.current.getContext('2d');
      if (ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 260);
        gradient.addColorStop(0, 'rgba(0, 194, 255, 0.35)');
        gradient.addColorStop(1, 'rgba(0, 194, 255, 0.0)');

        const c = new Chart(ctx, {
          type: 'line',
          data: {
            labels: analyticsData.charts.monthly12.labels,
            datasets: [
              {
                label: 'Monthly Spend',
                data: analyticsData.charts.monthly12.values,
                borderColor: '#00C2FF',
                borderWidth: 2.5,
                backgroundColor: gradient,
                fill: true,
                tension: 0.35,
                pointBackgroundColor: '#00C2FF',
                pointBorderColor: '#0b1730',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: { padding: { top: 20, right: 15 } },
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: ctx => ` ৳ ${Math.round(ctx.parsed.y ?? 0).toLocaleString()}`
                }
              }
            },
            scales: {
              x: {
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: 'rgba(150, 150, 150, 0.8)', font: { size: 10 } }
              },
              y: {
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: {
                  color: 'rgba(150, 150, 150, 0.8)',
                  font: { size: 10 },
                  callback: val => `৳${Number(val).toLocaleString()}`
                }
              }
            }
          }
        });
        charts.push(c);
      }
    }

    // Chart 2: YoY Cumulative Spend Comparison
    if (yoyCumulativeChartRef.current) {
      const ctx = yoyCumulativeChartRef.current.getContext('2d');
      if (ctx) {
        const gradPrev = ctx.createLinearGradient(0, 0, 0, 260);
        gradPrev.addColorStop(0, 'rgba(100, 116, 139, 0.25)');
        gradPrev.addColorStop(1, 'rgba(100, 116, 139, 0.0)');

        const gradCurr = ctx.createLinearGradient(0, 0, 0, 260);
        gradCurr.addColorStop(0, 'rgba(0, 230, 118, 0.25)');
        gradCurr.addColorStop(1, 'rgba(0, 230, 118, 0.0)');

        const c = new Chart(ctx, {
          type: 'line',
          data: {
            labels: analyticsData.charts.yoyCumulative.labels,
            datasets: [
              {
                label: `${analyticsData.charts.yoyCumulative.prevYear} Cumulative`,
                data: analyticsData.charts.yoyCumulative.prevYearCumulative,
                borderColor: 'rgba(148, 163, 184, 0.8)',
                borderWidth: 2,
                backgroundColor: gradPrev,
                fill: true,
                tension: 0.3,
                pointRadius: 3
              },
              {
                label: `${analyticsData.charts.yoyCumulative.currentYear} Cumulative`,
                data: analyticsData.charts.yoyCumulative.currentYearCumulative,
                borderColor: '#00E676',
                borderWidth: 2.5,
                backgroundColor: gradCurr,
                fill: true,
                tension: 0.3,
                pointRadius: 4,
                pointBackgroundColor: '#00E676'
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
              legend: {
                labels: { color: 'rgba(200, 200, 200, 0.9)', font: { size: 11 } }
              },
              tooltip: {
                callbacks: {
                  label: ctx => ` ${ctx.dataset.label}: ৳ ${Math.round(ctx.parsed.y ?? 0).toLocaleString()}`
                }
              }
            },
            scales: {
              x: {
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: 'rgba(150, 150, 150, 0.8)', font: { size: 10 } }
              },
              y: {
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: {
                  color: 'rgba(150, 150, 150, 0.8)',
                  font: { size: 10 },
                  callback: val => `৳${Number(val).toLocaleString()}`
                }
              }
            }
          }
        });
        charts.push(c);
      }
    }

    // Chart 3: 4D Spending Radar Chart
    if (radarChartRef.current) {
      const ctx = radarChartRef.current.getContext('2d');
      if (ctx) {
        const c = new Chart(ctx, {
          type: 'radar',
          data: {
            labels: [
              `Electricity (৳${analyticsData.charts.radar4D.totals.electricity.toLocaleString()})`,
              `Water (৳${analyticsData.charts.radar4D.totals.water.toLocaleString()})`,
              `Gas (৳${analyticsData.charts.radar4D.totals.gas.toLocaleString()})`,
              `Internet (৳${analyticsData.charts.radar4D.totals.internet.toLocaleString()})`
            ],
            datasets: [
              {
                label: 'Category Total (৳)',
                data: analyticsData.charts.radar4D.data,
                backgroundColor: 'rgba(168, 85, 247, 0.25)',
                borderColor: '#a855f7',
                borderWidth: 2,
                pointBackgroundColor: '#a855f7',
                pointBorderColor: '#0b1730',
                pointBorderWidth: 2,
                pointRadius: 4
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: ctx => ` ৳ ${Math.round(Number(ctx.raw ?? 0)).toLocaleString()}`
                }
              }
            },
            scales: {
              r: {
                grid: { color: 'rgba(255, 255, 255, 0.08)' },
                angleLines: { color: 'rgba(255, 255, 255, 0.08)' },
                pointLabels: {
                  color: 'rgba(200, 200, 200, 0.9)',
                  font: { size: 10, weight: 'bold' }
                },
                ticks: { display: false }
              }
            }
          }
        });
        charts.push(c);
      }
    }

    // Chart 4: Quarterly Stacked Chart
    if (quarterlyChartRef.current && analyticsData.charts.quarterly.datasets.length > 0) {
      const ctx = quarterlyChartRef.current.getContext('2d');
      if (ctx) {
        const colors = [
          '#38bdf8', '#34d399', '#fbbf24', '#a855f7', '#fb7185',
          '#6366f1', '#14b8a6', '#f43f5e', '#8b5cf6'
        ];
        const datasets = analyticsData.charts.quarterly.datasets.map((d, idx) => ({
          ...d,
          backgroundColor: colors[idx % colors.length],
          borderColor: colors[idx % colors.length],
          borderRadius: 4
        }));

        const c = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: analyticsData.charts.quarterly.quarters,
            datasets
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  color: 'rgba(200, 200, 200, 0.8)',
                  boxWidth: 10,
                  font: { size: 10 }
                }
              },
              tooltip: {
                callbacks: {
                  label: ctx => ` ${ctx.dataset.label}: ৳ ${Math.round(Number(ctx.raw ?? 0)).toLocaleString()}`
                }
              }
            },
            scales: {
              x: {
                stacked: true,
                grid: { display: false },
                ticks: { color: 'rgba(150, 150, 150, 0.8)', font: { size: 11, weight: 'bold' } }
              },
              y: {
                stacked: true,
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: {
                  color: 'rgba(150, 150, 150, 0.8)',
                  font: { size: 10 },
                  callback: val => `৳${Number(val).toLocaleString()}`
                }
              }
            }
          }
        });
        charts.push(c);
      }
    }

    // Chart 5: Day-of-Month Cash Flow Bubble Chart
    if (bubbleChartRef.current && analyticsData.charts.cashFlowBubbles.length > 0) {
      const ctx = bubbleChartRef.current.getContext('2d');
      if (ctx) {
        const c = new Chart(ctx, {
          type: 'bubble',
          data: {
            datasets: [
              {
                label: 'Payments',
                data: analyticsData.charts.cashFlowBubbles,
                backgroundColor: 'rgba(0, 194, 255, 0.35)',
                borderColor: '#00C2FF',
                borderWidth: 1.5,
                hoverBackgroundColor: 'rgba(0, 230, 118, 0.45)',
                hoverBorderColor: '#00E676'
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  title: ctx => {
                    const raw = ctx[0].raw as { billName?: string };
                    return raw.billName || 'Payment';
                  },
                  label: ctx => {
                    const raw = ctx.raw as { payDate?: string; y?: number };
                    return ` Date: ${raw.payDate} | ৳ ${Math.round(raw.y ?? 0).toLocaleString()}`;
                  }
                }
              }
            },
            scales: {
              x: {
                min: 1,
                max: 31,
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: {
                  color: 'rgba(150, 150, 150, 0.8)',
                  font: { size: 10 },
                  stepSize: 5
                },
                title: {
                  display: true,
                  text: 'Day of Month',
                  color: 'rgba(150, 150, 150, 0.8)',
                  font: { size: 10, weight: 'bold' }
                }
              },
              y: {
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: {
                  color: 'rgba(150, 150, 150, 0.8)',
                  font: { size: 10 },
                  callback: val => `৳${Number(val).toLocaleString()}`
                },
                title: {
                  display: true,
                  text: 'Amount (৳)',
                  color: 'rgba(150, 150, 150, 0.8)',
                  font: { size: 10, weight: 'bold' }
                }
              }
            }
          }
        });
        charts.push(c);
      }
    }

    // Chart 6: Month-over-Month Inflation % Chart
    if (momInflationChartRef.current && analyticsData.charts.momInflation.labels.length > 0) {
      const ctx = momInflationChartRef.current.getContext('2d');
      if (ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 260);
        gradient.addColorStop(0, 'rgba(255, 96, 119, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 96, 119, 0.0)');

        const c = new Chart(ctx, {
          type: 'line',
          data: {
            labels: analyticsData.charts.momInflation.labels,
            datasets: [
              {
                label: 'MoM Variance (%)',
                data: analyticsData.charts.momInflation.rates,
                borderColor: '#ff6077',
                borderWidth: 2.5,
                backgroundColor: gradient,
                fill: true,
                tension: 0.35,
                pointBackgroundColor: '#ff6077',
                pointBorderColor: '#0b1730',
                pointBorderWidth: 2,
                pointRadius: 4
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: ctx => ` MoM Variance: ${(ctx.parsed.y ?? 0) > 0 ? '+' : ''}${(ctx.parsed.y ?? 0).toFixed(1)}%`
                }
              }
            },
            scales: {
              x: {
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: 'rgba(150, 150, 150, 0.8)', font: { size: 10 } }
              },
              y: {
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: {
                  color: 'rgba(150, 150, 150, 0.8)',
                  font: { size: 10 },
                  callback: val => `${val}%`
                }
              }
            }
          }
        });
        charts.push(c);
      }
    }

    return () => {
      charts.forEach(c => c.destroy());
    };
  }, [analyticsData]);

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground font-sans">
            Consumption & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-muted">
            Prepaid burn efficiency, seasonal variation, gateway surcharges, and multi-year expenditure intelligence.
          </p>
        </div>

        <Chip
          size="md"
          variant="flat"
          className="font-semibold text-xs border border-border shrink-0 self-start sm:self-auto"
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

      {/* 1. Global KPI Metrics (4 Hero Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Lifetime Spend */}
        <Card className="bg-surface border border-border rounded-[var(--radius)] p-1 shadow-sm hover:border-accent/40 transition-colors">
          <CardHeader className="flex justify-between items-start pb-2">
            <div>
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                Lifetime Spend
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xs font-mono-code text-muted">৳</span>
                <span className="text-2xl sm:text-3xl font-black font-amount text-foreground">
                  {analyticsData.kpi.lifetimeSpend.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-accent/10 text-accent">
              <TrendingUp size={20} />
            </div>
          </CardHeader>
          <CardBody className="py-1">
            <span className="text-[11px] text-muted">
              Total historical utility outlay
            </span>
          </CardBody>
        </Card>

        {/* KPI 2: YTD Spend */}
        <Card className="bg-surface border border-border rounded-[var(--radius)] p-1 shadow-sm hover:border-emerald-500/40 transition-colors">
          <CardHeader className="flex justify-between items-start pb-2">
            <div>
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                YTD Spend
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xs font-mono-code text-muted">৳</span>
                <span className="text-2xl sm:text-3xl font-black font-amount text-emerald-400">
                  {analyticsData.kpi.ytdSpend.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Calendar size={20} />
            </div>
          </CardHeader>
          <CardBody className="py-1">
            <span className="text-[11px] text-muted">
              {analyticsData.kpi.ytdSubtext}
            </span>
          </CardBody>
        </Card>

        {/* KPI 3: Highest Bill Ever */}
        <Card className="bg-surface border border-border rounded-[var(--radius)] p-1 shadow-sm hover:border-warning/40 transition-colors">
          <CardHeader className="flex justify-between items-start pb-2">
            <div>
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                Highest Single Bill
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xs font-mono-code text-muted">৳</span>
                <span className="text-2xl sm:text-3xl font-black font-amount text-warning">
                  {analyticsData.kpi.highestBill.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-warning/10 text-warning">
              <Activity size={20} />
            </div>
          </CardHeader>
          <CardBody className="py-1">
            <span className="text-[11px] text-muted truncate block">
              {analyticsData.kpi.highestBillLabel}
            </span>
          </CardBody>
        </Card>

        {/* KPI 4: Dynamic Monthly Average */}
        <Card className="bg-surface border border-border rounded-[var(--radius)] p-1 shadow-sm hover:border-purple-500/40 transition-colors">
          <CardHeader className="flex justify-between items-start pb-2">
            <div>
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                Monthly Average
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xs font-mono-code text-muted">৳</span>
                <span className="text-2xl sm:text-3xl font-black font-amount text-purple-400">
                  {analyticsData.kpi.avgMonthlySpend.toLocaleString()}
                </span>
                <span className="text-xs text-muted">/mo</span>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Gauge size={20} />
            </div>
          </CardHeader>
          <CardBody className="py-1">
            <span className="text-[11px] text-muted">
              Tracked window run-rate
            </span>
          </CardBody>
        </Card>
      </div>

      {/* 2. Gateway Surcharge Intelligence Panel */}
      <Card className="bg-surface border border-border rounded-[var(--radius)] shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-orange-500/15 text-orange-400">
              <ShieldAlert size={18} />
            </div>
            <div>
              <h2 className="font-bold text-base text-foreground">
                Payment Gateway Surcharge Intelligence
              </h2>
              <p className="text-xs text-muted">
                Transaction fees absorbed across bKash, Nagad, cards & municipal portals
              </p>
            </div>
          </div>
          <Chip size="sm" variant="flat" className="font-mono-code text-[11px] h-6 bg-orange-500/10 text-orange-400 border border-orange-500/20">
            {analyticsData.surcharges.feeTransactionsCount} Surcharged Transactions
          </Chip>
        </CardHeader>

        <CardBody className="py-4 space-y-5">
          {/* Surcharge Sub-Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-[var(--field-radius)] bg-surface-secondary/70 border border-border/60">
              <div className="text-[10px] text-muted uppercase font-bold tracking-wider">Total Fees Paid</div>
              <div className="text-lg sm:text-xl font-extrabold text-orange-400 font-amount mt-0.5">
                ৳ {analyticsData.surcharges.totalSurcharges.toLocaleString()}
              </div>
            </div>

            <div className="p-3 rounded-[var(--field-radius)] bg-surface-secondary/70 border border-border/60">
              <div className="text-[10px] text-muted uppercase font-bold tracking-wider">Pure Utility Spend</div>
              <div className="text-lg sm:text-xl font-extrabold text-foreground font-amount mt-0.5">
                ৳ {analyticsData.surcharges.totalBaseSpend.toLocaleString()}
              </div>
            </div>

            <div className="p-3 rounded-[var(--field-radius)] bg-surface-secondary/70 border border-border/60">
              <div className="text-[10px] text-muted uppercase font-bold tracking-wider">Effective Fee Rate</div>
              <div className="text-lg sm:text-xl font-extrabold text-accent font-amount mt-0.5">
                {analyticsData.surcharges.feeRate}%
              </div>
            </div>

            <div className="p-3 rounded-[var(--field-radius)] bg-surface-secondary/70 border border-border/60">
              <div className="text-[10px] text-muted uppercase font-bold tracking-wider">Avg Fee / Trx</div>
              <div className="text-lg sm:text-xl font-extrabold text-foreground font-amount mt-0.5">
                ৳ {analyticsData.surcharges.avgFeePerTransaction}
              </div>
            </div>
          </div>

          {/* Allocation Ratio Bar & Category Breakdown */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-foreground">
                Pure Energy Spend: <span className="text-emerald-400 font-bold">{analyticsData.surcharges.pureSpendPct}%</span> (৳ {analyticsData.surcharges.totalBaseSpend.toLocaleString()})
              </span>
              <span className="font-semibold text-muted">
                Gateway Surcharges: <span className="text-orange-400 font-bold">{analyticsData.surcharges.feeSpendPct}%</span> (৳ {analyticsData.surcharges.totalSurcharges.toLocaleString()})
              </span>
            </div>

            <div className="w-full h-3 rounded-full bg-orange-500/20 overflow-hidden flex border border-border/60">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500"
                style={{ width: `${analyticsData.surcharges.pureSpendPct}%` }}
              />
              <div
                className="h-full bg-orange-500 transition-all duration-500"
                style={{ width: `${analyticsData.surcharges.feeSpendPct}%` }}
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-1 text-xs">
              <Chip size="sm" variant="flat" className="bg-amber-400/10 text-amber-500 border border-amber-400/20 text-[11px]">
                Electricity: ৳ {analyticsData.surcharges.elecFees.toLocaleString()}
              </Chip>
              <Chip size="sm" variant="flat" className="bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[11px]">
                Gas: ৳ {analyticsData.surcharges.gasFees.toLocaleString()}
              </Chip>
              <Chip size="sm" variant="flat" className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[11px]">
                Other Utilities: ৳ {analyticsData.surcharges.otherFees.toLocaleString()}
              </Chip>
            </div>
          </div>

          {/* Surcharge Trend Bar Chart */}
          <div className="pt-2 border-t border-border/40 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-muted uppercase tracking-wider">
                6-Month Rolling Surcharge Trend (৳)
              </span>
              <span className="text-[11px] text-muted font-mono-code">Recent Monthly Fees</span>
            </div>
            <div className="h-36 w-full relative">
              <canvas ref={surchargeChartRef} />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 3. Spend Efficiency & Burn Rate Intelligence */}
      <Card className="bg-surface border border-border rounded-[var(--radius)] shadow-sm">
        <CardHeader className="flex justify-between items-center pb-2 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-accent/15 text-accent">
              <Gauge size={18} />
            </div>
            <div>
              <h2 className="font-bold text-base text-foreground">
                Utility Spend Efficiency & Burn Rate Telemetry
              </h2>
              <p className="text-xs text-muted">
                Prepaid meter efficiency in days sustained per ৳ 1,000 recharge
              </p>
            </div>
          </div>
          <span className="text-xs text-muted font-mono-code hidden sm:inline">
            Seasonal Intelligence Weighted
          </span>
        </CardHeader>

        <CardBody className="py-4 space-y-5">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-[var(--field-radius)] bg-surface-secondary/70 border border-border/60">
              <div className="text-[10px] text-muted uppercase font-bold tracking-wider">Overall Efficiency</div>
              <div className="text-base sm:text-lg font-bold text-accent font-amount mt-0.5">
                {analyticsData.efficiency.overallDaysPer1k > 0
                  ? formatDaysWithMonths(analyticsData.efficiency.overallDaysPer1k)
                  : 'N/A'}
              </div>
            </div>

            <div className="p-3 rounded-[var(--field-radius)] bg-surface-secondary/70 border border-border/60">
              <div className="text-[10px] text-muted uppercase font-bold tracking-wider">Daily Burn Rate</div>
              <div className="text-base sm:text-lg font-bold text-foreground font-amount mt-0.5">
                {analyticsData.efficiency.overallDailyBurn > 0
                  ? `৳ ${analyticsData.efficiency.overallDailyBurn} / day`
                  : 'N/A'}
              </div>
            </div>

            <div className="p-3 rounded-[var(--field-radius)] bg-surface-secondary/70 border border-border/60">
              <div className="text-[10px] text-muted uppercase font-bold tracking-wider">Best Efficiency</div>
              <div className="text-base sm:text-lg font-bold text-emerald-400 font-amount mt-0.5">
                {analyticsData.efficiency.bestMeter
                  ? formatDaysWithMonths(analyticsData.efficiency.bestMeter.daysPer1k)
                  : '—'}
              </div>
              <div className="text-[10px] text-muted truncate">
                {analyticsData.efficiency.bestMeter?.name || 'Need ≥ 2 cycles'}
              </div>
            </div>

            <div className="p-3 rounded-[var(--field-radius)] bg-surface-secondary/70 border border-border/60">
              <div className="text-[10px] text-muted uppercase font-bold tracking-wider">Monitored Cycles</div>
              <div className="text-base sm:text-lg font-bold text-foreground font-amount mt-0.5">
                {analyticsData.efficiency.totalValidCycles} Cycles
              </div>
            </div>
          </div>

          {/* Efficiency Breakdown List */}
          <div className="space-y-3 pt-2">
            <div className="text-xs font-bold text-muted uppercase tracking-wider">
              Days per ৳ 1,000 Sustained by Utility
            </div>

            {analyticsData.efficiency.efficiencyByBill.length === 0 ? (
              <p className="text-xs text-muted py-4 text-center">
                Recorded payments will automatically compute your Days per ৳ 1,000 burn rate once multiple cycles exist.
              </p>
            ) : (
              <div className="space-y-3">
                {analyticsData.efficiency.efficiencyByBill.map(item => {
                  const maxRate = Math.max(
                    ...analyticsData.efficiency.efficiencyByBill.map(x => x.daysPer1k),
                    1
                  );
                  const pct = Math.min(100, Math.round((item.daysPer1k / maxRate) * 100));
                  const isDesco = item.billId === 'rupnagarDesco' || item.billId === 'uttaraDesco';

                  return (
                    <div
                      key={item.billId}
                      className="p-3 rounded-lg bg-surface-secondary/50 border border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-accent/40 transition-colors"
                    >
                      <div className="sm:w-48 shrink-0 flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">{item.name}</span>
                        {item.isSeasonal && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/15 text-accent font-semibold">
                            {item.seasonName}
                          </span>
                        )}
                      </div>

                      {/* Progress Track */}
                      <div className="flex-1 w-full max-w-md">
                        <Progress
                          value={pct}
                          size="sm"
                          aria-label={`Efficiency for ${item.name}`}
                          classNames={{
                            indicator: 'bg-gradient-to-r from-emerald-400 to-cyan-400'
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 sm:w-44 shrink-0">
                        <div className="text-right">
                          <div className="text-xs font-mono-code font-bold text-emerald-400">
                            {formatDaysWithMonths(item.daysPer1k)}
                          </div>
                          <div className="text-[10px] text-muted">
                            ৳ {item.dailyBurn}/d • {item.cycles}c
                          </div>
                        </div>

                        {isDesco && (
                          <Button
                            size="sm"
                            variant="flat"
                            color="primary"
                            className="h-7 px-2 text-[11px] font-bold"
                            startContent={<Zap size={12} />}
                            onClick={() => openDescoModal(item.billId)}
                          >
                            Live
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* 4. Lifetime & YTD Spend Rankings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lifetime Ranking */}
        <Card className="bg-surface border border-border rounded-[var(--radius)] shadow-sm">
          <CardHeader className="flex justify-between items-center pb-2 border-b border-border/50">
            <div className="flex items-center gap-2">
              <BarChart2 size={18} className="text-accent" />
              <h2 className="font-bold text-base text-foreground">Lifetime Spend Ranking</h2>
            </div>
            <span className="text-xs font-mono-code text-muted">Historical Outlay</span>
          </CardHeader>
          <CardBody className="py-4 space-y-3">
            {analyticsData.rankings.lifetime.map(item => (
              <div key={item.name} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-foreground">{item.shortName}</span>
                  <span className="font-amount font-bold text-accent">
                    ৳ {item.amount.toLocaleString()}
                  </span>
                </div>
                <Progress
                  value={item.percent}
                  size="sm"
                  aria-label={item.name}
                  classNames={{ indicator: 'bg-accent' }}
                />
              </div>
            ))}
          </CardBody>
        </Card>

        {/* YTD Ranking */}
        <Card className="bg-surface border border-border rounded-[var(--radius)] shadow-sm">
          <CardHeader className="flex justify-between items-center pb-2 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-emerald-400" />
              <h2 className="font-bold text-base text-foreground">YTD Spend Ranking ({analyticsData.charts.yoyCumulative.currentYear})</h2>
            </div>
            <span className="text-xs font-mono-code text-muted">Current Year</span>
          </CardHeader>
          <CardBody className="py-4 space-y-3">
            {analyticsData.rankings.ytd.length === 0 ? (
              <p className="text-xs text-muted py-8 text-center">No transactions recorded for the current year.</p>
            ) : (
              analyticsData.rankings.ytd.map(item => (
                <div key={item.name} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-foreground">{item.shortName}</span>
                    <span className="font-amount font-bold text-emerald-400">
                      ৳ {item.amount.toLocaleString()}
                    </span>
                  </div>
                  <Progress
                    value={item.percent}
                    size="sm"
                    aria-label={item.name}
                    classNames={{ indicator: 'bg-emerald-400' }}
                  />
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>

      {/* 5. The 6 Core Chart.js Visualizations Grid */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <PieChart size={20} className="text-accent" />
          <h2 className="text-lg sm:text-xl font-bold text-foreground">
            Multi-Dimensional Visual Analytics
          </h2>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: 12-Month Monthly Spend Area Chart */}
          <Card className="bg-surface border border-border rounded-[var(--radius)] shadow-sm">
            <CardHeader className="flex justify-between items-center pb-2 border-b border-border/50">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <TrendingUp size={16} className="text-cyan-400" />
                12-Month Monthly Spend Area Chart
              </h3>
              <span className="text-[11px] text-muted font-mono-code">Historical Trend</span>
            </CardHeader>
            <CardBody className="py-4">
              <div className="h-64 w-full relative">
                <canvas ref={monthly12ChartRef} />
              </div>
            </CardBody>
          </Card>

          {/* Chart 2: YoY Cumulative Spend Comparison */}
          <Card className="bg-surface border border-border rounded-[var(--radius)] shadow-sm">
            <CardHeader className="flex justify-between items-center pb-2 border-b border-border/50">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <Activity size={16} className="text-emerald-400" />
                YoY Cumulative Spend Comparison
              </h3>
              <span className="text-[11px] text-muted font-mono-code">Previous vs. Current Year</span>
            </CardHeader>
            <CardBody className="py-4">
              <div className="h-64 w-full relative">
                <canvas ref={yoyCumulativeChartRef} />
              </div>
            </CardBody>
          </Card>

          {/* Chart 3: 4D Spending Radar Chart */}
          <Card className="bg-surface border border-border rounded-[var(--radius)] shadow-sm">
            <CardHeader className="flex justify-between items-center pb-2 border-b border-border/50">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <Zap size={16} className="text-purple-400" />
                4-Dimension Spending Radar Chart
              </h3>
              <span className="text-[11px] text-muted font-mono-code">Electricity • Water • Gas • ISP</span>
            </CardHeader>
            <CardBody className="py-4">
              <div className="h-64 w-full relative">
                <canvas ref={radarChartRef} />
              </div>
            </CardBody>
          </Card>

          {/* Chart 4: Quarterly Stacked Bar Chart */}
          <Card className="bg-surface border border-border rounded-[var(--radius)] shadow-sm">
            <CardHeader className="flex justify-between items-center pb-2 border-b border-border/50">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <Calendar size={16} className="text-amber-400" />
                Quarterly Spend Distribution ({analyticsData.charts.yoyCumulative.currentYear})
              </h3>
              <span className="text-[11px] text-muted font-mono-code">Q1–Q4 by Account</span>
            </CardHeader>
            <CardBody className="py-4">
              <div className="h-64 w-full relative">
                <canvas ref={quarterlyChartRef} />
              </div>
            </CardBody>
          </Card>

          {/* Chart 5: Day-of-Month Cash Flow Bubble Chart */}
          <Card className="bg-surface border border-border rounded-[var(--radius)] shadow-sm">
            <CardHeader className="flex justify-between items-center pb-2 border-b border-border/50">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <Activity size={16} className="text-cyan-400" />
                Day-of-Month Cash Flow Bubble Chart
              </h3>
              <span className="text-[11px] text-muted font-mono-code">Billing Cycle Cadence</span>
            </CardHeader>
            <CardBody className="py-4">
              <div className="h-64 w-full relative">
                <canvas ref={bubbleChartRef} />
              </div>
            </CardBody>
          </Card>

          {/* Chart 6: Month-over-Month Inflation % Chart */}
          <Card className="bg-surface border border-border rounded-[var(--radius)] shadow-sm">
            <CardHeader className="flex justify-between items-center pb-2 border-b border-border/50">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <TrendingUp size={16} className="text-rose-400" />
                Month-over-Month Spend Inflation (%)
              </h3>
              <span className="text-[11px] text-muted font-mono-code">Rate of Change</span>
            </CardHeader>
            <CardBody className="py-4">
              <div className="h-64 w-full relative">
                <canvas ref={momInflationChartRef} />
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
