/**
 * useResourceData - Data fetching hook for ResourcePlanner
 *
 * Handles all API calls and data management.
 * Separating data logic from UI components.
 */

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../../services/api-client';
import { TeamMember, Assignment, ConflictWarning, ProjectSummary, HOURS_PER_PERSON_MONTH } from '../types';
import { parseDate } from '../utils';

// Project colors palette
const PROJECT_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
];

function hoursToPM(hours: number): number {
  return Math.round((hours / HOURS_PER_PERSON_MONTH) * 100) / 100;
}

interface UseResourceDataReturn {
  teamMembers: TeamMember[];
  projectsList: ProjectSummary[];
  departmentsList: { id: string; name: string }[];
  isLoading: boolean;
  isLoadingGanttData: boolean;
  ganttLoadProgress: { loaded: number; total: number };
  error: string | null;
  refreshData: () => Promise<void>;
  updateMemberCapacity: (memberId: string, capacity: number) => void;
}

export function useResourceData(): UseResourceDataReturn {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [projectsList, setProjectsList] = useState<ProjectSummary[]>([]);
  const [departmentsList, setDepartmentsList] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingGanttData, setIsLoadingGanttData] = useState(false);
  const [ganttLoadProgress, setGanttLoadProgress] = useState({ loaded: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [capacityEdits, setCapacityEdits] = useState<Record<string, number>>({});

  const loadResourceData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch summary data
      const [usersResponse, departmentsResponse, projectsResponse] = await Promise.all([
        apiClient.get('/queries/users-summary') as Promise<any>,
        apiClient.get('/queries/departments') as Promise<any>,
        apiClient.get('/queries/projects-summary') as Promise<any>
      ]);

      const users = Array.isArray(usersResponse) ? usersResponse : usersResponse?.result || usersResponse?.data || [];
      const depts = Array.isArray(departmentsResponse) ? departmentsResponse : departmentsResponse?.result || departmentsResponse?.data || [];
      const projects = Array.isArray(projectsResponse) ? projectsResponse : projectsResponse?.result || projectsResponse?.data || [];

      // Process departments
      const deptList = depts
        .map((d: any) => ({ id: d.id || d.name || d, name: d.name || d }))
        .filter((d: any) => d.name && typeof d.name === 'string');
      setDepartmentsList(deptList);

      // Process projects
      const projList = projects.map((p: any, idx: number) => ({
        id: p.id,
        name: p.name,
        color: p.color || PROJECT_COLORS[idx % PROJECT_COLORS.length],
        code: p.code
      }));
      setProjectsList(projList);

      // Build team members without assignments initially
      const enabledUsers = users.filter((u: any) => u.enabled !== false && !u.isGuest);
      const membersWithTasks = enabledUsers.map((user: any) => {
        const deptName = user.department?.name || user.departmentName || user.department || 'General';
        const deptId = user.department?.id || user.departmentId || deptName;
        const capacity = capacityEdits[user.id] || 40;

        return {
          id: user.id,
          name: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown',
          role: user.jobTitle || user.role || 'Team Member',
          department: typeof deptName === 'string' ? deptName : 'General',
          departmentId: typeof deptId === 'string' ? deptId : undefined,
          location: user.office?.name || user.location || 'Remote',
          avatar: user.avatar,
          skills: user.skills || [],
          capacity,
          allocation: 0,
          assignments: [] as Assignment[],
          leave: [],
          conflicts: [] as ConflictWarning[]
        };
      });

      setTeamMembers(membersWithTasks);
      setIsLoading(false);

      // Start background loading
      loadAllGanttDataInBackground(projList, membersWithTasks);

    } catch (err) {
      console.error('Failed to load resource data:', err);
      setError('Failed to load resource data');
      setIsLoading(false);
    }
  }, [capacityEdits]);

  const loadAllGanttDataInBackground = async (projects: ProjectSummary[], initialMembers: TeamMember[]) => {
    if (projects.length === 0) return;

    setIsLoadingGanttData(true);
    setGanttLoadProgress({ loaded: 0, total: projects.length });

    const allAssignments: { userId: string; assignment: Assignment }[] = [];
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    let loadedCount = 0;

    const BATCH_SIZE = 5;

    for (let i = 0; i < projects.length; i += BATCH_SIZE) {
      const batch = projects.slice(i, i + BATCH_SIZE);

      const batchPromises = batch.map(async (project) => {
        try {
          const ganttResponse = await apiClient.get(`/queries/gantt-plus/${project.id}?resolution=month`) as any;
          const activities = ganttResponse?.result?.activities || ganttResponse?.activities || [];

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

          return { project, tasks, success: true };
        } catch (e) {
          console.warn(`Failed to fetch gantt-plus for ${project.name}:`, e);
          return { project, tasks: [], success: false };
        }
      });

      const batchResults = await Promise.all(batchPromises);

      batchResults.forEach(({ project, tasks }) => {
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

            allAssignments.push({ userId: participantUserId, assignment });
          });
        });

        loadedCount++;
      });

      setGanttLoadProgress({ loaded: loadedCount, total: projects.length });
    }

    // Single state update with all assignments
    if (allAssignments.length > 0) {
      setTeamMembers(prev => prev.map(member => {
        const memberAssignments = allAssignments
          .filter(a => a.userId === member.id)
          .map(a => a.assignment);

        if (memberAssignments.length === 0) return member;

        const existingIds = new Set(member.assignments.map(a => a.id));
        const newOnes = memberAssignments.filter(a => !existingIds.has(a.id));

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

        return {
          ...member,
          assignments: allMemberAssignments,
          allocation,
          conflicts
        };
      }));
    }

    setIsLoadingGanttData(false);
  };

  const updateMemberCapacity = useCallback((memberId: string, capacity: number) => {
    setCapacityEdits(prev => ({ ...prev, [memberId]: capacity }));
    setTeamMembers(prev => prev.map(m =>
      m.id === memberId ? { ...m, capacity } : m
    ));
  }, []);

  useEffect(() => {
    loadResourceData();
  }, []);

  return {
    teamMembers,
    projectsList,
    departmentsList,
    isLoading,
    isLoadingGanttData,
    ganttLoadProgress,
    error,
    refreshData: loadResourceData,
    updateMemberCapacity,
  };
}
