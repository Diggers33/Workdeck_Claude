import React from 'react';
import { Eye, EyeOff, Search, X, Calendar } from 'lucide-react';

export interface WorkdeckInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  success?: boolean;
  inputSize?: 'small' | 'medium' | 'large';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function WorkdeckInput({
  label,
  helperText,
  error,
  success,
  inputSize = 'medium',
  leftIcon,
  rightIcon,
  required,
  className = '',
  ...props
}: WorkdeckInputProps) {
  const sizeStyles = {
    small: 'h-8 px-3 text-sm',
    medium: 'h-10 px-4',
    large: 'h-12 px-5 text-lg'
  };
  
  const baseStyles = 'w-full rounded-md border-[1.5px] bg-white transition-all duration-200 placeholder:text-[var(--gray-400)] focus:outline-none focus:ring-3';
  
  let borderColor = 'border-[var(--gray-300)] focus:border-[var(--primary-blue)] focus:ring-[rgba(0,102,255,0.1)]';
  if (error) {
    borderColor = 'border-[var(--error-red)] focus:border-[var(--error-red)] focus:ring-[rgba(239,68,68,0.1)]';
  } else if (success) {
    borderColor = 'border-[var(--success-green)] focus:border-[var(--success-green)] focus:ring-[rgba(16,185,129,0.1)]';
  }
  
  return (
    <div className="w-full">
      {label && (
        <label className="block mb-2 text-sm font-medium text-[var(--gray-700)]">
          {label}
          {required && <span className="text-[var(--error-red)] ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--gray-500)]">
            {leftIcon}
          </div>
        )}
        <input
          className={`${baseStyles} ${sizeStyles[inputSize]} ${borderColor} ${leftIcon ? 'pl-10' : ''} ${rightIcon ? 'pr-10' : ''} ${className}`}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--gray-500)]">
            {rightIcon}
          </div>
        )}
      </div>
      {(helperText || error) && (
        <p className={`mt-2 text-xs ${error ? 'text-[var(--error-red)] font-medium' : 'text-[var(--gray-500)]'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
}

export interface WorkdeckPasswordInputProps extends Omit<WorkdeckInputProps, 'type'> {}

export function WorkdeckPasswordInput(props: WorkdeckPasswordInputProps) {
  const [showPassword, setShowPassword] = React.useState(false);
  
  return (
    <WorkdeckInput
      {...props}
      type={showPassword ? 'text' : 'password'}
      rightIcon={
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="text-[var(--gray-500)] hover:text-[var(--gray-900)] transition-colors"
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      }
    />
  );
}

export interface WorkdeckSearchInputProps extends Omit<WorkdeckInputProps, 'type'> {
  onClear?: () => void;
}

export function WorkdeckSearchInput({ onClear, ...props }: WorkdeckSearchInputProps) {
  return (
    <WorkdeckInput
      {...props}
      type="search"
      leftIcon={<Search className="w-5 h-5" />}
      rightIcon={
        onClear && props.value ? (
          <button
            type="button"
            onClick={onClear}
            className="text-[var(--gray-500)] hover:text-[var(--gray-900)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        ) : undefined
      }
    />
  );
}

export function WorkdeckDateInput(props: WorkdeckInputProps) {
  return (
    <WorkdeckInput
      {...props}
      type="date"
      rightIcon={<Calendar className="w-5 h-5" />}
    />
  );
}

export interface WorkdeckTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  success?: boolean;
}

export function WorkdeckTextarea({
  label,
  helperText,
  error,
  success,
  required,
  className = '',
  ...props
}: WorkdeckTextareaProps) {
  const baseStyles = 'w-full rounded-md border-[1.5px] bg-white transition-all duration-200 px-4 py-3 min-h-[100px] resize-y placeholder:text-[var(--gray-400)] focus:outline-none focus:ring-3';
  
  let borderColor = 'border-[var(--gray-300)] focus:border-[var(--primary-blue)] focus:ring-[rgba(0,102,255,0.1)]';
  if (error) {
    borderColor = 'border-[var(--error-red)] focus:border-[var(--error-red)] focus:ring-[rgba(239,68,68,0.1)]';
  } else if (success) {
    borderColor = 'border-[var(--success-green)] focus:border-[var(--success-green)] focus:ring-[rgba(16,185,129,0.1)]';
  }
  
  return (
    <div className="w-full">
      {label && (
        <label className="block mb-2 text-sm font-medium text-[var(--gray-700)]">
          {label}
          {required && <span className="text-[var(--error-red)] ml-1">*</span>}
        </label>
      )}
      <textarea
        className={`${baseStyles} ${borderColor} ${className}`}
        {...props}
      />
      {(helperText || error) && (
        <p className={`mt-2 text-xs ${error ? 'text-[var(--error-red)] font-medium' : 'text-[var(--gray-500)]'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
}
