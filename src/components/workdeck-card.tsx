import React from 'react';

export interface WorkdeckCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'outlined' | 'elevated' | 'interactive';
  className?: string;
  onClick?: () => void;
}

export function WorkdeckCard({ children, variant = 'default', className = '', onClick }: WorkdeckCardProps) {
  const baseStyles = 'bg-white rounded-lg p-6 border border-[var(--gray-200)] transition-all duration-200';
  
  const variantStyles = {
    default: 'shadow-[var(--shadow-level-1)]',
    outlined: 'shadow-none',
    elevated: 'shadow-[var(--shadow-level-2)]',
    interactive: 'shadow-[var(--shadow-level-1)] hover:shadow-[var(--shadow-level-2)] cursor-pointer'
  };
  
  return (
    <div 
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export interface WorkdeckCardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function WorkdeckCardHeader({ title, subtitle, action, className = '' }: WorkdeckCardHeaderProps) {
  return (
    <div className={`flex items-start justify-between mb-4 ${className}`}>
      <div>
        <h3 className="text-lg font-semibold text-[var(--gray-900)]">{title}</h3>
        {subtitle && <p className="text-sm text-[var(--gray-500)] mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export interface WorkdeckCardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function WorkdeckCardBody({ children, className = '' }: WorkdeckCardBodyProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

export interface WorkdeckCardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function WorkdeckCardFooter({ children, className = '' }: WorkdeckCardFooterProps) {
  return (
    <div className={`flex items-center justify-end gap-3 mt-4 pt-4 border-t border-[var(--gray-200)] ${className}`}>
      {children}
    </div>
  );
}

export interface WorkdeckCardDividerProps {
  className?: string;
}

export function WorkdeckCardDivider({ className = '' }: WorkdeckCardDividerProps) {
  return <hr className={`border-t border-[var(--gray-200)] my-4 ${className}`} />;
}
