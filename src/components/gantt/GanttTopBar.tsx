import React from 'react';
import { ArrowLeft, MessageSquare, Folder } from 'lucide-react';

interface GanttTopBarProps {
  onBack: () => void;
  projectName?: string;
  onOpenComments?: () => void;
  onOpenFiles?: () => void;
  onEditProject?: () => void;
  onOpenBoard?: () => void;
}

export function GanttTopBar({ onBack, projectName = 'Project', onOpenComments, onOpenFiles, onEditProject, onOpenBoard }: GanttTopBarProps) {
  return (
    <div style={{ 
      height: '60px', 
      background: '#FFFFFF', 
      borderBottom: '1px solid #E5E7EB',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      {/* LEFT SECTION */}
      <div className="flex items-center" style={{ gap: '16px' }}>
        {/* Back Button */}
        <button
          onClick={onBack}
          style={{
            width: '36px',
            height: '36px',
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background 150ms ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
        >
          <ArrowLeft style={{ width: '18px', height: '18px', color: '#6B7280' }} />
        </button>

        {/* Project Name with Health */}
        <div className="flex items-center" style={{ gap: '8px' }}>
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: '#F97316',
            animation: 'pulse 2s infinite'
          }} />
          <span style={{ fontSize: '18px', fontWeight: 600, color: '#0A0A0A' }}>{projectName}</span>
        </div>
      </div>

      {/* CENTER SECTION - View Switcher */}
      <div style={{
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '320px',
        height: '44px',
        background: '#F3F4F6',
        borderRadius: '8px',
        padding: '4px',
        display: 'flex',
        gap: '4px'
      }}>
        {['Gantt', 'Board', 'Financial'].map((view) => (
          <button
            key={view}
            onClick={() => {
              if (view === 'Board' && onOpenBoard) {
                onOpenBoard();
              }
            }}
            style={{
              flex: 1,
              height: '36px',
              background: view === 'Gantt' ? 'white' : 'transparent',
              border: 'none',
              borderRadius: '6px',
              fontSize: '15px',
              fontWeight: view === 'Gantt' ? 600 : 400,
              color: view === 'Gantt' ? '#0A0A0A' : '#6B7280',
              cursor: 'pointer',
              boxShadow: view === 'Gantt' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 150ms ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center'
            }}
            onMouseEnter={(e) => {
              if (view !== 'Gantt') e.currentTarget.style.background = 'rgba(255,255,255,0.6)';
            }}
            onMouseLeave={(e) => {
              if (view !== 'Gantt') e.currentTarget.style.background = 'transparent';
            }}
          >
            {view}
          </button>
        ))}
      </div>

      {/* RIGHT SECTION */}
      <div className="flex items-center" style={{ gap: '12px' }}>
        {/* Manager Avatars */}
        <div className="flex items-center" style={{ marginRight: '8px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: '#60A5FA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '12px',
            fontWeight: 600,
            marginRight: '8px'
          }}>
            CD
          </div>
          <div style={{ 
            width: '36px', 
            height: '36px',
            borderRadius: '50%',
            background: '#34D399',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '12px',
            fontWeight: 600,
            marginRight: '8px'
          }}>
            BR
          </div>
        </div>

        {/* Comments Button */}
        <button
          onClick={onOpenComments}
          style={{
            width: '36px',
            height: '36px',
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            position: 'relative'
          }}
        >
          <MessageSquare style={{ width: '18px', height: '18px', color: '#6B7280' }} />
          <div style={{
            position: 'absolute',
            top: '-6px',
            right: '-6px',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            background: '#DC2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 600,
            color: 'white'
          }}>
            3
          </div>
        </button>

        {/* Repository Button */}
        <button
          onClick={onOpenFiles}
          style={{
            width: '36px',
            height: '36px',
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <Folder style={{ width: '18px', height: '18px', color: '#6B7280' }} />
        </button>

        {/* Edit Project Button */}
        <button 
          onClick={onEditProject}
          style={{
          width: '120px',
          height: '44px',
          background: '#60A5FA',
          color: 'white',
          fontSize: '14px',
          fontWeight: 500,
          borderRadius: '8px',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 150ms ease'
        }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#3B82F6'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#60A5FA'}
        >
          Edit Project
        </button>
      </div>
    </div>
  );
}