/**
 * WhosWhereWidget - Connected to Real API
 * Displays team member locations from Workdeck API
 */

import React, { useMemo } from 'react';
import { MapPin, Building2, Laptop, Home, Loader2, AlertTriangle, Plane } from 'lucide-react';
import { WhosWhereEntry } from '../../services/dashboard-api';
import { useWhosWhere } from '../../hooks/useApiQueries';

interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  dept: string;
  status: string;
  statusColor: string;
  statusIcon: any;
  date?: string;
}

const STATUS_CONFIG: Record<string, { color: string; icon: any; label: string }> = {
  'Office': { color: '#10B981', icon: Building2, label: 'Office' },
  'Remote': { color: '#3B82F6', icon: Laptop, label: 'Remote' },
  'WFH': { color: '#8B5CF6', icon: Home, label: 'WFH' },
  'Leave': { color: '#F59E0B', icon: Plane, label: 'Leave' },
  'Travel': { color: '#EC4899', icon: Plane, label: 'Travel' },
  'default': { color: '#6B7280', icon: MapPin, label: 'Unknown' }
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] || STATUS_CONFIG['default'];
}

export function WhosWhereWidget() {
  const { data: rawData = [], isLoading, error: queryError, refetch } = useWhosWhere();
  const error = queryError?.message ?? null;

  const teamMembers = useMemo<TeamMember[]>(() =>
    rawData.map((entry: WhosWhereEntry) => {
      const config = getStatusConfig(entry.status);
      return {
        id: entry.user.id,
        name: entry.user.fullName,
        avatar: getInitials(entry.user.fullName),
        dept: entry.department || entry.office?.name || '',
        status: config.label,
        statusColor: config.color,
        statusIcon: config.icon,
        date: entry.date
      };
    }),
    [rawData]
  );

  // Group members by status for summary
  const statusCounts = teamMembers.reduce((acc, member) => {
    acc[member.status] = (acc[member.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div 
      className="bg-white rounded-lg relative overflow-hidden" 
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)', height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      {/* Colored top accent */}
      <div className="absolute left-0 right-0 top-0 h-1" style={{ background: 'linear-gradient(90deg, #5EEAD4 0%, #99F6E4 100%)' }}></div>
      
      {/* Header */}
      <div className="px-3 py-2 border-b border-[#E5E7EB] flex items-center justify-between" style={{ minHeight: '36px' }}>
        <div className="flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-[#5EEAD4]" />
          <h3 className="text-[14px] font-medium text-[#1F2937]">Who's where</h3>
        </div>
        <button 
          className="bg-[#60A5FA] hover:bg-[#3B82F6] text-white px-2 py-1 rounded text-[11px] font-medium transition-all"
          onClick={() => {/* TODO: Open add location modal */}}
        >
          Add +
        </button>
      </div>

      {/* Team list */}
      <div className="px-3 py-1.5 custom-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin mb-2" />
            <span className="text-xs text-gray-500">Loading team...</span>
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
        ) : teamMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center mb-2">
              <MapPin className="w-6 h-6 text-teal-500" />
            </div>
            <span className="text-sm font-medium text-gray-600">No locations set</span>
            <span className="text-xs text-gray-400 mt-1">Team members haven't logged locations today</span>
          </div>
        ) : (
          <div className="space-y-0.5">
            {teamMembers.map((person) => {
              const StatusIcon = person.statusIcon;
              return (
                <div 
                  key={person.id} 
                  className="flex items-center gap-2 p-1.5 rounded cursor-pointer hover:bg-[#F9FAFB] transition-all"
                >
                  <div 
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-medium flex-shrink-0" 
                    style={{ backgroundColor: person.statusColor }}
                  >
                    {person.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-[#1F2937] truncate leading-tight">{person.name}</p>
                    <p className="text-[10px] text-[#9CA3AF] truncate leading-tight">
                      {person.dept}{person.date ? ` • ${person.date}` : ''}
                    </p>
                  </div>
                  <div 
                    className="flex-shrink-0 flex items-center gap-1 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full" 
                    style={{ backgroundColor: person.statusColor }}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {person.status}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer - Status Legend */}
      <div className="px-3 py-1.5 border-t border-[#E5E7EB] flex items-center gap-3" style={{ minHeight: '30px' }}>
        <div className="flex items-center gap-1">
          <Building2 className="w-3 h-3 text-[#10B981]" />
          <span className="text-[10px] text-[#6B7280]">Office {statusCounts['Office'] ? `(${statusCounts['Office']})` : ''}</span>
        </div>
        <div className="flex items-center gap-1">
          <Laptop className="w-3 h-3 text-[#3B82F6]" />
          <span className="text-[10px] text-[#6B7280]">Remote {statusCounts['Remote'] ? `(${statusCounts['Remote']})` : ''}</span>
        </div>
        <div className="flex items-center gap-1">
          <Home className="w-3 h-3 text-[#8B5CF6]" />
          <span className="text-[10px] text-[#6B7280]">WFH {statusCounts['WFH'] ? `(${statusCounts['WFH']})` : ''}</span>
        </div>
      </div>
    </div>
  );
}
