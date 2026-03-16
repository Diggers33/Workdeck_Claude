import React, { useState, useEffect } from 'react';
import { ChevronLeft, Plus, Shield, Edit2, Trash2, Loader2 } from 'lucide-react';
import { apiClient } from '../../services/api-client';
import { ENDPOINTS } from '../../config/api';

interface PoliciesSettingsProps {
  onBack: () => void;
}

interface Policy {
  id: string;
  name: string;
  type: string;
  condition: string;
  approver: string;
  active: boolean;
}

export function PoliciesSettings({ onBack }: PoliciesSettingsProps) {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchPolicies = async (cancelled?: { current: boolean }) => {
    setLoading(true);
    setFetchError(null);
    try {
      const response = await apiClient.get<any>(ENDPOINTS.POLICIES);
      if (cancelled?.current) return;

      // Safely unwrap: apiClient.get already returns data.result,
      // but guard against raw array or wrapped responses
      const data = response?.result || response;
      const arr = Array.isArray(data) ? data : [];

      // Map API fields to the shape this component expects
      const mapped: Policy[] = arr.map((p: any) => ({
        id: p.id || p._id || p.policyId || '',
        name: p.name || p.title || p.policyName || '',
        type: (typeof p.type === 'object' && p.type) ? (p.type.name || p.type.title || '') : (p.type || p.policyType || p.category || ''),
        condition: (typeof p.condition === 'object' && p.condition) ? (p.condition.description || p.condition.rule || '') : (p.condition || p.conditions || p.rule || p.threshold || ''),
        approver: (typeof p.approver === 'object' && p.approver) ? (p.approver.fullName || p.approver.name || '') : Array.isArray(p.approvers) ? p.approvers.map((a: any) => a.fullName || a.name || a).join(', ') : (p.approver || p.approvers || p.approverRole || p.assignedTo || ''),
        active: p.active !== undefined ? p.active : (p.isActive !== undefined ? p.isActive : (p.status === 'active' || p.enabled === true || true)),
      }));

      setPolicies(mapped);
    } catch (err: any) {
      if (cancelled?.current) return;
      console.error('Failed to fetch policies:', err);
      setFetchError(err?.message || 'Failed to load policies');
    } finally {
      if (!cancelled?.current) setLoading(false);
    }
  };

  useEffect(() => {
    const cancelled = { current: false };
    fetchPolicies(cancelled);
    return () => { cancelled.current = true; };
  }, []);

  const handleCreate = async (policyData: Partial<Policy>) => {
    setSaving(true);
    try {
      await apiClient.post<any>(ENDPOINTS.CREATE_POLICY, policyData);
      // Refetch to get the server-generated id and any defaults
      await fetchPolicies();
    } catch (err: any) {
      console.error('Failed to create policy:', err);
      alert(err?.message || 'Failed to create policy');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (policy: Policy) => {
    setSaving(true);
    try {
      await apiClient.post<any>(ENDPOINTS.UPDATE_POLICY, {
        id: policy.id,
        name: policy.name,
        type: policy.type,
        condition: policy.condition,
        approver: policy.approver,
        active: policy.active,
      });
      // Refetch to reflect server state
      await fetchPolicies();
    } catch (err: any) {
      console.error('Failed to update policy:', err);
      alert(err?.message || 'Failed to update policy');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (policyId: string) => {
    if (!confirm('Are you sure you want to delete this policy?')) return;
    setSaving(true);
    try {
      await apiClient.post<any>(ENDPOINTS.DELETE_POLICY, { id: policyId });
      // Remove from local state immediately for responsiveness
      setPolicies(prev => prev.filter(p => p.id !== policyId));
    } catch (err: any) {
      console.error('Failed to delete policy:', err);
      alert(err?.message || 'Failed to delete policy');
    } finally {
      setSaving(false);
    }
  };

  const typeColors: any = {
    'Expense': { bg: '#FEF3C7', text: '#92400E' },
    'Leave': { bg: '#DBEAFE', text: '#1E40AF' },
    'Purchase': { bg: '#D1FAE5', text: '#065F46' },
    'Travel': { bg: '#FCE7F3', text: '#9F1239' }
  };

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
                <h1 className="text-[20px] font-medium text-[#1F2937]">Policies</h1>
                <p className="text-[13px] text-[#6B7280]">Approval workflow rules and thresholds</p>
              </div>
            </div>
            <button
              disabled={saving}
              className="px-4 py-2 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-lg text-[14px] font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Create Policy
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8 pb-24">
        {loading ? (
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-12 text-center">
            <Loader2 className="w-8 h-8 text-[#0066FF] animate-spin mx-auto mb-3" />
            <p className="text-[13px] text-[#6B7280]">Loading policies...</p>
          </div>
        ) : fetchError ? (
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-12 text-center">
            <p className="text-[14px] text-[#EF4444] mb-2">Failed to load policies</p>
            <p className="text-[13px] text-[#6B7280] mb-4">{fetchError}</p>
            <button
              onClick={() => fetchPolicies()}
              className="px-4 py-2 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-lg text-[13px] font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        ) : policies.length > 0 ? (
          <div className="grid gap-4">
            {policies.map((policy) => (
              <div key={policy.id} className="bg-white rounded-lg border border-[#E5E7EB] p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-[#F0F4FF] flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-[#0066FF]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-[15px] font-medium text-[#1F2937]">{policy.name}</h3>
                        <span
                          className="text-[11px] px-2 py-0.5 rounded font-medium"
                          style={{
                            backgroundColor: typeColors[policy.type]?.bg || '#F3F4F6',
                            color: typeColors[policy.type]?.text || '#6B7280'
                          }}
                        >
                          {policy.type}
                        </span>
                        {!policy.active && (
                          <span className="text-[11px] px-2 py-0.5 rounded font-medium bg-[#F3F4F6] text-[#6B7280]">
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div>
                          <p className="text-[11px] font-medium text-[#9CA3AF] mb-0.5">Condition</p>
                          <p className="text-[13px] text-[#1F2937]">{policy.condition}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-medium text-[#9CA3AF] mb-0.5">Approver</p>
                          <p className="text-[13px] text-[#1F2937]">{policy.approver}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      disabled={saving}
                      className="p-2 hover:bg-[#F3F4F6] rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Edit2 className="w-4 h-4 text-[#6B7280]" />
                    </button>
                    <button
                      onClick={() => handleDelete(policy.id)}
                      disabled={saving}
                      className="p-2 hover:bg-[#FEE2E2] rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4 text-[#F87171]" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-12 text-center">
            <Shield className="w-12 h-12 text-[#D1D5DB] mx-auto mb-3" />
            <h3 className="text-[15px] font-medium text-[#1F2937] mb-1">No policies yet</h3>
            <p className="text-[13px] text-[#6B7280] mb-4">Create your first approval policy to get started</p>
            <button
              className="px-4 py-2 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-lg text-[13px] font-medium transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Policy
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
