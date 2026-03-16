import React, { useState, useEffect } from 'react';
import { ChevronLeft, Plus, Workflow, Edit2, Trash2, Star, Loader2 } from 'lucide-react';
import { WorkflowTemplateBuilder } from './WorkflowTemplateBuilder';
import { apiClient } from '../../services/api-client';
import { ENDPOINTS } from '../../config/api';

interface WorkflowColumn {
  name: string;
  color: string;
  description?: string;
}

interface WorkflowItem {
  id: string | number;
  name: string;
  isDefault: boolean;
  description?: string;
  columns: WorkflowColumn[];
}

interface WorkflowsSettingsProps {
  onBack: () => void;
}

/**
 * Map a raw API workflow object to the shape the component expects.
 * The API may use different field names (e.g. "stages" instead of "columns",
 * "colors" as a parallel array, "default" instead of "isDefault", etc.).
 */
function mapApiWorkflow(raw: any): WorkflowItem {
  // Determine the columns / stages array
  const rawColumns: any[] =
    raw.columns ||
    raw.stages ||
    raw.steps ||
    [];

  // Some APIs return colors as a separate array alongside stage names
  const rawColors: string[] | undefined = raw.colors;

  const columns: WorkflowColumn[] = rawColumns.map((col: any, idx: number) => {
    if (typeof col === 'string') {
      // Plain string stage name – pair with color from parallel array if available
      return {
        name: col,
        color: rawColors?.[idx] || '#9CA3AF',
        description: '',
      };
    }
    return {
      name: col.name || col.title || col.label || `Column ${idx + 1}`,
      color: col.color || col.colour || rawColors?.[idx] || '#9CA3AF',
      description: col.description || '',
    };
  });

  return {
    id: raw.id || raw._id || raw.workflowId,
    name: raw.name || raw.title || 'Untitled Workflow',
    isDefault: raw.isDefault ?? raw.is_default ?? raw.default ?? false,
    description: raw.description || '',
    columns,
  };
}

export function WorkflowsSettings({ onBack }: WorkflowsSettingsProps) {
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<any>(null);
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch workflows on mount ──────────────────────────────────────
  const fetchWorkflows = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<any>(ENDPOINTS.WORKFLOWS);
      // apiClient.get already unwraps { result: ... }, but be defensive
      const data = response?.result || response;
      const arr = Array.isArray(data) ? data : [];
      setWorkflows(arr.map(mapApiWorkflow));
    } catch (err: any) {
      console.error('Failed to fetch workflows:', err);
      setError(err?.message || 'Failed to load workflows');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  // ── Delete handler ────────────────────────────────────────────────
  const handleDelete = async (workflow: WorkflowItem) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;

    try {
      await apiClient.post(ENDPOINTS.DELETE_WORKFLOW, { id: workflow.id });
      setWorkflows((prev) => prev.filter((w) => w.id !== workflow.id));
    } catch (err: any) {
      console.error('Failed to delete workflow:', err);
      alert(err?.message || 'Failed to delete workflow');
    }
  };

  // ── Save handler (create / update) ────────────────────────────────
  const handleSave = async (newWorkflow: any) => {
    try {
      if (editingWorkflow) {
        // Update existing workflow
        const payload = {
          id: editingWorkflow.id,
          name: newWorkflow.name,
          description: newWorkflow.description,
          columns: newWorkflow.columns,
          isDefault: newWorkflow.isDefault,
        };
        const response = await apiClient.post<any>(ENDPOINTS.UPDATE_WORKFLOW, payload);
        // Use server response if available, otherwise fall back to local data
        const data = response?.result || response;
        const updated = data && typeof data === 'object' && data.id
          ? mapApiWorkflow(data)
          : { ...mapApiWorkflow(newWorkflow), id: editingWorkflow.id };
        setWorkflows((prev) =>
          prev.map((w) => (w.id === editingWorkflow.id ? updated : w))
        );
      } else {
        // Create new workflow
        const payload = {
          name: newWorkflow.name,
          description: newWorkflow.description,
          columns: newWorkflow.columns,
          isDefault: newWorkflow.isDefault,
        };
        const response = await apiClient.post<any>(ENDPOINTS.CREATE_WORKFLOW, payload);
        // Use server response if available, otherwise fall back to local data
        const data = response?.result || response;
        const created = data && typeof data === 'object' && (data.id || data._id)
          ? mapApiWorkflow(data)
          : mapApiWorkflow({ ...newWorkflow, id: newWorkflow.id || Date.now() });
        setWorkflows((prev) => [...prev, created]);
      }
    } catch (err: any) {
      console.error('Failed to save workflow:', err);
      alert(err?.message || 'Failed to save workflow');
    }

    setShowBuilder(false);
    setEditingWorkflow(null);
  };

  // ── Loading state ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB]">
        <div className="bg-white border-b border-[#E5E7EB] sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-8 py-4">
            <div className="flex items-center gap-4">
              <button onClick={onBack} className="p-2 hover:bg-[#F3F4F6] rounded-lg transition-colors">
                <ChevronLeft className="w-5 h-5 text-[#6B7280]" />
              </button>
              <div>
                <h1 className="text-[20px] font-medium text-[#1F2937]">Workflows</h1>
                <p className="text-[13px] text-[#6B7280]">Kanban board templates for projects</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 text-[#0066FF] animate-spin" />
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-[#F9FAFB]">
        <div className="bg-white border-b border-[#E5E7EB] sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-8 py-4">
            <div className="flex items-center gap-4">
              <button onClick={onBack} className="p-2 hover:bg-[#F3F4F6] rounded-lg transition-colors">
                <ChevronLeft className="w-5 h-5 text-[#6B7280]" />
              </button>
              <div>
                <h1 className="text-[20px] font-medium text-[#1F2937]">Workflows</h1>
                <p className="text-[13px] text-[#6B7280]">Kanban board templates for projects</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <p className="text-[14px] text-[#F87171]">{error}</p>
          <button
            onClick={fetchWorkflows}
            className="px-4 py-2 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-lg text-[14px] font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="bg-white border-b border-[#E5E7EB] sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={onBack} className="p-2 hover:bg-[#F3F4F6] rounded-lg transition-colors">
                <ChevronLeft className="w-5 h-5 text-[#6B7280]" />
              </button>
              <div>
                <h1 className="text-[20px] font-medium text-[#1F2937]">Workflows</h1>
                <p className="text-[13px] text-[#6B7280]">Kanban board templates for projects</p>
              </div>
            </div>
            <button
              onClick={() => {
                setEditingWorkflow(null);
                setShowBuilder(true);
              }}
              className="px-4 py-2 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-lg text-[14px] font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Workflow
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8 pb-24">
        <div className="grid gap-6">
          {workflows.map((workflow) => (
            <div key={workflow.id} className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#F0F4FF] flex items-center justify-center">
                      <Workflow className="w-5 h-5 text-[#0066FF]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-[15px] font-medium text-[#1F2937]">{workflow.name}</h3>
                        {workflow.isDefault && (
                          <div className="flex items-center gap-1 text-[#FBBF24]">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span className="text-[11px] font-medium">Default</span>
                          </div>
                        )}
                      </div>
                      <p className="text-[12px] text-[#6B7280] mt-0.5">{workflow.columns.length} columns</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingWorkflow(workflow);
                        setShowBuilder(true);
                      }}
                      className="p-2 hover:bg-[#F3F4F6] rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-[#6B7280]" />
                    </button>
                    {!workflow.isDefault && (
                      <button
                        onClick={() => handleDelete(workflow)}
                        className="p-2 hover:bg-[#FEE2E2] rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-[#F87171]" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Workflow preview */}
                <div className="bg-[#F9FAFB] rounded-lg p-4">
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {workflow.columns.map((column, index) => (
                      <div
                        key={index}
                        className="flex-shrink-0 w-40 bg-white rounded-lg border border-[#E5E7EB] p-3"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: column.color }}
                          />
                          <span className="text-[12px] font-medium text-[#1F2937]">{column.name}</span>
                        </div>
                        <div className="space-y-2">
                          <div className="h-12 bg-[#F9FAFB] rounded border border-[#E5E7EB]" />
                          {index < 3 && (
                            <div className="h-12 bg-[#F9FAFB] rounded border border-[#E5E7EB] opacity-50" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showBuilder && (
        <WorkflowTemplateBuilder
          onClose={() => {
            setShowBuilder(false);
            setEditingWorkflow(null);
          }}
          editingWorkflow={editingWorkflow}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
