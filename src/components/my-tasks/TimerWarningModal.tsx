import React from 'react';
import { Clock } from 'lucide-react';

interface Task {
  id: string;
  title: string;
}

interface TimerWarningModalProps {
  task: Task;
  elapsedTime: number;
  onExtend: (minutes: number) => void;
  onStopAndSave: () => void;
  onContinue: () => void;
}

export function TimerWarningModal({ task, elapsedTime, onExtend, onStopAndSave, onContinue }: TimerWarningModalProps) {
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onContinue}
      >
        <div
          className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-scale-in"
          onClick={(e) => e.stopPropagation()}
          style={{
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          }}
        >
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-[#FEF3C7] flex items-center justify-center">
              <Clock className="w-6 h-6 text-[#F59E0B]" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-[24px] font-semibold text-[#111827] text-center mb-2">
            2 Minutes Remaining
          </h2>

          {/* Task name */}
          <p className="text-[14px] text-[#6B7280] text-center mb-4">
            {task.title}
          </p>

          {/* Timer display */}
          <div className="bg-[#F9FAFB] border rounded-lg p-4 mb-4" style={{ borderColor: '#E5E7EB' }}>
            <div className="text-center">
              <div className="text-[32px] font-mono font-semibold text-[#111827] mb-1">
                {formatTime(elapsedTime)}
              </div>
              <div className="text-[12px] text-[#6B7280]">
                Counting down to 02:00:00
              </div>
            </div>
          </div>

          {/* Extend buttons */}
          <div className="mb-4">
            <div className="text-[12px] text-[#6B7280] mb-2">Extend by:</div>
            <div className="flex gap-2">
              <button
                onClick={() => onExtend(15)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-[#F9FAFB] transition-colors"
                style={{ borderColor: '#E5E7EB', fontSize: '14px', fontWeight: 500 }}
              >
                +15 min
              </button>
              <button
                onClick={() => onExtend(30)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-[#F9FAFB] transition-colors"
                style={{ borderColor: '#E5E7EB', fontSize: '14px', fontWeight: 500 }}
              >
                +30 min
              </button>
              <button
                onClick={() => onExtend(60)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-[#F9FAFB] transition-colors"
                style={{ borderColor: '#E5E7EB', fontSize: '14px', fontWeight: 500 }}
              >
                +1 hour
              </button>
            </div>
          </div>

          {/* Stop button */}
          <button
            onClick={onStopAndSave}
            className="w-full h-11 rounded-lg text-white font-semibold hover:bg-[#1D4ED8] transition-colors mb-2"
            style={{ backgroundColor: '#2563EB', fontSize: '14px' }}
          >
            Stop & Save Time
          </button>

          {/* Continue link */}
          <button
            onClick={onContinue}
            className="w-full text-center text-[14px] text-[#6B7280] hover:text-[#111827] transition-colors"
          >
            Continue without limit
          </button>
        </div>
      </div>

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
