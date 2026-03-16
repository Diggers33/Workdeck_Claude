import React, { useState } from 'react';
import { Pin, Clock, TrendingUp, ExternalLink, X } from 'lucide-react';

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

interface QuickAccessWidgetProps {
  onNavigate?: (path: string) => void;
}

export function QuickAccessWidget({ onNavigate }: QuickAccessWidgetProps) {
  const [items, setItems] = useState<QuickAccessItem[]>([]);

  const [showAllRecent, setShowAllRecent] = useState(false);

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
  };

  const getTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const pinnedItems = items.filter(item => item.isPinned);
  const recentItems = items
    .filter(item => !item.isPinned)
    .sort((a, b) => (b.lastAccessed?.getTime() || 0) - (a.lastAccessed?.getTime() || 0))
    .slice(0, showAllRecent ? undefined : 3);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'project': return '#60A5FA';
      case 'task': return '#34D399';
      case 'view': return '#A78BFA';
      case 'tool': return '#FBBF24';
      default: return '#9CA3AF';
    }
  };

  return (
    <div
      style={{
        background: 'white',
        borderRadius: '8px',
        border: '1px solid #E5E7EB',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        <ExternalLink style={{ width: '16px', height: '16px', color: '#60A5FA' }} />
        <h3 style={{ fontSize: '14px', fontWeight: 500, color: '#1F2937', margin: 0 }}>
          Quick Access
        </h3>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {/* Pinned Items Section */}
        {pinnedItems.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div
              className="flex items-center"
              style={{ gap: '6px', padding: '0 4px 8px', borderBottom: '1px solid #F3F4F6' }}
            >
              <Pin style={{ width: '12px', height: '12px', color: '#6B7280' }} />
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Pinned
              </span>
            </div>
            <div style={{ marginTop: '8px' }}>
              {pinnedItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                    marginBottom: '4px',
                    border: '1px solid transparent',
                    position: 'relative'
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
                  <div className="flex items-start justify-between" style={{ gap: '8px' }}>
                    <div className="flex items-start" style={{ gap: '10px', flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: getCategoryColor(item.category),
                          marginTop: '6px',
                          flexShrink: 0
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: 500, color: '#0A0A0A', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6B7280' }}>
                          {item.subtitle}
                        </div>
                      </div>
                    </div>
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
                      <Pin style={{ width: '14px', height: '14px' }} fill="#60A5FA" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Items Section */}
        <div>
          <div
            className="flex items-center"
            style={{ gap: '6px', padding: '0 4px 8px', borderBottom: '1px solid #F3F4F6' }}
          >
            <Clock style={{ width: '12px', height: '12px', color: '#6B7280' }} />
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Recent
            </span>
          </div>
          <div style={{ marginTop: '8px' }}>
            {recentItems.map(item => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                  marginBottom: '4px',
                  border: '1px solid transparent',
                  position: 'relative'
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
                <div className="flex items-start justify-between" style={{ gap: '8px' }}>
                  <div className="flex items-start" style={{ gap: '10px', flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: getCategoryColor(item.category),
                        marginTop: '6px',
                        flexShrink: 0
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: '#0A0A0A', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.title}
                      </div>
                      <div className="flex items-center" style={{ gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: '#6B7280' }}>
                          {item.subtitle}
                        </span>
                        {item.lastAccessed && (
                          <>
                            <span style={{ fontSize: '12px', color: '#D1D5DB' }}>•</span>
                            <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                              {getTimeAgo(item.lastAccessed)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
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
                    <Pin style={{ width: '14px', height: '14px' }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer - Access Count Summary */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid #E5E7EB',
          background: '#FAFBFC',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div className="flex items-center" style={{ gap: '6px' }}>
          <TrendingUp style={{ width: '14px', height: '14px', color: '#6B7280' }} />
          <span style={{ fontSize: '12px', color: '#6B7280' }}>
            {items.reduce((sum, item) => sum + (item.accessCount || 0), 0)} total visits
          </span>
        </div>
        <button
          style={{
            fontSize: '12px',
            color: '#60A5FA',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '4px',
            transition: 'background 150ms ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#EFF6FF'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          Manage
        </button>
      </div>
    </div>
  );
}