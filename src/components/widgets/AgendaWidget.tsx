import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { EventModal } from '../calendar/EventModal';
import { dashboardApi, CalendarEvent as ApiEvent } from '../../services/dashboard-api';
import { apiClient } from '../../services/api-client';
import { formatDateTimeForAPI } from '../../utils/date-utils';
import { getEventAttachments, saveEventAttachments } from '../../services/cloud-file-picker';
import { useAuth } from '../../contexts/AuthContext';

interface AgendaWidgetProps {
  draggedTask?: any;
}

interface Event {
  id: string;
  start: number;
  duration: number;
  title: string;
  color: string;
  overlap?: number; // Which column in overlapping layout
  totalOverlaps?: number; // Total overlapping events
  rawApiEvent?: any; // Original API event data for updates
  attachments?: Array<{id: string; name: string; size: string; type: string; date: string; source?: string; url?: string; content?: string}>;
}

// Parse date string in DD/MM/YYYY HH:mm:ss+HH:MM or ISO format
function parseApiDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  // Try ISO format first
  if (dateStr.includes('T') || dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  // Parse DD/MM/YYYY HH:mm:ss+HH:MM format (with timezone offset)
  const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})([+-]\d{2}:\d{2})?/);
  if (match) {
    const [, day, month, year, hours, minutes, seconds, tzOffset] = match;
    // Convert to ISO format so Date constructor handles timezone correctly
    const isoStr = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${tzOffset || ''}`;
    const parsed = new Date(isoStr);
    if (!isNaN(parsed.getTime())) return parsed;
    // Fallback without timezone
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes), parseInt(seconds));
  }
  const fallback = new Date(dateStr);
  if (!isNaN(fallback.getTime())) return fallback;
  return new Date();
}

export function AgendaWidget({ draggedTask }: AgendaWidgetProps) {
  const { user: authUser } = useAuth();
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragOverTime, setDragOverTime] = useState<number | null>(null);
  const [resizingEvent, setResizingEvent] = useState<{ id: string; edge: 'top' | 'bottom' } | null>(null);
  const [draggingEvent, setDraggingEvent] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const timelineRef = useRef<HTMLDivElement>(null);

  const [events, setEvents] = useState<Event[]>([]);
  const attachmentsCache = useRef<Record<string, Event['attachments']>>({});
  const justFinishedAction = useRef(false);
  const savingInProgress = useRef(false);
  const pendingDragRef = useRef<{ eventId: string; startX: number; startY: number } | null>(null);

  // Click-to-select time range for creating new events
  const [isSelectingTime, setIsSelectingTime] = useState(false);
  const [timeSelection, setTimeSelection] = useState<{ start: number; end: number } | null>(null);
  const [creatingEventTimes, setCreatingEventTimes] = useState<{ start: number; end: number } | null>(null);
  const selectionStartRef = useRef<number | null>(null);

  const currentHour = new Date().getHours();
  const startHour = 0;
  const endHour = 23;
  const pixelsPerHour = 60;

  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);

  // Load events from API
  useEffect(() => {
    loadEvents();
  }, [selectedDate]);

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const apiEvents = await dashboardApi.getEvents(selectedDate);

      // Convert API events to widget format
      const serverIds = new Set(apiEvents.map((e: ApiEvent) => e.id));
      const convertedEvents: Event[] = apiEvents.map((e: ApiEvent) => {
        const startDate = parseApiDate(e.startAt);
        const endDate = parseApiDate(e.endAt);
        const startHour = startDate.getHours() + startDate.getMinutes() / 60;
        const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60); // hours

        return {
          id: e.id,
          start: startHour,
          duration: Math.max(0.5, duration), // Minimum 30 min
          title: e.title,
          color: e.color || '#3B82F6',
          rawApiEvent: e
        };
      });

      // Preserve optimistic events (no rawApiEvent) that the server hasn't returned yet
      setEvents(prev => {
        const optimisticOnly = prev.filter(ev => !ev.rawApiEvent && !serverIds.has(ev.id));
        return [...convertedEvents, ...optimisticOnly];
      });
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Navigate dates
  const goToPreviousDay = () => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 1);
      return newDate;
    });
  };

  const goToNextDay = () => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 1);
      return newDate;
    });
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // Scroll to center current time on mount
  useEffect(() => {
    if (timelineRef.current) {
      const currentTimePosition = currentHour * pixelsPerHour;
      const containerHeight = timelineRef.current.clientHeight;
      const scrollPosition = currentTimePosition - (containerHeight / 2);
      
      timelineRef.current.scrollTop = scrollPosition;
    }
  }, []);

  // Calculate overlapping events and assign columns
  const getEventsWithOverlaps = (): Event[] => {
    const sorted = [...events].sort((a, b) => a.start - b.start);
    const withOverlaps: Event[] = [];
    
    sorted.forEach(event => {
      // Find overlapping events
      const overlapping = withOverlaps.filter(e => {
        const eventEnd = event.start + event.duration;
        const eEnd = e.start + e.duration;
        return (event.start < eEnd && eventEnd > e.start);
      });
      
      // Find first available column
      let column = 0;
      const usedColumns = overlapping.map(e => e.overlap || 0);
      while (usedColumns.includes(column)) {
        column++;
      }
      
      withOverlaps.push({
        ...event,
        overlap: column,
        totalOverlaps: Math.max(column + 1, ...overlapping.map(e => e.totalOverlaps || 1))
      });
    });
    
    // Update total overlaps for all events in each group
    const result = withOverlaps.map(event => {
      const group = withOverlaps.filter(e => {
        const eventEnd = event.start + event.duration;
        const eEnd = e.start + e.duration;
        return (event.start < eEnd && eventEnd > e.start);
      });
      const maxOverlaps = Math.max(...group.map(e => (e.overlap || 0) + 1));
      return { ...event, totalOverlaps: maxOverlaps };
    });
    
    return result;
  };

  const getTimeFromMousePosition = (e: React.MouseEvent): number | null => {
    if (!timelineRef.current) return null;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top + timelineRef.current.scrollTop;
    
    // Calculate time based on position (in 15-minute increments)
    const totalMinutes = (y / pixelsPerHour) * 60;
    const roundedMinutes = Math.round(totalMinutes / 15) * 15;
    const hours = Math.floor(roundedMinutes / 60);
    const minutes = roundedMinutes % 60;
    
    return hours + minutes / 60;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
    
    const time = getTimeFromMousePosition(e as any);
    if (time !== null && time >= 0 && time <= 24) {
      setDragOverTime(time);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
    setDragOverTime(null);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (draggedTask && dragOverTime !== null) {
      const newEventId = crypto.randomUUID();
      const newEvent: Event = {
        id: newEventId,
        start: dragOverTime,
        duration: 1, // 1 hour default
        title: draggedTask.title,
        color: draggedTask.projectColor || '#60A5FA'
      };

      // Optimistically add to UI
      setEvents(prev => [...prev, newEvent]);

      // Save to API
      try {
        const startTime = new Date(selectedDate);
        startTime.setHours(Math.floor(dragOverTime), Math.round((dragOverTime % 1) * 60), 0, 0);
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour

        const payload: Record<string, any> = {
          id: newEventId,
          title: draggedTask.title,
          startAt: formatDateTimeForAPI(startTime),
          endAt: formatDateTimeForAPI(endTime),
          color: draggedTask.projectColor || '#60A5FA',
          state: 1,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          timesheet: true,
          billable: false,
          private: false,
          guests: [{ id: authUser?.id }],
          fromUser: authUser?.id,
          creator: { id: authUser?.id },
        };

        if (draggedTask.id) {
          payload.task = { id: draggedTask.id };
        }

        const dropResponse = await apiClient.post('/commands/sync/create-event', payload) as any;
        // Server assigns its own ID — update optimistic event to use server ID
        const serverDropId: string = dropResponse?.id || newEventId;
        if (serverDropId !== newEventId) {
          setEvents(prev => prev.map(ev =>
            ev.id === newEventId ? { ...ev, id: serverDropId, rawApiEvent: dropResponse } : ev
          ));
        }
        dashboardApi.clearCache('events*');
        setTimeout(() => { dashboardApi.clearCache('events*'); loadEvents(); }, 2000);
      } catch (error) {
        console.error('Failed to create event from dropped task:', error);
        // Remove the optimistic event on failure
        setEvents(prev => prev.filter(ev => ev.id !== newEventId));
      }
    }

    setDragOverTime(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragOver) {
      const time = getTimeFromMousePosition(e);
      if (time !== null && time >= 0 && time <= 24) {
        setDragOverTime(time);
      }
    }
  };

  const handleResizeStart = (eventId: string, edge: 'top' | 'bottom', e: React.MouseEvent) => {
    e.stopPropagation();
    setResizingEvent({ id: eventId, edge });
  };

  const handleResizeMove = (e: React.MouseEvent) => {
    if (!resizingEvent || !timelineRef.current) return;
    
    const event = events.find(ev => ev.id === resizingEvent.id);
    if (!event) return;
    
    const time = getTimeFromMousePosition(e);
    if (time === null) return;
    
    if (resizingEvent.edge === 'top') {
      // Resizing from top - change start time
      const newStart = Math.max(0, Math.min(time, event.start + event.duration - 0.25));
      const newDuration = (event.start + event.duration) - newStart;
      
      setEvents(prev => prev.map(ev => 
        ev.id === resizingEvent.id ? { ...ev, start: newStart, duration: newDuration } : ev
      ));
    } else {
      // Resizing from bottom - change duration (minimum 15 minutes = 0.25 hours)
      const newDuration = Math.max(0.25, time - event.start);
      
      setEvents(prev => prev.map(ev => 
        ev.id === resizingEvent.id ? { ...ev, duration: newDuration } : ev
      ));
    }
  };

  const saveEventToAPI = async (event: Event) => {
    if (savingInProgress.current) return;
    savingInProgress.current = true;

    const startDate = new Date(selectedDate);
    startDate.setHours(Math.floor(event.start), Math.round((event.start % 1) * 60), 0, 0);
    const endDate = new Date(selectedDate);
    const endTime = event.start + event.duration;
    endDate.setHours(Math.floor(endTime), Math.round((endTime % 1) * 60), 0, 0);

    const payload: Record<string, any> = {
      id: event.id,
      title: event.title,
      startAt: formatDateTimeForAPI(startDate),
      endAt: formatDateTimeForAPI(endDate),
      fromUser: authUser?.id,
      color: event.color || '#3B82F6',
      creator: { id: authUser?.id },
      guests: [{ id: authUser?.id }],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    console.log('Saving event update:', payload);

    try {
      await apiClient.post('/commands/sync/update-event', payload);
      console.log('Event saved successfully');
    } catch (error) {
      console.error('Failed to save event:', error);
    } finally {
      savingInProgress.current = false;
    }
  };

  const handleResizeEnd = () => {
    if (resizingEvent) {
      const event = events.find(ev => ev.id === resizingEvent.id);
      if (event) saveEventToAPI(event);
      justFinishedAction.current = true;
      setTimeout(() => { justFinishedAction.current = false; }, 100);
    }
    setResizingEvent(null);
  };

  const handleDragStart = (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Don't call e.preventDefault() - store as pending drag, only activate on movement
    pendingDragRef.current = { eventId, startX: e.clientX, startY: e.clientY };
  };

  const handleDragMove = (e: React.MouseEvent) => {
    // Check if pending drag should activate (movement threshold of 4px)
    if (pendingDragRef.current && !draggingEvent) {
      const dx = e.clientX - pendingDragRef.current.startX;
      const dy = e.clientY - pendingDragRef.current.startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        setDraggingEvent(pendingDragRef.current.eventId);
        pendingDragRef.current = null; // Clear pending so dragEnd knows it's a real drag
      }
      return;
    }

    if (!draggingEvent || !timelineRef.current) return;

    const event = events.find(ev => ev.id === draggingEvent);
    if (!event) return;

    const time = getTimeFromMousePosition(e);
    if (time === null) return;

    // Calculate new start time (snap to 15 minute increments)
    const newStart = Math.max(0, Math.min(23.75, time));

    setEvents(prev => prev.map(ev =>
      ev.id === draggingEvent ? { ...ev, start: newStart } : ev
    ));
  };

  const handleDragEnd = () => {
    // If pending drag never activated (no movement), treat as click
    if (pendingDragRef.current && !draggingEvent) {
      const eventId = pendingDragRef.current.eventId;
      pendingDragRef.current = null;
      setSelectedEventId(eventId);
      return;
    }
    pendingDragRef.current = null;

    if (draggingEvent) {
      const event = events.find(ev => ev.id === draggingEvent);
      if (event) saveEventToAPI(event);
      justFinishedAction.current = true;
      setTimeout(() => { justFinishedAction.current = false; }, 100);
    }
    setDraggingEvent(null);
  };

  const handleEventClick = (eventId: string, e: React.MouseEvent) => {
    // Only open modal if we're not in the middle of dragging/resizing
    if (!draggingEvent && !resizingEvent && !justFinishedAction.current) {
      setSelectedEventId(eventId);
    }
  };

  const handleTimelineMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if (draggingEvent || resizingEvent) return;
    const time = getTimeFromMousePosition(e);
    if (time === null) return;
    selectionStartRef.current = time;
    setIsSelectingTime(true);
    setTimeSelection({ start: time, end: time });
    e.preventDefault();
  };

  const handleSelectionMove = (e: React.MouseEvent) => {
    if (!isSelectingTime || selectionStartRef.current === null) return;
    const time = getTimeFromMousePosition(e);
    if (time === null) return;
    const start = Math.min(selectionStartRef.current, time);
    const end = Math.max(selectionStartRef.current, time);
    setTimeSelection({ start, end });
  };

  const handleSelectionEnd = () => {
    if (isSelectingTime && timeSelection) {
      const duration = timeSelection.end - timeSelection.start;
      if (duration >= 0.25) {
        setCreatingEventTimes({ start: timeSelection.start, end: timeSelection.end });
      }
    }
    setIsSelectingTime(false);
    setTimeSelection(null);
    selectionStartRef.current = null;
  };

  const formatTime = (time: number): string => {
    const hours = Math.floor(time);
    const minutes = Math.round((time % 1) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const eventsWithOverlaps = getEventsWithOverlaps();

  // Convert event to calendar event format
  const selectedEvent = selectedEventId ? events.find(e => e.id === selectedEventId) : null;
  const calendarEvent = selectedEvent ? (() => {
    const raw = selectedEvent.rawApiEvent;
    return {
      id: selectedEvent.id,
      title: selectedEvent.title,
      startTime: (() => {
        const d = new Date(selectedDate);
        d.setHours(Math.floor(selectedEvent.start));
        d.setMinutes((selectedEvent.start % 1) * 60);
        d.setSeconds(0);
        return d;
      })(),
      endTime: (() => {
        const d = new Date(selectedDate);
        const endTime = selectedEvent.start + selectedEvent.duration;
        d.setHours(Math.floor(endTime));
        d.setMinutes((endTime % 1) * 60);
        d.setSeconds(0);
        return d;
      })(),
      color: selectedEvent.color,
      isTimesheet: true,
      isBillable: false,
      // Pass through fields from rawApiEvent
      description: raw?.description || '',
      project: raw?.project?.name || '',
      projectId: raw?.project?.id || null,
      task: raw?.task?.name || '',
      taskId: raw?.task?.id || null,
      guests: (raw?.guests || []).filter((g: any) => g.guest?.id && g.guest.id !== raw?.creator?.id).map((g: any) => `${g.guest.firstName || ''} ${g.guest.lastName || ''}`.trim() || g.guest.email || ''),
      guestIds: (raw?.guests || []).filter((g: any) => g.guest?.id && g.guest.id !== raw?.creator?.id).map((g: any) => g.guest.id),
      createdBy: raw?.creator ? `${raw.creator.firstName || ''} ${raw.creator.lastName || ''}`.trim() : 'You',
      creatorId: raw?.creator?.id || authUser?.id,
      isPrivate: raw?.isPrivate || false,
      isExternal: raw?.isExternal || false,
      recurrence: raw?.recurrence || '',
      projectColor: raw?.color || selectedEvent.color || '#3B82F6',
      attachments: selectedEvent.attachments || attachmentsCache.current[selectedEvent.id] || getEventAttachments(selectedEvent.id),
    };
  })() : null;

  return (
    <>
      {creatingEventTimes && (
        <EventModal
          event={(() => {
            const startDate = new Date(selectedDate);
            startDate.setHours(Math.floor(creatingEventTimes.start), Math.round((creatingEventTimes.start % 1) * 60), 0, 0);
            const endDate = new Date(selectedDate);
            endDate.setHours(Math.floor(creatingEventTimes.end), Math.round((creatingEventTimes.end % 1) * 60), 0, 0);
            return {
              id: '',
              title: '',
              startTime: startDate,
              endTime: endDate,
              color: '#3B82F6',
              isTimesheet: true,
              isBillable: false,
              isPrivate: false,
              createdBy: authUser?.fullName || 'You',
              creatorId: authUser?.id,
              guestIds: [authUser?.id].filter(Boolean),
              guests: [],
            } as any;
          })()}
          onClose={() => setCreatingEventTimes(null)}
          onSave={async (updatedEvent) => {
            const newEventId = crypto.randomUUID();
            const startTime = new Date(updatedEvent.startTime!);
            const endTime = new Date(updatedEvent.endTime!);
            const start = startTime.getHours() + startTime.getMinutes() / 60;
            const end = endTime.getHours() + endTime.getMinutes() / 60;
            const duration = Math.max(0.25, end - start);

            const newEvent: Event = {
              id: newEventId,
              start,
              duration,
              title: updatedEvent.title || 'New Event',
              color: updatedEvent.color || updatedEvent.projectColor || '#3B82F6',
            };

            setEvents(prev => [...prev, newEvent]);
            setCreatingEventTimes(null);

            try {
              const payload: Record<string, any> = {
                id: newEventId,
                title: updatedEvent.title || 'New Event',
                startAt: formatDateTimeForAPI(startTime),
                endAt: formatDateTimeForAPI(endTime),
                color: updatedEvent.color || updatedEvent.projectColor || '#3B82F6',
                state: 1,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                timesheet: updatedEvent.isTimesheet ?? true,
                billable: updatedEvent.isBillable ?? false,
                private: updatedEvent.isPrivate ?? false,
                guests: updatedEvent.guestIds?.length
                  ? updatedEvent.guestIds.map((gid: string) => ({ id: gid }))
                  : [{ id: authUser?.id }],
                fromUser: authUser?.id,
                creator: { id: updatedEvent.creatorId || authUser?.id },
              };
              if (updatedEvent.projectId) payload.project = { id: updatedEvent.projectId };
              if (updatedEvent.taskId) payload.task = { id: updatedEvent.taskId };
              if (updatedEvent.description) payload.description = updatedEvent.description;
              if (updatedEvent.recurrence) payload.recurrence = updatedEvent.recurrence;
              if (updatedEvent.meetingLink) payload.meetingLink = updatedEvent.meetingLink;
              if (updatedEvent.meetingRoom) payload.meetingRoom = updatedEvent.meetingRoom;
              if (updatedEvent.location) payload.location = updatedEvent.location;
              if (updatedEvent.isExternal) payload.isExternal = updatedEvent.isExternal;

              console.log('Create guests being sent:', payload.guests, '| guestIds from modal:', updatedEvent.guestIds);
              const createResponse = await apiClient.post('/commands/sync/create-event', payload) as any;
              console.log('Create event API response (full):', JSON.stringify(createResponse));
              dashboardApi.clearCache('events*');

              // Server assigns its own ID — update optimistic event to use the server ID
              const serverEventId: string = createResponse?.id || newEventId;
              if (serverEventId !== newEventId) {
                setEvents(prev => prev.map(ev =>
                  ev.id === newEventId
                    ? { ...ev, id: serverEventId, rawApiEvent: createResponse }
                    : ev
                ));
              }

              // Reload after delay to allow server indexing
              setTimeout(() => { dashboardApi.clearCache('events*'); loadEvents(); }, 2000);
            } catch (error) {
              console.error('Failed to create event:', error);
              setEvents(prev => prev.filter(ev => ev.id !== newEventId));
            }
          }}
        />
      )}
      {selectedEventId && calendarEvent && (
        <EventModal
          event={calendarEvent}
          onClose={() => setSelectedEventId(null)}
          onAttachmentsChange={(eventId, atts) => {
            attachmentsCache.current[eventId] = atts;
            saveEventAttachments(eventId, atts);
            setEvents(prev => prev.map(ev =>
              ev.id === eventId ? { ...ev, attachments: atts } : ev
            ));
          }}
          onSave={async (updatedEvent) => {
            // Update the event in the list
            const startTime = new Date(updatedEvent.startTime);
            const endTime = new Date(updatedEvent.endTime);
            const start = startTime.getHours() + startTime.getMinutes() / 60;
            const end = endTime.getHours() + endTime.getMinutes() / 60;
            const duration = end - start;

            // Cache attachments locally (API may not persist them yet)
            if (updatedEvent.attachments?.length > 0) {
              attachmentsCache.current[updatedEvent.id] = updatedEvent.attachments;
            }

            setEvents(prev => prev.map(ev =>
              ev.id === updatedEvent.id
                ? {
                    ...ev,
                    title: updatedEvent.title,
                    start,
                    duration,
                    color: updatedEvent.color || updatedEvent.projectColor || ev.color,
                    attachments: updatedEvent.attachments,
                    rawApiEvent: {
                      ...(ev.rawApiEvent || {}),
                      title: updatedEvent.title,
                      color: updatedEvent.color || updatedEvent.projectColor || ev.color,
                      description: updatedEvent.description,
                      project: updatedEvent.projectId ? { id: updatedEvent.projectId, name: updatedEvent.project || '' } : ev.rawApiEvent?.project,
                      task: updatedEvent.taskId ? { id: updatedEvent.taskId, name: updatedEvent.task || '' } : ev.rawApiEvent?.task,
                      guests: (updatedEvent.guestIds || []).filter(Boolean).map((id, i) => ({
                        guestId: id,
                        guest: { id, firstName: (updatedEvent.guests?.[i] || '').split(' ')[0] || '', lastName: (updatedEvent.guests?.[i] || '').split(' ').slice(1).join(' ') || '' },
                        state: 1,
                        rejectComment: null,
                        officeEventId: null,
                      })),
                    },
                  }
                : ev
            ));
            setSelectedEventId(null);

            // Persist to API
            try {
              const payload: Record<string, any> = {
                id: updatedEvent.id,
                title: updatedEvent.title,
                startAt: formatDateTimeForAPI(startTime),
                endAt: formatDateTimeForAPI(endTime),
                fromUser: authUser?.id,
                color: updatedEvent.color || updatedEvent.projectColor || '#3B82F6',
                creator: { id: updatedEvent.creatorId || authUser?.id },
                guests: updatedEvent.guestIds?.filter(Boolean).map((gid: string) => ({ id: gid })) || [{ id: authUser?.id }],
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                timesheet: updatedEvent.isTimesheet ?? true,
                billable: updatedEvent.isBillable ?? false,
                private: updatedEvent.isPrivate ?? false,
              };
              if (updatedEvent.description) payload.description = updatedEvent.description;
              if (updatedEvent.projectId) payload.project = { id: updatedEvent.projectId };
              if (updatedEvent.taskId) payload.task = { id: updatedEvent.taskId };
              if (updatedEvent.recurrence) payload.recurrence = updatedEvent.recurrence;
              if (updatedEvent.meetingLink) payload.meetingLink = updatedEvent.meetingLink;
              if (updatedEvent.meetingRoom) payload.meetingRoom = updatedEvent.meetingRoom;
              if (updatedEvent.location) payload.location = updatedEvent.location;
              if (updatedEvent.isExternal) payload.isExternal = updatedEvent.isExternal;

              console.log('Saving event update:', payload);
              console.log('Guests being sent:', payload.guests, '| guestIds from modal:', updatedEvent.guestIds);
              await apiClient.post('/commands/sync/update-event', payload);
              console.log('Event saved successfully');
              // Don't reload - optimistic state is already correct; clear cache for next load
              dashboardApi.clearCache('events*');
            } catch (error) {
              console.error('Failed to save event:', error);
            }
          }}
          onDelete={async (id) => {
            setEvents(prev => prev.filter(ev => ev.id !== id));
            setSelectedEventId(null);

            // Persist deletion to API
            try {
              await apiClient.post('/commands/sync/delete-event', { id });
              // Don't reload - optimistic removal is already correct; clear cache for next load
              dashboardApi.clearCache('events*');
            } catch (error) {
              console.error('Failed to delete event:', error);
            }
          }}
        />
      )}
      <div 
        className="bg-white rounded-lg relative overflow-hidden" 
        style={{ 
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column'
        }}
        onMouseMove={(e) => {
          if (resizingEvent) handleResizeMove(e);
          else if (draggingEvent || pendingDragRef.current) handleDragMove(e);
          else if (isSelectingTime) handleSelectionMove(e);
        }}
        onMouseUp={() => {
          if (resizingEvent) handleResizeEnd();
          else if (draggingEvent || pendingDragRef.current) handleDragEnd();
          else if (isSelectingTime) handleSelectionEnd();
        }}
        onMouseLeave={() => {
          if (resizingEvent) handleResizeEnd();
          else if (draggingEvent) handleDragEnd();
          else if (pendingDragRef.current) { pendingDragRef.current = null; }
          else if (isSelectingTime) { setIsSelectingTime(false); setTimeSelection(null); selectionStartRef.current = null; }
        }}
      >
        {/* Colored top accent */}
        <div className="absolute left-0 right-0 top-0 h-1" style={{ background: 'linear-gradient(90deg, #FBBF24 0%, #FDE68A 100%)' }}></div>
        
        {/* Header */}
        <div className="px-3 py-2 border-b border-[#E5E7EB]" style={{ minHeight: '36px' }}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#FBBF24]" />
              <h3 className="text-[14px] font-medium text-[#1F2937]">
                {selectedDate.toDateString() === new Date().toDateString() ? 'Today' : selectedDate.toLocaleDateString('en-US', { weekday: 'short' })}
              </h3>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-0.5 hover:bg-[#F9FAFB] rounded transition-colors" onClick={goToPreviousDay}>
                <ChevronLeft className="w-4 h-4 text-[#6B7280]" />
              </button>
              <button className="px-1.5 py-0.5 text-[10px] text-[#6B7280] hover:bg-[#F9FAFB] rounded transition-colors" onClick={goToToday}>
                Today
              </button>
              <button className="p-0.5 hover:bg-[#F9FAFB] rounded transition-colors" onClick={goToNextDay}>
                <ChevronRight className="w-4 h-4 text-[#6B7280]" />
              </button>
            </div>
          </div>
          <p className="text-[10px] text-[#9CA3AF]">{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>

        {/* Timeline */}
        <div 
          ref={timelineRef}
          className="px-2 py-1.5 custom-scrollbar" 
          style={{ flex: 1, overflowY: 'auto', position: 'relative' }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onMouseMove={handleMouseMove}
        >
          <div
            style={{ position: 'relative', height: `${(endHour - startHour + 1) * pixelsPerHour}px`, cursor: isSelectingTime ? 'crosshair' : 'default', userSelect: 'none' }}
            onMouseDown={handleTimelineMouseDown}
          >
            {/* Hour grid */}
            {hours.map((hour) => (
              <div 
                key={hour}
                className="border-b border-[#F3F4F6]"
                style={{ 
                  height: `${pixelsPerHour}px`, 
                  position: 'absolute',
                  top: `${(hour - startHour) * pixelsPerHour}px`,
                  left: 0,
                  right: 0
                }}
              >
                <div className="absolute left-0 top-0.5 text-[10px] font-medium text-[#9CA3AF] w-10">
                  {hour}:00
                </div>
              </div>
            ))}

            {/* Current time indicator */}
            <div 
              className="pointer-events-none"
              style={{ 
                position: 'absolute',
                left: 0,
                right: 0,
                top: `${((currentHour - startHour) * pixelsPerHour)}px`,
                display: 'flex',
                alignItems: 'center',
                zIndex: 10
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#EF4444] ml-0.5"></div>
              <div className="flex-1 h-0.5 bg-[#EF4444] opacity-70"></div>
            </div>

            {/* Drop indicator line */}
            {isDragOver && dragOverTime !== null && (
              <div
                className="pointer-events-none"
                style={{
                  position: 'absolute',
                  left: '40px',
                  right: '6px',
                  top: `${dragOverTime * pixelsPerHour}px`,
                  height: '2px',
                  background: '#3B82F6',
                  zIndex: 15
                }}
              >
                <div 
                  className="text-[9px] text-[#3B82F6] font-medium bg-white px-1 rounded"
                  style={{ position: 'absolute', left: 0, top: '-10px' }}
                >
                  {formatTime(dragOverTime)}
                </div>
              </div>
            )}

            {/* Time selection highlight */}
            {isSelectingTime && timeSelection && timeSelection.end > timeSelection.start && (
              <div
                className="pointer-events-none"
                style={{
                  position: 'absolute',
                  left: '40px',
                  right: '6px',
                  top: `${timeSelection.start * pixelsPerHour}px`,
                  height: `${(timeSelection.end - timeSelection.start) * pixelsPerHour}px`,
                  background: 'rgba(59, 130, 246, 0.12)',
                  border: '1.5px solid rgba(59, 130, 246, 0.5)',
                  borderRadius: '4px',
                  zIndex: 12,
                }}
              >
                <div style={{ fontSize: '9px', color: '#3B82F6', fontWeight: 600, padding: '2px 4px' }}>
                  {formatTime(timeSelection.start)} – {formatTime(timeSelection.end)}
                </div>
              </div>
            )}

            {/* Events */}
            {eventsWithOverlaps.map((event) => {
              const totalOverlaps = event.totalOverlaps || 1;
              const overlap = event.overlap || 0;
              const widthPercent = 100 / totalOverlaps;
              const leftPercent = (overlap * widthPercent);
              
              return (
                <div
                  key={event.id}
                  className="cursor-move hover:opacity-90 transition-opacity group select-none"
                  style={{
                    position: 'absolute',
                    left: `calc(40px + ${leftPercent}%)`,
                    width: `calc(${widthPercent}% - ${totalOverlaps > 1 ? 2 : 6}px)`,
                    top: `${event.start * pixelsPerHour}px`,
                    height: `${event.duration * pixelsPerHour}px`,
                    backgroundColor: event.color,
                    borderRadius: '4px',
                    padding: '0',
                    zIndex: draggingEvent === event.id ? 15 : 5,
                    minHeight: '30px',
                    opacity: draggingEvent === event.id ? 0.7 : 1,
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  onClick={(e) => handleEventClick(event.id, e)}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  {/* Top resize handle */}
                  <div
                    className="resize-handle"
                    style={{ 
                      height: '6px',
                      width: '100%',
                      cursor: 'ns-resize',
                      background: 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderTopLeftRadius: '4px',
                      borderTopRightRadius: '4px',
                      transition: 'background 150ms'
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleResizeStart(event.id, 'top', e);
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div style={{
                      width: '20px',
                      height: '2px',
                      borderRadius: '2px',
                      background: 'rgba(255, 255, 255, 0.5)',
                      opacity: 0,
                      transition: 'opacity 150ms'
                    }} className="group-hover:opacity-100" />
                  </div>
                  
                  {/* Event content */}
                  <div 
                    style={{ 
                      flex: 1, 
                      padding: '6px 8px',
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                      cursor: 'move'
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleDragStart(event.id, e);
                    }}
                  >
                    <div className="text-[11px] font-medium text-white leading-tight overflow-hidden">
                      {event.title}
                    </div>
                    <div className="text-[9px] text-white opacity-80 mt-0.5">
                      {formatTime(event.start)} - {formatTime(event.start + event.duration)}
                    </div>
                  </div>
                  
                  {/* Bottom resize handle */}
                  <div
                    className="resize-handle"
                    style={{ 
                      height: '6px',
                      width: '100%',
                      cursor: 'ns-resize',
                      background: 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderBottomLeftRadius: '4px',
                      borderBottomRightRadius: '4px',
                      transition: 'background 150ms'
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleResizeStart(event.id, 'bottom', e);
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div style={{
                      width: '20px',
                      height: '2px',
                      borderRadius: '2px',
                      background: 'rgba(255, 255, 255, 0.5)',
                      opacity: 0,
                      transition: 'opacity 150ms'
                    }} className="group-hover:opacity-100" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Drop hint */}
        {isDragOver && (
          <div 
            className="absolute top-14 left-1/2 transform -translate-x-1/2 pointer-events-none z-20"
          >
            <div className="bg-[#3B82F6] text-white px-3 py-1.5 rounded text-[12px] font-medium shadow-lg">
              Drop to schedule {dragOverTime !== null && `at ${formatTime(dragOverTime)}`}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-3 py-1.5 border-t border-[#E5E7EB]" style={{ minHeight: '30px' }}>
          <button className="text-[11px] text-[#3B82F6] hover:text-[#2563EB]">
            Full calendar →
          </button>
        </div>
      </div>
    </>
  );
}