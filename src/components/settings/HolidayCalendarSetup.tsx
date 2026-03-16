import React, { useState, useEffect } from 'react';
import { CalendarDays, CheckCircle2, Clock, Sparkles, AlertCircle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { getRegionalCalendar, Holiday, RegionalCalendar } from './HolidayCalendarData';

interface HolidayCalendarSetupProps {
  country: string;
  region: string;
  city?: string;
  onApply: (calendar: RegionalCalendar, autoUpdate: boolean) => void;
  onCustomize: (calendar: RegionalCalendar) => void;
}

export function HolidayCalendarSetup({ country, region, city, onApply, onCustomize }: HolidayCalendarSetupProps) {
  const [calendar, setCalendar] = useState<RegionalCalendar | null>(null);
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [showAllHolidays, setShowAllHolidays] = useState(false);

  useEffect(() => {
    const found = getRegionalCalendar(country, region, city);
    setCalendar(found);
  }, [country, region, city]);

  if (!calendar) {
    return (
      <div className="bg-[#FEF3C7] border border-[#FCD34D] rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#F59E0B] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[14px] font-medium text-[#92400E] mb-1">
              No regional calendar available
            </p>
            <p className="text-[13px] text-[#78350F]">
              We don't have automatic holiday data for {region}, {country} yet. 
              You can manually add holidays or contact support to request this region.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const sortedHolidays = [...calendar.holidays].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const holidaysByType = {
    national: sortedHolidays.filter(h => h.type === 'national'),
    regional: sortedHolidays.filter(h => h.type === 'regional'),
    local: sortedHolidays.filter(h => h.type === 'local')
  };

  const displayedHolidays = showAllHolidays ? sortedHolidays : sortedHolidays.slice(0, 6);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatFullDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="bg-gradient-to-br from-[#F0F4FF] to-[#FCE7F3] rounded-lg p-6 border-2 border-[#DBEAFE]">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#0066FF] to-[#60A5FA] flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-[18px] font-medium text-[#1F2937] mb-1">
            🎉 Public Holidays for {calendar.region}, {calendar.country}
          </h3>
          <p className="text-[14px] text-[#6B7280]">
            We found <span className="font-medium text-[#1F2937]">{calendar.holidays.length} public holidays</span> for {calendar.year}.
            These will automatically update each year.
          </p>
        </div>
      </div>

      {/* Holiday Breakdown */}
      <div className="bg-white/80 backdrop-blur rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            {holidaysByType.national.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#0066FF]"></div>
                <span className="text-[13px] text-[#6B7280]">
                  {holidaysByType.national.length} National
                </span>
              </div>
            )}
            {holidaysByType.regional.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#EC4899]"></div>
                <span className="text-[13px] text-[#6B7280]">
                  {holidaysByType.regional.length} Regional
                </span>
              </div>
            )}
            {holidaysByType.local.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#F59E0B]"></div>
                <span className="text-[13px] text-[#6B7280]">
                  {holidaysByType.local.length} Local
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowAllHolidays(!showAllHolidays)}
            className="text-[13px] text-[#0066FF] hover:text-[#0052CC] font-medium flex items-center gap-1"
          >
            {showAllHolidays ? (
              <>Show less <ChevronUp className="w-4 h-4" /></>
            ) : (
              <>Show all {calendar.holidays.length} <ChevronDown className="w-4 h-4" /></>
            )}
          </button>
        </div>

        {/* Holiday List */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {displayedHolidays.map((holiday, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-2 px-3 hover:bg-white/60 rounded transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="text-[14px] font-medium text-[#1F2937] w-16">
                  {formatDate(holiday.date)}
                </div>
                <div>
                  <div className="text-[14px] text-[#1F2937]">{holiday.name}</div>
                  {holiday.moveable && (
                    <div className="text-[11px] text-[#9CA3AF] flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      Date varies annually
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {holiday.type === 'national' && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#E0E9FF] text-[#0066FF] font-medium">
                    National
                  </span>
                )}
                {holiday.type === 'regional' && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#FCE7F3] text-[#EC4899] font-medium">
                    Regional
                  </span>
                )}
                {holiday.type === 'local' && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#F59E0B] font-medium">
                    Local
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Auto-update Toggle */}
      <div className="bg-white/80 backdrop-blur rounded-lg p-4 mb-4">
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative flex-shrink-0 mt-0.5">
            <input
              type="checkbox"
              checked={autoUpdate}
              onChange={(e) => setAutoUpdate(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[#E5E7EB] rounded-full peer-checked:bg-[#0066FF] transition-colors"></div>
            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[14px] font-medium text-[#1F2937]">
                Auto-update calendar each year
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#D1FAE5] text-[#059669] font-medium">
                Recommended
              </span>
            </div>
            <p className="text-[13px] text-[#6B7280]">
              Automatically refresh holidays for 2026, 2027, and future years. We'll notify you if there are changes to review.
            </p>
          </div>
        </label>
      </div>

      {/* Data Source Info */}
      <div className="bg-white/60 backdrop-blur rounded px-3 py-2 mb-4">
        <div className="flex items-center justify-between text-[11px] text-[#6B7280]">
          <span>Source: {calendar.source}</span>
          <span>Last updated: {new Date(calendar.lastUpdated).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => onApply(calendar, autoUpdate)}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-[#0066FF] to-[#60A5FA] hover:from-[#0052CC] hover:to-[#3B82F6] text-white rounded-lg text-[15px] font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#0066FF]/30"
        >
          <CheckCircle2 className="w-5 h-5" />
          Apply Calendar
        </button>
        <button
          onClick={() => onCustomize(calendar)}
          className="flex-1 px-6 py-3 bg-white hover:bg-[#F9FAFB] text-[#1F2937] border-2 border-[#E5E7EB] rounded-lg text-[15px] font-medium transition-colors"
        >
          Customize First
        </button>
      </div>

      {/* Help Text */}
      <div className="mt-4 pt-4 border-t border-[#E5E7EB]">
        <p className="text-[12px] text-[#6B7280]">
          💡 <strong className="text-[#1F2937]">Pro tip:</strong> After applying, you can add company-specific closures (Christmas shutdown, summer holidays) 
          and set exceptions for individual holidays if needed.
        </p>
      </div>
    </div>
  );
}