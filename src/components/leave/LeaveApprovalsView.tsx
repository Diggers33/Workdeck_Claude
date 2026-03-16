import React, { useState, useMemo } from 'react';
import { ArrowLeft, Search, Filter, CheckSquare, Square, Check, X as XIcon, AlertCircle, Clock, Calendar, ChevronDown, Download } from 'lucide-react';
import { useLeave, LeaveRequest, leaveTypeConfig } from '../../contexts/LeaveContext';
import { LeaveApprovalDetail } from './LeaveApprovalDetail';
import { Select } from '../ui/select';
import { toast } from 'sonner@2.0.3';

export function LeaveApprovalsView() {
  const { leaveRequests, users, approveLeaveRequest, denyLeaveRequest } = useLeave();
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('All Departments');
  const [filterLeaveType, setFilterLeaveType] = useState('All Leave Types');
  const [filterDateRange, setFilterDateRange] = useState('All Dates');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'earliest-start'>('newest');

  console.log('LeaveApprovalsView rendering', { leaveRequests, users });

  // Get pending requests
  const pendingRequests = useMemo(() => {
    let filtered = leaveRequests.filter(req => req.status === 'Pending');

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(req => {
        const employee = users.find(u => u.id === req.userId);
        return employee?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
               req.leaveType.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    // Department filter
    if (filterDepartment !== 'All Departments') {
      filtered = filtered.filter(req => {
        const employee = users.find(u => u.id === req.userId);
        return employee?.department === filterDepartment;
      });
    }

    // Leave type filter
    if (filterLeaveType !== 'All Leave Types') {
      filtered = filtered.filter(req => req.leaveType === filterLeaveType);
    }

    // Date range filter
    if (filterDateRange !== 'All Dates') {
      const now = new Date();
      filtered = filtered.filter(req => {
        const startDate = new Date(req.startDate);
        if (filterDateRange === 'This Week') {
          const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          return startDate <= weekEnd;
        } else if (filterDateRange === 'This Month') {
          return startDate.getMonth() === now.getMonth() && startDate.getFullYear() === now.getFullYear();
        } else if (filterDateRange === 'Next Month') {
          const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          return startDate.getMonth() === nextMonth.getMonth() && startDate.getFullYear() === nextMonth.getFullYear();
        }
        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime();
      } else if (sortBy === 'oldest') {
        return new Date(a.submittedDate).getTime() - new Date(b.submittedDate).getTime();
      } else {
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      }
    });

    return filtered;
  }, [leaveRequests, users, searchQuery, filterDepartment, filterLeaveType, filterDateRange, sortBy]);

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === pendingRequests.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingRequests.map(req => req.id)));
    }
  };

  const handleBulkApprove = () => {
    if (selectedIds.size === 0) return;

    selectedIds.forEach(id => {
      approveLeaveRequest(id);
    });

    toast.success(`✓ Approved ${selectedIds.size} leave ${selectedIds.size === 1 ? 'request' : 'requests'}`);
    setSelectedIds(new Set());
  };

  const handleBulkDeny = () => {
    if (selectedIds.size === 0) return;

    // In a real app, this would open a modal to collect denial reason
    const reason = prompt('Provide a reason for denying these requests:');
    if (!reason) return;

    selectedIds.forEach(id => {
      denyLeaveRequest(id, reason);
    });

    toast.error(`✗ Denied ${selectedIds.size} leave ${selectedIds.size === 1 ? 'request' : 'requests'}`);
    setSelectedIds(new Set());
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (start === end) {
      return startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    
    return `${startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  const getDaysUntilStart = (startDate: string) => {
    const start = new Date(startDate);
    const now = new Date();
    const diff = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diff < 0) return 'Started';
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    return `In ${diff} days`;
  };

  const getUrgencyColor = (startDate: string) => {
    const start = new Date(startDate);
    const now = new Date();
    const diff = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diff <= 2) return '#EF4444'; // Red - urgent
    if (diff <= 7) return '#F59E0B'; // Amber - soon
    return '#6B7280'; // Gray - normal
  };

  return (
    <div className="h-full flex flex-col relative" style={{ backgroundColor: '#F9FAFB' }}>
      {/* Header Bar */}
      <div className="bg-white border-b flex items-center justify-between px-6" style={{ height: '64px', borderColor: '#E5E7EB' }}>
        <div className="flex items-center gap-3">
          <button className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl" style={{ fontWeight: 600, color: '#111827' }}>
              Leave Approvals
            </h1>
            <p style={{ fontSize: '13px', color: '#6B7280' }}>
              Review and approve team leave requests
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {selectedIds.size > 0 && (
            <>
              <button
                onClick={handleBulkDeny}
                className="px-4 border rounded-md transition-colors hover:bg-red-50"
                style={{
                  height: '36px',
                  fontSize: '14px',
                  fontWeight: 500,
                  borderColor: '#DC2626',
                  color: '#DC2626',
                }}
              >
                <XIcon className="w-4 h-4 inline mr-1" />
                Deny ({selectedIds.size})
              </button>
              <button
                onClick={handleBulkApprove}
                className="px-4 rounded-md transition-colors"
                style={{
                  height: '36px',
                  fontSize: '14px',
                  fontWeight: 600,
                  backgroundColor: '#059669',
                  color: 'white',
                }}
              >
                <Check className="w-4 h-4 inline mr-1" />
                Approve ({selectedIds.size})
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b px-6 py-4" style={{ borderColor: '#E5E7EB' }}>
        <div className="grid grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FEE2E2' }}>
            <div className="flex items-center justify-center rounded-lg" style={{ width: '40px', height: '40px', backgroundColor: '#FEE2E2' }}>
              <AlertCircle className="w-5 h-5" style={{ color: '#DC2626' }} />
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#DC2626' }}>
                {pendingRequests.length}
              </div>
              <div style={{ fontSize: '13px', color: '#991B1B' }}>
                Pending Requests
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: '#FEF3C7', border: '1px solid #FDE68A' }}>
            <div className="flex items-center justify-center rounded-lg" style={{ width: '40px', height: '40px', backgroundColor: '#FDE68A' }}>
              <Clock className="w-5 h-5" style={{ color: '#D97706' }} />
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#D97706' }}>
                {pendingRequests.filter(req => {
                  const diff = Math.ceil((new Date(req.startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  return diff <= 7;
                }).length}
              </div>
              <div style={{ fontSize: '13px', color: '#92400E' }}>
                Starting This Week
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0' }}>
            <div className="flex items-center justify-center rounded-lg" style={{ width: '40px', height: '40px', backgroundColor: '#A7F3D0' }}>
              <Check className="w-5 h-5" style={{ color: '#059669' }} />
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#059669' }}>
                {leaveRequests.filter(req => req.status === 'Approved').length}
              </div>
              <div style={{ fontSize: '13px', color: '#065F46' }}>
                Approved This Month
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB' }}>
            <div className="flex items-center justify-center rounded-lg" style={{ width: '40px', height: '40px', backgroundColor: '#E5E7EB' }}>
              <Calendar className="w-5 h-5" style={{ color: '#6B7280' }} />
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#374151' }}>
                {Math.round(pendingRequests.reduce((sum, req) => sum + req.workingDays, 0))}
              </div>
              <div style={{ fontSize: '13px', color: '#6B7280' }}>
                Total Days Requested
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white border-b px-6 py-4" style={{ borderColor: '#E5E7EB' }}>
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#9CA3AF' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by employee name or leave type..."
              className="w-full pl-10 pr-4 py-2 border rounded-md"
              style={{
                fontSize: '14px',
                borderColor: '#E5E7EB',
              }}
            />
          </div>

          {/* Filters */}
          <Select
            value={filterDepartment}
            onChange={setFilterDepartment}
            options={[
              { value: 'All Departments', label: 'All Departments' },
              { value: 'Engineering', label: 'Engineering' },
              { value: 'Product', label: 'Product' },
              { value: 'Design', label: 'Design' },
              { value: 'Marketing', label: 'Marketing' },
            ]}
          />

          <Select
            value={filterLeaveType}
            onChange={setFilterLeaveType}
            options={[
              { value: 'All Leave Types', label: 'All Leave Types' },
              ...Object.keys(leaveTypeConfig).map(type => ({ value: type, label: type }))
            ]}
          />

          <Select
            value={filterDateRange}
            onChange={setFilterDateRange}
            options={[
              { value: 'All Dates', label: 'All Dates' },
              { value: 'This Week', label: 'This Week' },
              { value: 'This Month', label: 'This Month' },
              { value: 'Next Month', label: 'Next Month' },
            ]}
          />

          <Select
            value={sortBy}
            onChange={(value) => setSortBy(value as any)}
            options={[
              { value: 'newest', label: 'Newest First' },
              { value: 'oldest', label: 'Oldest First' },
              { value: 'earliest-start', label: 'Earliest Start' },
            ]}
          />

          <button
            className="px-3 border rounded-md transition-colors hover:bg-gray-50"
            style={{
              height: '36px',
              borderColor: '#E5E7EB',
            }}
          >
            <Download className="w-4 h-4" style={{ color: '#6B7280' }} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {pendingRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#ECFDF5' }}>
                <Check className="w-8 h-8" style={{ color: '#059669' }} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
                All caught up!
              </h3>
              <p style={{ fontSize: '14px', color: '#6B7280' }}>
                No pending leave requests to review
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white mx-6 my-4 border rounded-lg overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
            {/* Table Header */}
            <div className="grid gap-4 px-4 py-3 border-b" style={{ 
              gridTemplateColumns: '40px 1fr 180px 180px 120px 140px 120px',
              borderColor: '#F3F4F6',
              backgroundColor: '#F9FAFB',
            }}>
              <div className="flex items-center">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center justify-center w-5 h-5 rounded border transition-colors"
                  style={{
                    borderColor: selectedIds.size > 0 ? '#0066FF' : '#D1D5DB',
                    backgroundColor: selectedIds.size > 0 ? '#0066FF' : 'white',
                  }}
                >
                  {selectedIds.size > 0 && (
                    <Check className="w-3 h-3" style={{ color: 'white' }} />
                  )}
                </button>
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Employee
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Leave Type
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Dates
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Duration
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Submitted
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Actions
              </div>
            </div>

            {/* Table Rows */}
            {pendingRequests.map((request) => {
              const employee = users.find(u => u.id === request.userId);
              const config = leaveTypeConfig[request.leaveType];
              const isSelected = selectedIds.has(request.id);
              const urgencyColor = getUrgencyColor(request.startDate);
              const daysUntil = getDaysUntilStart(request.startDate);
              
              return (
                <div
                  key={request.id}
                  onClick={() => setSelectedRequest(request)}
                  className="grid gap-4 px-4 py-3 border-b hover:bg-gray-50 cursor-pointer transition-colors"
                  style={{ 
                    gridTemplateColumns: '40px 1fr 180px 180px 120px 140px 120px',
                    borderColor: '#F3F4F6',
                  }}
                >
                  <div className="flex items-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelection(request.id);
                      }}
                      className="flex items-center justify-center w-5 h-5 rounded border transition-colors"
                      style={{
                        borderColor: isSelected ? '#0066FF' : '#D1D5DB',
                        backgroundColor: isSelected ? '#0066FF' : 'white',
                      }}
                    >
                      {isSelected && (
                        <Check className="w-3 h-3" style={{ color: 'white' }} />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <div 
                      className="flex items-center justify-center rounded-full text-white"
                      style={{
                        width: '36px',
                        height: '36px',
                        backgroundColor: '#0066FF',
                        fontSize: '13px',
                        fontWeight: 600,
                      }}
                    >
                      {employee?.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                        {employee?.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>
                        {employee?.department}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span style={{ color: config.color }}>
                      {config.icon}
                    </span>
                    <span style={{ fontSize: '13px', color: '#374151' }}>
                      {request.leaveType}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <div>
                      <div style={{ fontSize: '13px', color: '#111827' }}>
                        {formatDateRange(request.startDate, request.endDate)}
                      </div>
                      <div 
                        className="inline-block px-1.5 py-0.5 rounded text-xs mt-1"
                        style={{ 
                          backgroundColor: urgencyColor === '#EF4444' ? '#FEE2E2' : urgencyColor === '#F59E0B' ? '#FEF3C7' : '#F3F4F6',
                          color: urgencyColor,
                          fontWeight: 600,
                        }}
                      >
                        {daysUntil}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                        {request.workingDays} days
                      </div>
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>
                        ({request.calendarDays} calendar)
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div>
                      <div style={{ fontSize: '13px', color: '#111827' }}>
                        {new Date(request.submittedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>
                        {Math.ceil((Date.now() - new Date(request.submittedDate).getTime()) / (1000 * 60 * 60 * 24))} days ago
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRequest(request);
                      }}
                      className="flex-1 px-2 py-1.5 border rounded-md text-xs transition-colors hover:bg-gray-50"
                      style={{
                        borderColor: '#E5E7EB',
                        color: '#0066FF',
                        fontWeight: 600,
                      }}
                    >
                      Review
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Approval Detail Panel */}
      {selectedRequest && (
        <LeaveApprovalDetail 
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
        />
      )}
    </div>
  );
}