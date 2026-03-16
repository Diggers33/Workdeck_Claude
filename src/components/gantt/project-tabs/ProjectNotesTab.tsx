import React, { useState } from 'react';
import { Edit2, Save, X } from 'lucide-react';

const mockNotes = ``;

export function ProjectNotesTab() {
  const [isEditing, setIsEditing] = useState(false);
  const [noteContent, setNoteContent] = useState(mockNotes);
  const [charCount, setCharCount] = useState(mockNotes.length);
  const maxChars = 5000;

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length <= maxChars) {
      setNoteContent(text);
      setCharCount(text.length);
    }
  };

  const toolbarButtons = [
    { icon: <Edit2 size={14} />, label: 'Edit' },
    { icon: <Save size={14} />, label: 'Save' },
    { icon: <X size={14} />, label: 'Cancel' }
  ];

  const getCharCountColor = () => {
    if (charCount >= maxChars) return '#DC2626';
    if (charCount >= maxChars * 0.95) return '#F97316';
    return '#9CA3AF';
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{
          fontSize: '16px',
          fontWeight: 600,
          color: '#0A0A0A',
          marginBottom: '4px'
        }}>
          Key Observations
        </div>
        <div style={{
          fontSize: '13px',
          color: '#6B7280'
        }}>
          Project manager notes visible to team
        </div>
      </div>

      {/* Edit/View Toggle */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <div style={{
          display: 'flex',
          gap: '8px'
        }}>
          <button
            onClick={() => setIsEditing(false)}
            style={{
              padding: '8px 16px',
              background: !isEditing ? '#EFF6FF' : 'white',
              border: !isEditing ? '1px solid #3B82F6' : '1px solid #E5E7EB',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              color: !isEditing ? '#3B82F6' : '#6B7280',
              cursor: 'pointer',
              transition: 'all 150ms ease'
            }}
          >
            View
          </button>
          <button
            onClick={() => setIsEditing(true)}
            style={{
              padding: '8px 16px',
              background: isEditing ? '#EFF6FF' : 'white',
              border: isEditing ? '1px solid #3B82F6' : '1px solid #E5E7EB',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              color: isEditing ? '#3B82F6' : '#6B7280',
              cursor: 'pointer',
              transition: 'all 150ms ease'
            }}
          >
            Edit
          </button>
        </div>

        {isEditing && (
          <button
            style={{
              padding: '8px 20px',
              background: '#3B82F6',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
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
        )}
      </div>

      {isEditing ? (
        /* Edit Mode */
        <div style={{
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          {/* Toolbar */}
          <div style={{
            height: '44px',
            background: '#F9FAFB',
            borderBottom: '1px solid #E5E7EB',
            padding: '0 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            {toolbarButtons.map((button, index) => (
              <button
                key={index}
                title={button.label}
                style={{
                  width: '32px',
                  height: '32px',
                  border: 'none',
                  background: 'transparent',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background 150ms ease',
                  color: '#6B7280'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'white'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                {button.icon}
              </button>
            ))}
          </div>

          {/* Editor Area */}
          <div style={{ position: 'relative' }}>
            <textarea
              value={noteContent}
              onChange={handleContentChange}
              placeholder="Add key observations, risks, decisions, or important notes..."
              style={{
                width: '100%',
                minHeight: '500px',
                padding: '16px',
                paddingBottom: '40px',
                border: 'none',
                fontSize: '14px',
                color: '#0A0A0A',
                lineHeight: '1.6',
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'inherit',
                background: 'white'
              }}
            />

            {/* Character Count */}
            <div style={{
              position: 'absolute',
              bottom: '12px',
              right: '16px',
              fontSize: '12px',
              color: getCharCountColor(),
              fontWeight: charCount >= maxChars * 0.95 ? 600 : 400
            }}>
              {charCount} / {maxChars}
            </div>
          </div>
        </div>
      ) : (
        /* View Mode */
        <div style={{
          background: '#FAFAFA',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
          padding: '24px',
          fontSize: '14px',
          color: '#0A0A0A',
          lineHeight: '1.8',
          whiteSpace: 'pre-wrap'
        }}>
          {noteContent.split('\n').map((line, index) => {
            // Bold text
            if (line.startsWith('**') && line.endsWith('**')) {
              return (
                <div key={index} style={{
                  fontWeight: 600,
                  fontSize: '15px',
                  marginTop: index > 0 ? '16px' : '0',
                  marginBottom: '8px'
                }}>
                  {line.replace(/\*\*/g, '')}
                </div>
              );
            }
            // Bullet points
            if (line.startsWith('•')) {
              return (
                <div key={index} style={{
                  paddingLeft: '20px',
                  marginBottom: '6px'
                }}>
                  {line}
                </div>
              );
            }
            // Numbered lists
            if (line.match(/^\d+\./)) {
              return (
                <div key={index} style={{
                  paddingLeft: '20px',
                  marginBottom: '6px'
                }}>
                  {line}
                </div>
              );
            }
            // Risk items
            if (line.includes('⚠️')) {
              const severity = line.includes('HIGH') ? '#DC2626' : line.includes('MEDIUM') ? '#F97316' : '#F59E0B';
              return (
                <div key={index} style={{
                  paddingLeft: '20px',
                  marginBottom: '6px',
                  color: severity,
                  fontWeight: 500
                }}>
                  {line}
                </div>
              );
            }
            // Next steps
            if (line.startsWith('→')) {
              return (
                <div key={index} style={{
                  paddingLeft: '20px',
                  marginBottom: '6px',
                  color: '#3B82F6',
                  fontWeight: 500
                }}>
                  {line}
                </div>
              );
            }
            // Empty lines
            if (line.trim() === '') {
              return <div key={index} style={{ height: '8px' }} />;
            }
            // Regular text
            return (
              <div key={index} style={{ marginBottom: '6px' }}>
                {line}
              </div>
            );
          })}
        </div>
      )}

      {/* Last Updated Info */}
      <div style={{
        marginTop: '16px',
        fontSize: '12px',
        color: '#9CA3AF',
        fontStyle: 'italic'
      }}>
        Last updated by Charlie Day • 2 hours ago
      </div>
    </div>
  );
}