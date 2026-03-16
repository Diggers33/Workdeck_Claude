import React from 'react';

interface GanttLeftSidebarProps {
  selectedFilters: Set<string>;
  onToggleFilter: (id: string) => void;
}

const FILTERS = [
  { id: 'myTasks', label: 'My tasks', count: 12, countColor: '#6B7280' },
  { id: 'overdue', label: 'Overdue', count: 3, countColor: '#DC2626', countBold: true },
  { id: 'thisWeek', label: 'This week', count: 8, countColor: '#6B7280' },
  { id: 'flagged', label: 'Flagged', count: 2, countColor: '#F97316', countBold: true }
];

export function GanttLeftSidebar({ selectedFilters, onToggleFilter }: GanttLeftSidebarProps) {
  return (
    <div style={{
      width: '280px',
      background: '#FAFAFA',
      borderRight: '1px solid #E5E7EB',
      overflow: 'auto',
      position: 'relative',
      padding: '20px'
    }}>
      {/* Quick Filters */}
      <div>
        <div style={{
          fontSize: '11px',
          fontWeight: 700,
          color: '#9CA3AF',
          letterSpacing: '0.8px',
          textTransform: 'uppercase',
          marginBottom: '12px'
        }}>
          QUICK FILTERS
        </div>

        {FILTERS.map((filter) => (
          <div
            key={filter.id}
            onClick={() => onToggleFilter(filter.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              marginBottom: '6px',
              background: selectedFilters.has(filter.id) ? '#EFF6FF' : 'transparent',
              borderRadius: '6px',
              cursor: 'pointer',
              height: '40px',
              transition: 'background 150ms ease'
            }}
            onMouseEnter={(e) => {
              if (!selectedFilters.has(filter.id)) e.currentTarget.style.background = '#F3F4F6';
            }}
            onMouseLeave={(e) => {
              if (!selectedFilters.has(filter.id)) e.currentTarget.style.background = 'transparent';
            }}
          >
            <div className="flex items-center" style={{ gap: '8px' }}>
              <input
                type="checkbox"
                checked={selectedFilters.has(filter.id)}
                readOnly
                style={{ width: '18px', height: '18px', accentColor: '#3B82F6', cursor: 'pointer' }}
              />
              <span style={{
                fontSize: '14px',
                fontWeight: selectedFilters.has(filter.id) ? 500 : 400,
                color: selectedFilters.has(filter.id) ? '#0A0A0A' : '#6B7280'
              }}>
                {filter.label}
              </span>
            </div>
            <span style={{ 
              fontSize: '13px', 
              fontWeight: filter.countBold ? 600 : 400, 
              color: filter.countColor 
            }}>
              ({filter.count})
            </span>
          </div>
        ))}
      </div>

      {/* Collapse Button */}
      <button style={{
        position: 'absolute',
        bottom: '12px',
        right: '12px',
        width: '36px',
        height: '36px',
        border: '1px solid #E5E7EB',
        borderRadius: '6px',
        background: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: '18px',
        color: '#9CA3AF',
        boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
        transition: 'all 150ms ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = '#F3F4F6';
        e.currentTarget.style.color = '#6B7280';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'white';
        e.currentTarget.style.color = '#9CA3AF';
      }}
      >
        «
      </button>
    </div>
  );
}
