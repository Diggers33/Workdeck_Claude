import React from 'react';
import { Loader2 } from 'lucide-react';

export interface WorkdeckSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export function WorkdeckSpinner({ size = 'medium', className = '' }: WorkdeckSpinnerProps) {
  const sizeStyles = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-12 h-12'
  };
  
  return (
    <Loader2 className={`${sizeStyles[size]} animate-spin text-[var(--primary-blue)] ${className}`} />
  );
}

export interface WorkdeckSkeletonProps {
  className?: string;
  variant?: 'text' | 'card' | 'circle' | 'rectangle';
  width?: string;
  height?: string;
}

export function WorkdeckSkeleton({ 
  className = '', 
  variant = 'text',
  width,
  height 
}: WorkdeckSkeletonProps) {
  const baseStyles = 'bg-[var(--gray-200)] animate-pulse';
  
  const variantStyles = {
    text: 'h-4 rounded',
    card: 'h-48 rounded-lg',
    circle: 'rounded-full',
    rectangle: 'rounded-md'
  };
  
  const style: React.CSSProperties = {};
  if (width) style.width = width;
  if (height) style.height = height;
  
  return (
    <div 
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      style={style}
    >
      <div className="h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
    </div>
  );
}

export interface WorkdeckSkeletonTextProps {
  lines?: number;
  className?: string;
}

export function WorkdeckSkeletonText({ lines = 3, className = '' }: WorkdeckSkeletonTextProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <WorkdeckSkeleton 
          key={i} 
          variant="text" 
          width={i === lines - 1 ? '70%' : '100%'} 
        />
      ))}
    </div>
  );
}

export interface WorkdeckSkeletonCardProps {
  className?: string;
}

export function WorkdeckSkeletonCard({ className = '' }: WorkdeckSkeletonCardProps) {
  return (
    <div className={`bg-white border border-[var(--gray-200)] rounded-lg p-6 ${className}`}>
      <div className="flex items-center gap-4 mb-4">
        <WorkdeckSkeleton variant="circle" width="48px" height="48px" />
        <div className="flex-1 space-y-2">
          <WorkdeckSkeleton variant="text" width="60%" />
          <WorkdeckSkeleton variant="text" width="40%" />
        </div>
      </div>
      <WorkdeckSkeletonText lines={3} />
    </div>
  );
}

export interface WorkdeckLoadingOverlayProps {
  loading: boolean;
  children: React.ReactNode;
  message?: string;
}

export function WorkdeckLoadingOverlay({ loading, children, message }: WorkdeckLoadingOverlayProps) {
  return (
    <div className="relative">
      {children}
      {loading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 rounded-lg">
          <WorkdeckSpinner size="large" />
          {message && (
            <p className="mt-4 text-sm text-[var(--gray-600)]">{message}</p>
          )}
        </div>
      )}
    </div>
  );
}
