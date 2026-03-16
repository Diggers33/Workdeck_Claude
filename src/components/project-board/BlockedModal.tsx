import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

interface BlockedModalProps {
  taskTitle: string;
  currentReason?: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export function BlockedModal({ taskTitle, currentReason, onConfirm, onCancel }: BlockedModalProps) {
  const [reason, setReason] = useState(currentReason || '');

  const handleSubmit = () => {
    if (reason.trim()) {
      onConfirm(reason.trim());
    }
  };

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(2px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              background: '#FFF7ED',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AlertCircle size={18} color="#ff8d00" />
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937' }}>
                Mark Task as Blocked
              </div>
              <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '2px' }}>
                {taskTitle}
              </div>
            </div>
          </div>
          <button
            onClick={onCancel}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6B7280'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
          <label style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: 600,
            color: '#374151',
            marginBottom: '8px'
          }}>
            Why is this task blocked? <span style={{ color: '#F87171' }}>*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Waiting for API documentation from backend team..."
            autoFocus
            style={{
              width: '100%',
              minHeight: '120px',
              padding: '12px',
              fontSize: '13px',
              color: '#1F2937',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
              resize: 'vertical',
              outline: 'none',
              transition: 'border-color 150ms ease'
            }}
            onFocus={(e) => e.target.style.borderColor = '#0066FF'}
            onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
          />
          <div style={{
            fontSize: '12px',
            color: '#6B7280',
            marginTop: '8px'
          }}>
            Be specific about dependencies, missing resources, or blockers.
          </div>

          {/* Common blocking reasons */}
          <div style={{ marginTop: '20px' }}>
            <div style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#6B7280',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '10px'
            }}>
              Common Reasons
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {[
                'Waiting for approval',
                'Missing requirements',
                'Dependency on other task',
                'Resource unavailable',
                'Technical blocker',
                'Waiting for feedback'
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setReason(suggestion)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    color: '#374151',
                    background: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 150ms ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#EFF6FF';
                    e.currentTarget.style.borderColor = '#0066FF';
                    e.currentTarget.style.color = '#0066FF';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#F9FAFB';
                    e.currentTarget.style.borderColor = '#E5E7EB';
                    e.currentTarget.style.color = '#374151';
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #E5E7EB',
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 500,
              color: '#374151',
              background: 'white',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 150ms ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!reason.trim()}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 500,
              color: 'white',
              background: reason.trim() ? '#ff8d00' : '#D1D5DB',
              border: 'none',
              borderRadius: '6px',
              cursor: reason.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 150ms ease'
            }}
            onMouseEnter={(e) => {
              if (reason.trim()) {
                e.currentTarget.style.background = '#ff7700';
              }
            }}
            onMouseLeave={(e) => {
              if (reason.trim()) {
                e.currentTarget.style.background = '#ff8d00';
              }
            }}
          >
            Mark as Blocked
          </button>
        </div>
      </div>
    </div>
  );
}
