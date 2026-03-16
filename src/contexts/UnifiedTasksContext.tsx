/**
 * Unified Tasks Context
 *
 * Single source of truth for task data across all views:
 * - My Tasks (personal kanban board)
 * - Gantt View (project timeline)
 * - Project Board (project kanban)
 * - Calendar (task-linked events)
 * - Task Modals (full task details)
 *
 * Features:
 * - O(1) task lookup by ID
 * - Lazy loading (fetch user tasks on load, project tasks on demand)
 * - Automatic refresh on timer stop
 * - Optimistic updates with rollback
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { apiClient } from '../services/api-client';
import { useAuth } from './AuthContext';
import type { Task, ColumnData, TaskParticipant } from '../types/task';
import {
  mapApiTaskToTask,
  mapAndOrganizeTasksByColumn,
  mapApiParticipant,
  convertDateFromApi,
} from '../services/task-mapper';

// ============================================================================
// Context Type Definition
// ============================================================================

interface UnifiedTasksContextType {
  // ===== Data =====
  /** All tasks indexed by ID (O(1) lookup) */
  tasks: Map<string, Task>;

  /** Personal board columns (My Tasks) */
  columns: ColumnData[];

  /** Project IDs that have been loaded */
  loadedProjects: Set<string>;

  // ===== Loading States =====
  isLoading: boolean;
  isLoadingProject: (projectId: string) => boolean;
  error: string | null;

  // ===== Data Fetching =====
  /** Fetch current user's tasks (My Tasks board) */
  fetchUserTasks: () => Promise<void>;

  /** Fetch tasks for a specific project (Gantt/Board) */
  fetchProjectTasks: (projectId: string) => Promise<Task[]>;

  /** Refresh a single task from API */
  refreshTask: (taskId: string) => Promise<Task | undefined>;

  /** Full refresh (user tasks + clear project cache) */
  refreshAll: () => Promise<void>;

  // ===== Data Mutations =====
  /** Update a task locally (optimistic) */
  updateTask: (taskId: string, updates: Partial<Task>) => void;

  /** Add a new task to the cache */
  addTask: (task: Task) => void;

  /** Remove a task from the cache */
  deleteTask: (taskId: string) => void;

  /** Move task between columns (with API call) */
  moveTask: (taskId: string, newColumnId: string, position?: number) => Promise<void>;

  // ===== Column Management =====
  setColumns: (columns: ColumnData[]) => void;
  createColumn: (name: string, color: string) => Promise<void>;
  updateColumn: (columnId: string, name: string, color: string) => Promise<void>;
  deleteColumn: (columnId: string) => Promise<void>;

  // ===== Timer Integration =====
  /** Called when timer stops - refreshes task and project data */
  onTimerStop: (taskId: string, projectId?: string) => Promise<void>;

  // ===== Selectors =====
  /** Get a single task by ID */
  getTask: (taskId: string) => Task | undefined;

  /** Get all tasks for a project */
  getTasksForProject: (projectId: string) => Task[];

  /** Get all tasks for current user */
  getTasksForUser: () => Task[];

  /** Get tasks for a specific column */
  getTasksForColumn: (columnId: string) => Task[];

  // ===== Backwards Compatibility =====
  /** Legacy: tasks as Record<string, Task> for existing components */
  tasksRecord: Record<string, Task>;
}

const UnifiedTasksContext = createContext<UnifiedTasksContextType | undefined>(undefined);

// ============================================================================
// Provider Implementation
// ============================================================================

export function UnifiedTasksProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();

  // Core state
  const [tasksMap, setTasksMap] = useState<Map<string, Task>>(new Map());
  const [columns, setColumns] = useState<ColumnData[]>([]);
  const [loadedProjects, setLoadedProjects] = useState<Set<string>>(new Set());
  const [loadingProjects, setLoadingProjects] = useState<Set<string>>(new Set());

  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ===== Fetch Columns =====
  const fetchColumns = useCallback(async (): Promise<ColumnData[]> => {
    try {
      const response = await apiClient.get('/queries/columns') as any;
      const apiColumns = response?.result || response || [];

      return apiColumns
        .map((col: any) => ({
          id: col.id,
          name: col.name,
          color: col.color || '#6B7280',
          position: col.position ?? 99,
          isSystem: col.isSystem,
          systemCode: col.systemCode,
          taskIds: [],
        }))
        .sort((a: any, b: any) => a.position - b.position);
    } catch (err) {
      console.error('[UnifiedTasks] Failed to fetch columns:', err);
      return [];
    }
  }, []);

  // ===== Fetch User Tasks =====
  const fetchUserTasks = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const [columnsData, tasksResponse] = await Promise.all([
        fetchColumns(),
        apiClient.get(`/queries/tasks/user/${user.id}`) as Promise<any>,
      ]);

      const apiTasks = tasksResponse?.result || tasksResponse || [];

      // Map tasks and organize by column
      const newTasksMap = new Map<string, Task>();
      const tasksByColumn = new Map<string, string[]>();

      apiTasks.forEach((apiTask: any) => {
        const task = mapApiTaskToTask(apiTask, user.id);
        newTasksMap.set(task.id, task);

        if (task.columnId) {
          if (!tasksByColumn.has(task.columnId)) {
            tasksByColumn.set(task.columnId, []);
          }
          tasksByColumn.get(task.columnId)!.push(task.id);
        }
      });

      // Merge with existing tasks (preserve project tasks)
      setTasksMap(prev => {
        const merged = new Map(prev);
        newTasksMap.forEach((task, id) => {
          merged.set(id, task);
        });
        return merged;
      });

      // Update columns with task IDs
      const columnsWithTasks = columnsData.map(col => ({
        ...col,
        taskIds: tasksByColumn.get(col.id) || [],
      }));

      setColumns(columnsWithTasks);
      console.log('[UnifiedTasks] Loaded', newTasksMap.size, 'user tasks');

    } catch (err) {
      console.error('[UnifiedTasks] Failed to fetch user tasks:', err);
      setError('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, fetchColumns]);

  // ===== Fetch Project Tasks =====
  const fetchProjectTasks = useCallback(async (projectId: string): Promise<Task[]> => {
    if (!projectId) return [];

    // Mark as loading
    setLoadingProjects(prev => new Set(prev).add(projectId));

    try {
      // Fetch project details with tasks
      const response = await apiClient.get(`/queries/projects/${projectId}`) as any;
      const projectData = response?.result || response;

      const projectTasks: Task[] = [];

      // Extract tasks from activities
      if (projectData?.activities) {
        projectData.activities.forEach((activity: any) => {
          (activity.tasks || []).forEach((apiTask: any) => {
            // Enrich task with activity/project info
            const enrichedTask = {
              ...apiTask,
              activity: {
                id: activity.id,
                name: activity.name,
                project: {
                  id: projectId,
                  name: projectData.name,
                  color: projectData.color,
                },
              },
            };

            const task = mapApiTaskToTask(enrichedTask, user?.id);
            projectTasks.push(task);
          });
        });
      }

      // Also try to fetch spentHours from gantt-plus endpoint
      try {
        const ganttDetails = await apiClient.get(`/queries/gantt-plus/${projectId}/details`) as any;
        const details = ganttDetails?.result || ganttDetails || [];

        // Create lookup map for spentHours
        const spentHoursMap = new Map<string, number>();
        details.forEach((d: any) => {
          const taskId = d.task_id || d.taskId || d.id;
          if (taskId && d.spentHours) {
            spentHoursMap.set(taskId, parseFloat(d.spentHours));
          }
        });

        // Update tasks with spentHours
        projectTasks.forEach(task => {
          const spent = spentHoursMap.get(task.id);
          if (spent !== undefined) {
            task.spentHours = spent;
            task.timeLogged = Math.round(spent * 60);
          }
        });
      } catch (err) {
        console.warn('[UnifiedTasks] Could not fetch gantt-plus details:', err);
      }

      // Add to cache
      setTasksMap(prev => {
        const merged = new Map(prev);
        projectTasks.forEach(task => {
          merged.set(task.id, task);
        });
        return merged;
      });

      // Mark project as loaded
      setLoadedProjects(prev => new Set(prev).add(projectId));

      console.log('[UnifiedTasks] Loaded', projectTasks.length, 'tasks for project', projectId);
      return projectTasks;

    } catch (err) {
      console.error('[UnifiedTasks] Failed to fetch project tasks:', err);
      throw err;
    } finally {
      setLoadingProjects(prev => {
        const next = new Set(prev);
        next.delete(projectId);
        return next;
      });
    }
  }, [user?.id]);

  // ===== Refresh Single Task =====
  const refreshTask = useCallback(async (taskId: string): Promise<Task | undefined> => {
    try {
      const response = await apiClient.get(`/queries/tasks/${taskId}`) as any;
      const apiTask = response?.result || response;

      if (!apiTask) return undefined;

      const task = mapApiTaskToTask(apiTask, user?.id);

      // Update cache
      setTasksMap(prev => {
        const next = new Map(prev);
        next.set(task.id, task);
        return next;
      });

      console.log('[UnifiedTasks] Refreshed task', taskId);
      return task;

    } catch (err) {
      console.error('[UnifiedTasks] Failed to refresh task:', err);
      return undefined;
    }
  }, [user?.id]);

  // ===== Refresh All =====
  const refreshAll = useCallback(async () => {
    // Clear project cache
    setLoadedProjects(new Set());

    // Refetch user tasks
    await fetchUserTasks();
  }, [fetchUserTasks]);

  // ===== Timer Stop Handler =====
  const onTimerStop = useCallback(async (taskId: string, projectId?: string) => {
    console.log('[UnifiedTasks] Timer stopped for task', taskId);

    // Refresh the specific task
    await refreshTask(taskId);

    // Refresh user tasks to update board
    await fetchUserTasks();

    // If we know the project, refresh project tasks too
    if (projectId && loadedProjects.has(projectId)) {
      await fetchProjectTasks(projectId);
    }
  }, [refreshTask, fetchUserTasks, fetchProjectTasks, loadedProjects]);

  // ===== Update Task =====
  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setTasksMap(prev => {
      const next = new Map(prev);
      const existing = next.get(taskId);
      if (existing) {
        next.set(taskId, { ...existing, ...updates });
      }
      return next;
    });
  }, []);

  // ===== Add Task =====
  const addTask = useCallback((task: Task) => {
    setTasksMap(prev => {
      const next = new Map(prev);
      next.set(task.id, task);
      return next;
    });
  }, []);

  // ===== Delete Task =====
  const deleteTask = useCallback((taskId: string) => {
    setTasksMap(prev => {
      const next = new Map(prev);
      next.delete(taskId);
      return next;
    });
  }, []);

  // ===== Move Task =====
  const moveTask = useCallback(async (taskId: string, newColumnId: string, position: number = 0) => {
    const task = tasksMap.get(taskId);
    if (!task) return;

    const oldColumnId = task.columnId;

    // Optimistic update
    setTasksMap(prev => {
      const next = new Map(prev);
      const t = next.get(taskId);
      if (t) {
        next.set(taskId, { ...t, columnId: newColumnId });
      }
      return next;
    });

    setColumns(prev => prev.map(col => {
      if (col.id === oldColumnId) {
        return { ...col, taskIds: col.taskIds.filter(id => id !== taskId) };
      }
      if (col.id === newColumnId) {
        const newTaskIds = [...col.taskIds];
        newTaskIds.splice(position, 0, taskId);
        return { ...col, taskIds: newTaskIds };
      }
      return col;
    }));

    try {
      await apiClient.post('/commands/sync/move-task', {
        id: taskId,
        column: { id: newColumnId },
        position,
      });
    } catch (err) {
      console.error('[UnifiedTasks] Failed to move task:', err);

      // Rollback
      setTasksMap(prev => {
        const next = new Map(prev);
        const t = next.get(taskId);
        if (t) {
          next.set(taskId, { ...t, columnId: oldColumnId });
        }
        return next;
      });

      setColumns(prev => prev.map(col => {
        if (col.id === newColumnId) {
          return { ...col, taskIds: col.taskIds.filter(id => id !== taskId) };
        }
        if (col.id === oldColumnId) {
          return { ...col, taskIds: [...col.taskIds, taskId] };
        }
        return col;
      }));

      throw err;
    }
  }, [tasksMap]);

  // ===== Column Management =====
  const createColumn = useCallback(async (name: string, color: string) => {
    const position = columns.length;

    await apiClient.post('/commands/sync/create-column-board', {
      name,
      color,
      position,
      isSystem: false,
    });

    await fetchUserTasks();
  }, [columns.length, fetchUserTasks]);

  const updateColumn = useCallback(async (columnId: string, name: string, color: string) => {
    const column = columns.find(c => c.id === columnId);
    if (!column) return;

    await apiClient.post('/commands/sync/update-column-board', {
      id: columnId,
      name,
      color,
      position: column.position,
      isSystem: column.isSystem,
      systemCode: (column as any).systemCode,
    });

    setColumns(prev => prev.map(col =>
      col.id === columnId ? { ...col, name, color } : col
    ));
  }, [columns]);

  const deleteColumn = useCallback(async (columnId: string) => {
    await apiClient.post('/commands/sync/delete-column-board', { id: columnId });
    setColumns(prev => prev.filter(col => col.id !== columnId));
  }, []);

  // ===== Selectors =====
  const getTask = useCallback((taskId: string): Task | undefined => {
    return tasksMap.get(taskId);
  }, [tasksMap]);

  const getTasksForProject = useCallback((projectId: string): Task[] => {
    const result: Task[] = [];
    tasksMap.forEach(task => {
      if (task.projectId === projectId) {
        result.push(task);
      }
    });
    return result;
  }, [tasksMap]);

  const getTasksForUser = useCallback((): Task[] => {
    // Return tasks that have a columnId (are on user's board)
    const result: Task[] = [];
    tasksMap.forEach(task => {
      if (task.columnId) {
        result.push(task);
      }
    });
    return result;
  }, [tasksMap]);

  const getTasksForColumn = useCallback((columnId: string): Task[] => {
    const column = columns.find(c => c.id === columnId);
    if (!column) return [];

    return column.taskIds
      .map(id => tasksMap.get(id))
      .filter((t): t is Task => t !== undefined);
  }, [tasksMap, columns]);

  const isLoadingProject = useCallback((projectId: string): boolean => {
    return loadingProjects.has(projectId);
  }, [loadingProjects]);

  // ===== Backwards Compatibility =====
  const tasksRecord = useMemo((): Record<string, Task> => {
    const record: Record<string, Task> = {};
    tasksMap.forEach((task, id) => {
      record[id] = task;
    });
    return record;
  }, [tasksMap]);

  // ===== Auto-fetch on mount =====
  useEffect(() => {
    if (!authLoading && user?.id) {
      fetchUserTasks();
    }
  }, [user?.id, authLoading, fetchUserTasks]);

  // ===== Context Value =====
  const value: UnifiedTasksContextType = {
    // Data
    tasks: tasksMap,
    columns,
    loadedProjects,

    // Loading
    isLoading,
    isLoadingProject,
    error,

    // Fetching
    fetchUserTasks,
    fetchProjectTasks,
    refreshTask,
    refreshAll,

    // Mutations
    updateTask,
    addTask,
    deleteTask,
    moveTask,

    // Columns
    setColumns,
    createColumn,
    updateColumn,
    deleteColumn,

    // Timer
    onTimerStop,

    // Selectors
    getTask,
    getTasksForProject,
    getTasksForUser,
    getTasksForColumn,

    // Backwards compat
    tasksRecord,
  };

  return (
    <UnifiedTasksContext.Provider value={value}>
      {children}
    </UnifiedTasksContext.Provider>
  );
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Main hook for accessing unified task data
 */
export function useUnifiedTasks() {
  const context = useContext(UnifiedTasksContext);
  if (context === undefined) {
    throw new Error('useUnifiedTasks must be used within a UnifiedTasksProvider');
  }
  return context;
}

/**
 * Hook for backwards compatibility with existing TasksContext consumers
 * Returns the same shape as the old useTasks() hook
 */
export function useTasksCompat() {
  const ctx = useUnifiedTasks();

  return {
    tasks: ctx.tasksRecord,
    columns: ctx.columns,
    isLoading: ctx.isLoading,
    error: ctx.error,
    updateTask: ctx.updateTask,
    addTask: ctx.addTask,
    deleteTask: ctx.deleteTask,
    moveTask: ctx.moveTask,
    setColumns: ctx.setColumns,
    refreshTasks: ctx.fetchUserTasks,
    createColumn: ctx.createColumn,
    updateColumn: ctx.updateColumn,
    deleteColumn: ctx.deleteColumn,
  };
}

/**
 * Hook for project-specific task data (Gantt, Project Board)
 */
export function useProjectTasks(projectId: string | undefined) {
  const ctx = useUnifiedTasks();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!projectId) {
      setTasks([]);
      return;
    }

    // Check if already loaded
    if (ctx.loadedProjects.has(projectId)) {
      setTasks(ctx.getTasksForProject(projectId));
      return;
    }

    // Fetch if not loaded
    setIsLoading(true);
    ctx.fetchProjectTasks(projectId)
      .then(fetchedTasks => {
        setTasks(fetchedTasks);
      })
      .catch(err => {
        console.error('[useProjectTasks] Failed to load:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [projectId, ctx.loadedProjects, ctx.fetchProjectTasks, ctx.getTasksForProject]);

  // Update tasks when cache changes
  useEffect(() => {
    if (projectId && ctx.loadedProjects.has(projectId)) {
      setTasks(ctx.getTasksForProject(projectId));
    }
  }, [projectId, ctx.tasks, ctx.loadedProjects, ctx.getTasksForProject]);

  return {
    tasks,
    isLoading: isLoading || (projectId ? ctx.isLoadingProject(projectId) : false),
    refresh: () => projectId ? ctx.fetchProjectTasks(projectId) : Promise.resolve([]),
  };
}

/**
 * Hook for a single task with auto-refresh capability
 */
export function useTask(taskId: string | undefined) {
  const ctx = useUnifiedTasks();
  const task = taskId ? ctx.getTask(taskId) : undefined;

  const refresh = useCallback(() => {
    if (taskId) {
      return ctx.refreshTask(taskId);
    }
    return Promise.resolve(undefined);
  }, [taskId, ctx.refreshTask]);

  return {
    task,
    refresh,
    isLoading: ctx.isLoading,
  };
}
