import React from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Plus } from 'lucide-react';

interface GanttToolbarProps {
  timeResolution: string;
  onTimeResolutionChange: (resolution: string) => void;
  onToggleLegend: () => void;
  onNavigateBackward: () => void;
  onNavigateForward: () => void;
  onGoToToday: () => void;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onCreateProject?: () => void;
  dateRange?: { start: string; end: string };
}

export function GanttToolbar({ 
  timeResolution, 
  onTimeResolutionChange, 
  onToggleLegend,
  onNavigateBackward,
  onNavigateForward,
  onGoToToday,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onCreateProject,
  dateRange
}: GanttToolbarProps) {
  // Format date for display
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    let date: Date;
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    } else {
      date = new Date(dateStr);
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const displayDateRange = dateRange 
    ? `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`
    : 'Select date range';

  return (
    <div style={{
      height: '52px',
      background: '#FAFAFA',
      borderBottom: '1px solid #E5E7EB',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: '60px',
      zIndex: 99
    }}>
      {/* Left Side Controls */}
      <div className="flex items-center" style={{ gap: '12px' }}>
        {/* Time Resolution */}
        <div style={{
          height: '40px',
          background: '#F3F4F6',
          borderRadius: '8px',
          display: 'flex',
          padding: '4px',
          gap: '4px'
        }}>
          {['Day', 'Week', 'Month'].map((res) => (
            <button
              key={res}
              onClick={() => onTimeResolutionChange(res)}
              style={{
                width: '80px',
                height: '32px',
                background: timeResolution === res ? 'white' : 'transparent',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: timeResolution === res ? 600 : 500,
                color: timeResolution === res ? '#0A0A0A' : '#6B7280',
                cursor: 'pointer',
                boxShadow: timeResolution === res ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 150ms ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                if (timeResolution !== res) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.5)';
                }
              }}
              onMouseLeave={(e) => {
                if (timeResolution !== res) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {res}
            </button>
          ))}
        </div>

        {/* Today Button */}
        <button style={{
          width: '80px',
          height: '40px',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
          background: 'white',
          fontSize: '14px',
          fontWeight: 600,
          color: '#3B82F6',
          cursor: 'pointer',
          transition: 'all 150ms ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#3B82F6';
          e.currentTarget.style.borderColor = '#3B82F6';
          e.currentTarget.style.color = 'white';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'white';
          e.currentTarget.style.borderColor = '#E5E7EB';
          e.currentTarget.style.color = '#3B82F6';
        }}
        onClick={onGoToToday}
        >
          Today
        </button>

        {/* Navigation Arrows */}
        <div className="flex items-center" style={{ gap: '4px' }}>
          <button style={{
            width: '40px',
            height: '40px',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            background: 'white',
            fontSize: '18px',
            color: '#6B7280',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 150ms ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#F9FAFB';
            e.currentTarget.style.borderColor = '#3B82F6';
            (e.currentTarget.querySelector('svg') as any).style.color = '#3B82F6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'white';
            e.currentTarget.style.borderColor = '#E5E7EB';
            (e.currentTarget.querySelector('svg') as any).style.color = '#6B7280';
          }}
          onClick={onNavigateBackward}
          title="Previous 4 weeks"
          >
            <ChevronLeft style={{ width: '20px', height: '20px', transition: 'color 150ms ease' }} />
          </button>

          <button style={{
            width: '40px',
            height: '40px',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 150ms ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#F9FAFB';
            e.currentTarget.style.borderColor = '#3B82F6';
            (e.currentTarget.querySelector('svg') as any).style.color = '#3B82F6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'white';
            e.currentTarget.style.borderColor = '#E5E7EB';
            (e.currentTarget.querySelector('svg') as any).style.color = '#6B7280';
          }}
          onClick={onNavigateForward}
          title="Next 4 weeks"
          >
            <ChevronRight style={{ width: '20px', height: '20px', color: '#6B7280', transition: 'color 150ms ease' }} />
          </button>
        </div>

        {/* Date Range */}
        <div className="flex items-center" style={{ 
          gap: '6px', 
          padding: '8px 12px',
          borderRadius: '6px',
          cursor: 'pointer',
          transition: 'background 150ms ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{ fontSize: '16px' }}>📅</div>
          <span style={{ fontSize: '15px', fontWeight: 500, color: '#0A0A0A' }}>
            {displayDateRange}
          </span>
        </div>
      </div>

      {/* Right Side Controls */}
      <div className="flex items-center" style={{ gap: '10px' }}>
        <button
          onClick={onToggleLegend}
          style={{
            width: '36px',
            height: '36px',
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            background: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 150ms ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
          title="Show legend"
        >
          <div className="flex items-center" style={{ gap: '2px' }}>
            <div style={{ width: '4px', height: '4px', background: '#3B82F6', borderRadius: '1px' }} />
            <div style={{ width: '4px', height: '4px', background: '#F97316', borderRadius: '1px' }} />
            <div style={{ width: '4px', height: '4px', background: '#10B981', borderRadius: '1px' }} />
          </div>
        </button>

        {/* Zoom Out */}
        <button
          onClick={onZoomOut}
          disabled={zoomLevel <= 50}
          style={{
            width: '36px',
            height: '36px',
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            background: 'white',
            cursor: zoomLevel <= 50 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 150ms ease',
            opacity: zoomLevel <= 50 ? 0.4 : 1
          }}
          onMouseEnter={(e) => {
            if (zoomLevel > 50) {
              e.currentTarget.style.background = '#F9FAFB';
            }
          }}
          onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
          title={`Zoom out (${zoomLevel}%)`}
        >
          <ZoomOut style={{ width: '20px', height: '20px', color: '#6B7280', transition: 'color 150ms ease' }} />
        </button>

        {/* Zoom Level Indicator */}
        <div style={{
          minWidth: '48px',
          height: '36px',
          padding: '0 10px',
          background: '#F9FAFB',
          border: '1px solid #E5E7EB',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 600,
          color: '#6B7280',
          userSelect: 'none'
        }}>
          {zoomLevel}%
        </div>

        {/* Zoom In */}
        <button
          onClick={onZoomIn}
          disabled={zoomLevel >= 150}
          style={{
            width: '36px',
            height: '36px',
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            background: 'white',
            cursor: zoomLevel >= 150 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 150ms ease',
            opacity: zoomLevel >= 150 ? 0.4 : 1
          }}
          onMouseEnter={(e) => {
            if (zoomLevel < 150) {
              e.currentTarget.style.background = '#F9FAFB';
            }
          }}
          onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
          title={`Zoom in (${zoomLevel}%)`}
        >
          <ZoomIn style={{ width: '20px', height: '20px', color: '#6B7280', transition: 'color 150ms ease' }} />
        </button>
      </div>
    </div>
  );
}