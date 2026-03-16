/**
 * Date Utilities for Workdeck API
 * 
 * Workdeck uses DD/MM/YYYY format for dates in API requests
 * Responses may include time: "16/07/2025 15:00:00+00:00"
 */

/**
 * Format a Date object to DD/MM/YYYY for API requests
 */
export function formatDateForAPI(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format a Date object to DD/MM/YYYY HH:mm:ss+HH:00 for event API requests
 * This format is required for create-event and update-event endpoints
 * Includes correct timezone offset (e.g., +01:00 for CET)
 */
export function formatDateTimeForAPI(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  // Get timezone offset in +HH:mm format
  const tzOffset = -date.getTimezoneOffset(); // getTimezoneOffset returns negative for positive offsets
  const tzSign = tzOffset >= 0 ? '+' : '-';
  const tzHours = String(Math.floor(Math.abs(tzOffset) / 60)).padStart(2, '0');
  const tzMins = String(Math.abs(tzOffset) % 60).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}${tzSign}${tzHours}:${tzMins}`;
}

/**
 * Parse a DD/MM/YYYY string from API to Date object
 */
export function parseDateFromAPI(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  // Match DD/MM/YYYY or DD/MM/YYYY HH:mm:ss+TZ
  const match = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2}):(\d{1,2}))?/);
  
  if (!match) return null;
  
  const [, day, month, year, hour, minute, second] = match;
  
  if (hour && minute && second) {
    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(minute),
      parseInt(second)
    );
  }
  
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
}

/**
 * Parse ISO 8601 datetime string to Date
 */
export function parseISODate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Get today's date in DD/MM/YYYY format
 */
export function getTodayForAPI(): string {
  return formatDateForAPI(new Date());
}

/**
 * Get date range for API (e.g., for events or who-is-where)
 */
export function getDateRangeForAPI(startDate: Date, endDate: Date): { startDate: string; endDate: string } {
  return {
    startDate: formatDateForAPI(startDate),
    endDate: formatDateForAPI(endDate),
  };
}

/**
 * Get this week's date range
 */
export function getThisWeekRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  return getDateRangeForAPI(monday, sunday);
}

/**
 * Get this month's date range
 */
export function getThisMonthRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  return getDateRangeForAPI(firstDay, lastDay);
}

/**
 * Format relative time (e.g., "2 hours ago", "Yesterday")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return date.toLocaleDateString();
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if a date is overdue (before today)
 */
export function isOverdue(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

/**
 * Calculate days until a date (negative if overdue)
 */
export function daysUntil(date: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  
  const diffMs = target.getTime() - today.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Format date for display (e.g., "Mon, Jan 15")
 */
export function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format time for display (e.g., "3:30 PM")
 */
export function formatDisplayTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
