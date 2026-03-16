import React, { forwardRef } from 'react';

interface GanttTimelineHeaderProps {
  weeks: any[];
  timeResolution: string;
  onScroll?: () => void;
  zoomLevel?: number;
}

export const GanttTimelineHeader = forwardRef<HTMLDivElement, GanttTimelineHeaderProps>(
  ({ weeks, timeResolution, onScroll, zoomLevel = 100 }, ref) => {
    const getColumnWidth = () => {
      const baseWidth = (() => {
        switch (timeResolution) {
          case 'Day': return 60;
          case 'Week': return 160;
          case 'Month': return 240;
          default: return 160;
        }
      })();
      
      // Apply zoom level (zoomLevel is a percentage: 50, 75, 100, 125, 150)
      return Math.round(baseWidth * (zoomLevel / 100));
    };

    const COLUMN_WIDTH = getColumnWidth();

    return (
      <div 
        ref={ref}
        onScroll={onScroll}
        style={{ 
          background: '#F9FAFB',
          width: `${weeks.length * COLUMN_WIDTH}px`,
          height: '68px'
        }}
      >
        {/* Top Tier - Weeks/Months/Year */}
        <div style={{
          height: '32px',
          background: '#F3F4F6',
          borderBottom: '1px solid #E5E7EB',
          position: 'relative'
        }}>
            {timeResolution === 'Day' && (() => {
              // Group days by week
              const weekGroups: any[] = [];
              let currentWeek: any = null;
              
              weeks.forEach((day: any, idx) => {
                if (day.isMonday || idx === 0) {
                  if (currentWeek) weekGroups.push(currentWeek);
                  currentWeek = {
                    weekNumber: day.weekNumber,
                    month: day.month,
                    year: day.year,
                    startIdx: idx,
                    count: 1
                  };
                } else if (currentWeek) {
                  currentWeek.count++;
                }
              });
              if (currentWeek) weekGroups.push(currentWeek);
              
              return weekGroups.map((week, idx) => (
                <div
                  key={idx}
                  style={{
                    position: 'absolute',
                    left: `${week.startIdx * COLUMN_WIDTH}px`,
                    width: `${week.count * COLUMN_WIDTH}px`,
                    height: '32px',
                    borderRight: idx < weekGroups.length - 1 ? '1px solid #D1D5DB' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#6B7280'
                  }}
                >
                  WEEK {week.weekNumber} - {week.year} ({week.month})
                </div>
              ));
            })()}
            
            {timeResolution === 'Week' && (() => {
              // Group weeks by month
              const monthGroups: any[] = [];
              let currentMonth: any = null;
              
              weeks.forEach((week: any, idx) => {
                const monthKey = `${week.month} ${week.year}`;
                if (!currentMonth || currentMonth.key !== monthKey) {
                  if (currentMonth) monthGroups.push(currentMonth);
                  currentMonth = {
                    key: monthKey,
                    month: week.month,
                    year: week.year,
                    startIdx: idx,
                    count: 1
                  };
                } else {
                  currentMonth.count++;
                }
              });
              if (currentMonth) monthGroups.push(currentMonth);
              
              return monthGroups.map((month, idx) => (
                <div
                  key={idx}
                  style={{
                    position: 'absolute',
                    left: `${month.startIdx * COLUMN_WIDTH}px`,
                    width: `${month.count * COLUMN_WIDTH}px`,
                    height: '32px',
                    borderRight: idx < monthGroups.length - 1 ? '1px solid #D1D5DB' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#6B7280'
                  }}
                >
                  {month.month} {month.year}
                </div>
              ));
            })()}
            
            {timeResolution === 'Month' && (() => {
              // Group months by year
              const yearGroups: any[] = [];
              let currentYear: any = null;
              
              weeks.forEach((month: any, idx) => {
                if (!currentYear || currentYear.year !== month.year) {
                  if (currentYear) yearGroups.push(currentYear);
                  currentYear = {
                    year: month.year,
                    startIdx: idx,
                    count: 1
                  };
                } else {
                  currentYear.count++;
                }
              });
              if (currentYear) yearGroups.push(currentYear);
              
              return yearGroups.map((year, idx) => (
                <div
                  key={idx}
                  style={{
                    position: 'absolute',
                    left: `${year.startIdx * COLUMN_WIDTH}px`,
                    width: `${year.count * COLUMN_WIDTH}px`,
                    height: '32px',
                    borderRight: idx < yearGroups.length - 1 ? '1px solid #D1D5DB' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#6B7280'
                  }}
                >
                  {year.year}
                </div>
              ));
            })()}
          </div>
          
          {/* Bottom Tier - Days/Weeks/Months */}
          <div style={{
            height: '36px',
            background: '#F9FAFB',
            borderBottom: '1px solid #E5E7EB',
            position: 'relative'
          }}>
            {weeks.map((period: any, idx) => (
              <div
                key={idx}
                style={{
                  position: 'absolute',
                  left: `${idx * COLUMN_WIDTH}px`,
                  width: `${COLUMN_WIDTH}px`,
                  height: '36px',
                  borderRight: '1px solid #E5E7EB',
                  display: 'flex',
                  flexDirection: timeResolution === 'Day' ? 'column' : 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#6B7280',
                  background: period.isToday ? '#EFF6FF' : 'transparent'
                }}
              >
                {timeResolution === 'Day' ? (
                  <>
                    <span style={{ fontSize: '11px', lineHeight: '1' }}>
                      {period.label.split(' ')[0]}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 600, lineHeight: '1', color: '#0A0A0A' }}>
                      {period.label.split(' ')[1]}
                    </span>
                  </>
                ) : (
                  period.label
                )}
                {period.isToday && (
                  <div style={{
                    position: 'absolute',
                    bottom: '4px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#3B82F6'
                  }} />
                )}
              </div>
            ))}
          </div>
      </div>
    );
  }
);

GanttTimelineHeader.displayName = 'GanttTimelineHeader';