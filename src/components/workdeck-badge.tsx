import React from 'react';
import { X } from 'lucide-react';

export interface WorkdeckBadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'draft';
  className?: string;
}

export function WorkdeckBadge({ children, variant = 'default', className = '' }: WorkdeckBadgeProps) {
  const variantStyles = {
    default: 'bg-[var(--gray-100)] text-[var(--gray-700)]',
    success: 'bg-[#D1FAE5] text-[#065F46]',
    warning: 'bg-[#FEF3C7] text-[#92400E]',
    error: 'bg-[#FEE2E2] text-[#991B1B]',
    info: 'bg-[#DBEAFE] text-[#1E40AF]',
    draft: 'bg-[var(--gray-200)] text-[var(--gray-600)]'
  };
  
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
}

export interface WorkdeckTagProps extends WorkdeckBadgeProps {
  onClose?: () => void;
}

export function WorkdeckTag({ children, variant = 'default', onClose, className = '' }: WorkdeckTagProps) {
  const variantStyles = {
    default: 'bg-[var(--gray-100)] text-[var(--gray-700)]',
    success: 'bg-[#D1FAE5] text-[#065F46]',
    warning: 'bg-[#FEF3C7] text-[#92400E]',
    error: 'bg-[#FEE2E2] text-[#991B1B]',
    info: 'bg-[#DBEAFE] text-[#1E40AF]',
    draft: 'bg-[var(--gray-200)] text-[var(--gray-600)]'
  };
  
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium ${variantStyles[variant]} ${className}`}>
      {children}
      {onClose && (
        <button
          onClick={onClose}
          className="text-[var(--gray-500)] hover:text-[var(--gray-900)] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </span>
  );
}

export interface WorkdeckStatusBadgeProps {
  status: 'draft' | 'in-progress' | 'completed' | 'approved' | 'rejected' | 'pending' | 'overdue';
  className?: string;
}

export function WorkdeckStatusBadge({ status, className = '' }: WorkdeckStatusBadgeProps) {
  const statusConfig = {
    'draft': { label: 'Draft', color: 'bg-[var(--gray-200)] text-[var(--gray-600)]' },
    'in-progress': { label: 'In Progress', color: 'bg-[#DBEAFE] text-[#1E40AF]' },
    'completed': { label: 'Completed', color: 'bg-[#D1FAE5] text-[#065F46]' },
    'approved': { label: 'Approved', color: 'bg-[#D1FAE5] text-[#065F46]' },
    'rejected': { label: 'Rejected', color: 'bg-[#FEE2E2] text-[#991B1B]' },
    'pending': { label: 'Pending', color: 'bg-[#FEF3C7] text-[#92400E]' },
    'overdue': { label: 'Overdue', color: 'bg-[#FEE2E2] text-[#7F1D1D]' }
  };
  
  const config = statusConfig[status];
  
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.color} ${className}`}>
      {config.label}
    </span>
  );
}
