import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../services/dashboard-api';
import type {
  ProjectSummary,
  CurrentUser,
  WhosWhereEntry,
  CalendarEvent,
  Task,
  WhatsPending,
  WhatsNewItem,
  LeaveRequest,
  TimesheetEntry,
  ExpenseEntry,
  InvoiceEntry,
  ClientEntry,
  AllLeaveRequest,
  GanttData,
} from '../services/dashboard-api';

// ============================================================================
// Query Keys — centralised to avoid typos and enable targeted invalidation
// ============================================================================

export const queryKeys = {
  currentUser: ['currentUser'] as const,
  projectsSummary: (filter?: string) =>
    filter ? ['projectsSummary', filter] as const : ['projectsSummary'] as const,
  projectScopeCounts: ['projectScopeCounts'] as const,
  whosWhere: (start?: string, end?: string) =>
    ['whosWhere', start, end] as const,
  todayEvents: ['todayEvents'] as const,
  events: (start: string, end?: string) =>
    ['events', start, end] as const,
  myTasks: (userId: string) => ['myTasks', userId] as const,
  allTasks: ['allTasks'] as const,
  whatsPending: ['whatsPending'] as const,
  whatsNew: ['whatsNew'] as const,
  pendingLeaveRequests: ['pendingLeaveRequests'] as const,
  users: ['users'] as const,
  departments: ['departments'] as const,
  timesheets: ['timesheets'] as const,
  expenses: ['expenses'] as const,
  invoices: ['invoices'] as const,
  clients: ['clients'] as const,
  allLeaveRequests: ['allLeaveRequests'] as const,
  whatsNewItems: ['whatsNewItems'] as const,
  keyMetrics: ['keyMetrics'] as const,
  redZoneProjects: ['redZoneProjects'] as const,
  ganttData: (projectId: string, resolution?: string) =>
    ['ganttData', projectId, resolution] as const,
  ganttDetails: (projectId: string) => ['ganttDetails', projectId] as const,
} as const;

// ============================================================================
// Query Hooks
// ============================================================================

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: () => dashboardApi.getCurrentUser(),
  });
}

export function useProjectsSummary(filter?: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.projectsSummary(filter),
    queryFn: () => dashboardApi.getProjectsSummary(filter),
    enabled,
  });
}

export function useProjectScopeCounts(enabled = true) {
  return useQuery({
    queryKey: queryKeys.projectScopeCounts,
    queryFn: () => dashboardApi.getProjectScopeCounts(),
    enabled,
  });
}

export function useWhosWhere(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: queryKeys.whosWhere(startDate, endDate),
    queryFn: () => dashboardApi.getWhosWhere(startDate, endDate),
  });
}

export function useTodayEvents() {
  return useQuery({
    queryKey: queryKeys.todayEvents,
    queryFn: () => dashboardApi.getTodayEvents(),
    staleTime: 2 * 60 * 1000, // 2 min — events change more often
  });
}

export function useEvents(startDate: Date, endDate?: Date, enabled = true) {
  return useQuery({
    queryKey: queryKeys.events(startDate.toISOString(), endDate?.toISOString()),
    queryFn: () => dashboardApi.getEvents(startDate, endDate),
    enabled,
    staleTime: 2 * 60 * 1000,
  });
}

export function useMyTasks(userId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.myTasks(userId),
    queryFn: () => dashboardApi.getMyTasks(userId),
    enabled: !!userId && enabled,
  });
}

export function useAllTasks() {
  return useQuery({
    queryKey: queryKeys.allTasks,
    queryFn: () => dashboardApi.getAllTasks(),
    staleTime: 10 * 60 * 1000, // 10 min — expensive multi-user fetch
  });
}

export function useWhatsPending() {
  return useQuery({
    queryKey: queryKeys.whatsPending,
    queryFn: () => dashboardApi.getWhatsPending(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useWhatsNew() {
  return useQuery({
    queryKey: queryKeys.whatsNew,
    queryFn: () => dashboardApi.getWhatsNew(),
    staleTime: 2 * 60 * 1000,
  });
}

export function usePendingLeaveRequests() {
  return useQuery({
    queryKey: queryKeys.pendingLeaveRequests,
    queryFn: () => dashboardApi.getPendingLeaveRequests(),
  });
}

export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: () => dashboardApi.getUsers(),
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: queryKeys.departments,
    queryFn: () => dashboardApi.getDepartments(),
  });
}

export function useTimesheets() {
  return useQuery({
    queryKey: queryKeys.timesheets,
    queryFn: () => dashboardApi.getTimesheets(),
  });
}

export function useExpenses() {
  return useQuery({
    queryKey: queryKeys.expenses,
    queryFn: () => dashboardApi.getExpenses(),
  });
}

export function useInvoices() {
  return useQuery({
    queryKey: queryKeys.invoices,
    queryFn: () => dashboardApi.getInvoices(),
  });
}

export function useClients() {
  return useQuery({
    queryKey: queryKeys.clients,
    queryFn: () => dashboardApi.getClients(),
  });
}

export function useAllLeaveRequests() {
  return useQuery({
    queryKey: queryKeys.allLeaveRequests,
    queryFn: () => dashboardApi.getAllLeaveRequests(),
  });
}

export function useWhatsNewItems() {
  return useQuery({
    queryKey: queryKeys.whatsNewItems,
    queryFn: () => dashboardApi.getWhatsNewItems(),
  });
}

export function useKeyMetrics() {
  return useQuery({
    queryKey: queryKeys.keyMetrics,
    queryFn: () => dashboardApi.getKeyMetrics(),
  });
}

export function useRedZoneProjects() {
  return useQuery({
    queryKey: queryKeys.redZoneProjects,
    queryFn: () => dashboardApi.getRedZoneProjects(),
  });
}

export function useGanttData(
  projectId: string,
  resolution: 'day' | 'week' | 'month' = 'week',
  start?: string,
  end?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.ganttData(projectId, resolution),
    queryFn: () => dashboardApi.getGanttData(projectId, resolution, start, end),
    enabled: !!projectId && enabled,
  });
}

export function useGanttDetails(projectId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.ganttDetails(projectId),
    queryFn: () => dashboardApi.getGanttDetails(projectId),
    enabled: !!projectId && enabled,
  });
}
