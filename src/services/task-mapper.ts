/**
 * Task Mapper Service
 *
 * Converts API responses to the unified Task model.
 * Handles the various API response formats from different endpoints.
 */

import type {
  Task,
  TaskParticipant,
  ColumnData,
  importanceToPriority,
  columnToStatus,
  hoursToMinutes,
} from '../types/task';
import {
  importanceToPriority as toDisplayPriority,
  columnToStatus as toDisplayStatus,
  hoursToMinutes as convertHoursToMinutes,
} from '../types/task';

// ============================================================================
// API Response Types (what we receive from backend)
// ============================================================================

interface ApiTask {
  id: string;
  name: string;
  description?: string;
  position?: number;
  importance?: number;
  color?: string;
  billable?: boolean;
  timesheet?: boolean;
  done?: boolean;
  startDate?: string;
  endDate?: string;
  plannedHours?: string;
  availableHours?: string;
  spentHours?: string;
  numComments?: number;
  numFlags?: number;
  numAttachments?: number;
  numChecklist?: number;
  numChecklistDone?: number;
  activity?: {
    id: string;
    name: string;
    project?: {
      id: string;
      name: string;
      color?: string;
    };
  };
  participants?: ApiTaskParticipant[];
  labels?: Array<{ id: string; name: string; color: string }>;
  tags?: Array<{ id: string; name: string; color: string }>;
  checklist?: Array<{ id: string; text: string; completed: boolean }>;
  files?: any[];
  predecessors?: any[];
  successors?: any[];
  column?: {
    id: string;
    name: string;
    color?: string;
    position?: number;
    isSystem?: boolean;
    systemCode?: number;
  };
}

interface ApiTaskParticipant {
  id?: string;
  user?: {
    id: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    avatar?: string;
  };
  userId?: string;
  isOwner?: boolean;
  isLeader?: boolean;
  availableHours?: string;
  plannedHours?: string;
  spentHours?: string;
  column?: {
    id: string;
    name: string;
    color?: string;
    position?: number;
    isSystem?: boolean;
  };
  plannedSchedule?: Array<{ plannedHours?: string }>;
}

interface ApiColumn {
  id: string;
  name: string;
  color?: string;
  position?: number;
  isSystem?: boolean;
  systemCode?: number;
}

// ============================================================================
// Date Conversion Helpers
// ============================================================================

/**
 * Convert API date format (DD/MM/YYYY) to ISO format (YYYY-MM-DD)
 */
export function convertDateFromApi(dateStr: string | undefined): string | undefined {
  if (!dateStr) return undefined;

  // Handle ISO format already
  if (dateStr.includes('T')) {
    return dateStr.split('T')[0];
  }

  // Handle DD/MM/YYYY format
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }

  return dateStr;
}

/**
 * Convert ISO date to API format (DD/MM/YYYY HH:mm:ss+0000)
 */
export function convertDateToApi(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}+0000`;
}

// ============================================================================
// Main Mapping Functions
// ============================================================================

/**
 * Map an API task response to the unified Task model
 *
 * @param apiTask - Raw task data from API
 * @param currentUserId - Current user's ID (to find their participant entry)
 * @returns Unified Task object
 */
export function mapApiTaskToTask(apiTask: ApiTask, currentUserId?: string): Task {
  // Find current user's participant entry (for personal column/stage)
  const userParticipant = currentUserId
    ? apiTask.participants?.find(p =>
        (p.user?.id === currentUserId) || (p.userId === currentUserId)
      )
    : undefined;

  // Get column from user's participant or task level
  const column = userParticipant?.column || apiTask.column;

  // Parse hours
  const availableHours = parseFloat(apiTask.availableHours || apiTask.plannedHours || '0');
  const spentHours = parseFloat(apiTask.spentHours || '0');

  // Get project info from activity
  const projectId = apiTask.activity?.project?.id || '';
  const projectName = apiTask.activity?.project?.name || 'Unknown Project';
  const projectColor = apiTask.activity?.project?.color || '#6B7280';

  return {
    id: apiTask.id,
    name: apiTask.name,
    title: apiTask.name,  // Alias for backwards compatibility
    description: apiTask.description,
    position: apiTask.position,

    // Priority
    importance: apiTask.importance,
    priority: toDisplayPriority(apiTask.importance),

    // Project/Activity
    projectId,
    projectName,
    projectColor,
    activityId: apiTask.activity?.id,
    activityName: apiTask.activity?.name,
    parentActivity: apiTask.activity?.name,  // Alias for backwards compatibility

    // Dates
    startDate: convertDateFromApi(apiTask.startDate),
    endDate: convertDateFromApi(apiTask.endDate),
    dueDate: convertDateFromApi(apiTask.endDate),  // Alias for backwards compatibility

    // Status
    status: toDisplayStatus(column?.name),
    done: apiTask.done,

    // Hours (in minutes for internal use)
    timeEstimate: convertHoursToMinutes(availableHours),
    timeLogged: convertHoursToMinutes(spentHours),

    // Hours (original format for compatibility)
    plannedHours: availableHours,
    availableHours: availableHours,
    spentHours: spentHours,

    // Collections
    participants: apiTask.participants?.map(p => mapApiParticipant(p)) || [],
    tags: apiTask.labels || apiTask.tags || [],
    labels: apiTask.labels || apiTask.tags || [],
    checklists: apiTask.checklist || [],
    files: apiTask.files || [],

    // Counts
    commentsCount: apiTask.numComments || 0,
    subtasksCompleted: apiTask.numChecklistDone,
    subtasksTotal: apiTask.numChecklist,
    numFlags: apiTask.numFlags,
    numAttachments: apiTask.numAttachments,

    // Personal board
    columnId: column?.id,
    column: column ? {
      id: column.id,
      name: column.name,
      color: column.color,
      position: column.position,
      isSystem: column.isSystem,
      systemCode: column.systemCode,
    } : undefined,
    assignedTo: userParticipant?.user?.id || userParticipant?.userId,

    // Dependencies
    predecessors: apiTask.predecessors,
    successors: apiTask.successors,

    // Raw data for debugging
    _rawData: apiTask,
  };
}

/**
 * Map an API participant to TaskParticipant
 */
export function mapApiParticipant(apiParticipant: ApiTaskParticipant): TaskParticipant {
  const user = apiParticipant.user;
  const userId = user?.id || apiParticipant.userId || apiParticipant.id || '';

  // Get planned hours from various sources
  const plannedHours = parseFloat(
    apiParticipant.availableHours ||
    apiParticipant.plannedHours ||
    apiParticipant.plannedSchedule?.[0]?.plannedHours ||
    '0'
  );
  const spentHours = parseFloat(apiParticipant.spentHours || '0');

  return {
    id: apiParticipant.id || userId,
    userId,

    // Flattened user info
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    fullName: user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Unknown',
    email: user?.email,
    avatar: user?.avatar,

    // Nested user object
    user: user ? {
      id: user.id,
      fullName: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
    } : undefined,

    // Role
    isOwner: apiParticipant.isOwner,
    isLeader: apiParticipant.isLeader,

    // Hours
    availableHours: plannedHours,
    plannedHours: plannedHours,
    spentHours: spentHours,

    // Personal stage
    column: apiParticipant.column,
  };
}

/**
 * Map API columns to ColumnData
 */
export function mapApiColumn(apiColumn: ApiColumn): ColumnData {
  return {
    id: apiColumn.id,
    name: apiColumn.name,
    color: apiColumn.color || '#6B7280',
    position: apiColumn.position,
    isSystem: apiColumn.isSystem,
    systemCode: apiColumn.systemCode,
    taskIds: [], // Will be populated separately
  };
}

// ============================================================================
// Batch Mapping Functions
// ============================================================================

/**
 * Map an array of API tasks to unified Tasks
 */
export function mapApiTasksToTasks(apiTasks: ApiTask[], currentUserId?: string): Task[] {
  return apiTasks.map(t => mapApiTaskToTask(t, currentUserId));
}

/**
 * Map tasks and organize by column
 */
export function mapAndOrganizeTasksByColumn(
  apiTasks: ApiTask[],
  apiColumns: ApiColumn[],
  currentUserId?: string
): { tasks: Map<string, Task>; columns: ColumnData[] } {
  const tasksMap = new Map<string, Task>();
  const tasksByColumn = new Map<string, string[]>();

  // Map tasks
  apiTasks.forEach(apiTask => {
    const task = mapApiTaskToTask(apiTask, currentUserId);
    tasksMap.set(task.id, task);

    // Organize by column
    if (task.columnId) {
      if (!tasksByColumn.has(task.columnId)) {
        tasksByColumn.set(task.columnId, []);
      }
      tasksByColumn.get(task.columnId)!.push(task.id);
    }
  });

  // Map columns and assign task IDs
  const columns = apiColumns
    .map(c => mapApiColumn(c))
    .map(col => ({
      ...col,
      taskIds: tasksByColumn.get(col.id) || [],
    }))
    .sort((a, b) => (a.position || 0) - (b.position || 0));

  return { tasks: tasksMap, columns };
}

// ============================================================================
// Spent Hours Computation
// ============================================================================

/**
 * Compute total spent hours for a task
 * Priority: task-level spentHours > sum of participant spentHours
 */
export function computeSpentHours(task: Task | ApiTask): number {
  // Task-level spentHours (computed by backend from events)
  if (task.spentHours) {
    return typeof task.spentHours === 'string'
      ? parseFloat(task.spentHours)
      : task.spentHours;
  }

  // Sum from participants if available
  if (task.participants && Array.isArray(task.participants)) {
    return task.participants.reduce((sum, p) => {
      const hours = typeof p.spentHours === 'string'
        ? parseFloat(p.spentHours)
        : (p.spentHours || 0);
      return sum + hours;
    }, 0);
  }

  return 0;
}

/**
 * Compute spent hours for a specific user on a task
 */
export function computeUserSpentHours(task: Task | ApiTask, userId: string): number {
  const participant = task.participants?.find(p => {
    const pUserId = (p as any).user?.id || (p as any).userId || (p as any).id;
    return pUserId === userId;
  });

  if (!participant) return 0;

  return typeof participant.spentHours === 'string'
    ? parseFloat(participant.spentHours)
    : (participant.spentHours || 0);
}
