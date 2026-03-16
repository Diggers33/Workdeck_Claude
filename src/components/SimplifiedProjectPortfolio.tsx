import React, { useState, useMemo } from 'react';
import { Search, Plus, BarChart3, MoreVertical, X, Loader2 } from 'lucide-react';
import { ProjectSummary } from '../services/dashboard-api';
import { useProjectsSummary } from '../hooks/useApiQueries';

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
  const timeline = startDate && endDate ? `${fmt(startDate)} — ${fmt(endDate)}` : '—';

  let statusText: string, status: string;
  if (p.status === 4) { statusText = 'Completed'; status = 'completed'; }
  else if (isOverdue) {
    const d = Math.ceil((now.getTime() - endDate!.getTime()) / 86400000);
    statusText = `${d}d overdue`; status = 'overdue';
  } else if (endDate) {
    const d = Math.ceil((endDate.getTime() - now.getTime()) / 86400000);
    statusText = `${d}d remaining`; status = d < 30 ? 'warning' : 'active';
  } else { statusText = 'No deadline'; status = 'active'; }

  const cats: string[] = [];
  if (isOverBudget) cats.push('Budget');
  if (isOverdue) cats.push('Schedule');
  if (alertCount > 0) cats.push(`Alerts (${alertCount})`);

  const issues: string[] = [];
  if (isOverBudget) issues.push(`Over budget by ${Math.round(spent - planned)}h`);
  if (isOverdue) issues.push(statusText);
  (p.alerts || []).forEach(a => issues.push(a.message));

  return {
    id: p.id, name: p.name, code: p.code || '—',
    tag: p.projectType?.name || 'Project',
    health, healthColor, flags: totalFlags,
    flagBreakdown: cats,
    issues, timeline, progress, status, statusText,
    _spent: spent, _planned: planned, _allocated: allocated, _contract: contract,
  };
}

export function SimplifiedProjectPortfolio() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statsOpen, setStatsOpen] = useState(false);
  const [openActionMenu, setOpenActionMenu] = useState<number | null>(null);
  const { data: rawProjects = [], isLoading: loading } = useProjectsSummary();
  const projects = useMemo(() => rawProjects.map(convertProject), [rawProjects]);

  const atRiskProjects = useMemo(() =>
    projects.filter(p => p.health === 'Critical' || p.health === 'At Risk').sort((a, b) => b.flags - a.flags).slice(0, 3),
    [projects]
  );
  const allAtRiskCount = useMemo(() => projects.filter(p => p.health === 'Critical' || p.health === 'At Risk').length, [projects]);
  const criticalCount = useMemo(() => projects.filter(p => p.health === 'Critical').length, [projects]);
  const atRiskCount = useMemo(() => projects.filter(p => p.health === 'At Risk').length, [projects]);
  const onTrackCount = useMemo(() => projects.filter(p => p.health === 'On Track').length, [projects]);

  const totalSpent = useMemo(() => projects.reduce((s, p) => s + p._spent, 0), [projects]);
  const totalPlanned = useMemo(() => projects.reduce((s, p) => s + p._planned, 0), [projects]);
  const totalAllocated = useMemo(() => projects.reduce((s, p) => s + p._allocated, 0), [projects]);
  const totalContract = useMemo(() => projects.reduce((s, p) => s + p._contract, 0), [projects]);
  const utilization = totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;
  const budgetUsed = totalContract > 0 ? Math.round((totalSpent / (totalContract / 100)) * 100) : 0;
  const projectedMargin = totalContract > 0 ? totalContract - (totalSpent * (totalContract / totalPlanned || 1)) : 0;

  const filteredProjects = useMemo(() => {
    if (!searchQuery) return projects;
    const q = searchQuery.toLowerCase();
    return projects.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      p.tag.toLowerCase().includes(q)
    );
  }, [projects, searchQuery]);

  return (
    <div className="min-h-screen bg-white">
      {/* COMPONENT 1: ATTENTION REQUIRED PANEL */}
      <div
        className="mx-6 my-6 rounded-xl p-6 relative transition-all"
        style={{
          background: 'linear-gradient(180deg, #FEF2F2 0%, #FFFFFF 100%)',
          border: '1px solid #FCA5A5',
          boxShadow: '0 2px 8px rgba(239, 68, 68, 0.06)',
          minHeight: '200px'
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-5">
          <span className="text-2xl">⚠️</span>
          <h2 className="text-lg font-bold" style={{ color: '#991B1B' }}>Attention Required</h2>
          {allAtRiskCount > 0 && (
            <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: '#FEF3C7', color: '#7C2D12' }}>
              {allAtRiskCount} project{allAtRiskCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Critical Project Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-[#6B7280]" />
          </div>
        ) : atRiskProjects.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm font-medium" style={{ color: '#16A34A' }}>All projects on track</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 mb-5">
            {atRiskProjects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-lg p-4 cursor-pointer transition-all"
                style={{
                  border: `2px solid ${project.healthColor}`,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                  height: '140px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.01)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.06)';
                }}
              >
                {/* Header Row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: project.healthColor }}></div>
                  <div className="flex items-center gap-1">
                    <span className="text-base">🚩</span>
                    <span className="text-lg font-bold" style={{ color: '#991B1B' }}>{project.flags}</span>
                    <span className="text-xs text-[#6B7280]">active</span>
                  </div>
                </div>

                {/* Project Name */}
                <h3 className="text-lg font-bold text-[#1F2937] mb-3 truncate" style={{ lineHeight: 1.2 }}>
                  {project.name}
                </h3>

                {/* Issues */}
                <div className="text-sm text-[#4B5563] space-y-1" style={{ lineHeight: 1.6 }}>
                  {project.issues.slice(0, 2).map((issue, i) => (
                    <p key={i} className="truncate">{issue}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Link */}
        {allAtRiskCount > 3 && (
          <div className="text-center">
            <button className="text-sm font-medium text-[#3B82F6] hover:text-[#2563EB] hover:underline transition-all">
              View all {allAtRiskCount} at-risk projects →
            </button>
          </div>
        )}
      </div>

      {/* COMPONENT 2: ALL PROJECTS TABLE */}
      <div className="mx-6 mb-6 bg-white rounded-xl" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        {/* Table Header Section */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#F3F4F6]">
          {/* Left: Title */}
          <div className="flex items-center gap-1">
            <h3 className="text-base font-semibold text-[#1F2937]">All Projects</h3>
            <span className="text-sm text-[#6B7280]">({projects.length})</span>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {/* Stats Button */}
            <button
              onClick={() => setStatsOpen(true)}
              className="h-9 px-4 bg-white border border-[#E5E7EB] rounded-md text-sm font-medium text-[#6B7280] hover:bg-[#F9FAFB] hover:border-[#D1D5DB] transition-all flex items-center gap-2"
              style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Stats
            </button>

            {/* Add Project Button */}
            <button
              className="h-9 px-4 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-sm font-medium rounded-md transition-all flex items-center gap-2"
              style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
            >
              <Plus className="w-4 h-4" />
              Add project
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-3 bg-[#F9FAFB] border-b border-[#E5E7EB]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search projects, clients, or tags..."
              className="w-full h-10 pl-11 pr-4 bg-white border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:ring-3 focus:ring-[#3B82F6] focus:ring-opacity-10 focus:border-[#3B82F6] transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Table Column Headers */}
        <div className="bg-[#F9FAFB] border-b-2 border-[#E5E7EB] px-6 py-3">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-1 text-xs font-semibold uppercase text-[#6B7280]" style={{ letterSpacing: '0.05em' }}>
              Health
            </div>
            <div className="col-span-4 text-xs font-semibold uppercase text-[#6B7280]" style={{ letterSpacing: '0.05em' }}>
              Project Name
            </div>
            <div className="col-span-2 text-xs font-semibold uppercase text-[#6B7280]" style={{ letterSpacing: '0.05em' }}>
              Active Risks
            </div>
            <div className="col-span-4 text-xs font-semibold uppercase text-[#6B7280]" style={{ letterSpacing: '0.05em' }}>
              Timeline
            </div>
            <div className="col-span-1 text-xs font-semibold uppercase text-[#6B7280] text-right" style={{ letterSpacing: '0.05em' }}>
              Actions
            </div>
          </div>
        </div>

        {/* Table Rows */}
        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#6B7280] mr-2" />
              <span style={{ fontSize: '13px', color: '#6B7280' }}>Loading projects...</span>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <p style={{ fontSize: '14px', color: '#6B7280' }}>
                {searchQuery ? 'No projects match your search' : 'No projects found'}
              </p>
            </div>
          ) : filteredProjects.map((project) => (
            <div
              key={project.id}
              className="px-6 py-4 border-b border-[#F3F4F6] hover:bg-[#F9FAFB] cursor-pointer transition-all"
              style={{
                height: '72px',
                borderLeft: project.health === 'Critical' || project.health === 'At Risk' ? `4px solid ${project.healthColor}` : 'none'
              }}
            >
              <div className="grid grid-cols-12 gap-4 items-center h-full">
                {/* Column 1: Health */}
                <div className="col-span-1">
                  <div className="flex flex-col items-start gap-1">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: project.healthColor }}></div>
                    <span className="text-xs font-semibold" style={{ color: project.healthColor }}>
                      {project.health}
                    </span>
                  </div>
                </div>

                {/* Column 2: Project Name */}
                <div className="col-span-4">
                  <p className="text-[15px] font-semibold text-[#1F2937] hover:text-[#3B82F6] truncate mb-1">
                    {project.name}
                  </p>
                  <p className="text-xs text-[#6B7280] mb-1.5">{project.code}</p>
                  <span
                    className="inline-block text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: '#DBEAFE', color: '#1E40AF' }}
                  >
                    {project.tag}
                  </span>
                </div>

                {/* Column 3: Active Risks */}
                <div className="col-span-2">
                  {project.flags > 0 ? (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        <span className="text-base">🚩</span>
                        <span className="text-base font-bold" style={{ color: '#991B1B' }}>{project.flags}</span>
                        <span className="text-xs text-[#6B7280]">active</span>
                      </div>
                      {project.flagBreakdown.slice(0, 2).map((item, i) => (
                        <p key={i} className="text-xs text-[#6B7280]">{item}</p>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className="text-base" style={{ color: '#10B981' }}>✓</span>
                      <span className="text-sm font-medium" style={{ color: '#10B981' }}>None</span>
                    </div>
                  )}
                </div>

                {/* Column 4: Timeline */}
                <div className="col-span-4">
                  <p className="text-xs font-medium text-[#4B5563] mb-1.5">{project.timeline}</p>
                  <div className="w-full h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden mb-1.5">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${project.progress}%`,
                        backgroundColor: project.status === 'overdue' ? '#EF4444' : project.health === 'At Risk' ? '#F59E0B' : '#3B82F6'
                      }}
                    ></div>
                  </div>
                  <p
                    className="text-xs"
                    style={{
                      color: project.status === 'overdue' ? '#DC2626' : '#6B7280',
                      fontWeight: project.status === 'overdue' ? 500 : 400
                    }}
                  >
                    {project.statusText}
                  </p>
                </div>

                {/* Column 5: Actions */}
                <div className="col-span-1 flex justify-end relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenActionMenu(openActionMenu === (project.id as any) ? null : (project.id as any));
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-[#F3F4F6] text-[#6B7280] transition-all"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>

                  {/* Action Menu Dropdown */}
                  {openActionMenu === (project.id as any) && (
                    <div
                      className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg border border-[#E5E7EB] py-2 z-50"
                      style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.15)' }}
                    >
                      {[
                        { label: 'View Gantt', icon: '📊' },
                        { label: 'View Board', icon: '📋' },
                        { label: 'View Financial', icon: '💰' },
                        { divider: true },
                        { label: 'Edit project', icon: '✏️' },
                        { label: 'Duplicate project', icon: '📄' },
                        { label: 'Unpublish project', icon: '🔒' },
                        { divider: true },
                        { label: 'Delete project', icon: '🗑️', danger: true }
                      ].map((item, i) =>
                        item.divider ? (
                          <div key={i} className="h-px bg-[#E5E7EB] my-2"></div>
                        ) : (
                          <button
                            key={i}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-[#F3F4F6] flex items-center gap-3 transition-colors"
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
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* COMPONENT 3: STATS OVERLAY */}
      {statsOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
          style={{ backdropFilter: 'blur(4px)' }}
          onClick={() => setStatsOpen(false)}
        >
          <div
            className="bg-white rounded-xl p-8 w-full max-w-md relative"
            style={{
              boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
              animation: 'fadeInScale 200ms ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setStatsOpen(false)}
              className="absolute top-8 right-8 w-6 h-6 flex items-center justify-center text-[#6B7280] hover:text-[#1F2937] transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Header */}
            <h2 className="text-xl font-bold text-[#1F2937] pb-4 border-b border-[#E5E7EB] mb-6">
              Portfolio Stats
            </h2>

            {/* Section 1: Project Health */}
            <div className="mb-6">
              <p className="text-xs uppercase font-bold text-[#6B7280] mb-3" style={{ letterSpacing: '0.05em' }}>
                PROJECT HEALTH
              </p>
              <div className="space-y-2">
                <p className="text-base text-[#1F2937]">{projects.length} Total Projects</p>
                <p className="text-base font-bold" style={{ color: '#DC2626' }}>{criticalCount} Critical</p>
                <p className="text-base font-bold" style={{ color: '#F59E0B' }}>{atRiskCount} At Risk</p>
                <p className="text-base font-bold" style={{ color: '#059669' }}>{onTrackCount} On Track</p>
              </div>
            </div>

            {/* Section 2: Utilization */}
            <div className="mb-6">
              <p className="text-xs uppercase font-bold text-[#6B7280] mb-3" style={{ letterSpacing: '0.05em' }}>
                UTILIZATION
              </p>
              <p className="text-base text-[#1F2937] mb-2">{utilization}% Utilized</p>
              <div className="w-full h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(utilization, 100)}%`,
                    backgroundColor: utilization > 100 ? '#F59E0B' : '#3B82F6'
                  }}
                ></div>
              </div>
            </div>

            {/* Section 3: Budget */}
            <div className="mb-6">
              <p className="text-xs uppercase font-bold text-[#6B7280] mb-3" style={{ letterSpacing: '0.05em' }}>
                BUDGET
              </p>
              <div className="space-y-2">
                <p className="text-base text-[#1F2937]">
                  {totalPlanned > 0 ? `${Math.round((totalSpent / totalPlanned) * 100)}%` : '0%'} Budget Used
                </p>
                <p className="text-base font-bold" style={{ color: projectedMargin > 0 ? '#059669' : '#DC2626' }}>
                  {totalContract > 0
                    ? `€${Math.abs(Math.round(projectedMargin / 1000))}K ${projectedMargin > 0 ? 'Projected Margin' : 'Projected Overrun'}`
                    : 'No contract data'}
                </p>
              </div>
            </div>

            {/* Footer Link */}
            <div className="text-center">
              <button className="text-sm font-medium text-[#3B82F6] hover:text-[#2563EB] hover:underline transition-all">
                View detailed report →
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
