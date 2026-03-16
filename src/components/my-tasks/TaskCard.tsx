import React, { useState } from 'react';
import { Calendar, MessageSquare, Play, AlertCircle, Pause, Square, Clock, CheckSquare } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import type { Task } from '../../types/task';

interface TaskCardProps {
  task: Task;
  cardSize: 'S' | 'M' | 'L';
  onStartTimer: (taskId: string) => void;
  onPauseTimer?: () => void;
  onStopTimer?: () => void;
  onTaskClick?: (task: Task) => void;
  isTimerActive: boolean;
  isPaused?: boolean;
  elapsedTime?: number;
}

export function TaskCard({ 
  task, 
  cardSize, 
  onStartTimer, 
  onPauseTimer,
  onStopTimer,
  onTaskClick, 
  isTimerActive, 
  isPaused = false,
  elapsedTime = 0 
}: TaskCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return { bg: '#F3F4F6', text: '#6B7280' };
      case 'In Progress': return { bg: '#2563EB', text: '#FFFFFF' };
      case 'In Review': return { bg: '#F59E0B', text: '#FFFFFF' };
      case 'Done': return { bg: '#10B981', text: '#FFFFFF' };
      default: return { bg: '#F3F4F6', text: '#6B7280' };
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return '#F87171';
      case 'Medium': return '#ff8d00';
      case 'Low': return '#60A5FA';
      default: return '#6B7280';
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Done';
  
  const getOverdueDays = () => {
    if (!task.dueDate) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(task.dueDate);
    due.setHours(0, 0, 0, 0);
    const diff = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(date);
    dueDate.setHours(0, 0, 0, 0);
    
    if (dueDate.getTime() === today.getTime()) return 'Today';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatMinutes = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const statusColors = getStatusColor(task.status);
  const priorityColor = getPriorityColor(task.priority);
  const overEstimate = task.timeEstimate && task.timeLogged && task.timeLogged > task.timeEstimate;

  // Determine left border color - always use project color
  const leftBorderColor = task.projectColor;

  const getBackgroundColor = () => {
    if (isTimerActive) return '#F0F6FF';
    if (isOverdue) return '#FEF2F2';
    if (task.waitingOn) return '#FFF7ED';
    return 'white';
  };

  // Enhanced shadows
  const getBoxShadow = () => {
    if (isDragging) return '0 12px 28px rgba(0,0,0,0.15), 0 4px 8px rgba(0,0,0,0.1)';
    if (isHovered && !isTimerActive) return '0 4px 12px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)';
    return '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)';
  };

  const getTransform = () => {
    // Don't apply transform when dragging - DragOverlay handles the visual
    if (isDragging) return 'none';
    if (isHovered && !isTimerActive) return 'translateY(-2px)';
    return 'none';
  };

  // Small card
  if (cardSize === 'S') {
    return (
      <div
        ref={setNodeRef}
        data-task-id={task.id}
        {...attributes}
        {...listeners}
        onClick={() => onTaskClick?.(task)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          background: getBackgroundColor(),
          borderTop: '1px solid #E5E7EB',
          borderRight: '1px solid #E5E7EB',
          borderBottom: '1px solid #E5E7EB',
          borderLeft: `3px solid ${leftBorderColor}`,
          borderRadius: '6px',
          padding: '8px 10px',
          cursor: 'pointer',
          boxShadow: getBoxShadow(),
          transform: getTransform(),
          transition: 'all 150ms ease',
          opacity: isDragging ? 0.3 : 1,
        }}
      >
        {/* Single line with title and project */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <div style={{ 
            fontSize: '12px', 
            fontWeight: 500, 
            color: '#111827', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap',
            flex: 1
          }}>
            {task.title}
          </div>
          
          {!isTimerActive && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartTimer(task.id);
              }}
              style={{
                width: '20px',
                height: '20px',
                background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                border: '1px solid #BFDBFE',
                borderRadius: '3px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                opacity: isHovered ? 1 : 0.7
              }}
              title="Start timer"
            >
              <Play size={9} fill="#2563EB" color="#2563EB" />
            </button>
          )}
        </div>
        
        {/* Compact meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {/* Project tag */}
          <div style={{ 
            fontSize: '9px', 
            fontWeight: 600, 
            color: task.projectColor,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {task.projectName}
          </div>
          
          {/* Priority dot */}
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: priorityColor, flexShrink: 0 }} />
          
          {/* Due date if exists */}
          {task.dueDate && (
            <div style={{
              fontSize: '10px',
              fontWeight: 500,
              color: isOverdue ? '#EF4444' : '#6B7280'
            }}>
              {formatDate(task.dueDate)}
            </div>
          )}
          
          {isOverdue && <AlertCircle size={12} color="#F87171" style={{ flexShrink: 0 }} />}
          
          {task.waitingOn && (
            <div style={{ padding: '1px 4px', background: '#ff8d00', color: 'white', borderRadius: '2px', fontSize: '8px', fontWeight: 700 }}>
              BLOCKED
            </div>
          )}
        </div>
      </div>
    );
  }

  // Medium card (default)
  if (cardSize === 'M') {
    return (
      <div
        ref={setNodeRef}
        data-task-id={task.id}
        {...attributes}
        {...listeners}
        onClick={() => onTaskClick?.(task)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          background: getBackgroundColor(),
          borderTop: `1px solid ${isHovered ? '#D1D5DB' : '#E5E7EB'}`,
          borderRight: `1px solid ${isHovered ? '#D1D5DB' : '#E5E7EB'}`,
          borderBottom: `1px solid ${isHovered ? '#D1D5DB' : '#E5E7EB'}`,
          borderLeft: `3px solid ${leftBorderColor}`,
          borderRadius: '6px',
          padding: '12px 14px',
          cursor: 'pointer',
          boxShadow: getBoxShadow(),
          transform: getTransform(),
          transition: 'all 150ms ease',
          opacity: isDragging ? 0.3 : 1,
          position: 'relative',
        }}
      >
        {/* Title */}
        <div style={{
          fontSize: '13px',
          fontWeight: 500,
          color: '#111827',
          lineHeight: '1.4',
          marginBottom: '8px',
          paddingRight: '32px',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {task.title}
        </div>

        {/* Project + Status Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
          <div style={{ 
            fontSize: '10px', 
            fontWeight: 600, 
            color: task.projectColor,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1
          }}>
            {task.projectName}
          </div>

          {/* Status badge */}
          <div
            style={{
              padding: '2px 6px',
              borderRadius: '3px',
              fontSize: '10px',
              fontWeight: 600,
              backgroundColor: statusColors.bg,
              color: statusColors.text,
              flexShrink: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.02em'
            }}
          >
            {task.status}
          </div>
        </div>

        {/* Blocked/Waiting banner */}
        {task.waitingOn && (
          <div style={{
            padding: '6px 8px',
            background: 'linear-gradient(to right, #FFF7ED, #FFFBEB)',
            border: '1px solid #FED7AA',
            borderRadius: '4px',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <AlertCircle size={12} color="#F97316" style={{ flexShrink: 0 }} />
            <div style={{
              fontSize: '11px',
              color: '#9A3412',
              lineHeight: '1.3',
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              <span style={{ fontWeight: 600 }}>Blocked:</span> {task.waitingOn}
            </div>
          </div>
        )}

        {/* Timer active state */}
        {isTimerActive && (
          <div style={{
            padding: '8px 10px',
            background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
            border: '1px solid #BFDBFE',
            borderRadius: '4px',
            marginBottom: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div className="pulse-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#EF4444' }} />
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#1E40AF', letterSpacing: '0.05em' }}>TIMING</span>
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: "'SF Mono', 'Fira Code', monospace", color: '#1E40AF', letterSpacing: '-0.02em' }}>
                {formatTime(elapsedTime)}
              </div>
            </div>
          </div>
        )}

        {/* Meta info row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', minHeight: '18px' }}>
          {/* Due date */}
          {task.dueDate && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: 500,
              color: isOverdue ? '#EF4444' : formatDate(task.dueDate) === 'Today' ? '#F97316' : '#6B7280'
            }}>
              <Calendar size={11} style={{ flexShrink: 0 }} />
              <span>{formatDate(task.dueDate)}</span>
            </div>
          )}

          {/* Priority */}
          {task.priority && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: 500,
              color: priorityColor
            }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: priorityColor, flexShrink: 0 }} />
              <span>{task.priority}</span>
            </div>
          )}

          {/* Time tracking */}
          {(task.timeEstimate || task.timeLogged) && !isTimerActive && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: 500,
              color: overEstimate ? '#EF4444' : '#6B7280'
            }}>
              <Clock size={11} style={{ flexShrink: 0 }} />
              <span>{task.timeLogged ? formatMinutes(task.timeLogged) : `${formatMinutes(task.timeEstimate!)}`}</span>
            </div>
          )}

          {/* Comments */}
          {task.commentsCount > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: 500,
              color: '#6B7280'
            }}>
              <MessageSquare size={11} style={{ flexShrink: 0 }} />
              <span>{task.commentsCount}</span>
            </div>
          )}

          {/* Subtasks */}
          {task.subtasksTotal !== undefined && task.subtasksTotal > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: 600,
              color: task.subtasksCompleted === task.subtasksTotal ? '#10B981' : '#6B7280'
            }}>
              <CheckSquare size={11} style={{ flexShrink: 0 }} />
              <span>{task.subtasksCompleted}/{task.subtasksTotal}</span>
            </div>
          )}

          {isOverdue && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              fontSize: '10px',
              fontWeight: 700,
              color: '#EF4444',
              textTransform: 'uppercase',
              letterSpacing: '0.03em'
            }}>
              <AlertCircle size={11} style={{ flexShrink: 0 }} />
              <span>OVERDUE</span>
            </div>
          )}
        </div>

        {/* Category tags row */}
        {task.tags && task.tags.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', flexWrap: 'wrap' }}>
            {task.tags.slice(0, 2).map(tag => (
              <div
                key={tag.id}
                style={{
                  padding: '2px 6px',
                  background: tag.color,
                  color: 'white',
                  borderRadius: '3px',
                  fontSize: '10px',
                  fontWeight: 600,
                  letterSpacing: '0.01em'
                }}
              >
                {tag.name}
              </div>
            ))}
            {task.tags.length > 2 && (
              <div style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 600 }}>
                +{task.tags.length - 2}
              </div>
            )}
          </div>
        )}

        {/* Timer button */}
        {!isTimerActive && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStartTimer(task.id);
            }}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              width: '24px',
              height: '24px',
              background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
              border: '1px solid #BFDBFE',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 120ms ease',
              color: '#2563EB',
              opacity: isHovered ? 1 : 0.7
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)';
              e.currentTarget.style.transform = 'scale(1.08)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(37, 99, 235, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)';
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            title="Start timer"
          >
            <Play size={11} fill="#2563EB" />
          </button>
        )}

        {/* Timer controls */}
        {isTimerActive && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPauseTimer?.();
              }}
              style={{
                flex: 1,
                height: '36px',
                background: 'white',
                border: '1px solid #93C5FD',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                color: '#2563EB',
                transition: 'all 150ms ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#F0F6FF';
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {isPaused ? <Play size={14} /> : <Pause size={14} />}
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStopTimer?.();
              }}
              style={{
                flex: 1,
                height: '36px',
                background: '#FEE2E2',
                border: '1px solid #FEE2E2',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                color: '#DC2626',
                transition: 'all 150ms ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#FECACA';
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#FEE2E2';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <Square size={14} fill="#DC2626" />
              Stop
            </button>
          </div>
        )}

        <style>{`
          @keyframes pulse-dot {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(1.3); }
          }
          .pulse-dot {
            animation: pulse-dot 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
        `}</style>
      </div>
    );
  }

  // Large card
  return (
    <div
      ref={setNodeRef}
      data-task-id={task.id}
      {...attributes}
      {...listeners}
      onClick={() => onTaskClick?.(task)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: getBackgroundColor(),
        borderTop: `1px solid ${isHovered ? '#D1D5DB' : '#E5E7EB'}`,
        borderRight: `1px solid ${isHovered ? '#D1D5DB' : '#E5E7EB'}`,
        borderBottom: `1px solid ${isHovered ? '#D1D5DB' : '#E5E7EB'}`,
        borderLeft: `4px solid ${leftBorderColor}`,
        borderRadius: '6px',
        padding: '16px',
        cursor: 'pointer',
        boxShadow: getBoxShadow(),
        transform: getTransform(),
        transition: 'all 150ms ease',
        opacity: isDragging ? 0.3 : 1,
        position: 'relative',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {/* Project tag */}
          <div style={{ padding: '4px 10px', background: task.projectColor, color: 'white', borderRadius: '12px', fontSize: '11px', fontWeight: 500 }}>
            {task.projectName}
          </div>
          
          {/* Category tags */}
          {task.tags && task.tags.map(tag => (
            <div
              key={tag.id}
              style={{
                padding: '4px 10px',
                background: tag.color,
                color: 'white',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 500
              }}
            >
              {tag.name}
            </div>
          ))}
        </div>

        {/* Status badge */}
        <div
          style={{
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: 500,
            backgroundColor: statusColors.bg,
            color: statusColors.text,
            flexShrink: 0
          }}
        >
          {task.status}
        </div>
      </div>

      {/* Title */}
      <div style={{
        fontSize: '14px',
        fontWeight: task.priority === 'High' ? 600 : 500,
        color: '#1F2937',
        lineHeight: '1.4',
        marginBottom: '6px'
      }}>
        {task.title}
      </div>

      {/* Breadcrumb */}
      {task.parentActivity && (
        <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '12px' }}>
          {task.projectName} › {task.parentActivity}
        </div>
      )}

      {/* Description */}
      {task.description && (
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

      {/* Blocked/Waiting banner */}
      {task.waitingOn && (
        <div style={{
          padding: '8px 10px',
          background: '#FFF7ED',
          border: '1px solid #ffbd01',
          borderRadius: '4px',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px'
        }}>
          <AlertCircle size={14} color="#ff8d00" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{
            fontSize: '12px',
            color: '#92400E',
            lineHeight: '1.4',
            flex: 1
          }}>
            <span style={{ fontWeight: 600 }}>Waiting on:</span> {task.waitingOn}
          </div>
        </div>
      )}

      {/* Subtasks progress */}
      {task.subtasksTotal && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ height: '6px', flex: 1, background: '#E5E7EB', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  background: task.subtasksCompleted === task.subtasksTotal ? '#10B981' : '#2563EB',
                  borderRadius: '3px',
                  width: `${(task.subtasksCompleted! / task.subtasksTotal) * 100}%`,
                  transition: 'width 200ms ease'
                }}
              />
            </div>
            <span style={{ fontSize: '11px', color: '#6B7280', whiteSpace: 'nowrap' }}>
              {task.subtasksCompleted}/{task.subtasksTotal}
            </span>
          </div>
        </div>
      )}

      {/* Timer active state */}
      {isTimerActive && (
        <div style={{
          padding: '12px',
          background: '#DBEAFE',
          border: '1px solid #93C5FD',
          borderRadius: '6px',
          marginBottom: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="pulse-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F87171' }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#1E40AF' }}>RECORDING</span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: "'SF Mono', 'Fira Code', monospace", color: '#1E40AF' }}>
              {formatTime(elapsedTime)}
            </div>
          </div>
          {task.timeEstimate && (
            <div style={{ fontSize: '12px', color: '#6B7280' }}>
              Target: {formatMinutes(task.timeEstimate)}
            </div>
          )}
        </div>
      )}

      {/* Meta info row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
        {/* Due date */}
        {task.dueDate && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            fontWeight: 500,
            color: isOverdue ? '#F87171' : formatDate(task.dueDate) === 'Today' ? '#ff8d00' : '#6B7280'
          }}>
            <Calendar size={13} />
            {formatDate(task.dueDate)}
          </div>
        )}

        {/* Priority */}
        {task.priority && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '12px',
            fontWeight: 600,
            color: priorityColor
          }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: priorityColor }} />
            {task.priority}
          </div>
        )}

        {/* Time tracking */}
        {(task.timeEstimate || task.timeLogged) && !isTimerActive && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            color: overEstimate ? '#F87171' : '#6B7280'
          }}>
            <Clock size={13} />
            {task.timeEstimate && `~${formatMinutes(task.timeEstimate)}`}
            {task.timeLogged && ` • ${formatMinutes(task.timeLogged)}`}
          </div>
        )}
      </div>

      {/* Indicators row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {task.commentsCount > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            color: '#6B7280'
          }}>
            <MessageSquare size={13} />
            {task.commentsCount}
          </div>
        )}

        {/* Subtasks - NEW */}
        {task.subtasksTotal !== undefined && task.subtasksTotal > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            color: task.subtasksCompleted === task.subtasksTotal ? '#10B981' : '#6B7280'
          }}>
            <CheckSquare size={13} />
            {task.subtasksCompleted}/{task.subtasksTotal}
          </div>
        )}

        {task.watchers && task.watchers > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            color: '#6B7280'
          }}>
            👁️ {task.watchers}
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

      {/* Timer button - always visible */}
      {!isTimerActive && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStartTimer(task.id);
          }}
          style={{
            position: 'absolute',
            bottom: '14px',
            right: '14px',
            width: '32px',
            height: '32px',
            background: '#EFF6FF',
            border: '1px solid #BFDBFE',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 150ms ease',
            color: '#2563EB'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#DBEAFE';
            e.currentTarget.style.borderColor = '#93C5FD';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#EFF6FF';
            e.currentTarget.style.borderColor = '#BFDBFE';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title="Start timer"
        >
          <Play size={16} />
        </button>
      )}

      {/* Timer controls */}
      {isTimerActive && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPauseTimer?.();
            }}
            style={{
              flex: 1,
              height: '36px',
              background: 'white',
              border: '1px solid #93C5FD',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              color: '#2563EB',
              transition: 'all 150ms ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#F0F6FF';
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {isPaused ? <Play size={14} /> : <Pause size={14} />}
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStopTimer?.();
            }}
            style={{
              flex: 1,
              height: '36px',
              background: '#FEE2E2',
              border: '1px solid #FEE2E2',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              color: '#DC2626',
              transition: 'all 150ms ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#FECACA';
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#FEE2E2';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <Square size={14} fill="#DC2626" />
            Stop
          </button>
        </div>
      )}

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.3); }
        }
        .pulse-dot {
          animation: pulse-dot 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}