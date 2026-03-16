import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  TrendingUp,
  Calendar,
  DollarSign,
  Users,
  AlertTriangle,
  Clock,
  Target,
  Loader2,
  AlertCircle,
  Download,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { insightsEngine, RawData } from '../../services/insights-engine';
import { ProjectSummary } from '../../services/dashboard-api';

// ============================================================================
// Types
// ============================================================================

interface ProjectForecast {
  id: string;
  name: string;
  code: string;
  status: string;
  endDate: Date | null;
  daysRemaining: number;
  budgetUsed: number;   // percentage
  hoursUsed: number;    // percentage
  burnRate: number;     // hours per day
  estimatedCompletion: Date | null;
  onTrack: boolean;
  risk: 'low' | 'medium' | 'high';
  contractValue: number;
  spentHours: number;
  plannedHours: number;
}

interface MonthlyForecast {
  month: string;
  actual: number;
  forecast: number;
  capacity: number;
}

interface BudgetForecast {
  month: string;
  revenue: number;
  cost: number;
  projected: number;
}

// ============================================================================
// Helpers
// ============================================================================

function parseHours(value?: string): number {
  return parseFloat(value || '0') || 0;
}

function parseMoney(value?: string): number {
  return parseFloat(value || '0') || 0;
}

function parseProjectDate(dateStr?: string): Date | null {
  if (!dateStr) return null;
  // Try DD/MM/YYYY
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    if (!isNaN(d.getTime())) return d;
  }
  // Try ISO
  const iso = new Date(dateStr);
  return isNaN(iso.getTime()) ? null : iso;
}

function daysUntil(date: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function daysBetween(start: Date, end: Date): number {
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
}

// ============================================================================
// Computation
// ============================================================================

function computeForecasts(rawData: RawData): {
  projects: ProjectForecast[];
  capacityForecast: MonthlyForecast[];
  budgetForecast: BudgetForecast[];
  summary: {
    totalProjects: number;
    onTrack: number;
    atRisk: number;
    overdue: number;
    totalBudget: number;
    totalSpent: number;
    avgCompletion: number;
  };
} {
  const { projects, users, timesheets, invoices } = rawData;
  const now = new Date();

  // Project forecasts
  const projectForecasts: ProjectForecast[] = projects.map(p => {
    const startDate = parseProjectDate(p.startDate);
    const endDate = parseProjectDate(p.endDate);
    const spent = parseHours(p.spentHours);
    const planned = parseHours(p.plannedHours);
    const contractValue = parseMoney(p.contractValue);
    const remaining = daysRemaining(endDate);
    const hoursUsed = planned > 0 ? Math.round((spent / planned) * 100) : 0;
    const budgetUsed = hoursUsed; // simplify: budget tracks hours

    // Burn rate: hours spent per elapsed day
    let burnRate = 0;
    if (startDate) {
      const elapsed = daysBetween(startDate, now);
      burnRate = elapsed > 0 ? spent / elapsed : 0;
    }

    // Estimated completion based on burn rate
    let estimatedCompletion: Date | null = null;
    if (burnRate > 0 && planned > spent) {
      const daysToComplete = (planned - spent) / burnRate;
      estimatedCompletion = new Date(now.getTime() + daysToComplete * 24 * 60 * 60 * 1000);
    } else if (spent >= planned) {
      estimatedCompletion = now; // already complete
    }

    const isOverdue = endDate ? now > endDate : false;
    const willBeOverdue = estimatedCompletion && endDate ? estimatedCompletion > endDate : false;

    let risk: 'low' | 'medium' | 'high' = 'low';
    if (isOverdue || hoursUsed > 110) risk = 'high';
    else if (willBeOverdue || hoursUsed > 90) risk = 'medium';

    const statusNames: Record<number, string> = { 0: 'Draft', 1: 'Active', 2: 'On Hold', 3: 'Cancelled', 4: 'Completed' };
    const statusNum = p.status ?? 1;

    return {
      id: p.id,
      name: p.name,
      code: p.code,
      status: statusNames[statusNum] || 'Active',
      endDate,
      daysRemaining: remaining,
      budgetUsed,
      hoursUsed,
      burnRate: Math.round(burnRate * 10) / 10,
      estimatedCompletion,
      onTrack: !willBeOverdue && !isOverdue,
      risk,
      contractValue,
      spentHours: Math.round(spent),
      plannedHours: Math.round(planned),
    };
  });

  // Capacity forecast: project monthly hours into the future
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const capacity = users.length * 160;

  // Historical monthly hours from timesheets
  const monthlyActual: Record<string, number> = {};
  for (const ts of timesheets) {
    const parts = (ts.date || '').split('/');
    if (parts.length === 3) {
      const key = `${parts[2]}-${parts[1].padStart(2, '0')}`;
      monthlyActual[key] = (monthlyActual[key] || 0) + parseHours(ts.hours);
    }
  }

  // Last 6 months actual + 6 months forecast
  const capacityForecast: MonthlyForecast[] = [];
  const avgMonthlyHours = Object.values(monthlyActual).length > 0
    ? Object.values(monthlyActual).reduce((s, v) => s + v, 0) / Object.values(monthlyActual).length
    : capacity * 0.75;

  for (let i = -5; i <= 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const isFuture = i > 0;
    const actual = monthlyActual[key] || 0;

    capacityForecast.push({
      month: `${monthNames[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
      actual: isFuture ? 0 : Math.round(actual),
      forecast: isFuture ? Math.round(avgMonthlyHours * (1 + (i * 0.02))) : 0,
      capacity: Math.round(capacity),
    });
  }

  // Budget forecast: revenue vs cost projection
  const monthlyRevenue: Record<string, number> = {};
  for (const inv of invoices) {
    const parts = (inv.date || '').split('/');
    if (parts.length === 3) {
      const key = `${parts[2]}-${parts[1].padStart(2, '0')}`;
      monthlyRevenue[key] = (monthlyRevenue[key] || 0) + parseMoney(inv.total);
    }
  }

  const avgRevenue = Object.values(monthlyRevenue).length > 0
    ? Object.values(monthlyRevenue).reduce((s, v) => s + v, 0) / Object.values(monthlyRevenue).length
    : 0;

  const budgetForecast: BudgetForecast[] = [];
  for (let i = -5; i <= 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const isFuture = i > 0;
    const rev = monthlyRevenue[key] || 0;
    const cost = (monthlyActual[key] || 0) * 50; // rough cost/hour estimate

    budgetForecast.push({
      month: `${monthNames[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
      revenue: isFuture ? 0 : Math.round(rev),
      cost: isFuture ? 0 : Math.round(cost),
      projected: isFuture ? Math.round(avgRevenue * (1 + (i * 0.01))) : 0,
    });
  }

  // Summary
  const activeProjects = projectForecasts.filter(p => p.status === 'Active');
  const totalBudget = projects.reduce((s, p) => s + parseMoney(p.contractValue), 0);
  const totalSpent = projects.reduce((s, p) => s + parseHours(p.spentHours), 0);
  const totalPlanned = projects.reduce((s, p) => s + parseHours(p.plannedHours), 0);

  return {
    projects: projectForecasts,
    capacityForecast,
    budgetForecast,
    summary: {
      totalProjects: activeProjects.length,
      onTrack: activeProjects.filter(p => p.risk === 'low').length,
      atRisk: activeProjects.filter(p => p.risk === 'medium').length,
      overdue: activeProjects.filter(p => p.risk === 'high').length,
      totalBudget: Math.round(totalBudget),
      totalSpent: Math.round(totalSpent),
      avgCompletion: totalPlanned > 0 ? Math.round((totalSpent / totalPlanned) * 100) : 0,
    },
  };
}

function daysRemaining(endDate: Date | null): number {
  if (!endDate) return 0;
  return daysUntil(endDate);
}

// ============================================================================
// Component
// ============================================================================

type ViewMode = 'projects' | 'capacity' | 'budget';

const RISK_CONFIG = {
  low: { label: 'On Track', color: '#10B981', bg: '#ECFDF5' },
  medium: { label: 'At Risk', color: '#F59E0B', bg: '#FEF3C7' },
  high: { label: 'Critical', color: '#DC2626', bg: '#FEE2E2' },
};

const ForecastingView = React.memo(function ForecastingView() {
  const [rawData, setRawData] = useState<RawData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('projects');
  const [riskFilter, setRiskFilter] = useState<string>('all');

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    insightsEngine.fetchForForecasting().then(data => {
      if (!cancelled) { setRawData(data); setIsLoading(false); }
    }).catch(err => {
      if (!cancelled) { setError(err instanceof Error ? err.message : 'Failed to load data'); setIsLoading(false); }
    });
    return () => { cancelled = true; };
  }, []);

  const forecastData = useMemo(() => rawData ? computeForecasts(rawData) : null, [rawData]);

  const filteredProjects = useMemo(() => {
    if (!forecastData) return [];
    let list = forecastData.projects.filter(p => p.status === 'Active');
    if (riskFilter !== 'all') list = list.filter(p => p.risk === riskFilter);
    return list.sort((a, b) => {
      const riskOrder = { high: 0, medium: 1, low: 2 };
      return (riskOrder[a.risk] ?? 2) - (riskOrder[b.risk] ?? 2);
    });
  }, [forecastData, riskFilter]);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  const handleRiskFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setRiskFilter(e.target.value);
  }, []);

  // Summary cards data
  const summaryCards = useMemo(() => {
    if (!forecastData) return [];
    const s = forecastData.summary;
    return [
      { label: 'Active Projects', value: String(s.totalProjects), icon: Target, color: '#0066FF', sub: `${s.avgCompletion}% avg completion` },
      { label: 'On Track', value: String(s.onTrack), icon: TrendingUp, color: '#10B981', sub: 'Within plan' },
      { label: 'At Risk', value: String(s.atRisk), icon: AlertTriangle, color: '#F59E0B', sub: 'May miss deadline' },
      { label: 'Critical', value: String(s.overdue), icon: AlertCircle, color: '#DC2626', sub: 'Over budget/deadline' },
    ];
  }, [forecastData]);

  // View mode tabs data
  const viewModeTabs = useMemo(() => [
    { key: 'projects' as ViewMode, label: 'Project Forecasts', icon: Target },
    { key: 'capacity' as ViewMode, label: 'Capacity Planning', icon: Users },
    { key: 'budget' as ViewMode, label: 'Budget Projections', icon: DollarSign },
  ], []);

  // Capacity insight cards
  const capacityInsights = useMemo(() => {
    if (!forecastData || !rawData) return [];
    const actualMonths = forecastData.capacityForecast.filter(m => m.actual > 0);
    const avgMonthly = actualMonths.length > 0
      ? Math.round(actualMonths.reduce((s, m) => s + m.actual, 0) / actualMonths.length)
      : 0;
    const futureMonths = forecastData.capacityForecast.filter(m => m.forecast > 0);
    const overCapacity = futureMonths.filter(m => m.forecast > m.capacity);
    return [
      {
        title: 'Current Capacity',
        value: `${(rawData.users.length || 0) * 160}h/mo`,
        sub: `${rawData.users.length || 0} team members`,
        color: '#0066FF',
      },
      {
        title: 'Avg Monthly Usage',
        value: avgMonthly > 0 ? `${avgMonthly}h` : '—',
        sub: 'Based on recent months',
        color: '#10B981',
      },
      {
        title: 'Projected Shortfall',
        value: overCapacity.length > 0 ? `${overCapacity.length} month${overCapacity.length > 1 ? 's' : ''}` : 'None',
        sub: 'Months exceeding capacity',
        color: '#F59E0B',
      },
    ];
  }, [forecastData, rawData]);

  // Budget summary cards
  const budgetSummaryCards = useMemo(() => {
    if (!forecastData || !rawData) return [];
    const s = forecastData.summary;
    const totalInvoiced = rawData.invoices.reduce((sum, i) => sum + parseMoney(i.total), 0);
    return [
      {
        title: 'Total Contract Value',
        value: `€${s.totalBudget.toLocaleString()}`,
        sub: `${s.totalProjects} active projects`,
        color: '#0066FF',
      },
      {
        title: 'Hours Consumed',
        value: `${s.totalSpent.toLocaleString()}h`,
        sub: `${s.avgCompletion}% of planned`,
        color: '#F59E0B',
      },
      {
        title: 'Total Invoiced',
        value: `€${totalInvoiced.toLocaleString()}`,
        sub: `${rawData.invoices.length} invoices`,
        color: '#10B981',
      },
    ];
  }, [forecastData, rawData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center" style={{ height: '400px' }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#6B7280' }} />
        <span style={{ marginLeft: '12px', color: '#6B7280', fontSize: '14px' }}>Loading forecast data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ height: '400px' }}>
        <AlertCircle className="w-8 h-8 mb-3" style={{ color: '#DC2626' }} />
        <p style={{ color: '#DC2626', fontSize: '14px' }}>{error}</p>
      </div>
    );
  }

  if (!forecastData) return null;

  const { summary } = forecastData;

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
            Forecasting
          </h2>
          <p style={{ fontSize: '13px', color: '#6B7280' }}>
            Project completion predictions, capacity planning, and budget projections
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-gray-50 transition-colors"
          style={{ borderColor: '#E5E7EB', fontSize: '13px', color: '#374151' }}
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4" style={{ marginBottom: '24px' }}>
        {summaryCards.map(card => (
          <div
            key={card.label}
            className="rounded-xl border"
            style={{ borderColor: '#E5E7EB', padding: '20px' }}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {card.label}
              </span>
              <div
                className="flex items-center justify-center rounded-lg"
                style={{ width: '36px', height: '36px', backgroundColor: `${card.color}10` }}
              >
                <card.icon className="w-5 h-5" style={{ color: card.color }} />
              </div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
              {card.value}
            </div>
            <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* View Tabs */}
      <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
        <div className="flex items-center gap-1 p-1 rounded-lg" style={{ backgroundColor: '#F3F4F6' }}>
          {viewModeTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => handleViewModeChange(tab.key)}
              className="flex items-center gap-2 px-4 py-2 rounded-md transition-colors"
              style={{
                fontSize: '13px',
                fontWeight: viewMode === tab.key ? 600 : 400,
                color: viewMode === tab.key ? '#111827' : '#6B7280',
                backgroundColor: viewMode === tab.key ? 'white' : 'transparent',
                boxShadow: viewMode === tab.key ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              }}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {viewMode === 'projects' && (
          <div className="flex items-center gap-2">
            <select
              value={riskFilter}
              onChange={handleRiskFilterChange}
              className="px-3 py-2 rounded-lg border"
              style={{ borderColor: '#E5E7EB', fontSize: '13px', color: '#374151' }}
            >
              <option value="all">All Risks</option>
              <option value="high">Critical Only</option>
              <option value="medium">At Risk Only</option>
              <option value="low">On Track Only</option>
            </select>
          </div>
        )}
      </div>

      {/* Projects Forecast View */}
      {viewMode === 'projects' && (
        <div className="rounded-xl border" style={{ borderColor: '#E5E7EB', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#F9FAFB' }}>
                {['Project', 'Deadline', 'Hours Used', 'Burn Rate', 'Est. Completion', 'Risk'].map(col => (
                  <th
                    key={col}
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#6B7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      borderBottom: '1px solid #E5E7EB',
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF', fontSize: '14px' }}>
                    No projects match the current filter
                  </td>
                </tr>
              ) : (
                filteredProjects.map(proj => {
                  const riskConf = RISK_CONFIG[proj.risk];
                  return (
                    <tr
                      key={proj.id}
                      className="hover:bg-gray-50 transition-colors"
                      style={{ borderBottom: '1px solid #F3F4F6' }}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>
                          {proj.name}
                        </div>
                        <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
                          {proj.code}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontSize: '13px', color: '#111827' }}>
                          {proj.endDate ? proj.endDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: !proj.endDate ? '#9CA3AF' : proj.daysRemaining < 0 ? '#DC2626' : proj.daysRemaining < 14 ? '#F59E0B' : '#6B7280',
                        }}>
                          {!proj.endDate ? 'No deadline' : proj.daysRemaining < 0 ? `${Math.abs(proj.daysRemaining)}d overdue` : `${proj.daysRemaining}d remaining`}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div className="flex items-center gap-2">
                          <div
                            className="rounded-full"
                            style={{ width: '60px', height: '6px', backgroundColor: '#F3F4F6', overflow: 'hidden' }}
                          >
                            <div
                              className="rounded-full"
                              style={{
                                width: `${Math.min(100, proj.hoursUsed)}%`,
                                height: '100%',
                                backgroundColor: proj.hoursUsed > 100 ? '#DC2626' : proj.hoursUsed > 85 ? '#F59E0B' : '#10B981',
                              }}
                            />
                          </div>
                          <span style={{ fontSize: '13px', color: '#111827' }}>
                            {proj.hoursUsed}%
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
                          {proj.spentHours}h / {proj.plannedHours}h
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: '#111827' }}>
                        {proj.burnRate}h/day
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontSize: '13px', color: '#111827' }}>
                          {proj.estimatedCompletion
                            ? proj.estimatedCompletion.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                            : '—'
                          }
                        </div>
                        {proj.estimatedCompletion && proj.endDate && (
                          <div style={{
                            fontSize: '11px',
                            color: proj.estimatedCompletion > proj.endDate ? '#DC2626' : '#10B981',
                          }}>
                            {proj.estimatedCompletion > proj.endDate
                              ? `${Math.ceil((proj.estimatedCompletion.getTime() - proj.endDate.getTime()) / (1000*60*60*24))}d late`
                              : 'Within deadline'
                            }
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          className="px-2 py-1 rounded-full"
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            backgroundColor: riskConf.bg,
                            color: riskConf.color,
                          }}
                        >
                          {riskConf.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Capacity Planning View */}
      {viewMode === 'capacity' && (
        <div className="space-y-6">
          <div className="rounded-xl border" style={{ borderColor: '#E5E7EB', padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
              Capacity Forecast
            </h3>
            <p style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '20px' }}>
              Actual hours (past) vs projected hours (future) against total team capacity
            </p>
            <div style={{ height: '360px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastData.capacityForecast}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="month" style={{ fontSize: '12px' }} />
                  <YAxis style={{ fontSize: '12px' }} />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `${value.toLocaleString()}h`,
                      name === 'actual' ? 'Actual Hours' : name === 'forecast' ? 'Forecast' : 'Capacity',
                    ]}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px' }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="capacity" stroke="#E5E7EB" fill="#F9FAFB" strokeDasharray="5 5" name="Capacity" />
                  <Area type="monotone" dataKey="actual" stroke="#0066FF" fill="#0066FF20" strokeWidth={2} name="Actual Hours" />
                  <Area type="monotone" dataKey="forecast" stroke="#8B5CF6" fill="#8B5CF620" strokeWidth={2} strokeDasharray="5 5" name="Forecast" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Capacity Insights */}
          <div className="grid grid-cols-3 gap-4">
            {capacityInsights.map(item => (
              <div key={item.title} className="rounded-xl border" style={{ borderColor: '#E5E7EB', padding: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  {item.title}
                </div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: item.color, marginBottom: '4px' }}>
                  {item.value}
                </div>
                <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{item.sub}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Budget Projections View */}
      {viewMode === 'budget' && (
        <div className="space-y-6">
          <div className="rounded-xl border" style={{ borderColor: '#E5E7EB', padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
              Revenue & Cost Projection
            </h3>
            <p style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '20px' }}>
              Historical invoiced revenue and estimated costs, with forward projections
            </p>
            <div style={{ height: '360px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={forecastData.budgetForecast}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="month" style={{ fontSize: '12px' }} />
                  <YAxis
                    style={{ fontSize: '12px' }}
                    tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `€${value.toLocaleString()}`,
                      name === 'revenue' ? 'Revenue' : name === 'cost' ? 'Est. Cost' : 'Projected Revenue',
                    ]}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px' }}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} name="Revenue" />
                  <Bar dataKey="cost" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Est. Cost" />
                  <Bar dataKey="projected" fill="#8B5CF680" radius={[4, 4, 0, 0]} name="Projected Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Budget Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            {budgetSummaryCards.map(item => (
              <div key={item.title} className="rounded-xl border" style={{ borderColor: '#E5E7EB', padding: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  {item.title}
                </div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: item.color, marginBottom: '4px' }}>
                  {item.value}
                </div>
                <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{item.sub}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export { ForecastingView };
