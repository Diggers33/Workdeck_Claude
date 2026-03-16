import React, { useRef } from 'react';
import { Building2, Upload, ChevronLeft } from 'lucide-react';

interface CompanyEssentialsProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export function CompanyEssentials({ data, onUpdate, onNext, onBack }: CompanyEssentialsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const companySizes = [
    '1-10 employees',
    '11-50 employees',
    '51-200 employees',
    '201-500 employees',
    '501+ employees'
  ];

  const sectors = [
    'Technology & Software',
    'Creative & Design',
    'Consulting',
    'Marketing & Advertising',
    'Architecture & Engineering',
    'Legal Services',
    'Financial Services',
    'Healthcare',
    'Education',
    'Other'
  ];

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpdate({ logo: file });
    }
  };

  const canProceed = data.companyName && data.companySize && data.sector;

  return (
    <div className="bg-white rounded-lg p-8 max-w-2xl w-full" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
      {/* Progress indicator */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] font-medium text-[#0066FF]">Step 1 of 3</span>
          <div className="flex-1 h-1 bg-[#E5E7EB] rounded-full overflow-hidden">
            <div className="h-full bg-[#0066FF] rounded-full" style={{ width: '33%' }}></div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#0066FF]/10 mb-3">
          <Building2 className="w-6 h-6 text-[#0066FF]" />
        </div>
        <h2 className="text-[#1F2937] text-[24px] font-medium mb-1">Company essentials</h2>
        <p className="text-[#6B7280] text-[14px]">The basics to get your workspace identified</p>
      </div>

      {/* Form */}
      <div className="space-y-4 mb-8">
        {/* Company Name */}
        <div>
          <label className="block text-[13px] font-medium text-[#374151] mb-1">
            Company name *
          </label>
          <input
            type="text"
            value={data.companyName}
            onChange={(e) => onUpdate({ companyName: e.target.value })}
            placeholder="e.g., Acme Studios"
            className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
          />
        </div>

        {/* Logo Upload */}
        <div>
          <label className="block text-[13px] font-medium text-[#374151] mb-1">
            Company logo
          </label>
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-lg border-2 border-dashed border-[#D1D5DB] flex items-center justify-center bg-[#F9FAFB]">
              {data.logo ? (
                <img 
                  src={URL.createObjectURL(data.logo)} 
                  alt="Logo preview" 
                  className="w-full h-full object-contain rounded-lg"
                />
              ) : (
                <Building2 className="w-6 h-6 text-[#9CA3AF]" />
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 border border-[#D1D5DB] rounded-lg text-[13px] font-medium text-[#374151] hover:bg-[#F9FAFB] transition-colors flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {data.logo ? 'Change logo' : 'Upload logo'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
          <p className="text-[11px] text-[#9CA3AF] mt-1">PNG, JPG or SVG. Max 2MB.</p>
        </div>

        {/* Company Size */}
        <div>
          <label className="block text-[13px] font-medium text-[#374151] mb-1">
            Company size *
          </label>
          <select
            value={data.companySize}
            onChange={(e) => onUpdate({ companySize: e.target.value })}
            className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
          >
            <option value="">Select size</option>
            {companySizes.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>

        {/* Sector */}
        <div>
          <label className="block text-[13px] font-medium text-[#374151] mb-1">
            Industry sector *
          </label>
          <select
            value={data.sector}
            onChange={(e) => onUpdate({ sector: e.target.value })}
            className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
          >
            <option value="">Select sector</option>
            {sectors.map(sector => (
              <option key={sector} value={sector}>{sector}</option>
            ))}
          </select>
        </div>

        {/* Language & Timezone */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[13px] font-medium text-[#374151] mb-1">
              Platform language
            </label>
            <select
              value={data.language}
              onChange={(e) => onUpdate({ language: e.target.value })}
              className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
            >
              <option value="English">English</option>
              <option value="French">French</option>
              <option value="German">German</option>
              <option value="Spanish">Spanish</option>
            </select>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#374151] mb-1">
              Primary timezone
            </label>
            <select
              value={data.timezone}
              onChange={(e) => onUpdate({ timezone: e.target.value })}
              className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
            >
              {timezones.map(tz => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
        </div>
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
