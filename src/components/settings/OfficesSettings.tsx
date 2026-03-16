import React, { useState, useEffect } from 'react';
import { ChevronLeft, Plus, MapPin, Edit2, Trash2, Copy, Clock, Calendar, CalendarDays } from 'lucide-react';
import { OfficeBuilder } from './OfficeBuilder';
import { HolidayCalendarDetail } from './HolidayCalendarDetail';
import { getRegionalCalendar, RegionalCalendar } from './HolidayCalendarData';
import { apiClient } from '../../services/api-client';
import { ENDPOINTS } from '../../config/api';

interface OfficesSettingsProps {
  onBack: () => void;
}

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

export function OfficesSettings({ onBack }: OfficesSettingsProps) {
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingOffice, setEditingOffice] = useState<any>(null);
  const [showHolidayDetail, setShowHolidayDetail] = useState(false);
  const [selectedOfficeForHolidays, setSelectedOfficeForHolidays] = useState<any>(null);
  const [offices, setOffices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchOffices() {
      setLoading(true);
      setFetchError(null);
      try {
        const response = await apiClient.get<any>(ENDPOINTS.OFFICES);
        if (cancelled) return;

        // Safely unwrap: apiClient.get already returns data.result,
        // but guard against raw array or wrapped responses
        const data = response?.result || response;
        const officesArray = Array.isArray(data) ? data : [];

        // Map API fields to the shape this component expects
        const mapped = officesArray.map((office: any) => {
          // Safely parse workingHours - API might return object, string, or null
          let workingHours = { start: '09:00', end: '18:00' };
          if (office.workingHours && typeof office.workingHours === 'object') {
            workingHours = {
              start: office.workingHours.start || office.workingHours.from || '09:00',
              end: office.workingHours.end || office.workingHours.to || '18:00',
            };
          }

          // Safely parse workingDays - API might return array, string, or null
          let workingDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
          if (Array.isArray(office.workingDays)) {
            workingDays = office.workingDays;
          } else if (typeof office.workingDays === 'string') {
            workingDays = office.workingDays.split(',').map((d: string) => d.trim());
          }

          return {
            id: office.id || office._id,
            name: office.name || '',
            address: office.address || [office.street, office.city, office.postalCode, office.country].filter(Boolean).join(', ') || '',
            city: office.city || '',
            country: office.country || '',
            phone: office.phone || '',
            email: office.email || '',
            currency: (typeof office.currency === 'object' && office.currency) ? (office.currency.symbol || office.currency.name || '') : (office.currency || ''),
            timezone: (typeof office.timezone === 'object' && office.timezone) ? (office.timezone.name || office.timezone.id || '') : (office.timezone || ''),
            workingHours,
            workingDays,
            region: office.region || '',
            regionalCalendar: office.country && office.region
              ? getRegionalCalendar(office.country, office.region)
              : null,
            companyClosures: Array.isArray(office.companyClosures) ? office.companyClosures : [],
            holidayExceptions: Array.isArray(office.holidayExceptions) ? office.holidayExceptions : [],
          };
        });

        setOffices(mapped);
      } catch (err: any) {
        if (cancelled) return;
        console.error('Failed to fetch offices:', err);
        setFetchError(err?.message || 'Failed to load offices');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchOffices();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <div className="bg-white border-b border-[#E5E7EB] sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={onBack} className="p-2 hover:bg-[#F3F4F6] rounded-lg transition-colors">
                <ChevronLeft className="w-5 h-5 text-[#6B7280]" />
              </button>
              <div>
                <h1 className="text-[20px] font-medium text-[#1F2937]">Offices</h1>
                <p className="text-[13px] text-[#6B7280]">Multi-location management with localized schedules</p>
              </div>
            </div>
            <button
              onClick={() => {
                setEditingOffice(null);
                setShowBuilder(true);
              }}
              className="px-4 py-2 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-lg text-[14px] font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Office
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-8 py-8 pb-24">
        {loading ? (
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-12 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-[#0066FF] border-t-transparent rounded-full mx-auto mb-3"></div>
            <p className="text-[13px] text-[#6B7280]">Loading offices...</p>
          </div>
        ) : fetchError ? (
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-12 text-center">
            <p className="text-[14px] text-[#EF4444] mb-2">Failed to load offices</p>
            <p className="text-[13px] text-[#6B7280] mb-4">{fetchError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-lg text-[13px] font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        ) : offices.length > 0 ? (
          <div className="grid gap-4">
            {offices.map((office) => (
              <div key={office.id} className="bg-white rounded-lg border border-[#E5E7EB] p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#F0F4FF] flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-[#0066FF]" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-medium text-[#1F2937] mb-1">{office.name}</h3>
                      <p className="text-[12px] text-[#6B7280]">{office.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-[#F3F4F6] rounded-lg transition-colors" title="Copy as template">
                      <Copy className="w-4 h-4 text-[#6B7280]" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingOffice(office);
                        setShowBuilder(true);
                      }}
                      className="p-2 hover:bg-[#F3F4F6] rounded-lg transition-colors" title="Edit"
                    >
                      <Edit2 className="w-4 h-4 text-[#6B7280]" />
                    </button>
                    <button
                      onClick={() => {
                        console.warn('[OfficesSettings] No API endpoint for deleting an office. Removing locally only.');
                        setOffices(offices.filter(o => o.id !== office.id));
                      }}
                      className="p-2 hover:bg-[#FEE2E2] rounded-lg transition-colors" title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-[#F87171]" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 pt-4 border-t border-[#E5E7EB] mb-4">
                  <div>
                    <p className="text-[11px] font-medium text-[#9CA3AF] mb-1">Currency</p>
                    <p className="text-[13px] text-[#1F2937]">{office.currency}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-[#9CA3AF] mb-1">Timezone</p>
                    <p className="text-[13px] text-[#1F2937]">{office.timezone}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-[#9CA3AF] mb-1">Working hours</p>
                    <p className="text-[13px] text-[#1F2937]">{office.workingHours.start} - {office.workingHours.end}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-[#9CA3AF] mb-1">Working days</p>
                    <p className="text-[13px] text-[#1F2937]">{office.workingDays.join(', ')}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedOfficeForHolidays(office);
                    setShowHolidayDetail(true);
                  }}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-[#F0F4FF] to-[#FCE7F3] hover:from-[#E0E9FF] hover:to-[#FBCFE8] text-[#0066FF] rounded-lg text-[13px] font-medium transition-all flex items-center justify-center gap-2 border border-[#E5E7EB]"
                >
                  <CalendarDays className="w-4 h-4" />
                  Manage Holidays
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-12 text-center">
            <MapPin className="w-12 h-12 text-[#D1D5DB] mx-auto mb-3" />
            <h3 className="text-[15px] font-medium text-[#1F2937] mb-1">No offices yet</h3>
            <p className="text-[13px] text-[#6B7280] mb-4">Add your first office to get started</p>
            <button
              onClick={() => {
                setEditingOffice(null);
                setShowBuilder(true);
              }}
              className="px-4 py-2 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-lg text-[13px] font-medium transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Office
            </button>
          </div>
        )}
      </div>

      {showBuilder && (
        <OfficeBuilder
          onClose={() => {
            setShowBuilder(false);
            setEditingOffice(null);
          }}
          editingOffice={editingOffice}
          onSave={(newOffice) => {
            if (editingOffice) {
              console.warn('[OfficesSettings] No API endpoint for updating an office. Saving locally only.');
              setOffices(offices.map(o => o.id === editingOffice.id ? newOffice : o));
            } else {
              console.warn('[OfficesSettings] No API endpoint for creating an office. Saving locally only.');
              setOffices([...offices, newOffice]);
            }
            setShowBuilder(false);
            setEditingOffice(null);
          }}
        />
      )}

      {showHolidayDetail && selectedOfficeForHolidays && selectedOfficeForHolidays.regionalCalendar && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-8 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl my-8">
            <div className="max-h-[85vh] overflow-y-auto px-8 py-8">
              <HolidayCalendarDetail
                officeName={selectedOfficeForHolidays.name}
                regionalCalendar={selectedOfficeForHolidays.regionalCalendar}
                companyClosures={selectedOfficeForHolidays.companyClosures || []}
                holidayExceptions={selectedOfficeForHolidays.holidayExceptions || []}
                onAddClosure={(closure) => {
                  const newClosure = {
                    ...closure,
                    id: `closure-${Date.now()}`
                  };
                  setOffices(offices.map(o => 
                    o.id === selectedOfficeForHolidays.id 
                      ? { ...o, companyClosures: [...(o.companyClosures || []), newClosure] }
                      : o
                  ));
                  setSelectedOfficeForHolidays({
                    ...selectedOfficeForHolidays,
                    companyClosures: [...(selectedOfficeForHolidays.companyClosures || []), newClosure]
                  });
                }}
                onSaveExceptions={(exceptions) => {
                  setOffices(offices.map(o => 
                    o.id === selectedOfficeForHolidays.id 
                      ? { ...o, holidayExceptions: exceptions }
                      : o
                  ));
                  setSelectedOfficeForHolidays({
                    ...selectedOfficeForHolidays,
                    holidayExceptions: exceptions
                  });
                }}
                onCopyToOffice={() => {
                  // Handle copying calendar to another office
                  console.log('Copy calendar to another office');
                }}
              />
            </div>
            <div className="sticky bottom-0 bg-white border-t border-[#E5E7EB] px-8 py-4 flex justify-end gap-3 rounded-b-xl">
              <button
                onClick={() => {
                  setShowHolidayDetail(false);
                  setSelectedOfficeForHolidays(null);
                }}
                className="px-6 py-2.5 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-lg text-[14px] font-medium transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}