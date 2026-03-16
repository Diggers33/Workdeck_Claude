import React, { useState, useMemo } from 'react';
import { Search, User, TrendingUp, Receipt, ShoppingCart, BarChart3, Eye, ChevronDown } from 'lucide-react';
import { useSpending, SpendingStatus } from '../../contexts/SpendingContext';
import { SpendingCard } from './SpendingCard';

type TypeFilter = 'all' | 'expense' | 'purchase';
type StatusGroup = 'all' | 'active' | 'completed' | 'denied';
type ViewMode = 'cards' | 'list';

interface TeamTabProps {
  onCardClick?: (request: any) => void;
}

export function TeamTab({ onCardClick }: TeamTabProps) {
  const { requests, currentUser, userNames: employeeNames } = useSpending();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusGroup, setStatusGroup] = useState<StatusGroup>('active'); // Default to active
  const [yearFilter, setYearFilter] = useState<string>(new Date().getFullYear().toString()); // Default to current year
  const [employeeFilter, setEmployeeFilter] = useState<string[]>([]);
  const [amountFilter, setAmountFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [showStats, setShowStats] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Get team requests (excluding own)
  const teamRequests = useMemo(() => {
    return requests.filter(req => req.userId !== currentUser.id);
  }, [requests, currentUser.id]);

  // Get available years
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    teamRequests.forEach(req => {
      const year = new Date(req.createdAt).getFullYear().toString();
      years.add(year);
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [teamRequests]);

  // Get unique employees
  const employeeOptions = useMemo(() => {
    const employeeMap = new Map<string, number>();
    teamRequests.forEach(req => {
      employeeMap.set(req.userId, (employeeMap.get(req.userId) || 0) + 1);
    });
    return Array.from(employeeMap.entries()).map(([userId, count]) => ({
      id: userId,
      name: employeeNames[userId] || 'Unknown',
      count,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [teamRequests]);

  // Apply filters
  const filteredRequests = useMemo(() => {
    let filtered = teamRequests;

    // Year filter
    filtered = filtered.filter(req => {
      const year = new Date(req.createdAt).getFullYear().toString();
      return year === yearFilter;
    });

    // Type filter
    if (typeFilter === 'expense') {
      filtered = filtered.filter(req => req.type === 'Expense');
    } else if (typeFilter === 'purchase') {
      filtered = filtered.filter(req => req.type === 'Purchase');
    }

    // Status group filter
    if (statusGroup === 'active') {
      filtered = filtered.filter(req => 
        ['Draft', 'Pending', 'Approved', 'Processing', 'Ordered'].includes(req.status)
      );
    } else if (statusGroup === 'completed') {
      filtered = filtered.filter(req => 
        ['Finalized', 'Received'].includes(req.status)
      );
    } else if (statusGroup === 'denied') {
      filtered = filtered.filter(req => req.status === 'Denied');
    }

    // Employee filter
    if (employeeFilter.length > 0) {
      filtered = filtered.filter(req => employeeFilter.includes(req.userId));
    }

    // Amount filter
    if (amountFilter !== 'all') {
      filtered = filtered.filter(req => {
        const total = req.total;
        if (amountFilter === 'under100') return total < 100;
        if (amountFilter === '100-500') return total >= 100 && total <= 500;
        if (amountFilter === '500-1000') return total > 500 && total <= 1000;
        if (amountFilter === 'over1000') return total > 1000;
        return true;
      });
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(req => {
        const employeeName = employeeNames[req.userId]?.toLowerCase() || '';
        return (
          employeeName.includes(query) ||
          req.purpose.toLowerCase().includes(query) ||
          req.referenceNumber.toLowerCase().includes(query)
        );
      });
    }

    // Sort by most recent
    return filtered.sort((a, b) => {
      const aDate = new Date(a.updatedAt).getTime();
      const bDate = new Date(b.updatedAt).getTime();
      return bDate - aDate;
    });
  }, [teamRequests, typeFilter, statusGroup, yearFilter, employeeFilter, amountFilter, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Summary stats
  const stats = useMemo(() => {
    const yearRequests = teamRequests.filter(req => {
      const year = new Date(req.createdAt).getFullYear().toString();
      return year === yearFilter;
    });

    const expenseRequests = yearRequests.filter(r => r.type === 'Expense');
    const purchaseRequests = yearRequests.filter(r => r.type === 'Purchase');

    return {
      totalRequests: yearRequests.length,
      totalSpent: yearRequests.reduce((sum, r) => sum + r.total, 0),
      expenseTotal: expenseRequests.reduce((sum, r) => sum + r.total, 0),
      expenseCount: expenseRequests.length,
      purchaseTotal: purchaseRequests.reduce((sum, r) => sum + r.total, 0),
      purchaseCount: purchaseRequests.length,
    };
  }, [teamRequests, yearFilter]);

  // Counts for type filters
  const counts = {
    all: filteredRequests.length,
    expense: filteredRequests.filter(r => r.type === 'Expense').length,
    purchase: filteredRequests.filter(r => r.type === 'Purchase').length,
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div>
      {/* Summary Stats */}
      {showStats && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
              Summary - {yearFilter}
            </div>
            <button
              onClick={() => setShowStats(false)}
              className="text-sm hover:underline"
              style={{ color: '#6B7280' }}
            >
              Hide Stats
            </button>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {/* Total Requests */}
            <div
              className="bg-white border rounded-xl p-4"
              style={{ borderColor: '#E5E7EB' }}
            >
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
                {stats.totalRequests}
              </div>
              <div style={{ fontSize: '13px', color: '#6B7280' }}>
                Requests
              </div>
            </div>

            {/* Total Spent */}
            <div
              className="bg-white border rounded-xl p-4"
              style={{ borderColor: '#E5E7EB' }}
            >
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
                {formatCurrency(stats.totalSpent)}
              </div>
              <div style={{ fontSize: '13px', color: '#6B7280' }}>
                Total Spent
              </div>
            </div>

            {/* Expenses */}
            <button
              onClick={() => setTypeFilter('expense')}
              className="bg-white border rounded-xl p-4 text-left hover:border-orange-300 transition-colors"
              style={{ borderColor: typeFilter === 'expense' ? '#FED7AA' : '#E5E7EB' }}
            >
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
                {formatCurrency(stats.expenseTotal)}
              </div>
              <div style={{ fontSize: '13px', color: '#6B7280' }}>
                Expenses ({stats.expenseCount})
              </div>
            </button>

            {/* Purchases */}
            <button
              onClick={() => setTypeFilter('purchase')}
              className="bg-white border rounded-xl p-4 text-left hover:border-blue-300 transition-colors"
              style={{ borderColor: typeFilter === 'purchase' ? '#BFDBFE' : '#E5E7EB' }}
            >
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
                {formatCurrency(stats.purchaseTotal)}
              </div>
              <div style={{ fontSize: '13px', color: '#6B7280' }}>
                Purchases ({stats.purchaseCount})
              </div>
            </button>
          </div>
        </div>
      )}

      {!showStats && (
        <button
          onClick={() => setShowStats(true)}
          className="mb-6 text-sm hover:underline"
          style={{ color: '#2563EB' }}
        >
          Show Stats
        </button>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border mb-6" style={{ borderColor: '#E5E7EB', padding: '20px' }}>
        {/* Type Filters */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setTypeFilter('all')}
            className="px-3 py-2 rounded-md border transition-all"
            style={{
              backgroundColor: typeFilter === 'all' ? '#EFF6FF' : 'white',
              borderColor: typeFilter === 'all' ? '#2563EB' : '#E5E7EB',
              color: typeFilter === 'all' ? '#2563EB' : '#6B7280',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            All ({counts.all})
          </button>
          <button
            onClick={() => setTypeFilter('expense')}
            className="px-3 py-2 rounded-md border transition-all"
            style={{
              backgroundColor: typeFilter === 'expense' ? '#EFF6FF' : 'white',
              borderColor: typeFilter === 'expense' ? '#2563EB' : '#E5E7EB',
              color: typeFilter === 'expense' ? '#2563EB' : '#6B7280',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            Expenses ({counts.expense})
          </button>
          <button
            onClick={() => setTypeFilter('purchase')}
            className="px-3 py-2 rounded-md border transition-all"
            style={{
              backgroundColor: typeFilter === 'purchase' ? '#EFF6FF' : 'white',
              borderColor: typeFilter === 'purchase' ? '#2563EB' : '#E5E7EB',
              color: typeFilter === 'purchase' ? '#2563EB' : '#6B7280',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            Purchases ({counts.purchase})
          </button>
        </div>

        {/* Filter Row */}
        <div className="flex items-center gap-3 mb-3">
          {/* Employee Filter */}
          <select
            value={employeeFilter.length > 0 ? employeeFilter[0] : 'all'}
            onChange={(e) => {
              if (e.target.value === 'all') {
                setEmployeeFilter([]);
              } else {
                setEmployeeFilter([e.target.value]);
              }
              setCurrentPage(1);
            }}
            className="px-3 py-2 border rounded-lg"
            style={{
              fontSize: '13px',
              borderColor: '#E5E7EB',
              color: '#374151',
            }}
          >
            <option value="all">All Team Members</option>
            {employeeOptions.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.count})
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusGroup}
            onChange={(e) => {
              setStatusGroup(e.target.value as StatusGroup);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border rounded-lg"
            style={{
              fontSize: '13px',
              borderColor: '#E5E7EB',
              color: '#374151',
            }}
          >
            <option value="all">Status: All</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="denied">Denied</option>
          </select>

          {/* Year Filter */}
          <select
            value={yearFilter}
            onChange={(e) => {
              setYearFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border rounded-lg"
            style={{
              fontSize: '13px',
              borderColor: '#E5E7EB',
              color: '#374151',
            }}
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          {/* Amount Filter */}
          <select
            value={amountFilter}
            onChange={(e) => {
              setAmountFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border rounded-lg"
            style={{
              fontSize: '13px',
              borderColor: '#E5E7EB',
              color: '#374151',
            }}
          >
            <option value="all">All Amounts</option>
            <option value="under100">Under €100</option>
            <option value="100-500">€100 - €500</option>
            <option value="500-1000">€500 - €1,000</option>
            <option value="over1000">Over €1,000</option>
          </select>

          {/* Search */}
          <div className="relative flex-1" style={{ maxWidth: '320px' }}>
            <Search 
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" 
              style={{ color: '#9CA3AF' }} 
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search employee, description..."
              className="w-full pl-10 pr-3 py-2 border rounded-lg"
              style={{
                fontSize: '13px',
                borderColor: '#E5E7EB',
              }}
            />
          </div>
        </div>

        {/* View Mode Toggle & Results Count */}
        <div className="flex items-center justify-between">
          <div style={{ fontSize: '13px', color: '#6B7280' }}>
            Showing {filteredRequests.length} {filteredRequests.length === 1 ? 'request' : 'requests'}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setViewMode('list')}
              className="px-3 py-1.5 border transition-all"
              style={{
                backgroundColor: viewMode === 'list' ? '#EFF6FF' : 'white',
                borderColor: viewMode === 'list' ? '#2563EB' : '#E5E7EB',
                color: viewMode === 'list' ? '#2563EB' : '#6B7280',
                fontSize: '13px',
                borderRadius: '6px 0 0 6px',
              }}
            >
              ≡ List
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className="px-3 py-1.5 border transition-all"
              style={{
                backgroundColor: viewMode === 'cards' ? '#EFF6FF' : 'white',
                borderColor: viewMode === 'cards' ? '#2563EB' : '#E5E7EB',
                color: viewMode === 'cards' ? '#2563EB' : '#6B7280',
                fontSize: '13px',
                borderRadius: '0 6px 6px 0',
                marginLeft: '-1px',
              }}
            >
              ▦ Cards
            </button>
          </div>
        </div>
      </div>

      {/* List/Cards View */}
      {filteredRequests.length === 0 ? (
        <div className="text-center" style={{ padding: '40px 0' }}>
          <div style={{ fontSize: '14px', color: '#6B7280' }}>
            No team requests found
          </div>
        </div>
      ) : (
        <div>
          {viewMode === 'cards' ? (
            <div className="space-y-3">
              {paginatedRequests.map(request => (
                <SpendingCard
                  key={request.id}
                  request={request}
                  showEmployee
                  employeeName={employeeNames[request.userId]}
                  onCardClick={onCardClick}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white border rounded-xl overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
              {/* Table Header */}
              <div
                className="grid grid-cols-12 gap-4 px-4 py-3 border-b"
                style={{
                  backgroundColor: '#F9FAFB',
                  borderColor: '#E5E7EB',
                  fontSize: '12px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: '#6B7280',
                }}
              >
                <div className="col-span-2">Employee</div>
                <div className="col-span-2">Reference</div>
                <div className="col-span-4">Description</div>
                <div className="col-span-2 text-right">Amount</div>
                <div className="col-span-2">Status</div>
              </div>

              {/* Table Rows */}
              {paginatedRequests.map(request => (
                <button
                  key={request.id}
                  onClick={() => onCardClick?.(request)}
                  className="grid grid-cols-12 gap-4 px-4 py-3 border-b hover:bg-gray-50 transition-colors w-full text-left"
                  style={{
                    borderColor: '#E5E7EB',
                    fontSize: '14px',
                  }}
                >
                  <div className="col-span-2 flex items-center gap-2">
                    <User className="w-4 h-4" style={{ color: '#9CA3AF' }} />
                    <span style={{ color: '#374151' }}>{employeeNames[request.userId]}</span>
                  </div>
                  <div className="col-span-2 flex items-center gap-1">
                    {request.type === 'Expense' ? (
                      <Receipt className="w-4 h-4" style={{ color: '#F59E0B' }} />
                    ) : (
                      <ShoppingCart className="w-4 h-4" style={{ color: '#3B82F6' }} />
                    )}
                    <span style={{ color: '#374151' }}>{request.referenceNumber}</span>
                  </div>
                  <div className="col-span-4" style={{ color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {request.purpose}
                  </div>
                  <div className="col-span-2 text-right" style={{ fontWeight: 600, color: '#111827' }}>
                    €{request.total.toFixed(2)}
                  </div>
                  <div className="col-span-2">
                    <span
                      className="px-2 py-1 rounded-md"
                      style={{
                        fontSize: '12px',
                        fontWeight: 500,
                        backgroundColor: getStatusBgColor(request.status),
                        color: getStatusTextColor(request.status),
                      }}
                    >
                      {request.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div style={{ fontSize: '13px', color: '#6B7280' }}>
                Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredRequests.length)} of {filteredRequests.length}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 border rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    fontSize: '13px',
                    borderColor: '#E5E7EB',
                    color: '#6B7280',
                  }}
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className="px-3 py-1.5 border rounded-lg hover:bg-gray-50 transition-colors"
                      style={{
                        fontSize: '13px',
                        borderColor: currentPage === pageNum ? '#2563EB' : '#E5E7EB',
                        backgroundColor: currentPage === pageNum ? '#EFF6FF' : 'white',
                        color: currentPage === pageNum ? '#2563EB' : '#6B7280',
                        fontWeight: currentPage === pageNum ? 600 : 400,
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <span style={{ color: '#9CA3AF' }}>...</span>
                )}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 border rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    fontSize: '13px',
                    borderColor: '#E5E7EB',
                    color: '#6B7280',
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getStatusBgColor(status: SpendingStatus): string {
  const colors: Record<SpendingStatus, string> = {
    Draft: '#F3F4F6',
    Pending: '#FEF3C7',
    Approved: '#D1FAE5',
    Denied: '#FEE2E2',
    Processing: '#DBEAFE',
    Ordered: '#E0E7FF',
    Finalized: '#D1FAE5',
    Received: '#D1FAE5',
  };
  return colors[status] || '#F3F4F6';
}

function getStatusTextColor(status: SpendingStatus): string {
  const colors: Record<SpendingStatus, string> = {
    Draft: '#6B7280',
    Pending: '#B45309',
    Approved: '#059669',
    Denied: '#DC2626',
    Processing: '#1D4ED8',
    Ordered: '#4F46E5',
    Finalized: '#059669',
    Received: '#059669',
  };
  return colors[status] || '#6B7280';
}
