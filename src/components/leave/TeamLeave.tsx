import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Info, X, Calendar as CalendarIcon, FileText, BarChart3 } from 'lucide-react';
import { useLeave, leaveTypeConfig, LeaveType } from '../../contexts/LeaveContext';
import { TeamLeaveHistory } from './TeamLeaveHistory';
import { TeamLeaveReports } from './TeamLeaveReports';
import { Select } from '../ui/select';

type TabType = 'Calendar' | 'History' | 'Reports';

export function TeamLeave() {
  const { leaveRequests, users, isLoading } = useLeave();
  const [activeTab, setActiveTab] = useState<TabType>('Calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 10, 1)); // November 2025
  const [showLegend, setShowLegend] = useState(false);
  const [scope, setScope] = useState<'My Team' | 'My Department' | 'Company'>('Company');
  const [resolution, setResolution] = useState<'Week' | 'Month'>('Month');
  const [filterDepartment, setFilterDepartment] = useState<string>('All Departments');
  const [filterUser, setFilterUser] = useState<string>('All Users');
  const [filterLeaveType, setFilterLeaveType] = useState<string>('All Leave Types');

  console.log('TeamLeave: users count:', users.length);
  console.log('TeamLeave: users data:', users);

  // Get unique departments from users
  const departments = useMemo(() => {
    const depts = new Set(users.map(u => u.department).filter(Boolean));
    return Array.from(depts).sort();
  }, [users]);

  console.log('TeamLeave: departments:', departments);

  // Filter users based on scope
  const filteredUsers = useMemo(() => {
    let filtered = users;
    
    if (scope === 'My Team') {
      // Show only users in the same department as current user
      filtered = filtered.filter(u => u.department === 'Engineering');
    } else if (scope === 'My Department') {
      // Show all users in Engineering department
      filtered = filtered.filter(u => u.department === 'Engineering');
    }
    // If scope is 'Company', show all users
    
    // Apply department filter
    if (filterDepartment !== 'All Departments') {
      filtered = filtered.filter(u => u.department === filterDepartment);
    }
    
    // Apply user filter
    if (filterUser !== 'All Users') {
      filtered = filtered.filter(u => u.id === filterUser);
    }
    
    console.log('TeamLeave: filtered users count:', filtered.length);
    return filtered;
  }, [users, scope, filterDepartment, filterUser]);

  // Generate calendar days for current month
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push(date);
    }
    return days;
  }, [currentMonth]);

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getDayName = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Get leave for a specific user and date
  const getLeaveForUserAndDate = (userId: string, date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    
    return leaveRequests.find(req => {
      if (req.userId !== userId) return false;
      if (req.status !== 'Approved') return false;
      
      const start = new Date(req.startDate);
      const end = new Date(req.endDate);
      
      return date >= start && date <= end;
    });
  };

  // Check if leave is first or last day (for border radius)
  const getLeavePosition = (userId: string, date: Date, leave: any) => {
    if (!leave) return null;
    
    const dateStr = date.toISOString().split('T')[0];
    const isFirst = dateStr === leave.startDate;
    const isLast = dateStr === leave.endDate;
    
    return { isFirst, isLast, isSingle: isFirst && isLast };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#F9FAFB' }}>
      {/* Tab Navigation */}
      <div className="bg-white border-b flex items-center px-6" style={{ borderColor: '#E5E7EB' }}>
        {(['Calendar', 'History', 'Reports'] as TabType[]).map(tab => {
          const isActive = activeTab === tab;
          const Icon = tab === 'Calendar' ? CalendarIcon : tab === 'History' ? FileText : BarChart3;
          
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex items-center gap-2 px-4 border-b-2 transition-colors"
              style={{
                height: '48px',
                fontSize: '14px',
                fontWeight: 500,
                color: isActive ? '#0066FF' : '#6B7280',
                borderColor: isActive ? '#0066FF' : 'transparent',
              }}
            >
              <Icon className="w-4 h-4" />
              {tab}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'Calendar' && (
        <>
          {/* Filter Bar */}
          <div className="bg-white border-b flex items-center justify-between px-6" style={{ height: '56px', borderColor: '#E5E7EB', flexShrink: 0 }}>
            <div className="flex items-center gap-3">
              <Select
                value={scope}
                onChange={(value) => setScope(value as any)}
                options={[
                  { value: 'My Team', label: 'My Team' },
                  { value: 'My Department', label: 'My Department' },
                  { value: 'Company', label: 'Company' },
                ]}
              />
              <Select
                value={filterDepartment}
                onChange={(value) => setFilterDepartment(value)}
                options={[
                  { value: 'All Departments', label: 'All Departments' },
                  ...departments.map(dept => ({ value: dept, label: dept }))
                ]}
              />
              <Select
                value={filterUser}
                onChange={(value) => setFilterUser(value)}
                options={[
                  { value: 'All Users', label: 'All Users' },
                  ...users.map(user => ({ value: user.id, label: user.name }))
                ]}
              />
              <Select
                value={filterLeaveType}
                onChange={(value) => setFilterLeaveType(value)}
                options={[
                  { value: 'All Leave Types', label: 'All Leave Types' },
                  ...Object.keys(leaveTypeConfig).map(type => ({ value: type, label: type }))
                ]}
              />
              <Select
                value={resolution}
                onChange={(value) => setResolution(value as any)}
                options={[
                  { value: 'Week', label: 'Week' },
                  { value: 'Month', label: 'Month' },
                ]}
              />
              <button
                onClick={() => setShowLegend(!showLegend)}
                className="flex items-center gap-2 px-3 rounded-md border transition-colors"
                style={{
                  height: '34px',
                  fontSize: '13px',
                  fontWeight: 500,
                  borderColor: showLegend ? '#0066FF' : '#D1D5DB',
                  backgroundColor: showLegend ? '#EFF6FF' : 'white',
                  color: showLegend ? '#0066FF' : '#374151',
                }}
              >
                <Info className="w-4 h-4" />
                Legend
              </button>
            </div>

            {/* Month Navigation */}
            <div className="flex items-center gap-3">
              <button onClick={goToPreviousMonth} className="p-2 rounded hover:bg-gray-100">
                <ChevronLeft className="w-4 h-4" style={{ color: '#6B7280' }} />
              </button>
              <span style={{ fontSize: '15px', fontWeight: 600, color: '#111827', minWidth: '140px', textAlign: 'center' }}>
                {formatMonthYear(currentMonth)}
              </span>
              <button onClick={goToNextMonth} className="p-2 rounded hover:bg-gray-100">
                <ChevronRight className="w-4 h-4" style={{ color: '#6B7280' }} />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
            {/* Team Sidebar */}
            <div className="bg-white border-r" style={{ width: '240px', borderColor: '#E5E7EB', display: 'flex', flexDirection: 'column' }}>
              {/* Header */}
              <div 
                className="border-b flex items-center justify-end px-4"
                style={{ 
                  height: '48px',
                  borderColor: '#E5E7EB',
                }}
              >
                <span style={{ fontSize: '12px', color: '#6B7280' }}>
                  {formatMonthYear(currentMonth)}
                </span>
              </div>

              {/* User Rows */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {isLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <span style={{ fontSize: '14px', color: '#6B7280' }}>Loading...</span>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="flex items-center justify-center p-8">
                    <span style={{ fontSize: '14px', color: '#6B7280' }}>
                      No staff members found
                    </span>
                  </div>
                ) : (
                  filteredUsers.map(user => {
                    const initials = user.name
                      ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
                      : '?';
                    
                    return (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 px-4 border-b hover:bg-gray-50 transition-colors"
                        style={{ 
                          height: '48px',
                          borderColor: '#F3F4F6',
                        }}
                      >
                        <div 
                          className="flex items-center justify-center rounded-full text-white text-xs"
                          style={{
                            width: '32px',
                            height: '32px',
                            backgroundColor: '#0066FF',
                            fontWeight: 600,
                          }}
                        >
                          {initials}
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>
                          {user.name}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 overflow-auto">
              <div style={{ minWidth: `${calendarDays.length * 40}px` }}>
                {/* Date Headers */}
                <div className="bg-white border-b sticky top-0 z-10 flex" style={{ height: '48px', borderColor: '#E5E7EB' }}>
                  {calendarDays.map((date, idx) => (
                    <div
                      key={idx}
                      className="border-r flex flex-col items-center justify-center"
                      style={{
                        width: '40px',
                        borderColor: '#F3F4F6',
                        backgroundColor: isWeekend(date) ? '#F9FAFB' : 'white',
                      }}
                    >
                      <span style={{ fontSize: '11px', color: isWeekend(date) ? '#9CA3AF' : '#9CA3AF' }}>
                        {getDayName(date)}
                      </span>
                      <span 
                        className="flex items-center justify-center"
                        style={{ 
                          fontSize: '14px',
                          fontWeight: isToday(date) ? 600 : 400,
                          color: isToday(date) ? '#0066FF' : (isWeekend(date) ? '#9CA3AF' : '#111827'),
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: isToday(date) ? '#EFF6FF' : 'transparent',
                        }}
                      >
                        {date.getDate()}
                      </span>
                    </div>
                  ))}
                </div>

                {/* User Rows */}
                {filteredUsers.map(user => (
                  <div key={user.id} className="flex border-b" style={{ height: '48px', borderColor: '#F3F4F6' }}>
                    {calendarDays.map((date, idx) => {
                      const leave = getLeaveForUserAndDate(user.id, date);
                      const position = leave ? getLeavePosition(user.id, date, leave) : null;
                      const config = leave ? leaveTypeConfig[leave.leaveType] : null;
                      
                      return (
                        <div
                          key={idx}
                          className="border-r relative group"
                          style={{
                            width: '40px',
                            borderColor: '#F3F4F6',
                            backgroundColor: isWeekend(date) && !leave ? '#F9FAFB' : 'white',
                          }}
                        >
                          {leave && config && (
                            <>
                              <div
                                className="absolute inset-0 m-0.5"
                                style={{
                                  backgroundColor: config.color,
                                  opacity: 0.9,
                                  borderTopLeftRadius: position?.isFirst || position?.isSingle ? '4px' : '0',
                                  borderBottomLeftRadius: position?.isFirst || position?.isSingle ? '4px' : '0',
                                  borderTopRightRadius: position?.isLast || position?.isSingle ? '4px' : '0',
                                  borderBottomRightRadius: position?.isLast || position?.isSingle ? '4px' : '0',
                                }}
                              />
                              
                              {/* Tooltip on hover */}
                              <div 
                                className="absolute hidden group-hover:block z-20 px-3 py-2 rounded-md shadow-lg whitespace-nowrap"
                                style={{
                                  backgroundColor: '#111827',
                                  color: 'white',
                                  fontSize: '13px',
                                  top: '100%',
                                  left: '50%',
                                  transform: 'translateX(-50%)',
                                  marginTop: '4px',
                                }}
                              >
                                <div style={{ fontWeight: 600, marginBottom: '2px' }}>{user.name}</div>
                                <div className="flex items-center gap-1">
                                  <span style={{ color: config.color }}>
                                    {React.cloneElement(config.icon as React.ReactElement, { className: 'w-3 h-3' })}
                                  </span>
                                  <span>{leave.leaveType}</span>
                                </div>
                                <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px' }}>
                                  {new Date(leave.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - {new Date(leave.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} ({leave.calendarDays} day{leave.calendarDays !== 1 ? 's' : ''})
                                </div>
                                <div style={{ fontSize: '12px', opacity: 0.9 }}>
                                  ✓ {leave.status}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Legend Panel */}
          {showLegend && (
            <>
              <div 
                className="fixed inset-0 bg-black bg-opacity-20 z-30"
                onClick={() => setShowLegend(false)}
              />
              <div 
                className="fixed right-0 top-0 bottom-0 bg-white border-l z-40"
                style={{
                  width: '280px',
                  borderColor: '#E5E7EB',
                  boxShadow: '-4px 0 12px rgba(0,0,0,0.08)',
                }}
              >
                <div className="p-5">
                  <div className="flex items-center justify-between mb-6">
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>
                      Leave Types
                    </h3>
                    <button
                      onClick={() => setShowLegend(false)}
                      className="p-1 rounded hover:bg-gray-100"
                    >
                      <X className="w-4 h-4" style={{ color: '#6B7280' }} />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {Object.entries(leaveTypeConfig).map(([type, config]) => (
                      <div
                        key={type}
                        className="flex items-center gap-3 px-2 py-2 rounded hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div
                          className="rounded-full"
                          style={{
                            width: '10px',
                            height: '10px',
                            backgroundColor: config.color,
                          }}
                        />
                        <span style={{ color: config.color }}>
                          {config.icon}
                        </span>
                        <span style={{ fontSize: '13px', color: '#374151' }}>
                          {type}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div style={{ height: '1px', backgroundColor: '#E5E7EB', margin: '20px 0' }} />

                  <div className="space-y-2">
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
                      Other
                    </div>
                    <div className="flex items-center gap-3 px-2">
                      <div
                        className="rounded"
                        style={{
                          width: '24px',
                          height: '10px',
                          backgroundColor: '#F3F4F6',
                        }}
                      />
                      <span style={{ fontSize: '13px', color: '#6B7280' }}>
                        Weekend / Non-working
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {activeTab === 'History' && <TeamLeaveHistory />}
      
      {activeTab === 'Reports' && <TeamLeaveReports />}
    </div>
  );
}