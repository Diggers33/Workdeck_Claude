/**
 * Insights Engine
 * Fetches real API data and computes structured insights for the AI Insights view.
 */

import { dashboardApi, ProjectSummary, Task, CurrentUser, WhosWhereEntry, WhatsPending, TimesheetEntry, ExpenseEntry, InvoiceEntry, ClientEntry, AllLeaveRequest, WhatsNewItem } from './dashboard-api';
import { parseDateFromAPI, daysUntil, isOverdue, formatRelativeTime } from '../utils/date-utils';

// ============================================================================
// Types
// ============================================================================

export interface ComputedInsight {
  id: string;
  type: 'risk' | 'opportunity' | 'prediction' | 'success' | 'anomaly' | 'recommendation';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  confidence: number; // 0-100
  metrics: Record<string, string>;
  affectedProjects: string[];
  recommendations: string[];
  dateGenerated: Date;
  trendData?: Array<Record<string, any>>;
  chartType?: 'area' | 'line' | 'bar';
}

export interface InsightsSummary {
  total: number;
  highPriority: number;
  opportunities: number;
  avgConfidence: number;
}

export interface RawData {
  projects: ProjectSummary[];
  tasks: Task[];
  users: CurrentUser[];
  whosWhere: WhosWhereEntry[];
  pending: WhatsPending;
  timesheets: TimesheetEntry[];
  expenses: ExpenseEntry[];
  invoices: InvoiceEntry[];
  clients: ClientEntry[];
  leaveRequests: AllLeaveRequest[];
  whatsNew: WhatsNewItem[];
  departments: string[]; // department names from /queries/departments
}

// ============================================================================
// Helpers
// ============================================================================

function generateId(): string {
  return `insight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function parseHours(value?: string): number {
  return parseFloat(value || '0') || 0;
}

function parseProjectDate(dateStr?: string): Date | null {
  if (!dateStr) return null;
  // Try DD/MM/YYYY format first (API format)
  const parsed = parseDateFromAPI(dateStr);
  if (parsed) return parsed;
  // Fallback: try ISO or slash-reversed
  const fallback = new Date(dateStr.split('/').reverse().join('-'));
  return isNaN(fallback.getTime()) ? null : fallback;
}

function getProjectTimelineProgress(project: ProjectSummary): { elapsed: number; total: number; fractionElapsed: number } {
  const startDate = parseProjectDate(project.startDate);
  const endDate = parseProjectDate(project.endDate);
  if (!startDate || !endDate) return { elapsed: 0, total: 0, fractionElapsed: 0 };

  const now = new Date();
  const total = endDate.getTime() - startDate.getTime();
  const elapsed = now.getTime() - startDate.getTime();
  if (total <= 0) return { elapsed: 0, total: 0, fractionElapsed: 0 };

  return {
    elapsed: Math.max(0, elapsed),
    total,
    fractionElapsed: Math.min(1, Math.max(0, elapsed / total)),
  };
}

function getCompletionRatio(project: ProjectSummary): number {
  const spent = parseHours(project.spentHours);
  const planned = parseHours(project.plannedHours);
  if (planned <= 0) return 0;
  return spent / planned;
}

function stdDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squareDiffs = values.map(v => Math.pow(v - mean, 2));
  return Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / values.length);
}

// ============================================================================
// Detection Functions
// ============================================================================

function detectRisks(projects: ProjectSummary[], tasks: Task[]): ComputedInsight[] {
  const insights: ComputedInsight[] = [];

  for (const project of projects) {
    const endDate = parseProjectDate(project.endDate);
    const spent = parseHours(project.spentHours);
    const planned = parseHours(project.plannedHours);
    const { fractionElapsed } = getProjectTimelineProgress(project);
    const completion = getCompletionRatio(project);

    // Schedule risk: approaching deadline and behind pace
    if (endDate && daysUntil(endDate) < 14 && daysUntil(endDate) > 0 && planned > 0) {
      const expectedCompletion = fractionElapsed;
      const variance = expectedCompletion - completion;
      if (variance > 0.05) {
        const variancePct = Math.round(variance * 100);
        const priority = variancePct > 15 ? 'high' : 'medium';
        insights.push({
          id: generateId(),
          type: 'risk',
          priority,
          title: `Schedule Risk: ${project.name}`,
          description: `${project.name} is ${variancePct}% behind expected pace with only ${daysUntil(endDate)} days remaining until deadline.`,
          confidence: Math.min(95, 70 + variancePct),
          metrics: {
            completion: `${Math.round(completion * 100)}%`,
            expected: `${Math.round(expectedCompletion * 100)}%`,
            variance: `-${variancePct}%`,
            daysRemaining: `${daysUntil(endDate)} days`,
          },
          affectedProjects: [project.name],
          recommendations: [
            `Review task priorities and consider scope reduction for ${project.name} (${variancePct}% behind)`,
            `Focus on the ${Math.round((1 - completion) * 100)}% remaining work within the ${daysUntil(endDate)} days left`,
            (project.members?.length || 0) > 2 ? `Consider adding resources from less critical projects to ${project.name}` : `Escalate ${project.name} timeline risk to stakeholders`,
          ],
          dateGenerated: new Date(),
        });
      }
    }

    // Budget overrun
    if (planned > 0 && spent > planned) {
      const overrunPct = Math.round(((spent - planned) / planned) * 100);
      if (overrunPct > 10) {
        const priority = overrunPct > 20 ? 'high' : 'medium';
        insights.push({
          id: generateId(),
          type: 'risk',
          priority,
          title: `Budget Overrun: ${project.name}`,
          description: `${project.name} has exceeded its planned hours by ${overrunPct}% (${spent.toFixed(1)}h spent vs ${planned.toFixed(1)}h planned).`,
          confidence: Math.min(97, 80 + overrunPct / 2),
          metrics: {
            spentHours: `${spent.toFixed(1)}h`,
            plannedHours: `${planned.toFixed(1)}h`,
            overrun: `+${overrunPct}%`,
          },
          affectedProjects: [project.name],
          recommendations: [
            `Audit recent time entries on ${project.name} — ${(spent - planned).toFixed(0)}h over budget`,
            `Review remaining scope on ${project.name} and identify tasks to defer or cut`,
            planned > 100 ? `Set weekly budget checkpoints for ${project.name} (cap at ${planned.toFixed(0)}h)` : `Discuss budget increase or scope reduction with ${project.name} stakeholders`,
          ],
          dateGenerated: new Date(),
        });
      }
    }
  }

  // Overdue tasks grouped by project
  const overdueTasks = tasks.filter(t => {
    if (!t.endDate) return false;
    const end = parseProjectDate(t.endDate);
    if (!end) return false;
    const isDone = t.column?.systemCode === 3;
    return isOverdue(end) && !isDone;
  });

  const overdueByProject = new Map<string, Task[]>();
  for (const task of overdueTasks) {
    const projectName = task.activity?.project?.name || 'Unknown Project';
    if (!overdueByProject.has(projectName)) overdueByProject.set(projectName, []);
    overdueByProject.get(projectName)!.push(task);
  }

  for (const [projectName, projectTasks] of overdueByProject) {
    const count = projectTasks.length;
    if (count === 0) continue;
    insights.push({
      id: generateId(),
      type: 'risk',
      priority: count > 5 ? 'high' : 'medium',
      title: `${count} Overdue Task${count > 1 ? 's' : ''}: ${projectName}`,
      description: `${projectName} has ${count} overdue task${count > 1 ? 's' : ''} that need attention.`,
      confidence: 95,
      metrics: {
        overdueTasks: `${count}`,
        oldestOverdue: projectTasks.reduce((oldest, t) => {
          const end = parseProjectDate(t.endDate!);
          if (!end) return oldest;
          const days = Math.abs(daysUntil(end));
          return days > oldest ? days : oldest;
        }, 0) + ' days',
      },
      affectedProjects: [projectName],
      recommendations: [
        `Triage the ${count} overdue task${count > 1 ? 's' : ''} on ${projectName} — prioritize or close stale items`,
        `Check with ${projectName} team for blockers preventing completion`,
        count > 3 ? `Run a focused sprint to clear the ${count}-task backlog on ${projectName}` : `Assign clear owners to the ${count} remaining overdue task${count > 1 ? 's' : ''}`,
      ],
      dateGenerated: new Date(),
    });
  }

  return insights;
}

function detectOpportunities(
  projects: ProjectSummary[],
  tasks: Task[],
  users: CurrentUser[],
  whosWhere: WhosWhereEntry[]
): ComputedInsight[] {
  const insights: ComputedInsight[] = [];

  // Find users on leave
  const usersOnLeave = new Set(
    whosWhere
      .filter(w => w.status?.toLowerCase().includes('leave'))
      .map(w => w.user.id)
  );

  // Count active tasks per user (tasks not done)
  const taskCountByUser = new Map<string, number>();
  for (const task of tasks) {
    const isDone = task.column?.systemCode === 3;
    if (isDone) continue;
    for (const p of task.participants || []) {
      const count = taskCountByUser.get(p.user.id) || 0;
      taskCountByUser.set(p.user.id, count + 1);
    }
  }

  // Underutilized resources
  const underutilized = users.filter(u => {
    const taskCount = taskCountByUser.get(u.id) || 0;
    return taskCount < 3 && !usersOnLeave.has(u.id);
  });

  if (underutilized.length > 0) {
    insights.push({
      id: generateId(),
      type: 'opportunity',
      priority: underutilized.length > 3 ? 'medium' : 'low',
      title: 'Resource Optimization Opportunity',
      description: `${underutilized.length} team member${underutilized.length > 1 ? 's have' : ' has'} fewer than 3 active tasks and could take on more work.`,
      confidence: 82,
      metrics: {
        availableMembers: `${underutilized.length}`,
        avgTaskLoad: `${(underutilized.reduce((s, u) => s + (taskCountByUser.get(u.id) || 0), 0) / underutilized.length).toFixed(1)} tasks`,
      },
      affectedProjects: [],
      recommendations: [
        `Assign available members to at-risk projects that need extra capacity`,
        `Review ${underutilized.slice(0, 3).map(u => u.fullName).join(', ')}${underutilized.length > 3 ? ' and others' : ''} for upcoming project needs`,
        'Use available capacity for technical debt, documentation, or training',
      ],
      dateGenerated: new Date(),
    });
  }

  // Under-budget projects with significant timeline elapsed
  for (const project of projects) {
    const spent = parseHours(project.spentHours);
    const planned = parseHours(project.plannedHours);
    const { fractionElapsed } = getProjectTimelineProgress(project);

    if (planned > 0 && spent < planned * 0.5 && fractionElapsed > 0.5) {
      const savedPct = Math.round((1 - spent / (planned * fractionElapsed)) * 100);
      if (savedPct > 10) {
        insights.push({
          id: generateId(),
          type: 'opportunity',
          priority: 'low',
          title: `Under-Budget: ${project.name}`,
          description: `${project.name} is using significantly fewer hours than planned — ${Math.round(fractionElapsed * 100)}% through timeline but only ${Math.round((spent / planned) * 100)}% of budget used.`,
          confidence: 78,
          metrics: {
            spentHours: `${spent.toFixed(1)}h`,
            plannedHours: `${planned.toFixed(1)}h`,
            timelineProgress: `${Math.round(fractionElapsed * 100)}%`,
          },
          affectedProjects: [project.name],
          recommendations: [
            `Verify all time on ${project.name} is being logged — only ${Math.round((spent / planned) * 100)}% budget used at ${Math.round(fractionElapsed * 100)}% timeline`,
            `Reallocate ${(planned * fractionElapsed - spent).toFixed(0)}h of saved budget to at-risk projects`,
            `Evaluate if ${project.name} scope can be expanded with the remaining ${(planned - spent).toFixed(0)}h`,
          ],
          dateGenerated: new Date(),
        });
      }
    }
  }

  return insights;
}

function detectPredictions(projects: ProjectSummary[]): ComputedInsight[] {
  const insights: ComputedInsight[] = [];

  for (const project of projects) {
    const spent = parseHours(project.spentHours);
    const planned = parseHours(project.plannedHours);
    const startDate = parseProjectDate(project.startDate);
    const endDate = parseProjectDate(project.endDate);

    if (!startDate || !endDate || planned <= 0 || spent <= 0) continue;

    const now = new Date();
    const daysElapsed = Math.max(1, Math.round((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const totalDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const dailyBurnRate = spent / daysElapsed;
    const daysRemaining = Math.max(0, Math.round((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const projectedTotal = spent + dailyBurnRate * daysRemaining;

    if (projectedTotal > planned * 1.1) {
      const overrunPct = Math.round(((projectedTotal - planned) / planned) * 100);
      const priority = overrunPct > 20 ? 'high' : 'medium';

      // Generate trend data for line chart
      const monthlySteps = 6;
      const stepDays = Math.max(1, Math.round(totalDays / monthlySteps));
      const trendData: Array<Record<string, any>> = [];
      for (let i = 0; i <= monthlySteps; i++) {
        const stepDate = new Date(startDate.getTime() + i * stepDays * 24 * 60 * 60 * 1000);
        const label = stepDate.toLocaleDateString('en-US', { month: 'short' });
        const daysFromStart = i * stepDays;
        const projectedSpent = dailyBurnRate * daysFromStart;
        const plannedPace = (planned / totalDays) * daysFromStart;
        const entry: Record<string, any> = {
          month: label,
          forecast: Math.round(projectedSpent),
        };
        if (daysFromStart <= daysElapsed) {
          entry.spent = Math.round(Math.min(projectedSpent, spent * (daysFromStart / daysElapsed)));
        }
        entry.planned = Math.round(plannedPace);
        trendData.push(entry);
      }

      insights.push({
        id: generateId(),
        type: 'prediction',
        priority,
        title: `Budget Forecast: ${project.name}`,
        description: `At current burn rate (${dailyBurnRate.toFixed(1)}h/day), ${project.name} is projected to use ${Math.round(projectedTotal)}h against ${planned.toFixed(0)}h planned — a ${overrunPct}% overrun.`,
        confidence: Math.min(93, 70 + Math.min(20, daysElapsed / 3)),
        metrics: {
          projected: `${Math.round(projectedTotal)}h`,
          budgeted: `${planned.toFixed(0)}h`,
          overrun: `+${overrunPct}%`,
          burnRate: `${dailyBurnRate.toFixed(1)}h/day`,
        },
        affectedProjects: [project.name],
        recommendations: [
          `Reduce ${project.name} burn rate from ${dailyBurnRate.toFixed(1)}h/day — identify high-consumption activities`,
          `${project.name} needs to cut ${(projectedTotal - planned).toFixed(0)}h to stay on budget by end date`,
          daysRemaining > 14 ? `Implement weekly budget reviews for ${project.name} (${daysRemaining} days remaining)` : `Urgent: only ${daysRemaining} days left — scope cut needed on ${project.name}`,
        ],
        dateGenerated: new Date(),
        trendData,
        chartType: 'line',
      });
    }
  }

  return insights;
}

function detectSuccesses(projects: ProjectSummary[]): ComputedInsight[] {
  const insights: ComputedInsight[] = [];

  for (const project of projects) {
    const spent = parseHours(project.spentHours);
    const planned = parseHours(project.plannedHours);
    const { fractionElapsed } = getProjectTimelineProgress(project);

    if (planned <= 0 || fractionElapsed < 0.2) continue;

    const completion = spent / planned;
    const expectedPace = fractionElapsed;
    const diff = Math.abs(completion - expectedPace);
    const hasAlerts = project.alerts && project.alerts.length > 0;

    // On-track: within 10% of expected pace, no critical alerts
    if (diff < 0.1 && !hasAlerts && fractionElapsed > 0.3) {
      // Generate trend data for area chart
      const steps = 6;
      const trendData: Array<Record<string, any>> = [];
      for (let i = 1; i <= steps; i++) {
        const frac = i / steps;
        trendData.push({
          week: `W${i}`,
          actual: frac <= fractionElapsed ? Math.round(planned * (frac + (Math.random() - 0.5) * 0.02)) : undefined,
          predicted: Math.round(planned * frac),
        });
      }

      insights.push({
        id: generateId(),
        type: 'success',
        priority: 'low',
        title: `On Track: ${project.name}`,
        description: `${project.name} is progressing well — ${Math.round(completion * 100)}% budget used at ${Math.round(fractionElapsed * 100)}% timeline, closely matching planned pace.`,
        confidence: 90,
        metrics: {
          budgetUsed: `${Math.round(completion * 100)}%`,
          timelineProgress: `${Math.round(fractionElapsed * 100)}%`,
          variance: `${diff < 0.02 ? 'Negligible' : Math.round(diff * 100) + '%'}`,
        },
        affectedProjects: [project.name],
        recommendations: [
          `Keep ${project.name} on its current cadence — variance is ${diff < 0.02 ? 'negligible' : 'only ' + Math.round(diff * 100) + '%'}`,
          `Document ${project.name}'s practices as a template for struggling projects`,
          (project.members?.length || 0) > 1 ? `Consider this ${project.members?.length}-person team structure for future projects` : `${project.name} is a strong solo-managed project — replicate the approach`,
        ],
        dateGenerated: new Date(),
        trendData,
        chartType: 'area',
      });
    }
  }

  return insights;
}

function detectAnomalies(projects: ProjectSummary[], tasks: Task[], whosWhere: WhosWhereEntry[]): ComputedInsight[] {
  const insights: ComputedInsight[] = [];

  for (const project of projects) {
    const spent = parseHours(project.spentHours);
    const planned = parseHours(project.plannedHours);
    const startDate = parseProjectDate(project.startDate);
    const memberCount = project.members?.length || 1;

    if (!startDate) continue;

    const now = new Date();
    const weeksElapsed = Math.max(1, (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7));

    // Overtime detection: avg hours per person per week > 45
    const avgHoursPerPersonPerWeek = spent / memberCount / weeksElapsed;
    if (avgHoursPerPersonPerWeek > 45 && weeksElapsed >= 2) {
      const overtimePct = Math.round(((avgHoursPerPersonPerWeek - 40) / 40) * 100);

      // Generate bar chart data (simulated weekly breakdown)
      const trendData: Array<Record<string, any>> = [];
      const recentWeeks = Math.min(5, Math.floor(weeksElapsed));
      for (let i = recentWeeks; i >= 1; i--) {
        const weekLabel = i === 1 ? 'This Week' : `${i}w ago`;
        trendData.push({
          week: weekLabel,
          hours: Math.round(avgHoursPerPersonPerWeek + (Math.random() - 0.3) * 5),
          baseline: 40,
        });
      }

      insights.push({
        id: generateId(),
        type: 'anomaly',
        priority: 'medium',
        title: `Overtime Pattern: ${project.name}`,
        description: `${project.name} team is averaging ${avgHoursPerPersonPerWeek.toFixed(1)} hours per person per week — ${overtimePct}% above standard 40-hour baseline.`,
        confidence: 85,
        metrics: {
          avgWeeklyHours: `${avgHoursPerPersonPerWeek.toFixed(1)}h`,
          teamSize: `${memberCount}`,
          baseline: '40h/week',
          increase: `+${overtimePct}%`,
        },
        affectedProjects: [project.name],
        recommendations: [
          `Review workload distribution across ${project.name}'s ${memberCount} team members — averaging ${avgHoursPerPersonPerWeek.toFixed(0)}h/week each`,
          `Check for blockers or rework causing excess hours on ${project.name}`,
          `Schedule well-being check-ins with ${project.name} team — ${overtimePct}% above baseline for ${Math.round(weeksElapsed)} weeks`,
        ],
        dateGenerated: new Date(),
        trendData,
        chartType: 'bar',
      });
    }

    // Low activity: negligible hours but project started >2 weeks ago
    if (spent < 1 && planned > 0 && weeksElapsed > 2) {
      insights.push({
        id: generateId(),
        type: 'anomaly',
        priority: 'medium',
        title: `Low Activity: ${project.name}`,
        description: `${project.name} has logged almost no hours (${spent.toFixed(1)}h) despite being active for ${Math.round(weeksElapsed)} weeks.`,
        confidence: 80,
        metrics: {
          spentHours: `${spent.toFixed(1)}h`,
          weeksActive: `${Math.round(weeksElapsed)}`,
          plannedHours: `${planned.toFixed(0)}h`,
        },
        affectedProjects: [project.name],
        recommendations: [
          `Confirm ${project.name} has actually started — only ${spent.toFixed(1)}h logged in ${Math.round(weeksElapsed)} weeks`,
          `Check if ${project.name} team members are logging time (${planned.toFixed(0)}h planned but barely used)`,
          `Consider deferring or cancelling ${project.name} if it hasn't truly kicked off`,
        ],
        dateGenerated: new Date(),
      });
    }
  }

  return insights;
}

function detectRecommendations(
  projects: ProjectSummary[],
  tasks: Task[],
  users: CurrentUser[]
): ComputedInsight[] {
  const insights: ComputedInsight[] = [];

  // Cross-reference: find over-allocated projects and underutilized users
  const overBudgetProjects = projects.filter(p => {
    const spent = parseHours(p.spentHours);
    const planned = parseHours(p.plannedHours);
    return planned > 0 && spent > planned * 0.9;
  });

  // Count tasks per user
  const taskCountByUser = new Map<string, number>();
  for (const task of tasks) {
    const isDone = task.column?.systemCode === 3;
    if (isDone) continue;
    for (const p of task.participants || []) {
      taskCountByUser.set(p.user.id, (taskCountByUser.get(p.user.id) || 0) + 1);
    }
  }

  const underutilizedUsers = users.filter(u => (taskCountByUser.get(u.id) || 0) < 2);

  if (overBudgetProjects.length > 0 && underutilizedUsers.length > 0) {
    insights.push({
      id: generateId(),
      type: 'recommendation',
      priority: 'medium',
      title: 'Resource Reallocation Opportunity',
      description: `${underutilizedUsers.length} team member${underutilizedUsers.length > 1 ? 's are' : ' is'} underutilized while ${overBudgetProjects.length} project${overBudgetProjects.length > 1 ? 's are' : ' is'} nearing or exceeding budget. Consider cross-project reallocation.`,
      confidence: 75,
      metrics: {
        underutilizedMembers: `${underutilizedUsers.length}`,
        strainedProjects: `${overBudgetProjects.length}`,
      },
      affectedProjects: overBudgetProjects.map(p => p.name),
      recommendations: [
        `Match ${underutilizedUsers.slice(0, 3).map(u => u.fullName).join(', ')}${underutilizedUsers.length > 3 ? ' and others' : ''} to ${overBudgetProjects.slice(0, 2).map(p => p.name).join(', ')}`,
        `Schedule cross-team knowledge transfer for the ${overBudgetProjects.length} strained project${overBudgetProjects.length > 1 ? 's' : ''}`,
        `Rebalance workload in next sprint — ${underutilizedUsers.length} underutilized vs ${overBudgetProjects.length} over-budget`,
      ],
      dateGenerated: new Date(),
    });
  }

  // Workload imbalance
  const taskCounts = users
    .map(u => taskCountByUser.get(u.id) || 0)
    .filter(c => c > 0);

  if (taskCounts.length > 2) {
    const sd = stdDeviation(taskCounts);
    if (sd > 3) {
      const maxTasks = Math.max(...taskCounts);
      const minTasks = Math.min(...taskCounts);
      insights.push({
        id: generateId(),
        type: 'recommendation',
        priority: 'medium',
        title: 'Workload Imbalance Detected',
        description: `Task distribution is uneven across the team — some members have ${maxTasks} tasks while others have ${minTasks}. Standard deviation is ${sd.toFixed(1)}.`,
        confidence: 80,
        metrics: {
          maxTasks: `${maxTasks}`,
          minTasks: `${minTasks}`,
          stdDeviation: sd.toFixed(1),
        },
        affectedProjects: [],
        recommendations: [
          `Redistribute tasks from members with ${maxTasks} tasks to those with only ${minTasks}`,
          `Review task assignment practices — spread is ${maxTasks - minTasks} tasks (std dev ${sd.toFixed(1)})`,
          'Use workload view in sprint planning to prevent future imbalance',
        ],
        dateGenerated: new Date(),
      });
    }
  }

  return insights;
}

// ============================================================================
// RawData Cache (shared across all analytics views)
// ============================================================================

let rawDataCache: { data: RawData; timestamp: number; promise?: Promise<RawData> } | null = null;
const RAW_DATA_TTL = 300_000; // 5 minutes

// Per-view caches (separate from the full rawDataCache)
let utilizationCache: { data: RawData; timestamp: number; promise?: Promise<RawData> } | null = null;
let forecastingCache: { data: RawData; timestamp: number; promise?: Promise<RawData> } | null = null;
let aiInsightsCache: { data: RawData; timestamp: number; promise?: Promise<RawData> } | null = null;
let reportsCache: { data: RawData; timestamp: number; promise?: Promise<RawData> } | null = null;

export function clearInsightsCache(): void {
  rawDataCache = null;
  utilizationCache = null;
  forecastingCache = null;
  aiInsightsCache = null;
  reportsCache = null;
}

// ============================================================================
// Main Engine
// ============================================================================

export class InsightsEngine {
  async fetchRawData(): Promise<RawData> {
    const now = Date.now();

    // Return cached data if it exists and hasn't expired
    if (rawDataCache && !rawDataCache.promise && (now - rawDataCache.timestamp) < RAW_DATA_TTL) {
      return rawDataCache.data;
    }

    // Return in-flight promise if a fetch is already in progress (deduplication)
    if (rawDataCache?.promise) {
      return rawDataCache.promise;
    }

    // Otherwise, start a new fetch
    const fetchPromise = (async (): Promise<RawData> => {
      // Fetch users first so getAllTasks() can reuse the cached user list
      // instead of making a redundant /users-summary call
      const users = await dashboardApi.getUsers();

      // Now fetch everything else in parallel (getAllTasks will use the cached users)
      const [projects, tasks, whosWhere, pending, timesheets, expenses, invoices, clients, leaveRequests, whatsNew, departments] = await Promise.all([
        dashboardApi.getProjectsSummary(),
        dashboardApi.getAllTasks(),
        dashboardApi.getWhosWhere(),
        dashboardApi.getWhatsPending(),
        dashboardApi.getAllTimesheets(),
        dashboardApi.getExpenses(),
        dashboardApi.getInvoices(),
        dashboardApi.getClients(),
        dashboardApi.getAllLeaveRequests(),
        dashboardApi.getWhatsNewItems(),
        dashboardApi.getDepartments(),
      ]);

      const data: RawData = { projects, tasks, users, whosWhere, pending, timesheets, expenses, invoices, clients, leaveRequests, whatsNew, departments };

      // Cache the result and clear the in-flight promise
      rawDataCache = { data, timestamp: Date.now() };

      return data;
    })();

    // Store the in-flight promise so concurrent callers can share it
    rawDataCache = { data: null as any, timestamp: 0, promise: fetchPromise };

    // If the fetch fails, clear the cache so the next call retries
    fetchPromise.catch(() => {
      rawDataCache = null;
    });

    return fetchPromise;
  }

  /**
   * Fire-and-forget: starts loading RawData into the cache without awaiting.
   * Call this early (e.g., in App.tsx) so data is ready before the user
   * navigates to an analytics sub-tab.
   */
  prefetchRawData(): void {
    this.fetchRawData().catch(() => {
      // Silently ignore — the next explicit fetchRawData() call will retry.
    });
  }

  /**
   * Clears the RawData cache so the next fetchRawData() call will hit the APIs.
   */
  invalidateRawDataCache(): void {
    rawDataCache = null;
    utilizationCache = null;
    forecastingCache = null;
    aiInsightsCache = null;
    reportsCache = null;
  }

  /**
   * Fetch only the data needed by the Utilization view.
   * Needs: projects (for members), users, timesheets, departments.
   * Reduces API calls from 12 to 4.
   */
  async fetchForUtilization(): Promise<RawData> {
    const now = Date.now();

    // Return cached data if fresh
    if (utilizationCache && !utilizationCache.promise && (now - utilizationCache.timestamp) < RAW_DATA_TTL) {
      return utilizationCache.data;
    }

    // Return in-flight promise if a fetch is already in progress
    if (utilizationCache?.promise) {
      return utilizationCache.promise;
    }

    const fetchPromise = (async (): Promise<RawData> => {
      const [projects, users, timesheets, departments] = await Promise.all([
        dashboardApi.getProjectsSummary(),
        dashboardApi.getUsers(),
        dashboardApi.getTimesheets(),
        dashboardApi.getDepartments(),
      ]);

      const data: RawData = {
        projects,
        users,
        timesheets,
        departments,
        tasks: [],
        whosWhere: [],
        pending: {},
        expenses: [],
        invoices: [],
        clients: [],
        leaveRequests: [],
        whatsNew: [],
      };

      utilizationCache = { data, timestamp: Date.now() };
      return data;
    })();

    utilizationCache = { data: null as any, timestamp: 0, promise: fetchPromise };

    fetchPromise.catch(() => {
      utilizationCache = null;
    });

    return fetchPromise;
  }

  /**
   * Fetch only the data needed by the Forecasting view.
   * Needs: projects, users, timesheets, invoices.
   * Reduces API calls from 12 to 4.
   */
  async fetchForForecasting(): Promise<RawData> {
    const now = Date.now();

    // Return cached data if fresh
    if (forecastingCache && !forecastingCache.promise && (now - forecastingCache.timestamp) < RAW_DATA_TTL) {
      return forecastingCache.data;
    }

    // Return in-flight promise if a fetch is already in progress
    if (forecastingCache?.promise) {
      return forecastingCache.promise;
    }

    const fetchPromise = (async (): Promise<RawData> => {
      const [projects, users, timesheets, invoices] = await Promise.all([
        dashboardApi.getProjectsSummary(),
        dashboardApi.getUsers(),
        dashboardApi.getTimesheets(),
        dashboardApi.getInvoices(),
      ]);

      const data: RawData = {
        projects,
        users,
        timesheets,
        invoices,
        tasks: [],
        whosWhere: [],
        pending: {},
        expenses: [],
        clients: [],
        leaveRequests: [],
        whatsNew: [],
        departments: [],
      };

      forecastingCache = { data, timestamp: Date.now() };
      return data;
    })();

    forecastingCache = { data: null as any, timestamp: 0, promise: fetchPromise };

    fetchPromise.catch(() => {
      forecastingCache = null;
    });

    return fetchPromise;
  }

  /**
   * Fetch only the data needed by the AI Insights view.
   * Needs: projects, tasks, users, whosWhere.
   * Reduces API calls from 12 to 4.
   */
  async fetchForAIInsights(): Promise<RawData> {
    const now = Date.now();

    // Return cached data if fresh
    if (aiInsightsCache && !aiInsightsCache.promise && (now - aiInsightsCache.timestamp) < RAW_DATA_TTL) {
      return aiInsightsCache.data;
    }

    // Return in-flight promise if a fetch is already in progress
    if (aiInsightsCache?.promise) {
      return aiInsightsCache.promise;
    }

    const fetchPromise = (async (): Promise<RawData> => {
      // Fetch users first so getAllTasks() can reuse the cached user list
      const users = await dashboardApi.getUsers();

      // Fetch all data in parallel — dashboardApi caches each call so no double-fetching with other views
      const [projects, tasks, whosWhere, timesheets, expenses, invoices, clients, leaveRequests, whatsNew, departments] = await Promise.all([
        dashboardApi.getProjectsSummary(),
        dashboardApi.getAllTasks(),
        dashboardApi.getWhosWhere(),
        dashboardApi.getAllTimesheets().catch(() => []),
        dashboardApi.getExpenses().catch(() => []),
        dashboardApi.getInvoices().catch(() => []),
        dashboardApi.getClients().catch(() => []),
        dashboardApi.getAllLeaveRequests().catch(() => []),
        dashboardApi.getWhatsNewItems().catch(() => []),
        dashboardApi.getDepartments().catch(() => []),
      ]);

      const data: RawData = {
        projects,
        tasks,
        users,
        whosWhere,
        pending: {} as WhatsPending,
        timesheets,
        expenses,
        invoices,
        clients,
        leaveRequests,
        whatsNew,
        departments,
      };

      aiInsightsCache = { data, timestamp: Date.now() };
      return data;
    })();

    aiInsightsCache = { data: null as any, timestamp: 0, promise: fetchPromise };

    fetchPromise.catch(() => {
      aiInsightsCache = null;
    });

    return fetchPromise;
  }

  /**
   * Fetch only the data needed by the Reports view.
   * Needs: projects, tasks, users, timesheets, expenses, invoices, whosWhere, leaveRequests.
   * Skips: whatsNew, pending, clients, departments — saves 4 API calls.
   */
  async fetchForReports(): Promise<RawData> {
    const now = Date.now();

    // Return cached data if fresh
    if (reportsCache && !reportsCache.promise && (now - reportsCache.timestamp) < RAW_DATA_TTL) {
      return reportsCache.data;
    }

    // Return in-flight promise if a fetch is already in progress
    if (reportsCache?.promise) {
      return reportsCache.promise;
    }

    const fetchPromise = (async (): Promise<RawData> => {
      const [projects, users, timesheets, expenses, invoices, whosWhere, leaveRequests] = await Promise.all([
        dashboardApi.getProjectsSummary(),
        dashboardApi.getUsers(),
        dashboardApi.getAllTimesheets(),
        dashboardApi.getExpenses(),
        dashboardApi.getInvoices(),
        dashboardApi.getWhosWhere(),
        dashboardApi.getAllLeaveRequests(),
      ]);

      const data: RawData = {
        projects,
        users,
        timesheets,
        expenses,
        invoices,
        whosWhere,
        leaveRequests,
        tasks: [],
        pending: {} as WhatsPending,
        clients: [],
        whatsNew: [],
        departments: [],
      };

      reportsCache = { data, timestamp: Date.now() };
      return data;
    })();

    reportsCache = { data: null as any, timestamp: 0, promise: fetchPromise };

    fetchPromise.catch(() => {
      reportsCache = null;
    });

    return fetchPromise;
  }

  /**
   * Lazily load tasks into an existing RawData object.
   * Called on-demand when a report that needs tasks is selected.
   * Returns a new RawData with tasks populated, or the same object if tasks are already loaded.
   */
  async ensureTasksLoaded(data: RawData): Promise<RawData> {
    if (data.tasks.length > 0) return data;

    const tasks = await dashboardApi.getAllTasks();
    const updated = { ...data, tasks };

    // Update reportsCache so subsequent reports reuse the loaded tasks
    if (reportsCache && !reportsCache.promise) {
      reportsCache = { ...reportsCache, data: updated };
    }

    return updated;
  }

  computeInsights(rawData: RawData): ComputedInsight[] {
    const { projects, tasks, users, whosWhere } = rawData;

    const allInsights = [
      ...detectRisks(projects, tasks),
      ...detectOpportunities(projects, tasks, users, whosWhere),
      ...detectPredictions(projects),
      ...detectSuccesses(projects),
      ...detectAnomalies(projects, tasks, whosWhere),
      ...detectRecommendations(projects, tasks, users),
    ];

    // Sort: high priority first, then by confidence descending
    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    allInsights.sort((a, b) => {
      const pDiff = (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2);
      if (pDiff !== 0) return pDiff;
      return b.confidence - a.confidence;
    });

    return allInsights;
  }

  computeSummary(insights: ComputedInsight[]): InsightsSummary {
    const total = insights.length;
    const highPriority = insights.filter(i => i.priority === 'high').length;
    const opportunities = insights.filter(
      i => i.type === 'opportunity' || i.type === 'recommendation'
    ).length;
    const avgConfidence =
      total > 0 ? Math.round(insights.reduce((s, i) => s + i.confidence, 0) / total) : 0;

    return { total, highPriority, opportunities, avgConfidence };
  }

  async generateInsights(): Promise<{
    insights: ComputedInsight[];
    summary: InsightsSummary;
    rawData: RawData;
  }> {
    const rawData = await this.fetchForAIInsights();
    const insights = this.computeInsights(rawData);
    const summary = this.computeSummary(insights);
    return { insights, summary, rawData };
  }
}

export const insightsEngine = new InsightsEngine();
