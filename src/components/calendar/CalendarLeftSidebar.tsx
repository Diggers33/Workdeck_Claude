import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, AlertTriangle, X, Edit2, Search, GripVertical, Loader2 } from 'lucide-react';
import { CalendarTask } from './WorkdeckCalendar';
import { TaskCompletionModal } from './TaskCompletionModal';

interface CurrentUserInfo {
  id: string;
  fullName: string;
  email?: string;
}

interface TeamMember {
  id: string;
  fullName: string;
  email?: string;
  color: string;
}

interface ColumnInfo {
  id: string;
  name: string;
  count: number;
}

interface CalendarLeftSidebarProps {
  tasks: CalendarTask[];
  columns?: ColumnInfo[];
  selectedColumn: string;
  onColumnChange: (column: string) => void;
  onTaskDrag: (task: CalendarTask) => void;
  selectedCalendars: string[];
  onCalendarsChange: (calendars: string[]) => void;
  currentUser?: CurrentUserInfo | null;
  teamMembers?: TeamMember[];
  onSearchUsers?: (query: string) => void;
  searchResults?: TeamMember[];
  isLoadingSearch?: boolean;
  isLoading?: boolean;
}

export function CalendarLeftSidebar({
  tasks,
  columns: columnsProp,
  selectedColumn,
  onColumnChange,
  onTaskDrag,
  selectedCalendars,
  onCalendarsChange,
  currentUser,
  teamMembers = [],
  onSearchUsers,
  searchResults = [],
  isLoadingSearch = false,
  isLoading = false
}: CalendarLeftSidebarProps) {
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [taskToComplete, setTaskToComplete] = useState<CalendarTask | null>(null);
  const [searchCalendar, setSearchCalendar] = useState('');
  const [weekSummaryCollapsed, setWeekSummaryCollapsed] = useState(true);
  const [teamCalendarsCollapsed, setTeamCalendarsCollapsed] = useState(false); // Start expanded so users see search
  const [compactMode, setCompactMode] = useState(false);
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);

  // Use columns from props if provided, otherwise fallback to default
  const columns = useMemo(() => {
    if (columnsProp && columnsProp.length > 0) {
      return columnsProp;
    }
    // Fallback to basic column if none provided
    return [
      { id: 'All tasks', name: 'All tasks', count: tasks.length },
    ];
  }, [columnsProp, tasks.length]);

  // Filter tasks based on selected column
  const filteredTasks = useMemo(() => {
    if (selectedColumn === 'All tasks') {
      return tasks;
    }
    // Find the column by id or name
    const col = columns.find(c => c.id === selectedColumn || c.name === selectedColumn);
    if (col && col.id !== 'All tasks') {
      return tasks.filter(t => t.columnId === col.id || t.column === col.name);
    }
    return tasks;
  }, [tasks, selectedColumn, columns]);

  // Build calendars list with current user at the top + team members
  const currentUserCalendarName = currentUser ? `${currentUser.fullName} (You)` : 'You';
  const allCalendars = useMemo(() => {
    const calendars = [
      { id: currentUser?.id || 'you', name: currentUserCalendarName, color: '#0066FF' },
    ];
    // Add team members (avoid duplicates)
    teamMembers.forEach(member => {
      if (member.id !== currentUser?.id) {
        calendars.push({
          id: member.id,
          name: member.fullName,
          color: member.color
        });
      }
    });
    return calendars;
  }, [currentUser, currentUserCalendarName, teamMembers]);

  const toggleTaskExpand = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const getProgressPercentage = (task: CalendarTask) => {
    if (task.estimatedHours === 0) return 0;
    return Math.min(100, (task.loggedHours / task.estimatedHours) * 100);
  };

  const getProgressColor = (task: CalendarTask) => {
    const percentage = getProgressPercentage(task);
    if (task.loggedHours > task.estimatedHours) return '#F97316';
    if (percentage === 100) return '#10B981';
    if (percentage > 0) return '#0066FF';
    return '#E5E7EB';
  };

  const getStatusIcon = (task: CalendarTask) => {
    const percentage = getProgressPercentage(task);
    if (percentage === 100) return '✓';
    if (task.loggedHours === 0) return '⚠️';
    return '';
  };

  // Calculate weekly summary based on filtered tasks
  const totalScheduled = filteredTasks.reduce((sum, task) => sum + task.loggedHours, 0);
  const totalEstimated = filteredTasks.reduce((sum, task) => sum + task.estimatedHours, 0);
  const totalUnscheduled = filteredTasks.reduce((sum, task) => {
    const remaining = task.estimatedHours - task.loggedHours;
    return sum + (remaining > 0 ? remaining : 0);
  }, 0);
  const unscheduledCount = filteredTasks.filter(t => t.loggedHours === 0).length;

  // Get display name for selected column
  const selectedColumnName = useMemo(() => {
    const col = columns.find(c => c.id === selectedColumn);
    return col?.name || selectedColumn;
  }, [columns, selectedColumn]);

  return (
    <div style={{
      width: '320px',
      flexShrink: 0,
      background: 'white',
      borderRight: '1px solid #E5E7EB',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0A0A0A', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            My Tasks
            {isLoading ? (
              <Loader2 size={14} className="animate-spin" style={{ color: '#6B7280' }} />
            ) : (
              filteredTasks.length > 0 && <span style={{ color: '#6B7280', fontWeight: 400 }}>({filteredTasks.length})</span>
            )}
          </h3>
          <button
            onClick={() => setCompactMode(!compactMode)}
            style={{
              padding: '4px 8px',
              border: '1px solid #E5E7EB',
              borderRadius: '4px',
              background: compactMode ? '#F9FAFB' : 'white',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 500,
              color: '#6B7280',
              transition: 'all 150ms'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
            onMouseLeave={(e) => e.currentTarget.style.background = compactMode ? '#F9FAFB' : 'white'}
          >
            {compactMode ? 'Normal' : 'Compact'}
          </button>
        </div>
      </div>

      {/* Column Filter */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid #E5E7EB', flexShrink: 0 }}>
        <div style={{ position: 'relative', display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowColumnPicker(!showColumnPicker)}
            style={{
              flex: 1,
              height: '32px',
              padding: '0 10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              background: 'white',
              cursor: 'pointer',
              fontSize: '13px',
              color: '#0A0A0A',
              fontWeight: 500
            }}
          >
            {selectedColumnName}
            <ChevronDown size={14} />
          </button>

          <button
            style={{
              height: '32px',
              padding: '0 10px',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              background: 'white',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 500,
              color: '#0066FF',
              transition: 'all 150ms',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
          >
            Open board →
          </button>

          {showColumnPicker && (
            <>
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 998
                }}
                onClick={() => setShowColumnPicker(false)}
              />
              <div style={{
                position: 'absolute',
                top: '36px',
                left: 0,
                right: 0,
                background: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                zIndex: 999,
                overflow: 'hidden'
              }}>
                <div style={{ padding: '6px 12px', borderBottom: '1px solid #E5E7EB' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', letterSpacing: '0.05em' }}>
                    MY COLUMNS
                  </div>
                </div>
                {columns.map(col => (
                  <button
                    key={col.id}
                    onClick={() => {
                      onColumnChange(col.id);
                      setShowColumnPicker(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: selectedColumn === col.id ? '#F9FAFB' : 'transparent',
                      border: 'none',
                      fontSize: '13px',
                      color: '#0A0A0A',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                    onMouseLeave={(e) => e.currentTarget.style.background = selectedColumn === col.id ? '#F9FAFB' : 'transparent'}
                  >
                    <span>{col.name}</span>
                    <span style={{ color: '#6B7280' }}>({col.count})</span>
                  </button>
                ))}

                <div style={{ padding: '6px 12px', borderTop: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', letterSpacing: '0.05em' }}>
                    OTHER VIEWS
                  </div>
                </div>
                <button
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'transparent',
                    border: 'none',
                    fontSize: '13px',
                    color: '#0A0A0A',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  Unscheduled only
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Weekly Summary - Collapsible */}
      <div style={{
        borderBottom: '1px solid #E5E7EB',
        flexShrink: 0
      }}>
        <button
          onClick={() => setWeekSummaryCollapsed(!weekSummaryCollapsed)}
          style={{
            width: '100%',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: 'none',
            background: weekSummaryCollapsed ? 'transparent' : '#F9FAFB',
            cursor: 'pointer',
            fontSize: '13px',
            textAlign: 'left',
            transition: 'background 150ms'
          }}
          onMouseEnter={(e) => !weekSummaryCollapsed && (e.currentTarget.style.background = '#F3F4F6')}
          onMouseLeave={(e) => !weekSummaryCollapsed && (e.currentTarget.style.background = '#F9FAFB')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
            {weekSummaryCollapsed ? <ChevronRight size={16} color="#6B7280" /> : <ChevronDown size={16} color="#6B7280" />}
            <span style={{ fontWeight: 600, color: '#0A0A0A' }}>This Week</span>
            {weekSummaryCollapsed && (
              <span style={{ fontSize: '12px', color: '#6B7280' }}>
                {totalScheduled.toFixed(1)}h / {totalEstimated.toFixed(1)}h
                {unscheduledCount > 0 && ` · ${unscheduledCount} unscheduled`}
              </span>
            )}
          </div>
          {weekSummaryCollapsed && unscheduledCount > 0 && <AlertTriangle size={14} color="#F97316" />}
        </button>

        {!weekSummaryCollapsed && (
          <div style={{ padding: '0 20px 16px 20px' }}>
            <div style={{ fontSize: '13px', color: '#374151', marginBottom: '4px' }}>
              <span style={{ fontWeight: 500 }}>Scheduled:</span> {totalScheduled.toFixed(1)}h
            </div>
            <div style={{ fontSize: '13px', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span><span style={{ fontWeight: 500 }}>Unscheduled:</span> {totalUnscheduled.toFixed(1)}h ({unscheduledCount} tasks)</span>
              {unscheduledCount > 0 && <AlertTriangle size={14} color="#F97316" />}
            </div>
            <div style={{ fontSize: '12px', color: '#6B7280', fontStyle: 'italic' }}>
              Drag tasks to calendar to schedule time
            </div>
          </div>
        )}
      </div>

      {/* Task List - 3/5 of available space */}
      <div style={{ flex: 3, overflowY: 'auto', padding: '12px 20px', minHeight: '100px' }}>
        {/* Loading State */}
        {isLoading && filteredTasks.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#6B7280' }}>
            <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontSize: '13px' }}>Loading tasks...</div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredTasks.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#6B7280' }}>
            <div style={{ fontSize: '13px', marginBottom: '4px' }}>No tasks in this column</div>
            <div style={{ fontSize: '12px' }}>Tasks will appear here when assigned to you</div>
          </div>
        )}

        {filteredTasks.map(task => {
          const isExpanded = expandedTasks.has(task.id);
          const progress = getProgressPercentage(task);
          const progressColor = getProgressColor(task);
          const isOverBudget = task.loggedHours > task.estimatedHours;
          const isComplete = progress === 100;
          const statusIcon = getStatusIcon(task);
          const isHovered = hoveredTask === task.id;

          if (compactMode) {
            // ULTRA-COMPACT MODE - Single line
            return (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => {
                  onTaskDrag(task);
                  e.dataTransfer.effectAllowed = 'copy';
                  e.dataTransfer.setData('task', JSON.stringify(task));
                }}
                onClick={(e) => toggleTaskExpand(task.id, e)}
                style={{
                  marginBottom: '4px',
                  padding: '8px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  background: 'white',
                  cursor: 'grab',
                  transition: 'all 150ms',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#D1D5DB';
                  e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)';
                  setHoveredTask(task.id);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.boxShadow = 'none';
                  setHoveredTask(null);
                }}
              >
                {isHovered && <GripVertical size={12} color="#9CA3AF" style={{ flexShrink: 0 }} />}
                <div
                  style={{
                    width: '3px',
                    height: '12px',
                    borderRadius: '2px',
                    background: task.projectColor,
                    flexShrink: 0
                  }}
                />
                <div style={{ flex: 1, minWidth: 0, fontSize: '12px', color: '#0A0A0A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <span style={{ fontWeight: 500 }}>{task.project}</span> — {task.title}
                </div>
                <div style={{ fontSize: '12px', color: '#6B7280', flexShrink: 0 }}>
                  {task.loggedHours}/{task.estimatedHours}h
                </div>
                {progress > 0 && progress < 100 && (
                  <div style={{ fontSize: '11px', color: '#6B7280', flexShrink: 0 }}>
                    {Math.round(progress)}%
                  </div>
                )}
                {statusIcon && <span style={{ flexShrink: 0 }}>{statusIcon}</span>}
              </div>
            );
          }

          // NORMAL MODE - 2 lines with progress bar
          return (
            <div
              key={task.id}
              draggable
              onDragStart={(e) => {
                onTaskDrag(task);
                e.dataTransfer.effectAllowed = 'copy';
                e.dataTransfer.setData('task', JSON.stringify(task));
                // Prevent click event after drag
                const target = e.currentTarget;
                target.style.opacity = '0.5';
              }}
              onDragEnd={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
              onClick={(e) => {
                if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.task-main')) {
                  toggleTaskExpand(task.id, e);
                }
              }}
              style={{
                marginBottom: '8px',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                background: 'white',
                cursor: 'grab',
                transition: 'all 150ms',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#D1D5DB';
                e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.06)';
                setHoveredTask(task.id);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E5E7EB';
                e.currentTarget.style.boxShadow = 'none';
                setHoveredTask(null);
              }}
            >
              {/* Line 1: Project + Task + Stats */}
              <div className="task-main" style={{ padding: '10px 10px 8px 10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isHovered && <GripVertical size={14} color="#9CA3AF" style={{ flexShrink: 0 }} />}
                <div
                  style={{
                    width: '3px',
                    height: '14px',
                    borderRadius: '2px',
                    background: task.projectColor,
                    flexShrink: 0
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', color: '#0A0A0A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span style={{ fontWeight: 500 }}>{task.project}</span>
                    <span style={{ color: '#6B7280' }}> — {task.title}</span>
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: '#6B7280', flexShrink: 0, fontWeight: 500 }}>
                  {task.loggedHours}/{task.estimatedHours}h
                </div>
                {statusIcon && <span style={{ flexShrink: 0, fontSize: '14px' }}>{statusIcon}</span>}
                <button
                  onClick={(e) => toggleTaskExpand(task.id, e)}
                  style={{
                    width: '20px',
                    height: '20px',
                    padding: 0,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: '#9CA3AF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
              </div>

              {/* Line 2: Progress Bar */}
              <div style={{ padding: '0 10px 10px 10px' }}>
                <div style={{
                  height: '4px',
                  background: '#F3F4F6',
                  borderRadius: '2px',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <div style={{
                    width: `${Math.min(100, progress)}%`,
                    height: '100%',
                    background: progressColor,
                    transition: 'width 300ms ease'
                  }} />
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div style={{
                  padding: '12px 10px',
                  borderTop: '1px solid #E5E7EB',
                  background: '#FAFBFC',
                  fontSize: '12px'
                }}>
                  <div style={{ marginBottom: '8px', color: '#374151' }}>
                    <div style={{ marginBottom: '4px' }}><span style={{ fontWeight: 500 }}>Estimated:</span> {task.estimatedHours}h</div>
                    <div style={{ marginBottom: '4px' }}><span style={{ fontWeight: 500 }}>Logged:</span> {task.loggedHours}h</div>
                    <div style={{ marginBottom: '8px' }}>
                      <span style={{ fontWeight: 500 }}>Remaining:</span> {Math.max(0, task.estimatedHours - task.loggedHours).toFixed(1)}h
                      {isOverBudget && <span style={{ color: '#F97316' }}> (+{(task.loggedHours - task.estimatedHours).toFixed(1)}h over)</span>}
                    </div>
                    <div style={{ color: '#6B7280' }}>
                      👥 {task.assignedTo.join(' + ')}
                    </div>
                  </div>
                  <button
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '4px',
                      background: 'white',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 500,
                      color: '#0A0A0A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'all 150ms',
                      marginBottom: '6px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#F9FAFB';
                      e.currentTarget.style.borderColor = '#0066FF';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.borderColor = '#E5E7EB';
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setTaskToComplete(task);
                      setShowCompletionModal(true);
                    }}
                  >
                    ☐ Mark my part complete
                  </button>
                  <button
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: 'none',
                      borderRadius: '4px',
                      background: 'transparent',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 500,
                      color: '#0066FF',
                      transition: 'all 150ms'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('View task:', task);
                    }}
                  >
                    View task →
                  </button>
                </div>
              )}

              {/* Drag Tooltip on Hover */}
              {isHovered && !isExpanded && (
                <div style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  marginBottom: '4px',
                  padding: '4px 8px',
                  background: '#1F2937',
                  color: 'white',
                  fontSize: '11px',
                  borderRadius: '4px',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  zIndex: 100
                }}>
                  Drag to calendar to log time
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Calendars - 2/5 of available space */}
      <div style={{
        borderTop: '1px solid #E5E7EB',
        flex: teamCalendarsCollapsed ? 'none' : 2,
        minHeight: teamCalendarsCollapsed ? 'auto' : '120px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <button
          onClick={() => setTeamCalendarsCollapsed(!teamCalendarsCollapsed)}
          style={{
            width: '100%',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: '13px',
            textAlign: 'left',
            transition: 'background 150ms'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {teamCalendarsCollapsed ? <ChevronRight size={16} color="#6B7280" /> : <ChevronDown size={16} color="#6B7280" />}
            <span style={{ fontWeight: 600, color: '#0A0A0A' }}>Calendars</span>
            <span style={{ fontSize: '12px', color: '#6B7280' }}>
              ({selectedCalendars.length} selected)
            </span>
          </div>
        </button>

        {!teamCalendarsCollapsed && (
          <div style={{ padding: '0 20px 16px 20px', flex: 1, overflowY: 'auto' }}>
            {/* Team Members List */}
            <div style={{ marginBottom: '12px' }}>
              {allCalendars.map(member => {
                const isSelected = selectedCalendars.includes(member.name);
                return (
                  <label
                    key={member.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 6px',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      transition: 'background 150ms'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        const newSelected = new Set(selectedCalendars);
                        if (e.target.checked) {
                          newSelected.add(member.name);
                        } else {
                          newSelected.delete(member.name);
                        }
                        onCalendarsChange(Array.from(newSelected));
                      }}
                      style={{
                        width: '16px',
                        height: '16px',
                        cursor: 'pointer',
                        accentColor: member.color
                      }}
                    />
                    <span style={{ flex: 1, fontSize: '13px', color: '#0A0A0A' }}>
                      {member.name}
                    </span>
                    {member.id === currentUserCalendarName && (
                      <button
                        style={{
                          width: '20px',
                          height: '20px',
                          padding: 0,
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          color: '#9CA3AF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '4px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#E5E7EB'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <Edit2 size={12} />
                      </button>
                    )}
                  </label>
                );
              })}
            </div>

            {/* Search Company Users */}
            <div style={{ marginTop: '8px', marginBottom: '6px' }}>
              <div style={{ fontSize: '11px', color: '#6B7280' }}>
                View anyone's calendar
              </div>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchCalendar}
                onChange={(e) => {
                  setSearchCalendar(e.target.value);
                  if (onSearchUsers) {
                    onSearchUsers(e.target.value);
                  }
                }}
                style={{
                  width: '100%',
                  height: '32px',
                  padding: '0 10px 0 32px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#0A0A0A',
                  outline: 'none'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#0066FF'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}
              />
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9CA3AF',
                  pointerEvents: 'none'
                }}
              />
              {/* Search Results Dropdown */}
              {searchCalendar.trim() && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '4px',
                  background: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 100
                }}>
                  {isLoadingSearch ? (
                    <div style={{ padding: '12px', textAlign: 'center', color: '#6B7280', fontSize: '12px' }}>
                      <Loader2 size={14} className="animate-spin" style={{ margin: '0 auto 4px' }} />
                      Searching...
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map(user => {
                      const isAlreadyAdded = allCalendars.some(c => c.id === user.id);
                      return (
                        <button
                          key={user.id}
                          onClick={() => {
                            if (!isAlreadyAdded) {
                              // Add to selected calendars
                              onCalendarsChange([...selectedCalendars, user.fullName]);
                            }
                            setSearchCalendar('');
                          }}
                          disabled={isAlreadyAdded}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            border: 'none',
                            background: 'transparent',
                            cursor: isAlreadyAdded ? 'default' : 'pointer',
                            opacity: isAlreadyAdded ? 0.5 : 1,
                            textAlign: 'left'
                          }}
                          onMouseEnter={(e) => !isAlreadyAdded && (e.currentTarget.style.background = '#F9FAFB')}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: user.color,
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: 600
                          }}>
                            {user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', color: '#0A0A0A' }}>{user.fullName}</div>
                            {user.email && <div style={{ fontSize: '11px', color: '#6B7280' }}>{user.email}</div>}
                          </div>
                          {isAlreadyAdded && <span style={{ fontSize: '11px', color: '#6B7280' }}>Added</span>}
                        </button>
                      );
                    })
                  ) : (
                    <div style={{ padding: '12px', textAlign: 'center', color: '#6B7280', fontSize: '12px' }}>
                      No users found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Task Completion Modal */}
      {showCompletionModal && taskToComplete && (
        <TaskCompletionModal
          task={taskToComplete}
          onClose={() => setShowCompletionModal(false)}
          onConfirm={() => {
            console.log('Task completed:', taskToComplete);
            setShowCompletionModal(false);
          }}
        />
      )}
    </div>
  );
}