import React from 'react';

export interface WorkdeckProgressBarProps {
  value: number;
  max?: number;
  variant?: 'primary' | 'success' | 'error';
  showLabel?: boolean;
  className?: string;
}

export function WorkdeckProgressBar({ 
  value, 
  max = 100, 
  variant = 'primary',
  showLabel = false,
  className = '' 
}: WorkdeckProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const variantColors = {
    primary: 'bg-[var(--primary-blue)]',
    success: 'bg-[var(--success-green)]',
    error: 'bg-[var(--error-red)]'
  };
  
  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between mb-2">
          <span className="text-sm text-[var(--gray-600)]">{value} / {max}</span>
          <span className="text-sm font-medium text-[var(--gray-700)]">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="w-full h-2 bg-[var(--gray-200)] rounded-full overflow-hidden">
        <div 
          className={`h-full ${variantColors[variant]} transition-all duration-300 ease-out rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export interface WorkdeckCircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  variant?: 'primary' | 'success' | 'error';
  showLabel?: boolean;
  className?: string;
}

export function WorkdeckCircularProgress({ 
  value, 
  max = 100, 
  size = 64,
  strokeWidth = 6,
  variant = 'primary',
  showLabel = true,
  className = '' 
}: WorkdeckCircularProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  
  const variantColors = {
    primary: 'var(--primary-blue)',
    success: 'var(--success-green)',
    error: 'var(--error-red)'
  };
  
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--gray-200)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={variantColors[variant]}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-out"
        />
      </svg>
      {showLabel && (
        <span className="absolute text-sm font-semibold text-[var(--gray-700)]">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
}
