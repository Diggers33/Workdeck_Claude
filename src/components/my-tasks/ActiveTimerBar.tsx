import React, { useEffect, useState } from 'react';
import { Pause, Play, Square } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  projectName: string;
  projectColor: string;
}

interface ActiveTimerBarProps {
  // Can pass either task object or individual properties
  task?: Task;
  taskTitle?: string;
  projectName?: string;
  projectColor?: string;
  // For countdown: pass finishDate (when timer ends)
  finishDate?: Date;
  // For count up: pass elapsedTime or startTime/pausedTime
  elapsedTime?: number;
  startTime?: number | null;
  pausedTime?: number;
  isPaused: boolean;
  targetDuration?: number; // in minutes
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onTaskClick?: (task: Task) => void;
}

export function ActiveTimerBar({
  task,
  taskTitle,
  projectName: projectNameProp,
  projectColor: projectColorProp,
  finishDate,
  elapsedTime: elapsedTimeProp,
  startTime,
  pausedTime = 0,
  isPaused,
  targetDuration,
  onPause,
  onResume,
  onStop,
  onTaskClick
}: ActiveTimerBarProps) {
  const [tick, setTick] = useState(0);

  // Get task properties from either task object or individual props
  const title = task?.title || taskTitle || 'Unknown Task';
  const projectName = task?.projectName || projectNameProp || 'Unknown Project';
  const projectColor = task?.projectColor || projectColorProp || '#0066FF';

  // Force re-render every second for live countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate remaining time on each render
  const getRemainingMs = () => {
    if (finishDate) {
      return Math.max(0, finishDate.getTime() - Date.now());
    } else if (targetDuration) {
      let elapsed = elapsedTimeProp ?? pausedTime;
      if (!isPaused && startTime) {
        elapsed += Date.now() - startTime;
      }
      const target = targetDuration * 60 * 1000;
      return Math.max(0, target - elapsed);
    }
    return 0;
  };

  const remainingMs = getRemainingMs();

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[1000]"
      style={{
        height: '56px',
        background: '#FFFFFF',
        borderTop: '1px solid #E5E7EB',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.08)',
      }}
    >
      <div className="h-full px-6 flex items-center justify-between max-w-[1440px] mx-auto">
        {/* Left section - Task info */}
        <div className="flex items-center gap-3">
          {/* Status indicator */}
          {!isPaused && (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded"
              style={{
                background: 'linear-gradient(135deg, #FEE2E2 0%, #FEE2E2 100%)',
                border: '1px solid #FCA5A5',
              }}
            >
              <div
                className="w-2 h-2 rounded-full bg-[#DC2626]"
                style={{
                  animation: 'pulse-dot 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                }}
              />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#991B1B', letterSpacing: '0.05em' }}>
                RECORDING
              </span>
            </div>
          )}

          {isPaused && (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded"
              style={{
                background: '#FEF3C7',
                border: '1px solid #FCD34D',
              }}
            >
              <div className="w-2 h-2 rounded-full bg-[#F59E0B]" />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#92400E', letterSpacing: '0.05em' }}>
                PAUSED
              </span>
            </div>
          )}

          {/* Vertical divider */}
          <div style={{ width: '1px', height: '32px', background: '#E5E7EB' }} />

          {/* Task info */}
          {onTaskClick && task ? (
            <button
              onClick={() => onTaskClick(task)}
              className="hover:underline text-left"
              title={`Go to task: ${title}`}
            >
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '2px' }}>
                {title}
              </div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: projectColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {projectName}
              </div>
            </button>
          ) : (
            <div className="text-left">
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '2px' }}>
                {title}
              </div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: projectColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {projectName}
              </div>
            </div>
          )}
        </div>

        {/* Right section - Timer and controls */}
        <div className="flex items-center gap-4">
          {/* Timer display - shows countdown */}
          <div
            style={{
              fontSize: '24px',
              fontWeight: 700,
              fontFamily: "'SF Mono', 'Fira Code', monospace",
              letterSpacing: '-0.02em',
              color: remainingMs < 120000 ? '#DC2626' : '#111827', // Red when < 2 min
            }}
          >
            {formatTime(remainingMs)}
          </div>

          {/* Vertical divider */}
          <div style={{ width: '1px', height: '32px', background: '#E5E7EB' }} />

          {/* Pause/Resume button */}
          <button
            onClick={isPaused ? onResume : onPause}
            className="w-10 h-10 flex items-center justify-center rounded border transition-all"
            style={{
              backgroundColor: '#FFFFFF',
              borderColor: '#D1D5DB',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F9FAFB';
              e.currentTarget.style.borderColor = '#9CA3AF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
              e.currentTarget.style.borderColor = '#D1D5DB';
            }}
            title={isPaused ? 'Resume timer (Space)' : 'Pause timer (Space)'}
          >
            {isPaused ? (
              <Play className="w-4 h-4" style={{ color: '#0066FF' }} fill="#0066FF" />
            ) : (
              <Pause className="w-4 h-4" style={{ color: '#6B7280' }} />
            )}
          </button>

          {/* Stop button */}
          <button
            onClick={onStop}
            className="h-10 px-4 flex items-center gap-2 rounded transition-all"
            style={{
              backgroundColor: '#DC2626',
              fontSize: '13px',
              fontWeight: 600,
              color: '#FFFFFF',
              border: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#B91C1C';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#DC2626';
            }}
            title="Stop & save time"
          >
            <Square className="w-3.5 h-3.5" fill="#FFFFFF" />
            Stop Timer
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.4;
          }
        }
      `}</style>
    </div>
  );
}