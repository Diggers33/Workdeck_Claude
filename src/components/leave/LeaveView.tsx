import React, { useState } from 'react';
import { CalendarDays, Users, CheckSquare } from 'lucide-react';
import { MyLeave } from './MyLeave';
import { TeamLeave } from './TeamLeave';
import { LeaveApprovalsView } from './LeaveApprovalsView';
import { useLeave } from '../../contexts/LeaveContext';

type Tab = 'my-leave' | 'team-leave' | 'approvals';

export function LeaveView() {
  const [activeTab, setActiveTab] = useState<Tab>('my-leave');
  const { leaveRequests } = useLeave();

  const pendingCount = leaveRequests.filter(r => r.status === 'Pending').length;

  const tabStyle = (tab: Tab): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 16px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.15s',
    backgroundColor: activeTab === tab ? 'white' : 'transparent',
    color: activeTab === tab ? '#111827' : '#6B7280',
    boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
  });

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Tab bar */}
      <div style={{ padding: '16px 24px 0', borderBottom: '1px solid #E5E7EB', backgroundColor: 'white' }}>
        <div
          className="flex items-center gap-1 rounded-lg p-1"
          style={{ backgroundColor: '#F3F4F6', width: 'fit-content', marginBottom: '0' }}
        >
          <button onClick={() => setActiveTab('my-leave')} style={tabStyle('my-leave')}>
            <CalendarDays size={14} />
            My Leave
          </button>
          <button onClick={() => setActiveTab('team-leave')} style={tabStyle('team-leave')}>
            <Users size={14} />
            Team Leave
          </button>
          <button onClick={() => setActiveTab('approvals')} style={tabStyle('approvals')}>
            <CheckSquare size={14} />
            Approvals
            {pendingCount > 0 && (
              <span
                style={{
                  padding: '1px 7px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  backgroundColor: '#DBEAFE',
                  color: '#1D4ED8',
                  fontWeight: 600,
                }}
              >
                {pendingCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'my-leave' && <MyLeave />}
        {activeTab === 'team-leave' && <TeamLeave />}
        {activeTab === 'approvals' && <LeaveApprovalsView />}
      </div>
    </div>
  );
}
