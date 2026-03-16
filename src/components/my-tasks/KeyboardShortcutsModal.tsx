import React from 'react';
import { X } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  onClose: () => void;
}

export function KeyboardShortcutsModal({ onClose }: KeyboardShortcutsModalProps) {
  const shortcuts = [
    {
      section: 'NAVIGATION',
      items: [
        { keys: ['←', '→'], description: 'Move between columns' },
        { keys: ['↑', '↓'], description: 'Move between cards' },
        { keys: ['1-9'], description: 'Jump to column by number' },
        { keys: ['/'], description: 'Focus search' },
      ],
    },
    {
      section: 'ACTIONS',
      items: [
        { keys: ['N'], description: 'New task' },
        { keys: ['Enter'], description: 'Open task details' },
        { keys: ['T'], description: 'Start/stop timer' },
        { keys: ['Space'], description: 'Pause/resume timer' },
        { keys: ['E'], description: 'Edit task' },
        { keys: ['D'], description: 'Set due date' },
        { keys: ['P'], description: 'Set priority' },
      ],
    },
    {
      section: 'SELECTION',
      items: [
        { keys: ['Cmd/Ctrl', 'Click'], description: 'Select multiple' },
        { keys: ['Cmd/Ctrl', 'A'], description: 'Select all in column' },
        { keys: ['Escape'], description: 'Clear selection / Close' },
      ],
    },
    {
      section: 'VIEW',
      items: [
        { keys: ['F'], description: 'Toggle focus mode' },
        { keys: ['S'], description: 'Small card size' },
        { keys: ['M'], description: 'Medium card size' },
        { keys: ['L'], description: 'Large card size' },
        { keys: ['H'], description: 'Hide/show done' },
        { keys: ['?'], description: 'Show this help' },
      ],
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-scale-in"
          style={{ boxShadow: '0 25px 50px rgba(0,0,0,0.2)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#E5E7EB' }}>
            <h2 className="text-[20px] font-semibold text-[#111827]">Keyboard Shortcuts</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#F9FAFB] transition-colors"
            >
              <X className="w-5 h-5 text-[#6B7280]" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-5 max-h-[calc(100vh-200px)] overflow-y-auto">
            <div className="grid grid-cols-2 gap-8">
              {shortcuts.map((section, idx) => (
                <div key={idx}>
                  {/* Section header */}
                  <h3
                    className="mb-3 tracking-wider"
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#9CA3AF',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                    }}
                  >
                    {section.section}
                  </h3>

                  {/* Shortcuts */}
                  <div className="space-y-2">
                    {section.items.map((item, itemIdx) => (
                      <div key={itemIdx} className="flex items-center justify-between">
                        {/* Keys */}
                        <div className="flex items-center gap-1">
                          {item.keys.map((key, keyIdx) => (
                            <React.Fragment key={keyIdx}>
                              <kbd
                                className="px-2 py-1 rounded font-mono"
                                style={{
                                  fontSize: '13px',
                                  backgroundColor: '#F3F4F6',
                                  border: '1px solid #E5E7EB',
                                  color: '#111827',
                                }}
                              >
                                {key}
                              </kbd>
                              {keyIdx < item.keys.length - 1 && (
                                <span className="text-[12px] text-[#9CA3AF] mx-0.5">+</span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>

                        {/* Description */}
                        <span className="text-[14px] text-[#374151]">{item.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer hint */}
            <div
              className="mt-6 pt-4 border-t text-center"
              style={{ borderColor: '#E5E7EB', fontSize: '13px', color: '#6B7280' }}
            >
              Press <kbd className="px-2 py-1 rounded font-mono mx-1" style={{ backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB' }}>Escape</kbd> to close
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.15s ease-out;
        }
      `}</style>
    </>
  );
}
