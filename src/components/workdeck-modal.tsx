import React from 'react';
import { X } from 'lucide-react';

export interface WorkdeckModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export function WorkdeckModal({ 
  open, 
  onClose, 
  children, 
  size = 'medium',
  className = '' 
}: WorkdeckModalProps) {
  const sizeStyles = {
    small: 'max-w-[600px]',
    medium: 'max-w-[800px]',
    large: 'max-w-[1000px]'
  };
  
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div 
        className={`relative w-full ${sizeStyles[size]} bg-white rounded-xl shadow-[var(--shadow-level-4)] ${className}`}
      >
        {children}
      </div>
    </div>
  );
}

export interface WorkdeckModalHeaderProps {
  title: string;
  onClose?: () => void;
  className?: string;
}

export function WorkdeckModalHeader({ title, onClose, className = '' }: WorkdeckModalHeaderProps) {
  return (
    <div className={`flex items-center justify-between p-6 border-b border-[var(--gray-200)] ${className}`}>
      <h2 className="text-xl font-semibold text-[var(--gray-900)]">{title}</h2>
      {onClose && (
        <button
          onClick={onClose}
          className="p-1 text-[var(--gray-500)] hover:text-[var(--gray-900)] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

export interface WorkdeckModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function WorkdeckModalBody({ children, className = '' }: WorkdeckModalBodyProps) {
  return (
    <div className={`p-6 max-h-[60vh] overflow-y-auto ${className}`}>
      {children}
    </div>
  );
}

export interface WorkdeckModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function WorkdeckModalFooter({ children, className = '' }: WorkdeckModalFooterProps) {
  return (
    <div className={`flex items-center justify-end gap-3 p-6 border-t border-[var(--gray-200)] ${className}`}>
      {children}
    </div>
  );
}

export interface WorkdeckConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
}

export function WorkdeckConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary'
}: WorkdeckConfirmModalProps) {
  return (
    <WorkdeckModal open={open} onClose={onClose} size="small">
      <WorkdeckModalHeader title={title} onClose={onClose} />
      <WorkdeckModalBody>
        <p className="text-[var(--gray-600)]">{message}</p>
      </WorkdeckModalBody>
      <WorkdeckModalFooter>
        <button
          onClick={onClose}
          className="px-6 py-2 text-sm font-medium text-[var(--gray-700)] hover:bg-[var(--gray-100)] rounded-md transition-colors"
        >
          {cancelText}
        </button>
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`px-6 py-2 text-sm font-medium text-white rounded-md transition-all ${
            variant === 'danger'
              ? 'bg-[var(--error-red)] hover:bg-[#DC2626]'
              : 'bg-[var(--primary-blue)] hover:bg-[var(--primary-blue-hover)]'
          }`}
        >
          {confirmText}
        </button>
      </WorkdeckModalFooter>
    </WorkdeckModal>
  );
}
