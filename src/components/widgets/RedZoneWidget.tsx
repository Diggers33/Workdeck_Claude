/**
 * RedZoneWidget - Connected to Real API
 * Displays projects with issues/alerts from Workdeck API
 */

import React, { useState, useMemo } from 'react';
import { ArrowRight, AlertTriangle, X, Loader2, Clock, DollarSign, Calendar } from 'lucide-react';
import { ProjectSummary } from '../../services/dashboard-api';
import { useRedZoneProjects } from '../../hooks/useApiQueries';

interface RiskItem {
  id: string;
  project: string;
  code: string;
  issue: string;
  severity: 'critical' | 'warning';
  color: string;
  icon: any;
  detail?: string;
}

export function RedZoneWidget() {
  const [showSettings, setShowSettings] = useState(false);

  const [thresholds, setThresholds] = useState({
    budgetVariance: 10,
    scheduleDelay: 2,
    riskScore: 70
  });

  const { data: projects = [], isLoading, error: queryError, refetch } = useRedZoneProjects();
  const error = queryError?.message ?? null;

  const risks = useMemo<RiskItem[]>(() => {
    const riskItems: RiskItem[] = [];
    projects.forEach((project: ProjectSummary) => {
      if (project.alerts && project.alerts.length > 0) {
        project.alerts.forEach(alert => {
          riskItems.push({ id: `${project.id}-alert-${alert.type}`, project: project.name, code: project.code, issue: alert.message || alert.type, severity: alert.severity || 'warning', color: alert.severity === 'critical' ? '#EF4444' : '#F59E0B', icon: AlertTriangle });
        });
      }
      const spent = parseFloat(project.spentHours || '0');
      const planned = parseFloat(project.plannedHours || '0');
      if (planned > 0 && spent > planned) {
        const overPercent = Math.round(((spent - planned) / planned) * 100);
        riskItems.push({ id: `${project.id}-budget`, project: project.name, code: project.code, issue: 'Over Budget', severity: overPercent > 20 ? 'critical' : 'warning', color: overPercent > 20 ? '#EF4444' : '#F59E0B', icon: DollarSign, detail: `${overPercent}% over` });
      }
      if (project.endDate) {
        const endDate = new Date(project.endDate.split('/').reverse().join('-'));
        const today = new Date();
        if (endDate < today) {
          const daysOverdue = Math.ceil((today.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
          riskItems.push({ id: `${project.id}-overdue`, project: project.name, code: project.code, issue: 'Overdue', severity: daysOverdue > 7 ? 'critical' : 'warning', color: daysOverdue > 7 ? '#EF4444' : '#F59E0B', icon: Calendar, detail: `${daysOverdue} days` });
        }
      }
    });
    return riskItems;
  }, [projects]);

  return (
    <>
      <div 
        className="bg-white rounded-lg relative overflow-hidden" 
        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)', height: '100%', display: 'flex', flexDirection: 'column' }}
      >
        {/* Colored top accent */}
        <div className="absolute left-0 right-0 top-0 h-1" style={{ background: 'linear-gradient(90deg, #F87171 0%, #FCA5A5 100%)' }}></div>
        
        {/* Header */}
        <div className="px-3 py-2 border-b border-[#E5E7EB] flex items-center justify-between" style={{ minHeight: '36px' }}>
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-[#F87171]" />
            <h3 className="text-[14px] font-medium text-[#F87171]">Red Zone</h3>
            <span className="w-4 h-4 rounded-full bg-[#F87171] text-white text-[10px] font-bold flex items-center justify-center">
              {risks.length}
            </span>
          </div>
          <button 
            onClick={() => setShowSettings(true)}
            className="text-[11px] text-[#9CA3AF] hover:text-[#111827] transition-colors"
          >
            Settings
          </button>
        </div>

        {/* Risk list */}
        <div className="px-3 py-1.5 custom-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin mb-2" />
              <span className="text-xs text-gray-500">Checking projects...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8">
              <AlertTriangle className="w-6 h-6 text-red-400 mb-2" />
              <span className="text-xs text-red-500">{error}</span>
              <button
                onClick={() => refetch()}
                className="mt-2 text-xs text-blue-500 hover:underline"
              >
                Retry
              </button>
            </div>
          ) : risks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-2">
                <span className="text-2xl">✓</span>
              </div>
              <span className="text-sm font-medium text-green-600">All Clear!</span>
              <span className="text-xs text-gray-500 mt-1">No critical issues found</span>
            </div>
          ) : (
            <div className="space-y-1">
              {risks.map((risk) => {
                const Icon = risk.icon;
                return (
                  <div 
                    key={risk.id}
                    className="flex items-center gap-2 p-1.5 rounded-lg bg-[#FAFAFA] border border-[#F3F4F6] cursor-pointer hover:shadow-sm transition-all"
                  >
                    {/* Risk indicator dot */}
                    <div 
                      className="w-2 h-2 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: risk.color }}
                    />
                    
                    {/* Project name */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold text-[#1F2937] truncate">{risk.project}</p>
                      <p className="text-[10px] text-[#9CA3AF]">{risk.code}</p>
                    </div>
                    
                    {/* Issue badge */}
                    <div 
                      className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded flex-shrink-0"
                      style={{ 
                        backgroundColor: `${risk.color}20`,
                        color: risk.color
                      }}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{risk.issue}</span>
                      {risk.detail && <span className="opacity-75">({risk.detail})</span>}
                    </div>
                    
                    {/* Arrow */}
                    <ArrowRight className="w-3 h-3 text-[#9CA3AF] flex-shrink-0" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowSettings(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-80 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Red Zone Settings</h3>
              <button onClick={() => setShowSettings(false)}>
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-600">Budget Variance Threshold (%)</label>
                <input
                  type="number"
                  value={thresholds.budgetVariance}
                  onChange={(e) => setThresholds({...thresholds, budgetVariance: parseInt(e.target.value)})}
                  className="w-full mt-1 px-2 py-1 border rounded text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">Schedule Delay (weeks)</label>
                <input
                  type="number"
                  value={thresholds.scheduleDelay}
                  onChange={(e) => setThresholds({...thresholds, scheduleDelay: parseInt(e.target.value)})}
                  className="w-full mt-1 px-2 py-1 border rounded text-sm"
                />
              </div>
            </div>
            
            <button 
              onClick={() => setShowSettings(false)}
              className="w-full mt-4 py-2 bg-blue-600 text-white rounded text-sm font-medium"
            >
              Save Settings
            </button>
          </div>
        </div>
      )}
    </>
  );
}
