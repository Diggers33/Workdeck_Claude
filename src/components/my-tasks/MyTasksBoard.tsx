import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Filter, Search, ChevronDown, Clock, Eye, Loader2, AlertCircle, RefreshCw, Plus, ZoomIn, ZoomOut } from 'lucide-react';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors, DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { Column } from './Column';
import { TaskCard } from './TaskCard';
import { ActiveTimerBar } from './ActiveTimerBar';
import { TimerWarningModal } from './TimerWarningModal';
import { SaveTimeEntryModal } from './SaveTimeEntryModal';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { SetTimerDurationModal } from './SetTimerDurationModal';
import { TimerExtensionModal } from './TimerExtensionModal';
import { TaskDetailModal } from '../gantt/TaskDetailModal';
import { toast } from 'sonner';
import { useTasksCompat } from '../../contexts/UnifiedTasksContext';
import type { Task } from '../../types/task';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../services/api-client';

// Format date for API (DD/MM/YYYY HH:mm:ss+0000)
function formatDateForTimerApi(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}+0000`;
}

// Stage/Column color options (from Angular)
const STAGE_COLORS = [
  '#00b16a',
  '#00d400',
  '#ffbd01',
  '#ff8d00',
  '#ff4f6a',
  '#b3005f',
  '#968fe5',
  '#9000c3',
  '#00b4cd',
  '#254eef',
  '#193fb4',
  '#3a3d50'
];

interface TimerState {
  taskId: string | null;
  startTime: number | null;
  pausedTime: number;
  isPaused: boolean;
  targetDuration?: number;
  finishDate?: Date; // From API - when timer should end
  apiTimerId?: string; // Timer ID from API
  timerStartedAt?: number; // Timestamp when this timer was started (to prevent early warnings)
}

interface MyTasksBoardProps {
  onStartTimer?: (taskId: string, taskTitle: string, projectId: string, projectName: string, projectColor: string) => void;
}

export function MyTasksBoard({ onStartTimer: onStartTimerProp }: MyTasksBoardProps) {
  const [cardSize, setCardSize] = useState<'S' | 'M' | 'L'>('M');
  const [hideDone, setHideDone] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjects, setSelectedProjects] = useState<string[]>(['all']);
  const [dueFilter, setDueFilter] = useState('Any');
  const [priorityFilter, setPriorityFilter] = useState('Any');
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showDueDropdown, setShowDueDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedTaskModalData, setSelectedTaskModalData] = useState<any>(null);
  const [isLoadingTaskDetail, setIsLoadingTaskDetail] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100); // 50-150%

  // Zoom handlers
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 10, 150));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 10, 50));

  // Calculate scale factor for CSS transform
  const zoomScale = zoomLevel / 100;
  
  // Timer state
  const [timerState, setTimerState] = useState<TimerState>({
    taskId: null,
    startTime: null,
    pausedTime: 0,
    isPaused: false,
  });
  const [isLoadingTimer, setIsLoadingTimer] = useState(true);
  const [showTimerWarning, setShowTimerWarning] = useState(false);
  const [showSaveTimeEntry, setShowSaveTimeEntry] = useState(false);
  const [savedElapsedTime, setSavedElapsedTime] = useState(0); // Store elapsed time when stopping
  const [showSetDuration, setShowSetDuration] = useState(false);
  const [pendingTimerTaskId, setPendingTimerTaskId] = useState<string | null>(null);
  const [timerTick, setTimerTick] = useState(0); // Force re-render every second for timer
  const extensionShownForFinishDate = useRef<string | null>(null); // Track which finishDate we've shown extension modal for

  // Drag and drop
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Get tasks and columns from unified context
  const { tasks: myTasks, columns, updateTask, moveTask, isLoading, error, refreshTasks, createColumn, deleteColumn } = useTasksCompat();
  const { user } = useAuth();

  // Extract unique projects from tasks
  const uniqueProjects = React.useMemo(() => {
    const projectMap = new Map<string, { id: string; name: string; color: string }>();
    Object.values(myTasks).forEach(task => {
      if (task.projectId && !projectMap.has(task.projectId)) {
        projectMap.set(task.projectId, {
          id: task.projectId,
          name: task.projectName,
          color: task.projectColor,
        });
      }
    });
    return Array.from(projectMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [myTasks]);

  // Add column state
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnColor, setNewColumnColor] = useState(STAGE_COLORS[0]);
  const [isCreatingColumn, setIsCreatingColumn] = useState(false);

  // Add new column/stage
  const handleAddColumn = async () => {
    if (!newColumnName.trim()) return;

    try {
      setIsCreatingColumn(true);
      await createColumn(newColumnName.trim(), newColumnColor);

      toast.success('Column created');
      setNewColumnName('');
      setNewColumnColor(STAGE_COLORS[0]);
      setShowAddColumnModal(false);
    } catch (err) {
      console.error('Failed to create column:', err);
      toast.error('Failed to create column');
    } finally {
      setIsCreatingColumn(false);
    }
  };

  // Handle task click - fetch fresh data from API for modal
  const handleTaskClick = async (task: Task) => {
    setSelectedTask(task);

    // Show modal immediately with cached data
    const cachedModalData = {
      id: task.id,
      name: task.title || task.name,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      startDate: task.startDate,
      endDate: task.endDate || task.dueDate,
      spentHours: task.spentHours || 0,
      plannedHours: task.plannedHours || task.availableHours || 0,
      participants: task.participants || [],
      tags: task.tags || task.labels || [],
      checklist: task.checklists || [],
      activityId: task.activityId,
      activityName: task.activityName || task.parentActivity,
      projectId: task.projectId,
      projectName: task.projectName,
      projectColor: task.projectColor,
      progress: task.status === 'Done' ? 100 : task.status === 'In Review' ? 75 : task.status === 'In Progress' ? 50 : 0,
      _isLoading: true,
      _rawData: task._rawData,
    };
    setSelectedTaskModalData(cachedModalData);

    // Fetch fresh task data from API to get accurate participants and spentHours
    try {
      setIsLoadingTaskDetail(true);
      const freshTaskData = await apiClient.get(`/queries/tasks/${task.id}`) as any;
      console.log('[MyTasks] Fresh task data:', freshTaskData);
      console.log('[MyTasks] Fresh task participants:', freshTaskData?.participants);

      // Map participants with full details
      const freshParticipants = (freshTaskData.participants || []).map((p: any) => ({
        id: p.user?.id || p.userId || p.id,
        firstName: p.user?.firstName || '',
        lastName: p.user?.lastName || '',
        fullName: p.user?.fullName || `${p.user?.firstName || ''} ${p.user?.lastName || ''}`.trim() || 'Unknown',
        avatar: p.user?.avatar,
        isOwner: p.isOwner,
        isLeader: p.isLeader,
        availableHours: p.availableHours,
        plannedHours: p.plannedHours || p.plannedSchedule?.[0]?.plannedHours,
        spentHours: p.spentHours,
        column: p.column,
        user: p.user,
      }));

      // Update modal data with fresh data
      setSelectedTaskModalData({
        ...cachedModalData,
        name: freshTaskData.name || cachedModalData.name,
        description: freshTaskData.description || cachedModalData.description,
        startDate: freshTaskData.startDate,
        endDate: freshTaskData.endDate,
        spentHours: parseFloat(freshTaskData.spentHours || '0'),
        plannedHours: parseFloat(freshTaskData.availableHours || freshTaskData.plannedHours || '0'),
        participants: freshParticipants,
        tags: freshTaskData.labels || freshTaskData.tags || cachedModalData.tags,
        checklist: freshTaskData.checklist || cachedModalData.checklist,
        activityId: freshTaskData.activity?.id,
        activityName: freshTaskData.activity?.name,
        projectId: freshTaskData.activity?.project?.id || cachedModalData.projectId,
        projectName: freshTaskData.activity?.project?.name || cachedModalData.projectName,
        _isLoading: false,
        _rawData: freshTaskData,
      });
    } catch (err) {
      console.error('[MyTasks] Failed to fetch fresh task data:', err);
      // Keep showing cached data but mark as not loading
      setSelectedTaskModalData({
        ...cachedModalData,
        _isLoading: false,
      });
    } finally {
      setIsLoadingTaskDetail(false);
    }
  };

  // Delete column/stage (only if empty)
  const handleDeleteColumn = async (columnId: string) => {
    try {
      await deleteColumn(columnId);
      toast.success('Column deleted');
    } catch (err) {
      console.error('Failed to delete column:', err);
      toast.error('Failed to delete column');
    }
  };

  // Calculate time tracked today
  const getTimeTrackedToday = () => {
    const totalMinutes = Object.values(myTasks).reduce((sum, task) => {
      return sum + (task.timeLogged || 0);
    }, 0);
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Help modal
      if (e.key === '?') {
        e.preventDefault();
        setShowKeyboardShortcuts(true);
      }
      
      // Focus mode
      if (e.key === 'f' && !e.metaKey && !e.ctrlKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setFocusMode(!focusMode);
        }
      }
      
      // Hide done
      if (e.key === 'h' && !e.metaKey && !e.ctrlKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setHideDone(!hideDone);
        }
      }
      
      // Escape
      if (e.key === 'Escape') {
        if (focusMode) setFocusMode(false);
        if (showKeyboardShortcuts) setShowKeyboardShortcuts(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusMode, hideDone, showKeyboardShortcuts]);

  // Check for existing timer from localStorage on mount
  useEffect(() => {
    console.log('[Timer] Checking localStorage for saved timer...');
    try {
      const savedTimer = localStorage.getItem('workdeck_timer');
      console.log('[Timer] localStorage value:', savedTimer);
      if (savedTimer) {
        const timer = JSON.parse(savedTimer);
        const finishDate = new Date(timer.finishDate);
        const now = new Date();

        // Only restore if timer hasn't expired
        if (finishDate > now) {
          const remainingMs = finishDate.getTime() - now.getTime();
          const targetMinutes = Math.ceil(remainingMs / 60000);

          setTimerState({
            taskId: timer.taskId,
            startTime: timer.startTime,
            pausedTime: 0,
            isPaused: false,
            targetDuration: timer.targetDuration || targetMinutes,
            finishDate: finishDate,
            timerStartedAt: timer.timerStartedAt || timer.startTime,
          });

          console.log('[Timer] Restored from localStorage:', {
            taskId: timer.taskId,
            finishDate,
            remainingMinutes: targetMinutes,
          });
        } else {
          // Timer expired, remove it
          localStorage.removeItem('workdeck_timer');
          console.log('[Timer] Found expired timer in localStorage, removed');
        }
      } else {
        console.log('[Timer] No saved timer in localStorage');
      }
    } catch (err) {
      console.error('[Timer] Failed to restore timer from localStorage:', err);
      localStorage.removeItem('workdeck_timer');
    } finally {
      setIsLoadingTimer(false);
    }
  }, []);

  // Timer functions
  const startTimer = (taskId: string) => {
    console.log('[Timer] startTimer called with taskId:', taskId);
    const task = myTasks[taskId];
    if (!task) {
      console.log('[Timer] Task not found for startTimer');
      return;
    }

    // If timer prop is provided from App, use it (global timer)
    if (onStartTimerProp) {
      console.log('[Timer] Using global timer from App');
      onStartTimerProp(taskId, task.title, task.projectId, task.projectName, task.projectColor);
      return;
    }

    // Otherwise use local timer
    console.log('[Timer] Using local timer, showing duration modal');
    setPendingTimerTaskId(taskId);
    setShowSetDuration(true);
  };

  const handleStartTimerWithDuration = async (durationMinutes: number) => {
    console.log('[Timer] handleStartTimerWithDuration called with:', durationMinutes, 'minutes');
    console.log('[Timer] pendingTimerTaskId:', pendingTimerTaskId);

    if (!pendingTimerTaskId) {
      console.log('[Timer] No pendingTimerTaskId, returning');
      return;
    }

    const task = myTasks[pendingTimerTaskId];
    if (!task) {
      console.log('[Timer] Task not found, returning');
      return;
    }

    console.log('[Timer] Task found:', task.title);

    // Calculate finish date
    const finishDate = new Date(Date.now() + durationMinutes * 60 * 1000);
    console.log('[Timer] Calculated finishDate:', finishDate.toISOString());
    const finishDateStr = formatDateForTimerApi(finishDate);

    let apiTimerId: string | undefined;

    try {
      // Try to call API to start timer
      const response = await apiClient.post('/commands/sync/timer/start', {
        task: { id: pendingTimerTaskId },
        finishDate: finishDateStr,
      }) as any;

      const timerData = response?.result || response;
      apiTimerId = timerData?.id;

      console.log('[Timer] Started via API:', {
        taskId: pendingTimerTaskId,
        finishDate: finishDateStr,
        durationMinutes,
      });
    } catch (err) {
      // API failed - continue with local timer only
      console.warn('[Timer] API unavailable, using local timer:', err);
    }

    // Reset extension modal state for new timer
    extensionShownForFinishDate.current = null;

    const timerStartedAt = Date.now();
    console.log('[Timer] Starting new timer:', {
      taskId: pendingTimerTaskId,
      durationMinutes,
      finishDate: finishDate.toISOString(),
      timerStartedAt,
      extensionWillShowAfterMs: (durationMinutes - 2) * 60 * 1000,
    });

    const newTimerState = {
      taskId: pendingTimerTaskId,
      startTime: timerStartedAt,
      pausedTime: 0,
      isPaused: false,
      targetDuration: durationMinutes,
      finishDate: finishDate,
      apiTimerId: apiTimerId,
      timerStartedAt: timerStartedAt,
    };

    // Save to localStorage for persistence across page reloads
    localStorage.setItem('workdeck_timer', JSON.stringify({
      taskId: pendingTimerTaskId,
      startTime: timerStartedAt,
      targetDuration: durationMinutes,
      finishDate: finishDate.toISOString(),
      timerStartedAt: timerStartedAt,
    }));

    // Start timer
    console.log('[Timer] Setting timer state:', newTimerState);
    setTimerState(newTimerState);

    setPendingTimerTaskId(null);
    toast.success(`Timer started • ${durationMinutes} min`);
  };

  // Note: The Timer API doesn't have a pause endpoint, so pause/resume is UI-only.
  // The API timer continues running - this just pauses the visual countdown.
  const pauseTimer = () => {
    if (timerState.taskId && !timerState.isPaused) {
      setTimerState({
        ...timerState,
        isPaused: true,
      });
    }
  };

  const resumeTimer = () => {
    if (timerState.taskId && timerState.isPaused) {
      setTimerState({
        ...timerState,
        isPaused: false,
      });
    }
  };

  const stopTimer = () => {
    // Calculate elapsed time BEFORE showing modal (so it's captured correctly)
    let elapsedMs = 0;
    if (timerState.finishDate && timerState.targetDuration) {
      const totalDuration = timerState.targetDuration * 60 * 1000;
      const remaining = Math.max(0, timerState.finishDate.getTime() - Date.now());
      elapsedMs = totalDuration - remaining;
    }
    setSavedElapsedTime(elapsedMs);
    setShowSaveTimeEntry(true);
  };

  const handleSaveTimeEntry = async () => {
    const task = timerState.taskId ? myTasks[timerState.taskId] : null;

    // Clear localStorage
    localStorage.removeItem('workdeck_timer');

    let calendarEventCreated = false;

    // First try POST /commands/sync/timer/stop (auto-creates calendar event)
    try {
      console.log('[Timer] Attempting to stop timer via API...');
      await apiClient.post('/commands/sync/timer/stop', {});
      console.log('[Timer] Stopped via API - calendar event auto-created');
      calendarEventCreated = true;
    } catch (err: any) {
      console.warn('[Timer] timer/stop failed, will create event manually:', err);

      // Fallback: Create calendar event manually
      if (task && user?.id && timerState.timerStartedAt && savedElapsedTime > 0) {
        try {
          const startTime = new Date(timerState.timerStartedAt);
          const endTime = new Date(timerState.timerStartedAt + savedElapsedTime);

          const eventPayload = {
            id: crypto.randomUUID(),
            title: task.title,
            startAt: formatDateForTimerApi(startTime),
            endAt: formatDateForTimerApi(endTime),
            color: task.projectColor || '#3B82F6',
            state: 1,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Madrid',
            timesheet: true,  // Important - counts towards hours
            billable: false,
            private: false,
            task: { id: task.id },
            project: { id: task.projectId },
            guests: [{ id: user.id }],
            fromUser: user.id,
            creator: { id: user.id },
          };

          console.log('[Timer] Creating calendar event manually:', eventPayload);
          await apiClient.post('/commands/sync/create-event', eventPayload);
          console.log('[Timer] Calendar event created successfully');
          calendarEventCreated = true;
        } catch (eventErr) {
          console.error('[Timer] Failed to create calendar event:', eventErr);
        }
      }
    }

    setTimerState({
      taskId: null,
      startTime: null,
      pausedTime: 0,
      isPaused: false,
      finishDate: undefined,
      apiTimerId: undefined,
      timerStartedAt: undefined,
    });
    setShowSaveTimeEntry(false);

    if (calendarEventCreated) {
      toast.success('Time entry saved • Added to calendar');
    } else {
      toast.success('Time entry saved');
    }
  };

  const handleDiscardTime = async () => {
    // Clear localStorage
    localStorage.removeItem('workdeck_timer');

    // Try to call API (may not be implemented yet)
    try {
      await apiClient.post('/commands/sync/timer/stop', {});
      console.log('[Timer] Timer stopped (discarded)');
    } catch (err) {
      // Ignore errors - API might not be implemented
      console.warn('[Timer] Error stopping timer on discard:', err);
    }

    setTimerState({
      taskId: null,
      startTime: null,
      pausedTime: 0,
      isPaused: false,
      finishDate: undefined,
      apiTimerId: undefined,
      timerStartedAt: undefined,
    });
    setShowSaveTimeEntry(false);
    toast('Time entry discarded');
  };

  // Timer tick - updates every second when timer is running
  useEffect(() => {
    console.log('[Timer Tick Effect] Running with:', {
      taskId: timerState.taskId,
      isPaused: timerState.isPaused,
      finishDate: timerState.finishDate?.toISOString(),
      timerStartedAt: timerState.timerStartedAt,
    });

    if (!timerState.taskId || timerState.isPaused || !timerState.finishDate) {
      console.log('[Timer Tick Effect] Skipping - conditions not met');
      return;
    }

    console.log('[Timer Tick Effect] Starting interval');

    const interval = setInterval(() => {
      const remainingMs = timerState.finishDate!.getTime() - Date.now();

      // Auto-stop when timer reaches 0
      if (remainingMs <= 0) {
        clearInterval(interval);
        stopTimer();
        return;
      }

      // Force re-render every second
      setTimerTick(t => t + 1);
    }, 1000);

    return () => {
      console.log('[Timer Tick Effect] Cleanup');
      clearInterval(interval);
    };
  }, [timerState.taskId, timerState.finishDate, timerState.isPaused]);

  // Compute whether to show extension modal (calculated fresh each render)
  const shouldShowExtensionModal = React.useMemo(() => {
    if (!timerState.taskId || !timerState.finishDate || !timerState.timerStartedAt) {
      return false;
    }
    if (!timerState.targetDuration || timerState.targetDuration <= 2) {
      return false;
    }

    const now = Date.now();
    const finishDateStr = timerState.finishDate.toISOString();
    const remainingMs = timerState.finishDate.getTime() - now;
    const remainingSeconds = Math.floor(remainingMs / 1000);
    const elapsedMs = now - timerState.timerStartedAt;
    const elapsedSeconds = Math.floor(elapsedMs / 1000);
    const minElapsedMs = (timerState.targetDuration - 2) * 60 * 1000; // Must have elapsed (duration - 2 min)
    const minElapsedSeconds = Math.floor(minElapsedMs / 1000);

    // Debug log every 5 seconds
    if (timerTick % 5 === 0) {
      console.log('[Extension Modal Check]', {
        remainingSeconds,
        elapsedSeconds,
        minElapsedSeconds,
        targetDuration: timerState.targetDuration,
        timerStartedAt: new Date(timerState.timerStartedAt).toISOString(),
        finishDate: finishDateStr,
        alreadyShown: extensionShownForFinishDate.current === finishDateStr,
        condition1_remaining_lte_120: remainingSeconds <= 120,
        condition2_remaining_gt_0: remainingSeconds > 0,
        condition3_elapsed_gte_min: elapsedMs >= minElapsedMs,
      });
    }

    // Already shown modal for this finishDate (prevents repeated showing)
    if (extensionShownForFinishDate.current === finishDateStr) return false;

    // Show when: 2 minutes or less remaining AND enough time has actually elapsed
    const shouldShow = remainingSeconds <= 120 && remainingSeconds > 0 && elapsedMs >= minElapsedMs;

    if (shouldShow) {
      console.log('[Extension Modal] SHOWING - all conditions met');
      extensionShownForFinishDate.current = finishDateStr;
    }

    return shouldShow;
  }, [timerState.taskId, timerState.finishDate, timerState.timerStartedAt, timerState.targetDuration, timerTick]);

  const handleExtendTimer = async (additionalMinutes: number) => {
    if (!timerState.taskId) return;

    // Calculate new finish date
    const currentFinish = timerState.finishDate || new Date();
    const newFinishDate = new Date(currentFinish.getTime() + additionalMinutes * 60 * 1000);
    const newFinishDateStr = formatDateForTimerApi(newFinishDate);

    try {
      // Restart timer with extended finish date
      await apiClient.post('/commands/sync/timer/start', {
        task: { id: timerState.taskId },
        finishDate: newFinishDateStr,
      });

      const newTargetDuration = (timerState.targetDuration || 0) + additionalMinutes;

      setTimerState({
        ...timerState,
        targetDuration: newTargetDuration,
        finishDate: newFinishDate,
      });

      // Update localStorage with extended time
      localStorage.setItem('workdeck_timer', JSON.stringify({
        taskId: timerState.taskId,
        startTime: timerState.startTime,
        targetDuration: newTargetDuration,
        finishDate: newFinishDate.toISOString(),
        timerStartedAt: timerState.timerStartedAt,
      }));

      console.log('[Timer] Extended via API:', {
        additionalMinutes,
        newFinishDate: newFinishDateStr,
        newTargetDuration,
      });

      // Note: extensionShownForFinishDate will allow the modal to show again
      // at the new 2-minute mark since finishDate changed
      toast.success(`Timer extended • +${additionalMinutes} min`);
    } catch (err) {
      console.error('[Timer] Failed to extend timer:', err);
      toast.error('Failed to extend timer');
    }
  };

  const handleFinishTimer = () => {
    stopTimer();
  };

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const activeTaskId = active.id as string;
    const overColumnId = over.id as string;

    const sourceColumn = columns.find(col => col.taskIds.includes(activeTaskId));
    const targetColumn = columns.find(col => col.id === overColumnId);

    if (!sourceColumn || !targetColumn || sourceColumn.id === targetColumn.id) {
      setActiveId(null);
      return;
    }

    // Use context's moveTask which calls the API
    try {
      await moveTask(activeTaskId, targetColumn.id, 0);
      toast(`Moved to ${targetColumn.name}`);
    } catch (err) {
      toast.error('Failed to move task');
    }

    setActiveId(null);
  };

  // Filter tasks
  const getFilteredTasks = () => {
    let filtered = { ...myTasks };

    if (hideDone) {
      filtered = Object.fromEntries(
        Object.entries(filtered).filter(([_, task]) => task.status !== 'Done')
      );
    }

    if (searchQuery) {
      filtered = Object.fromEntries(
        Object.entries(filtered).filter(([_, task]) =>
          task.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    if (!selectedProjects.includes('all')) {
      filtered = Object.fromEntries(
        Object.entries(filtered).filter(([_, task]) =>
          selectedProjects.includes(task.projectId)
        )
      );
    }

    if (dueFilter !== 'Any') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      filtered = Object.fromEntries(
        Object.entries(filtered).filter(([_, task]) => {
          if (!task.dueDate) return false;
          const dueDate = new Date(task.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          
          if (dueFilter === 'Overdue') return dueDate < today;
          if (dueFilter === 'Today') return dueDate.getTime() === today.getTime();
          if (dueFilter === 'This Week') {
            const weekFromNow = new Date(today);
            weekFromNow.setDate(weekFromNow.getDate() + 7);
            return dueDate >= today && dueDate <= weekFromNow;
          }
          if (dueFilter === 'This Month') {
            const monthFromNow = new Date(today);
            monthFromNow.setMonth(monthFromNow.getMonth() + 1);
            return dueDate >= today && dueDate <= monthFromNow;
          }
          return true;
        })
      );
    }

    if (priorityFilter !== 'Any') {
      filtered = Object.fromEntries(
        Object.entries(filtered).filter(([_, task]) => task.priority === priorityFilter)
      );
    }

    return filtered;
  };

  const filteredTasks = getFilteredTasks();
  const activeTask = activeId ? myTasks[activeId] : null;
  const timerTask = timerState.taskId ? myTasks[timerState.taskId] : null;

  const getElapsedTime = () => {
    if (!timerState.taskId) return 0;

    // If we have a finishDate from API, calculate elapsed based on that
    if (timerState.finishDate && timerState.targetDuration) {
      const now = Date.now();
      const finishTime = timerState.finishDate.getTime();
      const totalDuration = timerState.targetDuration * 60 * 1000;
      const remaining = Math.max(0, finishTime - now);
      return totalDuration - remaining;
    }

    // Fallback to local calculation
    let elapsed = timerState.pausedTime;
    if (!timerState.isPaused && timerState.startTime) {
      elapsed += Date.now() - timerState.startTime;
    }
    return elapsed;
  };

  // Get columns to display (focus mode shows only Today)
  const displayColumns = focusMode ? columns.filter(c => c.name === 'Today') : columns;

  return (
    <div className={`relative h-screen overflow-hidden flex flex-col ${focusMode ? 'bg-[#111827]' : 'bg-[#F9FAFB]'}`}>
      {/* Top Bar */}
      <div className="flex-shrink-0 bg-white border-b" style={{ height: '64px', borderColor: '#E5E7EB' }}>
        <div className="h-full px-6 flex items-center justify-between">
          {/* Left section */}
          <div className="flex items-center gap-4">
            {!focusMode && (
              <>
                <button
                  className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#F9FAFB] text-[#6B7280] hover:text-[#111827] transition-colors"
                  title="Back to Projects"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div style={{ width: '1px', height: '32px', background: '#E5E7EB' }} />
                <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#111827', lineHeight: '1', whiteSpace: 'nowrap' }}>My Tasks</h1>
                
                {/* Project filter */}
                <div className="relative" style={{ marginLeft: '8px' }}>
                  <button
                    onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                    className="h-8 px-3 flex items-center gap-2 border rounded-md hover:bg-[#F9FAFB] transition-colors"
                    style={{ borderColor: '#E5E7EB', fontSize: '13px', color: '#6B7280', whiteSpace: 'nowrap' }}
                  >
                    {selectedProjects.includes('all') ? 'All Projects' : `${selectedProjects.length} projects`}
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  
                  {showProjectDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowProjectDropdown(false)} />
                      <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border z-20" style={{ borderColor: '#E5E7EB' }}>
                        <div className="p-2">
                          <label className="flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedProjects.includes('all')}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedProjects(['all']);
                                }
                              }}
                              className="w-4 h-4"
                            />
                            <span style={{ fontSize: '14px', color: '#111827' }}>All Projects</span>
                          </label>
                          {uniqueProjects.length > 0 && (
                            <>
                              <div className="h-px bg-[#E5E7EB] my-1" />
                              {uniqueProjects.map(project => (
                                <label key={project.id} className="flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] rounded cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={selectedProjects.includes(project.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedProjects([...selectedProjects.filter(p => p !== 'all'), project.id]);
                                      } else {
                                        const newSelected = selectedProjects.filter(p => p !== project.id);
                                        setSelectedProjects(newSelected.length === 0 ? ['all'] : newSelected);
                                      }
                                    }}
                                    className="w-4 h-4"
                                  />
                                  <div
                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: project.color }}
                                  />
                                  <span style={{ fontSize: '14px', color: '#111827' }}>
                                    {project.name}
                                  </span>
                                </label>
                              ))}
                            </>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Filters button */}
                <button
                  className="h-8 px-3 flex items-center gap-2 border rounded-md hover:bg-[#F9FAFB] transition-colors"
                  style={{ borderColor: '#E5E7EB', fontSize: '13px', color: '#6B7280' }}
                >
                  <Filter className="w-4 h-4" />
                  Filters
                </button>

                {/* Due filter */}
                <div className="relative">
                  <button
                    onClick={() => setShowDueDropdown(!showDueDropdown)}
                    className="h-8 px-3 flex items-center gap-2 border rounded-md hover:bg-[#F9FAFB] transition-colors"
                    style={{ borderColor: '#E5E7EB', fontSize: '13px', color: '#6B7280', whiteSpace: 'nowrap' }}
                  >
                    Due: {dueFilter}
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  
                  {showDueDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowDueDropdown(false)} />
                      <div className="absolute top-full left-0 mt-1 w-40 bg-white rounded-lg shadow-lg border z-20" style={{ borderColor: '#E5E7EB' }}>
                        <div className="p-1">
                          {['Any', 'Overdue', 'Today', 'This Week', 'This Month'].map(filter => (
                            <button
                              key={filter}
                              onClick={() => {
                                setDueFilter(filter);
                                setShowDueDropdown(false);
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-[#F9FAFB] rounded"
                              style={{ fontSize: '13px', color: '#111827' }}
                            >
                              {filter}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Priority filter */}
                <div className="relative">
                  <button
                    onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
                    className="h-8 px-3 flex items-center gap-2 border rounded-md hover:bg-[#F9FAFB] transition-colors"
                    style={{ borderColor: '#E5E7EB', fontSize: '13px', color: '#6B7280', whiteSpace: 'nowrap' }}
                  >
                    Priority: {priorityFilter}
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  
                  {showPriorityDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowPriorityDropdown(false)} />
                      <div className="absolute top-full left-0 mt-1 w-32 bg-white rounded-lg shadow-lg border z-20" style={{ borderColor: '#E5E7EB' }}>
                        <div className="p-1">
                          {['Any', 'High', 'Medium', 'Low'].map(filter => (
                            <button
                              key={filter}
                              onClick={() => {
                                setPriorityFilter(filter);
                                setShowPriorityDropdown(false);
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-[#F9FAFB] rounded"
                              style={{ fontSize: '13px', color: '#111827' }}
                            >
                              {filter}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-[180px] focus:w-[280px] h-8 pl-9 pr-3 border rounded-md transition-all"
                    style={{ borderColor: '#E5E7EB', fontSize: '13px' }}
                  />
                </div>
              </>
            )}
            
            {focusMode && (
              <div className="flex items-center gap-4">
                <Eye className="w-5 h-5 text-[#2563EB]" />
                <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#111827', lineHeight: '1', whiteSpace: 'nowrap' }}>Focus Mode</h1>
                <span style={{ fontSize: '13px', color: '#6B7280' }}>• Today • {displayColumns[0]?.taskIds.length || 0} tasks</span>
              </div>
            )}
          </div>

          {/* Right section */}
          <div className="flex items-center gap-3">
            {!focusMode && (
              <>
                {/* Time tracked today */}
                <div className="flex items-center gap-2 pr-3 border-r" style={{ borderColor: '#E5E7EB' }}>
                  <Clock className="w-4 h-4 text-[#2563EB]" />
                  <button className="hover:underline" title="This week: 18h 30m" style={{ whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>{getTimeTrackedToday()}</span>
                    <span style={{ fontSize: '13px', color: '#6B7280', marginLeft: '4px' }}>today</span>
                  </button>
                </div>

                {/* Hide done */}
                <label className="flex items-center gap-2 cursor-pointer" style={{ whiteSpace: 'nowrap' }}>
                  <input
                    type="checkbox"
                    checked={hideDone}
                    onChange={(e) => setHideDone(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span style={{ fontSize: '13px', color: '#6B7280' }}>Hide Done</span>
                </label>

                {/* Card size */}
                <div className="flex items-center gap-0 border rounded-md overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
                  {(['S', 'M', 'L'] as const).map(size => (
                    <button
                      key={size}
                      onClick={() => setCardSize(size)}
                      className={`w-8 h-8 flex items-center justify-center transition-colors ${
                        cardSize === size ? 'bg-[#EFF6FF] text-[#2563EB]' : 'text-[#6B7280] hover:bg-[#F9FAFB]'
                      }`}
                      style={{ fontSize: '12px', fontWeight: 600 }}
                    >
                      {size}
                    </button>
                  ))}
                </div>

                {/* Zoom controls */}
                <div className="flex items-center gap-1 border rounded-md overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
                  <button
                    onClick={handleZoomOut}
                    disabled={zoomLevel <= 50}
                    className={`w-8 h-8 flex items-center justify-center transition-colors ${
                      zoomLevel <= 50 ? 'text-[#D1D5DB] cursor-not-allowed' : 'text-[#6B7280] hover:bg-[#F9FAFB]'
                    }`}
                    title={`Zoom out (${zoomLevel}%)`}
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span
                    className="w-10 text-center text-[12px] font-semibold text-[#6B7280]"
                    title="Current zoom level"
                  >
                    {zoomLevel}%
                  </span>
                  <button
                    onClick={handleZoomIn}
                    disabled={zoomLevel >= 150}
                    className={`w-8 h-8 flex items-center justify-center transition-colors ${
                      zoomLevel >= 150 ? 'text-[#D1D5DB] cursor-not-allowed' : 'text-[#6B7280] hover:bg-[#F9FAFB]'
                    }`}
                    title={`Zoom in (${zoomLevel}%)`}
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>

              </>
            )}

            {/* Focus mode toggle */}
            <button
              onClick={() => setFocusMode(!focusMode)}
              className={`h-8 px-3 flex items-center gap-2 border rounded-md transition-colors ${
                focusMode
                  ? 'bg-[#2563EB] border-[#2563EB] text-white'
                  : 'border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB]'
              }`}
              style={{ fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap' }}
            >
              <Eye className="w-4 h-4" />
              {focusMode ? 'Exit Focus' : 'Focus'}
            </button>

            {/* Keyboard shortcuts */}
            <button
              onClick={() => setShowKeyboardShortcuts(true)}
              className="w-8 h-8 flex items-center justify-center rounded-full border text-[#6B7280] hover:bg-[#F9FAFB] transition-colors"
              style={{ borderColor: '#E5E7EB', fontSize: '13px', fontWeight: 600 }}
              title="Keyboard shortcuts"
            >
              ?
            </button>
          </div>
        </div>
      </div>

      {/* Board Area */}
      <div className={`flex-1 overflow-x-auto overflow-y-hidden ${timerState.taskId ? 'pb-16' : 'pb-6'}`}>
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
              <p style={{ fontSize: '14px', color: '#6B7280' }}>Loading your tasks...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
              <p style={{ fontSize: '14px', color: '#EF4444', marginBottom: '12px' }}>{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 mx-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                style={{ fontSize: '13px', fontWeight: 500 }}
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Board Content */}
        {!isLoading && !error && (
        <div
          className={`px-6 py-4 flex gap-4 ${focusMode ? 'justify-center' : 'min-w-max'}`}
          style={zoomLevel !== 100 ? {
            transform: `scale(${zoomScale})`,
            transformOrigin: 'top left',
            width: `calc(100% / ${zoomScale})`,
            height: `calc((100vh - 64px) / ${zoomScale})`,
            minHeight: `calc((100vh - 64px) / ${zoomScale})`,
          } : {
            height: 'calc(100vh - 64px)',
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {displayColumns.map(column => (
              <Column
                key={column.id}
                column={column}
                tasks={column.taskIds
                  .map(id => filteredTasks[id])
                  .filter(Boolean)
                }
                cardSize={focusMode ? 'L' : cardSize}
                onStartTimer={startTimer}
                onPauseTimer={pauseTimer}
                onResumeTimer={resumeTimer}
                onStopTimer={stopTimer}
                onTaskClick={handleTaskClick}
                timerTaskId={timerState.taskId}
                timerIsPaused={timerState.isPaused}
                getElapsedTime={getElapsedTime}
                focusMode={focusMode}
                onDeleteColumn={handleDeleteColumn}
              />
            ))}

            <DragOverlay dropAnimation={null}>
              {activeTask && (
                <div style={{ width: focusMode ? '400px' : '320px', cursor: 'grabbing' }}>
                  <TaskCard
                    task={activeTask}
                    cardSize={focusMode ? 'L' : cardSize}
                    onStartTimer={() => {}}
                    isTimerActive={false}
                  />
                </div>
              )}
            </DragOverlay>
          </DndContext>

          {/* Add Column Button */}
          {!focusMode && (
            <div className="flex-shrink-0" style={{ width: '320px' }}>
              <button
                onClick={() => setShowAddColumnModal(true)}
                className="w-full h-12 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed hover:bg-[#F3F4F6] transition-colors"
                style={{ borderColor: '#D1D5DB', color: '#6B7280', fontSize: '14px' }}
              >
                <Plus className="w-4 h-4" />
                Add Column
              </button>
            </div>
          )}

        </div>
        )}
      </div>

      {/* Active Timer Bar */}
      {timerState.taskId && timerTask && (
        <ActiveTimerBar
          task={timerTask}
          finishDate={timerState.finishDate}
          targetDuration={timerState.targetDuration}
          isPaused={timerState.isPaused}
          onPause={pauseTimer}
          onResume={resumeTimer}
          onStop={stopTimer}
          onTaskClick={handleTaskClick}
        />
      )}

      {/* Modals */}
      {showTimerWarning && timerTask && (
        <TimerWarningModal
          task={timerTask}
          elapsedTime={getElapsedTime()}
          onExtend={(minutes) => {
            setShowTimerWarning(false);
          }}
          onStopAndSave={() => {
            setShowTimerWarning(false);
            stopTimer();
          }}
          onContinue={() => {
            setShowTimerWarning(false);
          }}
        />
      )}

      {showSaveTimeEntry && timerTask && (
        <SaveTimeEntryModal
          task={timerTask}
          elapsedTime={savedElapsedTime}
          onSave={handleSaveTimeEntry}
          onDiscard={handleDiscardTime}
        />
      )}

      {showKeyboardShortcuts && (
        <KeyboardShortcutsModal onClose={() => setShowKeyboardShortcuts(false)} />
      )}

      {showSetDuration && pendingTimerTaskId && (
        <SetTimerDurationModal
          taskTitle={myTasks[pendingTimerTaskId]?.title || ''}
          onClose={() => {
            setShowSetDuration(false);
            setPendingTimerTaskId(null);
          }}
          onStart={handleStartTimerWithDuration}
        />
      )}

      {shouldShowExtensionModal && timerTask && timerState.finishDate && (
        <TimerExtensionModal
          taskTitle={timerTask.title}
          remainingSeconds={Math.max(0, Math.floor((timerState.finishDate.getTime() - Date.now()) / 1000))}
          onExtend={handleExtendTimer}
          onFinish={handleFinishTimer}
        />
      )}

      {selectedTask && selectedTaskModalData && (
        <TaskDetailModal
          task={selectedTaskModalData}
          onClose={() => {
            setSelectedTask(null);
            setSelectedTaskModalData(null);
          }}
          onUpdateTask={(taskId, updates) => {
            // Update in unified context
            updateTask(prevTasks => ({
              ...prevTasks,
              [selectedTask.id]: {
                ...selectedTask,
                title: updates.name || selectedTask.title,
                name: updates.name || selectedTask.name,
                description: updates.description || selectedTask.description,
                status: updates.status as any || selectedTask.status,
                priority: updates.priority as any || selectedTask.priority,
                dueDate: updates.dueDate || selectedTask.dueDate,
              }
            }));
          }}
        />
      )}

      {/* Add Column Modal */}
      {showAddColumnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => {
            setShowAddColumnModal(false);
            setNewColumnName('');
            setNewColumnColor(STAGE_COLORS[0]);
          }} />
          <div className="relative bg-white rounded-lg shadow-xl w-[400px] p-6">
            <h2 className="text-lg font-semibold text-[#111827] mb-4">New Stage</h2>

            {/* Column Name Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#374151] mb-1">Name</label>
              <input
                type="text"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                placeholder="Enter stage name..."
                autoFocus
                maxLength={25}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: '#E5E7EB', fontSize: '14px' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newColumnName.trim()) handleAddColumn();
                  if (e.key === 'Escape') {
                    setShowAddColumnModal(false);
                    setNewColumnName('');
                    setNewColumnColor(STAGE_COLORS[0]);
                  }
                }}
              />
              <div className="text-xs text-[#9CA3AF] mt-1 text-right">{newColumnName.length}/25</div>
            </div>

            {/* Color Picker */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#374151] mb-2">Color</label>
              <div className="flex flex-wrap gap-2">
                {STAGE_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewColumnColor(color)}
                    className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${
                      newColumnColor === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowAddColumnModal(false);
                  setNewColumnName('');
                  setNewColumnColor(STAGE_COLORS[0]);
                }}
                className="px-4 py-2 border rounded-md hover:bg-gray-50 transition-colors"
                style={{ borderColor: '#E5E7EB', fontSize: '14px', color: '#6B7280' }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddColumn}
                disabled={!newColumnName.trim() || isCreatingColumn}
                className="px-4 py-2 bg-[#2563EB] text-white rounded-md hover:bg-[#1D4ED8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                style={{ fontSize: '14px', fontWeight: 500 }}
              >
                {isCreatingColumn && <Loader2 className="w-4 h-4 animate-spin" />}
                {isCreatingColumn ? 'Creating...' : 'Create Stage'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}