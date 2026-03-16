import React, { useState, useEffect } from 'react';
import { X, FileText, Users, MessageSquare, Paperclip, Flag } from 'lucide-react';
import { TaskDetailsTab } from './modal-tabs/TaskDetailsTab';
import { TaskParticipantsTab } from './modal-tabs/TaskParticipantsTab';
import { TaskCommentsTab } from './modal-tabs/TaskCommentsTab';
import { TaskFilesTab } from './modal-tabs/TaskFilesTab';
import { TaskFlagsTab } from './modal-tabs/TaskFlagsTab';
import type { Task } from '../../types/task';

// Extended task type for modal display (includes loading state and gantt-specific fields)
interface ModalTask extends Partial<Task> {
  id: string;
  name: string;
  progress?: number;
  completed?: boolean;
  status?: string;
  spentHours?: number;
  plannedHours?: number;
  flag?: boolean;
  avatars?: string[];
  filesCount?: number;
  _isLoading?: boolean;
  _rawData?: any;
}

interface TaskDetailModalProps {
  task: ModalTask;
  onClose: () => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
}

type TabType = 'details' | 'participants' | 'comments' | 'files' | 'flags';

export function TaskDetailModal({ task, onClose, onUpdateTask }: TaskDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [isOpen, setIsOpen] = useState(false);
  const [taskData, setTaskData] = useState(task);
  const [hasChanges, setHasChanges] = useState(false);

  // Animation on mount
  useEffect(() => {
    setIsOpen(true);
  }, []);

  // Sync taskData when task prop updates (e.g., after API fetch)
  useEffect(() => {
    console.log('[TaskDetailModal] Task prop updated:', task);
    console.log('[TaskDetailModal] Participants:', task?.participants);
    setTaskData(task);
  }, [task]);

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [hasChanges]);

  const handleClose = () => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        setIsOpen(false);
        setTimeout(onClose, 200);
      }
    } else {
      setIsOpen(false);
      setTimeout(onClose, 200);
    }
  };

  const handleSave = () => {
    onUpdateTask(task.id, taskData);
    setHasChanges(false);
    handleClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const updateTaskData = (updates: any) => {
    setTaskData({ ...taskData, ...updates });
    setHasChanges(true);
  };

  const tabs = [
    { id: 'details', label: 'Details', icon: <FileText size={18} />, badge: null },
    { id: 'participants', label: 'Participants', icon: <Users size={18} />, badge: task.participants?.length || 0 },
    { id: 'comments', label: 'Comments', icon: <MessageSquare size={18} />, badge: task.commentsCount || 0 },
    { id: 'files', label: 'Files', icon: <Paperclip size={18} />, badge: task.filesCount || 0 },
    { id: 'flags', label: 'Flags', icon: <Flag size={18} />, badge: task.flag ? 1 : 0, badgeColor: '#F97316' }
  ];

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.3)',
        backdropFilter: 'blur(2px)',
        zIndex: 9999,
        opacity: isOpen ? 1 : 0,
        transition: 'opacity 200ms ease-out'
      }}
    >
      {/* Side Panel Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '680px',
          maxWidth: '90vw',
          background: 'white',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 300ms ease-out'
        }}
      >
        {/* Header */}
        <div style={{
          height: '72px',
          borderBottom: '1px solid #E5E7EB',
          padding: '0 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'white',
          borderRadius: '12px 12px 0 0'
        }}>
          {/* Left Side */}
          <div>
            <div style={{
              fontSize: '14px',
              fontWeight: 500,
              color: '#6B7280',
              marginBottom: '8px'
            }}>
              Task • {task.id}
            </div>
            <div style={{
              fontSize: '22px',
              fontWeight: 600,
              color: '#0A0A0A'
            }}>
              {task.name}
            </div>
          </div>

          {/* Right Side */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleClose}
              style={{
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
              onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
            >
              <X size={20} color="#6B7280" />
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              style={{
                width: '120px',
                height: '44px',
                background: hasChanges ? '#3B82F6' : '#3B82F6',
                color: 'white',
                fontSize: '15px',
                fontWeight: 500,
                borderRadius: '8px',
                border: 'none',
                cursor: hasChanges ? 'pointer' : 'not-allowed',
                opacity: hasChanges ? 1 : 0.5,
                transition: 'all 150ms ease'
              }}
              onMouseEnter={(e) => {
                if (hasChanges) e.currentTarget.style.background = '#2563EB';
              }}
              onMouseLeave={(e) => {
                if (hasChanges) e.currentTarget.style.background = '#3B82F6';
              }}
            >
              Save
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{
          height: '56px',
          background: '#FAFAFA',
          borderBottom: '1px solid #E5E7EB',
          padding: '0 32px',
          display: 'flex',
          gap: '32px'
        }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '16px 0',
                background: 'transparent',
                border: 'none',
                fontSize: '15px',
                fontWeight: activeTab === tab.id ? 600 : 400,
                color: activeTab === tab.id ? '#0A0A0A' : '#6B7280',
                cursor: 'pointer',
                transition: 'color 150ms ease'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) e.currentTarget.style.color = '#0A0A0A';
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) e.currentTarget.style.color = '#6B7280';
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge !== null && tab.badge > 0 && (
                <div style={{
                  minWidth: '18px',
                  height: '18px',
                  padding: '0 6px',
                  background: tab.badgeColor || '#3B82F6',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: '9px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {tab.badge}
                </div>
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
          background: 'white',
          padding: '20px 32px',
          overflowY: 'auto',
          overflowX: 'hidden'
        }}>
          {activeTab === 'details' && (
            <TaskDetailsTab task={taskData} onUpdate={updateTaskData} />
          )}
          {activeTab === 'participants' && (
            <TaskParticipantsTab task={taskData} />
          )}
          {activeTab === 'comments' && (
            <TaskCommentsTab task={taskData} />
          )}
          {activeTab === 'files' && (
            <TaskFilesTab task={taskData} />
          )}
          {activeTab === 'flags' && (
            <TaskFlagsTab task={taskData} />
          )}
        </div>
      </div>
    </div>
  );
}