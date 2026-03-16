import React, { useState } from 'react';
import { X, Clock } from 'lucide-react';
import { CalendarTask } from './WorkdeckCalendar';

interface TimeLogModalProps {
  task: CalendarTask;
  initialDate: Date;
  onClose: () => void;
  onSave: (startTime: Date, duration: number) => void;
}

export function TimeLogModal({ task, initialDate, onClose, onSave }: TimeLogModalProps) {
  // Format initial time
  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const [date, setDate] = useState(initialDate.toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState(formatTime(initialDate));
  const [duration, setDuration] = useState(1); // hours

  const calculateEndTime = () => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration * 60;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  };

  const handleSave = () => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const finalDate = new Date(date);
    finalDate.setHours(hours, minutes, 0, 0);
    onSave(finalDate, duration);
  };

  const remainingHours = task.estimatedHours - task.loggedHours;
  const suggestedDurations = [0.5, 1, 1.5, 2, 3, 4];
  
  // If there's remaining hours, add it as a suggestion
  if (remainingHours > 0 && !suggestedDurations.includes(remainingHours)) {
    suggestedDurations.push(remainingHours);
    suggestedDurations.sort((a, b) => a - b);
  }

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 9998,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onClick={onClose}
      />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '480px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          zIndex: 9999,
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between'
        }}>
          <div style={{ flex: 1, paddingRight: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Clock size={18} color="#0066FF" />
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0A0A0A', margin: 0 }}>
                Log Time
              </h3>
            </div>
            <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '8px' }}>
              <div
                style={{
                  width: '4px',
                  height: '16px',
                  borderRadius: '2px',
                  background: task.projectColor,
                  display: 'inline-block',
                  verticalAlign: 'middle',
                  marginRight: '8px'
                }}
              />
              <span style={{ fontWeight: 500, color: '#0A0A0A' }}>{task.project}</span> — {task.title}
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
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: '#9CA3AF',
              borderRadius: '6px',
              flexShrink: 0
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Task Progress Info */}
          <div style={{
            padding: '12px',
            background: '#F9FAFB',
            borderRadius: '6px',
            marginBottom: '20px',
            fontSize: '12px',
            color: '#374151'
          }}>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ fontWeight: 500 }}>Estimated:</span> {task.estimatedHours}h
              <span style={{ margin: '0 8px', color: '#D1D5DB' }}>|</span>
              <span style={{ fontWeight: 500 }}>Logged:</span> {task.loggedHours}h
              <span style={{ margin: '0 8px', color: '#D1D5DB' }}>|</span>
              <span style={{ fontWeight: 500 }}>Remaining:</span>{' '}
              <span style={{ color: remainingHours < 0 ? '#F97316' : '#10B981' }}>
                {Math.abs(remainingHours).toFixed(1)}h {remainingHours < 0 && '(over budget)'}
              </span>
            </div>
          </div>

          {/* Date */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{
                width: '100%',
                height: '40px',
                padding: '0 12px',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#0A0A0A',
                outline: 'none'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#0066FF'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}
            />
          </div>

          {/* Time Range */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '0 12px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: '#0A0A0A',
                  outline: 'none'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#0066FF'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                End Time
              </label>
              <input
                type="text"
                value={calculateEndTime()}
                disabled
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '0 12px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: '#6B7280',
                  background: '#F9FAFB',
                  cursor: 'not-allowed'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                Duration
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Math.max(0.25, parseFloat(e.target.value) || 0))}
                  step="0.25"
                  min="0.25"
                  style={{
                    width: '100%',
                    height: '40px',
                    padding: '0 32px 0 12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: '#0A0A0A',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#0066FF'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}
                />
                <span style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '13px',
                  color: '#6B7280',
                  pointerEvents: 'none'
                }}>
                  h
                </span>
              </div>
            </div>
          </div>

          {/* Quick Duration Buttons */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
              Quick Select
            </label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {suggestedDurations.map(hours => (
                <button
                  key={hours}
                  onClick={() => setDuration(hours)}
                  style={{
                    padding: '6px 12px',
                    border: duration === hours ? '1px solid #0066FF' : '1px solid #E5E7EB',
                    borderRadius: '6px',
                    background: duration === hours ? '#EBF5FF' : 'white',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: duration === hours ? '#0066FF' : '#374151',
                    transition: 'all 150ms'
                  }}
                  onMouseEnter={(e) => {
                    if (duration !== hours) {
                      e.currentTarget.style.background = '#F9FAFB';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (duration !== hours) {
                      e.currentTarget.style.background = 'white';
                    }
                  }}
                >
                  {hours}h
                  {hours === remainingHours && remainingHours > 0 && (
                    <span style={{ fontSize: '10px', marginLeft: '4px', opacity: 0.7 }}>(remaining)</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Info Message */}
          {remainingHours < 0 && (
            <div style={{
              padding: '10px 12px',
              background: '#FEF3C7',
              border: '1px solid #FCD34D',
              borderRadius: '6px',
              marginBottom: '20px',
              fontSize: '12px',
              color: '#78350F',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px'
            }}>
              <span style={{ flexShrink: 0, marginTop: '1px' }}>⚠️</span>
              <span>This task is already over budget. Logging additional time will increase the overrun.</span>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                height: '40px',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                background: 'white',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                color: '#374151',
                transition: 'all 150ms'
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
              onClick={handleSave}
              style={{
                flex: 1,
                height: '40px',
                border: 'none',
                borderRadius: '6px',
                background: '#0066FF',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                color: 'white',
                transition: 'all 150ms'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#0052CC'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#0066FF'}
            >
              Log Time
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
