import React, { useState } from 'react';
import { Plus, MoreVertical, ClipboardList } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { TaskCard } from './TaskCard';
import type { Task, ColumnData } from '../../types/task';

interface ColumnProps {
  column: ColumnData;
  tasks: Task[];
  cardSize: 'S' | 'M' | 'L';
  onStartTimer: (taskId: string) => void;
  onPauseTimer?: () => void;
  onResumeTimer?: () => void;
  onStopTimer?: () => void;
  onTaskClick: (task: Task) => void;
  timerTaskId: string | null;
  timerIsPaused?: boolean;
  getElapsedTime: () => number;
  focusMode?: boolean;
  onDeleteColumn?: (columnId: string) => void;
}

export function Column({
  column,
  tasks,
  cardSize,
  onStartTimer,
  onPauseTimer,
  onResumeTimer,
  onStopTimer,
  onTaskClick,
  timerTaskId,
  timerIsPaused = false,
  getElapsedTime,
  focusMode = false,
  onDeleteColumn,
}: ColumnProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  // Calculate total time estimate for column
  const getTotalEstimate = () => {
    const totalMinutes = tasks.reduce((sum, task) => sum + (task.timeEstimate || 0), 0);
    if (totalMinutes === 0) return null;
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  };

  const totalEstimate = getTotalEstimate();
  const isWaitingColumn = column.name === 'Waiting On';

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 rounded-xl p-3 transition-all flex flex-col h-full ${
        isOver ? 'bg-[#EFF6FF] ring-2 ring-[#2563EB] ring-opacity-50' : ''
      }`}
      style={{
        width: focusMode ? '400px' : '320px',
        backgroundColor: isOver ? '#EFF6FF' : '#F3F4F6',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Column Header - fixed at top */}
      <div className="flex-shrink-0 mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-[16px] font-semibold text-[#111827]">{column.name}</h3>
            <span className="text-[13px] text-[#6B7280]">{tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}</span>
          </div>

          {/* Menu button */}
          {!focusMode && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-white transition-colors"
              >
                <MoreVertical className="w-4 h-4 text-[#6B7280]" />
              </button>

              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border z-20" style={{ borderColor: '#E5E7EB' }}>
                    <div className="p-1">
                      <button
                        onClick={() => {
                          setShowMenu(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-[#F9FAFB] rounded text-[14px] text-[#111827]"
                      >
                        Rename
                      </button>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-[#F9FAFB] rounded text-[14px] text-[#111827]"
                      >
                        Change Color
                      </button>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-[#F9FAFB] rounded text-[14px] text-[#111827]"
                      >
                        Clear Done
                      </button>
                      {/* Only show delete for non-system columns */}
                      {!column.isSystem && onDeleteColumn && (
                        <>
                          <div className="h-px bg-[#E5E7EB] my-1" />
                          <button
                            onClick={() => {
                              if (tasks.length === 0) {
                                onDeleteColumn(column.id);
                              }
                              setShowMenu(false);
                            }}
                            disabled={tasks.length > 0}
                            className={`w-full px-3 py-2 text-left rounded text-[14px] ${
                              tasks.length > 0
                                ? 'text-[#9CA3AF] cursor-not-allowed'
                                : 'text-[#DC2626] hover:bg-[#FEE2E2]'
                            }`}
                            title={tasks.length > 0 ? 'Remove all tasks first' : 'Delete this column'}
                          >
                            Delete Column
                            {tasks.length > 0 && (
                              <span className="text-[12px] block text-[#9CA3AF]">
                                (must be empty)
                              </span>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Time estimate or status */}
        <div className="mb-2 text-[12px]">
          {isWaitingColumn ? (
            <div className="flex items-center gap-1 text-[#B45309]">
              <span>⏸️</span>
              <span>Blocked</span>
            </div>
          ) : totalEstimate ? (
            <div className="text-[#9CA3AF]">{totalEstimate} est</div>
          ) : (
            <div className="text-[#9CA3AF]">—</div>
          )}
        </div>

        {/* Color bar */}
        <div
          className="h-1 rounded-full"
          style={{ backgroundColor: column.color }}
        />
      </div>

      {/* Tasks - scrollable area */}
      <div
        className={`task-scroll flex-1 space-y-2 mb-3 overflow-y-scroll ${isHovered ? 'show-scrollbar' : ''}`}
        style={{
          scrollbarWidth: isHovered ? 'thin' : 'none',
          scrollbarColor: '#D1D5DB transparent',
        } as React.CSSProperties}
      >
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            cardSize={cardSize}
            onStartTimer={onStartTimer}
            onPauseTimer={timerTaskId === task.id ? (timerIsPaused ? onResumeTimer : onPauseTimer) : undefined}
            onStopTimer={onStopTimer}
            onTaskClick={onTaskClick}
            isTimerActive={timerTaskId === task.id}
            isPaused={timerIsPaused}
            elapsedTime={timerTaskId === task.id ? getElapsedTime() : 0}
          />
        ))}

        {/* Empty state */}
        {tasks.length === 0 && (
          <div className="bg-white border-2 border-dashed rounded-lg p-6 text-center" style={{ borderColor: '#E5E7EB' }}>
            <ClipboardList className="w-8 h-8 text-[#D1D5DB] mx-auto mb-2" />
            <div className="text-[14px] text-[#6B7280] mb-1">No tasks here</div>
            <div className="text-[12px] text-[#9CA3AF]">
              Drag tasks from other columns
              <br />
              or add a new task
            </div>
          </div>
        )}
      </div>

      {/* Add Task button - fixed at bottom */}
      {!focusMode && (
        <button
          className="flex-shrink-0 w-full px-3 py-2 flex items-center justify-center gap-2 rounded-md hover:bg-white transition-colors"
          style={{ fontSize: '14px', color: '#6B7280' }}
        >
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      )}
    </div>
  );
}