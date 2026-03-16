import React, { useState, useEffect } from 'react';
import { Search, Pin, Clock, X, ArrowRight, ExternalLink } from 'lucide-react';

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

interface QuickAccessSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (path: string) => void;
}

export function QuickAccessSearchModal({ isOpen, onClose, onNavigate }: QuickAccessSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
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
    .sort((a, b) => (b.lastAccessed?.getTime() || 0) - (a.lastAccessed?.getTime() || 0));

  const filteredItems = searchQuery
    ? items.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9998,
          backdropFilter: 'blur(4px)'
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '100px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          maxHeight: '600px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          zIndex: 9999,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Search Input */}
        <div style={{ padding: '20px', borderBottom: '1px solid #E5E7EB' }}>
          <div className="flex items-center" style={{ gap: '12px' }}>
            <Search style={{ width: '20px', height: '20px', color: '#9CA3AF' }} />
            <input
              type="text"
              placeholder="Search projects, tasks, tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: '16px',
                color: '#0A0A0A',
                background: 'transparent'
              }}
            />
            <button
              onClick={onClose}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                border: 'none',
                background: '#F3F4F6',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6B7280'
              }}
            >
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {/* Show filtered search results if searching */}
          {filteredItems ? (
            <div>
              <div style={{ padding: '8px 12px', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Search Results ({filteredItems.length})
              </div>
              {filteredItems.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: '14px' }}>
                  No results found for "{searchQuery}"
                </div>
              ) : (
                <div>
                  {filteredItems.map(item => (
                    <ItemRow key={item.id} item={item} onItemClick={handleItemClick} onTogglePin={togglePin} getCategoryColor={getCategoryColor} getTimeAgo={getTimeAgo} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Pinned Section */}
              {pinnedItems.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <div className="flex items-center" style={{ gap: '8px', padding: '8px 12px', marginBottom: '4px' }}>
                    <Pin style={{ width: '14px', height: '14px', color: '#6B7280' }} />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Pinned
                    </span>
                  </div>
                  {pinnedItems.map(item => (
                    <ItemRow key={item.id} item={item} onItemClick={handleItemClick} onTogglePin={togglePin} getCategoryColor={getCategoryColor} getTimeAgo={getTimeAgo} />
                  ))}
                </div>
              )}

              {/* Recent Section */}
              {recentItems.length > 0 && (
                <div>
                  <div className="flex items-center" style={{ gap: '8px', padding: '8px 12px', marginBottom: '4px' }}>
                    <Clock style={{ width: '14px', height: '14px', color: '#6B7280' }} />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Recent
                    </span>
                  </div>
                  {recentItems.map(item => (
                    <ItemRow key={item.id} item={item} onItemClick={handleItemClick} onTogglePin={togglePin} getCategoryColor={getCategoryColor} getTimeAgo={getTimeAgo} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Hint */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid #E5E7EB',
            background: '#FAFBFC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div className="flex items-center" style={{ gap: '16px', fontSize: '12px', color: '#6B7280' }}>
            <div className="flex items-center" style={{ gap: '6px' }}>
              <kbd style={{ padding: '2px 6px', background: 'white', border: '1px solid #E5E7EB', borderRadius: '4px', fontSize: '11px' }}>↑</kbd>
              <kbd style={{ padding: '2px 6px', background: 'white', border: '1px solid #E5E7EB', borderRadius: '4px', fontSize: '11px' }}>↓</kbd>
              <span>Navigate</span>
            </div>
            <div className="flex items-center" style={{ gap: '6px' }}>
              <kbd style={{ padding: '2px 6px', background: 'white', border: '1px solid #E5E7EB', borderRadius: '4px', fontSize: '11px' }}>↵</kbd>
              <span>Select</span>
            </div>
            <div className="flex items-center" style={{ gap: '6px' }}>
              <kbd style={{ padding: '2px 6px', background: 'white', border: '1px solid #E5E7EB', borderRadius: '4px', fontSize: '11px' }}>Esc</kbd>
              <span>Close</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Extracted ItemRow component for reusability
function ItemRow({ 
  item, 
  onItemClick, 
  onTogglePin, 
  getCategoryColor, 
  getTimeAgo 
}: { 
  item: QuickAccessItem; 
  onItemClick: (item: QuickAccessItem) => void;
  onTogglePin: (id: string, e: React.MouseEvent) => void;
  getCategoryColor: (category: string) => string;
  getTimeAgo: (date: Date) => string;
}) {
  return (
    <div
      onClick={() => onItemClick(item)}
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
      <div className="flex items-center justify-between" style={{ gap: '12px' }}>
        <div className="flex items-center" style={{ gap: '12px', flex: 1, minWidth: 0 }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: getCategoryColor(item.category),
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
        <div className="flex items-center" style={{ gap: '4px' }}>
          <button
            onClick={(e) => onTogglePin(item.id, e)}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '4px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: item.isPinned ? '#60A5FA' : '#9CA3AF',
              flexShrink: 0,
              transition: 'all 150ms ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = item.isPinned ? '#EFF6FF' : '#F3F4F6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <Pin style={{ width: '14px', height: '14px' }} fill={item.isPinned ? '#60A5FA' : 'none'} />
          </button>
          <ArrowRight style={{ width: '16px', height: '16px', color: '#D1D5DB' }} />
        </div>
      </div>
    </div>
  );
}