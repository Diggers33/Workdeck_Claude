import React, { useState } from 'react';
import { X, Clock } from 'lucide-react';

interface SetTimerDurationModalProps {
  onClose: () => void;
  onStart: (minutes: number) => void;
  taskTitle: string;
}

export function SetTimerDurationModal({ onClose, onStart, taskTitle }: SetTimerDurationModalProps) {
  const [customMinutes, setCustomMinutes] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);

  const presets = [
    { label: '15 min', value: 15 },
    { label: '30 min', value: 30 },
    { label: '45 min', value: 45 },
    { label: '1 hour', value: 60 },
    { label: '1.5 hours', value: 90 },
    { label: '2 hours', value: 120 },
  ];

  const handleStart = () => {
    const duration = selectedPreset || parseInt(customMinutes);
    if (duration && duration > 0) {
      onStart(duration);
      onClose();
    }
  };

  const handlePresetClick = (value: number) => {
    setSelectedPreset(value);
    setCustomMinutes('');
  };

  const handleCustomChange = (value: string) => {
    setCustomMinutes(value);
    setSelectedPreset(null);
  };

  const isValid = selectedPreset !== null || (customMinutes !== '' && parseInt(customMinutes) > 0);

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50"
        style={{ width: '480px', maxWidth: '90vw' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#E5E7EB' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
              Set Timer Duration
            </h2>
            <p style={{ fontSize: '13px', color: '#6B7280' }}>
              How long will you work on this task?
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#F9FAFB] transition-colors"
          >
            <X size={18} color="#6B7280" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {/* Task title */}
          <div
            style={{
              padding: '12px',
              background: '#F9FAFB',
              borderRadius: '6px',
              marginBottom: '24px',
              border: '1px solid #E5E7EB'
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Task
            </div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>
              {taskTitle}
            </div>
          </div>

          {/* Preset durations */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
              Quick Select
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {presets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => handlePresetClick(preset.value)}
                  style={{
                    padding: '12px',
                    border: selectedPreset === preset.value ? '2px solid #0066FF' : '1px solid #E5E7EB',
                    borderRadius: '6px',
                    background: selectedPreset === preset.value ? '#EFF6FF' : 'white',
                    fontSize: '13px',
                    fontWeight: selectedPreset === preset.value ? 600 : 500,
                    color: selectedPreset === preset.value ? '#0066FF' : '#374151',
                    cursor: 'pointer',
                    transition: 'all 120ms ease'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedPreset !== preset.value) {
                      e.currentTarget.style.borderColor = '#D1D5DB';
                      e.currentTarget.style.background = '#F9FAFB';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedPreset !== preset.value) {
                      e.currentTarget.style.borderColor = '#E5E7EB';
                      e.currentTarget.style.background = 'white';
                    }
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom duration */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
              Custom Duration
            </label>
            <div className="relative">
              <Clock
                size={16}
                color="#9CA3AF"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              />
              <input
                type="number"
                min="1"
                placeholder="Enter minutes..."
                value={customMinutes}
                onChange={(e) => handleCustomChange(e.target.value)}
                style={{
                  width: '100%',
                  height: '40px',
                  paddingLeft: '40px',
                  paddingRight: '12px',
                  border: customMinutes ? '2px solid #0066FF' : '1px solid #E5E7EB',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: '#111827',
                  background: customMinutes ? '#EFF6FF' : 'white'
                }}
                onFocus={(e) => {
                  if (!customMinutes) {
                    e.target.style.borderColor = '#0066FF';
                  }
                }}
                onBlur={(e) => {
                  if (!customMinutes) {
                    e.target.style.borderColor = '#E5E7EB';
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3 px-6 py-4 border-t"
          style={{ borderColor: '#E5E7EB', background: '#F9FAFB' }}
        >
          <button
            onClick={onClose}
            style={{
              height: '36px',
              paddingLeft: '16px',
              paddingRight: '16px',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              color: '#374151',
              background: 'white',
              cursor: 'pointer',
              transition: 'all 120ms ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#F9FAFB';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleStart}
            disabled={!isValid}
            style={{
              height: '36px',
              paddingLeft: '20px',
              paddingRight: '20px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              color: 'white',
              background: isValid ? '#0066FF' : '#D1D5DB',
              cursor: isValid ? 'pointer' : 'not-allowed',
              transition: 'all 120ms ease'
            }}
            onMouseEnter={(e) => {
              if (isValid) {
                e.currentTarget.style.background = '#0052CC';
              }
            }}
            onMouseLeave={(e) => {
              if (isValid) {
                e.currentTarget.style.background = '#0066FF';
              }
            }}
          >
            Start Timer
          </button>
        </div>
      </div>
    </>
  );
}
