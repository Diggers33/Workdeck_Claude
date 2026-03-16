/**
 * ResourcePlanner Types
 * All interfaces and types used across ResourcePlanner components
 */

// Constants
export const HOURS_PER_PERSON_MONTH = 160;
export const HOURS_PER_WEEK = 40;

// Core entities
export interface TeamMember {
  id: string;
  name: string;
  role: string;
  department: string;
  departmentId?: string;
  location: string;
  avatar?: string;
  skills: string[];
  capacity: number;
  allocation: number;
  assignments: Assignment[];
  leave: LeavePeriod[];
  conflicts: ConflictWarning[];
}

export interface PlannedScheduleEntry {
  startDate: string;
  endDate: string;
  plannedHours?: string;
  hours?: string;
}

export interface Assignment {
  id: string;
  taskId: string;
  projectId: string;
  projectName: string;
  projectCode?: string;
  workPackage?: string;
  taskName: string;
  hours: number;
  allocatedHours: number;
  hoursPerWeek: number;
  personMonths: number;
  startDate: string;
  endDate: string;
  role: string;
  color: string;
  progress?: number;
  plannedPM?: number;
  actualPM?: number;
  plannedSchedule?: PlannedScheduleEntry[];
}

export interface LeavePeriod {
  id: string;
  startDate: string;
  endDate: string;
  type: 'vacation' | 'sick' | 'conference' | 'secondment' | 'holiday';
  description?: string;
}

export interface ConflictWarning {
  type: 'over_allocation' | 'skill_gap' | 'leave_conflict';
  severity: 'warning' | 'error';
  message: string;
  period?: { start: string; end: string };
}

export interface ForecastPeriod {
  period: string;
  startDate: Date;
  endDate: Date;
  capacity: number;
  allocated: number;
  available: number;
  utilizationPercent: number;
}

// View types
export type ViewMode = 'timeline' | 'list' | 'forecast' | 'skills' | 'grid';
export type TimeRange = 'week' | 'month' | 'quarter' | 'year';
export type DisplayUnit = 'hours' | 'personMonths';
export type AllocationFilter = 'all' | 'over' | 'under' | 'optimal' | 'conflicts';
export type GridHierarchy = 'person' | 'project';
export type GridGranularity = 'weekly' | 'monthly';

// Grid types
export interface GridAllocation {
  id: string;
  personId: string;
  projectId: string;
  projectName: string;
  taskId?: string;
  taskName?: string;
  hours: number;
  period: string;
}

export interface GridPeriod {
  key: string;
  label: string;
  shortLabel: string;
  startDate: Date;
  endDate: Date;
}

export interface GridRowData {
  id: string;
  type: 'person' | 'project' | 'task';
  name: string;
  avatar?: string;
  department?: string;
  capacity?: number;
  color?: string;
  parentId?: string;
  personId?: string;
  userId?: string;
  workPackage?: string;
  taskId?: string;
  assignment?: Assignment;
  children?: GridRowData[];
}

export interface CellData {
  hours: number;
  hasUnscheduled: boolean;
  hasPending: boolean;
}

// Project summary from API
export interface ProjectSummary {
  id: string;
  name: string;
  code?: string;
  color?: string;
}
