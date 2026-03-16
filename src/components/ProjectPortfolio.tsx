import React, { useState, useMemo } from 'react';
import { Search, Plus, MoreHorizontal, CheckCircle, ChevronDown, List, AlignJustify, Menu, BarChart3, Trello, DollarSign, Loader2, AlertCircle } from 'lucide-react';
import { ProjectSummary } from '../services/dashboard-api';
import { useProjectsSummary } from '../hooks/useApiQueries';
import { ProjectWizardDialog } from './ProjectWizardDialog';

// ============================================================================
// Types & Helpers
// ============================================================================

interface PortfolioProject {
  id: string;
  name: string;
  code: string;
  health: 'Critical' | 'At Risk' | 'On Track' | 'Completed';
  healthColor: string;
  flags: number;
  issues: string[];
  flagIssues: string[];
  client: string;
  projectType: string;
  timeline: string;
  progress: number;
  timeRemaining: string;
  team: string[];
}

function convertProject(p: ProjectSummary): PortfolioProject {
  const spent = parseFloat(p.spentHours || '0');
  const planned = parseFloat(p.plannedHours || '0');
  const today = new Date();

  // --- Detect issues ---
  const isOverBudget = planned > 0 && spent > planned;
  let isOverdue = false;
  let daysOverdue = 0;
  let daysRemaining = 0;
  if (p.endDate) {
    const end = new Date(p.endDate.split('/').reverse().join('-'));
    const diffMs = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 0 && p.status !== 4) {
      isOverdue = true;
      daysOverdue = Math.abs(diffDays);
    } else {
      daysRemaining = Math.max(0, diffDays);
    }
  }

  const alertCount = p.alerts?.length || 0;
  const totalFlags = alertCount + (isOverBudget ? 1 : 0) + (isOverdue ? 1 : 0);

  // --- Health status ---
  let health: PortfolioProject['health'] = 'On Track';
  let healthColor = '#10B981';
  if (p.status === 4) {
    health = 'Completed';
    healthColor = '#3B82F6';
  } else if (totalFlags > 2) {
    health = 'Critical';
    healthColor = '#EF4444';
  } else if (totalFlags > 0) {
    health = 'At Risk';
    healthColor = '#F59E0B';
  }

  // --- Human-readable issues list (for Tier 1 cards) ---
  const issues: string[] = [];
  if (isOverBudget) {
    const overAmount = Math.round(spent - planned);
    issues.push(`Budget exceeded by ${overAmount.toLocaleString()} hrs`);
  }
  if (isOverdue) {
    issues.push(`Timeline delayed ${daysOverdue} days`);
  }
  if (alertCount > 0) {
    const critAlerts = p.alerts?.filter(a => a.severity === 'critical').length || 0;
    if (critAlerts > 0) issues.push(`${critAlerts} critical alert${critAlerts > 1 ? 's' : ''}`);
    const warnAlerts = alertCount - critAlerts;
    if (warnAlerts > 0) issues.push(`${warnAlerts} warning${warnAlerts > 1 ? 's' : ''}`);
  }

  // --- Flag breakdown (for table risks column) ---
  const flagIssues: string[] = [];
  if (isOverBudget) flagIssues.push('Budget (1)');
  if (isOverdue) flagIssues.push('Overdue (1)');
  if (alertCount > 0) flagIssues.push(`Alerts (${alertCount})`);

  // --- Progress ---
  const progress = planned > 0 ? Math.min(100, Math.round((spent / planned) * 100)) : 0;

  // --- Timeline ---
  const formatDateShort = (d: string | undefined) => d || '';
  const timeline = p.startDate && p.endDate
    ? `${formatDateShort(p.startDate)} - ${formatDateShort(p.endDate)}`
    : p.startDate || p.endDate || '';

  // --- Time remaining ---
  let timeRemaining = '';
  if (isOverdue) {
    timeRemaining = `⚠️ ${daysOverdue} days overdue`;
  } else if (p.endDate) {
    timeRemaining = `${daysRemaining} days remaining`;
  }

  // --- Team initials ---
  const members = p.members || [];
  const teamInitials: string[] = [];
  const maxShow = 4;
  members.slice(0, maxShow).forEach(m => {
    const parts = (m.user?.fullName || '').split(' ').filter(Boolean);
    const initials = parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : (parts[0]?.[0] || '?').toUpperCase();
    teamInitials.push(initials);
  });
  if (members.length > maxShow) {
    teamInitials.push(`+${members.length - maxShow}`);
  }

  // --- Client & project type ---
  const client = p.client?.name || 'Internal';
  const projectType = (p as any).projectType?.name || '';

  return {
    id: p.id,
    name: p.name,
    code: p.code || '',
    health,
    healthColor,
    flags: totalFlags,
    issues,
    flagIssues,
    client,
    projectType,
    timeline,
    progress,
    timeRemaining,
    team: teamInitials,
  };
}

// ============================================================================
// Component
// ============================================================================

export function ProjectPortfolio({ onOpenGantt }: { onOpenGantt?: (projectId: string) => void } = {}) {
  const [showWizard, setShowWizard] = useState(false);
  const [statsExpanded, setStatsExpanded] = useState(false);
  const [projectView, setProjectView] = useState<'comfortable' | 'compact' | 'list'>('comfortable');
  const [hoveredTableRow, setHoveredTableRow] = useState<string | null>(null);
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
  const [hoveredRisk, setHoveredRisk] = useState<number | null>(null);
  const [hoveredTeam, setHoveredTeam] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // --- Fetch data via TanStack Query ---
  const { data: rawProjects = [], isLoading, error: queryError } = useProjectsSummary();
  const error = queryError?.message ?? null;
  const projects = useMemo(() => rawProjects.map(convertProject), [rawProjects]);

  // --- Derived data ---
  const healthPriority: Record<string, number> = { Critical: 0, 'At Risk': 1, 'On Track': 2, Completed: 3 };
  const atRiskProjects = projects
    .filter(p => p.health === 'Critical' || p.health === 'At Risk')
    .sort((a, b) => (healthPriority[a.health] - healthPriority[b.health]) || (b.flags - a.flags));
  const visibleCards = atRiskProjects.slice(0, 3);
  const overflowProjects = atRiskProjects.slice(3);

  const criticalCount = projects.filter(p => p.health === 'Critical').length;
  const atRiskCount = projects.filter(p => p.health === 'At Risk').length;
  const onTrackCount = projects.filter(p => p.health === 'On Track').length;
  const completedCount = projects.filter(p => p.health === 'Completed').length;
  const totalProjects = projects.length;

  // Aggregated stats from raw data
  const totalAllocatedHours = rawProjects.reduce((s, p) => s + (parseFloat(p.allocatedHours || '0') || 0), 0);
  const totalSpentHours = rawProjects.reduce((s, p) => s + (parseFloat(p.spentHours || '0') || 0), 0);
  const totalPlannedHours = rawProjects.reduce((s, p) => s + (parseFloat(p.plannedHours || '0') || 0), 0);
  const totalContractValue = rawProjects.reduce((s, p) => s + (parseFloat(p.contractValue || '0') || 0), 0);
  const pendingHours = Math.max(0, totalPlannedHours - totalAllocatedHours);

  const fmtHours = (h: number) => `${Math.round(h).toLocaleString()} Hrs`;
  const fmtEuro = (v: number) => `€${Math.round(v).toLocaleString()}`;

  // Filtered & sorted projects for table
  const filteredProjects = projects
    .filter(p => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || p.client.toLowerCase().includes(q);
    })
    .sort((a, b) => (healthPriority[a.health] - healthPriority[b.health]) || (b.flags - a.flags));

  return (
    <div className="space-y-6">
      {/* TIER 1: ATTENTION REQUIRED PANEL */}
      <div
        className="rounded-xl p-6 relative transition-all hover:shadow-lg"
        style={{
          background: atRiskProjects.length > 0
            ? 'linear-gradient(180deg, #FEF2F2 0%, #FFFFFF 100%)'
            : 'linear-gradient(180deg, #F0FDF4 0%, #FFFFFF 100%)',
          border: atRiskProjects.length > 0 ? '1px solid #FCA5A5' : '1px solid #86EFAC',
          boxShadow: atRiskProjects.length > 0 ? '0 4px 12px rgba(239, 68, 68, 0.08)' : '0 4px 12px rgba(34, 197, 94, 0.08)'
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">{atRiskProjects.length > 0 ? '⚠️' : '✅'}</span>
          <h2 className="text-lg font-bold" style={{ color: atRiskProjects.length > 0 ? '#991B1B' : '#166534' }}>
            {atRiskProjects.length > 0 ? 'Attention Required' : 'All Projects On Track'}
          </h2>
          {atRiskProjects.length > 0 && (
            <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: '#FEF3C7', color: '#7C2D12' }}>
              {atRiskProjects.length} project{atRiskProjects.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-[#6B7280]" />
            <span className="ml-2 text-sm text-[#6B7280]">Loading projects...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-8 text-red-500">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span className="text-sm">{error}</span>
          </div>
        ) : atRiskProjects.length === 0 ? (
          <p className="text-sm text-[#166534]">
            All {totalProjects} projects are currently on track. No issues detected.
          </p>
        ) : (
          <>
            {/* Project Cards Grid */}
            <div className="grid grid-cols-3 gap-4">
              {visibleCards.map((project) => (
                <div
                  key={project.id}
                  className="bg-white rounded-lg p-4 cursor-pointer transition-all hover:scale-101"
                  style={{
                    border: `2px solid ${project.healthColor}`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    height: '108px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.healthColor }}></div>
                      <span className="text-xs font-bold" style={{ color: project.healthColor }}>{project.health}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-base">🚩</span>
                      <span className="text-base font-bold" style={{ color: '#991B1B' }}>{project.flags}</span>
                      <span className="text-xs text-[#6B7280]">active</span>
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-[#1F2937] mb-1 truncate">{project.name}</h3>
                  <div className="text-xs text-[#4B5563] space-y-0.5">
                    {project.issues.slice(0, 2).map((issue, i) => (
                      <p key={i} className="truncate">• {issue}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Compact List of Overflow Projects */}
            {overflowProjects.length > 0 && (
              <div className="mt-4">
                <div className="pt-3 mb-3">
                  <p className="text-xs uppercase font-bold text-[#6B7280]" style={{ letterSpacing: '0.05em' }}>
                    OTHER PROJECTS AT RISK ({overflowProjects.length})
                  </p>
                </div>
                <div className="space-y-0">
                  {overflowProjects.slice(0, 5).map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between py-2 px-1 hover:bg-[#F9FAFB] cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: '6px', color: '#6B7280' }}>●</span>
                        <span className="text-sm text-[#1F2937]">{project.name}</span>
                      </div>
                      <span className="text-xs text-[#6B7280]">{project.flags} active risks</span>
                    </div>
                  ))}
                </div>

                {/* View All Link */}
                <div className="text-center mt-4">
                  <button className="text-sm text-[#3B82F6] hover:text-[#2563EB] hover:underline transition-all">
                    View all {atRiskProjects.length} at-risk projects →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* TIER 2: PORTFOLIO STATS PANEL */}
      <div
        className="rounded-xl border transition-all"
        style={{
          backgroundColor: '#EFF6FF',
          borderColor: '#BFDBFE',
          height: statsExpanded ? '200px' : '48px',
          overflow: 'hidden'
        }}
      >
        {/* Collapsed Header */}
        <div className="flex items-center justify-between px-4" style={{ height: '48px' }}>
          <div className="text-sm text-[#1F2937] flex items-center gap-2">
            {statsExpanded ? (
              <span className="font-medium">Portfolio Summary</span>
            ) : (
              <>
                <span className="font-medium">{totalProjects} Projects:</span>
                {criticalCount > 0 && (
                  <>
                    <span className="font-bold" style={{ color: '#DC2626' }}>{criticalCount} Critical</span>
                    <span style={{ color: '#D1D5DB' }}>•</span>
                  </>
                )}
                {atRiskCount > 0 && (
                  <>
                    <span className="font-bold" style={{ color: '#F59E0B' }}>{atRiskCount} At Risk</span>
                    <span style={{ color: '#D1D5DB' }}>•</span>
                  </>
                )}
                <span className="font-bold" style={{ color: '#059669' }}>{onTrackCount} On Track</span>
                {completedCount > 0 && (
                  <>
                    <span style={{ color: '#D1D5DB' }}>•</span>
                    <span className="font-bold" style={{ color: '#3B82F6' }}>{completedCount} Completed</span>
                  </>
                )}
                <span style={{ color: '#D1D5DB' }}>•</span>
                <span>{fmtEuro(totalContractValue)}</span>
              </>
            )}
          </div>
          <button
            onClick={() => setStatsExpanded(!statsExpanded)}
            className="flex items-center gap-1 text-xs text-[#3B82F6] hover:text-[#2563EB]"
          >
            {statsExpanded ? 'Hide details' : 'Show details'}
            <ChevronDown className={`w-4 h-4 transition-transform ${statsExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Expanded Content */}
        {statsExpanded && (
          <div className="px-6 pb-6 grid grid-cols-4 gap-x-4 gap-y-5">
            {[
              { label: 'Total Contracted', value: fmtHours(totalPlannedHours) },
              { label: 'Total Consumed', value: fmtHours(totalSpentHours) },
              { label: 'Total Contract Value', value: fmtEuro(totalContractValue) },
              { label: 'Total Personnel Cost', value: 'N/A' },
              { label: 'Total Scheduled', value: fmtHours(totalAllocatedHours) },
              { label: 'Pending Scheduling', value: fmtHours(pendingHours) },
              { label: 'Total Expenditure', value: 'N/A' },
              { label: 'Total Budget', value: fmtEuro(totalContractValue) }
            ].map((metric, idx) => (
              <div key={idx}>
                <p className="text-xs uppercase text-[#6B7280] mb-1" style={{ letterSpacing: '0.05em' }}>{metric.label}</p>
                <p className="text-xl font-bold text-[#1F2937]">{metric.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TIER 3: ALL PROJECTS TABLE */}
      <div className="bg-white rounded-xl shadow-sm" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        {/* Table Header Bar */}
        <div className="bg-[#F9FAFB] border-b border-[#E5E7EB] px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#1F2937]">All Projects</h3>
              <span className="text-sm text-[#6B7280]">({filteredProjects.length})</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative" style={{ width: '320px' }}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                <input
                  type="text"
                  placeholder="Search projects, clients, or tags..."
                  className="w-full h-9 pl-10 pr-3 bg-white border border-[#D1D5DB] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Filter */}
              <select className="h-9 px-3 bg-white border border-[#D1D5DB] rounded-md text-sm">
                <option>Filter: All</option>
                <option>Critical</option>
                <option>At Risk</option>
                <option>On Track</option>
              </select>

              {/* Sort */}
              <select className="h-9 px-3 bg-white border border-[#D1D5DB] rounded-md text-sm">
                <option>Sort: Health</option>
                <option>Name (A-Z)</option>
                <option>Active Risks</option>
                <option>End Date</option>
              </select>

              {/* View Toggle */}
              <div className="inline-flex items-center gap-1 p-0.5 bg-[#F3F4F6] rounded-lg" style={{ height: '36px' }}>
                <button
                  onClick={() => setProjectView('comfortable')}
                  className={`w-8 h-8 flex items-center justify-center rounded transition-all ${
                    projectView === 'comfortable' ? 'bg-[#3B82F6] text-white shadow-sm' : 'text-[#6B7280] hover:bg-[#E5E7EB]'
                  }`}
                  title="Comfortable view (80px rows)"
                >
                  <AlignJustify className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setProjectView('compact')}
                  className={`w-8 h-8 flex items-center justify-center rounded transition-all ${
                    projectView === 'compact' ? 'bg-[#3B82F6] text-white shadow-sm' : 'text-[#6B7280] hover:bg-[#E5E7EB]'
                  }`}
                  title="Compact view (52px rows)"
                >
                  <Menu className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setProjectView('list')}
                  className={`w-8 h-8 flex items-center justify-center rounded transition-all ${
                    projectView === 'list' ? 'bg-[#3B82F6] text-white shadow-sm' : 'text-[#6B7280] hover:bg-[#E5E7EB]'
                  }`}
                  title="List view (40px rows)"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Add Project Button */}
              <button
                onClick={() => setShowWizard(true)}
                className="h-9 px-4 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-sm rounded-md transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add project
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto" style={{ maxHeight: '600px' }}>
          <table className="w-full">
            <thead className="sticky top-0 bg-[#F9FAFB] border-b-2 border-[#E5E7EB]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase text-[#6B7280]" style={{ letterSpacing: '0.05em', width: '80px' }}>Health</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase text-[#6B7280]" style={{ letterSpacing: '0.05em', width: '280px' }}>Project Name</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase text-[#6B7280]" style={{ letterSpacing: '0.05em', width: '140px' }}>Active Risks</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase text-[#6B7280]" style={{ letterSpacing: '0.05em', width: '180px' }}>Client</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase text-[#6B7280]" style={{ letterSpacing: '0.05em', width: '200px' }}>Timeline</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase text-[#6B7280]" style={{ letterSpacing: '0.05em', width: '140px' }}>Milestones</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase text-[#6B7280]" style={{ letterSpacing: '0.05em', width: '100px' }}>Team</th>
                <th className="px-6 py-3 text-right text-xs font-bold uppercase text-[#6B7280]" style={{ letterSpacing: '0.05em', width: '72px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-[#6B7280]" />
                      <span className="ml-2 text-sm text-[#6B7280]">Loading projects...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center text-red-500">
                      <AlertCircle className="w-5 h-5 mr-2" />
                      <span className="text-sm">{error}</span>
                    </div>
                  </td>
                </tr>
              ) : filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <p className="text-sm text-[#6B7280]">
                      {searchQuery ? 'No projects match your search.' : 'No projects found.'}
                    </p>
                  </td>
                </tr>
              ) : filteredProjects.map((project) => {
                const rowHeight = projectView === 'comfortable' ? '80px' : projectView === 'compact' ? '50px' : '36px';

                return (
                  <tr
                    key={project.id}
                    className="border-b border-[#F3F4F6] hover:bg-[#F9FAFB] cursor-pointer transition-all"
                    style={{
                      height: rowHeight,
                      borderLeft: project.health === 'Critical' || project.health === 'At Risk' ? `4px solid ${project.healthColor}` : 'none'
                    }}
                    onMouseEnter={() => setHoveredTableRow(project.id)}
                    onMouseLeave={() => setHoveredTableRow(null)}
                  >
                    {/* Health */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-start gap-1">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: project.healthColor }}></div>
                        {projectView === 'comfortable' && (
                          <span className="text-xs font-bold" style={{ color: project.healthColor }}>{project.health}</span>
                        )}
                      </div>
                    </td>

                    {/* Project Name */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <p className="text-sm font-bold text-[#1F2937] hover:text-[#3B82F6] truncate">{project.name}</p>
                        {projectView === 'comfortable' && (
                          <>
                            <p className="text-xs text-[#6B7280]">{project.code}</p>
                            {project.projectType && (
                              <div className="flex gap-1 mt-1">
                                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#E0E7FF', color: '#1F2937' }}>{project.projectType}</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </td>

                    {/* Active Risks */}
                    <td className="px-6 py-4">
                      {project.flags > 0 ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1">
                            <span className="text-base">🚩</span>
                            <span className="text-base font-bold" style={{ color: '#991B1B' }}>{project.flags}</span>
                            <span className="text-xs text-[#6B7280]">active</span>
                          </div>
                          {projectView === 'comfortable' && project.flagIssues.slice(0, 2).map((issue, i) => (
                            <p key={i} className="text-xs text-[#6B7280]">{issue}</p>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[#10B981]">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span className="text-xs">None</span>
                        </div>
                      )}
                    </td>

                    {/* Client */}
                    <td className="px-6 py-4">
                      <p className="text-sm text-[#1F2937] truncate">{project.client}</p>
                    </td>

                    {/* Timeline */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <p className="text-xs text-[#4B5563]">{project.timeline}</p>
                        {projectView === 'comfortable' && (
                          <>
                            <div className="w-full h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${project.progress}%`,
                                  backgroundColor: project.health === 'Critical' ? '#EF4444' : project.health === 'At Risk' ? '#F59E0B' : '#3B82F6'
                                }}
                              ></div>
                            </div>
                            <p className="text-xs" style={{ color: project.timeRemaining.includes('overdue') ? '#DC2626' : '#6B7280' }}>
                              {project.timeRemaining}
                            </p>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Milestones */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-[#6B7280]">—</span>
                    </td>

                    {/* Team */}
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {project.team.map((member, i) => (
                          <div
                            key={i}
                            className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs border-2 border-white"
                            style={{ marginLeft: i > 0 ? '-8px' : '0' }}
                          >
                            {member}
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="relative inline-block">
                        {hoveredTableRow === project.id ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#E5E7EB] text-[#6B7280] hover:text-[#1F2937] transition-all"
                              title="View Gantt (⌘G)"
                              onClick={(e) => { e.stopPropagation(); onOpenGantt?.(project.id); }}
                              style={{ animation: 'fadeIn 0.15s ease-out' }}
                            >
                              <BarChart3 className="w-4 h-4" />
                            </button>
                            <button
                              className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#E5E7EB] text-[#6B7280] hover:text-[#1F2937] transition-all"
                              title="View Board (⌘B)"
                              style={{ animation: 'fadeIn 0.15s ease-out 0.05s', animationFillMode: 'backwards' }}
                            >
                              <Trello className="w-4 h-4" />
                            </button>
                            <button
                              className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#E5E7EB] text-[#6B7280] hover:text-[#1F2937] transition-all"
                              title="View Financial (⌘F)"
                              style={{ animation: 'fadeIn 0.15s ease-out 0.1s', animationFillMode: 'backwards' }}
                            >
                              <DollarSign className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenActionMenu(openActionMenu === project.id ? null : project.id);
                              }}
                              className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#E5E7EB] text-[#6B7280] hover:text-[#1F2937] transition-all"
                              title="More actions"
                              style={{ animation: 'fadeIn 0.15s ease-out 0.15s', animationFillMode: 'backwards' }}
                            >
                              <MoreHorizontal className="w-5 h-5 rotate-90" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenActionMenu(openActionMenu === project.id ? null : project.id);
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#F3F4F6] text-[#6B7280] hover:text-[#1F2937] transition-all"
                          >
                            <MoreHorizontal className="w-5 h-5 rotate-90" />
                          </button>
                        )}

                        {openActionMenu === project.id && (
                          <div
                            className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-[#E5E7EB] py-2 z-50"
                            style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.15)' }}
                          >
                            {[
                              { label: 'Edit project', icon: '✏️' },
                              { label: 'Duplicate project', icon: '📄' },
                              { label: 'Unpublish project', icon: '🔒' },
                              { divider: true },
                              { label: 'Delete project', icon: '🗑️', danger: true }
                            ].map((item, i) =>
                              item.divider ? (
                                <div key={i} className="h-px bg-[#E5E7EB] my-1"></div>
                              ) : (
                                <button
                                  key={i}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-[#F3F4F6] flex items-center gap-2 transition-colors"
                                  style={{ color: item.danger ? '#DC2626' : '#1F2937' }}
                                >
                                  <span>{item.icon}</span>
                                  <span>{item.label}</span>
                                </button>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(4px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      {showWizard && (
        <ProjectWizardDialog
          mode="create"
          onClose={() => setShowWizard(false)}
        />
      )}
    </div>
  );
}
