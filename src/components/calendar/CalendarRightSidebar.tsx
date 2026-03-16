import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, AlertTriangle, Loader2 } from 'lucide-react';
import { CalendarEvent } from './WorkdeckCalendar';
import { dashboardApi, TimesheetRecord } from '../../services/dashboard-api';
import { apiClient } from '../../services/api-client';
import { ENDPOINTS } from '../../config/api';

interface CalendarRightSidebarProps {
  currentDate: Date;
  viewType: 'day' | 'week' | 'month';
  events: CalendarEvent[];
  onClose?: () => void;
}

type TimesheetStatus = 'not-submitted' | 'pending' | 'approved' | 'denied';

// Map backend status numbers to display status
function toDisplayStatus(record: TimesheetRecord | null): TimesheetStatus {
  if (!record) return 'not-submitted';
  if (record.status === 1) return 'pending';
  if (record.status === 2) return 'approved';
  if (record.status === 3) return 'denied';
  return 'not-submitted';
}

// Helper to get start of week (Sunday)
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Helper to get end of week (Saturday)
function getWeekEnd(date: Date): Date {
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return weekEnd;
}

// Helper to calculate hours between two dates
function calculateHours(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
}

// Helper to count working days in a month (excluding weekends)
function getWorkingDaysInMonth(year: number, month: number): number {
  let workingDays = 0;
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday or Saturday
      workingDays++;
    }
    date.setDate(date.getDate() + 1);
  }
  return workingDays;
}

export function CalendarRightSidebar({ currentDate, viewType, events, onClose }: CalendarRightSidebarProps) {
  const [activeTab, setActiveTab] = useState<'timesheet' | 'comments' | 'activity'>('timesheet');
  const [timesheetPeriod, setTimesheetPeriod] = useState(() => {
    // Initialize to current month
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [timesheetRecord, setTimesheetRecord] = useState<TimesheetRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const timesheetStatus = toDisplayStatus(timesheetRecord);

  // Keep the period in sync when the user navigates the calendar
  useEffect(() => {
    setTimesheetPeriod(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
  }, [currentDate.getFullYear(), currentDate.getMonth()]);

  // Load the real timesheet record for the current period
  useEffect(() => {
    setTimesheetRecord(null);
    setSubmitError(null);
    dashboardApi.getMyTimesheetRecords().then(records => {
      // Match record whose startAt falls in the same year/month as timesheetPeriod
      const match = records.find(r => {
        // startAt is DD/MM/YYYY
        const parts = r.startAt?.split('/');
        if (!parts || parts.length < 3) return false;
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        return month === timesheetPeriod.getMonth() && year === timesheetPeriod.getFullYear();
      });
      setTimesheetRecord(match ?? null);
    });
  }, [timesheetPeriod.getMonth(), timesheetPeriod.getFullYear()]);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];

  // Calculate week boundaries based on currentDate
  const weekStart = useMemo(() => getWeekStart(currentDate), [currentDate]);
  const weekEnd = useMemo(() => getWeekEnd(currentDate), [currentDate]);

  // Helper to group events into project buckets
  const groupByProject = (evs: typeof events) => {
    const projectMap = new Map<string, { name: string; color: string; hours: number }>();
    evs.forEach(event => {
      const projectName = event.project || 'Personal';
      const projectColor = event.projectColor || '#6B7280';
      const hours = calculateHours(new Date(event.startTime), new Date(event.endTime));
      const ex = projectMap.get(projectName);
      if (ex) { ex.hours += hours; }
      else { projectMap.set(projectName, { name: projectName, color: projectColor, hours }); }
    });
    return Array.from(projectMap.values()).sort((a, b) => b.hours - a.hours);
  };

  // ── Top summary: ALL events in the period (personal + work) ──────────────
  const weekAllEvents = useMemo(() =>
    events.filter(e => { const s = new Date(e.startTime); return s >= weekStart && s <= weekEnd; }),
    [events, weekStart, weekEnd]);
  const weekAllProjects = useMemo(() => groupByProject(weekAllEvents), [weekAllEvents]);
  const weekAllTotal = useMemo(() => weekAllEvents.reduce((s, e) => s + calculateHours(new Date(e.startTime), new Date(e.endTime)), 0), [weekAllEvents]);

  const monthAllEvents = useMemo(() => {
    const monthStart = new Date(timesheetPeriod.getFullYear(), timesheetPeriod.getMonth(), 1);
    const monthEnd = new Date(timesheetPeriod.getFullYear(), timesheetPeriod.getMonth() + 1, 0, 23, 59, 59, 999);
    return events.filter(e => { const s = new Date(e.startTime); return s >= monthStart && s <= monthEnd; });
  }, [events, timesheetPeriod]);
  const monthAllProjects = useMemo(() => groupByProject(monthAllEvents), [monthAllEvents]);
  const monthAllTotal = useMemo(() => monthAllEvents.reduce((s, e) => s + calculateHours(new Date(e.startTime), new Date(e.endTime)), 0), [monthAllEvents]);

  // ── Bottom section: timesheet-only events ────────────────────────────────
  const weekEvents = useMemo(() =>
    events.filter(e => { if (!e.isTimesheet) return false; const s = new Date(e.startTime); return s >= weekStart && s <= weekEnd; }),
    [events, weekStart, weekEnd]);
  const weekProjects = useMemo(() => groupByProject(weekEvents), [weekEvents]);
  const weekTotal = useMemo(() => weekEvents.reduce((s, e) => s + calculateHours(new Date(e.startTime), new Date(e.endTime)), 0), [weekEvents]);

  const monthEvents = useMemo(() => {
    const monthStart = new Date(timesheetPeriod.getFullYear(), timesheetPeriod.getMonth(), 1);
    const monthEnd = new Date(timesheetPeriod.getFullYear(), timesheetPeriod.getMonth() + 1, 0, 23, 59, 59, 999);
    return events.filter(e => { if (!e.isTimesheet) return false; const s = new Date(e.startTime); return s >= monthStart && s <= monthEnd; });
  }, [events, timesheetPeriod]);
  const monthProjects = useMemo(() => groupByProject(monthEvents), [monthEvents]);

  const monthlyLogged = useMemo(() =>
    monthEvents.reduce((total, event) => total + calculateHours(new Date(event.startTime), new Date(event.endTime)), 0),
    [monthEvents]);

  const workingDays = useMemo(() =>
    getWorkingDaysInMonth(timesheetPeriod.getFullYear(), timesheetPeriod.getMonth()),
    [timesheetPeriod]
  );
  const monthlyExpected = workingDays * 8;
  const monthlyDifference = monthlyLogged - monthlyExpected;

  // Format date range for week display
  const weekRangeText = useMemo(() => {
    const startMonth = monthNames[weekStart.getMonth()];
    const endMonth = monthNames[weekEnd.getMonth()];
    if (startMonth === endMonth) {
      return `${startMonth} ${weekStart.getDate()} - ${weekEnd.getDate()}`;
    }
    return `${startMonth} ${weekStart.getDate()} - ${endMonth} ${weekEnd.getDate()}`;
  }, [weekStart, weekEnd]);

  const handlePreviousPeriod = () => {
    const newDate = new Date(timesheetPeriod);
    newDate.setMonth(newDate.getMonth() - 1);
    setTimesheetPeriod(newDate);
  };

  const handleNextPeriod = () => {
    const newDate = new Date(timesheetPeriod);
    newDate.setMonth(newDate.getMonth() + 1);
    setTimesheetPeriod(newDate);
  };

  const getStatusIcon = (status: TimesheetStatus) => {
    switch (status) {
      case 'not-submitted': return '⚪';
      case 'pending': return '🟡';
      case 'approved': return '🟢';
      case 'denied': return '🔴';
    }
  };

  const getStatusText = (status: TimesheetStatus) => {
    switch (status) {
      case 'not-submitted': return 'Not submitted';
      case 'pending': return 'Pending approval';
      case 'approved': return 'Approved';
      case 'denied': return 'Denied — needs revision';
    }
  };

  const getStatusColor = (status: TimesheetStatus) => {
    switch (status) {
      case 'not-submitted': return '#6B7280';
      case 'pending': return '#F59E0B';
      case 'approved': return '#10B981';
      case 'denied': return '#EF4444';
    }
  };

  return (
    <div style={{
      width: '360px',
      flexShrink: 0,
      background: 'white',
      borderLeft: '1px solid #E5E7EB',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid #E5E7EB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0A0A0A', margin: 0 }}>
          Calendar Details
        </h3>
        <button
          style={{
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: '#6B7280',
            fontSize: '20px',
            borderRadius: '4px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      {/* Timesheet Period Selector */}
      <div style={{ padding: '20px', borderBottom: '1px solid #E5E7EB', flexShrink: 0 }}>
        <div style={{
          padding: '16px',
          background: '#F9FAFB',
          borderRadius: '8px',
          border: '1px solid #E5E7EB'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px' }}>📅</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#0A0A0A' }}>
                {monthNames[timesheetPeriod.getMonth()]} {timesheetPeriod.getFullYear()}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                onClick={handlePreviousPeriod}
                style={{
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: '#6B7280',
                  borderRadius: '4px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#E5E7EB'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={handleNextPeriod}
                style={{
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: '#6B7280',
                  borderRadius: '4px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#E5E7EB'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>
            Timesheet Period: {monthNames[timesheetPeriod.getMonth()]} 1 - {monthNames[timesheetPeriod.getMonth()]} {new Date(timesheetPeriod.getFullYear(), timesheetPeriod.getMonth() + 1, 0).getDate()}
          </div>
          <div style={{
            fontSize: '13px',
            color: getStatusColor(timesheetStatus),
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            Status: {getStatusIcon(timesheetStatus)} {getStatusText(timesheetStatus)}
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Period Summary — ALL calendar entries for the period */}
        <div style={{ padding: '20px', borderBottom: '1px solid #E5E7EB' }}>
          {(() => {
            const projects = viewType === 'month' ? monthAllProjects : weekAllProjects;
            const total = viewType === 'month' ? monthAllTotal : weekAllTotal;
            const label = viewType === 'month'
              ? `${monthNames[timesheetPeriod.getMonth()]} ${timesheetPeriod.getFullYear()}`
              : weekRangeText;
            const emptyMsg = viewType === 'month'
              ? `No entries for ${monthNames[timesheetPeriod.getMonth()]}`
              : 'No entries this week';
            const totalLabel = viewType === 'month' ? 'Month Total' : 'Week Total';
            const fmtH = (h: number) => `${Math.floor(h)}h ${Math.round((h % 1) * 60).toString().padStart(2, '0')}m`;

            return (
              <>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#0A0A0A', marginBottom: '12px' }}>
                  Calendar Summary ({label})
                </div>
                {projects.length > 0 ? (
                  <>
                    <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '12px' }}>
                      {projects.map(project => (
                        <div key={project.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '3px', height: '12px', background: project.color, borderRadius: '2px' }} />
                            <span style={{ color: '#374151' }}>{project.name}</span>
                          </div>
                          <span style={{ fontWeight: 500, color: '#0A0A0A' }}>{fmtH(project.hours)}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ borderTop: '1px solid #E5E7EB', marginTop: '12px', paddingTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600 }}>
                      <span style={{ color: '#0A0A0A' }}>{totalLabel}</span>
                      <span style={{ color: '#0A0A0A' }}>{fmtH(total)}</span>
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: '13px', color: '#6B7280', textAlign: 'center', padding: '16px 0' }}>{emptyMsg}</div>
                )}
              </>
            );
          })()}
        </div>

        {/* Monthly Timesheet Summary */}
        <div style={{ padding: '20px', borderBottom: '1px solid #E5E7EB' }}>
          <div style={{
            padding: '16px',
            background: monthlyDifference < 0 ? '#FEF2F2' : '#F0FDF4',
            border: `1px solid ${monthlyDifference < 0 ? '#FECACA' : '#BBF7D0'}`,
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#0A0A0A', marginBottom: '16px', letterSpacing: '0.02em' }}>
              {monthNames[timesheetPeriod.getMonth()].toUpperCase()} TIMESHEET
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>
                Logged
              </div>
              <div style={{ fontSize: '20px', fontWeight: 600, color: '#0A0A0A' }}>
                {Math.floor(monthlyLogged)}h {((monthlyLogged % 1) * 60).toFixed(0).padStart(2, '0')}m
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>
                Expected ({workingDays} days × 8h)
              </div>
              <div style={{ fontSize: '16px', fontWeight: 500, color: '#6B7280' }}>
                {monthlyExpected}h 00m
              </div>
            </div>

            <div style={{
              paddingTop: '12px',
              borderTop: '1px solid' + (monthlyDifference < 0 ? '#FCA5A5' : '#86EFAC')
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>
                  Difference
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: monthlyDifference < 0 ? '#DC2626' : '#059669'
                }}>
                  {monthlyDifference < 0 ? '-' : '+'}{Math.abs(Math.floor(monthlyDifference))}h {((Math.abs(monthlyDifference) % 1) * 60).toFixed(0).padStart(2, '0')}m
                  {monthlyDifference < 0 && <AlertTriangle size={16} color="#DC2626" />}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div style={{ padding: '20px' }}>
          {(timesheetStatus === 'not-submitted' || timesheetStatus === 'denied') && (
            <button
              style={{
                width: '100%',
                height: '44px',
                background: isSubmitting ? '#93C5FD' : '#0066FF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                color: 'white',
                cursor: isSubmitting ? 'default' : 'pointer',
                transition: 'all 150ms',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
              disabled={isSubmitting}
              onClick={async () => {
                setIsSubmitting(true);
                setSubmitError(null);
                try {
                  if (timesheetStatus === 'denied' && timesheetRecord) {
                    // Resubmit from denied
                    await apiClient.post(ENDPOINTS.UPDATE_TIMESHEET, { id: timesheetRecord.id, status: 1 });
                  } else {
                    // New submission
                    await apiClient.post(ENDPOINTS.CREATE_TIMESHEET, { id: crypto.randomUUID() });
                  }
                  // Refresh the record
                  const records = await dashboardApi.getMyTimesheetRecords();
                  const match = records.find(r => {
                    const parts = r.startAt?.split('/');
                    if (!parts || parts.length < 3) return false;
                    return parseInt(parts[1], 10) - 1 === timesheetPeriod.getMonth()
                      && parseInt(parts[2], 10) === timesheetPeriod.getFullYear();
                  });
                  setTimesheetRecord(match ?? null);
                } catch (err: any) {
                  setSubmitError(err?.message || 'Submission failed');
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >
              {isSubmitting && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
              {timesheetStatus === 'denied' ? 'Resubmit' : 'Submit'} {monthNames[timesheetPeriod.getMonth()]} Timesheet
            </button>
          )}

          {submitError && (
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#DC2626' }}>{submitError}</div>
          )}

          {timesheetStatus === 'pending' && (
            <div style={{ padding: '12px', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '8px', fontSize: '13px', color: '#92400E' }}>
              ⏳ Submitted — awaiting manager approval
            </div>
          )}

          {timesheetStatus === 'approved' && (
            <div style={{ padding: '12px', background: '#D1FAE5', border: '1px solid #A7F3D0', borderRadius: '8px', fontSize: '13px', color: '#065F46' }}>
              ✓ Approved
            </div>
          )}

          {timesheetStatus === 'denied' && timesheetRecord?.denyComment && (
            <div style={{ marginTop: '10px', padding: '10px 12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', fontSize: '12px', color: '#991B1B' }}>
              ❌ Denied: "{timesheetRecord.denyComment}"
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ borderTop: '1px solid #E5E7EB', padding: '0 20px' }}>
          <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid #E5E7EB' }}>
            {(['timesheet', 'comments', 'activity'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '12px 16px',
                  border: 'none',
                  background: 'transparent',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: activeTab === tab ? '#0066FF' : '#6B7280',
                  cursor: 'pointer',
                  borderBottom: activeTab === tab ? '2px solid #0066FF' : 'none',
                  marginBottom: '-1px',
                  textTransform: 'capitalize'
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div style={{ padding: '20px' }}>
          {activeTab === 'timesheet' && (
            <div>
              {monthProjects.length > 0 ? (
                <>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '12px' }}>
                    {monthNames[timesheetPeriod.getMonth()]} breakdown by project
                  </div>
                  {monthProjects.map(project => (
                    <div
                      key={project.name}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 0',
                        borderBottom: '1px solid #F3F4F6',
                        fontSize: '13px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          background: project.color,
                          borderRadius: '2px'
                        }} />
                        <span style={{ color: '#374151' }}>{project.name}</span>
                      </div>
                      <span style={{ fontWeight: 500, color: '#0A0A0A' }}>
                        {Math.floor(project.hours)}h {Math.round((project.hours % 1) * 60).toString().padStart(2, '0')}m
                      </span>
                    </div>
                  ))}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 0 0 0',
                    fontSize: '13px',
                    fontWeight: 600
                  }}>
                    <span style={{ color: '#0A0A0A' }}>Total</span>
                    <span style={{ color: '#0A0A0A' }}>
                      {Math.floor(monthlyLogged)}h {Math.round((monthlyLogged % 1) * 60).toString().padStart(2, '0')}m
                    </span>
                  </div>
                </>
              ) : (
                <div style={{ fontSize: '13px', color: '#6B7280', textAlign: 'center', padding: '32px 0' }}>
                  No timesheet entries for {monthNames[timesheetPeriod.getMonth()]}
                </div>
              )}
            </div>
          )}
          {activeTab === 'comments' && (
            <div style={{ fontSize: '13px', color: '#6B7280', textAlign: 'center', padding: '32px 0' }}>
              No comments yet
            </div>
          )}
          {activeTab === 'activity' && (
            <div>
              {monthEvents.length > 0 ? (
                <>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '12px' }}>
                    Recent timesheet entries
                  </div>
                  {monthEvents.slice(0, 10).map(event => (
                    <div
                      key={event.id}
                      style={{
                        padding: '10px 0',
                        borderBottom: '1px solid #F3F4F6',
                        fontSize: '13px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <div style={{
                          width: '6px',
                          height: '6px',
                          background: event.projectColor || '#6B7280',
                          borderRadius: '50%'
                        }} />
                        <span style={{ fontWeight: 500, color: '#0A0A0A' }}>{event.title}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#6B7280', marginLeft: '14px' }}>
                        {new Date(event.startTime).toLocaleDateString()} • {calculateHours(new Date(event.startTime), new Date(event.endTime)).toFixed(1)}h
                        {event.project && ` • ${event.project}`}
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div style={{ fontSize: '13px', color: '#6B7280', textAlign: 'center', padding: '32px 0' }}>
                  No activity to show
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}