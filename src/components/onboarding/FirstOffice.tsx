import React from 'react';
import { MapPin, ChevronLeft } from 'lucide-react';

interface FirstOfficeProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export function FirstOffice({ data, onUpdate, onNext, onBack }: FirstOfficeProps) {
  const currencies = ['EUR', 'USD', 'GBP', 'CHF', 'JPY', 'AUD', 'CAD'];
  const timezones = [
    'UTC',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'America/New_York',
    'America/Los_Angeles',
    'Asia/Tokyo',
    'Australia/Sydney'
  ];

  const workingDaysOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const toggleWorkingDay = (day: string) => {
    const current = data.workingDays || [];
    if (current.includes(day)) {
      onUpdate({ workingDays: current.filter((d: string) => d !== day) });
    } else {
      onUpdate({ workingDays: [...current, day] });
    }
  };

  const canProceed = data.officeName;

  return (
    <div className="bg-white rounded-lg p-8 max-w-2xl w-full" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
      {/* Progress indicator */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] font-medium text-[#0066FF]">Step 2 of 3</span>
          <div className="flex-1 h-1 bg-[#E5E7EB] rounded-full overflow-hidden">
            <div className="h-full bg-[#0066FF] rounded-full" style={{ width: '66%' }}></div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#0066FF]/10 mb-3">
          <MapPin className="w-6 h-6 text-[#0066FF]" />
        </div>
        <h2 className="text-[#1F2937] text-[24px] font-medium mb-1">Your first office</h2>
        <p className="text-[#6B7280] text-[14px]">Set up your primary location and working hours</p>
      </div>

      {/* Form */}
      <div className="space-y-4 mb-6">
        {/* Office Name */}
        <div>
          <label className="block text-[13px] font-medium text-[#374151] mb-1">
            Office name *
          </label>
          <input
            type="text"
            value={data.officeName}
            onChange={(e) => onUpdate({ officeName: e.target.value })}
            placeholder="e.g., Main Office, London HQ"
            className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
          />
        </div>

        {/* Office Address */}
        <div>
          <label className="block text-[13px] font-medium text-[#374151] mb-1">
            Address
          </label>
          <textarea
            value={data.officeAddress}
            onChange={(e) => onUpdate({ officeAddress: e.target.value })}
            placeholder="Street address, city, country"
            rows={2}
            className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent resize-none"
          />
        </div>

        {/* Currency & Timezone */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[13px] font-medium text-[#374151] mb-1">
              Currency
            </label>
            <select
              value={data.currency}
              onChange={(e) => onUpdate({ currency: e.target.value })}
              className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
            >
              {currencies.map(curr => (
                <option key={curr} value={curr}>{curr}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#374151] mb-1">
              Timezone
            </label>
            <select
              value={data.officeTimezone}
              onChange={(e) => onUpdate({ officeTimezone: e.target.value })}
              className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
            >
              {timezones.map(tz => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Working Hours */}
        <div>
          <label className="block text-[13px] font-medium text-[#374151] mb-2">
            Default working hours
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <input
                type="time"
                value={data.workingHours.start}
                onChange={(e) => onUpdate({ workingHours: { ...data.workingHours, start: e.target.value } })}
                className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
              />
            </div>
            <div>
              <input
                type="time"
                value={data.workingHours.end}
                onChange={(e) => onUpdate({ workingHours: { ...data.workingHours, end: e.target.value } })}
                className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Working Days */}
        <div>
          <label className="block text-[13px] font-medium text-[#374151] mb-2">
            Working days
          </label>
          <div className="flex flex-wrap gap-2">
            {workingDaysOptions.map(day => {
              const isSelected = data.workingDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleWorkingDay(day)}
                  className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                    isSelected
                      ? 'bg-[#0066FF] text-white'
                      : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Info callout */}
      <div className="bg-[#F0F4FF] border border-[#DBEAFE] rounded-lg p-3 mb-6">
        <p className="text-[12px] text-[#1F2937]">
          💡 You can add more offices and customize schedules later in Settings
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="px-4 py-2 border border-[#D1D5DB] rounded-lg text-[14px] font-medium text-[#374151] hover:bg-[#F9FAFB] transition-colors flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="flex-1 bg-[#0066FF] hover:bg-[#0052CC] text-white py-2 rounded-lg font-medium transition-colors disabled:bg-[#D1D5DB] disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
