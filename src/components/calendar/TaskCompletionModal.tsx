import React from 'react';
import { X } from 'lucide-react';
import { CalendarTask } from './WorkdeckCalendar';

interface TaskCompletionModalProps {
  task: CalendarTask;
  onClose: () => void;
  onConfirm: () => void;
}

export function TaskCompletionModal({ task, onClose, onConfirm }: TaskCompletionModalProps) {
  const otherAssigneesCount = task.assignedTo.filter(a => a !== 'You').length;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9998,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '480px',
          maxWidth: '90vw',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          zIndex: 9999,
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0A0A0A', margin: 0 }}>
            Mark your part complete?
          </h3>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              padding: 0,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: '#6B7280',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
              transition: 'all 150ms'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Task Info */}
          <div style={{
            marginBottom: '24px',
            padding: '16px',
            background: '#F9FAFB',
            borderRadius: '8px',
            borderLeft: `4px solid ${task.projectColor}`
          }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#0A0A0A', marginBottom: '4px' }}>
              "{task.title}"
            </div>
            <div style={{ fontSize: '13px', color: '#6B7280' }}>
              {task.project}
            </div>
          </div>

          {/* Explanation */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', color: '#374151', marginBottom: '12px' }}>
              This marks <span style={{ fontWeight: 600 }}>YOUR</span> work as done.
            </div>
            <div style={{ fontSize: '14px', color: '#374151', marginBottom: '12px' }}>
              Task moves to your <span style={{ fontWeight: 600 }}>"Done"</span> column.
            </div>
          </div>

          {/* Other Assignees */}
          {otherAssigneesCount > 0 && (
            <div style={{
              padding: '16px',
              background: '#FFF7ED',
              border: '1px solid #FDBA74',
              borderRadius: '8px',
              marginBottom: '24px'
            }}>
              <div style={{ fontSize: '13px', color: '#9A3412', display: 'flex', alignItems: 'center', gap: '8px' }}>
                👥 <span style={{ fontWeight: 600 }}>{otherAssigneesCount} other {otherAssigneesCount === 1 ? 'person' : 'people'}</span> still assigned.
              </div>
              <div style={{ fontSize: '13px', color: '#9A3412', marginTop: '4px' }}>
                Task stays active for them.
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                background: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                color: '#374151',
                transition: 'all 150ms'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '6px',
                background: '#0066FF',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                color: 'white',
                transition: 'all 150ms'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#0052CC'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#0066FF'}
            >
              Mark Complete
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
