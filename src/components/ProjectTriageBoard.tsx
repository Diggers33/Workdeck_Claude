import React, { useState, useMemo } from 'react';
import { Search, Plus, ChevronDown, MoreVertical, ArrowRight, Loader2, Upload } from 'lucide-react';
import { ProjectSummary } from '../services/dashboard-api';
import { useProjectsSummary, useProjectScopeCounts } from '../hooks/useApiQueries';
import { ProjectWizardDialog } from './ProjectWizardDialog';
import { GanttImportModal } from './GanttImportModal';

interface Project {
  id: string;
  name: string;
  code: string;
  client: string;
  flagCount: number;
  flagBg: string;
  flagColor: string;
  alertBreakdown: { label: string; count: number }[];
  status: string;
  statusBg: string;
  statusColor: string;
  pmName: string;
  pmInitials: string;
  pmColor: string;
  team: { initials: string; color: string }[];
  overflowCount: number;
  startDate: string;
  endDate: string;
  progress: number;
  progressColor: string;
  nextActivity: string;
  spentHours: string;
  plannedHours: string;
  // Additional Figma fields
  owner: string;
  badge: string;
  trend: string;
  trendColor: string;
  timeline: string;
  duration: string;
  statusText: string;
  activityIcon: string;
  activityTime: string;
  activityColor: string;
  activityWeight: number;
  teamCount: number;
}

export function ProjectTriageBoard({ onOpenGantt }: { onOpenGantt?: (projectId: string) => void }) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [hoveredAlert, setHoveredAlert] = useState<number | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [showGanttImport, setShowGanttImport] = useState(false);
  const [scopeDropdownOpen, setScopeDropdownOpen] = useState(false);
  const [selectedScope, setSelectedScope] = useState('Mine');
  const [searchQuery, setSearchQuery] = useState('');
  const formatDate = (dateStr: string | undefined): string => {
    if (!dateStr) return '';
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[parseInt(parts[1]) - 1]} ${parseInt(parts[0])}`;
    }
    return dateStr;
  };

  const getScopeFilter = (scope: string): string => {
    switch (scope) {
      case 'Mine': return 'all_my';
      case 'Team': return 'all_my_team';
      case 'Company': return 'all_my_company';
      default: return 'all_my';
    }
  };

  // --- Fetch data via TanStack Query ---
  const filter = getScopeFilter(selectedScope);
  // Only fetch scope counts when the dropdown is open (avoids 3 heavy API calls on mount)
  const { data: scopeCountsRaw } = useProjectScopeCounts(scopeDropdownOpen);
  const { data: rawProjects = [], isLoading } = useProjectsSummary(filter);

  // Derive scope counts: use loaded project count for active scope, lazy-loaded counts for others
  const scopeCounts = useMemo(() => {
    const activeCount = rawProjects.length;
    const base = scopeCountsRaw || { mine: 0, team: 0, company: 0 };
    return {
      mine: selectedScope === 'Mine' ? activeCount : base.mine,
      team: selectedScope === 'Team' ? activeCount : base.team,
      company: selectedScope === 'Company' ? activeCount : base.company,
    };
  }, [rawProjects.length, scopeCountsRaw, selectedScope]);

  const projects = useMemo(() => rawProjects.map((p: ProjectSummary) => {
    const spent = parseFloat(p.spentHours || '0');
    const planned = parseFloat(p.plannedHours || '0');
    const progress = planned > 0 ? Math.min(100, Math.round((spent / planned) * 100)) : 0;

    const alertCount = (p.alerts?.length || 0);
    const isOverBudget = planned > 0 && spent > planned;
    const isOverdue = p.endDate && new Date(p.endDate.split('/').reverse().join('-')) < new Date();
    const totalFlags = alertCount + (isOverBudget ? 1 : 0) + (isOverdue ? 1 : 0);

    let status = 'On Track';
    let statusBg = '#D1FAE5';
    let statusColor = '#059669';
    let statusText = 'On Track';
    let progressColor = '#10B981';

    if (p.status === 4) {
      status = 'Completed'; statusBg = '#DBEAFE'; statusColor = '#2563EB'; statusText = 'Completed'; progressColor = '#3B82F6';
    } else if (totalFlags > 2) {
      status = 'Critical'; statusBg = '#FEE2E2'; statusColor = '#DC2626'; statusText = 'Critical'; progressColor = '#EF4444';
    } else if (totalFlags > 0) {
      status = 'At Risk'; statusBg = '#FEF3C7'; statusColor = '#D97706'; statusText = 'At Risk'; progressColor = '#F59E0B';
    }

    const alertBreakdown: { label: string; count: number }[] = [];
    if (isOverdue) alertBreakdown.push({ label: 'Overdue', count: 1 });
    if (isOverBudget) alertBreakdown.push({ label: 'Over Budget', count: 1 });
    if (alertCount > 0) alertBreakdown.push({ label: 'Alerts', count: alertCount });

    const teamCount = (p as any).members?.length || 0;

    return {
      id: p.id,
      name: p.name,
      code: p.code || '',
      client: p.client?.name || 'Internal',
      flagCount: totalFlags,
      flagBg: totalFlags > 2 ? '#FEE2E2' : totalFlags > 0 ? '#FEF3C7' : '#F3F4F6',
      flagColor: totalFlags > 2 ? '#DC2626' : totalFlags > 0 ? '#D97706' : '#6B7280',
      alertBreakdown,
      status,
      statusBg,
      statusColor,
      pmName: (p as any).projectManager?.fullName || 'Unassigned',
      pmInitials: ((p as any).projectManager?.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase()) || '?',
      pmColor: '#3B82F6',
      team: [],
      overflowCount: 0,
      startDate: p.startDate || '',
      endDate: p.endDate || '',
      progress,
      progressColor,
      nextActivity: 'Next Activity',
      spentHours: p.spentHours || '0',
      plannedHours: p.plannedHours || '0',
      owner: (p as any).projectManager?.fullName || 'Unassigned',
      badge: status,
      trend: status,
      trendColor: statusColor,
      timeline: formatDate(p.endDate),
      duration: `${teamCount} Team Members`,
      statusText,
      activityIcon: '📅',
      activityTime: formatDate(p.endDate) || 'TBD',
      activityColor: statusColor,
      activityWeight: 500,
      teamCount
    };
  }), [rawProjects]);

  const handleProjectClick = (projectId: string) => {
    console.log(`Project clicked: ${projectId}`);
    if (onOpenGantt) {
      onOpenGantt(projectId);
    }
  };

  // Filter projects
  const filteredProjects = projects.filter(p => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!p.name.toLowerCase().includes(query) && 
          !p.code.toLowerCase().includes(query) &&
          !p.client.toLowerCase().includes(query)) {
        return false;
      }
    }
    
    // Status filter
    if (activeFilter === 'Urgent' && p.flagCount === 0) return false;
    if (activeFilter === 'Completed' && p.status !== 'Completed') return false;
    if (activeFilter === 'Active' && p.status === 'Completed') return false;
    
    return true;
  });

  // Calculate filter counts
  const filterCounts = {
    All: projects.length,
    Urgent: projects.filter(p => p.flagCount > 0).length,
    Active: projects.filter(p => p.status !== 'Completed').length,
    Completed: projects.filter(p => p.status === 'Completed').length
  };

  const menuItems = [
    { type: 'view', label: 'Project Board', icon: null, color: '#6B7280' },
    { type: 'view', label: 'Project Financial', icon: null, color: '#6B7280' },
    { type: 'separator' },
    { type: 'action', label: 'Edit project', icon: '✏️', color: '#0A0A0A' },
    { type: 'action', label: 'Duplicate project', icon: '📋', color: '#0A0A0A' },
    { type: 'action', label: 'Unpublish project', icon: '👁️', color: '#0A0A0A' },
    { type: 'action', label: 'Delete project', icon: '🗑️', color: '#DC2626' }
  ];

  return (
    <div style={{ width: '1200px', minHeight: '1400px', background: '#FAFBFC', margin: '0 auto', position: 'relative', padding: '16px' }}>
      {/* HEADER SECTION - 160px height */}
      <div style={{ 
        padding: '20px 40px 20px', 
        background: 'white',
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '16px'
      }}>
        {/* TOP BAR - 60px height */}
        <div className="flex items-center justify-between" style={{ height: '60px', position: 'relative' }}>
          {/* Search Bar */}
          <div className="relative" style={{ width: '320px' }}>
            <Search 
              style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                width: '16px',
                height: '16px',
                color: '#9CA3AF'
              }} 
            />
            <input
              type="text"
              placeholder="Search projects, tasks, or people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                height: '40px',
                paddingLeft: '40px',
                paddingRight: '12px',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#0A0A0A',
                outline: 'none',
                background: 'white'
              }}
            />
          </div>

          {/* Center - Scope Dropdown */}
          <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
            <button
              onClick={() => setScopeDropdownOpen(!scopeDropdownOpen)}
              style={{
                width: '160px',
                height: '40px',
                background: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '0 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#0A0A0A' }}>
                {selectedScope}
              </span>
              <ChevronDown style={{ width: '12px', height: '12px', color: '#6B7280' }} />
            </button>

            {/* Scope Dropdown Menu */}
            {scopeDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0" 
                  style={{ zIndex: 40 }}
                  onClick={() => setScopeDropdownOpen(false)}
                />
                
                <div
                  style={{
                    position: 'absolute',
                    top: '48px',
                    left: 0,
                    width: '220px',
                    background: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    padding: '8px',
                    zIndex: 50,
                    animation: 'menuSlideIn 200ms ease-out'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >

                  {/* Mine */}
                  <button
                    onClick={() => {
                      setSelectedScope('Mine');
                      setScopeDropdownOpen(false);
                    }}
                    style={{
                      width: '100%',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: selectedScope === 'Mine' ? '#EFF6FF' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      borderRadius: '6px',
                      transition: 'background 150ms ease'
                    }}
                    onMouseEnter={(e) => { if (selectedScope !== 'Mine') e.currentTarget.style.background = '#F9FAFB'; }}
                    onMouseLeave={(e) => { if (selectedScope !== 'Mine') e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div className="flex items-center" style={{ gap: '8px' }}>
                      {selectedScope === 'Mine' && (
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3B82F6' }} />
                      )}
                      <span style={{ fontSize: '14px', fontWeight: selectedScope === 'Mine' ? 500 : 400, color: selectedScope === 'Mine' ? '#0A0A0A' : '#6B7280' }}>
                        Mine
                      </span>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 400, color: selectedScope === 'Mine' ? '#6B7280' : '#9CA3AF' }}>
                      ({scopeCounts.mine})
                    </span>
                  </button>

                  {/* Team */}
                  <button
                    onClick={() => {
                      setSelectedScope('Team');
                      setScopeDropdownOpen(false);
                    }}
                    style={{
                      width: '100%',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: selectedScope === 'Team' ? '#EFF6FF' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      borderRadius: '6px',
                      transition: 'background 150ms ease'
                    }}
                    onMouseEnter={(e) => { if (selectedScope !== 'Team') e.currentTarget.style.background = '#F9FAFB'; }}
                    onMouseLeave={(e) => { if (selectedScope !== 'Team') e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div className="flex items-center" style={{ gap: '8px' }}>
                      {selectedScope === 'Team' && (
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3B82F6' }} />
                      )}
                      <span style={{ fontSize: '14px', fontWeight: selectedScope === 'Team' ? 500 : 400, color: selectedScope === 'Team' ? '#0A0A0A' : '#6B7280' }}>
                        Team
                      </span>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 400, color: selectedScope === 'Team' ? '#6B7280' : '#9CA3AF' }}>
                      ({scopeCounts.team})
                    </span>
                  </button>

                  {/* Company */}
                  <button
                    onClick={() => {
                      setSelectedScope('Company');
                      setScopeDropdownOpen(false);
                    }}
                    style={{
                      width: '100%',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: selectedScope === 'Company' ? '#EFF6FF' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      borderRadius: '6px',
                      transition: 'background 150ms ease'
                    }}
                    onMouseEnter={(e) => { if (selectedScope !== 'Company') e.currentTarget.style.background = '#F9FAFB'; }}
                    onMouseLeave={(e) => { if (selectedScope !== 'Company') e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div className="flex items-center" style={{ gap: '8px' }}>
                      {selectedScope === 'Company' && (
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3B82F6' }} />
                      )}
                      <span style={{ fontSize: '14px', fontWeight: selectedScope === 'Company' ? 500 : 400, color: selectedScope === 'Company' ? '#0A0A0A' : '#6B7280' }}>
                        Company
                      </span>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 400, color: selectedScope === 'Company' ? '#6B7280' : '#9CA3AF' }}>
                      ({scopeCounts.company})
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Import Gantt Button */}
          <button
            onClick={() => setShowGanttImport(true)}
            style={{
              height: '40px',
              padding: '0 16px',
              background: 'white',
              color: '#374151',
              fontSize: '14px',
              fontWeight: 500,
              borderRadius: '8px',
              border: '1px solid #D1D5DB',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Upload style={{ width: '15px', height: '15px' }} />
            Import Gantt
          </button>

          {/* New Project Button */}
          <button
            onClick={() => setShowWizard(true)}
            style={{
              width: '140px',
              height: '40px',
              background: '#60A5FA',
              color: 'white',
              fontSize: '14px',
              fontWeight: 500,
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Plus style={{ width: '16px', height: '16px' }} />
            New Project
          </button>
        </div>

        {/* CONTEXT LINE */}
        <div className="flex items-center justify-between" style={{ marginTop: '12px', padding: '0 20px' }}>
          <div style={{ fontSize: '14px', fontWeight: 400, color: '#6B7280' }}>
            Showing: {selectedScope === 'All' ? 'All Projects' : selectedScope + ' Projects'} ({filteredProjects.length})
          </div>
          <div style={{ fontSize: '14px', fontWeight: 400, color: '#6B7280' }}>
            {filterCounts.Active} Active Projects
          </div>
        </div>

        {/* FILTER CHIPS ROW */}
        <div className="flex items-center" style={{ gap: '8px', marginTop: '12px', marginBottom: '24px' }}>
          {[
            { label: 'All', count: filterCounts.All },
            { label: 'Urgent', count: filterCounts.Urgent },
            { label: 'Active', count: filterCounts.Active },
            { label: 'Completed', count: filterCounts.Completed }
          ].map((filter) => {
            const isActive = activeFilter === filter.label;
            return (
            <button
              key={filter.label}
              onClick={() => setActiveFilter(filter.label)}
              style={{
                height: '36px',
                padding: '0 16px',
                borderRadius: '18px',
                border: isActive ? 'none' : '1px solid #E5E7EB',
                background: isActive ? '#60A5FA' : 'white',
                color: isActive ? 'white' : '#6B7280',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap'
              }}
            >
              {filter.label}
              <span
                style={{
                  background: isActive ? 'rgba(255,255,255,0.3)' : '#F3F4F6',
                  color: isActive ? 'white' : '#6B7280',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 600,
                  minWidth: '20px',
                  textAlign: 'center'
                }}
              >
                {filter.count}
              </span>
            </button>
          )})}
          
          <button
            style={{
              height: '36px',
              padding: '0 16px',
              borderRadius: '18px',
              border: '1px solid #E5E7EB',
              background: 'white',
              color: '#6B7280',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            By Client
            <ChevronDown style={{ width: '12px', height: '12px' }} />
          </button>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div style={{
        background: 'white',
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        {/* TABLE HEADER - 48px height */}
        <div
          style={{
            height: '48px',
            background: '#F9FAFB',
            display: 'grid',
            gridTemplateColumns: '60px 400px 280px 220px 160px',
            alignItems: 'center',
            padding: '0 40px'
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 500, color: '#6B7280', letterSpacing: '0.5px', textTransform: 'uppercase' }}>ALERT</div>
          <div style={{ fontSize: '11px', fontWeight: 500, color: '#6B7280', letterSpacing: '0.5px', textTransform: 'uppercase' }}>PROJECT CONTEXT</div>
          <div style={{ fontSize: '11px', fontWeight: 500, color: '#6B7280', letterSpacing: '0.5px', textTransform: 'uppercase' }}>TIMELINE & PROGRESS</div>
          <div style={{ fontSize: '11px', fontWeight: 500, color: '#6B7280', letterSpacing: '0.5px', textTransform: 'uppercase' }}>NEXT ACTIVITY</div>
          <div style={{ fontSize: '11px', fontWeight: 500, color: '#6B7280', letterSpacing: '0.5px', textTransform: 'uppercase', textAlign: 'right' }}>ACTION</div>
        </div>

        {/* PROJECT ROWS */}
        {isLoading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <Loader2 style={{ width: '32px', height: '32px', color: '#60A5FA', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ color: '#6B7280', fontSize: '14px' }}>Loading projects...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <p style={{ color: '#6B7280', fontSize: '14px' }}>No projects found</p>
          </div>
        ) : filteredProjects.map((project, idx) => (
          <div
            key={project.id}
            onClick={() => handleProjectClick(project.id)}
            onMouseEnter={() => setHoveredRow(idx)}
            onMouseLeave={() => setHoveredRow(null)}
            style={{
              minHeight: '88px',
              display: 'grid',
              gridTemplateColumns: '60px 400px 280px 220px 160px',
              alignItems: 'start',
              padding: '20px 40px',
              borderBottom: '1px solid #F3F4F6',
              background: hoveredRow === idx ? '#FAFAFA' : 'white',
              boxShadow: hoveredRow === idx ? '0 2px 12px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 200ms ease',
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            {/* COLUMN 1: ALERT ZONE */}
            <div className="flex flex-col items-center justify-center" style={{ gap: '8px', position: 'relative' }}>
              {project.flagCount > 0 && (
                <>
                  <div
                    onMouseEnter={() => setHoveredAlert(idx)}
                    onMouseLeave={() => setHoveredAlert(null)}
                    style={{ 
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: project.flagBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      fontWeight: 700,
                      color: project.flagColor,
                      transition: 'transform 150ms ease',
                      transform: hoveredAlert === idx ? 'scale(1.05)' : 'scale(1)'
                    }}
                  >
                    {project.flagCount}
                  </div>

                  {/* Alert Breakdown Tooltip */}
                  {hoveredAlert === idx && project.alertBreakdown.length > 0 && (
                    <div
                      style={{ 
                        position: 'absolute',
                        top: '46px',
                        left: '50%',
                        marginLeft: '-100px',
                        width: '200px',
                        background: 'white',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                        padding: '12px',
                        zIndex: 100,
                        animation: 'tooltipFadeIn 150ms ease-out',
                        pointerEvents: 'none'
                      }}
                    >
                      {/* Title */}
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#0A0A0A', marginBottom: '8px' }}>
                        Alert Breakdown
                      </div>
                      
                      {/* Breakdown Items */}
                      {project.alertBreakdown.map((item, itemIdx) => (
                        <div
                          key={itemIdx}
                          className="flex items-center justify-between"
                          style={{ 
                            padding: '4px 0',
                            borderBottom: itemIdx < project.alertBreakdown.length - 1 ? '1px solid #F3F4F6' : 'none'
                          }}
                        >
                          <span style={{ fontSize: '13px', color: '#6B7280' }}>
                            {item.label}
                          </span>
                          <span
                            style={{ 
                              fontSize: '13px',
                              fontWeight: 600,
                              color: '#0A0A0A',
                              minWidth: '20px',
                              textAlign: 'right'
                            }}
                          >
                            {item.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* COLUMN 2: PROJECT CONTEXT */}
            <div style={{ paddingLeft: '20px' }}>
              <div className="flex flex-col" style={{ gap: '4px' }}>
                {/* Line 1: Name + Status Badge */}
                <div className="flex items-center" style={{ gap: '8px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 600, color: '#0A0A0A' }}>
                    {project.name}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: project.statusColor }}>
                    {project.status}
                  </span>
                </div>

                {/* Line 2: Client + Team Members */}
                <div style={{ fontSize: '14px', fontWeight: 400, color: '#6B7280' }}>
                  {project.client} • {project.teamCount} Team Members
                </div>

                {/* Line 3: Status Badge */}
                <div>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      background: '#F3F4F6',
                      color: '#6B7280',
                      fontSize: '11px',
                      fontWeight: 500,
                      borderRadius: '10px'
                    }}
                  >
                    {project.status}
                  </span>
                </div>
              </div>
            </div>

            {/* COLUMN 3: TIMELINE & PROGRESS */}
            <div style={{ paddingLeft: '0' }}>
              <div className="flex flex-col" style={{ gap: '4px' }}>
                {/* Line 1: Date Range */}
                <div style={{ fontSize: '14px', fontVariantNumeric: 'tabular-nums', color: '#6B7280' }}>
                  {project.timeline} • {project.duration}
                </div>

                {/* Line 2: Progress Bar */}
                <div style={{ width: '100%', maxWidth: '260px', height: '4px', background: '#F0F0F0', borderRadius: '2px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${project.progress}%`,
                      background: project.progressColor,
                      borderRadius: '2px',
                      transition: 'width 1s ease-out'
                    }}
                  />
                </div>

                {/* Line 3: Status Text */}
                <div style={{ fontSize: '13px', fontWeight: 500, color: project.statusColor }}>
                  {project.statusText}
                </div>
              </div>
            </div>

            {/* COLUMN 4: NEXT ACTIVITY */}
            <div style={{ paddingLeft: '20px' }}>
              <div className="flex flex-col" style={{ gap: '4px' }}>
                {/* Line 1: Activity Name */}
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#0A0A0A' }}>
                  {project.nextActivity}
                </div>

                {/* Line 2: Time with Icon */}
                <div style={{ fontSize: '13px', fontWeight: project.activityWeight, color: project.activityColor }}>
                  <span style={{ marginRight: '4px', fontSize: '14px' }}>{project.activityIcon}</span>
                  {project.activityTime}
                </div>
              </div>
            </div>

            {/* COLUMN 5: ACTIONS */}
            <div className="flex items-center justify-end" style={{ gap: '12px', paddingRight: '20px' }}>
              {/* Three-dot Menu */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenu(openMenu === idx ? null : idx);
                }}
                style={{
                  width: '32px',
                  height: '32px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  background: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#9CA3AF',
                  position: 'relative'
                }}
              >
                <MoreVertical style={{ width: '16px', height: '16px' }} />
              </button>

              {/* Arrow or Gantt Button */}
              {hoveredRow === idx ? (
                <button
                  onClick={() => onOpenGantt && onOpenGantt(project.id)}
                  style={{
                    width: '90px',
                    height: '32px',
                    background: '#60A5FA',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    animation: 'slideIn 200ms ease-out'
                  }}
                >
                  Gantt
                  <ArrowRight style={{ width: '14px', height: '14px' }} />
                </button>
              ) : (
                <ArrowRight style={{ width: '16px', height: '16px', color: '#9CA3AF' }} />
              )}
            </div>

            {/* THREE-DOT MENU DROPDOWN */}
            {openMenu === idx && (
              <>
                <div 
                  className="fixed inset-0" 
                  style={{ zIndex: 40 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenu(null);
                  }}
                />
                
                <div
                  style={{
                    position: 'absolute',
                    top: '60px',
                    right: '60px',
                    width: '200px',
                    background: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                    padding: '8px',
                    zIndex: 50,
                    animation: 'menuSlideIn 200ms ease-out'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {menuItems.map((item, itemIdx) => {
                    if (item.type === 'separator') {
                      return (
                        <div 
                          key={`sep-${itemIdx}`}
                          style={{ 
                            height: '1px', 
                            background: '#E5E7EB', 
                            margin: '4px 0' 
                          }} 
                        />
                      );
                    }

                    return (
                      <button
                        key={itemIdx}
                        style={{
                          width: '100%',
                          height: '36px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: 400,
                          color: item.color,
                          borderRadius: '4px',
                          transition: 'background 150ms ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <div className="flex items-center" style={{ gap: '8px' }}>
                          {item.icon && (
                            <span style={{ fontSize: '16px', lineHeight: 1 }}>{item.icon}</span>
                          )}
                          {item.label}
                        </div>
                        {item.type === 'view' && (
                          <ArrowRight style={{ width: '16px', height: '16px', color: '#9CA3AF' }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.8;
            transform: scale(1.0);
          }
          50% {
            opacity: 1.0;
            transform: scale(1.2);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes menuSlideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes tooltipFadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {showWizard && (
        <ProjectWizardDialog
          mode="create"
          onClose={() => setShowWizard(false)}
        />
      )}

      {showGanttImport && (
        <GanttImportModal
          onClose={() => setShowGanttImport(false)}
          onProjectCreated={() => setShowGanttImport(false)}
        />
      )}
    </div>
  );
}