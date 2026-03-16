/**
 * GridRow - Memoized row component for the resource grid
 *
 * Renders a single row (task/person) with all its period cells.
 * Only re-renders when this specific row's data changes.
 */

import React, { memo, useMemo } from 'react';
import GridCell from './GridCell';
import { GridPeriod, CellData, GridRowData } from './types';

interface GridRowProps {
  row: GridRowData;
  parentRow?: GridRowData;
  grandparentRow?: GridRowData;
  periods: GridPeriod[];
  cellDataMap: Map<string, CellData>;
  editingCellKey: string | null;
  gridHierarchy: 'person' | 'project';
  gridGranularity: 'weekly' | 'monthly';
  isExpanded: boolean;
  onToggleExpand: (rowId: string) => void;
  onCellEdit: (cellKey: string, periodKey: string) => void;
  onCellEditComplete: (cellKey: string, periodKey: string, value: string) => void;
  onCellEditCancel: () => void;
  onDragOver: (e: React.DragEvent, cellKey: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, periodKey: string, rowId: string) => void;
  onFillHandleMouseDown: (e: React.MouseEvent, cellKey: string, periodIdx: number, hours: number) => void;
  onFillHandleMouseMove: (e: React.MouseEvent, rowId: string, periodIdx: number) => void;
  isFillDragging: boolean;
  style?: React.CSSProperties;
}

const GridRow = memo<GridRowProps>(({
  row,
  parentRow,
  grandparentRow,
  periods,
  cellDataMap,
  editingCellKey,
  gridHierarchy,
  gridGranularity,
  isExpanded,
  onToggleExpand,
  onCellEdit,
  onCellEditComplete,
  onCellEditCancel,
  onDragOver,
  onDragLeave,
  onDrop,
  onFillHandleMouseDown,
  onFillHandleMouseMove,
  isFillDragging,
  style,
}) => {
  // Calculate row-level info
  const isTask = row.type === 'task';
  const isPerson = row.type === 'person';
  const isProject = row.type === 'project';
  const hasChildren = row.children && row.children.length > 0;

  // Get row label content
  const renderRowLabel = () => {
    if (isPerson && gridHierarchy === 'project') {
      // Person row in project-first view - show avatar and name
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '48px' }}>
          <div style={{
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            backgroundColor: '#E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '8px',
            fontWeight: 500,
            color: '#6B7280',
            flexShrink: 0,
          }}>
            {row.avatar ? (
              <img src={row.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              row.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
            )}
          </div>
          <span style={{ fontSize: '11px', color: '#6B7280' }}>
            {row.name}
            {row.workPackage && <span style={{ color: '#9CA3AF', marginLeft: '4px' }}>({row.workPackage})</span>}
          </span>
        </div>
      );
    }

    if (isTask) {
      // Task row - show task name with indent
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '32px' }}>
          <span style={{ fontSize: '11px', color: '#6B7280' }}>
            {row.name}
            {row.workPackage && <span style={{ color: '#9CA3AF', marginLeft: '4px' }}>({row.workPackage})</span>}
          </span>
        </div>
      );
    }

    if (isProject) {
      // Project row - show color dot and name
      return (
        <div
          onClick={() => hasChildren && onToggleExpand(row.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            paddingLeft: gridHierarchy === 'person' ? '16px' : '0',
            cursor: hasChildren ? 'pointer' : 'default',
          }}
        >
          {hasChildren && (
            <span style={{ fontSize: '10px', color: '#9CA3AF', width: '12px' }}>
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: row.color || '#6B7280',
            flexShrink: 0,
          }} />
          <span style={{ fontSize: '12px', fontWeight: 500, color: '#374151' }}>
            {row.name}
          </span>
        </div>
      );
    }

    if (isPerson && gridHierarchy === 'person') {
      // Person row in person-first view
      return (
        <div
          onClick={() => hasChildren && onToggleExpand(row.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: hasChildren ? 'pointer' : 'default',
          }}
        >
          {hasChildren && (
            <span style={{ fontSize: '10px', color: '#9CA3AF', width: '12px' }}>
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: '#E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 500,
            color: '#6B7280',
            flexShrink: 0,
          }}>
            {row.avatar ? (
              <img src={row.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              row.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
            )}
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{row.name}</div>
            {row.department && (
              <div style={{ fontSize: '11px', color: '#6B7280' }}>{row.department}</div>
            )}
          </div>
        </div>
      );
    }

    return <span>{row.name}</span>;
  };

  // Determine if this row has editable cells
  const isLeafRow = (gridHierarchy === 'person' && isTask) || (gridHierarchy === 'project' && isPerson);

  return (
    <tr style={{
      ...style,
      backgroundColor: isPerson && gridHierarchy === 'person' ? '#FAFAFA' :
                       isProject && gridHierarchy === 'project' ? '#FAFAFA' : 'white',
    }}>
      {/* Label cell */}
      <td style={{
        padding: '8px 12px',
        borderBottom: '1px solid #F3F4F6',
        position: 'sticky',
        left: 0,
        backgroundColor: 'inherit',
        zIndex: 1,
        minWidth: '200px',
        maxWidth: '300px',
      }}>
        {renderRowLabel()}
      </td>

      {/* Period cells */}
      {isLeafRow ? (
        // Leaf rows have editable cells
        periods.map((period, idx) => {
          const cellKey = `${row.id}:${period.key}`;
          const cellData = cellDataMap.get(cellKey) || { hours: 0, hasUnscheduled: false, hasPending: false };
          const isEditing = editingCellKey === cellKey;
          const isAlternateMonth = period.startDate.getMonth() % 2 === 0;
          const isYearBoundary = idx === 0 || (gridGranularity === 'monthly' && period.startDate.getMonth() === 0);

          return (
            <GridCell
              key={period.key}
              cellKey={cellKey}
              periodKey={period.key}
              periodIdx={idx}
              hours={cellData.hours}
              hasUnscheduled={cellData.hasUnscheduled}
              hasPending={cellData.hasPending}
              isEditing={isEditing}
              isAlternateMonth={isAlternateMonth}
              isYearBoundary={isYearBoundary}
              onEdit={onCellEdit}
              onEditComplete={onCellEditComplete}
              onEditCancel={onCellEditCancel}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={(e, periodKey) => onDrop(e, periodKey, row.id)}
              onFillHandleMouseDown={onFillHandleMouseDown}
              onFillHandleMouseMove={(e, pIdx) => onFillHandleMouseMove(e, row.id, pIdx)}
              isFillDragging={isFillDragging}
            />
          );
        })
      ) : (
        // Non-leaf rows show summary or empty cells
        periods.map((period, idx) => {
          const isAlternateMonth = period.startDate.getMonth() % 2 === 0;
          const isYearBoundary = idx === 0 || (gridGranularity === 'monthly' && period.startDate.getMonth() === 0);

          return (
            <td
              key={period.key}
              style={{
                padding: '4px',
                textAlign: 'center',
                borderBottom: '1px solid #F3F4F6',
                borderLeft: isYearBoundary ? '2px solid #D1D5DB' : '1px solid #F3F4F6',
                backgroundColor: isAlternateMonth ? 'transparent' : 'rgba(0,0,0,0.01)',
              }}
            >
              {/* Summary cells could show totals here */}
            </td>
          );
        })
      )}
    </tr>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memoization
  // Only re-render if this row's specific data changed
  return (
    prevProps.row.id === nextProps.row.id &&
    prevProps.editingCellKey === nextProps.editingCellKey &&
    prevProps.isExpanded === nextProps.isExpanded &&
    prevProps.isFillDragging === nextProps.isFillDragging &&
    prevProps.cellDataMap === nextProps.cellDataMap &&
    prevProps.periods === nextProps.periods
  );
});

GridRow.displayName = 'GridRow';

export default GridRow;
