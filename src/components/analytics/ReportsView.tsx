import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Filter,
  TrendingUp,
  Clock,
  DollarSign,
  Users,
  BarChart3,
  PieChart,
  Activity,
  ChevronRight,
  Star,
  Settings,
  Plus,
  Search,
  X,
  Loader2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useReports } from '../../hooks/useReports';

interface ReportsViewProps {
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
}

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  BarChart3, Clock, Users, DollarSign, TrendingUp, Activity, FileText, Calendar, PieChart,
};

function getIconComponent(iconName: string): React.ComponentType<any> {
  return ICON_MAP[iconName] || FileText;
}

const ReportsView = React.memo(function ReportsView({ scrollContainerRef }: ReportsViewProps) {
  const {
    reports,
    categoryCounts,
    favoriteReports,
    selectedReport,
    reportResult,
    isLoading,
    isGenerating,
    error,
    filters,
    setFilters,
    departments,
    projectList,
    selectReport,
    clearReport,
    toggleFavorite,
    retry,
  } = useReports();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Local filter state for the detail view dropdowns
  const [localDateRange, setLocalDateRange] = useState(filters.dateRange);
  const [localProjectFilter, setLocalProjectFilter] = useState(filters.projectFilter);
  const [localTeamFilter, setLocalTeamFilter] = useState(filters.teamFilter);
  const [localCustomStart, setLocalCustomStart] = useState(filters.customStart || '');
  const [localCustomEnd, setLocalCustomEnd] = useState(filters.customEnd || '');
  const [localSelectedProjects, setLocalSelectedProjects] = useState<string[]>(filters.selectedProjects || []);
  const [showProjectPicker, setShowProjectPicker] = useState(false);

  // Counter to force Recharts re-mount when data changes
  const chartKeyRef = useRef(0);
  const prevResultRef = useRef(reportResult);
  if (reportResult !== prevResultRef.current) {
    chartKeyRef.current++;
    prevResultRef.current = reportResult;
  }

  // Report categories with real counts
  const categories = useMemo(() => [
    { id: 'all', name: 'All Reports', icon: FileText, count: categoryCounts['all'] || 0 },
    { id: 'project', name: 'Project Reports', icon: BarChart3, count: categoryCounts['project'] || 0 },
    { id: 'time', name: 'Time Reports', icon: Clock, count: categoryCounts['time'] || 0 },
    { id: 'resource', name: 'Resource Reports', icon: Users, count: categoryCounts['resource'] || 0 },
    { id: 'financial', name: 'Financial Reports', icon: DollarSign, count: categoryCounts['financial'] || 0 },
  ], [categoryCounts]);

  // Filter reports by category and search
  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      const matchesCategory = selectedCategory === 'all' || report.category === selectedCategory;
      const matchesSearch = !searchQuery ||
        report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [reports, selectedCategory, searchQuery]);

  const handleRunReport = useCallback((report: any) => {
    selectReport(report.id);
    // Scroll to top to show report results
    if (scrollContainerRef?.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [selectReport, scrollContainerRef]);

  const handleExport = useCallback((format: string) => {
    console.log(`Exporting report as ${format}`);
  }, []);

  const handleApplyFilters = useCallback(() => {
    setFilters({
      dateRange: localDateRange,
      projectFilter: localProjectFilter,
      teamFilter: localTeamFilter,
      customStart: localDateRange === 'custom' ? localCustomStart : undefined,
      customEnd: localDateRange === 'custom' ? localCustomEnd : undefined,
      selectedProjects: localProjectFilter === 'specific' ? localSelectedProjects : undefined,
    });
  }, [setFilters, localDateRange, localProjectFilter, localTeamFilter, localCustomStart, localCustomEnd, localSelectedProjects]);

  const toggleProjectSelection = useCallback((projectId: string) => {
    setLocalSelectedProjects(prev =>
      prev.includes(projectId) ? prev.filter(id => id !== projectId) : [...prev, projectId]
    );
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const handleCategoryChange = useCallback((id: string) => {
    setSelectedCategory(id);
  }, []);

  const handleToggleFilters = useCallback(() => {
    setShowFilters(prev => !prev);
  }, []);

  const handleDateRangeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setLocalDateRange(e.target.value);
  }, []);

  const handleCustomStartChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalCustomStart(e.target.value);
  }, []);

  const handleCustomEndChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalCustomEnd(e.target.value);
  }, []);

  const handleProjectFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setLocalProjectFilter(e.target.value);
    if (e.target.value !== 'specific') {
      setShowProjectPicker(false);
    }
  }, []);

  const handleTeamFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setLocalTeamFilter(e.target.value);
  }, []);

  const handleToggleProjectPicker = useCallback(() => {
    setShowProjectPicker(prev => !prev);
  }, []);

  const handleSelectAllProjects = useCallback(() => {
    setLocalSelectedProjects(prev =>
      prev.length === projectList.length ? [] : projectList.map(p => p.id)
    );
  }, [projectList]);

  // Loading state
  if (isLoading) {
    return (
      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 24px',
          gap: '16px'
        }}>
          <Loader2 style={{ width: '32px', height: '32px', color: '#0066FF', animation: 'spin 1s linear infinite' }} />
          <p style={{ fontSize: '14px', color: '#6B7280' }}>Loading report data...</p>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 24px',
          gap: '16px'
        }}>
          <FileText style={{ width: '48px', height: '48px', color: '#EF4444' }} />
          <p style={{ fontSize: '14px', color: '#EF4444' }}>{error}</p>
          <button
            onClick={retry}
            style={{
              padding: '8px 16px',
              background: '#0066FF',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (selectedReport && reportResult) {
    return (
      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Report Header */}
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={clearReport}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              background: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#6B7280',
              cursor: 'pointer',
              marginBottom: '16px'
            }}
          >
            ← Back to Reports
          </button>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h1 style={{ fontSize: '24px', color: '#0A0A0A', marginBottom: '8px' }}>
                {selectedReport.name}
              </h1>
              <p style={{ fontSize: '14px', color: '#6B7280' }}>
                {selectedReport.description}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => handleExport('pdf')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  background: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#374151',
                  cursor: 'pointer'
                }}
              >
                <Download style={{ width: '16px', height: '16px' }} />
                Export PDF
              </button>
              <button
                onClick={() => handleExport('excel')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  background: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#374151',
                  cursor: 'pointer'
                }}
              >
                <Download style={{ width: '16px', height: '16px' }} />
                Export Excel
              </button>
            </div>
          </div>

          {/* Report Filters */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '12px',
            padding: '16px',
            background: '#F9FAFB',
            borderRadius: '6px',
            border: '1px solid #E5E7EB'
          }}>
            <select
              value={localDateRange}
              onChange={handleDateRangeChange}
              style={{
                padding: '8px 12px',
                background: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#374151',
                cursor: 'pointer'
              }}
            >
              <option value="last-7-days">Last 7 days</option>
              <option value="last-30-days">Last 30 days</option>
              <option value="last-90-days">Last 90 days</option>
              <option value="last-6-months">Last 6 months</option>
              <option value="last-12-months">Last 12 months</option>
              <option value="this-quarter">This quarter</option>
              <option value="this-year">This year</option>
              <option value="last-year">Last year</option>
              <option value="all-time">All time</option>
              <option value="custom">Custom range</option>
            </select>

            {localDateRange === 'custom' && (
              <>
                <input
                  type="date"
                  value={localCustomStart}
                  onChange={handleCustomStartChange}
                  style={{
                    padding: '8px 12px',
                    background: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: '#374151',
                    cursor: 'pointer'
                  }}
                />
                <span style={{ alignSelf: 'center', color: '#6B7280', fontSize: '14px' }}>to</span>
                <input
                  type="date"
                  value={localCustomEnd}
                  onChange={handleCustomEndChange}
                  style={{
                    padding: '8px 12px',
                    background: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: '#374151',
                    cursor: 'pointer'
                  }}
                />
              </>
            )}

            <select
              value={localProjectFilter}
              onChange={handleProjectFilterChange}
              style={{
                padding: '8px 12px',
                background: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#374151',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Projects</option>
              <option value="active">Active Projects</option>
              <option value="completed">Completed Projects</option>
              <option value="specific">Specific Projects</option>
            </select>

            {localProjectFilter === 'specific' && (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={handleToggleProjectPicker}
                  style={{
                    padding: '8px 12px',
                    background: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: '#374151',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {localSelectedProjects.length === 0
                    ? 'Select projects...'
                    : `${localSelectedProjects.length} project${localSelectedProjects.length !== 1 ? 's' : ''} selected`}
                  <ChevronRight style={{
                    width: '14px',
                    height: '14px',
                    transform: showProjectPicker ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.15s',
                  }} />
                </button>

                {showProjectPicker && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: '4px',
                    background: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    zIndex: 50,
                    width: '280px',
                    maxHeight: '300px',
                    display: 'flex',
                    flexDirection: 'column',
                  }}>
                    <div style={{
                      padding: '8px 12px',
                      borderBottom: '1px solid #E5E7EB',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>
                        Select Projects
                      </span>
                      <button
                        onClick={handleSelectAllProjects}
                        style={{
                          fontSize: '12px',
                          color: '#0066FF',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        {localSelectedProjects.length === projectList.length ? 'Deselect all' : 'Select all'}
                      </button>
                    </div>
                    <div style={{ overflowY: 'auto', maxHeight: '250px', padding: '4px 0' }}>
                      {projectList.map(project => (
                        <label
                          key={project.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 12px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            color: '#374151',
                            background: localSelectedProjects.includes(project.id) ? '#F0F7FF' : 'transparent',
                          }}
                          onMouseEnter={(e) => {
                            if (!localSelectedProjects.includes(project.id)) {
                              (e.currentTarget as HTMLElement).style.background = '#F9FAFB';
                            }
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.background =
                              localSelectedProjects.includes(project.id) ? '#F0F7FF' : 'transparent';
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={localSelectedProjects.includes(project.id)}
                            onChange={() => toggleProjectSelection(project.id)}
                            style={{ accentColor: '#0066FF' }}
                          />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {project.name}
                          </span>
                        </label>
                      ))}
                      {projectList.length === 0 && (
                        <div style={{ padding: '12px', color: '#9CA3AF', fontSize: '13px', textAlign: 'center' }}>
                          No projects available
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <select
              value={localTeamFilter}
              onChange={handleTeamFilterChange}
              style={{
                padding: '8px 12px',
                background: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#374151',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Teams</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            <button
              onClick={handleApplyFilters}
              style={{
                marginLeft: 'auto',
                padding: '8px 16px',
                background: '#0066FF',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              {isGenerating ? 'Generating...' : 'Apply Filters'}
            </button>
          </div>
        </div>

        {/* Report Content - Dynamic based on report type */}
        <div style={{ display: 'grid', gap: '24px' }}>
          {/* Key Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(reportResult.metrics.length, 4)}, 1fr)`, gap: '16px' }}>
            {reportResult.metrics.map((metric, idx) => (
              <div
                key={idx}
                style={{
                  padding: '20px',
                  background: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px'
                }}
              >
                <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>
                  {metric.label}
                </div>
                <div style={{ fontSize: '28px', color: '#0A0A0A', marginBottom: '4px' }}>
                  {metric.value}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: metric.positive ? '#10B981' : '#EF4444'
                }}>
                  {metric.change}
                </div>
              </div>
            ))}
          </div>

          {/* Charts */}
          {(reportResult.lineChartData || reportResult.pieChartData) && (
            <div style={{ display: 'grid', gridTemplateColumns: reportResult.lineChartData && reportResult.pieChartData ? '2fr 1fr' : '1fr', gap: '16px' }}>
              {/* Line Chart */}
              {reportResult.lineChartData && reportResult.lineChartConfig && (
                <div key={`line-${chartKeyRef.current}`} style={{
                  padding: '20px',
                  background: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px'
                }}>
                  <h3 style={{ fontSize: '16px', color: '#0A0A0A', marginBottom: '16px' }}>
                    {reportResult.lineChartConfig.title}
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={reportResult.lineChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="name" stroke="#6B7280" style={{ fontSize: '12px' }} />
                      <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                      <Tooltip />
                      <Legend />
                      {reportResult.lineChartConfig.lines.map(line => (
                        <Line key={line.dataKey} type="monotone" dataKey={line.dataKey} stroke={line.color} strokeWidth={2} name={line.name} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Pie Chart */}
              {reportResult.pieChartData && reportResult.pieChartConfig && (
                <div key={`pie-${chartKeyRef.current}`} style={{
                  padding: '20px',
                  background: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px'
                }}>
                  <h3 style={{ fontSize: '16px', color: '#0A0A0A', marginBottom: '16px' }}>
                    {reportResult.pieChartConfig.title}
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsPieChart>
                      <Pie
                        data={reportResult.pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {reportResult.pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                  <div style={{ textAlign: 'center', marginTop: '12px' }}>
                    <div style={{ fontSize: '24px', color: '#0A0A0A', marginBottom: '4px' }}>{reportResult.pieChartConfig.centerValue}</div>
                    <div style={{ fontSize: '13px', color: '#6B7280' }}>{reportResult.pieChartConfig.centerLabel}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bar Chart */}
          {reportResult.barChartData && reportResult.barChartConfig && (
            <div key={`bar-${chartKeyRef.current}`} style={{
              padding: '20px',
              background: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '6px'
            }}>
              <h3 style={{ fontSize: '16px', color: '#0A0A0A', marginBottom: '16px' }}>
                {reportResult.barChartConfig.title}
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={reportResult.barChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" stroke="#6B7280" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                  <Tooltip />
                  <Bar dataKey={reportResult.barChartConfig.dataKey} fill={reportResult.barChartConfig.color} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Data Table */}
          {reportResult.tableData && (
            <div style={{
              background: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid #E5E7EB',
                background: '#F9FAFB'
              }}>
                <h3 style={{ fontSize: '16px', color: '#0A0A0A' }}>
                  {reportResult.tableData.title}
                </h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E5E7EB', background: '#F9FAFB' }}>
                      {reportResult.tableData.columns.map(col => (
                        <th key={col} style={{ padding: '12px 20px', textAlign: 'left', color: '#6B7280', fontWeight: 600 }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportResult.tableData.rows.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #E5E7EB' }}>
                        {reportResult.tableData!.columns.map(col => {
                          const value = row[col] || '';
                          const isStatus = col === 'Status' || col === 'Severity';
                          return (
                            <td key={col} style={{ padding: '12px 20px', color: isStatus ? undefined : '#6B7280' }}>
                              {isStatus ? (
                                <span style={{
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  background: value === 'On Track' || value === 'Healthy' || value === 'Normal' || value === 'Approved' || value === 'Paid' ? '#DCFCE7' :
                                             value === 'At Risk' || value === 'Medium' || value === 'Moderate' || value === 'Pending' || value === 'Near Limit' ? '#FEF3C7' :
                                             value === 'High' || value === 'Over Budget' || value === 'Overdue' || value === 'Denied' ? '#FEE2E2' :
                                             '#DBEAFE',
                                  color: value === 'On Track' || value === 'Healthy' || value === 'Normal' || value === 'Approved' || value === 'Paid' ? '#166534' :
                                         value === 'At Risk' || value === 'Medium' || value === 'Moderate' || value === 'Pending' || value === 'Near Limit' ? '#92400E' :
                                         value === 'High' || value === 'Over Budget' || value === 'Overdue' || value === 'Denied' ? '#991B1B' :
                                         '#1E40AF'
                                }}>
                                  {value}
                                </span>
                              ) : (
                                value
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', color: '#0A0A0A', marginBottom: '8px' }}>
          Reports
        </h1>
        <p style={{ fontSize: '14px', color: '#6B7280' }}>
          Generate insights and analytics across projects, resources, time, and financials
        </p>
      </div>

      {/* Search and Actions */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        alignItems: 'center'
      }}>
        <div style={{
          flex: 1,
          position: 'relative',
          maxWidth: '400px'
        }}>
          <Search
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '16px',
              height: '16px',
              color: '#9CA3AF'
            }}
          />
          <input
            type="text"
            placeholder="Search reports..."
            value={searchQuery}
            onChange={handleSearchChange}
            style={{
              width: '100%',
              height: '40px',
              paddingLeft: '40px',
              paddingRight: '12px',
              background: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#0A0A0A'
            }}
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: '#9CA3AF'
              }}
            >
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          )}
        </div>

        <button
          onClick={handleToggleFilters}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            height: '40px',
            background: showFilters ? '#F3F4F6' : 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            fontSize: '14px',
            color: '#374151',
            cursor: 'pointer'
          }}
        >
          <Filter style={{ width: '16px', height: '16px' }} />
          Filters
        </button>

        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            height: '40px',
            background: '#0066FF',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          <Plus style={{ width: '16px', height: '16px' }} />
          Custom Report
        </button>
      </div>

      {/* Category Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: '1px solid #E5E7EB',
        paddingBottom: '0'
      }}>
        {categories.map(category => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                background: 'none',
                border: 'none',
                borderBottom: selectedCategory === category.id ? '2px solid #0066FF' : '2px solid transparent',
                color: selectedCategory === category.id ? '#0066FF' : '#6B7280',
                fontSize: '14px',
                cursor: 'pointer',
                marginBottom: '-1px'
              }}
            >
              <Icon style={{ width: '16px', height: '16px' }} />
              {category.name}
              <span style={{
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                background: selectedCategory === category.id ? '#DBEAFE' : '#F3F4F6',
                color: selectedCategory === category.id ? '#0066FF' : '#6B7280'
              }}>
                {category.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Favorite Reports */}
      {selectedCategory === 'all' && favoriteReports.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px'
          }}>
            <Star style={{ width: '18px', height: '18px', color: '#F59E0B', fill: '#F59E0B' }} />
            <h2 style={{ fontSize: '16px', color: '#0A0A0A' }}>
              Favorite Reports
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '16px'
          }}>
            {favoriteReports.map(report => {
              const Icon = getIconComponent(report.icon);
              return (
                <div
                  key={report.id}
                  style={{
                    padding: '20px',
                    background: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 150ms ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#0066FF';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,102,255,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#E5E7EB';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onClick={() => handleRunReport(report)}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '6px',
                      background: `${report.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Icon style={{ width: '20px', height: '20px', color: report.color }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '15px',
                        color: '#0A0A0A',
                        marginBottom: '4px'
                      }}>
                        {report.name}
                      </div>
                      <div style={{
                        fontSize: '13px',
                        color: '#6B7280',
                        lineHeight: '1.4'
                      }}>
                        {report.description}
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(report.id); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', flexShrink: 0 }}
                    >
                      <Star style={{
                        width: '16px',
                        height: '16px',
                        color: '#F59E0B',
                        fill: '#F59E0B',
                      }} />
                    </button>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '12px',
                    borderTop: '1px solid #E5E7EB'
                  }}>
                    <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
                      Last run: {report.lastRun}
                    </span>
                    <ChevronRight style={{ width: '16px', height: '16px', color: '#9CA3AF' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All Reports */}
      <div>
        <h2 style={{ fontSize: '16px', color: '#0A0A0A', marginBottom: '16px' }}>
          {selectedCategory === 'all' ? 'All Reports' : categories.find(c => c.id === selectedCategory)?.name}
        </h2>

        {filteredReports.length === 0 ? (
          <div style={{
            padding: '48px',
            textAlign: 'center',
            background: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '6px'
          }}>
            <FileText style={{
              width: '48px',
              height: '48px',
              color: '#9CA3AF',
              margin: '0 auto 16px'
            }} />
            <p style={{ fontSize: '14px', color: '#6B7280' }}>
              No reports found matching your criteria
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '16px'
          }}>
            {filteredReports.map(report => {
              const Icon = getIconComponent(report.icon);
              return (
                <div
                  key={report.id}
                  style={{
                    padding: '20px',
                    background: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 150ms ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#0066FF';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,102,255,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#E5E7EB';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onClick={() => handleRunReport(report)}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '6px',
                      background: `${report.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Icon style={{ width: '20px', height: '20px', color: report.color }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '15px',
                        color: '#0A0A0A',
                        marginBottom: '4px'
                      }}>
                        {report.name}
                      </div>
                      <div style={{
                        fontSize: '13px',
                        color: '#6B7280',
                        lineHeight: '1.4'
                      }}>
                        {report.description}
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(report.id); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', flexShrink: 0 }}
                    >
                      <Star style={{
                        width: '16px',
                        height: '16px',
                        color: report.isFavorite ? '#F59E0B' : '#D1D5DB',
                        fill: report.isFavorite ? '#F59E0B' : 'none',
                      }} />
                    </button>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '12px',
                    borderTop: '1px solid #E5E7EB'
                  }}>
                    <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
                      Last run: {report.lastRun}
                    </span>
                    <ChevronRight style={{ width: '16px', height: '16px', color: '#9CA3AF' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

export { ReportsView };
