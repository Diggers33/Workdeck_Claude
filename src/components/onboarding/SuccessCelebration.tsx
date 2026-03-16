import React, { useEffect, useState } from 'react';
import { CheckCircle2, Sparkles, Settings, ArrowRight } from 'lucide-react';

interface SuccessCelebrationProps {
  companyName: string;
  onComplete: () => void;
}

export function SuccessCelebration({ companyName, onComplete }: SuccessCelebrationProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    setShowConfetti(true);
    // Auto-hide confetti after animation
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-white rounded-lg p-12 max-w-2xl w-full relative overflow-hidden" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
      {/* Confetti effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-fall"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10px',
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: ['#0066FF', '#34D399', '#F472B6', '#FBBF24', '#60A5FA'][i % 5],
                  opacity: 0.7,
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Success icon */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#34D399]/10 mb-4 relative">
          <CheckCircle2 className="w-10 h-10 text-[#34D399]" />
          <Sparkles className="w-5 h-5 text-[#FBBF24] absolute -top-1 -right-1 animate-pulse" />
        </div>
        <h1 className="text-[#1F2937] mb-2">🎉 You're all set!</h1>
        <p className="text-[#6B7280] text-[16px]">
          <span className="font-medium text-[#1F2937]">{companyName}</span> is ready to go
        </p>
      </div>

      {/* Features unlocked */}
      <div className="bg-gradient-to-br from-[#F0F4FF] to-[#E0E9FF] rounded-lg p-6 mb-8">
        <p className="text-[13px] font-medium text-[#1F2937] mb-4">What you've set up:</p>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#34D399] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-medium text-[#1F2937]">Company profile configured</p>
              <p className="text-[11px] text-[#6B7280]">Identity, sector, and preferences</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#34D399] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-medium text-[#1F2937]">Primary office created</p>
              <p className="text-[11px] text-[#6B7280]">Location, timezone, and working hours</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#34D399] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-medium text-[#1F2937]">Workspace ready</p>
              <p className="text-[11px] text-[#6B7280]">Dashboard, projects, and tools are live</p>
            </div>
          </div>
        </div>
      </div>

      {/* Next steps callout */}
      <div className="bg-[#FFF7ED] border border-[#FED7AA] rounded-lg p-4 mb-8">
        <p className="text-[12px] font-medium text-[#92400E] mb-2">✨ Pro tip</p>
        <p className="text-[12px] text-[#92400E]">
          Fine-tune advanced settings later in <span className="font-medium">Admin → Settings</span>. 
          You can configure users, workflows, policies, and more whenever you're ready.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <button
          onClick={onComplete}
          className="w-full bg-[#0066FF] hover:bg-[#0052CC] text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          Enter {companyName}
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            // Navigate to settings
            onComplete();
            // This would trigger settings navigation
          }}
          className="w-full border border-[#D1D5DB] hover:bg-[#F9FAFB] text-[#374151] py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Settings className="w-4 h-4" />
          Go to Settings
        </button>
      </div>

      <style>{`
        @keyframes fall {
          to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-fall {
          animation: fall linear forwards;
        }
      `}</style>
    </div>
  );
}
