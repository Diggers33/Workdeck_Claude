import React from 'react';
import { CheckCircle2, ArrowRight, Settings, Sparkles } from 'lucide-react';

interface CelebrationModalProps {
  onClose: () => void;
  onContinue: () => void;
  companyName: string;
}

export function CelebrationModal({ onClose, onContinue, companyName }: CelebrationModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Celebratory Header */}
        <div className="bg-gradient-to-br from-[#0066FF] via-[#60A5FA] to-[#34D399] p-12 text-center relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0">
            <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full animate-pulse"></div>
            <div className="absolute top-20 right-20 w-16 h-16 bg-white/10 rounded-full animate-pulse delay-75"></div>
            <div className="absolute bottom-10 left-1/3 w-24 h-24 bg-white/10 rounded-full animate-pulse delay-150"></div>
          </div>
          
          <div className="relative z-10">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white flex items-center justify-center animate-bounce">
              <Sparkles className="w-10 h-10 text-[#0066FF]" />
            </div>
            <h2 className="text-[32px] font-medium text-white mb-2">
              🎉 Your workspace is ready!
            </h2>
            <p className="text-[16px] text-white/90">
              {companyName} is all set up and ready to go
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="mb-8">
            <h3 className="text-[18px] font-medium text-[#1F2937] mb-4">
              What you've accomplished:
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-[#D1FAE5] rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-[#34D399] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[14px] font-medium text-[#1F2937]">Company identity configured</p>
                  <p className="text-[12px] text-[#6B7280]">Logo, location, and platform settings</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-[#D1FAE5] rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-[#34D399] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[14px] font-medium text-[#1F2937]">Office locations set up</p>
                  <p className="text-[12px] text-[#6B7280]">Timezones, currencies, and work schedules</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-[#D1FAE5] rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-[#34D399] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[14px] font-medium text-[#1F2937]">Team members invited</p>
                  <p className="text-[12px] text-[#6B7280]">Your team can now log in and start working</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-[#D1FAE5] rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-[#34D399] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[14px] font-medium text-[#1F2937]">Types configured</p>
                  <p className="text-[12px] text-[#6B7280]">Cost, leave, project, and funding categories ready</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#F0F4FF] rounded-lg p-4 mb-6 border border-[#DBEAFE]">
            <div className="flex items-start gap-3">
              <Settings className="w-5 h-5 text-[#0066FF] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[13px] font-medium text-[#1F2937] mb-1">
                  Advanced features available
                </p>
                <p className="text-[12px] text-[#6B7280]">
                  Configure policies, workflows, and billing when you're ready. 
                  You can always access these from Settings.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-lg text-[15px] font-medium transition-colors flex items-center justify-center gap-2"
            >
              Enter Workdeck
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={onContinue}
              className="flex-1 px-6 py-3 bg-white hover:bg-[#F9FAFB] text-[#1F2937] border-2 border-[#E5E7EB] rounded-lg text-[15px] font-medium transition-colors"
            >
              Configure advanced settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}