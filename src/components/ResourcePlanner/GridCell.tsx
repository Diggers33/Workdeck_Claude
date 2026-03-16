/**
 * GridCell - Memoized cell with LOCAL editing state
 *
 * CRITICAL: This component manages its own isEditing state.
 * Parent is NOT notified until edit completes (onSave).
 *
 * PERFORMANCE: All callbacks receive context as first param.
 * This allows parent to use a SINGLE memoized handler for all cells.
 * React.memo then works correctly because props don't change.
 */

import React, { useState, useRef, useEffect, memo } from 'react';

/** Context passed back to parent in all callbacks */
export interface CellContext {
  rowId: string;
  period: string;
  periodIdx: number;
  taskId?: string;
  taskName?: string;
  projectId?: string;
  personId: string;
  personName?: string;
  currentValue: number;
}

interface GridCellProps {
  /** Context for this cell - passed back in all callbacks */
  context: CellContext;
  /** Display string like "134.5h" or "0h" or "—" */
  displayValue: string;
  /** Show amber styling for unscheduled hours */
  isUnscheduled?: boolean;
  /** Has pending unsaved changes */
  hasPending?: boolean;
  /** Whether cell is editable */
  editable?: boolean;
  /** Whether cell is draggable */
  draggable?: boolean;
  /** Show fill handle */
  showFillHandle?: boolean;

  // MEMOIZED callbacks - same reference for all cells
  /** Called when edit completes: (context, newValue) => void */
  onSave: (context: CellContext, newValue: number) => void;
  /** Called on drag start: (context, e) => void */
  onDragStart?: (context: CellContext, e: React.DragEvent) => void;
  /** Called on drag end: (e) => void */
  onDragEnd?: (e: React.DragEvent) => void;
  /** Called on fill handle mouse down: (context, e) => void */
  onFillHandleMouseDown?: (context: CellContext, e: React.MouseEvent) => void;
}

const GridCell = memo<GridCellProps>(({
  context,
  displayValue,
  isUnscheduled = false,
  hasPending = false,
  editable = true,
  draggable = false,
  showFillHandle = false,
  onSave,
  onDragStart,
  onDragEnd,
  onFillHandleMouseDown,
}) => {
  // LOCAL state - changes here do NOT trigger parent re-render
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = (e: React.MouseEvent) => {
    if (!editable) return;
    // Don't enter edit mode if user is starting a drag
    if (e.defaultPrevented) return;
    setIsEditing(true);
    setInputValue(context.currentValue > 0 ? context.currentValue.toFixed(2) : '');
  };

  const handleSave = () => {
    setIsEditing(false);
    const newValue = parseFloat(inputValue) || 0;
    // Only notify parent if value actually changed and is positive
    if (newValue !== context.currentValue && newValue > 0) {
      onSave(context, newValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    handleSave();
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (onDragStart) {
      onDragStart(context, e);
    }
  };

  const handleFillMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onFillHandleMouseDown) {
      onFillHandleMouseDown(context, e);
    }
  };

  // Determine styling based on state
  const getBackgroundColor = () => {
    if (hasPending) return '#D1FAE5'; // green tint for pending
    if (isUnscheduled) return '#FEF3C7'; // amber for unscheduled
    if (context.currentValue > 0) return 'rgba(0,0,0,0.04)';
    return 'transparent';
  };

  const getTextColor = () => {
    if (hasPending) return '#047857';
    if (isUnscheduled) return '#B45309';
    if (context.currentValue > 0) return '#374151';
    return '#D1D5DB';
  };

  const getBorder = () => {
    if (hasPending) return '1px solid #10B981';
    if (isUnscheduled) return '1px dashed #F59E0B';
    return 'none';
  };

  if (isEditing) {
    return (
      <div style={{ padding: '2px' }}>
        <input
          ref={inputRef}
          type="number"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          style={{
            width: '100%',
            padding: '4px',
            border: '2px solid #2563EB',
            borderRadius: '4px',
            fontSize: '11px',
            textAlign: 'center',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>
    );
  }

  return (
    <div
      draggable={draggable}
      onDragStart={draggable ? handleDragStart : undefined}
      onDragEnd={draggable ? onDragEnd : undefined}
      onClick={handleClick}
      style={{
        position: 'relative',
        padding: '3px',
        borderRadius: '4px',
        fontSize: '10px',
        fontWeight: hasPending ? 500 : 400,
        color: getTextColor(),
        backgroundColor: getBackgroundColor(),
        cursor: draggable ? 'grab' : (editable ? 'pointer' : 'default'),
        minHeight: '18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        border: getBorder(),
      }}
    >
      {displayValue}

      {/* Pending change indicator */}
      {hasPending && (
        <span style={{
          position: 'absolute',
          top: '2px',
          right: '2px',
          width: '4px',
          height: '4px',
          borderRadius: '50%',
          backgroundColor: '#10B981'
        }} />
      )}

      {/* Fill handle - Excel-like drag to fill */}
      {showFillHandle && context.currentValue > 0 && onFillHandleMouseDown && (
        <div
          onMouseDown={handleFillMouseDown}
          style={{
            position: 'absolute',
            right: '-3px',
            bottom: '-3px',
            width: '8px',
            height: '8px',
            backgroundColor: '#2563EB',
            borderRadius: '1px',
            cursor: 'crosshair',
            opacity: 0,
          }}
          className="fill-handle"
        />
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if these specific props change
  return (
    prevProps.context.currentValue === nextProps.context.currentValue &&
    prevProps.displayValue === nextProps.displayValue &&
    prevProps.isUnscheduled === nextProps.isUnscheduled &&
    prevProps.hasPending === nextProps.hasPending &&
    prevProps.editable === nextProps.editable &&
    prevProps.draggable === nextProps.draggable &&
    prevProps.showFillHandle === nextProps.showFillHandle
    // Callbacks are intentionally NOT compared - they should be stable refs
  );
});

GridCell.displayName = 'GridCell';

export default GridCell;
