import React, { useState, useEffect } from 'react';
import { GripVertical, Clock, CheckSquare, ChevronDown, ChevronRight, ChevronUp, MoreHorizontal, ArrowUpRight, Loader2 } from 'lucide-react';
import { Task as ApiTask } from '../../services/dashboard-api';
import { useAuth } from '../../contexts/AuthContext';
import { useMyTasks } from '../../hooks/useApiQueries';

interface TodoListWidgetProps {
  onDragStart: (task: any) => void;
  onDragEnd: () => void;
  onTaskClick?: (task: any) => void;
}

interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

interface Task {
  id: string;
  title: string;
  project?: string;
  projectColor?: string;
  category: string;
  due: string;
  duration: string;
  completed: boolean;
  completedAt?: Date; // Add completion timestamp
  endDate?: string;
  checklist?: ChecklistItem[];
  priority?: 'high' | 'medium' | 'low';
}

export function TodoListWidget({ onDragStart, onDragEnd, onTaskClick }: TodoListWidgetProps) {
  const { user } = useAuth();

  const [expandedGroups, setExpandedGroups] = useState({
    assigned: true,
    personal: true
  });
  
  // Add state for showing completed sections
  const [showCompleted, setShowCompleted] = useState({
    assigned: false,
    personal: false
  });

  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddValue, setQuickAddValue] = useState('');
  const [convertingTask, setConvertingTask] = useState<string | null>(null);
  const [showPriorityMenu, setShowPriorityMenu] = useState<string | null>(null);

  // State for managing tasks
  const [personalTasks, setPersonalTasks] = useState<Task[]>([]);
  const [assignedTasks, setAssignedTasks] = useState<Task[]>([]);

  // Load tasks from API via TanStack Query
  const { data: rawTasks = [], isLoading } = useMyTasks(user?.id || '');

  // Sync API data into local state so tasks can be mutated (toggle completion, priority, etc.)
  useEffect(() => {
    if (rawTasks.length > 0) {
      setAssignedTasks(rawTasks.map((t: ApiTask) => ({
        id: t.id,
        title: t.name,
        project: t.activity?.project?.name,
        projectColor: '#3B82F6',
        category: 'assigned',
        due: t.endDate || '',
        duration: t.plannedHours ? `${t.plannedHours}h` : '',
        completed: t.column?.systemCode === 3,
        endDate: t.endDate,
        priority: t.importance === 3 ? 'high' as const : t.importance === 2 ? 'medium' as const : 'low' as const
      })));
    }
  }, [rawTasks]);

  const toggleGroup = (group: 'assigned' | 'personal') => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const toggleTaskCompletion = (taskId: string, isAssigned: boolean) => {
    if (isAssigned) {
      setAssignedTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, completed: !task.completed, completedAt: !task.completed ? new Date() : undefined } : task
      ));
    } else {
      setPersonalTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, completed: !task.completed, completedAt: !task.completed ? new Date() : undefined } : task
      ));
    }
  };

  // Add function to clear completed tasks
  const clearCompleted = (groupKey: 'assigned' | 'personal') => {
    if (groupKey === 'assigned') {
      setAssignedTasks(prev => prev.filter(task => !task.completed));
    } else {
      setPersonalTasks(prev => prev.filter(task => !task.completed));
    }
    setShowCompleted(prev => ({ ...prev, [groupKey]: false }));
  };

  // Add function to get relative time
  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const toggleChecklistItem = (taskId: string, itemId: string, isAssigned: boolean) => {
    if (isAssigned) {
      setAssignedTasks(prev => prev.map(task => {
        if (task.id === taskId && task.checklist) {
          return {
            ...task,
            checklist: task.checklist.map(item =>
              item.id === itemId ? { ...item, completed: !item.completed } : item
            )
          };
        }
        return task;
      }));
    } else {
      setPersonalTasks(prev => prev.map(task => {
        if (task.id === taskId && task.checklist) {
          return {
            ...task,
            checklist: task.checklist.map(item =>
              item.id === itemId ? { ...item, completed: !item.completed } : item
            )
          };
        }
        return task;
      }));
    }
  };

  const getPriorityColor = (priority?: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return '#F87171';
      case 'medium': return '#FBBF24';
      case 'low': return '#60A5FA';
      default: return '#9CA3AF';
    }
  };

  const totalActive = assignedTasks.filter(t => !t.completed).length + personalTasks.filter(t => !t.completed).length;

  const getChecklistProgress = (checklist: ChecklistItem[]) => {
    const completed = checklist.filter(item => item.completed).length;
    return { completed, total: checklist.length };
  };

  const handleQuickAdd = () => {
    if (quickAddValue.trim()) {
      const newTask: Task = {
        id: `p${Date.now()}`,
        title: quickAddValue.trim(),
        category: 'General',
        due: 'No date',
        duration: '30m',
        completed: false,
        priority: 'medium'
      };
      setPersonalTasks(prev => [newTask, ...prev]);
      setQuickAddValue('');
      setShowQuickAdd(false);
    }
  };

  const handleQuickAddKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleQuickAdd();
    } else if (e.key === 'Escape') {
      setShowQuickAdd(false);
      setQuickAddValue('');
    }
  };

  const handleConvertToTask = (task: Task) => {
    if (onTaskClick) {
      // Create a minimal task for modal with only the to-do information
      const taskForModal = {
        id: `a${Date.now()}`,
        name: task.title,
        title: task.title,
        checklist: task.checklist, // Preserve checklist if it exists
        _convertFrom: task.id, // flag to identify this is a conversion
        _isNew: true // flag to treat as new task creation
      };
      onTaskClick(taskForModal);
    }
  };

  const handleNewProjectTask = () => {
    if (onTaskClick) {
      // Open modal with empty task for creation
      onTaskClick({
        id: `a${Date.now()}`,
        name: '',
        title: '',
        category: 'General',
        due: 'No date',
        duration: '1h',
        completed: false,
        _isNew: true // flag to identify this is a new task
      });
    }
    setShowNewMenu(false);
  };

  const changePriority = (taskId: string, priority: 'high' | 'medium' | 'low', isAssigned: boolean) => {
    if (isAssigned) {
      setAssignedTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, priority } : task
      ));
    } else {
      setPersonalTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, priority } : task
      ));
    }
    setShowPriorityMenu(null);
  };

  const renderTaskRow = (task: Task, showProject: boolean = false) => {
    const isExpanded = expandedTasks.has(task.id);
    const hasChecklist = task.checklist && task.checklist.length > 0;
    const checklistProgress = hasChecklist ? getChecklistProgress(task.checklist!) : null;

    return (
      <div 
        key={task.id} 
        className={`border transition-all relative ${
          task.completed 
            ? 'bg-[#F9FAFB] border-[#F3F4F6] opacity-40' 
            : 'bg-white border-[#E5E7EB] hover:border-[#60A5FA]'
        } rounded group`}
      >
        {/* Priority indicator bar - full height, clickable */}
        {!task.completed && (
          <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l z-10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowPriorityMenu(showPriorityMenu === task.id ? null : task.id);
              }}
              className="absolute inset-0 hover:w-3 transition-all rounded-l"
              style={{ backgroundColor: getPriorityColor(task.priority) }}
            />
            
            {/* Priority dropdown */}
            {showPriorityMenu === task.id && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowPriorityMenu(null)} />
                <div className="absolute left-8 top-2 bg-white border border-[#D1D5DB] rounded shadow-xl z-20 py-1.5 overflow-hidden" style={{ minWidth: '140px' }}>
                  <div className="px-3 py-1.5 text-[10px] uppercase tracking-wide text-[#6B7280] font-medium bg-[#F9FAFB] border-b border-[#E5E7EB]">
                    Set Priority
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      changePriority(task.id, 'high', showProject);
                    }}
                    className="w-full text-left px-3 py-2 text-[13px] text-[#1F2937] hover:bg-[#FEF2F2] transition-colors flex items-center gap-2.5 group"
                  >
                    <div className="w-1 h-5 rounded-full group-hover:w-1.5 transition-all" style={{ backgroundColor: '#F87171' }} />
                    <span className="font-medium">High</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      changePriority(task.id, 'medium', showProject);
                    }}
                    className="w-full text-left px-3 py-2 text-[13px] text-[#1F2937] hover:bg-[#FFFBEB] transition-colors flex items-center gap-2.5 group"
                  >
                    <div className="w-1 h-5 rounded-full group-hover:w-1.5 transition-all" style={{ backgroundColor: '#FBBF24' }} />
                    <span className="font-medium">Medium</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      changePriority(task.id, 'low', showProject);
                    }}
                    className="w-full text-left px-3 py-2 text-[13px] text-[#1F2937] hover:bg-[#EFF6FF] transition-colors flex items-center gap-2.5 group"
                  >
                    <div className="w-1 h-5 rounded-full group-hover:w-1.5 transition-all" style={{ backgroundColor: '#60A5FA' }} />
                    <span className="font-medium">Low</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
        
        {/* Main task row */}
        <div
          draggable={!task.completed}
          onDragStart={() => !task.completed && onDragStart(task)}
          onDragEnd={onDragEnd}
          className={`flex items-center gap-2 px-2.5 py-2 transition-all ${
            task.completed 
              ? '' 
              : 'hover:bg-[#F9FAFB] cursor-pointer'
          }`}
          onClick={(e) => {
            // Only open task detail if clicking on the task row itself, not on interactive elements
            if (
              onTaskClick &&
              !task.completed &&
              e.target === e.currentTarget
            ) {
              onTaskClick(task);
            }
          }}
        >
          {/* Drag handle */}
          {!task.completed && (
            <GripVertical className="w-3 h-3 text-[#9CA3AF] flex-shrink-0" />
          )}
          
          {/* Checkbox */}
          <input 
            type="checkbox"
            checked={task.completed}
            onChange={() => toggleTaskCompletion(task.id, showProject)}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 cursor-pointer flex-shrink-0"
            style={{ accentColor: '#60A5FA' }}
          />
          
          {/* Task content */}
          <div 
            className={`flex-1 min-w-0 ${showProject && !task.completed ? 'cursor-pointer' : ''}`}
            onClick={() => {
              // Only open detail modal for assigned (project) tasks
              if (onTaskClick && !task.completed && showProject) {
                // Transform task to match Gantt task format
                const ganttTask = {
                  ...task,
                  name: task.title // TaskDetailModal expects 'name' property
                };
                onTaskClick(ganttTask);
              }
            }}
          >
            <p className={`text-[14px] leading-tight font-medium ${
              task.completed ? 'text-[#9CA3AF] line-through' : 'text-[#1F2937]'
            }`}>
              {task.title}
            </p>
            <div className="flex items-center gap-1.5 text-[12px] text-[#6B7280] flex-wrap mt-0.5">
              {/* Project tag (only for Assigned group) */}
              {showProject && task.project && (
                <span 
                  className="text-[11px] px-1.5 py-0.5 rounded font-medium text-white whitespace-nowrap"
                  style={{ backgroundColor: task.projectColor }}
                >
                  {task.project}
                </span>
              )}
              
              {/* Category */}
              <span className="whitespace-nowrap">• {task.category}</span>
              
              {/* Due label */}
              <span className="whitespace-nowrap">• {task.due}</span>
              
              {/* Scheduled time (if exists) */}
              {task.endDate && (
                <span className="flex items-center gap-1 whitespace-nowrap">
                  <span>•</span>
                  <Clock className="w-3 h-3" />
                  <span>{task.endDate}</span>
                </span>
              )}
              
              {/* Checklist progress */}
              {hasChecklist && checklistProgress && (
                <span className="whitespace-nowrap">• Checklist {checklistProgress.completed}/{checklistProgress.total}</span>
              )}
            </div>
          </div>
          
          {/* Convert to task button (only for personal items) */}
          {!showProject && !task.completed && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleConvertToTask(task);
              }}
              className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1 hover:bg-[#EFF6FF] rounded transition-all"
              title="Convert to project task"
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-[#60A5FA]" />
            </button>
          )}
          
          {/* Add checklist button for all items without checklist */}
          {!hasChecklist && !task.completed && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleTaskExpansion(task.id);
              }}
              className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1 hover:bg-[#EFF6FF] rounded transition-all"
              title="Add checklist"
            >
              <CheckSquare className="w-3.5 h-3.5 text-[#60A5FA]" />
            </button>
          )}
          
          {/* Expand/collapse chevron for checklist */}
          {hasChecklist && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleTaskExpansion(task.id);
              }}
              className="flex-shrink-0 p-0.5 hover:bg-[#F3F4F6] rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronUp className="w-3.5 h-3.5 text-[#6B7280]" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-[#6B7280]" />
              )}
            </button>
          )}
        </div>

        {/* Expanded checklist section - seamlessly integrated */}
        {hasChecklist && isExpanded && (
          <div className="border-t border-[#E5E7EB] px-2.5 py-2 pl-[52px]">
            <div className="space-y-1.5">
              {task.checklist!.map(item => (
                <div key={item.id} className="flex items-center gap-2">
                  <input 
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => toggleChecklistItem(task.id, item.id, showProject)}
                    className="w-3.5 h-3.5 cursor-pointer flex-shrink-0"
                    style={{ accentColor: '#60A5FA' }}
                  />
                  <span className={`text-[13px] ${
                    item.completed ? 'text-[#9CA3AF] line-through' : 'text-[#4B5563]'
                  }`}>
                    {item.label}
                  </span>
                </div>
              ))}
              
              {/* Add new checklist item - now works for both assigned and personal */}
              <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-[#E5E7EB]">
                <CheckSquare className="w-3.5 h-3.5 text-[#60A5FA] flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Add item..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const value = (e.target as HTMLInputElement).value.trim();
                      if (value) {
                        const newItem: ChecklistItem = {
                          id: `c${Date.now()}`,
                          label: value,
                          completed: false
                        };
                        if (showProject) {
                          setAssignedTasks(prev => prev.map(t => {
                            if (t.id === task.id) {
                              return {
                                ...t,
                                checklist: [...(t.checklist || []), newItem]
                              };
                            }
                            return t;
                          }));
                        } else {
                          setPersonalTasks(prev => prev.map(t => {
                            if (t.id === task.id) {
                              return {
                                ...t,
                                checklist: [...(t.checklist || []), newItem]
                              };
                            }
                            return t;
                          }));
                        }
                        (e.target as HTMLInputElement).value = '';
                      }
                    }
                  }}
                  className="flex-1 bg-transparent border-none outline-none text-[13px] text-[#1F2937] placeholder:text-[#9CA3AF]"
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Add checklist button for tasks without checklists - now works for both */}
        {!hasChecklist && isExpanded && (
          <div className="border-t border-[#E5E7EB] px-2.5 py-2 pl-[52px]">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-3.5 h-3.5 text-[#60A5FA] flex-shrink-0" />
              <input
                type="text"
                placeholder="Add first checklist item..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const value = (e.target as HTMLInputElement).value.trim();
                    if (value) {
                      const newItem: ChecklistItem = {
                        id: `c${Date.now()}`,
                        label: value,
                        completed: false
                      };
                      if (showProject) {
                        setAssignedTasks(prev => prev.map(t => {
                          if (t.id === task.id) {
                            return {
                              ...t,
                              checklist: [newItem]
                            };
                          }
                          return t;
                        }));
                      } else {
                        setPersonalTasks(prev => prev.map(t => {
                          if (t.id === task.id) {
                            return {
                              ...t,
                              checklist: [newItem]
                            };
                          }
                          return t;
                        }));
                      }
                      (e.target as HTMLInputElement).value = '';
                      // Keep expanded after adding first item
                    }
                  }
                }}
                className="flex-1 bg-transparent border-none outline-none text-[13px] text-[#1F2937] placeholder:text-[#9CA3AF]"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderGroup = (
    title: string,
    count: number,
    groupKey: 'assigned' | 'personal',
    tasks: Task[],
    showProject: boolean = false
  ) => {
    const isExpanded = expandedGroups[groupKey];
    const activeTasks = tasks.filter(t => !t.completed);
    const completedTasks = tasks.filter(t => t.completed);
    const showCompletedSection = showCompleted[groupKey];
    
    return (
      <div className="space-y-2">
        {/* Group header */}
        <div 
          className="flex items-center justify-between cursor-pointer hover:bg-[#F9FAFB] px-1 py-1 rounded -mx-1 transition-colors"
          onClick={() => toggleGroup(groupKey)}
        >
          <div className="flex items-center gap-1.5">
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-[#6B7280]" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-[#6B7280]" />
            )}
            <span className="text-[14px] font-medium text-[#374151]">{title}</span>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded bg-[#F3F4F6] text-[#6B7280] font-medium" style={{ borderRadius: '6px' }}>
            {activeTasks.length}
          </span>
        </div>
        
        {/* Divider */}
        <div className="border-b border-[#E5E7EB]" />
        
        {/* Task list */}
        {isExpanded && (
          <div className="space-y-2">
            {/* Quick-add input (only for Personal group) */}
            {groupKey === 'personal' && showQuickAdd && (
              <div className="bg-[#EFF6FF] border border-[#60A5FA] rounded px-2.5 py-2">
                <div className="flex items-center gap-2 mb-1.5">
                  <CheckSquare className="w-4 h-4 text-[#60A5FA] flex-shrink-0" />
                  <input
                    type="text"
                    value={quickAddValue}
                    onChange={(e) => setQuickAddValue(e.target.value)}
                    onKeyDown={handleQuickAddKeyPress}
                    placeholder="Add quick to-do..."
                    autoFocus
                    className="flex-1 bg-transparent border-none outline-none text-[14px] text-[#1F2937] placeholder:text-[#9CA3AF]"
                  />
                </div>
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => {
                      setShowQuickAdd(false);
                      setQuickAddValue('');
                    }}
                    className="px-2 py-0.5 hover:bg-white/50 text-[#6B7280] text-[11px] rounded transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleQuickAdd}
                    className="px-2.5 py-0.5 bg-[#60A5FA] hover:bg-[#3B82F6] text-white text-[11px] rounded font-medium transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
            
            {/* Active tasks */}
            {activeTasks.map(task => renderTaskRow(task, showProject))}
            
            {/* Completed tasks section - Todoist/Asana style */}
            {completedTasks.length > 0 && (
              <div className="mt-3 pt-2 border-t border-[#E5E7EB]">
                {/* Show/Hide completed button with Clear action */}
                <div className="flex items-center justify-between group">
                  <button
                    onClick={() => setShowCompleted(prev => ({ ...prev, [groupKey]: !prev[groupKey] }))}
                    className="flex-1 flex items-center gap-2 px-2 py-1.5 hover:bg-[#F9FAFB] rounded transition-colors"
                  >
                    {showCompletedSection ? (
                      <ChevronDown className="w-3.5 h-3.5 text-[#6B7280]" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-[#6B7280]" />
                    )}
                    <span className="text-[13px] font-medium text-[#6B7280]">
                      {showCompletedSection ? 'Hide' : 'Show'} {completedTasks.length} completed
                    </span>
                  </button>
                  
                  {/* Clear completed button - shows on hover, separate button */}
                  {showCompletedSection && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        clearCompleted(groupKey);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-[11px] text-[#EF4444] hover:text-[#DC2626] hover:underline transition-all px-2 py-1"
                    >
                      Clear
                    </button>
                  )}
                </div>
                
                {/* Completed tasks list */}
                {showCompletedSection && (
                  <div className="mt-2 space-y-2">
                    {completedTasks.map(task => (
                      <div key={task.id} className="relative">
                        {renderTaskRow(task, showProject)}
                        {/* Completion time indicator */}
                        {task.completedAt && (
                          <div className="ml-10 mt-1 text-[11px] text-[#9CA3AF] italic">
                            Completed {getRelativeTime(task.completedAt)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      className="bg-white rounded-lg relative overflow-hidden" 
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)', height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      {/* Colored top accent */}
      <div className="absolute left-0 right-0 top-0 h-1" style={{ background: 'linear-gradient(90deg, #60A5FA 0%, #93C5FD 100%)' }}></div>
      
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-[#E5E7EB] flex items-center justify-between" style={{ minHeight: '40px' }}>
        <div className="flex items-center gap-1.5">
          <CheckSquare className="w-4 h-4 text-[#60A5FA]" />
          <h3 className="text-[14px] font-medium text-[#1F2937]">To-Do</h3>
        </div>
        <div className="relative">
          <button 
            onClick={() => setShowNewMenu(!showNewMenu)}
            className="bg-[#60A5FA] hover:bg-[#3B82F6] text-white px-2.5 py-1 rounded text-[11px] font-medium transition-all"
          >
            New +
          </button>
          
          {/* Dropdown menu */}
          {showNewMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowNewMenu(false)}
              />
              <div 
                className="absolute right-0 mt-1 bg-white border border-[#E5E7EB] rounded shadow-lg z-20"
                style={{ minWidth: '180px' }}
              >
                <button
                  onClick={() => {
                    setShowQuickAdd(true);
                    setShowNewMenu(false);
                    setExpandedGroups(prev => ({ ...prev, personal: true }));
                  }}
                  className="w-full text-left px-3 py-2 text-[13px] text-[#1F2937] hover:bg-[#F9FAFB] transition-colors flex items-center gap-2"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-[#60A5FA]" />
                  <span>Quick to-do</span>
                </button>
                <button
                  onClick={handleNewProjectTask}
                  className="w-full text-left px-3 py-2 text-[13px] text-[#1F2937] hover:bg-[#F9FAFB] transition-colors flex items-center gap-2 border-t border-[#E5E7EB]"
                >
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#60A5FA]" />
                  <span>Project task</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Two collapsible groups in scrollable area */}
      <div className="px-4 py-3 custom-scrollbar space-y-4" style={{ flex: 1, overflowY: 'auto' }}>
        {renderGroup('Assigned', assignedTasks.length, 'assigned', assignedTasks, true)}
        {renderGroup('Personal', personalTasks.length, 'personal', personalTasks, false)}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-[#E5E7EB] flex items-center justify-between" style={{ minHeight: '36px', paddingTop: '8px' }}>
        <button className="text-[11px] text-[#3B82F6] hover:text-[#2563EB] hover:underline transition-all">
          All tasks →
        </button>
        <span className="text-[11px] text-[#6B7280]">{totalActive} active</span>
      </div>
    </div>
  );
}