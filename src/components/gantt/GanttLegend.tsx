import React from 'react';

interface GanttLegendProps {
  onClose: () => void;
}

export function GanttLegend({ onClose }: GanttLegendProps) {
  return (
    <>
      <div
        className="fixed inset-0"
        style={{ zIndex: 100 }}
        onClick={onClose}
      />
      <div style={{
        position: 'fixed',
        top: '140px',
        right: '100px',
        width: '320px',
        background: 'white',
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        padding: '20px',
        zIndex: 101
      }}>
        {/* Header */}
        <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
          <span style={{ fontSize: '15px', fontWeight: 600, color: '#0A0A0A' }}>Legend</span>
          <button
            onClick={onClose}
            style={{
              width: '24px',
              height: '24px',
              border: 'none',
              background: 'transparent',
              fontSize: '18px',
              color: '#9CA3AF',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
        </div>

        {/* Time-Based Colors */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            TIME STATUS
          </div>
          {[
            { color: '#10B981', label: 'Completed' },
            { color: '#93C5FD', label: 'Not started (<25% time used)' },
            { color: '#60A5FA', label: 'On track (25-75% time used)' },
            { color: '#F59E0B', label: 'Warning (75-100% time used)' },
            { color: '#EF4444', label: 'Over budget (>100%) / Overdue (no progress)' },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center" style={{ gap: '12px', marginBottom: '10px' }}>
              <div style={{
                width: '32px',
                height: '14px',
                background: item.color,
                borderRadius: '3px'
              }} />
              <span style={{ fontSize: '13px', color: '#0A0A0A', flex: 1 }}>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Time Tracking */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            TIME TRACKING
          </div>
          <div className="flex items-center" style={{ gap: '12px', marginBottom: '10px' }}>
            <div style={{
              width: '32px',
              height: '14px',
              background: '#93C5FD',
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(251, 191, 36, 0.6) 2px, rgba(251, 191, 36, 0.6) 4px)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '3px'
            }} />
            <span style={{ fontSize: '13px', color: '#0A0A0A', flex: 1 }}>Out of schedule work (striped)</span>
          </div>
        </div>

        {/* Indicators */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            INDICATORS
          </div>
          {[
            { icon: '🚩', label: 'Risk/Issue flag' },
            { icon: '🔷', label: 'Milestone marker' },
            { icon: '⚠️', label: 'Over budget warning' },
            { icon: '→', label: 'Task dependency' },
            { icon: '✓', label: 'Completed task' }
          ].map((item, idx) => (
            <div key={idx} className="flex items-center" style={{ gap: '12px', marginBottom: '10px' }}>
              <span style={{ fontSize: '16px', width: '32px', textAlign: 'center' }}>{item.icon}</span>
              <span style={{ fontSize: '13px', color: '#0A0A0A', flex: 1 }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}