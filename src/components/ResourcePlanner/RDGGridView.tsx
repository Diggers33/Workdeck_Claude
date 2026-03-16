/**
 * RDGGridView - React Data Grid implementation
 *
 * Uses react-data-grid (Adazzle) for Excel-like features:
 * - Built-in drag-to-fill (onFill)
 * - Copy/paste
 * - Cell editing
 * - Virtual scrolling
 *
 * Note: We use DataGrid (not TreeDataGrid) because TreeDataGrid doesn't support onFill.
 * Hierarchy is handled by manually flattening rows with indentation.
 */

import React, { useMemo, useCallback, useState, useEffect } from 'react';
import DataGrid, { Column, RenderEditCellProps, FillEvent } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';

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

interface RDGGridViewProps {
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

// Cache for period calculations
const periodHoursCache = new Map<string, number>();

function calculatePeriodHours(assignment: Assignment, period: Period): number {
  const cacheKey = `${assignment.id}-${period.key}`;
  const cached = periodHoursCache.get(cacheKey);
  if (cached !== undefined) return cached;

  let hours = 0;

  if (assignment.plannedSchedule && assignment.plannedSchedule.length > 0) {
    const periodStart = period.startDate.getTime();
    const periodEnd = period.endDate.getTime();

    for (const schedule of assignment.plannedSchedule) {
      const schedStart = new Date(schedule.startDate || assignment.startDate).getTime();
      const schedEnd = new Date(schedule.endDate || assignment.endDate).getTime();
      const schedHours = parseFloat(schedule.plannedHours || '0');

      if (schedEnd < periodStart || schedStart > periodEnd || schedHours <= 0) continue;

      const overlapStart = Math.max(schedStart, periodStart);
      const overlapEnd = Math.min(schedEnd, periodEnd);
      const schedDays = Math.max(1, (schedEnd - schedStart) / 86400000);
      const overlapDays = (overlapEnd - overlapStart) / 86400000;
      hours += schedHours * (overlapDays / schedDays);
    }
  }

  const result = Math.round(hours * 100) / 100;
  periodHoursCache.set(cacheKey, result);
  return result;
}

// Cache for node totals
const nodeTotalsCache = new Map<string, Record<string, number>>();

function calculateNodePeriodTotals(node: any, periods: Period[]): Record<string, number> {
  const cacheKey = `${node.id}-${periods.length}`;
  const cached = nodeTotalsCache.get(cacheKey);
  if (cached) return cached;

  const totals: Record<string, number> = {};
  for (const period of periods) {
    totals[period.key] = 0;
  }

  if (node.assignment) {
    for (const period of periods) {
      totals[period.key] += calculatePeriodHours(node.assignment, period);
    }
  }

  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      const childTotals = calculateNodePeriodTotals(child, periods);
      for (const period of periods) {
        totals[period.key] += childTotals[period.key];
      }
    }
  }

  nodeTotalsCache.set(cacheKey, totals);
  return totals;
}

// Clear caches
function clearCaches() {
  periodHoursCache.clear();
  nodeTotalsCache.clear();
}

// Custom cell renderer for name column
function NameCell({ row, onToggleExpand }: { row: GridRowData; onToggleExpand: (id: string) => void }) {
  const indent = row.level * 24;
  const hasChildren = row.hasChildren;
  const isExpanded = row.isExpanded;

  const getIcon = () => {
    if (row.type === 'person') {
      if (row.avatar) {
        return (
          <img
            src={row.avatar}
            alt=""
            style={{ width: 24, height: 24, borderRadius: '50%', marginRight: 8 }}
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
        }}>
          {row.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
        </div>
      );
    }
    if (row.type === 'project') {
      return (
        <div style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          backgroundColor: row.color || '#3B82F6',
          marginRight: 8,
        }} />
      );
    }
    return null;
  };

  const getTextStyle = (): React.CSSProperties => {
    if (row.type === 'project') {
      return { fontWeight: 700, color: '#111827', fontSize: 13 };
    }
    if (row.type === 'task') {
      return { fontWeight: 600, color: '#374151', fontSize: 13 };
    }
    return { fontWeight: 400, color: '#4B5563', fontSize: 13 };
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      paddingLeft: indent,
      height: '100%',
      overflow: 'hidden',
    }}>
      {hasChildren ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand(row.id);
          }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 6px',
            marginRight: 4,
            color: '#6B7280',
            fontSize: 10,
          }}
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      ) : (
        <span style={{ width: 22 }} />
      )}
      {getIcon()}
      <span style={{
        ...getTextStyle(),
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {row.name}
        {row.workPackage && (
          <span style={{ color: '#9CA3AF', marginLeft: 6, fontSize: 11, fontWeight: 400 }}>
            ({row.workPackage})
          </span>
        )}
      </span>
    </div>
  );
}

// Hours editor component
function HoursEditor({ row, column, onRowChange, onClose }: RenderEditCellProps<GridRowData>) {
  const value = row[column.key] || 0;

  return (
    <input
      autoFocus
      type="number"
      value={value}
      onChange={(e) => {
        const newValue = parseFloat(e.target.value) || 0;
        onRowChange({ ...row, [column.key]: newValue });
      }}
      onBlur={() => onClose(true)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          onClose(true);
        } else if (e.key === 'Escape') {
          onClose(false);
        }
      }}
      style={{
        width: '100%',
        height: '100%',
        padding: '4px 8px',
        border: '2px solid #2563EB',
        borderRadius: 4,
        fontSize: 12,
        textAlign: 'center',
        outline: 'none',
      }}
    />
  );
}

export const RDGGridView: React.FC<RDGGridViewProps> = ({
  gridData,
  periods,
  expandedRows,
  onToggleExpand,
  pendingAllocations,
  onCellEdit,
  gridHierarchy,
}) => {
  // Track source cell for horizontal fill (Shift+Click)
  const [fillSource, setFillSource] = useState<{
    rowIdx: number;
    rowId: string;
    columnKey: string;
    value: number;
  } | null>(null);

  // Clear caches when periods change
  const periodsKey = periods.map(p => p.key).join(',');
  useEffect(() => {
    clearCaches();
  }, [periodsKey]);

  // Flatten hierarchical data from props
  const computedRows = useMemo(() => {
    const result: GridRowData[] = [];

    const processNode = (node: any, level: number, parentId?: string, personId?: string) => {
      const hasChildren = node.children && node.children.length > 0;
      const isExpanded = expandedRows.has(node.id);
      const currentPersonId = node.type === 'person' ? node.id : personId;

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
        isExpanded,
      };

      // Calculate period values
      if (node.assignment) {
        periods.forEach(period => {
          row[period.key] = calculatePeriodHours(node.assignment, period);
        });
      } else if (hasChildren) {
        const totals = calculateNodePeriodTotals(node, periods);
        periods.forEach(period => {
          row[period.key] = totals[period.key];
        });
      }

      result.push(row);

      if (hasChildren && isExpanded) {
        node.children.forEach((child: any) => {
          processNode(child, level + 1, node.id, currentPersonId);
        });
      }
    };

    gridData.forEach(node => processNode(node, 0));
    return result;
  }, [gridData, periods, expandedRows]);

  // Local row state for react-data-grid (required for fill to work)
  const [rows, setRows] = useState<GridRowData[]>(computedRows);

  // Sync local rows when computed rows change
  useEffect(() => {
    setRows(computedRows);
  }, [computedRows]);

  // Format period label
  const formatPeriodLabel = (period: Period): string => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[period.startDate.getMonth()];
    const year = period.startDate.getFullYear();
    return `${month} ${year}`;
  };

  // Extract real personId from composite ID
  const extractPersonId = (compositeId: string | undefined): string => {
    if (!compositeId) return '';
    if (compositeId.includes(':')) {
      const parts = compositeId.split(':');
      return parts[parts.length - 1];
    }
    return compositeId;
  };

  // Column definitions
  const columns = useMemo<Column<GridRowData>[]>(() => {
    const cols: Column<GridRowData>[] = [
      {
        key: 'name',
        name: gridHierarchy === 'person' ? 'Person / Project / Task' : 'Project / Task / Person',
        frozen: true,
        width: 360,
        renderCell: (props) => (
          <NameCell row={props.row} onToggleExpand={onToggleExpand} />
        ),
        cellClass: (row) => {
          if (row.type === 'project') return 'rdg-cell-project';
          if (row.type === 'task') return 'rdg-cell-task';
          return 'rdg-cell-person';
        },
      },
    ];

    // Add period columns
    periods.forEach(period => {
      cols.push({
        key: period.key,
        name: formatPeriodLabel(period),
        width: 90,
        editable: (row) => !!row.assignment,
        renderEditCell: HoursEditor,
        renderCell: (props) => {
          const value = props.row[period.key];
          const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
          const isPending = pendingAllocations.some(p =>
            p.personId === extractPersonId(props.row.personId) &&
            p.period === period.key &&
            p.taskId === props.row.taskId
          );

          return (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: numValue > 0 ? 500 : 400,
              color: isPending ? '#047857' : (numValue > 0 ? '#374151' : '#D1D5DB'),
              backgroundColor: isPending ? '#D1FAE5' : 'transparent',
            }}>
              {numValue > 0 ? `${numValue.toFixed(2)}h` : '—'}
            </div>
          );
        },
        cellClass: (row) => {
          if (row.type === 'project') return 'rdg-cell-project';
          if (row.type === 'task') return 'rdg-cell-task';
          return 'rdg-cell-person';
        },
      });
    });

    // Total column
    cols.push({
      key: 'total',
      name: 'Total',
      width: 100,
      frozen: true,
      renderCell: (props) => {
        let total = 0;
        periods.forEach(p => {
          const val = props.row[p.key];
          total += typeof val === 'number' ? val : parseFloat(val) || 0;
        });
        return (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
            backgroundColor: '#F3F4F6',
          }}>
            {total > 0 ? `${total.toFixed(1)}h` : '—'}
          </div>
        );
      },
      cellClass: () => 'rdg-cell-total',
    });

    return cols;
  }, [periods, pendingAllocations, gridHierarchy, onToggleExpand]);

  // Handle rows change (from editing and fill)
  const handleRowsChange = useCallback((newRows: GridRowData[], { indexes, column }: { indexes: number[]; column: Column<GridRowData> }) => {
    console.log('[RDG] Rows changed:', { indexes, columnKey: column?.key });

    // IMPORTANT: Always update local state so grid re-renders
    setRows(newRows);

    indexes.forEach(idx => {
      const row = newRows[idx];
      const periodKey = column?.key;

      if (!periodKey || !row.assignment) return;

      const newValue = row[periodKey];
      const numValue = typeof newValue === 'number' ? newValue : parseFloat(newValue) || 0;

      // Allow 0 values too - user might want to clear a cell
      const effectivePersonId = extractPersonId(row.personId);
      const effectiveTaskId = row.taskId || row.assignment.taskId;

      // Skip if invalid IDs
      if (!effectivePersonId || effectivePersonId === effectiveTaskId) {
        console.log('[RDG] Skip - invalid personId:', { effectivePersonId, effectiveTaskId });
        return;
      }

      console.log('[RDG] Cell edit:', {
        rowId: row.id,
        periodKey,
        value: numValue,
        personId: effectivePersonId,
        taskId: effectiveTaskId,
      });

      onCellEdit(
        row.id,
        periodKey,
        numValue,
        {
          taskId: effectiveTaskId,
          taskName: row.assignment.taskName,
          projectId: row.assignment.projectId,
          personId: effectivePersonId,
        }
      );
    });
  }, [onCellEdit]);

  // Handle fill (drag-to-fill)
  const handleFill = useCallback((event: FillEvent<GridRowData>): GridRowData => {
    console.log('[RDG] *** FILL EVENT ***:', {
      columnKey: event.columnKey,
      sourceRowId: event.sourceRow.id,
      sourceRowName: event.sourceRow.name,
      targetRowId: event.targetRow.id,
      targetRowName: event.targetRow.name,
      sourceValue: event.sourceRow[event.columnKey],
    });

    const sourceValue = event.sourceRow[event.columnKey];
    const targetRow = event.targetRow;

    // Only fill if target has assignment (editable)
    if (!targetRow.assignment) {
      console.log('[RDG] Skip fill - target has no assignment');
      return targetRow;
    }

    // Get the value to fill
    const fillValue = typeof sourceValue === 'number' ? sourceValue : parseFloat(sourceValue) || 0;

    // Extract correct personId
    const effectivePersonId = extractPersonId(targetRow.personId);
    const effectiveTaskId = targetRow.taskId || targetRow.assignment.taskId;

    // Validate personId
    if (!effectivePersonId || effectivePersonId === effectiveTaskId) {
      console.log('[RDG] Skip fill - invalid personId');
      return targetRow;
    }

    console.log('[RDG] Applying fill:', {
      targetRowId: targetRow.id,
      columnKey: event.columnKey,
      value: fillValue,
      personId: effectivePersonId,
      taskId: effectiveTaskId,
    });

    // Notify parent
    onCellEdit(
      targetRow.id,
      event.columnKey,
      fillValue,
      {
        taskId: effectiveTaskId,
        taskName: targetRow.assignment.taskName,
        projectId: targetRow.assignment.projectId,
        personId: effectivePersonId,
      }
    );

    // Return updated row
    return { ...targetRow, [event.columnKey]: fillValue };
  }, [onCellEdit]);

  // Get period column index
  const getPeriodIndex = useCallback((periodKey: string): number => {
    return periods.findIndex(p => p.key === periodKey);
  }, [periods]);

  // Handle horizontal fill (Shift+Click)
  const handleCellClick = useCallback((args: any, event: any) => {
    const { row, column } = args;
    const columnKey = column?.key;
    const rowIdx = rows.findIndex(r => r.id === row?.id);

    console.log('[RDG] Cell clicked:', {
      rowIdx,
      columnKey,
      rowId: row?.id,
      hasAssignment: !!row?.assignment,
      shiftKey: event?.shiftKey,
      fillSource: fillSource,
    });

    // Only handle period columns (not name or total)
    if (!columnKey || columnKey === 'name' || columnKey === 'total') {
      setFillSource(null);
      return;
    }

    // Only for rows with assignments (editable)
    if (!row?.assignment) {
      setFillSource(null);
      return;
    }

    // Shift+Click: fill from source to target
    if (event?.shiftKey && fillSource && fillSource.rowId === row.id) {
      const sourceColIdx = getPeriodIndex(fillSource.columnKey);
      const targetColIdx = getPeriodIndex(columnKey);

      if (sourceColIdx !== -1 && targetColIdx !== -1 && sourceColIdx !== targetColIdx) {
        const startIdx = Math.min(sourceColIdx, targetColIdx);
        const endIdx = Math.max(sourceColIdx, targetColIdx);

        console.log('[RDG] *** HORIZONTAL FILL ***:', {
          sourceValue: fillSource.value,
          fromColumn: fillSource.columnKey,
          toColumn: columnKey,
          columnsToFill: endIdx - startIdx + 1,
        });

        // Fill all columns between source and target
        const effectivePersonId = extractPersonId(row.personId);
        const effectiveTaskId = row.taskId || row.assignment.taskId;

        const updatedRows = [...rows];

        for (let i = startIdx; i <= endIdx; i++) {
          const periodKey = periods[i].key;

          // Update local row state
          updatedRows[rowIdx] = {
            ...updatedRows[rowIdx],
            [periodKey]: fillSource.value,
          };

          // Notify parent for each cell
          onCellEdit(
            row.id,
            periodKey,
            fillSource.value,
            {
              taskId: effectiveTaskId,
              taskName: row.assignment.taskName,
              projectId: row.assignment.projectId,
              personId: effectivePersonId,
            }
          );
        }

        setRows(updatedRows);
        setFillSource(null);
        return;
      }
    }

    // Regular click: set as fill source
    const currentValue = row[columnKey];
    const numValue = typeof currentValue === 'number' ? currentValue : parseFloat(currentValue) || 0;

    setFillSource({
      rowIdx,
      rowId: row.id,
      columnKey,
      value: numValue,
    });

    console.log('[RDG] Set fill source:', { rowId: row.id, columnKey, value: numValue });
  }, [rows, fillSource, periods, getPeriodIndex, onCellEdit]);

  const handleSelectedCellChange = useCallback((args: any) => {
    console.log('[RDG] Cell selected:', {
      rowIdx: args.rowIdx,
      columnKey: args.column?.key,
      rowId: args.row?.id,
    });
  }, []);

  return (
    <div style={{ height: 'calc(100vh - 350px)', minHeight: 400 }}>
      <style>{`
        .rdg {
          --rdg-header-background-color: #F9FAFB;
          --rdg-row-hover-background-color: #F3F4F6;
          --rdg-selection-color: #2563EB;
          --rdg-border-color: #E5E7EB;
          font-size: 13px;
        }
        .rdg-cell-project {
          background-color: #F5F5F5 !important;
          font-weight: 600;
        }
        .rdg-cell-task {
          background-color: #FAFAFA !important;
        }
        .rdg-cell-person {
          background-color: #FFFFFF !important;
        }
        .rdg-cell-total {
          background-color: #F3F4F6 !important;
          font-weight: 600;
          border-left: 2px solid #D1D5DB !important;
        }
        .rdg-cell {
          border-right: 1px solid #E5E7EB;
          border-bottom: 1px solid #E5E7EB;
        }
        .rdg-header-row {
          font-weight: 600;
        }
        /* Make drag handle more visible - keep original positioning */
        .rdg-cell-drag-handle,
        [class*="DragHandle"] {
          z-index: 10 !important;
          background-color: #2563EB !important;
          cursor: crosshair !important;
        }
        .rdg-cell-drag-handle:hover,
        [class*="DragHandle"]:hover {
          background-color: #1D4ED8 !important;
        }
        /* Ensure selected cell shows clearly */
        .rdg-cell[aria-selected="true"] {
          outline: 2px solid #2563EB !important;
          outline-offset: -2px !important;
        }
        /* Fill source cell indicator */
        .rdg-fill-source {
          background-color: #DBEAFE !important;
          outline: 2px dashed #2563EB !important;
          outline-offset: -2px !important;
        }
      `}</style>

      {/* Instructions for horizontal fill */}
      {fillSource && (
        <div style={{
          padding: '8px 12px',
          backgroundColor: '#EFF6FF',
          borderBottom: '1px solid #BFDBFE',
          fontSize: 12,
          color: '#1E40AF',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{ fontWeight: 600 }}>Fill mode:</span>
          <span>Source: {fillSource.columnKey} = {fillSource.value}h</span>
          <span>•</span>
          <span><strong>Shift+Click</strong> another cell in the same row to fill the range</span>
          <button
            onClick={() => setFillSource(null)}
            style={{
              marginLeft: 'auto',
              padding: '2px 8px',
              backgroundColor: '#FEE2E2',
              border: '1px solid #FCA5A5',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 11,
              color: '#991B1B',
            }}
          >
            Cancel
          </button>
        </div>
      )}

      <DataGrid
        columns={columns}
        rows={rows}
        rowKeyGetter={(row) => row.id}
        rowHeight={40}
        headerRowHeight={44}
        onRowsChange={handleRowsChange}
        onFill={handleFill}
        onCellClick={handleCellClick}
        onSelectedCellChange={handleSelectedCellChange}
        enableVirtualization
        className="rdg-light"
      />
    </div>
  );
};

export default RDGGridView;
