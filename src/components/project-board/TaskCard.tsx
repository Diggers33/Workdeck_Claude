import React, { useState } from 'react';
import { MoreVertical, Paperclip, MessageCircle, CheckSquare, Flag, Calendar, Clock, Bell, Check, Edit2, Copy, Trash2 } from 'lucide-react';
import { Task } from './ProjectBoard';

interface TaskCardProps {
  task: Task;
  columnId: string;
  size: 'small' | 'medium' | 'large';
  showDescription: boolean;
  showParticipants: boolean;
  onDragStart: (task: Task, columnId: string) => void;
  onDelete: (columnId: string, taskId: string) => void;
  onMarkAsDone: (columnId: string, taskId: string) => void;
  onTaskClick: (task: Task) => void;
}

export function TaskCard({
  task,
  columnId,
  size,
  showDescription,
  showParticipants,
  onDragStart,
  onDelete,
  onMarkAsDone,
  onTaskClick
}: TaskCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return '#F87171';
      case 'medium': return '#ff8d00';
      case 'low': return '#60A5FA';
      default: return '#9CA3AF';
    }
  };

  const getPriorityLabel = (priority?: string) => {
    switch (priority) {
      case 'high': return 'High';
      case 'medium': return 'Medium';
      case 'low': return 'Low';
      default: return '';
    }
  };

  // Small: Title only, minimal
  // Medium: Title + breadcrumb only (clean middle ground)
  // Large: Everything (description, labels, participants, indicators, etc.)
  const showBreadcrumb = size !== 'small';
  const showLabels = size === 'medium' || size === 'large';
  const showFullContent = size === 'large'; // Description, participants, indicators, buttons

  return (
    <div
      draggable
      onDragStart={() => onDragStart(task, columnId)}
      onClick={() => onTaskClick(task)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: 'white',
        border: '1px solid #E5E7EB',
        borderLeft: `4px solid ${task.color}`,
        borderRadius: '6px',
        padding: size === 'small' ? '10px' : size === 'large' ? '20px' : '14px',
        cursor: 'pointer',
        boxShadow: isHovered ? '0 4px 12px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.04)',
        transition: 'all 150ms ease',
        position: 'relative'
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '8px',
        marginBottom: size === 'small' ? '8px' : '12px'
      }}>
        <div style={{
          fontSize: size === 'small' ? '13px' : '14px',
          fontWeight: 500,
          color: '#1F2937',
          flex: 1,
          lineHeight: '1.4'
        }}>
          {task.title}
        </div>

        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            style={{
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              color: '#9CA3AF',
              opacity: isHovered ? 1 : 0,
              transition: 'opacity 150ms ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <MoreVertical size={14} />
          </button>

          {showMenu && (
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
                onClick={() => setShowMenu(false)}
              />
              <div style={{
                position: 'absolute',
                top: '24px',
                right: 0,
                width: '180px',
                background: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                zIndex: 999,
                overflow: 'hidden'
              }}>
                <button
                  onClick={() => setShowMenu(false)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'transparent',
                    border: 'none',
                    fontSize: '13px',
                    color: '#1F2937',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <Edit2 size={14} />
                  Edit
                </button>
                <button
                  onClick={() => setShowMenu(false)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'transparent',
                    border: 'none',
                    fontSize: '13px',
                    color: '#1F2937',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <Copy size={14} />
                  Duplicate
                </button>
                <button
                  onClick={() => {
                    onMarkAsDone(columnId, task.id);
                    setShowMenu(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'transparent',
                    border: 'none',
                    fontSize: '13px',
                    color: '#34D399',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#F0FDF4'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <Check size={14} />
                  Mark as Done
                </button>
                <div style={{ height: '1px', background: '#E5E7EB', margin: '4px 0' }} />
                <button
                  onClick={() => {
                    onDelete(columnId, task.id);
                    setShowMenu(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'transparent',
                    border: 'none',
                    fontSize: '13px',
                    color: '#F87171',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#FEF2F2'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Breadcrumb */}
      {showBreadcrumb && (
        <div style={{
          fontSize: '11px',
          color: '#9CA3AF',
          marginBottom: '12px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {task.projectName} › {task.activityName}
        </div>
      )}

      {/* Description */}
      {task.description && showFullContent && (
        <div style={{
          fontSize: '13px',
          color: '#6B7280',
          lineHeight: '1.5',
          marginBottom: '12px'
        }}>
          {task.description}
        </div>
      )}

      {/* Labels */}
      {showLabels && task.labels && task.labels.length > 0 && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          marginBottom: '12px'
        }}>
          {task.labels.map(label => (
            <span
              key={label.id}
              style={{
                padding: '2px 8px',
                background: `${label.color}20`,
                color: label.color,
                fontSize: '11px',
                fontWeight: 500,
                borderRadius: '4px',
                border: `1px solid ${label.color}40`
              }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      {/* Participants & Indicators */}
      {showFullContent && (showParticipants || task.attachmentCount || task.commentCount || task.checklistProgress) && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
          gap: '8px'
        }}>
          {/* Participants */}
          {showParticipants && task.participants && task.participants.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ display: 'flex', marginRight: '4px' }}>
                {task.participants.slice(0, 3).map((participant, idx) => (
                  <div
                    key={participant.id}
                    title={participant.name}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: '#60A5FA',
                      color: 'white',
                      fontSize: '10px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid white',
                      marginLeft: idx > 0 ? '-8px' : '0'
                    }}
                  >
                    {participant.avatar || participant.name.substring(0, 2).toUpperCase()}
                  </div>
                ))}
              </div>
              {task.participants.length > 3 && (
                <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: 500 }}>
                  +{task.participants.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Indicators */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
            {task.attachmentCount && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6B7280' }}>
                <Paperclip size={14} />
                <span style={{ fontSize: '11px', fontWeight: 500 }}>{task.attachmentCount}</span>
              </div>
            )}
            {task.commentCount && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6B7280' }}>
                <MessageCircle size={14} />
                <span style={{ fontSize: '11px', fontWeight: 500 }}>{task.commentCount}</span>
              </div>
            )}
            {task.checklistProgress && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6B7280' }}>
                <CheckSquare size={14} />
                <span style={{ fontSize: '11px', fontWeight: 500 }}>
                  {task.checklistProgress.completed}/{task.checklistProgress.total}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Priority & Due Date */}
      {(task.priority || task.dueDate) && showFullContent && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          marginBottom: '12px'
        }}>
          {task.priority && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: getPriorityColor(task.priority),
              fontSize: '11px',
              fontWeight: 500
            }}>
              <Flag size={12} fill={getPriorityColor(task.priority)} />
              {getPriorityLabel(task.priority)} Priority
            </div>
          )}
          {task.dueDate && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: '#6B7280',
              fontSize: '11px',
              marginLeft: 'auto'
            }}>
              <Calendar size={12} />
              {task.dueDate}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {showFullContent && (
        <div style={{
          display: 'flex',
          gap: '6px',
          paddingTop: '12px',
          borderTop: '1px solid #F3F4F6'
        }}>
          <button
            onClick={() => onMarkAsDone(columnId, task.id)}
            style={{
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: '1px solid #E5E7EB',
              borderRadius: '4px',
              cursor: 'pointer',
              color: '#6B7280'
            }}
            title="Mark as done"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#34D399';
              e.currentTarget.style.borderColor = '#34D399';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = '#E5E7EB';
              e.currentTarget.style.color = '#6B7280';
            }}
          >
            <Check size={14} />
          </button>

          <button
            style={{
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: '1px solid #E5E7EB',
              borderRadius: '4px',
              cursor: 'pointer',
              color: '#6B7280'
            }}
            title="Start timer"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#F3F4F6';
              e.currentTarget.style.color = '#1F2937';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#6B7280';
            }}
          >
            <Clock size={14} />
          </button>

          <button
            style={{
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: '1px solid #E5E7EB',
              borderRadius: '4px',
              cursor: 'pointer',
              color: '#6B7280'
            }}
            title="Notify participants"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#F3F4F6';
              e.currentTarget.style.color = '#1F2937';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#6B7280';
            }}
          >
            <Bell size={14} />
          </button>
        </div>
      )}
    </div>
  );
}