/**
 * PendingApprovalsWidget - Connected to Real API
 * Displays pending approvals from Workdeck API
 */

import React, { useState, useMemo } from 'react';
import { Check, X, AlertCircle, Loader2, Calendar, DollarSign, Clock, FileText } from 'lucide-react';
import { WhatsPending, LeaveRequest } from '../../services/dashboard-api';
import { useWhatsPending, usePendingLeaveRequests } from '../../hooks/useApiQueries';

interface ApprovalItem {
  id: string;
  type: 'leave' | 'expense' | 'purchase' | 'timesheet';
  title: string;
  requestor: string;
  amount?: string;
  urgent?: boolean;
  date?: string;
  icon: any;
  color: string;
}

const TYPE_CONFIG = {
  leave: { icon: Calendar, color: '#8B5CF6', label: 'Leave Request' },
  expense: { icon: DollarSign, color: '#10B981', label: 'Expense' },
  purchase: { icon: FileText, color: '#F59E0B', label: 'Purchase' },
  timesheet: { icon: Clock, color: '#3B82F6', label: 'Timesheet' }
};

export function PendingApprovalsWidget() {
  const [localRemovals, setLocalRemovals] = useState<Set<string>>(new Set());
  const { data: pendingCounts = {} as WhatsPending, isLoading: pendingLoading, error: pendingError, refetch: refetchPending } = useWhatsPending();
  const { data: leaveRequests = [], isLoading: leaveLoading, error: leaveError, refetch: refetchLeave } = usePendingLeaveRequests();
  const isLoading = pendingLoading || leaveLoading;
  const error = (pendingError as Error)?.message || (leaveError as Error)?.message || null;
  const refetchAll = () => { refetchPending(); refetchLeave(); };

  const approvals = useMemo<ApprovalItem[]>(() => {
    const items: ApprovalItem[] = leaveRequests.map((req: LeaveRequest) => ({
      id: req.id,
      type: 'leave' as const,
      title: `${req.leaveType?.name || 'Leave'} - ${req.days} day${req.days !== 1 ? 's' : ''}`,
      requestor: req.user?.fullName || 'Unknown',
      date: `${req.startDate} - ${req.endDate}`,
      icon: TYPE_CONFIG.leave.icon,
      color: req.leaveType?.color || TYPE_CONFIG.leave.color
    }));

    if (pendingCounts.expenses && pendingCounts.expenses > 0) {
      items.push({ id: 'expense-summary', type: 'expense', title: `${pendingCounts.expenses} expense${pendingCounts.expenses !== 1 ? 's' : ''} pending`, requestor: 'View all', icon: TYPE_CONFIG.expense.icon, color: TYPE_CONFIG.expense.color });
    }
    if (pendingCounts.timesheets && pendingCounts.timesheets > 0) {
      items.push({ id: 'timesheet-summary', type: 'timesheet', title: `${pendingCounts.timesheets} timesheet${pendingCounts.timesheets !== 1 ? 's' : ''} pending`, requestor: 'View all', icon: TYPE_CONFIG.timesheet.icon, color: TYPE_CONFIG.timesheet.color });
    }

    return items.filter(a => !localRemovals.has(a.id));
  }, [leaveRequests, pendingCounts, localRemovals]);

  const totalPending = pendingCounts.total || approvals.length;

  const handleApprove = async (id: string) => {
    // TODO: Implement approval API call
    console.log('Approve:', id);
    setLocalRemovals(prev => new Set(prev).add(id));
  };

  const handleReject = async (id: string) => {
    console.log('Reject:', id);
    setLocalRemovals(prev => new Set(prev).add(id));
  };

  return (
    <div 
      className="bg-white rounded-lg relative overflow-hidden" 
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)', height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      {/* Colored top accent */}
      <div className="absolute left-0 right-0 top-0 h-1" style={{ background: 'linear-gradient(90deg, #F472B6 0%, #FBCFE8 100%)' }}></div>
      
      {/* Header */}
      <div className="px-3 py-2 border-b border-[#E5E7EB]" style={{ minHeight: '36px' }}>
        <div className="flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-[#F472B6]" />
          <h3 className="text-[14px] font-medium text-[#1F2937]">Pending Approvals</h3>
          <span className="w-4 h-4 rounded-full bg-[#F472B6] text-white text-[10px] font-bold flex items-center justify-center">
            {totalPending}
          </span>
        </div>
      </div>

      {/* Approvals list */}
      <div className="px-3 py-1.5 custom-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin mb-2" />
            <span className="text-xs text-gray-500">Loading approvals...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="w-6 h-6 text-red-400 mb-2" />
            <span className="text-xs text-red-500">{error}</span>
            <button 
              onClick={refetchAll}
              className="mt-2 text-xs text-blue-500 hover:underline"
            >
              Retry
            </button>
          </div>
        ) : approvals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-2">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm font-medium text-green-600">All caught up!</span>
            <span className="text-xs text-gray-500 mt-1">No pending approvals</span>
          </div>
        ) : (
          <div className="space-y-1.5">
            {approvals.map((approval) => {
              const Icon = approval.icon;
              return (
                <div 
                  key={approval.id}
                  className="bg-[#FAFAFA] rounded-lg p-2 border border-[#F3F4F6] cursor-pointer hover:shadow-sm transition-all"
                >
                  <div className="flex items-start gap-2 mb-1.5">
                    <div 
                      className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${approval.color}20` }}
                    >
                      <Icon className="w-3.5 h-3.5" style={{ color: approval.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-[#1F2937] leading-tight truncate">
                        {approval.title}
                      </p>
                      <p className="text-[10px] text-[#9CA3AF] mt-0.5">
                        {approval.requestor}
                        {approval.date && ` • ${approval.date}`}
                      </p>
                    </div>
                    {approval.urgent && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 bg-[#FEE2E2] text-[#DC2626] rounded flex-shrink-0">
                        URGENT
                      </span>
                    )}
                  </div>
                  
                  {/* Only show action buttons for actual approvals, not summaries */}
                  {!approval.id.includes('summary') && (
                    <div className="flex gap-2 justify-between">
                      <button 
                        onClick={() => handleApprove(approval.id)}
                        className="flex-1 bg-[#34D399] hover:bg-[#10B981] text-white text-[11px] font-medium px-3 py-1 rounded-lg flex items-center justify-center gap-1 transition-colors"
                      >
                        <Check className="w-3 h-3" />
                        Approve
                      </button>
                      <button 
                        onClick={() => handleReject(approval.id)}
                        className="flex-1 bg-[#F87171] hover:bg-[#EF4444] text-white text-[11px] font-medium px-3 py-1 rounded-lg flex items-center justify-center gap-1 transition-colors"
                      >
                        <X className="w-3 h-3" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="px-3 py-1.5 border-t border-[#E5E7EB] flex items-center justify-between" style={{ minHeight: '30px' }}>
        <button className="text-[11px] text-[#9CA3AF] hover:text-[#111827]">
          Settings
        </button>
        <button 
          onClick={refetchAll}
          className="text-[11px] text-[#3B82F6] hover:text-[#2563EB]"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
