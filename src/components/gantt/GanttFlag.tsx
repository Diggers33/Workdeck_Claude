import React, { useState, useEffect } from 'react';

interface GanttFlagProps {
  taskId: string;
  flagWeek: number;
  weekOffset: number;
  columnWidth: number;
  onUpdate: (taskId: string, newWeek: number) => void;
  size?: number;
}

export function GanttFlag({ taskId, flagWeek, weekOffset, columnWidth, onUpdate, size = 18 }: GanttFlagProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [originalWeek, setOriginalWeek] = useState(flagWeek);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const displayWeek = flagWeek - weekOffset;
  const leftPosition = displayWeek * columnWidth + columnWidth / 2;
  
  const updateTooltipPosition = () => {
    const element = document.getElementById(`flag-${taskId}`);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 40
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
      const element = document.getElementById(`flag-${taskId}`);
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
        onUpdate(taskId, newWeek);
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
  }, [isDragging, dragStartX, originalWeek, columnWidth, weekOffset, taskId, onUpdate]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    setDragStartX(e.clientX);
    setOriginalWeek(flagWeek);
    document.body.style.cursor = 'grabbing';
  };

  const handleMouseEnter = () => {
    setShowTooltip(true);
    updateTooltipPosition();
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  return (
    <>
      <div
        id={`flag-${taskId}`}
        onMouseDown={handleMouseDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          position: 'absolute',
          left: `${leftPosition}px`,
          top: '8px',
          fontSize: `${size}px`,
          cursor: isDragging ? 'grabbing' : 'grab',
          zIndex: 12,
          transition: isDragging ? 'none' : 'all 150ms ease',
          userSelect: 'none',
          filter: isDragging ? 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))' : 'none'
        }}
      >
        🚩
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
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            zIndex: 10000,
            pointerEvents: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}
        >
          Week {flagWeek}
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