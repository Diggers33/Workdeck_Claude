import React from 'react';
import { CalendarEvent } from './WorkdeckCalendar';

interface CalendarMonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onDayClick: (date: Date) => void;
  onTaskDrop?: (date: Date, task: any) => void;
  userColors?: { [key: string]: string };
  selectedCalendars?: string[];
}

export function CalendarMonthView({
  currentDate,
  events,
  onEventClick,
  onDayClick,
  onTaskDrop,
  userColors,
  selectedCalendars
}: CalendarMonthViewProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month
  const firstDay = new Date(year, month, 1);
  const startingDayOfWeek = firstDay.getDay();

  // Get days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Get days in previous month
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Calculate total cells needed
  const totalCells = Math.ceil((daysInMonth + startingDayOfWeek) / 7) * 7;

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() &&
           month === today.getMonth() &&
           year === today.getFullYear();
  };

  const getEventsForDate = (day: number) => {
    return events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.getDate() === day &&
             eventDate.getMonth() === month &&
             eventDate.getFullYear() === year;
    });
  };

  const handleDrop = (e: React.DragEvent, day: number) => {
    e.preventDefault();
    const taskData = e.dataTransfer.getData('task');
    if (taskData && onTaskDrop) {
      const task = JSON.parse(taskData);
      const dropDate = new Date(year, month, day, 9, 0, 0, 0); // Default to 9 AM
      onTaskDrop(dropDate, task);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '20px' }}>
      {/* Day Headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '1px',
        marginBottom: '8px',
        flexShrink: 0
      }}>
        {dayNames.map(day => (
          <div
            key={day}
            style={{
              padding: '8px',
              textAlign: 'center',
              fontSize: '12px',
              fontWeight: 600,
              color: '#6B7280',
              letterSpacing: '0.05em'
            }}
          >
            {day.toUpperCase()}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gridTemplateRows: `repeat(${totalCells / 7}, 1fr)`,
        gap: '1px',
        background: '#E5E7EB',
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        {Array.from({ length: totalCells }).map((_, index) => {
          let day: number;
          let isCurrentMonth: boolean;
          let isPrevMonth = false;
          let isNextMonth = false;

          if (index < startingDayOfWeek) {
            // Previous month
            day = daysInPrevMonth - startingDayOfWeek + index + 1;
            isCurrentMonth = false;
            isPrevMonth = true;
          } else if (index < startingDayOfWeek + daysInMonth) {
            // Current month
            day = index - startingDayOfWeek + 1;
            isCurrentMonth = true;
          } else {
            // Next month
            day = index - startingDayOfWeek - daysInMonth + 1;
            isCurrentMonth = false;
            isNextMonth = true;
          }

          const dayEvents = isCurrentMonth ? getEventsForDate(day) : [];
          const isTodayCell = isCurrentMonth && isToday(day);

          return (
            <div
              key={index}
              onClick={() => {
                if (isCurrentMonth) {
                  onDayClick(new Date(year, month, day));
                }
              }}
              style={{
                background: 'white',
                padding: '8px',
                cursor: isCurrentMonth ? 'pointer' : 'default',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100px',
                position: 'relative',
                transition: 'background 150ms'
              }}
              onMouseEnter={(e) => {
                if (isCurrentMonth) e.currentTarget.style.background = '#F9FAFB';
              }}
              onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
              onDrop={(e) => handleDrop(e, day)}
              onDragOver={handleDragOver}
            >
              {/* Day Number */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '4px'
              }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: isCurrentMonth ? (isTodayCell ? 'white' : '#0A0A0A') : '#D1D5DB',
                  background: isTodayCell ? '#0066FF' : 'transparent',
                  borderRadius: '50%'
                }}>
                  {day}
                </div>
              </div>

              {/* Events */}
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                overflow: 'hidden'
              }}>
                {dayEvents.slice(0, 3).map(event => {
                  // Hybrid approach: use project color when viewing only your calendar, user color when viewing multiple
                  const isMultiCalendarView = selectedCalendars && selectedCalendars.length > 1;
                  const cardColor = isMultiCalendarView 
                    ? (userColors && event.createdBy ? userColors[event.createdBy] : (event.projectColor || '#6B7280'))
                    : (event.projectColor || '#6B7280');
                  
                  return (
                    <div
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                      }}
                      style={{
                        padding: '4px 6px',
                        background: cardColor,
                        borderRadius: '4px',
                        fontSize: '11px',
                        color: 'white',
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        position: 'relative'
                      }}
                      title={event.title}
                    >
                      {event.title}
                    </div>
                  );
                })}
                {dayEvents.length > 3 && (
                  <div style={{
                    fontSize: '11px',
                    color: '#6B7280',
                    fontWeight: 500,
                    padding: '2px 6px'
                  }}>
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}