import React from 'react';
import { RefreshCw, Check, AlertTriangle, XIcon, Settings } from 'lucide-react';

interface SyncCalendar {
  name: string;
  status: 'synced' | 'syncing' | 'warning' | 'error';
  lastSync: string;
}

interface SyncStatus {
  status: 'synced' | 'syncing' | 'warning' | 'error';
  lastSync: string;
  calendars: SyncCalendar[];
}

interface SyncStatusDropdownProps {
  status: SyncStatus;
  isOpen: boolean;
  onToggle: () => void;
}

export function SyncStatusDropdown({ status, isOpen, onToggle }: SyncStatusDropdownProps) {
  const getStatusIcon = () => {
    switch (status.status) {
      case 'synced':
        return <Check size={14} color="#10B981" />;
      case 'syncing':
        return <RefreshCw size={14} color="#3B82F6" className="animate-spin" />;
      case 'warning':
        return <AlertTriangle size={14} color="#F59E0B" />;
      case 'error':
        return <XIcon size={14} color="#EF4444" />;
    }
  };

  const getStatusText = () => {
    switch (status.status) {
      case 'synced':
        return `Synced ${status.lastSync}`;
      case 'syncing':
        return 'Syncing...';
      case 'warning':
        return 'Sync issue';
      case 'error':
        return 'Sync failed';
    }
  };

  const getStatusColor = () => {
    switch (status.status) {
      case 'synced':
        return '#10B981';
      case 'syncing':
        return '#3B82F6';
      case 'warning':
        return '#F59E0B';
      case 'error':
        return '#EF4444';
    }
  };

  const getCalendarStatusIcon = (calStatus: SyncCalendar['status']) => {
    switch (calStatus) {
      case 'synced':
        return <Check size={16} color="#10B981" />;
      case 'syncing':
        return <RefreshCw size={16} color="#3B82F6" className="animate-spin" />;
      case 'warning':
        return <AlertTriangle size={16} color="#F59E0B" />;
      case 'error':
        return <XIcon size={16} color="#EF4444" />;
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={onToggle}
        style={{
          height: '36px',
          padding: '0 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          border: '1px solid #E5E7EB',
          borderRadius: '6px',
          background: 'white',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 500,
          color: '#0A0A0A',
          transition: 'all 150ms'
        }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = '#D1D5DB'}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}
      >
        {getStatusIcon()}
        <span>{getStatusText()}</span>
      </button>

      {isOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 998
            }}
            onClick={onToggle}
          />
          <div style={{
            position: 'absolute',
            top: '40px',
            right: 0,
            width: '280px',
            background: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            zIndex: 999,
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: '16px',
              borderBottom: '1px solid #E5E7EB',
              fontSize: '13px',
              fontWeight: 600,
              color: '#6B7280',
              letterSpacing: '0.05em'
            }}>
              CALENDAR SYNC
            </div>

            {/* Connected Calendars */}
            <div style={{ padding: '12px 16px' }}>
              {status.calendars.map((calendar, index) => (
                <div
                  key={index}
                  style={{
                    padding: '12px',
                    marginBottom: index < status.calendars.length - 1 ? '8px' : 0,
                    background: '#F9FAFB',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px'
                  }}
                >
                  {getCalendarStatusIcon(calendar.status)}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#0A0A0A',
                      marginBottom: '4px'
                    }}>
                      {calendar.name}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#6B7280'
                    }}>
                      Last sync: {calendar.lastSync}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{
              padding: '12px 16px',
              borderTop: '1px solid #E5E7EB',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <button
                style={{
                  width: '100%',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: '#0066FF',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 150ms'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#0052CC'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#0066FF'}
              >
                <RefreshCw size={14} />
                Sync now
              </button>
              <button
                style={{
                  width: '100%',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'transparent',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#0A0A0A',
                  cursor: 'pointer',
                  transition: 'all 150ms'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#F9FAFB';
                  e.currentTarget.style.borderColor = '#D1D5DB';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = '#E5E7EB';
                }}
              >
                <Settings size={14} />
                Sync settings
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
