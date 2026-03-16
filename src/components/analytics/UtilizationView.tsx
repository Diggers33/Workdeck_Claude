import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  TrendingUp,
  Clock,
  Activity,
  BarChart3,
  Filter,
  Download,
  Loader2,
  AlertCircle,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart as RechartsPieChart,
  Pie,
} from 'recharts';
import { insightsEngine, RawData } from '../../services/insights-engine';
import { ProjectSummary, CurrentUser, TimesheetEntry } from '../../services/dashboard-api';

// ============================================================================
// Types
// ============================================================================

interface MemberUtilization {
  id: string;
  name: string;
  department: string;
  allocated: number;
  spent: number;
  available: number;
  rate: number; // 0-100
  trend: 'up' | 'down' | 'flat';
  projects: number;
}

interface DeptUtilization {
  department: string;
  memberCount: number;
  avgRate: number;
  totalAllocated: number;
  totalSpent: number;
}

// ============================================================================
// Helpers
// ============================================================================

function parseHours(value?: string): number {
  return parseFloat(value || '0') || 0;
}

function getUserName(user: any): string {
  if (!user) return 'Unknown';
  if (user.fullName) return user.fullName;
  const first = user.firstName || '';
  const last = user.lastName || '';
  return `${first} ${last}`.trim() || user.name || user.email || 'Unknown';
}

function getUserDept(user: any): string {
  if (!user) return 'Unassigned';
  if (user.department?.name) return user.department.name;
  if (user.departmentName) return String(user.departmentName);
  if (typeof user.department === 'string' && user.department) return user.department;
  return 'Unassigned';
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0] || '').join('').toUpperCase().slice(0, 2);
}

const UTIL_COLORS = {
  overloaded: '#DC2626',
  high: '#F59E0B',
  optimal: '#10B981',
  underutilized: '#6B7280',
};

function getUtilColor(rate: number): string {
  if (rate > 100) return UTIL_COLORS.overloaded;
  if (rate >= 80) return UTIL_COLORS.optimal;
  if (rate >= 50) return UTIL_COLORS.high;
  return UTIL_COLORS.underutilized;
}

function getUtilLabel(rate: number): string {
  if (rate > 100) return 'Overloaded';
  if (rate >= 80) return 'Optimal';
  if (rate >= 50) return 'Moderate';
  return 'Underutilized';
}

// ============================================================================
// Computation
// ============================================================================

function computeUtilization(rawData: RawData): {
  members: MemberUtilization[];
  departments: DeptUtilization[];
  monthlyTrend: Array<{ month: string; rate: number; hours: number }>;
  summary: { avgRate: number; overloaded: number; optimal: number; underutilized: number; totalMembers: number };
} {
  const { projects, users, timesheets } = rawData;

  // Build per-user allocation from projects
  const userAlloc: Record<string, { allocated: number; projects: Set<string> }> = {};
  for (const proj of projects) {
    const totalAllocated = parseHours(proj.allocatedHours);
    const memberCount = proj.members?.length || 1;
    const perMember = totalAllocated / memberCount;
    for (const m of proj.members || []) {
      const uid = m.user.id;
      if (!userAlloc[uid]) userAlloc[uid] = { allocated: 0, projects: new Set() };
      userAlloc[uid].allocated += perMember;
      userAlloc[uid].projects.add(proj.id);
    }
  }

  // Build per-user spent from timesheets
  const userSpent: Record<string, number> = {};
  for (const ts of timesheets) {
    const uid = ts.user.id;
    userSpent[uid] = (userSpent[uid] || 0) + parseHours(ts.hours);
  }

  // Build member utilization
  const members: MemberUtilization[] = users.map(u => {
    const alloc = userAlloc[u.id] || { allocated: 0, projects: new Set() };
    const spent = userSpent[u.id] || 0;
    const available = Math.max(0, alloc.allocated - spent);
    const rate = alloc.allocated > 0 ? Math.round((spent / alloc.allocated) * 100) : (spent > 0 ? 100 : 0);
    return {
      id: u.id,
      name: getUserName(u),
      department: getUserDept(u),
      allocated: Math.round(alloc.allocated),
      spent: Math.round(spent),
      available: Math.round(available),
      rate,
      trend: rate > 85 ? 'up' : rate < 50 ? 'down' : 'flat',
      projects: alloc.projects.size,
    };
  });

  // Build department aggregation
  const deptMap: Record<string, { members: MemberUtilization[] }> = {};
  for (const m of members) {
    if (!deptMap[m.department]) deptMap[m.department] = { members: [] };
    deptMap[m.department].members.push(m);
  }
  const departments: DeptUtilization[] = Object.entries(deptMap).map(([dept, data]) => ({
    department: dept,
    memberCount: data.members.length,
    avgRate: data.members.length > 0
      ? Math.round(data.members.reduce((s, m) => s + m.rate, 0) / data.members.length)
      : 0,
    totalAllocated: data.members.reduce((s, m) => s + m.allocated, 0),
    totalSpent: data.members.reduce((s, m) => s + m.spent, 0),
  })).sort((a, b) => b.avgRate - a.avgRate);

  // Build monthly trend from timesheets
  const monthlyMap: Record<string, number> = {};
  for (const ts of timesheets) {
    // ts.date is DD/MM/YYYY
    const parts = (ts.date || '').split('/');
    if (parts.length === 3) {
      const monthKey = `${parts[2]}-${parts[1]}`;
      monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + parseHours(ts.hours);
    }
  }
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyTrend = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([key, hours]) => {
      const [, mm] = key.split('-');
      const monthIdx = parseInt(mm, 10) - 1;
      // Rough capacity: 160h * user count
      const capacity = users.length * 160;
      const rate = capacity > 0 ? Math.round((hours / capacity) * 100) : 0;
      return { month: monthNames[monthIdx] || key, rate, hours: Math.round(hours) };
    });

  // Summary
  const avgRate = members.length > 0 ? Math.round(members.reduce((s, m) => s + m.rate, 0) / members.length) : 0;
  const overloaded = members.filter(m => m.rate > 100).length;
  const optimal = members.filter(m => m.rate >= 70 && m.rate <= 100).length;
  const underutilized = members.filter(m => m.rate < 50).length;

  return { members, departments, monthlyTrend, summary: { avgRate, overloaded, optimal, underutilized, totalMembers: members.length } };
}

// ============================================================================
// Component
// ============================================================================

type ViewMode = 'team' | 'department' | 'trend';

const UtilizationView = React.memo(function UtilizationView() {
  const [rawData, setRawData] = useState<RawData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('team');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'rate' | 'name' | 'spent'>('rate');

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    insightsEngine.fetchForUtilization().then(data => {
      if (!cancelled) { setRawData(data); setIsLoading(false); }
    }).catch(err => {
      if (!cancelled) { setError(err instanceof Error ? err.message : 'Failed to load data'); setIsLoading(false); }
    });
    return () => { cancelled = true; };
  }, []);

  const utilData = useMemo(() => rawData ? computeUtilization(rawData) : null, [rawData]);

  const departments = useMemo(() => {
    if (!utilData) return [];
    return [...new Set(utilData.members.map(m => m.department))].sort();
  }, [utilData]);

  const filteredMembers = useMemo(() => {
    if (!utilData) return [];
    let list = utilData.members;
    if (deptFilter !== 'all') list = list.filter(m => m.department === deptFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(m => m.name.toLowerCase().includes(q) || m.department.toLowerCase().includes(q));
    }
    list = [...list].sort((a, b) => {
      if (sortBy === 'rate') return b.rate - a.rate;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return b.spent - a.spent;
    });
    return list;
  }, [utilData, deptFilter, searchQuery, sortBy]);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleDeptFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setDeptFilter(e.target.value);
  }, []);

  const handleSortChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as 'rate' | 'name' | 'spent');
  }, []);

  // Summary cards data
  const summaryCards = useMemo(() => {
    if (!utilData) return [];
    const s = utilData.summary;
    return [
      { label: 'Avg Utilization', value: `${s.avgRate}%`, icon: Activity, color: '#0066FF', sub: `${s.totalMembers} team members` },
      { label: 'Optimal Range', value: String(s.optimal), icon: TrendingUp, color: '#10B981', sub: '70-100% utilized' },
      { label: 'Overloaded', value: String(s.overloaded), icon: AlertCircle, color: '#DC2626', sub: '>100% allocated' },
      { label: 'Underutilized', value: String(s.underutilized), icon: Clock, color: '#F59E0B', sub: '<50% allocated' },
    ];
  }, [utilData]);

  // View mode tabs data
  const viewModeTabs = useMemo(() => [
    { key: 'team' as ViewMode, label: 'Team Members', icon: Users },
    { key: 'department' as ViewMode, label: 'By Department', icon: BarChart3 },
    { key: 'trend' as ViewMode, label: 'Trends', icon: TrendingUp },
  ], []);

  // Distribution for pie chart
  const distributionData = useMemo(() => {
    if (!utilData) return [];
    return [
      { name: 'Overloaded (>100%)', value: utilData.summary.overloaded, color: UTIL_COLORS.overloaded },
      { name: 'Optimal (70-100%)', value: utilData.summary.optimal, color: UTIL_COLORS.optimal },
      { name: 'Moderate (50-69%)', value: utilData.summary.totalMembers - utilData.summary.overloaded - utilData.summary.optimal - utilData.summary.underutilized, color: UTIL_COLORS.high },
      { name: 'Underutilized (<50%)', value: utilData.summary.underutilized, color: UTIL_COLORS.underutilized },
    ].filter(d => d.value > 0);
  }, [utilData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center" style={{ height: '400px' }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#6B7280' }} />
        <span style={{ marginLeft: '12px', color: '#6B7280', fontSize: '14px' }}>Loading utilization data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ height: '400px' }}>
        <AlertCircle className="w-8 h-8 mb-3" style={{ color: '#DC2626' }} />
        <p style={{ color: '#DC2626', fontSize: '14px' }}>{error}</p>
      </div>
    );
  }

  if (!utilData) return null;

  const { summary } = utilData;

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
            Resource Utilization
          </h2>
          <p style={{ fontSize: '13px', color: '#6B7280' }}>
            Track team capacity, allocation efficiency, and workload distribution
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-gray-50 transition-colors"
            style={{ borderColor: '#E5E7EB', fontSize: '13px', color: '#374151' }}
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4" style={{ marginBottom: '24px' }}>
        {summaryCards.map(card => (
          <div
            key={card.label}
            className="rounded-xl border"
            style={{ borderColor: '#E5E7EB', padding: '20px' }}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {card.label}
              </span>
              <div
                className="flex items-center justify-center rounded-lg"
                style={{ width: '36px', height: '36px', backgroundColor: `${card.color}10` }}
              >
                <card.icon className="w-5 h-5" style={{ color: card.color }} />
              </div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
              {card.value}
            </div>
            <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* View Mode Tabs + Filters */}
      <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
        <div className="flex items-center gap-1 p-1 rounded-lg" style={{ backgroundColor: '#F3F4F6' }}>
          {viewModeTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => handleViewModeChange(tab.key)}
              className="flex items-center gap-2 px-4 py-2 rounded-md transition-colors"
              style={{
                fontSize: '13px',
                fontWeight: viewMode === tab.key ? 600 : 400,
                color: viewMode === tab.key ? '#111827' : '#6B7280',
                backgroundColor: viewMode === tab.key ? 'white' : 'transparent',
                boxShadow: viewMode === tab.key ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              }}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {viewMode === 'team' && (
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search members..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="px-3 py-2 rounded-lg border focus:outline-none focus:ring-2"
              style={{ width: '200px', borderColor: '#E5E7EB', fontSize: '13px' }}
            />
            <select
              value={deptFilter}
              onChange={handleDeptFilterChange}
              className="px-3 py-2 rounded-lg border"
              style={{ borderColor: '#E5E7EB', fontSize: '13px', color: '#374151' }}
            >
              <option value="all">All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select
              value={sortBy}
              onChange={handleSortChange}
              className="px-3 py-2 rounded-lg border"
              style={{ borderColor: '#E5E7EB', fontSize: '13px', color: '#374151' }}
            >
              <option value="rate">Sort by Rate</option>
              <option value="name">Sort by Name</option>
              <option value="spent">Sort by Hours</option>
            </select>
          </div>
        )}
      </div>

      {/* Team Members View */}
      {viewMode === 'team' && (
        <div className="rounded-xl border" style={{ borderColor: '#E5E7EB', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#F9FAFB' }}>
                {['Team Member', 'Department', 'Allocated', 'Spent', 'Available', 'Utilization', 'Status'].map(col => (
                  <th
                    key={col}
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#6B7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      borderBottom: '1px solid #E5E7EB',
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF', fontSize: '14px' }}>
                    No team members match the current filters
                  </td>
                </tr>
              ) : (
                filteredMembers.map(member => (
                  <tr
                    key={member.id}
                    className="hover:bg-gray-50 transition-colors"
                    style={{ borderBottom: '1px solid #F3F4F6' }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div className="flex items-center gap-3">
                        <div
                          className="flex items-center justify-center rounded-full text-white"
                          style={{
                            width: '32px',
                            height: '32px',
                            backgroundColor: '#0066FF',
                            fontSize: '11px',
                            fontWeight: 600,
                          }}
                        >
                          {getInitials(member.name)}
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>
                            {member.name}
                          </div>
                          <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
                            {member.projects} project{member.projects !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6B7280' }}>
                      {member.department}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#111827' }}>
                      {member.allocated}h
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#111827' }}>
                      {member.spent}h
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: member.available > 0 ? '#10B981' : '#DC2626' }}>
                      {member.available}h
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div className="flex items-center gap-2">
                        <div
                          className="rounded-full"
                          style={{
                            width: '80px',
                            height: '6px',
                            backgroundColor: '#F3F4F6',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            className="rounded-full"
                            style={{
                              width: `${Math.min(100, member.rate)}%`,
                              height: '100%',
                              backgroundColor: getUtilColor(member.rate),
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: getUtilColor(member.rate) }}>
                          {member.rate}%
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        className="px-2 py-1 rounded-full"
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          backgroundColor: `${getUtilColor(member.rate)}15`,
                          color: getUtilColor(member.rate),
                        }}
                      >
                        {getUtilLabel(member.rate)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Department View */}
      {viewMode === 'department' && (
        <div className="grid grid-cols-2 gap-6">
          {/* Department Table */}
          <div className="rounded-xl border" style={{ borderColor: '#E5E7EB', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>Department Breakdown</h3>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB' }}>
                  {['Department', 'Members', 'Avg Rate', 'Hours'].map(col => (
                    <th
                      key={col}
                      style={{
                        padding: '10px 16px',
                        textAlign: 'left',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#6B7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        borderBottom: '1px solid #E5E7EB',
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {utilData.departments.map(dept => (
                  <tr key={dept.department} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: '#111827' }}>
                      {dept.department}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6B7280' }}>
                      {dept.memberCount}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: getUtilColor(dept.avgRate) }}>
                        {dept.avgRate}%
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6B7280' }}>
                      {dept.totalSpent.toLocaleString()} / {dept.totalAllocated.toLocaleString()}h
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Distribution Pie */}
          <div className="rounded-xl border" style={{ borderColor: '#E5E7EB', padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '16px' }}>
              Utilization Distribution
            </h3>
            <div style={{ height: '280px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {distributionData.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [`${value} members`, name]}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    formatter={(value: string) => <span style={{ fontSize: '12px', color: '#6B7280' }}>{value}</span>}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Department Bar Chart */}
          <div className="col-span-2 rounded-xl border" style={{ borderColor: '#E5E7EB', padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '16px' }}>
              Department Utilization Rates
            </h3>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={utilData.departments} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis type="number" domain={[0, 120]} tickFormatter={v => `${v}%`} style={{ fontSize: '12px' }} />
                  <YAxis type="category" dataKey="department" width={140} style={{ fontSize: '12px' }} />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, 'Utilization']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px' }}
                  />
                  <Bar dataKey="avgRate" radius={[0, 4, 4, 0]}>
                    {utilData.departments.map((d, i) => (
                      <Cell key={i} fill={getUtilColor(d.avgRate)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Trends View */}
      {viewMode === 'trend' && (
        <div className="space-y-6">
          {/* Monthly Trend Line */}
          <div className="rounded-xl border" style={{ borderColor: '#E5E7EB', padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '16px' }}>
              Utilization Rate Trend
            </h3>
            {utilData.monthlyTrend.length > 0 ? (
              <div style={{ height: '320px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={utilData.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="month" style={{ fontSize: '12px' }} />
                    <YAxis tickFormatter={v => `${v}%`} style={{ fontSize: '12px' }} />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        name === 'rate' ? `${value}%` : `${value}h`,
                        name === 'rate' ? 'Utilization Rate' : 'Hours Logged',
                      ]}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="rate" stroke="#0066FF" strokeWidth={2} name="Utilization Rate" dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ padding: '60px', textAlign: 'center', color: '#9CA3AF', fontSize: '14px' }}>
                No timesheet data available for trend analysis
              </div>
            )}
          </div>

          {/* Hours per Month Bar Chart */}
          <div className="rounded-xl border" style={{ borderColor: '#E5E7EB', padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '16px' }}>
              Monthly Hours Logged
            </h3>
            {utilData.monthlyTrend.length > 0 ? (
              <div style={{ height: '280px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={utilData.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="month" style={{ fontSize: '12px' }} />
                    <YAxis style={{ fontSize: '12px' }} />
                    <Tooltip
                      formatter={(value: number) => [`${value.toLocaleString()}h`, 'Hours']}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px' }}
                    />
                    <Bar dataKey="hours" fill="#0066FF" radius={[4, 4, 0, 0]} name="Hours Logged" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ padding: '60px', textAlign: 'center', color: '#9CA3AF', fontSize: '14px' }}>
                No timesheet data available
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export { UtilizationView };
