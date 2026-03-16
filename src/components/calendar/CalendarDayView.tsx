import React, { useRef, useEffect } from 'react';
import { CalendarEvent } from './WorkdeckCalendar';
import { CalendarEventCard } from './CalendarEventCard';

interface CalendarDayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onTimeSlotClick: (date: Date) => void;
  onTaskDrop: (date: Date, task: any) => void;
  userColors?: { [key: string]: string };
  selectedCalendars?: string[];
}

export function CalendarDayView({
  currentDate,
  events,
  onEventClick,
  onTimeSlotClick,
  onTaskDrop,
  userColors,
  selectedCalendars
}: CalendarDayViewProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to current time on mount and when date changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      const now = new Date();
      const isToday = currentDate.toDateString() === now.toDateString();
      
      if (isToday) {
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

  // Get events for the current day
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate.getDate() === currentDate.getDate() &&
           eventDate.getMonth() === currentDate.getMonth() &&
           eventDate.getFullYear() === currentDate.getFullYear();
  });

  // Calculate event position and height
  const getEventStyle = (event: CalendarEvent) => {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    const duration = endHour - startHour;

    return {
      top: `${startHour * 80}px`,
      height: `${duration * 80}px`,
      minHeight: '64px'
    };
  };

  const handleDrop = (e: React.DragEvent, hour: number) => {
    e.preventDefault();
    const taskData = e.dataTransfer.getData('task');
    if (taskData) {
      const task = JSON.parse(taskData);
      const dropDate = new Date(currentDate);
      dropDate.setHours(hour, 0, 0, 0);
      onTaskDrop(dropDate, task);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Day Header */}
      <div style={{
        padding: '20px 24px',
        borderBottom: '2px solid #E5E7EB',
        flexShrink: 0,
        background: 'white',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '12px',
            fontWeight: 600,
            color: '#6B7280',
            marginBottom: '8px',
            letterSpacing: '0.05em'
          }}>
            {currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()}
          </div>
          <div style={{
            fontSize: '32px',
            fontWeight: 600,
            color: '#0A0A0A'
          }}>
            {currentDate.getDate()}
          </div>
          <div style={{
            fontSize: '14px',
            color: '#6B7280',
            marginTop: '4px'
          }}>
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Time Grid */}
      <div ref={scrollContainerRef} style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        <div style={{ display: 'flex', position: 'relative' }}>
          {/* Time labels */}
          <div style={{ width: '80px', flexShrink: 0 }}>
            {Array.from({ length: 24 }, (_, i) => i).map(hour => (
              <div
                key={hour}
                style={{
                  height: '80px',
                  padding: '4px 12px 0 0',
                  textAlign: 'right',
                  fontSize: '11px',
                  color: '#6B7280',
                  borderTop: hour > 0 ? '1px solid #F3F4F6' : 'none'
                }}
              >
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </div>
            ))}
          </div>

          {/* Day column */}
          <div style={{ flex: 1, position: 'relative' }}>
            {Array.from({ length: 24 }, (_, i) => i).map(hour => (
              <div
                key={hour}
                onClick={() => {
                  const clickedDate = new Date(currentDate);
                  clickedDate.setHours(hour, 0, 0, 0);
                  onTimeSlotClick(clickedDate);
                }}
                onDrop={(e) => handleDrop(e, hour)}
                onDragOver={handleDragOver}
                style={{
                  height: '80px',
                  borderLeft: '1px solid #E5E7EB',
                  borderTop: hour > 0 ? '1px solid #F3F4F6' : 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  background: 'white',
                  transition: 'background 150ms'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
              />
            ))}

            {/* Timeline Indicator */}
            {currentDate.toDateString() === new Date().toDateString() && (
              <div
                style={{
                  position: 'absolute',
                  left: '8px',
                  right: '8px',
                  top: `${(new Date().getHours() + new Date().getMinutes() / 60) * 80}px`,
                  height: '2px',
                  background: '#EF4444',
                  zIndex: 1
                }}
              />
            )}

            {/* Events Overlay */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                height: `${24 * 80}px`,
                pointerEvents: 'none'
              }}
            >
              {dayEvents.map(event => (
                <div
                  key={event.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick(event);
                  }}
                  style={{
                    position: 'absolute',
                    left: '8px',
                    right: '8px',
                    ...getEventStyle(event),
                    pointerEvents: 'auto'
                  }}
                >
                  <CalendarEventCard event={event} size="week" userColors={userColors} selectedCalendars={selectedCalendars} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}