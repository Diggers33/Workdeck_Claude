import React, { useState, useEffect } from 'react';
import { ChevronLeft, Plus, Briefcase, Edit2, Trash2, Loader2, X, Check } from 'lucide-react';
import { apiClient } from '../../services/api-client';
import { ENDPOINTS } from '../../config/api';

interface StaffCategoriesSettingsProps {
  onBack: () => void;
}

interface StaffCategory {
  id: string;
  name: string;
  code: string;
  level: number;
  rate: number;
}

/** Map any shape coming from the API into the local StaffCategory shape. */
function mapCategory(raw: any): StaffCategory {
  return {
    id: raw.id || raw._id || '',
    name: raw.name || '',
    code: raw.code || '',
    level: raw.level ?? 0,
    rate: raw.rate ?? raw.costPerHour ?? raw.hourlyRate ?? raw.cost_per_hour ?? raw.hourly_rate ?? 0,
  };
}

export function StaffCategoriesSettings({ onBack }: StaffCategoriesSettingsProps) {
  const [categories, setCategories] = useState<StaffCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Form state for adding / editing
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formLevel, setFormLevel] = useState(1);
  const [formRate, setFormRate] = useState(0);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ---- Fetch categories on mount ----
  useEffect(() => {
    let cancelled = false;

    async function fetchCategories() {
      setLoading(true);
      setFetchError(null);
      try {
        const response = await apiClient.get<any>(ENDPOINTS.STAFF_CATEGORIES);

        if (cancelled) return;

        // apiClient.get already returns data.result, but guard against
        // raw array or double-wrapped responses
        const data = response?.result || response;
        const arr = Array.isArray(data) ? data : [];

        setCategories(arr.map(mapCategory));
      } catch (err: any) {
        if (cancelled) return;
        console.error('Failed to fetch staff categories:', err);
        setFetchError(err?.message || 'Failed to load staff categories');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchCategories();
    return () => { cancelled = true; };
  }, []);

  // ---- Helpers ----
  function resetForm() {
    setFormName('');
    setFormCode('');
    setFormLevel(1);
    setFormRate(0);
    setEditingId(null);
    setShowForm(false);
  }

  function openAddForm() {
    resetForm();
    setShowForm(true);
  }

  function openEditForm(cat: StaffCategory) {
    setEditingId(cat.id);
    setFormName(cat.name);
    setFormCode(cat.code);
    setFormLevel(cat.level);
    setFormRate(cat.rate);
    setShowForm(true);
  }

  // ---- Create ----
  async function handleCreate() {
    setSaving(true);
    try {
      const body = {
        name: formName,
        code: formCode,
        level: formLevel,
        costPerHour: formRate,
      };
      const result = await apiClient.post<any>(ENDPOINTS.CREATE_STAFF_CATEGORY, body);
      const created = mapCategory(result?.result || result || body);
      // If the API didn't return an id, generate a temporary one
      if (!created.id) {
        created.id = `temp-${Date.now()}`;
      }
      setCategories(prev => [...prev, created]);
      resetForm();
    } catch (err: any) {
      console.error('Failed to create staff category:', err);
      alert(err?.message || 'Failed to create staff category');
    } finally {
      setSaving(false);
    }
  }

  // ---- Update ----
  async function handleUpdate() {
    if (!editingId) return;
    setSaving(true);
    try {
      const body = {
        id: editingId,
        name: formName,
        code: formCode,
        level: formLevel,
        costPerHour: formRate,
      };
      const result = await apiClient.post<any>(ENDPOINTS.UPDATE_STAFF_CATEGORY, body);
      const updated = mapCategory(result?.result || result || body);
      // Ensure we keep the correct id
      updated.id = updated.id || editingId;
      setCategories(prev => prev.map(c => c.id === editingId ? updated : c));
      resetForm();
    } catch (err: any) {
      console.error('Failed to update staff category:', err);
      alert(err?.message || 'Failed to update staff category');
    } finally {
      setSaving(false);
    }
  }

  // ---- Delete ----
  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this staff category?')) return;
    setDeletingId(id);
    try {
      await apiClient.post<any>(ENDPOINTS.DELETE_STAFF_CATEGORY, { id });
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      console.error('Failed to delete staff category:', err);
      alert(err?.message || 'Failed to delete staff category');
    } finally {
      setDeletingId(null);
    }
  }

  // ---- Submit handler ----
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingId) {
      handleUpdate();
    } else {
      handleCreate();
    }
  }

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
                <h1 className="text-[20px] font-medium text-[#1F2937]">Staff Categories</h1>
                <p className="text-[13px] text-[#6B7280]">Job position definitions with pay rates</p>
              </div>
            </div>
            <button
              onClick={openAddForm}
              className="px-4 py-2 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-lg text-[14px] font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Category
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8 pb-24">
        {/* Inline add / edit form */}
        {showForm && (
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-medium text-[#1F2937]">
                {editingId ? 'Edit Category' : 'New Category'}
              </h2>
              <button onClick={resetForm} className="p-1 hover:bg-[#F3F4F6] rounded-lg transition-colors">
                <X className="w-4 h-4 text-[#6B7280]" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-[12px] font-medium text-[#6B7280] mb-1">Position Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-[13px] text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                  placeholder="e.g. Senior Designer"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#6B7280] mb-1">Code</label>
                <input
                  type="text"
                  value={formCode}
                  onChange={e => setFormCode(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-[13px] text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                  placeholder="e.g. SD"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#6B7280] mb-1">Level</label>
                <input
                  type="number"
                  value={formLevel}
                  onChange={e => setFormLevel(Number(e.target.value))}
                  min={0}
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-[13px] text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#6B7280] mb-1">Hourly Rate</label>
                <input
                  type="number"
                  value={formRate}
                  onChange={e => setFormRate(Number(e.target.value))}
                  min={0}
                  step="0.01"
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-[13px] text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <div className="col-span-4 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-[#E5E7EB] rounded-lg text-[13px] font-medium text-[#6B7280] hover:bg-[#F3F4F6] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-lg text-[13px] font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-12 text-center">
            <Loader2 className="w-8 h-8 text-[#0066FF] animate-spin mx-auto mb-3" />
            <p className="text-[13px] text-[#6B7280]">Loading staff categories...</p>
          </div>
        ) : fetchError ? (
          /* Error state */
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-12 text-center">
            <p className="text-[14px] text-[#EF4444] mb-2">Failed to load staff categories</p>
            <p className="text-[13px] text-[#6B7280] mb-4">{fetchError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-lg text-[13px] font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        ) : categories.length === 0 ? (
          /* Empty state */
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-12 text-center">
            <Briefcase className="w-12 h-12 text-[#D1D5DB] mx-auto mb-3" />
            <h3 className="text-[15px] font-medium text-[#1F2937] mb-1">No staff categories yet</h3>
            <p className="text-[13px] text-[#6B7280] mb-4">Add your first staff category to get started</p>
            <button
              onClick={openAddForm}
              className="px-4 py-2 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-lg text-[13px] font-medium transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Category
            </button>
          </div>
        ) : (
          /* Table */
          <div className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                <tr>
                  <th className="px-6 py-3 text-left text-[12px] font-medium text-[#6B7280]">Position Name</th>
                  <th className="px-6 py-3 text-left text-[12px] font-medium text-[#6B7280]">Code</th>
                  <th className="px-6 py-3 text-left text-[12px] font-medium text-[#6B7280]">Level</th>
                  <th className="px-6 py-3 text-left text-[12px] font-medium text-[#6B7280]">Hourly Rate</th>
                  <th className="px-6 py-3 text-right text-[12px] font-medium text-[#6B7280]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#F0F4FF] flex items-center justify-center">
                          <Briefcase className="w-4 h-4 text-[#0066FF]" />
                        </div>
                        <span className="text-[13px] font-medium text-[#1F2937]">{cat.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[13px] text-[#6B7280]">{cat.code}</td>
                    <td className="px-6 py-4">
                      <span className="text-[13px] text-[#6B7280]">Level {cat.level}</span>
                    </td>
                    <td className="px-6 py-4 text-[13px] font-medium text-[#1F2937]">{'\u20AC'}{cat.rate}/hr</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditForm(cat)}
                          className="p-2 hover:bg-[#F3F4F6] rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4 text-[#6B7280]" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          disabled={deletingId === cat.id}
                          className="p-2 hover:bg-[#FEE2E2] rounded-lg transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {deletingId === cat.id ? (
                            <Loader2 className="w-4 h-4 text-[#F87171] animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4 text-[#F87171]" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
