/**
 * Reports Engine
 * Catalog of 18 report definitions + generator functions that compute from RawData.
 */

import { RawData } from './insights-engine';
import { ProjectSummary, TimesheetEntry, ExpenseEntry, InvoiceEntry, CurrentUser } from './dashboard-api';
import { parseDateFromAPI, daysUntil, isOverdue } from '../utils/date-utils';

// ============================================================================
// Types
// ============================================================================

export interface ReportDefinition {
  id: string;
  name: string;
  description: string;
  category: 'project' | 'time' | 'resource' | 'financial';
  icon: string;
  color: string;
  generate: (rawData: RawData, filters: ReportFilters) => ReportResult;
}

export interface ReportFilters {
  dateRange: string;
  projectFilter: string;
  teamFilter: string;
  customStart?: string; // YYYY-MM-DD
  customEnd?: string;   // YYYY-MM-DD
  selectedProjects?: string[]; // project IDs when projectFilter === 'specific'
}

export interface ReportResult {
  metrics: Array<{ label: string; value: string; change: string; positive: boolean }>;
  lineChartData?: Array<Record<string, any>>;
  lineChartConfig?: { title: string; lines: Array<{ dataKey: string; color: string; name: string }> };
  pieChartData?: Array<{ name: string; value: number; color: string }>;
  pieChartConfig?: { title: string; centerLabel: string; centerValue: string };
  barChartData?: Array<Record<string, any>>;
  barChartConfig?: { title: string; dataKey: string; color: string };
  tableData?: { title: string; columns: string[]; rows: Array<Record<string, any>> };
}

// ============================================================================
// Helpers
// ============================================================================

function parseHours(value?: string): number {
  return parseFloat(value || '0') || 0;
}

/** Safely get a user's display name — API may return fullName or firstName/lastName */
function getUserName(user: any): string {
  if (!user) return 'Unknown';
  if (user.fullName) return user.fullName;
  const first = user.firstName || '';
  const last = user.lastName || '';
  const combined = `${first} ${last}`.trim();
  return combined || user.name || user.email || 'Unknown';
}

/** Safely get a user's department name — API may use department.name or departmentName */
function getUserDept(user: any): string {
  if (!user) return 'N/A';
  if (user.department?.name) return user.department.name;
  if (user.departmentName) return String(user.departmentName);
  if (typeof user.department === 'string' && user.department) return user.department;
  return 'N/A';
}

function parseProjectDate(dateStr?: string): Date | null {
  if (!dateStr) return null;
  const parsed = parseDateFromAPI(dateStr);
  if (parsed) return parsed;
  const fallback = new Date(dateStr.split('/').reverse().join('-'));
  return isNaN(fallback.getTime()) ? null : fallback;
}

export function getDateRangeFromFilter(filter: string, customStart?: string, customEnd?: string): { start: Date; end: Date } {
  if (filter === 'custom' && customStart && customEnd) {
    const start = new Date(customStart);
    start.setHours(0, 0, 0, 0);
    const end = new Date(customEnd);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  let start: Date;

  switch (filter) {
    case 'last-7-days':
      start = new Date(now);
      start.setDate(start.getDate() - 7);
      break;
    case 'last-30-days':
      start = new Date(now);
      start.setDate(start.getDate() - 30);
      break;
    case 'last-90-days':
      start = new Date(now);
      start.setDate(start.getDate() - 90);
      break;
    case 'last-6-months':
      start = new Date(now);
      start.setMonth(start.getMonth() - 6);
      break;
    case 'last-12-months':
      start = new Date(now);
      start.setFullYear(start.getFullYear() - 1);
      break;
    case 'this-quarter': {
      const qMonth = Math.floor(now.getMonth() / 3) * 3;
      start = new Date(now.getFullYear(), qMonth, 1);
      break;
    }
    case 'this-year':
      start = new Date(now.getFullYear(), 0, 1);
      break;
    case 'last-year':
      start = new Date(now.getFullYear() - 1, 0, 1);
      end.setTime(new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999).getTime());
      break;
    case 'all-time':
      start = new Date(2000, 0, 1);
      break;
    default:
      start = new Date(now);
      start.setDate(start.getDate() - 30);
  }
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

function filterTimesheetsByDate(timesheets: TimesheetEntry[], start: Date, end: Date): TimesheetEntry[] {
  return timesheets.filter(t => {
    // Try parsing the date field via the standard helper first
    let d = parseProjectDate(t.date);
    // If that fails, attempt to parse the raw string directly (handles ISO strings, etc.)
    if (!d && t.date) {
      const direct = new Date(t.date);
      if (!isNaN(direct.getTime())) d = direct;
    }
    if (!d) {
      console.warn('[filterTimesheetsByDate] Dropping timesheet entry with unparseable date:', t.date, t);
      return false;
    }
    return d >= start && d <= end;
  });
}

function filterExpensesByDate(expenses: ExpenseEntry[], start: Date, end: Date): ExpenseEntry[] {
  return expenses.filter(e => {
    const d = parseProjectDate(e.date);
    return d && d >= start && d <= end;
  });
}

function filterProjects(projects: ProjectSummary[], projectFilter: string, selectedProjects?: string[]): ProjectSummary[] {
  switch (projectFilter) {
    case 'active':
      return projects.filter(p => p.status !== 3 && p.status !== 4);
    case 'completed':
      return projects.filter(p => p.status === 4);
    case 'specific':
      if (selectedProjects && selectedProjects.length > 0) {
        const idSet = new Set(selectedProjects);
        return projects.filter(p => idSet.has(p.id));
      }
      return projects;
    default:
      return projects;
  }
}

function filterUsersByTeam(users: CurrentUser[], teamFilter: string): CurrentUser[] {
  if (teamFilter === 'all') return users;
  return users.filter(u => getUserDept(u) === teamFilter);
}

function getProjectStatus(project: ProjectSummary): string {
  const spent = parseHours(project.spentHours);
  const planned = parseHours(project.plannedHours);
  const endDate = parseProjectDate(project.endDate);

  if (project.status === 4) return 'Completed';
  if (project.status === 3) return 'Cancelled';
  if (endDate && isOverdue(endDate)) return 'Overdue';
  if (planned > 0 && spent > planned) return 'Over Budget';
  if (planned > 0 && spent > planned * 0.9) return 'At Risk';
  return 'On Track';
}

function getMonthLabels(count: number): string[] {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const labels: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(months[d.getMonth()]);
  }
  return labels;
}

/** Returns month labels and their year/month pairs for the given date range */
function getMonthsInRange(start: Date, end: Date): Array<{ label: string; year: number; month: number }> {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const result: Array<{ label: string; year: number; month: number }> = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

  while (cursor <= endMonth) {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    // Include year suffix if range spans multiple years
    const label = (endMonth.getFullYear() > start.getFullYear())
      ? `${months[m]} ${String(y).slice(2)}`
      : months[m];
    result.push({ label, year: y, month: m });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return result;
}

const CHART_COLORS = ['#0066FF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

// ============================================================================
// Project Reports
// ============================================================================

function generateProjectPerformance(rawData: RawData, filters: ReportFilters): ReportResult {
  const { start, end } = getDateRangeFromFilter(filters.dateRange, filters.customStart, filters.customEnd);
  const projects = filterProjects(rawData.projects, filters.projectFilter, filters.selectedProjects);
  const users = filterUsersByTeam(rawData.users, filters.teamFilter);
  const userIds = new Set(users.map(u => u.id));
  const timesheets = filterTimesheetsByDate(rawData.timesheets, start, end)
    .filter(t => filters.teamFilter === 'all' || userIds.has(t.user.id));

  const totalProjects = projects.length;
  const onTrack = projects.filter(p => getProjectStatus(p) === 'On Track').length;
  const atRisk = projects.filter(p => ['At Risk', 'Over Budget'].includes(getProjectStatus(p))).length;

  // Compute hours from timesheets within the date range
  const periodSpent = timesheets.reduce((s, t) => s + parseHours(t.hours), 0);
  const totalPlanned = projects.reduce((s, p) => s + parseHours(p.plannedHours), 0);

  // Build chart with months matching the selected date range
  const rangeMonths = getMonthsInRange(start, end);
  const lineChartData = rangeMonths.map(m => {
    const monthTimesheets = timesheets.filter(t => {
      const d = parseProjectDate(t.date);
      return d && d.getFullYear() === m.year && d.getMonth() === m.month;
    });
    const actual = monthTimesheets.reduce((s, t) => s + parseHours(t.hours), 0);
    const planned = rangeMonths.length > 0 ? totalPlanned / rangeMonths.length : 0;
    return { name: m.label, planned: Math.round(planned), actual: Math.round(actual) };
  });

  // Per-project hours from timesheets in the period
  const projectHoursMap = new Map<string, number>();
  for (const t of timesheets) {
    const projName = t.project?.name;
    if (projName) projectHoursMap.set(projName, (projectHoursMap.get(projName) || 0) + parseHours(t.hours));
  }

  return {
    metrics: [
      { label: 'Total Projects', value: String(totalProjects), change: `${onTrack} on track`, positive: true },
      { label: 'On Track', value: String(onTrack), change: `${totalProjects > 0 ? Math.round((onTrack / totalProjects) * 100) : 0}% of total`, positive: true },
      { label: 'At Risk', value: String(atRisk), change: atRisk === 0 ? 'No issues' : 'Needs attention', positive: atRisk === 0 },
      { label: 'Period Hours', value: `${Math.round(periodSpent)}h`, change: `of ${Math.round(totalPlanned)}h planned`, positive: totalPlanned === 0 || periodSpent <= totalPlanned },
    ],
    lineChartData,
    lineChartConfig: { title: 'Monthly Hours: Planned vs Actual', lines: [
      { dataKey: 'planned', color: '#9CA3AF', name: 'Planned' },
      { dataKey: 'actual', color: '#0066FF', name: 'Actual' },
    ]},
    tableData: {
      title: 'Project Details',
      columns: ['Project', 'Status', 'Period Hours', 'Planned Hours', 'Team Size'],
      rows: projects.map(p => ({
        Project: p.name,
        Status: getProjectStatus(p),
        'Period Hours': `${(projectHoursMap.get(p.name) || 0).toFixed(1)}h`,
        'Planned Hours': `${parseHours(p.plannedHours).toFixed(1)}h`,
        'Team Size': String(p.members?.length || 0),
      })),
    },
  };
}

function generateProjectTimeline(rawData: RawData, filters: ReportFilters): ReportResult {
  const projects = filterProjects(rawData.projects, filters.projectFilter, filters.selectedProjects);

  const onTime = projects.filter(p => {
    const end = parseProjectDate(p.endDate);
    return end && !isOverdue(end) && getProjectStatus(p) === 'On Track';
  }).length;
  const delayed = projects.filter(p => {
    const end = parseProjectDate(p.endDate);
    return end && isOverdue(end) && p.status !== 4;
  }).length;
  const upcoming = projects.filter(p => {
    const end = parseProjectDate(p.endDate);
    return end && daysUntil(end) > 0 && daysUntil(end) <= 30;
  }).length;

  const barChartData = projects
    .filter(p => parseProjectDate(p.endDate))
    .map(p => {
      const end = parseProjectDate(p.endDate)!;
      return { name: p.name.length > 15 ? p.name.slice(0, 15) + '...' : p.name, days: daysUntil(end) };
    })
    .sort((a, b) => a.days - b.days)
    .slice(0, 10);

  return {
    metrics: [
      { label: 'On Time', value: String(onTime), change: 'Within deadline', positive: true },
      { label: 'Delayed', value: String(delayed), change: delayed > 0 ? 'Past deadline' : 'None delayed', positive: delayed === 0 },
      { label: 'Due Soon', value: String(upcoming), change: 'Within 30 days', positive: true },
      { label: 'Total', value: String(projects.length), change: 'All projects', positive: true },
    ],
    barChartData,
    barChartConfig: { title: 'Days Remaining by Project', dataKey: 'days', color: '#0066FF' },
    tableData: {
      title: 'Timeline Status',
      columns: ['Project', 'Start Date', 'End Date', 'Days Remaining', 'Status'],
      rows: projects.map(p => {
        const end = parseProjectDate(p.endDate);
        const remaining = end ? daysUntil(end) : null;
        return {
          Project: p.name,
          'Start Date': p.startDate || 'N/A',
          'End Date': p.endDate || 'N/A',
          'Days Remaining': remaining !== null ? `${remaining} days` : 'No deadline',
          Status: getProjectStatus(p),
        };
      }).sort((a, b) => {
        const aRaw = a['Days Remaining'];
        const bRaw = b['Days Remaining'];
        // Projects without a deadline sort to the bottom
        const aDays = aRaw === 'No deadline' ? Infinity : (parseInt(aRaw) || 999);
        const bDays = bRaw === 'No deadline' ? Infinity : (parseInt(bRaw) || 999);
        return aDays - bDays;
      }),
    },
  };
}

function generateProjectBudget(rawData: RawData, filters: ReportFilters): ReportResult {
  const projects = filterProjects(rawData.projects, filters.projectFilter, filters.selectedProjects);

  const underBudget = projects.filter(p => {
    const s = parseHours(p.spentHours); const pl = parseHours(p.plannedHours);
    return pl > 0 && s <= pl * 0.9;
  }).length;
  const onBudget = projects.filter(p => {
    const s = parseHours(p.spentHours); const pl = parseHours(p.plannedHours);
    return pl > 0 && s > pl * 0.9 && s <= pl;
  }).length;
  const overBudget = projects.filter(p => {
    const s = parseHours(p.spentHours); const pl = parseHours(p.plannedHours);
    return pl > 0 && s > pl;
  }).length;

  const totalContract = projects.reduce((s, p) => s + parseFloat(p.contractValue || '0'), 0);

  return {
    metrics: [
      { label: 'Under Budget', value: String(underBudget), change: 'Within 90%', positive: true },
      { label: 'On Budget', value: String(onBudget), change: '90-100% used', positive: true },
      { label: 'Over Budget', value: String(overBudget), change: overBudget > 0 ? 'Exceeded plan' : 'None over', positive: overBudget === 0 },
      { label: 'Total Contract', value: totalContract > 0 ? `$${Math.round(totalContract / 1000)}k` : 'N/A', change: `${projects.length} projects`, positive: true },
    ],
    pieChartData: [
      { name: 'Under Budget', value: underBudget, color: '#10B981' },
      { name: 'On Budget', value: onBudget, color: '#F59E0B' },
      { name: 'Over Budget', value: overBudget, color: '#EF4444' },
    ].filter(d => d.value > 0),
    pieChartConfig: { title: 'Budget Distribution', centerLabel: 'Projects', centerValue: String(projects.length) },
    tableData: {
      title: 'Budget Breakdown',
      columns: ['Project', 'Planned Hours', 'Spent Hours', 'Budget Used', 'Status'],
      rows: projects.map(p => {
        const spent = parseHours(p.spentHours);
        const planned = parseHours(p.plannedHours);
        const pct = planned > 0 ? Math.round((spent / planned) * 100) : 0;
        return {
          Project: p.name,
          'Planned Hours': `${planned.toFixed(1)}h`,
          'Spent Hours': `${spent.toFixed(1)}h`,
          'Budget Used': `${pct}%`,
          Status: pct > 100 ? 'Over Budget' : pct > 90 ? 'Near Limit' : 'Healthy',
        };
      }),
    },
  };
}

function generateProjectCompletion(rawData: RawData, filters: ReportFilters): ReportResult {
  const { start, end } = getDateRangeFromFilter(filters.dateRange, filters.customStart, filters.customEnd);
  const projects = filterProjects(rawData.projects, filters.projectFilter, filters.selectedProjects);
  const projectNames = new Set(projects.map(p => p.name));
  const tasks = rawData.tasks.filter(t => {
    const projName = t.activity?.project?.name;
    return !projName || projectNames.has(projName);
  });

  const projectTaskMap = new Map<string, { total: number; done: number }>();
  for (const task of tasks) {
    const projName = task.activity?.project?.name;
    if (!projName) continue;
    if (!projectTaskMap.has(projName)) projectTaskMap.set(projName, { total: 0, done: 0 });
    const entry = projectTaskMap.get(projName)!;
    // Always count every task in the total regardless of column value (including null column).
    entry.total++;
    // Only mark as done when systemCode is explicitly 3; null/undefined column counts as incomplete.
    if (task.column !== null && task.column !== undefined && task.column.systemCode === 3) {
      entry.done++;
    }
  }

  const totalTasks = tasks.length;
  // Null-column tasks are NOT done — only tasks with column.systemCode === 3 are done.
  const doneTasks = tasks.filter(t => t.column !== null && t.column !== undefined && t.column.systemCode === 3).length;
  const overallPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const rangeMonths = getMonthsInRange(start, end);
  const lineChartData = rangeMonths.map((m, i) => ({
    name: m.label,
    completion: Math.min(100, Math.round(overallPct * ((i + 1) / rangeMonths.length))),
  }));
  if (lineChartData.length > 0) lineChartData[lineChartData.length - 1].completion = overallPct;

  return {
    metrics: [
      { label: 'Overall Completion', value: `${overallPct}%`, change: `${doneTasks} of ${totalTasks} tasks`, positive: true },
      { label: 'Completed Tasks', value: String(doneTasks), change: 'Tasks done', positive: true },
      { label: 'In Progress', value: String(totalTasks - doneTasks), change: 'Tasks remaining', positive: true },
      { label: 'Projects Tracked', value: String(projectTaskMap.size), change: 'With task data', positive: true },
    ],
    lineChartData,
    lineChartConfig: { title: 'Completion Trend', lines: [
      { dataKey: 'completion', color: '#10B981', name: 'Completion %' },
    ]},
    tableData: {
      title: 'Completion by Project',
      columns: ['Project', 'Total Tasks', 'Completed', 'Completion %'],
      rows: Array.from(projectTaskMap.entries()).map(([name, data]) => ({
        Project: name,
        'Total Tasks': String(data.total),
        Completed: String(data.done),
        'Completion %': `${data.total > 0 ? Math.round((data.done / data.total) * 100) : 0}%`,
      })).sort((a, b) => parseInt(b['Completion %']) - parseInt(a['Completion %'])),
    },
  };
}

function generateProjectRisk(rawData: RawData, filters: ReportFilters): ReportResult {
  const projects = filterProjects(rawData.projects, filters.projectFilter, filters.selectedProjects);
  const tasks = rawData.tasks;

  const riskProjects: Array<{ name: string; risks: string[]; severity: string }> = [];

  for (const project of projects) {
    const risks: string[] = [];
    const spent = parseHours(project.spentHours);
    const planned = parseHours(project.plannedHours);
    const endDate = parseProjectDate(project.endDate);

    if (planned > 0 && spent > planned) risks.push('Over budget');
    if (planned > 0 && spent > planned * 0.9 && spent <= planned) risks.push('Near budget limit');
    if (endDate && isOverdue(endDate) && project.status !== 4) risks.push('Past deadline');
    if (endDate && daysUntil(endDate) <= 7 && daysUntil(endDate) > 0) risks.push('Deadline imminent');
    if (project.alerts?.some(a => a.severity === 'critical')) risks.push('Critical alerts');

    const projTasks = tasks.filter(t => t.activity?.project?.name === project.name);
    const overdueTasks = projTasks.filter(t => {
      const end = parseProjectDate(t.endDate);
      return end && isOverdue(end) && t.column?.systemCode !== 3;
    });
    if (overdueTasks.length > 0) risks.push(`${overdueTasks.length} overdue tasks`);

    if (risks.length > 0) {
      riskProjects.push({
        name: project.name,
        risks,
        severity: risks.some(r => r.includes('Over budget') || r.includes('Past deadline') || r.includes('Critical')) ? 'High' : 'Medium',
      });
    }
  }

  const highRisk = riskProjects.filter(r => r.severity === 'High').length;
  const medRisk = riskProjects.filter(r => r.severity === 'Medium').length;

  return {
    metrics: [
      { label: 'At-Risk Projects', value: String(riskProjects.length), change: `of ${projects.length} total`, positive: riskProjects.length === 0 },
      { label: 'High Risk', value: String(highRisk), change: highRisk > 0 ? 'Immediate action needed' : 'None', positive: highRisk === 0 },
      { label: 'Medium Risk', value: String(medRisk), change: medRisk > 0 ? 'Monitor closely' : 'None', positive: medRisk === 0 },
      { label: 'Healthy', value: String(projects.length - riskProjects.length), change: 'No risk factors', positive: true },
    ],
    pieChartData: [
      { name: 'High Risk', value: highRisk, color: '#EF4444' },
      { name: 'Medium Risk', value: medRisk, color: '#F59E0B' },
      { name: 'Healthy', value: projects.length - riskProjects.length, color: '#10B981' },
    ].filter(d => d.value > 0),
    pieChartConfig: { title: 'Risk Distribution', centerLabel: 'Projects', centerValue: String(projects.length) },
    tableData: {
      title: 'Risk Factors',
      columns: ['Project', 'Severity', 'Risk Factors'],
      rows: riskProjects.map(r => ({
        Project: r.name,
        Severity: r.severity,
        'Risk Factors': r.risks.join(', '),
      })).sort((a, b) => (a.Severity === 'High' ? -1 : 1) - (b.Severity === 'High' ? -1 : 1)),
    },
  };
}

// ============================================================================
// Time Reports
// ============================================================================

function generateTimeTracking(rawData: RawData, filters: ReportFilters): ReportResult {
  const { start, end } = getDateRangeFromFilter(filters.dateRange, filters.customStart, filters.customEnd);
  const timesheets = filterTimesheetsByDate(rawData.timesheets, start, end);
  const users = filterUsersByTeam(rawData.users, filters.teamFilter);
  const userIds = new Set(users.map(u => u.id));
  const filtered = filters.teamFilter === 'all' ? timesheets : timesheets.filter(t => userIds.has(t.user.id));

  const totalHours = filtered.reduce((s, t) => s + parseHours(t.hours), 0);
  const uniqueUsers = new Set(filtered.map(t => t.user.id)).size;
  const avgHoursPerUser = uniqueUsers > 0 ? totalHours / uniqueUsers : 0;

  const hoursByProject = new Map<string, number>();
  for (const t of filtered) {
    const proj = t.project?.name || 'Unassigned';
    hoursByProject.set(proj, (hoursByProject.get(proj) || 0) + parseHours(t.hours));
  }

  const barChartData = Array.from(hoursByProject.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, hours]) => ({ name: name.length > 15 ? name.slice(0, 15) + '...' : name, hours: Math.round(hours) }));

  return {
    metrics: [
      { label: 'Total Hours', value: `${Math.round(totalHours)}h`, change: `${filtered.length} entries`, positive: true },
      { label: 'Active Users', value: String(uniqueUsers), change: 'Logging time', positive: true },
      { label: 'Avg Hours/User', value: `${avgHoursPerUser.toFixed(1)}h`, change: 'Per person', positive: true },
      { label: 'Projects', value: String(hoursByProject.size), change: 'With time logged', positive: true },
    ],
    barChartData,
    barChartConfig: { title: 'Hours by Project', dataKey: 'hours', color: '#0066FF' },
    tableData: {
      title: 'Time by Project',
      columns: ['Project', 'Hours', 'Entries', '% of Total'],
      rows: Array.from(hoursByProject.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([name, hours]) => ({
          Project: name,
          Hours: `${hours.toFixed(1)}h`,
          Entries: String(filtered.filter(t => (t.project?.name || 'Unassigned') === name).length),
          '% of Total': `${totalHours > 0 ? Math.round((hours / totalHours) * 100) : 0}%`,
        })),
    },
  };
}

function generateEmployeeTime(rawData: RawData, filters: ReportFilters): ReportResult {
  const { start, end } = getDateRangeFromFilter(filters.dateRange, filters.customStart, filters.customEnd);
  const timesheets = filterTimesheetsByDate(rawData.timesheets, start, end);
  const users = filterUsersByTeam(rawData.users, filters.teamFilter);
  const userIds = new Set(users.map(u => u.id));
  const filtered = filters.teamFilter === 'all' ? timesheets : timesheets.filter(t => userIds.has(t.user.id));

  const hoursByUser = new Map<string, { name: string; hours: number; entries: number }>();
  for (const t of filtered) {
    const userId = t.user.id;
    if (!hoursByUser.has(userId)) hoursByUser.set(userId, { name: getUserName(t.user), hours: 0, entries: 0 });
    const entry = hoursByUser.get(userId)!;
    entry.hours += parseHours(t.hours);
    entry.entries++;
  }

  const sorted = Array.from(hoursByUser.values()).sort((a, b) => b.hours - a.hours);
  const totalHours = sorted.reduce((s, u) => s + u.hours, 0);

  const pieChartData = sorted.slice(0, 6).map((u, i) => ({
    name: u.name.split(' ')[0],
    value: Math.round(u.hours),
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));
  if (sorted.length > 6) {
    const otherHours = sorted.slice(6).reduce((s, u) => s + u.hours, 0);
    pieChartData.push({ name: 'Others', value: Math.round(otherHours), color: '#9CA3AF' });
  }

  return {
    metrics: [
      { label: 'Total Hours', value: `${Math.round(totalHours)}h`, change: `${sorted.length} contributors`, positive: true },
      { label: 'Top Contributor', value: sorted[0]?.name?.split(' ')[0] || 'N/A', change: sorted[0] ? `${Math.round(sorted[0].hours)}h` : '', positive: true },
      { label: 'Avg per Person', value: `${sorted.length > 0 ? (totalHours / sorted.length).toFixed(1) : '0'}h`, change: 'Average', positive: true },
      { label: 'Team Members', value: String(sorted.length), change: 'Active', positive: true },
    ],
    pieChartData,
    pieChartConfig: { title: 'Hours Distribution', centerLabel: 'Total', centerValue: `${Math.round(totalHours)}h` },
    tableData: {
      title: 'Employee Hours',
      columns: ['Employee', 'Hours', 'Entries', '% of Total'],
      rows: sorted.map(u => ({
        Employee: u.name,
        Hours: `${u.hours.toFixed(1)}h`,
        Entries: String(u.entries),
        '% of Total': `${totalHours > 0 ? Math.round((u.hours / totalHours) * 100) : 0}%`,
      })),
    },
  };
}

function generateWeeklyTimesheet(rawData: RawData, filters: ReportFilters): ReportResult {
  const { start, end } = getDateRangeFromFilter(filters.dateRange, filters.customStart, filters.customEnd);
  const timesheets = filterTimesheetsByDate(rawData.timesheets, start, end);
  const users = filterUsersByTeam(rawData.users, filters.teamFilter);
  const userIds = new Set(users.map(u => u.id));
  const filtered = filters.teamFilter === 'all' ? timesheets : timesheets.filter(t => userIds.has(t.user.id));

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hoursByDay = new Map<number, number>();
  for (const t of filtered) {
    const d = parseProjectDate(t.date);
    if (!d) continue;
    const day = d.getDay();
    const adjusted = day === 0 ? 6 : day - 1; // Mon=0...Sun=6
    hoursByDay.set(adjusted, (hoursByDay.get(adjusted) || 0) + parseHours(t.hours));
  }

  const lineChartData = dayNames.map((name, i) => ({
    name,
    hours: Math.round(hoursByDay.get(i) || 0),
  }));

  const totalHours = filtered.reduce((s, t) => s + parseHours(t.hours), 0);
  const avgPerDay = totalHours / 7;
  const weekdayHours = lineChartData.slice(0, 5).reduce((s, d) => s + d.hours, 0);
  const weekendHours = lineChartData.slice(5).reduce((s, d) => s + d.hours, 0);

  return {
    metrics: [
      { label: 'Total Hours', value: `${Math.round(totalHours)}h`, change: 'This period', positive: true },
      { label: 'Daily Average', value: `${avgPerDay.toFixed(1)}h`, change: 'Per day', positive: true },
      { label: 'Weekday Hours', value: `${Math.round(weekdayHours)}h`, change: 'Mon-Fri', positive: true },
      { label: 'Weekend Hours', value: `${Math.round(weekendHours)}h`, change: weekendHours > 0 ? 'Weekend work logged' : 'No weekend work', positive: weekendHours === 0 },
    ],
    lineChartData,
    lineChartConfig: { title: 'Daily Hours Distribution', lines: [
      { dataKey: 'hours', color: '#0066FF', name: 'Hours' },
    ]},
    tableData: {
      title: 'Daily Breakdown',
      columns: ['Day', 'Hours', '% of Week'],
      rows: lineChartData.map(d => ({
        Day: d.name,
        Hours: `${d.hours}h`,
        '% of Week': `${totalHours > 0 ? Math.round((d.hours / totalHours) * 100) : 0}%`,
      })),
    },
  };
}

function generateOvertimeAnalysis(rawData: RawData, filters: ReportFilters): ReportResult {
  const { start, end } = getDateRangeFromFilter(filters.dateRange, filters.customStart, filters.customEnd);
  const timesheets = filterTimesheetsByDate(rawData.timesheets, start, end);
  const users = filterUsersByTeam(rawData.users, filters.teamFilter);
  const userIds = new Set(users.map(u => u.id));
  const filtered = filters.teamFilter === 'all' ? timesheets : timesheets.filter(t => userIds.has(t.user.id));

  const daysDiff = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  const weeks = Math.max(1, daysDiff / 7);

  const hoursByUser = new Map<string, { name: string; hours: number }>();
  for (const t of filtered) {
    if (!hoursByUser.has(t.user.id)) hoursByUser.set(t.user.id, { name: getUserName(t.user), hours: 0 });
    hoursByUser.get(t.user.id)!.hours += parseHours(t.hours);
  }

  const userData = Array.from(hoursByUser.values()).map(u => ({
    ...u,
    weeklyAvg: u.hours / weeks,
    overtime: Math.max(0, (u.hours / weeks) - 40),
  }));

  const overtimeUsers = userData.filter(u => u.weeklyAvg > 40).sort((a, b) => b.weeklyAvg - a.weeklyAvg);
  const totalOvertime = overtimeUsers.reduce((s, u) => s + u.overtime * weeks, 0);

  const barChartData = userData
    .sort((a, b) => b.weeklyAvg - a.weeklyAvg)
    .slice(0, 10)
    .map(u => ({ name: u.name.split(' ')[0], hours: Math.round(u.weeklyAvg), baseline: 40 }));

  return {
    metrics: [
      { label: 'Overtime Users', value: String(overtimeUsers.length), change: `of ${userData.length} total`, positive: overtimeUsers.length === 0 },
      { label: 'Total Overtime', value: `${Math.round(totalOvertime)}h`, change: 'Extra hours', positive: totalOvertime === 0 },
      { label: 'Max Weekly Avg', value: `${userData[0]?.weeklyAvg.toFixed(1) || '0'}h`, change: userData[0]?.name || 'N/A', positive: (userData[0]?.weeklyAvg || 0) <= 40 },
      { label: 'Baseline', value: '40h/week', change: 'Standard', positive: true },
    ],
    barChartData,
    barChartConfig: { title: 'Weekly Average Hours vs Baseline', dataKey: 'hours', color: '#EF4444' },
    tableData: {
      title: 'Overtime Details',
      columns: ['Employee', 'Total Hours', 'Weekly Average', 'Overtime/Week', 'Status'],
      rows: userData.sort((a, b) => b.weeklyAvg - a.weeklyAvg).map(u => ({
        Employee: u.name,
        'Total Hours': `${u.hours.toFixed(1)}h`,
        'Weekly Average': `${u.weeklyAvg.toFixed(1)}h`,
        'Overtime/Week': u.overtime > 0 ? `+${u.overtime.toFixed(1)}h` : 'None',
        Status: u.weeklyAvg > 50 ? 'High' : u.weeklyAvg > 40 ? 'Moderate' : 'Normal',
      })),
    },
  };
}

// ============================================================================
// Resource Reports
// ============================================================================

function generateTeamUtilization(rawData: RawData, filters: ReportFilters): ReportResult {
  const users = filterUsersByTeam(rawData.users, filters.teamFilter);
  const projects = filterProjects(rawData.projects, filters.projectFilter, filters.selectedProjects);
  const projectNames = new Set(projects.map(p => p.name));

  // Filter tasks: exclude done tasks, scope to selected projects
  const tasks = rawData.tasks.filter(t => {
    if (t.column?.systemCode === 3) return false;
    if (filters.projectFilter !== 'all') {
      const projName = t.activity?.project?.name;
      if (projName && !projectNames.has(projName)) return false;
    }
    return true;
  });

  const taskCountByUser = new Map<string, number>();
  for (const task of tasks) {
    for (const p of task.participants || []) {
      taskCountByUser.set(p.user.id, (taskCountByUser.get(p.user.id) || 0) + 1);
    }
  }

  const utilized = users.filter(u => (taskCountByUser.get(u.id) || 0) >= 3).length;
  const partial = users.filter(u => {
    const c = taskCountByUser.get(u.id) || 0;
    return c > 0 && c < 3;
  }).length;
  const idle = users.filter(u => (taskCountByUser.get(u.id) || 0) === 0).length;
  const utilizationPct = users.length > 0 ? Math.round(((utilized + partial * 0.5) / users.length) * 100) : 0;

  return {
    metrics: [
      { label: 'Utilization Rate', value: `${utilizationPct}%`, change: `${users.length} team members`, positive: utilizationPct >= 60 },
      { label: 'Fully Utilized', value: String(utilized), change: '3+ active tasks', positive: true },
      { label: 'Partially Utilized', value: String(partial), change: '1-2 active tasks', positive: true },
      { label: 'Available', value: String(idle), change: 'No active tasks', positive: idle <= 2 },
    ],
    pieChartData: [
      { name: 'Fully Utilized', value: utilized, color: '#10B981' },
      { name: 'Partially', value: partial, color: '#F59E0B' },
      { name: 'Available', value: idle, color: '#E5E7EB' },
    ].filter(d => d.value > 0),
    pieChartConfig: { title: 'Team Utilization', centerLabel: 'Rate', centerValue: `${utilizationPct}%` },
    tableData: {
      title: 'Team Members',
      columns: ['Name', 'Department', 'Active Tasks', 'Status'],
      rows: users.map(u => {
        const count = taskCountByUser.get(u.id) || 0;
        return {
          Name: getUserName(u),
          Department: getUserDept(u),
          'Active Tasks': String(count),
          Status: count >= 3 ? 'Fully Utilized' : count > 0 ? 'Partially Utilized' : 'Available',
        };
      }).sort((a, b) => parseInt(b['Active Tasks']) - parseInt(a['Active Tasks'])),
    },
  };
}

function generateDepartmentWorkload(rawData: RawData, filters: ReportFilters): ReportResult {
  const users = filterUsersByTeam(rawData.users, filters.teamFilter);
  const projects = filterProjects(rawData.projects, filters.projectFilter, filters.selectedProjects);
  const projectNames = new Set(projects.map(p => p.name));

  const deptData = new Map<string, { users: number; tasks: number; hours: number }>();
  for (const user of users) {
    const dept = getUserDept(user) === 'N/A' ? 'Unassigned' : getUserDept(user);
    if (!deptData.has(dept)) deptData.set(dept, { users: 0, tasks: 0, hours: 0 });
    deptData.get(dept)!.users++;
  }

  // Filter tasks: exclude done, scope to selected projects
  const filteredTasks = rawData.tasks.filter(t => {
    if (t.column?.systemCode === 3) return false;
    if (filters.projectFilter !== 'all') {
      const projName = t.activity?.project?.name;
      if (projName && !projectNames.has(projName)) return false;
    }
    return true;
  });

  // Build a set of user IDs that belong to the filtered user set so task counts
  // only reflect tasks assigned to those users (respecting the team filter).
  const filteredUserIds = new Set(users.map(u => u.id));

  const taskCountByUser = new Map<string, number>();
  for (const task of filteredTasks) {
    for (const p of task.participants || []) {
      // Only count participation for users in the filtered (team-scoped) user set.
      if (filteredUserIds.has(p.user.id)) {
        taskCountByUser.set(p.user.id, (taskCountByUser.get(p.user.id) || 0) + 1);
      }
    }
  }

  for (const user of users) {
    const dept = getUserDept(user) === 'N/A' ? 'Unassigned' : getUserDept(user);
    const count = taskCountByUser.get(user.id) || 0;
    if (deptData.has(dept)) deptData.get(dept)!.tasks += count;
  }

  const { start, end } = getDateRangeFromFilter(filters.dateRange, filters.customStart, filters.customEnd);
  const timesheets = filterTimesheetsByDate(rawData.timesheets, start, end);
  for (const t of timesheets) {
    const user = users.find(u => u.id === t.user.id);
    const dept = user ? (getUserDept(user) === 'N/A' ? 'Unassigned' : getUserDept(user)) : 'Unassigned';
    if (deptData.has(dept)) deptData.get(dept)!.hours += parseHours(t.hours);
  }

  const sorted = Array.from(deptData.entries()).sort((a, b) => b[1].tasks - a[1].tasks);
  const barChartData = sorted.map(([name, data]) => ({ name, tasks: data.tasks }));

  return {
    metrics: [
      { label: 'Departments', value: String(sorted.length), change: 'Active departments', positive: true },
      { label: 'Busiest', value: sorted[0]?.[0] || 'N/A', change: sorted[0] ? `${sorted[0][1].tasks} tasks` : '', positive: true },
      { label: 'Total Tasks', value: String(sorted.reduce((s, [, d]) => s + d.tasks, 0)), change: 'Active tasks', positive: true },
      { label: 'Total Hours', value: `${Math.round(sorted.reduce((s, [, d]) => s + d.hours, 0))}h`, change: 'This period', positive: true },
    ],
    barChartData,
    barChartConfig: { title: 'Tasks by Department', dataKey: 'tasks', color: '#8B5CF6' },
    tableData: {
      title: 'Department Summary',
      columns: ['Department', 'Members', 'Active Tasks', 'Hours Logged', 'Tasks/Person'],
      rows: sorted.map(([name, data]) => ({
        Department: name,
        Members: String(data.users),
        'Active Tasks': String(data.tasks),
        'Hours Logged': `${data.hours.toFixed(1)}h`,
        'Tasks/Person': data.users > 0 ? (data.tasks / data.users).toFixed(1) : '0',
      })),
    },
  };
}

function generateResourceAvailability(rawData: RawData, filters: ReportFilters): ReportResult {
  const users = filterUsersByTeam(rawData.users, filters.teamFilter);
  const userIds = new Set(users.map(u => u.id));
  // Only count whosWhere entries for team-filtered users
  const whosWhere = rawData.whosWhere.filter(w => userIds.has(w.user.id));

  const statusCounts = new Map<string, number>();
  const userStatuses = new Map<string, string>();
  for (const entry of whosWhere) {
    const status = entry.status || 'Unknown';
    statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
    userStatuses.set(entry.user.id, status);
  }

  const office = statusCounts.get('Office') || 0;
  const remote = (statusCounts.get('Remote') || 0) + (statusCounts.get('WFH') || 0);
  const leave = whosWhere.filter(w => w.status?.toLowerCase().includes('leave')).length;
  const unset = Math.max(0, users.length - whosWhere.length);

  return {
    metrics: [
      { label: 'In Office', value: String(office), change: 'At office', positive: true },
      { label: 'Remote', value: String(remote), change: 'Working remotely', positive: true },
      { label: 'On Leave', value: String(leave), change: leave > 0 ? 'Away' : 'All present', positive: leave === 0 },
      { label: 'Not Set', value: String(unset), change: 'No status set', positive: unset <= 0 },
    ],
    pieChartData: [
      { name: 'Office', value: office, color: '#0066FF' },
      { name: 'Remote', value: remote, color: '#10B981' },
      { name: 'On Leave', value: leave, color: '#F59E0B' },
      { name: 'Not Set', value: unset, color: '#E5E7EB' },
    ].filter(d => d.value > 0),
    pieChartConfig: { title: 'Team Location', centerLabel: 'Total', centerValue: String(users.length) },
    tableData: {
      title: 'Team Status',
      columns: ['Name', 'Status', 'Department'],
      rows: users.map(u => ({
        Name: getUserName(u),
        Status: userStatuses.get(u.id) || 'Not Set',
        Department: getUserDept(u),
      })).sort((a, b) => a.Status.localeCompare(b.Status)),
    },
  };
}

function generateLeaveOverview(rawData: RawData, filters: ReportFilters): ReportResult {
  const leaveRequests = rawData.leaveRequests;

  const approved = leaveRequests.filter(l => l.status === 1).length;
  const pending = leaveRequests.filter(l => l.status === 0).length;
  const denied = leaveRequests.filter(l => l.status === 2).length;
  const totalDays = leaveRequests.filter(l => l.status === 1).reduce((s, l) => s + (l.days || 0), 0);

  const leaveByType = new Map<string, number>();
  for (const l of leaveRequests) {
    const type = l.leaveType?.name || 'Other';
    leaveByType.set(type, (leaveByType.get(type) || 0) + 1);
  }

  const barChartData = Array.from(leaveByType.entries()).map(([name, count]) => ({ name, count }));

  return {
    metrics: [
      { label: 'Total Requests', value: String(leaveRequests.length), change: 'All leave requests', positive: true },
      { label: 'Approved', value: String(approved), change: `${totalDays} days total`, positive: true },
      { label: 'Pending', value: String(pending), change: pending > 0 ? 'Awaiting approval' : 'None pending', positive: pending === 0 },
      { label: 'Denied', value: String(denied), change: denied > 0 ? 'Requests denied' : 'None denied', positive: true },
    ],
    barChartData,
    barChartConfig: { title: 'Leave by Type', dataKey: 'count', color: '#F59E0B' },
    tableData: {
      title: 'Recent Leave Requests',
      columns: ['Employee', 'Type', 'Start', 'End', 'Days', 'Status'],
      rows: leaveRequests.slice(0, 20).map(l => ({
        Employee: getUserName(l.user),
        Type: l.leaveType?.name || 'N/A',
        Start: l.startDate,
        End: l.endDate,
        Days: String(l.days || 0),
        Status: l.status === 1 ? 'Approved' : l.status === 0 ? 'Pending' : 'Denied',
      })),
    },
  };
}

// ============================================================================
// Financial Reports
// ============================================================================

function generateBudgetVsActual(rawData: RawData, filters: ReportFilters): ReportResult {
  const projects = filterProjects(rawData.projects, filters.projectFilter, filters.selectedProjects);
  const { start, end } = getDateRangeFromFilter(filters.dateRange, filters.customStart, filters.customEnd);
  const timesheets = filterTimesheetsByDate(rawData.timesheets, start, end);
  const expenses = filterExpensesByDate(rawData.expenses, start, end);

  const totalPlanned = projects.reduce((s, p) => s + parseHours(p.plannedHours), 0);
  const periodSpent = timesheets.reduce((s, t) => s + parseHours(t.hours), 0);
  const totalExpenses = expenses.reduce((s, e) => s + parseFloat(e.amount || '0'), 0);
  const variance = totalPlanned > 0 ? Math.round(((periodSpent - totalPlanned) / totalPlanned) * 100) : 0;

  const rangeMonths = getMonthsInRange(start, end);
  let cumBudget = 0;
  let cumActual = 0;
  const budgetPerMonth = rangeMonths.length > 0 ? totalPlanned / rangeMonths.length : 0;
  const lineChartData = rangeMonths.map(m => {
    cumBudget += budgetPerMonth;
    const monthHours = timesheets.filter(t => {
      const d = parseProjectDate(t.date);
      return d && d.getFullYear() === m.year && d.getMonth() === m.month;
    }).reduce((s, t) => s + parseHours(t.hours), 0);
    cumActual += monthHours;
    return { name: m.label, budget: Math.round(cumBudget), actual: Math.round(cumActual) };
  });

  return {
    metrics: [
      { label: 'Total Budget', value: `${Math.round(totalPlanned)}h`, change: 'Planned hours', positive: true },
      { label: 'Period Spent', value: `${Math.round(periodSpent)}h`, change: `${Math.abs(variance)}% ${variance >= 0 ? 'over' : 'under'}`, positive: variance <= 0 },
      { label: 'Expenses', value: totalExpenses > 0 ? `$${Math.round(totalExpenses).toLocaleString()}` : '$0', change: `${expenses.length} entries`, positive: true },
      { label: 'Variance', value: `${variance >= 0 ? '+' : ''}${variance}%`, change: variance > 10 ? 'Over budget' : 'Within range', positive: variance <= 10 },
    ],
    lineChartData,
    lineChartConfig: { title: 'Cumulative Budget vs Actual', lines: [
      { dataKey: 'budget', color: '#9CA3AF', name: 'Budget' },
      { dataKey: 'actual', color: '#0066FF', name: 'Actual' },
    ]},
    tableData: {
      title: 'Project Financials',
      columns: ['Project', 'Planned Hours', 'Period Hours', 'Variance', 'Contract Value'],
      rows: (() => {
        // Compute per-project hours from timesheets in the selected period
        const projHoursMap = new Map<string, number>();
        for (const t of timesheets) {
          const name = t.project?.name;
          if (name) projHoursMap.set(name, (projHoursMap.get(name) || 0) + parseHours(t.hours));
        }
        return projects.map(p => {
          const planned = parseHours(p.plannedHours);
          const spent = projHoursMap.get(p.name) || 0;
          const v = planned > 0 ? Math.round(((spent - planned) / planned) * 100) : 0;
          return {
            Project: p.name,
            'Planned Hours': `${planned.toFixed(1)}h`,
            'Period Hours': `${spent.toFixed(1)}h`,
            Variance: `${v >= 0 ? '+' : ''}${v}%`,
            'Contract Value': p.contractValue ? `$${parseFloat(p.contractValue).toLocaleString()}` : 'N/A',
          };
        });
      })(),
    },
  };
}

function generateExpenseSummary(rawData: RawData, filters: ReportFilters): ReportResult {
  const { start, end } = getDateRangeFromFilter(filters.dateRange, filters.customStart, filters.customEnd);
  const expenses = filterExpensesByDate(rawData.expenses, start, end);

  const totalAmount = expenses.reduce((s, e) => s + parseFloat(e.amount || '0'), 0);
  const approved = expenses.filter(e => e.status === 1);
  const pending = expenses.filter(e => e.status === 0);
  const approvedAmount = approved.reduce((s, e) => s + parseFloat(e.amount || '0'), 0);

  const byCategory = new Map<string, number>();
  for (const e of expenses) {
    const cat = e.category || 'Other';
    byCategory.set(cat, (byCategory.get(cat) || 0) + parseFloat(e.amount || '0'));
  }

  const pieChartData = Array.from(byCategory.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], i) => ({ name, value: Math.round(value), color: CHART_COLORS[i % CHART_COLORS.length] }));

  return {
    metrics: [
      { label: 'Total Expenses', value: `$${Math.round(totalAmount).toLocaleString()}`, change: `${expenses.length} entries`, positive: true },
      { label: 'Approved', value: `$${Math.round(approvedAmount).toLocaleString()}`, change: `${approved.length} expenses`, positive: true },
      { label: 'Pending', value: String(pending.length), change: pending.length > 0 ? 'Awaiting approval' : 'All processed', positive: pending.length === 0 },
      { label: 'Categories', value: String(byCategory.size), change: 'Expense types', positive: true },
    ],
    pieChartData,
    pieChartConfig: { title: 'Expenses by Category', centerLabel: 'Total', centerValue: `$${Math.round(totalAmount).toLocaleString()}` },
    tableData: {
      title: 'Expense List',
      columns: ['Date', 'Employee', 'Category', 'Amount', 'Project', 'Status'],
      rows: expenses.slice(0, 20).map(e => ({
        Date: e.date,
        Employee: getUserName(e.user),
        Category: e.category || 'N/A',
        Amount: `$${parseFloat(e.amount || '0').toLocaleString()}`,
        Project: e.project?.name || 'N/A',
        Status: e.status === 1 ? 'Approved' : e.status === 0 ? 'Pending' : 'Denied',
      })),
    },
  };
}

function generateInvoiceStatus(rawData: RawData, filters: ReportFilters): ReportResult {
  const invoices = rawData.invoices;

  const paid = invoices.filter(i => i.status?.toLowerCase() === 'paid');
  const pendingInv = invoices.filter(i => i.status?.toLowerCase() === 'pending' || i.status?.toLowerCase() === 'sent');
  const overdueInv = invoices.filter(i => {
    if (i.status?.toLowerCase() === 'paid') return false;
    const due = parseProjectDate(i.dueDate);
    return due && isOverdue(due);
  });

  const totalAmount = invoices.reduce((s, i) => s + parseFloat(i.total || i.amount || '0'), 0);
  const paidAmount = paid.reduce((s, i) => s + parseFloat(i.total || i.amount || '0'), 0);
  const overdueAmount = overdueInv.reduce((s, i) => s + parseFloat(i.total || i.amount || '0'), 0);

  return {
    metrics: [
      { label: 'Total Invoiced', value: `$${Math.round(totalAmount).toLocaleString()}`, change: `${invoices.length} invoices`, positive: true },
      { label: 'Paid', value: `$${Math.round(paidAmount).toLocaleString()}`, change: `${paid.length} invoices`, positive: true },
      { label: 'Pending', value: String(pendingInv.length), change: pendingInv.length > 0 ? 'Awaiting payment' : 'All paid', positive: pendingInv.length === 0 },
      { label: 'Overdue', value: String(overdueInv.length), change: overdueInv.length > 0 ? `$${Math.round(overdueAmount).toLocaleString()} outstanding` : 'None overdue', positive: overdueInv.length === 0 },
    ],
    pieChartData: [
      { name: 'Paid', value: paid.length, color: '#10B981' },
      { name: 'Pending', value: pendingInv.length, color: '#F59E0B' },
      { name: 'Overdue', value: overdueInv.length, color: '#EF4444' },
    ].filter(d => d.value > 0),
    pieChartConfig: { title: 'Invoice Status', centerLabel: 'Total', centerValue: `$${Math.round(totalAmount).toLocaleString()}` },
    tableData: {
      title: 'Invoice List',
      columns: ['Invoice #', 'Client', 'Date', 'Due Date', 'Amount', 'Status'],
      rows: invoices.map(i => ({
        'Invoice #': i.number || i.id,
        Client: i.client?.name || 'N/A',
        Date: i.date,
        'Due Date': i.dueDate || 'N/A',
        Amount: `$${parseFloat(i.total || i.amount || '0').toLocaleString()}`,
        Status: i.status || 'Unknown',
      })),
    },
  };
}

function generateProjectProfitability(rawData: RawData, filters: ReportFilters): ReportResult {
  const projects = filterProjects(rawData.projects, filters.projectFilter, filters.selectedProjects);
  const users = rawData.users;
  const { start, end } = getDateRangeFromFilter(filters.dateRange, filters.customStart, filters.customEnd);

  // Filter timesheets by the selected date range so cost calculations respect the period filter.
  const periodTimesheets = filterTimesheetsByDate(rawData.timesheets, start, end);

  // Build a map of period hours per project name from filtered timesheets.
  const periodHoursByProject = new Map<string, number>();
  for (const t of periodTimesheets) {
    const projName = t.project?.name;
    if (projName) {
      periodHoursByProject.set(projName, (periodHoursByProject.get(projName) || 0) + parseHours(t.hours));
    }
  }

  const avgCostPerHour = users.reduce((s, u) => s + parseFloat(u.costPerHour || '0'), 0) / Math.max(1, users.filter(u => parseFloat(u.costPerHour || '0') > 0).length) || 50;

  const profitData = projects.map(p => {
    const contractValue = parseFloat(p.contractValue || '0');
    // Use period-filtered timesheet hours instead of project.spentHours so date range filters apply.
    const actualHours = periodHoursByProject.get(p.name) || 0;
    const cost = actualHours * avgCostPerHour;
    const profit = contractValue - cost;
    const margin = contractValue > 0 ? Math.round((profit / contractValue) * 100) : 0;
    return { name: p.name, contractValue, cost, profit, margin, spentHours: actualHours };
  });

  const totalRevenue = profitData.reduce((s, p) => s + p.contractValue, 0);
  const totalCost = profitData.reduce((s, p) => s + p.cost, 0);
  const totalProfit = totalRevenue - totalCost;
  const overallMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;

  const barChartData = profitData
    .filter(p => p.contractValue > 0)
    .sort((a, b) => b.margin - a.margin)
    .slice(0, 10)
    .map(p => ({ name: p.name.length > 15 ? p.name.slice(0, 15) + '...' : p.name, margin: p.margin }));

  return {
    metrics: [
      { label: 'Total Revenue', value: totalRevenue > 0 ? `$${Math.round(totalRevenue).toLocaleString()}` : 'N/A', change: 'Contract values', positive: true },
      { label: 'Total Cost', value: `$${Math.round(totalCost).toLocaleString()}`, change: 'Labor costs', positive: true },
      { label: 'Net Profit', value: `$${Math.round(totalProfit).toLocaleString()}`, change: `${overallMargin}% margin`, positive: totalProfit >= 0 },
      { label: 'Avg Cost/Hour', value: `$${avgCostPerHour.toFixed(0)}`, change: 'Team average', positive: true },
    ],
    barChartData,
    barChartConfig: { title: 'Profit Margin by Project', dataKey: 'margin', color: '#10B981' },
    tableData: {
      title: 'Profitability Breakdown',
      columns: ['Project', 'Revenue', 'Cost', 'Profit', 'Margin'],
      rows: profitData.map(p => ({
        Project: p.name,
        Revenue: p.contractValue > 0 ? `$${Math.round(p.contractValue).toLocaleString()}` : 'N/A',
        Cost: `$${Math.round(p.cost).toLocaleString()}`,
        Profit: `$${Math.round(p.profit).toLocaleString()}`,
        Margin: `${p.margin}%`,
      })),
    },
  };
}

function generateCostPerHour(rawData: RawData, filters: ReportFilters): ReportResult {
  const projects = filterProjects(rawData.projects, filters.projectFilter, filters.selectedProjects);
  const { start, end } = getDateRangeFromFilter(filters.dateRange, filters.customStart, filters.customEnd);
  const expenses = filterExpensesByDate(rawData.expenses, start, end);

  const projectCosts = projects.map(p => {
    const spentHours = parseHours(p.spentHours);
    const projExpenses = expenses.filter(e => e.project?.name === p.name).reduce((s, e) => s + parseFloat(e.amount || '0'), 0);
    const costPerHour = spentHours > 0 ? projExpenses / spentHours : 0;
    return { name: p.name, spentHours, expenses: projExpenses, costPerHour };
  });

  const totalExpenses = projectCosts.reduce((s, p) => s + p.expenses, 0);
  const totalHours = projectCosts.reduce((s, p) => s + p.spentHours, 0);
  const avgCostPerHour = totalHours > 0 ? totalExpenses / totalHours : 0;

  const barChartData = projectCosts
    .filter(p => p.costPerHour > 0)
    .sort((a, b) => b.costPerHour - a.costPerHour)
    .slice(0, 10)
    .map(p => ({ name: p.name.length > 15 ? p.name.slice(0, 15) + '...' : p.name, cost: Math.round(p.costPerHour) }));

  return {
    metrics: [
      { label: 'Avg Cost/Hour', value: avgCostPerHour > 0 ? `$${avgCostPerHour.toFixed(2)}` : 'N/A', change: 'Across projects', positive: true },
      { label: 'Total Expenses', value: `$${Math.round(totalExpenses).toLocaleString()}`, change: `${expenses.length} entries`, positive: true },
      { label: 'Total Hours', value: `${Math.round(totalHours)}h`, change: 'Hours tracked', positive: true },
      { label: 'Projects', value: String(projectCosts.filter(p => p.spentHours > 0).length), change: 'With hours', positive: true },
    ],
    barChartData,
    barChartConfig: { title: 'Cost per Hour by Project', dataKey: 'cost', color: '#EC4899' },
    tableData: {
      title: 'Cost Breakdown',
      columns: ['Project', 'Spent Hours', 'Expenses', 'Cost/Hour'],
      rows: projectCosts
        .sort((a, b) => b.costPerHour - a.costPerHour)
        .map(p => ({
          Project: p.name,
          'Spent Hours': `${p.spentHours.toFixed(1)}h`,
          Expenses: `$${Math.round(p.expenses).toLocaleString()}`,
          'Cost/Hour': p.costPerHour > 0 ? `$${p.costPerHour.toFixed(2)}` : 'N/A',
        })),
    },
  };
}

// ============================================================================
// Report Catalog
// ============================================================================

const REPORT_CATALOG: ReportDefinition[] = [
  // Project Reports
  { id: 'project-performance', name: 'Project Performance Overview', description: 'All projects with status, spent vs planned hours, and timeline progress', category: 'project', icon: 'BarChart3', color: '#0066FF', generate: generateProjectPerformance },
  { id: 'project-timeline', name: 'Project Timeline Status', description: 'Schedule tracking with on-time, delayed, and upcoming deadlines', category: 'project', icon: 'Activity', color: '#8B5CF6', generate: generateProjectTimeline },
  { id: 'project-budget', name: 'Project Budget Analysis', description: 'Budget vs actual spend across all projects', category: 'project', icon: 'DollarSign', color: '#10B981', generate: generateProjectBudget },
  { id: 'project-completion', name: 'Project Completion Rate', description: 'Task completion metrics and trend analysis', category: 'project', icon: 'TrendingUp', color: '#0066FF', generate: generateProjectCompletion },
  { id: 'project-risk', name: 'Project Risk Summary', description: 'At-risk projects with risk factors and severity levels', category: 'project', icon: 'FileText', color: '#EF4444', generate: generateProjectRisk },

  // Time Reports
  { id: 'time-tracking', name: 'Time Tracking Summary', description: 'Total hours by project with detailed breakdown', category: 'time', icon: 'Clock', color: '#0066FF', generate: generateTimeTracking },
  { id: 'employee-time', name: 'Employee Time Distribution', description: 'Hours per user with contribution analysis', category: 'time', icon: 'Users', color: '#8B5CF6', generate: generateEmployeeTime },
  { id: 'weekly-timesheet', name: 'Weekly Timesheet Report', description: 'Weekly hours breakdown by day', category: 'time', icon: 'Calendar', color: '#10B981', generate: generateWeeklyTimesheet },
  { id: 'overtime', name: 'Overtime Analysis', description: 'Users exceeding standard 40-hour work weeks', category: 'time', icon: 'TrendingUp', color: '#EF4444', generate: generateOvertimeAnalysis },

  // Resource Reports
  { id: 'team-utilization', name: 'Team Utilization', description: 'Task allocation and utilization rate per person', category: 'resource', icon: 'Users', color: '#0066FF', generate: generateTeamUtilization },
  { id: 'dept-workload', name: 'Department Workload', description: 'Workload distribution by department', category: 'resource', icon: 'BarChart3', color: '#8B5CF6', generate: generateDepartmentWorkload },
  { id: 'resource-availability', name: 'Resource Availability', description: 'Team location and availability status', category: 'resource', icon: 'Activity', color: '#10B981', generate: generateResourceAvailability },
  { id: 'leave-overview', name: 'Leave Overview', description: 'Leave requests summary and breakdown by type', category: 'resource', icon: 'Calendar', color: '#F59E0B', generate: generateLeaveOverview },

  // Financial Reports
  { id: 'budget-vs-actual', name: 'Budget vs Actual', description: 'Financial comparison across all projects', category: 'financial', icon: 'DollarSign', color: '#0066FF', generate: generateBudgetVsActual },
  { id: 'expense-summary', name: 'Expense Summary', description: 'Expense categories, totals, and approval status', category: 'financial', icon: 'FileText', color: '#EF4444', generate: generateExpenseSummary },
  { id: 'invoice-status', name: 'Invoice Status', description: 'Invoice tracking with payment status', category: 'financial', icon: 'DollarSign', color: '#10B981', generate: generateInvoiceStatus },
  { id: 'project-profitability', name: 'Project Profitability', description: 'Contract value vs labor costs with profit margins', category: 'financial', icon: 'TrendingUp', color: '#8B5CF6', generate: generateProjectProfitability },
  { id: 'cost-per-hour', name: 'Cost Per Hour Analysis', description: 'Average cost per hour breakdown by project', category: 'financial', icon: 'Clock', color: '#EC4899', generate: generateCostPerHour },
];

// ============================================================================
// Public API
// ============================================================================

export function getReportDefinitions(): ReportDefinition[] {
  return REPORT_CATALOG;
}

export function generateReport(reportId: string, rawData: RawData, filters: ReportFilters): ReportResult {
  const report = REPORT_CATALOG.find(r => r.id === reportId);
  if (!report) {
    return {
      metrics: [{ label: 'Error', value: 'N/A', change: 'Report not found', positive: false }],
    };
  }
  return report.generate(rawData, filters);
}
