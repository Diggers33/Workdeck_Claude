import React from 'react';
import { Rocket, CheckCircle2, Users, Building2, Zap } from 'lucide-react';

interface WelcomeScreenProps {
  adminName: string;
  onNext: () => void;
}

export function WelcomeScreen({ adminName, onNext }: WelcomeScreenProps) {
  return (
    <div className="bg-white rounded-lg p-12 max-w-2xl w-full" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#0066FF]/10 mb-4">
          <Rocket className="w-8 h-8 text-[#0066FF]" />
        </div>
        <h1 className="text-[#1F2937] mb-2">Welcome to Workdeck, {adminName}!</h1>
        <p className="text-[#6B7280] text-[15px]">
          Let's get your workspace ready. This will take about 5 minutes.
        </p>
      </div>

      {/* Progress Preview */}
      <div className="bg-[#F9FAFB] rounded-lg p-6 mb-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#0066FF]/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-4 h-4 text-[#0066FF]" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-medium text-[#1F2937]">Company essentials</p>
              <p className="text-[11px] text-[#9CA3AF]">Name, logo, and basic details</p>
            </div>
            <CheckCircle2 className="w-4 h-4 text-[#9CA3AF]" />
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#0066FF]/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-4 h-4 text-[#0066FF]" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-medium text-[#1F2937]">Your first office</p>
              <p className="text-[11px] text-[#9CA3AF]">Location and working hours</p>
            </div>
            <CheckCircle2 className="w-4 h-4 text-[#9CA3AF]" />
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#0066FF]/10 flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 text-[#0066FF]" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-medium text-[#1F2937]">Invite your team</p>
              <p className="text-[11px] text-[#9CA3AF]">Add colleagues to get started</p>
            </div>
            <CheckCircle2 className="w-4 h-4 text-[#9CA3AF]" />
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#0066FF]/10 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-[#0066FF]" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-medium text-[#1F2937]">Launch your workspace</p>
              <p className="text-[11px] text-[#9CA3AF]">You're ready to go!</p>
            </div>
            <CheckCircle2 className="w-4 h-4 text-[#9CA3AF]" />
          </div>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={onNext}
        className="w-full bg-[#0066FF] hover:bg-[#0052CC] text-white py-3 rounded-lg font-medium transition-colors"
      >
        Let's get started
      </button>

      <p className="text-center text-[11px] text-[#9CA3AF] mt-4">
        You can always fine-tune these settings later
      </p>
    </div>
  );
}
