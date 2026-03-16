import React from 'react';
import { Reply, Edit2, Trash2, MessageSquare, AtSign, Paperclip, Image as ImageIcon, FileText, X, Download } from 'lucide-react';

interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

interface Comment {
  id: string;
  text: string;
  user: string;
  timestamp: Date;
  replies?: Array<{id: string; text: string; user: string; timestamp: Date; attachments?: FileAttachment[]}>;
  attachments?: FileAttachment[];
}

interface TeamMember {
  id: string;
  name: string;
  initials: string;
  color: string;
}

interface EventCommentsProps {
  comments: Comment[];
  commentText: string;
  replyingTo: string | null;
  editingCommentId: string | null;
  editText: string;
  showMentions: boolean;
  mentionQuery: string;
  teamMembers: TeamMember[];
  attachments: FileAttachment[];
  onCommentChange: (text: string) => void;
  onAddComment: () => void;
  onStartEdit: (commentId: string, text: string) => void;
  onSaveEdit: (commentId: string) => void;
  onCancelEdit: () => void;
  onDelete: (commentId: string) => void;
  onStartReply: (commentId: string) => void;
  onCancelReply: () => void;
  onEditTextChange: (text: string) => void;
  onInsertMention: (member: TeamMember) => void;
  onAddAttachment: (file: File) => void;
  onRemoveAttachment: (id: string) => void;
  onPaste: (e: React.ClipboardEvent) => void;
}

export function EventComments({
  comments,
  commentText,
  replyingTo,
  editingCommentId,
  editText,
  showMentions,
  mentionQuery,
  teamMembers,
  attachments,
  onCommentChange,
  onAddComment,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onStartReply,
  onCancelReply,
  onEditTextChange,
  onInsertMention,
  onAddAttachment,
  onRemoveAttachment,
  onPaste
}: EventCommentsProps) {
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const filteredMentions = teamMembers.filter(member =>
    member.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon size={16} />;
    return <FileText size={16} />;
  };

  const renderTextWithMentions = (text: string) => {
    return text.split(/(@[\w\s]+)/g).map((part, i) => 
      part.startsWith('@') ? (
        <span key={i} style={{
          color: '#0066FF',
          fontWeight: 600,
          background: '#EFF6FF',
          padding: '2px 6px',
          borderRadius: '3px'
        }}>
          {part}
        </span>
      ) : part
    );
  };

  return (
    <div style={{ 
      padding: '0',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      position: 'relative'
    }}>
      {/* Comments List Area */}
      <div style={{ 
        flex: 1, 
        padding: '24px 32px',
        paddingBottom: '180px',
        overflowY: 'auto',
        overflowX: 'hidden'
      }}>
        {comments.length === 0 ? (
          <div style={{
            padding: '60px 0',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#F3F4F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <MessageSquare size={28} color="#9CA3AF" />
            </div>
            <div style={{ 
              fontSize: '15px',
              fontWeight: 600,
              color: '#6B7280',
              marginBottom: '6px'
            }}>
              No comments yet
            </div>
            <div style={{ fontSize: '13px', color: '#9CA3AF' }}>
              Start the conversation below
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {comments.map(comment => (
              <div key={comment.id}>
                {/* Main Comment */}
                <div style={{ 
                  padding: '16px',
                  background: '#FFFFFF',
                  borderRadius: '6px',
                  border: '1px solid #E5E7EB'
                }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: '#0066FF',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 600,
                      flexShrink: 0
                    }}>
                      CD
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        marginBottom: '8px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#0A0A0A' }}>
                            {comment.user}
                          </div>
                          <div style={{ fontSize: '12px', color: '#9CA3AF' }}>
                            {comment.timestamp.toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </div>
                        </div>
                        {/* Action buttons */}
                        {editingCommentId !== comment.id && (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              onClick={() => onStartEdit(comment.id, comment.text)}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                border: 'none',
                                background: 'transparent',
                                color: '#6B7280',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '12px'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#F3F4F6';
                                e.currentTarget.style.color = '#0066FF';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = '#6B7280';
                              }}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => onDelete(comment.id)}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                border: 'none',
                                background: 'transparent',
                                color: '#6B7280',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '12px'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#FEF2F2';
                                e.currentTarget.style.color = '#EF4444';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = '#6B7280';
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {/* Comment Text or Edit Mode */}
                      {editingCommentId === comment.id ? (
                        <div>
                          <textarea
                            value={editText}
                            onChange={(e) => onEditTextChange(e.target.value)}
                            rows={3}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              border: '1px solid #0066FF',
                              borderRadius: '4px',
                              fontSize: '13px',
                              color: '#0A0A0A',
                              fontFamily: 'Inter, sans-serif',
                              resize: 'none',
                              marginBottom: '8px',
                              outline: 'none'
                            }}
                          />
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => onSaveEdit(comment.id)}
                              style={{
                                padding: '4px 12px',
                                borderRadius: '4px',
                                border: 'none',
                                background: '#0066FF',
                                color: 'white',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#0052CC';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#0066FF';
                              }}
                            >
                              Save
                            </button>
                            <button
                              onClick={onCancelEdit}
                              style={{
                                padding: '4px 12px',
                                borderRadius: '4px',
                                border: '1px solid #D1D5DB',
                                background: 'white',
                                color: '#374151',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div style={{ 
                            fontSize: '13px', 
                            color: '#374151', 
                            lineHeight: '1.5',
                            whiteSpace: 'pre-wrap',
                            marginBottom: '10px'
                          }}>
                            {renderTextWithMentions(comment.text)}
                          </div>
                          
                          {/* Attachments */}
                          {comment.attachments && comment.attachments.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                              {comment.attachments.map(attachment => (
                                <div key={attachment.id}>
                                  {attachment.type.startsWith('image/') ? (
                                    <div style={{
                                      position: 'relative',
                                      borderRadius: '6px',
                                      overflow: 'hidden',
                                      border: '1px solid #E5E7EB',
                                      maxWidth: '400px'
                                    }}>
                                      <img 
                                        src={attachment.url} 
                                        alt={attachment.name}
                                        style={{
                                          width: '100%',
                                          display: 'block',
                                          maxHeight: '300px',
                                          objectFit: 'cover'
                                        }}
                                      />
                                    </div>
                                  ) : (
                                    <a
                                      href={attachment.url}
                                      download={attachment.name}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '10px 12px',
                                        background: '#F9FAFB',
                                        border: '1px solid #E5E7EB',
                                        borderRadius: '4px',
                                        textDecoration: 'none',
                                        color: '#0A0A0A',
                                        maxWidth: '300px'
                                      }}
                                    >
                                      <div style={{ color: '#6B7280' }}>
                                        {getFileIcon(attachment.type)}
                                      </div>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ 
                                          fontSize: '12px', 
                                          fontWeight: 600,
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap'
                                        }}>
                                          {attachment.name}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
                                          {formatFileSize(attachment.size)}
                                        </div>
                                      </div>
                                      <Download size={14} color="#6B7280" />
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Reply Button */}
                          <button
                            onClick={() => onStartReply(comment.id)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '4px',
                              border: 'none',
                              background: '#F3F4F6',
                              color: '#6B7280',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '12px',
                              fontWeight: 600
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#E5E7EB';
                              e.currentTarget.style.color = '#0066FF';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#F3F4F6';
                              e.currentTarget.style.color = '#6B7280';
                            }}
                          >
                            <Reply size={14} />
                            Reply
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div style={{ marginLeft: '44px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {comment.replies.map(reply => (
                      <div key={reply.id} style={{ 
                        padding: '12px',
                        background: '#F9FAFB',
                        borderRadius: '6px',
                        border: '1px solid #E5E7EB',
                        borderLeft: '3px solid #0066FF'
                      }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: '#0066FF',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: 600,
                            flexShrink: 0
                          }}>
                            CD
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '8px',
                              marginBottom: '6px'
                            }}>
                              <div style={{ fontSize: '12px', fontWeight: 600, color: '#0A0A0A' }}>
                                {reply.user}
                              </div>
                              <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
                                {reply.timestamp.toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </div>
                            </div>
                            <div style={{ 
                              fontSize: '12px', 
                              color: '#374151', 
                              lineHeight: '1.5',
                              whiteSpace: 'pre-wrap'
                            }}>
                              {renderTextWithMentions(reply.text)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comment Input Area - Fixed at bottom */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTop: '1px solid #E5E7EB',
        padding: '16px 32px',
        background: '#FFFFFF'
      }}>
        {replyingTo && (
          <div style={{
            padding: '8px 12px',
            background: '#EFF6FF',
            border: '1px solid #BFDBFE',
            borderRadius: '4px',
            marginBottom: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Reply size={14} color="#0066FF" />
              <span style={{ fontSize: '12px', color: '#0066FF', fontWeight: 600 }}>
                Replying to comment
              </span>
            </div>
            <button
              onClick={onCancelReply}
              style={{
                padding: '2px 8px',
                borderRadius: '3px',
                border: 'none',
                background: 'transparent',
                color: '#6B7280',
                cursor: 'pointer',
                fontSize: '12px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#EF4444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#6B7280';
              }}
            >
              ✕
            </button>
          </div>
        )}
        <div style={{ position: 'relative' }}>
          <textarea
            value={commentText}
            onChange={(e) => onCommentChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !showMentions) {
                e.preventDefault();
                onAddComment();
              }
            }}
            placeholder="Add a comment... (type @ to mention someone)"
            rows={2}
            style={{
              width: '100%',
              padding: '10px 14px',
              paddingRight: '70px',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#0A0A0A',
              fontFamily: 'Inter, sans-serif',
              resize: 'none',
              background: '#FFFFFF',
              outline: 'none',
              transition: 'border-color 150ms'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#0066FF';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#D1D5DB';
            }}
            onPaste={onPaste}
          />
          
          {/* Mentions Dropdown */}
          {showMentions && filteredMentions.length > 0 && (
            <div style={{
              position: 'absolute',
              bottom: '100%',
              left: 0,
              right: 0,
              marginBottom: '4px',
              background: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              maxHeight: '200px',
              overflowY: 'auto',
              zIndex: 1000
            }}>
              {filteredMentions.map(member => (
                <div
                  key={member.id}
                  onClick={() => onInsertMention(member)}
                  style={{
                    padding: '10px 14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '13px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#F3F4F6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                  }}
                >
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: member.color,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 600
                  }}>
                    {member.initials}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#0A0A0A' }}>{member.name}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <button
            onClick={onAddComment}
            disabled={!commentText.trim()}
            style={{
              position: 'absolute',
              bottom: '8px',
              right: '10px',
              padding: '5px 14px',
              borderRadius: '4px',
              border: 'none',
              background: commentText.trim() ? '#0066FF' : '#E5E7EB',
              color: commentText.trim() ? 'white' : '#9CA3AF',
              fontSize: '12px',
              fontWeight: 600,
              cursor: commentText.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 150ms'
            }}
            onMouseEnter={(e) => {
              if (commentText.trim()) {
                e.currentTarget.style.background = '#0052CC';
              }
            }}
            onMouseLeave={(e) => {
              if (commentText.trim()) {
                e.currentTarget.style.background = '#0066FF';
              }
            }}
          >
            Post
          </button>
        </div>
        
        {/* Pending Attachments Preview */}
        {attachments.length > 0 && (
          <div style={{ 
            marginTop: '12px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            {attachments.map(attachment => (
              <div key={attachment.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 10px',
                background: '#F3F4F6',
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                {attachment.type.startsWith('image/') ? (
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '3px',
                    overflow: 'hidden',
                    border: '1px solid #E5E7EB'
                  }}>
                    <img 
                      src={attachment.url} 
                      alt={attachment.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  </div>
                ) : (
                  <div style={{ color: '#6B7280' }}>
                    {getFileIcon(attachment.type)}
                  </div>
                )}
                <div style={{ 
                  maxWidth: '150px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: '#374151'
                }}>
                  {attachment.name}
                </div>
                <button
                  onClick={() => onRemoveAttachment(attachment.id)}
                  style={{
                    padding: '2px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#9CA3AF'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#EF4444';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#9CA3AF';
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
        
        <div style={{
          fontSize: '11px',
          color: '#9CA3AF',
          marginTop: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span>
              <span style={{ fontWeight: 600 }}>Enter</span> to post, <span style={{ fontWeight: 600 }}>Shift+Enter</span> for new line
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AtSign size={12} />
              Type @ to mention
            </span>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '4px 10px',
              borderRadius: '4px',
              border: 'none',
              background: '#F3F4F6',
              color: '#6B7280',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: 600
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#E5E7EB';
              e.currentTarget.style.color = '#0066FF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#F3F4F6';
              e.currentTarget.style.color = '#6B7280';
            }}
          >
            <Paperclip size={12} />
            Attach file
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx,.txt"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              files.forEach(file => onAddAttachment(file));
              e.target.value = '';
            }}
          />
        </div>
      </div>
    </div>
  );
}