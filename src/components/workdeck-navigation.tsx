import React from 'react';
import { Menu, Search, Bell, ChevronDown, ChevronRight } from 'lucide-react';
import { WorkdeckAvatar } from './workdeck-avatar';

export interface WorkdeckTopNavProps {
  logo?: React.ReactNode;
  searchBar?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function WorkdeckTopNav({ logo, searchBar, actions, className = '' }: WorkdeckTopNavProps) {
  return (
    <nav className={`h-16 bg-white border-b border-[var(--gray-200)] shadow-[0_1px_4px_rgba(0,0,0,0.08)] px-6 flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-6">
        {logo || (
          <div className="text-xl font-bold text-[var(--primary-blue)]">
            Workdeck
          </div>
        )}
        {searchBar}
      </div>
      <div className="flex items-center gap-4">
        {actions}
      </div>
    </nav>
  );
}

export interface WorkdeckTopNavUserProps {
  name: string;
  avatar?: string;
  notificationCount?: number;
  onNotificationClick?: () => void;
  onUserClick?: () => void;
}

export function WorkdeckTopNavUser({ 
  name, 
  avatar, 
  notificationCount = 0,
  onNotificationClick,
  onUserClick
}: WorkdeckTopNavUserProps) {
  return (
    <div className="flex items-center gap-4">
      <button 
        onClick={onNotificationClick}
        className="relative p-2 text-[var(--gray-600)] hover:text-[var(--gray-900)] transition-colors"
      >
        <Bell className="w-6 h-6" />
        {notificationCount > 0 && (
          <span className="absolute top-1 right-1 w-[18px] h-[18px] bg-[var(--error-red)] text-white text-xs rounded-full flex items-center justify-center">
            {notificationCount > 9 ? '9+' : notificationCount}
          </span>
        )}
      </button>
      <button 
        onClick={onUserClick}
        className="flex items-center gap-2 p-2 hover:bg-[var(--gray-100)] rounded-md transition-colors"
      >
        <WorkdeckAvatar src={avatar} name={name} size={32} />
        <ChevronDown className="w-4 h-4 text-[var(--gray-600)]" />
      </button>
    </div>
  );
}

export interface WorkdeckSidebarProps {
  children: React.ReactNode;
  collapsed?: boolean;
  className?: string;
}

export function WorkdeckSidebar({ children, collapsed = false, className = '' }: WorkdeckSidebarProps) {
  return (
    <aside 
      className={`${collapsed ? 'w-16' : 'w-60'} bg-[var(--gray-50)] border-r border-[var(--gray-200)] p-3 transition-all duration-200 ${className}`}
    >
      {children}
    </aside>
  );
}

export interface WorkdeckSidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
  badge?: number;
}

export function WorkdeckSidebarItem({ 
  icon, 
  label, 
  active = false, 
  collapsed = false,
  onClick,
  badge
}: WorkdeckSidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full h-10 px-3 rounded-md flex items-center gap-3 text-sm font-medium transition-all duration-200 ${
        active 
          ? 'bg-[var(--primary-blue)] text-white' 
          : 'text-[var(--gray-700)] hover:bg-[var(--gray-100)]'
      }`}
    >
      <span className={`flex-shrink-0 w-5 h-5 ${active ? 'text-white' : 'text-[var(--gray-600)]'}`}>
        {icon}
      </span>
      {!collapsed && (
        <>
          <span className="flex-1 text-left truncate">{label}</span>
          {badge && badge > 0 && (
            <span className={`px-2 py-0.5 text-xs rounded-full ${
              active 
                ? 'bg-white/20 text-white' 
                : 'bg-[var(--primary-blue)] text-white'
            }`}>
              {badge}
            </span>
          )}
        </>
      )}
    </button>
  );
}

export interface WorkdeckBreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface WorkdeckBreadcrumbsProps {
  items: WorkdeckBreadcrumbItem[];
  className?: string;
}

export function WorkdeckBreadcrumbs({ items, className = '' }: WorkdeckBreadcrumbsProps) {
  return (
    <nav className={`flex items-center gap-2 text-sm ${className}`}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <ChevronRight className="w-4 h-4 text-[var(--gray-400)]" />
          )}
          {index === items.length - 1 ? (
            <span className="text-[var(--gray-900)] font-medium">{item.label}</span>
          ) : (
            <button
              onClick={item.onClick}
              className="text-[var(--gray-500)] hover:text-[var(--primary-blue)] hover:underline transition-colors"
            >
              {item.label}
            </button>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
