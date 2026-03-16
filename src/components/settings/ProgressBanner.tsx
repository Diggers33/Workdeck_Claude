import React from 'react';
import { Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

interface ProgressBannerProps {
  completed: number;
  total: number;
  onCelebrate: () => void;
}

export function ProgressBanner({ completed, total, onCelebrate }: ProgressBannerProps) {
  const progress = Math.round((completed / total) * 100);
  const isComplete = completed === total;

  if (isComplete) {
    return (
      <div className="bg-gradient-to-r from-[#D1FAE5] to-[#A7F3D0] rounded-lg p-5 border border-[#6EE7B7]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#34D399] flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[15px] font-medium text-[#065F46]">
                Essentials Complete!
              </p>
              <p className="text-[13px] text-[#047857]">
                Your workspace is ready. Configure advanced features anytime.
              </p>
            </div>
          </div>
          <button
            onClick={onCelebrate}
            className="px-4 py-2 bg-[#34D399] hover:bg-[#10B981] text-white rounded-lg text-[14px] font-medium transition-colors flex items-center gap-2"
          >
            Enter Workdeck
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-[#F0F4FF] via-[#E0E9FF] to-[#F0F4FF] rounded-lg p-5 border border-[#DBEAFE]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#0066FF]" />
          <p className="text-[15px] font-medium text-[#1F2937]">
            You're {progress}% there
          </p>
        </div>
        <span className="text-[13px] font-medium text-[#0066FF]">
          {completed} of {total} complete
        </span>
      </div>
      <div className="h-2 bg-white rounded-full overflow-hidden mb-3">
        <div 
          className="h-full bg-gradient-to-r from-[#0066FF] to-[#60A5FA] rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-[13px] text-[#6B7280]">
        Complete Essentials to unlock your workspace · About {(total - completed) * 3} minutes remaining
      </p>
      <p className="text-[11px] text-[#9CA3AF] mt-1">
        Progress based on Essentials only · Optional features don't affect completion
      </p>
    </div>
  );
}
