/**
 * WorkdeckCalendar - Main calendar component with timesheet and event management
 *
 * KEY LEARNINGS & PATTERNS:
 *
 * 1. API ENDPOINTS:
 *    - GET /queries/me/events?from=...&to=... - Fetch current user's events (via dashboardApi.getEvents)
 *    - GET /queries/users-summary - Fetch all company users (for calendar search)
 *    - GET /queries/users/{userId}/events?from=...&to=... - Fetch another user's events
 *    - POST /commands/sync/create-event - Create new event
 *    - POST /commands/sync/update-event - Update existing event
 *    - POST /commands/sync/delete-event - Delete event
 *
 * 2. DATE FORMAT:
 *    - API uses DD/MM/YYYY HH:mm:ss+00:00 format
 *    - parseApiDate() handles conversion to JS Date
 *    - formatDateTimeForAPI() converts Date back to API format
 *
 * 3. RECURRENCE:
 *    - Stored as RRULE format (e.g., "FREQ=DAILY", "FREQ=WEEKLY")
 *    - Display format converted to "Daily", "Weekly", etc.
 *    - Both rrule and isRecurring fields sent to API
 *
 * 4. MULTI-USER CALENDARS:
 *    - Load all users via /queries/users-summary on mount (client-side filtering)
 *    - Don't use /queries/users?search= - it doesn't work properly
 *    - Filter users client-side by name/email
 *    - Each user gets assigned a color from teamColors palette
 *    - Events filtered by selectedCalendars (createdBy matching)
 *
 * 5. OPTIMISTIC UPDATES:
 *    - pendingEventIds tracks optimistically created events
 *    - loadEvents() preserves pending events not yet in API response
 *    - Prevents events from "disappearing" after drag-drop
 *
 * 6. EVENT CREATION:
 *    - guests array MUST include current user for event to appear in their calendar
 *    - creator object identifies who created the event
 *    - fromUser field also needed for proper attribution
 *
 * 7. LEFT SIDEBAR (CalendarLeftSidebar):
 *    - Tasks section: flex: 3 (3/5 of space)
 *    - Calendars section: flex: 2 (2/5 of space)
 *    - Tasks from UnifiedTasksContext converted to CalendarTask format
 *    - Columns from unified context for filtering
 *
 * 8. RIGHT SIDEBAR (CalendarRightSidebar):
 *    - Shows timesheet summary (weekly/monthly)
 *    - Calculates hours from events with isTimesheet=true
 *    - Working days exclude weekends
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, RefreshCw, Check, AlertTriangle, X as XIcon, Calendar as CalendarIcon, PanelRightOpen, Loader2 } from 'lucide-react';
import { CalendarLeftSidebar } from './CalendarLeftSidebar';
import { CalendarRightSidebar } from './CalendarRightSidebar';
import { CalendarDayView } from './CalendarDayView';
import { CalendarWeekView } from './CalendarWeekView';
import { CalendarMonthView } from './CalendarMonthView';
import { SyncStatusDropdown } from './SyncStatusDropdown';
import { QuickCreateModal } from './QuickCreateModal';
import { MultiUserLegend } from './MultiUserLegend';
import { EventModal } from './EventModal';
import { dashboardApi, CalendarEvent as ApiCalendarEvent } from '../../services/dashboard-api';
import { apiClient } from '../../services/api-client';
import { useAuth } from '../../contexts/AuthContext';
import { formatDateTimeForAPI } from '../../utils/date-utils';
import { getEventAttachments, saveEventAttachments } from '../../services/cloud-file-picker';
import { useUnifiedTasks } from '../../contexts/UnifiedTasksContext';
import type { Task, ColumnData } from '../../types/task';

export interface CalendarEvent {
  id: string;
  title: string;
  project?: string;
  projectColor?: string;
  task?: string;
  startTime: Date;
  endTime: Date;
  isTimesheet: boolean;
  isBillable: boolean;
  isPrivate: boolean;
  isExternal: boolean;
  guests?: string[];
  guestIds?: string[]; // IDs for filtering
  isRecurring?: boolean;
  rrule?: string; // RRULE format (e.g., "FREQ=DAILY")
  recurrence?: string; // Display format (e.g., "Daily", "Weekly")
  hasSyncIssue?: boolean;
  createdBy: string;
  creatorId?: string; // ID for filtering
  attachments?: Array<{id: string; name: string; size: string; type: string; date: string; source?: string; url?: string; content?: string}>;
}

// Parse date string in DD/MM/YYYY HH:mm:ss+00:00 format
function parseApiDate(dateStr: string): Date {
  if (!dateStr) return new Date();

  // Try ISO format first (YYYY-MM-DDTHH:mm:ss)
  if (dateStr.includes('T') || dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  // Parse DD/MM/YYYY HH:mm:ss+00:00 format
  const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);
  if (match) {
    const [, day, month, year, hours, minutes, seconds] = match;
    // Note: month is 0-indexed in JavaScript Date
    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hours),
      parseInt(minutes),
      parseInt(seconds)
    );
  }

  // Fallback: try native parsing
  const fallback = new Date(dateStr);
  if (!isNaN(fallback.getTime())) return fallback;

  console.warn('Failed to parse date:', dateStr);
  return new Date();
}

export interface CalendarTask {
  id: string;
  title: string;
  project: string;
  projectId: string;
  projectColor: string;
  column: string;
  columnId?: string;
  estimatedHours: number;
  loggedHours: number;
  assignedTo: string[];
  myPartComplete: boolean;
}

export function WorkdeckCalendar() {
  // Get current user from auth context
  const { user: authUser } = useAuth();

  // Get tasks and columns from unified context
  const {
    tasks: unifiedTasks,
    columns: unifiedColumns,
    isLoading: isLoadingTasks,
    fetchUserTasks
  } = useUnifiedTasks();

  const [viewType, setViewType] = useState<'day' | 'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showSyncDropdown, setShowSyncDropdown] = useState(false);
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>([]);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [quickCreateDate, setQuickCreateDate] = useState<Date | null>(null);
  const [quickCreateEndDate, setQuickCreateEndDate] = useState<Date | null>(null);
  const [showRightSidebar, setShowRightSidebar] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<string>('On-Going');

  // Memoize current user info to prevent infinite re-renders
  const currentUser = useMemo(() => {
    if (!authUser) return null;
    return {
      id: authUser.id,
      fullName: authUser.fullName || 'You',
      email: authUser.email
    };
  }, [authUser?.id, authUser?.fullName, authUser?.email]);

  // Set default calendar selection when user is loaded (only once)
  useEffect(() => {
    if (authUser?.id && selectedCalendars.length === 0) {
      const displayName = authUser.fullName || 'You';
      setSelectedCalendars([`${displayName} (You)`]);
    }
  }, [authUser?.id]); // Only depend on stable primitive

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const pendingEventIdsRef = React.useRef<Set<string>>(new Set()); // Track optimistically created events (ref avoids stale closure in loadEvents)
  const [isLoading, setIsLoading] = useState(true);
  const attachmentsCache = React.useRef<Record<string, CalendarEvent['attachments']>>({});

  // Team members state for viewing other calendars
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string; fullName: string; email?: string; color: string }>>([]);
  const [searchResults, setSearchResults] = useState<Array<{ id: string; fullName: string; email?: string; color: string }>>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]); // Track selected user IDs for fetching events

  // Color palette for team members
  const teamColors = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1'];

  // Dynamic user colors - current user gets blue, team members get assigned colors
  const userColors: { [key: string]: string } = useMemo(() => {
    const colors: { [key: string]: string } = {
      [`${currentUser?.fullName || 'You'} (You)`]: '#0066FF',
      'Guest User': '#6B7280'
    };
    // Add colors for team members
    teamMembers.forEach(member => {
      colors[member.fullName] = member.color;
    });
    return colors;
  }, [currentUser?.fullName, teamMembers]);

  // Convert unified tasks to CalendarTask format for the sidebar
  const calendarTasks: CalendarTask[] = useMemo(() => {
    const tasksArray = Array.from(unifiedTasks.values());
    return tasksArray.map((task: Task) => ({
      id: task.id,
      title: task.title || task.name,
      project: task.projectName || 'Unknown Project',
      projectId: task.projectId || '',
      projectColor: task.projectColor || '#6B7280',
      column: task.column?.name || task.status || 'Unassigned',
      columnId: task.columnId,
      estimatedHours: (task.timeEstimate || 0) / 60, // Convert minutes to hours
      loggedHours: (task.timeLogged || 0) / 60, // Convert minutes to hours
      assignedTo: task.participants?.map(p => p.fullName || p.firstName || 'Unknown') || [],
      myPartComplete: task.done || task.status === 'Done',
    }));
  }, [unifiedTasks]);

  // Track local updates to logged hours (optimistic updates after drag-drop)
  const [localHoursUpdates, setLocalHoursUpdates] = useState<Record<string, number>>({});

  // Merge calendar tasks with local updates
  const tasks = useMemo(() => {
    return calendarTasks.map(task => ({
      ...task,
      loggedHours: task.loggedHours + (localHoursUpdates[task.id] || 0),
    }));
  }, [calendarTasks, localHoursUpdates]);

  // Get columns for the sidebar (from unified context or default)
  const sidebarColumns = useMemo(() => {
    if (unifiedColumns.length > 0) {
      return [
        { id: 'All tasks', name: 'All tasks', count: tasks.length },
        ...unifiedColumns.map(col => ({
          id: col.id,
          name: col.name,
          count: tasks.filter(t => t.columnId === col.id).length,
        })),
      ];
    }
    // Fallback to default columns if none loaded
    return [
      { id: 'All tasks', name: 'All tasks', count: tasks.length },
    ];
  }, [unifiedColumns, tasks]);

  // Calculate date range based on view type
  const getDateRange = (date: Date, view: 'day' | 'week' | 'month'): { start: Date; end: Date } => {
    const start = new Date(date);
    const end = new Date(date);

    if (view === 'day') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (view === 'week') {
      // Start of week (Sunday)
      const dayOfWeek = start.getDay();
      start.setDate(start.getDate() - dayOfWeek);
      start.setHours(0, 0, 0, 0);
      // End of week (Saturday)
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else {
      // Month view
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0); // Last day of current month
      end.setHours(23, 59, 59, 999);
    }

    return { start, end };
  };

  // Convert API event to CalendarEvent format
  const convertApiEvent = (apiEvent: ApiCalendarEvent): CalendarEvent => {
    // Safely extract guest names AND IDs with null checks
    const guestNames: string[] = [];
    const guestIds: string[] = [];
    if (apiEvent.guests && Array.isArray(apiEvent.guests)) {
      for (const g of apiEvent.guests) {
        // Handle different possible guest structures
        const guestUser = g?.user || g?.guest;
        if (guestUser) {
          // Extract ID
          if (guestUser.id) {
            guestIds.push(guestUser.id);
          }
          // Extract name
          const name = guestUser.fullName ||
            (guestUser.firstName && guestUser.lastName
              ? `${guestUser.firstName} ${guestUser.lastName}`
              : guestUser.firstName || guestUser.email || 'Guest');
          guestNames.push(name);
        }
      }
    }

    // Safely extract creator info
    const creator = (apiEvent as any).creator;
    const creatorId = creator?.id || null;
    let creatorName = creator?.fullName ||
      (creator?.firstName && creator?.lastName
        ? `${creator.firstName} ${creator.lastName}`
        : creator?.firstName || null);

    // Check if current user is creator OR guest
    const isCreator = currentUser && creatorId && creatorId === currentUser.id;
    const isGuest = currentUser && guestIds.includes(currentUser.id);
    const isCurrentUserEvent = isCreator || isGuest || !creator;

    if (isCreator) {
      creatorName = `${currentUser?.fullName || 'You'} (You)`;
    } else if (!creatorName) {
      creatorName = 'Unknown';
    }

    // Parse dates using the helper function (handles DD/MM/YYYY format)
    const startTime = parseApiDate(apiEvent.startAt);
    const endTime = parseApiDate(apiEvent.endAt);

    // Convert RRULE to display format
    const rruleToDisplay = (rrule: string | undefined): string => {
      if (!rrule) return '';
      if (rrule.includes('FREQ=DAILY')) return 'Daily';
      if (rrule.includes('FREQ=WEEKLY')) return 'Weekly';
      if (rrule.includes('FREQ=MONTHLY')) return 'Monthly';
      if (rrule.includes('FREQ=YEARLY')) return 'Yearly';
      return '';
    };

    const rrule = (apiEvent as any).rrule;
    const isRecurring = (apiEvent as any).isRecurring ?? !!rrule;

    return {
      id: apiEvent.id,
      title: apiEvent.title || 'Untitled Event',
      project: apiEvent.project?.name || undefined,
      projectColor: apiEvent.color || '#3B82F6',
      task: apiEvent.task?.name || undefined,
      startTime,
      endTime,
      isTimesheet: (apiEvent as any).timesheet ?? true,
      isBillable: (apiEvent as any).billable ?? false,
      isPrivate: (apiEvent as any).isPrivate ?? false,
      isExternal: (apiEvent as any).isExternal ?? false,
      guests: guestNames,
      guestIds: guestIds,
      isRecurring,
      rrule,
      recurrence: rruleToDisplay(rrule),
      hasSyncIssue: false,
      createdBy: creatorName,
      creatorId: creatorId
    };
  };

  // Load events from API
  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const { start, end } = getDateRange(currentDate, viewType);
      console.log('Loading events for range:', start.toISOString(), 'to', end.toISOString());
      console.trace('loadEvents called from:');

      const apiEvents = await dashboardApi.getEvents(start, end);
      console.log('API returned', apiEvents.length, 'events');

      const convertedEvents: CalendarEvent[] = apiEvents.map(convertApiEvent);
      console.log('Converted events:', convertedEvents.map(e => ({ id: e.id, title: e.title, start: e.startTime })));

      // Merge with pending events that aren't yet in API response
      setEvents(prev => {
        const apiEventIds = new Set(convertedEvents.map(e => e.id));
        // Keep pending events that haven't appeared in API yet
        const stillPendingEvents = prev.filter(e =>
          pendingEventIdsRef.current.has(e.id) && !apiEventIds.has(e.id)
        );
        // Update pending set - remove events that are now in API
        const stillPendingIds = new Set(
          Array.from(pendingEventIdsRef.current).filter(id => !apiEventIds.has(id))
        );
        pendingEventIdsRef.current = stillPendingIds;

        return [...convertedEvents, ...stillPendingEvents];
      });
    } catch (error) {
      console.error('Failed to load calendar events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load events when date, view type, or current user changes
  // Use primitive values for dependencies to avoid infinite loops
  const currentDateKey = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD string
  useEffect(() => {
    // Only load events once we have the current user (for proper createdBy matching)
    if (authUser?.id) {
      loadEvents();
    }
  }, [currentDateKey, viewType, authUser?.id]); // Use stable primitives

  // All available users for calendar search (loaded once)
  const [allUsers, setAllUsers] = useState<Array<{ id: string; fullName: string; email: string }>>([]);
  const [usersLoaded, setUsersLoaded] = useState(false);

  // Load all users on mount for calendar search
  useEffect(() => {
    const loadAllUsers = async () => {
      try {
        setIsLoadingSearch(true);
        const response = await apiClient.get('/queries/users-summary') as any;
        const userList = response || [];
        setAllUsers(userList.map((u: any) => ({
          id: u.id,
          fullName: u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim(),
          email: u.email || ''
        })));
        setUsersLoaded(true);
      } catch (error) {
        console.error('Failed to load users:', error);
      } finally {
        setIsLoadingSearch(false);
      }
    };
    loadAllUsers();
  }, []);

  // Search users for team calendars (client-side filtering)
  const searchUsers = (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const search = query.toLowerCase();
    const filtered = allUsers
      .filter(user => {
        // Don't show current user in search
        if (user.id === authUser?.id) return false;
        // Don't show already added team members
        if (teamMembers.some(m => m.id === user.id)) return false;
        // Match by name or email
        return user.fullName.toLowerCase().includes(search) ||
               user.email.toLowerCase().includes(search);
      })
      .slice(0, 10)
      .map((user, index) => ({
        ...user,
        color: teamColors[index % teamColors.length]
      }));

    setSearchResults(filtered);
  };

  // Handle adding a team member calendar
  const handleCalendarsChange = (calendars: string[]) => {
    setSelectedCalendars(calendars);

    // Find new team member that was added
    const currentUserName = `${currentUser?.fullName || 'You'} (You)`;
    const newCalendars = calendars.filter(c => c !== currentUserName);

    // Update team members from search results
    newCalendars.forEach(calName => {
      const existingMember = teamMembers.find(m => m.fullName === calName);
      if (!existingMember) {
        const searchMember = searchResults.find(r => r.fullName === calName);
        if (searchMember) {
          setTeamMembers(prev => [...prev, searchMember]);
          setSelectedUserIds(prev => [...prev, searchMember.id]);
        }
      }
    });

    // Remove deselected team members from selectedUserIds
    const selectedNames = new Set(calendars);
    setSelectedUserIds(prev => prev.filter(id => {
      const member = teamMembers.find(m => m.id === id);
      return member && selectedNames.has(member.fullName);
    }));
  };

  // Load events for selected team members
  const loadTeamMemberEvents = async (userIds: string[]) => {
    if (userIds.length === 0) return;

    try {
      const { start, end } = getDateRange(currentDate, viewType);

      // Fetch events for each selected user
      for (const userId of userIds) {
        const response = await apiClient.get(`/queries/users/${userId}/events?from=${start.toISOString()}&to=${end.toISOString()}`) as any;
        const userEvents = response?.result || response || [];

        if (userEvents.length > 0) {
          const member = teamMembers.find(m => m.id === userId);
          const convertedUserEvents = userEvents.map((apiEvent: any) => {
            const converted = convertApiEvent(apiEvent);
            // Override createdBy to show team member's name
            return {
              ...converted,
              createdBy: member?.fullName || converted.createdBy,
            };
          });

          setEvents(prev => {
            // Remove old events from this user and add new ones
            const filtered = prev.filter(e => e.creatorId !== userId);
            return [...filtered, ...convertedUserEvents];
          });
        }
      }
    } catch (error) {
      console.error('Failed to load team member events:', error);
    }
  };

  // Load team member events when selection changes
  useEffect(() => {
    if (selectedUserIds.length > 0) {
      loadTeamMemberEvents(selectedUserIds);
    }
  }, [selectedUserIds, currentDateKey, viewType]);

  // Filter events based on selected calendars
  const filteredEvents = useMemo(() => {
    if (selectedCalendars.length === 0) return events;

    return events.filter(event => {
      // Check if event's creator matches any selected calendar
      return selectedCalendars.some(calName => {
        // Current user's calendar name format is "Name (You)"
        if (calName.endsWith(' (You)')) {
          const currentUserName = calName.replace(' (You)', '');
          return event.createdBy?.includes(currentUserName) ||
                 event.createdBy?.includes('(You)') ||
                 event.creatorId === authUser?.id;
        }
        // Team member calendar
        return event.createdBy === calName ||
               event.guests?.includes(calName);
      });
    });
  }, [events, selectedCalendars, authUser?.id]);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];

  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (viewType === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    } else if (viewType === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewType === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    } else if (viewType === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleTaskDrop = async (date: Date, task: CalendarTask) => {
    console.log('Task dropped:', task, 'at', date);

    const startTime = new Date(date);
    const endTime = new Date(date.getTime() + 60 * 60 * 1000); // 1 hour duration
    const newEventId = crypto.randomUUID();

    // Optimistically add to local state immediately for instant feedback
    const optimisticEvent: CalendarEvent = {
      id: newEventId,
      title: task.title,
      startTime,
      endTime,
      projectColor: task.projectColor || '#3B82F6',
      project: task.project,
      isTimesheet: true,
      isBillable: false,
      isPrivate: false,
      isExternal: false,
      createdBy: currentUser?.fullName || 'You',
      creatorId: authUser?.id,
      guestIds: [authUser?.id || ''],
      guests: [currentUser?.fullName || 'You'],
    };
    setEvents(prev => [...prev, optimisticEvent]);
    pendingEventIdsRef.current = new Set([...pendingEventIdsRef.current, newEventId]);

    try {
      // Create event via API with all required fields
      // KEY: guests must include current user for event to show in their calendar
      const payload = {
        id: newEventId,
        title: task.title,
        startAt: formatDateTimeForAPI(startTime),
        endAt: formatDateTimeForAPI(endTime),
        color: task.projectColor || '#3B82F6',
        state: 1,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timesheet: true,
        billable: false,
        private: false,
        task: { id: task.id },
        // REQUIRED: Current user must be in guests array
        guests: [{ id: authUser?.id }],
        fromUser: authUser?.id,
        creator: {
          id: authUser?.id,
          fullName: authUser?.fullName || '',
          email: authUser?.email || '',
        },
      };

      await apiClient.post('/commands/sync/create-event', payload);

      // Add current user as task participant for timesheet tracking (Angular mock pattern)
      if (authUser?.id && task.projectId) {
        try {
          await apiClient.post('/commands/mocks/add-task-participant', {
            projectId: task.projectId,
            taskId: task.id,
            userId: authUser.id,
            isOwner: 'false',
            position: 0,
            availableHours: '0',
          });
          await apiClient.post('/commands/sync/commit-project', { id: task.projectId });
        } catch (participantError: any) {
          // Silently ignore if user is already a participant
        }
      }

      // Update the task's logged hours locally (1 hour default - optimistic update)
      setLocalHoursUpdates(prev => ({
        ...prev,
        [task.id]: (prev[task.id] || 0) + 1
      }));

      // Refresh tasks after a delay to get actual logged hours
      setTimeout(() => {
        fetchUserTasks().catch(console.error);
        setLocalHoursUpdates({});
      }, 2000);

      // Show success notification
      setNotificationMessage(`"${task.title}" added to calendar`);
      setShowSuccessNotification(true);
      setTimeout(() => setShowSuccessNotification(false), 3000);

      // Clear cache so next loadEvents (on navigation) fetches fresh data from API
      dashboardApi.clearCache('events*');
    } catch (error) {
      console.error('Failed to create event:', error);
      // Revert optimistic update on failure
      setEvents(prev => prev.filter(e => e.id !== newEventId));
      pendingEventIdsRef.current.delete(newEventId);
      setNotificationMessage('Failed to create event');
      setShowSuccessNotification(true);
      setTimeout(() => setShowSuccessNotification(false), 3000);
    }
  };

  const handleEventMove = async (eventId: string, newStartTime: Date, newEndTime?: Date) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    // Check if current user is the creator (only creator can update)
    const isCreator = event.creatorId === authUser?.id;
    if (!isCreator) {
      console.warn('Cannot update event - you are not the creator');
      console.log('Event creatorId:', event.creatorId, 'Your ID:', authUser?.id);
      setNotificationMessage('Cannot move event - you are not the creator');
      setShowSuccessNotification(true);
      setTimeout(() => setShowSuccessNotification(false), 3000);
      return;
    }

    // Calculate duration
    const originalDuration = new Date(event.endTime).getTime() - new Date(event.startTime).getTime();
    const updatedEndTime = newEndTime || new Date(newStartTime.getTime() + originalDuration);

    // Optimistically update the UI
    setEvents(prevEvents => prevEvents.map(e =>
      e.id === eventId ? { ...e, startTime: newStartTime, endTime: updatedEndTime } : e
    ));

    try {
      // Validate color format (must be #RRGGBB - 7 chars total)
      const rawColor = event.projectColor || '#3B82F6';
      const color = /^#[0-9A-Fa-f]{6}$/.test(rawColor) ? rawColor : '#3B82F6';

      // Build full payload with all required fields
      const payload: Record<string, any> = {
        id: eventId,
        title: event.title || 'Untitled',
        startAt: formatDateTimeForAPI(newStartTime),
        endAt: formatDateTimeForAPI(updatedEndTime),
        color,
        creator: { id: event.creatorId },
      };

      // Include guests if present (API expects { id: "uuid" } format)
      // Filter out any invalid IDs
      if (event.guestIds && event.guestIds.length > 0) {
        const validGuests = event.guestIds.filter(id => id && id.length > 0);
        if (validGuests.length > 0) {
          payload.guests = validGuests.map(id => ({ id }));
        }
      }

      console.log('Original event:', event);
      console.log('Update event payload:', JSON.stringify(payload, null, 2));
      await apiClient.post('/commands/sync/update-event', payload);
    } catch (error: any) {
      console.error('Failed to update event:', error);
      console.error('Error response:', error.response?.data || error.message);
      // Revert on failure
      dashboardApi.clearCache('events*');
      await loadEvents();
    }
  };

  const syncStatus = {
    status: 'synced' as 'synced' | 'syncing' | 'warning' | 'error',
    lastSync: '2 minutes ago',
    calendars: [
      { name: 'Google Calendar', status: 'synced' as const, lastSync: '2 minutes ago' },
      { name: 'Microsoft Calendar', status: 'synced' as const, lastSync: '5 minutes ago' }
    ]
  };

  return (
    <div style={{ display: 'flex', height: '100%', gap: '0', background: '#FAFBFC' }}>
      {/* Left Sidebar - Task Panel */}
      <CalendarLeftSidebar
        tasks={tasks}
        columns={sidebarColumns}
        selectedColumn={selectedColumn}
        onColumnChange={setSelectedColumn}
        onTaskDrag={(task) => console.log('Dragging task:', task)}
        selectedCalendars={selectedCalendars}
        onCalendarsChange={handleCalendarsChange}
        currentUser={currentUser}
        teamMembers={teamMembers}
        onSearchUsers={searchUsers}
        searchResults={searchResults}
        isLoadingSearch={isLoadingSearch}
        isLoading={isLoadingTasks}
      />

      {/* Main Calendar Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'white', overflow: 'hidden' }}>
        {/* Calendar Header */}
        <div style={{
          padding: '10px 24px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          {/* Left: Month/Year and Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0A0A0A', margin: 0 }}>
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                onClick={handlePrevious}
                style={{
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  background: 'white',
                  cursor: 'pointer',
                  color: '#6B7280',
                  transition: 'all 150ms'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#F9FAFB';
                  e.currentTarget.style.borderColor = '#D1D5DB';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.borderColor = '#E5E7EB';
                }}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={handleNext}
                style={{
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  background: 'white',
                  cursor: 'pointer',
                  color: '#6B7280',
                  transition: 'all 150ms'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#F9FAFB';
                  e.currentTarget.style.borderColor = '#D1D5DB';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.borderColor = '#E5E7EB';
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Right: View Selector, Today, Sync Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* View Selector */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowViewDropdown(!showViewDropdown)}
                style={{
                  height: '36px',
                  padding: '0 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  background: 'white',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#0A0A0A',
                  transition: 'all 150ms'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#D1D5DB'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}
              >
                {viewType === 'day' ? 'Day' : viewType === 'week' ? 'Week' : 'Month'}
                <ChevronDown size={14} />
              </button>

              {showViewDropdown && (
                <>
                  <div
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 998
                    }}
                    onClick={() => setShowViewDropdown(false)}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '40px',
                    right: 0,
                    width: '140px',
                    background: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    zIndex: 999,
                    overflow: 'hidden'
                  }}>
                    {['Day', 'Week', 'Month'].map(view => (
                      <button
                        key={view}
                        onClick={() => {
                          setViewType(view.toLowerCase() as 'day' | 'week' | 'month');
                          setShowViewDropdown(false);
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: viewType === view.toLowerCase() ? '#F9FAFB' : 'transparent',
                          border: 'none',
                          fontSize: '13px',
                          color: '#0A0A0A',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                        onMouseLeave={(e) => e.currentTarget.style.background = viewType === view.toLowerCase() ? '#F9FAFB' : 'transparent'}
                      >
                        {view}
                        {viewType === view.toLowerCase() && <Check size={14} color="#0066FF" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Today Button */}
            <button
              onClick={handleToday}
              style={{
                height: '36px',
                padding: '0 16px',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                background: 'white',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                color: '#0A0A0A',
                transition: 'all 150ms'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#F9FAFB';
                e.currentTarget.style.borderColor = '#D1D5DB';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.borderColor = '#E5E7EB';
              }}
            >
              TODAY
            </button>

            {/* Sync Status */}
            <SyncStatusDropdown 
              status={syncStatus}
              isOpen={showSyncDropdown}
              onToggle={() => setShowSyncDropdown(!showSyncDropdown)}
            />

            {/* Reopen Calendar Details Button */}
            {!showRightSidebar && (
              <button
                onClick={() => setShowRightSidebar(true)}
                style={{
                  height: '36px',
                  padding: '0 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  background: 'white',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#0A0A0A',
                  transition: 'all 150ms'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#F9FAFB';
                  e.currentTarget.style.borderColor = '#D1D5DB';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.borderColor = '#E5E7EB';
                }}
              >
                <PanelRightOpen size={16} />
                Calendar Details
              </button>
            )}
          </div>
        </div>

        {/* Multi-User Legend */}
        <MultiUserLegend
          selectedUsers={selectedCalendars}
          userColors={userColors}
        />

        {/* Calendar Grid */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {viewType === 'day' ? (
            <CalendarDayView
              currentDate={currentDate}
              events={filteredEvents}
              onEventClick={setSelectedEvent}
              onTimeSlotClick={(date, endDate) => {
                setQuickCreateDate(date);
                setQuickCreateEndDate(endDate ?? null);
                setShowQuickCreate(true);
              }}
              onTaskDrop={handleTaskDrop}
              userColors={userColors}
              selectedCalendars={selectedCalendars}
            />
          ) : viewType === 'week' ? (
            <CalendarWeekView
              currentDate={currentDate}
              events={filteredEvents}
              onEventClick={setSelectedEvent}
              onTimeSlotClick={(date, endDate) => {
                setQuickCreateDate(date);
                setQuickCreateEndDate(endDate ?? null);
                setShowQuickCreate(true);
              }}
              onTaskDrop={handleTaskDrop}
              onEventMove={handleEventMove}
              userColors={userColors}
              selectedCalendars={selectedCalendars}
            />
          ) : (
            <CalendarMonthView
              currentDate={currentDate}
              events={filteredEvents}
              onEventClick={setSelectedEvent}
              onDayClick={(date) => {
                setQuickCreateDate(date);
                setShowQuickCreate(true);
              }}
              onTaskDrop={handleTaskDrop}
              userColors={userColors}
              selectedCalendars={selectedCalendars}
            />
          )}
        </div>
      </div>

      {/* Right Sidebar - Calendar Details & Timesheet */}
      {showRightSidebar && (
        <CalendarRightSidebar
          currentDate={currentDate}
          viewType={viewType}
          events={events}
          onClose={() => setShowRightSidebar(false)}
        />
      )}

      {/* Quick Create Modal */}
      {showQuickCreate && (
        <QuickCreateModal
          initialDate={quickCreateDate || currentDate}
          initialEndDate={quickCreateEndDate ?? undefined}
          currentUser={currentUser}
          onClose={() => { setShowQuickCreate(false); setQuickCreateEndDate(null); }}
          onSave={async (eventData) => {
            try {
              // Convert recurrence string to RRULE format
              const recurrenceToRrule = (rec: string): string | null => {
                switch (rec?.toLowerCase()) {
                  case 'daily': return 'FREQ=DAILY';
                  case 'weekly': return 'FREQ=WEEKLY';
                  case 'monthly': return 'FREQ=MONTHLY';
                  case 'yearly': return 'FREQ=YEARLY';
                  default: return null;
                }
              };

              // Build payload with all required fields
              // KEY: guests must include current user for event to show in their calendar
              const payload: Record<string, any> = {
                id: eventData.id,
                title: eventData.title,
                startAt: eventData.startAt,
                endAt: eventData.endAt,
                color: eventData.color || '#60A5FA',
                state: eventData.state || 1,
                timezone: eventData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
                timesheet: eventData.timesheet ?? true,
                billable: eventData.billable ?? false,
                private: false,
                // REQUIRED: Current user must be in guests array for event to appear in their calendar
                guests: [{ id: authUser?.id }],
                // REQUIRED: fromUser identifies the creator
                fromUser: authUser?.id,
                // Creator object
                creator: {
                  id: authUser?.id,
                  fullName: authUser?.fullName || '',
                  email: authUser?.email || '',
                },
              };

              // Add optional fields
              if (eventData.project) payload.project = eventData.project;
              if (eventData.task) payload.task = eventData.task;

              // Add recurrence if set
              const rrule = recurrenceToRrule(eventData.recurrence);
              if (rrule) {
                payload.rrule = rrule;
                payload.isRecurring = true;
              }

              // === TIMESHEET DEBUG LOGGING ===
              console.log('='.repeat(60));
              console.log('[TIMESHEET DEBUG] Creating event with task link');
              console.log('='.repeat(60));
              console.log('[TIMESHEET DEBUG] Full payload:', JSON.stringify(payload, null, 2));
              console.log('[TIMESHEET DEBUG] Key fields:');
              console.log('  - task.id:', eventData.task?.id || 'NONE');
              console.log('  - guests:', JSON.stringify(payload.guests));
              console.log('  - startAt:', payload.startAt);
              console.log('  - endAt:', payload.endAt);
              console.log('  - timesheet:', payload.timesheet);

              // Check if endAt is in the past
              const endAtDate = new Date(payload.endAt.split(' ')[0].split('/').reverse().join('-') + 'T' + payload.endAt.split(' ')[1].split('+')[0]);
              const now = new Date();
              const isEndInPast = endAtDate < now;
              console.log('  - endAt parsed:', endAtDate.toISOString());
              console.log('  - now:', now.toISOString());
              console.log('  - endAt is in past?', isEndInPast ? 'YES ✓' : 'NO ✗ (hours won\'t count until event ends)');
              console.log('='.repeat(60));

              const response = await apiClient.post('/commands/sync/create-event', payload);
              console.log('[TIMESHEET DEBUG] Create event response:', response);

              // If timesheet event is linked to a task, add current user as task participant (Angular mock pattern)
              // This is required for hours to show in the task's Participants tab
              const taskProjectId = eventData.task?.projectId || eventData.task?.activity?.projectId;
              if (eventData.task && payload.timesheet && authUser?.id && taskProjectId) {
                try {
                  console.log('[TIMESHEET DEBUG] Adding user as task participant...');
                  // Angular minimal payload format
                  await apiClient.post('/commands/mocks/add-task-participant', {
                    projectId: taskProjectId,
                    taskId: eventData.task.id,
                    userId: authUser.id,
                    isOwner: 'false',
                    position: 0,
                    availableHours: '0',
                  });
                  // Commit to persist
                  await apiClient.post('/commands/sync/commit-project', { id: taskProjectId });
                  console.log('[TIMESHEET DEBUG] User added as task participant');
                } catch (participantError: any) {
                  // Silently ignore if user is already a participant (likely returns 400 or similar)
                  console.log('[TIMESHEET DEBUG] Note: User may already be a task participant:', participantError.message);
                }

                // Fetch task and event details to verify spentHours (after a short delay)
                setTimeout(async () => {
                  try {
                    console.log('[TIMESHEET DEBUG] Fetching task details to verify spentHours...');
                    const taskDetails = await apiClient.get(`/queries/tasks/${eventData.task.id}`);
                    console.log('[TIMESHEET DEBUG] Task details:', JSON.stringify(taskDetails, null, 2));
                    console.log('[TIMESHEET DEBUG] spentHours:', (taskDetails as any)?.spentHours || 'NOT FOUND');
                    console.log('[TIMESHEET DEBUG] participants:', JSON.stringify((taskDetails as any)?.participants?.map((p: any) => ({
                      name: p.user?.fullName,
                      spentHours: p.spentHours
                    })), null, 2));

                    // Also fetch the created event to check guest invitation state
                    console.log('[TIMESHEET DEBUG] Fetching created event to verify invitation state...');
                    const eventDetails = await apiClient.get(`/queries/events/${payload.id}`);
                    console.log('[TIMESHEET DEBUG] Event details:', JSON.stringify(eventDetails, null, 2));
                    console.log('[TIMESHEET DEBUG] Event guests with state:', JSON.stringify((eventDetails as any)?.guests?.map((g: any) => ({
                      guestId: g.guestId || g.guest?.id,
                      guestName: g.guest?.fullName,
                      state: g.state,
                      stateText: g.state === 1 ? 'ACCEPTED ✓' : g.state === 0 ? 'PENDING ✗' : g.state === 2 ? 'REJECTED ✗' : 'UNKNOWN'
                    })), null, 2));
                    console.log('[TIMESHEET DEBUG] Event taskId:', (eventDetails as any)?.taskId || (eventDetails as any)?.task?.id || 'NOT SET ✗');
                  } catch (err) {
                    console.log('[TIMESHEET DEBUG] Could not fetch details:', err);
                  }
                }, 2000);
              }

              // Optimistically add to local state immediately for instant UI feedback
              const optimisticEvent: CalendarEvent = {
                id: payload.id,
                title: payload.title,
                startTime: parseApiDate(payload.startAt),
                endTime: parseApiDate(payload.endAt),
                projectColor: payload.color,
                isTimesheet: payload.timesheet ?? true,
                isBillable: payload.billable ?? false,
                isPrivate: false,
                isExternal: false,
                createdBy: currentUser?.fullName || 'You',
                creatorId: authUser?.id,
                guestIds: [],
                guests: [],
              };
              setEvents(prev => [...prev, optimisticEvent]);
              // Track this event as pending so it's preserved when loadEvents runs
              pendingEventIdsRef.current = new Set([...pendingEventIdsRef.current, payload.id]);
              console.log('Added optimistic event to UI');

              setShowQuickCreate(false);
              setQuickCreateEndDate(null);
              setNotificationMessage('Event created');
              setShowSuccessNotification(true);
              setTimeout(() => setShowSuccessNotification(false), 3000);

              // Refresh from API after delay (eventual consistency)
              // Clear events cache so loadEvents fetches fresh data instead of stale cached response
              dashboardApi.clearCache('events*');
              setTimeout(async () => {
                console.log('Refreshing events after delay...');
                await loadEvents();
              }, 1000);
            } catch (error) {
              console.error('Failed to create event:', error);
              setNotificationMessage('Failed to create event');
              setShowSuccessNotification(true);
              setTimeout(() => setShowSuccessNotification(false), 3000);
            }
          }}
        />
      )}

      {/* Success Notification */}
      {showSuccessNotification && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px 20px',
            background: '#34D399',
            color: 'white',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 1000,
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {notificationMessage}
        </div>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventModal
          event={{ ...selectedEvent, attachments: selectedEvent.attachments || attachmentsCache.current[selectedEvent.id] || getEventAttachments(selectedEvent.id) }}
          onClose={() => setSelectedEvent(null)}
          onAttachmentsChange={(eventId, atts) => {
            attachmentsCache.current[eventId] = atts;
            saveEventAttachments(eventId, atts);
          }}
          onSave={async (updatedEvent: any) => {
            try {
              // Validate color format (must be #RRGGBB - 7 chars total)
              const rawColor = updatedEvent.projectColor || '#3B82F6';
              const color = /^#[0-9A-Fa-f]{6}$/.test(rawColor) ? rawColor : '#3B82F6';

              // Convert recurrence string to RRULE format
              const recurrenceToRrule = (rec: string): string | null => {
                switch (rec?.toLowerCase()) {
                  case 'daily': return 'FREQ=DAILY';
                  case 'weekly': return 'FREQ=WEEKLY';
                  case 'monthly': return 'FREQ=MONTHLY';
                  case 'yearly': return 'FREQ=YEARLY';
                  default: return null;
                }
              };

              // Build full payload with all required fields
              const payload: Record<string, any> = {
                id: updatedEvent.id,
                title: updatedEvent.title,
                startAt: formatDateTimeForAPI(new Date(updatedEvent.startTime)),
                endAt: formatDateTimeForAPI(new Date(updatedEvent.endTime)),
                color,
                timezone: updatedEvent.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
                timesheet: updatedEvent.isTimesheet ?? true,
                billable: updatedEvent.isBillable ?? false,
                private: updatedEvent.isPrivate ?? false,
              };

              // Include optional fields
              if (updatedEvent.description) payload.description = updatedEvent.description;
              if (updatedEvent.location) payload.address = updatedEvent.location;

              // Include recurrence if set
              const rrule = recurrenceToRrule(updatedEvent.recurrence);
              if (rrule) {
                payload.rrule = rrule;
                payload.isRecurring = true;
              } else {
                payload.isRecurring = false;
              }

              // Include project if selected
              if (updatedEvent.projectId) {
                payload.project = { id: updatedEvent.projectId };
              }
              // Include task if selected
              if (updatedEvent.taskId) {
                payload.task = { id: updatedEvent.taskId };
              }

              // Include guests - must have current user to keep event visible
              if (updatedEvent.guestIds && updatedEvent.guestIds.length > 0) {
                payload.guests = updatedEvent.guestIds.map((id: string) => ({ id }));
              } else if (authUser?.id) {
                // Ensure current user stays as guest
                payload.guests = [{ id: authUser.id }];
              }

              // Include creator if present
              if (updatedEvent.creatorId) {
                payload.creator = { id: updatedEvent.creatorId };
              }

              // Cache attachments locally (API may not persist them yet)
              if (updatedEvent.attachments?.length > 0) {
                attachmentsCache.current[updatedEvent.id] = updatedEvent.attachments;
              }

              console.log('Update event payload:', JSON.stringify(payload, null, 2));
              await apiClient.post('/commands/sync/update-event', payload);
              dashboardApi.clearCache('events*');
              await loadEvents();
              setNotificationMessage('Event updated');
              setShowSuccessNotification(true);
              setTimeout(() => setShowSuccessNotification(false), 3000);
              setSelectedEvent(null);
            } catch (error: any) {
              console.error('Failed to update event:', error);
              console.error('Error response:', error.response?.data || error.message);
              setNotificationMessage('Failed to update event');
              setShowSuccessNotification(true);
              setTimeout(() => setShowSuccessNotification(false), 3000);
            }
          }}
          onDelete={async (eventId) => {
            try {
              await apiClient.post('/commands/sync/delete-event', { id: eventId });
              dashboardApi.clearCache('events*');
              await loadEvents();
              setNotificationMessage('Event deleted');
              setShowSuccessNotification(true);
              setTimeout(() => setShowSuccessNotification(false), 3000);
              setSelectedEvent(null);
            } catch (error) {
              console.error('Failed to delete event:', error);
              setNotificationMessage('Failed to delete event');
              setShowSuccessNotification(true);
              setTimeout(() => setShowSuccessNotification(false), 3000);
            }
          }}
          userColors={userColors}
        />
      )}
    </div>
  );
}