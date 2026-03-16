import React, { useState, useMemo, useRef } from 'react';
import { Send } from 'lucide-react';
import { useUsers, useCurrentUser } from '../../../hooks/useApiQueries';

interface TaskCommentsTabProps {
  task: any;
}

const mockComments: any[] = [];

export function TaskCommentsTab({ task }: TaskCommentsTabProps) {
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState(mockComments);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStart, setMentionStart] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: usersData = [] } = useUsers();
  const { data: currentUser } = useCurrentUser();
  const participantIds = useMemo(() =>
    new Set((task.participants || []).map((p: any) => p.user?.id || p.id)),
    [task.participants]
  );
  const teamMembers = useMemo(() => usersData
    .filter((u: any) => participantIds.has(u.id) && u.id !== currentUser?.id)
    .map((u: any) => ({
      id: u.id,
      name: u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'Unknown',
    })), [usersData, participantIds, currentUser?.id]);

  const filteredMentions = useMemo(() =>
    teamMembers.filter(m => m.name.toLowerCase().includes(mentionQuery.toLowerCase())).slice(0, 8),
    [teamMembers, mentionQuery]
  );

  const handleCommentChange = (text: string) => {
    setNewComment(text);
    if (teamMembers.length === 0) { setShowMentions(false); return; }
    const lastAt = text.lastIndexOf('@');
    if (lastAt !== -1) {
      const afterAt = text.substring(lastAt + 1);
      if (!afterAt.includes(' ')) {
        setMentionQuery(afterAt);
        setMentionStart(lastAt);
        setShowMentions(true);
        return;
      }
    }
    setShowMentions(false);
  };

  const insertMention = (member: { id: string; name: string }) => {
    const before = newComment.substring(0, mentionStart);
    const after = newComment.substring(mentionStart + 1 + mentionQuery.length);
    setNewComment(`${before}@${member.name} ${after}`);
    setShowMentions(false);
    setMentionQuery('');
    textareaRef.current?.focus();
  };

  const handleSubmit = () => {
    if (newComment.trim()) {
      // Add new comment logic here
      setNewComment('');
      setShowMentions(false);
    }
  };

  return (
    <div style={{ maxWidth: '100%' }}>
      {comments.length === 0 ? (
        // Empty State
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: '60px',
          paddingBottom: '40px'
        }}>
          <div style={{
            fontSize: '64px',
            marginBottom: '16px',
            opacity: 0.3
          }}>
            💬
          </div>
          <div style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#0A0A0A',
            marginBottom: '8px'
          }}>
            No comments yet
          </div>
          <div style={{
            fontSize: '15px',
            color: '#9CA3AF'
          }}>
            Start a conversation with your team
          </div>
        </div>
      ) : (
        // Comments Thread
        <div style={{ marginBottom: '24px' }}>
          {comments.map((comment) => (
            <div key={comment.id}>
              {/* Parent Comment */}
              <div style={{
                background: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '16px'
              }}>
                {/* Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: '#8B5CF6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: 'white'
                    }}>
                      {comment.avatar}
                    </div>
                    <div>
                      <span style={{
                        fontSize: '15px',
                        fontWeight: 600,
                        color: '#0A0A0A',
                        marginRight: '8px'
                      }}>
                        {comment.author}
                      </span>
                      <span style={{
                        fontSize: '14px',
                        color: '#9CA3AF'
                      }}>
                        {comment.timestamp}
                      </span>
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    opacity: 0.6
                  }}>
                    <button style={{
                      background: 'transparent',
                      border: 'none',
                      fontSize: '13px',
                      color: '#6B7280',
                      cursor: 'pointer'
                    }}>
                      Edit
                    </button>
                    <button style={{
                      background: 'transparent',
                      border: 'none',
                      fontSize: '13px',
                      color: '#6B7280',
                      cursor: 'pointer'
                    }}>
                      Delete
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div style={{
                  fontSize: '15px',
                  color: '#0A0A0A',
                  lineHeight: '1.6',
                  marginBottom: '12px'
                }}>
                  {comment.text}
                </div>

                {/* Footer */}
                <button style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#6B7280',
                  cursor: 'pointer',
                  transition: 'color 150ms ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#3B82F6'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#6B7280'}
                >
                  Reply
                </button>
              </div>

              {/* Nested Replies */}
              {comment.replies && comment.replies.map((reply) => (
                <div
                  key={reply.id}
                  style={{
                    marginLeft: '52px',
                    marginBottom: '16px',
                    position: 'relative'
                  }}
                >
                  {/* Connection Line */}
                  <div style={{
                    position: 'absolute',
                    left: '-26px',
                    top: 0,
                    bottom: 0,
                    width: '2px',
                    background: '#E5E7EB'
                  }} />

                  <div style={{
                    background: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    padding: '20px'
                  }}>
                    {/* Header */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '16px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: '#10B981',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          fontWeight: 600,
                          color: 'white'
                        }}>
                          {reply.avatar}
                        </div>
                        <div>
                          <span style={{
                            fontSize: '15px',
                            fontWeight: 600,
                            color: '#0A0A0A',
                            marginRight: '8px'
                          }}>
                            {reply.author}
                          </span>
                          <span style={{
                            fontSize: '14px',
                            color: '#9CA3AF'
                          }}>
                            {reply.timestamp}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Body */}
                    <div style={{
                      fontSize: '15px',
                      color: '#0A0A0A',
                      lineHeight: '1.6',
                      marginBottom: '12px'
                    }}>
                      {reply.text}
                    </div>

                    {/* Footer */}
                    <button style={{
                      background: 'transparent',
                      border: 'none',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#6B7280',
                      cursor: 'pointer',
                      transition: 'color 150ms ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#3B82F6'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#6B7280'}
                    >
                      Reply
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Comment Input */}
      <div style={{
        position: 'relative',
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        background: 'white'
      }}>
        {/* Mentions dropdown */}
        {showMentions && filteredMentions.length > 0 && (
          <div style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            right: 0,
            marginBottom: '4px',
            background: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
            maxHeight: '200px',
            overflowY: 'auto',
            zIndex: 100,
          }}>
            {filteredMentions.map(member => (
              <button
                key={member.id}
                onMouseDown={(e) => { e.preventDefault(); insertMention(member); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  width: '100%', padding: '8px 14px', background: 'none',
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                  fontSize: '14px', color: '#111827',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F3F4F6')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: '#3B82F6', color: 'white', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 600, flexShrink: 0,
                }}>
                  {member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                {member.name}
              </button>
            ))}
          </div>
        )}
        <textarea
          ref={textareaRef}
          placeholder={teamMembers.length > 0 ? "Add a comment... (type @ to mention someone)" : "Add a comment..."}
          value={newComment}
          onChange={(e) => handleCommentChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setShowMentions(false);
            if (e.key === 'Enter' && !e.shiftKey && !showMentions) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          style={{
            width: '100%',
            minHeight: '120px',
            padding: '16px',
            paddingBottom: '60px',
            border: 'none',
            outline: 'none',
            fontSize: '15px',
            color: '#0A0A0A',
            fontFamily: 'inherit',
            resize: 'vertical',
            borderRadius: '8px'
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={!newComment.trim()}
          style={{
            position: 'absolute',
            bottom: '12px',
            right: '12px',
            width: '44px',
            height: '44px',
            borderRadius: '22px',
            background: newComment.trim() ? '#3B82F6' : '#D1D5DB',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: newComment.trim() ? 'pointer' : 'not-allowed',
            boxShadow: newComment.trim() ? '0 2px 8px rgba(59,130,246,0.3)' : 'none',
            transition: 'all 150ms ease'
          }}
          onMouseEnter={(e) => {
            if (newComment.trim()) {
              e.currentTarget.style.background = '#2563EB';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(59,130,246,0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (newComment.trim()) {
              e.currentTarget.style.background = '#3B82F6';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(59,130,246,0.3)';
            }
          }}
        >
          <Send size={20} color="white" />
        </button>
      </div>
    </div>
  );
}