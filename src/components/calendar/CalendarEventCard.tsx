import React from 'react';
import { Link, Clock, DollarSign, Lock, Globe, Users, Repeat, AlertTriangle } from 'lucide-react';
import { CalendarEvent } from './WorkdeckCalendar';

interface CalendarEventCardProps {
  event: CalendarEvent;
  size: 'week' | 'month';
  userColors?: { [key: string]: string };
  selectedCalendars?: string[];
  onEventDragStart?: (event: CalendarEvent) => void;
  onEventDragEnd?: () => void;
}

export function CalendarEventCard({ event, size, userColors, selectedCalendars, onEventDragStart, onEventDragEnd }: CalendarEventCardProps) {
  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const getTimeRange = () => {
    return `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`;
  };

  const icons = [];
  
  // Task-linked
  if (event.task) {
    icons.push({ icon: Link, color: '#6B7280', tooltip: 'Task-linked' });
  }
  
  // Timesheet
  if (event.isTimesheet) {
    icons.push({ icon: Clock, color: '#0066FF', tooltip: 'Timesheet' });
  }
  
  // Billable
  if (event.isBillable) {
    icons.push({ icon: DollarSign, color: '#10B981', tooltip: 'Billable' });
  }
  
  // Private
  if (event.isPrivate) {
    icons.push({ icon: Lock, color: '#6B7280', tooltip: 'Private' });
  }
  
  // External meeting
  if (event.isExternal) {
    icons.push({ icon: Globe, color: '#3B82F6', tooltip: 'External meeting' });
  }
  
  // Recurring
  if (event.isRecurring) {
    icons.push({ icon: Repeat, color: '#6B7280', tooltip: 'Recurring' });
  }
  
  // Sync issue
  if (event.hasSyncIssue) {
    icons.push({ icon: AlertTriangle, color: '#F59E0B', tooltip: 'Sync issue' });
  }

  if (size === 'week') {
    // Hybrid approach: use project color when viewing only your calendar, user color when viewing multiple
    const isMultiCalendarView = selectedCalendars && selectedCalendars.length > 1;
    const cardColor = isMultiCalendarView 
      ? (userColors && event.createdBy ? userColors[event.createdBy] : (event.projectColor || '#6B7280'))
      : (event.projectColor || '#6B7280');
    
    return (
      <div style={{
        height: '100%',
        padding: '8px',
        background: cardColor,
        borderLeft: '3px solid rgba(0,0,0,0.2)',
        borderRadius: '4px',
        color: 'white',
        cursor: 'pointer',
        overflow: 'hidden',
        transition: 'all 150ms',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}>
        {/* Sync Warning Icon */}
        {event.hasSyncIssue && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginBottom: '4px'
          }}>
            <AlertTriangle size={12} color="white" />
          </div>
        )}

        {/* Title */}
        <div style={{
          fontSize: '12px',
          fontWeight: 600,
          marginBottom: '2px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical'
        }}>
          {event.title}
        </div>

        {/* Project */}
        {event.project && (
          <div style={{
            fontSize: '11px',
            opacity: 0.9,
            marginBottom: '4px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {event.project}
          </div>
        )}

        {/* Time */}
        <div style={{
          fontSize: '11px',
          opacity: 0.9,
          marginBottom: '6px'
        }}>
          {getTimeRange()}
        </div>

        {/* Icons */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          flexWrap: 'wrap',
          marginTop: 'auto'
        }}>
          {icons.slice(0, 4).map((iconData, index) => {
            const IconComponent = iconData.icon;
            return (
              <div
                key={index}
                title={iconData.tooltip}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <IconComponent size={12} color="white" style={{ opacity: 0.9 }} />
              </div>
            );
          })}
          {event.guests && event.guests.length > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              fontSize: '10px',
              opacity: 0.9
            }}>
              <Users size={11} />
              <span>{event.guests.length}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Month view - simplified
  return (
    <div style={{
      padding: '4px 6px',
      background: event.projectColor || '#6B7280',
      borderRadius: '4px',
      fontSize: '11px',
      color: 'white',
      fontWeight: 500,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    }}>
      {event.hasSyncIssue && <AlertTriangle size={10} />}
      {event.task && <Link size={10} />}
      {event.isPrivate && <Lock size={10} />}
      <span>{event.title}</span>
    </div>
  );
}