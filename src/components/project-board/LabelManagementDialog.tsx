import React, { useState, useMemo } from 'react';
import { X, Plus, Copy, Edit2, Trash2, Check } from 'lucide-react';
import { useProjectsSummary, useAllTasks } from '../../hooks/useApiQueries';

interface Label {
  id: string;
  name: string;
  color: string;
}

interface LabelManagementDialogProps {
  onClose: () => void;
  currentLabels: Label[];
  onSaveLabels: (labels: Label[]) => void;
}

export function LabelManagementDialog({ onClose, currentLabels, onSaveLabels }: LabelManagementDialogProps) {
  const [labels, setLabels] = useState<Label[]>(currentLabels);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [showNewLabel, setShowNewLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#0066FF');
  const [selectedBoard, setSelectedBoard] = useState('');

  // Boards fetched via TanStack Query
  const { data: projectsData = [] } = useProjectsSummary();
  const availableBoards = useMemo(() =>
    projectsData.slice(0, 10).map((p: any) => ({
      id: p.id,
      name: p.name,
      projectName: p.code || p.name,
    })),
    [projectsData]
  );

  const { data: allTasksData = [] } = useAllTasks();
  const boardLabelSets = useMemo(() => {
    const labelsByProject: Record<string, Label[]> = {};
    allTasksData.forEach((t: any) => {
      const projId = t.activity?.project?.id;
      if (projId && t.labels) {
        if (!labelsByProject[projId]) labelsByProject[projId] = [];
        t.labels.forEach((l: any) => {
          if (!labelsByProject[projId].some(existing => existing.id === l.id)) {
            labelsByProject[projId].push({ id: l.id, name: l.name, color: l.color });
          }
        });
      }
    });
    return labelsByProject;
  }, [allTasksData]);

  const presetColors = [
    '#968fe5', '#60A5FA', '#34D399', '#00d400', '#00b4cd',
    '#ffbd01', '#ff9500', '#F87171', '#ff4f6a', '#9CA3AF'
  ];

  const handleAddLabel = () => {
    if (!newLabelName.trim()) return;

    const newLabel: Label = {
      id: `label-${Date.now()}`,
      name: newLabelName.trim(),
      color: newLabelColor
    };

    setLabels([...labels, newLabel]);
    setNewLabelName('');
    setNewLabelColor('#0066FF');
    setShowNewLabel(false);
  };

  const handleStartEdit = (label: Label) => {
    setEditingId(label.id);
    setEditName(label.name);
    setEditColor(label.color);
  };

  const handleSaveEdit = () => {
    if (!editName.trim() || !editingId) return;

    setLabels(labels.map(label =>
      label.id === editingId
        ? { ...label, name: editName.trim(), color: editColor }
        : label
    ));
    setEditingId(null);
    setEditName('');
    setEditColor('');
  };

  const handleDeleteLabel = (id: string) => {
    if (confirm('Are you sure you want to delete this label? It will be removed from all tasks.')) {
      setLabels(labels.filter(label => label.id !== id));
    }
  };

  const handleCopyFromBoard = () => {
    if (!selectedBoard) return;

    const boardLabels = boardLabelSets[selectedBoard] || [];
    
    // Merge labels, avoiding duplicates by name
    const existingNames = new Set(labels.map(l => l.name.toLowerCase()));
    const newLabels = boardLabels.filter(bl => !existingNames.has(bl.name.toLowerCase()));
    
    setLabels([...labels, ...newLabels]);
    setSelectedBoard('');
  };

  const handleSave = () => {
    onSaveLabels(labels);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        width: '640px',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#1F2937' }}>
              Manage Labels
            </div>
            <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>
              Create and organize labels for your board
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#6B7280',
              padding: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Copy from Board */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #E5E7EB',
          background: '#F9FAFB'
        }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
            Copy Labels from Another Board
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select
              value={selectedBoard}
              onChange={(e) => setSelectedBoard(e.target.value)}
              style={{
                flex: 1,
                height: '36px',
                padding: '0 12px',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                background: 'white'
              }}
            >
              <option value="">Select a board...</option>
              {availableBoards.map(board => (
                <option key={board.id} value={board.id}>
                  {board.projectName} - {board.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleCopyFromBoard}
              disabled={!selectedBoard}
              style={{
                height: '36px',
                padding: '0 16px',
                background: selectedBoard ? '#0066FF' : '#E5E7EB',
                color: selectedBoard ? 'white' : '#9CA3AF',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: selectedBoard ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Copy size={16} />
              Copy
            </button>
          </div>
          {selectedBoard && boardLabelSets[selectedBoard] && (
            <div style={{ marginTop: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {boardLabelSets[selectedBoard].map(label => (
                <div
                  key={label.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '4px 10px',
                    background: label.color,
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 500
                  }}
                >
                  {label.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Labels List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 24px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937' }}>
              Current Labels ({labels.length})
            </div>
            <button
              onClick={() => setShowNewLabel(true)}
              style={{
                height: '32px',
                padding: '0 12px',
                background: '#0066FF',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Plus size={16} />
              New Label
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* New Label Form */}
            {showNewLabel && (
              <div style={{
                padding: '12px',
                background: '#F9FAFB',
                borderRadius: '6px',
                border: '2px solid #0066FF'
              }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <input
                    type="text"
                    placeholder="Label name..."
                    value={newLabelName}
                    onChange={(e) => setNewLabelName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddLabel()}
                    autoFocus
                    style={{
                      flex: 1,
                      height: '36px',
                      padding: '0 12px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                  <input
                    type="color"
                    value={newLabelColor}
                    onChange={(e) => setNewLabelColor(e.target.value)}
                    style={{
                      width: '56px',
                      height: '36px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  {presetColors.map(color => (
                    <button
                      key={color}
                      onClick={() => setNewLabelColor(color)}
                      style={{
                        width: '32px',
                        height: '32px',
                        background: color,
                        border: newLabelColor === color ? '2px solid #1F2937' : '1px solid #E5E7EB',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        position: 'relative'
                      }}
                    >
                      {newLabelColor === color && (
                        <Check size={16} color="white" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
                      )}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => {
                      setShowNewLabel(false);
                      setNewLabelName('');
                      setNewLabelColor('#0066FF');
                    }}
                    style={{
                      height: '32px',
                      padding: '0 12px',
                      background: 'transparent',
                      color: '#6B7280',
                      border: '1px solid #E5E7EB',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddLabel}
                    disabled={!newLabelName.trim()}
                    style={{
                      height: '32px',
                      padding: '0 12px',
                      background: newLabelName.trim() ? '#0066FF' : '#E5E7EB',
                      color: newLabelName.trim() ? 'white' : '#9CA3AF',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: newLabelName.trim() ? 'pointer' : 'not-allowed'
                    }}
                  >
                    Add Label
                  </button>
                </div>
              </div>
            )}

            {/* Existing Labels */}
            {labels.length === 0 ? (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                color: '#9CA3AF',
                fontSize: '14px'
              }}>
                No labels yet. Create your first label or copy from another board.
              </div>
            ) : (
              labels.map(label => (
                <div
                  key={label.id}
                  style={{
                    padding: '12px',
                    background: editingId === label.id ? '#F9FAFB' : 'white',
                    border: `1px solid ${editingId === label.id ? '#0066FF' : '#E5E7EB'}`,
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  {editingId === label.id ? (
                    <>
                      <input
                        type="color"
                        value={editColor}
                        onChange={(e) => setEditColor(e.target.value)}
                        style={{
                          width: '40px',
                          height: '40px',
                          border: '1px solid #E5E7EB',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      />
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                        style={{
                          flex: 1,
                          height: '36px',
                          padding: '0 12px',
                          border: '1px solid #E5E7EB',
                          borderRadius: '6px',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditName('');
                          setEditColor('');
                        }}
                        style={{
                          padding: '8px',
                          background: 'transparent',
                          border: '1px solid #E5E7EB',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          color: '#6B7280'
                        }}
                      >
                        <X size={16} />
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        disabled={!editName.trim()}
                        style={{
                          padding: '8px',
                          background: editName.trim() ? '#0066FF' : '#E5E7EB',
                          color: editName.trim() ? 'white' : '#9CA3AF',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: editName.trim() ? 'pointer' : 'not-allowed'
                        }}
                      >
                        <Check size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          background: label.color,
                          borderRadius: '6px',
                          flexShrink: 0
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: 500, color: '#1F2937' }}>
                          {label.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>
                          {label.color}
                        </div>
                      </div>
                      <button
                        onClick={() => handleStartEdit(label)}
                        style={{
                          padding: '8px',
                          background: 'transparent',
                          border: '1px solid #E5E7EB',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          color: '#6B7280'
                        }}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteLabel(label.id)}
                        style={{
                          padding: '8px',
                          background: 'transparent',
                          border: '1px solid #E5E7EB',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          color: '#F87171'
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '13px', color: '#6B7280' }}>
            Changes will be saved to this board
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onClose}
              style={{
                height: '36px',
                padding: '0 16px',
                background: 'transparent',
                color: '#6B7280',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
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
                padding: '0 16px',
                background: '#0066FF',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
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
    </div>
  );
}
