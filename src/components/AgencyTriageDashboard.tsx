import React, { useState, useEffect } from 'react';
import { ArrowRight, X, MoreVertical, ChevronRight, Clock, DollarSign, Users, AlertTriangle, ChevronDown } from 'lucide-react';

export function AgencyTriageDashboard() {
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [hoveredFlag, setHoveredFlag] = useState<number | null>(null);

  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 100);
  }, []);

  // Project data with agency-specific fields
  const projects: any[] = [];

  // Sort projects by priority
  const sortedProjects = [...projects].sort((a, b) => {
    const priorityOrder = { urgent: 0, soon: 1, watch: 2, healthy: 3 };
    const priorityDiff = priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
    if (priorityDiff !== 0) return priorityDiff;
    
    // Within same priority, sort by progress (behind first)
    return a.progress - b.progress;
  });

  // Filter counts
  const urgentCount = projects.filter(p => p.priority === 'urgent').length;
  const dueThisWeekCount = projects.filter(p => p.showCritical).length;
  const overdueCount = projects.filter(p => p.progressStatus === 'critical').length;
  const blockedCount = projects.filter(p => p.flags > 5).length;
  const needsAttentionCount = projects.filter(p => p.priority === 'urgent' || p.priority === 'soon').length;

  const getTrendArrow = (trend: string) => {
    if (trend === 'up') return '↗';
    if (trend === 'down') return '↘';
    return '→';
  };

  const getIssueLabel = (issueType: string | null) => {
    if (!issueType) return null;
    const labels = {
      timeline: 'Timeline',
      budget: 'Budget',
      resource: 'Resource',
      multiple: 'Multiple'
    };
    return labels[issueType as keyof typeof labels];
  };

  return (
    <div className="min-h-screen bg-white">
      {/* HEADER: Title + Smart Filters */}
      <div className="mx-auto" style={{ width: '900px', paddingTop: '64px', marginBottom: '40px' }}>
        {/* Title */}
        <h1 
          className="mb-8"
          style={{ 
            fontSize: '48px', 
            fontWeight: 200, 
            color: '#0A0A0A',
            letterSpacing: '-0.02em',
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? 'translateY(0)' : 'translateY(-10px)',
            transition: 'all 400ms ease-out'
          }}
        >
          Project Portfolio
        </h1>

        {/* Quick Filter Chips */}
        <div 
          className="flex items-center gap-2 mb-6"
          style={{
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? 'translateY(0)' : 'translateY(-10px)',
            transition: 'all 400ms ease-out 100ms'
          }}
        >
          {[
            { label: 'All', count: null },
            { label: 'Urgent', count: urgentCount },
            { label: 'Due this week', count: dueThisWeekCount },
            { label: 'Overdue', count: overdueCount },
            { label: 'Blocked', count: blockedCount }
          ].map((filter) => (
            <button
              key={filter.label}
              onClick={() => setActiveFilter(filter.label)}
              className="transition-all"
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: '1px solid #E5E7EB',
                background: activeFilter === filter.label ? '#3B82F6' : 'white',
                color: activeFilter === filter.label ? 'white' : '#6B7280',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                if (activeFilter !== filter.label) {
                  e.currentTarget.style.background = '#F9FAFB';
                }
              }}
              onMouseLeave={(e) => {
                if (activeFilter !== filter.label) {
                  e.currentTarget.style.background = 'white';
                }
              }}
            >
              {filter.label} {filter.count !== null && `(${filter.count})`}
            </button>
          ))}
          
          {/* By Client Dropdown */}
          <button
            className="transition-all flex items-center gap-2"
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: '1px solid #E5E7EB',
              background: 'white',
              color: '#6B7280',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
          >
            By client
            <ChevronDown style={{ width: '14px', height: '14px' }} />
          </button>
        </div>

        {/* Status Line */}
        {needsAttentionCount > 0 && (
          <div 
            className="mb-6"
            style={{
              fontSize: '14px',
              fontWeight: 400,
              color: '#6B7280',
              opacity: isLoaded ? 1 : 0,
              transition: 'all 400ms ease-out 200ms'
            }}
          >
            {needsAttentionCount} project{needsAttentionCount > 1 ? 's' : ''} need attention
          </div>
        )}
      </div>

      {/* PROJECT LIST */}
      <div className="mx-auto" style={{ width: '900px', marginBottom: '64px' }}>
        <div>
          {sortedProjects.map((project, idx) => (
            <div
              key={idx}
              className="cursor-pointer transition-all relative"
              style={{
                display: 'grid',
                gridTemplateColumns: '60px 400px 280px 160px',
                height: '88px',
                padding: '20px 0',
                borderBottom: '1px solid rgba(0,0,0,0.06)',
                background: hoveredRow === idx ? '#FAFAFA' : 'white',
                alignItems: 'center',
                opacity: isLoaded ? 1 : 0,
                transform: isLoaded ? 'translateX(0)' : 'translateX(-20px)',
                transition: `all 400ms ease-out ${400 + idx * 80}ms`,
                boxShadow: hoveredRow === idx ? '0 2px 8px rgba(0,0,0,0.04)' : 'none'
              }}
              onMouseEnter={() => setHoveredRow(idx)}
              onMouseLeave={() => setHoveredRow(null)}
              onClick={() => setSelectedProject(idx)}
            >
              {/* SECTION 1: ALERT ZONE (60px) */}
              <div className="flex flex-col items-center justify-start" style={{ paddingTop: '4px', gap: '8px' }}>
                {/* Priority Dot */}
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: project.priorityColor,
                    boxShadow: project.priority === 'urgent' ? `0 0 8px ${project.priorityColor}50` : 'none',
                    animation: project.priority === 'urgent' ? 'pulse 2s infinite' : 'none'
                  }}
                />
                
                {/* Issue Icon */}
                {project.issueIcon && (
                  <div style={{ color: project.priorityColor }}>
                    <project.issueIcon style={{ width: '16px', height: '16px' }} />
                  </div>
                )}
              </div>

              {/* SECTION 2: PROJECT INFO (400px) */}
              <div className="flex flex-col" style={{ gap: '4px' }}>
                {/* Line 1: Project Name + Trend */}
                <div className="flex items-center gap-2">
                  <h3 
                    style={{ 
                      fontSize: '16px', 
                      fontWeight: 600, 
                      color: '#0A0A0A',
                      lineHeight: 1.3,
                      maxWidth: '340px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {project.name}
                  </h3>
                  <span style={{ fontSize: '14px', color: project.trendColor }}>
                    {getTrendArrow(project.trend)}
                  </span>
                </div>

                {/* Line 2: Client + Owner */}
                <div style={{ fontSize: '14px', fontWeight: 400, color: '#6B7280' }}>
                  {project.client} • <span style={{ fontWeight: 500, color: '#9CA3AF' }}>{project.owner}</span>
                </div>

                {/* Line 3: Project Type Badge */}
                <div>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      background: '#F3F4F6',
                      color: '#6B7280',
                      fontSize: '11px',
                      fontWeight: 500,
                      borderRadius: '10px',
                      maxWidth: '100px'
                    }}
                  >
                    {project.projectType}
                  </span>
                </div>
              </div>

              {/* SECTION 3: TIMELINE ZONE (280px) */}
              <div className="flex flex-col" style={{ gap: '5px' }}>
                {/* Line 1: Date Range + Duration */}
                <div style={{ fontSize: '13px', fontVariantNumeric: 'tabular-nums', color: '#9CA3AF', letterSpacing: '0.02em' }}>
                  {project.timeline} • {project.duration}
                </div>

                {/* Line 2: Progress Bar */}
                <div style={{ width: '100%', height: '6px', background: '#F0F0F0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${project.progress}%`,
                      background: project.progressColor,
                      borderRadius: '3px',
                      transition: 'width 1s ease-out'
                    }}
                  />
                </div>

                {/* Line 3: Progress % + Days Overdue + Action Badge */}
                <div className="flex items-center justify-between">
                  <div style={{ fontSize: '13px', fontWeight: 600, color: project.progressColor }}>
                    {project.progress}%{project.daysOverdue > 0 ? ` • ${project.daysOverdue}${project.overdueSuffix}` : ` • ${project.statusText}`}
                  </div>
                  {(project.priority === 'urgent' || project.priority === 'soon') && (
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        color: '#DC2626',
                        letterSpacing: '0.05em',
                        padding: '2px 6px',
                        background: '#FEE2E2',
                        borderRadius: '4px'
                      }}
                    >
                      ACTION REQ
                    </span>
                  )}
                </div>
              </div>

              {/* SECTION 4: ACTIONS (160px) */}
              <div className="flex items-center justify-end gap-3">
                {/* Flag Count */}
                {project.flags > 0 && (
                  <div
                    className="relative"
                    onMouseEnter={() => setHoveredFlag(idx)}
                    onMouseLeave={() => setHoveredFlag(null)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: project.priority === 'urgent' ? '#FEE2E2' : '#FED7AA',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        fontWeight: 700,
                        color: project.priority === 'urgent' ? '#DC2626' : '#F97316',
                        cursor: 'pointer'
                      }}
                    >
                      {project.flags}
                    </div>

                    {/* Flag Breakdown Tooltip */}
                    {hoveredFlag === idx && (
                      <div
                        className="absolute"
                        style={{
                          bottom: '40px',
                          right: '0',
                          width: '240px',
                          background: 'white',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          borderRadius: '8px',
                          padding: '16px',
                          zIndex: 100,
                          animation: 'fadeIn 200ms ease-out'
                        }}
                      >
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#1F2937', marginBottom: '12px' }}>
                          Active Issues ({project.flags})
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                          {project.flagBreakdown.budget > 0 && (
                            <div style={{ fontSize: '13px', color: '#6B7280' }}>
                              Budget: {project.flagBreakdown.budget} issues
                            </div>
                          )}
                          {project.flagBreakdown.timeline > 0 && (
                            <div style={{ fontSize: '13px', color: '#6B7280' }}>
                              Timeline: {project.flagBreakdown.timeline} issues
                            </div>
                          )}
                          {project.flagBreakdown.resources > 0 && (
                            <div style={{ fontSize: '13px', color: '#6B7280' }}>
                              Resources: {project.flagBreakdown.resources} issues
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: '#3B82F6', cursor: 'pointer' }}>
                          View in Gantt →
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Three-dot Menu */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuIndex(openMenuIndex === idx ? null : idx);
                  }}
                  className="transition-all"
                  style={{
                    width: '32px',
                    height: '32px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    background: openMenuIndex === idx ? '#F9FAFB' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#9CA3AF'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                  onMouseLeave={(e) => {
                    if (openMenuIndex !== idx) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <MoreVertical style={{ width: '16px', height: '16px' }} />
                </button>

                {/* Open Gantt Button (on hover) */}
                {hoveredRow === idx && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Open Gantt
                    }}
                    style={{
                      width: '80px',
                      height: '32px',
                      background: '#3B82F6',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: 500,
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      animation: 'slideInRight 200ms ease-out',
                      position: 'absolute',
                      right: '0'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#2563EB'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#3B82F6'}
                  >
                    Gantt <ArrowRight style={{ width: '14px', height: '14px' }} />
                  </button>
                )}

                {/* Last Activity (bottom right) */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '8px',
                    fontSize: '10px',
                    color: '#D1D5DB'
                  }}
                >
                  {project.lastActivity}
                </div>
              </div>

              {/* THREE-DOT MENU DROPDOWN */}
              {openMenuIndex === idx && (
                <>
                  <div 
                    className="fixed inset-0" 
                    style={{ zIndex: 40 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuIndex(null);
                    }}
                  />
                  
                  <div
                    className="absolute bg-white"
                    style={{
                      top: '60px',
                      right: '0',
                      width: '200px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                      borderRadius: '8px',
                      zIndex: 50,
                      animation: 'menuSlideIn 200ms ease-out',
                      overflow: 'hidden'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button className="w-full transition-colors" style={{ ...menuItemStyle, color: '#3B82F6', fontWeight: 600 }}>
                      Open Gantt
                    </button>
                    <button className="w-full transition-colors" style={menuItemStyle}>
                      Quick status update
                    </button>
                    <button className="w-full transition-colors" style={menuItemStyle}>
                      Mark as reviewed
                    </button>
                    <div style={{ height: '1px', background: '#F0F0F0', margin: '4px 0' }} />
                    <button className="w-full transition-colors" style={menuItemStyle}>
                      Email client
                    </button>
                    <button className="w-full transition-colors" style={menuItemStyle}>
                      Schedule meeting
                    </button>
                    <button className="w-full transition-colors" style={menuItemStyle}>
                      View team
                    </button>
                    <div style={{ height: '1px', background: '#F0F0F0', margin: '4px 0' }} />
                    <button className="w-full transition-colors" style={menuItemStyle}>
                      Project settings
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
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
      `}</style>
    </div>
  );
}

const menuItemStyle = {
  display: 'flex',
  alignItems: 'center',
  padding: '12px 16px',
  background: 'white',
  border: 'none',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: 400,
  color: '#1F2937',
  textAlign: 'left' as const,
  height: '36px'
};