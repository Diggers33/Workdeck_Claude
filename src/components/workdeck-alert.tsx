import React from 'react';
import { Info, CheckCircle, AlertTriangle, XCircle, X } from 'lucide-react';

export interface WorkdeckAlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export function WorkdeckAlert({ 
  variant = 'info', 
  title, 
  children, 
  onClose,
  className = '' 
}: WorkdeckAlertProps) {
  const variantConfig = {
    info: {
      bg: 'bg-[#EFF6FF]',
      border: 'border-l-[var(--info-blue)]',
      icon: <Info className="w-5 h-5 text-[var(--info-blue)]" />,
      titleColor: 'text-[#1E40AF]',
      textColor: 'text-[#1E3A8A]'
    },
    success: {
      bg: 'bg-[#ECFDF5]',
      border: 'border-l-[var(--success-green)]',
      icon: <CheckCircle className="w-5 h-5 text-[var(--success-green)]" />,
      titleColor: 'text-[#065F46]',
      textColor: 'text-[#064E3B]'
    },
    warning: {
      bg: 'bg-[#FFFBEB]',
      border: 'border-l-[var(--warning-amber)]',
      icon: <AlertTriangle className="w-5 h-5 text-[var(--warning-amber)]" />,
      titleColor: 'text-[#92400E]',
      textColor: 'text-[#78350F]'
    },
    error: {
      bg: 'bg-[#FEF2F2]',
      border: 'border-l-[var(--error-red)]',
      icon: <XCircle className="w-5 h-5 text-[var(--error-red)]" />,
      titleColor: 'text-[#991B1B]',
      textColor: 'text-[#7F1D1D]'
    }
  };
  
  const config = variantConfig[variant];
  
  return (
    <div className={`${config.bg} ${config.border} border-l-4 p-4 rounded-lg flex gap-3 ${className}`}>
      <div className="flex-shrink-0 mt-0.5">
        {config.icon}
      </div>
      <div className="flex-1">
        {title && <h4 className={`text-sm font-semibold mb-1 ${config.titleColor}`}>{title}</h4>}
        <div className={`text-sm ${config.textColor}`}>
          {children}
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className={`flex-shrink-0 ${config.textColor} hover:opacity-70 transition-opacity`}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
