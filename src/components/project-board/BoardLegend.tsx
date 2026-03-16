import React from 'react';
import { AlertCircle, Calendar, CheckSquare, Paperclip, MessageCircle, User, X } from 'lucide-react';

interface BoardLegendProps {
  onClose: () => void;
}

export function BoardLegend({ onClose }: BoardLegendProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          zIndex: 1999,
          backdropFilter: 'blur(2px)'
        }}
      />

      {/* Legend Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: '700px',
          maxHeight: '85vh',
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
          zIndex: 2000,
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
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1F2937' }}>
              Board Legend
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6B7280' }}>
              Understanding task indicators and visual cues
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              color: '#6B7280'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px'
        }}>
          {/* Status Badges */}
          <div style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
              Status Badges
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  padding: '4px 8px',
                  background: '#ff8d00',
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.3px'
                }}>
                  BLOCKED
                </div>
                <span style={{ fontSize: '13px', color: '#4B5563' }}>
                  Task is blocked and cannot proceed. Hover to see blocking reason.
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  background: '#FEE2E2',
                  color: '#DC2626',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 600
                }}>
                  <AlertCircle size={12} />
                  OVERDUE
                </div>
                <span style={{ fontSize: '13px', color: '#4B5563' }}>
                  Task is past its due date and requires immediate attention.
                </span>
              </div>
            </div>
          </div>

          {/* Priority Indicators */}
          <div style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
              Priority Levels
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F87171' }} />
                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#F87171' }}>High</span>
                </div>
                <span style={{ fontSize: '13px', color: '#4B5563' }}>
                  Critical priority - should be addressed first
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ff8d00' }} />
                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#ff8d00' }}>Medium</span>
                </div>
                <span style={{ fontSize: '13px', color: '#4B5563' }}>
                  Standard priority - normal workflow
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#60A5FA' }} />
                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#60A5FA' }}>Low</span>
                </div>
                <span style={{ fontSize: '13px', color: '#4B5563' }}>
                  Can be addressed when capacity allows
                </span>
              </div>
            </div>
          </div>

          {/* Card Border Colors */}
          <div style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
              Left Border Colors
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '4px', height: '24px', background: '#F87171', borderRadius: '2px' }} />
                <span style={{ fontSize: '13px', color: '#4B5563' }}>
                  Red border indicates overdue or blocked task
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '4px', height: '24px', background: '#ff4f6a', borderRadius: '2px' }} />
                <span style={{ fontSize: '13px', color: '#4B5563' }}>
                  Pink-red border indicates high priority task
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '4px', height: '24px', background: '#60A5FA', borderRadius: '2px' }} />
                <span style={{ fontSize: '13px', color: '#4B5563' }}>
                  Column color indicates normal task status
                </span>
              </div>
            </div>
          </div>

          {/* Task Metadata Icons */}
          <div style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
              Task Metadata
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Calendar size={14} color="#6B7280" />
                <span style={{ fontSize: '13px', color: '#4B5563' }}>
                  Due date - shows "Today" for tasks due today
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <CheckSquare size={14} color="#6B7280" />
                <span style={{ fontSize: '13px', color: '#4B5563' }}>
                  Checklist progress (e.g., 3/5 items completed)
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Paperclip size={14} color="#6B7280" />
                <span style={{ fontSize: '13px', color: '#4B5563' }}>
                  Number of attachments on the task
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <MessageCircle size={14} color="#6B7280" />
                <span style={{ fontSize: '13px', color: '#4B5563' }}>
                  Number of comments and discussions
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: '#60A5FA',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 600,
                  color: 'white'
                }}>
                  SC
                </div>
                <span style={{ fontSize: '13px', color: '#4B5563' }}>
                  Task assignees (shows initials or count if multiple)
                </span>
              </div>
            </div>
          </div>

          {/* Card Background Colors */}
          <div style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
              Card Background Tints
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '32px',
                  height: '24px',
                  background: '#FEF2F2',
                  border: '1px solid #E5E7EB',
                  borderRadius: '4px'
                }} />
                <span style={{ fontSize: '13px', color: '#4B5563' }}>
                  Light red tint for overdue tasks
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '32px',
                  height: '24px',
                  background: '#FFF7ED',
                  border: '1px solid #E5E7EB',
                  borderRadius: '4px'
                }} />
                <span style={{ fontSize: '13px', color: '#4B5563' }}>
                  Light orange tint for blocked tasks
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '32px',
                  height: '24px',
                  background: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '4px'
                }} />
                <span style={{ fontSize: '13px', color: '#4B5563' }}>
                  White background for normal tasks
                </span>
              </div>
            </div>
          </div>

          {/* Labels/Tags */}
          <div style={{ marginBottom: '12px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
              Labels & Tags
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <div style={{
                    padding: '3px 8px',
                    background: '#968fe5',
                    color: 'white',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: 500
                  }}>
                    Design
                  </div>
                  <div style={{
                    padding: '3px 8px',
                    background: '#34D399',
                    color: 'white',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: 500
                  }}>
                    Backend
                  </div>
                </div>
                <span style={{ fontSize: '13px', color: '#4B5563' }}>
                  Color-coded labels for task categorization
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              height: '36px',
              padding: '0 16px',
              background: '#0066FF',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Got it
          </button>
        </div>
      </div>
    </>
  );
}
