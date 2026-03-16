import React, { useState } from 'react';
import { Search, Plus, ChevronDown, MoreVertical, ArrowRight, Clock, DollarSign, Users } from 'lucide-react';
import { ProjectWizardDialog } from './ProjectWizardDialog';

export function TriageDashboard() {
  const [activeFilter, setActiveFilter] = useState('All Projects');
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [showNewProjectWizard, setShowNewProjectWizard] = useState(false);

  const projects: any[] = [];

  const handleProjectClick = (projectName: string) => {
    // Add logic to handle project click
    console.log(`Project clicked: ${projectName}`);
  };

  const getTrendArrow = (trend: string) => {
    if (trend === 'up') return '↗';
    if (trend === 'down') return '↘';
    return '→';
  };

  return (
    <div style={{ width: '1200px', minHeight: '1400px', background: '#FFFFFF', margin: '0 auto' }}>
      {/* HEADER SECTION */}
      <div style={{ padding: '32px 40px 24px' }}>
        {/* Search Bar & New Project Button */}
        <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
          <div className="relative" style={{ width: '300px' }}>
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
              style={{
                width: '100%',
                height: '40px',
                paddingLeft: '40px',
                paddingRight: '12px',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#0A0A0A',
                outline: 'none'
              }}
            />
          </div>

          <button
            onClick={() => setShowNewProjectWizard(true)}
            style={{
              width: '140px',
              height: '40px',
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
              gap: '6px'
            }}
          >
            <Plus style={{ width: '16px', height: '16px' }} />
            New Project
          </button>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center" style={{ gap: '16px', marginBottom: '16px' }}>
          {[
            { label: 'All Projects', count: 10 },
            { label: 'Urgent Attention', count: 4 },
            { label: 'Watch List', count: 0 },
            { label: 'Completed', count: 2 }
          ].map((filter) => (
            <button
              key={filter.label}
              onClick={() => setActiveFilter(filter.label)}
              style={{
                height: '36px',
                padding: '0 16px',
                borderRadius: '18px',
                border: activeFilter === filter.label ? 'none' : '1px solid #E5E7EB',
                background: activeFilter === filter.label ? '#3B82F6' : 'white',
                color: activeFilter === filter.label ? 'white' : '#6B7280',
                fontSize: '13px',
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
                  background: activeFilter === filter.label ? 'rgba(255,255,255,0.25)' : '#F3F4F6',
                  color: activeFilter === filter.label ? 'white' : '#6B7280',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 600
                }}
              >
                {filter.count}
              </span>
            </button>
          ))}
          
          <button
            style={{
              height: '36px',
              padding: '0 16px',
              borderRadius: '18px',
              border: '1px solid #E5E7EB',
              background: 'white',
              color: '#6B7280',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            By Client
            <ChevronDown style={{ width: '14px', height: '14px' }} />
          </button>
        </div>

        {/* Title and Subtitle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0A0A0A', margin: 0 }}>
            Project Triage
          </h1>
          <div style={{ fontSize: '14px', color: '#6B7280' }}>
            10 Active Projects
          </div>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div style={{ marginTop: '20px' }}>
        {/* Table Header */}
        <div
          style={{
            height: '48px',
            background: '#F9FAFB',
            display: 'grid',
            gridTemplateColumns: '60px 400px 280px 220px 160px',
            alignItems: 'center',
            paddingLeft: '24px',
            paddingRight: '24px'
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 500, color: '#6B7280', letterSpacing: '0.5px', textTransform: 'uppercase' }}>ALERT</div>
          <div style={{ fontSize: '11px', fontWeight: 500, color: '#6B7280', letterSpacing: '0.5px', textTransform: 'uppercase' }}>PROJECT CONTEXT</div>
          <div style={{ fontSize: '11px', fontWeight: 500, color: '#6B7280', letterSpacing: '0.5px', textTransform: 'uppercase' }}>TIMELINE & PROGRESS</div>
          <div style={{ fontSize: '11px', fontWeight: 500, color: '#6B7280', letterSpacing: '0.5px', textTransform: 'uppercase' }}>NEXT ACTIVITY</div>
          <div style={{ fontSize: '11px', fontWeight: 500, color: '#6B7280', letterSpacing: '0.5px', textTransform: 'uppercase', textAlign: 'right' }}>ACTION</div>
        </div>

        {/* Project Rows */}
        {projects.map((project, idx) => (
          <div
            key={project.id}
            onMouseEnter={() => setHoveredRow(idx)}
            onMouseLeave={() => setHoveredRow(null)}
            style={{
              height: '88px',
              display: 'grid',
              gridTemplateColumns: '60px 400px 280px 220px 160px',
              alignItems: 'center',
              paddingLeft: '24px',
              paddingRight: '24px',
              borderBottom: '1px solid #F3F4F6',
              background: hoveredRow === idx ? '#FAFAFA' : 'white',
              boxShadow: hoveredRow === idx ? '0 2px 8px rgba(0,0,0,0.04)' : 'none',
              transition: 'all 200ms ease',
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            {/* COLUMN 1: ALERT ZONE */}
            <div className="flex flex-col items-center justify-center" style={{ gap: '8px' }}>
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: project.alert.dotColor,
                  animation: project.alert.pulse ? 'pulse 2s infinite' : 'none'
                }}
              />
              {project.alert.icon && (
                <div style={{ color: project.alert.iconColor }}>
                  <project.alert.icon style={{ width: '16px', height: '16px' }} />
                </div>
              )}
            </div>

            {/* COLUMN 2: PROJECT CONTEXT */}
            <div className="flex flex-col" style={{ gap: '4px' }}>
              {/* Line 1: Name + Trend */}
              <div className="flex items-center" style={{ gap: '8px' }}>
                <span style={{ fontSize: '16px', fontWeight: 600, color: '#0A0A0A' }}>
                  {project.name}
                </span>
                <span style={{ fontSize: '14px', color: project.trendColor }}>
                  {getTrendArrow(project.trend)}
                </span>
              </div>

              {/* Line 2: Client + Owner */}
              <div style={{ fontSize: '14px', color: '#6B7280' }}>
                {project.client} • {project.owner}
              </div>

              {/* Line 3: Badge */}
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
                  {project.badge}
                </span>
              </div>
            </div>

            {/* COLUMN 3: TIMELINE & PROGRESS */}
            <div className="flex flex-col" style={{ gap: '4px' }}>
              {/* Line 1: Date Range */}
              <div style={{ fontSize: '14px', fontVariantNumeric: 'tabular-nums', color: '#6B7280' }}>
                {project.timeline} • {project.duration}
              </div>

              {/* Line 2: Progress Bar */}
              <div style={{ width: '280px', height: '4px', background: '#F0F0F0', borderRadius: '2px', overflow: 'hidden' }}>
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

              {/* Line 4: ACTION REQ Badge */}
              {project.showActionBadge && (
                <div>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      background: project.actionBadgeBg,
                      color: project.actionBadgeColor,
                      fontSize: '11px',
                      fontWeight: 700,
                      borderRadius: '8px',
                      letterSpacing: '0.5px'
                    }}
                  >
                    ACTION REQ
                  </span>
                </div>
              )}
            </div>

            {/* COLUMN 4: NEXT ACTIVITY */}
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

            {/* COLUMN 5: ACTIONS */}
            <div className="flex items-center justify-end" style={{ gap: '12px' }}>
              {/* Flag Count Circle */}
              {project.flagCount > 0 && (
                <div
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
                    color: project.flagColor
                  }}
                >
                  {project.flagCount}
                </div>
              )}

              {/* Three-dot Menu */}
              <button
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
                  color: '#9CA3AF'
                }}
              >
                <MoreVertical style={{ width: '16px', height: '16px' }} />
              </button>

              {/* Arrow or Gantt Button */}
              {hoveredRow === idx ? (
                <button
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
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.4;
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
      `}</style>

      {/* New Project Wizard */}
      {showNewProjectWizard && (
        <ProjectWizardDialog
          mode="create"
          onClose={() => setShowNewProjectWizard(false)}
          onSave={() => {
            // Refresh project list after creating
            setShowNewProjectWizard(false);
          }}
        />
      )}
    </div>
  );
}