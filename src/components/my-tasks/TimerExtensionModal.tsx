import React, { useState, useEffect } from 'react';
import { AlertCircle, Plus } from 'lucide-react';

interface TimerExtensionModalProps {
  onExtend: (additionalMinutes: number) => void;
  onFinish: () => void;
  taskTitle: string;
  remainingSeconds: number;
}

export function TimerExtensionModal({ onExtend, onFinish, taskTitle, remainingSeconds }: TimerExtensionModalProps) {
  const [countdown, setCountdown] = useState(120); // 2 minutes to decide

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onFinish(); // Auto-finish if no action
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onFinish]);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const extensionOptions = [
    { label: '15 min', value: 15 },
    { label: '30 min', value: 30 },
    { label: '1 hour', value: 60 },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50" style={{ backdropFilter: 'blur(4px)' }} />
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl z-50 animate-in"
        style={{ width: '420px', maxWidth: '90vw', border: '2px solid #F59E0B' }}
      >
        {/* Alert Header */}
        <div
          style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
            borderTopLeftRadius: '6px',
            borderTopRightRadius: '6px',
            borderBottom: '1px solid #FCD34D'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: '#F59E0B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <AlertCircle size={24} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#92400E', marginBottom: '2px' }}>
                Timer Ending Soon
              </h2>
              <p style={{ fontSize: '13px', color: '#B45309', fontWeight: 500 }}>
                Less than 2 minutes remaining
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>
          {/* Task info */}
          <div
            style={{
              padding: '12px',
              background: '#F9FAFB',
              borderRadius: '6px',
              marginBottom: '20px',
              border: '1px solid #E5E7EB'
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Current Task
            </div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>
              {taskTitle}
            </div>
          </div>

          {/* Countdown warning */}
          <div
            style={{
              padding: '16px',
              background: '#FEF2F2',
              border: '1px solid #FEE2E2',
              borderRadius: '6px',
              marginBottom: '20px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#991B1B', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Auto-finish in
            </div>
            <div
              style={{
                fontSize: '32px',
                fontWeight: 700,
                color: '#DC2626',
                fontFamily: "'SF Mono', 'Fira Code', monospace",
                letterSpacing: '-0.02em'
              }}
            >
              {formatCountdown(countdown)}
            </div>
            <div style={{ fontSize: '12px', color: '#991B1B', marginTop: '4px' }}>
              Choose an option or timer will stop automatically
            </div>
          </div>

          {/* Extension options */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>
              Extend Timer By:
            </label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {extensionOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onExtend(option.value)}
                  style={{
                    flex: 1,
                    height: '48px',
                    border: '2px solid #0066FF',
                    borderRadius: '6px',
                    background: 'white',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#0066FF',
                    cursor: 'pointer',
                    transition: 'all 120ms ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#EFF6FF';
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <Plus size={16} />
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid #E5E7EB',
            background: '#F9FAFB',
            borderBottomLeftRadius: '6px',
            borderBottomRightRadius: '6px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <button
            onClick={onFinish}
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
            Finish Now
          </button>
          <div style={{ fontSize: '12px', color: '#6B7280' }}>
            or wait for auto-finish
          </div>
        </div>
      </div>
    </>
  );
}
