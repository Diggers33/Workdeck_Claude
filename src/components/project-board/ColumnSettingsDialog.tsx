import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Column } from './ProjectBoard';

interface ColumnSettingsDialogProps {
  column: Column;
  onClose: () => void;
  onSave: (updates: Partial<Column>) => void;
}

export function ColumnSettingsDialog({ column, onClose, onSave }: ColumnSettingsDialogProps) {
  const [name, setName] = useState(column.name);
  const [color, setColor] = useState(column.color);
  const [isCompleted, setIsCompleted] = useState(column.isCompleted || false);

  const availableColors = [
    { name: 'Green 1', value: '#00b16a' },
    { name: 'Green 2', value: '#00d400' },
    { name: 'Green 3', value: '#34D399' },
    { name: 'Yellow 1', value: '#ffbd01' },
    { name: 'Yellow 2', value: '#ff8d00' },
    { name: 'Red 1', value: '#ff4f6a' },
    { name: 'Red 2', value: '#F87171' },
    { name: 'Red 3', value: '#b3005f' },
    { name: 'Purple 1', value: '#968fe5' },
    { name: 'Purple 2', value: '#9000c3' },
    { name: 'Blue 1', value: '#00b4cd' },
    { name: 'Blue 2', value: '#60A5FA' },
    { name: 'Blue 3', value: '#254eef' },
    { name: 'Blue 4', value: '#193fb4' },
    { name: 'Gray', value: '#3a3d50' }
  ];

  const handleSave = () => {
    if (!name.trim()) {
      alert('Column name is required');
      return;
    }

    if (name.length > 25) {
      alert('Column name must be 25 characters or less');
      return;
    }

    onSave({ name, color, isCompleted });
  };

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
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Dialog */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '480px',
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
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
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#1F2937' }}>
              Edit Column
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
              onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div style={{
            padding: '24px'
          }}>
            {/* Column Name */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: '#1F2937',
                marginBottom: '8px'
              }}>
                Column Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={25}
                placeholder="Enter column name"
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '0 12px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#0066FF'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}
              />
              <div style={{
                fontSize: '11px',
                color: '#9CA3AF',
                marginTop: '4px',
                textAlign: 'right'
              }}>
                {name.length}/25
              </div>
            </div>

            {/* Column Color */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: '#1F2937',
                marginBottom: '12px'
              }}>
                Column Color
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '8px'
              }}>
                {availableColors.map((colorOption) => (
                  <button
                    key={colorOption.value}
                    onClick={() => setColor(colorOption.value)}
                    title={colorOption.name}
                    style={{
                      width: '100%',
                      aspectRatio: '1',
                      background: colorOption.value,
                      border: color === colorOption.value ? '3px solid #1F2937' : '2px solid #E5E7EB',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'all 150ms ease'
                    }}
                    onMouseEnter={(e) => {
                      if (color !== colorOption.value) {
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    {color === colorOption.value && (
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        color: 'white',
                        fontSize: '18px',
                        fontWeight: 600
                      }}>
                        ✓
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Completion Type */}
            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                padding: '12px',
                background: '#F9FAFB',
                borderRadius: '6px',
                border: '1px solid #E5E7EB'
              }}>
                <input
                  type="checkbox"
                  checked={isCompleted}
                  onChange={(e) => setIsCompleted(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: '#1F2937' }}>
                    Mark as Completed Column
                  </div>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                    Tasks in this column will be marked as done
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: '20px 24px',
            borderTop: '1px solid #E5E7EB',
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={onClose}
              style={{
                height: '40px',
                padding: '0 20px',
                background: 'white',
                color: '#6B7280',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer'
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
                background: '#0066FF',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#0052CC'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#0066FF'}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
