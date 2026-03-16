import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Upload, Building2, Save, Loader2 } from 'lucide-react';
import { apiClient } from '../../services/api-client';
import { ENDPOINTS } from '../../config/api';
import { toast } from 'sonner';

interface GeneralSettingsProps {
  onBack: () => void;
}

interface CompanyData {
  id?: string;
  companyName: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  contactEmail: string;
  contactPhone: string;
  companySize: string;
  sector: string;
  language: string;
  logo: string | null;
  logoFile: File | null;
  timesheetType: string;
  calendarSync: boolean;
  forceCalendarSync: boolean;
  website?: string;
}

const EMPTY_FORM: CompanyData = {
  companyName: '',
  address: '',
  city: '',
  postalCode: '',
  country: '',
  contactEmail: '',
  contactPhone: '',
  companySize: '',
  sector: '',
  language: 'English',
  logo: null,
  logoFile: null,
  timesheetType: 'Weekly',
  calendarSync: false,
  forceCalendarSync: false,
  website: '',
};

export function GeneralSettings({ onBack }: GeneralSettingsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<CompanyData>(EMPTY_FORM);
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch company data on mount
  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await apiClient.get<any>(ENDPOINTS.COMPANY);
        // Map API response fields to our form structure.
        // The API may use different field names, so we provide sensible fallbacks.
        setFormData({
          id: data.id || data._id,
          companyName: data.companyName || data.name || '',
          address: data.address || data.streetAddress || '',
          city: data.city || '',
          postalCode: data.postalCode || data.zipCode || data.postcode || '',
          country: data.country || '',
          contactEmail: data.contactEmail || data.email || '',
          contactPhone: data.contactPhone || data.phone || data.telephone || '',
          companySize: data.companySize || data.size || '',
          sector: data.sector || data.industry || '',
          language: data.language || 'English',
          logo: data.logo || data.logoUrl || null,
          logoFile: null,
          timesheetType: data.timesheetType || data.timesheet || 'Weekly',
          calendarSync: data.calendarSync ?? data.enableCalendarSync ?? false,
          forceCalendarSync: data.forceCalendarSync ?? false,
          website: data.website || data.url || '',
        });
      } catch (err: any) {
        console.error('Failed to fetch company data:', err);
        setError(err.message || 'Failed to load company data');
        toast.error('Failed to load company data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanyData();
  }, []);

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      // Build the payload from formData, excluding the logoFile (handled separately if needed)
      const payload: Record<string, any> = {
        companyName: formData.companyName,
        address: formData.address,
        city: formData.city,
        postalCode: formData.postalCode,
        country: formData.country,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        companySize: formData.companySize,
        sector: formData.sector,
        language: formData.language,
        timesheetType: formData.timesheetType,
        calendarSync: formData.calendarSync,
        forceCalendarSync: formData.forceCalendarSync,
        website: formData.website,
      };

      // Include the id if we have one (for update identification)
      if (formData.id) {
        payload.id = formData.id;
      }

      await apiClient.post(ENDPOINTS.UPDATE_COMPANY, payload);
      setHasChanges(false);
      toast.success('Company settings saved successfully');
    } catch (err: any) {
      console.error('Failed to save company data:', err);
      toast.error(err.message || 'Failed to save company settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB]">
        {/* Header */}
        <div className="bg-white border-b border-[#E5E7EB] sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-8 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-[#F3F4F6] rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-[#6B7280]" />
              </button>
              <div>
                <h1 className="text-[20px] font-medium text-[#1F2937]">General Information</h1>
                <p className="text-[13px] text-[#6B7280]">Core company identity and platform behavior</p>
              </div>
            </div>
          </div>
        </div>
        {/* Loading spinner */}
        <div className="flex flex-col items-center justify-center" style={{ height: 'calc(100vh - 80px)' }}>
          <Loader2 className="w-8 h-8 text-[#0066FF] animate-spin" />
          <p className="text-[14px] text-[#6B7280] mt-3">Loading company settings...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !formData.companyName) {
    return (
      <div className="min-h-screen bg-[#F9FAFB]">
        {/* Header */}
        <div className="bg-white border-b border-[#E5E7EB] sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-8 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-[#F3F4F6] rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-[#6B7280]" />
              </button>
              <div>
                <h1 className="text-[20px] font-medium text-[#1F2937]">General Information</h1>
                <p className="text-[13px] text-[#6B7280]">Core company identity and platform behavior</p>
              </div>
            </div>
          </div>
        </div>
        {/* Error message */}
        <div className="flex flex-col items-center justify-center" style={{ height: 'calc(100vh - 80px)' }}>
          <p className="text-[14px] text-[#EF4444] mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-lg text-[14px] font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <div className="bg-white border-b border-[#E5E7EB] sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-[#F3F4F6] rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-[#6B7280]" />
              </button>
              <div>
                <h1 className="text-[20px] font-medium text-[#1F2937]">General Information</h1>
                <p className="text-[13px] text-[#6B7280]">Core company identity and platform behavior</p>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="px-4 py-2 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-lg text-[14px] font-medium transition-colors disabled:bg-[#D1D5DB] disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-8 py-8 pb-24">
        <div className="bg-white rounded-lg border border-[#E5E7EB] divide-y divide-[#E5E7EB]">
          {/* Company Identity Section */}
          <div className="p-6">
            <h3 className="text-[15px] font-medium text-[#1F2937] mb-4">Company Identity</h3>
            <div className="space-y-4">
              {/* Company Name */}
              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-1">
                  Company name *
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => updateField('companyName', e.target.value)}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                />
              </div>

              {/* Company Logo */}
              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-2">
                  Company logo
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-lg border-2 border-dashed border-[#D1D5DB] flex items-center justify-center bg-[#F9FAFB]">
                    {formData.logoFile ? (
                      <img
                        src={URL.createObjectURL(formData.logoFile)}
                        alt="Logo"
                        className="w-full h-full object-contain rounded-lg"
                      />
                    ) : formData.logo ? (
                      <img
                        src={formData.logo}
                        alt="Logo"
                        className="w-full h-full object-contain rounded-lg"
                      />
                    ) : (
                      <Building2 className="w-8 h-8 text-[#9CA3AF]" />
                    )}
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-2 border border-[#D1D5DB] rounded-lg text-[13px] font-medium text-[#374151] hover:bg-[#F9FAFB] transition-colors flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      {formData.logoFile || formData.logo ? 'Change logo' : 'Upload logo'}
                    </button>
                    <p className="text-[11px] text-[#9CA3AF] mt-1">PNG, JPG or SVG. Max 2MB.</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) updateField('logoFile', file);
                    }}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Address fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[13px] font-medium text-[#374151] mb-1">
                    Street address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#374151] mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#374151] mb-1">
                    Postal code
                  </label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => updateField('postalCode', e.target.value)}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[13px] font-medium text-[#374151] mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => updateField('country', e.target.value)}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Contact info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-[#374151] mb-1">
                    Contact email
                  </label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => updateField('contactEmail', e.target.value)}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#374151] mb-1">
                    Contact phone
                  </label>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => updateField('contactPhone', e.target.value)}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Organization Info Section */}
          <div className="p-6">
            <h3 className="text-[15px] font-medium text-[#1F2937] mb-4">Organization Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-1">
                  Company size
                </label>
                <select
                  value={formData.companySize}
                  onChange={(e) => updateField('companySize', e.target.value)}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                >
                  <option>1-10 employees</option>
                  <option>11-50 employees</option>
                  <option>51-200 employees</option>
                  <option>201-500 employees</option>
                  <option>501+ employees</option>
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-1">
                  Industry sector
                </label>
                <select
                  value={formData.sector}
                  onChange={(e) => updateField('sector', e.target.value)}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                >
                  <option>Technology & Software</option>
                  <option>Creative & Design</option>
                  <option>Consulting</option>
                  <option>Marketing & Advertising</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Platform Settings Section */}
          <div className="p-6">
            <h3 className="text-[15px] font-medium text-[#1F2937] mb-4">Platform Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-1">
                  Platform language
                </label>
                <select
                  value={formData.language}
                  onChange={(e) => updateField('language', e.target.value)}
                  className="w-full max-w-xs px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                >
                  <option>English</option>
                  <option>French</option>
                  <option>German</option>
                  <option>Spanish</option>
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-2">
                  Timesheet type
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="timesheetType"
                      value="Weekly"
                      checked={formData.timesheetType === 'Weekly'}
                      onChange={(e) => updateField('timesheetType', e.target.value)}
                      className="w-4 h-4 text-[#0066FF] focus:ring-2 focus:ring-[#0066FF]"
                    />
                    <span className="text-[13px] text-[#374151]">Weekly</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="timesheetType"
                      value="Monthly"
                      checked={formData.timesheetType === 'Monthly'}
                      onChange={(e) => updateField('timesheetType', e.target.value)}
                      className="w-4 h-4 text-[#0066FF] focus:ring-2 focus:ring-[#0066FF]"
                    />
                    <span className="text-[13px] text-[#374151]">Monthly</span>
                  </label>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.calendarSync}
                    onChange={(e) => updateField('calendarSync', e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-[#0066FF] rounded focus:ring-2 focus:ring-[#0066FF]"
                  />
                  <div>
                    <span className="text-[13px] font-medium text-[#374151]">Enable unidirectional calendar sync</span>
                    <p className="text-[11px] text-[#6B7280] mt-0.5">Sync Workdeck events to external calendars</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.forceCalendarSync}
                    onChange={(e) => updateField('forceCalendarSync', e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-[#0066FF] rounded focus:ring-2 focus:ring-[#0066FF]"
                  />
                  <div>
                    <span className="text-[13px] font-medium text-[#374151]">Force calendar sync</span>
                    <p className="text-[11px] text-[#6B7280] mt-0.5">Require all users to sync calendar before accessing platform</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Unsaved changes warning */}
      {hasChanges && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1F2937] text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-4">
          <p className="text-[13px]">You have unsaved changes</p>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-3 py-1.5 bg-[#0066FF] hover:bg-[#0052CC] rounded text-[12px] font-medium transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save now'}
          </button>
        </div>
      )}
    </div>
  );
}
