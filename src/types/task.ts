/**
 * Unified Task Types
 * Single source of truth for task-related types across all views
 *
 * This file consolidates the 12+ different Task interfaces that were
 * scattered across components into a single comprehensive type.
 */

// Re-export base types from api.ts for backwards compatibility
export type { TaskStage, ChecklistItem } from './api';
import type { TaskStage, ChecklistItem, UserBasic } from './api';

// ============================================================================
// Core Task Types
// ============================================================================

/**
 * Unified Task interface - single source of truth
 *
 * This interface supports all views:
 * - My Tasks board (personal kanban)
 * - Gantt view (project timeline)
 * - Project Board (project kanban)
 * - Calendar (event linking)
 * - Task modals (full details)
 */
export interface Task {
  id: string;

  // Name fields (backwards compatible)
  name: string;              // API field name
  title: string;             // Alias for name (backwards compat with old components)

  description?: string;
  position?: number;

  // Priority (support both formats)
  importance?: number;                        // API format: 1=low, 2=medium, 3=high
  priority: 'High' | 'Medium' | 'Low';        // Display format

  // Project/Activity info
  projectId: string;
  projectName: string;
  projectColor: string;
  activityId?: string;
  activityName?: string;
  parentActivity?: string;   // Alias for activityName (backwards compat)

  // Dates
  startDate?: string;
  endDate?: string;
  dueDate?: string;          // Alias for endDate (backwards compat)

  // Status
  status: 'Open' | 'In Progress' | 'In Review' | 'Done';
  done?: boolean;

  // Hours - stored in MINUTES for consistency
  timeEstimate?: number;     // Allocated time in minutes
  timeLogged?: number;       // Spent time in minutes (computed from events)

  // Hours - API format (hours as numbers, for compatibility)
  plannedHours?: number;
  availableHours?: number;
  spentHours?: number;

  // Collections
  participants?: TaskParticipant[];
  tags?: Tag[];
  checklists?: ChecklistItem[];
  files?: TaskFile[];
  flags?: TaskFlag[];
  labels?: Tag[];  // Alias for tags

  // Counts
  commentsCount: number;
  subtasksCompleted?: number;
  subtasksTotal?: number;
  watchers?: number;
  numFlags?: number;
  numAttachments?: number;

  // Personal board (My Tasks)
  columnId?: string;
  column?: TaskStage;
  assignedTo?: string;       // User ID of assigned person

  // Waiting/blocking
  waitingOn?: string;

  // Dependencies
  predecessors?: TaskDependency[];
  successors?: TaskDependency[];

  // Raw API data (for debugging/fallback)
  _rawData?: any;
}

/**
 * Computed property getters for backwards compatibility
 * Use these when you need the aliased field names
 */
export function getTaskTitle(task: Task): string {
  return task.name;
}

export function getTaskDueDate(task: Task): string | undefined {
  return task.endDate;
}

// ============================================================================
// Task Participant
// ============================================================================

export interface TaskParticipant {
  id: string;

  // User info (flattened for easy access)
  userId: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  avatar?: string;

  // Nested user object (from API)
  user?: UserBasic & {
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };

  // Role
  isOwner?: boolean;
  isLeader?: boolean;
  role?: string;

  // Hours (stored as numbers)
  availableHours?: number;
  plannedHours?: number;
  spentHours?: number;        // Computed from their calendar events

  // Personal stage (My Tasks column)
  column?: TaskStage;
}

// ============================================================================
// Supporting Types
// ============================================================================

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface TaskFile {
  id: string;
  name: string;
  url?: string;
  size?: number;
  type?: string;
  uploadedAt?: string;
  uploadedBy?: UserBasic;
}

export interface TaskFlag {
  id: string;
  type: string;
  color?: string;
  description?: string;
  createdAt?: string;
  createdBy?: UserBasic;
}

export interface TaskDependency {
  id: string;
  taskId: string;
  taskName?: string;
  type?: 'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'start-to-finish';
  lag?: number;
}

// ============================================================================
// Summary/Reference Types (lightweight)
// ============================================================================

export interface TaskSummary {
  id: string;
  name: string;
}

export interface ActivitySummary {
  id: string;
  name: string;
  projectId?: string;
  projectName?: string;
  projectColor?: string;
}

export interface ProjectSummary {
  id: string;
  name: string;
  color?: string;
  code?: string;
}

export interface UserSummary {
  id: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  avatar?: string;
}

// ============================================================================
// Column/Stage Types
// ============================================================================

export interface ColumnData {
  id: string;
  name: string;
  color: string;
  taskIds: string[];
  isSystem?: boolean;
  position?: number;
  systemCode?: number;
}

// ============================================================================
// Type Guards
// ============================================================================

export function isTask(obj: any): obj is Task {
  return obj && typeof obj.id === 'string' && typeof obj.name === 'string';
}

export function hasParticipants(task: Task): task is Task & { participants: TaskParticipant[] } {
  return Array.isArray(task.participants) && task.participants.length > 0;
}

// ============================================================================
// Priority Helpers
// ============================================================================

export function importanceToPriority(importance: number | undefined): 'High' | 'Medium' | 'Low' {
  switch (importance) {
    case 3: return 'High';
    case 2: return 'Medium';
    case 1: return 'Low';
    default: return 'Medium';
  }
}

export function priorityToImportance(priority: 'High' | 'Medium' | 'Low'): number {
  switch (priority) {
    case 'High': return 3;
    case 'Medium': return 2;
    case 'Low': return 1;
    default: return 2;
  }
}

// ============================================================================
// Status Helpers
// ============================================================================

export function columnToStatus(columnName: string | undefined): 'Open' | 'In Progress' | 'In Review' | 'Done' {
  const name = columnName?.toLowerCase() || '';
  if (name.includes('done') || name.includes('complete')) return 'Done';
  if (name.includes('review')) return 'In Review';
  if (name.includes('doing') || name.includes('progress') || name.includes('working')) return 'In Progress';
  return 'Open';
}

export function isDone(task: Task): boolean {
  return task.done === true || task.status === 'Done';
}

// ============================================================================
// Hours Helpers
// ============================================================================

/**
 * Convert hours (from API) to minutes (for internal use)
 */
export function hoursToMinutes(hours: number | string | undefined): number {
  if (hours === undefined || hours === null) return 0;
  const h = typeof hours === 'string' ? parseFloat(hours) : hours;
  return Math.round(h * 60);
}

/**
 * Convert minutes (internal) to hours (for API/display)
 */
export function minutesToHours(minutes: number | undefined): number {
  if (minutes === undefined || minutes === null) return 0;
  return minutes / 60;
}

/**
 * Format hours for display (e.g., "2h 30m")
 */
export function formatHoursDisplay(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0 && m === 0) return '0h';
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Format minutes for display (e.g., "2h 30m")
 */
export function formatMinutesDisplay(minutes: number): string {
  return formatHoursDisplay(minutes / 60);
}
