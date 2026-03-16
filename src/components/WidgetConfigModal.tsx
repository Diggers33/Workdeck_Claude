import React, { useState } from 'react';
import { X, GripVertical } from 'lucide-react';

interface WidgetConfig {
  id: string;
  name: string;
  description: string;
  visible: boolean;
  gridPosition: string;
}

interface WidgetConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  widgets: WidgetConfig[];
  onToggleWidget: (id: string) => void;
  onSave: () => void;
  onReorder?: (widgets: WidgetConfig[]) => void;
  onChangePosition?: (id: string, position: string) => void;
}

export function WidgetConfigModal({
  isOpen,
  onClose,
  widgets,
  onToggleWidget,
  onSave,
  onReorder,
  onChangePosition
}: WidgetConfigModalProps) {
  const [localWidgets, setLocalWidgets] = useState<WidgetConfig[]>(widgets);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Sync local state when widgets prop changes
  React.useEffect(() => {
    setLocalWidgets(widgets);
  }, [widgets]);

  if (!isOpen) return null;

  const visibleCount = localWidgets.filter(w => w.visible).length;
  const maxWidgets = 6;

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    // Add drag image
    const target = e.target as HTMLElement;
    target.style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    target.style.opacity = '1';
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (id !== draggedId) {
      setDragOverId(id);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const draggedIndex = localWidgets.findIndex(w => w.id === draggedId);
    const targetIndex = localWidgets.findIndex(w => w.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Reorder the array
    const newWidgets = [...localWidgets];
    const [draggedWidget] = newWidgets.splice(draggedIndex, 1);
    newWidgets.splice(targetIndex, 0, draggedWidget);

    setLocalWidgets(newWidgets);
    setDraggedId(null);
    setDragOverId(null);

    // Notify parent of reorder
    if (onReorder) {
      onReorder(newWidgets);
    }
  };

  const handleToggle = (id: string) => {
    const widget = localWidgets.find(w => w.id === id);
    if (!widget) return;

    // If trying to enable and already at max, don't allow
    if (!widget.visible && visibleCount >= maxWidgets) {
      return;
    }

    // Update local state
    setLocalWidgets(prev => prev.map(w => 
      w.id === id ? { ...w, visible: !w.visible } : w
    ));

    // Notify parent
    onToggleWidget(id);
  };

  const handleSave = () => {
    if (onReorder) {
      onReorder(localWidgets);
    }
    onSave();
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          animation: 'fadeIn 200ms ease-out'
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '500px',
          maxHeight: '80vh',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
          zIndex: 1001,
          animation: 'modalSlideIn 200ms ease-out',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid #E5E7EB'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
                Customize Dashboard
              </h2>
              <p style={{ fontSize: '13px', color: '#6B7280' }}>
                Drag to reorder • Select up to {maxWidgets} widgets
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#9CA3AF'
              }}
            >
              <X style={{ width: '18px', height: '18px' }} />
            </button>
          </div>
        </div>

        {/* Widget List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 16px'
          }}
        >
          {localWidgets.map((widget) => {
            const isDisabled = !widget.visible && visibleCount >= maxWidgets;
            const isDragging = draggedId === widget.id;
            const isDragOver = dragOverId === widget.id;

            return (
              <div
                key={widget.id}
                draggable
                onDragStart={(e) => handleDragStart(e, widget.id)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, widget.id)}
                onDrop={(e) => handleDrop(e, widget.id)}
                style={{
                  padding: '12px',
                  marginBottom: '6px',
                  border: isDragOver ? '2px dashed #3B82F6' : '1px solid #E5E7EB',
                  borderRadius: '8px',
                  background: isDragging ? '#F3F4F6' : widget.visible ? '#F0F9FF' : 'white',
                  opacity: isDragging ? 0.5 : isDisabled ? 0.5 : 1,
                  transition: 'all 150ms ease',
                  cursor: 'grab',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                {/* Drag Handle */}
                <div
                  style={{
                    color: '#9CA3AF',
                    cursor: 'grab',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <GripVertical style={{ width: '16px', height: '16px' }} />
                </div>

                {/* Widget Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>
                      {widget.name}
                    </h3>
                  </div>
                  <p style={{ fontSize: '12px', color: '#6B7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {widget.description}
                  </p>
                </div>

                {/* Toggle Switch */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggle(widget.id);
                  }}
                  disabled={isDisabled}
                  style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: '12px',
                    background: widget.visible ? '#3B82F6' : '#D1D5DB',
                    border: 'none',
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    position: 'relative',
                    transition: 'background 200ms ease',
                    flexShrink: 0
                  }}
                >
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '10px',
                      background: 'white',
                      position: 'absolute',
                      top: '2px',
                      left: widget.visible ? '22px' : '2px',
                      transition: 'left 200ms ease',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid #E5E7EB',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ fontSize: '13px', color: visibleCount >= maxWidgets ? '#EF4444' : '#6B7280' }}>
            {visibleCount} of {maxWidgets} widgets
            {visibleCount >= maxWidgets && <span style={{ marginLeft: '4px' }}>(Maximum)</span>}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onClose}
              style={{
                height: '36px',
                padding: '0 16px',
                borderRadius: '6px',
                border: '1px solid #E5E7EB',
                background: 'white',
                color: '#374151',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              style={{
                height: '36px',
                padding: '0 20px',
                borderRadius: '6px',
                border: 'none',
                background: '#3B82F6',
                color: 'white',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideIn {
          from { opacity: 0; transform: translate(-50%, -48%); }
          to { opacity: 1; transform: translate(-50%, -50%); }
        }
      `}</style>
    </>
  );
}
