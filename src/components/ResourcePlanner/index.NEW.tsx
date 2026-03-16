/**
 * ResourcePlanner - Main orchestrator component
 *
 * This is the entry point that manages:
 * - View state (timeline, grid, list, etc.)
 * - Data fetching via useResourceData hook
 * - Rendering the appropriate view component
 *
 * Each view is a separate component that only renders when active.
 */

import React, { useState, useCallback } from 'react';
import { Loader2, Users, Calendar, List, Layers } from 'lucide-react';
import { useResourceData } from './hooks/useResourceData';
import ResourcePlannerGrid from './ResourcePlannerGrid';
import { ViewMode, GridHierarchy, GridGranularity, GridAllocation, AllocationFilter } from './types';
import { getStartOfMonth } from './utils';

const ResourcePlanner: React.FC = () => {
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [gridHierarchy, setGridHierarchy] = useState<GridHierarchy>('project');
  const [gridGranularity, setGridGranularity] = useState<GridGranularity>('monthly');
  const [gridStartDate, setGridStartDate] = useState(() => getStartOfMonth(new Date()));
  const [gridMonthsToShow, setGridMonthsToShow] = useState(12);
  const [gridAllocations, setGridAllocations] = useState<GridAllocation[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Filters
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [allocationFilter, setAllocationFilter] = useState<AllocationFilter>('all');

  // Data fetching
  const {
    teamMembers,
    projectsList,
    departmentsList,
    isLoading,
    isLoadingGanttData,
    ganttLoadProgress,
    error,
  } = useResourceData();

  // Filtered members
  const filteredMembers = teamMembers.filter(member => {
    const matchesDepartment = selectedDepartment === 'all' || member.department === selectedDepartment || member.departmentId === selectedDepartment;
    const matchesProject = selectedProject === 'all' || member.assignments.some(a => a.projectId === selectedProject);
    const matchesAllocation =
      allocationFilter === 'all' ||
      (allocationFilter === 'over' && member.allocation > 100) ||
      (allocationFilter === 'under' && member.allocation < 80) ||
      (allocationFilter === 'optimal' && member.allocation >= 80 && member.allocation <= 100) ||
      (allocationFilter === 'conflicts' && member.conflicts.length > 0);
    return matchesDepartment && matchesProject && matchesAllocation;
  });

  // Save handler
  const handleSaveAllocations = useCallback(async () => {
    if (gridAllocations.length === 0) return;
    setIsSaving(true);
    try {
      console.log('[ResourcePlanner] Saving allocations:', gridAllocations);
      // TODO: Implement API save
      await new Promise(resolve => setTimeout(resolve, 1000));
      setGridAllocations([]);
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setIsSaving(false);
    }
  }, [gridAllocations]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
        <Loader2 className="animate-spin" size={32} style={{ color: '#2563EB' }} />
        <span style={{ marginLeft: '12px', color: '#6B7280' }}>Loading resource data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#DC2626' }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#FAFAFA' }}>
      {/* Header */}
      <div style={{ padding: '16px 24px', backgroundColor: 'white', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Users size={24} style={{ color: '#2563EB' }} />
            <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#111827', margin: 0 }}>
              Resource Planner
            </h1>
            {isLoadingGanttData && (
              <span style={{ fontSize: '12px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Loader2 className="animate-spin" size={14} />
                Loading data... {ganttLoadProgress.loaded}/{ganttLoadProgress.total}
              </span>
            )}
          </div>

          {/* View tabs */}
          <div style={{ display: 'flex', gap: '4px', backgroundColor: '#F3F4F6', padding: '4px', borderRadius: '8px' }}>
            {[
              { id: 'timeline' as ViewMode, icon: Calendar, label: 'Timeline' },
              { id: 'grid' as ViewMode, icon: Layers, label: 'Grid' },
              { id: 'list' as ViewMode, icon: List, label: 'List' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: viewMode === tab.id ? 'white' : 'transparent',
                  color: viewMode === tab.id ? '#111827' : '#6B7280',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  boxShadow: viewMode === tab.id ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                }}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          <select
            value={selectedDepartment}
            onChange={e => setSelectedDepartment(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: '6px', fontSize: '13px' }}
          >
            <option value="all">All Departments</option>
            {departmentsList.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <select
            value={selectedProject}
            onChange={e => setSelectedProject(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: '6px', fontSize: '13px' }}
          >
            <option value="all">All Projects</option>
            {projectsList.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {viewMode === 'grid' && (
            <>
              <select
                value={gridHierarchy}
                onChange={e => setGridHierarchy(e.target.value as GridHierarchy)}
                style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: '6px', fontSize: '13px' }}
              >
                <option value="person">Group by Person</option>
                <option value="project">Group by Project</option>
              </select>

              <select
                value={gridGranularity}
                onChange={e => setGridGranularity(e.target.value as GridGranularity)}
                style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: '6px', fontSize: '13px' }}
              >
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
              </select>
            </>
          )}
        </div>
      </div>

      {/* View content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {viewMode === 'grid' && (
          <ResourcePlannerGrid
            teamMembers={filteredMembers}
            projectsList={projectsList}
            gridHierarchy={gridHierarchy}
            gridGranularity={gridGranularity}
            gridStartDate={gridStartDate}
            gridMonthsToShow={gridMonthsToShow}
            gridAllocations={gridAllocations}
            onGridAllocationChange={setGridAllocations}
            onSaveAllocations={handleSaveAllocations}
            isSaving={isSaving}
          />
        )}

        {viewMode === 'timeline' && (
          <div style={{ padding: '24px', textAlign: 'center', color: '#6B7280' }}>
            Timeline view - Coming soon
          </div>
        )}

        {viewMode === 'list' && (
          <div style={{ padding: '24px', textAlign: 'center', color: '#6B7280' }}>
            List view - Coming soon
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourcePlanner;
