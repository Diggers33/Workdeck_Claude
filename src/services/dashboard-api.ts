/**
 * Dashboard API Service
 * Centralized data fetching for all dashboard widgets
 */

import { apiClient } from './api-client';
import { ENDPOINTS } from '../config/api';
import { formatDateForAPI, getThisWeekRange, getTodayForAPI } from '../utils/date-utils';

// ============================================================================
// In-Memory Response Cache
// ============================================================================

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  promise?: Promise<T>;
}

const DEFAULT_TTL = 300_000; // 300 seconds (5 min) in milliseconds

/** Stale data is served up to STALE_MULTIPLIER × TTL after it was fetched */
const STALE_MULTIPLIER = 2;

const responseCache = new Map<string, CacheEntry>();

/**
 * Cached GET helper with in-flight deduplication and stale-while-revalidate.
 *
 * Three time windows (given a TTL of T):
 *   0 … T          → FRESH  – return cached data immediately.
 *   T … T×STALE    → STALE  – return cached data immediately AND trigger a
 *                              silent background refetch to refresh the cache.
 *   > T×STALE      → EXPIRED – full blocking refetch.
 *
 * In-flight deduplication is preserved: concurrent calls for the same key
 * share a single network request.
 */
async function cachedGet<T>(key: string, fetcher: () => Promise<T>, ttl: number = DEFAULT_TTL): Promise<T> {
  const now = Date.now();
  const entry = responseCache.get(key);
  const staleTtl = ttl * STALE_MULTIPLIER;

  // ---- FRESH cache hit ----
  if (entry && entry.data !== undefined && (now - entry.timestamp) < ttl) {
    return entry.data as T;
  }

  // ---- STALE cache hit (between TTL and STALE_TTL) ----
  if (entry && entry.data !== undefined && (now - entry.timestamp) < staleTtl) {
    // Trigger a background refresh only if one is not already in flight
    if (!entry.promise) {
      const bgPromise = fetcher().then(
        (data) => {
          // Update cache with fresh data; clear the background promise
          responseCache.set(key, { data, timestamp: Date.now() });
          return data;
        },
        () => {
          // Background refresh failed — keep existing stale data, clear promise
          // so the next stale hit can retry
          const current = responseCache.get(key);
          if (current) {
            responseCache.set(key, { data: current.data, timestamp: current.timestamp });
          }
        }
      );
      // Mark background refetch as in-flight (preserves existing data + timestamp)
      responseCache.set(key, { data: entry.data, timestamp: entry.timestamp, promise: bgPromise as Promise<any> });
    }
    // Return stale data immediately
    return entry.data as T;
  }

  // ---- EXPIRED or no cache entry ----

  // Return in-flight promise if a request is already pending (deduplication)
  if (entry && entry.promise) {
    return entry.promise as Promise<T>;
  }

  // Create the fetch promise
  const promise = fetcher().then(
    (data) => {
      // Store the resolved data and clear the in-flight promise
      responseCache.set(key, { data, timestamp: Date.now() });
      return data;
    },
    (error) => {
      // On failure, remove the cache entry so the next call retries
      responseCache.delete(key);
      throw error;
    }
  );

  // Store the in-flight promise immediately for deduplication
  responseCache.set(key, { data: undefined as any, timestamp: 0, promise });

  return promise;
}

/**
 * Clear cache entries. If a key is provided, clears only that entry.
 * If a key prefix is provided with a trailing '*', clears all matching entries.
 * If no key is provided, clears all cache entries.
 */
export function clearCache(key?: string): void {
  if (!key) {
    responseCache.clear();
    return;
  }

  if (key.endsWith('*')) {
    const prefix = key.slice(0, -1);
    for (const k of Array.from(responseCache.keys())) {
      if (k.startsWith(prefix)) {
        responseCache.delete(k);
      }
    }
  } else {
    responseCache.delete(key);
  }
}

// Cache key constants
const CACHE_KEYS = {
  PROJECTS_SUMMARY: 'projects_summary',
  USERS: 'users',
  ALL_TASKS: 'all_tasks',
  WHATS_PENDING: 'whats_pending',
  WHOS_WHERE: 'whos_where',
  TIMESHEETS: 'timesheets',
  ALL_TIMESHEETS: 'all_timesheets',
  CLIENTS: 'clients',
  EXPENSES: 'expenses',
  INVOICES: 'invoices',
  EVENTS: 'events',
  DEPARTMENTS: 'departments',
  LEAVE_REQUESTS: 'leave_requests',
  CURRENT_USER: 'current_user',
  WHATS_NEW: 'whats_new',
} as const;

// Cache TTL values (in milliseconds)
// NOTE: Stale-while-revalidate extends each window by STALE_MULTIPLIER (2×).
//   e.g. DEFAULT 300s → fresh 0-5min, stale+revalidate 5-10min, expired >10min.
const CACHE_TTL = {
  SHORT: 120_000,   // 2 min — for highly dynamic data  (stale window up to 4 min)
  DEFAULT: 300_000, // 5 min — standard                 (stale window up to 10 min)
  LONG: 300_000,    // 5 min — for infrequently changing data (stale window up to 10 min)
} as const;

// ============================================================================
// Types
// ============================================================================

export interface ProjectSummary {
  id: string;
  name: string;
  code: string;
  status?: number;
  startDate?: string;
  endDate?: string;
  client?: { id: string; name: string };
  projectType?: { id: string; name: string };
  allocatedHours?: string;
  spentHours?: string;
  plannedHours?: string;
  availableHours?: string;
  contractValue?: string;
  alerts?: Array<{
    type: string;
    message: string;
    severity: 'warning' | 'critical';
  }>;
  members?: Array<{
    user: { id: string; fullName: string };
    isProjectManager: boolean;
  }>;
}

export interface WhosWhereEntry {
  user: {
    id: string;
    fullName: string;
    email?: string;
  };
  status: string; // 'Office', 'Remote', 'WFH', 'Leave', etc.
  date: string;
  department?: string;
  office?: { id: string; name: string };
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  color?: string;
  timesheet?: boolean;   // true = onlyTimesheets event (counts toward timesheet hours)
  task?: { id: string; name: string };
  project?: { id: string; name: string };
  guests?: Array<{ guestId: string; guest: { id: string; firstName: string; lastName: string; email: string; avatar?: string }; state?: number; rejectComment?: string | null }>;
  creator?: { id: string; firstName: string; lastName: string; email: string; avatar?: string };
}

export interface Task {
  id: string;
  name: string;
  summary?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  importance?: number;
  position?: number;
  plannedHours?: string;
  spentHours?: string;
  column?: { id: string; name: string; systemCode?: number };
  activity?: {
    id: string;
    name: string;
    project?: { id: string; name: string; code?: string };
  };
  participants?: Array<{
    user: { id: string; fullName: string };
    isOwner: boolean;
  }>;
  labels?: Array<{ id: string; name: string; color: string }>;
  numComments?: number;
  numFlags?: number;
  numChecklist?: number;
  numChecklistDone?: number;
}

export interface WhatsPending {
  tasks?: number;
  leaveRequests?: number;
  expenses?: number;
  purchases?: number;
  timesheets?: number;
  total?: number;
}

export interface WhatsNewItem {
  id: string;
  type: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  entity?: { id: string; type: string };
  user?: { id: string; fullName: string };
}

export interface LeaveRequest {
  id: string;
  user: { id: string; fullName: string };
  leaveType: { id: string; name: string; color: string };
  startDate: string;
  endDate: string;
  days: number;
  status: number; // 0=Pending, 1=Approved, 2=Denied
  comment?: string;
}

export interface CurrentUser {
  id: string;
  fullName: string;
  email: string;
  department?: { id: string; name: string; manager?: { id: string; fullName: string }; members?: Array<{ id: string; fullName: string }> };
  office?: { id: string; name: string };
  manager?: { id: string; fullName: string };
  isAdmin?: boolean;
  isManager?: boolean;
  isGuest?: boolean;
  costPerHour?: string;
  staffCategory?: { id: string; name: string };
  phone?: string;
}

// The /queries/departments endpoint returns a plain string array of department names
export type DepartmentEntry = string;

export interface TimesheetEntry {
  id: string;
  user: { id: string; fullName: string };
  date: string; // DD/MM/YYYY
  hours: string;
  task?: { id: string; name: string };
  project?: { id: string; name: string; code?: string };
  description?: string;
  // Present on period-level submission records
  status?: 1 | 2 | 3; // 1=PENDING, 2=APPROVED, 3=DENIED
  startAt?: string;    // Period start (ISO or DD/MM/YYYY)
  denyComment?: string;
}

/**
 * A submitted timesheet period record returned by /queries/me/timesheets
 * or /queries/me/team/timesheets.
 */
export interface TimesheetRecord {
  id: string;
  status: 1 | 2 | 3; // 1=PENDING, 2=APPROVED, 3=DENIED
  hours: number | string;
  startAt: string;     // period start (ISO)
  denyComment?: string;
  user?: { id: string; fullName: string; firstName?: string; lastName?: string };
}

/**
 * Full timesheet detail returned by GET /queries/timesheets/:id.
 * Includes the immutable event snapshot captured at submission time.
 */
export interface TimesheetDetail extends TimesheetRecord {
  endAt?: string;
  events?: Array<{
    id: string;
    title: string;
    startAt: string;
    endAt: string;
    project?: { id: string; name: string; code?: string };
    task?: { id: string; name: string };
    color?: string;
  }>;
}

export interface ExpenseEntry {
  id: string;
  user: { id: string; fullName: string };
  project?: { id: string; name: string };
  date: string; // DD/MM/YYYY
  amount: string;
  currency?: { id: string; name: string; symbol?: string };
  category: string;
  description?: string;
  status: number; // 0=Pending, 1=Approved, 2=Denied
}

export interface InvoiceEntry {
  id: string;
  number: string;
  client?: { id: string; name: string };
  date: string; // DD/MM/YYYY
  dueDate?: string;
  amount: string;
  currency?: { id: string; name: string; symbol?: string };
  status: string;
  total: string;
  items?: Array<{ description: string; quantity: number; rate: string; amount: string }>;
}

export interface ClientEntry {
  id: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface AllLeaveRequest {
  id: string;
  user: { id: string; fullName: string };
  leaveType: { id: string; name: string; color: string };
  startDate: string;
  endDate: string;
  days: number;
  status: number; // 0=Pending, 1=Approved, 2=Denied
  comment?: string;
  approver?: { id: string; fullName: string };
}

// ============================================================================
// Dashboard API Service
// ============================================================================

class DashboardApiService {
  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<CurrentUser> {
    return cachedGet<CurrentUser>(
      CACHE_KEYS.CURRENT_USER,
      () => apiClient.get<CurrentUser>(ENDPOINTS.ME),
      CACHE_TTL.LONG
    );
  }

  /**
   * Get all projects summary for Key Metrics and Red Zone
   * @param filter - Optional filter: 'all_my', 'all_my_team', 'all_my_company', 'active', 'inactive'
   */
  async getProjectsSummary(filter?: string): Promise<ProjectSummary[]> {
    const url = filter
      ? `${ENDPOINTS.PROJECTS_SUMMARY}?filter=${filter}`
      : ENDPOINTS.PROJECTS_SUMMARY;
    const cacheKey = filter
      ? `${CACHE_KEYS.PROJECTS_SUMMARY}:${filter}`
      : CACHE_KEYS.PROJECTS_SUMMARY;
    return cachedGet<ProjectSummary[]>(
      cacheKey,
      () => apiClient.get<ProjectSummary[]>(url),
      CACHE_TTL.DEFAULT
    );
  }

  /**
   * Get project counts for each scope (Mine, Team, Company)
   * Makes parallel API calls to get counts
   */
  async getProjectScopeCounts(): Promise<{ mine: number; team: number; company: number }> {
    try {
      const [mine, team, company] = await Promise.all([
        this.getProjectsSummary('all_my').then(p => p.length).catch(() => 0),
        this.getProjectsSummary('all_my_team').then(p => p.length).catch(() => 0),
        this.getProjectsSummary('all_my_company').then(p => p.length).catch(() => 0)
      ]);
      return { mine, team, company };
    } catch (error) {
      console.error('Failed to fetch scope counts:', error);
      return { mine: 0, team: 0, company: 0 };
    }
  }

  /**
   * Get who's where data for team location widget
   * Note: API returns 204 No Content when no location data exists
   *
   * The API returns WhoIsWhereEntity[] with nested leaveEvents (calendar events)
   * and leaveRequests (leave requests). We flatten these into WhosWhereEntry[].
   */
  async getWhosWhere(startDate?: string, endDate?: string): Promise<WhosWhereEntry[]> {
    return cachedGet<WhosWhereEntry[]>(
      CACHE_KEYS.WHOS_WHERE,
      async () => {
        try {
          const result = await apiClient.get<any[]>(ENDPOINTS.WHOS_WHERE);

          if (!result) return [];
          if (!Array.isArray(result)) return [];
          if (result.length === 0) return [];

          console.debug('[WhosWhere] raw API response sample:', JSON.stringify(result[0], null, 2));

          // If the API already returns flat WhosWhereEntry objects (has .status field), use them directly
          if (result[0] && typeof result[0].status === 'string' && result[0].user) {
            return result as WhosWhereEntry[];
          }

          // Otherwise parse the nested WhoIsWhereEntity format:
          // Each entity has leaveEvents[] (calendar events) and leaveRequests[] (leave requests)
          const entries: WhosWhereEntry[] = [];
          for (const entity of result) {
            // leaveEvents = calendar events marking Office/Remote/WFH status
            for (const ev of (entity.leaveEvents || [])) {
              const user = ev.user;
              if (!user?.id) continue;
              entries.push({
                user: {
                  id: user.id,
                  fullName: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                  email: user.email,
                },
                status: ev.type || 'External',
                date: ev.startAt || '',
              });
            }
            // leaveRequests = approved leave requests
            for (const lr of (entity.leaveRequests || [])) {
              const user = lr.user;
              if (!user?.id) continue;
              entries.push({
                user: {
                  id: user.id,
                  fullName: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                  email: user.email,
                },
                status: lr.leaveType?.name || 'On Leave',
                date: lr.startAt || '',
              });
            }
          }
          return entries;
        } catch (error) {
          console.error('Failed to fetch who\'s where:', error);
          return [];
        }
      },
      CACHE_TTL.DEFAULT
    );
  }

  /**
   * Get today's events for Agenda widget
   */
  async getTodayEvents(): Promise<CalendarEvent[]> {
    const today = new Date();
    const start = today.toISOString().split('T')[0];
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const cacheKey = `${CACHE_KEYS.EVENTS}:today:${start}`;
    return cachedGet<CalendarEvent[]>(
      cacheKey,
      async () => {
        try {
          const user = await this.getCurrentUser();
          return await apiClient.get<CalendarEvent[]>(`/queries/events/user/${user.id}`, { start, tz });
        } catch (error) {
          console.error('Failed to fetch events:', error);
          return [];
        }
      },
      CACHE_TTL.SHORT
    );
  }

  /**
   * Get events for a date range
   */
  async getEvents(startDate: Date, endDate?: Date): Promise<CalendarEvent[]> {
    const start = startDate.toISOString().split('T')[0];
    const end = endDate ? endDate.toISOString().split('T')[0] : undefined;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const cacheKey = `${CACHE_KEYS.EVENTS}:${start}:${end || 'none'}`;
    return cachedGet<CalendarEvent[]>(
      cacheKey,
      async () => {
        try {
          const user = await this.getCurrentUser();
          const params: Record<string, string> = { start, tz };
          if (end && end !== start) {
            params.end = end;
          }
          return await apiClient.get<CalendarEvent[]>(`/queries/events/user/${user.id}`, params);
        } catch (error) {
          console.error('Failed to fetch events:', error);
          return [];
        }
      },
      CACHE_TTL.SHORT
    );
  }

  /**
   * Get calendar events for a specific user (used by managers viewing another user's timesheet).
   */
  async getEventsForUser(userId: string, startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const cacheKey = `${CACHE_KEYS.EVENTS}:${userId}:${start}:${end}`;
    return cachedGet<CalendarEvent[]>(
      cacheKey,
      async () => {
        try {
          return await apiClient.get<CalendarEvent[]>(`/queries/events/user/${userId}`, { start, end, tz });
        } catch (error) {
          console.error('Failed to fetch events for user:', error);
          return [];
        }
      },
      CACHE_TTL.SHORT
    );
  }

  /**
   * Get user's tasks for To-Do widget
   */
  async getMyTasks(userId: string): Promise<Task[]> {
    try {
      return await apiClient.get<Task[]>(ENDPOINTS.USER_TASKS(userId));
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      return [];
    }
  }

  /**
   * Get all tasks (if needed)
   */
  async getAllTasks(): Promise<Task[]> {
    return cachedGet<Task[]>(
      CACHE_KEYS.ALL_TASKS,
      async () => {
        try {
          // /queries/tasks only returns ~50 results (server-side limit, ignores pagination).
          // Fetch per-user tasks and deduplicate to get the full set.
          // Reuse the cached getUsers() call to avoid a redundant /users-summary request.
          const users = await this.getUsers();
          const userList = Array.isArray(users) ? users : (users as any)?.result || [];
          const enabledUsers = userList.filter((u: any) => u.enabled !== false && !u.isGuest);

          console.log(`[getAllTasks] Fetching tasks for ${enabledUsers.length} users...`);

          // Fire all per-user requests in parallel — HTTP/2 multiplexing
          // handles concurrency; sequential batching was adding unnecessary delay
          const taskMap = new Map<string, Task>(); // deduplicate by task ID

          const results = await Promise.allSettled(
            enabledUsers.map((u: any) =>
              apiClient.get<Task[]>(ENDPOINTS.USER_TASKS(u.id)).catch(() => [])
            )
          );

          results.forEach((result) => {
            if (result.status === 'fulfilled') {
              const tasks = Array.isArray(result.value) ? result.value : [];
              tasks.forEach((task: any) => {
                if (task?.id && !taskMap.has(task.id)) {
                  taskMap.set(task.id, task);
                }
              });
            }
          });

          const allTasks = Array.from(taskMap.values());
          console.log(`[getAllTasks] Fetched ${allTasks.length} unique tasks from ${enabledUsers.length} users`);
          return allTasks;
        } catch (error) {
          console.error('Failed to fetch all tasks:', error);
          return [];
        }
      },
      CACHE_TTL.DEFAULT
    );
  }

  /**
   * Get pending approvals count
   */
  async getWhatsPending(): Promise<WhatsPending> {
    return cachedGet<WhatsPending>(
      CACHE_KEYS.WHATS_PENDING,
      async () => {
        try {
          return await apiClient.get<WhatsPending>(ENDPOINTS.WHATS_PENDING);
        } catch (error) {
          console.error('Failed to fetch pending:', error);
          return { total: 0 };
        }
      },
      CACHE_TTL.SHORT
    );
  }

  /**
   * Get what's new / FYI items
   */
  async getWhatsNew(): Promise<WhatsNewItem[]> {
    return cachedGet<WhatsNewItem[]>(
      CACHE_KEYS.WHATS_NEW,
      async () => {
        try {
          return await apiClient.get<WhatsNewItem[]>(ENDPOINTS.WHATS_NEW);
        } catch (error) {
          console.error('Failed to fetch what\'s new:', error);
          return [];
        }
      },
      CACHE_TTL.SHORT
    );
  }

  /**
   * Get pending leave requests (for managers)
   */
  async getPendingLeaveRequests(): Promise<LeaveRequest[]> {
    return cachedGet<LeaveRequest[]>(
      `${CACHE_KEYS.LEAVE_REQUESTS}:pending`,
      async () => {
        try {
          return await apiClient.get<LeaveRequest[]>(ENDPOINTS.PENDING_LEAVE_REQUESTS);
        } catch (error) {
          console.error('Failed to fetch pending leave:', error);
          return [];
        }
      },
      CACHE_TTL.DEFAULT
    );
  }

  /**
   * Get all users (for team widgets)
   */
  async getUsers(): Promise<CurrentUser[]> {
    return cachedGet<CurrentUser[]>(
      CACHE_KEYS.USERS,
      async () => {
        try {
          const raw = await apiClient.get<any>(ENDPOINTS.USERS);
          console.debug('[getUsers] raw response:', JSON.stringify(raw)?.slice(0, 300));
          const list = Array.isArray(raw) ? raw : (raw?.items || raw?.users || raw?.data || []);
          if (!Array.isArray(list) || list.length === 0) {
            // Fallback: try users-summary endpoint
            const raw2 = await apiClient.get<any>(ENDPOINTS.USERS_SUMMARY);
            console.debug('[getUsers] users-summary response:', JSON.stringify(raw2)?.slice(0, 300));
            const list2 = Array.isArray(raw2) ? raw2 : (raw2?.items || raw2?.users || raw2?.data || []);
            if (Array.isArray(list2) && list2.length > 0) {
              return list2.map((u: any) => ({
                ...u,
                fullName: u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'Unknown',
              })) as CurrentUser[];
            }
            return [];
          }
          return list.map((u: any) => ({
            ...u,
            fullName: u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'Unknown',
          })) as CurrentUser[];
        } catch (error) {
          console.error('Failed to fetch users:', error);
          return [];
        }
      },
      CACHE_TTL.LONG
    );
  }

  /**
   * Get departments with members
   */
  async getDepartments(): Promise<string[]> {
    return cachedGet<string[]>(
      CACHE_KEYS.DEPARTMENTS,
      async () => {
        try {
          const result = await apiClient.get<string[]>(ENDPOINTS.DEPARTMENTS);
          return Array.isArray(result) ? result.filter(d => typeof d === 'string') : [];
        } catch (error) {
          console.error('Failed to fetch departments:', error);
          return [];
        }
      },
      CACHE_TTL.LONG
    );
  }

  /**
   * Get timesheets (time tracking entries)
   * Tries user-scoped endpoint first, then falls back to deriving from calendar events.
   */
  async getTimesheets(): Promise<TimesheetEntry[]> {
    return cachedGet<TimesheetEntry[]>(
      CACHE_KEYS.TIMESHEETS,
      async () => {
        // Try user-scoped endpoint first
        try {
          const result = await apiClient.get<TimesheetEntry[]>(ENDPOINTS.MY_TIMESHEETS);
          if (Array.isArray(result) && result.length > 0) return result;
        } catch (error) {
          console.warn('MY_TIMESHEETS endpoint failed, trying calendar fallback:', error);
        }

        // Fallback: derive timesheet-like entries from current user's recent calendar events only.
        // Previous approach fetched events for ALL users spanning 11 years — caused 75+ API
        // calls and frequent 502s. Only fetch current user's last 90 days instead.
        try {
          const now = new Date();
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - 90);

          const [events, currentUser] = await Promise.all([
            this.getEvents(startDate, now),
            this.getCurrentUser().catch(() => ({ id: 'current', fullName: 'Current User' } as CurrentUser)),
          ]);
          const cu = currentUser as any;
          const userName = cu.fullName
            || `${cu.firstName || ''} ${cu.lastName || ''}`.trim()
            || cu.name || cu.email || 'Current User';
          return this.eventsToTimesheets(events, currentUser.id, userName);
        } catch (error) {
          console.error('Failed to derive timesheets from calendar:', error);
          return [];
        }
      },
      CACHE_TTL.DEFAULT
    );
  }

  /**
   * Get timesheets for ALL users (org-wide) — used by the reports engine.
   * Fetches approved + pending + denied team timesheets and normalises them
   * into TimesheetEntry shape so report generators can group by user/date.
   */
  async getAllTimesheets(): Promise<TimesheetEntry[]> {
    return cachedGet<TimesheetEntry[]>(
      CACHE_KEYS.ALL_TIMESHEETS,
      async () => {
        try {
          const [approved, pending, denied] = await Promise.all([
            this.getTeamTimesheets(2),
            this.getTeamTimesheets(1),
            this.getTeamTimesheets(3),
          ]);
          const all = [...approved, ...pending, ...denied];
          // Convert period-level TimesheetRecord → TimesheetEntry for the reports engine
          return all.map(r => ({
            id: r.id,
            user: r.user ?? { id: 'unknown', fullName: 'Unknown' },
            date: r.startAt,           // DD/MM/YYYY — same format filterTimesheetsByDate expects
            hours: String(r.hours),
          } as TimesheetEntry));
        } catch (error) {
          console.warn('getAllTimesheets: team timesheets failed, falling back to own timesheets:', error);
          return this.getTimesheets();
        }
      },
      CACHE_TTL.DEFAULT
    );
  }

  /**
   * Get team timesheets for the manager approval panel.
   * Regular managers see direct reports; timesheetAdmins see all.
   * @param status 1=PENDING (default), 2=APPROVED, 3=DENIED
   */
  async getTeamTimesheets(status: 1 | 2 | 3 = 1): Promise<TimesheetRecord[]> {
    try {
      const result = await apiClient.get<TimesheetRecord[]>(
        `${ENDPOINTS.TEAM_TIMESHEETS}?status=${status}`
      );
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.warn('getTeamTimesheets failed:', error);
      return [];
    }
  }

  /**
   * Get my submitted timesheet records (period-level, with status).
   * Returns the raw period records — distinct from calendar-derived entries.
   */
  async getMyTimesheetRecords(): Promise<TimesheetRecord[]> {
    try {
      const result = await apiClient.get<TimesheetRecord[]>(ENDPOINTS.MY_TIMESHEETS);
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.warn('getMyTimesheetRecords failed:', error);
      return [];
    }
  }

  /**
   * Fetch a single timesheet by ID — returns the full detail including the
   * immutable event snapshot captured at submission time.
   * Accessible by the owner, their direct manager, or a timesheetAdmin.
   */
  async getTimesheetById(id: string): Promise<TimesheetDetail | null> {
    try {
      const raw = await apiClient.get<any>(`${ENDPOINTS.TIMESHEET_BY_ID}/${id}`);
      if (!raw) return null;
      console.debug('[getTimesheetById] raw response:', JSON.stringify(raw, null, 2));

      // Normalise the event snapshot — the backend may use different field names
      const eventsRaw: any[] =
        raw.events ??
        raw.calendarEvents ??
        raw.snapshot ??
        raw.items ??
        raw.timesheetEvents ??
        [];

      const events = eventsRaw.map((ev: any) => ({
        id: ev.id ?? ev._id ?? String(Math.random()),
        title: ev.title ?? ev.name ?? ev.description ?? '',
        startAt: ev.startAt ?? ev.start ?? ev.startTime ?? '',
        endAt: ev.endAt ?? ev.end ?? ev.endTime ?? '',
        project: ev.project ?? ev.projectId ? { id: ev.project?.id ?? ev.projectId, name: ev.project?.name ?? ev.projectName ?? '' } : undefined,
        task: ev.task ?? ev.taskId ? { id: ev.task?.id ?? ev.taskId, name: ev.task?.name ?? ev.taskName ?? '' } : undefined,
        color: ev.color ?? ev.projectColor,
      }));

      return {
        ...raw,
        status: raw.status as 1 | 2 | 3,
        events,
      } as TimesheetDetail;
    } catch (error) {
      console.warn('getTimesheetById failed:', error);
      return null;
    }
  }

  /** Convert calendar events to timesheet entries for a given user */
  private eventsToTimesheets(events: CalendarEvent[], userId: string, userName: string): TimesheetEntry[] {
    return events
      .filter(e => e.startAt && e.endAt)
      .map(e => {
        const startAt = new Date(e.startAt);
        const endAt = new Date(e.endAt);
        const hours = Math.max(0, (endAt.getTime() - startAt.getTime()) / (1000 * 60 * 60));
        const dd = String(startAt.getDate()).padStart(2, '0');
        const mm = String(startAt.getMonth() + 1).padStart(2, '0');
        const yyyy = startAt.getFullYear();
        return {
          id: e.id,
          user: { id: userId, fullName: userName },
          date: `${dd}/${mm}/${yyyy}`,
          hours: hours.toFixed(2),
          task: e.task,
          project: e.project,
          description: e.title,
        } as TimesheetEntry;
      });
  }

  /**
   * Get all expenses
   * Tries user-scoped endpoint first (avoids 403 on company-wide endpoint).
   */
  async getExpenses(): Promise<ExpenseEntry[]> {
    return cachedGet<ExpenseEntry[]>(
      CACHE_KEYS.EXPENSES,
      async () => {
        // Try user-scoped endpoint first
        try {
          const result = await apiClient.get<ExpenseEntry[]>(ENDPOINTS.MY_EXPENSES);
          if (Array.isArray(result)) return result;
        } catch (error) {
          console.warn('MY_EXPENSES endpoint failed, trying company-wide:', error);
        }

        // Fallback to company-wide endpoint
        try {
          const result = await apiClient.get<ExpenseEntry[]>(ENDPOINTS.EXPENSES);
          return Array.isArray(result) ? result : [];
        } catch (error) {
          console.error('Failed to fetch expenses:', error);
          return [];
        }
      },
      CACHE_TTL.DEFAULT
    );
  }

  /**
   * Get all invoices
   */
  async getInvoices(): Promise<InvoiceEntry[]> {
    return cachedGet<InvoiceEntry[]>(
      CACHE_KEYS.INVOICES,
      async () => {
        try {
          const result = await apiClient.get<InvoiceEntry[]>(ENDPOINTS.INVOICES);
          return Array.isArray(result) ? result : [];
        } catch (error) {
          console.error('Failed to fetch invoices:', error);
          return [];
        }
      },
      CACHE_TTL.DEFAULT
    );
  }

  /**
   * Get all clients
   */
  async getClients(): Promise<ClientEntry[]> {
    return cachedGet<ClientEntry[]>(
      CACHE_KEYS.CLIENTS,
      async () => {
        try {
          const result = await apiClient.get<ClientEntry[]>(ENDPOINTS.CLIENTS);
          return Array.isArray(result) ? result : [];
        } catch (error) {
          console.error('Failed to fetch clients:', error);
          return [];
        }
      },
      CACHE_TTL.LONG
    );
  }

  /**
   * Get all leave requests
   */
  async getAllLeaveRequests(): Promise<AllLeaveRequest[]> {
    return cachedGet<AllLeaveRequest[]>(
      `${CACHE_KEYS.LEAVE_REQUESTS}:all`,
      async () => {
        try {
          const result = await apiClient.get<AllLeaveRequest[]>(ENDPOINTS.ALL_LEAVE_REQUESTS);
          return Array.isArray(result) ? result : [];
        } catch (error) {
          console.error('Failed to fetch leave requests:', error);
          return [];
        }
      },
      CACHE_TTL.DEFAULT
    );
  }

  /**
   * Get what's new / FYI items
   */
  async getWhatsNewItems(): Promise<WhatsNewItem[]> {
    return cachedGet<WhatsNewItem[]>(
      `${CACHE_KEYS.WHATS_NEW}:items`,
      async () => {
        try {
          const result = await apiClient.get<WhatsNewItem[]>(ENDPOINTS.WHATS_NEW);
          return Array.isArray(result) ? result : [];
        } catch (error) {
          console.error('Failed to fetch what\'s new:', error);
          return [];
        }
      },
      CACHE_TTL.SHORT
    );
  }

  // ============================================================================
  // Computed/Aggregated Data
  // ============================================================================

  /**
   * Get key metrics computed from projects
   */
  async getKeyMetrics(): Promise<{
    activeProjects: number;
    tasksDueThisWeek: number;
    criticalIssues: number;
    hoursThisWeek: number;
    budgetHealth: number;
    teamUtilization: number;
  }> {
    try {
      const projects = await this.getProjectsSummary();
      
      // Count active projects (status !== cancelled/completed)
      const activeProjects = projects.filter(p => 
        p.status !== 3 && p.status !== 4 // Assuming 3=cancelled, 4=completed
      ).length;
      
      // Count critical issues (projects with alerts)
      const criticalIssues = projects.filter(p => 
        p.alerts && p.alerts.some(a => a.severity === 'critical')
      ).length;
      
      // Calculate total hours
      const totalPlanned = projects.reduce((sum, p) => {
        return sum + (parseFloat(p.plannedHours || '0') || 0);
      }, 0);
      
      const totalSpent = projects.reduce((sum, p) => {
        return sum + (parseFloat(p.spentHours || '0') || 0);
      }, 0);
      
      // Budget health: percentage of projects within budget
      const projectsWithBudget = projects.filter(p => p.contractValue);
      const healthyProjects = projectsWithBudget.filter(p => {
        const spent = parseFloat(p.spentHours || '0');
        const planned = parseFloat(p.plannedHours || '0');
        return planned === 0 || spent <= planned;
      }).length;
      
      const budgetHealth = projectsWithBudget.length > 0 
        ? Math.round((healthyProjects / projectsWithBudget.length) * 100)
        : 100;
      
      // Team utilization (simplified - would need more data for accuracy)
      const teamUtilization = totalPlanned > 0 
        ? Math.min(100, Math.round((totalSpent / totalPlanned) * 100))
        : 0;
      
      return {
        activeProjects,
        tasksDueThisWeek: 0, // Would need task data with due dates
        criticalIssues,
        hoursThisWeek: Math.round(totalSpent),
        budgetHealth,
        teamUtilization
      };
    } catch (error) {
      console.error('Failed to compute key metrics:', error);
      return {
        activeProjects: 0,
        tasksDueThisWeek: 0,
        criticalIssues: 0,
        hoursThisWeek: 0,
        budgetHealth: 0,
        teamUtilization: 0
      };
    }
  }

  /**
   * Get red zone projects (projects with issues)
   */
  async getRedZoneProjects(): Promise<ProjectSummary[]> {
    try {
      const projects = await this.getProjectsSummary();
      
      return projects.filter(project => {
        // Check for alerts
        if (project.alerts && project.alerts.length > 0) {
          return true;
        }
        
        // Check for over-budget (spent > planned)
        const spent = parseFloat(project.spentHours || '0');
        const planned = parseFloat(project.plannedHours || '0');
        if (planned > 0 && spent > planned) {
          return true;
        }
        
        // Check for overdue (endDate in past but not completed)
        if (project.endDate && project.status !== 4) {
          const endDate = new Date(project.endDate.split('/').reverse().join('-'));
          if (endDate < new Date()) {
            return true;
          }
        }
        
        return false;
      });
    } catch (error) {
      console.error('Failed to get red zone projects:', error);
      return [];
    }
  }

  // ============================================================================
  // Gantt API
  // ============================================================================

  /**
   * Get Gantt data for a project
   * @param projectId - Project ID
   * @param resolution - 'day' | 'week' | 'month' (default: 'week')
   * @param start - Start date (YYYY-MM-DD)
   * @param end - End date (YYYY-MM-DD)
   */
  async getGanttData(
    projectId: string,
    resolution: 'day' | 'week' | 'month' = 'week',
    start?: string,
    end?: string
  ): Promise<GanttData> {
    // Default to 40 weeks range for week resolution
    const today = new Date();
    const defaultStart = new Date(today);
    defaultStart.setDate(defaultStart.getDate() - 7 * 10); // 10 weeks back
    const defaultEnd = new Date(today);
    defaultEnd.setDate(defaultEnd.getDate() + 7 * 30); // 30 weeks forward
    
    const startDate = start || defaultStart.toISOString().split('T')[0];
    const endDate = end || defaultEnd.toISOString().split('T')[0];
    
    const url = `${ENDPOINTS.GANTT(projectId)}?resolution=${resolution}&start=${startDate}&end=${endDate}`;
    return apiClient.get<GanttData>(url);
  }

  /**
   * Get Gantt task details (hours breakdown)
   */
  async getGanttDetails(projectId: string): Promise<any> {
    return apiClient.get(ENDPOINTS.GANTT_DETAILS(projectId));
  }

  /**
   * Move/resize a task in Gantt
   */
  async moveGanttTask(taskId: string, startDate: string, endDate: string): Promise<any> {
    const result = await apiClient.post(ENDPOINTS.GANTT_MOVE_TASK, {
      taskId,
      startDate,
      endDate
    });
    // Invalidate task and project caches after mutation
    clearCache(`${CACHE_KEYS.PROJECTS_SUMMARY}*`);
    clearCache(CACHE_KEYS.ALL_TASKS);
    clearCache(`${CACHE_KEYS.EVENTS}*`);
    clearCache(CACHE_KEYS.TIMESHEETS);
    return result;
  }

  /**
   * Reorder a task position in Gantt
   */
  async reorderGanttTask(taskId: string, newPosition: number, newParentId?: string): Promise<any> {
    const result = await apiClient.post(ENDPOINTS.GANTT_REORDER_TASK, {
      taskId,
      position: newPosition,
      parentId: newParentId
    });
    // Invalidate task and project caches after mutation
    clearCache(`${CACHE_KEYS.PROJECTS_SUMMARY}*`);
    clearCache(CACHE_KEYS.ALL_TASKS);
    return result;
  }

  // ==========================================================================
  // Cache Management
  // ==========================================================================

  /**
   * Clear cached API responses.
   * @param key - Optional cache key to clear. Supports wildcard suffix '*'.
   *              If omitted, all cache entries are cleared.
   *
   * Examples:
   *   dashboardApi.clearCache()                    // clear everything
   *   dashboardApi.clearCache('projects_summary')  // clear projects summary
   *   dashboardApi.clearCache('events*')           // clear all event entries
   */
  clearCache(key?: string): void {
    clearCache(key);
  }
}

// ============================================================================
// Gantt Types
// ============================================================================

export interface GanttData {
  project: string;
  ganttContents: GanttActivityData[];
  firstDate: string;
  lastDate: string;
}

export interface GanttActivityData {
  id: string;
  name: string;
  parentId?: string;
  position: number;
  tasks: GanttTaskData[];
  activities: GanttActivityData[]; // Nested sub-activities
  startDate?: string;
  endDate?: string;
  plannedHours?: number;
  spentHours?: number;
  done?: boolean;
  milestones?: GanttMilestoneData[];
  flags?: any[];
}

export interface GanttTaskData {
  id: string;
  name: string;
  parentId: string;
  position: number;
  startDate: string;
  endDate: string;
  done?: boolean;
  availableHours?: number;
  spentHours?: number;
  participants?: Array<{
    user: { id: string; fullName: string };
    isOwner: boolean;
    plannedHours?: number;
  }>;
  predecessors?: any[];
  successors?: any[];
}

export interface GanttMilestoneData {
  id: string;
  name: string;
  date: string;
  done?: boolean;
}

export const dashboardApi = new DashboardApiService();
