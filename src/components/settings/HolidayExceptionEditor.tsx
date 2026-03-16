import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Holiday } from './HolidayCalendarData';

interface HolidayException {
  holidayDate: string;
  holidayName: string;
  action: 'work' | 'skip';
  reason?: string;
}

interface HolidayExceptionEditorProps {
  holidays: Holiday[];
  existingExceptions?: HolidayException[];
  onClose: () => void;
  onSave: (exceptions: HolidayException[]) => void;
}

export function HolidayExceptionEditor({ 
  holidays, 
  existingExceptions = [],
  onClose, 
  onSave 
}: HolidayExceptionEditorProps) {
  const [exceptions, setExceptions] = useState<HolidayException[]>(existingExceptions);

  const sortedHolidays = [...holidays].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getException = (holidayDate: string) => {
    return exceptions.find(e => e.holidayDate === holidayDate);
  };

  const toggleException = (holiday: Holiday, action: 'work' | 'skip') => {
    const existing = getException(holiday.date);
    
    if (existing && existing.action === action) {
      // Remove exception
      setExceptions(exceptions.filter(e => e.holidayDate !== holiday.date));
    } else {
      // Add or update exception
      const newException: HolidayException = {
        holidayDate: holiday.date,
        holidayName: holiday.name,
        action
      };
      
      if (existing) {
        setExceptions(exceptions.map(e => 
          e.holidayDate === holiday.date ? newException : e
        ));
      } else {
        setExceptions([...exceptions, newException]);
      }
    }
  };

  const handleSave = () => {
    onSave(exceptions);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-8">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-[#E5E7EB] px-6 py-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-[20px] font-medium text-[#1F2937] mb-1">
                Edit Holiday Exceptions
              </h2>
              <p className="text-[13px] text-[#6B7280]">
                Mark holidays when this office will work or skip specific dates
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#F3F4F6] rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-[#6B7280]" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-4">
            {/* Info Banner */}
            <div className="bg-[#E0F2FE] border border-[#60A5FA] rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[#0066FF] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[13px] text-[#1F2937] mb-1">
                    <strong>Office works:</strong> Team will work on this public holiday (e.g., different local customs)
                  </p>
                  <p className="text-[13px] text-[#1F2937]">
                    <strong>Skip this date:</strong> Don't observe this holiday at this office (very rare)
                  </p>
                </div>
              </div>
            </div>

            {/* Holidays List */}
            <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
              <div className="bg-[#F9FAFB] px-4 py-3 border-b border-[#E5E7EB]">
                <div className="grid grid-cols-12 gap-4 text-[11px] font-medium text-[#6B7280] uppercase tracking-wide">
                  <div className="col-span-2">Date</div>
                  <div className="col-span-3">Holiday Name</div>
                  <div className="col-span-2">Type</div>
                  <div className="col-span-5 text-right">Exception</div>
                </div>
              </div>

              <div className="divide-y divide-[#E5E7EB]">
                {sortedHolidays.map((holiday, idx) => {
                  const exception = getException(holiday.date);
                  const hasException = !!exception;

                  return (
                    <div 
                      key={idx} 
                      className={`px-4 py-3 hover:bg-[#F9FAFB] transition-colors ${hasException ? 'bg-[#FEF3C7]/30' : ''}`}
                    >
                      <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-2 text-[13px] font-medium text-[#1F2937]">
                          {formatDate(holiday.date)}
                        </div>

                        <div className="col-span-3">
                          <div className="text-[14px] text-[#1F2937]">{holiday.name}</div>
                        </div>

                        <div className="col-span-2">
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

                        <div className="col-span-5 flex items-center justify-end gap-2">
                          {!hasException ? (
                            <>
                              <button
                                onClick={() => toggleException(holiday, 'work')}
                                className="px-3 py-1.5 text-[12px] bg-white border border-[#E5E7EB] hover:border-[#F59E0B] hover:bg-[#FEF3C7] text-[#6B7280] hover:text-[#F59E0B] rounded-lg font-medium transition-all"
                              >
                                Office works
                              </button>
                              <button
                                onClick={() => toggleException(holiday, 'skip')}
                                className="px-3 py-1.5 text-[12px] bg-white border border-[#E5E7EB] hover:border-[#F87171] hover:bg-[#FEE2E2] text-[#6B7280] hover:text-[#F87171] rounded-lg font-medium transition-all"
                              >
                                Skip this date
                              </button>
                            </>
                          ) : (
                            <div className="flex items-center gap-2">
                              {exception.action === 'work' ? (
                                <div className="px-3 py-1.5 bg-[#FEF3C7] border border-[#FCD34D] text-[#92400E] rounded-lg text-[12px] font-medium flex items-center gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Office will work
                                </div>
                              ) : (
                                <div className="px-3 py-1.5 bg-[#FEE2E2] border border-[#FCA5A5] text-[#991B1B] rounded-lg text-[12px] font-medium flex items-center gap-1.5">
                                  <X className="w-3.5 h-3.5" />
                                  Date skipped
                                </div>
                              )}
                              <button
                                onClick={() => toggleException(holiday, exception.action)}
                                className="p-1.5 hover:bg-[#F3F4F6] rounded transition-colors"
                                title="Remove exception"
                              >
                                <X className="w-4 h-4 text-[#6B7280]" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary */}
            {exceptions.length > 0 && (
              <div className="bg-[#FEF3C7] border border-[#FCD34D] rounded-lg p-4">
                <p className="text-[13px] text-[#92400E] mb-2">
                  <strong>{exceptions.length} exception{exceptions.length !== 1 ? 's' : ''} set:</strong>
                </p>
                <ul className="text-[12px] text-[#92400E] space-y-1 ml-4">
                  {exceptions.map((exc, idx) => (
                    <li key={idx} className="list-disc">
                      {exc.holidayName} — {exc.action === 'work' ? 'Office will work' : 'Date skipped'}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#E5E7EB] px-6 py-4 flex items-center justify-between">
          <div className="text-[13px] text-[#6B7280]">
            {exceptions.length === 0 ? (
              'No exceptions set'
            ) : (
              `${exceptions.length} exception${exceptions.length !== 1 ? 's' : ''} to save`
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] text-[#1F2937] rounded-lg text-[14px] font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2.5 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-lg text-[14px] font-medium transition-colors"
            >
              Save Exceptions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
