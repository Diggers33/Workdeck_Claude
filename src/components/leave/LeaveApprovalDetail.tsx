import React, { useState, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight, ChevronDown, ChevronRight as ChevronRightCollapse, AlertTriangle, CheckCircle2, Users, Target, Calendar as CalendarIcon, MessageSquare, Clock, Palmtree, Check, Sparkles, TrendingUp } from 'lucide-react';
import { useLeave, LeaveRequest, leaveTypeConfig } from '../../contexts/LeaveContext';
import { useMyTasks, useEvents } from '../../hooks/useApiQueries';
import { toast } from 'sonner@2.0.3';

interface LeaveApprovalDetailProps {
  request: LeaveRequest;
  onClose: () => void;
}

export function LeaveApprovalDetail({ request: initialRequest, onClose }: LeaveApprovalDetailProps) {
  const { users, leaveRequests, approveLeaveRequest, denyLeaveRequest } = useLeave();
  const [managerComment, setManagerComment] = useState('');
  const [showDenyFlow, setShowDenyFlow] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Get all pending requests for navigation
  const pendingRequests = useMemo(() => 
    leaveRequests.filter(req => req.status === 'Pending'),
    [leaveRequests]
  );
  
  const [currentIndex, setCurrentIndex] = useState(() => 
    pendingRequests.findIndex(req => req.id === initialRequest.id)
  );
  
  const request = pendingRequests[currentIndex] || initialRequest;
  const employee = users.find(u => u.id === request.userId);

  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState({
    balance: true,
    tasks: true,
    coverage: true,
    meetings: true,
    previousDecisions: false,
    similarRequests: false,
    fullHistory: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Reset deny flow when request changes
  useEffect(() => {
    setShowDenyFlow(false);
    setManagerComment('');
  }, [currentIndex]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'a' && !showDenyFlow && !isProcessing) {
        handleApprove();
      } else if (e.key === 'd' && !isProcessing) {
        setShowDenyFlow(true);
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      } else if (e.key === 'ArrowRight' && currentIndex < pendingRequests.length - 1) {
        setCurrentIndex(prev => prev + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, pendingRequests.length, showDenyFlow, isProcessing]);

  if (!employee) return null;

  // Calculate leave history for this year
  const leaveHistory = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const employeeRequests = leaveRequests.filter(req => 
      req.userId === employee.id &&
      req.status === 'Approved' &&
      new Date(req.startDate).getFullYear() === currentYear
    );

    return employeeRequests
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [leaveRequests, employee.id]);

  // Calculate balance impact
  const balanceImpact = useMemo(() => {
    if (request.leaveType !== 'Holidays') return null;

    const currentYear = new Date().getFullYear();
    const approvedHolidays = leaveRequests.filter(req => 
      req.userId === employee.id &&
      req.status === 'Approved' &&
      req.leaveType === 'Holidays' &&
      new Date(req.startDate).getFullYear() === currentYear
    );

    const usedDays = approvedHolidays.reduce((sum, req) => sum + req.workingDays, 0);
    // Use employee's configured holiday allowance, or company default
    const totalAllowance = (employee as any).holidayAllowance || (employee as any).annualLeave || 22;
    const currentBalance = totalAllowance - usedDays;
    const afterApproval = currentBalance - request.workingDays;

    return {
      totalAllowance,
      usedDays,
      currentBalance,
      requestedDays: request.workingDays,
      afterApproval,
      isSufficient: afterApproval >= 0,
    };
  }, [leaveRequests, employee.id, request]);

  // Fetch real tasks and events via TanStack Query
  const { data: employeeTasks = [] } = useMyTasks(employee.id);
  const { data: employeeEvents = [] } = useEvents(
    new Date(request.startDate),
    new Date(request.endDate),
  );

  // Compute impact data from real fetched data
  const impactData = useMemo(() => {
    const leaveStart = new Date(request.startDate);
    const leaveEnd = new Date(request.endDate);

    // Tasks due during the leave period
    const tasks = employeeTasks
      .filter(t => {
        const due = t.endDate ? new Date(t.endDate) : null;
        return due && due >= leaveStart && due <= leaveEnd;
      })
      .slice(0, 5)
      .map(t => ({
        id: t.id,
        title: t.name || t.summary || 'Untitled task',
        project: t.activity?.project?.name || t.activity?.project?.code || '',
        dueDate: t.endDate || '',
        status: t.column?.name || 'Open',
        priority: (t.importance ?? 50) >= 75 ? 'high' : (t.importance ?? 50) >= 50 ? 'medium' : 'low',
      }));

    // Events/meetings during the leave period
    const meetings = employeeEvents
      .filter(e => {
        const eventDate = new Date(e.startAt);
        return eventDate >= leaveStart && eventDate <= leaveEnd;
      })
      .slice(0, 5)
      .map(e => ({
        id: e.id,
        title: e.title || 'Meeting',
        date: e.startAt?.split('T')[0] || '',
        time: new Date(e.startAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        attendees: e.guests?.length || 1,
        isOrganizer: false, // API doesn't distinguish organizer
        project: e.project?.name || '',
      }));

    // Team coverage: count team members with approved leave overlapping each day
    const teamTotal = users.length;
    const coverageDays: Array<{ date: string; day: string; available: number; total: number; warning?: boolean; holiday?: boolean }> = [];
    const current = new Date(leaveStart);
    while (current <= leaveEnd) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // skip weekends
        const dateStr = current.toISOString().split('T')[0];
        const dayLabel = current.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' });
        // Count team members on leave this day
        const onLeave = leaveRequests.filter(r =>
          r.userId !== request.userId &&
          (r.status === 'Approved' || r.status === 'Pending') &&
          new Date(r.startDate) <= current &&
          new Date(r.endDate) >= current
        ).length;
        const available = Math.max(0, teamTotal - 1 - onLeave); // -1 for this employee
        coverageDays.push({
          date: dateStr,
          day: dayLabel,
          available,
          total: teamTotal,
          warning: available < Math.ceil(teamTotal * 0.4),
        });
      }
      current.setDate(current.getDate() + 1);
    }

    const hasTaskIssues = tasks.length > 0;
    const hasMeetingIssues = meetings.length > 0;
    const hasCoverageIssues = coverageDays.some(day => !day.holiday && day.warning);

    return {
      tasks,
      meetings,
      teamCoverage: coverageDays.slice(0, 5), // show up to 5 days
      hasTaskIssues,
      hasMeetingIssues,
      hasCoverageIssues,
    };
  }, [request, employeeTasks, employeeEvents, users, leaveRequests]);

  // Previous decisions - computed from actual leave history for this employee
  const previousDecisions = useMemo(() => {
    return leaveRequests
      .filter(r => r.userId === employee.id && (r.status === 'Approved' || r.status === 'Denied') && r.id !== request.id)
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
      .slice(0, 6)
      .map(r => {
        const start = new Date(r.startDate);
        const end = new Date(r.endDate);
        const dateStr = start.getTime() === end.getTime()
          ? start.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })
          : `${start.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}-${end.toLocaleDateString('en-GB', { day: 'numeric' })}`;
        const submittedDate = r.submittedDate
          ? new Date(r.submittedDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })
          : dateStr;
        return {
          id: r.id,
          dates: dateStr,
          type: r.leaveType,
          days: r.workingDays,
          status: r.status,
          date: submittedDate,
          reason: r.status === 'Denied' ? (r.notes || '') : undefined,
        };
      });
  }, [leaveRequests, employee.id, request.id]);

  const approvalRate = Math.round((previousDecisions.filter(d => d.status === 'Approved').length / previousDecisions.length) * 100);

  // Similar requests - find other requests for overlapping dates
  const similarRequests = useMemo(() => {
    const reqStart = new Date(request.startDate);
    const reqEnd = new Date(request.endDate);
    // Look for requests from other users that overlap with this one's date range (±7 days)
    const windowStart = new Date(reqStart);
    windowStart.setDate(windowStart.getDate() - 7);
    const windowEnd = new Date(reqEnd);
    windowEnd.setDate(windowEnd.getDate() + 7);

    return leaveRequests
      .filter(r =>
        r.userId !== request.userId &&
        r.leaveType === request.leaveType &&
        (r.status === 'Approved' || r.status === 'Pending') &&
        new Date(r.startDate) <= windowEnd &&
        new Date(r.endDate) >= windowStart
      )
      .slice(0, 5)
      .map(r => {
        const user = users.find(u => u.id === r.userId);
        const start = new Date(r.startDate);
        const end = new Date(r.endDate);
        const dateStr = start.getTime() === end.getTime()
          ? start.toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })
          : `${start.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        return {
          name: user?.name || 'Unknown',
          dates: dateStr,
          status: r.status,
        };
      });
  }, [leaveRequests, request, users]);

  const handleApprove = async () => {
    setIsProcessing(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    approveLeaveRequest(request.id);
    toast.success(`✓ Leave approved for ${employee.name}`, {
      description: 'Notification sent',
    });
    
    setIsProcessing(false);
    
    // Auto-advance to next request
    if (currentIndex < pendingRequests.length - 1) {
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 600);
    } else {
      // No more requests - close panel
      setTimeout(() => {
        onClose();
      }, 1000);
    }
  };

  const handleDeny = async () => {
    if (!managerComment.trim()) {
      toast.error('Please provide a reason for denial');
      return;
    }
    
    setIsProcessing(true);
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    denyLeaveRequest(request.id, managerComment);
    toast.error(`✗ Leave denied for ${employee.name}`, {
      description: 'Notification sent',
    });
    
    setIsProcessing(false);
    setShowDenyFlow(false);
    setManagerComment('');
    
    // Auto-advance to next request
    if (currentIndex < pendingRequests.length - 1) {
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 600);
    } else {
      setTimeout(() => {
        onClose();
      }, 1000);
    }
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (start === end) {
      return startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    
    return `${startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const totalIssues = (impactData.hasTaskIssues ? 1 : 0) + (impactData.hasMeetingIssues ? 1 : 0);
  const hasIssues = totalIssues > 0 || impactData.hasCoverageIssues;

  return (
    <>
      {/* Panel */}
      <div 
        className="fixed right-0 top-0 bottom-0 bg-white z-50 flex flex-col"
        style={{
          width: '680px',
          borderLeft: '1px solid #E5E7EB',
          boxShadow: '-8px 0 24px rgba(0, 0, 0, 0.12)',
        }}
      >
        {/* Header - Sticky */}
        <div 
          className="sticky top-0 bg-white border-b z-10"
          style={{ 
            borderColor: '#E5E7EB',
            padding: '20px 24px',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            {/* Navigation Arrows */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentIndex(prev => prev - 1)}
                disabled={currentIndex === 0}
                className="flex items-center justify-center border rounded-md transition-colors"
                style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: '#F3F4F6',
                  borderColor: '#E5E7EB',
                  opacity: currentIndex === 0 ? 0.4 : 1,
                  cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                <ChevronLeft className="w-4 h-4" style={{ color: '#6B7280' }} />
              </button>
              <button
                onClick={() => setCurrentIndex(prev => prev + 1)}
                disabled={currentIndex >= pendingRequests.length - 1}
                className="flex items-center justify-center border rounded-md transition-colors"
                style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: '#F3F4F6',
                  borderColor: '#E5E7EB',
                  opacity: currentIndex >= pendingRequests.length - 1 ? 0.4 : 1,
                  cursor: currentIndex >= pendingRequests.length - 1 ? 'not-allowed' : 'pointer',
                }}
              >
                <ChevronRight className="w-4 h-4" style={{ color: '#6B7280' }} />
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="flex items-center justify-center border rounded-md transition-colors hover:bg-gray-50"
              style={{
                width: '36px',
                height: '36px',
                borderColor: '#E5E7EB',
              }}
            >
              <X className="w-5 h-5" style={{ color: '#6B7280' }} />
            </button>
          </div>

          {/* Title Section */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              {React.cloneElement(leaveTypeConfig[request.leaveType].icon as React.ReactElement, {
                className: 'w-5 h-5',
                style: { color: leaveTypeConfig[request.leaveType].color }
              })}
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#111827' }}>
                {request.leaveType} Request
              </h2>
            </div>
            <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '4px' }}>
              {employee.name} • {formatDateRange(request.startDate, request.endDate)}
            </div>
            <div style={{ fontSize: '13px', color: '#9CA3AF' }}>
              {currentIndex + 1} of {pendingRequests.length} pending
            </div>
          </div>
        </div>

        {/* Body - Scrollable */}
        <div 
          className="flex-1 overflow-y-auto"
          style={{ 
            padding: '24px',
            height: 'calc(100vh - 140px)',
          }}
        >
          <div className="space-y-5">
            {/* SECTION 1: REQUEST DETAILS */}
            <div 
              className="border rounded-xl"
              style={{
                borderColor: '#E5E7EB',
                padding: '20px',
              }}
            >
              {/* Employee */}
              <div className="flex items-center gap-3 mb-4 pb-4 border-b" style={{ borderColor: '#E5E7EB' }}>
                <div 
                  className="flex items-center justify-center rounded-full text-white"
                  style={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: '#0066FF',
                    fontSize: '16px',
                    fontWeight: 600,
                  }}
                >
                  {getInitials(employee.name)}
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>
                    {employee.name}
                  </div>
                  <div style={{ fontSize: '13px', color: '#6B7280' }}>
                    Senior Developer · {employee.department} · {employee.location}
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b" style={{ borderColor: '#E5E7EB' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                    Type
                  </div>
                  <div className="flex items-center gap-2">
                    {React.cloneElement(leaveTypeConfig[request.leaveType].icon as React.ReactElement, {
                      className: 'w-4 h-4',
                      style: { color: leaveTypeConfig[request.leaveType].color }
                    })}
                    <span style={{ fontSize: '14px', color: '#111827' }}>
                      {request.leaveType}
                    </span>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                    Dates
                  </div>
                  <div style={{ fontSize: '14px', color: '#111827' }}>
                    {formatDateRange(request.startDate, request.endDate)}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                    Duration
                  </div>
                  <div style={{ fontSize: '14px', color: '#111827' }}>
                    {request.calendarDays} calendar ({request.workingDays} working)
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                    Submitted
                  </div>
                  <div style={{ fontSize: '14px', color: '#111827' }}>
                    {new Date(request.submittedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>
                    (2 days ago)
                  </div>
                </div>
              </div>

              {/* Notes */}
              {request.notes && (
                <div>
                  <div style={{ fontSize: '12px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                    Notes:
                  </div>
                  <div 
                    className="rounded-lg"
                    style={{
                      backgroundColor: '#F9FAFB',
                      padding: '12px',
                      fontSize: '13px',
                      fontStyle: 'italic',
                      color: '#374151',
                    }}
                  >
                    "{request.notes}"
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 2: IMPACT SUMMARY */}
            <div 
              className="rounded-lg"
              style={{
                backgroundColor: hasIssues ? '#FEF3C7' : '#ECFDF5',
                border: `1px solid ${hasIssues ? '#FDE68A' : '#A7F3D0'}`,
                borderLeft: `4px solid ${hasIssues ? '#F59E0B' : '#10B981'}`,
                padding: '16px',
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: 600, color: hasIssues ? '#92400E' : '#065F46', marginBottom: '8px' }}>
                {hasIssues ? `⚠️ ${totalIssues} ${totalIssues === 1 ? 'item needs' : 'items need'} attention` : '✓ No issues detected'}
              </div>

              <div className="space-y-1">
                {impactData.hasTaskIssues && (
                  <div style={{ fontSize: '13px', color: '#B45309' }}>
                    • {impactData.tasks.length} tasks due during this period
                  </div>
                )}
                {impactData.hasMeetingIssues && (
                  <div style={{ fontSize: '13px', color: '#B45309' }}>
                    • {impactData.meetings.filter(m => m.isOrganizer).length} meeting scheduled ({employee.name.split(' ')[0]} is organizer)
                  </div>
                )}
                {!impactData.hasTaskIssues && (
                  <div style={{ fontSize: '13px', color: '#059669' }}>
                    ✓ No task conflicts
                  </div>
                )}
                {!impactData.hasMeetingIssues && (
                  <div style={{ fontSize: '13px', color: '#059669' }}>
                    ✓ No meeting conflicts
                  </div>
                )}
                <div style={{ fontSize: '13px', color: impactData.hasCoverageIssues ? '#B45309' : '#059669' }}>
                  {impactData.hasCoverageIssues ? '• Team coverage low on some days' : '✓ Team coverage OK'}
                </div>
                {balanceImpact && (
                  <div style={{ fontSize: '13px', color: balanceImpact.isSufficient ? '#059669' : '#B45309' }}>
                    {balanceImpact.isSufficient ? `✓ Holiday balance sufficient (${balanceImpact.afterApproval} days remaining)` : `• Low holiday balance (${balanceImpact.afterApproval} days remaining)`}
                  </div>
                )}
                <div style={{ fontSize: '13px', color: '#059669' }}>
                  ✓ No critical milestones
                </div>
              </div>
            </div>

            {/* SECTION 3: HOLIDAY BALANCE */}
            {balanceImpact && (
              <div>
                <button
                  onClick={() => toggleSection('balance')}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  style={{ border: '1px solid #E5E7EB' }}
                >
                  <div className="flex items-center gap-2">
                    {expandedSections.balance ? (
                      <ChevronDown className="w-4 h-4" style={{ color: '#6B7280' }} />
                    ) : (
                      <ChevronRightCollapse className="w-4 h-4" style={{ color: '#6B7280' }} />
                    )}
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                      Holiday Balance
                    </span>
                  </div>
                  {balanceImpact.isSufficient ? (
                    <CheckCircle2 className="w-4 h-4" style={{ color: '#10B981' }} />
                  ) : (
                    <AlertTriangle className="w-4 h-4" style={{ color: '#F59E0B' }} />
                  )}
                </button>

                {expandedSections.balance && (
                  <div 
                    className="rounded-lg mt-2"
                    style={{
                      backgroundColor: '#F9FAFB',
                      padding: '16px',
                    }}
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span style={{ fontSize: '13px', color: '#6B7280' }}>Annual allowance</span>
                        <span style={{ fontSize: '13px', color: '#111827' }}>{balanceImpact.totalAllowance} days</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span style={{ fontSize: '13px', color: '#6B7280' }}>Used this year</span>
                        <span style={{ fontSize: '13px', color: '#111827' }}>-{balanceImpact.usedDays} days</span>
                      </div>
                      <div style={{ height: '1px', backgroundColor: '#E5E7EB', margin: '8px 0' }} />
                      <div className="flex justify-between items-center">
                        <span style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>Current balance</span>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{balanceImpact.currentBalance} days</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span style={{ fontSize: '13px', color: '#6B7280' }}>This request</span>
                        <span style={{ fontSize: '13px', color: '#EF4444' }}>-{balanceImpact.requestedDays} days</span>
                      </div>
                      <div style={{ height: '1px', backgroundColor: '#E5E7EB', margin: '8px 0' }} />
                      <div className="flex justify-between items-center">
                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>After approval</span>
                        <div className="flex items-center gap-2">
                          <span style={{ 
                            fontSize: '14px', 
                            fontWeight: 600, 
                            color: balanceImpact.isSufficient ? '#10B981' : '#DC2626' 
                          }}>
                            {balanceImpact.afterApproval} days
                          </span>
                          <span 
                            className="px-2 py-1 rounded"
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              backgroundColor: balanceImpact.isSufficient ? '#ECFDF5' : '#FEE2E2',
                              color: balanceImpact.isSufficient ? '#059669' : '#DC2626',
                            }}
                          >
                            {balanceImpact.isSufficient ? '✓ Sufficient' : '⚠️ Insufficient'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SECTION 4: TASKS DUE */}
            <div>
              <button
                onClick={() => toggleSection('tasks')}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                style={{ border: '1px solid #E5E7EB' }}
              >
                <div className="flex items-center gap-2">
                  {expandedSections.tasks ? (
                    <ChevronDown className="w-4 h-4" style={{ color: '#6B7280' }} />
                  ) : (
                    <ChevronRightCollapse className="w-4 h-4" style={{ color: '#6B7280' }} />
                  )}
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                    Tasks Due ({impactData.tasks.length})
                  </span>
                </div>
                {impactData.hasTaskIssues ? (
                  <AlertTriangle className="w-4 h-4" style={{ color: '#F59E0B' }} />
                ) : (
                  <CheckCircle2 className="w-4 h-4" style={{ color: '#10B981' }} />
                )}
              </button>

              {expandedSections.tasks && impactData.tasks.length > 0 && (
                <div className="mt-2 space-y-2">
                  {impactData.tasks.map(task => (
                    <div 
                      key={task.id}
                      className="bg-white border rounded-lg"
                      style={{
                        borderColor: '#E5E7EB',
                        borderLeft: `3px solid ${task.priority === 'high' ? '#F59E0B' : '#6B7280'}`,
                        padding: '12px',
                      }}
                    >
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
                        {task.title}
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span style={{ fontSize: '12px', color: '#6B7280' }}>
                          {task.project} • Due {new Date(task.dueDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                        </span>
                        <span 
                          className="px-1.5 py-0.5 rounded"
                          style={{
                            fontSize: '11px',
                            fontWeight: 500,
                            backgroundColor: task.priority === 'high' ? '#FEE2E2' : '#FEF3C7',
                            color: task.priority === 'high' ? '#DC2626' : '#F59E0B',
                          }}
                        >
                          {task.priority === 'high' ? '🔴 High' : '🟡 Medium'}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '8px' }}>
                        Status: {task.status}
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          className="flex-1 px-2 py-1.5 border rounded-md text-sm"
                          style={{ borderColor: '#E5E7EB' }}
                        >
                          <option>Select team member...</option>
                          {users
                            .filter(u => u.id !== request.userId)
                            .map(u => (
                              <option key={u.id} value={u.id}>{u.name}</option>
                            ))
                          }
                        </select>
                        <button
                          className="px-3 py-1.5 border rounded-md text-sm hover:bg-gray-50 transition-colors"
                          style={{ borderColor: '#E5E7EB', fontWeight: 500, color: '#374151' }}
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SECTION 5: TEAM COVERAGE */}
            <div>
              <button
                onClick={() => toggleSection('coverage')}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                style={{ border: '1px solid #E5E7EB' }}
              >
                <div className="flex items-center gap-2">
                  {expandedSections.coverage ? (
                    <ChevronDown className="w-4 h-4" style={{ color: '#6B7280' }} />
                  ) : (
                    <ChevronRightCollapse className="w-4 h-4" style={{ color: '#6B7280' }} />
                  )}
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                    Team Coverage
                  </span>
                </div>
                {impactData.hasCoverageIssues ? (
                  <AlertTriangle className="w-4 h-4" style={{ color: '#F59E0B' }} />
                ) : (
                  <CheckCircle2 className="w-4 h-4" style={{ color: '#10B981' }} />
                )}
              </button>

              {expandedSections.coverage && (
                <div 
                  className="mt-2 rounded-lg"
                  style={{
                    backgroundColor: '#F9FAFB',
                    padding: '12px',
                  }}
                >
                  {/* Calendar grid */}
                  <div className="mb-3">
                    <div className="grid grid-cols-5 gap-2 mb-2">
                      {impactData.teamCoverage.map(day => (
                        <div key={day.date} className="text-center">
                          <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>
                            {day.day}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Team members */}
                    <div className="space-y-1">
                      {/* This employee - on leave */}
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 500, color: '#111827', marginBottom: '4px' }}>
                          {employee.name.split(' ').map(n => n[0] ? `${n[0]}.` : '').join('')} {employee.name.split(' ')[0]}
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                          {impactData.teamCoverage.map(day => (
                            <div
                              key={day.date}
                              className="h-6 rounded"
                              style={{ backgroundColor: day.holiday ? '#F3F4F6' : '#3B82F6' }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Other team members */}
                      {users
                        .filter(u => u.id !== request.userId)
                        .slice(0, 4)
                        .map(u => {
                          const nameParts = u.name.split(' ');
                          const shortName = `${nameParts[0]} ${nameParts[nameParts.length - 1]?.[0] || ''}.`;
                          // Check if this user also has approved leave overlapping the same period
                          const hasOverlap = leaveRequests.some(r =>
                            r.userId === u.id &&
                            (r.status === 'Approved' || r.status === 'Pending') &&
                            r.id !== request.id &&
                            new Date(r.startDate) <= new Date(request.endDate) &&
                            new Date(r.endDate) >= new Date(request.startDate)
                          );
                          return (
                            <div key={u.id}>
                              <div style={{ fontSize: '12px', fontWeight: 500, color: '#111827', marginBottom: '4px' }}>
                                {shortName}
                              </div>
                              <div className="grid grid-cols-5 gap-2">
                                {impactData.teamCoverage.map(day => (
                                  <div
                                    key={day.date}
                                    className="h-6 rounded flex items-center justify-center"
                                    style={{
                                      backgroundColor: day.holiday
                                        ? '#F3F4F6'
                                        : hasOverlap
                                          ? '#F59E0B'
                                          : '#ECFDF5'
                                    }}
                                  >
                                    {!day.holiday && !hasOverlap && <Check className="w-3 h-3" style={{ color: '#10B981' }} />}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })
                      }
                    </div>
                  </div>

                  {/* Summary */}
                  <div style={{ fontSize: '12px', color: '#374151' }} className="space-y-1">
                    {impactData.teamCoverage.map(day => (
                      <div key={day.date} style={day.warning ? { color: '#B91C1C' } : undefined}>
                        • {day.day}: {day.holiday ? 'Public Holiday —' : `${day.available}/${day.total} available ${day.warning ? '⚠️' : '✓'}`}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 6: MEETINGS */}
            <div>
              <button
                onClick={() => toggleSection('meetings')}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                style={{ border: '1px solid #E5E7EB' }}
              >
                <div className="flex items-center gap-2">
                  {expandedSections.meetings ? (
                    <ChevronDown className="w-4 h-4" style={{ color: '#6B7280' }} />
                  ) : (
                    <ChevronRightCollapse className="w-4 h-4" style={{ color: '#6B7280' }} />
                  )}
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                    Meetings ({impactData.meetings.length})
                  </span>
                </div>
                {impactData.hasMeetingIssues ? (
                  <AlertTriangle className="w-4 h-4" style={{ color: '#F59E0B' }} />
                ) : (
                  <CheckCircle2 className="w-4 h-4" style={{ color: '#10B981' }} />
                )}
              </button>

              {expandedSections.meetings && impactData.meetings.length > 0 && (
                <div className="mt-2 space-y-2">
                  {impactData.meetings.map(meeting => (
                    <div 
                      key={meeting.id}
                      className="bg-white border rounded-lg"
                      style={{
                        borderColor: '#E5E7EB',
                        borderLeft: meeting.isOrganizer ? '3px solid #F59E0B' : '3px solid #E5E7EB',
                        padding: '12px',
                      }}
                    >
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '4px' }}>
                        📅 {new Date(meeting.date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}, {meeting.time}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
                        {meeting.title}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '8px' }}>
                        {meeting.project} • {meeting.attendees} attendees • 1 hour
                      </div>
                      
                      {meeting.isOrganizer && (
                        <div 
                          className="rounded p-2 mb-2"
                          style={{
                            backgroundColor: '#FEF3C7',
                            fontSize: '12px',
                            color: '#B45309',
                          }}
                        >
                          ⚠️ {employee.name.split(' ')[0]} is the organizer<br />
                          Meeting may need rescheduling
                        </div>
                      )}

                      <button
                        className="px-3 py-1.5 border rounded-md text-sm hover:bg-gray-50 transition-colors"
                        style={{ borderColor: '#E5E7EB', fontWeight: 500, color: '#374151' }}
                      >
                        Suggest Reschedule
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SECTION 7: YOUR PREVIOUS DECISIONS */}
            <div>
              <button
                onClick={() => toggleSection('previousDecisions')}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                style={{ border: '1px solid #E5E7EB' }}
              >
                <div className="flex items-center gap-2">
                  {expandedSections.previousDecisions ? (
                    <ChevronDown className="w-4 h-4" style={{ color: '#6B7280' }} />
                  ) : (
                    <ChevronRightCollapse className="w-4 h-4" style={{ color: '#6B7280' }} />
                  )}
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                    Your Previous Decisions
                  </span>
                </div>
              </button>

              {expandedSections.previousDecisions && (
                <div 
                  className="mt-2 rounded-lg"
                  style={{
                    backgroundColor: '#F9FAFB',
                    padding: '12px',
                  }}
                >
                  <div style={{ fontSize: '13px', color: '#374151', marginBottom: '12px' }}>
                    You've reviewed {previousDecisions.length} requests from {employee.name.split(' ')[0]}:
                  </div>

                  <div className="bg-white rounded-lg border divide-y" style={{ borderColor: '#E5E7EB' }}>
                    {previousDecisions.map(decision => (
                      <div key={decision.id} className="p-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span style={{ color: decision.status === 'Approved' ? '#059669' : '#DC2626' }}>
                              {decision.status === 'Approved' ? '✓' : '✗'}
                            </span>
                            <span style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>
                              {decision.dates}
                            </span>
                            <span style={{ fontSize: '13px', color: '#6B7280' }}>
                              {decision.type} ({decision.days}d)
                            </span>
                          </div>
                          <div className="text-right">
                            <div style={{ 
                              fontSize: '13px', 
                              color: decision.status === 'Approved' ? '#059669' : '#DC2626' 
                            }}>
                              {decision.status}
                            </div>
                            <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
                              {decision.date}
                            </div>
                          </div>
                        </div>
                        {decision.reason && (
                          <div style={{ fontSize: '12px', fontStyle: 'italic', color: '#6B7280', marginLeft: '20px', marginTop: '4px' }}>
                            "{decision.reason}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div 
                    className="mt-3 rounded-md p-3"
                    style={{ backgroundColor: '#EFF6FF', border: '1px solid #DBEAFE' }}
                  >
                    <div style={{ fontSize: '13px', color: '#1E40AF' }}>
                      📊 Approval rate: {approvalRate}% ({previousDecisions.filter(d => d.status === 'Approved').length} of {previousDecisions.length})
                    </div>
                    <div style={{ fontSize: '13px', color: '#1E40AF' }}>
                      💡 Last denial: 9 months ago
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 8: SIMILAR REQUESTS */}
            <div>
              <button
                onClick={() => toggleSection('similarRequests')}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                style={{ border: '1px solid #E5E7EB' }}
              >
                <div className="flex items-center gap-2">
                  {expandedSections.similarRequests ? (
                    <ChevronDown className="w-4 h-4" style={{ color: '#6B7280' }} />
                  ) : (
                    <ChevronRightCollapse className="w-4 h-4" style={{ color: '#6B7280' }} />
                  )}
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                    Similar Requests
                  </span>
                </div>
                <Sparkles className="w-4 h-4" style={{ color: '#F59E0B' }} />
              </button>

              {expandedSections.similarRequests && (
                <div 
                  className="mt-2 rounded-lg"
                  style={{
                    backgroundColor: '#F9FAFB',
                    padding: '12px',
                  }}
                >
                  <div style={{ fontSize: '13px', color: '#374151', marginBottom: '12px' }}>
                    {similarRequests.length > 0
                      ? `💡 Similar ${request.leaveType.toLowerCase()} requests around this period:`
                      : '💡 No similar requests found for this period.'}
                  </div>

                  <div className="bg-white rounded-lg border divide-y" style={{ borderColor: '#E5E7EB' }}>
                    {similarRequests.map((req, index) => (
                      <div key={index} className="p-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span style={{ color: '#059669' }}>✓</span>
                          <span style={{ fontSize: '13px', color: '#111827' }}>
                            {req.name}
                          </span>
                        </div>
                        <div className="text-right">
                          <div style={{ fontSize: '12px', color: '#6B7280' }}>
                            {req.dates}
                          </div>
                          <div style={{ fontSize: '12px', color: '#059669' }}>
                            {req.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ fontSize: '13px', color: '#374151', marginTop: '12px' }}>
                    {similarRequests.filter(r => r.status === 'Approved').length}/{similarRequests.length} similar requests approved
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 9: FULL LEAVE HISTORY */}
            <div>
              <button
                onClick={() => toggleSection('fullHistory')}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                style={{ border: '1px solid #E5E7EB' }}
              >
                <div className="flex items-center gap-2">
                  {expandedSections.fullHistory ? (
                    <ChevronDown className="w-4 h-4" style={{ color: '#6B7280' }} />
                  ) : (
                    <ChevronRightCollapse className="w-4 h-4" style={{ color: '#6B7280' }} />
                  )}
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                    Full Leave History (2025)
                  </span>
                </div>
              </button>

              {expandedSections.fullHistory && (
                <div 
                  className="mt-2 rounded-lg"
                  style={{
                    backgroundColor: '#F9FAFB',
                    padding: '12px',
                  }}
                >
                  <div style={{ fontSize: '13px', color: '#374151', marginBottom: '12px' }}>
                    2025 Summary: {leaveHistory.reduce((sum, req) => sum + req.workingDays, 0)} days taken
                  </div>

                  <div className="bg-white rounded-lg border divide-y" style={{ borderColor: '#E5E7EB' }}>
                    {leaveHistory.slice(0, 4).map(req => {
                      const config = leaveTypeConfig[req.leaveType];
                      return (
                        <div key={req.id} className="p-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {React.cloneElement(config.icon as React.ReactElement, {
                              className: 'w-4 h-4',
                              style: { color: config.color }
                            })}
                            <div>
                              <div style={{ fontSize: '13px', color: '#111827' }}>
                                {formatDateRange(req.startDate, req.endDate)}
                              </div>
                              <div style={{ fontSize: '12px', color: '#6B7280' }}>
                                {req.leaveType}
                              </div>
                            </div>
                          </div>
                          <div style={{ fontSize: '13px', color: '#6B7280' }}>
                            {req.workingDays} {req.workingDays === 1 ? 'day' : 'days'}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div 
                    className="mt-3 rounded-md p-3 space-y-1"
                    style={{ backgroundColor: '#EFF6FF', border: '1px solid #DBEAFE' }}
                  >
                    <div style={{ fontSize: '13px', color: '#1E40AF' }}>
                      💡 Last leave: 6 weeks ago
                    </div>
                    <div style={{ fontSize: '13px', color: '#1E40AF' }}>
                      💡 {balanceImpact?.currentBalance || 0} days remaining to use by Dec 31
                    </div>
                  </div>

                  <button
                    className="mt-3 w-full px-3 py-2 border rounded-md text-sm hover:bg-gray-50 transition-colors"
                    style={{ borderColor: '#E5E7EB', fontWeight: 500, color: '#0066FF' }}
                  >
                    View Full History →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer - Sticky */}
        <div 
          className="sticky bottom-0 bg-white border-t"
          style={{
            borderColor: '#E5E7EB',
            padding: '20px 24px',
            minHeight: '140px',
          }}
        >
          {!showDenyFlow ? (
            <>
              {/* Comment input */}
              <div className="mb-4">
                <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '6px' }}>
                  Add comment (optional)
                </label>
                <textarea
                  value={managerComment}
                  onChange={(e) => setManagerComment(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg resize-vertical"
                  style={{
                    fontSize: '13px',
                    borderColor: '#E5E7EB',
                  }}
                  placeholder="Add a note for the employee..."
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowDenyFlow(true)}
                  disabled={isProcessing}
                  className="px-5 border rounded-lg transition-colors hover:bg-red-50"
                  style={{
                    height: '44px',
                    fontSize: '14px',
                    fontWeight: 600,
                    borderColor: '#DC2626',
                    color: '#DC2626',
                    opacity: isProcessing ? 0.5 : 1,
                  }}
                >
                  Deny
                </button>

                <button
                  onClick={handleApprove}
                  disabled={isProcessing}
                  className="px-6 rounded-lg transition-colors flex items-center gap-2"
                  style={{
                    height: '44px',
                    fontSize: '14px',
                    fontWeight: 600,
                    backgroundColor: isProcessing ? '#9CA3AF' : '#059669',
                    color: 'white',
                  }}
                >
                  {isProcessing ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {isProcessing ? 'Processing...' : 'Approve'}
                </button>
              </div>

              {/* Keyboard hint */}
              <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '8px', textAlign: 'center' }}>
                Tip: Press <kbd className="px-1 py-0.5 bg-gray-100 rounded border" style={{ borderColor: '#E5E7EB' }}>A</kbd> to approve, <kbd className="px-1 py-0.5 bg-gray-100 rounded border" style={{ borderColor: '#E5E7EB' }}>← →</kbd> to navigate
              </div>
            </>
          ) : (
            <>
              {/* Deny flow */}
              <div className="mb-4">
                <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '6px' }}>
                  Reason for denial <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <textarea
                  value={managerComment}
                  onChange={(e) => setManagerComment(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg resize-vertical"
                  style={{
                    fontSize: '13px',
                    borderColor: managerComment.trim() ? '#E5E7EB' : '#FCA5A5',
                  }}
                  placeholder="Please provide a reason..."
                  autoFocus
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    setShowDenyFlow(false);
                    setManagerComment('');
                  }}
                  disabled={isProcessing}
                  className="px-5 border rounded-lg transition-colors hover:bg-gray-50"
                  style={{
                    height: '44px',
                    fontSize: '14px',
                    fontWeight: 600,
                    borderColor: '#D1D5DB',
                    color: '#374151',
                    opacity: isProcessing ? 0.5 : 1,
                  }}
                >
                  Cancel
                </button>

                <button
                  onClick={handleDeny}
                  disabled={isProcessing || !managerComment.trim()}
                  className="px-6 rounded-lg transition-colors"
                  style={{
                    height: '44px',
                    fontSize: '14px',
                    fontWeight: 600,
                    backgroundColor: isProcessing || !managerComment.trim() ? '#FCA5A5' : '#DC2626',
                    color: 'white',
                    opacity: !managerComment.trim() ? 0.6 : 1,
                    cursor: !managerComment.trim() ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isProcessing ? 'Processing...' : 'Confirm Denial'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}