import React, { useState } from 'react';
import { Edit2, Check, Trash2, Flag } from 'lucide-react';

interface TaskFlagsTabProps {
  task: any;
}

const mockFlags: any[] = [];

export function TaskFlagsTab({ task }: TaskFlagsTabProps) {
  const [showFlagForm, setShowFlagForm] = useState(false);
  const [flags, setFlags] = useState(mockFlags);
  const [selectedSeverity, setSelectedSeverity] = useState<'low' | 'medium' | 'high'>('high');
  const [flagTitle, setFlagTitle] = useState('');
  const [flagDate, setFlagDate] = useState('14/10/21');
  const [flagDescription, setFlagDescription] = useState('');
  const [flagMitigation, setFlagMitigation] = useState('');

  const severityConfig = {
    low: { color: '#F59E0B', bg: '#FEF3C7', label: 'Low' },
    medium: { color: '#F97316', bg: '#FED7AA', label: 'Medium' },
    high: { color: '#DC2626', bg: '#FEE2E2', label: 'High' }
  };

  const handleSaveFla = () => {
    if (flagTitle.trim()) {
      // Add new flag logic
      setShowFlagForm(false);
      setFlagTitle('');
      setFlagDescription('');
      setFlagMitigation('');
    }
  };

  return (
    <div style={{ maxWidth: '100%' }}>
      {/* Existing Flags */}
      {flags.map((flag) => (
        <div
          key={flag.id}
          style={{
            minHeight: '120px',
            background: 'white',
            border: '1px solid #E5E7EB',
            borderLeft: `4px solid ${severityConfig.high.color}`,
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '16px',
            transition: 'all 150ms ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'}
          onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start'
          }}>
            {/* Left Side - Flag Info */}
            <div style={{ flex: 1, display: 'flex', gap: '12px' }}>
              <div style={{ fontSize: '28px' }}>🚩</div>
              <div>
                <div style={{
                  fontSize: '17px',
                  fontWeight: 600,
                  color: '#0A0A0A',
                  marginBottom: '4px'
                }}>
                  {flag.title}
                </div>
                <div style={{
                  fontSize: '13px',
                  color: '#9CA3AF'
                }}>
                  Flagged on {flag.date}
                </div>
              </div>
            </div>

            {/* Right Side - Status & Actions */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                padding: '4px 12px',
                background: severityConfig.high.bg,
                color: severityConfig.high.color,
                fontSize: '12px',
                fontWeight: 700,
                borderRadius: '12px',
                textTransform: 'uppercase'
              }}>
                {flag.status}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={{
                  width: '32px',
                  height: '32px',
                  border: 'none',
                  background: 'transparent',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background 150ms ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <Edit2 size={16} color="#6B7280" />
                </button>
                <button style={{
                  width: '32px',
                  height: '32px',
                  border: 'none',
                  background: 'transparent',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background 150ms ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#D1FAE5'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <Check size={16} color="#10B981" />
                </button>
                <button style={{
                  width: '32px',
                  height: '32px',
                  border: 'none',
                  background: 'transparent',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background 150ms ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#FEE2E2'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <Trash2 size={16} color="#DC2626" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Add Flag Button */}
      {!showFlagForm && (
        <button
          onClick={() => setShowFlagForm(true)}
          style={{
            width: '140px',
            height: '48px',
            background: 'white',
            border: '2px dashed #3B82F6',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '15px',
            fontWeight: 600,
            color: '#3B82F6',
            cursor: 'pointer',
            transition: 'all 150ms ease',
            marginBottom: '24px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#EFF6FF';
            e.currentTarget.style.borderStyle = 'solid';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'white';
            e.currentTarget.style.borderStyle = 'dashed';
          }}
        >
          <span>🚩</span>
          <span>Add Flag</span>
        </button>
      )}

      {/* Flag Creation Form */}
      {showFlagForm && (
        <div style={{
          background: '#FAFAFA',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          {/* Severity Selector */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 500,
              color: '#6B7280',
              marginBottom: '12px'
            }}>
              Severity
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              {(['low', 'medium', 'high'] as const).map((severity) => (
                <button
                  key={severity}
                  onClick={() => setSelectedSeverity(severity)}
                  style={{
                    flex: 1,
                    height: '72px',
                    background: selectedSeverity === severity ? '#EFF6FF' : 'white',
                    border: selectedSeverity === severity ? '2px solid #3B82F6' : '2px solid #E5E7EB',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    transition: 'all 150ms ease'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedSeverity !== severity) {
                      e.currentTarget.style.borderColor = '#D1D5DB';
                      e.currentTarget.style.background = '#FAFAFA';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedSeverity !== severity) {
                      e.currentTarget.style.borderColor = '#E5E7EB';
                      e.currentTarget.style.background = 'white';
                    }
                  }}
                >
                  <Flag size={24} color={severityConfig[severity].color} />
                  <span style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#6B7280'
                  }}>
                    {severityConfig[severity].label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Title Field */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 500,
              color: '#6B7280',
              marginBottom: '8px'
            }}>
              Title
            </label>
            <input
              type="text"
              placeholder="What's the risk or issue?"
              value={flagTitle}
              onChange={(e) => setFlagTitle(e.target.value)}
              style={{
                width: '100%',
                height: '48px',
                padding: '0 16px',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                fontSize: '15px',
                color: '#0A0A0A',
                outline: 'none',
                background: 'white'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#3B82F6';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#E5E7EB';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Date Field */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 500,
              color: '#6B7280',
              marginBottom: '8px'
            }}>
              Date
            </label>
            <input
              type="text"
              value={flagDate}
              onChange={(e) => setFlagDate(e.target.value)}
              style={{
                width: '100%',
                height: '48px',
                padding: '0 16px',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                fontSize: '15px',
                color: '#0A0A0A',
                outline: 'none',
                background: 'white'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#3B82F6';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#E5E7EB';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Risk Description */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 500,
              color: '#6B7280',
              marginBottom: '8px'
            }}>
              Risk Description
            </label>
            <textarea
              placeholder="Describe the risk in detail..."
              value={flagDescription}
              onChange={(e) => setFlagDescription(e.target.value)}
              style={{
                width: '100%',
                minHeight: '120px',
                padding: '12px 16px',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                fontSize: '15px',
                color: '#0A0A0A',
                lineHeight: '1.5',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                background: 'white'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#3B82F6';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#E5E7EB';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Mitigation Plan */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 500,
              color: '#6B7280',
              marginBottom: '8px'
            }}>
              Mitigation Plan
            </label>
            <textarea
              placeholder="How will this be addressed?"
              value={flagMitigation}
              onChange={(e) => setFlagMitigation(e.target.value)}
              style={{
                width: '100%',
                minHeight: '120px',
                padding: '12px 16px',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                fontSize: '15px',
                color: '#0A0A0A',
                lineHeight: '1.5',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                background: 'white'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#3B82F6';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#E5E7EB';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={() => setShowFlagForm(false)}
              style={{
                height: '44px',
                padding: '0 20px',
                background: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#6B7280',
                cursor: 'pointer',
                transition: 'all 150ms ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#F9FAFB';
                e.currentTarget.style.borderColor = '#D1D5DB';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.borderColor = '#E5E7EB';
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveFla}
              style={{
                height: '44px',
                padding: '0 24px',
                background: severityConfig[selectedSeverity].color,
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                color: 'white',
                cursor: 'pointer',
                transition: 'all 150ms ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              Flag Risk
            </button>
          </div>
        </div>
      )}
    </div>
  );
}