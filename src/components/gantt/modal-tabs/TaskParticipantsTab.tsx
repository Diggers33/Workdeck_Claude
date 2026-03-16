import React, { useState, useEffect } from 'react';
import { Search, User, Calendar, X, Edit2, Check } from 'lucide-react';
import { apiClient } from '../../../services/api-client';
import type { Task, TaskParticipant } from '../../../types/task';

// Extended task type for participants tab
interface ParticipantsTask extends Partial<Task> {
  id: string;
  participants?: TaskParticipant[];
  activity?: {
    project?: { id: string };
    projectId?: string;
  };
}

interface TaskParticipantsTabProps {
  task: ParticipantsTask;
}

export function TaskParticipantsTab({ task }: TaskParticipantsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingParticipant, setEditingParticipant] = useState<string | null>(null);
  const [editedHours, setEditedHours] = useState<string>('');
  const [savingParticipant, setSavingParticipant] = useState<string | null>(null);

  // Store local copy of participants so we can update after save
  const [localParticipants, setLocalParticipants] = useState<any[]>(task?.participants || []);

  // Update local participants when task prop changes
  useEffect(() => {
    if (task?.participants) {
      setLocalParticipants(task.participants);
    }
  }, [task?.participants]);

  // Save participant allocated hours (Angular mock pattern with minimal payload)
  const handleSaveParticipantHours = async (participantId: string) => {
    try {
      setSavingParticipant(participantId);
      // Get projectId from task or activity
      const projectId = task.projectId || task.activity?.project?.id || task.activity?.projectId;

      // Find the participant to get isOwner status
      const participant = task.participants?.find((p: any) =>
        (p.id === participantId) || (p.user?.id === participantId)
      );
      const isOwner = participant?.isOwner === true || participant?.isOwner === 'true';
      const position = task.participants?.findIndex((p: any) =>
        (p.id === participantId) || (p.user?.id === participantId)
      ) || 0;

      // Angular minimal payload format - flat fields, isOwner as STRING
      // IMPORTANT: Must send BOTH availableHours AND plannedHours for hours to persist
      const payload = {
        projectId: projectId,
        taskId: task.id,
        userId: participantId,
        isOwner: isOwner ? 'true' : 'false',  // STRING not boolean
        position: position,
        availableHours: editedHours,
        plannedHours: editedHours,  // Backend uses plannedHours for allocated hours display
      };
      await apiClient.post('/commands/mocks/add-task-participant', payload);

      // Commit to persist
      if (projectId) {
        await apiClient.post('/commands/sync/commit-project', { id: projectId });
      }

      // Update local state so UI reflects the change immediately
      setLocalParticipants(prev => prev.map(p => {
        const pId = p.id || p.user?.id;
        if (pId === participantId) {
          return {
            ...p,
            availableHours: editedHours,
            plannedHours: editedHours
          };
        }
        return p;
      }));

      setEditingParticipant(null);
      setEditedHours('');
    } catch (error) {
      console.error('[TaskParticipantsTab] Failed to update participant hours:', error);
    } finally {
      setSavingParticipant(null);
    }
  };

  // Start editing participant hours
  const startEditingHours = (participantId: string, currentHours: number) => {
    setEditingParticipant(participantId);
    setEditedHours(String(currentHours));
  };

  // Helper to format hours as "Xh YYm"
  const formatHours = (hours: number): string => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m.toString().padStart(2, '0')}m`;
  };

  // Use local participants state (updated after save), fallback to empty array
  const participants = (localParticipants || []).map((p: any, idx: number) => {
    // Get participant name from user object or direct fields
    const firstName = p.user?.firstName || p.firstName || '';
    const lastName = p.user?.lastName || p.lastName || '';
    const fullName = p.user?.fullName || `${firstName} ${lastName}`.trim() || 'Unknown';

    // Parse hours - API returns hours as strings like "12.43"
    // IMPORTANT: Use parseFloat FIRST because '0.00' is truthy but parseFloat('0.00') = 0 is falsy
    // Backend stores hours in availableHours, plannedHours might be '0.00'
    const allocated = parseFloat(p.availableHours) || parseFloat(p.plannedHours) || 0;
    const consumed = parseFloat(p.spentHours || '0');
    const balance = allocated - consumed;

    return {
      id: p.id || p.user?.id || idx,
      name: fullName,
      avatar: `${(firstName || fullName[0] || '?')[0]}${(lastName || fullName.split(' ')[1]?.[0] || '?')[0]}`.toUpperCase(),
      role: p.isOwner ? 'Owner' : (p.isLeader ? 'Leader' : null),
      roleColor: p.isOwner ? '#F97316' : '#3B82F6',
      roleBg: p.isOwner ? '#FFF7ED' : '#EFF6FF',
      allocated,
      allocatedFormatted: formatHours(allocated),
      consumed,
      consumedFormatted: formatHours(consumed),
      balance,
      balanceFormatted: formatHours(Math.abs(balance)),
      isOverBudget: balance < 0,
      email: p.user?.email || p.email,
      column: p.column
    };
  });

  const totalAllocated = participants.reduce((sum: number, p: any) => sum + p.allocated, 0);
  const totalConsumed = participants.reduce((sum: number, p: any) => sum + p.consumed, 0);
  const totalBalance = totalAllocated - totalConsumed;

  return (
    <div style={{ maxWidth: '100%' }}>
      {/* Search Bar */}
      <div style={{
        position: 'relative',
        marginBottom: '24px'
      }}>
        <Search size={18} color="#6B7280" style={{
          position: 'absolute',
          left: '16px',
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none'
        }} />
        <input
          type="text"
          placeholder="Search and add participants..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            height: '48px',
            padding: '0 16px 0 48px',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            fontSize: '15px',
            outline: 'none',
            transition: 'all 150ms ease'
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

      {/* Participants Table */}
      <div style={{
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        {/* Table Header */}
        <div style={{
          height: '48px',
          background: '#F9FAFB',
          borderBottom: '1px solid #E5E7EB',
          padding: '0 20px',
          display: 'grid',
          gridTemplateColumns: '300px 140px 140px 140px 140px',
          alignItems: 'center'
        }}>
          <div style={{
            fontSize: '12px',
            fontWeight: 600,
            color: '#6B7280',
            textTransform: 'uppercase'
          }}>
            PARTICIPANT
          </div>
          <div style={{
            fontSize: '12px',
            fontWeight: 600,
            color: '#6B7280',
            textTransform: 'uppercase',
            textAlign: 'center'
          }}>
            ALLOCATED H.
          </div>
          <div style={{
            fontSize: '12px',
            fontWeight: 600,
            color: '#6B7280',
            textTransform: 'uppercase',
            textAlign: 'center'
          }}>
            CONSUMED H.
          </div>
          <div style={{
            fontSize: '12px',
            fontWeight: 600,
            color: '#6B7280',
            textTransform: 'uppercase',
            textAlign: 'center'
          }}>
            BALANCE
          </div>
          <div style={{
            fontSize: '12px',
            fontWeight: 600,
            color: '#6B7280',
            textTransform: 'uppercase'
          }}>
          </div>
        </div>

        {/* Table Rows */}
        {participants.length === 0 ? (
          <div style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: '#6B7280'
          }}>
            <User size={32} color="#D1D5DB" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: '15px', fontWeight: 500, marginBottom: '4px' }}>
              No participants assigned
            </div>
            <div style={{ fontSize: '13px' }}>
              Use the search above to add participants to this task
            </div>
          </div>
        ) : (
          participants.map((participant: any, idx: number) => (
          <div
            key={participant.id}
            style={{
              height: '64px',
              background: 'white',
              borderBottom: idx < participants.length - 1 ? '1px solid #F3F4F6' : 'none',
              padding: '0 20px',
              display: 'grid',
              gridTemplateColumns: '300px 140px 140px 140px 140px',
              alignItems: 'center',
              transition: 'background 150ms ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#FAFAFA'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
          >
            {/* Participant */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {participant.active && (
                <div style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#10B981'
                }} />
              )}
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: '#D1D5DB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 600,
                color: '#6B7280'
              }}>
                {participant.avatar}
              </div>
              <div>
                <div style={{
                  fontSize: '15px',
                  fontWeight: 500,
                  color: '#0A0A0A',
                  marginBottom: '2px'
                }}>
                  {participant.name}
                </div>
                {participant.role && (
                  <div style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    background: participant.roleBg,
                    color: participant.roleColor,
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: '10px'
                  }}>
                    {participant.role}
                  </div>
                )}
                {participant.badge && (
                  <div style={{
                    display: 'inline-block',
                    padding: '2px 6px',
                    background: '#EFF6FF',
                    color: '#3B82F6',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '10px'
                  }}>
                    {participant.badge}
                  </div>
                )}
              </div>
            </div>

            {/* Allocated - Editable */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}>
              {editingParticipant === participant.id ? (
                <>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={editedHours}
                    onChange={(e) => setEditedHours(e.target.value)}
                    autoFocus
                    style={{
                      width: '60px',
                      height: '28px',
                      padding: '0 8px',
                      border: '1px solid #3B82F6',
                      borderRadius: '4px',
                      fontSize: '14px',
                      textAlign: 'center',
                      outline: 'none'
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveParticipantHours(participant.id);
                      } else if (e.key === 'Escape') {
                        setEditingParticipant(null);
                        setEditedHours('');
                      }
                    }}
                  />
                  <button
                    onClick={() => handleSaveParticipantHours(participant.id)}
                    disabled={savingParticipant === participant.id}
                    style={{
                      width: '24px',
                      height: '24px',
                      border: 'none',
                      borderRadius: '4px',
                      background: '#10B981',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: savingParticipant === participant.id ? 'wait' : 'pointer'
                    }}
                  >
                    <Check size={14} />
                  </button>
                </>
              ) : (
                <div
                  onClick={() => startEditingHours(participant.id, participant.allocated)}
                  style={{
                    fontSize: '15px',
                    color: participant.allocated > 0 ? '#0A0A0A' : '#6B7280',
                    fontWeight: participant.allocated > 0 ? 700 : 400,
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    transition: 'background 150ms ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  title="Click to edit allocated hours"
                >
                  {participant.allocated > 0 ? participant.allocated : '0'}
                </div>
              )}
            </div>

            {/* Consumed */}
            <div style={{
              fontSize: '15px',
              color: participant.consumed > 0 ? '#0A0A0A' : '#6B7280',
              fontWeight: participant.consumed > 0 ? 700 : 400,
              textAlign: 'center'
            }}>
              {participant.consumedFormatted}
            </div>

            {/* Balance */}
            <div style={{
              fontSize: '15px',
              color: participant.isOverBudget ? '#DC2626' : (participant.balance > 0 ? '#10B981' : '#6B7280'),
              fontWeight: participant.allocated > 0 || participant.consumed > 0 ? 700 : 400,
              textAlign: 'center'
            }}>
              {participant.isOverBudget ? '-' : ''}{participant.balanceFormatted}
            </div>

            {/* Actions */}
            <div style={{
              display: 'flex',
              gap: '8px',
              justifyContent: 'flex-end'
            }}>
              <button style={{
                width: '36px',
                height: '36px',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 150ms ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
              >
                <User size={16} color="#6B7280" />
              </button>
              <button style={{
                width: '36px',
                height: '36px',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 150ms ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
              >
                <Calendar size={16} color="#6B7280" />
              </button>
              <button style={{
                width: '36px',
                height: '36px',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 150ms ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#FEE2E2';
                e.currentTarget.style.borderColor = '#DC2626';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.borderColor = '#E5E7EB';
              }}
              >
                <X size={16} color="#DC2626" />
              </button>
            </div>
          </div>
        ))
        )}

        {/* Table Footer - Total Row */}
        <div style={{
          height: '72px',
          background: '#F9FAFB',
          borderTop: '2px solid #E5E7EB',
          padding: '0 20px',
          display: 'grid',
          gridTemplateColumns: '300px 140px 140px 140px 140px',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                width: '16px',
                height: '16px',
                border: '3px solid white',
                borderRadius: '50%'
              }} />
            </div>
            <span style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#0A0A0A'
            }}>
              Total hours
            </span>
          </div>
          <div style={{
            fontSize: '18px',
            fontWeight: 700,
            color: '#0A0A0A',
            textAlign: 'center'
          }}>
            {formatHours(totalAllocated)}
          </div>
          <div style={{
            fontSize: '18px',
            fontWeight: 700,
            color: '#0A0A0A',
            textAlign: 'center'
          }}>
            {formatHours(totalConsumed)}
          </div>
          <div style={{
            fontSize: '18px',
            fontWeight: 700,
            color: totalBalance < 0 ? '#DC2626' : '#10B981',
            textAlign: 'center'
          }}>
            {totalBalance < 0 ? '-' : ''}{formatHours(Math.abs(totalBalance))}
          </div>
          <div></div>
        </div>
      </div>
    </div>
  );
}
