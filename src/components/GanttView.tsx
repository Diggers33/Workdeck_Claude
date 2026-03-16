import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GanttTopBar } from './gantt/GanttTopBar';
import { GanttFilterBar } from './gantt/GanttFilterBar';
import { GanttToolbar } from './gantt/GanttToolbar';
import { GanttTaskList } from './gantt/GanttTaskList';
import { GanttTimeline } from './gantt/GanttTimeline';
import { GanttTimelineHeader } from './gantt/GanttTimelineHeader';
import { GanttLegend } from './gantt/GanttLegend';
import { TaskDetailModal } from './gantt/TaskDetailModal';
import { TaskCreateModal } from './gantt/TaskCreateModal';
import { ProjectInfoPanel } from './gantt/ProjectInfoPanel';
import { ProjectWizardDialog } from './ProjectWizardDialog';
import { ProjectBoard } from './project-board/ProjectBoard';
import { GanttActivity, GanttTask, GanttWeek } from './gantt/types';
import { Plus, Loader2 } from 'lucide-react';
import { dashboardApi } from '../services/dashboard-api';
import type { GanttData, GanttActivityData, GanttTaskData } from '../services/dashboard-api';
import { apiClient } from '@/services/api-client';
import { ENDPOINTS } from '@/config/api';
import { useAuth } from '../contexts/AuthContext';
import { useUnifiedTasks } from '../contexts/UnifiedTasksContext';
import type { Task } from '../types/task';

interface GanttViewProps {
  projectId?: string;
  onClose: () => void;
  refreshKey?: number; // Increment to trigger data reload (e.g., after timer stops)
}

export function GanttView({ projectId, onClose, refreshKey }: GanttViewProps) {
  const { user } = useAuth();
  const { refreshTask, getTask, fetchProjectTasks } = useUnifiedTasks();
  const [showBoard, setShowBoard] = useState(false);
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set());
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set(['myTasks']));
  const [timeResolution, setTimeResolution] = useState<string>('Week');
  const [showLegend, setShowLegend] = useState(false);
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [taskCreateModal, setTaskCreateModal] = useState<{ activityId: string; activityName: string } | null>(null);
  const [projectPanelOpen, setProjectPanelOpen] = useState(false);
  const [projectPanelTab, setProjectPanelTab] = useState<'comments' | 'activity' | 'notes' | 'files'>('comments');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [scrollPosition, setScrollPosition] = useState({ left: 0, width: 10 }); // For custom scrollbar
  const [showWizard, setShowWizard] = useState(false);
  const [wizardMode, setWizardMode] = useState<'create' | 'edit'>('create');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('Project');
  const [projectDateRange, setProjectDateRange] = useState<{ start: string; end: string } | undefined>(undefined);
  const [tasks, setTasks] = useState<GanttActivity[]>([]);
  const [projectData, setProjectData] = useState<any>(null); // Store full project data for participant hours
  const [weeks, setWeeks] = useState<GanttWeek[]>(() => {
    // Initialize with default 52 weeks starting from today
    const today = new Date();
    const initialWeeks = [];
    for (let i = 0; i < 52; i++) {
      const weekDate = new Date(today);
      weekDate.setDate(today.getDate() + (i * 7));
      const year = weekDate.getFullYear();
      const firstDayOfYear = new Date(year, 0, 1);
      const pastDaysOfYear = (weekDate.getTime() - firstDayOfYear.getTime()) / 86400000;
      const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      initialWeeks.push({
        label: `W${weekNumber}`,
        isToday: i === 0,
        date: weekDate,
        weekNumber,
        month: weekDate.toLocaleDateString('en-US', { month: 'long' }),
        year,
        isFirstOfMonth: weekDate.getDate() <= 7
      });
    }
    return initialWeeks;
  });

  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const taskListScrollRef = useRef<HTMLDivElement>(null);
  const timelineHeaderScrollRef = useRef<HTMLDivElement>(null);

  // Filter tasks based on active filters
  const filteredTasks = useMemo(() => {
    if (activeFilters.size === 0) return tasks;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    
    const currentUserId = user?.id;
    
    // Helper to check if a task matches filters
    const taskMatchesFilters = (task: GanttTask): boolean => {
      const rawData = task._rawData || {};
      const participants = rawData.participants || [];
      
      // Parse end date
      let taskEndDate: Date | null = null;
      if (rawData.endDate) {
        taskEndDate = new Date(rawData.endDate);
      }
      
      // Parse start date
      let taskStartDate: Date | null = null;
      if (rawData.startDate) {
        taskStartDate = new Date(rawData.startDate);
      }
      
      for (const filterId of activeFilters) {
        let matches = false;
        
        switch (filterId) {
          case 'myTasks':
            // Check if current user is a participant
            matches = participants.some((p: any) => p.id === currentUserId);
            break;
          case 'overdue':
            // Check if task is overdue (end date passed and not completed)
            matches = !task.completed && taskEndDate !== null && taskEndDate < today;
            break;
          case 'thisWeek':
            // Check if task is active this week (start <= weekFromNow and end >= today)
            matches = taskStartDate !== null && taskEndDate !== null &&
                      taskStartDate <= weekFromNow && taskEndDate >= today;
            break;
          case 'flagged':
            matches = task.flag === true;
            break;
          case 'milestones':
            matches = task.type === 'milestone';
            break;
          case 'completed':
            matches = task.completed === true;
            break;
          default:
            matches = true;
        }
        
        if (matches) return true; // OR logic - task matches if any filter matches
      }
      
      return false;
    };
    
    // Filter activities and their children
    return tasks.map(activity => {
      const filteredChildren = activity.children?.filter(taskMatchesFilters) || [];
      
      // Keep activity if it has matching children
      if (filteredChildren.length > 0) {
        return {
          ...activity,
          children: filteredChildren,
          taskCount: filteredChildren.length
        };
      }
      
      return null;
    }).filter(Boolean) as GanttActivity[];
  }, [tasks, activeFilters, user?.id]);

  // Calculate filter counts for the filter bar
  const filterCounts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    const currentUserId = user?.id;
    
    let myTasks = 0, overdue = 0, thisWeek = 0, flagged = 0, milestones = 0, completed = 0, total = 0;
    
    tasks.forEach(activity => {
      activity.children?.forEach((task: GanttTask) => {
        total++;
        const rawData = task._rawData || {};
        const participants = rawData.participants || [];
        
        let taskEndDate: Date | null = null;
        if (rawData.endDate) taskEndDate = new Date(rawData.endDate);
        
        let taskStartDate: Date | null = null;
        if (rawData.startDate) taskStartDate = new Date(rawData.startDate);
        
        if (participants.some((p: any) => p.id === currentUserId)) myTasks++;
        if (!task.completed && taskEndDate && taskEndDate < today) overdue++;
        if (taskStartDate && taskEndDate && taskStartDate <= weekFromNow && taskEndDate >= today) thisWeek++;
        if (task.flag) flagged++;
        if (task.type === 'milestone') milestones++;
        if (task.completed) completed++;
      });
    });
    
    return { myTasks, overdue, thisWeek, flagged, milestones, completed, total };
  }, [tasks, user?.id]);

  // Load Gantt data when projectId changes
  useEffect(() => {
    if (projectId) {
      loadGanttData();
    }
  }, [projectId]);

  // Initialize custom scrollbar position when timeline loads
  useEffect(() => {
    if (timelineScrollRef.current && !isLoading) {
      const el = timelineScrollRef.current;
      const thumbWidth = Math.max(10, (el.clientWidth / el.scrollWidth) * 100);
      setScrollPosition({ left: 0, width: thumbWidth });
    }
  }, [isLoading, weeks]);

  // Reload when resolution changes
  useEffect(() => {
    if (projectId && !isLoading) {
      loadGanttData();
    }
  }, [timeResolution]);

  // Reload when refreshKey changes (e.g., after timer stops to update spentHours)
  useEffect(() => {
    if (refreshKey && refreshKey > 0 && projectId && !isLoading) {
      console.log('[GANTT] Refresh triggered by refreshKey:', refreshKey);
      loadGanttData();
    }
  }, [refreshKey]);

  const loadGanttData = async () => {
    if (!projectId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch full project details (includes milestones with activity/task links)
      const projectDetailResponse = await apiClient.get(ENDPOINTS.PROJECT_DETAIL(projectId));
      const projectDetail = (projectDetailResponse as any).result || projectDetailResponse;

      if (projectDetail) {
        setProjectName(projectDetail.name || 'Project');
        setProjectData(projectDetail); // Store full project data for participant hours lookup
      }

      // Convert resolution to lowercase for API
      const apiResolution = timeResolution.toLowerCase() as 'day' | 'week' | 'month';

      // Convert a date string of any common format to YYYY-MM-DD
      const toIsoDate = (raw: string): string => {
        if (!raw) return '';
        const s = raw.split('T')[0];
        // Already ISO: YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
        // MM/DD/YYYY
        const parts = s.split('/');
        if (parts.length === 3) {
          const [m, d, y] = parts;
          return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
        return s;
      };

      // Use project's own date range if available, otherwise use defaults
      const rawStart = projectDetail?.startDate || projectDetail?.start || '';
      const rawEnd = projectDetail?.endDate || projectDetail?.end || '';
      const queryStart = toIsoDate(rawStart);
      const queryEnd = toIsoDate(rawEnd);

      // Retry up to 3 times on transient API errors (501/500)
      let response: any;
      let lastErr: any;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          response = await dashboardApi.getGanttData(
            projectId,
            apiResolution,
            queryStart || undefined,
            queryEnd || undefined
          );
          break;
        } catch (err: any) {
          lastErr = err;
          const isTransient = err?.message?.includes('501') || err?.message?.includes('500') || err?.code === 'HTTP_501';
          if (isTransient && attempt < 2) {
            await new Promise(r => setTimeout(r, 600 * (attempt + 1)));
            continue;
          }
          throw err;
        }
      }

      // Fetch gantt-plus details to get spentHours per task
      let ganttDetails: any[] = [];
      try {
        const detailsResponse = await apiClient.get(`/queries/gantt-plus/${projectId}/details`);
        ganttDetails = (detailsResponse as any).result || detailsResponse || [];
        console.log('[GANTT] Fetched gantt-plus details:', ganttDetails);
      } catch (err) {
        console.warn('[GANTT] Could not fetch gantt-plus details:', err);
      }

      // Handle result wrapper - API returns { result: { activities: [...], ... } }
      const data = (response as any).result || response;

      // Store project date range from API
      const projectStart = data.firstDate || data.start || '';
      const projectEnd = data.lastDate || data.end || '';

      if (projectStart || projectEnd) {
        setProjectDateRange({
          start: projectStart,
          end: projectEnd
        });
      }

      // Parse project start for milestone week calculation
      const referenceDate = projectStart ? parseDateString(projectStart) : new Date();

      // Convert API data to UI format, passing gantt-plus details for spentHours
      const { activities } = convertGanttData(data, projectStart, ganttDetails);

      // Map project milestones to their linked activities/tasks
      if (projectDetail?.milestones && projectDetail.milestones.length > 0) {
        const today = new Date();

        projectDetail.milestones.forEach((m: any) => {
          const deliveryDate = m.deliveryDate || m.date || '';
          const milestoneDate = parseDateString(deliveryDate);

          // Calculate week offset from project start
          const week = milestoneDate && referenceDate
            ? Math.floor((milestoneDate.getTime() - referenceDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
            : 0;

          // Determine status
          let status: 'upcoming' | 'completed' | 'overdue' = 'upcoming';
          if (m.done) {
            status = 'completed';
          } else if (milestoneDate && milestoneDate < today) {
            status = 'overdue';
          }

          const milestoneData = {
            id: m.id,
            name: m.name,
            week,
            status,
            color: m.color || '#3B82F6',
            dueDate: deliveryDate
          };

          // Find linked activity or task and add milestone
          const linkedActivityId = m.activity?.id;
          const linkedTaskId = m.task?.id;

          if (linkedActivityId) {
            const activity = activities.find(a => a.id === linkedActivityId);
            if (activity) {
              if (!activity.milestones) activity.milestones = [];
              activity.milestones.push(milestoneData);
            }
          }

          if (linkedTaskId) {
            for (const activity of activities) {
              const task = activity.children?.find(t => t.id === linkedTaskId);
              if (task) {
                if (!task.milestones) task.milestones = [];
                task.milestones.push(milestoneData);
                break;
              }
            }
          }

          // If no specific link, add to first activity as fallback
          if (!linkedActivityId && !linkedTaskId && activities.length > 0) {
            if (!activities[0].milestones) activities[0].milestones = [];
            activities[0].milestones.push(milestoneData);
          }
        });
      }

      setTasks(activities);
      // Use generateTimePeriods with project start AND end date for proper timeline coverage
      const generatedWeeks = generateTimePeriods(0, timeResolution, projectStart, projectEnd);
      setWeeks(generatedWeeks);

      // Expand all activities by default
      if (activities.length > 0) {
        const allActivityIds = new Set(activities.map(a => a.id));
        setExpandedActivities(allActivityIds);

        // Also update tasks with expanded state
        setTasks(activities.map(a => ({ ...a, expanded: true })));
      }

      // Sync project tasks to unified context for cross-view access
      fetchProjectTasks(projectId).catch(err => {
        console.warn('[GANTT] Could not sync to unified context:', err);
      });

    } catch (err: any) {
      console.error('Failed to load Gantt data:', err);
      setError('Failed to load project timeline');
    } finally {
      setIsLoading(false);
    }
  };

  // Convert API data to Gantt UI format
  const convertGanttData = (data: any, projectStartDate?: string, ganttDetails?: any[]): { activities: GanttActivity[] } => {
    const activities: GanttActivity[] = [];

    // Parse project start date for week offset calculation
    const projectStart = projectStartDate ? parseDateString(projectStartDate) : new Date();
    const referenceDate = projectStart || new Date();

    // Create a map of task ID to spent hours from gantt-plus details
    const taskDetailsMap = new Map<string, any>();
    if (ganttDetails && Array.isArray(ganttDetails)) {
      // Log first detail to see its structure
      if (ganttDetails.length > 0) {
        console.log('[GANTT] First gantt-plus detail structure:', ganttDetails[0]);
        console.log('[GANTT] Detail keys:', Object.keys(ganttDetails[0]));
      }

      ganttDetails.forEach((detail: any) => {
        // The API returns task_id (with underscore)
        const taskId = detail.task_id || detail.task || detail.taskId || detail.id;
        if (taskId) {
          taskDetailsMap.set(taskId, detail);
        }
      });
      console.log('[GANTT] Task details map created with', taskDetailsMap.size, 'entries');
    }

    // Get activities array from data
    const apiActivities = data.activities || data.ganttContents || [];

    // Convert activities recursively
    const convertActivity = (actData: any, depth: number = 0): GanttActivity => {
      const activityTasks: GanttTask[] = [];
      
      // Convert tasks
      if (actData.tasks && actData.tasks.length > 0) {
        actData.tasks.forEach((taskData: any) => {
          // Look up spent hours from gantt-plus details
          const taskDetail = taskDetailsMap.get(taskData.id);

          // Add activity context and merge hours from gantt-plus details
          const taskWithContext = {
            ...taskData,
            activityId: actData.id,
            activityName: actData.name,
            // Merge spentHours and plannedHours from gantt-plus details if available
            spentHours: taskDetail?.spentHours ?? taskData.spentHours ?? 0,
            // Use availableHours from details as the planned allocation
            availableHours: taskDetail?.availableHours ?? taskData.availableHours ?? taskData.plannedHours ?? 0,
            plannedHours: taskDetail?.plannedHours ?? taskData.plannedHours ?? taskData.availableHours ?? 0
          };

          if (taskDetail) {
            console.log(`[GANTT] Task "${taskData.name}" detail found:`, taskDetail);
            console.log(`[GANTT] Task "${taskData.name}" full taskData:`, taskData);
          }

          const task = convertTask(taskWithContext, referenceDate);
          activityTasks.push(task);
        });
      }
      
      // Calculate activity bar from child dates or activity dates
      let actStartWeek = 0;
      let actEndWeek = 4;
      
      if (activityTasks.length > 0) {
        actStartWeek = Math.min(...activityTasks.map(t => t.startWeek));
        actEndWeek = Math.max(...activityTasks.map(t => t.startWeek + t.durationWeeks));
      } else if (actData.startDate || actData.start) {
        actStartWeek = dateToWeekFromReference(actData.startDate || actData.start, referenceDate);
        actEndWeek = dateToWeekFromReference(actData.endDate || actData.end, referenceDate);
        if (actEndWeek <= actStartWeek) actEndWeek = actStartWeek + 4;
      }
      
      const colors = ['#60A5FA', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
      const colorIndex = depth % colors.length;
      
      return {
        id: actData.id,
        type: 'activity',
        name: actData.name,
        duration: actData.plannedHours ? `${actData.plannedHours}h` : '',
        borderColor: colors[colorIndex],
        expanded: true,
        taskCount: activityTasks.length,
        startWeek: actStartWeek,
        durationWeeks: Math.max(1, actEndWeek - actStartWeek),
        barColor: colors[colorIndex],
        children: activityTasks,
        milestones: actData.milestones?.map((m: any) => ({
          id: m.id,
          name: m.name,
          week: dateToWeekFromReference(m.date || m.dueDate, referenceDate),
          status: m.done ? 'completed' : 'upcoming'
        }))
      };
    };
    
    // Process activities (collect all, then deduplicate by ID)
    const seenIds = new Set<string>();
    const addActivity = (act: GanttActivity) => {
      if (!seenIds.has(act.id)) {
        seenIds.add(act.id);
        activities.push(act);
      }
    };

    if (Array.isArray(apiActivities)) {
      apiActivities.forEach((actData: any, idx: number) => {
        addActivity(convertActivity(actData, idx));

        // Also process nested activities if any
        if (actData.activities && actData.activities.length > 0) {
          actData.activities.forEach((subAct: any, subIdx: number) => {
            addActivity(convertActivity(subAct, subIdx + 1));
          });
        }
      });
    }
    
    // console.log('Final activities:', activities);
    return { activities };
  };

  // Convert a single task from API to UI format
  const convertTask = (taskData: any, referenceDate: Date): GanttTask => {
    const startDate = taskData.startDate || taskData.start;
    const endDate = taskData.endDate || taskData.end;

    const startWeek = dateToWeekFromReference(startDate, referenceDate);
    const endWeek = dateToWeekFromReference(endDate, referenceDate);
    const durationWeeks = Math.max(1, endWeek - startWeek);

    const spent = parseFloat(taskData.spentHours || '0');
    const planned = parseFloat(taskData.availableHours || taskData.plannedHours || '0');
    const progress = planned > 0 ? Math.min(100, Math.round((spent / planned) * 100)) : 0;

    // Determine status
    const taskStartDate = parseDateString(startDate);
    const taskEndDate = parseDateString(endDate);
    const today = new Date();
    const isOverdue = !taskData.done && taskEndDate && taskEndDate < today;

    // Detect out-of-schedule work (work performed outside task's scheduled dates)
    // If task is overdue and has time spent, work was done after the scheduled end
    const hasOutOfScheduleWork = (isOverdue && spent > 0) ||
      (taskStartDate && taskStartDate > today && spent > 0);

    // Debug: Log task data including hours for coloring
    console.log(`[GANTT] Task "${taskData.name}" hours for coloring:`, {
      spentHours: spent,
      plannedHours: planned,
      percentUsed: planned > 0 ? ((spent / planned) * 100).toFixed(1) + '%' : 'N/A',
      done: taskData.done,
      isOverdue,
      hasOutOfScheduleWork
    });

    // Calculate bar color based on time spent vs planned
    const getBarColorByTime = (): string => {
      // Completed tasks are green
      if (taskData.done) return '#10B981';

      // Calculate percentage of time used
      const percentUsed = planned > 0 ? (spent / planned) * 100 : 0;

      // Over budget (>100%) - Red (regardless of due date)
      if (percentUsed > 100) return '#EF4444';

      // If task has time logged, use time-based coloring (not overdue status)
      if (spent > 0 && planned > 0) {
        // Warning zone (75-100%) - Orange/Amber
        if (percentUsed >= 75) return '#F59E0B';

        // Good progress (25-75%) - Blue
        if (percentUsed >= 25) return '#60A5FA';

        // Just started or low progress (<25%) - Light blue
        return '#93C5FD';
      }

      // Overdue tasks with no progress are red (needs attention)
      if (isOverdue) return '#EF4444';

      // No planned hours or no time spent yet - light blue (unallocated/not started)
      return '#93C5FD';
    };
    
    // Convert participants with full info for modal
    // Preserve both flattened fields AND user object for compatibility
    const participantsWithDetails = taskData.participants?.map((p: any) => ({
      // Keep original user object for nested access
      user: p.user,
      // Also flatten for direct access
      id: p.user?.id || p.id,
      firstName: p.user?.firstName || '',
      lastName: p.user?.lastName || '',
      fullName: p.user?.fullName || `${p.user?.firstName || ''} ${p.user?.lastName || ''}`.trim(),
      email: p.user?.email || '',
      avatar: p.user?.avatar,
      role: p.user?.rol,
      isOwner: p.isOwner,
      isLeader: p.isLeader,
      availableHours: p.availableHours,
      plannedHours: p.plannedSchedule?.[0]?.plannedHours || p.plannedHours,
      spentHours: p.spentHours,
      column: p.column?.name
    })) || [];
    
    // Format hours display - show spent/planned or just spent if no planned
    const formatHoursDisplay = () => {
      if (spent > 0 && planned > 0) {
        return `${spent.toFixed(1)}/${planned}h`;
      } else if (spent > 0) {
        return `${spent.toFixed(1)}h`;
      } else if (planned > 0) {
        return `0/${planned}h`;
      }
      return undefined;
    };

    return {
      id: taskData.id,
      name: taskData.name,
      startWeek,
      durationWeeks,
      progress,
      completed: taskData.done,
      barColor: (() => {
        const color = getBarColorByTime();
        console.log(`[GANTT] Task "${taskData.name}" barColor:`, color, `(progress: ${progress})`);
        return color;
      })(),
      hours: formatHoursDisplay(),
      hoursColor: (spent > planned && planned > 0) ? '#EF4444' : (spent > 0 ? '#10B981' : '#6B7280'),
      avatars: participantsWithDetails.map((p: any) => 
        `${p.firstName.charAt(0)}${p.lastName.charAt(0)}`.toUpperCase() || '?'
      ),
      status: taskData.done ? 'completed' : isOverdue ? 'overdue' : 'upcoming',
      timeExceeded: spent > planned,
      // Striped pattern for out-of-schedule work (work done outside scheduled dates)
      striped: hasOutOfScheduleWork,
      // Store raw data for modal
      _rawData: {
        ...taskData,
        participants: participantsWithDetails,
        startDate,
        endDate,
        spentHours: spent,
        plannedHours: planned
      }
    };
  };

  // Helper: Calculate week offset from a reference date (project start)
  const dateToWeekFromReference = (dateStr: string, referenceDate: Date): number => {
    if (!dateStr) return 0;
    
    const date = parseDateString(dateStr);
    if (!date) return 0;
    
    const diffTime = date.getTime() - referenceDate.getTime();
    const diffWeeks = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000));
    
    return diffWeeks;
  };

  // Helper: Parse date string (DD/MM/YYYY or ISO format)
  const parseDateString = (dateStr: string | undefined): Date | null => {
    if (!dateStr) return null;
    
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    return new Date(dateStr);
  };

  // Helper: Get ISO week number
  const getISOWeek = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  // Helper: Convert date string to week offset from today
  // Returns the week index in the timeline (0 = first visible week)
  const dateToWeekOffset = (dateStr: string, today: Date, startOffset: number): number => {
    if (!dateStr) return 0;
    
    // Handle DD/MM/YYYY format
    let date: Date;
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    } else {
      date = new Date(dateStr);
    }
    
    // Calculate difference in weeks from today
    const diffTime = date.getTime() - today.getTime();
    const diffWeeks = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000));
    
    // startOffset is negative (e.g., -10), so we add it
    // Timeline starts at week index 0 which represents (today + startOffset weeks)
    // If startOffset = -10, then week 0 = today - 10 weeks
    // A task at today would be at week index 10
    // A task at today - 5 weeks would be at week index 5
    return diffWeeks - startOffset;
  };

  // Update task (for drag/resize/edit)
  const handleUpdateTask = async (taskId: string, updates: any) => {
    // Update local state immediately for responsive UI
    setTasks(prevTasks =>
      prevTasks.map(activity => {
        if (activity.id === taskId) {
          return { ...activity, ...updates };
        }
        if (activity.children) {
          return {
            ...activity,
            children: activity.children.map(child =>
              child.id === taskId ? { ...child, ...updates } : child
            )
          };
        }
        return activity;
      })
    );

    // Call API to persist changes
    try {
      // Build API payload - only include fields that were actually updated
      const apiPayload: any = { id: taskId };

      if (updates.availableHours !== undefined) {
        apiPayload.availableHours = String(updates.availableHours);
      }
      if (updates.plannedHours !== undefined) {
        apiPayload.plannedHours = String(updates.plannedHours);
      }
      if (updates.name !== undefined) {
        apiPayload.name = updates.name;
      }
      if (updates.description !== undefined) {
        apiPayload.description = updates.description;
      }
      if (updates.progress !== undefined) {
        apiPayload.progress = updates.progress;
      }

      // Only call API if there are fields to update (not just UI state like startWeek)
      if (Object.keys(apiPayload).length > 1) {
        apiPayload.projectId = projectId;  // Required for mock endpoint
        console.log('[GANTT] Updating task via API:', apiPayload);
        await apiClient.post('/commands/mocks/update-project-task', apiPayload);
        console.log('[GANTT] Task update queued');
      }
    } catch (error) {
      console.error('[GANTT] Failed to update task:', error);
    }
  };

  // Update milestone position
  const handleUpdateMilestone = (activityId: string, milestoneId: string, newWeek: number) => {
    setTasks(prevTasks =>
      prevTasks.map(activity => {
        // Check if milestone is on the activity itself
        if (activity.id === activityId && activity.milestones) {
          return {
            ...activity,
            milestones: activity.milestones.map(milestone =>
              milestone.id === milestoneId 
                ? { ...milestone, week: newWeek }
                : milestone
            )
          };
        }
        
        // Check if milestone is on a child task
        if (activity.children) {
          const updatedChildren = activity.children.map(child => {
            if (child.id === activityId && child.milestones) {
              return {
                ...child,
                milestones: child.milestones.map(milestone =>
                  milestone.id === milestoneId
                    ? { ...milestone, week: newWeek }
                    : milestone
                )
              };
            }
            return child;
          });
          
          if (updatedChildren !== activity.children) {
            return { ...activity, children: updatedChildren };
          }
        }
        
        return activity;
      })
    );
  };

  // Update flag position
  const handleUpdateFlag = (taskId: string, newWeek: number) => {
    setTasks(prevTasks =>
      prevTasks.map(activity => {
        if (activity.children) {
          return {
            ...activity,
            children: activity.children.map(child =>
              child.id === taskId ? { ...child, flagWeek: newWeek } : child
            )
          };
        }
        return activity;
      })
    );
  };

  // Handle creating a new task under an activity - opens modal
  const handleCreateTask = (activityId: string) => {
    // Find activity name for display
    const activity = tasks.find(t => t.id === activityId);
    const activityName = activity?.name || 'Activity';
    setTaskCreateModal({ activityId, activityName });
  };

  // Save task from modal
  const handleSaveTask = async (taskData: any) => {
    if (!projectId) return;

    console.log('[GANTT] Creating task with data:', taskData);

    // Extract participants before creating task
    const participants = taskData.participants || [];
    delete taskData.participants;

    // Create task via mock endpoint (Angular pattern)
    taskData.projectId = projectId;
    await apiClient.post('/commands/mocks/create-project-task', taskData);
    console.log('[GANTT] Task created, now adding participants...');

    // Add participants via separate mock endpoint (Angular pattern)
    for (const participant of participants) {
      // Get the hours - check all possible field names
      const hours = participant.allocatedHours || participant.plannedHours || participant.availableHours || '0';
      console.log('[GANTT] Participant raw data:', participant);
      console.log('[GANTT] Hours value:', hours);

      const participantPayload = {
        projectId: projectId,
        taskId: taskData.id,
        userId: participant.userId || participant.user?.id,
        isOwner: String(participant.isOwner === true || participant.isOwner === 'true'),
        position: participant.position || 0,
        availableHours: String(hours),
        plannedHours: String(hours)
      };
      console.log('[GANTT] Adding participant with payload:', participantPayload);
      await apiClient.post('/commands/mocks/add-task-participant', participantPayload);
    }

    // Commit to persist
    console.log('[GANTT] Committing project...');
    await apiClient.post('/commands/sync/commit-project', { id: projectId });

    // Reload Gantt data
    console.log('[GANTT] Reloading Gantt data...');
    await loadGanttData();
  };

  // Handle creating a new activity
  const handleCreateActivity = async () => {
    const activityName = window.prompt('Enter activity name:');
    if (!activityName || !activityName.trim() || !projectId) return;

    try {
      const newActivityId = crypto.randomUUID();
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 14); // 2 weeks duration

      const formatDate = (d: Date) => {
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      };

      // Create activity via mock endpoint (Angular pattern)
      await apiClient.post('/commands/mocks/create-project-activity', {
        id: newActivityId,
        projectId: projectId,
        project: { id: projectId },
        name: activityName.trim(),
        startDate: formatDate(today),
        endDate: formatDate(endDate),
        plannedHours: 0,
        color: '#60A5FA'
      });

      // Commit to persist
      await apiClient.post('/commands/sync/commit-project', { id: projectId });

      // Reload Gantt data
      await loadGanttData();
    } catch (error) {
      console.error('Failed to create activity:', error);
      alert('Failed to create activity. Please try again.');
    }
  };

  // Handle task click to open modal - fetch fresh data from API
  const handleTaskClick = async (task: any) => {

    // Show modal immediately with cached data
    const cachedModalData = {
      id: task.id,
      name: task.name,
      progress: task.progress || 0,
      completed: task.completed,
      status: task.status,
      startDate: task._rawData?.startDate,
      endDate: task._rawData?.endDate,
      spentHours: task._rawData?.spentHours || 0,
      plannedHours: task._rawData?.plannedHours || 0,
      participants: task._rawData?.participants || [],
      description: task._rawData?.description || '',
      tags: task._rawData?.tags || [],
      checklist: task._rawData?.checklist || [],
      activityId: task._rawData?.activityId,
      activityName: task._rawData?.activityName,
      projectId: projectId,
      projectName: projectName,
      flag: task.flag,
      avatars: task.avatars,
      _isLoading: true
    };
    setSelectedTask(cachedModalData);

    // Fetch fresh task data from API to get accurate spentHours
    // Also refresh in unified context for cross-view sync
    try {
      const [freshTaskData, unifiedTask] = await Promise.all([
        apiClient.get(`/queries/tasks/${task.id}`) as Promise<any>,
        refreshTask(task.id).catch(() => undefined) // Non-blocking context refresh
      ]);
      console.log('[GANTT] Fresh task data:', freshTaskData);
      console.log('[GANTT] Unified task refreshed:', unifiedTask?.id);
      console.log('[GANTT] Fresh task participants:', freshTaskData?.participants);

      // Map participants with full details including spentHours from API
      // Use fresh data if available, otherwise fall back to cached Gantt data
      const freshParticipants = freshTaskData.participants || [];
      const cachedParticipants = task._rawData?.participants || [];

      // Also try to get participants from project data (most reliable source)
      let projectParticipants: any[] = [];
      if (projectData?.activities) {
        for (const activity of projectData.activities) {
          for (const t of (activity.tasks || [])) {
            if (t.id === task.id && t.participants?.length > 0) {
              projectParticipants = t.participants;
              console.log('[GANTT] Found participants in project data:', projectParticipants);
              break;
            }
          }
          if (projectParticipants.length > 0) break;
        }
      }

      // Priority: fresh API data > project detail data > cached Gantt data
      const sourceParticipants = freshParticipants.length > 0 ? freshParticipants :
                                  projectParticipants.length > 0 ? projectParticipants :
                                  cachedParticipants;

      console.log('[GANTT] Source participants (final):', sourceParticipants);

      // If using cached, try to get spentHours from fresh task data at task level
      const taskLevelSpentHours = parseFloat(freshTaskData.spentHours || '0');

      // Create a map of cached participant hours by user ID for fallback
      const cachedHoursMap = new Map<string, { availableHours?: string; plannedHours?: string; spentHours?: string }>();
      cachedParticipants.forEach((cp: any) => {
        const cpId = cp.user?.id || cp.id;
        if (cpId) {
          cachedHoursMap.set(cpId, {
            availableHours: cp.availableHours,
            plannedHours: cp.plannedHours || cp.plannedSchedule?.[0]?.plannedHours,
            spentHours: cp.spentHours
          });
        }
      });

      // Also look up participant hours from project data (most reliable source)
      // Project detail endpoint includes full participant data with hours
      const projectHoursMap = new Map<string, { availableHours?: string; plannedHours?: string }>();
      if (projectData?.activities) {
        for (const activity of projectData.activities) {
          for (const t of (activity.tasks || [])) {
            if (t.id === task.id) {
              // Found the task in project data - extract participant hours
              (t.participants || []).forEach((p: any) => {
                const pId = p.user?.id || p.userId || p.id;
                if (pId) {
                  projectHoursMap.set(pId, {
                    availableHours: p.availableHours,
                    plannedHours: p.plannedHours
                  });
                }
              });
              break;
            }
          }
        }
      }

      const participantsWithDetails = sourceParticipants.map((p: any) => {
        const participantId = p.user?.id || p.id;

        // Get hours from fresh data, or fall back to cached data, or project data
        const cachedHours = cachedHoursMap.get(participantId);
        const projectHours = projectHoursMap.get(participantId);
        // Priority: fresh API data > project detail data > cached Gantt data
        const availableHours = p.availableHours || p.allocatedHours || p.hours || projectHours?.availableHours || cachedHours?.availableHours;
        const plannedHours = p.plannedSchedule?.[0]?.plannedHours || p.plannedHours || p.allocatedHours || p.availableHours || projectHours?.plannedHours || cachedHours?.plannedHours;
        const spentHours = p.spentHours || cachedHours?.spentHours;

        return {
          id: participantId,
          firstName: p.user?.firstName || p.firstName || '',
          lastName: p.user?.lastName || p.lastName || '',
          fullName: p.user?.fullName || p.fullName || `${p.user?.firstName || p.firstName || ''} ${p.user?.lastName || p.lastName || ''}`.trim(),
          email: p.user?.email || p.email || '',
          avatar: p.user?.avatar || p.avatar,
          role: p.user?.rol || p.role,
          isOwner: p.isOwner,
          isLeader: p.isLeader,
          availableHours,
          plannedHours,
          spentHours,
          column: p.column?.name
        };
      });

      // Update modal with fresh data
      const freshModalData = {
        ...cachedModalData,
        spentHours: parseFloat(freshTaskData.spentHours || '0'),
        plannedHours: parseFloat(freshTaskData.availableHours || freshTaskData.plannedHours || '0'),
        participants: participantsWithDetails,
        description: freshTaskData.description || cachedModalData.description,
        tags: freshTaskData.tags || cachedModalData.tags,
        checklist: freshTaskData.checklist || cachedModalData.checklist,
        _isLoading: false
      };

      setSelectedTask(freshModalData);
    } catch (error) {
      console.error('[GANTT] Failed to fetch fresh task data:', error);
      // Keep showing cached data but mark as not loading
      setSelectedTask({ ...cachedModalData, _isLoading: false });
    }
  };

  // Generate time periods based on offset, resolution, and project start date
  const generateTimePeriods = (offset: number, resolution: string, projectStart?: string, projectEnd?: string) => {
    // Parse project start date, default to today if not provided
    let baseDate: Date;
    if (projectStart) {
      const parsed = parseDateString(projectStart);
      baseDate = parsed || new Date();
    } else {
      baseDate = new Date();
    }
    
    const today = new Date();
    
    // Parse end date and add buffer for scrolling beyond tasks
    let endDate: Date;
    if (projectEnd) {
      const parsed = parseDateString(projectEnd);
      endDate = parsed || new Date();
      // Add 3 months buffer beyond project end
      endDate.setMonth(endDate.getMonth() + 3);
    } else {
      // Default to 2 years from start if no end date
      endDate = new Date(baseDate);
      endDate.setFullYear(endDate.getFullYear() + 2);
    }
    
    // Ensure today is always included in range
    if (today > endDate) {
      endDate = new Date(today);
      endDate.setMonth(endDate.getMonth() + 3);
    }
    
    if (resolution === 'Day') {
      // Day view: Calculate days needed from start to end
      const daysDiff = Math.ceil((endDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
      const periodCount = Math.max(42, daysDiff + 30); // At least 6 weeks, plus 30 day buffer
      const days = [];
      
      for (let i = 0; i < periodCount; i++) {
        const dayDate = new Date(baseDate);
        dayDate.setDate(baseDate.getDate() + offset + i);
        
        const weekday = dayDate.toLocaleDateString('en-US', { weekday: 'short' }).substring(0, 2);
        const day = dayDate.getDate();
        const month = dayDate.toLocaleDateString('en-US', { month: 'short' });
        const year = dayDate.getFullYear();
        
        // Calculate week number
        const firstDayOfYear = new Date(year, 0, 1);
        const pastDaysOfYear = (dayDate.getTime() - firstDayOfYear.getTime()) / 86400000;
        const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        
        const isToday = dayDate.toDateString() === today.toDateString();
        
        days.push({
          label: `${weekday} ${day}`,
          isToday,
          date: dayDate,
          weekNumber,
          month,
          year,
          isMonday: dayDate.getDay() === 1
        });
      }
      
      return days;
    } else if (resolution === 'Week') {
      // Week view: Calculate weeks needed from start to end
      const weeksDiff = Math.ceil((endDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
      const periodCount = Math.max(52, weeksDiff + 12); // At least 1 year, plus 12 week buffer
      const weeks = [];
      
      for (let i = 0; i < periodCount; i++) {
        const weekDate = new Date(baseDate);
        weekDate.setDate(baseDate.getDate() + (offset * 7) + (i * 7));
        
        const month = weekDate.toLocaleDateString('en-US', { month: 'long' });
        const year = weekDate.getFullYear();
        
        // Calculate week number
        const firstDayOfYear = new Date(year, 0, 1);
        const pastDaysOfYear = (weekDate.getTime() - firstDayOfYear.getTime()) / 86400000;
        const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        
        const weekStart = new Date(weekDate);
        const weekEnd = new Date(weekDate);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const isToday = today >= weekStart && today <= weekEnd;
        
        weeks.push({
          label: `W${weekNumber}`,
          isToday,
          date: weekDate,
          weekNumber,
          month,
          year,
          isFirstOfMonth: weekDate.getDate() <= 7
        });
      }
      
      return weeks;
    } else { // Month
      // Month view: Calculate months needed from start to end
      const monthsDiff = (endDate.getFullYear() - baseDate.getFullYear()) * 12 + (endDate.getMonth() - baseDate.getMonth());
      const periodCount = Math.max(12, monthsDiff + 6); // At least 1 year, plus 6 month buffer
      const months = [];
      
      for (let i = 0; i < periodCount; i++) {
        const monthDate = new Date(baseDate);
        const monthOffset = Math.floor(offset / 30);
        monthDate.setMonth(baseDate.getMonth() + monthOffset + i);
        monthDate.setDate(1);
        
        const month = monthDate.toLocaleDateString('en-US', { month: 'short' });
        const year = monthDate.getFullYear();
        
        const monthStart = new Date(monthDate);
        const monthEnd = new Date(monthDate);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        monthEnd.setDate(0);
        const isToday = today >= monthStart && today <= monthEnd;
        
        months.push({
          label: month,
          isToday,
          date: monthDate,
          month,
          year,
          isFirstOfYear: monthDate.getMonth() === 0
        });
      }
      
      return months;
    }
  };

  // Initialize weeks with generateTimePeriods if not loaded from API
  useEffect(() => {
    if (weeks.length === 0 && projectDateRange?.start) {
      setWeeks(generateTimePeriods(0, timeResolution, projectDateRange.start, projectDateRange.end));
    }
  }, [projectDateRange]);

  const handleNavigateBackward = () => {
    let step = 4;
    if (timeResolution === 'Day') step = 7; // Move by week in day view
    if (timeResolution === 'Month') step = 60; // Move by 2 months
    
    const newOffset = weekOffset - step;
    setWeekOffset(newOffset);
    setWeeks(generateTimePeriods(newOffset, timeResolution, projectDateRange?.start, projectDateRange?.end));
  };

  const handleNavigateForward = () => {
    let step = 4;
    if (timeResolution === 'Day') step = 7; // Move by week in day view
    if (timeResolution === 'Month') step = 60; // Move by 2 months
    
    const newOffset = weekOffset + step;
    setWeekOffset(newOffset);
    setWeeks(generateTimePeriods(newOffset, timeResolution, projectDateRange?.start, projectDateRange?.end));
  };

  const handleGoToToday = () => {
    // Calculate today's position relative to project start
    const today = new Date();
    let projectStart: Date;
    
    if (projectDateRange?.start) {
      const parsed = parseDateString(projectDateRange.start);
      projectStart = parsed || new Date();
    } else {
      projectStart = new Date();
    }
    
    // Calculate days from project start to today
    const daysDiff = Math.floor((today.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate column position based on resolution
    let columnPosition = 0;
    let columnWidth = 160; // Default week width
    
    if (timeResolution === 'Day') {
      columnPosition = daysDiff;
      columnWidth = 60;
    } else if (timeResolution === 'Week') {
      columnPosition = Math.floor(daysDiff / 7);
      columnWidth = 160;
    } else { // Month
      columnPosition = Math.floor(daysDiff / 30);
      columnWidth = 240;
    }
    
    // Apply zoom
    const scaledWidth = Math.round(columnWidth * (zoomLevel / 100));
    
    // Scroll to today's position (center it in view)
    if (timelineScrollRef.current) {
      const scrollTarget = Math.max(0, (columnPosition * scaledWidth) - (timelineScrollRef.current.clientWidth / 2));
      timelineScrollRef.current.scrollLeft = scrollTarget;
    }
    
    // Keep week offset at 0 to show full timeline
    setWeekOffset(0);
    setWeeks(generateTimePeriods(0, timeResolution, projectDateRange?.start, projectDateRange?.end));
  };

  // Update weeks when resolution changes
  React.useEffect(() => {
    setWeekOffset(0); // Reset offset when changing resolution
    setWeeks(generateTimePeriods(0, timeResolution, projectDateRange?.start, projectDateRange?.end));
  }, [timeResolution]);

  const toggleActivity = (id: string) => {
    const newExpanded = new Set(expandedActivities);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedActivities(newExpanded);
    
    // Update tasks with new expanded state
    setTasks(prevTasks =>
      prevTasks.map(task => ({
        ...task,
        expanded: newExpanded.has(task.id)
      }))
    );
  };

  const handleRemoveFilter = (filterId: string) => {
    const newFilters = new Set(activeFilters);
    newFilters.delete(filterId);
    setActiveFilters(newFilters);
  };

  const handleAddFilter = (filterId: string) => {
    const newFilters = new Set(activeFilters);
    newFilters.add(filterId);
    setActiveFilters(newFilters);
  };

  // Zoom handlers
  const handleZoomIn = () => {
    setZoomLevel(prev => {
      if (prev >= 150) return 150; // Max zoom
      if (prev >= 125) return 150;
      if (prev >= 100) return 125;
      if (prev >= 75) return 100;
      return 75;
    });
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => {
      if (prev <= 50) return 50; // Min zoom
      if (prev <= 75) return 50;
      if (prev <= 100) return 75;
      if (prev <= 125) return 100;
      return 125;
    });
  };

  // Calculate task list column width based on zoom
  const TASK_LIST_WIDTH = Math.round(400 + (zoomLevel - 50) * 3); // 50%→400px, 100%→550px, 150%→700px

  // Synchronized scrolling
  const handleTimelineScroll = () => {
    if (timelineScrollRef.current && taskListScrollRef.current && timelineHeaderScrollRef.current) {
      // Sync vertical scroll with task list
      taskListScrollRef.current.scrollTop = timelineScrollRef.current.scrollTop;
      // Sync horizontal scroll with header
      timelineHeaderScrollRef.current.scrollLeft = timelineScrollRef.current.scrollLeft;
      
      // Update custom scrollbar position
      const el = timelineScrollRef.current;
      const maxScroll = el.scrollWidth - el.clientWidth;
      const thumbWidth = Math.max(10, (el.clientWidth / el.scrollWidth) * 100);
      const thumbLeft = maxScroll > 0 ? (el.scrollLeft / maxScroll) * (100 - thumbWidth) : 0;
      setScrollPosition({ left: thumbLeft, width: thumbWidth });
    }
  };

  const handleTaskListScroll = () => {
    if (timelineScrollRef.current && taskListScrollRef.current) {
      // Only sync vertical scroll
      timelineScrollRef.current.scrollTop = taskListScrollRef.current.scrollTop;
    }
  };

  const handleTimelineHeaderScroll = () => {
    if (timelineHeaderScrollRef.current && timelineScrollRef.current) {
      // Sync horizontal scroll
      timelineScrollRef.current.scrollLeft = timelineHeaderScrollRef.current.scrollLeft;
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', background: '#FFFFFF', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* TOP BAR - 60px */}
      <GanttTopBar 
        onBack={onClose}
        projectName={projectName}
        onOpenComments={() => {
          setProjectPanelTab('comments');
          setProjectPanelOpen(true);
        }}
        onOpenFiles={() => {
          setProjectPanelTab('files');
          setProjectPanelOpen(true);
        }}
        onEditProject={() => {
          setWizardMode('edit');
          setShowWizard(true);
        }}
        onOpenBoard={() => setShowBoard(true)}
      />

      {/* TOOLBAR - 52px */}
      <GanttToolbar 
        timeResolution={timeResolution}
        onTimeResolutionChange={setTimeResolution}
        onToggleLegend={() => setShowLegend(!showLegend)}
        onNavigateBackward={handleNavigateBackward}
        onNavigateForward={handleNavigateForward}
        onGoToToday={handleGoToToday}
        zoomLevel={zoomLevel}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onCreateProject={() => {
          setWizardMode('create');
          setShowWizard(true);
        }}
        dateRange={projectDateRange}
      />

      {/* FILTER CHIP BAR - 44px */}
      <GanttFilterBar
        activeFilters={activeFilters}
        onRemoveFilter={handleRemoveFilter}
        onAddFilter={handleAddFilter}
        filterCounts={filterCounts}
      />

      {/* Loading State */}
      {isLoading && (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          height: 'calc(100% - 156px)',
          gap: '16px'
        }}>
          <Loader2 style={{ width: '40px', height: '40px', color: '#60A5FA', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: '#6B7280', fontSize: '14px' }}>Loading project timeline...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: 'calc(100% - 156px)',
          gap: '12px'
        }}>
          <p style={{ color: '#EF4444', fontSize: '14px' }}>{error}</p>
          <button
            onClick={loadGanttData}
            style={{
              padding: '8px 16px',
              background: '#60A5FA',
              color: 'white',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* MAIN GANTT AREA - Full Width */}
      {!isLoading && !error && (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        flex: 1,
        overflow: 'hidden'
      }}>
        {/* COLUMN HEADERS - Fixed height */}
        <div style={{
          display: 'flex',
          height: '68px',
          flexShrink: 0,
          background: 'white',
          borderBottom: '1px solid #E5E7EB'
        }}>
          {/* Task List Header */}
          <div style={{
            width: `${TASK_LIST_WIDTH}px`,
            height: '68px',
            flexShrink: 0,
            background: '#F9FAFB',
            borderRight: '2px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px'
          }}>
            <span style={{ 
              fontSize: '13px', 
              fontWeight: 600, 
              color: '#6B7280',
              textTransform: 'uppercase',
              letterSpacing: '0.3px'
            }}>
              Tasks & Activities
            </span>
            
            {/* New Activity Button */}
            <button
              style={{
                height: '36px',
                padding: '0 14px',
                background: 'white',
                color: '#60A5FA',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 150ms ease',
                whiteSpace: 'nowrap'
              }}
              onClick={handleCreateActivity}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#60A5FA';
                e.currentTarget.style.borderColor = '#60A5FA';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.borderColor = '#E5E7EB';
                e.currentTarget.style.color = '#60A5FA';
              }}
            >
              <Plus size={16} />
              New Activity
            </button>
          </div>

          {/* Timeline Header - Two-tier with horizontal scroll */}
          <div style={{
            flex: 1,
            height: '68px',
            overflow: 'hidden',
            position: 'relative',
            minWidth: 0
          }}>
            <div 
              ref={timelineHeaderScrollRef}
              style={{
                width: '100%',
                height: 'calc(100% + 17px)',
                overflowX: 'scroll',
                overflowY: 'hidden'
              }}
            >
              <GanttTimelineHeader 
                weeks={weeks}
                timeResolution={timeResolution}
                zoomLevel={zoomLevel}
              />
            </div>
          </div>
        </div>

        {/* GANTT SPLIT PANE - Contains task list and timeline */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
          {/* TASK LIST COLUMN */}
          <GanttTaskList
            ref={taskListScrollRef}
            tasks={filteredTasks}
            onToggleActivity={toggleActivity}
            onScroll={handleTaskListScroll}
            hoveredTask={hoveredTask}
            onSetHoveredTask={setHoveredTask}
            onTaskClick={handleTaskClick}
            onCreateTask={handleCreateTask}
            zoomLevel={zoomLevel}
          />

          {/* TIMELINE COLUMN - Vertical scroll only, horizontal handled by custom scrollbar */}
          <div style={{ 
            flex: 1, 
            minWidth: 0, 
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <GanttTimeline
              ref={timelineScrollRef}
              weeks={weeks}
              tasks={filteredTasks}
              onScroll={handleTimelineScroll}
              hoveredTask={hoveredTask}
              onUpdateTask={handleUpdateTask}
              onTaskClick={handleTaskClick}
              weekOffset={weekOffset}
              timeResolution={timeResolution}
              onUpdateMilestone={handleUpdateMilestone}
              onUpdateFlag={handleUpdateFlag}
              zoomLevel={zoomLevel}
            />
          </div>
        </div>

        {/* CUSTOM HORIZONTAL SCROLLBAR - Fixed at bottom, always visible */}
        <div 
          style={{
            height: '20px',
            background: '#E5E7EB',
            borderTop: '2px solid #D1D5DB',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: `${TASK_LIST_WIDTH}px`,
            flexShrink: 0
          }}
        >
          <div
            style={{
              flex: 1,
              height: '14px',
              background: '#D1D5DB',
              borderRadius: '7px',
              margin: '0 8px',
              position: 'relative',
              cursor: 'pointer'
            }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const percentage = clickX / rect.width;
              if (timelineScrollRef.current) {
                const maxScroll = timelineScrollRef.current.scrollWidth - timelineScrollRef.current.clientWidth;
                timelineScrollRef.current.scrollLeft = percentage * maxScroll;
              }
            }}
          >
            {/* Scrollbar thumb */}
            <div
              style={{
                position: 'absolute',
                top: '2px',
                height: '10px',
                background: '#3B82F6',
                borderRadius: '5px',
                cursor: 'grab',
                minWidth: '60px',
                left: `${scrollPosition.left}%`,
                width: `${Math.max(5, scrollPosition.width)}%`,
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                const startX = e.clientX;
                const startScrollLeft = timelineScrollRef.current?.scrollLeft || 0;
                const trackWidth = e.currentTarget.parentElement?.clientWidth || 1;
                const maxScroll = (timelineScrollRef.current?.scrollWidth || 0) - (timelineScrollRef.current?.clientWidth || 0);
                
                const onMouseMove = (moveEvent: MouseEvent) => {
                  const deltaX = moveEvent.clientX - startX;
                  const scrollDelta = (deltaX / trackWidth) * maxScroll;
                  if (timelineScrollRef.current) {
                    timelineScrollRef.current.scrollLeft = startScrollLeft + scrollDelta;
                  }
                };
                
                const onMouseUp = () => {
                  document.removeEventListener('mousemove', onMouseMove);
                  document.removeEventListener('mouseup', onMouseUp);
                };
                
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
              }}
            />
          </div>
        </div>
      </div>
      )}

      {/* LEGEND TOOLTIP */}
      {showLegend && <GanttLegend onClose={() => setShowLegend(false)} />}

      {/* TASK DETAIL MODAL */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdateTask={handleUpdateTask}
        />
      )}

      {/* TASK CREATE MODAL */}
      {taskCreateModal && projectId && (
        <TaskCreateModal
          activityId={taskCreateModal.activityId}
          activityName={taskCreateModal.activityName}
          projectId={projectId}
          onClose={() => setTaskCreateModal(null)}
          onSave={handleSaveTask}
        />
      )}

      {/* PROJECT INFO PANEL */}
      <ProjectInfoPanel
        isOpen={projectPanelOpen}
        onClose={() => setProjectPanelOpen(false)}
        projectName={projectName}
        projectId={projectId}
        initialTab={projectPanelTab}
      />

      {/* PROJECT WIZARD DIALOG */}
      {showWizard && (
        <ProjectWizardDialog
          mode={wizardMode}
          projectId={wizardMode === 'edit' ? projectId : undefined}
          onClose={() => setShowWizard(false)}
          onSave={async (data) => {
            // Reload gantt data after save
            if (projectId) {
              await loadGanttData();
            }
          }}
        />
      )}

      {/* PROJECT BOARD */}
      {showBoard && (
        <ProjectBoard
          onClose={() => setShowBoard(false)}
          projectId={projectId}
          projectName={projectName}
        />
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1.0);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  );
}