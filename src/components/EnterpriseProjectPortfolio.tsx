import React, { useState, useMemo } from 'react';
import { Search, MoreVertical, TrendingDown, TrendingUp, Minus, ArrowRight, Download, Grid3x3, List, BarChart3, Loader2 } from 'lucide-react';
import { ProjectSummary } from '../services/dashboard-api';
import { useProjectsSummary, useWhatsPending } from '../hooks/useApiQueries';

function convertProject(p: ProjectSummary) {
  const now = new Date();
  const endDate = p.endDate ? new Date(p.endDate) : null;
  const startDate = p.startDate ? new Date(p.startDate) : null;
  const spent = parseFloat(p.spentHours || '0');
  const planned = parseFloat(p.plannedHours || '0');
  const allocated = parseFloat(p.allocatedHours || '0');
  const contract = parseFloat(p.contractValue || '0');
  const alertCount = p.alerts?.length || 0;
  const isOverBudget = planned > 0 && spent > planned;
  const isOverdue = !!(endDate && endDate < now && p.status !== 4);
  const totalFlags = alertCount + (isOverBudget ? 1 : 0) + (isOverdue ? 1 : 0);

  let health: string, healthColor: string;
  if (p.status === 4) { health = 'Completed'; healthColor = '#6B7280'; }
  else if (totalFlags > 2) { health = 'Critical'; healthColor = '#DC2626'; }
  else if (totalFlags > 0) { health = 'At Risk'; healthColor = '#F59E0B'; }
  else { health = 'On Track'; healthColor = '#16A34A'; }

  const progress = planned > 0 ? Math.min(Math.round((spent / planned) * 100), 100) : 0;
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  const timelineRange = startDate && endDate ? `${fmt(startDate)} — ${fmt(endDate)}` : '—';

  let timeStatus: string, timeColor: string;
  if (p.status === 4) { timeStatus = 'Completed'; timeColor = '#6B7280'; }
  else if (isOverdue) { const d = Math.ceil((now.getTime() - endDate!.getTime()) / 86400000); timeStatus = `${d}d OVERDUE`; timeColor = '#DC2626'; }
  else if (endDate) { const d = Math.ceil((endDate.getTime() - now.getTime()) / 86400000); timeStatus = `${d}d remaining`; timeColor = d < 30 ? '#F59E0B' : '#6B7280'; }
  else { timeStatus = 'No deadline'; timeColor = '#6B7280'; }

  const budgetVar = planned > 0 ? ((spent - planned) / planned * 100).toFixed(1) + '%' : '—';
  const budgetSt = isOverBudget ? 'BREACH' : (planned > 0 && spent / planned > 0.85) ? 'WARNING' : 'OK';
  const budgetCol = budgetSt === 'BREACH' ? '#DC2626' : budgetSt === 'WARNING' ? '#F59E0B' : '#16A34A';

  const cats: string[] = [];
  if (isOverBudget) cats.push('Budget');
  if (isOverdue) cats.push('Schedule');
  if (alertCount > 0) cats.push(`Alerts (${alertCount})`);

  const issues: string[] = [];
  if (isOverBudget) issues.push(`Over budget by ${Math.round(spent - planned)}h`);
  if (isOverdue) issues.push(timeStatus);
  (p.alerts || []).forEach(a => issues.push(a.message));

  const pm = p.members?.find(m => m.isProjectManager);
  const memberCount = p.members?.length || 0;

  return {
    id: p.id, name: p.name, code: p.code || '—',
    status: health, statusColor: healthColor,
    trend: totalFlags > 2 ? '↑ Worsening' : totalFlags > 0 ? '→ Stable' : '↓ Improving',
    trendColor: totalFlags > 2 ? '#DC2626' : totalFlags > 0 ? '#6B7280' : '#16A34A',
    badge: p.projectType?.name || 'Project',
    owner: pm?.user?.fullName || '—',
    flags: totalFlags, issues,
    risks: { count: totalFlags, trend: totalFlags > 2 ? '↑' : totalFlags > 0 ? '→' : '', categories: cats.join(', ') || 'None' },
    timeline: { range: timelineRange, progress, status: timeStatus, statusColor: timeColor },
    budget: { variance: budgetVar, status: budgetSt, color: budgetCol, trend: isOverBudget ? '↑ Growing' : '→ Stable' },
    resources: {
      fte: memberCount,
      planned: Math.max(memberCount, Math.ceil(allocated / 160)) || memberCount,
      pressure: allocated > 0 && spent / allocated > 0.9 ? 'High pressure' : 'Normal',
      pressureColor: allocated > 0 && spent / allocated > 0.9 ? '#DC2626' : '#16A34A',
    },
    nextAction: {
      text: issues[0] || 'Review project status',
      context: p.client?.name || 'Internal',
      deadline: isOverdue ? 'Overdue' : endDate ? `Due ${endDate.toLocaleDateString()}` : 'No deadline',
      urgent: health === 'Critical',
      button: health === 'Critical' ? 'Escalate' : 'Review',
    },
    _spent: spent, _planned: planned, _allocated: allocated, _contract: contract,
  };
}

export function EnterpriseProjectPortfolio() {
  const [viewMode, setViewMode] = useState<'pm' | 'client' | 'exec'>('pm');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [openActionMenu, setOpenActionMenu] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  // --- Fetch data via TanStack Query ---
  const { data: rawProjects = [], isLoading: projectsLoading } = useProjectsSummary();
  const { data: pendingRaw, isLoading: pendingLoading } = useWhatsPending();
  const loading = projectsLoading || pendingLoading;
  const projects = useMemo(() => rawProjects.map(convertProject), [rawProjects]);
  const pendingData = useMemo(() => ({
    tasks: (pendingRaw as any)?.tasks || 0,
    leaveRequests: (pendingRaw as any)?.leaveRequests || 0,
    expenses: (pendingRaw as any)?.expenses || 0,
    purchases: (pendingRaw as any)?.purchases || 0,
    timesheets: (pendingRaw as any)?.timesheets || 0,
  }), [pendingRaw]);

  const criticalProjects = useMemo(() => projects.filter(p => p.status === 'Critical'), [projects]);
  const atRiskProjects = useMemo(() => projects.filter(p => p.status === 'At Risk'), [projects]);
  const onTrackProjects = useMemo(() => projects.filter(p => p.status === 'On Track'), [projects]);
  const overdueProjects = useMemo(() => projects.filter(p => p.timeline.status.includes('OVERDUE')), [projects]);

  const totalPending = pendingData.tasks + pendingData.leaveRequests + pendingData.expenses + pendingData.purchases + pendingData.timesheets;
  const pendingBudgetCount = pendingData.expenses + pendingData.purchases;
  const totalSpent = useMemo(() => projects.reduce((s, p) => s + p._spent, 0), [projects]);
  const totalPlanned = useMemo(() => projects.reduce((s, p) => s + p._planned, 0), [projects]);
  const totalAllocated = useMemo(() => projects.reduce((s, p) => s + p._allocated, 0), [projects]);
  const totalContract = useMemo(() => projects.reduce((s, p) => s + p._contract, 0), [projects]);
  const budgetVariance = totalPlanned > 0 ? ((totalSpent - totalPlanned) / totalPlanned * 100).toFixed(1) : '0.0';
  const utilization = totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;
  const schedulePerf = projects.length > 0
    ? Math.round(((projects.length - overdueProjects.length) / projects.length) * 100) - 100
    : 0;

  const filteredProjects = useMemo(() => {
    let list = activeFilter
      ? projects.filter(p => {
          if (activeFilter === 'critical') return p.status === 'Critical';
          if (activeFilter === 'at-risk') return p.status === 'At Risk';
          if (activeFilter === 'overdue') return p.timeline.status.includes('OVERDUE');
          if (activeFilter === 'budget-alerts') return p.budget.status === 'BREACH';
          return true;
        })
      : projects;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || p.owner.toLowerCase().includes(q));
    }
    return list;
  }, [projects, activeFilter, searchQuery]);

  const budgetBreachCount = useMemo(() => projects.filter(p => p.budget.status === 'BREACH').length, [projects]);

  const visibleColumns = viewMode === 'pm'
    ? ['status', 'project', 'risks', 'timeline', 'budget', 'resources', 'nextAction', 'actions']
    : viewMode === 'client'
    ? ['status', 'project', 'risks', 'timeline', 'nextAction']
    : ['status', 'project', 'risks', 'budget', 'timeline'];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFBFC' }}>
      {/* COMPONENT 1: COMMAND CENTER */}
      <div
        className="mx-6 mt-6 mb-6 rounded"
        style={{
          background: '#1F2937',
          border: '2px solid #3B82F6',
          borderRadius: '4px',
          padding: '20px',
          height: '120px'
        }}
      >
        <h3 className="uppercase font-bold mb-3" style={{ fontSize: '13px', color: 'white', letterSpacing: '0.1em' }}>
          DECISIONS REQUIRED THIS WEEK
        </h3>

        <div className="flex items-center justify-between">
          {/* Metric 1: Total pending approvals */}
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-bold" style={{ fontSize: '32px', color: 'white' }}>
                {loading ? '—' : totalPending}
              </span>
              <span style={{ fontSize: '13px', color: '#9CA3AF' }}>Pending approvals</span>
            </div>
            <p style={{ fontSize: '11px', color: '#F59E0B', marginTop: '2px' }}>
              {loading ? '...' : pendingData.expenses > 0 || pendingData.purchases > 0
                ? `${pendingData.expenses + pendingData.purchases} budget items`
                : 'None urgent'}
            </p>
          </div>

          {/* Metric 2: Overdue / Critical projects */}
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-bold" style={{ fontSize: '32px', color: overdueProjects.length > 0 ? '#EF4444' : 'white' }}>
                {loading ? '—' : overdueProjects.length}
              </span>
              <span style={{ fontSize: '13px', color: '#9CA3AF' }}>Overdue projects</span>
            </div>
            <p style={{ fontSize: '11px', color: overdueProjects.length > 0 ? '#EF4444' : '#9CA3AF', marginTop: '2px' }}>
              {loading ? '...' : criticalProjects.length > 0 ? `${criticalProjects.length} critical` : 'None critical'}
            </p>
          </div>

          {/* Metric 3: Pending budget approvals */}
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-bold" style={{ fontSize: '32px', color: 'white' }}>
                {loading ? '—' : pendingBudgetCount}
              </span>
              <span style={{ fontSize: '13px', color: '#9CA3AF' }}>Budget approvals pending</span>
            </div>
            <p style={{ fontSize: '11px', color: '#F59E0B', marginTop: '2px' }}>
              {loading ? '...' : budgetBreachCount > 0 ? `${budgetBreachCount} over budget` : 'All within budget'}
            </p>
          </div>

          {/* Metric 4: Resource utilization */}
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-bold" style={{ fontSize: '32px', color: utilization > 100 ? '#EF4444' : 'white' }}>
                {loading ? '—' : `${utilization}%`}
              </span>
              <span style={{ fontSize: '13px', color: '#9CA3AF' }}>Resource utilization</span>
            </div>
            <p style={{ fontSize: '11px', color: utilization > 100 ? '#EF4444' : '#F59E0B', marginTop: '2px' }}>
              {loading ? '...' : utilization > 100 ? 'Over-allocated' : utilization > 80 ? 'Near capacity' : 'Within capacity'}
            </p>
          </div>

          {/* Action button */}
          <button
            className="font-semibold transition-all"
            style={{
              fontSize: '13px',
              color: '#3B82F6',
              border: '1px solid #3B82F6',
              padding: '10px 16px',
              borderRadius: '4px',
              background: 'transparent'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#1E3A8A'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            Review all decisions →
          </button>
        </div>
      </div>

      {/* COMPONENT 2: CRITICAL ALERTS */}
      {criticalProjects.length > 0 && (
        <div
          className="mx-6 mb-6 rounded"
          style={{
            background: '#7F1D1D',
            border: '3px solid #DC2626',
            borderRadius: '4px',
            padding: '20px',
            animation: 'pulse 3s infinite'
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <span style={{ fontSize: '20px' }}>🚨</span>
            <h3 className="uppercase font-bold" style={{ fontSize: '14px', color: 'white', letterSpacing: '0.05em' }}>
              CRITICAL PROJECTS - IMMEDIATE ACTION REQUIRED
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {criticalProjects.map((project) => (
              <div
                key={project.id}
                className="rounded"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '4px',
                  padding: '16px',
                  height: '160px'
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold" style={{ fontSize: '16px', color: 'white' }}>
                    {project.name}
                  </span>
                  <span
                    className="uppercase font-semibold px-2 py-1 rounded"
                    style={{
                      fontSize: '11px',
                      color: '#7C2D12',
                      background: '#FCA5A5'
                    }}
                  >
                    {project.status}
                  </span>
                </div>

                <div className="space-y-1 mb-3">
                  {project.issues.slice(0, 3).map((issue, i) => (
                    <p key={i} style={{ fontSize: '13px', color: 'white' }}>• {issue}</p>
                  ))}
                </div>

                <p style={{ fontSize: '12px', color: '#FCA5A5', marginBottom: '12px' }}>
                  Owner: {project.owner} • {project.timeline.status}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    className="rounded transition-all"
                    style={{
                      fontSize: '11px',
                      color: 'white',
                      background: '#DC2626',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '3px'
                    }}
                  >
                    Escalate
                  </button>
                  <button
                    className="rounded transition-all"
                    style={{
                      fontSize: '11px',
                      color: 'white',
                      background: 'transparent',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      padding: '6px 12px',
                      borderRadius: '3px'
                    }}
                  >
                    View details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* COMPONENT 3: PORTFOLIO OVERVIEW */}
      <div
        className="mx-6 mb-6 rounded"
        style={{
          background: 'white',
          border: '1px solid #E5E7EB',
          borderRadius: '4px',
          padding: '24px',
          minHeight: '240px'
        }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-[#6B7280]" />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6 h-full">
            {/* Column 1: Portfolio Health */}
            <div>
              <h4 className="uppercase font-semibold mb-4" style={{ fontSize: '12px', color: '#6B7280', letterSpacing: '0.05em' }}>
                PORTFOLIO HEALTH
              </h4>
              <div className="space-y-2">
                <div className="flex items-baseline gap-3">
                  <span className="font-bold" style={{ fontSize: '28px', color: '#1F2937' }}>{projects.length}</span>
                  <div className="flex-1">
                    <div style={{ fontSize: '13px', color: '#6B7280' }}>Total Projects</div>
                  </div>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="font-bold" style={{ fontSize: '28px', color: '#DC2626' }}>{criticalProjects.length}</span>
                  <div className="flex-1">
                    <div style={{ fontSize: '13px', color: '#6B7280' }}>Critical</div>
                  </div>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="font-bold" style={{ fontSize: '28px', color: '#EA580C' }}>{atRiskProjects.length}</span>
                  <div className="flex-1">
                    <div style={{ fontSize: '13px', color: '#6B7280' }}>At Risk</div>
                  </div>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="font-bold" style={{ fontSize: '28px', color: '#16A34A' }}>{onTrackProjects.length}</span>
                  <div className="flex-1">
                    <div style={{ fontSize: '13px', color: '#6B7280' }}>On Track</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Performance */}
            <div>
              <h4 className="uppercase font-semibold mb-4" style={{ fontSize: '12px', color: '#6B7280', letterSpacing: '0.05em' }}>
                PERFORMANCE
              </h4>
              <div className="space-y-4">
                <div>
                  <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '4px' }}>Budget Variance</div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold" style={{ fontSize: '20px', color: parseFloat(budgetVariance) > 0 ? '#DC2626' : '#10B981' }}>
                      {parseFloat(budgetVariance) > 0 ? '+' : ''}{budgetVariance}%
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="w-full h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(totalPlanned > 0 ? (totalSpent / totalPlanned) * 100 : 0, 100)}%`,
                          backgroundColor: parseFloat(budgetVariance) > 0 ? '#DC2626' : '#3B82F6'
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span style={{ fontSize: '10px', color: '#6B7280' }}>{Math.round(totalSpent).toLocaleString()}h spent</span>
                      <span style={{ fontSize: '10px', color: '#6B7280' }}>{Math.round(totalPlanned).toLocaleString()}h planned</span>
                    </div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '4px' }}>Schedule Performance</div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold" style={{ fontSize: '20px', color: overdueProjects.length > 0 ? '#DC2626' : '#10B981' }}>
                      {overdueProjects.length === 0 ? '100%' : `${Math.round(((projects.length - overdueProjects.length) / projects.length) * 100)}%`}
                    </span>
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>on schedule</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '4px' }}>Resource Utilization</div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold" style={{ fontSize: '20px', color: utilization > 100 ? '#EA580C' : '#10B981' }}>
                      {utilization}%
                    </span>
                    <span style={{ fontSize: '12px', color: utilization > 100 ? '#DC2626' : '#6B7280' }}>
                      {utilization > 100 ? 'Over-allocated' : 'Healthy'}
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="w-full h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(utilization, 100)}%`,
                          backgroundColor: utilization > 100 ? '#EA580C' : '#3B82F6'
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 3: Financial Summary */}
            <div>
              <h4 className="uppercase font-semibold mb-4" style={{ fontSize: '12px', color: '#6B7280', letterSpacing: '0.05em' }}>
                FINANCIAL SUMMARY
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: '13px', color: '#6B7280' }}>Total Contract Value</span>
                  <span className="font-bold" style={{ fontSize: '14px', color: '#1F2937' }}>
                    {totalContract > 0 ? `€${(totalContract / 1000).toFixed(0)}K` : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: '13px', color: '#6B7280' }}>Hours Allocated</span>
                  <span className="font-bold" style={{ fontSize: '14px', color: '#1F2937' }}>
                    {Math.round(totalAllocated).toLocaleString()}h
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: '13px', color: '#6B7280' }}>Hours Spent</span>
                  <span className="font-bold" style={{ fontSize: '14px', color: parseFloat(budgetVariance) > 0 ? '#DC2626' : '#1F2937' }}>
                    {Math.round(totalSpent).toLocaleString()}h
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: '13px', color: '#6B7280' }}>Hours Planned</span>
                  <span className="font-bold" style={{ fontSize: '14px', color: '#1F2937' }}>
                    {Math.round(totalPlanned).toLocaleString()}h
                  </span>
                </div>
                <div className="h-px bg-[#E5E7EB] my-2"></div>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: '13px', color: '#6B7280' }}>Pending Approvals</span>
                  <span className="font-bold" style={{ fontSize: '14px', color: totalPending > 0 ? '#F59E0B' : '#16A34A' }}>
                    {totalPending}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: '13px', color: '#6B7280' }}>Budget Breaches</span>
                  <span className="font-bold" style={{ fontSize: '14px', color: budgetBreachCount > 0 ? '#DC2626' : '#16A34A' }}>
                    {budgetBreachCount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* COMPONENT 4: PROJECT LIST TABLE */}
      <div
        className="mx-6 mb-6 rounded"
        style={{
          background: 'white',
          border: '1px solid #E5E7EB',
          borderRadius: '4px'
        }}
      >
        {/* Table Header Bar */}
        <div
          className="flex items-center justify-between px-5 border-b"
          style={{ height: '52px', borderBottomColor: '#E5E7EB' }}
        >
          <div className="flex items-center gap-2">
            <span className="uppercase font-semibold" style={{ fontSize: '13px', color: '#1F2937', letterSpacing: '0.05em' }}>
              ALL PROJECTS
            </span>
            <span style={{ fontSize: '13px', color: '#6B7280' }}>({filteredProjects.length})</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick filters */}
            {[
              { key: 'critical', label: `Critical (${criticalProjects.length})` },
              { key: 'at-risk', label: `At Risk (${atRiskProjects.length})` },
              { key: 'overdue', label: `Overdue (${overdueProjects.length})` },
              { key: 'budget-alerts', label: `Budget alerts (${budgetBreachCount})` },
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(activeFilter === filter.key ? null : filter.key)}
                className="rounded-full transition-all"
                style={{
                  fontSize: '11px',
                  padding: '4px 10px',
                  background: activeFilter === filter.key ? '#3B82F6' : '#F3F4F6',
                  color: activeFilter === filter.key ? 'white' : '#6B7280',
                  borderRadius: '12px'
                }}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 pr-3 py-1 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#3B82F6]"
                style={{ width: '160px', height: '30px', fontSize: '12px' }}
              />
            </div>
            <div className="flex items-center gap-1">
              <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#F3F4F6]">
                <Grid3x3 className="w-4 h-4 text-[#6B7280]" />
              </button>
              <button className="w-7 h-7 flex items-center justify-center rounded bg-[#F3F4F6]">
                <List className="w-4 h-4 text-[#3B82F6]" />
              </button>
              <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#F3F4F6]">
                <BarChart3 className="w-4 h-4 text-[#6B7280]" />
              </button>
            </div>
            <button
              className="flex items-center gap-2 px-3 py-2 rounded border text-sm"
              style={{ borderColor: '#E5E7EB', color: '#6B7280' }}
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
          <table className="w-full">
            <thead className="sticky top-0 bg-[#F9FAFB] border-b-2" style={{ borderBottomColor: '#E5E7EB' }}>
              <tr>
                {visibleColumns.includes('status') && (
                  <th className="px-4 py-3 text-left uppercase font-semibold" style={{ fontSize: '11px', color: '#6B7280', letterSpacing: '0.05em', width: '80px' }}>
                    STATUS
                  </th>
                )}
                {visibleColumns.includes('project') && (
                  <th className="px-4 py-3 text-left uppercase font-semibold" style={{ fontSize: '11px', color: '#6B7280', letterSpacing: '0.05em', width: '280px' }}>
                    PROJECT
                  </th>
                )}
                {visibleColumns.includes('risks') && (
                  <th className="px-4 py-3 text-left uppercase font-semibold" style={{ fontSize: '11px', color: '#6B7280', letterSpacing: '0.05em', width: '140px' }}>
                    ACTIVE RISKS
                  </th>
                )}
                {visibleColumns.includes('timeline') && (
                  <th className="px-4 py-3 text-left uppercase font-semibold" style={{ fontSize: '11px', color: '#6B7280', letterSpacing: '0.05em', width: '200px' }}>
                    TIMELINE
                  </th>
                )}
                {visibleColumns.includes('budget') && (
                  <th className="px-4 py-3 text-left uppercase font-semibold" style={{ fontSize: '11px', color: '#6B7280', letterSpacing: '0.05em', width: '140px' }}>
                    BUDGET
                  </th>
                )}
                {visibleColumns.includes('resources') && (
                  <th className="px-4 py-3 text-left uppercase font-semibold" style={{ fontSize: '11px', color: '#6B7280', letterSpacing: '0.05em', width: '120px' }}>
                    RESOURCES
                  </th>
                )}
                {visibleColumns.includes('nextAction') && (
                  <th className="px-4 py-3 text-left uppercase font-semibold" style={{ fontSize: '11px', color: '#6B7280', letterSpacing: '0.05em', width: '280px' }}>
                    NEXT ACTION
                  </th>
                )}
                {visibleColumns.includes('actions') && (
                  <th className="px-4 py-3" style={{ width: '72px' }}></th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={visibleColumns.length} className="text-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-[#6B7280] mx-auto mb-2" />
                    <p style={{ fontSize: '13px', color: '#6B7280' }}>Loading projects...</p>
                  </td>
                </tr>
              ) : filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length} className="text-center py-12">
                    <p style={{ fontSize: '14px', color: '#6B7280' }}>
                      {searchQuery || activeFilter ? 'No projects match your filters' : 'No projects found'}
                    </p>
                  </td>
                </tr>
              ) : filteredProjects.map((project) => (
                <tr
                  key={project.id}
                  className="border-b hover:bg-[#F9FAFB] transition-colors"
                  style={{
                    height: '64px',
                    borderBottomColor: '#F3F4F6',
                    borderLeft: project.status === 'Critical' ? `4px solid ${project.statusColor}` : 'none'
                  }}
                >
                  {/* Status */}
                  {visibleColumns.includes('status') && (
                    <td className="px-4">
                      <div className="flex flex-col gap-1">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.statusColor }}></div>
                        <span className="font-semibold" style={{ fontSize: '12px', color: project.statusColor }}>{project.status}</span>
                        <span style={{ fontSize: '10px', color: project.trendColor }}>{project.trend}</span>
                      </div>
                    </td>
                  )}

                  {/* Project */}
                  {visibleColumns.includes('project') && (
                    <td className="px-4">
                      <div style={{ lineHeight: 1.3 }}>
                        <div className="font-semibold hover:text-[#3B82F6] cursor-pointer" style={{ fontSize: '14px', color: '#1F2937', marginBottom: '2px' }}>
                          {project.name}
                        </div>
                        <div className="flex items-center gap-1.5" style={{ marginBottom: '2px' }}>
                          <span style={{ fontSize: '11px', color: '#6B7280' }}>{project.code}</span>
                          <span
                            className="px-1.5 py-0.5 rounded"
                            style={{ fontSize: '10px', color: '#1E40AF', background: '#DBEAFE' }}
                          >
                            {project.badge}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#6B7280' }}>PM: {project.owner}</div>
                      </div>
                    </td>
                  )}

                  {/* Risks */}
                  {visibleColumns.includes('risks') && (
                    <td className="px-4">
                      {project.risks.count > 0 ? (
                        <div>
                          <div className="flex items-center gap-1" style={{ marginBottom: '2px' }}>
                            <span className="font-bold" style={{ fontSize: '18px', color: '#DC2626' }}>{project.risks.count}</span>
                            <span style={{ fontSize: '11px', color: '#6B7280' }}>active</span>
                            <span style={{ fontSize: '10px', color: '#DC2626' }}>{project.risks.trend}</span>
                          </div>
                          <div style={{ fontSize: '11px', color: '#6B7280' }}>{project.risks.categories}</div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span style={{ fontSize: '14px', color: '#16A34A' }}>✓</span>
                          <span style={{ fontSize: '12px', color: '#16A34A' }}>No risks</span>
                        </div>
                      )}
                    </td>
                  )}

                  {/* Timeline */}
                  {visibleColumns.includes('timeline') && (
                    <td className="px-4">
                      <div>
                        <div style={{ fontSize: '12px', color: '#4B5563', marginBottom: '4px' }}>{project.timeline.range}</div>
                        <div className="w-full h-1 bg-[#E5E7EB] rounded-full overflow-hidden mb-1">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${project.timeline.progress}%`, backgroundColor: project.statusColor }}
                          ></div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span style={{ fontSize: '11px', color: project.timeline.statusColor, fontWeight: project.timeline.status.includes('OVERDUE') ? 700 : 400 }}>
                            {project.timeline.status}
                          </span>
                          <span style={{ fontSize: '10px', color: '#6B7280' }}>{project.timeline.progress}%</span>
                        </div>
                      </div>
                    </td>
                  )}

                  {/* Budget */}
                  {visibleColumns.includes('budget') && (
                    <td className="px-4">
                      <div>
                        <div className="font-semibold" style={{ fontSize: '14px', color: project.budget.color, marginBottom: '4px' }}>
                          {project.budget.variance}
                        </div>
                        <div
                          className="inline-block px-1.5 py-0.5 rounded uppercase font-semibold mb-1"
                          style={{
                            fontSize: '10px',
                            background: project.budget.status === 'BREACH' ? '#DC2626' : project.budget.status === 'WARNING' ? '#F59E0B' : '#16A34A',
                            color: 'white'
                          }}
                        >
                          {project.budget.status}
                        </div>
                        <div style={{ fontSize: '10px', color: project.budget.color }}>{project.budget.trend}</div>
                      </div>
                    </td>
                  )}

                  {/* Resources */}
                  {visibleColumns.includes('resources') && (
                    <td className="px-4">
                      <div>
                        <div className="font-semibold" style={{ fontSize: '13px', color: '#1F2937', marginBottom: '2px' }}>
                          {project.resources.fte} FTE
                        </div>
                        <div style={{ fontSize: '10px', color: '#6B7280', marginBottom: '4px' }}>of {project.resources.planned} planned</div>
                        <div style={{ fontSize: '11px', color: project.resources.pressureColor }}>{project.resources.pressure}</div>
                      </div>
                    </td>
                  )}

                  {/* Next Action */}
                  {visibleColumns.includes('nextAction') && (
                    <td className="px-4">
                      <div>
                        <div className="font-semibold" style={{ fontSize: '13px', color: '#1F2937', marginBottom: '2px' }}>
                          {project.nextAction.text}
                        </div>
                        <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>{project.nextAction.context}</div>
                        <div className="flex items-center justify-between">
                          <span style={{ fontSize: '11px', color: project.nextAction.deadline.includes('Overdue') ? '#DC2626' : '#6B7280' }}>
                            {project.nextAction.deadline}
                          </span>
                          <button
                            className="px-3 py-1 rounded text-white transition-all"
                            style={{
                              fontSize: '11px',
                              background: project.nextAction.urgent ? '#DC2626' : '#3B82F6',
                              height: '22px'
                            }}
                          >
                            {project.nextAction.button}
                          </button>
                        </div>
                      </div>
                    </td>
                  )}

                  {/* Actions */}
                  {visibleColumns.includes('actions') && (
                    <td className="px-4 text-center relative">
                      <button
                        onClick={() => setOpenActionMenu(openActionMenu === project.id ? null : (project.id as any))}
                        className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#F3F4F6] transition-all mx-auto"
                      >
                        <MoreVertical className="w-4.5 h-4.5 text-[#6B7280]" />
                      </button>

                      {openActionMenu === (project.id as any) && (
                        <div
                          className="absolute right-0 top-full mt-1 w-56 bg-white rounded border shadow-lg py-2 z-50"
                          style={{ borderColor: '#E5E7EB', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        >
                          {[
                            { label: 'Open Gantt', icon: '📊' },
                            { label: 'Open Board', icon: '📋' },
                            { label: 'Financial detail', icon: '💰' },
                            { divider: true },
                            { label: 'Email status to client', icon: '📧' },
                            { label: 'Generate exec summary', icon: '📊' },
                            { label: 'Escalate to sponsor', icon: '🚨' },
                            { divider: true },
                            { label: 'Edit project', icon: '✏️' },
                            { label: 'Manage team', icon: '👥' },
                            { label: 'Schedule review', icon: '📅' },
                            { divider: true },
                            { label: 'Archive project', icon: '🗑️', danger: true }
                          ].map((item, i) =>
                            item.divider ? (
                              <div key={i} className="h-px bg-[#E5E7EB] my-1"></div>
                            ) : (
                              <button
                                key={i}
                                className="w-full px-3 py-2 text-left hover:bg-[#F9FAFB] flex items-center gap-2 transition-colors"
                                style={{
                                  fontSize: '13px',
                                  color: item.danger ? '#DC2626' : '#1F2937',
                                  height: '34px'
                                }}
                              >
                                <span>{item.icon}</span>
                                <span>{item.label}</span>
                              </button>
                            )
                          )}
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* COMPONENT 5: STAKEHOLDER VIEW TOGGLE */}
      <div
        className="fixed bottom-6 right-6 flex items-center gap-2 rounded-full shadow-lg"
        style={{
          background: '#1F2937',
          padding: '6px',
          borderRadius: '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
        }}
      >
        <span style={{ fontSize: '11px', color: '#9CA3AF', marginLeft: '12px' }}>View as:</span>
        <div className="flex items-center gap-1">
          {(['pm', 'client', 'exec'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className="px-4 py-2 rounded-full transition-all"
              style={{
                background: viewMode === mode ? '#3B82F6' : 'transparent',
                color: viewMode === mode ? 'white' : '#9CA3AF',
                fontSize: '12px',
                fontWeight: viewMode === mode ? 600 : 400,
                width: '70px',
                height: '36px',
                borderRadius: '18px'
              }}
            >
              {mode.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.95; }
        }
      `}</style>
    </div>
  );
}
