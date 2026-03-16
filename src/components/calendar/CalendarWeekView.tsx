import React, { useRef, useEffect, useState } from 'react';
import { CalendarEvent } from './WorkdeckCalendar';
import { CalendarEventCard } from './CalendarEventCard';

interface CalendarWeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onTimeSlotClick: (date: Date, endDate?: Date) => void;
  onTaskDrop: (date: Date, task: any) => void;
  onEventMove?: (eventId: string, newStartTime: Date, newEndTime?: Date) => void;
  userColors?: { [key: string]: string };
  selectedCalendars?: string[];
}

export function CalendarWeekView({ currentDate, events, onEventClick, onTimeSlotClick, onTaskDrop, onEventMove, userColors, selectedCalendars }: CalendarWeekViewProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [dragPreview, setDragPreview] = useState<{ day: Date; hour: number; minute: number } | null>(null);
  const [resizingEvent, setResizingEvent] = useState<{ id: string; edge: 'top' | 'bottom'; startY: number; originalTop: number; originalHeight: number; currentDeltaY: number } | null>(null);
  const [draggingEvent, setDraggingEvent] = useState<{ id: string; startX: number; startY: number; currentX: number; currentY: number; originalDay: Date; originalTime: number; hasMoved: boolean } | null>(null);
  const [createSelection, setCreateSelection] = useState<{ dayIndex: number; startHour: number; endHour: number } | null>(null);
  const isCreatingRef = useRef(false);
  const createSelectionRef = useRef<{ dayIndex: number; startHour: number; endHour: number } | null>(null);
  const daysRef = useRef<Date[]>([]);

  // Auto-scroll to current time on mount and when week changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      const now = new Date();
      const weekStart = getWeekStart(currentDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      // Check if current time is within this week
      const isCurrentWeek = now >= weekStart && now <= weekEnd;
      
      if (isCurrentWeek) {
        // Calculate scroll position to center current time
        const currentHour = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentTimeInHours = currentHour + currentMinutes / 60;
        
        // Each hour is 60px tall
        const hourHeight = 60;
        const scrollPosition = currentTimeInHours * hourHeight;
        
        // Center it by subtracting half the viewport height
        const viewportHeight = scrollContainerRef.current.clientHeight;
        const centeredScrollPosition = scrollPosition - viewportHeight / 2;
        
        // Smooth scroll to the centered position
        scrollContainerRef.current.scrollTo({
          top: Math.max(0, centeredScrollPosition),
          behavior: 'smooth'
        });
      }
    }
  }, [currentDate]);

  // Get the week start date (Sunday)
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  const weekStart = getWeekStart(currentDate);
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    return date;
  });

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // Find today's index in the week
  const todayIndex = days.findIndex(day => isToday(day));

  // Get events for a specific day
  const getEventsForDay = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.getDate() === date.getDate() &&
             eventDate.getMonth() === date.getMonth() &&
             eventDate.getFullYear() === date.getFullYear();
    });
  };

  // Calculate event position and height
  const getEventStyle = (event: CalendarEvent) => {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    const duration = endHour - startHour;

    return {
      top: `${startHour * 60}px`,
      height: `${duration * 60}px`,
      minHeight: '48px'
    };
  };

  const handleDrop = (e: React.DragEvent, day: Date, hour: number) => {
    e.preventDefault();
    setDragPreview(null);
    const taskData = e.dataTransfer.getData('task');
    if (taskData) {
      const task = JSON.parse(taskData);
      const dropDate = new Date(day);
      dropDate.setHours(hour, 0, 0, 0);
      onTaskDrop(dropDate, task);
    }
  };

  const handleDragOver = (e: React.DragEvent, day: Date, hour: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    
    // Calculate precise time based on mouse position within the hour slot
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const minuteFraction = y / rect.height;
    const minute = Math.floor(minuteFraction * 60);
    
    setDragPreview({ day, hour, minute });
  };

  const handleDragLeave = () => {
    setDragPreview(null);
  };

  const formatPreviewTime = (hour: number, minute: number) => {
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const period = hour < 12 ? 'AM' : 'PM';
    const displayMinute = minute.toString().padStart(2, '0');
    return `${displayHour}:${displayMinute} ${period}`;
  };

  // Event drag handlers
  const handleEventDragStart = (e: React.MouseEvent, event: CalendarEvent, dayIndex: number) => {
    e.stopPropagation();
    const startDate = new Date(event.startTime);
    const startHour = startDate.getHours() + startDate.getMinutes() / 60;

    setDraggingEvent({
      id: event.id,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      originalDay: days[dayIndex],
      originalTime: startHour,
      hasMoved: false
    });
  };

  const handleEventDragMove = (e: MouseEvent) => {
    if (!draggingEvent || !scrollContainerRef.current) return;

    const deltaY = e.clientY - draggingEvent.startY;
    const deltaX = e.clientX - draggingEvent.startX;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Update current position for visual feedback
    if (distance > 5) { // 5px threshold to distinguish click from drag
      setDraggingEvent(prev => prev ? {
        ...prev,
        currentX: e.clientX,
        currentY: e.clientY,
        hasMoved: true
      } : null);
    }
  };

  const handleEventDragEnd = (e: MouseEvent) => {
    if (!draggingEvent || !scrollContainerRef.current) return;

    const event = events.find(ev => ev.id === draggingEvent.id);

    // If the event hasn't moved, treat it as a click
    if (!draggingEvent.hasMoved && event) {
      onEventClick(event);
    } else {
      // Calculate vertical movement (time change)
      const deltaY = e.clientY - draggingEvent.startY;
      const deltaMinutes = Math.round((deltaY / 60) * 60);

      // Calculate horizontal movement (day change)
      const deltaX = e.clientX - draggingEvent.startX;
      // Each day column is approximately 1/7th of the scroll container width minus time column
      const containerWidth = scrollContainerRef.current.clientWidth - 60; // 60px for time column
      const dayColumnWidth = containerWidth / 7;
      const deltaDays = Math.round(deltaX / dayColumnWidth);

      if (event && onEventMove && (deltaMinutes !== 0 || deltaDays !== 0)) {
        const newStartTime = new Date(event.startTime);
        newStartTime.setMinutes(newStartTime.getMinutes() + deltaMinutes);
        newStartTime.setDate(newStartTime.getDate() + deltaDays);

        const newEndTime = new Date(event.endTime);
        newEndTime.setMinutes(newEndTime.getMinutes() + deltaMinutes);
        newEndTime.setDate(newEndTime.getDate() + deltaDays);

        // Update the event
        onEventMove(event.id, newStartTime, newEndTime);
      }
    }

    setDraggingEvent(null);
  };

  // Resize handlers
  const handleResizeStart = (e: React.MouseEvent, event: CalendarEvent, edge: 'top' | 'bottom') => {
    e.stopPropagation();
    const style = getEventStyle(event);

    setResizingEvent({
      id: event.id,
      edge,
      startY: e.clientY,
      originalTop: parseFloat(style.top),
      originalHeight: parseFloat(style.height),
      currentDeltaY: 0
    });
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!resizingEvent) return;

    const deltaY = e.clientY - resizingEvent.startY;
    // Snap to 15-minute increments (15px = 15 minutes since 60px = 60min)
    const snappedDeltaY = Math.round(deltaY / 15) * 15;

    setResizingEvent(prev => prev ? { ...prev, currentDeltaY: snappedDeltaY } : null);
  };

  const handleResizeEnd = (e: MouseEvent) => {
    if (!resizingEvent) return;

    // Use the snapped deltaY we've been tracking for visual consistency
    const deltaMinutes = resizingEvent.currentDeltaY; // 1px = 1 minute since 60px = 60min

    const event = events.find(ev => ev.id === resizingEvent.id);
    if (event && onEventMove && deltaMinutes !== 0) {
      if (resizingEvent.edge === 'top') {
        // Changing start time
        const newStartTime = new Date(event.startTime);
        newStartTime.setMinutes(newStartTime.getMinutes() + deltaMinutes);

        // Don't let start go past end
        if (newStartTime < new Date(event.endTime)) {
          onEventMove(event.id, newStartTime);
        }
      } else {
        // Changing end time
        const newEndTime = new Date(event.endTime);
        newEndTime.setMinutes(newEndTime.getMinutes() + deltaMinutes);

        // Don't let end go before start
        if (newEndTime > new Date(event.startTime)) {
          const newStartTime = new Date(event.startTime);
          onEventMove(event.id, newStartTime, newEndTime);
        }
      }
    }

    setResizingEvent(null);
  };

  // Add global mouse event listeners for drag and resize
  useEffect(() => {
    if (draggingEvent) {
      window.addEventListener('mousemove', handleEventDragMove);
      window.addEventListener('mouseup', handleEventDragEnd);
      return () => {
        window.removeEventListener('mousemove', handleEventDragMove);
        window.removeEventListener('mouseup', handleEventDragEnd);
      };
    }
  }, [draggingEvent]);

  useEffect(() => {
    if (resizingEvent) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
      return () => {
        window.removeEventListener('mousemove', handleResizeMove);
        window.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [resizingEvent]);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isCreatingRef.current && createSelectionRef.current) {
        const { dayIndex, startHour, endHour } = createSelectionRef.current;
        const currentDays = daysRef.current;
        if (currentDays[dayIndex]) {
          const start = new Date(currentDays[dayIndex]);
          start.setHours(startHour, 0, 0, 0);
          const end = new Date(currentDays[dayIndex]);
          end.setHours(endHour, 0, 0, 0);
          onTimeSlotClick(start, end);
        }
      }
      isCreatingRef.current = false;
      createSelectionRef.current = null;
      setCreateSelection(null);
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [onTimeSlotClick]);

  daysRef.current = days;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Scrollable container for both headers and content */}
      <div ref={scrollContainerRef} style={{ 
        flex: 1, 
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Day Headers */}
        <div style={{
          display: 'flex',
          borderBottom: '2px solid #E5E7EB',
          flexShrink: 0,
          background: 'white',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          {/* Time column header */}
          <div style={{ width: '80px', flexShrink: 0, background: 'white' }} />
          
          {/* Day headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            flex: 1,
            minWidth: '840px' // 7 days * 120px minimum
          }}>
            {days.map((day, index) => (
              <div
                key={index}
                style={{
                  padding: '16px 8px',
                  textAlign: 'center',
                  borderLeft: index > 0 ? '1px solid #E5E7EB' : 'none'
                }}
              >
                <div style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#6B7280',
                  marginBottom: '4px',
                  letterSpacing: '0.05em'
                }}>
                  {dayNames[day.getDay()].substring(0, 3).toUpperCase()}
                </div>
                <div style={{
                  width: '32px',
                  height: '32px',
                  margin: '0 auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '15px',
                  fontWeight: 600,
                  color: index === todayIndex ? 'white' : '#0A0A0A',
                  background: index === todayIndex ? '#0066FF' : 'transparent',
                  borderRadius: '50%'
                }}>
                  {day.getDate()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Time Grid */}
        <div style={{ 
          display: 'flex',
          position: 'relative',
          flexShrink: 0
        }}>
          {/* Time labels - fixed on left */}
          <div style={{
            width: '80px',
            flexShrink: 0,
            background: 'white',
            position: 'sticky',
            left: 0,
            zIndex: 5
          }}>
            {hours.map(hour => (
              <div key={hour} style={{
                height: '60px',
                padding: '4px 12px 0 0',
                textAlign: 'right',
                fontSize: '11px',
                color: '#6B7280',
                borderTop: hour > 0 ? '1px solid #F3F4F6' : 'none',
                background: 'white'
              }}>
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            flex: 1,
            minWidth: '840px', // 7 days * 120px minimum
            position: 'relative'
          }}>
            {/* Time slots */}
            {hours.map(hour => (
              <React.Fragment key={`hour-${hour}`}>
              {days.map((day, dayIndex) => (
                <div
                  key={`${hour}-${dayIndex}`}
                  onMouseDown={(e) => {
                    if (e.button !== 0 || draggingEvent || resizingEvent) return;
                    e.preventDefault();
                    const sel = { dayIndex, startHour: hour, endHour: hour + 1 };
                    isCreatingRef.current = true;
                    createSelectionRef.current = sel;
                    setCreateSelection(sel);
                  }}
                  onMouseEnter={(e) => {
                    if (!isCreatingRef.current || !createSelectionRef.current) return;
                    if (createSelectionRef.current.dayIndex !== dayIndex) return;
                    const endHour = Math.max(createSelectionRef.current.startHour + 1, hour + 1);
                    const newSel = { ...createSelectionRef.current, endHour };
                    createSelectionRef.current = newSel;
                    setCreateSelection(newSel);
                  }}
                  onDrop={(e) => handleDrop(e, day, hour)}
                  onDragOver={(e) => handleDragOver(e, day, hour)}
                  onDragLeave={handleDragLeave}
                  style={{
                    height: '60px',
                    borderLeft: dayIndex > 0 ? '1px solid #E5E7EB' : '1px solid #E5E7EB',
                    borderTop: hour > 0 ? '1px solid #F3F4F6' : 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    background: dayIndex === todayIndex ? '#FAFBFF' : 'white'
                  }}
                  onMouseLeave={(e) => e.currentTarget.style.background = dayIndex === todayIndex ? '#FAFBFF' : 'white'}
                />
              ))}
              </React.Fragment>
            ))}

            {/* Current time indicator */}
            {todayIndex !== -1 && (
              <div
                style={{
                  position: 'absolute',
                  left: `${(todayIndex / 7) * 100}%`,
                  width: `${(1 / 7) * 100}%`,
                  top: `${(new Date().getHours() + new Date().getMinutes() / 60) * 60}px`,
                  height: '2px',
                  background: '#EF4444',
                  zIndex: 100,
                  pointerEvents: 'none'
                }}
              />
            )}

            {/* Drag preview */}
            {dragPreview && (() => {
              const dayIndex = days.findIndex(d => d.toDateString() === dragPreview.day.toDateString());
              return (
                <>
                  {/* Preview box showing where event will be placed */}
                  <div
                    style={{
                      position: 'absolute',
                      left: `${(dayIndex / 7) * 100}%`,
                      width: `${(1 / 7) * 100}%`,
                      top: `${(dragPreview.hour + dragPreview.minute / 60) * 60}px`,
                      height: '60px', // 1 hour default
                      background: 'rgba(0, 102, 255, 0.08)',
                      border: '2px dashed #0066FF',
                      borderRadius: '6px',
                      margin: '0 4px',
                      zIndex: 99,
                      pointerEvents: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  
                  {/* Time indicator line and badge */}
                  <div
                    style={{
                      position: 'absolute',
                      left: `${(dayIndex / 7) * 100}%`,
                      width: `${(1 / 7) * 100}%`,
                      top: `${(dragPreview.hour + dragPreview.minute / 60) * 60}px`,
                      height: '3px',
                      background: '#0066FF',
                      zIndex: 101,
                      pointerEvents: 'none'
                    }}
                  >
                    {/* Time badge */}
                    <div
                      style={{
                        position: 'absolute',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        top: '-32px',
                        background: '#0066FF',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        boxShadow: '0 4px 12px rgba(0, 102, 255, 0.4), 0 2px 4px rgba(0, 0, 0, 0.2)'
                      }}
                    >
                      {formatPreviewTime(dragPreview.hour, dragPreview.minute)}
                    </div>
                    
                    {/* Left circle indicator */}
                    <div
                      style={{
                        position: 'absolute',
                        left: '0',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#0066FF',
                        boxShadow: '0 0 0 3px rgba(0, 102, 255, 0.2)'
                      }}
                    />
                    
                    {/* Right circle indicator */}
                    <div
                      style={{
                        position: 'absolute',
                        right: '0',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#0066FF',
                        boxShadow: '0 0 0 3px rgba(0, 102, 255, 0.2)'
                      }}
                    />
                  </div>
                </>
              );
            })()}

            {/* Events Overlay */}
            {days.map((day, dayIndex) => {
              const dayEvents = getEventsForDay(day);
              return (
                <div
                  key={`events-${dayIndex}`}
                  style={{
                    position: 'absolute',
                    left: `${(dayIndex / 7) * 100}%`,
                    width: `${(1 / 7) * 100}%`,
                    top: 0,
                    height: `${hours.length * 60}px`,
                    pointerEvents: 'none'
                  }}
                >
                  {createSelection && createSelection.dayIndex === dayIndex && (
                    <div
                      style={{
                        position: 'absolute',
                        left: '2px',
                        right: '2px',
                        top: `${createSelection.startHour * 60}px`,
                        height: `${(createSelection.endHour - createSelection.startHour) * 60}px`,
                        backgroundColor: 'rgba(59, 130, 246, 0.15)',
                        border: '2px solid #3B82F6',
                        borderRadius: '6px',
                        zIndex: 2,
                        pointerEvents: 'none',
                        display: 'flex',
                        alignItems: 'flex-start',
                        padding: '4px 6px',
                      }}
                    >
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#1D4ED8' }}>
                        {createSelection.startHour === 0 ? '12' : createSelection.startHour > 12 ? createSelection.startHour - 12 : createSelection.startHour}:00 {createSelection.startHour < 12 ? 'AM' : 'PM'} – {createSelection.endHour === 0 ? '12' : createSelection.endHour > 12 ? createSelection.endHour - 12 : createSelection.endHour}:00 {createSelection.endHour < 12 ? 'AM' : 'PM'}
                      </span>
                    </div>
                  )}
                  {dayEvents.map(event => {
                    const isBeingDragged = draggingEvent?.id === event.id;
                    const isBeingResized = resizingEvent?.id === event.id;
                    const baseStyle = getEventStyle(event);

                    // Calculate live resize adjustments
                    let adjustedTop = parseFloat(baseStyle.top);
                    let adjustedHeight = parseFloat(baseStyle.height);

                    if (isBeingResized && resizingEvent) {
                      if (resizingEvent.edge === 'top') {
                        // Moving top edge: adjust top position and height inversely
                        const newTop = resizingEvent.originalTop + resizingEvent.currentDeltaY;
                        const newHeight = resizingEvent.originalHeight - resizingEvent.currentDeltaY;
                        if (newHeight >= 15) { // Minimum 15px (15 minutes)
                          adjustedTop = newTop;
                          adjustedHeight = newHeight;
                        }
                      } else {
                        // Moving bottom edge: just adjust height
                        const newHeight = resizingEvent.originalHeight + resizingEvent.currentDeltaY;
                        if (newHeight >= 15) { // Minimum 15px (15 minutes)
                          adjustedHeight = newHeight;
                        }
                      }
                    }

                    return (
                      <div
                        key={event.id}
                        onMouseDown={(e) => {
                          // Check if clicking on resize handles
                          const target = e.target as HTMLElement;
                          if (target.className?.includes?.('resize-handle')) {
                            return; // Let resize handle manage it
                          }
                          handleEventDragStart(e, event, dayIndex);
                        }}
                        style={{
                          position: 'absolute',
                          left: '4px',
                          right: '4px',
                          top: `${adjustedTop}px`,
                          height: `${adjustedHeight}px`,
                          minHeight: '15px',
                          pointerEvents: 'auto',
                          cursor: isBeingDragged ? 'grabbing' : 'grab',
                          opacity: isBeingDragged ? 0.7 : 1,
                          transition: isBeingDragged || isBeingResized ? 'none' : 'opacity 0.2s',
                          userSelect: 'none',
                          // Apply transform when dragging to follow cursor
                          transform: isBeingDragged && draggingEvent?.hasMoved
                            ? `translate(${draggingEvent.currentX - draggingEvent.startX}px, ${draggingEvent.currentY - draggingEvent.startY}px)`
                            : 'none',
                          zIndex: isBeingDragged || isBeingResized ? 1000 : 1,
                          boxShadow: isBeingDragged || isBeingResized ? '0 8px 24px rgba(0,0,0,0.2)' : undefined,
                        }}
                      >
                        {/* Top resize handle */}
                        <div
                          className="resize-handle resize-handle-top"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            handleResizeStart(e, event, 'top');
                          }}
                          style={{
                            position: 'absolute',
                            top: '-2px',
                            left: '8px',
                            right: '8px',
                            height: '6px',
                            cursor: 'ns-resize',
                            zIndex: 100,
                            borderRadius: '3px',
                            background: 'transparent',
                            transition: 'background 0.15s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(0, 102, 255, 0.5)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                          }}
                        />
                        
                        {/* Event content */}
                        <div
                          onClick={(e) => {
                            if (!isBeingDragged && !isBeingResized) {
                              e.stopPropagation();
                              onEventClick(event);
                            }
                          }}
                          style={{
                            position: 'absolute',
                            top: '2px',
                            bottom: '2px',
                            left: 0,
                            right: 0,
                            zIndex: 1
                          }}
                        >
                          <CalendarEventCard
                            event={event}
                            size="week"
                            userColors={userColors}
                            selectedCalendars={selectedCalendars}
                          />
                        </div>

                        {/* Bottom resize handle */}
                        <div
                          className="resize-handle resize-handle-bottom"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            handleResizeStart(e, event, 'bottom');
                          }}
                          style={{
                            position: 'absolute',
                            bottom: '-2px',
                            left: '8px',
                            right: '8px',
                            height: '6px',
                            cursor: 'ns-resize',
                            zIndex: 100,
                            borderRadius: '3px',
                            background: 'transparent',
                            transition: 'background 0.15s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(0, 102, 255, 0.5)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}