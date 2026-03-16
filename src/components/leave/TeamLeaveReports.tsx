import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useLeave, leaveTypeConfig } from '../../contexts/LeaveContext';
import { AlertTriangle, Check } from 'lucide-react';

export function TeamLeaveReports() {
  const { leaveRequests, users } = useLeave();
  const currentYear = new Date().getFullYear();

  // Leave by employee
  const leaveByEmployee = useMemo(() => {
    const stats: Record<string, {
      name: string;
      holidays: number;
      sick: number;
      wfh: number;
      other: number;
      total: number;
    }> = {};

    leaveRequests.forEach(req => {
      if (new Date(req.startDate).getFullYear() !== currentYear || req.status !== 'Approved') return;
      
      if (!stats[req.userId]) {
        stats[req.userId] = {
          name: req.userName,
          holidays: 0,
          sick: 0,
          wfh: 0,
          other: 0,
          total: 0,
        };
      }

      if (req.leaveType === 'Holidays') {
        stats[req.userId].holidays += req.workingDays;
      } else if (req.leaveType === 'Sick') {
        stats[req.userId].sick += req.workingDays;
      } else if (req.leaveType === 'Work from Home') {
        stats[req.userId].wfh += req.workingDays;
      } else {
        stats[req.userId].other += req.workingDays;
      }
      
      stats[req.userId].total += req.workingDays;
    });

    return Object.values(stats).sort((a, b) => b.total - a.total);
  }, [leaveRequests, currentYear]);

  // Leave by month
  const leaveByMonth = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const stats = monthNames.map((name, idx) => ({
      month: name,
      days: 0,
    }));

    leaveRequests.forEach(req => {
      if (new Date(req.startDate).getFullYear() !== currentYear || req.status !== 'Approved') return;
      
      const month = new Date(req.startDate).getMonth();
      stats[month].days += req.workingDays;
    });

    return stats;
  }, [leaveRequests, currentYear]);

  // Remaining balances
  const balanceStats = useMemo(() => {
    const highBalance = users.filter(u => u.holidayBalance >= 10).length;
    const avgBalance = users.reduce((sum, u) => sum + u.holidayBalance, 0) / users.length;
    
    return { highBalance, avgBalance: avgBalance.toFixed(1) };
  }, [users]);

  // Leave by type
  const leaveByType = useMemo(() => {
    const stats: Record<string, number> = {};

    leaveRequests.forEach(req => {
      if (new Date(req.startDate).getFullYear() !== currentYear || req.status !== 'Approved') return;
      
      stats[req.leaveType] = (stats[req.leaveType] || 0) + req.workingDays;
    });

    return Object.entries(stats)
      .map(([type, days]) => ({ type, days }))
      .sort((a, b) => b.days - a.days);
  }, [leaveRequests, currentYear]);

  return (
    <div className="h-full overflow-auto" style={{ backgroundColor: '#F9FAFB' }}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
              Team Leave Reports
            </h2>
            <div style={{ fontSize: '14px', color: '#6B7280' }}>
              {currentYear} Overview
            </div>
          </div>
          
          <select
            className="px-3 rounded-md border hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all"
            style={{
              height: '36px',
              fontSize: '14px',
              borderColor: '#D1D5DB',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            }}
          >
            <option value={currentYear}>{currentYear}</option>
            <option value={currentYear - 1}>{currentYear - 1}</option>
            <option value={currentYear - 2}>{currentYear - 2}</option>
          </select>
        </div>

        {/* Leave by Employee */}
        <div className="bg-white rounded-md border p-5" style={{ borderColor: '#E5E7EB' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '16px' }}>
            Leave by Employee
          </h3>
          
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: '#E5E7EB' }}>
                <th className="px-3 py-2 text-left" style={{ fontSize: '13px', fontWeight: 600, color: '#6B7280' }}>
                  Employee
                </th>
                <th className="px-3 py-2 text-right" style={{ fontSize: '13px', fontWeight: 600, color: '#6B7280' }}>
                  Holidays
                </th>
                <th className="px-3 py-2 text-right" style={{ fontSize: '13px', fontWeight: 600, color: '#6B7280' }}>
                  Sick
                </th>
                <th className="px-3 py-2 text-right" style={{ fontSize: '13px', fontWeight: 600, color: '#6B7280' }}>
                  WFH
                </th>
                <th className="px-3 py-2 text-right" style={{ fontSize: '13px', fontWeight: 600, color: '#6B7280' }}>
                  Other
                </th>
                <th className="px-3 py-2 text-right" style={{ fontSize: '13px', fontWeight: 600, color: '#6B7280' }}>
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {leaveByEmployee.map((employee, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50" style={{ borderColor: '#F3F4F6' }}>
                  <td className="px-3 py-3" style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>
                    {employee.name}
                  </td>
                  <td className="px-3 py-3 text-right" style={{ fontSize: '14px', color: '#374151' }}>
                    {employee.holidays || '-'}
                  </td>
                  <td className="px-3 py-3 text-right" style={{ fontSize: '14px', color: '#374151' }}>
                    {employee.sick || '-'}
                  </td>
                  <td className="px-3 py-3 text-right" style={{ fontSize: '14px', color: '#374151' }}>
                    {employee.wfh || '-'}
                  </td>
                  <td className="px-3 py-3 text-right" style={{ fontSize: '14px', color: '#374151' }}>
                    {employee.other || '-'}
                  </td>
                  <td className="px-3 py-3 text-right" style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                    {employee.total} days
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Leave by Month */}
        <div className="bg-white rounded-md border p-5" style={{ borderColor: '#E5E7EB' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '16px' }}>
            Leave by Month
          </h3>
          
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={leaveByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="month" 
                tick={{ fill: '#6B7280', fontSize: 12 }}
                stroke="#E5E7EB"
              />
              <YAxis 
                tick={{ fill: '#6B7280', fontSize: 12 }}
                stroke="#E5E7EB"
                label={{ value: 'Days', angle: -90, position: 'insideLeft', fill: '#6B7280', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#111827', 
                  border: 'none', 
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: 'white',
                }}
                labelStyle={{ color: 'white' }}
              />
              <Bar dataKey="days" fill="#0066FF" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Two Column Section */}
        <div className="grid grid-cols-2 gap-6">
          {/* Leave by Type */}
          <div className="bg-white rounded-md border p-5" style={{ borderColor: '#E5E7EB' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '16px' }}>
              Leave by Type
            </h3>
            
            <div className="space-y-3">
              {leaveByType.map((item, idx) => {
                const config = leaveTypeConfig[item.type as keyof typeof leaveTypeConfig];
                const total = leaveByType.reduce((sum, i) => sum + i.days, 0);
                const percentage = ((item.days / total) * 100).toFixed(0);
                
                return (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span style={{ color: config.color }}>
                          {React.cloneElement(config.icon as React.ReactElement, { className: 'w-4 h-4' })}
                        </span>
                        <span style={{ fontSize: '14px', color: '#374151' }}>
                          {item.type}
                        </span>
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                        {item.days} days ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: config.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Remaining Balances */}
          <div className="bg-white rounded-md border p-5" style={{ borderColor: '#E5E7EB' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '16px' }}>
              Remaining Balances
            </h3>
            
            <div className="space-y-4">
              {balanceStats.highBalance > 0 && (
                <div className="flex items-start gap-3 p-3 rounded" style={{ backgroundColor: '#FEF3C7' }}>
                  <AlertTriangle className="w-5 h-5 mt-0.5" style={{ color: '#92400E' }} />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#92400E', marginBottom: '2px' }}>
                      {balanceStats.highBalance} {balanceStats.highBalance === 1 ? 'employee has' : 'employees have'} 10+ days remaining
                    </div>
                    <div style={{ fontSize: '13px', color: '#92400E' }}>
                      Consider encouraging leave usage before year end
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex items-start gap-3 p-3 rounded" style={{ backgroundColor: '#ECFDF5', border: '1px solid #D1FAE5' }}>
                <Check className="w-5 h-5 mt-0.5" style={{ color: '#047857' }} />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#047857', marginBottom: '2px' }}>
                    Average: {balanceStats.avgBalance} days remaining
                  </div>
                  <div style={{ fontSize: '13px', color: '#047857' }}>
                    Team is on track with leave usage
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t" style={{ borderColor: '#E5E7EB' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '12px' }}>
                  Individual Balances
                </div>
                <div className="space-y-2">
                  {users.map(user => (
                    <div key={user.id} className="flex items-center justify-between">
                      <span style={{ fontSize: '13px', color: '#374151' }}>
                        {user.name}
                      </span>
                      <span 
                        className="px-2 py-1 rounded"
                        style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: user.holidayBalance >= 10 ? '#92400E' : '#047857',
                          backgroundColor: user.holidayBalance >= 10 ? '#FEF3C7' : '#D1FAE5',
                        }}
                      >
                        {user.holidayBalance} days
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}