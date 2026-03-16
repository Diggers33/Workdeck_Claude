/**
 * useReports Hook
 * Composes the reports engine for the ReportsView component.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { insightsEngine } from '../services/insights-engine';
import { RawData } from '../services/insights-engine';
import { dashboardApi } from '../services/dashboard-api';
import {
  getReportDefinitions,
  generateReport,
  ReportDefinition,
  ReportResult,
  ReportFilters,
} from '../services/reports-engine';

const FAVORITES_KEY = 'workdeck-report-favorites';
const LAST_RUN_KEY = 'workdeck-report-last-run';

function loadFavorites(): Set<string> {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function saveFavorites(favorites: Set<string>): void {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(favorites)));
}

function loadLastRun(): Record<string, string> {
  try {
    const stored = localStorage.getItem(LAST_RUN_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveLastRun(reportId: string): void {
  const runs = loadLastRun();
  runs[reportId] = new Date().toISOString();
  localStorage.setItem(LAST_RUN_KEY, JSON.stringify(runs));
}

function formatLastRun(iso?: string): string {
  if (!iso) return 'Never';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

export function useReports() {
  const reports = useMemo(() => getReportDefinitions(), []);
  const [rawData, setRawData] = useState<RawData | null>(null);
  const [selectedReport, setSelectedReport] = useState<ReportDefinition | null>(null);
  const [reportResult, setReportResult] = useState<ReportResult | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(loadFavorites);
  const [lastRunTimes, setLastRunTimes] = useState<Record<string, string>>(loadLastRun);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<ReportFilters>({
    dateRange: 'last-30-days',
    projectFilter: 'all',
    teamFilter: 'all',
  });

  // Refs to always access latest values — avoids stale closures
  const rawDataRef = useRef<RawData | null>(null);
  const selectedReportRef = useRef<ReportDefinition | null>(null);
  rawDataRef.current = rawData;
  selectedReportRef.current = selectedReport;

  // Departments extracted from rawData
  const departments = useMemo(() => {
    if (!rawData) return [];
    if (rawData.departments.length > 0) return rawData.departments;
    // Fallback: extract from users using safe accessor
    return Array.from(new Set(rawData.users.map(u => {
      const dept = u.department?.name || (u as any).departmentName || (typeof (u as any).department === 'string' ? (u as any).department : '');
      return dept;
    }).filter(Boolean) as string[]));
  }, [rawData]);

  // Project list for the project picker filter
  const projectList = useMemo(() => {
    if (!rawData) return [];
    return rawData.projects.map(p => ({ id: p.id, name: p.name }));
  }, [rawData]);

  // Background prefetch: warm caches while user browses the report list (non-blocking)
  useEffect(() => {
    insightsEngine.fetchForReports().catch(() => {});
    dashboardApi.getAllTasks().catch(() => {});
  }, []);

  // Reports that require task data (lazy-loaded to avoid 73 per-user API calls)
  const TASK_REPORTS = new Set(['project-completion', 'project-risk', 'team-utilization', 'dept-workload']);

  // Core generation function — fetches data on demand, then generates
  const runGeneration = useCallback(async (reportId: string, reportFilters: ReportFilters) => {
    setIsGenerating(true);
    setError(null);
    try {
      // Fetch base report data if not yet loaded
      let data = rawDataRef.current;
      if (!data) {
        data = await insightsEngine.fetchForReports();
        setRawData(data);
      }

      // Lazily load tasks only for reports that need them
      if (TASK_REPORTS.has(reportId) && data.tasks.length === 0) {
        data = await insightsEngine.ensureTasksLoaded(data);
        setRawData(data);
      }

      const result = generateReport(reportId, data, reportFilters);
      setReportResult(result);
      saveLastRun(reportId);
      setLastRunTimes(loadLastRun());
    } catch (err) {
      console.error('Report generation failed:', err);
      setError(err instanceof Error ? err.message : 'Report generation failed');
      setReportResult({
        metrics: [{ label: 'Error', value: 'N/A', change: 'Generation failed', positive: false }],
      });
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // Select a report and generate it
  const selectReport = useCallback((reportId: string) => {
    const def = reports.find(r => r.id === reportId);
    if (!def) return;
    setSelectedReport(def);
    runGeneration(reportId, filters);
  }, [reports, filters, runGeneration]);

  // Apply new filters and re-generate the current report
  const applyFilters = useCallback((newFilters: ReportFilters) => {
    setFiltersState(newFilters);
    const report = selectedReportRef.current;
    if (report) {
      runGeneration(report.id, newFilters);
    }
  }, [runGeneration]);

  // Clear selected report
  const clearReport = useCallback(() => {
    setSelectedReport(null);
    setReportResult(null);
  }, []);

  // Toggle favorite
  const toggleFavorite = useCallback((reportId: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(reportId)) {
        next.delete(reportId);
      } else {
        next.add(reportId);
      }
      saveFavorites(next);
      return next;
    });
  }, []);

  // Retry: clear cached data and re-generate the current report
  const retry = useCallback(() => {
    setRawData(null);
    setError(null);
    setReportResult(null);
    insightsEngine.invalidateRawDataCache();
    const report = selectedReportRef.current;
    if (report) {
      runGeneration(report.id, filters);
    }
  }, [filters, runGeneration]);

  // Enriched reports with favorites and last run
  const enrichedReports = useMemo(() => {
    return reports.map(r => ({
      ...r,
      isFavorite: favorites.has(r.id),
      lastRun: formatLastRun(lastRunTimes[r.id]),
    }));
  }, [reports, favorites, lastRunTimes]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: reports.length };
    for (const r of reports) {
      counts[r.category] = (counts[r.category] || 0) + 1;
    }
    return counts;
  }, [reports]);

  // Favorite reports
  const favoriteReports = useMemo(() => {
    return enrichedReports.filter(r => r.isFavorite);
  }, [enrichedReports]);

  return {
    reports: enrichedReports,
    categoryCounts,
    favoriteReports,
    selectedReport,
    reportResult,
    isLoading,
    isGenerating,
    error,
    filters,
    setFilters: applyFilters,
    departments,
    projectList,
    selectReport,
    clearReport,
    toggleFavorite,
    retry,
  };
}
