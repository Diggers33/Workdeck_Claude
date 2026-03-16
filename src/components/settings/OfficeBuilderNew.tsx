import React, { useState, useEffect } from 'react';
import {
  X, MapPin, Save, Building2, ChevronRight, ChevronLeft,
  Globe, CalendarDays, Check
} from 'lucide-react';
import { HolidayCalendarSetup } from './HolidayCalendarSetup';
import { COUNTRIES_WITH_REGIONS, CITIES_WITH_LOCAL_HOLIDAYS, getRegionalCalendar, RegionalCalendar } from './HolidayCalendarData';

interface Office {
  id: number;
  name: string;
  address: string;
  currency: string;
  timezone: string;
  workingHours: { start: string; end: string };
  workingDays: string[];
  country: string;
  region: string;
  city?: string;
  regionalCalendar: RegionalCalendar | null;
  autoUpdateHolidays: boolean;
  companyClosures: any[];
}

interface OfficeBuilderProps {
  onClose: () => void;
  onSave: (office: Office) => void;
  editingOffice?: Office;
}

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' }
];

export function OfficeBuilder({ onClose, onSave, editingOffice }: OfficeBuilderProps) {
  // State for multi-step form
  const [step, setStep] = useState(1); // 1: Basic Info, 2: Location, 3: Holiday Calendar, 4: Done

  // Step 1: Basic Info
  const [officeName, setOfficeName] = useState(editingOffice?.name || '');
  const [address, setAddress] = useState(editingOffice?.address || '');
  const [currency, setCurrency] = useState(editingOffice?.currency || 'USD');

  // Step 2: Location
  const [selectedCountry, setSelectedCountry] = useState(editingOffice?.country || '');
  const [selectedRegion, setSelectedRegion] = useState(editingOffice?.region || '');
  const [selectedCity, setSelectedCity] = useState(editingOffice?.city || '');

  // Step 3: Holiday Calendar
  const [regionalCalendar, setRegionalCalendar] = useState<RegionalCalendar | null>(editingOffice?.regionalCalendar || null);
  const [autoUpdateHolidays, setAutoUpdateHolidays] = useState(editingOffice?.autoUpdateHolidays ?? true);
  const [showHolidaySetup, setShowHolidaySetup] = useState(false);

  // Default work settings
  const [timezone, setTimezone] = useState(editingOffice?.timezone || 'UTC');
  const [workingHours] = useState(editingOffice?.workingHours || { start: '09:00', end: '18:00' });
  const [workingDays] = useState(editingOffice?.workingDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);

  // Get available regions based on selected country
  const availableRegions = selectedCountry && COUNTRIES_WITH_REGIONS[selectedCountry] 
    ? COUNTRIES_WITH_REGIONS[selectedCountry]
    : [];

  // Get available cities based on selected country/region
  const availableCities = selectedCountry && CITIES_WITH_LOCAL_HOLIDAYS[selectedCountry]
    ? CITIES_WITH_LOCAL_HOLIDAYS[selectedCountry]
    : [];

  // Auto-detect calendar when location is selected
  useEffect(() => {
    if (selectedCountry && selectedRegion) {
      const calendar = getRegionalCalendar(selectedCountry, selectedRegion, selectedCity);
      if (calendar) {
        setRegionalCalendar(calendar);
        setShowHolidaySetup(true);
      }
    }
  }, [selectedCountry, selectedRegion, selectedCity]);

  const handleNext = () => {
    if (step === 1) {
      if (!officeName.trim()) {
        alert('Please enter an office name');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!selectedCountry || !selectedRegion) {
        alert('Please select country and region');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleApplyCalendar = (calendar: RegionalCalendar, autoUpdate: boolean) => {
    setRegionalCalendar(calendar);
    setAutoUpdateHolidays(autoUpdate);
    setShowHolidaySetup(false);
  };

  const handleCustomizeCalendar = (calendar: RegionalCalendar) => {
    setRegionalCalendar(calendar);
    setShowHolidaySetup(false);
    // In a full implementation, this would open a customization modal
  };

  const handleSave = () => {
    const office: Office = {
      id: editingOffice?.id || Date.now(),
      name: officeName,
      address,
      currency,
      timezone,
      workingHours,
      workingDays,
      country: selectedCountry,
      region: selectedRegion,
      city: selectedCity,
      regionalCalendar,
      autoUpdateHolidays,
      companyClosures: editingOffice?.companyClosures || []
    };

    onSave(office);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-[#E5E7EB] p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#0066FF] to-[#60A5FA] flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-[20px] font-medium text-[#1F2937]">
                  {editingOffice ? 'Edit Office' : 'New Office'}
                </h2>
                <p className="text-[13px] text-[#6B7280] mt-0.5">
                  Step {step} of 3: {step === 1 ? 'Basic Information' : step === 2 ? 'Location & Holidays' : 'Review'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#F3F4F6] rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-[#6B7280]" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 flex items-center gap-2">
            <div className={`flex-1 h-1.5 rounded-full ${step >= 1 ? 'bg-[#0066FF]' : 'bg-[#E5E7EB]'}`}></div>
            <div className={`flex-1 h-1.5 rounded-full ${step >= 2 ? 'bg-[#0066FF]' : 'bg-[#E5E7EB]'}`}></div>
            <div className={`flex-1 h-1.5 rounded-full ${step >= 3 ? 'bg-[#0066FF]' : 'bg-[#E5E7EB]'}`}></div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-3xl mx-auto">
            {/* Step 1: Basic Information */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-[18px] font-medium text-[#1F2937] mb-1">Basic Information</h3>
                  <p className="text-[14px] text-[#6B7280]">Let's start with the essentials</p>
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[#1F2937] mb-2">
                    Office Name *
                  </label>
                  <input
                    type="text"
                    value={officeName}
                    onChange={(e) => setOfficeName(e.target.value)}
                    placeholder="e.g., Barcelona HQ, Madrid Office, London Studio"
                    className="w-full px-4 py-3 border border-[#D1D5DB] rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[#1F2937] mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Street address, city, postal code"
                    className="w-full px-4 py-3 border border-[#D1D5DB] rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[#1F2937] mb-2">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-4 py-3 border border-[#D1D5DB] rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                  >
                    {CURRENCIES.map((curr) => (
                      <option key={curr.code} value={curr.code}>
                        {curr.code} - {curr.name} ({curr.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Step 2: Location Selection */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-[18px] font-medium text-[#1F2937] mb-1">Location</h3>
                  <p className="text-[14px] text-[#6B7280]">
                    We'll automatically set up the right holiday calendar for your region
                  </p>
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[#1F2937] mb-2">
                    Country *
                  </label>
                  <select
                    value={selectedCountry}
                    onChange={(e) => {
                      setSelectedCountry(e.target.value);
                      setSelectedRegion('');
                      setSelectedCity('');
                    }}
                    className="w-full px-4 py-3 border border-[#D1D5DB] rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                  >
                    <option value="">Select country...</option>
                    {Object.keys(COUNTRIES_WITH_REGIONS).map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedCountry && availableRegions.length > 0 && (
                  <div>
                    <label className="block text-[13px] font-medium text-[#1F2937] mb-2">
                      Region / State *
                    </label>
                    <select
                      value={selectedRegion}
                      onChange={(e) => {
                        setSelectedRegion(e.target.value);
                        setSelectedCity('');
                      }}
                      className="w-full px-4 py-3 border border-[#D1D5DB] rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                    >
                      <option value="">Select region...</option>
                      {availableRegions.map((region) => (
                        <option key={region} value={region}>
                          {region}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {selectedCountry && availableCities.length > 0 && (
                  <div>
                    <label className="block text-[13px] font-medium text-[#1F2937] mb-2">
                      City (Optional)
                    </label>
                    <select
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      className="w-full px-4 py-3 border border-[#D1D5DB] rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                    >
                      <option value="">None - use regional calendar</option>
                      {availableCities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                    <p className="text-[12px] text-[#6B7280] mt-2">
                      Some cities have additional local holidays
                    </p>
                  </div>
                )}

                {selectedCountry && selectedRegion && (
                  <div className="bg-[#E0F2FE] rounded-lg p-4 border border-[#60A5FA]">
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-[#0066FF] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[14px] font-medium text-[#1F2937] mb-1">
                          Location confirmed
                        </p>
                        <p className="text-[13px] text-[#6B7280]">
                          We'll show you {regionalCalendar ? regionalCalendar.holidays.length : 'the'} public holidays for {selectedRegion}, {selectedCountry} in the next step.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Holiday Calendar */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-[18px] font-medium text-[#1F2937] mb-1">Holiday Calendar</h3>
                  <p className="text-[14px] text-[#6B7280]">
                    Set it once, forget it forever
                  </p>
                </div>

                {regionalCalendar && showHolidaySetup ? (
                  <HolidayCalendarSetup
                    country={selectedCountry}
                    region={selectedRegion}
                    city={selectedCity}
                    onApply={handleApplyCalendar}
                    onCustomize={handleCustomizeCalendar}
                  />
                ) : regionalCalendar && !showHolidaySetup ? (
                  <div className="bg-gradient-to-br from-[#F0F4FF] to-[#E0F2FE] rounded-lg p-6 border-2 border-[#60A5FA]">
                    <div className="flex items-center gap-3 mb-3">
                      <CalendarDays className="w-6 h-6 text-[#0066FF]" />
                      <div>
                        <h4 className="text-[16px] font-medium text-[#1F2937]">
                          ✓ Calendar Applied
                        </h4>
                        <p className="text-[14px] text-[#6B7280]">
                          {regionalCalendar.holidays.length} public holidays for {regionalCalendar.region}, {regionalCalendar.country}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[13px] text-[#6B7280]">
                      {autoUpdateHolidays && (
                        <>
                          <Check className="w-4 h-4 text-[#34D399]" />
                          <span>Auto-update enabled for future years</span>
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => setShowHolidaySetup(true)}
                      className="mt-4 text-[14px] text-[#0066FF] hover:text-[#0052CC] font-medium"
                    >
                      Review calendar →
                    </button>
                  </div>
                ) : (
                  <div className="bg-[#FEF3C7] border border-[#FCD34D] rounded-lg p-6">
                    <p className="text-[14px] text-[#92400E]">
                      No regional calendar data available. You can manually add holidays after creating the office.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#E5E7EB] px-8 py-4 flex items-center justify-between">
          <div>
            {step > 1 && (
              <button
                onClick={handleBack}
                className="px-4 py-2 text-[#6B7280] hover:text-[#1F2937] rounded-lg text-[14px] font-medium transition-colors flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] text-[#1F2937] rounded-lg text-[14px] font-medium transition-colors"
            >
              Cancel
            </button>
            {step < 3 ? (
              <button
                onClick={handleNext}
                className="px-5 py-2.5 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-lg text-[14px] font-medium transition-colors flex items-center gap-2"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSave}
                className="px-5 py-2.5 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-lg text-[14px] font-medium transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Create Office
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}