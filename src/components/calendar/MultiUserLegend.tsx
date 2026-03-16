import React from 'react';

interface MultiUserLegendProps {
  selectedUsers: string[];
  userColors: { [key: string]: string };
}

export function MultiUserLegend({ selectedUsers, userColors }: MultiUserLegendProps) {
  if (selectedUsers.length <= 1) return null;

  return (
    <div style={{
      padding: '16px 24px',
      background: '#F9FAFB',
      borderBottom: '1px solid #E5E7EB',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
        <span style={{ fontSize: '13px', fontWeight: 500, color: '#6B7280' }}>
          Viewing {selectedUsers.length} calendars:
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {selectedUsers.map(user => (
            <div
              key={user}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                background: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '6px'
              }}
            >
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: userColors[user] || '#6B7280'
                }}
              />
              <span style={{ fontSize: '12px', fontWeight: 500, color: '#0A0A0A' }}>
                {user.replace(' (You)', '')}
              </span>
            </div>
          ))}
        </div>
      </div>
      <button
        style={{
          padding: '8px 16px',
          border: '1px solid #0066FF',
          borderRadius: '6px',
          background: 'white',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 500,
          color: '#0066FF',
          transition: 'all 150ms',
          whiteSpace: 'nowrap'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = '#F0F7FF'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
      >
        Find free time
      </button>
    </div>
  );
}
