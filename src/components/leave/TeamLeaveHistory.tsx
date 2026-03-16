import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { useLeave, leaveTypeConfig } from '../../contexts/LeaveContext';

export function TeamLeaveHistory() {
  const { leaveRequests, users } = useLeave();
  const [dateRange, setDateRange] = useState<string>('This Year');
  const [filterUser, setFilterUser] = useState<string>('All Users');
  const [filterType, setFilterType] = useState<string>('All Types');
  const [filterStatus, setFilterStatus] = useState<string>('All Status');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Calculate date range
  const getDateRange = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    
    switch (dateRange) {
      case 'This Month':
        return {
          start: new Date(currentYear, today.getMonth(), 1),
          end: new Date(currentYear, today.getMonth() + 1, 0),
        };
      case 'Last 3 Months':
        return {
          start: new Date(currentYear, today.getMonth() - 3, 1),
          end: today,
        };
      case 'This Quarter':
        const quarter = Math.floor(today.getMonth() / 3);
        return {
          start: new Date(currentYear, quarter * 3, 1),
          end: new Date(currentYear, (quarter + 1) * 3, 0),
        };
      case 'This Year':
        return {
          start: new Date(currentYear, 0, 1),
          end: new Date(currentYear, 11, 31),
        };
      case 'Last Year':
        return {
          start: new Date(currentYear - 1, 0, 1),
          end: new Date(currentYear - 1, 11, 31),
        };
      default:
        return { start: new Date(2020, 0, 1), end: today };
    }
  };

  // Filter leave requests
  const filteredRequests = useMemo(() => {
    const { start, end } = getDateRange();
    
    let filtered = leaveRequests.filter(req => {
      const reqDate = new Date(req.startDate);
      return reqDate >= start && reqDate <= end;
    });

    if (filterUser !== 'All Users') {
      filtered = filtered.filter(req => req.userId === filterUser);
    }

    if (filterType !== 'All Types') {
      filtered = filtered.filter(req => req.leaveType === filterType);
    }

    if (filterStatus !== 'All Status') {
      filtered = filtered.filter(req => req.status === filterStatus);
    }

    return filtered.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [leaveRequests, dateRange, filterUser, filterType, filterStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (start === end) {
      return startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    
    return `${startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return '#10B981';
      case 'Pending': return '#F59E0B';
      case 'Denied': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: '#F9FAFB' }}>
      {/* Filter Bar */}
      <div className="bg-white border-b px-6 py-3 flex items-center justify-between" style={{ borderColor: '#E5E7EB' }}>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => {
              setDateRange(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 rounded-md border hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all"
            style={{
              height: '36px',
              fontSize: '14px',
              borderColor: '#D1D5DB',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            }}
          >
            <option value="This Month">This Month</option>
            <option value="Last 3 Months">Last 3 Months</option>
            <option value="This Quarter">This Quarter</option>
            <option value="This Year">This Year</option>
            <option value="Last Year">Last Year</option>
            <option value="All Time">All Time</option>
          </select>

          <select
            value={filterUser}
            onChange={(e) => {
              setFilterUser(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 rounded-md border hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all"
            style={{
              height: '36px',
              fontSize: '14px',
              borderColor: '#D1D5DB',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            }}
          >
            <option value="All Users">All Users</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </select>

          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setCurrentPage(1);
            }}
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
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 rounded-md border hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all"
            style={{
              height: '36px',
              fontSize: '14px',
              borderColor: '#D1D5DB',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            }}
          >
            <option value="All Status">All Status</option>
            <option value="Approved">Approved</option>
            <option value="Pending">Pending</option>
            <option value="Denied">Denied</option>
          </select>
        </div>

        <button
          className="flex items-center gap-2 px-3 rounded-md border transition-colors hover:bg-gray-50"
          style={{
            height: '36px',
            fontSize: '14px',
            fontWeight: 500,
            borderColor: '#D1D5DB',
            color: '#374151',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          }}
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="bg-white border-b sticky top-0" style={{ borderColor: '#E5E7EB' }}>
            <tr>
              <th className="px-6 py-3 text-left" style={{ fontSize: '13px', fontWeight: 600, color: '#6B7280' }}>
                Employee
              </th>
              <th className="px-6 py-3 text-left" style={{ fontSize: '13px', fontWeight: 600, color: '#6B7280' }}>
                Type
              </th>
              <th className="px-6 py-3 text-left" style={{ fontSize: '13px', fontWeight: 600, color: '#6B7280' }}>
                Dates
              </th>
              <th className="px-6 py-3 text-left" style={{ fontSize: '13px', fontWeight: 600, color: '#6B7280' }}>
                Days
              </th>
              <th className="px-6 py-3 text-left" style={{ fontSize: '13px', fontWeight: 600, color: '#6B7280' }}>
                Status
              </th>
              <th className="px-6 py-3 text-left" style={{ fontSize: '13px', fontWeight: 600, color: '#6B7280' }}>
                Notes
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedRequests.map((request, idx) => {
              const config = leaveTypeConfig[request.leaveType];
              const user = users.find(u => u.id === request.userId);
              
              return (
                <tr
                  key={request.id}
                  className="border-b hover:bg-gray-50 transition-colors"
                  style={{ borderColor: '#F3F4F6' }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="flex items-center justify-center rounded-full text-white text-xs"
                        style={{
                          width: '32px',
                          height: '32px',
                          backgroundColor: '#0066FF',
                          fontWeight: 600,
                        }}
                      >
                        {user?.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>
                          {request.userName}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6B7280' }}>
                          {user?.department}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span style={{ color: config.color }}>
                        {React.cloneElement(config.icon as React.ReactElement, { className: 'w-4 h-4' })}
                      </span>
                      <span style={{ fontSize: '14px', color: '#374151' }}>
                        {request.leaveType}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div style={{ fontSize: '14px', color: '#374151' }}>
                      {formatDateRange(request.startDate, request.endDate)}
                    </div>
                    {request.duration !== 'Full Day' && (
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>
                        {request.duration}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div style={{ fontSize: '14px', color: '#374151' }}>
                      {request.calendarDays} ({request.workingDays})
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className="px-2 py-1 rounded-full"
                      style={{
                        fontSize: '12px',
                        fontWeight: 500,
                        color: getStatusColor(request.status),
                        backgroundColor: `${getStatusColor(request.status)}15`,
                      }}
                    >
                      {request.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div style={{ fontSize: '13px', color: '#6B7280', maxWidth: '200px' }} className="truncate">
                      {request.notes || '-'}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="bg-white border-t px-6 py-3 flex items-center justify-between" style={{ borderColor: '#E5E7EB' }}>
        <div style={{ fontSize: '14px', color: '#6B7280' }}>
          Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredRequests.length)} of {filteredRequests.length} records
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded border transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            style={{
              fontSize: '14px',
              borderColor: '#E5E7EB',
            }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <span style={{ fontSize: '14px', color: '#374151' }}>
            Page {currentPage} of {totalPages || 1}
          </span>
          
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="px-3 py-1 rounded border transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            style={{
              fontSize: '14px',
              borderColor: '#E5E7EB',
            }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}