/**
 * KeyMetricsWidget - Connected to Real API
 * Displays key project metrics from Workdeck API
 */

import React, { useMemo } from 'react';
import {
  FolderOpen,
  AlertTriangle,
  AlertCircle,
  Clock,
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Loader2
} from 'lucide-react';
import { useKeyMetrics } from '../../hooks/useApiQueries';

interface Metric {
  label: string;
  value: string | number;
  icon: any;
  iconColor: string;
  iconBg: string;
  trend?: number;
  status: 'good' | 'warning' | 'critical';
  subtitle?: string;
}

export function KeyMetricsWidget() {
  const { data, isLoading, error: queryError, refetch } = useKeyMetrics();
  const error = queryError?.message ?? null;

  const metrics = useMemo<Metric[]>(() => {
    if (!data) return [];
    return [
      { label: 'Active Projects', value: data.activeProjects, icon: FolderOpen, iconColor: '#0066FF', iconBg: '#EBF4FF', status: 'good' },
      { label: 'Tasks Due This Week', value: data.tasksDueThisWeek, icon: AlertCircle, iconColor: '#F59E0B', iconBg: '#FEF3C7', status: data.tasksDueThisWeek > 10 ? 'warning' : 'good' },
      { label: 'Critical Issues', value: data.criticalIssues, icon: AlertTriangle, iconColor: '#EF4444', iconBg: '#FEE2E2', status: data.criticalIssues > 0 ? 'critical' : 'good' },
      { label: 'Hours This Week', value: data.hoursThisWeek, icon: Clock, iconColor: '#8B5CF6', iconBg: '#EDE9FE', status: 'good' },
      { label: 'Budget Health', value: `${data.budgetHealth}%`, icon: DollarSign, iconColor: data.budgetHealth >= 80 ? '#10B981' : data.budgetHealth >= 60 ? '#F59E0B' : '#EF4444', iconBg: data.budgetHealth >= 80 ? '#D1FAE5' : data.budgetHealth >= 60 ? '#FEF3C7' : '#FEE2E2', status: data.budgetHealth >= 80 ? 'good' : data.budgetHealth >= 60 ? 'warning' : 'critical' as const },
      { label: 'Team Utilization', value: `${data.teamUtilization}%`, icon: Users, iconColor: data.teamUtilization >= 70 && data.teamUtilization <= 90 ? '#10B981' : '#F59E0B', iconBg: data.teamUtilization >= 70 && data.teamUtilization <= 90 ? '#D1FAE5' : '#FEF3C7', status: data.teamUtilization >= 70 && data.teamUtilization <= 90 ? 'good' : 'warning' as const },
    ];
  }, [data]);

  // Function to determine value color based on metric type and value
  const getValueColor = (label: string, value: string | number): string => {
    if (label === 'Critical Issues' && typeof value === 'number' && value > 0) {
      return '#EF4444';
    }

    if (label === 'Budget Health' && typeof value === 'string') {
      const percentage = parseInt(value);
      if (percentage >= 80) return '#10B981';
      if (percentage >= 60) return '#F59E0B';
      return '#EF4444';
    }

    if (label === 'Team Utilization' && typeof value === 'string') {
      const percentage = parseInt(value);
      if (percentage >= 70 && percentage <= 90) return '#10B981';
      if (percentage < 70) return '#F59E0B';
      return '#EF4444';
    }

    return '#0A0A0A';
  };

  return (
    <div
      style={{
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Widget Header */}
      <div
        style={{
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexShrink: 0,
          borderTop: '3px solid #0066FF',
          borderBottom: '1px solid #E5E7EB'
        }}
      >
        <BarChart3 style={{ width: '16px', height: '16px', color: '#0066FF' }} />
        <h3
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: '#0A0A0A',
            margin: 0
          }}
        >
          Key Metrics
        </h3>
      </div>

      {/* Content */}
      <div
        style={{
          padding: '12px 16px',
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 0
        }}
      >
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <Loader2 style={{ width: '24px', height: '24px', color: '#6B7280', animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '13px', color: '#6B7280' }}>Loading metrics...</span>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', color: '#EF4444' }}>
            <AlertTriangle style={{ width: '24px', height: '24px', marginBottom: '8px' }} />
            <p style={{ fontSize: '13px' }}>{error}</p>
            <button
              onClick={() => refetch()}
              style={{
                marginTop: '8px',
                padding: '4px 12px',
                fontSize: '12px',
                color: '#0066FF',
                background: 'none',
                border: '1px solid #0066FF',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          </div>
        ) : (
          <div
            style={{
              width: '100%',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gridTemplateRows: 'repeat(2, 1fr)',
              gap: '12px 12px'
            }}
          >
            {metrics.map((metric, index) => {
              const Icon = metric.icon;

              return (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    minHeight: 0
                  }}
                >
                  {/* Icon */}
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      background: metric.iconBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      position: 'relative'
                    }}
                  >
                    <Icon style={{ width: '14px', height: '14px', color: metric.iconColor }} />
                    
                    {/* Small Trend Indicator */}
                    {metric.trend !== undefined && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '-3px',
                          right: '-3px',
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          background: metric.trend > 0 ? '#10B981' : '#EF4444',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid white'
                        }}
                      >
                        {metric.trend > 0 ? (
                          <TrendingUp style={{ width: '8px', height: '8px', color: 'white' }} />
                        ) : (
                          <TrendingDown style={{ width: '8px', height: '8px', color: 'white' }} />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Value */}
                  <div
                    style={{
                      fontSize: '20px',
                      fontWeight: 600,
                      color: getValueColor(metric.label, metric.value),
                      lineHeight: '1',
                      letterSpacing: '-0.01em'
                    }}
                  >
                    {metric.value}
                  </div>

                  {/* Label */}
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#6B7280',
                      lineHeight: '1.3'
                    }}
                  >
                    {metric.label}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CSS for spinner animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
