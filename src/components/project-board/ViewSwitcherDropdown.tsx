import React from 'react';
import { Check, Plus, AlertCircle } from 'lucide-react';

interface SavedView {
  id: string;
  name: string;
  filters: any;
  groupBy: string;
  cardSize: 'small' | 'medium' | 'large';
  isSystem?: boolean;
  hasAlert?: boolean;
}

interface ViewSwitcherDropdownProps {
  currentView: SavedView;
  views: SavedView[];
  onSelectView: (view: SavedView) => void;
  onCreateView: () => void;
}

export function ViewSwitcherDropdown({ 
  currentView, 
  views, 
  onSelectView, 
  onCreateView 
}: ViewSwitcherDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const systemViews = views.filter(v => v.isSystem);
  const userViews = views.filter(v => !v.isSystem);

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          height: '36px',
          padding: '0 12px',
          background: 'white',
          border: '1px solid #E5E7EB',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: 500,
          color: '#1F2937',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          minWidth: '180px'
        }}
      >
        {currentView.hasAlert && <AlertCircle size={16} color="#F87171" />}
        <span style={{ flex: 1, textAlign: 'left' }}>{currentView.name}</span>
        <span style={{ fontSize: '12px', color: '#9CA3AF' }}>▼</span>
      </button>

      {isOpen && (
        <>
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1000
            }}
          />
          <div style={{
            position: 'absolute',
            top: '40px',
            left: 0,
            width: '280px',
            background: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 1001,
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            {/* All Tasks */}
            <div
              onClick={() => {
                onSelectView(views.find(v => v.id === 'all')!);
                setIsOpen(false);
              }}
              style={{
                padding: '10px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #E5E7EB'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
            >
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#1F2937' }}>
                All Tasks
              </span>
              {currentView.id === 'all' && <Check size={16} color="#0066FF" />}
            </div>

            {/* Saved Views */}
            {userViews.length > 0 && (
              <>
                <div style={{
                  padding: '8px 16px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#6B7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  background: '#F9FAFB'
                }}>
                  Saved Views
                </div>
                {userViews.map(view => (
                  <div
                    key={view.id}
                    onClick={() => {
                      onSelectView(view);
                      setIsOpen(false);
                    }}
                    style={{
                      padding: '10px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                      {view.hasAlert && <AlertCircle size={14} color="#F87171" />}
                      <span style={{ fontSize: '14px', color: '#1F2937' }}>
                        {view.name}
                      </span>
                    </div>
                    {currentView.id === view.id && <Check size={16} color="#0066FF" />}
                  </div>
                ))}
              </>
            )}

            {/* System Views */}
            {systemViews.length > 0 && systemViews.some(v => v.id !== 'all') && (
              <>
                <div style={{
                  padding: '8px 16px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#6B7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  background: '#F9FAFB',
                  borderTop: '1px solid #E5E7EB'
                }}>
                  Quick Views
                </div>
                {systemViews.filter(v => v.id !== 'all').map(view => (
                  <div
                    key={view.id}
                    onClick={() => {
                      onSelectView(view);
                      setIsOpen(false);
                    }}
                    style={{
                      padding: '10px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                      {view.hasAlert && <AlertCircle size={14} color="#F87171" />}
                      <span style={{ fontSize: '14px', color: '#1F2937' }}>
                        {view.name}
                      </span>
                    </div>
                    {currentView.id === view.id && <Check size={16} color="#0066FF" />}
                  </div>
                ))}
              </>
            )}

            {/* Create New View */}
            <div
              onClick={() => {
                onCreateView();
                setIsOpen(false);
              }}
              style={{
                padding: '10px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderTop: '1px solid #E5E7EB',
                color: '#0066FF'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
            >
              <Plus size={16} />
              <span style={{ fontSize: '14px', fontWeight: 500 }}>Create New View</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
