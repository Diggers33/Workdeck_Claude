import React, { useState } from 'react';
import { 
  X, GripVertical, Plus, Edit2, Trash2, Save, Palette, 
  Sparkles, Layout, AlertCircle, ChevronDown, ChevronUp,
  CheckCircle2, Copy, RotateCcw
} from 'lucide-react';

interface Column {
  id: string;
  name: string;
  color: string;
  description?: string;
  isCollapsed?: boolean;
}

interface WorkflowTemplateBuilderProps {
  onClose: () => void;
  onSave: (workflow: any) => void;
  editingWorkflow?: any;
}

const PRESET_TEMPLATES = [
  {
    name: 'Standard Project',
    columns: [
      { name: 'Backlog', color: '#9CA3AF', description: 'Ideas and future tasks' },
      { name: 'To Do', color: '#60A5FA', description: 'Ready to start' },
      { name: 'In Progress', color: '#FBBF24', description: 'Currently working on' },
      { name: 'Review', color: '#F472B6', description: 'Awaiting approval' },
      { name: 'Done', color: '#34D399', description: 'Completed tasks' }
    ]
  },
  {
    name: 'Simple',
    columns: [
      { name: 'To Do', color: '#60A5FA', description: 'Tasks to complete' },
      { name: 'In Progress', color: '#FBBF24', description: 'Active work' },
      { name: 'Done', color: '#34D399', description: 'Finished' }
    ]
  },
  {
    name: 'Design Sprint',
    columns: [
      { name: 'Ideation', color: '#A78BFA', description: 'Brainstorming phase' },
      { name: 'Design', color: '#60A5FA', description: 'Creating designs' },
      { name: 'Prototype', color: '#FBBF24', description: 'Building prototypes' },
      { name: 'Testing', color: '#F472B6', description: 'User testing' },
      { name: 'Shipped', color: '#34D399', description: 'Deployed to production' }
    ]
  },
  {
    name: 'Development',
    columns: [
      { name: 'Planning', color: '#9CA3AF', description: 'Requirements gathering' },
      { name: 'Development', color: '#60A5FA', description: 'Writing code' },
      { name: 'Code Review', color: '#FBBF24', description: 'Peer review' },
      { name: 'QA', color: '#F472B6', description: 'Testing' },
      { name: 'Deployed', color: '#34D399', description: 'Live in production' }
    ]
  }
];

const COLOR_PRESETS = [
  '#9CA3AF', '#60A5FA', '#FBBF24', '#F472B6', '#34D399',
  '#A78BFA', '#F87171', '#FB923C', '#4ADE80', '#2DD4BF',
  '#818CF8', '#E879F9', '#FDE047', '#A3E635', '#38BDF8'
];

export function WorkflowTemplateBuilder({ onClose, onSave, editingWorkflow }: WorkflowTemplateBuilderProps) {
  const [workflowName, setWorkflowName] = useState(editingWorkflow?.name || '');
  const [description, setDescription] = useState(editingWorkflow?.description || '');
  const [columns, setColumns] = useState<Column[]>(
    editingWorkflow?.columns?.map((col: any, idx: number) => ({
      id: `col-${idx}`,
      name: col.name,
      color: col.color,
      description: col.description || '',
      isCollapsed: false
    })) || []
  );
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [showPresets, setShowPresets] = useState(columns.length === 0);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const addColumn = () => {
    const newColumn: Column = {
      id: `col-${Date.now()}`,
      name: `Column ${columns.length + 1}`,
      color: COLOR_PRESETS[columns.length % COLOR_PRESETS.length],
      description: '',
      isCollapsed: false
    };
    setColumns([...columns, newColumn]);
    setEditingColumnId(newColumn.id);
  };

  const updateColumn = (id: string, updates: Partial<Column>) => {
    setColumns(columns.map(col => col.id === id ? { ...col, ...updates } : col));
  };

  const deleteColumn = (id: string) => {
    setColumns(columns.filter(col => col.id !== id));
  };

  const duplicateColumn = (id: string) => {
    const columnToDuplicate = columns.find(col => col.id === id);
    if (columnToDuplicate) {
      const newColumn: Column = {
        ...columnToDuplicate,
        id: `col-${Date.now()}`,
        name: `${columnToDuplicate.name} (Copy)`
      };
      const index = columns.findIndex(col => col.id === id);
      const newColumns = [...columns];
      newColumns.splice(index + 1, 0, newColumn);
      setColumns(newColumns);
    }
  };

  const loadPreset = (preset: typeof PRESET_TEMPLATES[0]) => {
    setColumns(preset.columns.map((col, idx) => ({
      id: `col-${Date.now()}-${idx}`,
      name: col.name,
      color: col.color,
      description: col.description || '',
      isCollapsed: false
    })));
    if (!workflowName) {
      setWorkflowName(preset.name);
    }
    setShowPresets(false);
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

  const handleSave = () => {
    if (!workflowName.trim()) {
      alert('Please enter a workflow name');
      return;
    }
    if (columns.length === 0) {
      alert('Please add at least one column');
      return;
    }

    onSave({
      id: editingWorkflow?.id || Date.now(),
      name: workflowName,
      description,
      columns: columns.map(col => ({
        name: col.name,
        color: col.color,
        description: col.description
      })),
      isDefault: editingWorkflow?.isDefault || false
    });
  };

  const isValid = workflowName.trim() && columns.length > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-[#E5E7EB] p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#0066FF] to-[#0052CC] flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-[20px] font-medium text-[#1F2937]">
                  {editingWorkflow ? 'Edit Workflow Template' : 'Create Workflow Template'}
                </h2>
                <p className="text-[13px] text-[#6B7280] mt-0.5">
                  Design a custom Kanban board layout for your projects
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#F3F4F6] rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-[#6B7280]" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Basic Info */}
            <div className="bg-gradient-to-r from-[#F0F4FF] to-[#E0E9FF] rounded-lg p-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-[#1F2937] mb-2">
                    Workflow Name *
                  </label>
                  <input
                    type="text"
                    value={workflowName}
                    onChange={(e) => setWorkflowName(e.target.value)}
                    placeholder="e.g., Standard Project Workflow"
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#1F2937] mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of this workflow"
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Preset Templates */}
            {showPresets && columns.length === 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[15px] font-medium text-[#1F2937]">Start with a Template</h3>
                  <button
                    onClick={() => setShowPresets(false)}
                    className="text-[13px] text-[#0066FF] hover:underline"
                  >
                    Start from scratch
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {PRESET_TEMPLATES.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => loadPreset(preset)}
                      className="bg-white border-2 border-[#E5E7EB] rounded-lg p-4 text-left hover:border-[#0066FF] hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-[14px] font-medium text-[#1F2937]">{preset.name}</h4>
                        <div className="text-[12px] text-[#6B7280] bg-[#F3F4F6] px-2 py-0.5 rounded">
                          {preset.columns.length} columns
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {preset.columns.map((col, colIdx) => (
                          <div
                            key={colIdx}
                            className="flex-1 h-16 rounded border-2 border-[#E5E7EB] flex items-center justify-center"
                            style={{ borderTopColor: col.color, borderTopWidth: '4px' }}
                          >
                            <span className="text-[10px] text-[#6B7280] text-center px-1">
                              {col.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Columns Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Layout className="w-5 h-5 text-[#0066FF]" />
                  <h3 className="text-[15px] font-medium text-[#1F2937]">Workflow Columns</h3>
                  {columns.length > 0 && (
                    <span className="text-[12px] text-[#6B7280] bg-[#F3F4F6] px-2 py-0.5 rounded">
                      {columns.length} {columns.length === 1 ? 'column' : 'columns'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {columns.length > 0 && !showPresets && (
                    <button
                      onClick={() => setShowPresets(true)}
                      className="px-3 py-1.5 text-[13px] text-[#6B7280] hover:bg-[#F3F4F6] rounded-lg transition-colors flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Load Preset
                    </button>
                  )}
                  <button
                    onClick={addColumn}
                    className="px-3 py-1.5 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-lg text-[13px] font-medium transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add Column
                  </button>
                </div>
              </div>

              {columns.length === 0 && !showPresets ? (
                <div className="bg-[#F9FAFB] border-2 border-dashed border-[#D1D5DB] rounded-lg p-12 text-center">
                  <Layout className="w-12 h-12 text-[#D1D5DB] mx-auto mb-3" />
                  <p className="text-[14px] text-[#6B7280] mb-4">No columns yet</p>
                  <button
                    onClick={addColumn}
                    className="px-4 py-2 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-lg text-[14px] font-medium transition-colors inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Your First Column
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {columns.map((column, index) => (
                    <div
                      key={column.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`bg-white border-2 rounded-lg overflow-hidden transition-all ${
                        draggedIndex === index ? 'opacity-50' : ''
                      } ${
                        editingColumnId === column.id
                          ? 'border-[#0066FF] shadow-md'
                          : 'border-[#E5E7EB] hover:border-[#D1D5DB]'
                      }`}
                    >
                      <div className="flex items-start gap-3 p-4">
                        {/* Drag Handle */}
                        <button className="mt-2 cursor-grab active:cursor-grabbing text-[#9CA3AF] hover:text-[#6B7280]">
                          <GripVertical className="w-5 h-5" />
                        </button>

                        {/* Color Picker */}
                        <div className="mt-2">
                          <div className="relative group">
                            <div
                              className="w-8 h-8 rounded-lg border-2 border-white shadow-sm cursor-pointer hover:scale-110 transition-transform"
                              style={{ backgroundColor: column.color }}
                              onClick={() => setEditingColumnId(column.id)}
                            />
                            {editingColumnId === column.id && (
                              <div className="absolute top-10 left-0 bg-white rounded-lg shadow-xl border border-[#E5E7EB] p-3 z-10">
                                <div className="grid grid-cols-5 gap-2">
                                  {COLOR_PRESETS.map((color) => (
                                    <button
                                      key={color}
                                      onClick={() => updateColumn(column.id, { color })}
                                      className="w-7 h-7 rounded border-2 border-white shadow-sm hover:scale-110 transition-transform"
                                      style={{ backgroundColor: color }}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Column Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-3">
                            <div className="flex-1 grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[11px] font-medium text-[#6B7280] mb-1">
                                  Column Name *
                                </label>
                                <input
                                  type="text"
                                  value={column.name}
                                  onChange={(e) => updateColumn(column.id, { name: e.target.value })}
                                  onFocus={() => setEditingColumnId(column.id)}
                                  placeholder="e.g., In Progress"
                                  className="w-full px-3 py-1.5 border border-[#D1D5DB] rounded text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-medium text-[#6B7280] mb-1">
                                  Description
                                </label>
                                <input
                                  type="text"
                                  value={column.description}
                                  onChange={(e) => updateColumn(column.id, { description: e.target.value })}
                                  onFocus={() => setEditingColumnId(column.id)}
                                  placeholder="What goes in this column?"
                                  className="w-full px-3 py-1.5 border border-[#D1D5DB] rounded text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 mt-2">
                          <button
                            onClick={() => duplicateColumn(column.id)}
                            className="p-1.5 hover:bg-[#F3F4F6] rounded transition-colors"
                            title="Duplicate column"
                          >
                            <Copy className="w-4 h-4 text-[#6B7280]" />
                          </button>
                          <button
                            onClick={() => deleteColumn(column.id)}
                            className="p-1.5 hover:bg-[#FEE2E2] rounded transition-colors"
                            title="Delete column"
                          >
                            <Trash2 className="w-4 h-4 text-[#F87171]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Preview */}
            {columns.length > 0 && (
              <div className="bg-[#F9FAFB] rounded-lg p-5 border border-[#E5E7EB]">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-5 h-5 text-[#0066FF]" />
                  <h3 className="text-[15px] font-medium text-[#1F2937]">Preview</h3>
                </div>
                <div className="bg-white rounded-lg p-4 border border-[#E5E7EB]">
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {columns.map((column) => (
                      <div
                        key={column.id}
                        className="flex-shrink-0 w-56 bg-[#F9FAFB] rounded-lg border-2 border-[#E5E7EB] p-3"
                        style={{ borderTopColor: column.color, borderTopWidth: '3px' }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: column.color }}
                            />
                            <span className="text-[13px] font-medium text-[#1F2937]">
                              {column.name}
                            </span>
                          </div>
                          <span className="text-[11px] text-[#9CA3AF] bg-white px-1.5 py-0.5 rounded">
                            0
                          </span>
                        </div>
                        {column.description && (
                          <p className="text-[11px] text-[#6B7280] mb-3">{column.description}</p>
                        )}
                        <div className="space-y-2">
                          <div className="h-20 bg-white rounded border border-[#E5E7EB] p-2">
                            <div className="h-2 bg-[#F3F4F6] rounded mb-1.5" />
                            <div className="h-2 bg-[#F3F4F6] rounded w-3/4" />
                          </div>
                          <div className="h-20 bg-white rounded border border-[#E5E7EB] p-2 opacity-60">
                            <div className="h-2 bg-[#F3F4F6] rounded mb-1.5" />
                            <div className="h-2 bg-[#F3F4F6] rounded w-2/3" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#E5E7EB] p-4 bg-[#F9FAFB]">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <div className="flex items-center gap-2">
              {!isValid && (
                <div className="flex items-center gap-2 text-[#F87171] text-[13px]">
                  <AlertCircle className="w-4 h-4" />
                  <span>Please add a name and at least one column</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-[14px] text-[#6B7280] hover:bg-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!isValid}
                className={`px-5 py-2 rounded-lg text-[14px] font-medium transition-colors flex items-center gap-2 ${
                  isValid
                    ? 'bg-[#0066FF] hover:bg-[#0052CC] text-white'
                    : 'bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed'
                }`}
              >
                <Save className="w-4 h-4" />
                {editingWorkflow ? 'Save Changes' : 'Create Workflow'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}