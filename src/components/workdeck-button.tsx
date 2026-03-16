import React from 'react';
import { Loader2 } from 'lucide-react';

export interface WorkdeckButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'link';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export function WorkdeckButton({
  variant = 'primary',
  size = 'medium',
  loading = false,
  icon,
  iconPosition = 'left',
  children,
  className = '',
  disabled,
  ...props
}: WorkdeckButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-md transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
  
  const variantStyles = {
    primary: 'bg-[var(--primary-blue)] text-white hover:bg-[var(--primary-blue-hover)] hover:shadow-[var(--shadow-primary)] focus:ring-[var(--primary-blue)]',
    secondary: 'border-[1.5px] border-[var(--gray-300)] text-[var(--gray-700)] bg-white hover:bg-[var(--gray-100)] hover:border-[var(--gray-400)] focus:ring-[var(--primary-blue)]',
    ghost: 'text-[var(--gray-700)] hover:bg-[var(--gray-100)] focus:ring-[var(--primary-blue)]',
    danger: 'bg-[var(--error-red)] text-white hover:bg-[#DC2626] hover:shadow-[0_4px_12px_rgba(239,68,68,0.2)] focus:ring-[var(--error-red)]',
    link: 'text-[var(--primary-blue)] hover:underline focus:ring-[var(--primary-blue)]'
  };
  
  const sizeStyles = {
    small: 'h-8 px-4 text-sm',
    medium: 'h-10 px-6',
    large: 'h-12 px-8 text-lg'
  };
  
  const iconSizes = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6'
  };
  
  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className={`${iconSizes[size]} animate-spin`} />
          {children}
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className={iconSizes[size]}>{icon}</span>}
          {children}
          {icon && iconPosition === 'right' && <span className={iconSizes[size]}>{icon}</span>}
        </>
      )}
    </button>
  );
}
