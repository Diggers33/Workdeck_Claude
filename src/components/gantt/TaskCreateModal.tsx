import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Users, FileText, Search, Loader2 } from 'lucide-react';
import { apiClient } from '@/services/api-client';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  avatar?: string;
}

interface TaskCreateModalProps {
  activityId: string;
  activityName: string;
  projectId: string;
  onClose: () => void;
  onSave: (taskData: any) => Promise<void>;
}

export function TaskCreateModal({
  activityId,
  activityName,
  projectId,
  onClose,
  onSave
}: TaskCreateModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [taskName, setTaskName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [memberHours, setMemberHours] = useState<Record<string, string>>({});
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return formatDateForInput(today);
  });
  const [endDate, setEndDate] = useState(() => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return formatDateForInput(nextWeek);
  });
  const [description, setDescription] = useState('');

  // Employee search state
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Load all users on mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setIsLoadingUsers(true);
        const response = await apiClient.get('/queries/users-summary');
        const users = (response as any).result || response || [];
        setAllUsers(users.map((u: any) => ({
          id: u.id,
          firstName: u.firstName || '',
          lastName: u.lastName || '',
          email: u.email || '',
          avatar: u.avatar
        })));
      } catch (error) {
        console.error('Failed to load users:', error);
      } finally {
        setIsLoadingUsers(false);
      }
    };
    loadUsers();
  }, []);

  // Filter users based on search
  const filteredUsers = allUsers.filter(user => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || user.email?.toLowerCase().includes(search);
  });

  // Animation on mount
  useEffect(() => {
    setIsOpen(true);
  }, []);

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  function formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function formatDateForApi(dateStr: string): string {
    // Convert YYYY-MM-DD to DD/MM/YYYY
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onClose, 200);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const toggleMember = (memberId: string) => {
    setSelectedMembers(prev => {
      if (prev.includes(memberId)) {
        // Remove member and their hours
        setMemberHours(h => {
          const newHours = { ...h };
          delete newHours[memberId];
          return newHours;
        });
        return prev.filter(id => id !== memberId);
      } else {
        // Add member with default 0 hours
        setMemberHours(h => ({ ...h, [memberId]: '0' }));
        return [...prev, memberId];
      }
    });
  };

  const updateMemberHours = (memberId: string, hours: string) => {
    setMemberHours(prev => ({ ...prev, [memberId]: hours }));
  };

  const handleSave = async () => {
    if (!taskName.trim()) {
      alert('Please enter a task name');
      return;
    }

    setIsSaving(true);
    try {
      const newTaskId = crypto.randomUUID();

      // Build participants array with individual hours allocation
      const participants = selectedMembers.map((memberId, index) => {
        const hours = memberHours[memberId] || '0';
        console.log('[TaskCreateModal] Member', memberId, 'hours:', hours);
        return {
          taskId: newTaskId,
          user: { id: memberId },
          userId: memberId,
          isOwner: index === 0,  // First selected is owner
          allocatedHours: hours,
          plannedHours: hours,
          availableHours: hours,
          position: index
        };
      });
      console.log('[TaskCreateModal] Participants to send:', participants);

      // Calculate total hours for the task
      const totalHours = selectedMembers.reduce((sum, id) => {
        return sum + parseFloat(memberHours[id] || '0');
      }, 0);

      const taskData = {
        id: newTaskId,
        activity: { id: activityId },
        name: taskName.trim(),
        description: description.trim(),
        flags: 1,
        position: 0,
        startDate: formatDateForApi(startDate),
        endDate: formatDateForApi(endDate),
        availableHours: String(totalHours),
        plannedHours: String(totalHours),
        participants
      };

      await onSave(taskData);
      handleClose();
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('Failed to create task. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(2px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: isOpen ? 1 : 0,
        transition: 'opacity 200ms ease-out'
      }}
    >
      {/* Modal Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '520px',
          maxWidth: '90vw',
          maxHeight: '90vh',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          transform: isOpen ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(20px)',
          transition: 'transform 200ms ease-out'
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
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#111827' }}>
              Create New Task
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6B7280' }}>
              Adding to: {activityName}
            </p>
          </div>
          <button
            onClick={handleClose}
            style={{
              width: '36px',
              height: '36px',
              border: 'none',
              background: '#F3F4F6',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6B7280',
              transition: 'all 150ms ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#E5E7EB';
              e.currentTarget.style.color = '#111827';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#F3F4F6';
              e.currentTarget.style.color = '#6B7280';
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {/* Task Name */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
              Task Name <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="Enter task name"
              autoFocus
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 150ms ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#3B82F6'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#D1D5DB'}
            />
          </div>

          {/* Date Range */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                <Calendar size={16} />
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 150ms ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#3B82F6'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#D1D5DB'}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                <Calendar size={16} />
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 150ms ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#3B82F6'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#D1D5DB'}
              />
            </div>
          </div>

          {/* Assigned To */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
              <Users size={16} />
              Assign To
              {selectedMembers.length > 0 && (
                <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 400 }}>
                  ({selectedMembers.length} selected, first = Owner)
                </span>
              )}
              {selectedMembers.length > 0 && (
                <span style={{ fontSize: '12px', color: '#3B82F6', fontWeight: 500, marginLeft: 'auto' }}>
                  Total: {selectedMembers.reduce((sum, id) => sum + parseFloat(memberHours[id] || '0'), 0)} hrs
                </span>
              )}
            </label>

            {/* Search Input */}
            <div style={{ position: 'relative', marginBottom: '8px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search employees..."
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 150ms ease'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#3B82F6'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#D1D5DB'}
              />
            </div>

            {/* User List */}
            <div style={{
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              padding: '8px',
              maxHeight: '180px',
              overflowY: 'auto'
            }}>
              {isLoadingUsers ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', gap: '8px', color: '#6B7280' }}>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  <span style={{ fontSize: '13px' }}>Loading employees...</span>
                </div>
              ) : filteredUsers.length === 0 ? (
                <p style={{ margin: 0, padding: '12px', color: '#9CA3AF', fontSize: '13px', textAlign: 'center' }}>
                  {searchTerm ? 'No employees match your search' : 'No employees available'}
                </p>
              ) : (
                filteredUsers.map((user, index) => {
                  const isSelected = selectedMembers.includes(user.id);
                  const selectionIndex = selectedMembers.indexOf(user.id);
                  return (
                    <div
                      key={user.id}
                      onClick={() => toggleMember(user.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        background: isSelected ? '#EFF6FF' : 'transparent',
                        border: isSelected ? '1px solid #3B82F6' : '1px solid transparent',
                        marginBottom: index < filteredUsers.length - 1 ? '4px' : 0,
                        transition: 'all 150ms ease'
                      }}
                    >
                      {/* Avatar */}
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: isSelected ? '#3B82F6' : '#E5E7EB',
                        color: isSelected ? 'white' : '#6B7280',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 600,
                        flexShrink: 0
                      }}>
                        {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                      </div>

                      {/* Name */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>
                          {user.firstName} {user.lastName}
                        </div>
                        {user.email && (
                          <div style={{ fontSize: '12px', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user.email}
                          </div>
                        )}
                      </div>

                      {/* Owner badge */}
                      {selectionIndex === 0 && (
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          color: '#3B82F6',
                          background: '#DBEAFE',
                          padding: '2px 8px',
                          borderRadius: '10px'
                        }}>
                          Owner
                        </span>
                      )}

                      {/* Hours input - shown when selected */}
                      {isSelected && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <input
                            type="number"
                            value={memberHours[user.id] || '0'}
                            onChange={(e) => updateMemberHours(user.id, e.target.value)}
                            min="0"
                            step="0.5"
                            style={{
                              width: '60px',
                              padding: '4px 6px',
                              border: '1px solid #D1D5DB',
                              borderRadius: '4px',
                              fontSize: '13px',
                              textAlign: 'right',
                              outline: 'none'
                            }}
                            onFocus={(e) => e.currentTarget.style.borderColor = '#3B82F6'}
                            onBlur={(e) => e.currentTarget.style.borderColor = '#D1D5DB'}
                          />
                          <span style={{ fontSize: '12px', color: '#6B7280' }}>hrs</span>
                        </div>
                      )}

                      {/* Checkbox indicator */}
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '4px',
                        border: isSelected ? '2px solid #3B82F6' : '2px solid #D1D5DB',
                        background: isSelected ? '#3B82F6' : 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {isSelected && (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
              <FileText size={16} />
              Description
              <span style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add task description..."
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                transition: 'border-color 150ms ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#3B82F6'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#D1D5DB'}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <button
            onClick={handleClose}
            disabled={isSaving}
            style={{
              padding: '10px 20px',
              border: '1px solid #D1D5DB',
              background: 'white',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              color: '#374151',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              transition: 'all 150ms ease'
            }}
            onMouseEnter={(e) => {
              if (!isSaving) {
                e.currentTarget.style.background = '#F9FAFB';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !taskName.trim()}
            style={{
              padding: '10px 24px',
              border: 'none',
              background: isSaving || !taskName.trim() ? '#93C5FD' : '#3B82F6',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              color: 'white',
              cursor: isSaving || !taskName.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 150ms ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              if (!isSaving && taskName.trim()) {
                e.currentTarget.style.background = '#2563EB';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSaving && taskName.trim()) {
                e.currentTarget.style.background = '#3B82F6';
              }
            }}
          >
            {isSaving ? (
              <>
                <span style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: 'white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Creating...
              </>
            ) : (
              'Create Task'
            )}
          </button>
        </div>

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
