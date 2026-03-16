import React, { useState, useEffect } from 'react';
import { ArrowRight, X, MoreVertical, ChevronRight, Edit, Copy, Power, Trash2 } from 'lucide-react';

export function MinimalistProjectPortfolio() {
  const [metricsExpanded, setMetricsExpanded] = useState(false);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [healthCardExpanded, setHealthCardExpanded] = useState(false);

  useEffect(() => {
    // Trigger load animation
    setTimeout(() => setIsLoaded(true), 100);
  }, []);

  // Project data
  const projects: any[] = [];

  // Sort projects by priority
  const sortedProjects = [...projects].sort((a, b) => {
    // First by status (red > orange > grey)
    const statusOrder = { '#EF4444': 0, '#F97316': 1, '#D1D5DB': 2 };
    const statusDiff = statusOrder[a.statusColor as keyof typeof statusOrder] - statusOrder[b.statusColor as keyof typeof statusOrder];
    if (statusDiff !== 0) return statusDiff;
    
    // Then by flag count (highest first)
    const flagDiff = b.flags - a.flags;
    if (flagDiff !== 0) return flagDiff;
    
    // Then alphabetically
    return a.name.localeCompare(b.name);
  });

  const projectsNeedingAttention = projects.filter(p => p.needsAttention).length;
  const totalProjects = projects.length;
  const totalFlags = projects.reduce((sum, p) => sum + p.flags, 0);
  const projectsWithFlags = projects.filter(p => p.flags > 0).length;
  const behindSchedule = projects.filter(p => p.timelineStatus.includes('behind')).length;

  return (
    <div className="min-h-screen bg-white">
      {/* COMPONENT 1: PORTFOLIO SUMMARY */}
      <div className="mx-auto" style={{ width: '800px', paddingTop: '64px', marginBottom: '80px' }}>
        {/* Title */}
        <h1 
          className="text-center"
          style={{ 
            fontSize: '48px', 
            fontWeight: 200, 
            color: '#0A0A0A',
            letterSpacing: '-0.02em',
            marginBottom: '60px',
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? 'translateY(0)' : 'translateY(-10px)',
            transition: 'all 400ms ease-out'
          }}
        >
          Your Portfolio
        </h1>

        {/* SIGNATURE: HEALTH SCORE CARD */}
        <div 
          className="mx-auto transition-all"
          onClick={() => setHealthCardExpanded(!healthCardExpanded)}
          style={{
            width: '280px',
            height: healthCardExpanded ? '240px' : '140px',
            background: 'linear-gradient(135deg, #FFFFFF 0%, #FAFAFA 100%)',
            border: '1px solid #E5E7EB',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
            padding: '28px',
            cursor: 'pointer',
            position: 'relative',
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
            transition: 'all 400ms ease-out 200ms',
            marginBottom: '40px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 12px 48px rgba(0,0,0,0.10)';
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.06)';
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
          }}
        >
          {/* Health Score */}
          <div className="flex items-baseline" style={{ marginBottom: '8px' }}>
            <span style={{ fontSize: '48px', fontWeight: 600, color: '#000000', fontVariantNumeric: 'tabular-nums' }}>
              80
            </span>
            <span style={{ fontSize: '24px', fontWeight: 400, color: '#9CA3AF' }}>
              /100
            </span>
          </div>

          {/* Label */}
          <div 
            className="uppercase"
            style={{ 
              fontSize: '11px', 
              fontWeight: 500, 
              color: '#9CA3AF',
              letterSpacing: '0.12em',
              marginBottom: '16px'
            }}
          >
            PORTFOLIO HEALTH
          </div>

          {/* Summary Lines */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div 
                style={{ 
                  width: '6px', 
                  height: '6px', 
                  borderRadius: '50%', 
                  background: '#EF4444',
                  boxShadow: '0 0 8px rgba(239,68,68,0.3)'
                }}
              />
              <span style={{ fontSize: '15px', fontWeight: 400, color: '#6B7280' }}>
                {projectsNeedingAttention} need attention
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div 
                style={{ 
                  width: '6px', 
                  height: '6px', 
                  borderRadius: '50%', 
                  background: '#D1D5DB'
                }}
              />
              <span style={{ fontSize: '15px', fontWeight: 400, color: '#6B7280' }}>
                {totalProjects - projectsNeedingAttention} on track
              </span>
            </div>
          </div>

          {/* Expanded Metrics */}
          {healthCardExpanded && (
            <div 
              className="mt-6 pt-6"
              style={{ 
                borderTop: '1px solid #F0F0F0',
                opacity: healthCardExpanded ? 1 : 0,
                animation: 'fadeIn 300ms ease-out 100ms forwards'
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div 
                    className="uppercase"
                    style={{ 
                      fontSize: '10px', 
                      fontWeight: 500, 
                      color: '#9CA3AF',
                      letterSpacing: '0.1em',
                      marginBottom: '6px'
                    }}
                  >
                    BUDGET
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 500, color: '#1F2937' }}>
                    +2.3%
                  </div>
                </div>
                <div>
                  <div 
                    className="uppercase"
                    style={{ 
                      fontSize: '10px', 
                      fontWeight: 500, 
                      color: '#9CA3AF',
                      letterSpacing: '0.1em',
                      marginBottom: '6px'
                    }}
                  >
                    SCHEDULE
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 500, color: '#1F2937' }}>
                    -3d
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* COMPONENT 2: PROJECT LIST */}
      <div className="mx-auto" style={{ width: '800px', marginBottom: '64px' }}>
        {projectsNeedingAttention > 0 && (
          <div className="mb-5" style={{ paddingLeft: '0' }}>
            <span style={{ fontSize: '14px', fontWeight: 400, color: '#6B7280' }}>
              {projectsNeedingAttention} project{projectsNeedingAttention > 1 ? 's' : ''} need attention
            </span>
          </div>
        )}

        <div>
          {sortedProjects.slice(0, 6).map((project, idx) => (
            <div
              key={idx}
              className="cursor-pointer transition-all relative project-row"
              style={{
                display: 'grid',
                gridTemplateColumns: '480px 200px 120px',
                height: '80px',
                padding: '20px 0',
                borderBottom: '1px solid rgba(0,0,0,0.06)',
                background: 'white',
                alignItems: 'center',
                opacity: isLoaded ? 1 : 0,
                transform: isLoaded ? 'translateX(0)' : 'translateX(-20px)',
                transition: `all 400ms ease-out ${400 + idx * 80}ms`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#FAFAFA';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.04)';
                const arrow = e.currentTarget.querySelector('.arrow-icon') as HTMLElement;
                if (arrow) {
                  arrow.style.color = '#2563EB';
                  arrow.style.transform = 'translateX(4px)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                const arrow = e.currentTarget.querySelector('.arrow-icon') as HTMLElement;
                if (arrow) {
                  arrow.style.color = '#D1D5DB';
                  arrow.style.transform = 'translateX(0)';
                }
              }}
            >
              {/* LEFT SECTION: Status + Names */}
              <div onClick={() => setSelectedProject(projects.indexOf(project))}>
                <div className="flex items-center gap-3 mb-1">
                  <div 
                    className="rounded-full flex-shrink-0"
                    style={{ 
                      width: '8px', 
                      height: '8px', 
                      backgroundColor: project.statusColor
                    }}
                  ></div>
                  <h3 style={{ fontSize: '17px', fontWeight: 500, color: '#000000', lineHeight: 1.3 }}>
                    {project.name}
                  </h3>
                  <span 
                    style={{ 
                      fontSize: '14px', 
                      color: project.riskTrendColor, 
                      lineHeight: 1,
                      marginLeft: '-4px'
                    }}
                  >
                    {project.riskTrend}
                  </span>
                </div>
                <div className="flex items-center gap-2" style={{ marginLeft: '20px' }}>
                  <p style={{ fontSize: '15px', fontWeight: 400, color: '#9CA3AF', lineHeight: 1.3 }}>
                    {project.client}
                  </p>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#9CA3AF', lineHeight: 1.3 }}>
                    {project.owner}
                  </span>
                </div>
              </div>

              {/* CENTER SECTION: Timeline */}
              <div onClick={() => setSelectedProject(projects.indexOf(project))}>
                <div style={{ fontSize: '15px', fontWeight: 400, color: '#6B7280', lineHeight: 1.3, marginBottom: '6px' }}>
                  {project.timeline}
                </div>
                
                {/* Progress Bar */}
                <div className="w-full mb-2" style={{ height: '2px', background: '#F0F0F0', borderRadius: '1px', overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      height: '100%',
                      width: project.progress,
                      background: project.statusColor,
                      borderRadius: '1px',
                      transition: 'width 300ms ease-out'
                    }}
                  ></div>
                </div>
                
                <div 
                  style={{ 
                    fontSize: '14px', 
                    fontWeight: project.timelineStatus.includes('behind') ? 500 : 400, 
                    color: project.timelineStatusColor,
                    lineHeight: 1.3
                  }}
                >
                  {project.timelineStatus}
                </div>
              </div>

              {/* RIGHT SECTION: Last Activity + Menu + Arrow */}
              <div className="flex flex-col justify-between items-end" style={{ height: '40px' }}>
                <div style={{ fontSize: '13px', fontWeight: 400, color: '#D1D5DB' }}>
                  {project.lastActivity}
                </div>
                <div className="flex items-center gap-3">
                  {project.flags > 0 && (
                    <span 
                      style={{ 
                        fontSize: '15px', 
                        fontWeight: 500, 
                        color: '#1F2937',
                        minWidth: '20px',
                        textAlign: 'right'
                      }}
                      onClick={() => setSelectedProject(projects.indexOf(project))}
                    >
                      {project.flags}
                    </span>
                  )}
                  
                  {/* Menu Button - More Prominent */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuIndex(openMenuIndex === idx ? null : idx);
                    }}
                    className="transition-all"
                    style={{
                      background: openMenuIndex === idx ? '#F3F4F6' : 'transparent',
                      border: '1px solid transparent',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#6B7280',
                      width: '24px',
                      height: '24px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#F3F4F6';
                      e.currentTarget.style.color = '#1F2937';
                    }}
                    onMouseLeave={(e) => {
                      if (openMenuIndex !== idx) {
                        e.currentTarget.style.background = 'transparent';
                      }
                      e.currentTarget.style.color = '#6B7280';
                    }}
                  >
                    <MoreVertical style={{ width: '16px', height: '16px' }} />
                  </button>
                  
                  <div 
                    onClick={() => setSelectedProject(projects.indexOf(project))}
                    style={{ display: 'flex', alignItems: 'center' }}
                  >
                    <ArrowRight 
                      className="arrow-icon transition-colors" 
                      style={{ width: '20px', height: '20px', color: '#D1D5DB' }} 
                    />
                  </div>
                </div>
              </div>

              {/* DROPDOWN MENU */}
              {openMenuIndex === idx && (
                <>
                  {/* Backdrop to close menu */}
                  <div 
                    className="fixed inset-0" 
                    style={{ zIndex: 40 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuIndex(null);
                    }}
                  />
                  
                  {/* Menu */}
                  <div
                    className="absolute bg-white"
                    style={{
                      top: '20px',
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
                    {/* Navigation Links */}
                    <button
                      className="w-full transition-colors"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        background: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 400,
                        color: '#1F2937',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                    >
                      <span>Project Gantt</span>
                      <ChevronRight style={{ width: '16px', height: '16px', color: '#9CA3AF' }} />
                    </button>

                    <button
                      className="w-full transition-colors"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        background: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 400,
                        color: '#1F2937',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                    >
                      <span>Project Board</span>
                      <ChevronRight style={{ width: '16px', height: '16px', color: '#9CA3AF' }} />
                    </button>

                    <button
                      className="w-full transition-colors"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        background: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 400,
                        color: '#1F2937',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                    >
                      <span>Project Financial</span>
                      <ChevronRight style={{ width: '16px', height: '16px', color: '#9CA3AF' }} />
                    </button>

                    {/* Divider */}
                    <div style={{ height: '1px', background: '#F0F0F0', margin: '4px 0' }} />

                    {/* Action Items */}
                    <button
                      className="w-full transition-colors"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 16px',
                        background: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 400,
                        color: '#1F2937',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                    >
                      <Edit style={{ width: '16px', height: '16px', color: '#6B7280' }} />
                      <span>Edit project</span>
                    </button>

                    <button
                      className="w-full transition-colors"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 16px',
                        background: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 400,
                        color: '#1F2937',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                    >
                      <Copy style={{ width: '16px', height: '16px', color: '#6B7280' }} />
                      <span>Duplicate project</span>
                    </button>

                    <button
                      className="w-full transition-colors"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 16px',
                        background: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 400,
                        color: '#1F2937',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                    >
                      <Power style={{ width: '16px', height: '16px', color: '#6B7280' }} />
                      <span>Unpublish project</span>
                    </button>

                    <button
                      className="w-full transition-colors"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 16px',
                        background: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 400,
                        color: '#EF4444',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#FEF2F2'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                    >
                      <Trash2 style={{ width: '16px', height: '16px', color: '#EF4444' }} />
                      <span>Delete project</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="text-center pt-6">
          <button
            className="transition-colors"
            style={{
              fontSize: '14px',
              fontWeight: 400,
              color: '#6B7280',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#1F2937'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#6B7280'}
          >
            Show all {totalProjects} projects
          </button>
        </div>
      </div>

      {/* PROJECT DETAIL MODAL */}
      {selectedProject !== null && (
        <div 
          className="fixed inset-0 flex items-center justify-center"
          style={{ 
            background: 'rgba(0, 0, 0, 0.05)',
            zIndex: 1000,
            animation: 'fadeIn 300ms ease-out'
          }}
          onClick={() => setSelectedProject(null)}
        >
          <div 
            className="bg-white rounded-lg relative"
            style={{
              width: '800px',
              padding: '48px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
              animation: 'modalSlideIn 300ms ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedProject(null)}
              className="absolute top-6 right-6 transition-colors"
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                color: '#9CA3AF'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#1F2937'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#9CA3AF'}
            >
              <X style={{ width: '24px', height: '24px' }} />
            </button>

            {/* Header */}
            <div className="mb-10">
              <h2 style={{ fontSize: '28px', fontWeight: 500, color: '#1F2937', marginBottom: '8px' }}>
                {projects[selectedProject].name}
              </h2>
              <p style={{ fontSize: '16px', fontWeight: 400, color: '#6B7280' }}>
                {projects[selectedProject].client}
              </p>
            </div>

            {/* Content Sections */}
            <div className="space-y-8">
              {/* Section 1: Status */}
              <div>
                <div 
                  className="uppercase mb-3"
                  style={{ 
                    fontSize: '12px', 
                    fontWeight: 400, 
                    color: '#9CA3AF',
                    letterSpacing: '0.1em'
                  }}
                >
                  STATUS
                </div>
                <div style={{ fontSize: '18px', fontWeight: 400, color: '#1F2937', marginBottom: '8px' }}>
                  {projects[selectedProject].status}
                </div>
                {projects[selectedProject].issues.length > 0 && (
                  <div className="space-y-2 mt-4">
                    {projects[selectedProject].issues.map((issue, i) => (
                      <p key={i} style={{ fontSize: '14px', fontWeight: 400, color: '#6B7280' }}>
                        • {issue}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 2: Timeline */}
              <div>
                <div 
                  className="uppercase mb-3"
                  style={{ 
                    fontSize: '12px', 
                    fontWeight: 400, 
                    color: '#9CA3AF',
                    letterSpacing: '0.1em'
                  }}
                >
                  TIMELINE
                </div>
                <div style={{ fontSize: '18px', fontWeight: 400, color: '#1F2937', marginBottom: '4px' }}>
                  {projects[selectedProject].timeline}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 400, color: '#6B7280' }}>
                  {projects[selectedProject].progress}
                </div>
              </div>

              {/* Section 3: Team */}
              <div>
                <div 
                  className="uppercase mb-3"
                  style={{ 
                    fontSize: '12px', 
                    fontWeight: 400, 
                    color: '#9CA3AF',
                    letterSpacing: '0.1em'
                  }}
                >
                  TEAM
                </div>
                <div style={{ fontSize: '18px', fontWeight: 400, color: '#1F2937' }}>
                  {projects[selectedProject].team}
                </div>
              </div>

              {/* Section 4: Budget */}
              <div>
                <div 
                  className="uppercase mb-3"
                  style={{ 
                    fontSize: '12px', 
                    fontWeight: 400, 
                    color: '#9CA3AF',
                    letterSpacing: '0.1em'
                  }}
                >
                  BUDGET
                </div>
                <div style={{ fontSize: '18px', fontWeight: 400, color: '#1F2937', marginBottom: '4px' }}>
                  {projects[selectedProject].budget}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 400, color: '#6B7280' }}>
                  {projects[selectedProject].budgetVariance}
                </div>
              </div>

              {/* Section 5: Actions (if needed) */}
              {projects[selectedProject].actions.length > 0 && (
                <div>
                  <div 
                    className="uppercase mb-4"
                    style={{ 
                      fontSize: '12px', 
                      fontWeight: 400, 
                      color: '#9CA3AF',
                      letterSpacing: '0.1em'
                    }}
                  >
                    ACTIONS NEEDED
                  </div>
                  <div className="space-y-3">
                    {projects[selectedProject].actions.map((action, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span style={{ fontSize: '14px', fontWeight: 400, color: '#1F2937' }}>
                          {action}
                        </span>
                        <button
                          className="transition-colors"
                          style={{
                            background: '#3B82F6',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: 500,
                            padding: '10px 20px',
                            borderRadius: '6px',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#2563EB'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#3B82F6'}
                        >
                          Approve
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Link */}
            <div className="mt-10 text-center">
              <button
                className="transition-colors"
                style={{
                  fontSize: '14px',
                  fontWeight: 400,
                  color: '#6B7280',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#1F2937'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#6B7280'}
              >
                View full project details →
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
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

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
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