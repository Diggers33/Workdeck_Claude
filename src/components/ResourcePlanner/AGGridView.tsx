/**
 * AGGridView - Virtualized grid using AG Grid
 *
 * Replaces the custom grid implementation for performance.
 * AG Grid handles virtualization automatically (only renders visible rows).
 * Includes custom drag-to-fill functionality (Excel-like).
 */

import React, { useMemo, useCallback, useRef, useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
  ColDef,
  CellClassParams,
  ICellRendererParams,
  ValueFormatterParams,
  CellValueChangedEvent,
  ModuleRegistry,
  AllCommunityModule
} from 'ag-grid-community';
// Use new Theming API for v35
import { themeQuartz } from 'ag-grid-community';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

interface Period {
  key: string;
  label: string;
  startDate: Date;
  endDate: Date;
}

interface Assignment {
  id: string;
  taskId: string;
  projectId: string;
  projectName: string;
  taskName: string;
  startDate: string;
  endDate: string;
  allocatedHours: number;
  plannedSchedule?: Array<{
    startDate: string;
    endDate: string;
    plannedHours?: string;
  }>;
}

interface GridRowData {
  id: string;
  name: string;
  type: 'person' | 'project' | 'task';
  level: number;
  parentId?: string;
  avatar?: string;
  color?: string;
  department?: string;
  capacity?: number;
  workPackage?: string;
  assignment?: Assignment;
  personId?: string;
  taskId?: string;
  hasChildren?: boolean;
  isExpanded?: boolean;
  // Period values - dynamic columns
  [periodKey: string]: any;
}

interface PendingAllocation {
  personId: string;
  taskId?: string;
  period: string;
  hours: number;
}

interface FillDragState {
  startRowId: string;
  startRowIndex: number;
  startColId: string;
  startColIndex: number;
  value: number;
  currentRowIndex: number;
  currentColIndex: number;
}

interface AGGridViewProps {
  gridData: any[];
  periods: Period[];
  expandedRows: Set<string>;
  onToggleExpand: (rowId: string) => void;
  pendingAllocations: PendingAllocation[];
  onCellEdit: (rowId: string, period: string, value: number, taskInfo: {
    taskId: string;
    taskName: string;
    projectId: string;
    personId: string;
  }) => void;
  gridHierarchy: 'person' | 'project';
}

// Custom cell renderer for the name column with expand/collapse
const NameCellRenderer: React.FC<ICellRendererParams> = (props) => {
  const data = props.data as GridRowData;
  const level = data.level || 0;
  const hasChildren = data.hasChildren || false;
  const isExpanded = data.isExpanded || false;

  // Get the onToggleExpand from context
  const onToggleExpand = props.context?.onToggleExpand;

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleExpand) {
      onToggleExpand(data.id);
    }
  };

  // Indentation: 24px per level for clear hierarchy
  const indentation = level * 24;

  const getIcon = () => {
    if (data.type === 'person') {
      if (data.avatar) {
        return (
          <img
            src={data.avatar}
            alt=""
            style={{ width: 24, height: 24, borderRadius: '50%', marginRight: 8, flexShrink: 0 }}
          />
        );
      }
      return (
        <div style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          backgroundColor: '#E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          fontWeight: 600,
          color: '#6B7280',
          marginRight: 8,
          flexShrink: 0
        }}>
          {data.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
        </div>
      );
    }
    if (data.type === 'project') {
      return (
        <div style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          backgroundColor: data.color || '#3B82F6',
          marginRight: 8,
          flexShrink: 0
        }} />
      );
    }
    if (data.type === 'task') {
      // No icon for tasks (3rd level) - just indentation
      return null;
    }
    return null;
  };

  // Get styling based on row type
  const getTextStyle = (): React.CSSProperties => {
    if (data.type === 'project') {
      return {
        fontWeight: 700,
        color: '#111827',
        fontSize: 13
      };
    }
    if (data.type === 'task') {
      return {
        fontWeight: 600,
        color: '#374151',
        fontSize: 13
      };
    }
    // Person
    return {
      fontWeight: 400,
      color: '#4B5563',
      fontSize: 13
    };
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      paddingLeft: indentation,
      height: '100%',
      overflow: 'hidden'
    }}>
      {hasChildren ? (
        <button
          onClick={toggleExpand}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 6px',
            marginRight: 4,
            color: '#6B7280',
            fontSize: 10,
            flexShrink: 0
          }}
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      ) : (
        <span style={{ width: 22, flexShrink: 0 }} />
      )}
      {getIcon()}
      <span style={{
        ...getTextStyle(),
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }}>
        {data.name}
        {data.workPackage && (
          <span style={{ color: '#9CA3AF', marginLeft: 6, fontSize: 11, fontWeight: 400 }}>
            ({data.workPackage})
          </span>
        )}
      </span>
    </div>
  );
};

// Hours cell renderer with fill handle
const HoursCellRenderer: React.FC<ICellRendererParams> = (props) => {
  const rawValue = props.value;
  const data = props.data as GridRowData;
  const colId = props.column?.getColId() || '';

  // Convert to number
  const numValue = typeof rawValue === 'number' ? rawValue : parseFloat(rawValue) || 0;

  // Editable if: leaf node with assignment (no children) OR top-level project row (project-level planning).
  // Rows with children are aggregate rows — they display sums but are not directly editable.
  // This handles both hierarchies: in person view, task rows are leaves; in project view, person rows are leaves.
  const isEditable = (!!data.assignment && !data.hasChildren) || data.type === 'project';

  // Check if this cell is in the fill highlight range
  const fillDrag = props.context?.fillDrag as FillDragState | null;
  const isInFillRange = useMemo(() => {
    if (!fillDrag || !props.node || !isEditable) return false;

    const rowIndex = props.node.rowIndex ?? -1;
    const colIndex = props.context?.getColIndex?.(colId) ?? -1;

    if (rowIndex < 0 || colIndex < 0) return false;

    const minRow = Math.min(fillDrag.startRowIndex, fillDrag.currentRowIndex);
    const maxRow = Math.max(fillDrag.startRowIndex, fillDrag.currentRowIndex);
    const minCol = Math.min(fillDrag.startColIndex, fillDrag.currentColIndex);
    const maxCol = Math.max(fillDrag.startColIndex, fillDrag.currentColIndex);

    return rowIndex >= minRow && rowIndex <= maxRow && colIndex >= minCol && colIndex <= maxCol;
  }, [fillDrag, props.node, colId, isEditable, props.context]);

  const handleFillHandleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[FILL] Fill handle mouse down:', {
      rowId: data.id,
      rowIndex: props.node?.rowIndex,
      colId,
      value: numValue,
      hasCallback: !!props.context?.onFillHandleStart
    });
    if (props.context?.onFillHandleStart && props.node) {
      props.context.onFillHandleStart({
        rowId: data.id,
        rowIndex: props.node.rowIndex ?? 0,
        colId,
        value: numValue,
        data
      });
    }
  };

  const displayValue = numValue > 0 ? `${numValue.toFixed(2)}h` : '—';

  // Use CSS class for hover-based fill handle visibility
  const showFillHandle = isEditable && numValue > 0 && !fillDrag;

  return (
    <div
      className={`hours-cell ${showFillHandle ? 'hours-cell-editable' : ''} ${isInFillRange ? 'hours-cell-fill-range' : ''}`}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        fontWeight: numValue > 0 ? 500 : 400,
        color: numValue > 0 ? '#374151' : '#D1D5DB',
        cursor: isEditable ? 'pointer' : 'default',
      }}
    >
      <span>{displayValue}</span>

      {/* Fill handle - uses CSS :hover for visibility */}
      {showFillHandle && (
        <div
          className="fill-handle"
          onMouseDown={handleFillHandleMouseDown}
        />
      )}
    </div>
  );
};

// Cache for period calculations to avoid recalculating
const periodHoursCache = new Map<string, number>();

// Helper to parse dates in various formats (DD/MM/YYYY, ISO, etc.)
function parseDate(dateStr: string | Date | undefined | null): Date | null {
  if (!dateStr) return null;

  // If already a Date object
  if (dateStr instanceof Date) {
    if (!isNaN(dateStr.getTime())) return dateStr;
    return null;
  }

  // Convert to string if needed
  const str = String(dateStr).trim();
  if (!str) return null;

  // Try ISO format first (2025-12-01T00:00:00.000Z or 2025-12-01)
  if (str.includes('T') || str.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) return d;
  }

  // Try DD/MM/YYYY format (with slashes)
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        const d = new Date(year, month, day);
        if (!isNaN(d.getTime())) return d;
      }
    }
  }

  // Try DD-MM-YYYY format (with dashes, common in some locales)
  if (str.match(/^\d{2}-\d{2}-\d{4}$/)) {
    const parts = str.split('-');
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d;
    }
  }

  // Fallback: try native parsing
  const d = new Date(str);
  if (!isNaN(d.getTime())) return d;

  return null;
}

// Helper to calculate hours for a period from assignment (with caching)
function calculatePeriodHours(assignment: Assignment, period: Period): number {
  // Create cache key
  const cacheKey = `${assignment.id}-${period.key}`;
  const cached = periodHoursCache.get(cacheKey);
  if (cached !== undefined) return cached;

  let hours = 0;

  if (assignment.plannedSchedule && assignment.plannedSchedule.length > 0) {
    const periodStart = period.startDate.getTime();
    const periodEnd = period.endDate.getTime();

    // Check if this period falls within the assignment date range
    const assignmentStart = parseDate(assignment.startDate);
    const assignmentEnd = parseDate(assignment.endDate);

    if (!assignmentStart || !assignmentEnd) {
      // No valid assignment dates - can't calculate
      periodHoursCache.set(cacheKey, 0);
      return 0;
    }

    // Period must overlap with assignment range
    if (periodEnd < assignmentStart.getTime() || periodStart > assignmentEnd.getTime()) {
      periodHoursCache.set(cacheKey, 0);
      return 0;
    }

    for (const schedule of assignment.plannedSchedule) {
      // Parse dates properly (handles DD/MM/YYYY and ISO formats)
      const parsedStart = parseDate(schedule.startDate);
      const parsedEnd = parseDate(schedule.endDate);

      const schedHours = parseFloat(schedule.plannedHours || '0');
      if (schedHours <= 0) continue;

      // CASE 1: Entry HAS valid dates - use precise date range
      if (parsedStart && parsedEnd) {
        const schedStart = parsedStart.getTime();
        const schedEnd = parsedEnd.getTime();

        // Quick bounds check
        if (schedEnd < periodStart || schedStart > periodEnd) continue;

        // Proportional calculation based on overlap
        const overlapStart = Math.max(schedStart, periodStart);
        const overlapEnd = Math.min(schedEnd, periodEnd);
        const schedDays = Math.max(1, (schedEnd - schedStart) / 86400000);
        const overlapDays = (overlapEnd - overlapStart) / 86400000;
        hours += schedHours * (overlapDays / schedDays);
      }
      // CASE 2: Entry has NO dates - distribute proportionally across assignment range
      else {
        // Spread the entry's hours proportionally across assignment range
        const assignStart = assignmentStart.getTime();
        const assignEnd = assignmentEnd.getTime();
        const assignDays = Math.max(1, (assignEnd - assignStart) / 86400000);

        // Calculate overlap with current period
        const overlapStart = Math.max(assignStart, periodStart);
        const overlapEnd = Math.min(assignEnd, periodEnd);

        if (overlapEnd > overlapStart) {
          const overlapDays = (overlapEnd - overlapStart) / 86400000;
          hours += schedHours * (overlapDays / assignDays);
        }
      }
    }
  }

  const result = Math.round(hours * 100) / 100;
  periodHoursCache.set(cacheKey, result);
  return result;
}

// Clear cache when data changes (called from component)
function clearPeriodHoursCache() {
  periodHoursCache.clear();
}

// Cache for node totals
const nodeTotalsCache = new Map<string, Record<string, number>>();

// Recursively calculate period totals for a node and all its children (with caching)
function calculateNodePeriodTotals(node: any, periods: Period[]): Record<string, number> {
  // Check cache first
  const cacheKey = `${node.id}-${periods.length}`;
  const cached = nodeTotalsCache.get(cacheKey);
  if (cached) return cached;

  const totals: Record<string, number> = {};

  // Initialize totals
  for (let i = 0; i < periods.length; i++) {
    totals[periods[i].key] = 0;
  }

  // If this node has an assignment, calculate its hours
  if (node.assignment) {
    for (let i = 0; i < periods.length; i++) {
      totals[periods[i].key] += calculatePeriodHours(node.assignment, periods[i]);
    }
  }

  // Add children's totals
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      const childTotals = calculateNodePeriodTotals(child, periods);
      for (let i = 0; i < periods.length; i++) {
        totals[periods[i].key] += childTotals[periods[i].key];
      }
    }
  }

  nodeTotalsCache.set(cacheKey, totals);
  return totals;
}

// Clear all caches
function clearAllCaches() {
  periodHoursCache.clear();
  nodeTotalsCache.clear();
}

export const AGGridView: React.FC<AGGridViewProps> = ({
  gridData,
  periods,
  expandedRows,
  onToggleExpand,
  pendingAllocations,
  onCellEdit,
  gridHierarchy
}) => {
  const gridRef = useRef<AgGridReact>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fill drag state
  const [fillDrag, setFillDrag] = useState<FillDragState | null>(null);

  // Flag to skip onCellValueChanged during fill operations
  const isFillingRef = useRef(false);

  // Loading state for heavy recalculations
  const [isCalculating, setIsCalculating] = useState(false);

  // Clear caches when data or periods change so stale calculation results don't persist
  const periodsKey = periods.map(p => p.key).join(',');
  useEffect(() => { clearAllCaches(); }, [periodsKey]);
  useEffect(() => { clearAllCaches(); }, [gridData]);

  // Build column index map for quick lookup
  const periodColIndexMap = useMemo(() => {
    const map: Record<string, number> = {};
    periods.forEach((p, idx) => {
      map[p.key] = idx;
    });
    return map;
  }, [periods]);

  // Count total children to detect when data structure changes
  const dataStructureKey = useMemo(() => {
    let count = 0;
    const countChildren = (nodes: any[]) => {
      nodes.forEach(node => {
        if (node.children && node.children.length > 0) {
          count += node.children.length;
          countChildren(node.children);
        }
      });
    };
    countChildren(gridData);
    return count;
  }, [gridData]);

  // Flatten hierarchical data for AG Grid
  const rowData = useMemo(() => {
    const rows: GridRowData[] = [];

    // Build pending lookup: "personId:period:taskId" -> hours
    const pendingByKey = new Map<string, number>();
    pendingAllocations.forEach(p => {
      const key = `${p.personId}:${p.period}:${p.taskId || ''}`;
      pendingByKey.set(key, p.hours);
    });

    // Recursively compute period values for a node, using pending overrides where available.
    // For project nodes: sum of task children (with pending overrides). If the sum for a period
    // is 0, fall back to any direct project-level pending (taskId='') for that period.
    // This means: entering 50 at project level shows 50; entering 90 at a task then shows 90.
    const computeNodeValues = (node: any, currentPersonId: string | undefined): Record<string, number> => {
      const values: Record<string, number> = {};
      periods.forEach(p => { values[p.key] = 0; });

      if (node.assignment) {
        const taskId = node.taskId || node.assignment.taskId;
        periods.forEach(period => {
          const pendingKey = `${currentPersonId}:${period.key}:${taskId}`;
          const pending = pendingByKey.get(pendingKey);
          values[period.key] = pending !== undefined ? pending : calculatePeriodHours(node.assignment, period);
        });
      } else if (node.children && node.children.length > 0) {
        const childPersonId = node.type === 'person' ? node.id : currentPersonId;
        node.children.forEach((child: any) => {
          const childValues = computeNodeValues(child, childPersonId);
          periods.forEach(period => {
            values[period.key] += childValues[period.key];
          });
        });
        // For project rows: if tasks sum to 0 for a period, show direct project-level pending instead
        if (node.type === 'project') {
          periods.forEach(period => {
            if (values[period.key] === 0) {
              const directKey = `${currentPersonId}:${period.key}:`;
              const directPending = pendingByKey.get(directKey);
              if (directPending !== undefined) {
                values[period.key] = directPending;
              }
            }
          });
        }
      }

      return values;
    };

    const processNode = (node: any, level: number, parentId?: string, personId?: string) => {
      const hasChildren = node.children && node.children.length > 0;
      const isExpanded = expandedRows.has(node.id);

      // Determine personId for this node and its descendants.
      // Use node.personId (explicit real member ID) if set, else node.id.
      // In project hierarchy, person nodes have id="taskId:memberId" but personId="memberId".
      const currentPersonId = node.type === 'person' ? (node.personId || node.userId || node.id) : personId;

      const row: GridRowData = {
        id: node.id,
        name: node.name,
        type: node.type,
        level,
        parentId,
        avatar: node.avatar,
        color: node.color,
        department: node.department,
        capacity: node.capacity,
        workPackage: node.workPackage,
        assignment: node.assignment,
        personId: currentPersonId,
        taskId: node.taskId || node.assignment?.taskId,
        hasChildren,
        isExpanded
      };

      // Calculate period values incorporating pending overrides
      const nodeValues = computeNodeValues(node, currentPersonId);
      periods.forEach(period => {
        row[period.key] = nodeValues[period.key];
      });

      rows.push(row);

      // Process children if expanded
      if (hasChildren && isExpanded) {
        node.children.forEach((child: any) => {
          processNode(child, level + 1, node.id, currentPersonId);
        });
      }
    };

    gridData.forEach(node => processNode(node, 0));

    return rows;
  }, [gridData, periods, expandedRows, pendingAllocations]);

  // Handle fill handle drag start
  const handleFillHandleStart = useCallback((info: {
    rowId: string;
    rowIndex: number;
    colId: string;
    value: number;
    data: GridRowData;
  }) => {
    console.log('[FILL] Fill handle started:', info);

    const colIndex = periodColIndexMap[info.colId] ?? -1;
    if (colIndex < 0) {
      console.log('[FILL] Invalid column index for colId:', info.colId);
      return;
    }

    console.log('[FILL] Starting fill drag from:', {
      rowIndex: info.rowIndex,
      colIndex,
      value: info.value
    });

    setFillDrag({
      startRowId: info.rowId,
      startRowIndex: info.rowIndex,
      startColId: info.colId,
      startColIndex: colIndex,
      value: info.value,
      currentRowIndex: info.rowIndex,
      currentColIndex: colIndex
    });
  }, [periodColIndexMap]);

  // Handle mouse move during fill drag
  useEffect(() => {
    if (!fillDrag) return;

    const handleMouseMove = (e: MouseEvent) => {
      const gridApi = gridRef.current?.api;
      if (!gridApi) return;

      const container = containerRef.current;
      if (!container) return;

      let targetRowIndex = fillDrag.currentRowIndex;
      let targetColIndex = fillDrag.currentColIndex;

      // --- Row detection: node.rowTop is absolute in scroll area, so add scroll offset ---
      const rect = container.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const scrollTop = (gridApi as any).getVerticalPixelRange?.()?.top ?? 0;
      // Header height is 44px (matches headerHeight prop)
      const adjustedY = y - 44 + scrollTop;

      const renderedNodes = gridApi.getRenderedNodes();
      for (const node of renderedNodes) {
        if (node.rowIndex === null || node.rowIndex === undefined) continue;
        const rowTop = node.rowTop ?? 0;
        const rowHeight = node.rowHeight ?? 40;
        if (adjustedY >= rowTop && adjustedY < rowTop + rowHeight) {
          targetRowIndex = node.rowIndex;
          break;
        }
      }

      // --- Column detection: use DOM elementFromPoint for reliability across scroll positions ---
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const cellEl = el?.closest?.('[col-id]') as HTMLElement | null;
      if (cellEl) {
        const colId = cellEl.getAttribute('col-id');
        if (colId && colId in periodColIndexMap) {
          targetColIndex = periodColIndexMap[colId];
        }
      }

      if (targetRowIndex !== fillDrag.currentRowIndex || targetColIndex !== fillDrag.currentColIndex) {
        setFillDrag(prev => prev ? {
          ...prev,
          currentRowIndex: targetRowIndex,
          currentColIndex: targetColIndex
        } : null);
        // Force AG Grid cells to re-render so fill-range highlight updates
        gridRef.current?.api?.refreshCells({ force: true });
      }
    };

    const handleMouseUp = () => {
      if (!fillDrag) return;

      const gridApi = gridRef.current?.api;
      if (!gridApi) {
        setFillDrag(null);
        return;
      }

      // BI-DIRECTIONAL FILL - supports horizontal, vertical, and rectangular fill
      const minRow = Math.min(fillDrag.startRowIndex, fillDrag.currentRowIndex);
      const maxRow = Math.max(fillDrag.startRowIndex, fillDrag.currentRowIndex);
      const minCol = Math.min(fillDrag.startColIndex, fillDrag.currentColIndex);
      const maxCol = Math.max(fillDrag.startColIndex, fillDrag.currentColIndex);

      const fillDirection =
        minRow === maxRow ? 'horizontal' :
        minCol === maxCol ? 'vertical' : 'rectangular';

      console.log('[FILL] Range:', {
        direction: fillDirection,
        rows: `${minRow}-${maxRow}`,
        cols: `${minCol}-${maxCol}`,
        value: fillDrag.value
      });

      // Get period keys for the column range
      const periodKeys = periods.slice(minCol, maxCol + 1).map(p => p.key);
      console.log('[FILL] Period keys:', periodKeys);

      // Collect all valid target rows in the range
      const targetNodes: Array<{ node: any; data: GridRowData }> = [];

      gridApi.forEachNode((node) => {
        const rowIndex = node.rowIndex;
        if (rowIndex === null || rowIndex === undefined) return;
        if (rowIndex < minRow || rowIndex > maxRow) return;

        const data = node.data as GridRowData;

        // Include leaf rows with assignments (no children) OR project rows (project-level planning)
        if ((!data.assignment || data.hasChildren) && data.type !== 'project') {
          console.log('[FILL] Skipping non-editable row:', data.name);
          return;
        }

        targetNodes.push({ node, data });
      });

      console.log('[FILL] Valid target rows:', targetNodes.length);

      if (targetNodes.length === 0) {
        console.log('[FILL] No valid rows to fill');
        setFillDrag(null);
        return;
      }

      // Set flag to prevent onCellValueChanged from double-triggering
      isFillingRef.current = true;

      // Apply updates to all cells in the rectangle
      let updateCount = 0;

      targetNodes.forEach(({ node, data }) => {
        // Extract effective IDs for this row
        const isProjectRow = data.type === 'project' && !data.assignment;
        const effectiveTaskId = isProjectRow ? '' : (data.taskId || data.assignment!.taskId);
        let effectivePersonId = data.personId || '';

        // For project rows in person hierarchy the row id is "personId:projectId"
        if (isProjectRow && !effectivePersonId && data.id.includes(':')) {
          effectivePersonId = data.id.split(':')[0];
        }

        if (effectivePersonId && effectivePersonId.includes(':')) {
          const parts = effectivePersonId.split(':');
          effectivePersonId = parts[parts.length - 1];
        }

        const effectiveProjectId = isProjectRow
          ? (effectivePersonId && data.id.startsWith(effectivePersonId + ':')
              ? data.id.slice(effectivePersonId.length + 1)
              : data.id)
          : (data.assignment?.projectId || '');

        // Check for invalid personId (non-project rows only)
        if (!isProjectRow && (!effectivePersonId || effectivePersonId === effectiveTaskId)) {
          console.log('[FILL] Skipping row - invalid personId:', data.name);
          return;
        }

        // Apply value to each column in range
        periodKeys.forEach(periodKey => {
          // Skip the source cell (the original cell we're filling from)
          if (node.rowIndex === fillDrag.startRowIndex && periodKey === fillDrag.startColId) {
            console.log('[FILL] Skipping source cell:', periodKey);
            return;
          }

          console.log('[FILL] Applying update:', {
            rowId: data.id,
            rowName: data.name,
            periodKey,
            value: fillDrag.value,
            effectivePersonId,
            effectiveTaskId,
            isProjectRow
          });

          // Update grid cell visually
          node.setDataValue(periodKey, fillDrag.value);

          // Notify parent for pending allocation / API call
          onCellEdit(
            data.id,
            periodKey,
            fillDrag.value,
            {
              taskId: effectiveTaskId,
              taskName: isProjectRow ? '' : data.assignment!.taskName,
              projectId: effectiveProjectId,
              personId: effectivePersonId
            }
          );

          updateCount++;
        });
      });

      console.log('[FILL] Total updates applied:', updateCount);

      // Refresh cells to show updated values (BEFORE resetting flag!)
      gridApi.refreshCells({ force: true });

      // Reset flag AFTER refresh to prevent duplicate onCellValueChanged calls
      // Use setTimeout to ensure all sync events from refreshCells are processed
      setTimeout(() => {
        isFillingRef.current = false;
      }, 100);

      setFillDrag(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [fillDrag, periods, onCellEdit, periodColIndexMap]);

  // Format period label to show "Dec 2025" format
  const formatPeriodLabel = (period: Period): string => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[period.startDate.getMonth()];
    const year = period.startDate.getFullYear();
    return `${month} ${year}`;
  };

  // Column definitions
  const columnDefs = useMemo<ColDef[]>(() => {
    const cols: ColDef[] = [
      {
        field: 'name',
        headerName: gridHierarchy === 'person' ? 'Person / Project / Task' : 'Project / Task / Person',
        pinned: 'left',
        width: 360,
        minWidth: 300,
        resizable: true,
        cellRenderer: NameCellRenderer,
        suppressMovable: true,
        cellStyle: (params) => {
          const data = params.data as GridRowData;
          // Row background by type - matches row class
          if (data.type === 'project') {
            return {
              backgroundColor: '#F5F5F5',
              borderBottom: '1px solid #E5E7EB'
            };
          }
          if (data.type === 'task') {
            return {
              backgroundColor: '#FAFAFA',
              borderBottom: '1px solid #E5E7EB'
            };
          }
          return {
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid #E5E7EB'
          };
        }
      }
    ];

    // Add period columns
    periods.forEach(period => {
      cols.push({
        field: period.key,
        headerName: formatPeriodLabel(period),
        width: 90,
        editable: (params) => {
          const data = params.data as GridRowData;
          // Leaf nodes with assignment (no children) OR project rows (project-level planning)
          return (!!data.assignment && !data.hasChildren) || data.type === 'project';
        },
        cellRenderer: HoursCellRenderer,
        cellStyle: (params: CellClassParams) => {
          const data = params.data as GridRowData;
          const value = params.value;
          const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;

          // Base style with border
          const baseStyle: any = {
            borderRight: '1px solid #E5E7EB',
            borderBottom: '1px solid #E5E7EB'
          };

          // Row background by type
          if (data.type === 'project') {
            baseStyle.backgroundColor = '#F8F9FA';
            baseStyle.fontWeight = 600;
          } else if (data.type === 'task') {
            baseStyle.backgroundColor = '#FFFFFF';
            baseStyle.fontWeight = 500;
          } else {
            baseStyle.backgroundColor = '#FFFFFF';
          }

          // Check for pending allocation (task-level uses taskId, project-level has no taskId)
          const isPending = pendingAllocations.some(p =>
            p.personId === data.personId &&
            p.period === period.key &&
            (data.type === 'project'
              ? (!p.taskId || p.taskId === '')  // project-level: match entries with no taskId
              : p.taskId === data.taskId)
          );

          if (isPending) {
            return { ...baseStyle, backgroundColor: '#D1FAE5', color: '#047857' };
          }

          // Unscheduled (has allocation but no scheduled hours)
          if (data.assignment?.allocatedHours > 0 && (!numValue || numValue === 0)) {
            return { ...baseStyle, backgroundColor: '#FEF3C7', color: '#B45309' };
          }

          // Over-allocation warning (value > capacity indicator)
          // For parent rows, if total exceeds typical threshold
          if (data.type === 'person' && data.capacity && numValue > data.capacity * 4) {
            return { ...baseStyle, color: '#DC2626', fontWeight: 600 };
          }

          return baseStyle;
        },
        valueFormatter: (params: ValueFormatterParams) => {
          const num = typeof params.value === 'number' ? params.value : parseFloat(params.value);
          if (!num || isNaN(num) || num === 0) return '—';
          return `${num.toFixed(2)}h`;
        },
        valueParser: (params) => {
          // Convert string input to number
          return parseFloat(params.newValue) || 0;
        }
      });
    });

    // Total column
    cols.push({
      field: 'total',
      headerName: 'Total',
      width: 100,
      pinned: 'right',
      valueGetter: (params) => {
        let total = 0;
        periods.forEach(p => {
          const val = params.data[p.key];
          const num = typeof val === 'number' ? val : parseFloat(val) || 0;
          total += num;
        });
        return total;
      },
      valueFormatter: (params: ValueFormatterParams) => {
        const num = typeof params.value === 'number' ? params.value : parseFloat(params.value);
        if (!num || isNaN(num) || num === 0) return '—';
        return `${num.toFixed(1)}h`;
      },
      cellStyle: (params) => {
        const data = params.data as GridRowData;
        const baseStyle: any = {
          fontWeight: 600,
          backgroundColor: '#F3F4F6',
          borderLeft: '2px solid #D1D5DB',
          textAlign: 'center'
        };

        // Darker background for project rows
        if (data.type === 'project') {
          baseStyle.backgroundColor = '#E5E7EB';
        }

        return baseStyle;
      }
    });

    return cols;
  }, [periods, pendingAllocations, gridHierarchy]);

  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
    sortable: false,
    suppressHeaderMenuButton: true,
    cellStyle: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }), []);

  // Row class based on data type
  const getRowClass = useCallback((params: any) => {
    const data = params.data as GridRowData;
    if (data.type === 'project') return 'ag-row-project';
    if (data.type === 'task') return 'ag-row-task';
    return 'ag-row-person';
  }, []);

  const onCellValueChanged = useCallback((event: CellValueChangedEvent) => {
    // Skip if we're in the middle of a fill operation (we handle those explicitly)
    if (isFillingRef.current) {
      console.log('[AG Grid] Skipping onCellValueChanged during fill operation');
      return;
    }

    const data = event.data as GridRowData;
    const colId = event.column.getColId();
    const newValue = parseFloat(event.newValue) || 0;

    if (newValue > 0) {
      if (data.assignment) {
        // Task-level edit (existing behaviour)
        onCellEdit(
          data.id,
          colId,
          newValue,
          {
            taskId: data.taskId || data.assignment.taskId,
            taskName: data.assignment.taskName,
            projectId: data.assignment.projectId,
            personId: data.personId || data.id
          }
        );
      } else if (data.type === 'project') {
        // Project-level edit — no taskId, personId comes from parent
        const personId = data.personId || '';
        // Extract actual projectId from compound row id (format: "personId:projectId")
        const projectId = personId && data.id.startsWith(personId + ':')
          ? data.id.slice(personId.length + 1)
          : data.id;
        onCellEdit(
          data.id,
          colId,
          newValue,
          {
            taskId: '',  // empty = project-level allocation
            taskName: '',
            projectId,
            personId
          }
        );
      }
    }
  }, [onCellEdit]);

  const getRowId = useCallback((params: any) => params.data.id, []);

  // Helper to get column index
  const getColIndex = useCallback((colId: string) => {
    return periodColIndexMap[colId] ?? -1;
  }, [periodColIndexMap]);

  // Context passed to cell renderers
  const context = useMemo(() => ({
    onToggleExpand,
    onFillHandleStart: handleFillHandleStart,
    fillDrag,
    getColIndex
  }), [onToggleExpand, handleFillHandleStart, fillDrag, getColIndex]);

  // Custom theme with styling overrides
  const customTheme = useMemo(() => {
    return themeQuartz.withParams({
      headerBackgroundColor: '#F9FAFB',
      headerTextColor: '#374151',
      headerFontWeight: 600,
      headerFontSize: 12,
      borderColor: '#E5E7EB',
      rowBorder: true,
      cellHorizontalPadding: 8,
      fontSize: 13
    });
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        height: 'calc(100vh - 290px)',
        minHeight: 400,
        width: '100%',
        position: 'relative'
      }}
    >
      {/* Custom CSS for row styling */}
      <style>{`
        .ag-row-project {
          background-color: #F5F5F5 !important;
          font-weight: 600;
        }
        .ag-row-project:hover {
          background-color: #EBEBEB !important;
        }
        .ag-row-task {
          background-color: #FAFAFA !important;
        }
        .ag-row-task:hover {
          background-color: #F5F5F5 !important;
        }
        .ag-row-person {
          background-color: #FFFFFF !important;
        }
        .ag-row-person:hover {
          background-color: #F9FAFB !important;
        }
        .ag-header-cell {
          font-weight: 600 !important;
          background-color: #F9FAFB !important;
        }
        .ag-cell {
          border-right: 1px solid #E5E7EB !important;
          border-bottom: 1px solid #E5E7EB !important;
        }
        .ag-pinned-left-cols-container .ag-cell {
          border-right: 2px solid #D1D5DB !important;
        }
        .ag-pinned-right-cols-container .ag-cell {
          border-left: 2px solid #D1D5DB !important;
        }
        /* Hide any checkbox column */
        .ag-selection-checkbox {
          display: none !important;
        }
        .ag-header-select-all {
          display: none !important;
        }
        /* Ensure cells don't clip fill handle */
        .ag-cell {
          overflow: visible !important;
        }
        .ag-cell-wrapper {
          overflow: visible !important;
        }

        /* Hours cell styling */
        .hours-cell {
          position: relative;
        }

        /* Fill handle - hidden by default */
        .fill-handle {
          position: absolute;
          right: 2px;
          bottom: 2px;
          width: 10px;
          height: 10px;
          background-color: #2563EB;
          cursor: crosshair;
          z-index: 100;
          border-radius: 2px;
          border: 1px solid white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          opacity: 0;
          transition: opacity 0.15s ease;
          pointer-events: none;
        }

        /* Show fill handle on cell hover */
        .hours-cell-editable:hover .fill-handle {
          opacity: 1;
          pointer-events: auto;
        }

        /* Fill range highlight */
        .hours-cell-fill-range {
          background-color: #DBEAFE !important;
          outline: 2px solid #3B82F6 !important;
        }
      `}</style>

      <AgGridReact
        key={`grid-${dataStructureKey}`}
        ref={gridRef}
        theme={customTheme}
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        getRowId={getRowId}
        getRowClass={getRowClass}
        context={context}
        animateRows={false}
        onCellValueChanged={onCellValueChanged}
        rowHeight={40}
        headerHeight={44}
        suppressCellFocus={false}
        enableCellTextSelection={true}
        stopEditingWhenCellsLoseFocus={true}
      />

      {/* Drag overlay indicator */}
      {fillDrag && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            cursor: 'crosshair',
            zIndex: 1000,
            pointerEvents: 'none'
          }}
        />
      )}

      {/* Loading overlay */}
      {isCalculating && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100
          }}
        >
          <div style={{
            padding: '12px 24px',
            backgroundColor: '#F3F4F6',
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            color: '#374151',
            fontSize: 14
          }}>
            Calculating...
          </div>
        </div>
      )}
    </div>
  );
};

export default AGGridView;
