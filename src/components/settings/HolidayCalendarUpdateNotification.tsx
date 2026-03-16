import React from 'react';
import { CalendarDays, Check, AlertCircle, ChevronRight } from 'lucide-react';

interface OfficeUpdate {
  officeName: string;
  region: string;
  holidayCount: number;
  status: 'auto-applied' | 'review-needed';
  changesCount?: number;
}

interface HolidayCalendarUpdateNotificationProps {
  year: number;
  offices: OfficeUpdate[];
  onReview: () => void;
  onDismiss: () => void;
}

export function HolidayCalendarUpdateNotification({ 
  year, 
  offices, 
  onReview, 
  onDismiss 
}: HolidayCalendarUpdateNotificationProps) {
  const autoApplied = offices.filter(o => o.status === 'auto-applied');
  const needsReview = offices.filter(o => o.status === 'review-needed');

  return (
    <div className="bg-gradient-to-r from-[#F0F4FF] to-[#E0F2FE] rounded-lg border-2 border-[#60A5FA] p-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#0066FF] to-[#60A5FA] flex items-center justify-center flex-shrink-0">
          <CalendarDays className="w-6 h-6 text-white" />
        </div>

        <div className="flex-1">
          <h3 className="text-[18px] font-medium text-[#1F2937] mb-2">
            📅 {year} Holiday Calendars Ready
          </h3>
          <p className="text-[14px] text-[#6B7280] mb-4">
            Your offices have been updated with {year} public holidays
          </p>

          <div className="space-y-2 mb-4">
            {autoApplied.map((office, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 px-3 bg-white/60 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-[14px] font-medium text-[#1F2937]">
                    {office.officeName}
                  </span>
                  <span className="text-[13px] text-[#6B7280]">
                    ({office.region})
                  </span>
                  <span className="text-[13px] text-[#6B7280]">
                    {office.holidayCount} days
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[13px] text-[#34D399] font-medium">
                  <Check className="w-4 h-4" />
                  Auto-applied
                </div>
              </div>
            ))}

            {needsReview.map((office, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 px-3 bg-white/60 rounded-lg border border-[#FCD34D]">
                <div className="flex items-center gap-3">
                  <span className="text-[14px] font-medium text-[#1F2937]">
                    {office.officeName}
                  </span>
                  <span className="text-[13px] text-[#6B7280]">
                    ({office.region})
                  </span>
                  <span className="text-[13px] text-[#6B7280]">
                    {office.holidayCount} days
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[13px] text-[#F59E0B] font-medium">
                  <AlertCircle className="w-4 h-4" />
                  Review needed {office.changesCount && `(${office.changesCount} changes)`}
                </div>
              </div>
            ))}
          </div>

          {needsReview.length > 0 && (
            <div className="bg-[#FEF3C7] rounded-lg p-3 mb-4">
              <p className="text-[13px] text-[#92400E]">
                <strong>Review needed:</strong> Some offices have calendar changes that require your attention. 
                This could be due to new holidays added, date changes, or conflicting information.
              </p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={onReview}
              className="px-5 py-2.5 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-lg text-[14px] font-medium transition-colors flex items-center gap-2"
            >
              Review Changes
              <ChevronRight className="w-4 h-4" />
            </button>
            {needsReview.length === 0 && (
              <button
                onClick={onDismiss}
                className="px-5 py-2.5 bg-white hover:bg-[#F9FAFB] text-[#1F2937] border border-[#E5E7EB] rounded-lg text-[14px] font-medium transition-colors"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}