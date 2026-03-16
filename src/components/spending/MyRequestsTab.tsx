import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronRight, Receipt } from 'lucide-react';
import { useSpending, SpendingType, SpendingStatus } from '../../contexts/SpendingContext';
import { SpendingCard } from './SpendingCard';

interface MyRequestsTabProps {
  onCardClick?: (request: any) => void;
}

type TypeFilter = 'all' | 'expense' | 'purchase';
type StatusFilter = 'all' | 'active' | 'completed' | 'denied' | SpendingStatus;
type YearFilter = 'all' | string;

export function MyRequestsTab({ onCardClick }: MyRequestsTabProps) {
  const { requests, currentUser } = useSpending();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [yearFilter, setYearFilter] = useState<YearFilter>('all'); // Default to all years
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set(['completed', 'denied'])); // Collapsed by default
  const [itemsToShow, setItemsToShow] = useState<Record<string, number>>({
    active: 10,
    completed: 10,
    denied: 10,
  });

  // Get user's requests
  const myRequests = useMemo(() => {
    return requests.filter(req => req.userId === currentUser.id);
  }, [requests, currentUser.id]);

  // Get available years from requests
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    myRequests.forEach(req => {
      const year = new Date(req.createdAt).getFullYear().toString();
      years.add(year);
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a)); // Newest first
  }, [myRequests]);

  // Apply filters
  const filteredRequests = useMemo(() => {
    let filtered = myRequests;

    // Year filter
    if (yearFilter !== 'all') {
      filtered = filtered.filter(req => {
        const year = new Date(req.createdAt).getFullYear().toString();
        return year === yearFilter;
      });
    }

    // Type filter
    if (typeFilter === 'expense') {
      filtered = filtered.filter(req => req.type === 'Expense');
    } else if (typeFilter === 'purchase') {
      filtered = filtered.filter(req => req.type === 'Purchase');
    }

    // Status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(req => 
        ['Draft', 'Pending', 'Approved', 'Processing', 'Ordered'].includes(req.status)
      );
    } else if (statusFilter === 'completed') {
      filtered = filtered.filter(req => 
        ['Finalized', 'Received'].includes(req.status)
      );
    } else if (statusFilter === 'denied') {
      filtered = filtered.filter(req => req.status === 'Denied');
    } else if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(req =>
        req.purpose.toLowerCase().includes(query) ||
        req.referenceNumber.toLowerCase().includes(query) ||
        req.lineItems.some(item => item.description.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [myRequests, typeFilter, statusFilter, yearFilter, searchQuery]);

  // Group requests by workflow state (ACTIVE/COMPLETED/DENIED)
  const groupedRequests = useMemo(() => {
    const groups = {
      active: [] as typeof filteredRequests,
      completed: [] as typeof filteredRequests,
      denied: [] as typeof filteredRequests,
    };

    filteredRequests.forEach(req => {
      if (req.status === 'Denied') {
        groups.denied.push(req);
      } else if (['Finalized', 'Received'].includes(req.status)) {
        groups.completed.push(req);
      } else {
        // Draft, Pending, Approved, Processing, Ordered
        groups.active.push(req);
      }
    });

    // Sort by date (newest first)
    Object.values(groups).forEach(group => {
      group.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    });

    return groups;
  }, [filteredRequests]);

  // Calculate totals for each group
  const groupTotals = useMemo(() => {
    const calculateTotal = (items: typeof filteredRequests) => {
      return items.reduce((sum, item) => sum + item.total, 0);
    };

    return {
      active: calculateTotal(groupedRequests.active),
      completed: calculateTotal(groupedRequests.completed),
      denied: calculateTotal(groupedRequests.denied),
    };
  }, [groupedRequests]);

  // Counts
  const counts = {
    all: filteredRequests.length,
    expense: filteredRequests.filter(r => r.type === 'Expense').length,
    purchase: filteredRequests.filter(r => r.type === 'Purchase').length,
  };

  const toggleGroup = (group: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  };

  const loadMoreItems = (group: string) => {
    setItemsToShow(prev => ({
      ...prev,
      [group]: prev[group] + 20,
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (myRequests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ padding: '80px 0' }}>
        <div 
          className="flex items-center justify-center rounded-xl mb-4"
          style={{
            width: '64px',
            height: '64px',
            backgroundColor: '#F3F4F6',
          }}
        >
          <Receipt className="w-8 h-8" style={{ color: '#9CA3AF' }} />
        </div>
        <div style={{ fontSize: '16px', fontWeight: 600, color: '#6B7280', marginBottom: '8px' }}>
          No spending requests yet
        </div>
        <div style={{ fontSize: '14px', color: '#9CA3AF' }}>
          Create an expense or purchase request to get started
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

        {/* Other Filters */}
        <div className="flex items-center gap-3">
          {/* Year Filter */}
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value as YearFilter)}
            className="px-3 py-2 border rounded-lg"
            style={{
              fontSize: '13px',
              borderColor: '#E5E7EB',
              color: '#374151',
            }}
          >
            <option value="all">All Years</option>
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="px-3 py-2 border rounded-lg"
            style={{
              fontSize: '13px',
              borderColor: '#E5E7EB',
              color: '#374151',
            }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="denied">Denied</option>
            <option disabled>──────────</option>
            <option value="Draft">Draft</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Processing">Processing</option>
            <option value="Ordered">Ordered</option>
            <option value="Finalized">Finalized</option>
            <option value="Received">Received</option>
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
              placeholder="Search by description, number..."
              className="w-full pl-10 pr-3 py-2 border rounded-lg"
              style={{
                fontSize: '13px',
                borderColor: '#E5E7EB',
              }}
            />
          </div>
        </div>
      </div>

      {/* Grouped List */}
      {filteredRequests.length === 0 ? (
        <div className="text-center" style={{ padding: '40px 0' }}>
          <div style={{ fontSize: '14px', color: '#6B7280' }}>
            No requests match your filters
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* ACTIVE Group */}
          {groupedRequests.active.length > 0 && (
            <div>
              <div 
                className="flex items-center gap-2 mb-3"
                style={{ cursor: 'default' }}
              >
                <div 
                  style={{ 
                    fontSize: '12px', 
                    fontWeight: 600, 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.5px',
                    color: '#0066FF',
                  }}
                >
                  ACTIVE ({groupedRequests.active.length})
                </div>
                <div className="flex-1 h-px" style={{ backgroundColor: '#E5E7EB' }} />
              </div>
              <div className="space-y-3">
                {groupedRequests.active.slice(0, itemsToShow.active).map(request => (
                  <SpendingCard key={request.id} request={request} onCardClick={onCardClick} />
                ))}
              </div>
              {groupedRequests.active.length > itemsToShow.active && (
                <button
                  onClick={() => loadMoreItems('active')}
                  className="flex items-center justify-center gap-2 w-full mt-3 px-4 py-3 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
                  style={{
                    borderColor: '#E5E7EB',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#6B7280',
                  }}
                >
                  Load More ({groupedRequests.active.length - itemsToShow.active} remaining)
                </button>
              )}
            </div>
          )}

          {/* COMPLETED Group */}
          {groupedRequests.completed.length > 0 && (
            <div>
              {collapsedGroups.has('completed') ? (
                <button
                  onClick={() => toggleGroup('completed')}
                  className="flex items-center justify-between w-full px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
                  style={{
                    backgroundColor: '#F9FAFB',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <ChevronRight className="w-4 h-4" style={{ color: '#6B7280' }} />
                    <div 
                      style={{ 
                        fontSize: '12px', 
                        fontWeight: 600, 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.5px',
                        color: '#6B7280',
                      }}
                    >
                      COMPLETED ({groupedRequests.completed.length})
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', color: '#9CA3AF' }}>
                    {groupedRequests.completed.length} finalized/received · {formatCurrency(groupTotals.completed)} total
                  </div>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => toggleGroup('completed')}
                    className="flex items-center gap-2 mb-3 hover:opacity-70 transition-opacity"
                    style={{ cursor: 'pointer' }}
                  >
                    <ChevronDown className="w-4 h-4" style={{ color: '#6B7280' }} />
                    <div 
                      style={{ 
                        fontSize: '12px', 
                        fontWeight: 600, 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.5px',
                        color: '#6B7280',
                      }}
                    >
                      COMPLETED ({groupedRequests.completed.length})
                    </div>
                    <div className="flex-1 h-px" style={{ backgroundColor: '#E5E7EB' }} />
                  </button>
                  <div className="space-y-3">
                    {groupedRequests.completed.slice(0, itemsToShow.completed).map(request => (
                      <SpendingCard key={request.id} request={request} onCardClick={onCardClick} />
                    ))}
                  </div>
                  {groupedRequests.completed.length > itemsToShow.completed && (
                    <button
                      onClick={() => loadMoreItems('completed')}
                      className="flex items-center justify-center gap-2 w-full mt-3 px-4 py-3 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
                      style={{
                        borderColor: '#E5E7EB',
                        fontSize: '13px',
                        fontWeight: 500,
                        color: '#6B7280',
                      }}
                    >
                      Load More ({groupedRequests.completed.length - itemsToShow.completed} remaining)
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {/* DENIED Group */}
          {groupedRequests.denied.length > 0 && (
            <div>
              {collapsedGroups.has('denied') ? (
                <button
                  onClick={() => toggleGroup('denied')}
                  className="flex items-center justify-between w-full px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
                  style={{
                    backgroundColor: '#F9FAFB',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <ChevronRight className="w-4 h-4" style={{ color: '#6B7280' }} />
                    <div 
                      style={{ 
                        fontSize: '12px', 
                        fontWeight: 600, 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.5px',
                        color: '#6B7280',
                      }}
                    >
                      DENIED ({groupedRequests.denied.length})
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', color: '#9CA3AF' }}>
                    {groupedRequests.denied.length} denied requests
                  </div>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => toggleGroup('denied')}
                    className="flex items-center gap-2 mb-3 hover:opacity-70 transition-opacity"
                    style={{ cursor: 'pointer' }}
                  >
                    <ChevronDown className="w-4 h-4" style={{ color: '#6B7280' }} />
                    <div 
                      style={{ 
                        fontSize: '12px', 
                        fontWeight: 600, 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.5px',
                        color: '#6B7280',
                      }}
                    >
                      DENIED ({groupedRequests.denied.length})
                    </div>
                    <div className="flex-1 h-px" style={{ backgroundColor: '#E5E7EB' }} />
                  </button>
                  <div className="space-y-3">
                    {groupedRequests.denied.slice(0, itemsToShow.denied).map(request => (
                      <SpendingCard key={request.id} request={request} onCardClick={onCardClick} />
                    ))}
                  </div>
                  {groupedRequests.denied.length > itemsToShow.denied && (
                    <button
                      onClick={() => loadMoreItems('denied')}
                      className="flex items-center justify-center gap-2 w-full mt-3 px-4 py-3 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
                      style={{
                        borderColor: '#E5E7EB',
                        fontSize: '13px',
                        fontWeight: 500,
                        color: '#6B7280',
                      }}
                    >
                      Load More ({groupedRequests.denied.length - itemsToShow.denied} remaining)
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
