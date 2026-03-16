import React, { useState } from 'react';
import { X } from 'lucide-react';

interface CreateBoardDialogProps {
  onClose: () => void;
  onCreate: () => void;
  projectName: string;
}

export function CreateBoardDialog({ onClose, onCreate, projectName }: CreateBoardDialogProps) {
  const [boardType, setBoardType] = useState<'project' | 'activity'>('project');
  const [selectedTemplate, setSelectedTemplate] = useState('design-review');

  const templates = [
    {
      id: 'blank',
      name: 'Create blank project board',
      description: 'Start with Open + Completed columns only',
      columns: 2
    },
    {
      id: 'software-dev',
      name: 'Software Development',
      description: 'Open → In Development → Code Review → QA Testing → Completed',
      columns: 5
    },
    {
      id: 'marketing',
      name: 'Marketing Campaign',
      description: 'Open → In Design → Client Review → Approved → Completed',
      columns: 5
    },
    {
      id: 'design-review',
      name: 'Design Review',
      description: 'Open → Research → Wireframes → Visual Design → Review → Completed',
      columns: 6
    }
  ];

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
            width: '560px',
            maxHeight: '90vh',
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
            <div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', marginBottom: '4px' }}>
                Create Project Board
              </div>
              <div style={{ fontSize: '13px', color: '#6B7280' }}>
                for {projectName}
              </div>
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
            padding: '24px',
            overflowY: 'auto',
            flex: 1
          }}>
            {/* Board Type */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: '#1F2937',
                marginBottom: '12px'
              }}>
                Board Type
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <label style={{
                  flex: 1,
                  padding: '16px',
                  border: `2px solid ${boardType === 'project' ? '#0066FF' : '#E5E7EB'}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: boardType === 'project' ? '#EFF6FF' : 'white',
                  transition: 'all 150ms ease'
                }}>
                  <input
                    type="radio"
                    name="boardType"
                    value="project"
                    checked={boardType === 'project'}
                    onChange={(e) => setBoardType(e.target.value as 'project')}
                    style={{ marginRight: '8px' }}
                  />
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#1F2937' }}>
                    Project Board
                  </span>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px', marginLeft: '20px' }}>
                    One board for entire project
                  </div>
                </label>

                <label style={{
                  flex: 1,
                  padding: '16px',
                  border: `2px solid ${boardType === 'activity' ? '#0066FF' : '#E5E7EB'}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: boardType === 'activity' ? '#EFF6FF' : 'white',
                  transition: 'all 150ms ease'
                }}>
                  <input
                    type="radio"
                    name="boardType"
                    value="activity"
                    checked={boardType === 'activity'}
                    onChange={(e) => setBoardType(e.target.value as 'activity')}
                    style={{ marginRight: '8px' }}
                  />
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#1F2937' }}>
                    Activity Board
                  </span>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px', marginLeft: '20px' }}>
                    Separate board per activity
                  </div>
                </label>
              </div>
            </div>

            {/* Workflow Template */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: '#1F2937',
                marginBottom: '12px'
              }}>
                Select Workflow Template
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {templates.map((template) => (
                  <label
                    key={template.id}
                    style={{
                      padding: '16px',
                      border: `2px solid ${selectedTemplate === template.id ? '#0066FF' : '#E5E7EB'}`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      background: selectedTemplate === template.id ? '#EFF6FF' : 'white',
                      transition: 'all 150ms ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <input
                        type="radio"
                        name="template"
                        value={template.id}
                        checked={selectedTemplate === template.id}
                        onChange={(e) => setSelectedTemplate(e.target.value)}
                        style={{ marginTop: '2px' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: 500,
                          color: '#1F2937',
                          marginBottom: '4px'
                        }}>
                          {template.name}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#6B7280',
                          lineHeight: '1.4'
                        }}>
                          {template.description}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: '#9CA3AF',
                          marginTop: '6px'
                        }}>
                          {template.columns} columns
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
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
              onClick={onCreate}
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
              Create Board
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
