import React, { useState } from 'react';
import { X, Calendar, Clock, Users, Flag, CheckCircle } from 'lucide-react';

interface GanttTaskDetailModalProps {
  task: any;
  onClose: () => void;
  onUpdateTask: (taskId: string, updates: any) => void;
}

export function GanttTaskDetailModal({ task, onClose, onUpdateTask }: GanttTaskDetailModalProps) {
  const [editedName, setEditedName] = useState(task.name);
  const [editedProgress, setEditedProgress] = useState(task.progress);
  const [editedHours, setEditedHours] = useState(task.hours?.split(' / ')[0] || '0h');

  const handleSave = () => {
    onUpdateTask(task.id, {
      name: editedName,
      progress: editedProgress,
      hours: `${editedHours} / ${task.hours?.split(' / ')[1] || '40h'}`
    });
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 100,
          animation: 'fadeIn 200ms ease'
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px',
        maxHeight: '80vh',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        zIndex: 101,
        overflow: 'hidden',
        animation: 'slideUp 200ms ease'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#0A0A0A', marginBottom: '4px' }}>
              Task Details
            </h2>
            <p style={{ fontSize: '13px', color: '#6B7280' }}>
              {task.type === 'milestone' ? 'Milestone' : 'Task'} • {task.id}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              border: 'none',
              background: '#F3F4F6',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 150ms ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#E5E7EB'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#F3F4F6'}
          >
            <X style={{ width: '18px', height: '18px', color: '#6B7280' }} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', maxHeight: 'calc(80vh - 180px)', overflowY: 'auto' }}>
          {/* Task Name */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
              Task Name
            </label>
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              style={{
                width: '100%',
                height: '40px',
                padding: '0 12px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#0A0A0A',
                outline: 'none',
                transition: 'border 150ms ease'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#3B82F6'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#D1D5DB'}
            />
          </div>

          {/* Progress */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
              <span>Progress</span>
              <span style={{ color: '#3B82F6' }}>{editedProgress}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={editedProgress}
              onChange={(e) => setEditedProgress(parseInt(e.target.value))}
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '3px',
                outline: 'none',
                appearance: 'none',
                background: `linear-gradient(to right, #3B82F6 ${editedProgress}%, #E5E7EB ${editedProgress}%)`
              }}
            />
          </div>

          {/* Grid Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            {/* Duration */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
                <Calendar style={{ width: '14px', height: '14px', display: 'inline', marginRight: '6px' }} />
                Duration
              </label>
              <div style={{
                padding: '12px',
                background: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#0A0A0A'
              }}>
                {task.durationWeeks} weeks
              </div>
            </div>

            {/* Hours */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
                <Clock style={{ width: '14px', height: '14px', display: 'inline', marginRight: '6px' }} />
                Hours
              </label>
              <div style={{
                padding: '12px',
                background: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#0A0A0A'
              }}>
                {task.hours}
              </div>
            </div>
          </div>

          {/* Assignees */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
              <Users style={{ width: '14px', height: '14px', display: 'inline', marginRight: '6px' }} />
              Assigned to
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {task.avatars?.map((avatar: string, idx: number) => (
                <div
                  key={idx}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: '#3B82F6',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  {avatar}
                </div>
              ))}
            </div>
          </div>

          {/* Status Indicators */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {task.flag && (
              <div style={{
                padding: '8px 12px',
                background: '#FFF7ED',
                border: '1px solid #F97316',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                color: '#F97316'
              }}>
                <Flag style={{ width: '14px', height: '14px' }} />
                Flagged
              </div>
            )}
            {task.completed && (
              <div style={{
                padding: '8px 12px',
                background: '#F0FDF4',
                border: '1px solid #10B981',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                color: '#10B981'
              }}>
                <CheckCircle style={{ width: '14px', height: '14px' }} />
                Completed
              </div>
            )}
            {task.warning && (
              <div style={{
                padding: '8px 12px',
                background: '#FEF2F2',
                border: '1px solid #EF4444',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                color: '#EF4444'
              }}>
                ⚠️ Over budget
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '20px 24px',
          borderTop: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <button
            onClick={onClose}
            style={{
              height: '40px',
              padding: '0 20px',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              background: 'white',
              fontSize: '14px',
              fontWeight: 500,
              color: '#374151',
              cursor: 'pointer',
              transition: 'all 150ms ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              height: '40px',
              padding: '0 20px',
              border: 'none',
              borderRadius: '6px',
              background: '#3B82F6',
              fontSize: '14px',
              fontWeight: 500,
              color: 'white',
              cursor: 'pointer',
              transition: 'all 150ms ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#2563EB'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#3B82F6'}
          >
            Save Changes
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translate(-50%, -45%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
      `}</style>
    </>
  );
}
