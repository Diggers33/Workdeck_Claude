import React, { useState, useMemo } from 'react';
import { Search, Trash2, Calendar, Check, X, Clock, AlertTriangle, ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { useLeave, leaveTypeConfig, LeaveType, LeaveDuration, LeaveStatus } from '../../contexts/LeaveContext';
import { toast } from 'sonner';
import { LeaveRequestModal } from './LeaveRequestModal';

export function MyLeave() {
  const { leaveRequests, currentUser, isLoading, addLeaveRequest, deleteLeaveRequest } = useLeave();
  const [filterStatus, setFilterStatus] = useState<'All' | LeaveStatus>('All');
  const [filterYear, setFilterYear] = useState<string>('All Years');
  const [filterType, setFilterType] = useState<'All Types' | LeaveType>('All Types');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set([2025])); // Current year expanded by default
  const [showAllCards, setShowAllCards] = useState<Set<number>>(new Set()); // Track which years show all cards
  const [showRequestModal, setShowRequestModal] = useState(false);

  // Form state
  const [leaveType, setLeaveType] = useState<LeaveType>('Holidays');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [duration, setDuration] = useState<LeaveDuration>('Full Day');
  const [notes, setNotes] = useState('');
  const [addToCalendar, setAddToCalendar] = useState(true);
  const [billable, setBillable] = useState(false);

  // Show loading state while context data is being fetched
  if (isLoading || !currentUser) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB' }}>
        <div style={{ fontSize: '14px', color: '#6B7280' }}>
          {isLoading ? 'Loading...' : 'Please log in to view your leave requests'}
        </div>
      </div>
    );
  }

  // Get current user's leave requests
  const myLeaveRequests = useMemo(() => {
    return leaveRequests.filter(req => req.userId === currentUser.id);
  }, [leaveRequests, currentUser.id]);

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
      if (day !== 0 && day !== 6) { // Not weekend
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

  // Calculate real-time balance impact
  const balanceImpact = useMemo(() => {
    if (!startDate || !endDate) {
      return {
        requestedDays: 0,
        currentBalance: currentUser.holidayBalance,
        remainingBalance: currentUser.holidayBalance,
        willExceed: false,
      };
    }

    // Calculate days used so far this year for this leave type
    const currentYear = new Date().getFullYear();
    const approvedRequests = myLeaveRequests.filter(req => 
      req.status === 'Approved' &&
      req.leaveType === leaveType &&
      new Date(req.startDate).getFullYear() === currentYear
    );
    const daysUsed = approvedRequests.reduce((sum, req) => sum + req.workingDays, 0);

    // Calculate pending requests for this leave type
    const pendingRequests = myLeaveRequests.filter(req => 
      req.status === 'Pending' &&
      req.leaveType === leaveType &&
      new Date(req.startDate).getFullYear() === currentYear
    );
    const daysPending = pendingRequests.reduce((sum, req) => sum + req.workingDays, 0);

    // Calculate current request days
    const requestedDays = workingDays;

    // Calculate balances
    const currentBalance = currentUser.holidayBalance - daysUsed;
    const remainingBalance = currentBalance - requestedDays;
    const willExceed = remainingBalance < 0;

    return {
      requestedDays,
      currentBalance,
      remainingBalance,
      willExceed,
      daysUsed,
      daysPending,
      totalAvailable: currentUser.holidayBalance,
    };
  }, [startDate, endDate, leaveType, workingDays, myLeaveRequests, currentUser.holidayBalance]);

  // Group requests by year and calculate stats
  const yearGroups = useMemo(() => {
    const groups: Record<number, typeof myLeaveRequests> = {};
    
    myLeaveRequests.forEach(req => {
      const year = new Date(req.startDate).getFullYear();
      if (!groups[year]) {
        groups[year] = [];
      }
      groups[year].push(req);
    });
    
    // Sort years descending
    return Object.keys(groups)
      .map(Number)
      .sort((a, b) => b - a)
      .map(year => {
        const requests = groups[year];
        const totalDays = requests.reduce((sum, req) => sum + req.workingDays, 0);
        return {
          year,
          requests,
          totalDays,
          requestCount: requests.length,
        };
      });
  }, [myLeaveRequests]);

  // Calculate breakdown by leave type for current year
  const currentYearBreakdown = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const currentYearRequests = myLeaveRequests.filter(req => 
      new Date(req.startDate).getFullYear() === currentYear &&
      req.status === 'Approved'
    );
    
    const breakdown: Record<string, number> = {};
    currentYearRequests.forEach(req => {
      breakdown[req.leaveType] = (breakdown[req.leaveType] || 0) + req.workingDays;
    });
    
    return Object.entries(breakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4); // Top 4 types
  }, [myLeaveRequests]);

  // Filter requests
  const filteredYearGroups = useMemo(() => {
    return yearGroups.map(group => {
      let filtered = group.requests;
      
      if (filterStatus !== 'All') {
        filtered = filtered.filter(req => req.status === filterStatus);
      }
      
      if (filterYear !== 'All Years') {
        const selectedYear = parseInt(filterYear);
        if (group.year !== selectedYear) {
          return null;
        }
      }
      
      if (filterType !== 'All Types') {
        filtered = filtered.filter(req => req.leaveType === filterType);
      }
      
      if (searchQuery) {
        filtered = filtered.filter(req => 
          req.leaveType.toLowerCase().includes(searchQuery.toLowerCase()) ||
          req.notes?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      // Sort by date descending
      filtered = filtered.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
      
      return {
        ...group,
        requests: filtered,
        requestCount: filtered.length,
      };
    }).filter(Boolean) as typeof yearGroups;
  }, [yearGroups, filterStatus, filterYear, filterType, searchQuery]);

  // Check for insufficient balance
  const hasInsufficientBalance = workingDays > currentUser.holidayBalance && leaveType === 'Holidays';

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
    
    // Reset form
    setStartDate('');
    setEndDate('');
    setNotes('');
    setDuration('Full Day');
    
    toast.success('Leave request submitted successfully');
  };

  const handleDelete = (id: string) => {
    deleteLeaveRequest(id);
    toast.success('Leave request deleted');
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (start === end) {
      return startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }
    
    if (startDate.getMonth() === endDate.getMonth()) {
      return `${startDate.getDate()}-${endDate.getDate()} ${startDate.toLocaleDateString('en-GB', { month: 'short' })}`;
    }
    
    return `${startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
  };

  const toggleYear = (year: number) => {
    const newExpanded = new Set(expandedYears);
    if (newExpanded.has(year)) {
      newExpanded.delete(year);
    } else {
      newExpanded.add(year);
    }
    setExpandedYears(newExpanded);
  };

  const toggleShowAll = (year: number) => {
    const newShowAll = new Set(showAllCards);
    if (newShowAll.has(year)) {
      newShowAll.delete(year);
    } else {
      newShowAll.add(year);
    }
    setShowAllCards(newShowAll);
  };

  const getStatusColor = (status: LeaveStatus) => {
    switch (status) {
      case 'Approved':
        return '#10B981';
      case 'Pending':
        return '#F59E0B';
      case 'Denied':
        return '#EF4444';
    }
  };

  const getStatusIcon = (status: LeaveStatus) => {
    switch (status) {
      case 'Approved':
        return <Check className="w-4 h-4" />;
      case 'Pending':
        return <Clock className="w-4 h-4" />;
      case 'Denied':
        return <X className="w-4 h-4" />;
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', backgroundColor: '#F9FAFB' }}>
      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div className="bg-white border-b flex items-center justify-between px-6" style={{ height: '56px', borderColor: '#E5E7EB', flexShrink: 0 }}>
          <div className="flex items-center gap-2 px-4 py-2 rounded-md" style={{ backgroundColor: '#FEF3C7' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#92400E' }}>
              {currentUser.holidayBalance} days remaining
            </span>
          </div>
          <button
            onClick={() => setShowRequestModal(true)}
            className="flex items-center gap-2 px-4 rounded-md transition-colors hover:bg-blue-700"
            style={{
              height: '36px',
              fontSize: '14px',
              fontWeight: 600,
              backgroundColor: '#0066FF',
              color: 'white',
            }}
          >
            <Plus className="w-4 h-4" />
            New Request
          </button>
        </div>

        {/* Year Summary Bar */}
        <div className="bg-white border-b px-6 py-3" style={{ borderColor: '#E5E7EB' }}>
          <div className="flex items-center gap-6 overflow-x-auto">
            {yearGroups.slice(0, 5).map(group => {
              const isCurrentYear = group.year === new Date().getFullYear();
              return (
                <button
                  key={group.year}
                  onClick={() => {
                    setFilterYear(group.year.toString());
                    setExpandedYears(new Set([group.year]));
                  }}
                  className="flex items-center gap-3 px-4 py-2 rounded-md transition-colors whitespace-nowrap"
                  style={{
                    backgroundColor: filterYear === group.year.toString() ? '#EFF6FF' : 'transparent',
                    border: filterYear === group.year.toString() ? '1px solid #0066FF' : '1px solid transparent',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', color: '#6B7280' }}>
                      {group.year}{isCurrentYear && ' (Current)'}
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>
                      {group.totalDays} days
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', color: '#6B7280' }}>
                    {group.requestCount} {group.requestCount === 1 ? 'request' : 'requests'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Annual Summary Card (2025 only) */}
        {currentYearBreakdown.length > 0 && (
          <div className="mx-6 mt-4 bg-white rounded-md border p-4" style={{ borderColor: '#E5E7EB' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '12px' }}>
              2025 Breakdown
            </div>
            <div className="flex gap-3">
              {currentYearBreakdown.map(([type, days]) => {
                const config = leaveTypeConfig[type as LeaveType];
                return (
                  <div
                    key={type}
                    className="flex-1 px-3 py-3 rounded"
                    style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ color: config.color }}>
                        {React.cloneElement(config.icon as React.ReactElement, { className: 'w-4 h-4' })}
                      </span>
                      <span style={{ fontSize: '12px', color: '#6B7280' }}>{type}</span>
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 600, color: '#111827' }}>
                      {days} {days === 1 ? 'day' : 'days'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div className="bg-white border-b px-6 py-3 flex items-center gap-3" style={{ borderColor: '#E5E7EB' }}>
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="px-3 rounded-md border hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all"
            style={{
              height: '36px',
              fontSize: '14px',
              borderColor: '#D1D5DB',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            }}
          >
            <option value="All Years">All Years</option>
            {yearGroups.map(group => (
              <option key={group.year} value={group.year}>
                {group.year} ({group.requestCount})
              </option>
            ))}
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-3 rounded-md border hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all"
            style={{
              height: '36px',
              fontSize: '14px',
              borderColor: '#D1D5DB',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            }}
          >
            <option value="All Types">All Types</option>
            {Object.keys(leaveTypeConfig).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 rounded-md border hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all"
            style={{
              height: '36px',
              fontSize: '14px',
              borderColor: '#D1D5DB',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            }}
          >
            <option value="All">All Status</option>
            <option value="Approved">Approved</option>
            <option value="Pending">Pending</option>
            <option value="Denied">Denied</option>
          </select>

          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: '#9CA3AF' }} />
            <input
              type="text"
              placeholder="Search leave requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 rounded-md border hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all"
              style={{
                height: '36px',
                fontSize: '14px',
                borderColor: '#D1D5DB',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              }}
            />
          </div>
        </div>

        {/* Leave Requests - Grouped by Year */}
        <div className="flex-1 overflow-auto px-6 py-4">
          {filteredYearGroups.length === 0 ? (
            <div className="text-center py-12">
              <div style={{ fontSize: '14px', color: '#6B7280' }}>
                No leave requests found
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredYearGroups.map(group => {
                const isExpanded = expandedYears.has(group.year);
                const showAll = showAllCards.has(group.year);
                const maxCards = 6;
                const displayedRequests = showAll ? group.requests : group.requests.slice(0, maxCards);
                const hasMore = group.requests.length > maxCards;
                
                return (
                  <div key={group.year}>
                    {/* Year Header */}
                    <button
                      onClick={() => toggleYear(group.year)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-md mb-3 hover:bg-gray-50 transition-colors"
                      style={{ border: '1px solid #E5E7EB' }}
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5" style={{ color: '#6B7280' }} />
                        ) : (
                          <ChevronRight className="w-5 h-5" style={{ color: '#6B7280' }} />
                        )}
                        <span style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>
                          {group.year}
                        </span>
                      </div>
                      <span style={{ fontSize: '13px', color: '#6B7280' }}>
                        {group.totalDays} days · {group.requestCount} {group.requestCount === 1 ? 'request' : 'requests'}
                      </span>
                    </button>

                    {/* Cards Grid */}
                    {isExpanded && (
                      <>
                        <div className="grid grid-cols-3 gap-4">
                          {displayedRequests.map((request) => {
                            const config = leaveTypeConfig[request.leaveType];
                            return (
                              <div
                                key={request.id}
                                className="bg-white rounded-md p-4 border hover:shadow-sm transition-shadow"
                                style={{ borderColor: '#E5E7EB' }}
                              >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <span style={{ color: config.color }}>
                                      {React.cloneElement(config.icon as React.ReactElement, { className: 'w-5 h-5' })}
                                    </span>
                                    <div>
                                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                                        {request.leaveType}
                                      </div>
                                    </div>
                                  </div>
                                  {request.status === 'Pending' && (
                                    <button
                                      onClick={() => handleDelete(request.id)}
                                      className="p-1 rounded hover:bg-red-50 transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" style={{ color: '#EF4444' }} />
                                    </button>
                                  )}
                                </div>

                                {/* Date */}
                                <div className="mb-3">
                                  <div style={{ fontSize: '13px', color: '#374151', marginBottom: '4px' }}>
                                    {formatDateRange(request.startDate, request.endDate)}
                                  </div>
                                  {request.duration !== 'Full Day' && (
                                    <div style={{ fontSize: '12px', color: '#6B7280' }}>
                                      {request.duration}
                                    </div>
                                  )}
                                </div>

                                {/* Days */}
                                <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '8px' }}>
                                  {request.calendarDays} {request.calendarDays === 1 ? 'day' : 'days'} ({request.workingDays} working)
                                </div>

                                {/* Notes */}
                                {request.notes && (
                                  <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '8px' }}>
                                    {request.notes}
                                  </div>
                                )}

                                {/* Status */}
                                <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: '#F3F4F6' }}>
                                  <span style={{ color: getStatusColor(request.status) }}>
                                    {getStatusIcon(request.status)}
                                  </span>
                                  <span style={{ fontSize: '13px', fontWeight: 500, color: getStatusColor(request.status) }}>
                                    {request.status}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Show More Button */}
                        {hasMore && (
                          <div className="flex justify-center mt-4">
                            <button
                              onClick={() => toggleShowAll(group.year)}
                              className="px-4 py-2 rounded-md border transition-colors hover:bg-gray-50"
                              style={{
                                fontSize: '14px',
                                fontWeight: 500,
                                color: '#0066FF',
                                borderColor: '#E5E7EB',
                              }}
                            >
                              {showAll ? 'Show less' : `+ ${group.requests.length - maxCards} more`}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Leave Request Modal */}
      {showRequestModal && (
        <LeaveRequestModal onClose={() => setShowRequestModal(false)} />
      )}
    </div>
  );
}