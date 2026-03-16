/**
 * ProjectPortfolioWidget - Connected to Real API
 * Displays project portfolio overview from Workdeck API
 */

import React, { useState, useEffect } from 'react';
import { ChevronDown, ArrowRight, Briefcase, Loader2, AlertCircle, FolderOpen } from 'lucide-react';
import { dashboardApi, ProjectSummary } from '../../services/dashboard-api';

interface Project {
  id: string;
  name: string;
  code: string;
  status: 'on-track' | 'at-risk' | 'critical' | 'upcoming' | 'completed';
  progress: number;
  metadata: string;
  client?: string;
}

interface ProjectPortfolioWidgetProps {
  onProjectClick?: (projectId: string) => void;
  onHeaderClick?: () => void;
}

function calculateProjectStatus(project: ProjectSummary): 'on-track' | 'at-risk' | 'critical' | 'upcoming' | 'completed' {
  // Status values: 0=Draft, 1=Active, 2=OnHold, 3=Cancelled, 4=Completed
  if (project.status === 4) return 'completed';
  if (project.status === 0) return 'upcoming';
  
  // Check for issues
  const spent = parseFloat(project.spentHours || '0');
  const planned = parseFloat(project.plannedHours || '0');
  
  // Over budget by more than 20%
  if (planned > 0 && spent > planned * 1.2) return 'critical';
  
  // Over budget by more than 10%
  if (planned > 0 && spent > planned * 1.1) return 'at-risk';
  
  // Check for overdue
  if (project.endDate) {
    const endDate = new Date(project.endDate.split('/').reverse().join('-'));
    const today = new Date();
    if (endDate < today && project.status !== 4) return 'critical';
  }
  
  // Has alerts
  if (project.alerts && project.alerts.some(a => a.severity === 'critical')) return 'critical';
  if (project.alerts && project.alerts.length > 0) return 'at-risk';
  
  return 'on-track';
}

function calculateProgress(project: ProjectSummary): number {
  const spent = parseFloat(project.spentHours || '0');
  const planned = parseFloat(project.plannedHours || '0');
  
  if (planned === 0) return 0;
  return Math.min(100, Math.round((spent / planned) * 100));
}

export function ProjectPortfolioWidget({ onProjectClick, onHeaderClick }: ProjectPortfolioWidgetProps) {
  console.log('🟢 ProjectPortfolioWidget MOUNTED');
  
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All projects');
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filters = ['All projects', 'My projects', 'On Track', 'At Risk', 'Critical'];

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('ProjectPortfolio: Loading projects...');
      const data = await dashboardApi.getProjectsSummary();
      console.log('ProjectPortfolio: Got data:', data?.length, 'projects');
      
      if (!data || !Array.isArray(data)) {
        console.log('ProjectPortfolio: No data or not array');
        setProjects([]);
        return;
      }
      
      const projectList: Project[] = data.map((p: ProjectSummary) => ({
        id: p.id,
        name: p.name,
        code: p.code || '',
        status: calculateProjectStatus(p),
        progress: calculateProgress(p),
        metadata: `${p.code || ''}${p.client?.name ? ` • ${p.client.name}` : ''}`,
        client: p.client?.name
      }));
      
      console.log('ProjectPortfolio: Converted to', projectList.length, 'items');
      setProjects(projectList);
    } catch (err) {
      console.error('ProjectPortfolio: Failed to load projects:', err);
      setError('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'on-track':
        return { label: 'On Track', bg: '#D1FAE5', text: '#065F46' };
      case 'at-risk':
        return { label: 'At Risk', bg: '#FEF3C7', text: '#92400E' };
      case 'critical':
        return { label: 'Critical', bg: '#FEE2E2', text: '#991B1B' };
      case 'upcoming':
        return { label: 'Upcoming', bg: '#F3F4F6', text: '#374151' };
      case 'completed':
        return { label: 'Completed', bg: '#DBEAFE', text: '#1E40AF' };
      default:
        return { label: 'Unknown', bg: '#F3F4F6', text: '#6B7280' };
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'on-track':
        return '#34D399';
      case 'at-risk':
        return '#FBBF24';
      case 'critical':
        return '#F87171';
      case 'upcoming':
        return '#9CA3AF';
      case 'completed':
        return '#60A5FA';
      default:
        return '#60A5FA';
    }
  };

  // Filter projects based on selection
  const filteredProjects = projects.filter(project => {
    if (selectedFilter === 'All projects') return true;
    if (selectedFilter === 'My projects') return true; // Would need user context
    if (selectedFilter === 'On Track') return project.status === 'on-track';
    if (selectedFilter === 'At Risk') return project.status === 'at-risk';
    if (selectedFilter === 'Critical') return project.status === 'critical';
    return true;
  });

  // Count by status
  const statusCounts = {
    'on-track': projects.filter(p => p.status === 'on-track').length,
    'at-risk': projects.filter(p => p.status === 'at-risk').length,
    'critical': projects.filter(p => p.status === 'critical').length,
  };

  return (
    <div
      style={{
        background: 'white',
        borderRadius: '8px',
        border: '1px solid #E5E7EB',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* Top gradient bar */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #93C5FD 0%, #BFDBFE 100%)'
        }}
      />

      {/* Header */}
      <div
        style={{
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #E5E7EB',
          flexShrink: 0,
          marginTop: '4px'
        }}
      >
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: onHeaderClick ? 'pointer' : 'default' }}
          onClick={onHeaderClick}
        >
          <Briefcase style={{ width: '16px', height: '16px', color: '#3B82F6' }} />
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
            Project Portfolio
          </span>
          <span style={{ 
            fontSize: '10px', 
            color: '#6B7280',
            background: '#F3F4F6',
            padding: '2px 6px',
            borderRadius: '10px'
          }}>
            {projects.length}
          </span>
        </div>

        {/* Filter dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              fontSize: '11px',
              color: '#6B7280',
              background: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {selectedFilter}
            <ChevronDown style={{ width: '12px', height: '12px' }} />
          </button>

          {showFilterMenu && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '4px',
                background: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                zIndex: 50,
                minWidth: '140px'
              }}
            >
              {filters.map(filter => (
                <button
                  key={filter}
                  onClick={() => {
                    setSelectedFilter(filter);
                    setShowFilterMenu(false);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '12px',
                    color: selectedFilter === filter ? '#3B82F6' : '#374151',
                    background: selectedFilter === filter ? '#EFF6FF' : 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  {filter}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status summary bar */}
      <div style={{ 
        padding: '8px 12px', 
        display: 'flex', 
        gap: '12px',
        borderBottom: '1px solid #F3F4F6',
        background: '#FAFAFA'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34D399' }} />
          <span style={{ fontSize: '11px', color: '#6B7280' }}>{statusCounts['on-track']} On Track</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FBBF24' }} />
          <span style={{ fontSize: '11px', color: '#6B7280' }}>{statusCounts['at-risk']} At Risk</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F87171' }} />
          <span style={{ fontSize: '11px', color: '#6B7280' }}>{statusCounts['critical']} Critical</span>
        </div>
      </div>

      {/* Project list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
            <Loader2 style={{ width: '24px', height: '24px', color: '#9CA3AF', animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '12px', color: '#6B7280', marginTop: '8px' }}>Loading projects...</span>
          </div>
        ) : error ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
            <AlertCircle style={{ width: '24px', height: '24px', color: '#EF4444', marginBottom: '8px' }} />
            <span style={{ fontSize: '12px', color: '#EF4444' }}>{error}</span>
            <button 
              onClick={loadProjects}
              style={{ marginTop: '8px', fontSize: '12px', color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Retry
            </button>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
              <FolderOpen style={{ width: '24px', height: '24px', color: '#3B82F6' }} />
            </div>
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>No projects</span>
            <span style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>No projects match this filter</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {filteredProjects.slice(0, 10).map(project => {
              const statusConfig = getStatusConfig(project.status);
              const progressColor = getProgressColor(project.status);

              return (
                <div
                  key={project.id}
                  onClick={() => onProjectClick?.(project.id)}
                  style={{
                    padding: '10px 12px',
                    background: '#FAFAFA',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#F3F4F6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#FAFAFA';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>
                      {project.name}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 500,
                        padding: '2px 6px',
                        borderRadius: '10px',
                        background: statusConfig.bg,
                        color: statusConfig.text
                      }}
                    >
                      {statusConfig.label}
                    </span>
                  </div>

                  <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '8px' }}>
                    {project.metadata}
                  </div>

                  {/* Progress bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, height: '4px', background: '#E5E7EB', borderRadius: '2px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${project.progress}%`,
                          height: '100%',
                          background: progressColor,
                          borderRadius: '2px',
                          transition: 'width 0.3s ease'
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '10px', color: '#6B7280', minWidth: '28px' }}>
                      {project.progress}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {filteredProjects.length > 10 && (
        <div style={{ 
          padding: '8px 12px', 
          borderTop: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <button
            onClick={onHeaderClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              color: '#3B82F6',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            View all {projects.length} projects
            <ArrowRight style={{ width: '12px', height: '12px' }} />
          </button>
        </div>
      )}

      {/* CSS for spinner */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
