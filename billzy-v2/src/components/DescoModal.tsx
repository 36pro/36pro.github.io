import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Chip,
  Progress
} from '@heroui/react';
import {
  Zap,
  RefreshCw,
  Copy,
  Check,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Calculator,
  Calendar,
  Activity,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import Chart from 'chart.js/auto';
import { useApp } from '../context/AppContext';
import { BILL_DEFINITIONS } from '../core/contracts/utility';
import { calculateLtaTariff } from '../core/services/desco-api';

export const DescoModal: React.FC = () => {
  const {
    isDescoModalOpen,
    selectedDescoBillId,
    closeDescoModal,
    descoMetrics,
    descoLoading,
    refreshDescoTelemetry,
    showToast
  } = useApp();

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const billDef = selectedDescoBillId
    ? BILL_DEFINITIONS[selectedDescoBillId as keyof typeof BILL_DEFINITIONS]
    : null;
  const metrics = selectedDescoBillId ? descoMetrics[selectedDescoBillId] : null;
  const isLoading = selectedDescoBillId ? !!descoLoading[selectedDescoBillId] : false;

  // Clipboard copy state
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Calculator state
  const [calcUnits, setCalcUnits] = useState<number>(150);
  const [calcLoad, setCalcLoad] = useState<number>(2);
  const [showTierDetails, setShowTierDetails] = useState(false);

  // Update calculator initial values when metrics load
  useEffect(() => {
    if (metrics) {
      if (metrics.sanctionLoad) {
        setCalcLoad(metrics.sanctionLoad);
      }
      if (metrics.avgDailyUnits) {
        setCalcUnits(Math.round(metrics.avgDailyUnits * 30));
      }
    }
  }, [metrics]);

  const tariffCalc = useMemo(() => {
    return calculateLtaTariff(calcUnits, calcLoad);
  }, [calcUnits, calcLoad]);

  // Chart Canvas Refs
  const dailyChartRef = useRef<HTMLCanvasElement | null>(null);
  const trendsChartRef = useRef<HTMLCanvasElement | null>(null);
  const yoyChartRef = useRef<HTMLCanvasElement | null>(null);

  // Render Charts
  useEffect(() => {
    if (!isDescoModalOpen || !metrics) return;

    let dailyChart: Chart | null = null;
    let trendsChart: Chart | null = null;
    let yoyChart: Chart | null = null;

    // 1. Daily Chart
    if (dailyChartRef.current && metrics.dailyUsage15.length > 0) {
      const ctx = dailyChartRef.current.getContext('2d');
      if (ctx) {
        dailyChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: metrics.dailyUsage15.map(d => d.date),
            datasets: [
              {
                label: 'Daily Consumption (kWh)',
                data: metrics.dailyUsage15.map(d => d.units),
                backgroundColor: 'rgba(0, 194, 255, 0.65)',
                borderColor: '#00C2FF',
                borderWidth: 1,
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
                  label: ctx => ` ${(ctx.parsed.y ?? 0).toFixed(2)} kWh`
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
                ticks: { color: 'rgba(150, 150, 150, 0.8)', font: { size: 10 } }
              }
            }
          }
        });
      }
    }

    // 2. 12-Month Trends Chart
    if (trendsChartRef.current && metrics.monthlyTrends.labels.length > 0) {
      const ctx = trendsChartRef.current.getContext('2d');
      if (ctx) {
        trendsChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: metrics.monthlyTrends.labels,
            datasets: [
              {
                label: 'Consumed Units (kWh)',
                data: metrics.monthlyTrends.currUnit,
                borderColor: '#00E676',
                backgroundColor: 'rgba(0, 230, 118, 0.1)',
                fill: true,
                tension: 0.3,
                yAxisID: 'y'
              },
              {
                label: 'Bill Amount (৳)',
                data: metrics.monthlyTrends.currTaka,
                borderColor: '#9d4edd',
                backgroundColor: 'rgba(157, 78, 221, 0.1)',
                borderDash: [5, 5],
                tension: 0.3,
                yAxisID: 'y1'
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
              }
            },
            scales: {
              x: {
                grid: { display: false },
                ticks: { color: 'rgba(150, 150, 150, 0.8)', font: { size: 10 } }
              },
              y: {
                type: 'linear',
                display: true,
                position: 'left',
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: '#00E676', font: { size: 10 } }
              },
              y1: {
                type: 'linear',
                display: true,
                position: 'right',
                grid: { drawOnChartArea: false },
                ticks: { color: '#9d4edd', font: { size: 10 } }
              }
            }
          }
        });
      }
    }

    // 3. YoY Comparison Chart
    if (yoyChartRef.current && metrics.monthlyTrends.labels.length > 0) {
      const ctx = yoyChartRef.current.getContext('2d');
      if (ctx) {
        yoyChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: metrics.monthlyTrends.labels,
            datasets: [
              {
                label: 'This Year (৳)',
                data: metrics.monthlyTrends.currTaka,
                backgroundColor: 'rgba(0, 194, 255, 0.8)',
                borderRadius: 4
              },
              {
                label: 'Last Year (৳)',
                data: metrics.monthlyTrends.prevTaka,
                backgroundColor: 'rgba(150, 150, 150, 0.35)',
                borderRadius: 4
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                labels: { color: 'rgba(200, 200, 200, 0.9)', font: { size: 11 } }
              }
            },
            scales: {
              x: {
                grid: { display: false },
                ticks: { color: 'rgba(150, 150, 150, 0.8)', font: { size: 10 } }
              },
              y: {
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: 'rgba(150, 150, 150, 0.8)', font: { size: 10 } }
              }
            }
          }
        });
      }
    }

    return () => {
      dailyChart?.destroy();
      trendsChart?.destroy();
      yoyChart?.destroy();
    };
  }, [isDescoModalOpen, metrics]);

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    showToast(`Token copied: ${token}`, 'success');
    setTimeout(() => {
      setCopiedToken(null);
    }, 3000);
  };

  const handleManualRefresh = () => {
    if (selectedDescoBillId && billDef) {
      refreshDescoTelemetry(selectedDescoBillId, billDef.account);
    }
  };

  if (!isDescoModalOpen || !selectedDescoBillId || !billDef) {
    return null;
  }

  return (
    <Modal
      isOpen={isDescoModalOpen}
      onClose={closeDescoModal}
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
                  <Zap className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-bold truncate">
                    {billDef.name} Live Telemetry
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <span>Account: {billDef.account}</span>
                    <span>•</span>
                    <span>{billDef.location || 'Dhaka'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="flat"
                  color="primary"
                  isIconOnly
                  isLoading={isLoading}
                  onPress={handleManualRefresh}
                  title="Refresh Live Data"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  size="sm"
                  variant="light"
                  as="a"
                  href={billDef.portalUrl || 'https://prepaid.desco.org.bd/'}
                  target="_blank"
                  rel="noreferrer"
                  isIconOnly
                  title="Open DESCO Portal"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </div>
            </ModalHeader>

            <ModalBody>
              {/* Fallback / Loading State */}
              {!metrics && isLoading && (
                <div className="py-16 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 mx-auto text-accent animate-spin" />
                  <p className="text-sm font-medium">Connecting to DESCO prepaid telemetry server...</p>
                  <p className="text-xs text-muted">Fetching live balance, meter reads & recharge logs</p>
                </div>
              )}

              {/* No Metrics & Not Loading State */}
              {!metrics && !isLoading && (
                <div className="p-6 rounded-lg border border-warning/30 bg-warning/5 space-y-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-warning">
                        Could not retrieve real-time DESCO telemetry
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Browser cross-origin restrictions (CORS) or DESCO server downtime may prevent
                        direct API calls in some network environments.
                      </p>
                      <div className="pt-2 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          color="primary"
                          onPress={handleManualRefresh}
                          startContent={<RefreshCw className="w-3.5 h-3.5" />}
                        >
                          Retry Connection
                        </Button>
                        <Button
                          size="sm"
                          variant="flat"
                          as="a"
                          href="https://prepaid.desco.org.bd/customer/#/customer-info"
                          target="_blank"
                          rel="noreferrer"
                          endContent={<ExternalLink className="w-3.5 h-3.5" />}
                        >
                          Open Official DESCO Portal
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Live Telemetry Display */}
              {metrics && (
                <>
                  {/* Metadata Header Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    <div className="p-2.5 rounded-lg bg-surface-raised border border-border/80">
                      <div className="text-[10px] text-muted uppercase font-bold tracking-wider">Owner</div>
                      <div className="text-xs font-bold truncate text-accent mt-0.5">
                        {metrics.ownerName}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-surface-raised border border-border/80">
                      <div className="text-[10px] text-muted uppercase font-bold tracking-wider">Meter No</div>
                      <div className="text-xs font-mono-code font-semibold truncate mt-0.5">
                        {metrics.meterNo}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-surface-raised border border-border/80">
                      <div className="text-[10px] text-muted uppercase font-bold tracking-wider">Tariff</div>
                      <div className="text-xs font-semibold truncate mt-0.5">
                        {metrics.tariff}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-surface-raised border border-border/80">
                      <div className="text-[10px] text-muted uppercase font-bold tracking-wider">Sanction Load</div>
                      <div className="text-xs font-semibold truncate mt-0.5">
                        {metrics.sanctionLoad} kW
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-surface-raised border border-border/80 col-span-2 sm:col-span-1">
                      <div className="text-[10px] text-muted uppercase font-bold tracking-wider">Reading Time</div>
                      <div className="text-xs font-semibold truncate mt-0.5">
                        {metrics.readingTime}
                      </div>
                    </div>
                  </div>

                  {/* Hero Balance & Health Card */}
                  <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-br from-surface-raised via-surface to-surface-raised border border-border/80 relative overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                      {/* Left: Balance & Indicator */}
                      <div className="space-y-2 flex-1">
                        <div className="text-xs font-bold uppercase tracking-wider text-muted">
                          Prepaid Balance Left
                        </div>
                        <div
                          className="text-3xl sm:text-4xl font-extrabold tracking-tight"
                          style={{
                            color: metrics.alertColor,
                            textShadow: `0 0 16px ${metrics.alertColor}33`
                          }}
                        >
                          ৳ {metrics.formattedBalance}
                        </div>

                        {/* Health Progress Bar */}
                        <div className="w-full max-w-sm pt-1">
                          <Progress
                            value={metrics.fillPercent}
                            size="sm"
                            aria-label="Balance health"
                            classNames={{
                              indicator: 'transition-all duration-500',
                              track: 'bg-muted/20'
                            }}
                            color={
                              metrics.daysRemaining <= 3 || metrics.isLowBalance
                                ? 'danger'
                                : metrics.daysRemaining <= 7
                                ? 'warning'
                                : 'success'
                            }
                          />
                        </div>

                        {/* Alert Status Pill */}
                        <div
                          className="flex items-center gap-1.5 text-xs font-bold pt-1"
                          style={{ color: metrics.alertColor }}
                        >
                          <span
                            className="w-2 h-2 rounded-full inline-block animate-pulse"
                            style={{
                              backgroundColor: metrics.alertColor,
                              boxShadow: `0 0 8px ${metrics.alertColor}`
                            }}
                          />
                          <span>{metrics.alertText}</span>
                        </div>
                      </div>

                      {/* Right: Quick Stat Cards */}
                      <div className="grid grid-cols-3 gap-2 shrink-0 md:w-auto w-full">
                        <div className="p-3 rounded-lg bg-surface/80 border border-border/60 text-center">
                          <div className="text-[10px] text-muted font-bold flex items-center justify-center gap-1">
                            <span>Avg Daily</span>
                            <span className="text-[9px] px-1 py-0.2 rounded bg-accent/15 text-accent font-semibold">
                              {metrics.seasonName}
                            </span>
                          </div>
                          <div className="text-sm font-extrabold text-foreground mt-1">
                            {metrics.avgDailyUnits} <span className="text-[10px] font-normal text-muted">kWh</span>
                          </div>
                        </div>

                        <div className="p-3 rounded-lg bg-surface/80 border border-border/60 text-center">
                          <div className="text-[10px] text-muted font-bold flex items-center justify-center gap-1">
                            <span>Daily Burn</span>
                            <span className="text-[9px] px-1 py-0.2 rounded bg-success/15 text-success font-semibold">
                              {metrics.seasonName}
                            </span>
                          </div>
                          <div className="text-sm font-extrabold text-foreground mt-1">
                            ৳ {metrics.avgDailyCost} <span className="text-[10px] font-normal text-muted">/day</span>
                          </div>
                        </div>

                        <div className="p-3 rounded-lg bg-surface/80 border border-border/60 text-center">
                          <div className="text-[10px] text-muted font-bold">Est. Disconnect</div>
                          <div
                            className="text-xs font-extrabold mt-1"
                            style={{ color: metrics.alertColor }}
                          >
                            {metrics.exhaustionDateStr}
                          </div>
                          <div className="text-[10px] text-muted">
                            (~{metrics.daysRemaining} days left)
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Charts Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Last 15 Days Consumption Chart */}
                    <div className="p-4 rounded-xl bg-surface-raised border border-border/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-accent" />
                          Last 15 Days Daily Consumption (kWh)
                        </h4>
                        <span className="text-[11px] text-muted font-mono-code">Meter Reads</span>
                      </div>
                      <div className="h-48 w-full relative">
                        <canvas ref={dailyChartRef} />
                      </div>
                    </div>

                    {/* 12-Month Consumption & Cost Trends */}
                    <div className="p-4 rounded-xl bg-surface-raised border border-border/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-success" />
                          12-Month Consumption & Bill Trends
                        </h4>
                        <span className="text-[11px] text-muted font-mono-code">Historical</span>
                      </div>
                      <div className="h-48 w-full relative">
                        <canvas ref={trendsChartRef} />
                      </div>
                    </div>

                    {/* Year-over-Year Cost Comparison */}
                    <div className="p-4 rounded-xl bg-surface-raised border border-border/80 space-y-3 lg:col-span-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-warning" />
                          Year-Over-Year Monthly Spend Comparison (৳)
                        </h4>
                        <span className="text-[11px] text-muted font-mono-code">Current vs. Prior Year</span>
                      </div>
                      <div className="h-48 w-full relative">
                        <canvas ref={yoyChartRef} />
                      </div>
                    </div>
                  </div>

                  {/* Recharge Token History (Last 10 Logs) */}
                  <div className="p-4 rounded-xl bg-surface-raised border border-border/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                        Recharge Token History (Last 10 Logs)
                      </h4>
                      <span className="text-[11px] text-muted">180-Day Window</span>
                    </div>

                    {metrics.lastRecharges.length === 0 ? (
                      <p className="text-xs text-muted py-4 text-center">
                        No recharge transactions recorded in the last 180 days.
                      </p>
                    ) : (
                      <div className="overflow-x-auto rounded-lg border border-border/60">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-surface/90 text-[11px] text-muted font-bold border-b border-border/60 uppercase">
                            <tr>
                              <th className="py-2 px-3">Date</th>
                              <th className="py-2 px-3">Total Paid</th>
                              <th className="py-2 px-3">Energy</th>
                              <th className="py-2 px-3">VAT</th>
                              <th className="py-2 px-3 text-right">20-Digit Token</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/40 font-mono-code">
                            {metrics.lastRecharges.map((r, idx) => {
                              const rDate = r.rechargeDate ? r.rechargeDate.split(' ')[0] : '-';
                              const rawToken = r.tokenNo ? r.tokenNo.trim() : '';
                              const shortToken =
                                rawToken.length > 9
                                  ? `${rawToken.slice(0, 4)}…${rawToken.slice(-4)}`
                                  : rawToken || '-';
                              const isThisCopied = copiedToken === rawToken;

                              return (
                                <tr key={idx} className="hover:bg-surface/50 transition-colors">
                                  <td className="py-2 px-3 whitespace-nowrap text-foreground">{rDate}</td>
                                  <td className="py-2 px-3 whitespace-nowrap font-bold text-success">
                                    ৳ {Math.round(r.totalAmount || 0).toLocaleString()}
                                  </td>
                                  <td className="py-2 px-3 whitespace-nowrap text-muted">
                                    ৳ {Math.round(r.energyAmount || 0).toLocaleString()}
                                  </td>
                                  <td className="py-2 px-3 whitespace-nowrap text-muted">
                                    ৳ {Math.round(r.VAT || 0).toLocaleString()}
                                  </td>
                                  <td className="py-2 px-3 whitespace-nowrap text-right">
                                    {rawToken ? (
                                      <div className="inline-flex items-center gap-1.5 justify-end">
                                        <span className="font-semibold text-accent" title={rawToken}>
                                          {shortToken}
                                        </span>
                                        <Button
                                          size="sm"
                                          variant="flat"
                                          isIconOnly
                                          className="h-6 w-6 min-w-6 text-[10px]"
                                          color={isThisCopied ? 'success' : 'default'}
                                          onPress={() => handleCopyToken(rawToken)}
                                          title={`Copy full token: ${rawToken}`}
                                        >
                                          {isThisCopied ? (
                                            <Check className="w-3 h-3 text-success" />
                                          ) : (
                                            <Copy className="w-3 h-3" />
                                          )}
                                        </Button>
                                      </div>
                                    ) : (
                                      <span className="text-muted">-</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Interactive LT-A Residential Bill Calculator */}
                  <div className="p-4 rounded-xl bg-surface-raised border border-border/80 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-accent/20 text-accent flex items-center justify-center">
                          <Calculator className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
                            Interactive LT-A Residential Bill Calculator
                          </h4>
                          <p className="text-[11px] text-muted">
                            Dhaka 6-Step Tiered Residential Tariff Engine
                          </p>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="light"
                        onPress={() => setShowTierDetails(!showTierDetails)}
                        endContent={showTierDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        className="text-xs text-muted"
                      >
                        {showTierDetails ? 'Hide Rates' : 'View Rates'}
                      </Button>
                    </div>

                    {/* Expandable Tariff Rates */}
                    {showTierDetails && (
                      <div className="p-3 rounded-lg bg-surface/70 border border-border/60 text-xs space-y-2 text-muted">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          <div>Lifeline (0-50 units): <strong className="text-foreground">৳ 5.32</strong></div>
                          <div>Step 1 (0-75 units): <strong className="text-foreground">৳ 6.18</strong></div>
                          <div>Step 2 (76-200 units): <strong className="text-foreground">৳ 8.50</strong></div>
                          <div>Step 3 (201-300 units): <strong className="text-foreground">৳ 9.10</strong></div>
                          <div>Step 4 (301-400 units): <strong className="text-foreground">৳ 9.62</strong></div>
                          <div>Step 5 (401-600 units): <strong className="text-foreground">৳ 15.01</strong></div>
                          <div className="col-span-2 sm:col-span-3">
                            Step 6 (Above 600 units): <strong className="text-foreground">৳ 17.35</strong>
                          </div>
                        </div>
                        <div className="border-t border-border/40 pt-1.5 text-[11px] text-muted/80">
                          Demand Charge: ৳42/kW/mo • Meter Rent: ৳40/mo • Government VAT: 5%
                        </div>
                      </div>
                    )}

                    {/* Calculator Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        type="number"
                        label="Monthly Units (kWh)"
                        value={String(calcUnits)}
                        onChange={e => setCalcUnits(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        min={0}
                        max={5000}
                        size="sm"
                      />
                      <Input
                        type="number"
                        label="Sanction Load (kW)"
                        value={String(calcLoad)}
                        onChange={e => setCalcLoad(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        min={1}
                        max={50}
                        size="sm"
                      />
                    </div>

                    {/* Calculation Breakdown */}
                    <div className="p-3.5 rounded-lg bg-surface/90 border border-border/80 space-y-2 text-xs">
                      <div className="flex justify-between items-center text-muted">
                        <span>Energy Charges ({calcUnits} units)</span>
                        <span className="font-semibold text-foreground">৳ {tariffCalc.energyCost.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-muted">
                        <span>Demand Charge ({calcLoad} kW × ৳42)</span>
                        <span className="font-semibold text-foreground">৳ {tariffCalc.demandCharge.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-muted">
                        <span>Meter Rent</span>
                        <span className="font-semibold text-foreground">৳ {tariffCalc.meterRent}</span>
                      </div>
                      <div className="flex justify-between items-center text-muted">
                        <span>Government VAT (5%)</span>
                        <span className="font-semibold text-foreground">৳ {tariffCalc.vat.toLocaleString()}</span>
                      </div>
                      <div className="border-t border-border/60 pt-2 flex justify-between items-center text-sm font-bold">
                        <span>Estimated Total Bill</span>
                        <span className="text-accent text-base">৳ {tariffCalc.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </ModalBody>

            <ModalFooter className="flex items-center justify-between">
              <span className="text-[11px] text-muted">
                Official DESCO Prepaid Telemetry Engine
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
