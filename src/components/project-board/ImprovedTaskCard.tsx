import React, { useState } from 'react';
import { Paperclip, MessageSquare, CheckSquare, AlertCircle, Clock, User, MoreVertical, Calendar, X, MessageCircle } from 'lucide-react';
import { Task } from './ProjectBoard';
import { BlockedModal } from './BlockedModal';

interface ImprovedTaskCardProps {
  task: Task;
  columnId: string;
  size: 'small' | 'medium' | 'large';
  showDescription: boolean;
  showParticipants: boolean;
  showProjectReference?: boolean; // For My Work board
  onDragStart: (task: Task, columnId: string) => void;
  onTaskClick: (task: Task) => void;
  onDelete: (columnId: string, taskId: string) => void;
  onMarkAsDone: (columnId: string, taskId: string) => void;
  onUpdateTask?: (columnId: string, taskId: string, updates: any) => void;
  isSelected?: boolean;
  onToggleSelect?: (taskId: string) => void;
  onDragOverTask?: (taskId: string) => void;
}

export function ImprovedTaskCard({
  task,
  columnId,
  size,
  showDescription,
  showParticipants,
  showProjectReference = false,
  onDragStart,
  onTaskClick,
  onDelete,
  onMarkAsDone,
  onUpdateTask,
  isSelected = false,
  onToggleSelect,
  onDragOverTask
}: ImprovedTaskCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showBlockedModal, setShowBlockedModal] = useState(false);

  // Calculate if task is overdue - compare dates only, not times
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const isOverdue = task.dueDate ? (() => {
    const parts = task.dueDate.split('-');
    const dueDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    dueDate.setHours(0, 0, 0, 0);
    return dueDate.getTime() < now.getTime();
  })() : false;

  const daysOverdue = isOverdue && task.dueDate ?
    Math.floor((now.getTime() - new Date(task.dueDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;

  const isDueToday = task.dueDate && (() => {
    const parts = task.dueDate.split('-');
    const dueDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    dueDate.setHours(0, 0, 0, 0);
    return dueDate.getTime() === now.getTime();
  })();

  const isDueThisWeek = task.dueDate && (() => {
    const parts = task.dueDate.split('-');
    const dueDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    dueDate.setHours(0, 0, 0, 0);
    weekFromNow.setHours(0, 0, 0, 0);
    return dueDate >= now && dueDate <= weekFromNow;
  })();

  const isHighPriority = task.priority === 'high';
  const isBlocked = task.status === 'blocked';

  // Determine left border color based on urgency
  const getLeftBorderColor = () => {
    if (isOverdue || isBlocked) return '#F87171'; // Red for overdue/blocked
    if (isHighPriority) return '#ff4f6a'; // Pink-red for high priority
    return task.color; // Default column color
  };

  const getBackgroundColor = () => {
    if (isOverdue) return '#FEF2F2'; // Light red tint
    if (isBlocked) return '#FFF7ED'; // Light orange tint
    return 'white';
  };

  const getPriorityIcon = () => {
    if (!task.priority) return null;
    const color = task.priority === 'high' ? '#F87171' : 
                  task.priority === 'medium' ? '#ff8d00' : '#60A5FA';
    return (
      <div style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: color,
        flexShrink: 0
      }} />
    );
  };

  const formatDueDate = (dateStr: string) => {
    if (isDueToday) return 'Today';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      draggable
      onDragStart={() => onDragStart(task, columnId)}
      onDragEnd={() => {
        // Ensure any drag states are cleared
      }}
      onClick={() => onTaskClick(task)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: getBackgroundColor(),
        border: '1px solid #E5E7EB',
        borderLeft: `4px solid ${getLeftBorderColor()}`,
        borderRadius: '6px',
        padding: size === 'small' ? '12px' : size === 'medium' ? '14px' : '16px',
        cursor: 'pointer',
        boxShadow: isSelected 
          ? '0 0 0 2px #0066FF' 
          : isHovered 
            ? '0 4px 12px rgba(0,0,0,0.08)' 
            : '0 1px 3px rgba(0,0,0,0.04)',
        transition: 'all 150ms ease',
        position: 'relative'
      }}
    >
      {/* Checkbox (on hover) */}
      {isHovered && onToggleSelect && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(task.id);
          }}
          style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            width: '16px',
            height: '16px',
            border: '2px solid #9CA3AF',
            borderRadius: '3px',
            background: isSelected ? '#0066FF' : 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10
          }}
        >
          {isSelected && (
            <div style={{ width: '8px', height: '8px', background: 'white', borderRadius: '1px' }} />
          )}
        </div>
      )}

      {/* SMALL SIZE: Title + Tag + Priority + Overdue indicator */}
      {size === 'small' && (
        <>
          <div style={{
            fontSize: '13px',
            fontWeight: isHighPriority ? 600 : 500,
            color: '#1F2937',
            lineHeight: '1.4',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            marginBottom: '8px'
          }}>
            {task.title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {task.labels && task.labels.length > 0 && (
              <div style={{
                padding: '2px 8px',
                background: task.labels[0].color,
                color: 'white',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: 500
              }}>
                {task.labels[0].name}
              </div>
            )}
            {getPriorityIcon()}
            {isOverdue && (
              <AlertCircle size={14} color="#F87171" style={{ flexShrink: 0 }} />
            )}
            {isBlocked && (
              <div style={{
                padding: '2px 6px',
                background: '#ff8d00',
                color: 'white',
                borderRadius: '3px',
                fontSize: '10px',
                fontWeight: 600
              }}>
                BLOCKED
              </div>
            )}
          </div>
        </>
      )}

      {/* MEDIUM SIZE: Title + Description + Tags + Assignee + Due + Priority + Subtasks */}
      {size === 'medium' && (
        <>
          <div style={{
            fontSize: '14px',
            fontWeight: isHighPriority ? 600 : 500,
            color: '#1F2937',
            lineHeight: '1.4',
            marginBottom: '8px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {task.title}
          </div>
          
          {/* Blocked Reason Banner for medium size */}
          {isBlocked && task.blockedReason && (
            <div style={{
              padding: '8px 10px',
              background: '#FFF7ED',
              border: '1px solid #ffbd01',
              borderRadius: '4px',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px'
            }}>
              <AlertCircle size={14} color="#ff8d00" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{
                fontSize: '12px',
                color: '#92400E',
                lineHeight: '1.4',
                flex: 1,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                <span style={{ fontWeight: 600 }}>Blocked:</span> {task.blockedReason}
              </div>
            </div>
          )}
          
          {showDescription && task.description && !isBlocked && (
            <div style={{
              fontSize: '12px',
              color: '#6B7280',
              lineHeight: '1.4',
              marginBottom: '10px',
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {task.description}
            </div>
          )}

          {/* Tags */}
          {task.labels && task.labels.length > 0 && (
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '10px' }}>
              {task.labels.slice(0, 2).map(label => (
                <div
                  key={label.id}
                  style={{
                    padding: '3px 8px',
                    background: label.color,
                    color: 'white',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: 500
                  }}
                >
                  {label.name}
                </div>
              ))}
            </div>
          )}

          {/* Meta info row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {showParticipants && task.participants && task.participants.length > 0 && (
              <div style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: '#60A5FA',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 600,
                color: 'white',
                overflow: 'hidden',
                flexShrink: 0
              }}>
                {task.participants[0].avatar || task.participants[0].name.substring(0, 2)}
              </div>
            )}
            
            {task.dueDate && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                color: isOverdue ? '#F87171' : isDueToday ? '#ff8d00' : '#6B7280'
              }}>
                <Calendar size={12} />
                {formatDueDate(task.dueDate)}
              </div>
            )}

            {task.priority && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: 500,
                color: task.priority === 'high' ? '#F87171' : task.priority === 'medium' ? '#ff8d00' : '#60A5FA'
              }}>
                {getPriorityIcon()}
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              </div>
            )}

            {task.checklistProgress && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                color: '#6B7280'
              }}>
                <CheckSquare size={12} />
                {task.checklistProgress.completed}/{task.checklistProgress.total}
              </div>
            )}

            {isBlocked && (
              <div style={{
                padding: '3px 6px',
                background: '#ff8d00',
                color: 'white',
                borderRadius: '3px',
                fontSize: '10px',
                fontWeight: 600
              }}>
                BLOCKED
              </div>
            )}

            {isOverdue && (
              <AlertCircle size={14} color="#F87171" />
            )}
          </div>
        </>
      )}

      {/* LARGE SIZE: Everything */}
      {size === 'large' && (
        <>
          <div style={{
            fontSize: '14px',
            fontWeight: isHighPriority ? 600 : 500,
            color: '#1F2937',
            lineHeight: '1.4',
            marginBottom: '6px'
          }}>
            {task.title}
          </div>

          {/* Breadcrumb */}
          <div style={{
            fontSize: '11px',
            color: '#9CA3AF',
            marginBottom: '12px'
          }}>
            {task.projectName} › {task.activityName}
          </div>

          {/* Description */}
          {showDescription && task.description && (
            <div style={{
              fontSize: '13px',
              color: '#6B7280',
              lineHeight: '1.5',
              marginBottom: '12px',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {task.description}
            </div>
          )}

          {/* Tags */}
          {task.labels && task.labels.length > 0 && (
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {task.labels.map(label => (
                <div
                  key={label.id}
                  style={{
                    padding: '4px 10px',
                    background: label.color,
                    color: 'white',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 500
                  }}
                >
                  {label.name}
                </div>
              ))}
            </div>
          )}

          {/* Meta info row */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            flexWrap: 'wrap',
            marginBottom: '12px'
          }}>
            {showParticipants && task.participants && task.participants.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#60A5FA',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'white',
                  overflow: 'hidden',
                  flexShrink: 0
                }}>
                  {task.participants[0].avatar || task.participants[0].name.substring(0, 2)}
                </div>
                {task.participants.length > 1 && (
                  <span style={{ fontSize: '11px', color: '#6B7280' }}>
                    +{task.participants.length - 1}
                  </span>
                )}
              </div>
            )}
            
            {task.dueDate && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                fontWeight: 500,
                color: isOverdue ? '#F87171' : isDueToday ? '#ff8d00' : '#6B7280'
              }}>
                <Calendar size={13} />
                {formatDueDate(task.dueDate)}
              </div>
            )}

            {task.priority && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '12px',
                fontWeight: 600,
                color: task.priority === 'high' ? '#F87171' : task.priority === 'medium' ? '#ff8d00' : '#60A5FA'
              }}>
                {getPriorityIcon()}
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              </div>
            )}
          </div>

          {/* Indicators row */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            marginBottom: task.attachmentCount || task.commentCount ? '12px' : '0'
          }}>
            {task.attachmentCount !== undefined && task.attachmentCount > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                color: '#6B7280'
              }}>
                <Paperclip size={13} />
                {task.attachmentCount}
              </div>
            )}

            {task.commentCount !== undefined && task.commentCount > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                color: '#6B7280'
              }}>
                <MessageCircle size={13} />
                {task.commentCount}
              </div>
            )}

            {task.checklistProgress && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                color: '#6B7280'
              }}>
                <CheckSquare size={13} />
                {task.checklistProgress.completed}/{task.checklistProgress.total}
              </div>
            )}

            {isBlocked && (
              <div 
                style={{
                  padding: '4px 8px',
                  background: '#ff8d00',
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.3px',
                  cursor: task.blockedReason ? 'help' : 'default',
                  position: 'relative'
                }}
                title={task.blockedReason ? `Blocked: ${task.blockedReason}` : 'Blocked'}
              >
                BLOCKED
                {task.blockedReason && (
                  <div style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 8px)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#1F2937',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    maxWidth: '300px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    pointerEvents: 'none',
                    opacity: 0,
                    transition: 'opacity 150ms ease',
                    zIndex: 1000,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                  className="blocked-tooltip"
                  >
                    🚫 {task.blockedReason}
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 0,
                      height: 0,
                      borderLeft: '6px solid transparent',
                      borderRight: '6px solid transparent',
                      borderTop: '6px solid #1F2937'
                    }} />
                  </div>
                )}
              </div>
            )}

            {isOverdue && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                background: '#FEE2E2',
                color: '#DC2626',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600
              }}>
                <AlertCircle size={12} />
                OVERDUE
              </div>
            )}
          </div>
        </>
      )}

      {/* More menu (always visible on hover) */}
      {isHovered && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '24px',
            height: '24px',
            background: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            zIndex: 10
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
        >
          <MoreVertical size={14} color="#6B7280" />
        </div>
      )}
      
      {/* Context Menu Dropdown */}
      {showMenu && (
        <>
          <div
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(false);
            }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 998
            }}
          />
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: '36px',
              right: '8px',
              width: '200px',
              background: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 999,
              overflow: 'hidden'
            }}
          >
            <div
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(false);
                // If already blocked, unblock immediately. Otherwise show modal to enter reason.
                if (isBlocked) {
                  // Unblock immediately
                  if (onUpdateTask) {
                    onUpdateTask(columnId, task.id, {
                      status: undefined,
                      blockedReason: undefined
                    });
                  }
                } else {
                  // Show modal to enter blocking reason
                  setShowBlockedModal(true);
                }
              }}
              style={{
                padding: '10px 12px',
                fontSize: '13px',
                color: '#1F2937',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderBottom: '1px solid #F3F4F6'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <AlertCircle size={14} color={isBlocked ? '#10B981' : '#F87171'} />
              {isBlocked ? 'Unblock Task' : 'Mark as Blocked'}
            </div>
            <div
              onClick={(e) => {
                e.stopPropagation();
                onTaskClick(task);
                setShowMenu(false);
              }}
              style={{
                padding: '10px 12px',
                fontSize: '13px',
                color: '#1F2937',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderBottom: '1px solid #F3F4F6'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <User size={14} color="#6B7280" />
              Assign to...
            </div>
            <div
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsDone(columnId, task.id);
                setShowMenu(false);
              }}
              style={{
                padding: '10px 12px',
                fontSize: '13px',
                color: '#1F2937',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderBottom: '1px solid #F3F4F6'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <CheckSquare size={14} color="#34D399" />
              Mark as Done
            </div>
            <div
              onClick={(e) => {
                e.stopPropagation();
                onDelete(columnId, task.id);
                setShowMenu(false);
              }}
              style={{
                padding: '10px 12px',
                fontSize: '13px',
                color: '#F87171',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#FEF2F2'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <X size={14} color="#F87171" />
              Delete Task
            </div>
          </div>
        </>
      )}

      {/* Blocked Modal */}
      {showBlockedModal && (
        <BlockedModal
          taskTitle={task.title}
          currentReason={task.blockedReason}
          onConfirm={(reason) => {
            if (onUpdateTask) {
              onUpdateTask(columnId, task.id, {
                status: isBlocked ? undefined : 'blocked',
                blockedReason: isBlocked ? undefined : reason
              });
            }
            setShowBlockedModal(false);
          }}
          onCancel={() => setShowBlockedModal(false)}
        />
      )}
    </div>
  );
}