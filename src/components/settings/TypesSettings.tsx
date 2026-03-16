import React, { useState, useEffect } from 'react';
import { ChevronLeft, Plus, Tag } from 'lucide-react';
import { apiClient } from '../../services/api-client';
import { ENDPOINTS } from '../../config/api';

interface TypesSettingsProps {
  onBack: () => void;
}

interface TypeItem {
  id: string;
  name: string;
  code: string;
  color?: string;
  enabled: boolean;
  volatile?: boolean;
  daysPerYear?: number;
}

export function TypesSettings({ onBack }: TypesSettingsProps) {
  const [activeTab, setActiveTab] = useState('cost');
  const [loading, setLoading] = useState(true);
  const [costTypes, setCostTypes] = useState<TypeItem[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<TypeItem[]>([]);
  const [projectTypes, setProjectTypes] = useState<TypeItem[]>([]);
  const [financialTypes, setFinancialTypes] = useState<TypeItem[]>([]);

  useEffect(() => {
    loadTypes();
  }, []);

  const loadTypes = async () => {
    setLoading(true);
    try {
      const [costRes, leaveRes, projectRes, financialRes] = await Promise.all([
        apiClient.get(ENDPOINTS.COST_TYPES).catch(() => []),
        apiClient.get(ENDPOINTS.LEAVE_TYPES).catch(() => []),
        apiClient.get(ENDPOINTS.PROJECT_TYPES).catch(() => []),
        apiClient.get(ENDPOINTS.FINANCIAL_TYPES).catch(() => []),
      ]);

      const costData = (costRes as any)?.result || costRes;
      const leaveData = (leaveRes as any)?.result || leaveRes;
      const projectData = (projectRes as any)?.result || projectRes;
      const financialData = (financialRes as any)?.result || financialRes;

      setCostTypes(
        (Array.isArray(costData) ? costData : []).map((t: any) => ({
          id: t.id,
          name: t.name,
          code: t.code || '',
          enabled: t.enabled !== false,
          volatile: t.volatile,
        }))
      );

      setLeaveTypes(
        (Array.isArray(leaveData) ? leaveData : []).map((t: any) => ({
          id: t.id,
          name: t.name,
          code: t.code || '',
          color: t.color,
          enabled: t.enabled !== false,
          daysPerYear: t.daysPerYear,
        }))
      );

      setProjectTypes(
        (Array.isArray(projectData) ? projectData : []).map((t: any) => ({
          id: t.id,
          name: t.name,
          code: t.code || '',
          color: t.color,
          enabled: t.enabled !== false,
        }))
      );

      setFinancialTypes(
        (Array.isArray(financialData) ? financialData : []).map((t: any) => ({
          id: t.id,
          name: t.name,
          code: t.code || '',
          enabled: t.enabled !== false,
        }))
      );
    } catch (error) {
      console.error('Failed to load types:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActiveTypes = (): TypeItem[] => {
    switch (activeTab) {
      case 'cost': return costTypes;
      case 'leave': return leaveTypes;
      case 'project': return projectTypes;
      case 'funding': return financialTypes;
      default: return [];
    }
  };

  const activeTypes = getActiveTypes();

  const tabs = [
    { id: 'cost', label: 'Cost Types', count: costTypes.length },
    { id: 'leave', label: 'Leave Types', count: leaveTypes.length },
    { id: 'project', label: 'Project Types', count: projectTypes.length },
    { id: 'funding', label: 'Funding Types', count: financialTypes.length }
  ];

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="bg-white border-b border-[#E5E7EB] sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button onClick={onBack} className="p-2 hover:bg-[#F3F4F6] rounded-lg transition-colors">
                <ChevronLeft className="w-5 h-5 text-[#6B7280]" />
              </button>
              <div>
                <h1 className="text-[20px] font-medium text-[#1F2937]">Types</h1>
                <p className="text-[13px] text-[#6B7280]">Classification systems and categories</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-lg text-[14px] font-medium transition-colors flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Type
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-[#E5E7EB]">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-[13px] font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? 'text-[#0066FF]'
                    : 'text-[#6B7280] hover:text-[#1F2937]'
                }`}
              >
                {tab.label}
                <span className="ml-2 text-[11px] px-1.5 py-0.5 rounded bg-[#F3F4F6] text-[#6B7280]">
                  {tab.count}
                </span>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0066FF]" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8 pb-24">
        {loading ? (
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-12 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
              <span className="text-[13px] text-[#6B7280]">Loading types...</span>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                <tr>
                  <th className="px-6 py-3 text-left text-[12px] font-medium text-[#6B7280]">Name</th>
                  <th className="px-6 py-3 text-left text-[12px] font-medium text-[#6B7280]">Code</th>
                  {activeTab === 'leave' && (
                    <th className="px-6 py-3 text-left text-[12px] font-medium text-[#6B7280]">Days / Year</th>
                  )}
                  {(activeTab === 'leave' || activeTab === 'project') && (
                    <th className="px-6 py-3 text-left text-[12px] font-medium text-[#6B7280]">Color</th>
                  )}
                  <th className="px-6 py-3 text-left text-[12px] font-medium text-[#6B7280]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {activeTypes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-[13px] text-[#9CA3AF]">
                      No types found
                    </td>
                  </tr>
                ) : (
                  activeTypes.map((type) => (
                    <tr key={type.id} className="hover:bg-[#F9FAFB]">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Tag className="w-4 h-4 text-[#0066FF]" />
                          <span className="text-[13px] font-medium text-[#1F2937]">{type.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[13px] text-[#6B7280]">{type.code || '--'}</td>
                      {activeTab === 'leave' && (
                        <td className="px-6 py-4 text-[13px] text-[#6B7280]">
                          {type.daysPerYear != null ? type.daysPerYear : '--'}
                        </td>
                      )}
                      {(activeTab === 'leave' || activeTab === 'project') && (
                        <td className="px-6 py-4">
                          {type.color ? (
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded-full border border-[#E5E7EB]"
                                style={{ backgroundColor: type.color }}
                              />
                              <span className="text-[12px] text-[#6B7280]">{type.color}</span>
                            </div>
                          ) : (
                            <span className="text-[12px] text-[#9CA3AF]">--</span>
                          )}
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <span className={`text-[12px] px-2 py-0.5 rounded font-medium ${
                          type.enabled ? 'bg-[#D1FAE5] text-[#065F46]' : 'bg-[#F3F4F6] text-[#6B7280]'
                        }`}>
                          {type.enabled ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}