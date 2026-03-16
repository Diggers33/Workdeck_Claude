import React, { useState } from 'react';
import { X, Calendar } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  projectName: string;
  projectColor: string;
}

interface SaveTimeEntryModalProps {
  task: Task;
  elapsedTime: number;
  onSave: () => void;
  onDiscard: () => void;
}

export function SaveTimeEntryModal({ task, elapsedTime, onSave, onDiscard }: SaveTimeEntryModalProps) {
  const [notes, setNotes] = useState('');
  const [addToCalendar, setAddToCalendar] = useState(true);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getStartTime = () => {
    const now = new Date();
    const start = new Date(now.getTime() - elapsedTime);
    return start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const getEndTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const getDate = () => {
    const now = new Date();
    return now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-xl shadow-2xl w-full max-w-lg animate-scale-in"
          style={{
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#E5E7EB' }}>
            <h2 className="text-[18px] font-semibold text-[#111827]">Save Time Entry</h2>
            <button
              onClick={() => setShowDiscardConfirm(true)}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#F9FAFB] transition-colors"
            >
              <X className="w-5 h-5 text-[#6B7280]" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-5 max-h-[calc(100vh-200px)] overflow-y-auto">
            {/* Calendar Entry Preview */}
            <div className="bg-[#F9FAFB] border rounded-lg p-4 mb-5" style={{ borderColor: '#E5E7EB' }}>
              <div className="text-[12px] font-medium text-[#6B7280] mb-3">CALENDAR ENTRY PREVIEW</div>
              
              {/* Date */}
              <div className="flex items-center gap-2 mb-3" style={{ fontSize: '14px', color: '#6B7280' }}>
                <Calendar className="w-4 h-4" />
                {getDate()}
              </div>

              {/* Time block */}
              <div
                className="bg-white border-l-4 rounded-md p-3"
                style={{ borderColor: task.projectColor }}
              >
                <div className="text-[14px] font-semibold text-[#111827] mb-1">
                  {getStartTime()} - {getEndTime()} ({formatTime(elapsedTime)})
                </div>
                <div className="text-[13px] text-[#111827] mb-1">
                  {task.title}
                </div>
                <div
                  className="inline-block px-2 py-0.5 rounded text-[11px] font-medium"
                  style={{
                    backgroundColor: `${task.projectColor}20`,
                    color: task.projectColor,
                  }}
                >
                  {task.projectName}
                </div>
              </div>
            </div>

            {/* Task (read-only) */}
            <div className="mb-4">
              <label className="block text-[13px] font-medium text-[#111827] mb-1.5">
                Task
              </label>
              <div
                className="w-full px-3 py-2 border rounded-md bg-[#F9FAFB]"
                style={{ borderColor: '#E5E7EB', fontSize: '14px', color: '#111827' }}
              >
                {task.title}
              </div>
            </div>

            {/* Project (read-only) */}
            <div className="mb-4">
              <label className="block text-[13px] font-medium text-[#111827] mb-1.5">
                Project
              </label>
              <div
                className="w-full px-3 py-2 border rounded-md bg-[#F9FAFB]"
                style={{ borderColor: '#E5E7EB', fontSize: '14px', color: '#111827' }}
              >
                {task.projectName}
              </div>
            </div>

            {/* Duration */}
            <div className="mb-4">
              <label className="block text-[13px] font-medium text-[#111827] mb-1.5">
                Duration
              </label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-[11px] text-[#6B7280] mb-1">Start</label>
                  <input
                    type="time"
                    defaultValue={new Date(Date.now() - elapsedTime).toTimeString().slice(0, 5)}
                    className="w-full px-3 py-2 border rounded-md"
                    style={{ borderColor: '#E5E7EB', fontSize: '14px' }}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] text-[#6B7280] mb-1">End</label>
                  <input
                    type="time"
                    defaultValue={new Date().toTimeString().slice(0, 5)}
                    className="w-full px-3 py-2 border rounded-md"
                    style={{ borderColor: '#E5E7EB', fontSize: '14px' }}
                  />
                </div>
              </div>
              <div className="mt-2 text-[13px] text-[#6B7280]">
                Total: {formatTime(elapsedTime)}
              </div>
            </div>

            {/* Notes */}
            <div className="mb-4">
              <label className="block text-[13px] font-medium text-[#111827] mb-1.5">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this time entry..."
                rows={3}
                className="w-full px-3 py-2 border rounded-md resize-none"
                style={{ borderColor: '#E5E7EB', fontSize: '14px' }}
              />
            </div>

            {/* Add to calendar checkbox */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={addToCalendar}
                onChange={(e) => setAddToCalendar(e.target.checked)}
                className="w-4 h-4"
              />
              <span style={{ fontSize: '14px', color: '#111827' }}>Add to calendar</span>
            </label>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: '#E5E7EB' }}>
            <button
              onClick={() => setShowDiscardConfirm(true)}
              className="px-4 py-2 rounded-md hover:bg-[#F9FAFB] transition-colors"
              style={{ fontSize: '14px', color: '#6B7280' }}
            >
              Discard
            </button>
            <button
              onClick={onSave}
              className="px-4 py-2 rounded-md text-white hover:bg-[#1D4ED8] transition-colors"
              style={{ backgroundColor: '#2563EB', fontSize: '14px', fontWeight: 500 }}
            >
              Save Time Entry
            </button>
          </div>
        </div>
      </div>

      {/* Discard Confirmation */}
      {showDiscardConfirm && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[60]" onClick={() => setShowDiscardConfirm(false)} />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
              <h3 className="text-[18px] font-semibold text-[#111827] mb-2">
                Discard time entry?
              </h3>
              <p className="text-[14px] text-[#6B7280] mb-5">
                You'll lose {formatTime(elapsedTime)} of tracked time. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDiscardConfirm(false)}
                  className="flex-1 px-4 py-2 border rounded-md hover:bg-[#F9FAFB] transition-colors"
                  style={{ borderColor: '#E5E7EB', fontSize: '14px' }}
                >
                  Cancel
                </button>
                <button
                  onClick={onDiscard}
                  className="flex-1 px-4 py-2 rounded-md text-white hover:bg-[#B91C1C] transition-colors"
                  style={{ backgroundColor: '#DC2626', fontSize: '14px', fontWeight: 500 }}
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.15s ease-out;
        }
      `}</style>
    </>
  );
}
