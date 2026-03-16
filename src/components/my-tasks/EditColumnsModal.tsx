import React, { useState } from 'react';
import { X, GripVertical, Trash2, Plus } from 'lucide-react';

interface ColumnData {
  id: string;
  name: string;
  color: string;
  taskIds: string[];
}

interface EditColumnsModalProps {
  columns: ColumnData[];
  onSave: (columns: ColumnData[]) => void;
  onClose: () => void;
}

const COLORS = [
  { name: 'Blue', value: '#2563EB' },
  { name: 'Green', value: '#10B981' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Gray', value: '#6B7280' },
];

export function EditColumnsModal({ columns: initialColumns, onSave, onClose }: EditColumnsModalProps) {
  const [columns, setColumns] = useState([...initialColumns]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');

  const handleStartEdit = (column: ColumnData) => {
    setEditingId(column.id);
    setEditingName(column.name);
  };

  const handleSaveEdit = () => {
    if (editingId && editingName.trim()) {
      setColumns(columns.map(col => 
        col.id === editingId ? { ...col, name: editingName.trim() } : col
      ));
      setEditingId(null);
      setEditingName('');
    }
  };

  const handleChangeColor = (columnId: string, color: string) => {
    setColumns(columns.map(col => 
      col.id === columnId ? { ...col, color } : col
    ));
    setShowColorPicker(null);
  };

  const handleDeleteColumn = (columnId: string) => {
    const column = columns.find(c => c.id === columnId);
    if (column && column.taskIds.length > 0) {
      if (!confirm(`This column has ${column.taskIds.length} tasks. Delete anyway? Tasks will be unassigned from your board.`)) {
        return;
      }
    }
    setColumns(columns.filter(col => col.id !== columnId));
  };

  const handleAddColumn = () => {
    if (newColumnName.trim()) {
      const newColumn: ColumnData = {
        id: `c${Date.now()}`,
        name: newColumnName.trim(),
        color: '#6B7280',
        taskIds: [],
      };
      setColumns([...columns, newColumn]);
      setNewColumnName('');
      setIsAddingNew(false);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newColumns = [...columns];
    const draggedColumn = newColumns[draggedIndex];
    newColumns.splice(draggedIndex, 1);
    newColumns.splice(index, 0, draggedColumn);
    
    setColumns(newColumns);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-xl shadow-2xl w-full max-w-lg animate-scale-in"
          style={{
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#E5E7EB' }}>
            <h2 className="text-[18px] font-semibold text-[#111827]">Manage Your Columns</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#F9FAFB] transition-colors"
            >
              <X className="w-5 h-5 text-[#6B7280]" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-5">
            <p className="text-[14px] text-[#6B7280] mb-4">
              Drag to reorder. These columns are personal - they don't affect project workflows.
            </p>

            {/* Column list */}
            <div className="space-y-2 mb-4">
              {columns.map((column, index) => (
                <div
                  key={column.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className="bg-white border rounded-lg p-3 hover:bg-[#F9FAFB] transition-colors cursor-move"
                  style={{
                    borderColor: '#E5E7EB',
                    opacity: draggedIndex === index ? 0.5 : 1,
                  }}
                >
                  <div className="flex items-center gap-3">
                    {/* Drag handle */}
                    <GripVertical className="w-4 h-4 text-[#9CA3AF] flex-shrink-0" />

                    {/* Color picker */}
                    <div className="relative">
                      <button
                        onClick={() => setShowColorPicker(showColorPicker === column.id ? null : column.id)}
                        className="w-6 h-6 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform"
                        style={{ backgroundColor: column.color }}
                      />
                      
                      {showColorPicker === column.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowColorPicker(null)} />
                          <div className="absolute left-0 top-full mt-2 bg-white rounded-lg shadow-lg border p-2 z-20 flex gap-1" style={{ borderColor: '#E5E7EB' }}>
                            {COLORS.map(color => (
                              <button
                                key={color.value}
                                onClick={() => handleChangeColor(column.id, color.value)}
                                className="w-8 h-8 rounded-full border-2 hover:scale-110 transition-transform"
                                style={{
                                  backgroundColor: color.value,
                                  borderColor: column.color === color.value ? '#111827' : 'white',
                                }}
                                title={color.name}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Column name */}
                    {editingId === column.id ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={handleSaveEdit}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') {
                            setEditingId(null);
                            setEditingName('');
                          }
                        }}
                        autoFocus
                        className="flex-1 px-2 py-1 border rounded"
                        style={{ borderColor: '#2563EB', fontSize: '14px', outline: 'none' }}
                      />
                    ) : (
                      <button
                        onClick={() => handleStartEdit(column)}
                        className="flex-1 text-left text-[14px] text-[#111827] hover:text-[#2563EB] transition-colors"
                      >
                        {column.name}
                      </button>
                    )}

                    {/* Task count */}
                    <span className="text-[12px] text-[#9CA3AF] flex-shrink-0">
                      {column.taskIds.length} tasks
                    </span>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteColumn(column.id)}
                      className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#FEE2E2] text-[#9CA3AF] hover:text-[#EF4444] transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add new column */}
            {isAddingNew ? (
              <div className="border-2 border-dashed rounded-lg p-3" style={{ borderColor: '#2563EB' }}>
                <input
                  type="text"
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  onBlur={() => {
                    if (!newColumnName.trim()) {
                      setIsAddingNew(false);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddColumn();
                    if (e.key === 'Escape') {
                      setIsAddingNew(false);
                      setNewColumnName('');
                    }
                  }}
                  placeholder="Column name..."
                  autoFocus
                  className="w-full px-2 py-1 border-0 focus:outline-none"
                  style={{ fontSize: '14px' }}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleAddColumn}
                    className="flex-1 px-3 py-1.5 rounded-md text-white"
                    style={{ backgroundColor: '#2563EB', fontSize: '13px' }}
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingNew(false);
                      setNewColumnName('');
                    }}
                    className="flex-1 px-3 py-1.5 rounded-md border"
                    style={{ borderColor: '#E5E7EB', fontSize: '13px' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingNew(true)}
                className="w-full px-3 py-2 flex items-center justify-center gap-2 border-2 border-dashed rounded-lg hover:bg-[#F9FAFB] transition-colors"
                style={{ borderColor: '#D1D5DB', fontSize: '14px', color: '#6B7280' }}
              >
                <Plus className="w-4 h-4" />
                Add New Column
              </button>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: '#E5E7EB' }}>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-md hover:bg-[#F9FAFB] transition-colors"
              style={{ fontSize: '14px', color: '#6B7280' }}
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(columns)}
              className="px-4 py-2 rounded-md text-white hover:bg-[#1D4ED8] transition-colors"
              style={{ backgroundColor: '#2563EB', fontSize: '14px', fontWeight: 500 }}
            >
              Save
            </button>
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
