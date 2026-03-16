import React, { useState, useMemo } from 'react';
import { Search, AlertTriangle, Zap, Receipt, ShoppingCart, CheckCircle2, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useSpending, SpendingRequest } from '../../contexts/SpendingContext';
import { ExpenseApprovalPanel } from './ExpenseApprovalPanel';
import { PurchaseApprovalPanel } from './PurchaseApprovalPanel';

type TypeFilter = 'all' | 'expense' | 'purchase';

export function PendingApprovalTab() {
  const { requests, currentUser, approveRequest, userNames: employeeNames } = useSpending();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [employeeFilter, setEmployeeFilter] = useState<string[]>([]);
  const [amountFilter, setAmountFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('oldest');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<SpendingRequest | null>(null);
  
  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkModal, setShowBulkModal] = useState(false);
  
  // Collapsible groups
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['overdue', 'urgent', 'thisWeek']));
  const [expandedGroupItems, setExpandedGroupItems] = useState<Record<string, number>>({
    overdue: 2,
    urgent: 2,
    thisWeek: 10,
    older: 10,
  });

  // Get pending approval requests
  const pendingRequests = useMemo(() => {
    return requests.filter(
      req => req.status === 'Pending' && currentUser.directReports.includes(req.userId)
    );
  }, [requests, currentUser]);

  // Apply filters
  const filteredRequests = useMemo(() => {
    let filtered = pendingRequests;

    // Type filter
    if (typeFilter === 'expense') {
      filtered = filtered.filter(req => req.type === 'Expense');
    } else if (typeFilter === 'purchase') {
      filtered = filtered.filter(req => req.type === 'Purchase');
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

    // Sort
    return filtered.sort((a, b) => {
      if (sortBy === 'oldest') {
        const aDate = new Date(a.submittedDate || a.createdAt).getTime();
        const bDate = new Date(b.submittedDate || b.createdAt).getTime();
        return aDate - bDate;
      } else if (sortBy === 'newest') {
        const aDate = new Date(a.submittedDate || a.createdAt).getTime();
        const bDate = new Date(b.submittedDate || b.createdAt).getTime();
        return bDate - aDate;
      } else if (sortBy === 'amount-high') {
        return b.total - a.total;
      } else if (sortBy === 'amount-low') {
        return a.total - b.total;
      }
      return 0;
    });
  }, [pendingRequests, typeFilter, employeeFilter, amountFilter, searchQuery, sortBy]);

  // Group by priority
  const groupedRequests = useMemo(() => {
    const overdue: typeof filteredRequests = [];
    const urgent: typeof filteredRequests = [];
    const thisWeek: typeof filteredRequests = [];
    const older: typeof filteredRequests = [];

    filteredRequests.forEach(req => {
      const age = getAge(req);
      if (age > 5) {
        overdue.push(req);
      } else if (req.isAsap) {
        urgent.push(req);
      } else if (age <= 7) {
        thisWeek.push(req);
      } else {
        older.push(req);
      }
    });

    return { overdue, urgent, thisWeek, older };
  }, [filteredRequests]);

  // Get unique employees with pending count
  const employeeOptions = useMemo(() => {
    const employeeMap = new Map<string, number>();
    pendingRequests.forEach(req => {
      employeeMap.set(req.userId, (employeeMap.get(req.userId) || 0) + 1);
    });
    return Array.from(employeeMap.entries()).map(([userId, count]) => ({
      id: userId,
      name: employeeNames[userId] || 'Unknown',
      count,
    }));
  }, [pendingRequests]);

  // Counts
  const counts = {
    all: pendingRequests.length,
    expense: pendingRequests.filter(r => r.type === 'Expense').length,
    purchase: pendingRequests.filter(r => r.type === 'Purchase').length,
  };

  // Get age in days
  function getAge(request: SpendingRequest): number {
    if (!request.submittedDate) return 0;
    const submitted = new Date(request.submittedDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - submitted.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Bulk selection handlers
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredRequests.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRequests.map(r => r.id)));
    }
  };

  const handleBulkApprove = (comment?: string) => {
    selectedIds.forEach(id => {
      approveRequest(id, comment);
    });
    setSelectedIds(new Set());
    setShowBulkModal(false);
  };

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  };

  const loadMore = (group: string) => {
    setExpandedGroupItems(prev => ({
      ...prev,
      [group]: prev[group] + 20,
    }));
  };

  const selectedRequests = filteredRequests.filter(r => selectedIds.has(r.id));
  const selectedTotal = selectedRequests.reduce((sum, r) => sum + r.total, 0);

  if (pendingRequests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ padding: '80px 0' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>
          <CheckCircle2 className="w-16 h-16" style={{ color: '#10B981' }} />
        </div>
        <div style={{ fontSize: '16px', fontWeight: 600, color: '#6B7280', marginBottom: '8px' }}>
          All caught up!
        </div>
        <div style={{ fontSize: '14px', color: '#9CA3AF' }}>
          No pending requests to approve
        </div>
      </div>
    );
  }

  return (
    <div>
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
        <div className="flex items-center gap-3">
          {/* Employee Filter */}
          <select
            value={employeeFilter.length > 0 ? employeeFilter[0] : 'all'}
            onChange={(e) => {
              if (e.target.value === 'all') {
                setEmployeeFilter([]);
              } else {
                setEmployeeFilter([e.target.value]);
              }
            }}
            className="px-3 py-2 border rounded-lg"
            style={{
              fontSize: '13px',
              borderColor: '#E5E7EB',
              color: '#374151',
            }}
          >
            <option value="all">All Employees</option>
            {employeeOptions.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.count})
              </option>
            ))}
          </select>

          {/* Amount Filter */}
          <select
            value={amountFilter}
            onChange={(e) => setAmountFilter(e.target.value)}
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

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border rounded-lg"
            style={{
              fontSize: '13px',
              borderColor: '#E5E7EB',
              color: '#374151',
            }}
          >
            <option value="oldest">Oldest First</option>
            <option value="newest">Newest First</option>
            <option value="amount-high">Amount: High to Low</option>
            <option value="amount-low">Amount: Low to High</option>
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
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search employee, description..."
              className="w-full pl-10 pr-3 py-2 border rounded-lg"
              style={{
                fontSize: '13px',
                borderColor: '#E5E7EB',
              }}
            />
          </div>
        </div>
      </div>

      {/* Select All */}
      {filteredRequests.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            checked={selectedIds.size === filteredRequests.length && filteredRequests.length > 0}
            onChange={toggleSelectAll}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            style={{ cursor: 'pointer' }}
          />
          <span style={{ fontSize: '13px', color: '#6B7280' }}>
            Select all for bulk action
          </span>
        </div>
      )}

      {/* Grouped List */}
      {filteredRequests.length === 0 ? (
        <div className="text-center" style={{ padding: '40px 0' }}>
          <div style={{ fontSize: '14px', color: '#6B7280' }}>
            No requests match your filters
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* OVERDUE Group */}
          {groupedRequests.overdue.length > 0 && (
            <div>
              <button
                onClick={() => toggleGroup('overdue')}
                className="flex items-center justify-between w-full mb-3"
                style={{ cursor: 'pointer' }}
              >
                <div className="flex items-center gap-2">
                  {expandedGroups.has('overdue') ? (
                    <ChevronDown className="w-4 h-4" style={{ color: '#DC2626' }} />
                  ) : (
                    <ChevronUp className="w-4 h-4" style={{ color: '#DC2626' }} />
                  )}
                  <AlertTriangle className="w-4 h-4" style={{ color: '#DC2626' }} />
                  <div 
                    style={{ 
                      fontSize: '12px', 
                      fontWeight: 600, 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.5px',
                      color: '#DC2626',
                    }}
                  >
                    ⚠️ OVERDUE - 5+ DAYS ({groupedRequests.overdue.length})
                  </div>
                  <div 
                    className="px-2 py-1 rounded"
                    style={{ 
                      backgroundColor: '#FEE2E2', 
                      fontSize: '11px', 
                      fontWeight: 600, 
                      color: '#DC2626' 
                    }}
                  >
                    Needs attention
                  </div>
                </div>
                <div className="flex-1 h-px ml-3" style={{ backgroundColor: '#FECACA' }} />
              </button>
              {expandedGroups.has('overdue') && (
                <div className="space-y-3">
                  {groupedRequests.overdue.slice(0, expandedGroupItems.overdue).map(request => (
                    <ApprovalCard
                      key={request.id}
                      request={request}
                      employeeName={employeeNames[request.userId]}
                      age={getAge(request)}
                      selected={selectedIds.has(request.id)}
                      onToggleSelect={() => toggleSelect(request.id)}
                      onClick={() => setSelectedRequest(request)}
                    />
                  ))}
                  {groupedRequests.overdue.length > expandedGroupItems.overdue && (
                    <button
                      onClick={() => loadMore('overdue')}
                      className="w-full py-2 text-center rounded-lg border transition-colors hover:bg-gray-50"
                      style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        color: '#2563EB',
                        borderColor: '#E5E7EB',
                      }}
                    >
                      + {groupedRequests.overdue.length - expandedGroupItems.overdue} more overdue
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* URGENT Group */}
          {groupedRequests.urgent.length > 0 && (
            <div>
              <button
                onClick={() => toggleGroup('urgent')}
                className="flex items-center justify-between w-full mb-3"
                style={{ cursor: 'pointer' }}
              >
                <div className="flex items-center gap-2">
                  {expandedGroups.has('urgent') ? (
                    <ChevronDown className="w-4 h-4" style={{ color: '#F59E0B' }} />
                  ) : (
                    <ChevronUp className="w-4 h-4" style={{ color: '#F59E0B' }} />
                  )}
                  <Zap className="w-4 h-4" style={{ color: '#F59E0B' }} />
                  <div 
                    style={{ 
                      fontSize: '12px', 
                      fontWeight: 600, 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.5px',
                      color: '#B45309',
                    }}
                  >
                    ⚡ URGENT - ASAP ({groupedRequests.urgent.length})
                  </div>
                </div>
                <div className="flex-1 h-px ml-3" style={{ backgroundColor: '#FDE68A' }} />
              </button>
              {expandedGroups.has('urgent') && (
                <div className="space-y-3">
                  {groupedRequests.urgent.slice(0, expandedGroupItems.urgent).map(request => (
                    <ApprovalCard
                      key={request.id}
                      request={request}
                      employeeName={employeeNames[request.userId]}
                      age={getAge(request)}
                      selected={selectedIds.has(request.id)}
                      onToggleSelect={() => toggleSelect(request.id)}
                      onClick={() => setSelectedRequest(request)}
                    />
                  ))}
                  {groupedRequests.urgent.length > expandedGroupItems.urgent && (
                    <button
                      onClick={() => loadMore('urgent')}
                      className="w-full py-2 text-center rounded-lg border transition-colors hover:bg-gray-50"
                      style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        color: '#2563EB',
                        borderColor: '#E5E7EB',
                      }}
                    >
                      + {groupedRequests.urgent.length - expandedGroupItems.urgent} more urgent
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* THIS WEEK Group */}
          {groupedRequests.thisWeek.length > 0 && (
            <div>
              <button
                onClick={() => toggleGroup('thisWeek')}
                className="flex items-center justify-between w-full mb-3"
                style={{ cursor: 'pointer' }}
              >
                <div className="flex items-center gap-2">
                  {expandedGroups.has('thisWeek') ? (
                    <ChevronDown className="w-4 h-4" style={{ color: '#2563EB' }} />
                  ) : (
                    <ChevronUp className="w-4 h-4" style={{ color: '#2563EB' }} />
                  )}
                  <div 
                    style={{ 
                      fontSize: '12px', 
                      fontWeight: 600, 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.5px',
                      color: '#2563EB',
                    }}
                  >
                    📥 THIS WEEK ({groupedRequests.thisWeek.length})
                  </div>
                </div>
                <div className="flex-1 h-px ml-3" style={{ backgroundColor: '#E5E7EB' }} />
              </button>
              {expandedGroups.has('thisWeek') && (
                <div className="space-y-3">
                  {groupedRequests.thisWeek.slice(0, expandedGroupItems.thisWeek).map(request => (
                    <ApprovalCard
                      key={request.id}
                      request={request}
                      employeeName={employeeNames[request.userId]}
                      age={getAge(request)}
                      selected={selectedIds.has(request.id)}
                      onToggleSelect={() => toggleSelect(request.id)}
                      onClick={() => setSelectedRequest(request)}
                    />
                  ))}
                  {groupedRequests.thisWeek.length > expandedGroupItems.thisWeek && (
                    <button
                      onClick={() => loadMore('thisWeek')}
                      className="w-full py-2 text-center rounded-lg border transition-colors hover:bg-gray-50"
                      style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        color: '#2563EB',
                        borderColor: '#E5E7EB',
                      }}
                    >
                      Load More ({groupedRequests.thisWeek.length - expandedGroupItems.thisWeek} remaining)
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* OLDER Group */}
          {groupedRequests.older.length > 0 && (
            <div>
              <button
                onClick={() => toggleGroup('older')}
                className="flex items-center justify-between w-full mb-3"
                style={{ cursor: 'pointer' }}
              >
                <div className="flex items-center gap-2">
                  {expandedGroups.has('older') ? (
                    <ChevronDown className="w-4 h-4" style={{ color: '#6B7280' }} />
                  ) : (
                    <ChevronUp className="w-4 h-4" style={{ color: '#6B7280' }} />
                  )}
                  <div 
                    style={{ 
                      fontSize: '12px', 
                      fontWeight: 600, 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.5px',
                      color: '#6B7280',
                    }}
                  >
                    OLDER ({groupedRequests.older.length})
                  </div>
                </div>
                <div style={{ fontSize: '13px', color: '#9CA3AF' }}>
                  {groupedRequests.older.length} requests from earlier
                </div>
                <div className="flex-1 h-px ml-3" style={{ backgroundColor: '#E5E7EB' }} />
              </button>
              {expandedGroups.has('older') && (
                <div className="space-y-3">
                  {groupedRequests.older.slice(0, expandedGroupItems.older).map(request => (
                    <ApprovalCard
                      key={request.id}
                      request={request}
                      employeeName={employeeNames[request.userId]}
                      age={getAge(request)}
                      selected={selectedIds.has(request.id)}
                      onToggleSelect={() => toggleSelect(request.id)}
                      onClick={() => setSelectedRequest(request)}
                    />
                  ))}
                  {groupedRequests.older.length > expandedGroupItems.older && (
                    <button
                      onClick={() => loadMore('older')}
                      className="w-full py-2 text-center rounded-lg border transition-colors hover:bg-gray-50"
                      style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        color: '#2563EB',
                        borderColor: '#E5E7EB',
                      }}
                    >
                      Load More ({groupedRequests.older.length - expandedGroupItems.older} remaining)
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div
          className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg"
          style={{
            borderColor: '#E5E7EB',
            zIndex: 30,
            padding: '16px 24px',
          }}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                {selectedIds.size} selected
              </div>
              <div style={{ fontSize: '13px', color: '#6B7280' }}>
                Total: €{selectedTotal.toFixed(2)}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedIds(new Set())}
                className="px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#6B7280',
                }}
              >
                Clear Selection
              </button>
              <button
                onClick={() => setShowBulkModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
                style={{
                  backgroundColor: '#059669',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve All ({selectedIds.size})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Approval Modal */}
      {showBulkModal && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 50 }}
        >
          <div
            className="bg-white rounded-xl shadow-xl"
            style={{ width: '600px', maxHeight: '80vh', overflow: 'hidden' }}
          >
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: '#E5E7EB' }}>
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#111827' }}>
                Approve {selectedIds.size} Requests?
              </div>
              <button
                onClick={() => setShowBulkModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" style={{ color: '#6B7280' }} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 180px)' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '12px' }}>
                You're approving:
              </div>
              
              <div className="space-y-2 mb-6">
                {selectedRequests.map(req => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg"
                    style={{ backgroundColor: '#F9FAFB' }}
                  >
                    <div className="flex items-center gap-2">
                      {req.type === 'Expense' ? (
                        <Receipt className="w-4 h-4" style={{ color: '#F59E0B' }} />
                      ) : (
                        <ShoppingCart className="w-4 h-4" style={{ color: '#3B82F6' }} />
                      )}
                      <span style={{ fontSize: '13px', color: '#374151' }}>
                        {req.referenceNumber} · {employeeNames[req.userId]}
                      </span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>
                      €{req.total.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 mb-6" style={{ borderColor: '#E5E7EB' }}>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                    Total:
                  </span>
                  <span style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>
                    €{selectedTotal.toFixed(2)} ({selectedIds.size} requests)
                  </span>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '8px' }}>
                  Add comment (applies to all):
                </label>
                <textarea
                  placeholder="Batch approved - November expenses"
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  style={{
                    fontSize: '13px',
                    borderColor: '#E5E7EB',
                  }}
                />
                <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>
                  Optional
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t" style={{ borderColor: '#E5E7EB' }}>
              <button
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 rounded-lg border hover:bg-gray-50 transition-colors"
                style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  borderColor: '#E5E7EB',
                  color: '#6B7280',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleBulkApprove()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
                style={{
                  backgroundColor: '#059669',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve All ({selectedIds.size})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approval Panel */}
      {selectedRequest && (
        selectedRequest.type === 'Expense' ? (
          <ExpenseApprovalPanel
            request={selectedRequest}
            employeeName={employeeNames[selectedRequest.userId]}
            onClose={() => setSelectedRequest(null)}
          />
        ) : (
          <PurchaseApprovalPanel
            request={selectedRequest}
            employeeName={employeeNames[selectedRequest.userId]}
            onClose={() => setSelectedRequest(null)}
          />
        )
      )}
    </div>
  );
}

// Approval Card Component
interface ApprovalCardProps {
  request: SpendingRequest;
  employeeName: string;
  age: number;
  selected: boolean;
  onToggleSelect: () => void;
  onClick: () => void;
}

function ApprovalCard({ request, employeeName, age, selected, onToggleSelect, onClick }: ApprovalCardProps) {
  const typeColor = request.type === 'Expense' ? '#F59E0B' : '#3B82F6';
  const TypeIcon = request.type === 'Expense' ? Receipt : ShoppingCart;

  const formatTotal = () => {
    const symbol = request.currencies[0] === 'USD' ? '$' : '€';
    return `${symbol}${request.total.toFixed(2)}`;
  };

  const receiptCount = request.type === 'Expense'
    ? request.lineItems.filter(item => item.receiptUrl).length
    : 0;

  const suppliers = request.type === 'Purchase'
    ? [...new Set(request.lineItems.map(item => item.supplier).filter(Boolean))]
    : [];

  return (
    <div
      className="bg-white rounded-xl transition-all"
      style={{
        borderTop: selected ? '1px solid #2563EB' : '1px solid #E5E7EB',
        borderRight: selected ? '1px solid #2563EB' : '1px solid #E5E7EB',
        borderBottom: selected ? '1px solid #2563EB' : '1px solid #E5E7EB',
        borderLeft: `4px solid ${typeColor}`,
        backgroundColor: selected ? '#EFF6FF' : 'white',
        padding: '16px 20px',
        marginBottom: '12px',
      }}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          style={{ cursor: 'pointer' }}
          onClick={(e) => e.stopPropagation()}
        />

        {/* Content */}
        <div className="flex-1">
          {/* Row 1: Employee & Age */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TypeIcon className="w-4 h-4" style={{ color: typeColor }} />
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                {employeeName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {age > 5 && <AlertTriangle className="w-4 h-4" style={{ color: '#F59E0B' }} />}
              {request.isAsap && (
                <div
                  className="flex items-center gap-1 px-2 py-1 rounded"
                  style={{
                    backgroundColor: '#FEF3C7',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#B45309',
                  }}
                >
                  <Zap className="w-3 h-3" />
                  ASAP
                </div>
              )}
              <span style={{ fontSize: '13px', color: age > 5 ? '#F59E0B' : '#9CA3AF' }}>
                {age}d ago
              </span>
            </div>
          </div>

          {/* Row 2: Description */}
          <div style={{ fontSize: '14px', color: '#374151', marginBottom: '8px' }}>
            {request.referenceNumber} · {request.purpose}
          </div>

          {/* Row 3: Details */}
          <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '12px' }}>
            {request.lineItems.length} {request.lineItems.length === 1 ? 'item' : 'items'} ·{' '}
            <span style={{ fontWeight: 600, color: '#111827' }}>{formatTotal()}</span>
            {request.type === 'Expense' && receiptCount > 0 && ` · 📎 ${receiptCount} receipts`}
            {request.type === 'Purchase' && suppliers.length > 0 && ` · ${suppliers.join(', ')}`}
          </div>

          {/* Row 4: Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onClick}
              className="px-3 py-2 border rounded-lg transition-colors hover:bg-gray-50"
              style={{
                fontSize: '13px',
                fontWeight: 500,
                borderColor: '#E5E7EB',
                color: '#6B7280',
              }}
            >
              View Details
            </button>
            <div className="flex-1" />
            <button
              className="px-3 py-2 border rounded-lg transition-colors hover:bg-red-50"
              style={{
                fontSize: '13px',
                fontWeight: 500,
                borderColor: '#DC2626',
                color: '#DC2626',
              }}
            >
              Deny
            </button>
            <button
              className="flex items-center gap-1 px-4 py-2 rounded-lg transition-colors hover:opacity-90"
              style={{
                fontSize: '13px',
                fontWeight: 600,
                backgroundColor: '#059669',
                color: 'white',
              }}
            >
              <CheckCircle2 className="w-4 h-4" />
              Approve
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
