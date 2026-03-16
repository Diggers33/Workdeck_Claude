import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, X, ChevronLeft, MoreVertical, Tag, Filter, Users } from 'lucide-react';
import { BoardColumn } from './BoardColumn';
import { CreateBoardDialog } from './CreateBoardDialog';
import { ColumnSettingsDialog } from './ColumnSettingsDialog';
import { LabelManagementDialog } from './LabelManagementDialog';
import { ViewSwitcherDropdown } from './ViewSwitcherDropdown';
import { FilterBar } from './FilterBar';
import { CreateViewModal } from './CreateViewModal';
import { TaskDetailModal } from '../gantt/TaskDetailModal';
import { BoardLegend } from './BoardLegend';
import type { Task as UnifiedTask } from '../../types/task';
import { useProjectTasks, useUnifiedTasks } from '../../contexts/UnifiedTasksContext';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../services/api-client';

interface ProjectBoardProps {
  onClose: () => void;
  projectId?: string;
  projectName?: string;
}

// Board-specific task type (different from unified Task)
// Uses 'title' instead of 'name', has board-specific display fields
export interface BoardTask {
  id: string;
  title: string;
  description?: string;
  projectName: string;
  activityName: string;
  labels?: Array<{ id: string; name: string; color: string }>;
  participants?: Array<{ id: string; name: string; avatar?: string }>;
  attachmentCount?: number;
  commentCount?: number;
  checklistProgress?: { completed: number; total: number };
  priority?: 'high' | 'medium' | 'low';
  dueDate?: string;
  status?: 'blocked' | 'active';
  blockedReason?: string;
  color: string;
}

// Re-export as Task for backwards compatibility with child components
export type Task = BoardTask;

export interface Column {
  id: string;
  name: string;
  color: string;
  isCompleted?: boolean;
  tasks: Task[];
  wipLimit?: number;
}

/** Map a unified Task to the board-specific BoardTask type for display in cards */
function unifiedToBoardTask(task: UnifiedTask, columnColor: string): BoardTask {
  return {
    id: task.id,
    title: task.title || task.name,
    description: task.description,
    projectName: task.projectName || '',
    activityName: task.activityName || task.parentActivity || '',
    labels: task.tags || task.labels || [],
    participants: task.participants?.map(p => {
      const name = p.fullName || `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Unknown';
      const parts = name.split(' ').filter(Boolean);
      const initials = parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : name.substring(0, 2).toUpperCase();
      return {
        id: p.userId || p.id,
        name,
        avatar: initials,
      };
    }) || [],
    attachmentCount: task.numAttachments || 0,
    commentCount: task.commentsCount || 0,
    checklistProgress: (task.subtasksTotal != null && task.subtasksTotal > 0)
      ? { completed: task.subtasksCompleted || 0, total: task.subtasksTotal }
      : undefined,
    priority: task.priority?.toLowerCase() as 'high' | 'medium' | 'low' | undefined,
    dueDate: task.dueDate || task.endDate,
    color: columnColor,
  };
}

export function ProjectBoard({ onClose, projectId, projectName = 'Project' }: ProjectBoardProps) {
  // ===== API Data =====
  const { user } = useAuth();
  const { tasks: projectTasks, isLoading: isLoadingTasks } = useProjectTasks(projectId);
  const { columns: apiColumns } = useUnifiedTasks();

  // Store column definitions in a ref so context column changes (from moveTask side effects)
  // don't trigger our column-building useEffect. We only update when structure changes.
  const columnDefsRef = useRef<Array<{ id: string; name: string; color: string }>>([]);
  const [columnDefsVersion, setColumnDefsVersion] = useState(0);

  useEffect(() => {
    if (apiColumns.length === 0) return;
    const newIds = apiColumns.map(c => c.id).join(',');
    const oldIds = columnDefsRef.current.map(c => c.id).join(',');
    if (newIds !== oldIds) {
      columnDefsRef.current = apiColumns.map(c => ({ id: c.id, name: c.name, color: c.color || '#6B7280' }));
      setColumnDefsVersion(v => v + 1);
    }
  }, [apiColumns]);

  // Keep a ref map of unified tasks by ID for modal lookups
  const unifiedTasksRef = useRef<Map<string, UnifiedTask>>(new Map());
  useEffect(() => {
    const map = new Map<string, UnifiedTask>();
    projectTasks.forEach(t => map.set(t.id, t));
    unifiedTasksRef.current = map;
  }, [projectTasks]);

  // ===== UI State =====
  const [boardExists, setBoardExists] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedTask, setDraggedTask] = useState<{ task: Task; fromColumnId: string } | null>(null);
  const [dragOverTask, setDragOverTask] = useState<{ taskId: string; position: 'before' | 'after' } | null>(null);
  const [showColumnSettings, setShowColumnSettings] = useState<string | null>(null);
  const [cardSize, setCardSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [showDescription, setShowDescription] = useState(true);
  const [showParticipants, setShowParticipants] = useState(true);
  const [selectedTask, setSelectedTask] = useState<UnifiedTask | null>(null);
  const [showLabelManagement, setShowLabelManagement] = useState(false);
  const [showCreateViewModal, setShowCreateViewModal] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Array<{ type: string; value: string; label: string }>>([]);
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [groupBy, setGroupBy] = useState<'none' | 'workPackage' | 'assignee' | 'priority'>('none');

  // Drag state for columns
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Column state (built from API data)
  const [columns, setColumns] = useState<Column[]>([]);

  // ===== Build columns from API data =====
  // Depends on columnDefsVersion (stable - only changes when column structure changes)
  // and projectTasks (changes on initial load and full refetches, NOT on local drag moves)
  useEffect(() => {
    const colDefs = columnDefsRef.current;
    if (colDefs.length === 0) return;

    const newColumns: Column[] = colDefs.map(col => {
      const colName = col.name.toLowerCase();
      return {
        id: col.id,
        name: col.name,
        color: col.color,
        isCompleted: colName.includes('done') || colName.includes('complete'),
        tasks: [],
      };
    });

    // Place tasks into their matching column
    projectTasks.forEach(task => {
      const columnId = task.columnId;
      const targetCol = columnId
        ? newColumns.find(c => c.id === columnId)
        : newColumns[0]; // Default to first column if no columnId

      if (targetCol) {
        targetCol.tasks.push(unifiedToBoardTask(task, targetCol.color));
      } else if (newColumns.length > 0) {
        // Fallback: put in first column
        newColumns[0].tasks.push(unifiedToBoardTask(task, newColumns[0].color));
      }
    });

    setColumns(newColumns);
  }, [projectTasks, columnDefsVersion]);

  // Saved views
  const [savedViews, setSavedViews] = useState([
    { id: 'all', name: 'All Tasks', filters: [], groupBy: 'none', cardSize: 'medium' as const, isSystem: true },
    { id: 'my-tasks', name: 'My Tasks', filters: [{ type: 'assignee', value: 'me', label: 'Me' }], groupBy: 'none', cardSize: 'medium' as const, isSystem: true },
    { id: 'blocked-overdue', name: 'Blocked & Overdue', filters: [], groupBy: 'none', cardSize: 'medium' as const, isSystem: true, hasAlert: true }
  ]);
  const [currentView, setCurrentView] = useState(savedViews[0]);

  // Board labels derived from real task data
  const [boardLabels, setBoardLabels] = useState<Array<{ id: string; name: string; color: string }>>([]);

  // Extract unique labels/tags from project tasks
  useEffect(() => {
    if (projectTasks.length === 0) return;
    const seen = new Map<string, { id: string; name: string; color: string }>();
    projectTasks.forEach(task => {
      const tags = task.tags || task.labels || [];
      tags.forEach(tag => {
        if (!seen.has(tag.id)) {
          seen.set(tag.id, { id: tag.id, name: tag.name, color: tag.color });
        }
      });
    });
    if (seen.size > 0) {
      setBoardLabels(Array.from(seen.values()));
    }
  }, [projectTasks]);

  // ===== Handlers =====

  const handleCreateBoard = () => {
    setBoardExists(true);
    setShowCreateDialog(false);
  };

  const handleDragStart = (task: Task, columnId: string) => {
    setDraggedTask({ task, fromColumnId: columnId });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (toColumnId: string, insertBeforeTaskId?: string) => {
    if (!draggedTask) return;

    const taskId = draggedTask.task.id;
    const fromColumnId = draggedTask.fromColumnId;

    // Calculate insert position before state update
    let insertPosition = 0;
    if (insertBeforeTaskId) {
      const toCol = columns.find(c => c.id === toColumnId);
      const idx = toCol?.tasks.findIndex(t => t.id === insertBeforeTaskId) ?? -1;
      insertPosition = idx >= 0 ? idx : (toCol?.tasks.length ?? 0);
    } else {
      insertPosition = columns.find(c => c.id === toColumnId)?.tasks.length ?? 0;
    }

    // Update local state optimistically
    setColumns(prevColumns => {
      const newColumns = [...prevColumns];
      const fromColumn = newColumns.find(col => col.id === fromColumnId);
      const toColumn = newColumns.find(col => col.id === toColumnId);

      if (fromColumn && toColumn) {
        // Remove task from source column
        fromColumn.tasks = fromColumn.tasks.filter(t => t.id !== taskId);

        // Add task to target column with updated color
        const updatedTask = { ...draggedTask.task, color: toColumn.color };

        if (insertBeforeTaskId) {
          const insertIndex = toColumn.tasks.findIndex(t => t.id === insertBeforeTaskId);
          if (insertIndex !== -1) {
            toColumn.tasks.splice(insertIndex, 0, updatedTask);
          } else {
            toColumn.tasks.push(updatedTask);
          }
        } else {
          toColumn.tasks.push(updatedTask);
        }
      }

      return newColumns;
    });

    // Persist column move via API
    // Try personal board move-task first; if it fails (e.g., project task not on personal board),
    // fall back to update-task with column info. Either way, keep local state as-is (no rollback).
    if (fromColumnId !== toColumnId) {
      apiClient.post('/commands/sync/move-task', {
        id: taskId,
        column: { id: toColumnId },
        position: insertPosition,
      }).catch(() => {
        // move-task failed (likely a project task not on personal board) — try update-task
        console.log('[ProjectBoard] move-task failed, trying update-task with column');
        apiClient.post('/commands/sync/update-task', {
          id: taskId,
          column: { id: toColumnId },
        }).catch(err2 => {
          console.warn('[ProjectBoard] Could not persist column move:', err2);
        });
      });
    }

    setDraggedTask(null);
    setDragOverTask(null);
    setDraggedColumn(null);
    setDragOverColumn(null);
  };

  const handleAddColumn = () => {
    const newColumn: Column = {
      id: `col-${Date.now()}`,
      name: 'New Column',
      color: '#00b4cd',
      tasks: []
    };

    // Insert before the last column (Completed)
    setColumns(prev => {
      const newCols = [...prev];
      newCols.splice(newCols.length - 1, 0, newColumn);
      return newCols;
    });
  };

  const handleDeleteColumn = (columnId: string) => {
    const column = columns.find(c => c.id === columnId);
    if (!column) return;

    // Prevent deleting first or completed columns
    const isFirst = columns[0]?.id === columnId;
    if (isFirst || column.isCompleted) {
      alert('Cannot delete mandatory columns');
      return;
    }

    if (column.tasks.length > 0) {
      alert('Cannot delete column with tasks. Please move or delete tasks first.');
      return;
    }

    setColumns(prev => prev.filter(col => col.id !== columnId));
  };

  const handleUpdateColumn = (columnId: string, updates: Partial<Column>) => {
    setColumns(prev => prev.map(col =>
      col.id === columnId ? { ...col, ...updates } : col
    ));
    setShowColumnSettings(null);
  };

  const handleDeleteTask = (columnId: string, taskId: string) => {
    setColumns(prev => prev.map(col =>
      col.id === columnId
        ? { ...col, tasks: col.tasks.filter(t => t.id !== taskId) }
        : col
    ));
  };

  const handleMarkAsDone = (columnId: string, taskId: string) => {
    const task = columns.find(col => col.id === columnId)?.tasks.find(t => t.id === taskId);
    if (!task) return;

    const completedColumn = columns.find(col => col.isCompleted);

    setColumns(prev => {
      const newColumns = [...prev];
      const fromColumn = newColumns.find(col => col.id === columnId);
      const doneColumn = newColumns.find(col => col.isCompleted);

      if (fromColumn && doneColumn) {
        fromColumn.tasks = fromColumn.tasks.filter(t => t.id !== taskId);
        const updatedTask = { ...task, color: doneColumn.color };
        doneColumn.tasks.unshift(updatedTask);
      }

      return newColumns;
    });

    // Persist move to completed column
    if (completedColumn) {
      apiClient.post('/commands/sync/move-task', {
        id: taskId,
        column: { id: completedColumn.id },
        position: 0,
      }).catch(() => {
        apiClient.post('/commands/sync/update-task', {
          id: taskId,
          column: { id: completedColumn.id },
        }).catch(err2 => {
          console.warn('[ProjectBoard] Could not persist mark-as-done:', err2);
        });
      });
    }
  };

  const handleCardUpdateTask = (columnId: string, taskId: string, updates: any) => {
    setColumns(prev => prev.map(col =>
      col.id === columnId
        ? {
            ...col,
            tasks: col.tasks.map(t =>
              t.id === taskId
                ? { ...t, ...updates }
                : t
            )
          }
        : col
    ));
  };

  const handleTaskClick = (task: Task) => {
    // Look up the full unified task data for the modal
    const unifiedTask = unifiedTasksRef.current.get(task.id);
    if (unifiedTask) {
      setSelectedTask(unifiedTask);
    } else {
      // Fallback: construct a minimal unified task from board task data
      setSelectedTask({
        id: task.id,
        name: task.title,
        title: task.title,
        description: task.description,
        projectId: projectId || '',
        projectName: task.projectName,
        projectColor: '',
        activityName: task.activityName,
        priority: (task.priority
          ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1)
          : 'Medium') as 'High' | 'Medium' | 'Low',
        status: 'Open',
        commentsCount: task.commentCount || 0,
        dueDate: task.dueDate,
        numAttachments: task.attachmentCount,
      });
    }
  };

  const handleUpdateTask = (taskId: string, updates: Partial<UnifiedTask>) => {
    setColumns(prev => prev.map(col => ({
      ...col,
      tasks: col.tasks.map(t =>
        t.id === taskId
          ? {
              ...t,
              title: updates.name || updates.title || t.title,
              description: updates.description ?? t.description,
              priority: (updates.priority?.toLowerCase() as any) || t.priority
            }
          : t
      )
    })));
    setSelectedTask(null);
  };

  // Column drag handlers
  const handleColumnDragStart = (columnId: string) => {
    const column = columns.find(c => c.id === columnId);
    const isFirst = columns[0]?.id === columnId;
    if (column?.isCompleted || isFirst) return;
    setDraggedColumn(columnId);
  };

  const handleColumnDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    const column = columns.find(c => c.id === columnId);
    const isFirst = columns[0]?.id === columnId;
    if (column?.isCompleted || isFirst) return;
    setDragOverColumn(columnId);
  };

  const handleColumnDrop = (targetColumnId: string) => {
    if (!draggedColumn || draggedColumn === targetColumnId) {
      setDraggedColumn(null);
      setDragOverColumn(null);
      return;
    }

    const targetColumn = columns.find(c => c.id === targetColumnId);
    const isFirst = columns[0]?.id === targetColumnId;
    if (targetColumn?.isCompleted || isFirst) {
      setDraggedColumn(null);
      setDragOverColumn(null);
      return;
    }

    setColumns(prev => {
      const newColumns = [...prev];
      const draggedIndex = newColumns.findIndex(c => c.id === draggedColumn);
      const targetIndex = newColumns.findIndex(c => c.id === targetColumnId);

      if (draggedIndex === -1 || targetIndex === -1) return prev;

      // Remove dragged column
      const [removed] = newColumns.splice(draggedIndex, 1);

      // Insert at new position
      newColumns.splice(targetIndex, 0, removed);

      return newColumns;
    });

    setDraggedColumn(null);
    setDragOverColumn(null);
  };

  const filteredColumns = columns.map(col => ({
    ...col,
    tasks: col.tasks.filter(task => {
      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          task.title.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query) ||
          task.activityName.toLowerCase().includes(query) ||
          task.labels?.some(label => label.name.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // Active filters
      if (activeFilters.length > 0) {
        return activeFilters.every(filter => {
          switch (filter.type) {
            case 'assignee':
              if (filter.value === 'me') {
                if (!user?.id) return false;
                const unifiedTask = unifiedTasksRef.current.get(task.id);
                return unifiedTask?.participants?.some(p =>
                  p.userId === user.id || p.id === user.id
                ) ?? false;
              }
              return task.participants?.some(p => p.id === filter.value) ?? false;

            case 'workPackage':
              return task.activityName === filter.label ||
                (unifiedTasksRef.current.get(task.id)?.activityId === filter.value);

            case 'tag':
              return task.labels?.some(l => l.id === filter.value) ?? false;

            case 'priority':
              return task.priority === filter.value;

            case 'due': {
              if (!task.dueDate) return false;
              const due = new Date(task.dueDate);
              const now = new Date();
              const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
              const endOfToday = new Date(today.getTime() + 86400000 - 1);
              switch (filter.value) {
                case 'overdue':
                  return due < today;
                case 'today':
                  return due >= today && due <= endOfToday;
                case 'week': {
                  const endOfWeek = new Date(today.getTime() + 7 * 86400000);
                  return due >= today && due <= endOfWeek;
                }
                case 'month': {
                  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                  return due >= today && due <= endOfMonth;
                }
                default:
                  return true;
              }
            }

            default:
              return true;
          }
        });
      }

      return true;
    })
  }));

  if (!boardExists) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100vh',
        background: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000
      }}>
        {/* Header */}
        <div style={{
          height: '60px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          justifyContent: 'space-between'
        }}>
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#6B7280',
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            <ChevronLeft size={20} />
            Back to Gantt
          </button>
        </div>

        {/* Empty State */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px'
        }}>
          <div style={{ fontSize: '64px', opacity: 0.3 }}>📋</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', marginBottom: '8px' }}>
              No Project Board Yet
            </div>
            <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>
              Create a board to start organizing tasks visually
            </div>
          </div>
          <button
            onClick={() => setShowCreateDialog(true)}
            style={{
              height: '44px',
              padding: '0 24px',
              background: '#0066FF',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Create Board
          </button>
        </div>

        {showCreateDialog && (
          <CreateBoardDialog
            onClose={() => setShowCreateDialog(false)}
            onCreate={handleCreateBoard}
            projectName={projectName}
          />
        )}
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      height: '100vh',
      background: '#FFFFFF',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000
    }}>
      {/* Header */}
      <div style={{
        height: '60px',
        borderBottom: '1px solid #E5E7EB',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#6B7280',
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            <ChevronLeft size={20} />
            Back to Gantt
          </button>

          <div style={{ width: '1px', height: '24px', background: '#E5E7EB' }} />

          <div style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937' }}>
            {projectName} Board
          </div>

          <div style={{ width: '1px', height: '24px', background: '#E5E7EB' }} />

          {/* View Switcher */}
          <ViewSwitcherDropdown
            currentView={currentView}
            views={savedViews}
            onSelectView={(view) => {
              setCurrentView(view);
              setActiveFilters(view.filters);
              setCardSize(view.cardSize);
            }}
            onCreateView={() => setShowCreateViewModal(true)}
          />

          {/* Filters Button */}
          <button
            onClick={() => setShowFilterBar(!showFilterBar)}
            style={{
              height: '36px',
              padding: '0 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: showFilterBar || activeFilters.length > 0 ? '#EFF6FF' : 'white',
              border: `1px solid ${showFilterBar || activeFilters.length > 0 ? '#BFDBFE' : '#E5E7EB'}`,
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              color: showFilterBar || activeFilters.length > 0 ? '#1E40AF' : '#6B7280',
              cursor: 'pointer'
            }}
          >
            <Filter size={14} />
            Filters
            {activeFilters.length > 0 && (
              <div style={{
                minWidth: '18px',
                height: '18px',
                padding: '0 5px',
                background: '#1E40AF',
                color: 'white',
                borderRadius: '9px',
                fontSize: '11px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {activeFilters.length}
              </div>
            )}
          </button>

          {/* Group By Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              style={{
                height: '36px',
                padding: '0 12px',
                background: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 500,
                color: '#6B7280',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              Group: {groupBy === 'none' ? 'None' : groupBy === 'workPackage' ? 'Work Package' : groupBy === 'assignee' ? 'Assignee' : 'Priority'}
              <span style={{ fontSize: '11px' }}>▼</span>
            </button>
          </div>

          {/* My Tasks Quick Toggle */}
          <button
            onClick={() => {
              if (currentView.id === 'my-tasks') {
                const allView = savedViews.find(v => v.id === 'all')!;
                setCurrentView(allView);
                setActiveFilters([]);
              } else {
                const myTasksView = savedViews.find(v => v.id === 'my-tasks')!;
                setCurrentView(myTasksView);
                setActiveFilters(myTasksView.filters);
              }
            }}
            style={{
              height: '36px',
              padding: '0 16px',
              background: currentView.id === 'my-tasks' ? '#0066FF' : 'white',
              border: `1px solid ${currentView.id === 'my-tasks' ? '#0066FF' : '#E5E7EB'}`,
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              color: currentView.id === 'my-tasks' ? 'white' : '#6B7280',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Users size={14} />
            My Tasks
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9CA3AF'
              }}
            />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                height: '36px',
                width: '240px',
                paddingLeft: '36px',
                paddingRight: searchQuery ? '32px' : '12px',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#9CA3AF',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Card Size Toggle */}
          <div style={{ display: 'flex', gap: '4px', padding: '4px', background: '#F3F4F6', borderRadius: '6px' }}>
            {(['small', 'medium', 'large'] as const).map(size => (
              <button
                key={size}
                onClick={() => setCardSize(size)}
                style={{
                  padding: '4px 12px',
                  background: cardSize === size ? 'white' : 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: cardSize === size ? '#1F2937' : '#6B7280',
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {size[0].toUpperCase()}
              </button>
            ))}
          </div>

          {/* Tags Button */}
          <button
            onClick={() => setShowLabelManagement(true)}
            style={{
              height: '36px',
              padding: '0 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              color: '#6B7280',
              cursor: 'pointer'
            }}
            title="Manage Tags"
          >
            <Tag size={14} />
            Tags
          </button>

          {/* Legend Button */}
          <button
            onClick={() => setShowLegend(true)}
            style={{
              height: '36px',
              padding: '0 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              color: '#6B7280',
              cursor: 'pointer'
            }}
            title="View Legend"
          >
            <span style={{ fontSize: '15px' }}>?</span>
            Legend
          </button>

          <button
            style={{
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              cursor: 'pointer',
              color: '#6B7280'
            }}
          >
            <MoreVertical size={18} />
          </button>
        </div>
      </div>

      {/* Filter Bar - Conditionally rendered */}
      {showFilterBar && (
        <FilterBar
          activeFilters={activeFilters}
          onUpdateFilters={setActiveFilters}
          availableAssignees={[
            { id: 'me', label: 'Me' },
            ...(projectTasks
              .flatMap(t => t.participants || [])
              .filter((p, i, arr) => arr.findIndex(x => x.userId === p.userId) === i)
              .map(p => ({ id: p.userId, label: p.fullName || 'Unknown' }))
            )
          ]}
          availableWorkPackages={
            projectTasks
              .filter(t => t.activityName)
              .filter((t, i, arr) => arr.findIndex(x => x.activityId === t.activityId) === i)
              .map(t => ({ id: t.activityId || t.activityName || '', label: t.activityName || '' }))
          }
          availableTags={
            boardLabels.map(l => ({ id: l.id, label: l.name }))
          }
        />
      )}

      {/* Board Columns */}
      <div style={{
        flex: 1,
        overflowX: 'auto',
        overflowY: 'hidden',
        padding: '20px'
      }}>
        {isLoadingTasks && columns.length === 0 ? (
          /* Loading state */
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#6B7280',
            fontSize: '14px',
            gap: '12px'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              border: '3px solid #E5E7EB',
              borderTopColor: '#0066FF',
              borderRadius: '50%',
              animation: 'board-spin 0.8s linear infinite'
            }} />
            Loading tasks...
          </div>
        ) : (
          <div style={{
            display: 'flex',
            gap: '16px',
            height: '100%',
            minWidth: 'fit-content'
          }}>
            {filteredColumns.map((column) => (
              <BoardColumn
                key={column.id}
                column={column}
                cardSize={cardSize}
                showDescription={showDescription}
                showParticipants={showParticipants}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDeleteColumn={handleDeleteColumn}
                onEditColumn={() => setShowColumnSettings(column.id)}
                onDeleteTask={handleDeleteTask}
                onMarkAsDone={handleMarkAsDone}
                onUpdateTask={handleCardUpdateTask}
                onTaskClick={handleTaskClick}
                onColumnDragStart={handleColumnDragStart}
                onColumnDragOver={handleColumnDragOver}
                onColumnDrop={handleColumnDrop}
                draggedColumn={draggedColumn}
                dragOverColumn={dragOverColumn}
              />
            ))}

            {/* Add Column Button */}
            <button
              onClick={handleAddColumn}
              style={{
                width: '280px',
                height: '48px',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: '#F9FAFB',
                border: '2px dashed #D1D5DB',
                borderRadius: '6px',
                cursor: 'pointer',
                color: '#6B7280',
                fontSize: '14px',
                fontWeight: 500
              }}
            >
              <Plus size={18} />
              Add Column
            </button>
          </div>
        )}
      </div>

      {/* Column Settings Dialog */}
      {showColumnSettings && (
        <ColumnSettingsDialog
          column={columns.find(c => c.id === showColumnSettings)!}
          onClose={() => setShowColumnSettings(null)}
          onSave={(updates) => handleUpdateColumn(showColumnSettings, updates)}
        />
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdateTask={handleUpdateTask}
        />
      )}

      {/* Label Management Dialog */}
      {showLabelManagement && (
        <LabelManagementDialog
          onClose={() => setShowLabelManagement(false)}
          currentLabels={boardLabels}
          onSaveLabels={(newLabels) => {
            setBoardLabels(newLabels);
            setShowLabelManagement(false);
          }}
        />
      )}

      {/* Create View Modal */}
      {showCreateViewModal && (
        <CreateViewModal
          onClose={() => setShowCreateViewModal(false)}
          onCreate={(viewData) => {
            const newView = {
              ...viewData,
              id: `view-${Date.now()}`
            };
            setSavedViews([...savedViews, newView]);
            setCurrentView(newView);
            setShowCreateViewModal(false);
          }}
          currentFilters={activeFilters}
          currentGrouping={groupBy}
          currentCardSize={cardSize}
        />
      )}

      {/* Board Legend */}
      {showLegend && (
        <BoardLegend
          onClose={() => setShowLegend(false)}
        />
      )}

      <style>{`
        @keyframes board-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
