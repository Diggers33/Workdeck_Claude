import React, { useState } from 'react';
import { X } from 'lucide-react';

interface CreateViewModalProps {
  onClose: () => void;
  onCreate: (viewData: any) => void;
  currentFilters: any[];
  currentGrouping: string;
  currentCardSize: 'small' | 'medium' | 'large';
}

export function CreateViewModal({ 
  onClose, 
  onCreate, 
  currentFilters,
  currentGrouping,
  currentCardSize
}: CreateViewModalProps) {
  const [viewName, setViewName] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'shared'>('private');

  const handleCreate = () => {
    if (!viewName.trim()) return;

    onCreate({
      name: viewName.trim(),
      filters: currentFilters,
      groupBy: currentGrouping,
      cardSize: currentCardSize,
      visibility,
      isSystem: false
    });

    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        width: '520px',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ fontSize: '18px', fontWeight: 600, color: '#1F2937' }}>
            Create Saved View
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#6B7280',
              padding: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: '24px',
          overflowY: 'auto'
        }}>
          {/* View Name */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 600,
              color: '#374151',
              marginBottom: '8px'
            }}>
              View Name
            </label>
            <input
              type="text"
              value={viewName}
              onChange={(e) => setViewName(e.target.value)}
              placeholder="e.g., My Backend Tasks"
              autoFocus
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
          </div>

          {/* Current Filters */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 600,
              color: '#374151',
              marginBottom: '8px'
            }}>
              Save current filters:
            </label>
            <div style={{
              padding: '12px',
              background: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: '6px'
            }}>
              {currentFilters.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#6B7280' }}>
                  {currentFilters.map((filter, index) => (
                    <li key={index} style={{ marginBottom: '4px' }}>
                      {filter.type}: {filter.label}
                    </li>
                  ))}
                </ul>
              ) : (
                <div style={{ fontSize: '13px', color: '#9CA3AF', fontStyle: 'italic' }}>
                  No filters active
                </div>
              )}
            </div>
          </div>

          {/* Grouping & Card Size */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginBottom: '20px'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '8px'
              }}>
                Grouping
              </label>
              <div style={{
                height: '40px',
                padding: '0 12px',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                fontSize: '14px',
                color: '#1F2937',
                background: '#F9FAFB'
              }}>
                {currentGrouping === 'none' ? 'None' : currentGrouping}
              </div>
            </div>
            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '8px'
              }}>
                Card size
              </label>
              <div style={{
                height: '40px',
                padding: '0 12px',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                fontSize: '14px',
                color: '#1F2937',
                background: '#F9FAFB',
                textTransform: 'capitalize'
              }}>
                {currentCardSize}
              </div>
            </div>
          </div>

          {/* Visibility */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 600,
              color: '#374151',
              marginBottom: '8px'
            }}>
              Visibility
            </label>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px',
              border: `2px solid ${visibility === 'private' ? '#0066FF' : '#E5E7EB'}`,
              borderRadius: '6px',
              cursor: 'pointer',
              marginBottom: '8px',
              background: visibility === 'private' ? '#EFF6FF' : 'white'
            }}>
              <input
                type="radio"
                name="visibility"
                checked={visibility === 'private'}
                onChange={() => setVisibility('private')}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#1F2937' }}>
                  Just me
                </div>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>
                  Only you can see this view
                </div>
              </div>
            </label>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px',
              border: `2px solid ${visibility === 'shared' ? '#0066FF' : '#E5E7EB'}`,
              borderRadius: '6px',
              cursor: 'pointer',
              background: visibility === 'shared' ? '#EFF6FF' : 'white'
            }}>
              <input
                type="radio"
                name="visibility"
                checked={visibility === 'shared'}
                onChange={() => setVisibility('shared')}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#1F2937' }}>
                  Shared with project team
                </div>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>
                  All team members can access this view
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px'
        }}>
          <button
            onClick={onClose}
            style={{
              height: '36px',
              padding: '0 16px',
              background: 'transparent',
              color: '#6B7280',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!viewName.trim()}
            style={{
              height: '36px',
              padding: '0 16px',
              background: viewName.trim() ? '#0066FF' : '#E5E7EB',
              color: viewName.trim() ? 'white' : '#9CA3AF',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: viewName.trim() ? 'pointer' : 'not-allowed'
            }}
          >
            Create View
          </button>
        </div>
      </div>
    </div>
  );
}
