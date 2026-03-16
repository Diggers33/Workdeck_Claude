/**
 * ResourcePlanner Utility Functions
 */

import { HOURS_PER_PERSON_MONTH, TimeRange } from './types';

// Parse date string - handles DD/MM/YYYY, ISO, and other formats
export function parseDate(dateStr: string): Date {
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
export function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Get start of month
export function getStartOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

// Get start of quarter
export function getStartOfQuarter(date: Date): Date {
  const quarter = Math.floor(date.getMonth() / 3);
  return new Date(date.getFullYear(), quarter * 3, 1);
}

// Get start of year
export function getStartOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1);
}

// Convert hours to person-months
export function hoursToPM(hours: number): number {
  return Math.round((hours / HOURS_PER_PERSON_MONTH) * 100) / 100;
}

// Count working days (Monday-Friday) between two dates
export function countWorkingDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

// Check if date ranges overlap
export function datesOverlap(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
  return start1 <= end2 && end1 >= start2;
}

// Format date for display
export function formatDate(date: Date, format: 'short' | 'medium' | 'long' = 'medium'): string {
  if (format === 'short') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  if (format === 'long') {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Get week number
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// Format period label based on time range
export function formatPeriodLabel(date: Date, range: TimeRange): string {
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

// Calculate participant's hours for a specific month from their plannedSchedule
export type AllocationStatus = 'scheduled' | 'unscheduled' | 'none';

export interface MonthlyAllocation {
  hours: number;
  status: AllocationStatus;
  allocatedTotal: number;
}

export function getParticipantMonthlyHours(
  participant: any,
  monthStart: Date,
  monthEnd: Date
): MonthlyAllocation {
  const allocatedTotal = parseFloat(participant?.availableHours || '0');

  if (!participant?.plannedSchedule || participant.plannedSchedule.length === 0) {
    return {
      hours: 0,
      status: allocatedTotal > 0 ? 'unscheduled' : 'none',
      allocatedTotal
    };
  }

  let totalHours = 0;
  participant.plannedSchedule.forEach((schedule: any) => {
    const scheduleStart = parseDate(schedule.startDate);
    const scheduleEnd = parseDate(schedule.endDate);
    const schedulePlannedHours = parseFloat(schedule.plannedHours || schedule.hours || '0');

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

// Generate periods based on time range
export function generatePeriods(startDate: Date, range: TimeRange): { start: Date; end: Date; label: string }[] {
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
