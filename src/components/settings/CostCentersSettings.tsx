import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, Plus, GitBranch, ChevronRight, ChevronDown, Loader2, Edit2, Trash2, X } from 'lucide-react';
import { apiClient } from '../../services/api-client';
import { ENDPOINTS } from '../../config/api';

interface CostCenter {
  id: string;
  code: string;
  name: string;
  parentId: string | null;
  level: number;
  hasChildren: boolean;
  active: boolean;
}

interface CostCentersSettingsProps {
  onBack: () => void;
}

interface CostCenterFormData {
  code: string;
  name: string;
  parentId: string | null;
}

export function CostCentersSettings({ onBack }: CostCentersSettingsProps) {
  const [expanded, setExpanded] = useState<string[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingCenter, setEditingCenter] = useState<CostCenter | null>(null);
  const [formData, setFormData] = useState<CostCenterFormData>({ code: '', name: '', parentId: null });
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirmation state
  const [deletingCenter, setDeletingCenter] = useState<CostCenter | null>(null);
  const [deleting, setDeleting] = useState(false);

  /**
   * Map a raw API cost center object to the shape this component expects.
   * The API may use different field names, so we try common variants.
   */
  function mapCostCenter(raw: any): CostCenter {
    return {
      id: String(raw.id || raw._id || raw.costCenterId || ''),
      code: raw.code || raw.costCenterCode || '',
      name: raw.name || raw.costCenterName || raw.title || '',
      parentId: raw.parentId || raw.parent_id || raw.parentCostCenterId || raw.parent || null,
      level: typeof raw.level === 'number' ? raw.level : 0,
      hasChildren: raw.hasChildren ?? false,
      active: raw.active ?? raw.isActive ?? true,
    };
  }

  /**
   * Build the tree structure: compute level, hasChildren, and determine
   * hierarchy from parentId relationships if the API doesn't provide level.
   */
  function buildTree(centers: CostCenter[]): CostCenter[] {
    const idSet = new Set(centers.map(c => c.id));
    const childrenMap = new Map<string | null, string[]>();

    for (const c of centers) {
      const pid = c.parentId && idSet.has(c.parentId) ? c.parentId : null;
      if (!childrenMap.has(pid)) childrenMap.set(pid, []);
      childrenMap.get(pid)!.push(c.id);
    }

    // Compute levels via BFS from roots
    const levelMap = new Map<string, number>();
    const queue: { id: string; level: number }[] = [];
    const roots = childrenMap.get(null) || [];
    for (const rootId of roots) {
      queue.push({ id: rootId, level: 0 });
    }
    // Also add any center whose parentId is not in the set (treat as root)
    for (const c of centers) {
      if (c.parentId && !idSet.has(c.parentId) && !roots.includes(c.id)) {
        queue.push({ id: c.id, level: 0 });
      }
    }

    while (queue.length > 0) {
      const { id, level } = queue.shift()!;
      levelMap.set(id, level);
      const children = childrenMap.get(id) || [];
      for (const childId of children) {
        queue.push({ id: childId, level: level + 1 });
      }
    }

    // Build result with correct levels and hasChildren
    const result: CostCenter[] = [];

    function addNode(id: string) {
      const center = centers.find(c => c.id === id);
      if (!center) return;
      const children = childrenMap.get(id) || [];
      result.push({
        ...center,
        level: levelMap.get(id) ?? center.level,
        hasChildren: children.length > 0,
        parentId: center.parentId && idSet.has(center.parentId) ? center.parentId : null,
      });
      for (const childId of children) {
        addNode(childId);
      }
    }

    // Start with roots
    for (const rootId of roots) {
      addNode(rootId);
    }
    // Add orphans (parentId not in set)
    for (const c of centers) {
      if (c.parentId && !idSet.has(c.parentId) && !result.find(r => r.id === c.id)) {
        addNode(c.id);
      }
    }

    return result;
  }

  const fetchCostCenters = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const response = await apiClient.get<any>(ENDPOINTS.COST_CENTERS);

      // apiClient.get already unwraps data.result, but guard defensively
      const data = response?.result || response;
      const arr = Array.isArray(data) ? data : [];

      const mapped = arr.map(mapCostCenter);
      const tree = buildTree(mapped);

      setCostCenters(tree);

      // Auto-expand root nodes
      const rootIds = tree.filter(c => c.level === 0).map(c => c.id);
      setExpanded(rootIds);
    } catch (err: any) {
      console.error('Failed to fetch cost centers:', err);
      setFetchError(err?.message || 'Failed to load cost centers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCostCenters();
  }, [fetchCostCenters]);

  const toggleExpand = (id: string) => {
    setExpanded(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  /**
   * Check if a node should be visible based on ancestor expansion state.
   */
  function isVisible(center: CostCenter): boolean {
    if (center.level === 0) return true;
    if (!center.parentId) return true;
    // Walk up the tree: all ancestors must be expanded
    let currentParentId: string | null = center.parentId;
    while (currentParentId) {
      if (!expanded.includes(currentParentId)) return false;
      const parent = costCenters.find(c => c.id === currentParentId);
      currentParentId = parent?.parentId || null;
    }
    return true;
  }

  // --- Create / Edit ---

  function openCreateForm(parentId: string | null = null) {
    setEditingCenter(null);
    setFormData({ code: '', name: '', parentId });
    setFormError(null);
    setShowForm(true);
  }

  function openEditForm(center: CostCenter) {
    setEditingCenter(center);
    setFormData({ code: center.code, name: center.name, parentId: center.parentId });
    setFormError(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingCenter(null);
    setFormData({ code: '', name: '', parentId: null });
    setFormError(null);
  }

  async function handleSave() {
    if (!formData.name.trim()) {
      setFormError('Name is required');
      return;
    }
    if (!formData.code.trim()) {
      setFormError('Code is required');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      if (editingCenter) {
        // Update existing
        await apiClient.post(ENDPOINTS.UPDATE_COST_CENTER, {
          id: editingCenter.id,
          code: formData.code.trim(),
          name: formData.name.trim(),
          parentId: formData.parentId || undefined,
        });
      } else {
        // Create new
        await apiClient.post(ENDPOINTS.CREATE_COST_CENTER, {
          code: formData.code.trim(),
          name: formData.name.trim(),
          parentId: formData.parentId || undefined,
        });
      }
      closeForm();
      // Refresh the list
      await fetchCostCenters();
    } catch (err: any) {
      console.error('Failed to save cost center:', err);
      setFormError(err?.message || 'Failed to save cost center');
    } finally {
      setSaving(false);
    }
  }

  // --- Delete ---

  async function handleDelete() {
    if (!deletingCenter) return;
    setDeleting(true);
    try {
      await apiClient.post(ENDPOINTS.DELETE_COST_CENTER, {
        id: deletingCenter.id,
      });
      setDeletingCenter(null);
      // Refresh the list
      await fetchCostCenters();
    } catch (err: any) {
      console.error('Failed to delete cost center:', err);
      // Show error in the delete dialog
      alert(err?.message || 'Failed to delete cost center');
    } finally {
      setDeleting(false);
    }
  }

  // Get root-level cost centers for the parent dropdown
  const possibleParents = costCenters.filter(c => {
    if (editingCenter && c.id === editingCenter.id) return false;
    return true;
  });

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
                <h1 className="text-[20px] font-medium text-[#1F2937]">Cost Centers</h1>
                <p className="text-[13px] text-[#6B7280]">Hierarchical budget tracking structure</p>
              </div>
            </div>
            <button
              onClick={() => openCreateForm()}
              className="px-4 py-2 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-lg text-[14px] font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Cost Center
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8 pb-24">
        {loading ? (
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-12 text-center">
            <Loader2 className="w-8 h-8 text-[#0066FF] animate-spin mx-auto mb-3" />
            <p className="text-[13px] text-[#6B7280]">Loading cost centers...</p>
          </div>
        ) : fetchError ? (
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-12 text-center">
            <p className="text-[14px] text-[#EF4444] mb-2">Failed to load cost centers</p>
            <p className="text-[13px] text-[#6B7280] mb-4">{fetchError}</p>
            <button
              onClick={fetchCostCenters}
              className="px-4 py-2 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-lg text-[13px] font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        ) : costCenters.length === 0 ? (
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-12 text-center">
            <GitBranch className="w-12 h-12 text-[#D1D5DB] mx-auto mb-3" />
            <h3 className="text-[15px] font-medium text-[#1F2937] mb-1">No cost centers yet</h3>
            <p className="text-[13px] text-[#6B7280] mb-4">Add your first cost center to get started</p>
            <button
              onClick={() => openCreateForm()}
              className="px-4 py-2 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-lg text-[13px] font-medium transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Cost Center
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden">
            <div className="divide-y divide-[#E5E7EB]">
              {costCenters.map((center) => {
                const isExpanded = expanded.includes(center.id);

                if (!isVisible(center)) return null;

                return (
                  <div
                    key={center.id}
                    className="hover:bg-[#F9FAFB] transition-colors"
                    style={{ paddingLeft: `${center.level * 32 + 24}px` }}
                  >
                    <div className="flex items-center py-4 pr-6">
                      <div className="flex items-center gap-3 flex-1">
                        {center.hasChildren ? (
                          <button
                            onClick={() => toggleExpand(center.id)}
                            className="p-1 hover:bg-[#E5E7EB] rounded transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-[#6B7280]" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-[#6B7280]" />
                            )}
                          </button>
                        ) : (
                          <div className="w-6" />
                        )}
                        <GitBranch className="w-4 h-4 text-[#0066FF]" />
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="text-[13px] font-medium text-[#1F2937]">{center.name}</span>
                            <span className="text-[12px] font-mono text-[#6B7280]">{center.code}</span>
                            {center.active && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-[#D1FAE5] text-[#065F46] font-medium">
                                Active
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditForm(center)}
                          className="p-2 hover:bg-[#F3F4F6] rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4 text-[#6B7280]" />
                        </button>
                        <button
                          onClick={() => setDeletingCenter(center)}
                          className="p-2 hover:bg-[#FEE2E2] rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-[#F87171]" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-8">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
              <h2 className="text-[16px] font-medium text-[#1F2937]">
                {editingCenter ? 'Edit Cost Center' : 'Add Cost Center'}
              </h2>
              <button onClick={closeForm} className="p-2 hover:bg-[#F3F4F6] rounded-lg transition-colors">
                <X className="w-4 h-4 text-[#6B7280]" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {formError && (
                <div className="px-3 py-2 bg-[#FEF2F2] border border-[#FECACA] rounded-lg">
                  <p className="text-[13px] text-[#EF4444]">{formError}</p>
                </div>
              )}
              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-1.5">Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g. 100 or 100.1"
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[13px] text-[#1F2937] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-1.5">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Design Department"
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[13px] text-[#1F2937] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-1.5">Parent (optional)</label>
                <select
                  value={formData.parentId || ''}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value || null })}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[13px] text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent bg-white"
                >
                  <option value="">None (root level)</option>
                  {possibleParents.map(p => (
                    <option key={p.id} value={p.id}>
                      {'  '.repeat(p.level)}{p.code} - {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E5E7EB]">
              <button
                onClick={closeForm}
                disabled={saving}
                className="px-4 py-2 border border-[#D1D5DB] text-[#374151] rounded-lg text-[13px] font-medium hover:bg-[#F9FAFB] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-lg text-[13px] font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingCenter ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCenter && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-8">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
            <div className="px-6 py-5">
              <h2 className="text-[16px] font-medium text-[#1F2937] mb-2">Delete Cost Center</h2>
              <p className="text-[13px] text-[#6B7280]">
                Are you sure you want to delete <span className="font-medium text-[#1F2937]">{deletingCenter.name}</span>?
                {deletingCenter.hasChildren && (
                  <span className="block mt-1 text-[#EF4444]">
                    This cost center has child items. They may also be affected.
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E5E7EB]">
              <button
                onClick={() => setDeletingCenter(null)}
                disabled={deleting}
                className="px-4 py-2 border border-[#D1D5DB] text-[#374151] rounded-lg text-[13px] font-medium hover:bg-[#F9FAFB] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-[#EF4444] hover:bg-[#DC2626] text-white rounded-lg text-[13px] font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
