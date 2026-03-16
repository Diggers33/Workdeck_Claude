import React, { forwardRef, useState } from 'react';
import { GanttActivity } from './types';
import { Plus, MoreVertical, Edit2, Copy, MoveVertical, Trash2, Square } from 'lucide-react';

interface GanttTaskListProps {
  tasks: GanttActivity[];
  onToggleActivity: (id: string) => void;
  onScroll: () => void;
  hoveredTask: string | null;
  onSetHoveredTask: (taskId: string | null) => void;
  onTaskClick?: (task: any) => void;
  onCreateTask?: (activityId: string) => void;
  zoomLevel?: number;
}

export const GanttTaskList = forwardRef<HTMLDivElement, GanttTaskListProps>(
  ({ tasks, onToggleActivity, onScroll, hoveredTask, onSetHoveredTask, onTaskClick, onCreateTask, zoomLevel = 100 }, ref) => {
    const [hoveredActivity, setHoveredActivity] = useState<string | null>(null);
    const [hoveredTaskRow, setHoveredTaskRow] = useState<string | null>(null);
    const [openActivityMenu, setOpenActivityMenu] = useState<string | null>(null);
    const [openTaskMenu, setOpenTaskMenu] = useState<string | null>(null);
    const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
    
    // Calculate scaled dimensions
    const scale = zoomLevel / 100;
    const ACTIVITY_HEIGHT = Math.round(56 * scale);
    const TASK_HEIGHT = Math.round(44 * scale);
    const PADDING_X = Math.round(20 * scale);
    const ICON_SIZE = Math.round(16 * scale);
    
    // Calculate column width - scale from 400px to 700px
    const COLUMN_WIDTH = Math.round(400 + (zoomLevel - 50) * 3); // 50%→400px, 100%→550px, 150%→700px
    
    // Text sizes - scale gently with zoom
    const ACTIVITY_TEXT_SIZE = 14;
    const TASK_TEXT_SIZE = 13;
    const META_TEXT_SIZE = 12;
    const AVATAR_TEXT_SIZE = Math.round(12 * scale); // Scale avatar text fully
    const ADD_TASK_TEXT_SIZE = Math.round(14 * (0.85 + scale * 0.15)); // Gentle scaling for add task text

    const handleActivityMenuClick = (activityId: string, event: React.MouseEvent) => {
      event.stopPropagation();
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      setMenuPosition({ top: rect.bottom + 4, left: rect.left - 200 + 32 });
      setOpenActivityMenu(openActivityMenu === activityId ? null : activityId);
      setOpenTaskMenu(null);
    };

    const handleTaskMenuClick = (taskId: string, event: React.MouseEvent) => {
      event.stopPropagation();
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      setMenuPosition({ top: rect.bottom + 4, left: rect.left - 200 + 28 });
      setOpenTaskMenu(openTaskMenu === taskId ? null : taskId);
      setOpenActivityMenu(null);
    };

    const closeMenus = () => {
      setOpenActivityMenu(null);
      setOpenTaskMenu(null);
    };

    return (
      <>
        <div
          ref={ref}
          onScroll={onScroll}
          style={{
            width: `${COLUMN_WIDTH}px`,
            flexShrink: 0,
            background: 'white',
            borderRight: '2px solid #E5E7EB',
            overflowX: 'hidden',
            overflowY: 'auto',
            position: 'relative'
          }}
        >
          {/* Task Rows */}
          <div>
          {tasks.map((task) => (
            <div key={task.id}>
              {/* Activity Row */}
              <div 
                style={{
                  height: `${ACTIVITY_HEIGHT}px`,
                  background: hoveredActivity === task.id ? '#F3F4F6' : '#FAFAFA',
                  borderBottom: '1px solid #F3F4F6',
                  borderLeft: `4px solid ${task.borderColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  padding: `0 ${PADDING_X}px`,
                  cursor: 'pointer',
                  transition: 'background 150ms ease',
                  position: 'relative'
                }}
                onClick={() => onToggleActivity(task.id)}
                onMouseEnter={() => setHoveredActivity(task.id)}
                onMouseLeave={() => setHoveredActivity(null)}
              >
                <div className="flex items-center justify-between" style={{ flex: 1 }}>
                  <div className="flex items-center" style={{ gap: '12px' }}>
                    <span style={{ fontSize: `${ACTIVITY_TEXT_SIZE}px`, color: task.expanded ? '#3B82F6' : '#6B7280' }}>
                      {task.expanded ? '▼' : '▶'}
                    </span>
                    <span style={{ fontSize: `${ACTIVITY_TEXT_SIZE}px`, fontWeight: 600, color: '#0A0A0A' }}>
                      {task.name}
                    </span>
                    {task.taskCount && (
                      <span style={{ fontSize: `${META_TEXT_SIZE}px`, fontWeight: 400, color: '#9CA3AF' }}>
                        {task.taskCount} tasks
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: `${META_TEXT_SIZE}px`, fontWeight: 400, color: '#9CA3AF' }}>
                    {task.duration}
                  </span>
                </div>
                
                {/* Quick Actions - Appear on Hover */}
                {hoveredActivity === task.id && (
                  <div 
                    style={{ 
                      display: 'flex', 
                      gap: '6px', 
                      marginLeft: '12px',
                      animation: 'fadeIn 150ms ease'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Add Task Button */}
                    <button
                      style={{
                        width: '32px',
                        height: '32px',
                        background: 'white',
                        border: '1px solid #E5E7EB',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#6B7280',
                        transition: 'all 150ms ease'
                      }}
                      onClick={() => {
                        if (onCreateTask) onCreateTask(task.id);
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#F9FAFB';
                        e.currentTarget.style.color = '#3B82F6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'white';
                        e.currentTarget.style.color = '#6B7280';
                      }}
                      title="Add task"
                    >
                      <Plus size={16} />
                    </button>
                    
                    {/* More Menu Button */}
                    <button
                      style={{
                        width: '32px',
                        height: '32px',
                        background: openActivityMenu === task.id ? '#F9FAFB' : 'white',
                        border: '1px solid #E5E7EB',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#6B7280',
                        transition: 'all 150ms ease'
                      }}
                      onClick={(e) => handleActivityMenuClick(task.id, e)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#F9FAFB';
                      }}
                      onMouseLeave={(e) => {
                        if (openActivityMenu !== task.id) {
                          e.currentTarget.style.background = 'white';
                        }
                      }}
                    >
                      <MoreVertical size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Child Task Rows */}
              {task.expanded && task.children && task.children.filter(child => child.type !== 'milestone').map((child) => (
                <div
                  key={child.id}
                  style={{
                    height: `${TASK_HEIGHT}px`,
                    background: child.type === 'milestone' 
                      ? (hoveredTaskRow === child.id ? '#F0F9FF' : '#F7FBFF')
                      : (hoveredTaskRow === child.id 
                        ? (child.warning ? '#FEF3C7' : '#F9FAFB')
                        : (child.warning ? '#FEF9E7' : 'white')),
                    borderBottom: '1px solid #F3F4F6',
                    borderLeft: child.type === 'milestone' ? '3px solid #3B82F6' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    padding: `0 ${PADDING_X}px 0 52px`,
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background 150ms ease'
                  }}
                  onClick={() => {
                    if (onTaskClick) onTaskClick(child);
                  }}
                  onMouseEnter={() => {
                    setHoveredTaskRow(child.id);
                    onSetHoveredTask(child.id);
                  }}
                  onMouseLeave={() => {
                    setHoveredTaskRow(null);
                    onSetHoveredTask(null);
                  }}
                >
                  {/* Connection Line */}
                  <span style={{ 
                    position: 'absolute', 
                    left: '32px', 
                    fontSize: '14px', 
                    color: '#D1D5DB' 
                  }}>
                    └
                  </span>

                  <div className="flex items-center justify-between" style={{ flex: 1 }}>
                    <div className="flex items-center" style={{ gap: '12px', minWidth: 0, flex: 1 }}>
                      {/* Milestone Diamond Icon */}
                      {child.type === 'milestone' && (
                        <div style={{
                          width: '20px',
                          height: '20px',
                          flexShrink: 0,
                          background: child.status === 'completed' ? '#10B981' : child.status === 'overdue' ? '#EF4444' : '#3B82F6',
                          transform: 'rotate(45deg)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '2px solid white',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                          <span style={{
                            transform: 'rotate(-45deg)',
                            fontSize: '10px',
                            color: 'white',
                            fontWeight: 700
                          }}>
                            {child.status === 'completed' ? '✓' : '◆'}
                          </span>
                        </div>
                      )}
                      
                      <span style={{ 
                        fontSize: `${TASK_TEXT_SIZE}px`, 
                        fontWeight: child.type === 'milestone' ? 600 : 400, 
                        color: child.type === 'milestone' ? '#3B82F6' : '#0A0A0A',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        minWidth: 0,
                        flex: 1
                      }}>
                        {child.name}
                      </span>
                      
                      {/* Due Date for Milestones */}
                      {child.type === 'milestone' && child.dueDate && (
                        <span style={{
                          fontSize: '12px',
                          color: child.status === 'overdue' ? '#EF4444' : '#6B7280',
                          background: child.status === 'overdue' ? '#FEE2E2' : '#F3F4F6',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontWeight: 500
                        }}>
                          {child.dueDate}
                        </span>
                      )}
                      
                      {/* Avatars - Only for tasks */}
                      {child.type !== 'milestone' && child.avatars && (
                        <div className="flex items-center">
                          {child.avatars.map((avatar, idx) => (
                            <div
                              key={idx}
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                background: idx === 0 ? '#3B82F6' : idx === 1 ? '#10B981' : '#F97316',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: `${AVATAR_TEXT_SIZE}px`,
                                fontWeight: 500,
                                color: 'white',
                                marginLeft: idx > 0 ? '-6px' : '0',
                                border: '2px solid white'
                              }}
                            >
                              {avatar}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Indicators */}
                      {child.flag && <span style={{ fontSize: '14px' }}>🚩</span>}
                      {child.type !== 'milestone' && child.milestone && <span style={{ fontSize: '14px' }}>🔷</span>}
                    </div>
                    
                    <div className="flex items-center" style={{ gap: '8px' }}>
                      {/* Hours - Only for tasks */}
                      {child.type !== 'milestone' && child.hours && (
                        <span style={{ 
                          fontSize: '13px', 
                          fontWeight: child.hoursColor === '#DC2626' ? 700 : 600, 
                          color: child.hoursColor 
                        }}>
                          {child.hours}
                        </span>
                      )}
                      {child.completed && <span style={{ fontSize: '12px', color: '#10B981' }}>✓</span>}
                      {child.warning && <span style={{ fontSize: '14px' }}>⚠️</span>}
                      
                      {/* Quick Actions - Appear on Hover */}
                      {hoveredTaskRow === child.id && (
                        <div 
                          style={{ 
                            display: 'flex', 
                            gap: '6px',
                            marginLeft: '8px',
                            animation: 'fadeIn 150ms ease'
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Edit Button */}
                          <button
                            style={{
                              width: '28px',
                              height: '28px',
                              background: 'white',
                              border: '1px solid #E5E7EB',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              color: '#6B7280',
                              transition: 'all 150ms ease'
                            }}
                            onClick={() => {
                              if (onTaskClick) onTaskClick(child);
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#F9FAFB';
                              e.currentTarget.style.color = '#3B82F6';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'white';
                              e.currentTarget.style.color = '#6B7280';
                            }}
                            title="Edit task"
                          >
                            <Edit2 size={14} />
                          </button>
                          
                          {/* More Menu Button */}
                          <button
                            style={{
                              width: '28px',
                              height: '28px',
                              background: openTaskMenu === child.id ? '#F9FAFB' : 'white',
                              border: '1px solid #E5E7EB',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              color: '#6B7280',
                              transition: 'all 150ms ease'
                            }}
                            onClick={(e) => handleTaskMenuClick(child.id, e)}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#F9FAFB';
                            }}
                            onMouseLeave={(e) => {
                              if (openTaskMenu !== child.id) {
                                e.currentTarget.style.background = 'white';
                              }
                            }}
                          >
                            <MoreVertical size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Add Task Row - After Last Task in Expanded Activity */}
              {task.expanded && task.children && task.children.length > 0 && (
                <div
                  style={{
                    height: '48px',
                    background: 'white',
                    padding: `0 ${PADDING_X}px 0 52px`,
                    borderTop: '1px dashed #E5E7EB',
                    borderBottom: '1px solid #F3F4F6',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    transition: 'all 150ms ease'
                  }}
                  onClick={() => {
                    if (onCreateTask) onCreateTask(task.id);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#F9FAFB';
                    const icon = e.currentTarget.querySelector('.add-icon') as HTMLElement;
                    const text = e.currentTarget.querySelector('.add-text') as HTMLElement;
                    if (icon) icon.style.color = '#3B82F6';
                    if (text) text.style.color = '#3B82F6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                    const icon = e.currentTarget.querySelector('.add-icon') as HTMLElement;
                    const text = e.currentTarget.querySelector('.add-text') as HTMLElement;
                    if (icon) icon.style.color = '#6B7280';
                    if (text) text.style.color = '#6B7280';
                  }}
                >
                  <Plus className="add-icon" size={16} style={{ color: '#6B7280', transition: 'color 150ms ease' }} />
                  <span className="add-text" style={{ fontSize: `${ADD_TASK_TEXT_SIZE}px`, fontWeight: 400, color: '#6B7280', transition: 'color 150ms ease' }}>
                    Add task
                  </span>
                </div>
              )}
            </div>
          ))}
          </div>

          {/* Fade Indicator Row */}
          <div style={{
            height: '56px',
            background: 'linear-gradient(to bottom, white, #FAFAFA)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid #F3F4F6'
          }}>
            <span style={{ fontSize: '13px', fontStyle: 'italic', color: '#9CA3AF' }}>
              5 more activities...
            </span>
          </div>
          
          {/* Bottom Add Activity Row */}
          <div
            style={{
              height: '56px',
              background: 'white',
              borderTop: '1px dashed #E5E7EB',
              padding: `0 ${PADDING_X}px`,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              transition: 'all 150ms ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#F9FAFB';
              const icon = e.currentTarget.querySelector('.bottom-add-icon') as HTMLElement;
              const text = e.currentTarget.querySelector('.bottom-add-text') as HTMLElement;
              if (icon) icon.style.color = '#3B82F6';
              if (text) text.style.color = '#3B82F6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              const icon = e.currentTarget.querySelector('.bottom-add-icon') as HTMLElement;
              const text = e.currentTarget.querySelector('.bottom-add-text') as HTMLElement;
              if (icon) icon.style.color = '#6B7280';
              if (text) text.style.color = '#6B7280';
            }}
          >
            <Plus className="bottom-add-icon" size={18} style={{ color: '#6B7280', transition: 'color 150ms ease' }} />
            <span className="bottom-add-text" style={{ fontSize: '14px', fontWeight: 400, color: '#6B7280', transition: 'color 150ms ease' }}>
              Add activity
            </span>
            <span style={{ fontSize: '12px', fontStyle: 'italic', color: '#9CA3AF', marginLeft: '8px' }}>
              or press N
            </span>
          </div>
        </div>

        {/* Activity Context Menu */}
        {openActivityMenu && menuPosition && (
          <>
            {/* Backdrop to close menu */}
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 999
              }}
              onClick={closeMenus}
            />
            
            <div
              style={{
                position: 'fixed',
                top: `${menuPosition.top}px`,
                left: `${menuPosition.left}px`,
                width: '200px',
                background: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                padding: '8px',
                zIndex: 1000
              }}
            >
              {/* Add task */}
              <div
                style={{
                  height: '36px',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  transition: 'background 150ms ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                onClick={() => {
                  if (onCreateTask && openActivityMenu) onCreateTask(openActivityMenu);
                  closeMenus();
                }}
              >
                <Plus size={16} style={{ color: '#6B7280' }} />
                <span style={{ fontSize: '14px', fontWeight: 400, color: '#0A0A0A' }}>Add task</span>
              </div>
              
              {/* Add sub-activity */}
              <div
                style={{
                  height: '36px',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  transition: 'background 150ms ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                onClick={closeMenus}
              >
                <Square size={16} style={{ color: '#6B7280' }} />
                <span style={{ fontSize: '14px', fontWeight: 400, color: '#0A0A0A' }}>Add sub-activity</span>
              </div>
              
              {/* Separator */}
              <div style={{ height: '1px', background: '#F3F4F6', margin: '4px 0' }} />
              
              {/* Edit activity */}
              <div
                style={{
                  height: '36px',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  transition: 'background 150ms ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                onClick={closeMenus}
              >
                <Edit2 size={16} style={{ color: '#6B7280' }} />
                <span style={{ fontSize: '14px', fontWeight: 400, color: '#0A0A0A' }}>Edit activity</span>
              </div>
              
              {/* Duplicate */}
              <div
                style={{
                  height: '36px',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  transition: 'background 150ms ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                onClick={closeMenus}
              >
                <Copy size={16} style={{ color: '#6B7280' }} />
                <span style={{ fontSize: '14px', fontWeight: 400, color: '#0A0A0A' }}>Duplicate</span>
              </div>
              
              {/* Move */}
              <div
                style={{
                  height: '36px',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  transition: 'background 150ms ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                onClick={closeMenus}
              >
                <MoveVertical size={16} style={{ color: '#6B7280' }} />
                <span style={{ fontSize: '14px', fontWeight: 400, color: '#0A0A0A' }}>Move activity</span>
              </div>
              
              {/* Separator */}
              <div style={{ height: '1px', background: '#F3F4F6', margin: '4px 0' }} />
              
              {/* Delete */}
              <div
                style={{
                  height: '36px',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  transition: 'background 150ms ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#FEE2E2'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                onClick={closeMenus}
              >
                <Trash2 size={16} style={{ color: '#DC2626' }} />
                <span style={{ fontSize: '14px', fontWeight: 400, color: '#DC2626' }}>Delete activity</span>
              </div>
            </div>
          </>
        )}

        {/* Task Context Menu */}
        {openTaskMenu && menuPosition && (
          <>
            {/* Backdrop to close menu */}
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 999
              }}
              onClick={closeMenus}
            />
            
            <div
              style={{
                position: 'fixed',
                top: `${menuPosition.top}px`,
                left: `${menuPosition.left}px`,
                width: '200px',
                background: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                padding: '8px',
                zIndex: 1000
              }}
            >
              {/* Edit task */}
              <div
                style={{
                  height: '36px',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  transition: 'background 150ms ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                onClick={closeMenus}
              >
                <Edit2 size={16} style={{ color: '#6B7280' }} />
                <span style={{ fontSize: '14px', fontWeight: 400, color: '#0A0A0A' }}>Edit task</span>
              </div>
              
              {/* Add subtask */}
              <div
                style={{
                  height: '36px',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  transition: 'background 150ms ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                onClick={closeMenus}
              >
                <Square size={16} style={{ color: '#6B7280' }} />
                <span style={{ fontSize: '14px', fontWeight: 400, color: '#0A0A0A' }}>Add subtask</span>
              </div>
              
              {/* Duplicate */}
              <div
                style={{
                  height: '36px',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  transition: 'background 150ms ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                onClick={closeMenus}
              >
                <Copy size={16} style={{ color: '#6B7280' }} />
                <span style={{ fontSize: '14px', fontWeight: 400, color: '#0A0A0A' }}>Duplicate task</span>
              </div>
              
              {/* Separator */}
              <div style={{ height: '1px', background: '#F3F4F6', margin: '4px 0' }} />
              
              {/* Add milestone */}
              <div
                style={{
                  height: '36px',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  transition: 'background 150ms ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                onClick={closeMenus}
              >
                <span style={{ fontSize: '16px' }}>🔷</span>
                <span style={{ fontSize: '14px', fontWeight: 400, color: '#0A0A0A' }}>Add milestone</span>
              </div>
              
              {/* Add flag */}
              <div
                style={{
                  height: '36px',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  transition: 'background 150ms ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                onClick={closeMenus}
              >
                <span style={{ fontSize: '16px' }}>🚩</span>
                <span style={{ fontSize: '14px', fontWeight: 400, color: '#0A0A0A' }}>Add flag/risk</span>
              </div>
              
              {/* Add dependency */}
              <div
                style={{
                  height: '36px',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  transition: 'background 150ms ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                onClick={closeMenus}
              >
                <span style={{ fontSize: '16px' }}>🔗</span>
                <span style={{ fontSize: '14px', fontWeight: 400, color: '#0A0A0A' }}>Add dependency</span>
              </div>
              
              {/* Separator */}
              <div style={{ height: '1px', background: '#F3F4F6', margin: '4px 0' }} />
              
              {/* Move task */}
              <div
                style={{
                  height: '36px',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  transition: 'background 150ms ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                onClick={closeMenus}
              >
                <MoveVertical size={16} style={{ color: '#6B7280' }} />
                <span style={{ fontSize: '14px', fontWeight: 400, color: '#0A0A0A' }}>Move to activity...</span>
              </div>
              
              {/* Delete */}
              <div
                style={{
                  height: '36px',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  transition: 'background 150ms ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#FEE2E2'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                onClick={closeMenus}
              >
                <Trash2 size={16} style={{ color: '#DC2626' }} />
                <span style={{ fontSize: '14px', fontWeight: 400, color: '#DC2626' }}>Delete task</span>
              </div>
            </div>
          </>
        )}
      </>
    );
  }
);

GanttTaskList.displayName = 'GanttTaskList';