import React, { forwardRef } from 'react';
import { GanttActivity, GanttWeek } from './types';
import { GanttTaskBar } from './GanttTaskBar';
import { GanttMilestone } from './GanttMilestone';
import { GanttFlag } from './GanttFlag';

interface GanttTimelineProps {
  weeks: GanttWeek[];
  tasks: GanttActivity[];
  onScroll: () => void;
  hoveredTask: string | null;
  onUpdateTask: (taskId: string, updates: any) => void;
  onTaskClick?: (task: any) => void;
  weekOffset: number;
  timeResolution: string;
  onUpdateMilestone: (activityId: string, milestoneId: string, newWeek: number) => void;
  onUpdateFlag?: (taskId: string, newWeek: number) => void;
  zoomLevel?: number;
}

export const GanttTimeline = forwardRef<HTMLDivElement, GanttTimelineProps>(
  ({ weeks, tasks, onScroll, hoveredTask, onUpdateTask, onTaskClick, weekOffset, timeResolution, onUpdateMilestone, onUpdateFlag, zoomLevel = 100 }, ref) => {
    const handleTaskClick = (task: any) => {
      if (onTaskClick) {
        onTaskClick(task);
      }
    };

    // Calculate scaled dimensions
    const scale = zoomLevel / 100;
    const ACTIVITY_HEIGHT = Math.round(56 * scale);
    const TASK_HEIGHT = Math.round(44 * scale);
    const ACTIVITY_BAR_HEIGHT = Math.round(12 * scale);
    const TASK_BAR_HEIGHT = Math.round(28 * scale);
    const MILESTONE_SIZE = Math.round(16 * scale);
    const FLAG_SIZE = Math.round(18 * scale);

    // Column width based on resolution
    const getColumnWidth = () => {
      const baseWidth = (() => {
        switch (timeResolution) {
          case 'Day': return 60;
          case 'Week': return 160;
          case 'Month': return 240;
          default: return 160;
        }
      })();
      
      // Apply zoom level (zoomLevel is a percentage: 50, 75, 100, 125, 150)
      return Math.round(baseWidth * (zoomLevel / 100));
    };

    const COLUMN_WIDTH = getColumnWidth();

    // Calculate total content width
    const totalWidth = weeks.length * COLUMN_WIDTH;

    if (weeks.length === 0) {
      return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>Loading timeline...</div>;
    }

    // Find today's column index
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayColumnIndex = weeks.findIndex((week: any) => {
      if (week.isToday) return true;
      if (week.date) {
        const weekDate = new Date(week.date);
        weekDate.setHours(0, 0, 0, 0);
        if (timeResolution === 'Day') {
          return weekDate.getTime() === today.getTime();
        } else if (timeResolution === 'Week') {
          const weekEnd = new Date(weekDate);
          weekEnd.setDate(weekEnd.getDate() + 6);
          return today >= weekDate && today <= weekEnd;
        } else { // Month
          return weekDate.getMonth() === today.getMonth() && weekDate.getFullYear() === today.getFullYear();
        }
      }
      return false;
    });

    return (
      <div
        ref={ref}
        onScroll={onScroll}
        className="gantt-timeline-scroll"
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: 'white',
          overflowX: 'scroll',
          overflowY: 'scroll',
          position: 'relative',
          /* Hide native scrollbars but keep functionality */
          scrollbarWidth: 'none', /* Firefox */
          msOverflowStyle: 'none' /* IE/Edge */
        }}
      >
        {/* Timeline Content */}
        <div style={{ 
          position: 'relative', 
          height: 'fit-content',
          minHeight: '100%',
          width: totalWidth + 'px'
        }}>
          {/* Grid Lines */}
          {weeks.map((_, idx) => (
            <div
              key={idx}
              style={{
                position: 'absolute',
                left: `${(idx + 1) * COLUMN_WIDTH}px`,
                top: '0',
                width: '1px',
                height: '100%',
                background: '#F3F4F6',
                pointerEvents: 'none',
                zIndex: 1
              }}
            />
          ))}

          {/* TODAY LINE INDICATOR */}
          {todayColumnIndex >= 0 && (
            <div
              style={{
                position: 'absolute',
                left: `${todayColumnIndex * COLUMN_WIDTH + (COLUMN_WIDTH / 2)}px`,
                top: '0',
                width: '2px',
                height: '100%',
                background: '#EF4444',
                pointerEvents: 'none',
                zIndex: 10,
                boxShadow: '0 0 8px rgba(239, 68, 68, 0.4)'
              }}
            >
              {/* Today marker dot at top */}
              <div style={{
                position: 'absolute',
                top: '-4px',
                left: '-4px',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#EF4444',
                border: '2px solid white',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
              }} />
            </div>
          )}

          {/* Task Bars */}
          {tasks.map((task, taskIdx) => {
            return (
              <div key={task.id}>
              {/* Activity Summary Bar */}
              <div style={{
                height: `${ACTIVITY_HEIGHT}px`,
                borderBottom: '1px solid #F3F4F6',
                position: 'relative',
                background: 'white',
                display: 'flex',
                alignItems: 'center'
              }}>
                {task.startWeek !== undefined && (() => {
                  // Convert week-based position to column position based on resolution
                  let columnStart = task.startWeek - weekOffset;
                  let columnDuration = task.durationWeeks || 1;
                  
                  // In Day view, multiply by 7 (7 days per week)
                  if (timeResolution === 'Day') {
                    columnStart = columnStart * 7;
                    columnDuration = columnDuration * 7;
                  }
                  // In Month view, divide by ~4.3 (weeks per month)
                  else if (timeResolution === 'Month') {
                    columnStart = Math.floor(columnStart / 4.3);
                    columnDuration = Math.max(1, Math.ceil(columnDuration / 4.3));
                  }
                  
                  return (
                    <div style={{
                      position: 'absolute',
                      left: `${columnStart * COLUMN_WIDTH + 30}px`,
                      width: `${columnDuration * COLUMN_WIDTH - 60}px`,
                      height: `${ACTIVITY_BAR_HEIGHT}px`,
                      background: task.barColor,
                      borderRadius: '6px',
                      boxShadow: `0 2px 4px ${task.barColor}40`
                    }} />
                  );
                })()}
                
                {/* Render Milestones on Activity Row */}
                {task.milestones && task.milestones.map((milestone) => (
                  <GanttMilestone
                    key={milestone.id}
                    milestone={milestone}
                    weekOffset={weekOffset}
                    columnWidth={COLUMN_WIDTH}
                    activityId={task.id}
                    onUpdate={onUpdateMilestone}
                    size={MILESTONE_SIZE}
                  />
                ))}
              </div>

              {/* Child Task Bars */}
              {task.expanded && task.children && task.children.filter(child => child.type !== 'milestone').map((child, childIdx) => {
                return (
                <div
                  key={child.id}
                  style={{
                    height: `${TASK_HEIGHT}px`,
                    borderBottom: '1px solid #F3F4F6',
                    position: 'relative',
                    background: child.type === 'milestone' ? '#F7FBFF' : 'white',
                    borderLeft: child.type === 'milestone' ? '3px solid #3B82F6' : 'none',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {/* Render Interactive Task Bar */}
                  <GanttTaskBar
                    task={child}
                    onUpdateTask={onUpdateTask}
                    onTaskClick={handleTaskClick}
                    hoveredTask={hoveredTask}
                    weekOffset={weekOffset}
                    columnWidth={COLUMN_WIDTH}
                    barHeight={TASK_BAR_HEIGHT}
                    timeResolution={timeResolution}
                  />

                  {/* Render Milestones on Task Row */}
                  {child.milestones && child.milestones.map((milestone) => (
                    <GanttMilestone
                      key={milestone.id}
                      milestone={milestone}
                      weekOffset={weekOffset}
                      columnWidth={COLUMN_WIDTH}
                      activityId={child.id}
                      onUpdate={onUpdateMilestone}
                      hasFlag={child.flag}
                      taskEndWeek={child.startWeek + child.durationWeeks}
                      size={MILESTONE_SIZE}
                    />
                  ))}

                  {/* Render Flag on Task Row */}
                  {child.flag && child.flagWeek && (
                    <GanttFlag
                      taskId={child.id}
                      flagWeek={child.flagWeek}
                      weekOffset={weekOffset}
                      columnWidth={COLUMN_WIDTH}
                      onUpdate={(taskId, newWeek) => {
                        if (onUpdateFlag) {
                          onUpdateFlag(taskId, newWeek);
                        }
                      }}
                      size={FLAG_SIZE}
                    />
                  )}

                </div>
              )})}
              
              {/* Add Task Row - Spacer to match task list */}
              {task.expanded && task.children && task.children.length > 0 && (
                <div style={{
                  height: '48px',
                  borderBottom: '1px solid #F3F4F6',
                  background: 'white'
                }} />
              )}
            </div>
          )})}

          {/* Fade Indicator Row */}
          <div style={{
            height: '56px',
            borderBottom: '1px solid #F3F4F6',
            background: 'linear-gradient(to bottom, white, #FAFAFA)'
          }} />
        </div>
      </div>
    );
  }
);

GanttTimeline.displayName = 'GanttTimeline';