/**
 * ResourcePlanner - Team capacity and project assignment management
 *
 * DATA SOURCES:
 * - /queries/users-summary - All company users
 * - /queries/departments - Department list
 * - /queries/tasks - All tasks (single call, filtered client-side per user for allocation)
 * - /queries/projects-summary - All projects (for assignment details)
 *
 * FEATURES:
 * - Timeline visualization with task bars (week/month/quarter/year views)
 * - Person-months (PM) display for EU project reporting
 * - Date navigation (prev/next, today button)
 * - Filtering by department, project, allocation status, skills
 * - Grouping by department with collapsible sections
 * - Interactive task bars with tooltips and click-to-open
 * - Editable capacity per user
 * - Leave/availability planning
 * - Forecasting and conflict detection
 * - Skills matching
 * - Export for EU periodic reports
 */
import React, { useState, useMemo, useEffect, useCallback, useRef, startTransition, memo, useDeferredValue } from 'react';
import {
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Download,
  TrendingUp,
  TrendingDown,
  Loader2,
  X,
  Edit2,
  Check,
  CalendarDays,
  List,
  Building2,
  Layers,
  Calendar,
  AlertCircle,
  UserCheck,
  Briefcase,
  Target,
  FileSpreadsheet,
  Plane,
  Tag,
  Plus,
  Info
} from 'lucide-react';
import { apiClient } from '../services/api-client';
import GridCell, { CellContext } from './ResourcePlanner/GridCell';
import AGGridView from './ResourcePlanner/AGGridView';
// import RDGGridView from './ResourcePlanner/RDGGridView';

// Constants
const HOURS_PER_PERSON_MONTH = 160; // Standard EU person-month
const HOURS_PER_WEEK = 40;

interface TeamMember {
  id: string;
  name: string;
  role: string;
  department: string;
  departmentId?: string;
  location: string;
  avatar?: string;
  skills: string[];
  capacity: number; // hours per week
  allocation: number; // percentage
  assignments: Assignment[];
  leave: LeavePeriod[];
  conflicts: ConflictWarning[];
}

interface PlannedScheduleEntry {
  startDate: string;
  endDate: string;
  plannedHours?: string;
  hours?: string;
}

interface Assignment {
  id: string;
  taskId: string;
  projectId: string;
  projectName: string;
  projectCode?: string;
  workPackage?: string;
  taskName: string;
  hours: number; // total hours (from task.availableHours or participant allocation)
  allocatedHours: number; // participant's allocated budget (participant.availableHours)
  hoursPerWeek: number; // hours per week
  personMonths: number; // total PMs
  startDate: string;
  endDate: string;
  role: string;
  color: string;
  progress?: number; // 0-100
  plannedPM?: number;
  actualPM?: number;
  plannedSchedule?: PlannedScheduleEntry[]; // per-participant schedule with date ranges
}

interface LeavePeriod {
  id: string;
  startDate: string;
  endDate: string;
  type: 'vacation' | 'sick' | 'conference' | 'secondment' | 'holiday';
  description?: string;
}

interface ConflictWarning {
  type: 'over_allocation' | 'skill_gap' | 'leave_conflict';
  severity: 'warning' | 'error';
  message: string;
  period?: { start: string; end: string };
}

interface ForecastPeriod {
  period: string;
  startDate: Date;
  endDate: Date;
  capacity: number;
  allocated: number;
  available: number;
  utilizationPercent: number;
}

type ViewMode = 'timeline' | 'list' | 'forecast' | 'skills' | 'grid';
type TimeRange = 'week' | 'month' | 'quarter' | 'year';
type DisplayUnit = 'hours' | 'personMonths';
type AllocationFilter = 'all' | 'over' | 'under' | 'optimal' | 'conflicts';
type GridHierarchy = 'person' | 'project';
type GridGranularity = 'weekly' | 'monthly';

// Grid cell allocation data
interface GridAllocation {
  id: string;
  personId: string;
  projectId: string;
  projectName: string;
  taskId?: string;
  taskName?: string;
  hours: number;
  period: string; // YYYY-MM or YYYY-WW format
}

// Editable cell state
interface EditingCell {
  rowId: string;
  period: string;
  value: string;
  projectId?: string;
}

// Custom HoverTooltip component for professional styling
const HoverTooltip: React.FC<{
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom';
}> = ({ content, children, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const triggerRef = React.useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        x: rect.left + rect.width / 2,
        y: position === 'top' ? rect.top : rect.bottom
      });
    }
    setIsVisible(true);
  };

  return (
    <div
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsVisible(false)}
      style={{ position: 'relative', display: 'inline-flex', width: '100%' }}
    >
      {children}
      {isVisible && content && (
        <div
          style={{
            position: 'fixed',
            left: coords.x,
            top: position === 'top' ? coords.y - 8 : coords.y + 8,
            transform: position === 'top' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
            zIndex: 9999,
            pointerEvents: 'none'
          }}
        >
          <div
            style={{
              backgroundColor: '#1F2937',
              color: '#F9FAFB',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 500,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)',
              whiteSpace: 'nowrap',
              maxWidth: '280px',
              lineHeight: 1.4
            }}
          >
            {content}
            {/* Arrow */}
            <div
              style={{
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                ...(position === 'top' ? {
                  bottom: '-6px',
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderTop: '6px solid #1F2937'
                } : {
                  top: '-6px',
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderBottom: '6px solid #1F2937'
                }),
                width: 0,
                height: 0
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Capacity Bar component - shows utilization with color coding
const CapacityBar = memo<{
  allocated: number;
  capacity: number;
  showLabel?: boolean;
  height?: number;
}>(({ allocated, capacity, showLabel = true, height = 4 }) => {
  const utilization = capacity > 0 ? (allocated / capacity) * 100 : 0;
  const cappedWidth = Math.min(utilization, 100);
  const overflowWidth = utilization > 100 ? Math.min(utilization - 100, 50) : 0;

  // Color based on utilization level
  const getBarColor = () => {
    if (utilization > 100) return '#DC2626'; // Red - over-allocated
    if (utilization > 90) return '#F59E0B'; // Amber - warning
    if (utilization > 70) return '#10B981'; // Green - optimal
    return '#6B7280'; // Gray - under-utilized
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <div style={{
        width: '100%',
        height: `${height}px`,
        backgroundColor: '#E5E7EB',
        borderRadius: '2px',
        overflow: 'visible',
        position: 'relative'
      }}>
        {/* Main bar */}
        <div style={{
          width: `${cappedWidth}%`,
          height: '100%',
          backgroundColor: getBarColor(),
          borderRadius: '2px',
          transition: 'width 0.2s ease'
        }} />
        {/* Overflow indicator for over-allocation */}
        {overflowWidth > 0 && (
          <div style={{
            position: 'absolute',
            right: `-${overflowWidth * 0.5}%`,
            top: 0,
            width: `${overflowWidth * 0.5}%`,
            height: '100%',
            backgroundColor: '#DC2626',
            borderRadius: '0 2px 2px 0',
            opacity: 0.6
          }} />
        )}
      </div>
      {showLabel && (
        <div style={{
          fontSize: '9px',
          color: utilization > 100 ? '#DC2626' : '#6B7280',
          fontWeight: utilization > 100 ? 600 : 400,
          textAlign: 'center'
        }}>
          {utilization.toFixed(0)}%
        </div>
      )}
    </div>
  );
});

// Allocation Cell with capacity indicator - memoized to prevent re-renders
const AllocationCell = memo<{
  hours: number;
  capacity: number;
  hasUnscheduled?: boolean;
  unscheduledHours?: number;
  onClick?: () => void;
  isEditing?: boolean;
  editValue?: string;
  onEditChange?: (value: string) => void;
  onEditBlur?: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}>(({
  hours,
  capacity,
  hasUnscheduled = false,
  unscheduledHours = 0,
  onClick,
  isEditing,
  editValue,
  onEditChange,
  onEditBlur,
  onKeyDown
}) => {
  const utilization = capacity > 0 ? (hours / capacity) * 100 : 0;
  const isOverAllocated = utilization > 100;
  const isWarning = utilization > 90 && utilization <= 100;
  const isOptimal = utilization > 70 && utilization <= 90;

  if (isEditing) {
    return (
      <input
        type="number"
        autoFocus
        value={editValue}
        onChange={(e) => onEditChange?.(e.target.value)}
        onBlur={onEditBlur}
        onKeyDown={onKeyDown}
        style={{
          width: '100%',
          padding: '4px',
          border: '2px solid #2563EB',
          borderRadius: '4px',
          fontSize: '12px',
          textAlign: 'center',
          outline: 'none'
        }}
      />
    );
  }

  // Unscheduled state
  if (hasUnscheduled && hours === 0) {
    return (
      <HoverTooltip
        content={
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={14} style={{ color: '#FBBF24' }} />
              <span style={{ fontWeight: 600 }}>Unscheduled</span>
            </div>
            <div style={{ color: '#D1D5DB', fontSize: '11px' }}>
              <span style={{ color: '#FBBF24', fontWeight: 600 }}>{unscheduledHours.toLocaleString()}h</span> allocated, not scheduled
            </div>
          </div>
        }
      >
        <div
          onClick={onClick}
          style={{
            padding: '4px 6px',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#B45309',
            backgroundColor: '#FEF3C7',
            cursor: 'pointer',
            minHeight: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%'
          }}
        >
          0h
        </div>
      </HoverTooltip>
    );
  }

  // No allocation
  if (hours === 0 && !hasUnscheduled) {
    return (
      <div
        onClick={onClick}
        style={{
          padding: '4px 6px',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#D1D5DB',
          cursor: 'pointer',
          minHeight: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        —
      </div>
    );
  }

  // Has hours - show with capacity indicator
  return (
    <HoverTooltip
      content={
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isOverAllocated && <AlertTriangle size={14} style={{ color: '#DC2626' }} />}
            <span style={{ fontWeight: 600 }}>
              {hours.toFixed(1)}h / {capacity}h
            </span>
          </div>
          <div style={{
            color: isOverAllocated ? '#FCA5A5' : isWarning ? '#FCD34D' : '#D1D5DB',
            fontSize: '11px'
          }}>
            {utilization.toFixed(0)}% utilization
            {isOverAllocated && ` (${(utilization - 100).toFixed(0)}% over)`}
          </div>
          <CapacityBar allocated={hours} capacity={capacity} showLabel={false} height={6} />
        </div>
      }
    >
      <div
        onClick={onClick}
        style={{
          padding: '2px 4px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 500,
          color: isOverAllocated ? '#DC2626' : '#111827',
          backgroundColor: isOverAllocated ? '#FEE2E2' : isWarning ? '#FEF3C7' : isOptimal ? '#DCFCE7' : '#F3F4F6',
          cursor: 'pointer',
          minHeight: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '2px',
          width: '100%',
          border: isOverAllocated ? '1px solid #FECACA' : 'none'
        }}
      >
        <span>{hours.toFixed(1)}h</span>
        <CapacityBar allocated={hours} capacity={capacity} showLabel={false} height={3} />
      </div>
    </HoverTooltip>
  );
});

// Project colors palette
const PROJECT_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
];

const LEAVE_COLORS: Record<string, string> = {
  vacation: '#F59E0B',
  sick: '#EF4444',
  conference: '#8B5CF6',
  secondment: '#3B82F6',
  holiday: '#10B981'
};

// Parse date string - handles DD/MM/YYYY, ISO, and other formats
function parseDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  if (dateStr.includes('T') || dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  if (dateStr.includes('/')) {
    const parts = dateStr.split(/[\s/]/);
    if (parts.length >= 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }
  }
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

// Get start of week (Monday)
function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Get start of month
function getStartOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

// Get start of quarter
function getStartOfQuarter(date: Date): Date {
  const quarter = Math.floor(date.getMonth() / 3);
  return new Date(date.getFullYear(), quarter * 3, 1);
}

// Get start of year
function getStartOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1);
}

// Convert hours to person-months
function hoursToPM(hours: number): number {
  return Math.round((hours / HOURS_PER_PERSON_MONTH) * 100) / 100;
}

// Process raw tasks into per-user assignments and a project gantt cache
function processTasksIntoAssignments(
  tasks: any[],
  projectLookup: Map<string, any>
): { assignments: { userId: string; assignment: Assignment }[]; ganttCache: Record<string, any[]> } {
  const ganttCache: Record<string, any[]> = {};
  const assignments: { userId: string; assignment: Assignment }[] = [];
  const now = new Date();

  tasks.forEach((task: any) => {
    const projectId = task.activity?.project?.id;
    if (!projectId) return;

    const project = projectLookup.get(projectId);
    if (!project) return;

    const enrichedTask = {
      ...task,
      activity: {
        id: task.activity?.id,
        name: task.activity?.name,
        project: { id: project.id, name: project.name, color: project.color }
      }
    };

    if (!ganttCache[projectId]) {
      ganttCache[projectId] = [];
    }
    ganttCache[projectId].push(enrichedTask);

    const participants = task.participants || [];

    participants.forEach((participant: any) => {
      const participantUserId = participant.user?.id || participant.userId || participant.odooUserId;
      if (!participantUserId) return;

      const allocatedHours = parseFloat(participant.availableHours || participant.plannedHours || task.plannedHours || '0');
      const plannedSchedule = participant.plannedSchedule || [];
      const spentHours = parseFloat(participant.spentHours || task.spentHours || '0');

      if (allocatedHours <= 0 && plannedSchedule.length === 0) return;

      let startDate = task.startDate ? parseDate(task.startDate) : new Date();
      let endDate = task.endDate ? parseDate(task.endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      if (endDate <= startDate) {
        endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      }

      const isActive = endDate >= now;
      if (!isActive) return;

      let scheduledHours = 0;
      plannedSchedule.forEach((schedule: any) => {
        scheduledHours += parseFloat(schedule.plannedHours || schedule.hours || '0');
      });

      const effectiveHours = scheduledHours > 0 ? scheduledHours : allocatedHours;
      const durationMs = endDate.getTime() - startDate.getTime();
      const durationWeeks = Math.max(1, Math.ceil(durationMs / (7 * 24 * 60 * 60 * 1000)));
      const weeklyHours = effectiveHours / durationWeeks;
      const progress = effectiveHours > 0 ? Math.min(100, Math.round((spentHours / effectiveHours) * 100)) : 0;
      const personMonths = hoursToPM(effectiveHours);

      const workPackageMatch = task.activity?.name?.match(/^(WP\d+)/i);
      const workPackage = workPackageMatch ? workPackageMatch[1].toUpperCase() : undefined;

      const assignment: Assignment = {
        id: `${task.id}-${participantUserId}`,
        taskId: task.id,
        projectId: project.id,
        projectName: project.name,
        projectCode: project.code,
        workPackage,
        taskName: task.name || 'Untitled Task',
        hours: Math.round(effectiveHours * 100) / 100,
        allocatedHours: Math.round(allocatedHours * 100) / 100,
        hoursPerWeek: Math.round(weeklyHours * 100) / 100,
        personMonths,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        role: task.name || 'Task',
        color: project.color || PROJECT_COLORS[0],
        progress,
        plannedPM: personMonths,
        actualPM: hoursToPM(spentHours),
        plannedSchedule: plannedSchedule.map((s: any) => ({
          startDate: s.startDate,
          endDate: s.endDate,
          plannedHours: s.plannedHours || s.hours
        }))
      };

      assignments.push({ userId: participantUserId, assignment });
    });
  });

  return { assignments, ganttCache };
}

// Merge new assignments into team members, recalculating allocation and conflicts
function applyAssignmentsToMembers(
  members: TeamMember[],
  newAssignments: { userId: string; assignment: Assignment }[]
): TeamMember[] {
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  return members.map(member => {
    const memberAssignments = newAssignments
      .filter(a => a.userId === member.id)
      .map(a => a.assignment);

    if (memberAssignments.length === 0) return member;

    const existingIds = new Set(member.assignments.map(a => a.id));
    const newOnes: Assignment[] = [];
    const seenIds = new Set(existingIds);
    for (const a of memberAssignments) {
      if (!seenIds.has(a.id)) {
        seenIds.add(a.id);
        newOnes.push(a);
      }
    }

    if (newOnes.length === 0) return member;

    const allMemberAssignments = [...member.assignments, ...newOnes];

    let totalWeeklyHours = 0;
    allMemberAssignments.forEach((assignment) => {
      const assignStart = new Date(assignment.startDate);
      if (assignStart <= weekFromNow && new Date(assignment.endDate) >= now) {
        totalWeeklyHours += assignment.hoursPerWeek;
      }
    });

    const allocation = member.capacity > 0 ? Math.round((totalWeeklyHours / member.capacity) * 100) : 0;
    const conflicts: ConflictWarning[] = [];

    if (allocation > 100) {
      conflicts.push({
        type: 'over_allocation',
        severity: allocation > 120 ? 'error' : 'warning',
        message: `Over-allocated by ${allocation - 100}%`
      });
    }

    return { ...member, assignments: allMemberAssignments, allocation, conflicts };
  });
}

// Count working days (Monday-Friday) between two dates
function countWorkingDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Saturday or Sunday
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

// Participant allocation status
type AllocationStatus = 'scheduled' | 'unscheduled' | 'none';

interface MonthlyAllocation {
  hours: number;
  status: AllocationStatus;
  allocatedTotal: number;
}

// Calculate participant's hours for a specific month from their plannedSchedule
function getParticipantMonthlyHours(
  participant: any,
  monthStart: Date,
  monthEnd: Date
): MonthlyAllocation {
  const allocatedTotal = parseFloat(participant?.availableHours || '0');

  // No plannedSchedule = hours not scheduled to specific dates yet
  if (!participant?.plannedSchedule || participant.plannedSchedule.length === 0) {
    return {
      hours: 0,
      status: allocatedTotal > 0 ? 'unscheduled' : 'none',
      allocatedTotal
    };
  }

  // Calculate from plannedSchedule entries
  let totalHours = 0;
  participant.plannedSchedule.forEach((schedule: any) => {
    const scheduleStart = parseDate(schedule.startDate);
    const scheduleEnd = parseDate(schedule.endDate);
    const schedulePlannedHours = parseFloat(schedule.plannedHours || schedule.hours || '0');

    // Check if this schedule overlaps with the month
    if (scheduleEnd >= monthStart && scheduleStart <= monthEnd && schedulePlannedHours > 0) {
      const overlapStart = new Date(Math.max(scheduleStart.getTime(), monthStart.getTime()));
      const overlapEnd = new Date(Math.min(scheduleEnd.getTime(), monthEnd.getTime()));

      const workingDaysInSchedule = countWorkingDays(scheduleStart, scheduleEnd);
      const workingDaysInMonth = countWorkingDays(overlapStart, overlapEnd);

      if (workingDaysInSchedule > 0) {
        const prorated = (schedulePlannedHours * workingDaysInMonth) / workingDaysInSchedule;
        totalHours += prorated;
      }
    }
  });

  return {
    hours: Math.round(totalHours * 100) / 100,
    status: 'scheduled',
    allocatedTotal
  };
}

// Format date for display
function formatDate(date: Date, format: 'short' | 'medium' | 'long' = 'medium'): string {
  if (format === 'short') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  if (format === 'long') {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Format period label based on time range
function formatPeriodLabel(date: Date, range: TimeRange): string {
  switch (range) {
    case 'week':
      return `W${getWeekNumber(date)}`;
    case 'month':
      return date.toLocaleDateString('en-US', { month: 'short' });
    case 'quarter':
      return `Q${Math.floor(date.getMonth() / 3) + 1}`;
    case 'year':
      return date.getFullYear().toString();
    default:
      return '';
  }
}

// Get week number
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// Generate periods based on time range
function generatePeriods(startDate: Date, range: TimeRange): { start: Date; end: Date; label: string }[] {
  const periods: { start: Date; end: Date; label: string }[] = [];
  let current = new Date(startDate);

  const numPeriods = range === 'week' ? 7 : range === 'month' ? 4 : range === 'quarter' ? 13 : 12;

  for (let i = 0; i < numPeriods; i++) {
    const periodStart = new Date(current);
    let periodEnd: Date;
    let label: string;

    switch (range) {
      case 'week':
        periodEnd = new Date(current);
        label = current.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
        current.setDate(current.getDate() + 1);
        break;
      case 'month':
        periodEnd = new Date(current);
        periodEnd.setDate(periodEnd.getDate() + 6);
        label = `W${getWeekNumber(current)}`;
        current.setDate(current.getDate() + 7);
        break;
      case 'quarter':
        periodEnd = new Date(current);
        periodEnd.setDate(periodEnd.getDate() + 6);
        label = `W${getWeekNumber(current)}`;
        current.setDate(current.getDate() + 7);
        break;
      case 'year':
        periodEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
        label = current.toLocaleDateString('en-US', { month: 'short' });
        current.setMonth(current.getMonth() + 1);
        break;
      default:
        periodEnd = new Date(current);
        label = '';
    }

    periods.push({ start: periodStart, end: periodEnd, label });
  }

  return periods;
}

// Check if date ranges overlap
function datesOverlap(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
  return start1 <= end2 && end1 >= start2;
}

// Task detail modal component
interface TaskDetailModalProps {
  assignment: Assignment | null;
  member: TeamMember | null;
  onClose: () => void;
}

function TaskDetailModal({ assignment, member, onClose }: TaskDetailModalProps) {
  if (!assignment || !member) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          width: '520px',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>
            Task Details
          </h3>
          <button
            onClick={onClose}
            style={{
              padding: '4px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              color: '#6B7280'
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: assignment.color }} />
              <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>{assignment.taskName}</span>
            </div>
            <div style={{ fontSize: '14px', color: '#6B7280' }}>
              {assignment.projectName} {assignment.workPackage && `• ${assignment.workPackage}`}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Assigned To</div>
              <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>{member.name}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Work Package</div>
              <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>{assignment.workPackage || 'N/A'}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Start Date</div>
              <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                {formatDate(new Date(assignment.startDate), 'long')}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>End Date</div>
              <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                {formatDate(new Date(assignment.endDate), 'long')}
              </div>
            </div>
          </div>

          {/* Person-Months Section */}
          <div style={{
            padding: '16px',
            backgroundColor: '#F0FDF4',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#166534', marginBottom: '12px', textTransform: 'uppercase' }}>
              EU Reporting (Person-Months)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#166534', marginBottom: '2px' }}>Total Hours</div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>{assignment.hours}h</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#166534', marginBottom: '2px' }}>Person-Months</div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>{assignment.personMonths} PM</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#166534', marginBottom: '2px' }}>Hours/Week</div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>{assignment.hoursPerWeek}h</div>
              </div>
            </div>
          </div>

          {assignment.progress !== undefined && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: '#6B7280' }}>Progress</span>
                <span style={{ fontSize: '12px', fontWeight: '500', color: '#111827' }}>{assignment.progress}%</span>
              </div>
              <div style={{ height: '8px', backgroundColor: '#E5E7EB', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${assignment.progress}%`,
                  backgroundColor: assignment.color,
                  borderRadius: '4px'
                }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Leave Management Modal
interface LeaveModalProps {
  member: TeamMember;
  onClose: () => void;
  onSave: (memberId: string, leave: LeavePeriod[]) => void;
}

function LeaveModal({ member, onClose, onSave }: LeaveModalProps) {
  const [leaveList, setLeaveList] = useState<LeavePeriod[]>(member.leave || []);
  const [newLeave, setNewLeave] = useState({
    startDate: '',
    endDate: '',
    type: 'vacation' as LeavePeriod['type'],
    description: ''
  });

  const addLeave = () => {
    if (newLeave.startDate && newLeave.endDate) {
      const leave: LeavePeriod = {
        id: `leave-${Date.now()}`,
        ...newLeave
      };
      setLeaveList([...leaveList, leave]);
      setNewLeave({ startDate: '', endDate: '', type: 'vacation', description: '' });
    }
  };

  const removeLeave = (id: string) => {
    setLeaveList(leaveList.filter(l => l.id !== id));
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          width: '560px',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>
              Leave & Availability
            </h3>
            <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '2px' }}>{member.name}</p>
          </div>
          <button onClick={onClose} style={{ padding: '4px', borderRadius: '4px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#6B7280' }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          {/* Add new leave */}
          <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>Add Leave Period</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Start Date</label>
                <input
                  type="date"
                  value={newLeave.startDate}
                  onChange={e => setNewLeave({ ...newLeave, startDate: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>End Date</label>
                <input
                  type="date"
                  value={newLeave.endDate}
                  onChange={e => setNewLeave({ ...newLeave, endDate: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px' }}
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Type</label>
                <select
                  value={newLeave.type}
                  onChange={e => setNewLeave({ ...newLeave, type: e.target.value as LeavePeriod['type'] })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px' }}
                >
                  <option value="vacation">Vacation</option>
                  <option value="sick">Sick Leave</option>
                  <option value="conference">Conference</option>
                  <option value="secondment">Secondment</option>
                  <option value="holiday">Public Holiday</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Description</label>
                <input
                  type="text"
                  value={newLeave.description}
                  onChange={e => setNewLeave({ ...newLeave, description: e.target.value })}
                  placeholder="Optional description"
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px' }}
                />
              </div>
            </div>
            <button
              onClick={addLeave}
              disabled={!newLeave.startDate || !newLeave.endDate}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: newLeave.startDate && newLeave.endDate ? '#0066FF' : '#E5E7EB',
                color: newLeave.startDate && newLeave.endDate ? 'white' : '#9CA3AF',
                fontSize: '13px',
                cursor: newLeave.startDate && newLeave.endDate ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Plus className="w-4 h-4" /> Add Leave
            </button>
          </div>

          {/* Leave list */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
              Scheduled Leave ({leaveList.length})
            </div>
            {leaveList.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>
                No leave scheduled
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {leaveList.map(leave => (
                  <div
                    key={leave.id}
                    style={{
                      padding: '12px',
                      backgroundColor: '#F9FAFB',
                      borderRadius: '6px',
                      borderLeft: `3px solid ${LEAVE_COLORS[leave.type]}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: '#111827', textTransform: 'capitalize' }}>
                        {leave.type.replace('_', ' ')}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>
                        {formatDate(new Date(leave.startDate), 'short')} - {formatDate(new Date(leave.endDate), 'short')}
                        {leave.description && ` • ${leave.description}`}
                      </div>
                    </div>
                    <button
                      onClick={() => removeLeave(leave.id)}
                      style={{ padding: '4px', borderRadius: '4px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#EF4444' }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              onClick={onClose}
              style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #E5E7EB', backgroundColor: 'white', fontSize: '13px', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              onClick={() => { onSave(member.id, leaveList); onClose(); }}
              style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#0066FF', color: 'white', fontSize: '13px', cursor: 'pointer' }}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Capacity edit popover
interface CapacityEditProps {
  member: TeamMember;
  onSave: (memberId: string, newCapacity: number) => void;
  onClose: () => void;
  position: { x: number; y: number };
}

function CapacityEditPopover({ member, onSave, onClose, position }: CapacityEditProps) {
  const [value, setValue] = useState(member.capacity.toString());

  return (
    <div
      style={{
        position: 'fixed',
        top: position.y,
        left: position.x,
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        border: '1px solid #E5E7EB',
        padding: '12px',
        zIndex: 1000,
        minWidth: '180px'
      }}
    >
      <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '8px' }}>Weekly Capacity (hours)</div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          style={{ flex: 1, padding: '6px 10px', borderRadius: '4px', border: '1px solid #E5E7EB', fontSize: '14px', outline: 'none' }}
          min="0"
          max="168"
        />
        <button
          onClick={() => { const num = parseFloat(value); if (!isNaN(num) && num >= 0) { onSave(member.id, num); } onClose(); }}
          style={{ padding: '6px 10px', borderRadius: '4px', border: 'none', backgroundColor: '#0066FF', color: 'white', cursor: 'pointer' }}
        >
          <Check className="w-4 h-4" />
        </button>
        <button onClick={onClose} style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #E5E7EB', backgroundColor: 'white', cursor: 'pointer' }}>
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Tooltip component
interface TooltipProps {
  assignment: Assignment;
  position: { x: number; y: number };
  displayUnit: DisplayUnit;
}

function Tooltip({ assignment, position, displayUnit }: TooltipProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: position.y - 90,
        left: position.x,
        transform: 'translateX(-50%)',
        backgroundColor: '#1F2937',
        color: 'white',
        borderRadius: '6px',
        padding: '10px 12px',
        fontSize: '12px',
        zIndex: 1000,
        pointerEvents: 'none',
        minWidth: '200px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
      }}
    >
      <div style={{ fontWeight: '600', marginBottom: '4px' }}>{assignment.taskName}</div>
      <div style={{ color: '#9CA3AF', marginBottom: '4px' }}>
        {assignment.projectName} {assignment.workPackage && `• ${assignment.workPackage}`}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
        <span>
          {displayUnit === 'hours' ? `${assignment.hoursPerWeek}h/week` : `${assignment.personMonths} PM`}
        </span>
        <span>{formatDate(new Date(assignment.startDate), 'short')} - {formatDate(new Date(assignment.endDate), 'short')}</span>
      </div>
      <div style={{
        position: 'absolute',
        bottom: '-6px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 0,
        height: 0,
        borderLeft: '6px solid transparent',
        borderRight: '6px solid transparent',
        borderTop: '6px solid #1F2937'
      }} />
    </div>
  );
}

export function ResourcePlanner() {

  const taskLoadAbortRef = useRef<AbortController | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [displayUnit, setDisplayUnit] = useState<DisplayUnit>('hours');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedPeople, setSelectedPeople] = useState<Set<string>>(new Set());
  const [personSearchQuery, setPersonSearchQuery] = useState('');
  const [showPersonDropdown, setShowPersonDropdown] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<string>('all');
  const [allocationFilter, setAllocationFilter] = useState<AllocationFilter>('all');
  const [currentDate, setCurrentDate] = useState(getStartOfWeek(new Date()));
  const [groupByDepartment, setGroupByDepartment] = useState(true);
  const [collapsedDepartments, setCollapsedDepartments] = useState<Set<string>>(new Set());

  // Data state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [departmentsList, setDepartmentsList] = useState<{ id: string; name: string }[]>([]);
  const [projectsList, setProjectsList] = useState<{ id: string; name: string; color: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Progressive loading phases: track which data has arrived
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [tasksLoaded, setTasksLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capacityEdits, setCapacityEdits] = useState<Record<string, number>>({});
  const [leaveData, setLeaveData] = useState<Record<string, LeavePeriod[]>>({});

  // UI state
  const [selectedTask, setSelectedTask] = useState<{ assignment: Assignment; member: TeamMember } | null>(null);
  const [tooltip, setTooltip] = useState<{ assignment: Assignment; position: { x: number; y: number } } | null>(null);
  const [editingCapacity, setEditingCapacity] = useState<{ member: TeamMember; position: { x: number; y: number } } | null>(null);
  const [editingLeave, setEditingLeave] = useState<TeamMember | null>(null);

  // Grid view state
  const [gridHierarchy, setGridHierarchy] = useState<GridHierarchy>('person');
  const [gridGranularity, setGridGranularity] = useState<GridGranularity>('monthly');
  const [gridAllocations, setGridAllocations] = useState<GridAllocation[]>([]);

  // Use deferred value for non-blocking UI updates when allocations change
  const deferredGridAllocations = useDeferredValue(gridAllocations);

  // Memoized Map for O(1) lookup of pending allocations (avoids O(n) find() on every cell)
  // Uses deferred value so UI stays responsive during updates
  const gridAllocationsMap = useMemo(() => {
    const map = new Map<string, GridAllocation>();
    deferredGridAllocations.forEach(alloc => {
      const key = `${alloc.personId}:${alloc.period}:${alloc.taskId || ''}`;
      map.set(key, alloc);
    });
    return map;
  }, [deferredGridAllocations]);

  // Memoized Map for total pending hours by person+task (avoids O(n) filter+reduce on every cell)
  const pendingHoursByPersonTask = useMemo(() => {
    const map = new Map<string, number>();
    deferredGridAllocations.forEach(alloc => {
      const key = `${alloc.personId}:${alloc.taskId || ''}`;
      map.set(key, (map.get(key) || 0) + alloc.hours);
    });
    return map;
  }, [deferredGridAllocations]);

  const [editingCell, setEditingCell] = useState<{ rowId: string; period: string } | null>(null);
  const editingInputRef = useRef<HTMLInputElement>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  // Drag-to-schedule state
  const [dragItem, setDragItem] = useState<{
    type: 'unscheduled' | 'scheduled';
    taskId: string;
    taskName: string;
    participantId: string;
    personId: string;
    personName: string;
    allocatedHours: number;
    sourcePeriod?: string;
  } | null>(null);
  // Drag over cell - use ref + DOM for performance (no re-renders during drag)
  const dragOverCellRef = useRef<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Fill handle - use REFS instead of state to avoid re-renders during drag
  const fillDragRef = useRef<{
    startRowId: string;
    startPeriodIdx: number;
    value: number;
    taskInfo: { taskId: string; taskName: string; projectId: string; personId: string };
    direction: 'horizontal' | 'vertical' | null;
  } | null>(null);
  const fillHighlightCellsRef = useRef<Set<string>>(new Set());
  const [isDraggingFill, setIsDraggingFill] = useState(false); // Only for cursor style
  const [gridStartDate, setGridStartDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [gridMonthsToShow, setGridMonthsToShow] = useState(12);
  const [showProjectAutocomplete, setShowProjectAutocomplete] = useState(false);
  const [autocompleteFilter, setAutocompleteFilter] = useState('');
  const [addTargetPersonId, setAddTargetPersonId] = useState<string | null>(null);
  const [pendingNewProjectRows, setPendingNewProjectRows] = useState<Array<{ personId: string; projectId: string; projectName: string; color: string }>>([]);

  // Lazy loading state for gantt-plus data
  const [projectGanttCache, setProjectGanttCache] = useState<Record<string, any[]>>({});
  const [loadingProjects, setLoadingProjects] = useState<Set<string>>(new Set());
  const [isLoadingGanttData, setIsLoadingGanttData] = useState(false);
  const [ganttLoadProgress, setGanttLoadProgress] = useState({ loaded: 0, total: 0 });

  // Load data on mount
  useEffect(() => {
    loadResourceData();
  }, []);

  // Cleanup: abort progressive task loading on unmount
  useEffect(() => {
    return () => {
      if (taskLoadAbortRef.current) {
        taskLoadAbortRef.current.abort();
      }
    };
  }, []);

  const loadResourceData = async () => {
    try {
      setIsLoading(true);
      setUsersLoaded(false);
      setTasksLoaded(false);
      setError(null);
      const loadStartTime = performance.now();

      // Progressive loading: fire all three API calls independently
      // and update state as each resolves, so the UI fills in incrementally.
      // We also keep a combined Promise.all to know when all initial data is ready.
      const usersPromise = apiClient.get('/queries/users') as Promise<any>;
      const departmentsPromise = apiClient.get('/queries/departments') as Promise<any>;
      const projectsPromise = apiClient.get('/queries/projects-summary') as Promise<any>;

      // Process departments as soon as they arrive (typically fast, small payload)
      departmentsPromise.then(departmentsResponse => {
        const depts = Array.isArray(departmentsResponse) ? departmentsResponse : departmentsResponse?.result || departmentsResponse?.data || [];
        const deptList = depts.map((d: any) => ({ id: d.id || d.name || d, name: d.name || d })).filter((d: any) => d.name && typeof d.name === 'string');
        setDepartmentsList(deptList);
        console.log(`[ResourcePlanner] Departments loaded (${deptList.length}) in ${((performance.now() - loadStartTime) / 1000).toFixed(2)}s`);
      }).catch(() => { /* handled by main catch */ });

      // Process projects as soon as they arrive
      let projListResolved: any[] = [];
      const projListReady = projectsPromise.then(projectsResponse => {
        const projects = Array.isArray(projectsResponse) ? projectsResponse : projectsResponse?.result || projectsResponse?.data || [];
        console.log(`[ResourcePlanner] Loaded ${projects.length} projects from API in ${((performance.now() - loadStartTime) / 1000).toFixed(2)}s`);
        const projList = projects.map((p: any, idx: number) => {
          const color = p.color || PROJECT_COLORS[idx % PROJECT_COLORS.length];
          return { id: p.id, name: p.name, color, code: p.code };
        });
        projListResolved = projList;
        setProjectsList(projList);
        return projList;
      }).catch(() => { /* handled by main catch */ return [] as any[]; });

      // Process users as soon as they arrive - this enables Phase 2 (user list visible)
      let membersResolved: TeamMember[] = [];
      const membersReady = usersPromise.then(usersResponse => {
        const users = Array.isArray(usersResponse) ? usersResponse : usersResponse?.result || usersResponse?.data || [];
        const enabledUsers = users.filter((u: any) => u.enabled !== false && !u.isGuest);

        const membersWithTasks = enabledUsers.map((user: any) => {
          const deptName = user.department?.name || user.departmentName || user.department || 'General';
          const deptId = user.department?.id || user.departmentId || deptName;
          const capacity = capacityEdits[user.id] || 40;
          const userLeave = leaveData[user.id] || [];

          return {
            id: user.id,
            name: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown',
            role: user.jobTitle || user.role || 'Team Member',
            department: typeof deptName === 'string' ? deptName : 'General',
            departmentId: typeof deptId === 'string' ? deptId : undefined,
            location: user.office?.name || user.location || 'Remote',
            avatar: user.avatar || user.profileImage || user.image || undefined,
            skills: user.skills || [],
            capacity,
            allocation: 0, // Will be calculated when assignments are loaded
            assignments: [] as Assignment[],
            leave: userLeave,
            conflicts: [] as ConflictWarning[]
          };
        });

        console.log(`[ResourcePlanner] Users loaded (${membersWithTasks.length}) in ${((performance.now() - loadStartTime) / 1000).toFixed(2)}s`);
        membersResolved = membersWithTasks;
        setTeamMembers(membersWithTasks);
        setUsersLoaded(true);
        return membersWithTasks;
      }).catch(() => { /* handled by main catch */ return [] as TeamMember[]; });

      // Wait for all initial data to complete, then mark loading done and start background task fetch
      await Promise.all([usersPromise, departmentsPromise, projectsPromise]);

      console.log(`[ResourcePlanner] All initial API calls took ${((performance.now() - loadStartTime) / 1000).toFixed(2)}s`);
      console.log(`[ResourcePlanner] Created ${membersResolved.length} team members`);
      console.log(`[ResourcePlanner] Initial load time: ${((performance.now() - loadStartTime) / 1000).toFixed(2)}s`);

      setIsLoading(false);

      // Progressive task loading — fetch per-user in batches of 15
      await Promise.all([membersReady, projListReady]);
      const projectLookup = new Map(projListResolved.map((p: any) => [p.id, p]));
      const BATCH_SIZE = 15;

      // Abort any previous progressive load
      if (taskLoadAbortRef.current) {
        taskLoadAbortRef.current.abort();
      }
      const abortController = new AbortController();
      taskLoadAbortRef.current = abortController;

      setIsLoadingGanttData(true);
      setGanttLoadProgress({ loaded: 0, total: membersResolved.length });

      const taskLoadStart = performance.now();
      let totalTasksLoaded = 0;

      const signal = abortController.signal;

      for (let i = 0; i < membersResolved.length; i += BATCH_SIZE) {
        if (signal.aborted) break;

        const batch = membersResolved.slice(i, i + BATCH_SIZE);
        const results = await Promise.allSettled(
          batch.map(m =>
            apiClient.get(`/queries/tasks/user/${m.id}`, undefined, { signal }).catch(() => [])
          )
        );

        if (signal.aborted) break;

        // Collect all tasks from this batch, deduplicating by task ID
        // (the same task appears in multiple users' responses when they share it)
        const seenTaskIds = new Set<string>();
        const batchTasks: any[] = [];
        results.forEach((result) => {
          if (result.status === 'fulfilled') {
            const tasks = Array.isArray(result.value) ? result.value : [];
            tasks.forEach(task => {
              if (task.id && !seenTaskIds.has(task.id)) {
                seenTaskIds.add(task.id);
                batchTasks.push(task);
              }
            });
          }
        });

        totalTasksLoaded += batchTasks.length;

        // Process into assignments
        const { assignments, ganttCache } = processTasksIntoAssignments(batchTasks, projectLookup);

        // Update state incrementally (skip if aborted / component unmounted)
        if (signal.aborted) break;

        setProjectGanttCache(prev => {
          const merged = { ...prev };
          Object.entries(ganttCache).forEach(([pid, tasks]) => {
            merged[pid] = [...(merged[pid] || []), ...tasks];
          });
          return merged;
        });

        if (assignments.length > 0) {
          setTeamMembers(prev => applyAssignmentsToMembers(prev, assignments));
        }

        const loaded = Math.min(i + BATCH_SIZE, membersResolved.length);
        setGanttLoadProgress({ loaded, total: membersResolved.length });
        console.log(`[ResourcePlanner] Batch ${Math.floor(i / BATCH_SIZE) + 1}: loaded tasks for users ${i + 1}-${loaded} (${batchTasks.length} tasks)`);
      }

      // Only update final state if not aborted
      if (!signal.aborted) {
        const taskLoadEnd = performance.now();
        console.log(`[ResourcePlanner] Progressive task load complete: ${totalTasksLoaded} tasks in ${((taskLoadEnd - taskLoadStart) / 1000).toFixed(2)}s`);

        setIsLoadingGanttData(false);
        setTasksLoaded(true);
      }
      taskLoadAbortRef.current = null;

    } catch (err) {
      console.error('Failed to load resource data:', err);
      setError('Failed to load resource data');
      setIsLoading(false);
    }
  };


  // Fetch gantt-plus data for a specific project (called when row is expanded)
  const fetchProjectGanttData = useCallback(async (projectId: string) => {
    // Already cached?
    if (projectGanttCache[projectId]) {
      return projectGanttCache[projectId];
    }

    // Already loading?
    if (loadingProjects.has(projectId)) {
      return null;
    }

    const project = projectsList.find(p => p.id === projectId);
    if (!project) return null;

    setLoadingProjects(prev => new Set(prev).add(projectId));

    try {
      console.log(`[ResourcePlanner] Fetching gantt-plus for project: ${project.name}`);
      const ganttResponse = await apiClient.get(`/queries/gantt-plus/${projectId}?resolution=month`) as any;
      const activities = ganttResponse?.result?.activities || ganttResponse?.activities || [];

      // Flatten tasks from all activities
      const tasks: any[] = [];
      activities.forEach((activity: any) => {
        if (activity.tasks && Array.isArray(activity.tasks)) {
          activity.tasks.forEach((task: any) => {
            tasks.push({
              ...task,
              activity: {
                id: activity.id,
                name: activity.name,
                project: { id: project.id, name: project.name, color: project.color }
              }
            });
          });
        }
      });

      // Cache the tasks
      setProjectGanttCache(prev => ({ ...prev, [projectId]: tasks }));

      // Process tasks and update team members with new assignments
      const now = new Date();
      const newAssignments: { userId: string; assignment: Assignment }[] = [];

      tasks.forEach((task: any) => {
        const participants = task.participants || [];

        participants.forEach((participant: any) => {
          const participantUserId = participant.user?.id || participant.userId || participant.odooUserId;
          if (!participantUserId) return;

          const allocatedHours = parseFloat(participant.availableHours || '0');
          const plannedSchedule = participant.plannedSchedule || [];
          const spentHours = parseFloat(participant.spentHours || '0');

          if (allocatedHours <= 0 && plannedSchedule.length === 0) return;

          let startDate = task.startDate ? parseDate(task.startDate) : new Date();
          let endDate = task.endDate ? parseDate(task.endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

          if (endDate <= startDate) {
            endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
          }

          const isActive = endDate >= now;
          if (!isActive) return;

          let scheduledHours = 0;
          plannedSchedule.forEach((schedule: any) => {
            scheduledHours += parseFloat(schedule.plannedHours || schedule.hours || '0');
          });

          const effectiveHours = scheduledHours > 0 ? scheduledHours : allocatedHours;
          const durationMs = endDate.getTime() - startDate.getTime();
          const durationWeeks = Math.max(1, Math.ceil(durationMs / (7 * 24 * 60 * 60 * 1000)));
          const weeklyHours = effectiveHours / durationWeeks;
          const progress = effectiveHours > 0 ? Math.min(100, Math.round((spentHours / effectiveHours) * 100)) : 0;
          const personMonths = hoursToPM(effectiveHours);

          const workPackageMatch = task.activity?.name?.match(/^(WP\d+)/i);
          const workPackage = workPackageMatch ? workPackageMatch[1].toUpperCase() : undefined;

          const assignment: Assignment = {
            id: `${task.id}-${participantUserId}`,
            taskId: task.id,
            projectId: project.id,
            projectName: project.name,
            projectCode: project.code,
            workPackage,
            taskName: task.name || 'Untitled Task',
            hours: Math.round(effectiveHours * 100) / 100,
            allocatedHours: Math.round(allocatedHours * 100) / 100,
            hoursPerWeek: Math.round(weeklyHours * 100) / 100,
            personMonths,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            role: task.name || 'Task',
            color: project.color || PROJECT_COLORS[0],
            progress,
            plannedPM: personMonths,
            actualPM: hoursToPM(spentHours),
            plannedSchedule: plannedSchedule.map((s: any) => ({
              startDate: s.startDate,
              endDate: s.endDate,
              plannedHours: s.plannedHours || s.hours
            }))
          };

          newAssignments.push({ userId: participantUserId, assignment });
        });
      });

      // Update team members with new assignments (avoiding duplicates)
      if (newAssignments.length > 0) {
        setTeamMembers(prev => prev.map(member => {
          const memberAssignments = newAssignments
            .filter(a => a.userId === member.id)
            .map(a => a.assignment);

          if (memberAssignments.length === 0) return member;

          // Merge with existing, avoiding duplicates
          const existingIds = new Set(member.assignments.map(a => a.id));
          const newOnes = memberAssignments.filter(a => !existingIds.has(a.id));

          if (newOnes.length === 0) return member;

          const allAssignments = [...member.assignments, ...newOnes];

          // Recalculate allocation
          const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          let totalWeeklyHours = 0;
          allAssignments.forEach((assignment) => {
            const assignStart = new Date(assignment.startDate);
            if (assignStart <= weekFromNow && new Date(assignment.endDate) >= now) {
              totalWeeklyHours += assignment.hoursPerWeek;
            }
          });

          const allocation = member.capacity > 0 ? Math.round((totalWeeklyHours / member.capacity) * 100) : 0;
          const conflicts: ConflictWarning[] = [];

          if (allocation > 100) {
            conflicts.push({
              type: 'over_allocation',
              severity: allocation > 120 ? 'error' : 'warning',
              message: `Over-allocated by ${allocation - 100}%`
            });
          }

          return { ...member, assignments: allAssignments, allocation, conflicts };
        }));
      }

      console.log(`[ResourcePlanner] Loaded ${tasks.length} tasks for project ${project.name}`);
      return tasks;

    } catch (e) {
      console.warn(`[ResourcePlanner] Failed to fetch gantt-plus for project ${project.name}:`, e);
      return [];
    } finally {
      setLoadingProjects(prev => {
        const next = new Set(prev);
        next.delete(projectId);
        return next;
      });
    }
  }, [projectGanttCache, loadingProjects, projectsList]);

  // Handle row expand - fetch data if needed
  const handleRowExpand = useCallback(async (rowId: string, rowType: string) => {
    // Toggle expand state
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
        // If expanding a project row, fetch its data
        if (rowType === 'project' && !projectGanttCache[rowId]) {
          fetchProjectGanttData(rowId);
        }
      }
      return next;
    });
  }, [projectGanttCache, fetchProjectGanttData]);

  // Update capacity
  const updateMemberCapacity = useCallback((memberId: string, newCapacity: number) => {
    setCapacityEdits(prev => ({ ...prev, [memberId]: newCapacity }));
    setTeamMembers(prev => prev.map(member => {
      if (member.id === memberId) {
        const totalWeeklyHours = member.assignments.reduce((sum, a) => sum + a.hoursPerWeek, 0);
        const newAllocation = newCapacity > 0 ? Math.round((totalWeeklyHours / newCapacity) * 100) : 0;
        return { ...member, capacity: newCapacity, allocation: newAllocation };
      }
      return member;
    }));
  }, []);

  // Update leave
  const updateMemberLeave = useCallback((memberId: string, leave: LeavePeriod[]) => {
    setLeaveData(prev => ({ ...prev, [memberId]: leave }));
    setTeamMembers(prev => prev.map(member => {
      if (member.id === memberId) {
        return { ...member, leave };
      }
      return member;
    }));
  }, []);

  // Get departments
  const departments = useMemo(() => {
    if (departmentsList.length > 0) {
      return departmentsList.sort((a, b) => a.name.localeCompare(b.name));
    }
    const deptMap = new Map<string, string>();
    teamMembers.forEach(m => {
      if (m.department) {
        deptMap.set(m.departmentId || m.department, m.department);
      }
    });
    return Array.from(deptMap.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [departmentsList, teamMembers]);

  // Get all projects from API (projectsList) - includes all company projects
  const projects = useMemo(() => {
    return [...projectsList].sort((a, b) => a.name.localeCompare(b.name));
  }, [projectsList]);

  // Get unique skills
  const allSkills = useMemo(() => {
    const skillSet = new Set<string>();
    teamMembers.forEach(m => m.skills.forEach(s => skillSet.add(s)));
    return Array.from(skillSet).sort();
  }, [teamMembers]);

  // Filter people for the searchable dropdown
  const filteredPeopleList = useMemo(() => {
    if (!personSearchQuery) return teamMembers;
    const query = personSearchQuery.toLowerCase();
    return teamMembers.filter(m =>
      m.name.toLowerCase().includes(query) ||
      m.department?.toLowerCase().includes(query) ||
      m.role?.toLowerCase().includes(query)
    );
  }, [teamMembers, personSearchQuery]);

  // Filter team members
  const filteredMembers = useMemo(() => {
    return teamMembers.filter(member => {
      const memberDeptLower = member.department?.toLowerCase() || '';
      const selectedDeptLower = selectedDepartment.toLowerCase();
      const matchesDepartment = selectedDepartment === 'all' || memberDeptLower === selectedDeptLower;

      const matchesProject = selectedProject === 'all' || member.assignments.some(a => a.projectId === selectedProject);

      // Empty set means "all people", otherwise filter by selected
      const matchesPerson = selectedPeople.size === 0 || selectedPeople.has(member.id);

      const matchesSkill = selectedSkill === 'all' || member.skills.some(s => s.toLowerCase() === selectedSkill.toLowerCase());

      const matchesAllocation =
        allocationFilter === 'all' ||
        (allocationFilter === 'over' && member.allocation > 100) ||
        (allocationFilter === 'under' && member.allocation < 80) ||
        (allocationFilter === 'optimal' && member.allocation >= 80 && member.allocation <= 100) ||
        (allocationFilter === 'conflicts' && member.conflicts.length > 0);

      return matchesDepartment && matchesProject && matchesPerson && matchesSkill && matchesAllocation;
    });
  }, [teamMembers, selectedDepartment, selectedProject, selectedPeople, selectedSkill, allocationFilter]);

  // Group by department
  const departmentGroups = useMemo(() => {
    if (!groupByDepartment) return null;
    const groups = new Map<string, TeamMember[]>();
    filteredMembers.forEach(member => {
      const deptKey = member.departmentId || member.department || 'Other';
      if (!groups.has(deptKey)) groups.set(deptKey, []);
      groups.get(deptKey)!.push(member);
    });
    return Array.from(groups.entries()).map(([deptId, members]) => ({
      id: deptId,
      name: members[0]?.department || 'Other',
      members,
      collapsed: collapsedDepartments.has(deptId),
      totalCapacity: members.reduce((sum, m) => sum + m.capacity, 0),
      totalAllocated: members.reduce((sum, m) => sum + (m.capacity * m.allocation / 100), 0),
      totalPM: members.reduce((sum, m) => sum + m.assignments.reduce((s, a) => s + a.personMonths, 0), 0)
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredMembers, groupByDepartment, collapsedDepartments]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = filteredMembers.length;
    const overAllocated = filteredMembers.filter(m => m.allocation > 100).length;
    const underAllocated = filteredMembers.filter(m => m.allocation < 80).length;
    const optimal = filteredMembers.filter(m => m.allocation >= 80 && m.allocation <= 100).length;
    const withConflicts = filteredMembers.filter(m => m.conflicts.length > 0).length;
    const avgAllocation = total > 0 ? filteredMembers.reduce((sum, m) => sum + m.allocation, 0) / total : 0;
    const totalPM = filteredMembers.reduce((sum, m) => sum + m.assignments.reduce((s, a) => s + a.personMonths, 0), 0);
    const totalCapacity = filteredMembers.reduce((sum, m) => sum + m.capacity, 0);

    return { total, overAllocated, underAllocated, optimal, withConflicts, avgAllocation, totalPM, totalCapacity };
  }, [filteredMembers]);

  // Drag-to-schedule handlers
  const handleDragStart = useCallback((e: React.DragEvent, item: typeof dragItem) => {
    if (!item) return;
    setDragItem(item);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify(item));
    // Add visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  }, []);

  // Helper to update drag-over styling via DOM (no re-renders)
  const updateDragOverDOM = useCallback((cellKey: string | null) => {
    // Remove old highlight
    if (dragOverCellRef.current) {
      const oldEl = document.querySelector(`[data-cell-key="${dragOverCellRef.current}"]`);
      if (oldEl) {
        (oldEl as HTMLElement).style.backgroundColor = '';
        (oldEl as HTMLElement).style.outline = '';
      }
    }
    // Add new highlight
    if (cellKey) {
      const newEl = document.querySelector(`[data-cell-key="${cellKey}"]`);
      if (newEl) {
        (newEl as HTMLElement).style.backgroundColor = '#DBEAFE';
        (newEl as HTMLElement).style.outline = '2px solid #3B82F6';
      }
    }
    dragOverCellRef.current = cellKey;
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    setDragItem(null);
    updateDragOverDOM(null);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  }, [updateDragOverDOM]);

  const handleDragOver = useCallback((e: React.DragEvent, cellKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCellRef.current !== cellKey) {
      updateDragOverDOM(cellKey);
    }
  }, [updateDragOverDOM]);

  const handleDragLeave = useCallback(() => {
    updateDragOverDOM(null);
  }, [updateDragOverDOM]);

  // Handle cell edit completion - save the value to gridAllocations
  const handleCellEditComplete = useCallback((rowId: string, period: string, value: string, taskInfo?: { taskId: string; taskName: string; projectId: string; personId: string }) => {
    const hours = parseFloat(value);
    if (isNaN(hours) || hours <= 0) {
      setEditingCell(null);
      return;
    }

    // Find existing allocation or create new one
    setGridAllocations(prev => {
      const existingIdx = prev.findIndex(a => a.personId === (taskInfo?.personId || rowId) && a.period === period && a.taskId === taskInfo?.taskId);

      if (existingIdx >= 0) {
        // Update existing
        const updated = [...prev];
        updated[existingIdx] = { ...updated[existingIdx], hours };
        return updated;
      } else {
        // Create new allocation
        const newAllocation: GridAllocation = {
          id: `${taskInfo?.taskId || rowId}-${period}-${Date.now()}`,
          personId: taskInfo?.personId || rowId,
          projectId: taskInfo?.projectId || '',
          projectName: taskInfo?.taskName || '',
          taskId: taskInfo?.taskId,
          taskName: taskInfo?.taskName,
          hours,
          period
        };
        return [...prev, newAllocation];
      }
    });

    setEditingCell(null);
    console.log('[ResourcePlanner] Cell edit saved:', { rowId, period, hours, taskInfo });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, period: { key: string; startDate: Date; endDate: Date }, personId: string) => {
    e.preventDefault();
    updateDragOverDOM(null);

    if (!dragItem) return;

    console.log('[Drag-to-Schedule] Drop:', {
      dragItem,
      targetPeriod: period.key,
      targetPerson: personId
    });

    // Create a new grid allocation
    const newAllocation: GridAllocation = {
      id: `${dragItem.taskId}-${personId}-${period.key}`,
      personId: personId,
      projectId: dragItem.taskId.split('-')[0] || '', // Will be updated when API integration
      projectName: dragItem.taskName,
      taskId: dragItem.taskId,
      taskName: dragItem.taskName,
      hours: Math.min(dragItem.allocatedHours, gridGranularity === 'monthly' ? 160 : 40), // Suggest reasonable hours
      period: period.key
    };

    setGridAllocations(prev => [...prev, newAllocation]);

    // Show a notification or open edit dialog
    startTransition(() => setEditingCell({
      rowId: personId,
      period: period.key
    }));

    setDragItem(null);
  }, [dragItem, gridGranularity, updateDragOverDOM]);

  // Save allocations to API
  const saveAllocations = useCallback(async () => {
    if (gridAllocations.length === 0) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      console.log('[ResourcePlanner] Saving allocations:', gridAllocations);

      // Separate project-level allocations (no taskId) from task-level ones
      const projectLevelAllocations = gridAllocations.filter(a => !a.taskId);
      const taskLevelAllocations = gridAllocations.filter(a => !!a.taskId);

      // Helper: format Date → DD/MM/YYYY for the API
      const formatDateDMY = (d: Date) =>
        `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;

      // Helper: parse a date string in any format → Date
      const parseDateStr = (s: string): Date => {
        if (s.includes('/')) {
          const [dd, mm, yyyy] = s.split('/');
          return new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
        }
        return new Date(s);
      };

      // ── Project-level allocation resolution ──────────────────────────────
      // Group by personId:projectId so we do one lookup per person+project pair
      const projAllocsByKey = new Map<string, GridAllocation[]>();
      for (const a of projectLevelAllocations) {
        const key = `${a.personId}:${a.projectId}`;
        if (!projAllocsByKey.has(key)) projAllocsByKey.set(key, []);
        projAllocsByKey.get(key)!.push(a);
      }

      // Track General tasks we need to create keyed by projectId
      const generalTasksByProject = new Map<string, { taskId: string; activitiesPayload: any[] }>();
      const unattachableProjectAllocs: GridAllocation[] = [];

      for (const [, allocs] of projAllocsByKey) {
        const { personId, projectId } = allocs[0];
        const member = filteredMembers.find(m => m.id === personId);
        const memberDept = member?.department;

        // Collect all tasks visible for this project across all loaded members
        const projectTaskMap = new Map<string, { taskId: string; taskName: string; depts: Set<string> }>();
        for (const m of filteredMembers) {
          for (const a of m.assignments) {
            if (a.projectId === projectId) {
              if (!projectTaskMap.has(a.taskId)) {
                projectTaskMap.set(a.taskId, { taskId: a.taskId, taskName: a.taskName, depts: new Set() });
              }
              if (m.department) projectTaskMap.get(a.taskId)!.depts.add(m.department);
            }
          }
        }

        if (projectTaskMap.size === 0) {
          // No tasks exist in this project → create a General task
          try {
            let generalInfo = generalTasksByProject.get(projectId);

            if (!generalInfo) {
              const ganttRes = await apiClient.get(`/queries/gantt-plus/${projectId}?resolution=month`) as any;
              const existingActivities: any[] = ganttRes?.result?.activities || ganttRes?.activities || [];

              const now = new Date();
              const oneYearLater = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
              const newGeneralTaskId = crypto.randomUUID();

              let activitiesPayload: any[];

              if (existingActivities.length > 0) {
                activitiesPayload = existingActivities.map((act: any, actIdx: number) => {
                  const existingTasks = (act.tasks || []).map((t: any, tIdx: number) => ({
                    id: t.id,
                    activity: { id: act.id },
                    name: t.name,
                    position: t.position ?? tIdx,
                    startDate: t.startDate ? formatDateDMY(parseDateStr(t.startDate)) : formatDateDMY(now),
                    endDate: t.endDate ? formatDateDMY(parseDateStr(t.endDate)) : formatDateDMY(oneYearLater),
                    plannedHours: String(t.plannedHours || t.availableHours || '0'),
                    availableHours: String(t.availableHours || t.plannedHours || '0'),
                    description: t.description || '',
                    flags: 1,
                  }));

                  // Append General task to the first activity only
                  if (actIdx === 0) {
                    existingTasks.push({
                      id: newGeneralTaskId,
                      activity: { id: act.id },
                      name: 'General',
                      position: existingTasks.length,
                      startDate: formatDateDMY(now),
                      endDate: formatDateDMY(oneYearLater),
                      plannedHours: '0',
                      availableHours: '0',
                      description: '',
                      flags: 1,
                    });
                  }

                  return {
                    id: act.id,
                    name: act.name,
                    position: act.position ?? actIdx,
                    availableHours: String(act.availableHours || '0'),
                    project: { id: projectId },
                    tasks: existingTasks,
                  };
                });
              } else {
                // No activities at all — create a General activity + task
                const newActivityId = crypto.randomUUID();
                activitiesPayload = [{
                  id: newActivityId,
                  name: 'General',
                  position: 0,
                  availableHours: '0',
                  project: { id: projectId },
                  tasks: [{
                    id: newGeneralTaskId,
                    activity: { id: newActivityId },
                    name: 'General',
                    position: 0,
                    startDate: formatDateDMY(now),
                    endDate: formatDateDMY(oneYearLater),
                    plannedHours: '0',
                    availableHours: '0',
                    description: '',
                    flags: 1,
                  }],
                }];
              }

              generalInfo = { taskId: newGeneralTaskId, activitiesPayload };
              generalTasksByProject.set(projectId, generalInfo);
            }

            for (const a of allocs) {
              taskLevelAllocations.push({ ...a, taskId: generalInfo.taskId, taskName: 'General' });
            }
          } catch (err) {
            console.warn('[ResourcePlanner] Could not resolve General task for project:', projectId, err);
            unattachableProjectAllocs.push(...allocs);
          }

        } else {
          // Tasks exist — pick the best one
          let bestTaskId = '';
          let bestTaskName = '';

          if (projectTaskMap.size === 1) {
            const [tid, info] = [...projectTaskMap.entries()][0];
            bestTaskId = tid;
            bestTaskName = info.taskName;
          } else {
            // Multiple tasks: prefer one whose participants share the same department
            if (memberDept) {
              for (const [tid, info] of projectTaskMap) {
                if (info.depts.has(memberDept)) {
                  bestTaskId = tid;
                  bestTaskName = info.taskName;
                  break;
                }
              }
            }
            // Fallback: first task
            if (!bestTaskId) {
              const [tid, info] = [...projectTaskMap.entries()][0];
              bestTaskId = tid;
              bestTaskName = info.taskName;
            }
          }

          for (const a of allocs) {
            taskLevelAllocations.push({ ...a, taskId: bestTaskId, taskName: bestTaskName });
          }
        }
      }

      // Create any new General tasks in the project structure BEFORE saving participants
      // (update-project must come before add-task-participant + commit per CQRS order)
      for (const [projectId, { activitiesPayload }] of generalTasksByProject) {
        console.log('[ResourcePlanner] Creating General task in project:', projectId);
        await apiClient.post('/commands/sync/update-project', { id: projectId, activities: activitiesPayload });
        projectsToCommit.add(projectId);
      }

      // Group task-level allocations by task AND person - each user needs their own API call
      const allocationsByTaskAndPerson = new Map<string, GridAllocation[]>();
      taskLevelAllocations.forEach(alloc => {
        // Extract the actual person ID (might be compound format like "taskId:participantId")
        let personId = alloc.personId;
        if (personId.includes(':')) {
          personId = personId.split(':')[1];
        }
        // Key by both taskId and personId to ensure separate API calls per user
        const key = `${alloc.taskId || alloc.id}::${personId}`;
        if (!allocationsByTaskAndPerson.has(key)) {
          allocationsByTaskAndPerson.set(key, []);
        }
        allocationsByTaskAndPerson.get(key)!.push(alloc);
      });

      console.log('[ResourcePlanner] Grouped allocations by task+person:',
        Array.from(allocationsByTaskAndPerson.entries()).map(([key, allocs]) => ({
          key,
          count: allocs.length,
          hours: allocs.map(a => a.hours)
        }))
      );

      // Track which projects need to be committed
      const projectsToCommit = new Set<string>();

      // Process each task+person's allocations
      for (const [taskPersonKey, allocations] of allocationsByTaskAndPerson) {
        // Extract taskId from the key (format: "taskId::personId")
        const taskId = taskPersonKey.split('::')[0];
        // Find the task and participant info from the first allocation
        const firstAlloc = allocations[0];

        // Calculate total hours for all periods
        const totalHours = allocations.reduce((sum, a) => sum + a.hours, 0);

        // Use projectId directly from the allocation (it's already stored there)
        // Fall back to looking it up from member assignments if not available
        let projectId = firstAlloc.projectId;

        if (!projectId) {
          // Try to find from member assignments
          const member = filteredMembers.find(m => m.id === firstAlloc.personId);
          const assignment = member?.assignments.find(a =>
            a.taskId === taskId || a.taskName === firstAlloc.taskName
          );
          projectId = assignment?.projectId;
        }

        if (!projectId) {
          console.warn('[ResourcePlanner] Could not find project for allocation:', firstAlloc);
          continue;
        }

        // Extract the actual person ID (might be compound format like "taskId:participantId")
        let actualPersonId = firstAlloc.personId;
        if (actualPersonId.includes(':')) {
          // Take the second part which is the participant/user ID
          actualPersonId = actualPersonId.split(':')[1];
        }

        // Find existing plannedSchedule for this task+person to merge with
        let existingSchedule: any[] = [];
        for (const member of filteredMembers) {
          const assignment = member.assignments.find((a: any) =>
            a.taskId === taskId &&
            (a.participantId === actualPersonId || a.userId === actualPersonId || member.id === actualPersonId)
          );
          if (assignment?.plannedSchedule) {
            existingSchedule = [...assignment.plannedSchedule];
            console.log('[DEBUG] Found existing plannedSchedule for merge:', existingSchedule.length, 'entries');
            break;
          }
        }

        // Build the new plannedSchedule entries
        const newScheduleEntries = allocations.map(alloc => {
          // Parse period key to get date range
          const [year, monthOrWeek] = alloc.period.split('-');
          let startDate: Date, endDate: Date;

          if (alloc.period.includes('W')) {
            // Weekly format: YYYY-Wnn
            const weekNum = parseInt(monthOrWeek.replace('W', ''));
            startDate = new Date(parseInt(year), 0, 1 + (weekNum - 1) * 7);
            endDate = new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000);
          } else {
            // Monthly format: YYYY-MM
            const month = parseInt(monthOrWeek) - 1;
            startDate = new Date(parseInt(year), month, 1);
            endDate = new Date(parseInt(year), month + 1, 0);
          }

          // Format dates as DD/MM/YYYY (API format)
          const formatDate = (d: Date) => {
            const day = d.getDate().toString().padStart(2, '0');
            const month = (d.getMonth() + 1).toString().padStart(2, '0');
            const year = d.getFullYear();
            return `${day}/${month}/${year}`;
          };

          return {
            plannedHours: String(alloc.hours),
            startDate: formatDate(startDate),
            endDate: formatDate(endDate),
            soft: false,
            _periodKey: alloc.period // Track which period this is for merging
          };
        });

        // Merge existing schedule with new entries
        // Keep existing entries that don't overlap with new ones
        const mergedSchedule: any[] = [];

        // Helper to normalize date to YYYY-MM format for comparison
        const getYearMonth = (dateStr: string): string => {
          if (!dateStr) return '';
          // Handle ISO format: 2026-02-01T00:00:00.000Z
          if (dateStr.includes('T')) {
            const d = new Date(dateStr);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          }
          // Handle DD/MM/YYYY format
          if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            return `${parts[2]}-${parts[1]}`;
          }
          // Handle YYYY-MM-DD format
          if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return dateStr.substring(0, 7);
          }
          return dateStr;
        };

        // Helper to check if two entries are for the same period
        const periodsMatch = (entry1: any, entry2: any) => {
          return getYearMonth(entry1.startDate) === getYearMonth(entry2.startDate);
        };

        // First, add all existing entries that are NOT being updated
        // IMPORTANT: Skip entries without dates - these are legacy entries that can't be properly merged
        for (const existingEntry of existingSchedule) {
          // Skip entries without dates - they can't be properly compared/merged
          // Check for null, undefined, empty string, or the string 'null'
          const hasValidDate = existingEntry.startDate &&
                               existingEntry.startDate !== null &&
                               existingEntry.startDate !== 'null' &&
                               existingEntry.startDate !== '';
          if (!hasValidDate) {
            console.log('[DEBUG] Skipping entry without valid startDate:', existingEntry.plannedHours, 'startDate:', existingEntry.startDate);
            continue;
          }

          const isBeingUpdated = newScheduleEntries.some(newEntry =>
            periodsMatch(existingEntry, newEntry)
          );
          if (!isBeingUpdated) {
            // Keep existing entry (preserve its format)
            mergedSchedule.push({
              plannedHours: existingEntry.plannedHours || existingEntry.hours,
              startDate: existingEntry.startDate,
              endDate: existingEntry.endDate,
              soft: existingEntry.soft ?? false
            });
          } else {
            console.log('[DEBUG] Replacing entry for period:', getYearMonth(existingEntry.startDate));
          }
        }

        // Then add all new entries (these override any matching existing ones)
        for (const newEntry of newScheduleEntries) {
          // Only add entries with hours > 0
          if (parseFloat(newEntry.plannedHours) > 0) {
            mergedSchedule.push({
              plannedHours: newEntry.plannedHours,
              startDate: newEntry.startDate,
              endDate: newEntry.endDate,
              soft: newEntry.soft
            });
          }
        }

        console.log('[DEBUG] Merged schedule:', {
          existingCount: existingSchedule.length,
          newCount: newScheduleEntries.length,
          mergedCount: mergedSchedule.length
        });

        // Build the API payload using /commands/sync/add-task-participant format
        const payload = {
          id: taskId,
          user: { id: actualPersonId },
          plannedSchedule: mergedSchedule
        };

        // Detailed debug logging
        console.log('[DEBUG] ====== SAVE ALLOCATION ======');
        console.log('[DEBUG] Task ID:', taskId);
        console.log('[DEBUG] User ID:', actualPersonId);
        console.log('[DEBUG] Project ID:', projectId);
        console.log('[DEBUG] Payload:', JSON.stringify(payload, null, 2));
        console.log('[DEBUG] PlannedSchedule entries:');
        mergedSchedule.forEach((entry, idx) => {
          console.log(`[DEBUG]   [${idx}] ${entry.startDate} - ${entry.endDate}: ${entry.plannedHours}h`);
        });

        // Use sync endpoint for plannedSchedule updates (mocks doesn't support it)
        const saveResponse = await apiClient.post('/commands/sync/add-task-participant', payload) as any;
        console.log('[DEBUG] Save response:', JSON.stringify(saveResponse, null, 2));
        projectsToCommit.add(projectId);

        // Verify: Fetch the planned hours to confirm what was saved
        try {
          console.log('[DEBUG] Fetching verification from:', `/queries/tasks/${taskId}/planned-hours?user=${actualPersonId}`);
          const verifyResponse = await apiClient.get(`/queries/tasks/${taskId}/planned-hours?user=${actualPersonId}`) as any;
          console.log('[DEBUG] Verification response:', JSON.stringify(verifyResponse, null, 2));

          // Check if we got back the dates we sent
          if (verifyResponse?.result || verifyResponse) {
            const scheduleData = verifyResponse?.result || verifyResponse;
            if (Array.isArray(scheduleData)) {
              console.log('[DEBUG] Schedule entries returned:');
              scheduleData.forEach((entry: any, idx: number) => {
                console.log(`[DEBUG]   [${idx}] startDate: ${entry.startDate}, endDate: ${entry.endDate}, hours: ${entry.plannedHours || entry.hours}`);
              });
            } else {
              console.log('[DEBUG] Response is not an array:', typeof scheduleData);
            }
          }
        } catch (verifyErr) {
          console.log('[DEBUG] Verification fetch failed:', verifyErr);
        }
        console.log('[DEBUG] ==============================');
      }

      // Commit all affected projects
      for (const projectId of projectsToCommit) {
        console.log('[ResourcePlanner] Committing project:', projectId);
        await apiClient.post('/commands/sync/commit-project', { id: projectId });
      }

      // Clear only the allocations that were actually saved.
      // Project-level allocations that had no task to attach to are kept in state
      // so they remain visible as planning data (they aren't persisted to the backend).
      setGridAllocations(unattachableProjectAllocs);

      // Refresh data to show updated values
      await loadResourceData();

      console.log('[ResourcePlanner] Allocations saved successfully');
    } catch (error) {
      console.error('[ResourcePlanner] Failed to save allocations:', error);
      setSaveError('Failed to save allocations. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [gridAllocations, filteredMembers]);

  // Generate grid periods (columns) based on granularity
  const gridPeriods = useMemo(() => {
    const periods: { key: string; label: string; shortLabel: string; startDate: Date; endDate: Date }[] = [];
    const start = new Date(gridStartDate);

    if (gridGranularity === 'monthly') {
      for (let i = 0; i < gridMonthsToShow; i++) {
        const periodStart = new Date(start.getFullYear(), start.getMonth() + i, 1);
        const periodEnd = new Date(start.getFullYear(), start.getMonth() + i + 1, 0);
        const key = `${periodStart.getFullYear()}-${String(periodStart.getMonth() + 1).padStart(2, '0')}`;
        const label = periodStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const shortLabel = periodStart.toLocaleDateString('en-US', { month: 'short' });
        periods.push({ key, label, shortLabel, startDate: periodStart, endDate: periodEnd });
      }
    } else {
      // Weekly - show weeks for the number of months
      const weeksToShow = gridMonthsToShow * 4;
      for (let i = 0; i < weeksToShow; i++) {
        const periodStart = new Date(start.getTime() + i * 7 * 24 * 60 * 60 * 1000);
        const periodEnd = new Date(periodStart.getTime() + 6 * 24 * 60 * 60 * 1000);
        const weekNum = Math.ceil((periodStart.getTime() - new Date(periodStart.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
        const key = `${periodStart.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
        const label = `W${weekNum}`;
        const shortLabel = `W${weekNum}`;
        periods.push({ key, label, shortLabel, startDate: periodStart, endDate: periodEnd });
      }
    }
    return periods;
  }, [gridStartDate, gridMonthsToShow, gridGranularity]);

  // Fill handle handlers - use DOM manipulation to avoid re-renders during drag
  // Helper to update cell highlighting via DOM (no React re-render)
  const updateFillHighlightDOM = useCallback((cells: Set<string>) => {
    // Remove old highlights
    document.querySelectorAll('[data-fill-highlight="true"]').forEach(el => {
      (el as HTMLElement).style.backgroundColor = '';
      (el as HTMLElement).style.outline = '';
      el.removeAttribute('data-fill-highlight');
    });
    // Add new highlights
    cells.forEach(cellKey => {
      const el = document.querySelector(`[data-cell-key="${cellKey}"]`);
      if (el) {
        (el as HTMLElement).style.backgroundColor = '#D1FAE5';
        (el as HTMLElement).style.outline = '2px solid #10B981';
        el.setAttribute('data-fill-highlight', 'true');
      }
    });
  }, []);

  const handleFillHandleMouseDown = useCallback((
    e: React.MouseEvent,
    rowId: string,
    periodIdx: number,
    value: number,
    taskInfo: { taskId: string; taskName: string; projectId: string; personId: string }
  ) => {
    e.preventDefault();
    e.stopPropagation();
    fillDragRef.current = {
      startRowId: rowId,
      startPeriodIdx: periodIdx,
      value,
      taskInfo,
      direction: null
    };
    const cellKey = `${rowId}:${gridPeriods[periodIdx]?.key}`;
    fillHighlightCellsRef.current = new Set([cellKey]);
    updateFillHighlightDOM(fillHighlightCellsRef.current);
    setIsDraggingFill(true); // Only state change - for cursor
  }, [gridPeriods, updateFillHighlightDOM]);

  const handleFillHandleMouseMove = useCallback((e: React.MouseEvent, rowId: string, periodIdx: number) => {
    const fillDrag = fillDragRef.current;
    if (!fillDrag) return;

    const cells = new Set<string>();
    cells.add(`${fillDrag.startRowId}:${gridPeriods[fillDrag.startPeriodIdx]?.key}`);

    // Only support horizontal fill (across periods in same row)
    if (rowId === fillDrag.startRowId) {
      const start = Math.min(fillDrag.startPeriodIdx, periodIdx);
      const end = Math.max(fillDrag.startPeriodIdx, periodIdx);
      for (let i = start; i <= end; i++) {
        if (gridPeriods[i]) {
          cells.add(`${rowId}:${gridPeriods[i].key}`);
        }
      }
    }

    fillHighlightCellsRef.current = cells;
    updateFillHighlightDOM(cells); // DOM update, no React re-render
  }, [gridPeriods, updateFillHighlightDOM]);

  const handleFillHandleMouseUp = useCallback(() => {
    const fillDrag = fillDragRef.current;
    const currentHighlightCells = fillHighlightCellsRef.current;

    // Clear DOM highlights
    updateFillHighlightDOM(new Set());

    if (!fillDrag || currentHighlightCells.size <= 1) {
      fillDragRef.current = null;
      fillHighlightCellsRef.current = new Set();
      setIsDraggingFill(false);
      return;
    }

    // Apply the value to all highlighted cells (except the original)
    const originalKey = `${fillDrag.startRowId}:${gridPeriods[fillDrag.startPeriodIdx]?.key}`;
    const allocationsToAdd: GridAllocation[] = [];

    currentHighlightCells.forEach(cellKey => {
      if (cellKey === originalKey) return;

      const lastColonIdx = cellKey.lastIndexOf(':');
      const periodKey = lastColonIdx >= 0 ? cellKey.substring(lastColonIdx + 1) : null;
      if (!periodKey) return;

      allocationsToAdd.push({
        id: `${fillDrag.taskInfo.taskId}-${periodKey}-${Date.now()}`,
        personId: fillDrag.taskInfo.personId,
        projectId: fillDrag.taskInfo.projectId,
        projectName: fillDrag.taskInfo.taskName,
        taskId: fillDrag.taskInfo.taskId,
        taskName: fillDrag.taskInfo.taskName,
        hours: fillDrag.value,
        period: periodKey
      });
    });

    // Single state update with all allocations
    if (allocationsToAdd.length > 0) {
      setGridAllocations(prev => {
        let updated = [...prev];
        allocationsToAdd.forEach(newAlloc => {
          const existingIdx = updated.findIndex(a =>
            a.personId === newAlloc.personId &&
            a.period === newAlloc.period &&
            a.taskId === newAlloc.taskId
          );
          if (existingIdx >= 0) {
            updated[existingIdx] = { ...updated[existingIdx], hours: newAlloc.hours };
          } else {
            updated.push(newAlloc);
          }
        });
        return updated;
      });
    }

    fillDragRef.current = null;
    fillHighlightCellsRef.current = new Set();
    setIsDraggingFill(false);
  }, [gridPeriods, updateFillHighlightDOM]);

  // Global mouse up handler for fill drag
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (fillDragRef.current) {
        handleFillHandleMouseUp();
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [handleFillHandleMouseUp]);

  // MEMOIZED handlers for GridCell - stable references prevent re-renders
  const handleGridCellSave = useCallback((ctx: CellContext, newValue: number) => {
    handleCellEditComplete(ctx.rowId, ctx.period, newValue.toString(), {
      taskId: ctx.taskId || '',
      taskName: ctx.taskName || '',
      projectId: ctx.projectId || '',
      personId: ctx.personId
    });
  }, [handleCellEditComplete]);

  const handleGridCellDragStart = useCallback((ctx: CellContext, e: React.DragEvent) => {
    handleDragStart(e, {
      type: ctx.currentValue > 0 ? 'scheduled' : 'unscheduled',
      taskId: ctx.taskId || '',
      taskName: ctx.taskName || '',
      participantId: ctx.rowId,
      personId: ctx.personId,
      personName: ctx.personName || 'Unknown',
      allocatedHours: ctx.currentValue,
      sourcePeriod: ctx.period
    });
  }, [handleDragStart]);

  const handleGridCellFillMouseDown = useCallback((ctx: CellContext, e: React.MouseEvent) => {
    handleFillHandleMouseDown(e, ctx.rowId, ctx.periodIdx, ctx.currentValue, {
      taskId: ctx.taskId || '',
      taskName: ctx.taskName || '',
      projectId: ctx.projectId || '',
      personId: ctx.personId
    });
  }, [handleFillHandleMouseDown]);

  // No-op handler for read-only aggregate cells (stable reference)
  const handleReadOnlyCellSave = useCallback(() => {
    // Child-level cells are read-only aggregates - do nothing
  }, []);

  // Convert existing assignments to grid allocations using plannedSchedule
  const gridAllocationsByCell = useMemo(() => {
    const allocations = new Map<string, { total: number; byProject: Map<string, number>; hasUnscheduled: boolean }>();

    filteredMembers.forEach(member => {
      member.assignments.forEach(assignment => {
        gridPeriods.forEach(period => {
          const cellKey = `${member.id}:${period.key}`;
          if (!allocations.has(cellKey)) {
            allocations.set(cellKey, { total: 0, byProject: new Map(), hasUnscheduled: false });
          }
          const cell = allocations.get(cellKey)!;

          // First check if period is within task date range
          let isWithinTaskRange = false;
          if (assignment.startDate && assignment.endDate) {
            const taskStart = new Date(assignment.startDate);
            const taskEnd = new Date(assignment.endDate);
            isWithinTaskRange = datesOverlap(taskStart, taskEnd, period.startDate, period.endDate);
          }

          if (isWithinTaskRange) {
            // If plannedSchedule has entries, calculate SCHEDULED hours from those date ranges
            if (assignment.plannedSchedule && assignment.plannedSchedule.length > 0) {
              assignment.plannedSchedule.forEach(schedule => {
                // Fall back to assignment dates if schedule entry doesn't have dates
                const scheduleStart = schedule.startDate ? parseDate(schedule.startDate) : new Date(assignment.startDate);
                const scheduleEnd = schedule.endDate ? parseDate(schedule.endDate) : new Date(assignment.endDate);
                const schedulePlannedHours = parseFloat(schedule.plannedHours || schedule.hours || '0');

                if (datesOverlap(scheduleStart, scheduleEnd, period.startDate, period.endDate) && schedulePlannedHours > 0) {
                  const overlapStart = new Date(Math.max(scheduleStart.getTime(), period.startDate.getTime()));
                  const overlapEnd = new Date(Math.min(scheduleEnd.getTime(), period.endDate.getTime()));
                  const workingDaysInSchedule = countWorkingDays(scheduleStart, scheduleEnd);
                  const workingDaysInPeriod = countWorkingDays(overlapStart, overlapEnd);

                  if (workingDaysInSchedule > 0) {
                    const periodHours = Math.round((schedulePlannedHours * workingDaysInPeriod / workingDaysInSchedule) * 100) / 100;
                    cell.total += periodHours;
                    cell.byProject.set(assignment.projectId, (cell.byProject.get(assignment.projectId) || 0) + periodHours);
                  }
                }
              });
            } else if (assignment.allocatedHours > 0) {
              // Within task range, no plannedSchedule, but has allocatedHours = UNSCHEDULED
              // Don't add to total, but mark as having unscheduled work
              cell.hasUnscheduled = true;
            }
          }
          // If outside task range or no allocation = no data for this cell
        });
      });
    });

    return allocations;
  }, [filteredMembers, gridPeriods]);

  // Grid data organized by hierarchy (3 levels: Person > Project > Task OR Project > Task > Person)
  const gridData = useMemo(() => {
    if (gridHierarchy === 'person') {
      // Person > Project > Task structure
      return filteredMembers.map(member => ({
        id: member.id,
        type: 'person' as const,
        name: member.name,
        avatar: member.avatar,
        department: member.department,
        capacity: member.capacity,
        children: Array.from(new Set(member.assignments.map(a => a.projectId))).map(projectId => {
          const projectAssignments = member.assignments.filter(a => a.projectId === projectId);
          const project = projectsList.find(p => p.id === projectId);
          return {
            id: `${member.id}:${projectId}`,
            type: 'project' as const,
            name: project?.name || projectAssignments[0]?.projectName || 'Unknown',
            color: project?.color || projectAssignments[0]?.color || '#6B7280',
            parentId: member.id,
            projectId,
            // Tasks as children of project
            children: projectAssignments.map(assignment => ({
              id: assignment.id,
              type: 'task' as const,
              name: assignment.taskName,
              taskId: assignment.taskId,
              workPackage: assignment.workPackage,
              parentId: `${member.id}:${projectId}`,
              assignment
            }))
          };
        })
      }));
    } else {
      // Project > Task > Person structure - show ALL projects from projectsList
      const projectMap = new Map<string, {
        project: any;
        tasks: Map<string, { assignment: Assignment; members: Map<string, TeamMember> }>
      }>();

      // Initialize with ALL projects from the API
      projectsList.forEach(project => {
        projectMap.set(project.id, {
          project,
          tasks: new Map()
        });
      });

      // Add assignments to their respective projects and tasks
      filteredMembers.forEach(member => {
        member.assignments.forEach(assignment => {
          const projectId = assignment.projectId;

          if (!projectMap.has(projectId)) {
            projectMap.set(projectId, {
              project: { id: projectId, name: assignment.projectName, color: assignment.color },
              tasks: new Map()
            });
          }

          const projectEntry = projectMap.get(projectId)!;
          const taskKey = assignment.taskId || assignment.id;

          if (!projectEntry.tasks.has(taskKey)) {
            projectEntry.tasks.set(taskKey, {
              assignment,
              members: new Map()
            });
          }
          projectEntry.tasks.get(taskKey)!.members.set(member.id, member);
        });
      });

      return Array.from(projectMap.values())
        .map(({ project, tasks }) => ({
          id: project.id,
          type: 'project' as const,
          name: project.name,
          color: project.color,
          children: Array.from(tasks.values()).map(({ assignment, members }) => ({
            id: assignment.taskId || assignment.id,
            type: 'task' as const,
            name: assignment.taskName,
            workPackage: assignment.workPackage,
            parentId: project.id,
            assignment,
            children: Array.from(members.values()).map(member => ({
              id: `${assignment.taskId || assignment.id}:${member.id}`,
              type: 'person' as const,
              name: member.name,
              avatar: member.avatar,
              department: member.department,
              capacity: member.capacity,
              parentId: assignment.taskId || assignment.id,
              personId: member.id,  // Pure person ID for consistent lookup across views
              userId: member.id,    // Alias for compatibility
              assignment: member.assignments.find(a => (a.taskId || a.id) === (assignment.taskId || assignment.id))
            }))
          }))
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }
  }, [filteredMembers, projectsList, gridHierarchy]);

  // Pre-compute cell data to avoid heavy calculations during render
  // This runs once when data changes, not on every render
  const precomputedCellData = useMemo(() => {
    const cellData = new Map<string, { hours: number; hasUnscheduled: boolean; hasPending: boolean }>();

    // Helper to process a grandchild (task row)
    const processGrandchild = (grandchild: any, child: any, row: any) => {
      gridPeriods.forEach(period => {
        let periodHours = 0;
        let hasUnscheduled = false;
        const assignment = grandchild.assignment;

        // Check if period is within task date range
        let isWithinTaskRange = false;
        if (assignment?.startDate && assignment?.endDate) {
          const taskStart = new Date(assignment.startDate);
          const taskEnd = new Date(assignment.endDate);
          isWithinTaskRange = datesOverlap(taskStart, taskEnd, period.startDate, period.endDate);
        }

        if (assignment && isWithinTaskRange) {
          if (assignment.plannedSchedule && assignment.plannedSchedule.length > 0) {
            // Calculate hours from scheduled entries
            assignment.plannedSchedule.forEach((schedule: any) => {
              const scheduleStart = schedule.startDate ? parseDate(schedule.startDate) : new Date(assignment.startDate);
              const scheduleEnd = schedule.endDate ? parseDate(schedule.endDate) : new Date(assignment.endDate);
              const schedulePlannedHours = parseFloat(schedule.plannedHours || schedule.hours || '0');

              if (datesOverlap(scheduleStart, scheduleEnd, period.startDate, period.endDate) && schedulePlannedHours > 0) {
                const overlapStart = new Date(Math.max(scheduleStart.getTime(), period.startDate.getTime()));
                const overlapEnd = new Date(Math.min(scheduleEnd.getTime(), period.endDate.getTime()));
                const workingDaysInSchedule = countWorkingDays(scheduleStart, scheduleEnd);
                const workingDaysInPeriod = countWorkingDays(overlapStart, overlapEnd);

                if (workingDaysInSchedule > 0) {
                  periodHours += Math.round((schedulePlannedHours * workingDaysInPeriod / workingDaysInSchedule) * 100) / 100;
                }
              }
            });

            // Check for unscheduled hours
            if (periodHours === 0 && assignment.allocatedHours > 0) {
              const totalScheduledFromApi = assignment.plannedSchedule.reduce((sum: number, s: any) =>
                sum + parseFloat(s.plannedHours || s.hours || '0'), 0);
              const pendingPersonId = gridHierarchy === 'person' ? row.id : (grandchild.personId || grandchild.userId || grandchild.id);
              const pendingTaskId = assignment?.taskId || grandchild.taskId || child.id;
              const totalPendingHours = pendingHoursByPersonTask.get(`${pendingPersonId}:${pendingTaskId || ''}`) || 0;
              if (assignment.allocatedHours > totalScheduledFromApi + totalPendingHours) {
                hasUnscheduled = true;
              }
            }
          } else if (assignment.allocatedHours > 0) {
            const pendingPersonId = gridHierarchy === 'person' ? row.id : (grandchild.personId || grandchild.userId || grandchild.id);
            const pendingTaskId = assignment?.taskId || grandchild.taskId || child.id;
            const totalPendingHours = pendingHoursByPersonTask.get(`${pendingPersonId}:${pendingTaskId || ''}`) || 0;
            if (assignment.allocatedHours > totalPendingHours) {
              hasUnscheduled = true;
            }
          }
        }

        // Check for pending allocations
        const effectivePersonId = gridHierarchy === 'person' ? row.id : (grandchild.personId || grandchild.userId || grandchild.id);
        const effectiveTaskId = assignment?.taskId || grandchild.taskId || child.id;
        const allocationKey = `${effectivePersonId}:${period.key}:${effectiveTaskId || ''}`;
        const pendingAllocation = gridAllocationsMap.get(allocationKey);

        if (pendingAllocation) {
          periodHours = pendingAllocation.hours;
          hasUnscheduled = false;
        }

        const cellKey = `${grandchild.id}:${period.key}`;
        cellData.set(cellKey, { hours: periodHours, hasUnscheduled, hasPending: !!pendingAllocation });
      });
    };

    // Process all rows
    gridData.forEach(row => {
      row.children?.forEach((child: any) => {
        child.children?.forEach((grandchild: any) => {
          processGrandchild(grandchild, child, row);
        });
      });
    });

    return cellData;
  }, [gridData, gridPeriods, gridHierarchy, gridAllocationsMap, pendingHoursByPersonTask]);

  // Handle grid cell update
  const updateGridAllocation = useCallback((personId: string, projectId: string, period: string, hours: number) => {
    setGridAllocations(prev => {
      const existing = prev.find(a => a.personId === personId && a.projectId === projectId && a.period === period);
      if (existing) {
        if (hours === 0) {
          return prev.filter(a => a !== existing);
        }
        return prev.map(a => a === existing ? { ...a, hours } : a);
      }
      if (hours > 0) {
        const project = projectsList.find(p => p.id === projectId);
        return [...prev, {
          id: `${personId}:${projectId}:${period}`,
          personId,
          projectId,
          projectName: project?.name || 'Unknown',
          hours,
          period
        }];
      }
      return prev;
    });
  }, [projectsList]);

  // Generate forecast data (uses filteredMembers from header filters)
  const forecastData = useMemo((): ForecastPeriod[] => {
    const periods: ForecastPeriod[] = [];
    const now = new Date();

    for (let i = 0; i < 12; i++) {
      const periodStart = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + i + 1, 0);
      const weeksInMonth = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (7 * 24 * 60 * 60 * 1000));

      let totalCapacity = 0;
      let totalAllocated = 0;

      filteredMembers.forEach(member => {
        // Calculate available capacity (minus leave)
        let availableWeeks = weeksInMonth;
        member.leave.forEach(leave => {
          const leaveStart = new Date(leave.startDate);
          const leaveEnd = new Date(leave.endDate);
          if (datesOverlap(leaveStart, leaveEnd, periodStart, periodEnd)) {
            const overlapStart = leaveStart > periodStart ? leaveStart : periodStart;
            const overlapEnd = leaveEnd < periodEnd ? leaveEnd : periodEnd;
            const leaveDays = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (24 * 60 * 60 * 1000));
            availableWeeks -= leaveDays / 7;
          }
        });

        totalCapacity += Math.max(0, availableWeeks) * member.capacity;

        // Calculate allocated hours for this period
        // If project filter is active, only count hours from that project
        const assignmentsToCount = selectedProject !== 'all'
          ? member.assignments.filter(a => a.projectId === selectedProject)
          : member.assignments;

        assignmentsToCount.forEach(assignment => {
          const assignStart = new Date(assignment.startDate);
          const assignEnd = new Date(assignment.endDate);
          if (datesOverlap(assignStart, assignEnd, periodStart, periodEnd)) {
            const overlapStart = assignStart > periodStart ? assignStart : periodStart;
            const overlapEnd = assignEnd < periodEnd ? assignEnd : periodEnd;
            const overlapWeeks = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
            totalAllocated += overlapWeeks * assignment.hoursPerWeek;
          }
        });
      });

      periods.push({
        period: periodStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        startDate: periodStart,
        endDate: periodEnd,
        capacity: Math.round(totalCapacity),
        allocated: Math.round(totalAllocated),
        available: Math.round(totalCapacity - totalAllocated),
        utilizationPercent: totalCapacity > 0 ? Math.round((totalAllocated / totalCapacity) * 100) : 0
      });
    }

    return periods;
  }, [filteredMembers, selectedProject]);

  // Skills coverage
  const skillsCoverage = useMemo(() => {
    const coverage: Record<string, { total: number; available: number; members: string[] }> = {};

    allSkills.forEach(skill => {
      const membersWithSkill = filteredMembers.filter(m => m.skills.includes(skill));
      const availableMembers = membersWithSkill.filter(m => m.allocation < 100);

      coverage[skill] = {
        total: membersWithSkill.length,
        available: availableMembers.length,
        members: membersWithSkill.map(m => m.name)
      };
    });

    return coverage;
  }, [filteredMembers, allSkills]);

  // Generate timeline periods
  const timelinePeriods = useMemo(() => {
    return generatePeriods(currentDate, timeRange);
  }, [currentDate, timeRange]);

  // Navigation
  const navigateDate = useCallback((direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      switch (timeRange) {
        case 'week':
          newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
          break;
        case 'month':
          newDate.setDate(newDate.getDate() + (direction === 'next' ? 28 : -28));
          break;
        case 'quarter':
          newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 3 : -3));
          break;
        case 'year':
          newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1));
          break;
      }
      return newDate;
    });
  }, [timeRange]);

  const goToToday = useCallback(() => {
    setCurrentDate(getStartOfWeek(new Date()));
  }, []);

  const toggleDepartment = useCallback((deptId: string) => {
    setCollapsedDepartments(prev => {
      const next = new Set(prev);
      if (next.has(deptId)) next.delete(deptId);
      else next.add(deptId);
      return next;
    });
  }, []);

  // Export to CSV for EU reporting
  const exportToCSV = useCallback(() => {
    const headers = ['Name', 'Department', 'Role', 'Project', 'Work Package', 'Task', 'Start Date', 'End Date', 'Total Hours', 'Person-Months', 'Progress %'];
    const rows: string[][] = [];

    filteredMembers.forEach(m => {
      if (m.assignments.length === 0) {
        rows.push([m.name, m.department, m.role, '', '', '', '', '', '0', '0', '']);
      } else {
        m.assignments.forEach(a => {
          rows.push([
            m.name,
            m.department,
            m.role,
            a.projectName,
            a.workPackage || '',
            a.taskName,
            formatDate(new Date(a.startDate), 'medium'),
            formatDate(new Date(a.endDate), 'medium'),
            a.hours.toString(),
            a.personMonths.toString(),
            (a.progress || 0).toString()
          ]);
        });
      }
    });

    // Summary section
    rows.push([]);
    rows.push(['=== SUMMARY ===']);
    rows.push(['Total Team Members', stats.total.toString()]);
    rows.push(['Total Person-Months', stats.totalPM.toFixed(2)]);
    rows.push(['Average Utilization', `${Math.round(stats.avgAllocation)}%`]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resource-report-${formatDate(new Date(), 'short').replace(/\s/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredMembers, stats]);

  // Export PM report for EU
  const exportPMReport = useCallback(() => {
    const headers = ['Partner', 'Work Package', 'Person-Months Planned', 'Person-Months Actual', 'Variance'];
    const rows: string[][] = [];

    // Group by WP and partner (department)
    const wpByDept: Record<string, Record<string, { planned: number; actual: number }>> = {};

    filteredMembers.forEach(m => {
      const dept = m.department;
      m.assignments.forEach(a => {
        const wp = a.workPackage || 'Unassigned';
        if (!wpByDept[dept]) wpByDept[dept] = {};
        if (!wpByDept[dept][wp]) wpByDept[dept][wp] = { planned: 0, actual: 0 };
        wpByDept[dept][wp].planned += a.plannedPM || a.personMonths;
        wpByDept[dept][wp].actual += a.actualPM || 0;
      });
    });

    Object.entries(wpByDept).forEach(([dept, wps]) => {
      Object.entries(wps).forEach(([wp, data]) => {
        rows.push([
          dept,
          wp,
          data.planned.toFixed(2),
          data.actual.toFixed(2),
          (data.planned - data.actual).toFixed(2)
        ]);
      });
    });

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eu-pm-report-${formatDate(new Date(), 'short').replace(/\s/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredMembers]);

  const getAllocationColor = useCallback((allocation: number) => {
    if (allocation > 100) return '#EF4444';
    if (allocation < 80) return '#F59E0B';
    return '#10B981';
  }, []);

  const getAllocationBgColor = useCallback((allocation: number) => {
    if (allocation > 100) return '#FEF2F2';
    if (allocation < 80) return '#FFFBEB';
    return '#F0FDF4';
  }, []);

  const getAllocationIcon = useCallback((allocation: number) => {
    if (allocation > 100) return <TrendingUp className="w-4 h-4" />;
    if (allocation < 80) return <TrendingDown className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  }, []);

  const getAllocationLabel = useCallback((allocation: number) => {
    if (allocation > 100) return 'Over';
    if (allocation < 80) return 'Under';
    return 'Optimal';
  }, []);

  // Date range label
  const dateRangeLabel = useMemo(() => {
    const start = timelinePeriods[0]?.start;
    const end = timelinePeriods[timelinePeriods.length - 1]?.end;
    if (!start || !end) return '';

    switch (timeRange) {
      case 'week':
        return `Week ${getWeekNumber(start)}, ${start.getFullYear()}`;
      case 'month':
        return start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      case 'quarter':
        return `Q${Math.floor(start.getMonth() / 3) + 1} ${start.getFullYear()}`;
      case 'year':
        return start.getFullYear().toString();
      default:
        return '';
    }
  }, [timelinePeriods, timeRange]);

  // Calculate task bar position
  const getTaskBarStyle = useCallback((assignment: Assignment, periods: { start: Date; end: Date }[]) => {
    const startDate = new Date(assignment.startDate);
    const endDate = new Date(assignment.endDate);
    const timelineStart = periods[0]?.start;
    const timelineEnd = periods[periods.length - 1]?.end;

    if (!timelineStart || !timelineEnd || endDate < timelineStart || startDate > timelineEnd) {
      return null;
    }

    const effectiveStart = startDate < timelineStart ? timelineStart : startDate;
    const effectiveEnd = endDate > timelineEnd ? timelineEnd : endDate;
    const totalDuration = timelineEnd.getTime() - timelineStart.getTime();
    const startOffset = effectiveStart.getTime() - timelineStart.getTime();
    const barDuration = effectiveEnd.getTime() - effectiveStart.getTime();

    return {
      left: `${(startOffset / totalDuration) * 100}%`,
      width: `${(barDuration / totalDuration) * 100}%`,
      backgroundColor: assignment.color,
      startsBeforeTimeline: startDate < timelineStart,
      endsAfterTimeline: endDate > timelineEnd
    };
  }, []);

  // Memoized handlers for timeline navigation buttons
  const navigatePrev = useCallback(() => navigateDate('prev'), [navigateDate]);
  const navigateNext = useCallback(() => navigateDate('next'), [navigateDate]);

  // Memoized handlers for allocation filter stat card toggles
  const toggleAllocFilterOver = useCallback(() => {
    setAllocationFilter(prev => prev === 'over' ? 'all' : 'over');
  }, []);

  const toggleAllocFilterUnder = useCallback(() => {
    setAllocationFilter(prev => prev === 'under' ? 'all' : 'under');
  }, []);

  const toggleAllocFilterOptimal = useCallback(() => {
    setAllocationFilter(prev => prev === 'optimal' ? 'all' : 'optimal');
  }, []);

  const toggleAllocFilterConflicts = useCallback(() => {
    setAllocationFilter(prev => prev === 'conflicts' ? 'all' : 'conflicts');
  }, []);

  // Memoized handlers for filter select changes
  const handleDepartmentChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDepartment(e.target.value);
  }, []);

  const handleProjectChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProject(e.target.value);
  }, []);

  const handleSkillChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSkill(e.target.value);
  }, []);

  // Memoized handlers for display unit toggle
  const setDisplayUnitHours = useCallback(() => setDisplayUnit('hours'), []);
  const setDisplayUnitPM = useCallback(() => setDisplayUnit('personMonths'), []);

  // Memoized handlers for grid hierarchy and granularity toggles
  const setGridHierarchyPerson = useCallback(() => setGridHierarchy('person'), []);
  const setGridHierarchyProject = useCallback(() => setGridHierarchy('project'), []);
  const setGridGranularityMonthly = useCallback(() => setGridGranularity('monthly'), []);
  const setGridGranularityWeekly = useCallback(() => setGridGranularity('weekly'), []);

  // Memoized handler for person search query
  const handlePersonSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPersonSearchQuery(e.target.value);
  }, []);

  // Memoized handlers for modal closers
  const closeSelectedTask = useCallback(() => setSelectedTask(null), []);
  const closeEditingCapacity = useCallback(() => setEditingCapacity(null), []);
  const closeEditingLeave = useCallback(() => setEditingLeave(null), []);

  // Memoized handlers for grid date navigation
  const gridNavigatePrev = useCallback(() => {
    setGridStartDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const gridNavigateNext = useCallback(() => {
    setGridStartDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const gridNavigateToday = useCallback(() => {
    setGridStartDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  }, []);

  // Memoized handler for grid months to show
  const handleGridMonthsChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setGridMonthsToShow(parseInt(e.target.value));
  }, []);

  // Memoized handler for clearing all filters
  const clearAllFilters = useCallback(() => {
    setSelectedDepartment('all');
    setSelectedProject('all');
    setSelectedPeople(new Set());
    setSelectedSkill('all');
    setAllocationFilter('all');
  }, []);

  // Memoized handler for toggling group by department
  const toggleGroupByDepartment = useCallback(() => {
    setGroupByDepartment(prev => !prev);
  }, []);

  // Memoized handler for toggling person dropdown
  const togglePersonDropdown = useCallback(() => {
    setShowPersonDropdown(prev => !prev);
  }, []);

  // Memoized handler for closing person dropdown
  const closePersonDropdown = useCallback(() => {
    setShowPersonDropdown(false);
    setPersonSearchQuery('');
  }, []);

  // Memoized handler for AGGridView onToggleExpand
  const handleToggleExpand = useCallback((rowId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  }, []);

  // Memoized handler for AGGridView onCellEdit
  const handleAGGridCellEdit = useCallback((rowId: string, period: string, value: number, taskInfo?: { taskId: string; taskName: string; projectId: string; personId: string }) => {
    handleCellEditComplete(rowId, period, value.toString(), taskInfo);
  }, [handleCellEditComplete]);

  // Render timeline row
  const renderTimelineRow = useCallback((member: TeamMember, isLast: boolean) => (
    <tr key={member.id} style={{ borderBottom: isLast ? 'none' : '1px solid #F3F4F6' }}>
      <td style={{
        padding: '6px 8px',
        position: 'sticky',
        left: 0,
        backgroundColor: 'white',
        zIndex: 5,
        borderRight: '1px solid #E5E7EB',
        whiteSpace: 'nowrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: '#E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: '500',
            color: '#6B7280',
            flexShrink: 0,
            position: 'relative'
          }}>
            {member.avatar ? (
              <img src={member.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
            )}
            {member.conflicts.length > 0 && (
              <div style={{
                position: 'absolute',
                top: -2,
                right: -2,
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: member.conflicts.some(c => c.severity === 'error') ? '#EF4444' : '#F59E0B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AlertCircle className="w-2 h-2" style={{ color: 'white' }} />
              </div>
            )}
          </div>
          <div>
            <div style={{ fontWeight: '500', fontSize: '12px', color: '#111827', whiteSpace: 'nowrap' }}>
              {member.name}
            </div>
          </div>
        </div>
      </td>

      <td style={{ padding: '6px 4px', textAlign: 'center', width: '50px', borderRight: '1px solid #F3F4F6' }}>
        <button
          onClick={(e) => { setEditingCapacity({ member, position: { x: e.currentTarget.getBoundingClientRect().left, y: e.currentTarget.getBoundingClientRect().bottom + 4 } }); }}
          style={{ padding: '2px 4px', borderRadius: '4px', border: '1px solid transparent', backgroundColor: 'transparent', fontSize: '11px', color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', margin: '0 auto' }}
        >
          {member.capacity}h
          <Edit2 className="w-2 h-2" style={{ color: '#9CA3AF' }} />
        </button>
      </td>

      <td style={{ padding: '6px 4px', textAlign: 'center', width: '50px', borderRight: '1px solid #F3F4F6' }}>
        <div style={{ fontSize: '11px', fontWeight: '500', color: '#111827' }}>
          {displayUnit === 'hours'
            ? `${member.assignments.reduce((s, a) => s + a.hours, 0).toFixed(2)}h`
            : `${member.assignments.reduce((s, a) => s + a.personMonths, 0).toFixed(2)}`
          }
        </div>
      </td>

      <td style={{ padding: '4px 2px', textAlign: 'center', width: '60px', borderRight: '1px solid #E5E7EB' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '2px',
          padding: '2px 6px',
          borderRadius: '4px',
          backgroundColor: getAllocationBgColor(member.allocation),
          color: getAllocationColor(member.allocation),
          fontSize: '11px',
          fontWeight: '600'
        }}>
          {member.allocation}%
        </div>
      </td>

      <td style={{ padding: '4px 2px', textAlign: 'center', width: '30px', borderRight: '1px solid #E5E7EB' }}>
        <button
          onClick={() => setEditingLeave(member)}
          style={{
            padding: '2px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: member.leave.length > 0 ? '#FEF3C7' : 'transparent',
            cursor: 'pointer',
            color: member.leave.length > 0 ? '#D97706' : '#9CA3AF'
          }}
          title="Manage leave"
        >
          <Plane className="w-3 h-3" />
        </button>
      </td>

      <td style={{ padding: '4px 8px', position: 'relative' }}>
        <div style={{ position: 'relative', height: '48px', backgroundColor: '#FAFAFA', borderRadius: '4px' }}>
          {/* Period grid */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex' }}>
            {timelinePeriods.map((period, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  borderRight: i < timelinePeriods.length - 1 ? '1px solid #F3F4F6' : 'none',
                  backgroundColor: period.start.getDay() === 0 || period.start.getDay() === 6 ? '#F5F5F5' : 'transparent'
                }}
              />
            ))}
          </div>

          {/* Leave bars */}
          {member.leave.map((leave, idx) => {
            const style = getTaskBarStyle({
              ...leave,
              id: leave.id,
              taskId: leave.id,
              projectId: '',
              projectName: '',
              taskName: leave.type,
              hours: 0,
              hoursPerWeek: 0,
              personMonths: 0,
              startDate: leave.startDate,
              endDate: leave.endDate,
              role: '',
              color: LEAVE_COLORS[leave.type]
            } as any, timelinePeriods);
            if (!style) return null;
            return (
              <div
                key={leave.id}
                style={{
                  position: 'absolute',
                  top: '2px',
                  left: style.left,
                  width: style.width,
                  height: '6px',
                  backgroundColor: LEAVE_COLORS[leave.type],
                  borderRadius: '2px',
                  opacity: 0.6
                }}
                title={`${leave.type}: ${formatDate(new Date(leave.startDate), 'short')} - ${formatDate(new Date(leave.endDate), 'short')}`}
              />
            );
          })}

          {/* Task bars */}
          <div style={{ position: 'relative', height: '100%', padding: '10px 0 4px' }}>
            {member.assignments.map((assignment, idx) => {
              const style = getTaskBarStyle(assignment, timelinePeriods);
              if (!style) return null;

              return (
                <div
                  key={assignment.id}
                  style={{
                    position: 'absolute',
                    top: `${10 + idx * 14}px`,
                    left: style.left,
                    width: style.width,
                    height: '12px',
                    backgroundColor: style.backgroundColor,
                    borderRadius: style.startsBeforeTimeline ? '0 3px 3px 0' : style.endsAfterTimeline ? '3px 0 0 3px' : '3px',
                    cursor: 'pointer',
                    transition: 'transform 0.1s ease, box-shadow 0.1s ease',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scaleY(1.2)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                    const rect = e.currentTarget.getBoundingClientRect();
                    setTooltip({ assignment, position: { x: rect.left + rect.width / 2, y: rect.top } });
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scaleY(1)';
                    e.currentTarget.style.boxShadow = 'none';
                    setTooltip(null);
                  }}
                  onClick={() => setSelectedTask({ assignment, member })}
                >
                  {assignment.progress !== undefined && assignment.progress > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      height: '100%',
                      width: `${assignment.progress}%`,
                      backgroundColor: 'rgba(255,255,255,0.3)',
                      borderRadius: 'inherit'
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </td>
    </tr>
  ), [displayUnit, timelinePeriods, getTaskBarStyle, getAllocationBgColor, getAllocationColor]);

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: '#F9FAFB' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #E5E7EB', padding: '10px 24px', flexShrink: 0 }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 style={{ fontSize: '17px', fontWeight: '600', color: '#111827', marginBottom: '2px' }}>Resource Planner</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <p style={{ fontSize: '14px', color: '#6B7280' }}>Manage team capacity and project assignments</p>
              {isLoadingGanttData && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '2px 8px', backgroundColor: '#EFF6FF', borderRadius: '4px' }}>
                  <Loader2 className="w-3 h-3 animate-spin" style={{ color: '#2563EB' }} />
                  <span style={{ fontSize: '12px', color: '#2563EB' }}>
                    {`Loading tasks: ${ganttLoadProgress.loaded}/${ganttLoadProgress.total} users...`}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Display unit toggle */}
            <div style={{ display: 'flex', backgroundColor: '#F3F4F6', borderRadius: '6px', padding: '3px' }}>
              <button
                onClick={setDisplayUnitHours}
                style={{
                  padding: '5px 10px',
                  borderRadius: '4px',
                  backgroundColor: displayUnit === 'hours' ? 'white' : 'transparent',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: displayUnit === 'hours' ? '500' : '400',
                  color: displayUnit === 'hours' ? '#0066FF' : '#6B7280',
                  cursor: 'pointer',
                  boxShadow: displayUnit === 'hours' ? '0 1px 2px rgba(0, 0, 0, 0.05)' : 'none'
                }}
              >
                Hours
              </button>
              <button
                onClick={setDisplayUnitPM}
                style={{
                  padding: '5px 10px',
                  borderRadius: '4px',
                  backgroundColor: displayUnit === 'personMonths' ? 'white' : 'transparent',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: displayUnit === 'personMonths' ? '500' : '400',
                  color: displayUnit === 'personMonths' ? '#0066FF' : '#6B7280',
                  cursor: 'pointer',
                  boxShadow: displayUnit === 'personMonths' ? '0 1px 2px rgba(0, 0, 0, 0.05)' : 'none'
                }}
              >
                Person-Months
              </button>
            </div>

            <button
              onClick={exportToCSV}
              style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #E5E7EB', backgroundColor: 'white', fontSize: '13px', color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={exportPMReport}
              style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #10B981', backgroundColor: '#F0FDF4', fontSize: '13px', color: '#059669', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Export EU Person-Months Report"
            >
              <FileSpreadsheet className="w-4 h-4" />
              EU PM Report
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-6 gap-2 mb-3">
          <div style={{ padding: '6px 10px', backgroundColor: '#F9FAFB', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
            <div className="flex items-center gap-1 mb-0.5">
              <Users className="w-3 h-3" style={{ color: '#6B7280' }} />
              <span style={{ fontSize: '11px', color: '#6B7280' }}>Total</span>
            </div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>{stats.total}</div>
          </div>

          <div
            style={{ padding: '6px 10px', backgroundColor: allocationFilter === 'over' ? '#FEE2E2' : '#FEF2F2', borderRadius: '6px', border: `1px solid ${allocationFilter === 'over' ? '#EF4444' : '#FEE2E2'}`, cursor: 'pointer' }}
            onClick={toggleAllocFilterOver}
          >
            <div className="flex items-center gap-1 mb-0.5">
              <AlertTriangle className="w-3 h-3" style={{ color: '#DC2626' }} />
              <span style={{ fontSize: '11px', color: '#991B1B' }}>Over</span>
            </div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#DC2626' }}>{stats.overAllocated}</div>
          </div>

          <div
            style={{ padding: '6px 10px', backgroundColor: allocationFilter === 'under' ? '#FDE68A' : '#FEF3C7', borderRadius: '6px', border: `1px solid ${allocationFilter === 'under' ? '#D97706' : '#FDE68A'}`, cursor: 'pointer' }}
            onClick={toggleAllocFilterUnder}
          >
            <div className="flex items-center gap-1 mb-0.5">
              <Clock className="w-3 h-3" style={{ color: '#D97706' }} />
              <span style={{ fontSize: '11px', color: '#92400E' }}>Under</span>
            </div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#D97706' }}>{stats.underAllocated}</div>
          </div>

          <div
            style={{ padding: '6px 10px', backgroundColor: allocationFilter === 'optimal' ? '#BBF7D0' : '#F0FDF4', borderRadius: '6px', border: `1px solid ${allocationFilter === 'optimal' ? '#16A34A' : '#BBF7D0'}`, cursor: 'pointer' }}
            onClick={toggleAllocFilterOptimal}
          >
            <div className="flex items-center gap-1 mb-0.5">
              <CheckCircle className="w-3 h-3" style={{ color: '#16A34A' }} />
              <span style={{ fontSize: '11px', color: '#166534' }}>Optimal</span>
            </div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#16A34A' }}>{stats.optimal}</div>
          </div>

          <div
            style={{ padding: '6px 10px', backgroundColor: allocationFilter === 'conflicts' ? '#FEE2E2' : '#FFF7ED', borderRadius: '6px', border: `1px solid ${allocationFilter === 'conflicts' ? '#EF4444' : '#FDBA74'}`, cursor: 'pointer' }}
            onClick={toggleAllocFilterConflicts}
          >
            <div className="flex items-center gap-1 mb-0.5">
              <AlertCircle className="w-3 h-3" style={{ color: '#EA580C' }} />
              <span style={{ fontSize: '11px', color: '#9A3412' }}>Conflicts</span>
            </div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#EA580C' }}>{stats.withConflicts}</div>
          </div>

          <div style={{ padding: '6px 10px', backgroundColor: '#EFF6FF', borderRadius: '6px', border: '1px solid #BFDBFE' }}>
            <div className="flex items-center gap-1 mb-0.5">
              <Target className="w-3 h-3" style={{ color: '#2563EB' }} />
              <span style={{ fontSize: '11px', color: '#1E40AF' }}>Total PM</span>
            </div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#2563EB' }}>{stats.totalPM.toFixed(2)}</div>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Multi-Select Person Dropdown */}
            <div style={{ position: 'relative' }}>
              <div
                onClick={togglePersonDropdown}
                style={{
                  padding: '7px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${selectedPeople.size > 0 ? '#2563EB' : '#E5E7EB'}`,
                  fontSize: '13px',
                  backgroundColor: selectedPeople.size > 0 ? '#EFF6FF' : 'white',
                  cursor: 'pointer',
                  minWidth: '150px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px'
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: selectedPeople.size > 0 ? '#2563EB' : '#374151' }}>
                  {selectedPeople.size === 0 ? 'Search People' : `${selectedPeople.size} selected`}
                </span>
                <ChevronDown size={14} style={{ color: selectedPeople.size > 0 ? '#2563EB' : '#6B7280', flexShrink: 0 }} />
              </div>

              {showPersonDropdown && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: '4px',
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    zIndex: 100,
                    width: '280px',
                    maxHeight: '400px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {/* Search input */}
                  <div style={{ padding: '10px', borderBottom: '1px solid #E5E7EB' }}>
                    <div style={{ position: 'relative' }}>
                      <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                      <input
                        type="text"
                        placeholder="Search people..."
                        value={personSearchQuery}
                        onChange={handlePersonSearchChange}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                        style={{
                          width: '100%',
                          padding: '8px 10px 8px 32px',
                          borderRadius: '6px',
                          border: '1px solid #E5E7EB',
                          fontSize: '13px',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  {/* Options list */}
                  <div style={{ overflowY: 'auto', flex: 1, maxHeight: '280px' }}>
                    {filteredPeopleList.map(member => {
                      const isSelected = selectedPeople.has(member.id);
                      return (
                        <div
                          key={member.id}
                          onClick={() => {
                            const newSet = new Set(selectedPeople);
                            if (isSelected) {
                              newSet.delete(member.id);
                            } else {
                              newSet.add(member.id);
                            }
                            setSelectedPeople(newSet);
                          }}
                          style={{
                            padding: '10px 12px',
                            cursor: 'pointer',
                            backgroundColor: isSelected ? '#EFF6FF' : 'transparent',
                            borderBottom: '1px solid #F3F4F6',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                          }}
                          onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = '#F9FAFB'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isSelected ? '#EFF6FF' : 'transparent'; }}
                        >
                          {/* Checkbox */}
                          <div style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '4px',
                            border: `2px solid ${isSelected ? '#2563EB' : '#D1D5DB'}`,
                            backgroundColor: isSelected ? '#2563EB' : 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {isSelected && <Check size={12} style={{ color: 'white' }} />}
                          </div>

                          {/* Avatar */}
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: '#E5E7EB',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            overflow: 'hidden'
                          }}>
                            {member.avatar ? (
                              <img src={member.avatar} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <span style={{ fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>
                                {member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                              </span>
                            )}
                          </div>

                          {/* Name and department */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: '13px',
                              fontWeight: isSelected ? '500' : '400',
                              color: isSelected ? '#2563EB' : '#111827',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {member.name}
                            </div>
                            <div style={{ fontSize: '11px', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {member.department}{member.role ? ` · ${member.role}` : ''}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {filteredPeopleList.length === 0 && (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>
                        No people found
                      </div>
                    )}
                  </div>

                  {/* Footer with Select All / Clear */}
                  <div style={{
                    padding: '10px 12px',
                    borderTop: '1px solid #E5E7EB',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#F9FAFB'
                  }}>
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>
                      {selectedPeople.size} of {teamMembers.length} selected
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPeople(new Set(filteredPeopleList.map(m => m.id)));
                        }}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '4px',
                          border: '1px solid #E5E7EB',
                          backgroundColor: 'white',
                          fontSize: '12px',
                          color: '#374151',
                          cursor: 'pointer'
                        }}
                      >
                        Select All
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPeople(new Set());
                        }}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '4px',
                          border: '1px solid #E5E7EB',
                          backgroundColor: 'white',
                          fontSize: '12px',
                          color: '#374151',
                          cursor: 'pointer'
                        }}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Click outside to close */}
              {showPersonDropdown && (
                <div
                  style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }}
                  onClick={closePersonDropdown}
                />
              )}
            </div>

            <select
              value={selectedDepartment}
              onChange={handleDepartmentChange}
              style={{ padding: '7px 28px 7px 10px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px', backgroundColor: 'white', cursor: 'pointer', outline: 'none' }}
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept.id || dept.name} value={dept.name}>{dept.name}</option>
              ))}
            </select>

            <select
              value={selectedProject}
              onChange={handleProjectChange}
              style={{ padding: '7px 28px 7px 10px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px', backgroundColor: 'white', cursor: 'pointer', outline: 'none' }}
            >
              <option value="all">All Projects</option>
              {projects.map(proj => (
                <option key={proj.id} value={proj.id}>{proj.name}</option>
              ))}
            </select>

            <select
              value={selectedSkill}
              onChange={handleSkillChange}
              style={{ padding: '7px 28px 7px 10px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px', backgroundColor: 'white', cursor: 'pointer', outline: 'none' }}
            >
              <option value="all">All Skills</option>
              {allSkills.map(skill => (
                <option key={skill} value={skill}>{skill}</option>
              ))}
            </select>

            <button
              onClick={toggleGroupByDepartment}
              style={{ padding: '7px 12px', borderRadius: '6px', border: '1px solid #E5E7EB', backgroundColor: groupByDepartment ? '#EFF6FF' : 'white', fontSize: '13px', color: groupByDepartment ? '#2563EB' : '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Layers className="w-4 h-4" />
              Group
            </button>

            {(selectedDepartment !== 'all' || selectedProject !== 'all' || selectedPeople.size > 0 || selectedSkill !== 'all' || allocationFilter !== 'all') && (
              <button
                onClick={clearAllFilters}
                style={{ padding: '7px 12px', borderRadius: '6px', border: 'none', backgroundColor: '#FEE2E2', fontSize: '13px', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>

            {/* View Mode — always on row 1, right-aligned */}
            <div style={{ display: 'flex', flexShrink: 0, backgroundColor: '#F3F4F6', borderRadius: '6px', padding: '3px' }}>
              {[
                { mode: 'timeline' as ViewMode, icon: CalendarDays, label: 'Timeline' },
                { mode: 'grid' as ViewMode, icon: FileSpreadsheet, label: 'Grid' },
                { mode: 'list' as ViewMode, icon: List, label: 'List' },
                { mode: 'forecast' as ViewMode, icon: TrendingUp, label: 'Forecast' },
                { mode: 'skills' as ViewMode, icon: UserCheck, label: 'Skills' }
              ].map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '4px',
                    backgroundColor: viewMode === mode ? 'white' : 'transparent',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: viewMode === mode ? '#0066FF' : '#6B7280',
                    cursor: 'pointer',
                    boxShadow: viewMode === mode ? '0 1px 2px rgba(0, 0, 0, 0.05)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: Time Range + Navigation — only shown for timeline mode */}
          {viewMode === 'timeline' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', backgroundColor: '#F3F4F6', borderRadius: '6px', padding: '3px' }}>
                {['week', 'month', 'quarter', 'year'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range as TimeRange)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '4px',
                      backgroundColor: timeRange === range ? 'white' : 'transparent',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: timeRange === range ? '500' : '400',
                      color: timeRange === range ? '#0066FF' : '#6B7280',
                      cursor: 'pointer',
                      boxShadow: timeRange === range ? '0 1px 2px rgba(0, 0, 0, 0.05)' : 'none',
                      textTransform: 'capitalize'
                    }}
                  >
                    {range}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button onClick={navigatePrev} style={{ padding: '6px', borderRadius: '6px', border: '1px solid #E5E7EB', backgroundColor: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={goToToday} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #E5E7EB', backgroundColor: 'white', fontSize: '13px', color: '#374151', cursor: 'pointer' }}>
                  Today
                </button>
                <div style={{ minWidth: '140px', textAlign: 'center', fontSize: '13px', fontWeight: '500', color: '#111827' }}>
                  {dateRangeLabel}
                </div>
                <button onClick={navigateNext} style={{ padding: '6px', borderRadius: '6px', border: '1px solid #E5E7EB', backgroundColor: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
        {isLoading && !usersLoaded && (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
            {/* Skeleton header row - mimics the timeline table header */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: '#F9FAFB' }}>
              <div style={{ width: '180px', height: '14px', backgroundColor: '#E5E7EB', borderRadius: '4px' }} />
              <div style={{ width: '60px', height: '14px', backgroundColor: '#E5E7EB', borderRadius: '4px' }} />
              <div style={{ width: '60px', height: '14px', backgroundColor: '#E5E7EB', borderRadius: '4px' }} />
              <div style={{ width: '60px', height: '14px', backgroundColor: '#E5E7EB', borderRadius: '4px' }} />
              <div style={{ flex: 1, height: '14px', backgroundColor: '#F3F4F6', borderRadius: '4px' }} />
            </div>
            {/* Skeleton rows with pulse animation - mimics user rows */}
            <div className="animate-pulse" style={{ padding: '8px 0' }}>
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '10px 16px', borderBottom: '1px solid #F3F4F6' }}>
                  {/* Avatar skeleton */}
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#E5E7EB', flexShrink: 0 }} />
                  {/* Name + role skeleton */}
                  <div style={{ width: '160px', flexShrink: 0 }}>
                    <div style={{ width: `${100 - i * 5}%`, height: '12px', backgroundColor: '#E5E7EB', borderRadius: '3px', marginBottom: '6px' }} />
                    <div style={{ width: '60%', height: '10px', backgroundColor: '#F3F4F6', borderRadius: '3px' }} />
                  </div>
                  {/* Capacity skeleton */}
                  <div style={{ width: '50px', height: '10px', backgroundColor: '#F3F4F6', borderRadius: '3px' }} />
                  {/* Allocation skeleton */}
                  <div style={{ width: '50px', height: '10px', backgroundColor: '#F3F4F6', borderRadius: '3px' }} />
                  {/* Timeline bar skeleton */}
                  <div style={{ flex: 1, display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <div key={j} style={{ flex: 1, height: '24px', backgroundColor: j % 3 === i % 3 ? '#EFF6FF' : '#F9FAFB', borderRadius: '4px' }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {/* Loading indicator at bottom */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', gap: '8px', borderTop: '1px solid #E5E7EB' }}>
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#0066FF' }} />
              <span style={{ fontSize: '13px', color: '#6B7280' }}>Loading team members and resource data...</span>
            </div>
          </div>
        )}

        {error && !isLoading && !usersLoaded && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px', backgroundColor: '#FEF2F2', borderRadius: '8px', border: '1px solid #FEE2E2' }}>
            <AlertTriangle className="w-8 h-8" style={{ color: '#DC2626', marginBottom: '16px' }} />
            <div style={{ fontSize: '14px', color: '#DC2626', marginBottom: '16px' }}>{error}</div>
            <button onClick={loadResourceData} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#DC2626', color: 'white', fontSize: '14px', cursor: 'pointer' }}>
              Try Again
            </button>
          </div>
        )}

        {(usersLoaded || !isLoading) && !error && filteredMembers.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
            <Users className="w-12 h-12" style={{ color: '#D1D5DB', marginBottom: '16px' }} />
            <div style={{ fontSize: '16px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>No team members found</div>
            <div style={{ fontSize: '14px', color: '#6B7280' }}>
              {selectedDepartment !== 'all' || selectedProject !== 'all' || selectedPeople.size > 0 || selectedSkill !== 'all' || allocationFilter !== 'all' ? 'Try adjusting your filters' : 'Team members will appear here once added'}
            </div>
          </div>
        )}

        {/* Timeline View */}
        {(usersLoaded || !isLoading) && !error && filteredMembers.length > 0 && viewMode === 'timeline' && (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #E5E7EB', maxHeight: 'calc(100vh - 380px)', overflow: 'auto' }}>
            {/* Task data loading banner - shown when users are visible but allocations still loading */}
            {isLoadingGanttData && usersLoaded && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#EFF6FF', borderBottom: '1px solid #BFDBFE', fontSize: '12px', color: '#2563EB' }}>
                <Loader2 className="w-3 h-3 animate-spin" style={{ color: '#2563EB' }} />
                <span>{`Loading tasks: ${ganttLoadProgress.loaded}/${ganttLoadProgress.total} users...`} Team members are shown below.</span>
              </div>
            )}
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 20 }}>
                <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                  <th style={{ padding: '8px 8px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', position: 'sticky', left: 0, backgroundColor: '#F9FAFB', whiteSpace: 'nowrap', zIndex: 10 }}>Name</th>
                  <th style={{ padding: '8px 4px', textAlign: 'center', fontSize: '11px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', width: '50px' }}>Cap</th>
                  <th style={{ padding: '8px 4px', textAlign: 'center', fontSize: '11px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', width: '50px' }}>{displayUnit === 'hours' ? 'Hrs' : 'PM'}</th>
                  <th style={{ padding: '8px 4px', textAlign: 'center', fontSize: '11px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', width: '60px' }}>Alloc</th>
                  <th style={{ padding: '8px 4px', textAlign: 'center', fontSize: '11px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', width: '30px' }}></th>
                  <th style={{ padding: '8px 8px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', width: '100%' }}>
                    <div style={{ display: 'flex' }}>
                      {timelinePeriods.map((period, i) => (
                        <div key={i} style={{ flex: 1, textAlign: 'center', padding: '0 2px' }}>
                          <div style={{ fontSize: '11px', fontWeight: '600' }}>{period.label}</div>
                        </div>
                      ))}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {groupByDepartment && departmentGroups ? (
                  departmentGroups.map((group, groupIdx) => (
                    <React.Fragment key={group.id}>
                      <tr style={{ backgroundColor: '#F3F4F6', cursor: 'pointer' }} onClick={() => toggleDepartment(group.id)}>
                        <td colSpan={6} style={{ padding: '10px 16px', position: 'sticky', left: 0, backgroundColor: '#F3F4F6', zIndex: 5 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <ChevronDown className="w-4 h-4" style={{ color: '#6B7280', transform: group.collapsed ? 'rotate(-90deg)' : 'none', transition: 'transform 0.2s' }} />
                              <Building2 className="w-4 h-4" style={{ color: '#6B7280' }} />
                              <span style={{ fontWeight: '600', fontSize: '13px', color: '#374151' }}>{group.name}</span>
                              <span style={{ fontSize: '12px', color: '#6B7280', backgroundColor: '#E5E7EB', padding: '2px 8px', borderRadius: '10px' }}>{group.members.length}</span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#6B7280' }}>
                              {displayUnit === 'hours' ? `${group.totalAllocated.toFixed(2)}h / ${group.totalCapacity}h` : `${group.totalPM.toFixed(2)} PM`}
                            </div>
                          </div>
                        </td>
                      </tr>
                      {!group.collapsed && group.members.map((member, idx) => renderTimelineRow(member, groupIdx === departmentGroups.length - 1 && idx === group.members.length - 1))}
                    </React.Fragment>
                  ))
                ) : (
                  filteredMembers.map((member, idx) => renderTimelineRow(member, idx === filteredMembers.length - 1))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* List View */}
        {(usersLoaded || !isLoading) && !error && filteredMembers.length > 0 && viewMode === 'list' && (
          <div className="grid gap-4">
            {/* Task data loading banner for list view */}
            {isLoadingGanttData && usersLoaded && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: '#EFF6FF', borderRadius: '8px', border: '1px solid #BFDBFE', fontSize: '12px', color: '#2563EB' }}>
                <Loader2 className="w-3 h-3 animate-spin" style={{ color: '#2563EB' }} />
                <span>{`Loading tasks: ${ganttLoadProgress.loaded}/${ganttLoadProgress.total} users...`}</span>
              </div>
            )}
            {filteredMembers.map(member => (
              <div key={member.id} style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #E5E7EB', padding: '16px 20px' }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '500', color: '#6B7280', position: 'relative' }}>
                      {member.avatar ? <img src={member.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      {member.conflicts.length > 0 && (
                        <div style={{ position: 'absolute', top: -2, right: -2, width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <AlertCircle className="w-3 h-3" style={{ color: 'white' }} />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', marginBottom: '2px' }}>{member.name}</h3>
                      <div style={{ fontSize: '13px', color: '#6B7280' }}>{member.role} • {member.department}</div>
                      {member.skills.length > 0 && (
                        <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
                          {member.skills.slice(0, 4).map(skill => (
                            <span key={skill} style={{ padding: '2px 8px', backgroundColor: '#F3F4F6', borderRadius: '4px', fontSize: '11px', color: '#374151' }}>{skill}</span>
                          ))}
                          {member.skills.length > 4 && <span style={{ padding: '2px 8px', fontSize: '11px', color: '#6B7280' }}>+{member.skills.length - 4}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setEditingLeave(member)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #E5E7EB', backgroundColor: member.leave.length > 0 ? '#FEF3C7' : 'white', fontSize: '12px', color: member.leave.length > 0 ? '#D97706' : '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Plane className="w-3 h-3" />
                      {member.leave.length > 0 ? `${member.leave.length} leave` : 'Add leave'}
                    </button>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '2px' }}>{displayUnit === 'hours' ? 'Total Hours' : 'Person-Months'}</div>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                        {displayUnit === 'hours' ? `${member.assignments.reduce((s, a) => s + a.hours, 0).toFixed(2)}h` : `${member.assignments.reduce((s, a) => s + a.personMonths, 0).toFixed(2)} PM`}
                      </div>
                    </div>
                    <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: getAllocationBgColor(member.allocation), textAlign: 'center' }}>
                      <div className="flex items-center gap-1" style={{ fontSize: '18px', fontWeight: '600', color: getAllocationColor(member.allocation), marginBottom: '2px' }}>
                        {getAllocationIcon(member.allocation)}{member.allocation}%
                      </div>
                      <div style={{ fontSize: '11px', color: getAllocationColor(member.allocation) }}>{getAllocationLabel(member.allocation)}</div>
                    </div>
                  </div>
                </div>

                {member.conflicts.length > 0 && (
                  <div style={{ marginBottom: '12px', padding: '10px', backgroundColor: '#FEF2F2', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle className="w-4 h-4" style={{ color: '#DC2626' }} />
                    <span style={{ fontSize: '13px', color: '#DC2626' }}>{member.conflicts.map(c => c.message).join('; ')}</span>
                  </div>
                )}

                {member.assignments.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {member.assignments.map(a => (
                      <div key={a.id} onClick={() => setSelectedTask({ assignment: a, member })} style={{ padding: '8px 12px', backgroundColor: '#F9FAFB', borderRadius: '6px', borderLeft: `3px solid ${a.color}`, cursor: 'pointer' }}>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: '#111827', marginBottom: '2px' }}>{a.taskName}</div>
                        <div style={{ fontSize: '11px', color: '#6B7280' }}>
                          {a.projectName} {a.workPackage && `• ${a.workPackage}`} • {displayUnit === 'hours' ? `${a.hours}h` : `${a.personMonths} PM`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Forecast View */}
        {(usersLoaded || !isLoading) && !error && teamMembers.length > 0 && viewMode === 'forecast' && (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #E5E7EB', padding: '20px' }}>
            {/* Forecast Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>12-Month Capacity Forecast</h3>
            </div>

            {/* Forecast info - using header filters */}
            <div style={{ marginBottom: '16px', padding: '12px 16px', backgroundColor: '#F0F9FF', borderRadius: '8px', border: '1px solid #BAE6FD', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={16} style={{ color: '#0369A1', flexShrink: 0 }} />
              <div style={{ fontSize: '13px', color: '#0369A1' }}>
                Showing forecast for {filteredMembers.length} {filteredMembers.length === 1 ? 'person' : 'people'}
                {selectedPeople.size > 0 && ` (${selectedPeople.size} selected)`}
                {selectedDepartment !== 'all' && ` in ${selectedDepartment}`}
                {selectedProject !== 'all' && ` on ${projects.find(p => p.id === selectedProject)?.name || 'selected project'}`}
                {selectedPeople.size === 0 && selectedDepartment === 'all' && selectedProject === 'all' && ' (entire company)'}
                . Use the filters above to narrow down.
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>Period</th>
                    <th style={{ padding: '10px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>Capacity (h)</th>
                    <th style={{ padding: '10px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>Allocated (h)</th>
                    <th style={{ padding: '10px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>Available (h)</th>
                    <th style={{ padding: '10px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>Utilization</th>
                    <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6B7280', width: '200px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {forecastData.map((period, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '12px 10px', fontSize: '14px', fontWeight: '500', color: '#111827' }}>{period.period}</td>
                      <td style={{ padding: '12px 10px', textAlign: 'right', fontSize: '14px', color: '#6B7280' }}>{period.capacity}</td>
                      <td style={{ padding: '12px 10px', textAlign: 'right', fontSize: '14px', color: '#6B7280' }}>{period.allocated}</td>
                      <td style={{ padding: '12px 10px', textAlign: 'right', fontSize: '14px', color: period.available < 0 ? '#DC2626' : '#10B981', fontWeight: '500' }}>{period.available}</td>
                      <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                        <span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: getAllocationBgColor(period.utilizationPercent), color: getAllocationColor(period.utilizationPercent), fontSize: '13px', fontWeight: '500' }}>
                          {period.utilizationPercent}%
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <div style={{ height: '8px', backgroundColor: '#E5E7EB', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.min(period.utilizationPercent, 100)}%`, backgroundColor: getAllocationColor(period.utilizationPercent), borderRadius: '4px' }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals row */}
            <div style={{ marginTop: '16px', padding: '12px 16px', backgroundColor: '#F9FAFB', borderRadius: '8px', display: 'flex', justifyContent: 'space-around' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>Total Capacity</div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>{forecastData.reduce((s, p) => s + p.capacity, 0).toLocaleString()}h</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>Total Allocated</div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>{forecastData.reduce((s, p) => s + p.allocated, 0).toLocaleString()}h</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>Total Available</div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: forecastData.reduce((s, p) => s + p.available, 0) < 0 ? '#DC2626' : '#10B981' }}>
                  {forecastData.reduce((s, p) => s + p.available, 0).toLocaleString()}h
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>Avg Utilization</div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                  {Math.round(forecastData.reduce((s, p) => s + p.utilizationPercent, 0) / forecastData.length)}%
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>Person-Months</div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#2563EB' }}>
                  {(forecastData.reduce((s, p) => s + p.allocated, 0) / HOURS_PER_PERSON_MONTH).toFixed(2)} PM
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Skills View */}
        {(usersLoaded || !isLoading) && !error && filteredMembers.length > 0 && viewMode === 'skills' && (
          <div className="grid grid-cols-2 gap-4">
            <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #E5E7EB', padding: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>Skills Coverage</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.entries(skillsCoverage).map(([skill, data]) => (
                  <div key={skill} style={{ padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>{skill}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: data.available > 0 ? '#10B981' : '#EF4444' }}>
                          {data.available} available
                        </span>
                        <span style={{ fontSize: '12px', color: '#6B7280' }}>/ {data.total} total</span>
                      </div>
                    </div>
                    <div style={{ height: '6px', backgroundColor: '#E5E7EB', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(data.available / Math.max(data.total, 1)) * 100}%`, backgroundColor: data.available > 0 ? '#10B981' : '#EF4444', borderRadius: '3px' }} />
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#6B7280' }}>
                      {data.members.slice(0, 3).join(', ')}{data.members.length > 3 && `, +${data.members.length - 3} more`}
                    </div>
                  </div>
                ))}
                {Object.keys(skillsCoverage).length === 0 && (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>
                    No skills data available
                  </div>
                )}
              </div>
            </div>

            <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #E5E7EB', padding: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>Available by Skill</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {allSkills.map(skill => {
                  const availableMembers = filteredMembers.filter(m => m.skills.includes(skill) && m.allocation < 100);
                  if (availableMembers.length === 0) return null;
                  return (
                    <div key={skill} style={{ padding: '10px', backgroundColor: '#F0FDF4', borderRadius: '6px', borderLeft: '3px solid #10B981' }}>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: '#166534', marginBottom: '4px' }}>{skill}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {availableMembers.map(m => (
                          <span key={m.id} style={{ padding: '2px 8px', backgroundColor: 'white', borderRadius: '4px', fontSize: '12px', color: '#374151' }}>
                            {m.name} ({100 - m.allocation}% avail)
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Grid View - Excel-like editable spreadsheet */}
        {(usersLoaded || !isLoading) && !error && teamMembers.length > 0 && viewMode === 'grid' && (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
            {/* Task data loading banner for grid view */}
            {isLoadingGanttData && usersLoaded && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#EFF6FF', borderBottom: '1px solid #BFDBFE', fontSize: '12px', color: '#2563EB' }}>
                <Loader2 className="w-3 h-3 animate-spin" style={{ color: '#2563EB' }} />
                <span>{`Loading tasks: ${ganttLoadProgress.loaded}/${ganttLoadProgress.total} users...`}</span>
              </div>
            )}
            {/* Grid Toolbar */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Hierarchy Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12px', color: '#6B7280' }}>View by:</span>
                  <div style={{ display: 'flex', backgroundColor: '#F3F4F6', borderRadius: '6px', padding: '2px' }}>
                    <button
                      onClick={setGridHierarchyPerson}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: gridHierarchy === 'person' ? '500' : '400',
                        backgroundColor: gridHierarchy === 'person' ? 'white' : 'transparent',
                        color: gridHierarchy === 'person' ? '#2563EB' : '#6B7280',
                        cursor: 'pointer',
                        boxShadow: gridHierarchy === 'person' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                      }}
                    >
                      <Users className="w-3 h-3" style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                      Person → Project → Task
                    </button>
                    <button
                      onClick={setGridHierarchyProject}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: gridHierarchy === 'project' ? '500' : '400',
                        backgroundColor: gridHierarchy === 'project' ? 'white' : 'transparent',
                        color: gridHierarchy === 'project' ? '#2563EB' : '#6B7280',
                        cursor: 'pointer',
                        boxShadow: gridHierarchy === 'project' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                      }}
                    >
                      <Briefcase className="w-3 h-3" style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                      Project → Task → Person
                    </button>
                  </div>
                </div>

                {/* Granularity Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12px', color: '#6B7280' }}>Period:</span>
                  <div style={{ display: 'flex', backgroundColor: '#F3F4F6', borderRadius: '6px', padding: '2px' }}>
                    <button
                      onClick={setGridGranularityMonthly}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: gridGranularity === 'monthly' ? '500' : '400',
                        backgroundColor: gridGranularity === 'monthly' ? 'white' : 'transparent',
                        color: gridGranularity === 'monthly' ? '#2563EB' : '#6B7280',
                        cursor: 'pointer',
                        boxShadow: gridGranularity === 'monthly' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                      }}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={setGridGranularityWeekly}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: gridGranularity === 'weekly' ? '500' : '400',
                        backgroundColor: gridGranularity === 'weekly' ? 'white' : 'transparent',
                        color: gridGranularity === 'weekly' ? '#2563EB' : '#6B7280',
                        cursor: 'pointer',
                        boxShadow: gridGranularity === 'weekly' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                      }}
                    >
                      Weekly
                    </button>
                  </div>
                </div>

                {/* Months to show */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12px', color: '#6B7280' }}>Show:</span>
                  <select
                    value={gridMonthsToShow}
                    onChange={handleGridMonthsChange}
                    style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #E5E7EB', fontSize: '12px', color: '#374151', cursor: 'pointer' }}
                  >
                    <option value={6}>6 months</option>
                    <option value={12}>12 months</option>
                    <option value={18}>18 months</option>
                    <option value={24}>24 months</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Date Navigation */}
                <button
                  onClick={gridNavigatePrev}
                  style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #E5E7EB', backgroundColor: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <ChevronLeft className="w-4 h-4" style={{ color: '#6B7280' }} />
                </button>
                <button
                  onClick={gridNavigateToday}
                  style={{ padding: '4px 12px', borderRadius: '4px', border: '1px solid #E5E7EB', backgroundColor: 'white', fontSize: '12px', color: '#374151', cursor: 'pointer' }}
                >
                  Today
                </button>
                <button
                  onClick={gridNavigateNext}
                  style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #E5E7EB', backgroundColor: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <ChevronRight className="w-4 h-4" style={{ color: '#6B7280' }} />
                </button>

                {/* Save indicator */}
                {gridAllocations.length > 0 && (
                  <button
                    onClick={saveAllocations}
                    disabled={isSaving}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '4px',
                      border: 'none',
                      backgroundColor: isSaving ? '#93C5FD' : '#2563EB',
                      color: 'white',
                      fontSize: '12px',
                      cursor: isSaving ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      opacity: isSaving ? 0.7 : 1
                    }}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-3 h-3" /> Save {gridAllocations.length} Change{gridAllocations.length > 1 ? 's' : ''}
                      </>
                    )}
                  </button>
                )}
                {saveError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#DC2626', fontSize: '12px' }}>
                    <AlertCircle className="w-3 h-3" />
                    {saveError}
                  </div>
                )}
              </div>
            </div>

            {/* AG Grid with custom bi-directional fill handle */}
            <AGGridView
              gridData={gridData}
              periods={gridPeriods}
              expandedRows={expandedRows}
              onToggleExpand={handleToggleExpand}
              pendingAllocations={gridAllocations}
              onCellEdit={handleAGGridCellEdit}
              gridHierarchy={gridHierarchy}
            />

            {/* Old custom grid table removed - now using AG Grid above for virtualization */}
            {false && <div style={{ overflow: 'auto', maxHeight: 'calc(100vh - 420px)' }}>
              <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 20 }}>
                  <tr style={{ backgroundColor: '#F9FAFB' }}>
                    <th style={{
                      padding: '8px 12px',
                      textAlign: 'left',
                      fontSize: '11px',
                      fontWeight: '600',
                      color: '#6B7280',
                      textTransform: 'uppercase',
                      position: 'sticky',
                      left: 0,
                      backgroundColor: '#F9FAFB',
                      zIndex: 21,
                      whiteSpace: 'nowrap',
                      borderRight: '2px solid #E5E7EB',
                      borderBottom: '1px solid #E5E7EB'
                    }}>
                      {gridHierarchy === 'person' ? 'Person / Project / Task' : 'Project / Task / Person'}
                    </th>
                    {gridPeriods.map((period, idx) => (
                      <th key={period.key} style={{
                        padding: '8px 4px',
                        textAlign: 'center',
                        fontSize: '10px',
                        fontWeight: '600',
                        color: '#6B7280',
                        width: gridGranularity === 'weekly' ? '50px' : '70px',
                        minWidth: gridGranularity === 'weekly' ? '50px' : '70px',
                        maxWidth: gridGranularity === 'weekly' ? '50px' : '70px',
                        borderBottom: '1px solid #E5E7EB',
                        borderLeft: idx === 0 || (gridGranularity === 'monthly' && period.startDate.getMonth() === 0) ? '2px solid #D1D5DB' : '1px solid #E5E7EB',
                        backgroundColor: period.startDate.getMonth() % 2 === 0 ? '#F9FAFB' : '#F3F4F6'
                      }}>
                        <div>{period.shortLabel}</div>
                        {gridGranularity === 'monthly' && <div style={{ fontSize: '9px', color: '#9CA3AF' }}>{period.startDate.getFullYear()}</div>}
                      </th>
                    ))}
                    <th style={{
                      padding: '8px 12px',
                      textAlign: 'center',
                      fontSize: '11px',
                      fontWeight: '600',
                      color: '#6B7280',
                      minWidth: '70px',
                      borderBottom: '1px solid #E5E7EB',
                      borderLeft: '2px solid #D1D5DB',
                      backgroundColor: '#F9FAFB'
                    }}>
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {gridData.map((row: any) => (
                    <React.Fragment key={row.id}>
                      {/* Parent Row */}
                      <tr style={{ backgroundColor: expandedRows.has(row.id) ? '#F0F9FF' : 'white' }}>
                        <td style={{
                          padding: '8px 12px',
                          position: 'sticky',
                          left: 0,
                          backgroundColor: expandedRows.has(row.id) ? '#F0F9FF' : 'white',
                          zIndex: 10,
                          borderRight: '2px solid #E5E7EB',
                          borderBottom: '1px solid #F3F4F6',
                          whiteSpace: 'nowrap'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              onClick={() => handleRowExpand(row.id, row.type)}
                              style={{ padding: '2px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            >
                              {loadingProjects.has(row.id) ? (
                                <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#6B7280' }} />
                              ) : (
                                <ChevronRight
                                  className="w-4 h-4"
                                  style={{
                                    color: '#6B7280',
                                    transform: expandedRows.has(row.id) ? 'rotate(90deg)' : 'none',
                                    transition: 'transform 0.15s'
                                  }}
                                />
                              )}
                            </button>
                            {row.type === 'person' ? (
                              <div style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                backgroundColor: '#E5E7EB',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '10px',
                                fontWeight: '500',
                                color: '#6B7280'
                              }}>
                                {row.avatar ? (
                                  <img src={row.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                ) : (
                                  row.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                                )}
                              </div>
                            ) : (
                              <div style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '2px',
                                backgroundColor: row.color || '#6B7280'
                              }} />
                            )}
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: '500', color: '#111827' }}>{row.name}</div>
                              {row.type === 'person' && row.department && (
                                <div style={{ fontSize: '11px', color: '#6B7280' }}>{row.department}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        {gridPeriods.map((period, idx) => {
                          let totalHours = 0;
                          let capacity = 0;
                          let hasUnscheduled = false;

                          if (row.type === 'person') {
                            // For person rows, use allocation cell data
                            const cellKey = `${row.id}:${period.key}`;
                            const cellData = gridAllocationsByCell.get(cellKey);
                            totalHours = cellData?.total || 0;
                            hasUnscheduled = cellData?.hasUnscheduled || false;
                            capacity = gridGranularity === 'monthly' ? row.capacity * 4 : row.capacity;
                          } else if (row.type === 'project') {
                            // For project rows, aggregate from all tasks and participants
                            // Track both scheduled and unscheduled hours
                            let projectUnscheduledHours = 0;
                            row.children?.forEach((child: any) => {
                              // Child could have assignment directly (task with assignment)
                              if (child.assignment) {
                                const assignment = child.assignment;
                                let isWithinTaskRange = false;
                                if (assignment.startDate && assignment.endDate) {
                                  const taskStart = new Date(assignment.startDate);
                                  const taskEnd = new Date(assignment.endDate);
                                  isWithinTaskRange = datesOverlap(taskStart, taskEnd, period.startDate, period.endDate);
                                }
                                if (isWithinTaskRange) {
                                  if (assignment.plannedSchedule && assignment.plannedSchedule.length > 0) {
                                    assignment.plannedSchedule.forEach((schedule: any) => {
                                      const scheduleStart = schedule.startDate ? parseDate(schedule.startDate) : new Date(assignment.startDate);
                                      const scheduleEnd = schedule.endDate ? parseDate(schedule.endDate) : new Date(assignment.endDate);
                                      const schedulePlannedHours = parseFloat(schedule.plannedHours || schedule.hours || '0');
                                      if (datesOverlap(scheduleStart, scheduleEnd, period.startDate, period.endDate) && schedulePlannedHours > 0) {
                                        const overlapStart = new Date(Math.max(scheduleStart.getTime(), period.startDate.getTime()));
                                        const overlapEnd = new Date(Math.min(scheduleEnd.getTime(), period.endDate.getTime()));
                                        const workingDaysInSchedule = countWorkingDays(scheduleStart, scheduleEnd);
                                        const workingDaysInPeriod = countWorkingDays(overlapStart, overlapEnd);
                                        if (workingDaysInSchedule > 0) {
                                          totalHours += schedulePlannedHours * workingDaysInPeriod / workingDaysInSchedule;
                                        }
                                      }
                                    });
                                  } else if (assignment.allocatedHours > 0) {
                                    projectUnscheduledHours += assignment.allocatedHours;
                                  }
                                }
                              }
                              // Also check grandchildren (persons under tasks)
                              child.children?.forEach((grandchild: any) => {
                                if (grandchild.assignment) {
                                  const assignment = grandchild.assignment;
                                  let isWithinTaskRange = false;
                                  if (assignment.startDate && assignment.endDate) {
                                    const taskStart = new Date(assignment.startDate);
                                    const taskEnd = new Date(assignment.endDate);
                                    isWithinTaskRange = datesOverlap(taskStart, taskEnd, period.startDate, period.endDate);
                                  }
                                  if (isWithinTaskRange) {
                                    if (assignment.plannedSchedule && assignment.plannedSchedule.length > 0) {
                                      assignment.plannedSchedule.forEach((schedule: any) => {
                                        const scheduleStart = schedule.startDate ? parseDate(schedule.startDate) : new Date(assignment.startDate);
                                        const scheduleEnd = schedule.endDate ? parseDate(schedule.endDate) : new Date(assignment.endDate);
                                        const schedulePlannedHours = parseFloat(schedule.plannedHours || schedule.hours || '0');
                                        if (datesOverlap(scheduleStart, scheduleEnd, period.startDate, period.endDate) && schedulePlannedHours > 0) {
                                          const overlapStart = new Date(Math.max(scheduleStart.getTime(), period.startDate.getTime()));
                                          const overlapEnd = new Date(Math.min(scheduleEnd.getTime(), period.endDate.getTime()));
                                          const workingDaysInSchedule = countWorkingDays(scheduleStart, scheduleEnd);
                                          const workingDaysInPeriod = countWorkingDays(overlapStart, overlapEnd);
                                          if (workingDaysInSchedule > 0) {
                                            totalHours += schedulePlannedHours * workingDaysInPeriod / workingDaysInSchedule;
                                          }
                                        }
                                      });
                                    } else if (assignment.allocatedHours > 0) {
                                      projectUnscheduledHours += assignment.allocatedHours;
                                    }
                                  }
                                }
                              });
                            });
                            totalHours = Math.round(totalHours * 100) / 100;
                            if (projectUnscheduledHours > 0) hasUnscheduled = true;
                          }

                          const utilizationPct = capacity > 0 ? (totalHours / capacity) * 100 : 0;
                          const personCellKey = `${row.id}:${period.key}`;

                          return (
                            <td
                              key={period.key}
                              data-cell-key={personCellKey}
                              onDragOver={row.type === 'person' ? (e) => handleDragOver(e, personCellKey) : undefined}
                              onDragLeave={row.type === 'person' ? handleDragLeave : undefined}
                              onDrop={row.type === 'person' ? (e) => handleDrop(e, period, row.id) : undefined}
                              style={{
                                padding: '4px',
                                textAlign: 'center',
                                borderBottom: '1px solid #F3F4F6',
                                borderLeft: idx === 0 || (gridGranularity === 'monthly' && period.startDate.getMonth() === 0) ? '2px solid #D1D5DB' : '1px solid #F3F4F6',
                                backgroundColor: period.startDate.getMonth() % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)'
                              }}
                            >
                              {row.type === 'person' ? (
                                <AllocationCell
                                  hours={totalHours}
                                  capacity={capacity}
                                  hasUnscheduled={hasUnscheduled && totalHours === 0}
                                  onClick={() => {
                                    startTransition(() => setEditingCell({
                                      rowId: row.id,
                                      period: period.key
                                    }));
                                  }}
                                />
                              ) : hasUnscheduled && totalHours === 0 ? (
                                <HoverTooltip
                                  content={
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <AlertCircle size={14} style={{ color: '#FBBF24' }} />
                                        <span style={{ fontWeight: 600 }}>Unscheduled Hours</span>
                                      </div>
                                      <div style={{ color: '#D1D5DB', fontSize: '11px' }}>
                                        Tasks in this project have unscheduled allocations
                                      </div>
                                      <div style={{ color: '#9CA3AF', fontSize: '10px', marginTop: '2px' }}>
                                        Expand to see task details
                                      </div>
                                    </div>
                                  }
                                >
                                  <div
                                    style={{
                                      padding: '4px 6px',
                                      borderRadius: '4px',
                                      fontSize: '12px',
                                      fontWeight: '400',
                                      color: '#B45309',
                                      backgroundColor: '#FEF3C7',
                                      minHeight: '24px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      width: '100%'
                                    }}
                                  >
                                    0h
                                  </div>
                                </HoverTooltip>
                              ) : (
                                <div
                                  style={{
                                    padding: '4px 6px',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    fontWeight: totalHours > 0 ? '500' : '400',
                                    color: totalHours > 0 ? '#111827' : '#D1D5DB',
                                    backgroundColor: totalHours > 0 ? '#F3F4F6' : 'transparent',
                                    minHeight: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  {totalHours > 0 ? `${totalHours.toFixed(2)}h` : '—'}
                                </div>
                              )}
                            </td>
                          );
                        })}
                        <td style={{
                          padding: '4px 12px',
                          textAlign: 'center',
                          borderBottom: '1px solid #F3F4F6',
                          borderLeft: '2px solid #D1D5DB',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#111827'
                        }}>
                          {(() => {
                            let totalScheduled = 0;
                            let totalUnscheduled = 0;
                            let participantCount = 0;
                            let totalCapacity = 0;
                            if (row.type === 'person') {
                              const periodCapacity = gridGranularity === 'monthly' ? row.capacity * 4 : row.capacity;
                              totalCapacity = periodCapacity * gridPeriods.length;
                              totalScheduled = gridPeriods.reduce((sum, p) => {
                                const cellData = gridAllocationsByCell.get(`${row.id}:${p.key}`);
                                return sum + (cellData?.total || 0);
                              }, 0);
                            } else if (row.type === 'project') {
                              // Aggregate from all tasks and participants
                              row.children?.forEach((child: any) => {
                                if (child.assignment) {
                                  const assignment = child.assignment;
                                  participantCount++;
                                  if (assignment.plannedSchedule && assignment.plannedSchedule.length > 0) {
                                    gridPeriods.forEach(period => {
                                      assignment.plannedSchedule.forEach((schedule: any) => {
                                        const scheduleStart = schedule.startDate ? parseDate(schedule.startDate) : new Date(assignment.startDate);
                                        const scheduleEnd = schedule.endDate ? parseDate(schedule.endDate) : new Date(assignment.endDate);
                                        const schedulePlannedHours = parseFloat(schedule.plannedHours || schedule.hours || '0');
                                        if (datesOverlap(scheduleStart, scheduleEnd, period.startDate, period.endDate) && schedulePlannedHours > 0) {
                                          const overlapStart = new Date(Math.max(scheduleStart.getTime(), period.startDate.getTime()));
                                          const overlapEnd = new Date(Math.min(scheduleEnd.getTime(), period.endDate.getTime()));
                                          const workingDaysInSchedule = countWorkingDays(scheduleStart, scheduleEnd);
                                          const workingDaysInPeriod = countWorkingDays(overlapStart, overlapEnd);
                                          if (workingDaysInSchedule > 0) {
                                            totalScheduled += schedulePlannedHours * workingDaysInPeriod / workingDaysInSchedule;
                                          }
                                        }
                                      });
                                    });
                                  } else if (assignment.allocatedHours > 0) {
                                    totalUnscheduled += assignment.allocatedHours;
                                  }
                                }
                                child.children?.forEach((grandchild: any) => {
                                  if (grandchild.assignment) {
                                    const assignment = grandchild.assignment;
                                    participantCount++;
                                    if (assignment.plannedSchedule && assignment.plannedSchedule.length > 0) {
                                      gridPeriods.forEach(period => {
                                        assignment.plannedSchedule.forEach((schedule: any) => {
                                          const scheduleStart = schedule.startDate ? parseDate(schedule.startDate) : new Date(assignment.startDate);
                                          const scheduleEnd = schedule.endDate ? parseDate(schedule.endDate) : new Date(assignment.endDate);
                                          const schedulePlannedHours = parseFloat(schedule.plannedHours || schedule.hours || '0');
                                          if (datesOverlap(scheduleStart, scheduleEnd, period.startDate, period.endDate) && schedulePlannedHours > 0) {
                                            const overlapStart = new Date(Math.max(scheduleStart.getTime(), period.startDate.getTime()));
                                            const overlapEnd = new Date(Math.min(scheduleEnd.getTime(), period.endDate.getTime()));
                                            const workingDaysInSchedule = countWorkingDays(scheduleStart, scheduleEnd);
                                            const workingDaysInPeriod = countWorkingDays(overlapStart, overlapEnd);
                                            if (workingDaysInSchedule > 0) {
                                              totalScheduled += schedulePlannedHours * workingDaysInPeriod / workingDaysInSchedule;
                                            }
                                          }
                                        });
                                      });
                                    } else if (assignment.allocatedHours > 0) {
                                      totalUnscheduled += assignment.allocatedHours;
                                    }
                                  }
                                });
                              });
                            }
                            totalScheduled = Math.round(totalScheduled * 100) / 100;

                            // Display: scheduled hours + unscheduled indicator
                            if (totalScheduled > 0 && totalUnscheduled > 0) {
                              return (
                                <HoverTooltip
                                  content={
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                      <div style={{ color: '#10B981' }}><span style={{ fontWeight: 600 }}>{totalScheduled.toFixed(2)}h</span> scheduled</div>
                                      <div style={{ color: '#FBBF24' }}><span style={{ fontWeight: 600 }}>{totalUnscheduled.toLocaleString()}h</span> still to plan</div>
                                    </div>
                                  }
                                >
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center', width: '100%' }}>
                                    {totalScheduled.toFixed(2)}h
                                    <span style={{ color: '#B45309', fontSize: '9px' }}>+{totalUnscheduled.toLocaleString()}</span>
                                  </span>
                                </HoverTooltip>
                              );
                            } else if (totalUnscheduled > 0) {
                              return (
                                <HoverTooltip
                                  content={
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <AlertCircle size={14} style={{ color: '#FBBF24' }} />
                                        <span style={{ fontWeight: 600 }}>Unscheduled</span>
                                      </div>
                                      <div style={{ color: '#FBBF24' }}><span style={{ fontWeight: 600 }}>{totalUnscheduled.toLocaleString()}h</span> total allocated</div>
                                      {participantCount > 1 && <div style={{ color: '#9CA3AF', fontSize: '10px' }}>across {participantCount} participants</div>}
                                    </div>
                                  }
                                >
                                  <span style={{ color: '#B45309', backgroundColor: '#FEF3C7', padding: '2px 6px', borderRadius: '4px', width: '100%', display: 'flex', justifyContent: 'center' }}>
                                    {totalUnscheduled.toLocaleString()}h
                                  </span>
                                </HoverTooltip>
                              );
                            } else if (totalScheduled > 0) {
                              // For person rows, show with capacity bar
                              if (row.type === 'person' && totalCapacity > 0) {
                                const utilization = (totalScheduled / totalCapacity) * 100;
                                const isOverAllocated = utilization > 100;
                                return (
                                  <HoverTooltip
                                    content={
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                          {isOverAllocated && <AlertTriangle size={14} style={{ color: '#DC2626' }} />}
                                          <span style={{ fontWeight: 600 }}>
                                            {totalScheduled.toFixed(1)}h / {totalCapacity}h
                                          </span>
                                        </div>
                                        <div style={{
                                          color: isOverAllocated ? '#FCA5A5' : '#D1D5DB',
                                          fontSize: '11px'
                                        }}>
                                          {utilization.toFixed(0)}% utilization over {gridPeriods.length} {gridGranularity === 'monthly' ? 'months' : 'weeks'}
                                          {isOverAllocated && ` (${(utilization - 100).toFixed(0)}% over)`}
                                        </div>
                                        <CapacityBar allocated={totalScheduled} capacity={totalCapacity} showLabel={false} height={6} />
                                      </div>
                                    }
                                  >
                                    <div style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'center',
                                      gap: '2px',
                                      padding: '2px 4px',
                                      borderRadius: '4px',
                                      backgroundColor: isOverAllocated ? '#FEE2E2' : 'transparent',
                                      border: isOverAllocated ? '1px solid #FECACA' : 'none'
                                    }}>
                                      <span style={{
                                        fontWeight: 600,
                                        color: isOverAllocated ? '#DC2626' : '#111827'
                                      }}>
                                        {totalScheduled.toFixed(1)}h
                                      </span>
                                      <CapacityBar allocated={totalScheduled} capacity={totalCapacity} showLabel={false} height={3} />
                                    </div>
                                  </HoverTooltip>
                                );
                              }
                              return `${totalScheduled.toFixed(2)}h`;
                            }
                            return '—';
                          })()}
                        </td>
                      </tr>

                      {/* Child Rows (Level 2 - expanded) */}
                      {expandedRows.has(row.id) && row.children?.map((child: any) => (
                        <React.Fragment key={child.id}>
                          <tr style={{ backgroundColor: expandedRows.has(child.id) ? '#F0F9FF' : '#FAFAFA' }}>
                            <td style={{
                              padding: '6px 12px 6px 32px',
                              position: 'sticky',
                              left: 0,
                              backgroundColor: expandedRows.has(child.id) ? '#F0F9FF' : '#FAFAFA',
                              zIndex: 10,
                              borderRight: '2px solid #E5E7EB',
                              borderBottom: '1px solid #F3F4F6',
                              whiteSpace: 'nowrap'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {/* Expand button if has children or is a project (may load children) */}
                                {(child.children && child.children.length > 0) || child.type === 'project' ? (
                                  <button
                                    onClick={() => handleRowExpand(child.id, child.type)}
                                    style={{ padding: '2px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                  >
                                    {loadingProjects.has(child.id) ? (
                                      <Loader2 className="w-3 h-3 animate-spin" style={{ color: '#6B7280' }} />
                                    ) : (
                                      <ChevronRight
                                        className="w-3 h-3"
                                        style={{
                                          color: '#6B7280',
                                          transform: expandedRows.has(child.id) ? 'rotate(90deg)' : 'none',
                                          transition: 'transform 0.15s'
                                        }}
                                      />
                                    )}
                                  </button>
                                ) : (
                                  <div style={{ width: '16px' }} />
                                )}
                                {/* Icon based on type */}
                                {child.type === 'project' ? (
                                  <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: child.color || '#6B7280', flexShrink: 0 }} />
                                ) : child.type === 'task' ? (
                                  <Target className="w-3 h-3" style={{ color: '#6B7280', flexShrink: 0 }} />
                                ) : (
                                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: '500', color: '#6B7280', flexShrink: 0 }}>
                                    {child.avatar ? (
                                      <img src={child.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                    ) : (
                                      child.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                                    )}
                                  </div>
                                )}
                                <span style={{ fontSize: '12px', color: '#374151' }}>
                                  {child.name}
                                  {child.workPackage && <span style={{ color: '#9CA3AF', marginLeft: '6px' }}>({child.workPackage})</span>}
                                </span>
                              </div>
                            </td>
                            {gridPeriods.map((period, idx) => {
                              // AGGREGATE from all participants (grandchildren) for task rows
                              let periodHours = 0;
                              let totalUnscheduledHours = 0;
                              let unscheduledParticipantCount = 0;

                              // Check if this child has grandchildren (participants)
                              const hasGrandchildren = child.children && child.children.length > 0;

                              if (hasGrandchildren) {
                                // Aggregate from all participants
                                child.children.forEach((grandchild: any) => {
                                  const assignment = grandchild.assignment;
                                  if (!assignment) return;

                                  // Check if period is within task date range
                                  let isWithinTaskRange = false;
                                  if (assignment.startDate && assignment.endDate) {
                                    const taskStart = new Date(assignment.startDate);
                                    const taskEnd = new Date(assignment.endDate);
                                    isWithinTaskRange = datesOverlap(taskStart, taskEnd, period.startDate, period.endDate);
                                  }

                                  if (isWithinTaskRange) {
                                    if (assignment.plannedSchedule && assignment.plannedSchedule.length > 0) {
                                      // Sum scheduled hours from this participant
                                      assignment.plannedSchedule.forEach((schedule: any) => {
                                        const scheduleStart = schedule.startDate ? parseDate(schedule.startDate) : new Date(assignment.startDate);
                                        const scheduleEnd = schedule.endDate ? parseDate(schedule.endDate) : new Date(assignment.endDate);
                                        const schedulePlannedHours = parseFloat(schedule.plannedHours || schedule.hours || '0');

                                        if (datesOverlap(scheduleStart, scheduleEnd, period.startDate, period.endDate) && schedulePlannedHours > 0) {
                                          const overlapStart = new Date(Math.max(scheduleStart.getTime(), period.startDate.getTime()));
                                          const overlapEnd = new Date(Math.min(scheduleEnd.getTime(), period.endDate.getTime()));
                                          const workingDaysInSchedule = countWorkingDays(scheduleStart, scheduleEnd);
                                          const workingDaysInPeriod = countWorkingDays(overlapStart, overlapEnd);

                                          if (workingDaysInSchedule > 0) {
                                            periodHours += schedulePlannedHours * workingDaysInPeriod / workingDaysInSchedule;
                                          }
                                        }
                                      });
                                    } else if (assignment.allocatedHours > 0) {
                                      // This participant has unscheduled allocation
                                      totalUnscheduledHours += assignment.allocatedHours;
                                      unscheduledParticipantCount++;
                                    }
                                  }
                                });
                              } else {
                                // No grandchildren - use child's own assignment
                                const assignment = child.assignment;
                                if (assignment) {
                                  let isWithinTaskRange = false;
                                  if (assignment.startDate && assignment.endDate) {
                                    const taskStart = new Date(assignment.startDate);
                                    const taskEnd = new Date(assignment.endDate);
                                    isWithinTaskRange = datesOverlap(taskStart, taskEnd, period.startDate, period.endDate);
                                  }

                                  if (isWithinTaskRange) {
                                    if (assignment.plannedSchedule && assignment.plannedSchedule.length > 0) {
                                      assignment.plannedSchedule.forEach((schedule: any) => {
                                        const scheduleStart = schedule.startDate ? parseDate(schedule.startDate) : new Date(assignment.startDate);
                                        const scheduleEnd = schedule.endDate ? parseDate(schedule.endDate) : new Date(assignment.endDate);
                                        const schedulePlannedHours = parseFloat(schedule.plannedHours || schedule.hours || '0');

                                        if (datesOverlap(scheduleStart, scheduleEnd, period.startDate, period.endDate) && schedulePlannedHours > 0) {
                                          const overlapStart = new Date(Math.max(scheduleStart.getTime(), period.startDate.getTime()));
                                          const overlapEnd = new Date(Math.min(scheduleEnd.getTime(), period.endDate.getTime()));
                                          const workingDaysInSchedule = countWorkingDays(scheduleStart, scheduleEnd);
                                          const workingDaysInPeriod = countWorkingDays(overlapStart, overlapEnd);

                                          if (workingDaysInSchedule > 0) {
                                            periodHours += schedulePlannedHours * workingDaysInPeriod / workingDaysInSchedule;
                                          }
                                        }
                                      });
                                    } else if (assignment.allocatedHours > 0) {
                                      totalUnscheduledHours += assignment.allocatedHours;
                                      unscheduledParticipantCount++;
                                    }
                                  }
                                }
                              }

                              periodHours = Math.round(periodHours * 100) / 100;
                              const hasUnscheduled = totalUnscheduledHours > 0;
                              const displayValue = periodHours > 0 ? `${periodHours.toFixed(2)}h` : (hasUnscheduled ? '0h' : '—');

                              return (
                                <td key={period.key} style={{ padding: '2px', textAlign: 'center', borderBottom: '1px solid #F3F4F6', borderLeft: idx === 0 || (gridGranularity === 'monthly' && period.startDate.getMonth() === 0) ? '2px solid #D1D5DB' : '1px solid #F3F4F6', backgroundColor: period.startDate.getMonth() % 2 === 0 ? (expandedRows.has(child.id) ? '#F0F9FF' : '#FAFAFA') : 'rgba(0,0,0,0.02)' }}>
                                  {/* Project-level editable cell or read-only aggregate */}
                                  {(() => {
                                    // Allow direct project-level entry when:
                                    // 1. In person hierarchy and this is a project child (enter hours against project without task breakdown)
                                    // 2. No grandchildren exist yet (e.g. task with no persons assigned)
                                    const isProjectLevelEditable =
                                      (gridHierarchy === 'person' && child.type === 'project') ||
                                      !hasGrandchildren;

                                    if (isProjectLevelEditable) {
                                      const personId = gridHierarchy === 'person' ? row.id : (child.personId || child.userId || child.id);
                                      const projId = child.projectId || (gridHierarchy === 'project' ? row.id : '');
                                      const projLevelKey = `${personId}:${period.key}:`;
                                      const pendingAlloc = gridAllocationsMap.get(projLevelKey);
                                      // Project-level pending takes priority over task aggregate
                                      const cellHours = pendingAlloc?.hours ?? (hasGrandchildren ? 0 : periodHours);
                                      const hasPendingAlloc = !!pendingAlloc;
                                      // When no pending alloc, show aggregate (if tasks exist) so user sees existing data
                                      const displayVal = hasPendingAlloc
                                        ? `${cellHours.toFixed(2)}h`
                                        : (periodHours > 0 ? `${periodHours.toFixed(2)}h` : '—');
                                      const displayHours = hasPendingAlloc ? cellHours : periodHours;

                                      const editableCellContext: CellContext = {
                                        rowId: child.id,
                                        period: period.key,
                                        periodIdx: idx,
                                        projectId: projId,
                                        personId,
                                        currentValue: displayHours
                                        // taskId intentionally omitted = project-level allocation
                                      };

                                      return (
                                        <GridCell
                                          context={editableCellContext}
                                          displayValue={displayVal}
                                          isUnscheduled={hasGrandchildren ? false : hasUnscheduled}
                                          hasPending={hasPendingAlloc}
                                          editable={true}
                                          onSave={handleGridCellSave}
                                          onDragEnd={handleDragEnd}
                                        />
                                      );
                                    }

                                    // Has grandchildren but not a person-hierarchy project — show read-only aggregate
                                    const cellContext: CellContext = {
                                      rowId: child.id,
                                      period: period.key,
                                      periodIdx: idx,
                                      personId: child.id,
                                      currentValue: periodHours
                                    };

                                    const gridCell = (
                                      <GridCell
                                        context={cellContext}
                                        displayValue={displayValue}
                                        isUnscheduled={hasUnscheduled}
                                        editable={false}
                                        onSave={handleReadOnlyCellSave}
                                      />
                                    );

                                    return hasUnscheduled ? (
                                      <HoverTooltip
                                        content={
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                              <AlertCircle size={14} style={{ color: '#FBBF24' }} />
                                              <span style={{ fontWeight: 600 }}>Unscheduled Hours</span>
                                            </div>
                                            <div style={{ color: '#D1D5DB', fontSize: '11px' }}>
                                              <span style={{ color: '#FBBF24', fontWeight: 600 }}>{totalUnscheduledHours.toLocaleString()}h</span> total allocated
                                              {unscheduledParticipantCount > 1 && ` across ${unscheduledParticipantCount} participants`}
                                            </div>
                                            <div style={{ color: '#9CA3AF', fontSize: '10px', marginTop: '2px' }}>
                                              Expand to schedule hours per participant
                                            </div>
                                          </div>
                                        }
                                      >
                                        {gridCell}
                                      </HoverTooltip>
                                    ) : gridCell;
                                  })()}
                                </td>
                              );
                            })}
                            <td style={{ padding: '4px 12px', textAlign: 'center', borderBottom: '1px solid #F3F4F6', borderLeft: '2px solid #D1D5DB', fontSize: '11px', fontWeight: '500', color: '#374151', backgroundColor: expandedRows.has(child.id) ? '#F0F9FF' : '#FAFAFA' }}>
                              {(() => {
                                // AGGREGATE totals from all participants (grandchildren)
                                let totalScheduled = 0;
                                let totalUnscheduled = 0;
                                let participantCount = 0;

                                const hasGrandchildren = child.children && child.children.length > 0;

                                if (hasGrandchildren) {
                                  child.children.forEach((grandchild: any) => {
                                    const assignment = grandchild.assignment;
                                    if (!assignment) return;
                                    participantCount++;

                                    if (assignment.plannedSchedule && assignment.plannedSchedule.length > 0) {
                                      // Sum scheduled hours from this participant
                                      gridPeriods.forEach(period => {
                                        assignment.plannedSchedule.forEach((schedule: any) => {
                                          const scheduleStart = schedule.startDate ? parseDate(schedule.startDate) : new Date(assignment.startDate);
                                          const scheduleEnd = schedule.endDate ? parseDate(schedule.endDate) : new Date(assignment.endDate);
                                          const schedulePlannedHours = parseFloat(schedule.plannedHours || schedule.hours || '0');

                                          if (datesOverlap(scheduleStart, scheduleEnd, period.startDate, period.endDate) && schedulePlannedHours > 0) {
                                            const overlapStart = new Date(Math.max(scheduleStart.getTime(), period.startDate.getTime()));
                                            const overlapEnd = new Date(Math.min(scheduleEnd.getTime(), period.endDate.getTime()));
                                            const workingDaysInSchedule = countWorkingDays(scheduleStart, scheduleEnd);
                                            const workingDaysInPeriod = countWorkingDays(overlapStart, overlapEnd);

                                            if (workingDaysInSchedule > 0) {
                                              totalScheduled += schedulePlannedHours * workingDaysInPeriod / workingDaysInSchedule;
                                            }
                                          }
                                        });
                                      });
                                    } else if (assignment.allocatedHours > 0) {
                                      totalUnscheduled += assignment.allocatedHours;
                                    }
                                  });
                                } else {
                                  const assignment = child.assignment;
                                  if (assignment) {
                                    participantCount = 1;
                                    if (assignment.plannedSchedule && assignment.plannedSchedule.length > 0) {
                                      gridPeriods.forEach(period => {
                                        assignment.plannedSchedule.forEach((schedule: any) => {
                                          const scheduleStart = schedule.startDate ? parseDate(schedule.startDate) : new Date(assignment.startDate);
                                          const scheduleEnd = schedule.endDate ? parseDate(schedule.endDate) : new Date(assignment.endDate);
                                          const schedulePlannedHours = parseFloat(schedule.plannedHours || schedule.hours || '0');

                                          if (datesOverlap(scheduleStart, scheduleEnd, period.startDate, period.endDate) && schedulePlannedHours > 0) {
                                            const overlapStart = new Date(Math.max(scheduleStart.getTime(), period.startDate.getTime()));
                                            const overlapEnd = new Date(Math.min(scheduleEnd.getTime(), period.endDate.getTime()));
                                            const workingDaysInSchedule = countWorkingDays(scheduleStart, scheduleEnd);
                                            const workingDaysInPeriod = countWorkingDays(overlapStart, overlapEnd);

                                            if (workingDaysInSchedule > 0) {
                                              totalScheduled += schedulePlannedHours * workingDaysInPeriod / workingDaysInSchedule;
                                            }
                                          }
                                        });
                                      });
                                    } else if (assignment.allocatedHours > 0) {
                                      totalUnscheduled += assignment.allocatedHours;
                                    }
                                  }
                                }

                                totalScheduled = Math.round(totalScheduled * 100) / 100;

                                // Display: scheduled hours + unscheduled indicator
                                if (totalScheduled > 0 && totalUnscheduled > 0) {
                                  return (
                                    <HoverTooltip
                                      content={
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                          <div style={{ color: '#10B981' }}><span style={{ fontWeight: 600 }}>{totalScheduled.toFixed(2)}h</span> scheduled</div>
                                          <div style={{ color: '#FBBF24' }}><span style={{ fontWeight: 600 }}>{totalUnscheduled.toLocaleString()}h</span> still to plan</div>
                                        </div>
                                      }
                                    >
                                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center', width: '100%' }}>
                                        {totalScheduled.toFixed(2)}h
                                        <span style={{ color: '#B45309', fontSize: '9px' }}>+{totalUnscheduled.toLocaleString()}</span>
                                      </span>
                                    </HoverTooltip>
                                  );
                                } else if (totalUnscheduled > 0) {
                                  return (
                                    <HoverTooltip
                                      content={
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <AlertCircle size={14} style={{ color: '#FBBF24' }} />
                                            <span style={{ fontWeight: 600 }}>Unscheduled</span>
                                          </div>
                                          <div style={{ color: '#FBBF24' }}><span style={{ fontWeight: 600 }}>{totalUnscheduled.toLocaleString()}h</span> total allocated</div>
                                          {participantCount > 1 && <div style={{ color: '#9CA3AF', fontSize: '10px' }}>across {participantCount} participants</div>}
                                        </div>
                                      }
                                    >
                                      <span style={{ color: '#B45309', backgroundColor: '#FEF3C7', padding: '2px 6px', borderRadius: '4px', width: '100%', display: 'flex', justifyContent: 'center' }}>
                                        {totalUnscheduled.toLocaleString()}h
                                      </span>
                                    </HoverTooltip>
                                  );
                                } else if (totalScheduled > 0) {
                                  return `${totalScheduled.toFixed(2)}h`;
                                }
                                return '—';
                              })()}
                            </td>
                          </tr>

                          {/* Grandchild Rows (Level 3 - tasks or persons) */}
                          {expandedRows.has(child.id) && child.children?.map((grandchild: any) => (
                            <tr key={grandchild.id} style={{ backgroundColor: '#F5F5F5' }}>
                              <td style={{
                                padding: '4px 12px 4px 56px',
                                position: 'sticky',
                                left: 0,
                                backgroundColor: '#F5F5F5',
                                zIndex: 10,
                                borderRight: '2px solid #E5E7EB',
                                borderBottom: '1px solid #F3F4F6',
                                whiteSpace: 'nowrap'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {grandchild.type === 'task' ? (
                                    <Target className="w-3 h-3" style={{ color: '#9CA3AF', flexShrink: 0 }} />
                                  ) : (
                                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: '500', color: '#6B7280', flexShrink: 0 }}>
                                      {grandchild.avatar ? (
                                        <img src={grandchild.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                      ) : (
                                        grandchild.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                                      )}
                                    </div>
                                  )}
                                  <span style={{ fontSize: '11px', color: '#6B7280' }}>
                                    {grandchild.name}
                                    {grandchild.workPackage && <span style={{ color: '#9CA3AF', marginLeft: '4px' }}>({grandchild.workPackage})</span>}
                                  </span>
                                </div>
                              </td>
                              {gridPeriods.map((period, idx) => {
                                // Use pre-computed cell data for O(1) lookup
                                const cellKey = `${grandchild.id}:${period.key}`;
                                const cellData = precomputedCellData.get(cellKey) || { hours: 0, hasUnscheduled: false, hasPending: false };
                                const periodHours = cellData.hours;
                                const hasUnscheduled = cellData.hasUnscheduled;
                                const hasPendingChange = cellData.hasPending;

                                const displayValue = periodHours > 0 ? `${periodHours.toFixed(2)}h` : (hasUnscheduled ? '0h' : '—');
                                const assignment = grandchild.assignment;

                                return (
                                  <td
                                    key={period.key}
                                    data-cell-key={cellKey}
                                    onDragOver={(e) => handleDragOver(e, cellKey)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, period, row.id)}
                                    onMouseMove={(e) => fillDragRef.current && handleFillHandleMouseMove(e, grandchild.id, idx)}
                                    style={{
                                      padding: '2px',
                                      textAlign: 'center',
                                      borderBottom: '1px solid #F3F4F6',
                                      borderLeft: idx === 0 || (gridGranularity === 'monthly' && period.startDate.getMonth() === 0) ? '2px solid #D1D5DB' : '1px solid #F3F4F6',
                                      backgroundColor: period.startDate.getMonth() % 2 === 0 ? '#F5F5F5' : 'rgba(0,0,0,0.03)'
                                    }}
                                  >
                                    {/* GridCell with MEMOIZED callbacks - stable refs prevent re-renders */}
                                    {(() => {
                                      const personId = gridHierarchy === 'person'
                                        ? row.id
                                        : (grandchild.personId || grandchild.userId || grandchild.id);
                                      const personName = gridHierarchy === 'person'
                                        ? row.name
                                        : (grandchild.name || grandchild.personName || 'Unknown');

                                      const cellContext: CellContext = {
                                        rowId: grandchild.id,
                                        period: period.key,
                                        periodIdx: idx,
                                        taskId: assignment?.taskId || grandchild.taskId || child.id,
                                        taskName: assignment?.taskName || grandchild.taskName || child.name,
                                        projectId: assignment?.projectId || child.projectId || '',
                                        personId,
                                        personName,
                                        currentValue: periodHours
                                      };

                                      const gridCell = (
                                        <GridCell
                                          context={cellContext}
                                          displayValue={displayValue}
                                          isUnscheduled={hasUnscheduled}
                                          hasPending={hasPendingChange}
                                          editable={true}
                                          draggable={periodHours > 0 || hasUnscheduled}
                                          showFillHandle={periodHours > 0}
                                          onSave={handleGridCellSave}
                                          onDragStart={handleGridCellDragStart}
                                          onDragEnd={handleDragEnd}
                                          onFillHandleMouseDown={handleGridCellFillMouseDown}
                                        />
                                      );

                                      return hasUnscheduled ? (
                                        <HoverTooltip
                                          content={
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <AlertCircle size={14} style={{ color: '#FBBF24' }} />
                                                <span style={{ fontWeight: 600 }}>Unscheduled Hours</span>
                                              </div>
                                              <div style={{ color: '#D1D5DB', fontSize: '11px' }}>
                                                <span style={{ color: '#FBBF24', fontWeight: 600 }}>{assignment?.allocatedHours || 0}h</span> allocated but not yet scheduled
                                              </div>
                                              <div style={{ color: '#9CA3AF', fontSize: '10px', marginTop: '2px' }}>
                                                Drag to another period or click to assign hours
                                              </div>
                                            </div>
                                          }
                                        >
                                          {gridCell}
                                        </HoverTooltip>
                                      ) : gridCell;
                                    })()}
                                  </td>
                                );
                              })}
                              <td style={{ padding: '3px 12px', textAlign: 'center', borderBottom: '1px solid #F3F4F6', borderLeft: '2px solid #D1D5DB', fontSize: '10px', fontWeight: '500', color: '#6B7280', backgroundColor: '#F5F5F5' }}>
                                {(() => {
                                  // Calculate sum of SCHEDULED hours only (from plannedSchedule)
                                  const assignment = grandchild.assignment;
                                  if (!assignment) return '—';

                                  let sum = 0;

                                  // Only sum from plannedSchedule - NOT allocatedHours
                                  if (assignment.plannedSchedule && assignment.plannedSchedule.length > 0) {
                                    gridPeriods.forEach(period => {
                                      assignment.plannedSchedule!.forEach((schedule: any) => {
                                        // Fall back to assignment dates if schedule entry doesn't have dates
                                        const scheduleStart = schedule.startDate ? parseDate(schedule.startDate) : new Date(assignment.startDate);
                                        const scheduleEnd = schedule.endDate ? parseDate(schedule.endDate) : new Date(assignment.endDate);
                                        const schedulePlannedHours = parseFloat(schedule.plannedHours || schedule.hours || '0');

                                        if (datesOverlap(scheduleStart, scheduleEnd, period.startDate, period.endDate) && schedulePlannedHours > 0) {
                                          const overlapStart = new Date(Math.max(scheduleStart.getTime(), period.startDate.getTime()));
                                          const overlapEnd = new Date(Math.min(scheduleEnd.getTime(), period.endDate.getTime()));
                                          const workingDaysInSchedule = countWorkingDays(scheduleStart, scheduleEnd);
                                          const workingDaysInPeriod = countWorkingDays(overlapStart, overlapEnd);

                                          if (workingDaysInSchedule > 0) {
                                            sum += schedulePlannedHours * workingDaysInPeriod / workingDaysInSchedule;
                                          }
                                        }
                                      });
                                    });
                                  }
                                  // Total only shows SCHEDULED hours - unscheduled (allocatedHours) not included
                                  return sum > 0 ? `${sum.toFixed(2)}h` : '—';
                                })()}
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}

                      {/* Pending new project rows (person view: added but not yet saved) */}
                      {gridHierarchy === 'person' && pendingNewProjectRows
                        .filter(p => p.personId === row.id)
                        .map(pending => (
                          <tr key={`pending:${pending.personId}:${pending.projectId}`} style={{ backgroundColor: '#FFF9F0' }}>
                            <td style={{
                              padding: '6px 12px 6px 32px',
                              position: 'sticky',
                              left: 0,
                              backgroundColor: '#FFF9F0',
                              zIndex: 10,
                              borderRight: '2px solid #E5E7EB',
                              borderBottom: '1px solid #E5E7EB',
                              whiteSpace: 'nowrap'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: pending.color || '#6B7280', flexShrink: 0 }} />
                                <span style={{ fontSize: '12px', color: '#374151' }}>{pending.projectName}</span>
                                <span style={{ fontSize: '10px', color: '#F59E0B', backgroundColor: '#FEF3C7', padding: '1px 4px', borderRadius: '3px' }}>new</span>
                              </div>
                            </td>
                            {gridPeriods.map((period, idx) => {
                              const cellContext: CellContext = {
                                rowId: `${pending.personId}:${pending.projectId}`,
                                period: period.key,
                                periodIdx: idx,
                                taskId: '',
                                taskName: '',
                                projectId: pending.projectId,
                                personId: pending.personId,
                                personName: row.name,
                                currentValue: 0
                              };
                              return (
                                <td
                                  key={period.key}
                                  style={{
                                    padding: '2px',
                                    textAlign: 'center',
                                    borderBottom: '1px solid #E5E7EB',
                                    borderLeft: idx === 0 || (gridGranularity === 'monthly' && period.startDate.getMonth() === 0) ? '2px solid #D1D5DB' : '1px solid #F3F4F6',
                                    backgroundColor: '#FFF9F0'
                                  }}
                                >
                                  <GridCell
                                    context={cellContext}
                                    displayValue="—"
                                    isUnscheduled={false}
                                    hasPending={false}
                                    editable={true}
                                    draggable={false}
                                    showFillHandle={false}
                                    onSave={handleGridCellSave}
                                    onDragStart={handleGridCellDragStart}
                                    onDragEnd={handleDragEnd}
                                    onFillHandleMouseDown={handleGridCellFillMouseDown}
                                  />
                                </td>
                              );
                            })}
                            <td style={{ borderBottom: '1px solid #E5E7EB', borderLeft: '2px solid #D1D5DB', backgroundColor: '#FFF9F0' }} />
                          </tr>
                        ))
                      }

                      {/* Add New Row (when expanded) */}
                      {expandedRows.has(row.id) && (
                        <tr style={{ backgroundColor: '#F9FAFB' }}>
                          <td style={{
                            padding: '6px 12px 6px 44px',
                            position: 'sticky',
                            left: 0,
                            backgroundColor: '#F9FAFB',
                            zIndex: 10,
                            borderRight: '2px solid #E5E7EB',
                            borderBottom: '1px solid #E5E7EB',
                            whiteSpace: 'nowrap'
                          }}>
                            <button
                              onClick={() => {
                                setAddTargetPersonId(row.id);
                                setShowProjectAutocomplete(true);
                                setAutocompleteFilter('');
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '4px 8px',
                                border: '1px dashed #D1D5DB',
                                borderRadius: '4px',
                                backgroundColor: 'transparent',
                                fontSize: '11px',
                                color: '#6B7280',
                                cursor: 'pointer'
                              }}
                            >
                              <Plus className="w-3 h-3" />
                              Add {gridHierarchy === 'person' ? 'project' : 'person'}
                            </button>
                          </td>
                          {gridPeriods.map((period, idx) => (
                            <td
                              key={period.key}
                              style={{
                                borderBottom: '1px solid #E5E7EB',
                                borderLeft: idx === 0 || (gridGranularity === 'monthly' && period.startDate.getMonth() === 0) ? '2px solid #D1D5DB' : '1px solid #F3F4F6',
                                backgroundColor: '#F9FAFB'
                              }}
                            />
                          ))}
                          <td style={{
                            borderBottom: '1px solid #E5E7EB',
                            borderLeft: '2px solid #D1D5DB',
                            backgroundColor: '#F9FAFB'
                          }} />
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>}

            {/* Grid Footer */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '12px', color: '#6B7280' }}>
                {filteredMembers.length} people · {gridPeriods.length} {gridGranularity === 'monthly' ? 'months' : 'weeks'} · Click any cell to edit
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#DCFCE7' }} />
                  <span style={{ fontSize: '11px', color: '#6B7280' }}>80-100%</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#FEE2E2' }} />
                  <span style={{ fontSize: '11px', color: '#6B7280' }}>&gt;100%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedTask && <TaskDetailModal assignment={selectedTask.assignment} member={selectedTask.member} onClose={closeSelectedTask} />}
      {tooltip && <Tooltip assignment={tooltip.assignment} position={tooltip.position} displayUnit={displayUnit} />}
      {editingCapacity && <CapacityEditPopover member={editingCapacity.member} position={editingCapacity.position} onSave={updateMemberCapacity} onClose={closeEditingCapacity} />}
      {editingLeave && <LeaveModal member={editingLeave} onClose={closeEditingLeave} onSave={updateMemberLeave} />}

      {/* Add Project to Person modal (person view) */}
      {showProjectAutocomplete && addTargetPersonId && (() => {
        const targetRow = gridData.find((r: any) => r.id === addTargetPersonId);
        const existingProjectIds = new Set([
          ...(targetRow?.children?.map((c: any) => c.projectId) || []),
          ...pendingNewProjectRows.filter(p => p.personId === addTargetPersonId).map(p => p.projectId)
        ]);
        const filteredProjects = sortedProjects.filter((p: any) =>
          !existingProjectIds.has(p.id) &&
          p.name.toLowerCase().includes(autocompleteFilter.toLowerCase())
        );
        return (
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              backgroundColor: 'rgba(0,0,0,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            onClick={() => { setShowProjectAutocomplete(false); setAddTargetPersonId(null); }}
          >
            <div
              style={{
                backgroundColor: '#fff',
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                width: '360px',
                maxHeight: '480px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ padding: '16px', borderBottom: '1px solid #E5E7EB' }}>
                <div style={{ fontWeight: 600, fontSize: '14px', color: '#111827', marginBottom: '8px' }}>
                  Add project to {targetRow?.name}
                </div>
                <input
                  autoFocus
                  value={autocompleteFilter}
                  onChange={e => setAutocompleteFilter(e.target.value)}
                  placeholder="Search projects..."
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {filteredProjects.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>
                    {autocompleteFilter ? 'No projects match your search' : 'All projects already added'}
                  </div>
                ) : (
                  filteredProjects.map((project: any) => (
                    <button
                      key={project.id}
                      onClick={() => {
                        setPendingNewProjectRows(prev => [...prev, {
                          personId: addTargetPersonId!,
                          projectId: project.id,
                          projectName: project.name,
                          color: project.color
                        }]);
                        setExpandedRows(prev => new Set(prev).add(addTargetPersonId!));
                        setShowProjectAutocomplete(false);
                        setAddTargetPersonId(null);
                        setAutocompleteFilter('');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        width: '100%',
                        padding: '10px 16px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        textAlign: 'left',
                        borderBottom: '1px solid #F3F4F6'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: project.color || '#6B7280', flexShrink: 0 }} />
                      <span style={{ fontSize: '13px', color: '#111827' }}>{project.name}</span>
                    </button>
                  ))
                )}
              </div>
              <div style={{ padding: '12px 16px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => { setShowProjectAutocomplete(false); setAddTargetPersonId(null); }}
                  style={{ padding: '6px 14px', border: '1px solid #D1D5DB', borderRadius: '6px', backgroundColor: '#fff', fontSize: '13px', cursor: 'pointer', color: '#374151' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
