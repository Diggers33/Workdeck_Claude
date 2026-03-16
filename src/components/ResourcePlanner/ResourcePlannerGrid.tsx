/**
 * ResourcePlannerGrid - Virtualized grid component
 *
 * Uses @tanstack/react-virtual for row virtualization.
 * Only renders visible rows for optimal performance.
 */

import React, { useState, useMemo, useCallback, useRef, startTransition } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import GridRow from './GridRow';
import {
  TeamMember,
  GridPeriod,
  GridRowData,
  CellData,
  GridAllocation,
  GridHierarchy,
  GridGranularity,
  ProjectSummary,
} from './types';
import { parseDate, datesOverlap, countWorkingDays, getStartOfMonth } from './utils';

interface ResourcePlannerGridProps {
  teamMembers: TeamMember[];
  projectsList: ProjectSummary[];
  gridHierarchy: GridHierarchy;
  gridGranularity: GridGranularity;
  gridStartDate: Date;
  gridMonthsToShow: number;
  gridAllocations: GridAllocation[];
  onGridAllocationChange: (allocations: GridAllocation[]) => void;
  onSaveAllocations: () => void;
  isSaving: boolean;
}

const ResourcePlannerGrid: React.FC<ResourcePlannerGridProps> = ({
  teamMembers,
  projectsList,
  gridHierarchy,
  gridGranularity,
  gridStartDate,
  gridMonthsToShow,
  gridAllocations,
  onGridAllocationChange,
  onSaveAllocations,
  isSaving,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [editingCellKey, setEditingCellKey] = useState<string | null>(null);
  const [isFillDragging, setIsFillDragging] = useState(false);

  // Generate grid periods
  const gridPeriods = useMemo<GridPeriod[]>(() => {
    const periods: GridPeriod[] = [];
    const start = new Date(gridStartDate);

    if (gridGranularity === 'monthly') {
      for (let i = 0; i < gridMonthsToShow; i++) {
        const monthStart = new Date(start.getFullYear(), start.getMonth() + i, 1);
        const monthEnd = new Date(start.getFullYear(), start.getMonth() + i + 1, 0);
        periods.push({
          key: `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`,
          label: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          shortLabel: monthStart.toLocaleDateString('en-US', { month: 'short' }),
          startDate: monthStart,
          endDate: monthEnd,
        });
      }
    } else {
      // Weekly
      const weekCount = Math.ceil(gridMonthsToShow * 4.33);
      for (let i = 0; i < weekCount; i++) {
        const weekStart = new Date(start.getTime() + i * 7 * 24 * 60 * 60 * 1000);
        const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
        const weekNum = Math.ceil((weekStart.getTime() - new Date(weekStart.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
        periods.push({
          key: `${weekStart.getFullYear()}-W${String(weekNum).padStart(2, '0')}`,
          label: `W${weekNum}`,
          shortLabel: `W${weekNum}`,
          startDate: weekStart,
          endDate: weekEnd,
        });
      }
    }

    return periods;
  }, [gridStartDate, gridMonthsToShow, gridGranularity]);

  // Memoized allocation maps for O(1) lookups
  const gridAllocationsMap = useMemo(() => {
    const map = new Map<string, GridAllocation>();
    gridAllocations.forEach(alloc => {
      const key = `${alloc.personId}:${alloc.period}:${alloc.taskId || ''}`;
      map.set(key, alloc);
    });
    return map;
  }, [gridAllocations]);

  const pendingHoursByPersonTask = useMemo(() => {
    const map = new Map<string, number>();
    gridAllocations.forEach(alloc => {
      const key = `${alloc.personId}:${alloc.taskId || ''}`;
      map.set(key, (map.get(key) || 0) + alloc.hours);
    });
    return map;
  }, [gridAllocations]);

  // Build grid data structure
  const gridData = useMemo<GridRowData[]>(() => {
    if (gridHierarchy === 'person') {
      return teamMembers.map(member => ({
        id: member.id,
        type: 'person' as const,
        name: member.name,
        avatar: member.avatar,
        department: member.department,
        capacity: member.capacity,
        children: Array.from(new Set(member.assignments.map(a => a.projectId))).map(projectId => {
          const projectAssignments = member.assignments.filter(a => a.projectId === projectId);
          const project = projectsList.find(p => p.id === projectId);
          return {
            id: `${member.id}:${projectId}`,
            type: 'project' as const,
            name: project?.name || projectAssignments[0]?.projectName || 'Unknown',
            color: project?.color || projectAssignments[0]?.color || '#6B7280',
            parentId: member.id,
            children: projectAssignments.map(assignment => ({
              id: assignment.id,
              type: 'task' as const,
              name: assignment.taskName,
              taskId: assignment.taskId,
              workPackage: assignment.workPackage,
              parentId: `${member.id}:${projectId}`,
              assignment
            }))
          };
        })
      }));
    } else {
      // Project-first hierarchy
      const projectMap = new Map<string, { project: any; tasks: Map<string, { assignment: any; members: Map<string, TeamMember> }> }>();

      projectsList.forEach(project => {
        projectMap.set(project.id, { project, tasks: new Map() });
      });

      teamMembers.forEach(member => {
        member.assignments.forEach(assignment => {
          const projectId = assignment.projectId;
          if (!projectMap.has(projectId)) {
            projectMap.set(projectId, {
              project: { id: projectId, name: assignment.projectName, color: assignment.color },
              tasks: new Map()
            });
          }
          const projectEntry = projectMap.get(projectId)!;
          const taskKey = assignment.taskId || assignment.id;
          if (!projectEntry.tasks.has(taskKey)) {
            projectEntry.tasks.set(taskKey, { assignment, members: new Map() });
          }
          projectEntry.tasks.get(taskKey)!.members.set(member.id, member);
        });
      });

      return Array.from(projectMap.values())
        .map(({ project, tasks }) => ({
          id: project.id,
          type: 'project' as const,
          name: project.name,
          color: project.color,
          children: Array.from(tasks.values()).map(({ assignment, members }) => ({
            id: assignment.taskId || assignment.id,
            type: 'task' as const,
            name: assignment.taskName,
            workPackage: assignment.workPackage,
            parentId: project.id,
            assignment,
            children: Array.from(members.values()).map(member => ({
              id: `${assignment.taskId || assignment.id}:${member.id}`,
              type: 'person' as const,
              name: member.name,
              avatar: member.avatar,
              department: member.department,
              capacity: member.capacity,
              parentId: assignment.taskId || assignment.id,
              personId: member.id,
              userId: member.id,
              assignment: member.assignments.find(a => (a.taskId || a.id) === (assignment.taskId || assignment.id))
            }))
          }))
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }
  }, [teamMembers, projectsList, gridHierarchy]);

  // Flatten grid data for virtualization (respecting expanded state)
  const flattenedRows = useMemo(() => {
    const rows: { row: GridRowData; parentRow?: GridRowData; grandparentRow?: GridRowData; depth: number }[] = [];

    const processRow = (row: GridRowData, parent?: GridRowData, grandparent?: GridRowData, depth = 0) => {
      rows.push({ row, parentRow: parent, grandparentRow: grandparent, depth });

      if (row.children && (depth === 0 || expandedRows.has(row.id))) {
        row.children.forEach(child => {
          processRow(child, row, parent, depth + 1);
        });
      }
    };

    gridData.forEach(row => processRow(row));
    return rows;
  }, [gridData, expandedRows]);

  // Pre-compute cell data
  const cellDataMap = useMemo(() => {
    const map = new Map<string, CellData>();

    const processRow = (row: GridRowData, parentRow?: GridRowData, grandparentRow?: GridRowData) => {
      gridPeriods.forEach(period => {
        const assignment = row.assignment;
        let hours = 0;
        let hasUnscheduled = false;

        if (assignment) {
          let isWithinTaskRange = false;
          if (assignment.startDate && assignment.endDate) {
            const taskStart = new Date(assignment.startDate);
            const taskEnd = new Date(assignment.endDate);
            isWithinTaskRange = datesOverlap(taskStart, taskEnd, period.startDate, period.endDate);
          }

          if (isWithinTaskRange && assignment.plannedSchedule && assignment.plannedSchedule.length > 0) {
            assignment.plannedSchedule.forEach((schedule) => {
              const scheduleStart = schedule.startDate ? parseDate(schedule.startDate) : new Date(assignment.startDate);
              const scheduleEnd = schedule.endDate ? parseDate(schedule.endDate) : new Date(assignment.endDate);
              const schedulePlannedHours = parseFloat(schedule.plannedHours || schedule.hours || '0');

              if (datesOverlap(scheduleStart, scheduleEnd, period.startDate, period.endDate) && schedulePlannedHours > 0) {
                const overlapStart = new Date(Math.max(scheduleStart.getTime(), period.startDate.getTime()));
                const overlapEnd = new Date(Math.min(scheduleEnd.getTime(), period.endDate.getTime()));
                const workingDaysInSchedule = countWorkingDays(scheduleStart, scheduleEnd);
                const workingDaysInPeriod = countWorkingDays(overlapStart, overlapEnd);

                if (workingDaysInSchedule > 0) {
                  hours += Math.round((schedulePlannedHours * workingDaysInPeriod / workingDaysInSchedule) * 100) / 100;
                }
              }
            });
          }

          if (isWithinTaskRange && hours === 0 && assignment.allocatedHours > 0) {
            hasUnscheduled = true;
          }
        }

        // Check pending allocations
        const effectivePersonId = gridHierarchy === 'person'
          ? grandparentRow?.id || parentRow?.id || row.id
          : row.personId || row.userId || row.id;
        const effectiveTaskId = assignment?.taskId || row.taskId || parentRow?.id;
        const allocationKey = `${effectivePersonId}:${period.key}:${effectiveTaskId || ''}`;
        const pendingAllocation = gridAllocationsMap.get(allocationKey);

        if (pendingAllocation) {
          hours = pendingAllocation.hours;
          hasUnscheduled = false;
        }

        const cellKey = `${row.id}:${period.key}`;
        map.set(cellKey, { hours, hasUnscheduled, hasPending: !!pendingAllocation });
      });

      row.children?.forEach(child => processRow(child, row, parentRow));
    };

    gridData.forEach(row => processRow(row));
    return map;
  }, [gridData, gridPeriods, gridHierarchy, gridAllocationsMap]);

  // Virtualization
  const virtualizer = useVirtualizer({
    count: flattenedRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 10,
  });

  // Handlers
  const handleToggleExpand = useCallback((rowId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  }, []);

  const handleCellEdit = useCallback((cellKey: string, periodKey: string) => {
    startTransition(() => setEditingCellKey(cellKey));
  }, []);

  const handleCellEditComplete = useCallback((cellKey: string, periodKey: string, value: string) => {
    const hours = parseFloat(value);
    if (isNaN(hours) || hours <= 0) {
      setEditingCellKey(null);
      return;
    }

    // Parse cellKey to get row info
    const [rowId] = cellKey.split(':');

    const newAllocation: GridAllocation = {
      id: `${rowId}-${periodKey}-${Date.now()}`,
      personId: rowId,
      projectId: '',
      projectName: '',
      taskId: rowId.includes(':') ? rowId.split(':')[0] : undefined,
      hours,
      period: periodKey,
    };

    onGridAllocationChange([...gridAllocations, newAllocation]);
    setEditingCellKey(null);
  }, [gridAllocations, onGridAllocationChange]);

  const handleCellEditCancel = useCallback(() => {
    setEditingCellKey(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, cellKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDragLeave = useCallback(() => {}, []);

  const handleDrop = useCallback((e: React.DragEvent, periodKey: string, rowId: string) => {
    e.preventDefault();
  }, []);

  const handleFillHandleMouseDown = useCallback((e: React.MouseEvent, cellKey: string, periodIdx: number, hours: number) => {
    setIsFillDragging(true);
  }, []);

  const handleFillHandleMouseMove = useCallback((e: React.MouseEvent, rowId: string, periodIdx: number) => {
    // Handle fill drag
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header row */}
      <div style={{ display: 'flex', borderBottom: '2px solid #E5E7EB', backgroundColor: '#F9FAFB', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ minWidth: '200px', maxWidth: '300px', padding: '12px', fontWeight: 600, fontSize: '13px', color: '#374151', position: 'sticky', left: 0, backgroundColor: '#F9FAFB' }}>
          {gridHierarchy === 'person' ? 'Team Member' : 'Project'}
        </div>
        {gridPeriods.map(period => (
          <div
            key={period.key}
            style={{
              minWidth: '80px',
              padding: '8px 4px',
              textAlign: 'center',
              fontSize: '11px',
              fontWeight: 500,
              color: '#6B7280',
              borderLeft: period.startDate.getMonth() === 0 ? '2px solid #D1D5DB' : '1px solid #E5E7EB',
            }}
          >
            {period.shortLabel}
          </div>
        ))}
      </div>

      {/* Virtualized rows */}
      <div
        ref={parentRef}
        style={{ flex: 1, overflow: 'auto' }}
      >
        <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {virtualizer.getVirtualItems().map(virtualRow => {
                const { row, parentRow, grandparentRow } = flattenedRows[virtualRow.index];
                const isExpanded = expandedRows.has(row.id);

                return (
                  <GridRow
                    key={row.id}
                    row={row}
                    parentRow={parentRow}
                    grandparentRow={grandparentRow}
                    periods={gridPeriods}
                    cellDataMap={cellDataMap}
                    editingCellKey={editingCellKey}
                    gridHierarchy={gridHierarchy}
                    gridGranularity={gridGranularity}
                    isExpanded={isExpanded}
                    onToggleExpand={handleToggleExpand}
                    onCellEdit={handleCellEdit}
                    onCellEditComplete={handleCellEditComplete}
                    onCellEditCancel={handleCellEditCancel}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onFillHandleMouseDown={handleFillHandleMouseDown}
                    onFillHandleMouseMove={handleFillHandleMouseMove}
                    isFillDragging={isFillDragging}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Save button */}
      {gridAllocations.length > 0 && (
        <div style={{ padding: '12px', borderTop: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}>
          <button
            onClick={onSaveAllocations}
            disabled={isSaving}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2563EB',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: isSaving ? 'not-allowed' : 'pointer',
              opacity: isSaving ? 0.7 : 1,
            }}
          >
            {isSaving ? 'Saving...' : `Save ${gridAllocations.length} Change${gridAllocations.length > 1 ? 's' : ''}`}
          </button>
        </div>
      )}
    </div>
  );
};

export default ResourcePlannerGrid;
