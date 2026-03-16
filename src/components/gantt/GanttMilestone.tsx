import React, { useState, useEffect } from 'react';
import { GanttMilestone as MilestoneType } from './types';

interface GanttMilestoneProps {
  milestone: any;
  weekOffset: number;
  columnWidth: number;
  activityId: string;
  onUpdate: (activityId: string, milestoneId: string, newWeek: number) => void;
  hasFlag?: boolean;
  taskEndWeek?: number;
  size?: number;
}

export function GanttMilestone({ 
  milestone, 
  weekOffset, 
  columnWidth,
  activityId,
  onUpdate,
  hasFlag = false,
  taskEndWeek,
  size = 16
}: GanttMilestoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [originalWeek, setOriginalWeek] = useState(milestone.week);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const displayWeek = milestone.week - weekOffset;
  
  // Check if milestone is at the same position as the flag (end of task)
  const isAtTaskEnd = taskEndWeek !== undefined && milestone.week === taskEndWeek;
  const shouldOffset = hasFlag && isAtTaskEnd;
  
  // Offset milestone horizontally to the right if it overlaps with flag
  const horizontalOffset = shouldOffset ? 30 : 0;
  const leftPosition = displayWeek * columnWidth + columnWidth / 2 + horizontalOffset;
  
  const updateTooltipPosition = () => {
    const element = document.getElementById(`milestone-${milestone.id}`);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 50 // Increased offset to prevent covering the milestone
      });
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartX;
      const weeksDelta = Math.round(deltaX / columnWidth);
      const newWeek = originalWeek + weeksDelta;
      
      // Update visual position during drag
      const element = document.getElementById(`milestone-${milestone.id}`);
      if (element) {
        const newDisplayWeek = newWeek - weekOffset;
        element.style.left = `${newDisplayWeek * columnWidth + columnWidth / 2}px`;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartX;
      const weeksDelta = Math.round(deltaX / columnWidth);
      const newWeek = originalWeek + weeksDelta;
      
      if (newWeek !== originalWeek) {
        onUpdate(activityId, milestone.id, newWeek);
      }
      
      setIsDragging(false);
      setOriginalWeek(newWeek);
      document.body.style.cursor = 'default';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStartX, originalWeek, columnWidth, weekOffset, milestone.id, activityId, onUpdate]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    setDragStartX(e.clientX);
    setOriginalWeek(milestone.week);
    document.body.style.cursor = 'grabbing';
  };

  const handleMouseEnter = () => {
    setShowTooltip(true);
    updateTooltipPosition();
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  const getStatusColor = () => {
    if (milestone.status === 'completed') return '#10B981';
    if (milestone.status === 'overdue') return '#EF4444';
    return '#3B82F6';
  };

  return (
    <>
      <div
        id={`milestone-${milestone.id}`}
        onMouseDown={handleMouseDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          position: 'absolute',
          left: `${leftPosition}px`,
          top: '50%',
          transform: 'translate(-50%, -50%) rotate(45deg)',
          width: `${size}px`,
          height: `${size}px`,
          background: getStatusColor(),
          cursor: isDragging ? 'grabbing' : 'grab',
          zIndex: 11,
          border: '2px solid white',
          boxShadow: isDragging 
            ? '0 4px 12px rgba(0,0,0,0.25)' 
            : '0 2px 6px rgba(0,0,0,0.15)',
          transition: isDragging ? 'none' : 'all 150ms ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <span style={{
          transform: 'rotate(-45deg)',
          fontSize: '10px',
          color: 'white',
          fontWeight: 700,
          pointerEvents: 'none'
        }}>
          {milestone.status === 'completed' ? '✓' : '◆'}
        </span>
      </div>

      {/* Tooltip */}
      {showTooltip && !isDragging && (
        <div
          style={{
            position: 'fixed',
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: 'translateX(-50%)',
            background: '#1F2937',
            color: 'white',
            padding: '6px 10px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            zIndex: 10000,
            pointerEvents: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}
        >
          {milestone.name}
          {milestone.dueDate && (
            <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>
              {milestone.dueDate}
            </div>
          )}
          {/* Arrow */}
          <div style={{
            position: 'absolute',
            bottom: '-4px',
            left: '50%',
            width: '8px',
            height: '8px',
            background: '#1F2937',
            transform: 'translateX(-50%) rotate(45deg)'
          }} />
        </div>
      )}
    </>
  );
}