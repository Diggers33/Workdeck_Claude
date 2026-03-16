import React, { useState } from 'react';
import { 
  CalendarDays, Plus, Edit2, Trash2, Copy, RefreshCw, 
  CheckCircle2, X, Calendar, Clock, AlertTriangle
} from 'lucide-react';
import { Holiday, RegionalCalendar } from './HolidayCalendarData';
import { HolidayExceptionEditor } from './HolidayExceptionEditor';

interface CompanyClosure {
  id: string;
  name: string;
  startDate: string;
  endDate?: string;
  recurring: boolean;
  type: 'company';
}

interface HolidayException {
  holidayDate: string;
  holidayName: string;
  action: 'work' | 'skip';
  reason?: string;
}

interface HolidayCalendarDetailProps {
  officeName: string;
  regionalCalendar: RegionalCalendar;
  companyClosures: CompanyClosure[];
  holidayExceptions?: HolidayException[];
  onAddClosure: (closure: Omit<CompanyClosure, 'id'>) => void;
  onSaveExceptions?: (exceptions: HolidayException[]) => void;
  onCopyToOffice: () => void;
}

export function HolidayCalendarDetail({ 
  officeName, 
  regionalCalendar, 
  companyClosures,
  holidayExceptions = [],
  onAddClosure,
  onSaveExceptions,
  onCopyToOffice
}: HolidayCalendarDetailProps) {
  const [showAddClosure, setShowAddClosure] = useState(false);
  const [showAllPublic, setShowAllPublic] = useState(false);
  const [showExceptionEditor, setShowExceptionEditor] = useState(false);
  const [newClosure, setNewClosure] = useState({
    name: '',
    startDate: '',
    endDate: '',
    recurring: true
  });

  const sortedHolidays = [...regionalCalendar.holidays].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const totalDays = regionalCalendar.holidays.length + companyClosures.reduce((sum, closure) => {
    if (closure.endDate) {
      const days = Math.ceil((new Date(closure.endDate).getTime() - new Date(closure.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return sum + days;
    }
    return sum + 1;
  }, 0);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatFullDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const handleAddClosure = () => {
    if (newClosure.name && newClosure.startDate) {
      onAddClosure({
        name: newClosure.name,
        startDate: newClosure.startDate,
        endDate: newClosure.endDate || undefined,
        recurring: newClosure.recurring,
        type: 'company'
      });
      setNewClosure({ name: '', startDate: '', endDate: '', recurring: true });
      setShowAddClosure(false);
    }
  };

  const displayedPublicHolidays = showAllPublic ? sortedHolidays : sortedHolidays.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[24px] font-medium text-[#1F2937] mb-1">
            {officeName} — {regionalCalendar.year} Calendar
          </h2>
          <p className="text-[14px] text-[#6B7280]">
            Manage public holidays and company-specific closures
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onCopyToOffice}
            className="px-4 py-2 bg-white border border-[#E5E7EB] hover:border-[#0066FF] text-[#1F2937] rounded-lg text-[14px] font-medium transition-colors flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Copy to Office
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-[#F0F4FF] to-[#E0E9FF] rounded-lg p-6 border border-[#DBEAFE]">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <CalendarDays className="w-6 h-6 text-[#0066FF]" />
              <span className="text-[32px] font-medium text-[#1F2937]">{totalDays}</span>
              <span className="text-[18px] text-[#6B7280]">non-working days</span>
            </div>
            <p className="text-[13px] text-[#6B7280]">
              {regionalCalendar.holidays.length} public holidays + {companyClosures.length} company closures
            </p>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-[#6B7280] mb-1">Auto-update enabled</div>
            <div className="flex items-center gap-2 text-[13px] text-[#34D399] font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Synced with {regionalCalendar.source}
            </div>
          </div>
        </div>
      </div>

      {/* Public Holidays Section */}
      <div className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden">
        <div className="bg-[#F9FAFB] px-6 py-4 border-b border-[#E5E7EB]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[16px] font-medium text-[#1F2937] mb-1">
                Public Holidays
              </h3>
              <p className="text-[13px] text-[#6B7280]">
                Auto-managed · {regionalCalendar.holidays.length} days · Source: {regionalCalendar.source}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAllPublic(!showAllPublic)}
                className="px-3 py-1.5 text-[13px] text-[#6B7280] hover:text-[#1F2937] font-medium"
              >
                {showAllPublic ? 'Show less' : `View all ${regionalCalendar.holidays.length}`}
              </button>
              <button
                onClick={() => setShowExceptionEditor(true)}
                className="px-3 py-1.5 bg-white border border-[#E5E7EB] hover:border-[#0066FF] text-[#1F2937] rounded-lg text-[13px] font-medium transition-colors flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" />
                Edit Exceptions
              </button>
            </div>
          </div>
        </div>

        <div className="divide-y divide-[#E5E7EB]">
          {displayedPublicHolidays.map((holiday, idx) => (
            <div key={idx} className="px-6 py-3 hover:bg-[#F9FAFB] transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-[14px] font-medium text-[#1F2937] w-20">
                    {formatDate(holiday.date)}
                  </div>
                  <div className="flex-1">
                    <div className="text-[14px] text-[#1F2937] mb-0.5">{holiday.name}</div>
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
                      {holiday.moveable && (
                        <span className="text-[11px] text-[#9CA3AF] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Date varies annually
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-[#9CA3AF]">
                  {holiday.recurring ? (
                    <>
                      <RefreshCw className="w-3 h-3" />
                      Annual
                    </>
                  ) : (
                    '2025 only'
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Company Closures Section */}
      <div className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden">
        <div className="bg-[#F9FAFB] px-6 py-4 border-b border-[#E5E7EB]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[16px] font-medium text-[#1F2937] mb-1">
                Company Closures
              </h3>
              <p className="text-[13px] text-[#6B7280]">
                Manual · {companyClosures.length} {companyClosures.length === 1 ? 'closure' : 'closures'}
              </p>
            </div>
          </div>
        </div>

        {companyClosures.length > 0 ? (
          <div className="divide-y divide-[#E5E7EB]">
            {companyClosures.map((closure) => (
              <div key={closure.id} className="px-6 py-3 hover:bg-[#F9FAFB] transition-colors group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-[14px] font-medium text-[#1F2937] w-32">
                      {closure.endDate ? (
                        <>
                          {formatDate(closure.startDate)} - {formatDate(closure.endDate)}
                        </>
                      ) : (
                        formatDate(closure.startDate)
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-[14px] text-[#1F2937] mb-0.5">{closure.name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-[11px] text-[#9CA3AF]">
                      {closure.recurring && (
                        <>
                          <RefreshCw className="w-3 h-3" />
                          Annual
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 hover:bg-[#E5E7EB] rounded transition-colors">
                        <Edit2 className="w-3 h-3 text-[#6B7280]" />
                      </button>
                      <button className="p-1.5 hover:bg-[#FEE2E2] rounded transition-colors">
                        <Trash2 className="w-3 h-3 text-[#EF4444]" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-8 text-center">
            <Calendar className="w-12 h-12 text-[#D1D5DB] mx-auto mb-3" />
            <p className="text-[14px] text-[#6B7280] mb-1">No company closures yet</p>
            <p className="text-[13px] text-[#9CA3AF]">
              Add Christmas shutdown, summer holidays, or other company-specific non-working days
            </p>
          </div>
        )}

        {/* Add Closure Form */}
        {showAddClosure ? (
          <div className="px-6 py-4 bg-[#F9FAFB] border-t-2 border-[#0066FF]">
            <div className="mb-4">
              <label className="block text-[13px] font-medium text-[#1F2937] mb-1">
                Closure Name
              </label>
              <input
                type="text"
                value={newClosure.name}
                onChange={(e) => setNewClosure({ ...newClosure, name: e.target.value })}
                placeholder="e.g., Christmas Shutdown, Summer Closure"
                className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[13px] font-medium text-[#1F2937] mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={newClosure.startDate}
                  onChange={(e) => setNewClosure({ ...newClosure, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#1F2937] mb-1">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={newClosure.endDate}
                  onChange={(e) => setNewClosure({ ...newClosure, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newClosure.recurring}
                  onChange={(e) => setNewClosure({ ...newClosure, recurring: e.target.checked })}
                  className="w-4 h-4 text-[#0066FF] border-[#D1D5DB] rounded focus:ring-2 focus:ring-[#0066FF]"
                />
                <span className="text-[13px] text-[#1F2937]">Repeat annually</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAddClosure}
                disabled={!newClosure.name || !newClosure.startDate}
                className="px-4 py-2 bg-[#0066FF] hover:bg-[#0052CC] disabled:bg-[#D1D5DB] disabled:cursor-not-allowed text-white rounded-lg text-[14px] font-medium transition-colors"
              >
                Add Closure
              </button>
              <button
                onClick={() => {
                  setShowAddClosure(false);
                  setNewClosure({ name: '', startDate: '', endDate: '', recurring: true });
                }}
                className="px-4 py-2 bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] text-[#1F2937] rounded-lg text-[14px] font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="px-6 py-4 border-t border-[#E5E7EB]">
            <button
              onClick={() => setShowAddClosure(true)}
              className="w-full px-4 py-3 border-2 border-dashed border-[#D1D5DB] hover:border-[#0066FF] hover:bg-[#F9FAFB] rounded-lg text-[14px] font-medium text-[#6B7280] hover:text-[#0066FF] transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Company Closure
            </button>
          </div>
        )}
      </div>

      {/* Info Footer */}
      <div className="bg-[#F0F4FF] rounded-lg p-4 border border-[#DBEAFE]">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#0066FF] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[13px] font-medium text-[#1F2937] mb-1">
              Holiday Calendar Impact
            </p>
            <p className="text-[12px] text-[#6B7280]">
              Non-working days are automatically excluded from project timelines, resource planning, 
              and timesheet calculations. Team members cannot submit leave requests for these dates.
            </p>
          </div>
        </div>
      </div>

      {/* Holiday Exception Editor */}
      {showExceptionEditor && (
        <HolidayExceptionEditor
          holidays={regionalCalendar.holidays}
          existingExceptions={holidayExceptions}
          onSave={(exceptions) => {
            if (onSaveExceptions) {
              onSaveExceptions(exceptions);
            }
          }}
          onClose={() => setShowExceptionEditor(false)}
        />
      )}
    </div>
  );
}