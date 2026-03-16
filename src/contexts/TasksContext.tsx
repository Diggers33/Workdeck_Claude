/**
 * @deprecated This context is being replaced by UnifiedTasksContext.
 * New code should use useUnifiedTasks() or useTasksCompat() from UnifiedTasksContext.
 * This file is kept for backwards compatibility during migration.
 *
 * Migration status:
 * - MyTasksBoard: migrated to useTasksCompat()
 * - GanttView: migrated to useUnifiedTasks()
 * - App.tsx: uses both (unified as primary)
 *
 * TODO: Remove this file once all consumers have migrated.
 */
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { apiClient } from '../services/api-client';
import { useAuth } from './AuthContext';

export interface Task {
  id: string;
  title: string;
  projectId: string;
  projectName: string;
  projectColor: string;
  status: 'Open' | 'In Progress' | 'In Review' | 'Done';
  dueDate?: string;
  priority: 'High' | 'Medium' | 'Low';
  commentsCount: number;
  description?: string;
  subtasksCompleted?: number;
  subtasksTotal?: number;
  parentActivity?: string;
  timeEstimate?: number; // in minutes
  timeLogged?: number; // in minutes
  waitingOn?: string;
  watchers?: number;
  tags?: Array<{ id: string; name: string; color: string }>;
  assignedTo?: string; // user ID or name
  columnId?: string; // for project board
  // Raw API data for reference
  _rawData?: any;
}

export interface ColumnData {
  id: string;
  name: string;
  color: string;
  taskIds: string[];
  isSystem?: boolean;
  position?: number;
}

interface TasksContextType {
  tasks: Record<string, Task>;
  columns: ColumnData[];
  isLoading: boolean;
  error: string | null;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  addTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
  moveTask: (taskId: string, newColumnId: string, position?: number) => Promise<void>;
  setColumns: (columns: ColumnData[]) => void;
  refreshTasks: () => Promise<void>;
  createColumn: (name: string, color: string) => Promise<void>;
  updateColumn: (columnId: string, name: string, color: string) => Promise<void>;
  deleteColumn: (columnId: string) => Promise<void>;
}

const TasksContext = createContext<TasksContextType | undefined>(undefined);

// Convert API date format (DD/MM/YYYY) to ISO format (YYYY-MM-DD)
function convertDateFromApi(dateStr: string): string {
  if (!dateStr) return '';
  // Handle ISO format
  if (dateStr.includes('T')) {
    return dateStr.split('T')[0];
  }
  // Handle DD/MM/YYYY format
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }
  return dateStr;
}

// Convert importance number to priority string
function importanceToPriority(importance: number): 'High' | 'Medium' | 'Low' {
  switch (importance) {
    case 3: return 'High';
    case 2: return 'Medium';
    case 1: return 'Low';
    default: return 'Medium';
  }
}

// Map column name to status
function columnToStatus(columnName: string): 'Open' | 'In Progress' | 'In Review' | 'Done' {
  const name = columnName?.toLowerCase() || '';
  if (name.includes('done') || name.includes('complete')) return 'Done';
  if (name.includes('review')) return 'In Review';
  if (name.includes('doing') || name.includes('progress') || name.includes('working')) return 'In Progress';
  return 'Open'; // Assigned, Backlog, Open, etc.
}

// Map API task to our Task interface
function mapApiTaskToTask(apiTask: any, currentUserId?: string): Task {
  // Find current user's participant entry, or fall back to first
  const participant = currentUserId
    ? apiTask.participants?.find((p: any) => p.userId === currentUserId) || apiTask.participants?.[0]
    : apiTask.participants?.[0];
  const column = participant?.column;

  // Convert hours to minutes for time tracking
  const availableHours = parseFloat(apiTask.availableHours) || 0;
  const spentHours = parseFloat(participant?.spentHours) || 0;

  // Get project ID from activity.project.id
  const projectId = apiTask.activity?.project?.id || '';

  return {
    id: apiTask.id,
    title: apiTask.name,
    projectId: projectId,
    projectName: apiTask.activity?.project?.name || 'Unknown Project',
    projectColor: apiTask.activity?.project?.color || '#6B7280',
    status: columnToStatus(column?.name),
    dueDate: convertDateFromApi(apiTask.endDate),
    priority: importanceToPriority(apiTask.importance),
    commentsCount: apiTask.numComments || 0,
    description: apiTask.description || '',
    parentActivity: apiTask.activity?.name,
    timeEstimate: Math.round(availableHours * 60), // Convert hours to minutes
    timeLogged: Math.round(spentHours * 60), // Convert hours to minutes
    columnId: column?.id,
    assignedTo: participant?.userId,
    _rawData: apiTask,
  };
}

export function TasksProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<Record<string, Task>>({});
  const [columns, setColumns] = useState<ColumnData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch columns from API
  const fetchColumns = useCallback(async () => {
    try {
      const response = await apiClient.get('/queries/columns') as any;
      const apiColumns = response?.result || response || [];

      // Map and sort columns by position
      const mappedColumns: ColumnData[] = apiColumns
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

      return mappedColumns;
    } catch (err) {
      console.error('[TasksContext] Failed to fetch columns:', err);
      return [];
    }
  }, []);

  // Fetch tasks from API
  const fetchTasks = useCallback(async () => {
    // Wait for auth to complete and user to be available
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch columns and tasks in parallel
      const [columnsData, tasksResponse] = await Promise.all([
        fetchColumns(),
        apiClient.get(`/queries/tasks/user/${user.id}`) as Promise<any>
      ]);

      const apiTasks = tasksResponse?.result || tasksResponse || [];

      // Map API tasks to our Task interface
      const taskMap: Record<string, Task> = {};
      const tasksByColumn = new Map<string, string[]>();

      apiTasks.forEach((apiTask: any) => {
        const task = mapApiTaskToTask(apiTask, user.id);
        taskMap[task.id] = task;

        // Add task to its column
        if (task.columnId) {
          if (!tasksByColumn.has(task.columnId)) {
            tasksByColumn.set(task.columnId, []);
          }
          tasksByColumn.get(task.columnId)!.push(task.id);
        }
      });

      setTasks(taskMap);

      // Assign task IDs to columns
      const columnsWithTasks = columnsData.map((col: ColumnData) => ({
        ...col,
        taskIds: tasksByColumn.get(col.id) || [],
      }));

      setColumns(columnsWithTasks);

    } catch (err) {
      console.error('[TasksContext] Failed to fetch tasks:', err);
      setError('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, fetchColumns]);

  // Load tasks when user is authenticated
  useEffect(() => {
    if (!authLoading && user?.id) {
      fetchTasks();
    }
  }, [user?.id, authLoading, fetchTasks]);

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => ({
      ...prev,
      [taskId]: { ...prev[taskId], ...updates }
    }));
  };

  const addTask = (task: Task) => {
    setTasks(prev => ({
      ...prev,
      [task.id]: task
    }));
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => {
      const newTasks = { ...prev };
      delete newTasks[taskId];
      return newTasks;
    });
  };

  // Move task between columns with API call
  const moveTask = async (taskId: string, newColumnId: string, position: number = 0) => {
    const task = tasks[taskId];
    if (!task) return;

    const oldColumnId = task.columnId;

    // Optimistic update - update UI immediately
    setTasks(prev => ({
      ...prev,
      [taskId]: { ...prev[taskId], columnId: newColumnId }
    }));

    // Update columns
    setColumns(prev => prev.map(col => {
      if (col.id === oldColumnId) {
        return { ...col, taskIds: col.taskIds.filter(id => id !== taskId) };
      }
      if (col.id === newColumnId) {
        // Insert at position
        const newTaskIds = [...col.taskIds];
        newTaskIds.splice(position, 0, taskId);
        return { ...col, taskIds: newTaskIds };
      }
      return col;
    }));

    // Call API to persist the change
    // For personal tasks (My Tasks), use /commands/sync/move-task
    try {
      console.log('[TasksContext] Moving task:', { taskId, newColumnId, position });

      // Use the personal task move endpoint (stages)
      await apiClient.post('/commands/sync/move-task', {
        id: taskId,
        column: { id: newColumnId },
        position: position,
      });

    } catch (err: any) {
      console.error('[TasksContext] Failed to move task:', err);
      console.error('[TasksContext] Error details:', err?.data || err?.message);

      // Revert on failure
      setTasks(prev => ({
        ...prev,
        [taskId]: { ...prev[taskId], columnId: oldColumnId }
      }));

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
  };

  const refreshTasks = async () => {
    await fetchTasks();
  };

  // Create a new column/stage
  const createColumn = async (name: string, color: string) => {
    try {
      // Position should be after all existing columns (use count as position)
      const position = columns.length;

      console.log('[TasksContext] Creating column:', { name, color, position });

      await apiClient.post('/commands/sync/create-column-board', {
        name,
        color,
        position,
        isSystem: false,
      });

      // Refresh to get the new column with its ID
      await fetchTasks();
    } catch (err) {
      console.error('[TasksContext] Failed to create column:', err);
      throw err;
    }
  };

  // Update an existing column/stage
  const updateColumn = async (columnId: string, name: string, color: string) => {
    const column = columns.find(c => c.id === columnId);
    if (!column) return;

    try {
      await apiClient.post('/commands/sync/update-column-board', {
        id: columnId,
        name,
        color,
        position: (column as any).position,
        isSystem: (column as any).isSystem,
        systemCode: (column as any).systemCode,
      });

      // Update local state
      setColumns(prev => prev.map(col =>
        col.id === columnId ? { ...col, name, color } : col
      ));
    } catch (err) {
      console.error('[TasksContext] Failed to update column:', err);
      throw err;
    }
  };

  // Delete a column/stage
  const deleteColumn = async (columnId: string) => {
    try {
      await apiClient.post('/commands/sync/delete-column-board', {
        id: columnId,
      });

      // Remove from local state
      setColumns(prev => prev.filter(col => col.id !== columnId));
    } catch (err) {
      console.error('[TasksContext] Failed to delete column:', err);
      throw err;
    }
  };

  return (
    <TasksContext.Provider value={{
      tasks,
      columns,
      isLoading,
      error,
      updateTask,
      addTask,
      deleteTask,
      moveTask,
      setColumns,
      refreshTasks,
      createColumn,
      updateColumn,
      deleteColumn,
    }}>
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TasksContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TasksProvider');
  }
  return context;
}
