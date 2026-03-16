import React, { useState, useMemo } from 'react';
import { X, Calendar as CalendarIcon, AlertTriangle, Clock, Users, Target, MessageSquare, CheckCircle2 } from 'lucide-react';
import { useLeave, leaveTypeConfig, LeaveType, LeaveDuration } from '../../contexts/LeaveContext';
import { useMyTasks, useEvents } from '../../hooks/useApiQueries';
import { toast } from 'sonner';

interface LeaveRequestModalProps {
  onClose: () => void;
}

export function LeaveRequestModal({ onClose }: LeaveRequestModalProps) {
  const { currentUser, addLeaveRequest, leaveRequests, users } = useLeave();
  
  // Form state
  const [leaveType, setLeaveType] = useState<LeaveType>('Holidays');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [duration, setDuration] = useState<LeaveDuration>('Full Day');
  const [notes, setNotes] = useState('');
  const [addToCalendar, setAddToCalendar] = useState(true);
  const [billable, setBillable] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [managerNote, setManagerNote] = useState('');

  // Calculate working days
  const calculateWorkingDays = (start: string, end: string, durationType: LeaveDuration) => {
    if (!start || !end) return { calendarDays: 0, workingDays: 0 };
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const calendarDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    let workingDays = 0;
    const current = new Date(start);
    
    while (current <= endDate) {
      const day = current.getDay();
      if (day !== 0 && day !== 6) {
        workingDays++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    if (durationType !== 'Full Day') {
      workingDays = workingDays * 0.5;
    }
    
    return { calendarDays, workingDays };
  };

  const { calendarDays, workingDays } = calculateWorkingDays(startDate, endDate, duration);

  // Fetch real tasks and events via TanStack Query
  const { data: myTasks = [] } = useMyTasks(currentUser?.id || '', !!currentUser?.id);
  const { data: myEvents = [] } = useEvents(
    startDate ? new Date(startDate) : new Date(),
    endDate ? new Date(endDate) : undefined,
    !!startDate && !!endDate,
  );

  // Compute impact data from real tasks and events
  const impactData = useMemo(() => {
    if (!startDate || !endDate) return null;

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Tasks due during leave period
    const tasksInPeriod = myTasks
      .filter(t => {
        const due = t.endDate ? new Date(t.endDate) : null;
        return due && due >= start && due <= end;
      })
      .slice(0, 5)
      .map(t => ({
        id: t.id,
        title: t.name || t.summary || 'Untitled task',
        project: t.activity?.project?.name || '',
        dueDate: t.endDate || '',
        status: t.column?.name || 'Open',
        priority: (t.importance ?? 50) >= 75 ? 'high' : (t.importance ?? 50) >= 50 ? 'medium' : 'low',
      }));

    // Events during leave period
    const eventsInPeriod = myEvents
      .filter(e => {
        const eventDate = new Date(e.startAt);
        return eventDate >= start && eventDate <= end;
      })
      .slice(0, 5)
      .map(e => ({
        id: e.id,
        title: e.title,
        date: e.startAt?.split('T')[0] || '',
        attendees: e.guests?.length || 1,
      }));

    // Team coverage: count team members on leave during the period
    const teamOnLeave = leaveRequests.filter(r =>
      r.userId !== currentUser.id &&
      (r.status === 'Approved' || r.status === 'Pending') &&
      new Date(r.startDate) <= end &&
      new Date(r.endDate) >= start
    );

    return {
      tasks: tasksInPeriod,
      allTasks: tasksInPeriod,
      events: eventsInPeriod,
      teamCoverage: teamOnLeave,
      milestones: [] as any[],
      hasIssues: tasksInPeriod.length > 0 || eventsInPeriod.length > 0,
    };
  }, [startDate, endDate, myTasks, myEvents, leaveRequests, currentUser.id]);

  // Calculate balance impact
  const balanceImpact = useMemo(() => {
    if (!startDate || !endDate) {
      return {
        requestedDays: 0,
        currentBalance: currentUser.holidayBalance,
        remainingBalance: currentUser.holidayBalance,
        willExceed: false,
      };
    }

    const currentYear = new Date().getFullYear();
    const myRequests = leaveRequests.filter(req => req.userId === currentUser.id);
    const approvedRequests = myRequests.filter(req => 
      req.status === 'Approved' &&
      req.leaveType === 'Holidays' &&
      new Date(req.startDate).getFullYear() === currentYear
    );
    const daysUsed = approvedRequests.reduce((sum, req) => sum + req.workingDays, 0);

    const currentBalance = currentUser.holidayBalance - daysUsed;
    const remainingBalance = currentBalance - workingDays;
    const willExceed = remainingBalance < 0;

    return {
      requestedDays: workingDays,
      currentBalance,
      remainingBalance,
      willExceed,
    };
  }, [startDate, endDate, leaveType, workingDays, leaveRequests, currentUser]);

  const hasInsufficientBalance = balanceImpact.willExceed && leaveType === 'Holidays';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startDate || !endDate) {
      toast.error('Please select start and end dates');
      return;
    }
    
    if (hasInsufficientBalance) {
      toast.error('Insufficient holiday balance');
      return;
    }

    // If there are unresolved issues, show confirmation
    if (impactData?.hasIssues) {
      setShowConfirmation(true);
      return;
    }

    submitRequest();
  };

  const submitRequest = () => {
    addLeaveRequest({
      leaveType,
      startDate,
      endDate,
      duration,
      calendarDays,
      workingDays,
      status: 'Pending',
      notes: notes || undefined,
      addToCalendar,
      billable,
    });
    
    toast.success('Leave request submitted successfully');
    onClose();
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (start === end) {
      return startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    
    return `${startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 border-b" style={{ height: '64px', borderColor: '#E5E7EB' }}>
            <div className="flex items-center gap-3">
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#111827' }}>
                New Leave Request
              </h2>
              {startDate && endDate && (
                <span style={{ fontSize: '14px', color: '#6B7280' }}>
                  {formatDateRange(startDate, endDate)}
                </span>
              )}
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-md transition-colors">
              <X className="w-5 h-5" style={{ color: '#6B7280' }} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Panel - Form */}
            <div className="border-r overflow-y-auto" style={{ width: '400px', borderColor: '#E5E7EB' }}>
              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Leave Type */}
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '6px' }}>
                      Leave Type *
                    </label>
                    <select
                      value={leaveType}
                      onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                      className="w-full px-3 rounded-md border"
                      style={{
                        height: '36px',
                        fontSize: '14px',
                        borderColor: '#E5E7EB',
                      }}
                    >
                      {Object.entries(leaveTypeConfig).map(([type, config]) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Dates */}
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '6px' }}>
                      Dates *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="px-3 rounded-md border"
                        style={{
                          height: '36px',
                          fontSize: '14px',
                          borderColor: '#E5E7EB',
                        }}
                      />
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="px-3 rounded-md border"
                        style={{
                          height: '36px',
                          fontSize: '14px',
                          borderColor: '#E5E7EB',
                        }}
                      />
                    </div>
                  </div>

                  {/* Duration */}
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '6px' }}>
                      Duration
                    </label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(e.target.value as LeaveDuration)}
                      className="w-full px-3 rounded-md border"
                      style={{
                        height: '36px',
                        fontSize: '14px',
                        borderColor: '#E5E7EB',
                      }}
                    >
                      <option value="Full Day">Full Day</option>
                      <option value="Half Day (AM)">Half Day (AM)</option>
                      <option value="Half Day (PM)">Half Day (PM)</option>
                    </select>
                  </div>

                  {/* Summary */}
                  {calendarDays > 0 && (
                    <div className="px-3 py-2 rounded" style={{ backgroundColor: '#F3F4F6' }}>
                      <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '4px' }}>
                        📊 {calendarDays} calendar {calendarDays === 1 ? 'day' : 'days'}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                        → {workingDays} working {workingDays === 1 ? 'day' : 'days'}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '6px' }}>
                      Notes
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 rounded-md border resize-none"
                      style={{
                        fontSize: '14px',
                        borderColor: '#E5E7EB',
                      }}
                      placeholder="Family Christmas gathering..."
                    />
                  </div>

                  {/* Checkboxes */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={addToCalendar}
                        onChange={(e) => setAddToCalendar(e.target.checked)}
                        className="rounded"
                        style={{ width: '16px', height: '16px' }}
                      />
                      <span style={{ fontSize: '13px', color: '#374151' }}>
                        Add to calendar
                      </span>
                    </label>
                    
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={billable}
                        onChange={(e) => setBillable(e.target.checked)}
                        className="rounded"
                        style={{ width: '16px', height: '16px' }}
                      />
                      <span style={{ fontSize: '13px', color: '#374151' }}>
                        Mark as billable
                      </span>
                    </label>
                  </div>

                  {/* Balance Impact (Holidays only) */}
                  {leaveType === 'Holidays' && startDate && endDate && (
                    <>
                      <div style={{ height: '1px', backgroundColor: '#E5E7EB', margin: '16px 0' }} />
                      
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '12px' }}>
                          🌴 Holiday Balance
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span style={{ fontSize: '13px', color: '#6B7280' }}>Current:</span>
                            <span style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>
                              {balanceImpact.currentBalance} days
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span style={{ fontSize: '13px', color: '#6B7280' }}>This request:</span>
                            <span style={{ fontSize: '13px', fontWeight: 500, color: '#EF4444' }}>
                              -{balanceImpact.requestedDays} days
                            </span>
                          </div>
                          
                          <div style={{ height: '1px', backgroundColor: '#E5E7EB', margin: '8px 0' }} />
                          
                          <div className="flex items-center justify-between">
                            <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>Remaining:</span>
                            <div className="flex items-center gap-2">
                              <span style={{ 
                                fontSize: '14px', 
                                fontWeight: 600, 
                                color: balanceImpact.willExceed ? '#EF4444' : '#10B981' 
                              }}>
                                {balanceImpact.remainingBalance} days
                              </span>
                              {!balanceImpact.willExceed && (
                                <CheckCircle2 className="w-4 h-4" style={{ color: '#10B981' }} />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Insufficient balance warning */}
                  {hasInsufficientBalance && (
                    <div className="flex items-start gap-2 px-3 py-2 rounded" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FEE2E2' }}>
                      <AlertTriangle className="w-4 h-4 mt-0.5" style={{ color: '#EF4444' }} />
                      <div style={{ fontSize: '13px', color: '#B91C1C' }}>
                        Insufficient balance. You only have {balanceImpact.currentBalance} days remaining.
                      </div>
                    </div>
                  )}

                  <div style={{ height: '1px', backgroundColor: '#E5E7EB', margin: '16px 0' }} />

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-4 rounded-md border transition-colors hover:bg-gray-50"
                      style={{
                        height: '40px',
                        fontSize: '14px',
                        fontWeight: 600,
                        borderColor: '#D1D5DB',
                        color: '#374151',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={hasInsufficientBalance}
                      className="flex-1 px-4 rounded-md transition-colors"
                      style={{
                        height: '40px',
                        fontSize: '14px',
                        fontWeight: 600,
                        backgroundColor: hasInsufficientBalance ? '#D1D5DB' : '#0066FF',
                        color: 'white',
                        cursor: hasInsufficientBalance ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Submit Request
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Right Panel - Impact Preview */}
            <div className="flex-1 overflow-y-auto" style={{ backgroundColor: '#F9FAFB' }}>
              {!startDate || !endDate ? (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                  <CalendarIcon className="w-16 h-16 mb-4" style={{ color: '#D1D5DB' }} />
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
                    Select dates to see impact
                  </h3>
                  <p style={{ fontSize: '14px', color: '#6B7280', maxWidth: '400px' }}>
                    We'll show your tasks, meetings, and team coverage for the selected period
                  </p>
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  {/* Summary */}
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '12px' }}>
                      Impact Analysis
                    </h3>
                    
                    {impactData && impactData.hasIssues && (
                      <div className="flex items-center gap-2 px-4 py-3 rounded-md" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FEE2E2' }}>
                        <AlertTriangle className="w-5 h-5" style={{ color: '#EF4444' }} />
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#B91C1C' }}>
                            Attention Needed
                          </div>
                          <div style={{ fontSize: '13px', color: '#B91C1C' }}>
                            {impactData.tasks.length > 0 && `${impactData.tasks.length} tasks due during this period`}
                            {impactData.tasks.length > 0 && impactData.events.length > 0 && ' • '}
                            {impactData.events.length > 0 && `${impactData.events.length} meeting scheduled`}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tasks */}
                  {impactData && impactData.tasks.length > 0 && (
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '12px' }}>
                        📋 YOUR TASKS ({formatDateRange(startDate, endDate)})
                      </div>
                      
                      <div className="bg-white rounded-md border overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
                        {impactData.tasks.map((task, index) => (
                          <div
                            key={task.id}
                            className="p-4"
                            style={{
                              borderBottom: index < impactData.tasks.length - 1 ? '1px solid #F3F4F6' : 'none',
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <AlertTriangle className="w-5 h-5 mt-0.5" style={{ color: '#F59E0B' }} />
                              <div className="flex-1">
                                <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
                                  {task.title}
                                </div>
                                <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>
                                  {task.project} • Due {new Date(task.dueDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    className="px-3 py-1 rounded text-xs border transition-colors hover:bg-gray-50"
                                    style={{ fontSize: '12px', fontWeight: 500, color: '#374151', borderColor: '#D1D5DB' }}
                                  >
                                    Reassign
                                  </button>
                                  <button
                                    className="px-3 py-1 rounded text-xs border transition-colors hover:bg-gray-50"
                                    style={{ fontSize: '12px', fontWeight: 500, color: '#374151', borderColor: '#D1D5DB' }}
                                  >
                                    Change Due Date
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Other tasks (after return) */}
                      {impactData.allTasks.length > impactData.tasks.length && (
                        <div className="mt-3 px-4 py-3 rounded-md" style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" style={{ color: '#16A34A' }} />
                            <span style={{ fontSize: '13px', color: '#166534' }}>
                              {impactData.allTasks.length - impactData.tasks.length} other tasks due after your return
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Calendar Events */}
                  {impactData && impactData.events.length > 0 && (
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '12px' }}>
                        📅 YOUR CALENDAR ({formatDateRange(startDate, endDate)})
                      </div>
                      
                      <div className="bg-white rounded-md border overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
                        {impactData.events.map((event) => (
                          <div key={event.id} className="p-4">
                            <div className="flex items-start gap-3">
                              <AlertTriangle className="w-5 h-5 mt-0.5" style={{ color: '#F59E0B' }} />
                              <div className="flex-1">
                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
                                  {new Date(event.date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}, {event.time}
                                </div>
                                <div style={{ fontSize: '14px', color: '#111827', marginBottom: '4px' }}>
                                  {event.title}
                                </div>
                                <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>
                                  {event.attendees} attendees
                                </div>
                                <button
                                  className="px-3 py-1 rounded text-xs border transition-colors hover:bg-gray-50"
                                  style={{ fontSize: '12px', fontWeight: 500, color: '#374151', borderColor: '#D1D5DB' }}
                                >
                                  Decline with note
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Team Coverage */}
                  {impactData && (
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '12px' }}>
                        👥 TEAM COVERAGE
                      </div>
                      
                      <div className="bg-white rounded-md border p-4" style={{ borderColor: '#E5E7EB' }}>
                        <div className="space-y-2">
                          {impactData.teamCoverage.map((day) => {
                            const date = new Date(day.date);
                            const hasWarning = day.available < 3 && !day.holiday;
                            
                            return (
                              <div key={day.date} className="flex items-center justify-between py-2">
                                <span style={{ fontSize: '13px', color: '#6B7280' }}>
                                  {date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric', weekday: 'short' })}:
                                </span>
                                <div className="flex items-center gap-2">
                                  {day.holiday ? (
                                    <span style={{ fontSize: '13px', color: '#6B7280' }}>— Public holiday</span>
                                  ) : (
                                    <>
                                      {hasWarning && <AlertTriangle className="w-4 h-4" style={{ color: '#F59E0B' }} />}
                                      <span style={{ 
                                        fontSize: '13px', 
                                        fontWeight: 500,
                                        color: hasWarning ? '#F59E0B' : '#10B981' 
                                      }}>
                                        {day.available}/{day.total} team members available
                                      </span>
                                      {day.warning && (
                                        <span style={{ fontSize: '12px', color: '#6B7280' }}>
                                          ({day.warning})
                                        </span>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Project Milestones */}
                  {impactData && impactData.milestones.length > 0 && (
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '12px' }}>
                        🎯 PROJECT MILESTONES
                      </div>
                      
                      <div className="bg-white rounded-md border p-4" style={{ borderColor: '#E5E7EB' }}>
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5" style={{ color: '#10B981' }} />
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827', marginBottom: '4px' }}>
                              No milestones during this period
                            </div>
                            <div style={{ fontSize: '13px', color: '#6B7280' }}>
                              Nearest: {impactData.milestones[0].project} {impactData.milestones[0].name} ({new Date(impactData.milestones[0].date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })})
                              <br />
                              You'll be back {impactData.milestones[0].daysAfterReturn} days before
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-6">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#E5E7EB' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>
                Submit with open items?
              </h3>
              <button onClick={() => setShowConfirmation(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" style={{ color: '#6B7280' }} />
              </button>
            </div>
            
            <div className="p-6">
              <p style={{ fontSize: '14px', color: '#374151', marginBottom: '12px' }}>
                You still have:
              </p>
              <ul className="list-disc list-inside mb-4" style={{ fontSize: '14px', color: '#374151' }}>
                {impactData && impactData.tasks.length > 0 && (
                  <li>{impactData.tasks.length} tasks due during your leave</li>
                )}
                {impactData && impactData.events.length > 0 && (
                  <li>{impactData.events.length} meeting not yet declined</li>
                )}
              </ul>
              <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px' }}>
                You can still submit - your manager will see these items in the approval review.
              </p>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '6px' }}>
                  Add note for manager:
                </label>
                <textarea
                  value={managerNote}
                  onChange={(e) => setManagerNote(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-md border resize-none"
                  style={{
                    fontSize: '14px',
                    borderColor: '#E5E7EB',
                  }}
                  placeholder="Sarah will cover my tasks while I'm out..."
                />
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t" style={{ borderColor: '#E5E7EB' }}>
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 px-4 rounded-md border transition-colors hover:bg-gray-50"
                style={{
                  height: '40px',
                  fontSize: '14px',
                  fontWeight: 600,
                  borderColor: '#D1D5DB',
                  color: '#374151',
                }}
              >
                Go Back
              </button>
              <button
                onClick={submitRequest}
                className="flex-1 px-4 rounded-md transition-colors"
                style={{
                  height: '40px',
                  fontSize: '14px',
                  fontWeight: 600,
                  backgroundColor: '#0066FF',
                  color: 'white',
                }}
              >
                Submit Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}