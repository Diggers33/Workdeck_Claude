import React, { useState } from 'react';
import { Pin, Clock, Zap, ArrowRight } from 'lucide-react';

interface QuickAccessItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'project' | 'task' | 'view' | 'tool';
  isPinned: boolean;
  lastAccessed?: Date;
  accessCount?: number;
  path: string;
}

interface QuickAccessDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (path: string) => void;
}

export function QuickAccessDropdown({ isOpen, onClose, onNavigate }: QuickAccessDropdownProps) {
  const [items, setItems] = useState<QuickAccessItem[]>([]);

  const togglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, isPinned: !item.isPinned } : item
      )
    );
  };

  const handleItemClick = (item: QuickAccessItem) => {
    if (onNavigate) {
      onNavigate(item.path);
    }
    onClose();
  };

  const getTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'project': return '#60A5FA';
      case 'task': return '#34D399';
      case 'view': return '#A78BFA';
      case 'tool': return '#FBBF24';
      default: return '#9CA3AF';
    }
  };

  const pinnedItems = items.filter(item => item.isPinned);
  const recentItems = items
    .filter(item => !item.isPinned)
    .sort((a, b) => (b.lastAccessed?.getTime() || 0) - (a.lastAccessed?.getTime() || 0))
    .slice(0, 4);

  if (!isOpen) return null;

  return (
    <>
      {/* Invisible backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 19
        }}
        onClick={onClose}
      />

      {/* Dropdown */}
      <div
        style={{
          position: 'absolute',
          top: '48px',
          right: 0,
          width: '360px',
          maxHeight: '500px',
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          border: '1px solid #E5E7EB',
          zIndex: 20,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div style={{ padding: '16px', borderBottom: '1px solid #E5E7EB' }}>
          <div className="flex items-center" style={{ gap: '8px' }}>
            <Zap style={{ width: '18px', height: '18px', color: '#60A5FA' }} />
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0A0A0A' }}>
              Quick Access
            </h3>
          </div>
          <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
            Jump to frequently used items
          </p>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {/* Pinned Section */}
          {pinnedItems.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div
                className="flex items-center"
                style={{ gap: '6px', padding: '8px 8px 6px', marginBottom: '2px' }}
              >
                <Pin style={{ width: '12px', height: '12px', color: '#6B7280' }} />
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Pinned
                </span>
              </div>
              {pinnedItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                    marginBottom: '2px',
                    border: '1px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#F9FAFB';
                    e.currentTarget.style.borderColor = '#E5E7EB';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                >
                  <div className="flex items-center justify-between" style={{ gap: '8px' }}>
                    <div className="flex items-center" style={{ gap: '10px', flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: getCategoryColor(item.category),
                          flexShrink: 0
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: '#0A0A0A', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '11px', color: '#6B7280' }}>
                          {item.subtitle}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center" style={{ gap: '4px' }}>
                      <button
                        onClick={(e) => togglePin(item.id, e)}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '4px',
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#60A5FA',
                          flexShrink: 0,
                          transition: 'all 150ms ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#EFF6FF'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <Pin style={{ width: '12px', height: '12px' }} fill="#60A5FA" />
                      </button>
                      <ArrowRight style={{ width: '14px', height: '14px', color: '#D1D5DB' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recent Section */}
          {recentItems.length > 0 && (
            <div>
              <div
                className="flex items-center"
                style={{ gap: '6px', padding: '8px 8px 6px', marginBottom: '2px' }}
              >
                <Clock style={{ width: '12px', height: '12px', color: '#6B7280' }} />
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Recent
                </span>
              </div>
              {recentItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                    marginBottom: '2px',
                    border: '1px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#F9FAFB';
                    e.currentTarget.style.borderColor = '#E5E7EB';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                >
                  <div className="flex items-center justify-between" style={{ gap: '8px' }}>
                    <div className="flex items-center" style={{ gap: '10px', flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: getCategoryColor(item.category),
                          flexShrink: 0
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: '#0A0A0A', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.title}
                        </div>
                        <div className="flex items-center" style={{ gap: '6px' }}>
                          <span style={{ fontSize: '11px', color: '#6B7280' }}>
                            {item.subtitle}
                          </span>
                          {item.lastAccessed && (
                            <>
                              <span style={{ fontSize: '11px', color: '#D1D5DB' }}>•</span>
                              <span style={{ fontSize: '10px', color: '#9CA3AF' }}>
                                {getTimeAgo(item.lastAccessed)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center" style={{ gap: '4px' }}>
                      <button
                        onClick={(e) => togglePin(item.id, e)}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '4px',
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#9CA3AF',
                          flexShrink: 0,
                          transition: 'all 150ms ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#F3F4F6';
                          e.currentTarget.style.color = '#6B7280';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = '#9CA3AF';
                        }}
                      >
                        <Pin style={{ width: '12px', height: '12px' }} />
                      </button>
                      <ArrowRight style={{ width: '14px', height: '14px', color: '#D1D5DB' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid #E5E7EB',
            background: '#FAFBFC',
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          <button
            style={{
              fontSize: '12px',
              color: '#60A5FA',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px',
              fontWeight: 500,
              transition: 'background 150ms ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#EFF6FF'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            View All
          </button>
        </div>
      </div>
    </>
  );
}