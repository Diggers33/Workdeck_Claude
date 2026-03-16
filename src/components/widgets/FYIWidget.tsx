/**
 * FYIWidget - Connected to Real API
 * Displays what's new notifications from Workdeck API
 */

import React, { useState, useMemo } from 'react';
import { Bell, Loader2, MessageSquare, FileText, Calendar, CheckSquare, Users, AlertCircle } from 'lucide-react';
import { WhatsNewItem } from '../../services/dashboard-api';
import { useWhatsNew } from '../../hooks/useApiQueries';

interface FYIItem {
  id: string;
  name: string;
  text: string;
  time: string;
  avatar: string;
  color: string;
  read: boolean;
  icon: any;
}

const TYPE_CONFIG: Record<string, { icon: any; color: string }> = {
  'comment': { icon: MessageSquare, color: '#3B82F6' },
  'task': { icon: CheckSquare, color: '#10B981' },
  'project': { icon: FileText, color: '#8B5CF6' },
  'event': { icon: Calendar, color: '#F59E0B' },
  'team': { icon: Users, color: '#EC4899' },
  'default': { icon: Bell, color: '#6B7280' }
};

function getInitials(name: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

function formatTimeAgo(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  } catch {
    return dateString;
  }
}

export function FYIWidget() {
  const { data: rawData = [], isLoading, error: queryError, refetch } = useWhatsNew();
  const error = queryError?.message ?? null;

  const fyiItems = useMemo<FYIItem[]>(() => {
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) return [];
    return rawData.map((item: WhatsNewItem) => {
      const config = TYPE_CONFIG[item.type] || TYPE_CONFIG['default'];
      return {
        id: item.id,
        name: item.user?.fullName || 'System',
        text: item.message || item.title,
        time: formatTimeAgo(item.date),
        avatar: getInitials(item.user?.fullName || 'System'),
        color: config.color,
        read: item.read,
        icon: config.icon
      };
    });
  }, [rawData]);

  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const handleClearAll = () => {
    // Mark all as read locally
    setDismissedIds(new Set(fyiItems.map(item => item.id)));
  };

  const visibleItems = fyiItems.filter(item => !dismissedIds.has(item.id));
  const unreadCount = visibleItems.filter(item => !item.read).length;

  return (
    <div 
      className="bg-white rounded-lg relative overflow-hidden" 
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)', height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      {/* Colored top accent */}
      <div className="absolute left-0 right-0 top-0 h-1" style={{ background: 'linear-gradient(90deg, #A78BFA 0%, #C4B5FD 100%)' }}></div>
      
      {/* Header */}
      <div className="px-3 py-2 border-b border-[#E5E7EB] flex items-center justify-between" style={{ minHeight: '36px' }}>
        <div className="flex items-center gap-1.5">
          <Bell className="w-4 h-4 text-[#A78BFA]" />
          <h3 className="text-[14px] font-medium text-[#1F2937]">FYI</h3>
          {unreadCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#A78BFA] text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </div>
        <button 
          onClick={handleClearAll}
          className="text-[11px] text-[#9CA3AF] hover:text-[#F87171] transition-colors"
        >
          Clear all
        </button>
      </div>

      {/* Items */}
      <div className="px-3 py-1.5 custom-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin mb-2" />
            <span className="text-xs text-gray-500">Loading notifications...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="w-6 h-6 text-red-400 mb-2" />
            <span className="text-xs text-red-500">{error}</span>
            <button
              onClick={() => refetch()}
              className="mt-2 text-xs text-blue-500 hover:underline"
            >
              Retry
            </button>
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-2">
              <Bell className="w-6 h-6 text-purple-400" />
            </div>
            <span className="text-sm font-medium text-gray-600">All caught up!</span>
            <span className="text-xs text-gray-400 mt-1">No new notifications</span>
          </div>
        ) : (
          <div className="space-y-0.5">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              return (
                <div 
                  key={item.id} 
                  className={`flex items-center gap-2 p-1.5 rounded cursor-pointer transition-all hover:bg-[#F9FAFB] ${
                    item.read ? 'opacity-50' : ''
                  }`}
                >
                  <div 
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-medium flex-shrink-0" 
                    style={{ backgroundColor: item.color }}
                  >
                    {item.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[12px] leading-tight truncate ${item.read ? 'text-[#9CA3AF]' : 'text-[#374151]'}`}>
                      <span className={item.read ? '' : 'font-medium'}>{item.name}</span> {item.text}
                    </p>
                    <p className="text-[10px] text-[#9CA3AF] leading-tight">{item.time}</p>
                  </div>
                  <Icon className="w-3 h-3 text-gray-400 flex-shrink-0" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 border-t border-[#E5E7EB] flex items-center justify-between" style={{ minHeight: '30px' }}>
        <button className="text-[11px] text-[#3B82F6] hover:text-[#2563EB]">
          View all →
        </button>
        {visibleItems.length > 0 && (
          <span className="text-[10px] text-white bg-[#9CA3AF] px-1.5 py-0.5 rounded-full font-medium">
            {visibleItems.length}
          </span>
        )}
      </div>
    </div>
  );
}
