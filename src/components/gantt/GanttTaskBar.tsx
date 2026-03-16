import React, { useState, useRef, useEffect } from 'react';

interface GanttTaskBarProps {
  task: any;
  onUpdateTask: (taskId: string, updates: { startWeek?: number; durationWeeks?: number }) => void;
  onTaskClick: (task: any) => void;
  hoveredTask: string | null;
  weekOffset: number;
  columnWidth: number;
  barHeight?: number;
  timeResolution?: string;
}

export function GanttTaskBar({ task, onUpdateTask, onTaskClick, hoveredTask, weekOffset, columnWidth, barHeight = 28, timeResolution = 'Week' }: GanttTaskBarProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [originalStartWeek, setOriginalStartWeek] = useState(0);
  const [originalDuration, setOriginalDuration] = useState(0);
  const [hasDragged, setHasDragged] = useState(false); // Track if actual drag occurred
  const barRef = useRef<HTMLDivElement>(null);
  
  // Convert week-based position to column position based on resolution
  const getColumnPosition = (weekValue: number): number => {
    if (timeResolution === 'Day') {
      return weekValue * 7; // 7 days per week
    } else if (timeResolution === 'Month') {
      return weekValue / 4.3; // ~4.3 weeks per month
    }
    return weekValue; // Week view - 1:1
  };
  
  const getColumnDuration = (weekDuration: number): number => {
    if (timeResolution === 'Day') {
      return weekDuration * 7;
    } else if (timeResolution === 'Month') {
      return Math.max(1, weekDuration / 4.3);
    }
    return weekDuration;
  };

  // Handle drag to move task
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('resize-handle')) return;
    
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setHasDragged(false); // Reset drag flag
    setDragStartX(e.clientX);
    setOriginalStartWeek(task.startWeek);
  };

  // Handle resize
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setHasDragged(false); // Reset drag flag
    setDragStartX(e.clientX);
    setOriginalDuration(task.durationWeeks);
  };

  // Handle click (only if not dragged)
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasDragged && !isResizing && !isDragging) {
      onTaskClick(task);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - dragStartX;
        const weeksDelta = Math.round(deltaX / columnWidth);
        
        // If moved more than a few pixels, consider it a drag
        if (Math.abs(deltaX) > 5) {
          setHasDragged(true);
        }
        
        const newStartWeek = Math.max(0, originalStartWeek + weeksDelta);
        
        if (newStartWeek !== task.startWeek) {
          onUpdateTask(task.id, { startWeek: newStartWeek });
        }
      } else if (isResizing) {
        const deltaX = e.clientX - dragStartX;
        const weeksDelta = Math.round(deltaX / columnWidth);
        
        // If moved more than a few pixels, consider it a drag
        if (Math.abs(deltaX) > 5) {
          setHasDragged(true);
        }
        
        const newDuration = Math.max(1, originalDuration + weeksDelta);
        
        if (newDuration !== task.durationWeeks) {
          onUpdateTask(task.id, { durationWeeks: newDuration });
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = isDragging ? 'grabbing' : 'ew-resize';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
    };
  }, [isDragging, isResizing, dragStartX, originalStartWeek, originalDuration, task, onUpdateTask]);

  // Milestone rendering
  if (task.type === 'milestone') {
    const displayColumn = getColumnPosition(task.startWeek - weekOffset);
    return (
      <div
        onClick={() => onTaskClick(task)}
        style={{
          position: 'absolute',
          left: `${displayColumn * columnWidth + columnWidth / 2}px`,
          width: '32px',
          height: '32px',
          background: task.status === 'completed' ? '#10B981' : task.status === 'overdue' ? '#EF4444' : '#3B82F6',
          transform: 'rotate(45deg)',
          borderRadius: '4px',
          border: '3px solid white',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 150ms ease'
        }}
      >
        <span style={{
          transform: 'rotate(-45deg)',
          fontSize: '14px',
          color: 'white',
          fontWeight: 700
        }}>
          {task.status === 'completed' ? '✓' : ''}
        </span>
      </div>
    );
  }

  // Regular task bar rendering
  const displayColumn = getColumnPosition(task.startWeek - weekOffset);
  const displayDuration = getColumnDuration(task.durationWeeks);
  const barPadding = Math.min(30, columnWidth * 0.2); // Scale padding with column width
  
  // Calculate lighter background color for incomplete portion
  const getBackgroundColor = () => {
    if (task.progress === 0) return 'transparent';
    if (task.progress >= 100) return task.barColor;
    // Show lighter version for incomplete portion
    if (task.barColor === '#10B981') return '#D1FAE5'; // Light green
    if (task.barColor === '#3B82F6') return '#DBEAFE'; // Light blue
    if (task.barColor === '#60A5FA') return '#DBEAFE'; // Light blue (good progress)
    if (task.barColor === '#93C5FD') return '#EFF6FF'; // Very light blue (low/no progress)
    if (task.barColor === '#F59E0B') return '#FEF3C7'; // Light amber (warning)
    if (task.barColor === '#EF4444') return '#FEE2E2'; // Light red (over budget/overdue)
    if (task.barColor === '#8B5CF6') return '#EDE9FE'; // Light purple
    return '#F3F4F6'; // Default light gray
  };
  
  return (
    <>
      <div
        ref={barRef}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        style={{
          position: 'absolute',
          left: `${displayColumn * columnWidth + barPadding}px`,
          width: `${displayDuration * columnWidth - barPadding * 2}px`,
          height: `${barHeight}px`,
          background: getBackgroundColor(),
          border: task.progress === 0 ? 'none' : '1px solid rgba(0,0,0,0.08)',
          outline: task.progress === 0 ? `2px dashed ${task.barColor}` : 'none',
          outlineOffset: '-2px',
          borderRadius: '6px',
          overflow: 'visible',
          boxShadow: task.progress > 0 ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          cursor: isDragging ? 'grabbing' : 'grab',
          backgroundImage: task.striped ? 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(251, 191, 36, 0.6) 4px, rgba(251, 191, 36, 0.6) 8px)' : 'none',
          transition: isDragging || isResizing ? 'none' : 'all 150ms ease',
          transform: hoveredTask === task.id && !isDragging && !isResizing ? 'translateY(-2px)' : 'translateY(0)',
          borderLeft: task.completed ? '3px solid #10B981' : undefined,
          userSelect: 'none',
          zIndex: 10
        }}
      >
        {/* Progress Fill - Solid color for completed portion */}
        {task.progress > 0 && task.progress < 100 && !task.striped && (
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: `${Math.min(task.progress, 100)}%`,
            height: '100%',
            background: task.barColor,
            borderRadius: '6px 0 0 6px',
            borderRight: '2px solid white'
          }} />
        )}

        {/* Hours Text Overlay */}
        {task.hours && (
          <span style={{
            position: 'relative',
            zIndex: 5,
            fontSize: '11px',
            fontWeight: 600,
            color: task.progress >= 50 ? 'white' : (task.hoursColor || '#374151'),
            textShadow: task.progress >= 50 ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '100%',
            pointerEvents: 'none'
          }}>
            {task.hours}
          </span>
        )}

        {/* Warning Badge */}
        {task.warning && (
          <div style={{
            position: 'absolute',
            right: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            pointerEvents: 'none',
            zIndex: 2
          }}>
            ⚠️
          </div>
        )}

        {/* Resize Handle */}
        <div
          className="resize-handle"
          onMouseDown={handleResizeMouseDown}
          style={{
            position: 'absolute',
            right: '-4px',
            top: 0,
            width: '8px',
            height: '100%',
            cursor: 'ew-resize',
            zIndex: 20,
            opacity: hoveredTask === task.id ? 1 : 0,
            transition: 'opacity 150ms ease'
          }}
        >
          <div style={{
            position: 'absolute',
            right: '2px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '4px',
            height: '60%',
            background: '#3B82F6',
            borderRadius: '2px'
          }} />
        </div>
      </div>
    </>
  );
}