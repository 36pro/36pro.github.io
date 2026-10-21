import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Chip
} from '@heroui/react';
import {
  Activity,
  TrendingUp,
  Calendar,
  Clock,
  BarChart2,
  ExternalLink,
  ShieldCheck,
  Zap,
  Flame,
  Droplets,
  Wifi,
  Dumbbell,
  FileText
} from 'lucide-react';
import Chart from 'chart.js/auto';
import { useApp } from '../context/AppContext';
import { BILL_DEFINITIONS } from '../core/contracts/utility';
import {
  UNIQUE_CHART_REGISTRY,
  computeForecastGauge,
  computeRateTrend,
  computeMonthlyTotal,
  computeBillLag,
  computeAmountVsDuration,
  formatDaysWithMonths
} from '../core/domain/unique-stats';

const UTILITY_ICONS: Record<string, React.ReactNode> = {
  electric: <Zap size={18} className="text-amber-400" />,
  gas: <Flame size={18} className="text-orange-400" />,
  water: <Droplets size={18} className="text-cyan-400" />,
  internet: <Wifi size={18} className="text-purple-400" />,
  gym: <Dumbbell size={18} className="text-emerald-400" />,
  tax: <FileText size={18} className="text-rose-400" />
};

export const UniqueStatsModal: React.FC = () => {
  const {
    isUniqueStatsOpen,
    selectedUniqueStatsBillId,
    closeUniqueStats,
    payments
  } = useApp();

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const billDef = selectedUniqueStatsBillId
    ? BILL_DEFINITIONS[selectedUniqueStatsBillId as keyof typeof BILL_DEFINITIONS]
    : null;

  // Filter payments for this bill
  const billPayments = useMemo(() => {
    if (!selectedUniqueStatsBillId) return [];
    return payments.filter(p => p.billId === selectedUniqueStatsBillId);
  }, [payments, selectedUniqueStatsBillId]);

  // Determine applicable charts
  const applicableCharts = useMemo(() => {
    if (!billDef) return [];
    const billType = billDef.type.toLowerCase() as 'prepaid' | 'postpaid';
    return UNIQUE_CHART_REGISTRY.filter(
      chart => chart.appliesTo.includes(billType) && billPayments.length >= chart.minPayments
    );
  }, [billDef, billPayments]);

  // Canvas Refs
  const forecastCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rateTrendCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const monthlyTotalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const billLagCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const amountVsDurationCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Rate trend slope calculation
  const rateTrendData = useMemo(() => {
    if (billPayments.length < 3) return null;
    return computeRateTrend(billPayments);
  }, [billPayments]);

  // Render Charts
  useEffect(() => {
    if (!isUniqueStatsOpen || !billDef || billPayments.length === 0) return;

    const chartInstances: Chart[] = [];

    // 1. Forecast Gauge
    if (forecastCanvasRef.current && billPayments.length >= 2) {
      const gaugeData = computeForecastGauge(billPayments);
      if (gaugeData) {
        const ctx = forecastCanvasRef.current.getContext('2d');
        if (ctx) {
          const c = new Chart(ctx, {
            type: 'doughnut',
            data: {
              datasets: [
                {
                  data: [gaugeData.pctElapsed * 100, (1 - gaugeData.pctElapsed) * 100],
                  backgroundColor: [gaugeData.color, 'rgba(255, 255, 255, 0.08)'],
                  borderWidth: 0
                }
              ]
            },
            options: {
              cutout: '78%',
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
              }
            },
            plugins: [
              {
                id: 'gaugeCenterText',
                afterDraw: chart => {
                  const {
                    ctx: cCtx,
                    chartArea: { top, left, width, height }
                  } = chart;
                  cCtx.save();
                  cCtx.textAlign = 'center';
                  cCtx.textBaseline = 'middle';

                  cCtx.font = 'bold 18px "JetBrains Mono", sans-serif';
                  cCtx.fillStyle = gaugeData.color;
                  const line1 =
                    gaugeData.daysLeft < 0
                      ? `Overdue by ${Math.abs(gaugeData.daysLeft)}d`
                      : `~${gaugeData.daysLeft} days left`;
                  cCtx.fillText(line1, left + width / 2, top + height / 2 - 10);

                  cCtx.font = 'bold 12px "JetBrains Mono", sans-serif';
                  cCtx.fillStyle = 'rgba(150, 150, 150, 0.9)';
                  const line2 = `Est. ${gaugeData.estExhaustionDateStr}`;
                  cCtx.fillText(line2, left + width / 2, top + height / 2 + 14);

                  cCtx.restore();
                }
              }
            ]
          });
          chartInstances.push(c);
        }
      }
    }

    // 2. Usage Rate Trend
    if (rateTrendCanvasRef.current && billPayments.length >= 3 && rateTrendData) {
      const ctx = rateTrendCanvasRef.current.getContext('2d');
      if (ctx) {
        const c = new Chart(ctx, {
          type: 'line',
          data: {
            labels: rateTrendData.labels,
            datasets: [
              {
                label: 'Days Per 1,000',
                data: rateTrendData.values,
                borderColor: '#a78bfa',
                backgroundColor: 'rgba(167, 139, 250, 0.1)',
                fill: true,
                tension: 0.3,
                borderWidth: 2,
                spanGaps: true,
                pointBackgroundColor: '#a78bfa',
                pointRadius: 4
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: { padding: { top: 16 } },
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: ctx => ` ${ctx.parsed.y} days / 1k`
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
                  callback: val => `${val}d`
                }
              }
            }
          }
        });
        chartInstances.push(c);
      }
    }

    // 3. Monthly Total Line
    if (monthlyTotalCanvasRef.current && billPayments.length >= 1) {
      const totalData = computeMonthlyTotal(billPayments);
      const ctx = monthlyTotalCanvasRef.current.getContext('2d');
      if (ctx) {
        const c = new Chart(ctx, {
          type: 'line',
          data: {
            labels: totalData.labels,
            datasets: [
              {
                label: 'Monthly Total',
                data: totalData.values,
                borderColor: '#2dd4bf',
                backgroundColor: 'rgba(45, 212, 191, 0.1)',
                fill: true,
                tension: 0.3,
                borderWidth: 2,
                pointBackgroundColor: '#2dd4bf',
                pointRadius: 4
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: { padding: { top: 16 } },
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
                grid: { display: false },
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
        chartInstances.push(c);
      }
    }

    // 4. Bill Lag Bar Chart
    if (billLagCanvasRef.current && billPayments.length >= 1) {
      const lagData = computeBillLag(billPayments);
      const ctx = billLagCanvasRef.current.getContext('2d');
      if (ctx) {
        const c = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: lagData.labels,
            datasets: [
              {
                label: 'Payment Lag (Days)',
                data: lagData.lags,
                backgroundColor: lagData.colors,
                borderRadius: 4
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: { padding: { top: 16 } },
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: ctx => ` Lag: ${(ctx.parsed.y ?? 0) > 0 ? '+' : ''}${ctx.parsed.y ?? 0} days`
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
                  callback: val => `${val}d`
                }
              }
            }
          }
        });
        chartInstances.push(c);
      }
    }

    // 5. Amount vs Duration Combo Chart
    if (amountVsDurationCanvasRef.current && billPayments.length >= 2) {
      const comboData = computeAmountVsDuration(billPayments);
      const ctx = amountVsDurationCanvasRef.current.getContext('2d');
      if (ctx) {
        const c = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: comboData.labels,
            datasets: [
              {
                type: 'bar',
                label: 'Amount Paid (৳)',
                data: comboData.amounts,
                backgroundColor: 'rgba(129, 140, 248, 0.8)',
                yAxisID: 'yAmount',
                borderRadius: 4
              },
              {
                type: 'line',
                label: 'Duration (Days)',
                data: comboData.durations,
                borderColor: '#00E676',
                borderWidth: 2,
                fill: false,
                tension: 0.2,
                spanGaps: true,
                pointBackgroundColor: '#00E676',
                pointRadius: 4,
                yAxisID: 'yDuration'
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            layout: { padding: { top: 16 } },
            plugins: {
              legend: {
                labels: { color: 'rgba(200, 200, 200, 0.9)', font: { size: 11 } }
              },
              tooltip: {
                callbacks: {
                  label: ctx => {
                    if (ctx.dataset.yAxisID === 'yAmount') {
                      return ` Amount: ৳ ${Math.round(ctx.parsed.y ?? 0).toLocaleString()}`;
                    }
                    return ` Duration: ${ctx.parsed.y} days`;
                  }
                }
              }
            },
            scales: {
              x: {
                grid: { display: false },
                ticks: { color: 'rgba(150, 150, 150, 0.8)', font: { size: 10 } }
              },
              yAmount: {
                type: 'linear',
                position: 'left',
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: {
                  color: '#818cf8',
                  font: { size: 10 },
                  callback: val => `৳${Number(val).toLocaleString()}`
                }
              },
              yDuration: {
                type: 'linear',
                position: 'right',
                grid: { display: false },
                ticks: {
                  color: '#00E676',
                  font: { size: 10 },
                  callback: val => `${val}d`
                }
              }
            }
          }
        });
        chartInstances.push(c);
      }
    }

    return () => {
      chartInstances.forEach(c => c.destroy());
    };
  }, [isUniqueStatsOpen, billDef, billPayments, rateTrendData]);

  if (!isUniqueStatsOpen || !billDef) {
    return null;
  }

  return (
    <Modal
      isOpen={isUniqueStatsOpen}
      onClose={closeUniqueStats}
      placement={isMobile ? 'bottom' : 'center'}
      scrollBehavior="inside"
      size="4xl"
      classNames={{
        base: 'bg-surface border border-border max-h-[92vh] text-foreground',
        header: 'border-b border-border/60 py-3.5 px-6 bg-surface/90 backdrop-blur-md',
        body: 'p-4 sm:p-6 space-y-6',
        footer: 'border-t border-border/60 py-3 px-6 bg-surface/80'
      }}
    >
      <ModalContent>
        {onClose => (
          <>
            <ModalHeader className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center shrink-0">
                  {UTILITY_ICONS[billDef.utility] || <BarChart2 size={16} />}
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-bold truncate">
                    {billDef.name} Historical Analytics
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <span>Account: {billDef.account}</span>
                    <span>•</span>
                    <span className="capitalize">{billDef.type} Utility</span>
                    {billDef.location && (
                      <>
                        <span>•</span>
                        <span>{billDef.location}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {billDef.portalUrl && (
                  <Button
                    size="sm"
                    variant="light"
                    as="a"
                    href={billDef.portalUrl}
                    target="_blank"
                    rel="noreferrer"
                    endContent={<ExternalLink size={13} />}
                    className="text-xs text-accent"
                  >
                    Portal
                  </Button>
                )}
              </div>
            </ModalHeader>

            <ModalBody>
              {applicableCharts.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <BarChart2 className="w-10 h-10 mx-auto text-muted" />
                  <p className="text-sm font-semibold text-foreground">
                    Not enough payment history yet
                  </p>
                  <p className="text-xs text-muted max-w-sm mx-auto">
                    Add another payment record to automatically compute forecast gauges, burn rates, and timeline trends for {billDef.name}.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Chart 1: Next Recharge Forecast Gauge */}
                  {applicableCharts.some(c => c.id === 'forecastGauge') && (
                    <div className="p-4 rounded-xl bg-surface-raised border border-border/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-warning" />
                          Next Recharge Forecast
                        </h4>
                        <span className="text-[11px] text-muted font-mono-code">Prepaid Sustained Cycle</span>
                      </div>
                      <div className="h-56 w-full relative">
                        <canvas ref={forecastCanvasRef} />
                      </div>
                    </div>
                  )}

                  {/* Chart 2: Usage Rate Trend */}
                  {applicableCharts.some(c => c.id === 'rateTrend') && (
                    <div className="p-4 rounded-xl bg-surface-raised border border-border/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                          Usage Rate Trend
                        </h4>
                        {rateTrendData && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                              rateTrendData.slopeStatus === 'improving'
                                ? 'bg-teal-500/15 text-teal-400'
                                : 'bg-rose-500/15 text-rose-400'
                            }`}
                          >
                            {rateTrendData.slopeStatus === 'improving' ? '↑ Improving' : '↓ Declining'}
                          </span>
                        )}
                      </div>
                      <div className="h-56 w-full relative">
                        <canvas ref={rateTrendCanvasRef} />
                      </div>
                    </div>
                  )}

                  {/* Chart 3: Monthly Total */}
                  {applicableCharts.some(c => c.id === 'monthlyTotal') && (
                    <div className="p-4 rounded-xl bg-surface-raised border border-border/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-teal-400" />
                          Monthly Total (12 Months Timeline)
                        </h4>
                        <span className="text-[11px] text-muted font-mono-code">Spend History</span>
                      </div>
                      <div className="h-56 w-full relative">
                        <canvas ref={monthlyTotalCanvasRef} />
                      </div>
                    </div>
                  )}

                  {/* Chart 4: Bill Lag */}
                  {applicableCharts.some(c => c.id === 'billLag') && (
                    <div className="p-4 rounded-xl bg-surface-raised border border-border/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-rose-400" />
                          Bill Month vs. Pay Date Lag
                        </h4>
                        <span className="text-[11px] text-muted font-mono-code">Payment Timeliness</span>
                      </div>
                      <div className="h-56 w-full relative">
                        <canvas ref={billLagCanvasRef} />
                      </div>
                      <p className="text-[10px] text-muted italic">
                        * Lag estimated from bill month, not an actual due date.
                      </p>
                    </div>
                  )}

                  {/* Chart 5: Amount vs Duration */}
                  {applicableCharts.some(c => c.id === 'amountVsDuration') && (
                    <div className="p-4 rounded-xl bg-surface-raised border border-border/80 space-y-3 md:col-span-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                          <BarChart2 className="w-3.5 h-3.5 text-indigo-400" />
                          Amount vs. Duration (Combo Chart)
                        </h4>
                        <span className="text-[11px] text-muted font-mono-code">Dual-Axis Analysis</span>
                      </div>
                      <div className="h-60 w-full relative">
                        <canvas ref={amountVsDurationCanvasRef} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ModalBody>

            <ModalFooter className="flex items-center justify-between">
              <span className="text-[11px] text-muted">
                {billPayments.length} Payment{billPayments.length !== 1 ? 's' : ''} on record
              </span>
              <Button size="sm" variant="flat" onPress={onClose}>
                Close
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
