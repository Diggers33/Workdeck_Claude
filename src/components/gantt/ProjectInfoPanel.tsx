import React, { useState } from 'react';
import { X } from 'lucide-react';
import { ProjectCommentsTab } from './project-tabs/ProjectCommentsTab';
import { ProjectActivityTab } from './project-tabs/ProjectActivityTab';
import { ProjectNotesTab } from './project-tabs/ProjectNotesTab';
import { ProjectFilesTab } from './project-tabs/ProjectFilesTab';

interface ProjectInfoPanelProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  projectId?: string;
  initialTab?: 'comments' | 'activity' | 'notes' | 'files';
}

export function ProjectInfoPanel({ isOpen, onClose, projectName, projectId, initialTab = 'comments' }: ProjectInfoPanelProps) {
  const [activeTab, setActiveTab] = useState<'comments' | 'activity' | 'notes' | 'files'>(initialTab);

  if (!isOpen) return null;

  const tabs = [
    { id: 'comments' as const, label: 'Comments', badge: 5, badgeColor: '#DC2626' },
    { id: 'activity' as const, label: 'Activity', badge: 23, badgeColor: '#6B7280' },
    { id: 'notes' as const, label: 'Notes', badge: null, badgeColor: null },
    { id: 'files' as const, label: 'Repository', badge: 12, badgeColor: '#3B82F6' }
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '480px',
      height: '100vh',
      background: 'white',
      borderLeft: '1px solid #E5E7EB',
      boxShadow: '-2px 0 16px rgba(0,0,0,0.08)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      animation: 'slideInRight 300ms ease-out'
    }}>
      {/* Header */}
      <div style={{
        height: '68px',
        background: 'white',
        borderBottom: '1px solid #E5E7EB',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#0A0A0A',
            marginBottom: '4px'
          }}>
            {projectName}
          </div>
          <div style={{
            fontSize: '13px',
            color: '#6B7280'
          }}>
            Project Information
          </div>
        </div>

        <button
          onClick={onClose}
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
          <X size={18} color="#6B7280" />
        </button>
      </div>

      {/* Tab Navigation */}
      <div style={{
        height: '52px',
        background: '#FAFAFA',
        borderBottom: '1px solid #E5E7EB',
        padding: '0 24px',
        display: 'flex',
        gap: '20px',
        overflowX: 'auto',
        overflowY: 'hidden'
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              position: 'relative',
              padding: '16px 0',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 150ms ease'
            }}
          >
            <span style={{
              fontSize: '14px',
              fontWeight: activeTab === tab.id ? 600 : 400,
              color: activeTab === tab.id ? '#0A0A0A' : '#6B7280'
            }}>
              {tab.label}
            </span>
            
            {tab.badge !== null && (
              <span style={{
                minWidth: '18px',
                height: '18px',
                padding: '0 6px',
                borderRadius: '9px',
                background: tab.badgeColor,
                color: 'white',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {tab.badge}
              </span>
            )}

            {activeTab === tab.id && (
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: '#3B82F6'
              }} />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        background: 'white'
      }}>
        {activeTab === 'comments' && <ProjectCommentsTab />}
        {activeTab === 'activity' && <ProjectActivityTab />}
        {activeTab === 'notes' && <ProjectNotesTab />}
        {activeTab === 'files' && <ProjectFilesTab projectId={projectId} />}
      </div>

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}