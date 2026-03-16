import React, { useState, useMemo } from 'react';
import { useSpending, SpendingStatus, SpendingRequest } from '../../contexts/SpendingContext';
import { Receipt, ShoppingCart, Settings, Package, CheckCheck, Eye, AlertTriangle, Calendar, ChevronDown } from 'lucide-react';
import { SpendingCard } from './SpendingCard';

type ExpenseSubTab = 'approved' | 'processing' | 'finalized';
type PurchaseSubTab = 'approved' | 'processing' | 'ordered' | 'received';

interface ProcessingTabProps {
  onCardClick?: (request: SpendingRequest) => void;
}

export function ProcessingTab({ onCardClick }: ProcessingTabProps) {
  const { requests, currentUser, updateRequest, userNames: employeeNames } = useSpending();
  const [activeType, setActiveType] = useState<'expenses' | 'purchases'>(
    currentUser.isExpenseAdmin ? 'expenses' : 'purchases'
  );
  const [expenseSubTab, setExpenseSubTab] = useState<ExpenseSubTab>('approved');
  const [purchaseSubTab, setPurchaseSubTab] = useState<PurchaseSubTab>('approved');
  
  // Filters for approved tabs
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [amountFilter, setAmountFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('oldest');
  
  // Collapsible groups for approved view
  const [waitingGroupExpanded, setWaitingGroupExpanded] = useState(true);
  const [thisWeekExpanded, setThisWeekExpanded] = useState(true);
  const [expandedGroupItems, setExpandedGroupItems] = useState<Record<string, number>>({
    waiting: 2,
    thisWeek: 10,
  });
  
  // Historical view state
  const [showHistorical, setShowHistorical] = useState(false);
  const [historicalPeriod, setHistoricalPeriod] = useState<string>('thisMonth');
  const [historicalPage, setHistoricalPage] = useState(1);
  const historicalItemsPerPage = 20;

  // Filter expenses by admin status
  const expensesByStatus = useMemo(() => {
    if (!currentUser.isExpenseAdmin) return { approved: [], processing: [], finalized: [] };
    
    const expenses = requests.filter(r => r.type === 'Expense');
    
    return {
      approved: expenses.filter(r => r.status === 'Approved'),
      processing: expenses.filter(r => r.status === 'Processing'),
      finalized: expenses.filter(r => r.status === 'Finalized')
    };
  }, [requests, currentUser.isExpenseAdmin]);

  // Filter purchases by admin status
  const purchasesByStatus = useMemo(() => {
    if (!currentUser.isPurchaseAdmin) return { approved: [], processing: [], ordered: [], received: [] };
    
    const purchases = requests.filter(r => r.type === 'Purchase');
    
    return {
      approved: purchases.filter(r => r.status === 'Approved'),
      processing: purchases.filter(r => r.status === 'Processing'),
      ordered: purchases.filter(r => r.status === 'Ordered'),
      received: purchases.filter(r => r.status === 'Received')
    };
  }, [requests, currentUser.isPurchaseAdmin]);

  // Group approved requests by priority
  const groupApprovedRequests = (requests: SpendingRequest[]) => {
    const waiting = requests.filter(r => {
      const age = getAge(r);
      return age > 7;
    });
    const thisWeek = requests.filter(r => {
      const age = getAge(r);
      return age <= 7;
    });
    
    return { waiting, thisWeek };
  };

  const groupedExpenses = useMemo(() => {
    return groupApprovedRequests(expensesByStatus.approved);
  }, [expensesByStatus.approved]);

  const groupedPurchases = useMemo(() => {
    return groupApprovedRequests(purchasesByStatus.approved);
  }, [purchasesByStatus.approved]);

  // Get historical data based on period
  const getHistoricalData = (type: 'Expense' | 'Purchase') => {
    const completed = requests.filter(r => {
      if (r.type !== type) return false;
      if (type === 'Expense' && r.status !== 'Finalized') return false;
      if (type === 'Purchase' && r.status !== 'Received') return false;
      
      const completedDate = new Date(r.completedDate || r.updatedAt);
      const now = new Date();
      
      if (historicalPeriod === 'thisMonth') {
        return completedDate.getMonth() === now.getMonth() && completedDate.getFullYear() === now.getFullYear();
      } else if (historicalPeriod === 'lastMonth') {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return completedDate.getMonth() === lastMonth.getMonth() && completedDate.getFullYear() === lastMonth.getFullYear();
      } else if (historicalPeriod === 'last3Months') {
        const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        return completedDate >= threeMonthsAgo;
      } else if (historicalPeriod === 'thisYear') {
        return completedDate.getFullYear() === now.getFullYear();
      }
      return false;
    });
    
    return completed.sort((a, b) => {
      const aDate = new Date(a.completedDate || a.updatedAt).getTime();
      const bDate = new Date(b.completedDate || b.updatedAt).getTime();
      return bDate - aDate;
    });
  };

  const handleStartProcessing = (requestId: string) => {
    updateRequest(requestId, { 
      status: 'Processing',
      updatedAt: new Date().toISOString()
    });
  };

  const handleFinalize = (requestId: string) => {
    updateRequest(requestId, { 
      status: 'Finalized',
      completedDate: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  };

  const handleMarkAsOrdered = (requestId: string) => {
    updateRequest(requestId, { 
      status: 'Ordered',
      updatedAt: new Date().toISOString()
    });
  };

  const handleMarkAsReceived = (requestId: string) => {
    updateRequest(requestId, { 
      status: 'Received',
      completedDate: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  };

  function getAge(request: SpendingRequest): number {
    if (!request.approvedDate) return 0;
    const approved = new Date(request.approvedDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - approved.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  const loadMore = (group: string) => {
    setExpandedGroupItems(prev => ({
      ...prev,
      [group]: prev[group] + 20,
    }));
  };

  // Helper to render View button with onClick
  const renderViewButton = (request: SpendingRequest) => (
    <button
      onClick={() => onCardClick?.(request)}
      className="px-3 py-1.5 border rounded-lg hover:bg-gray-50 transition-all flex items-center gap-2"
      style={{ borderColor: '#E5E7EB', fontSize: '13px', fontWeight: 500, color: '#374151' }}
    >
      <Eye className="w-3.5 h-3.5" />
      View
    </button>
  );

  // Render historical view
  const renderHistoricalView = (type: 'Expense' | 'Purchase') => {
    const data = getHistoricalData(type);
    const totalPages = Math.ceil(data.length / historicalItemsPerPage);
    const paginatedData = data.slice(
      (historicalPage - 1) * historicalItemsPerPage,
      historicalPage * historicalItemsPerPage
    );

    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setShowHistorical(false)}
            className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
            style={{ fontSize: '14px', color: '#6B7280' }}
          >
            ← Back
          </button>
          <select
            value={historicalPeriod}
            onChange={(e) => {
              setHistoricalPeriod(e.target.value);
              setHistoricalPage(1);
            }}
            className="px-3 py-2 border rounded-lg"
            style={{
              fontSize: '13px',
              borderColor: '#E5E7EB',
              color: '#374151',
            }}
          >
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
            <option value="last3Months">Last 3 Months</option>
            <option value="thisYear">This Year</option>
          </select>
        </div>

        {data.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="w-12 h-12 mx-auto mb-4" style={{ color: '#9CA3AF' }} />
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#6B7280', marginBottom: '4px' }}>
              No {type === 'Expense' ? 'finalized expenses' : 'received purchases'}
            </div>
            <div style={{ fontSize: '13px', color: '#9CA3AF' }}>
              for this period
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white border rounded-xl overflow-hidden mb-6" style={{ borderColor: '#E5E7EB' }}>
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
                <div className="col-span-2">Date</div>
                <div className="col-span-2">Employee</div>
                <div className="col-span-2">Reference</div>
                <div className="col-span-4">Description</div>
                <div className="col-span-2 text-right">Amount</div>
              </div>

              {/* Table Rows */}
              {paginatedData.map(request => {
                const completedDate = new Date(request.completedDate || request.updatedAt);
                return (
                  <button
                    key={request.id}
                    onClick={() => onCardClick?.(request)}
                    className="grid grid-cols-12 gap-4 px-4 py-3 border-b hover:bg-gray-50 transition-colors w-full text-left"
                    style={{
                      borderColor: '#E5E7EB',
                      fontSize: '14px',
                    }}
                  >
                    <div className="col-span-2" style={{ color: '#374151' }}>
                      {completedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </div>
                    <div className="col-span-2" style={{ color: '#374151' }}>
                      {employeeNames[request.userId]}
                    </div>
                    <div className="col-span-2 flex items-center gap-1">
                      {type === 'Expense' ? (
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
                  </button>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div style={{ fontSize: '13px', color: '#6B7280' }}>
                  Showing {(historicalPage - 1) * historicalItemsPerPage + 1}-{Math.min(historicalPage * historicalItemsPerPage, data.length)} of {data.length}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setHistoricalPage(p => Math.max(1, p - 1))}
                    disabled={historicalPage === 1}
                    className="px-3 py-1.5 border rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    style={{ fontSize: '13px', borderColor: '#E5E7EB', color: '#6B7280' }}
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setHistoricalPage(page)}
                      className="px-3 py-1.5 border rounded-lg hover:bg-gray-50 transition-colors"
                      style={{
                        fontSize: '13px',
                        borderColor: historicalPage === page ? '#2563EB' : '#E5E7EB',
                        backgroundColor: historicalPage === page ? '#EFF6FF' : 'white',
                        color: historicalPage === page ? '#2563EB' : '#6B7280',
                        fontWeight: historicalPage === page ? 600 : 400,
                      }}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setHistoricalPage(p => Math.min(totalPages, p + 1))}
                    disabled={historicalPage === totalPages}
                    className="px-3 py-1.5 border rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    style={{ fontSize: '13px', borderColor: '#E5E7EB', color: '#6B7280' }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Type Selector (if admin has both roles) */}
      {currentUser.isExpenseAdmin && currentUser.isPurchaseAdmin && (
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => {
              setActiveType('expenses');
              setShowHistorical(false);
            }}
            className="px-4 py-2 rounded-lg border transition-all"
            style={{
              backgroundColor: activeType === 'expenses' ? '#EFF6FF' : 'white',
              borderColor: activeType === 'expenses' ? '#2563EB' : '#E5E7EB',
              color: activeType === 'expenses' ? '#2563EB' : '#6B7280',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            Expenses
          </button>
          <button
            onClick={() => {
              setActiveType('purchases');
              setShowHistorical(false);
            }}
            className="px-4 py-2 rounded-lg border transition-all"
            style={{
              backgroundColor: activeType === 'purchases' ? '#EFF6FF' : 'white',
              borderColor: activeType === 'purchases' ? '#2563EB' : '#E5E7EB',
              color: activeType === 'purchases' ? '#2563EB' : '#6B7280',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            Purchases
          </button>
        </div>
      )}

      {/* Expenses Processing View */}
      {activeType === 'expenses' && currentUser.isExpenseAdmin && !showHistorical && (
        <div>
          {/* Sub-tab navigation */}
          <div className="flex items-center gap-6 mb-6 border-b" style={{ borderColor: '#E5E7EB' }}>
            <button
              onClick={() => setExpenseSubTab('approved')}
              className="relative pb-3 transition-colors"
              style={{
                fontSize: '14px',
                fontWeight: 500,
                color: expenseSubTab === 'approved' ? '#111827' : '#6B7280'
              }}
            >
              Approved ({expensesByStatus.approved.length})
              {expenseSubTab === 'approved' && (
                <div 
                  className="absolute bottom-0 left-0 right-0"
                  style={{ height: '2px', backgroundColor: '#2563EB' }}
                />
              )}
            </button>
            <button
              onClick={() => setExpenseSubTab('processing')}
              className="relative pb-3 transition-colors"
              style={{
                fontSize: '14px',
                fontWeight: 500,
                color: expenseSubTab === 'processing' ? '#111827' : '#6B7280'
              }}
            >
              Processing ({expensesByStatus.processing.length})
              {expenseSubTab === 'processing' && (
                <div 
                  className="absolute bottom-0 left-0 right-0"
                  style={{ height: '2px', backgroundColor: '#2563EB' }}
                />
              )}
            </button>
            <button
              onClick={() => setShowHistorical(true)}
              className="relative pb-3 transition-colors flex items-center gap-2"
              style={{
                fontSize: '14px',
                fontWeight: 500,
                color: '#6B7280'
              }}
            >
              Finalized
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Approved Expenses */}
          {expenseSubTab === 'approved' && (
            <div>
              {expensesByStatus.approved.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div 
                    className="flex items-center justify-center rounded-xl mb-4"
                    style={{ width: '48px', height: '48px', backgroundColor: '#F3F4F6' }}
                  >
                    <Receipt className="w-6 h-6" style={{ color: '#9CA3AF' }} />
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#6B7280', marginBottom: '4px' }}>
                    Nothing to process
                  </div>
                  <div style={{ fontSize: '13px', color: '#9CA3AF' }}>
                    No approved expenses waiting for processing
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* WAITING 7+ DAYS */}
                  {groupedExpenses.waiting.length > 0 && (
                    <div>
                      <button
                        onClick={() => setWaitingGroupExpanded(!waitingGroupExpanded)}
                        className="flex items-center gap-2 mb-3 w-full"
                        style={{ cursor: 'pointer' }}
                      >
                        <AlertTriangle className="w-4 h-4" style={{ color: '#F59E0B' }} />
                        <div 
                          style={{ 
                            fontSize: '12px', 
                            fontWeight: 600, 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.5px',
                            color: '#F59E0B',
                          }}
                        >
                          ⚠️ WAITING 7+ DAYS ({groupedExpenses.waiting.length})
                        </div>
                        <div className="flex-1 h-px" style={{ backgroundColor: '#FDE68A' }} />
                      </button>
                      {waitingGroupExpanded && (
                        <div className="space-y-3 mb-6">
                          {groupedExpenses.waiting.slice(0, expandedGroupItems.waiting).map(request => (
                            <div 
                              key={request.id}
                              className="bg-white border rounded-lg p-4"
                              style={{ borderColor: '#E5E7EB', borderLeft: '4px solid #F59E0B' }}
                            >
                              <SpendingCard
                                request={request}
                                showEmployee
                                employeeName={employeeNames[request.userId]}
                              />
                              <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t" style={{ borderColor: '#F3F4F6' }}>
                                {renderViewButton(request)}
                                <button
                                  className="px-3 py-1.5 rounded-lg hover:bg-red-50 transition-all"
                                  style={{ fontSize: '13px', fontWeight: 500, color: '#DC2626' }}
                                >
                                  Deny
                                </button>
                                <button
                                  onClick={() => handleStartProcessing(request.id)}
                                  className="px-3 py-1.5 rounded-lg hover:opacity-90 transition-all flex items-center gap-2"
                                  style={{ backgroundColor: '#2563EB', color: 'white', fontSize: '13px', fontWeight: 500 }}
                                >
                                  <Settings className="w-3.5 h-3.5" />
                                  Start Processing
                                </button>
                              </div>
                            </div>
                          ))}
                          {groupedExpenses.waiting.length > expandedGroupItems.waiting && (
                            <button
                              onClick={() => loadMore('waiting')}
                              className="w-full py-2 text-center rounded-lg border transition-colors hover:bg-gray-50"
                              style={{ fontSize: '13px', fontWeight: 500, color: '#2563EB', borderColor: '#E5E7EB' }}
                            >
                              + {groupedExpenses.waiting.length - expandedGroupItems.waiting} more waiting
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* THIS WEEK */}
                  {groupedExpenses.thisWeek.length > 0 && (
                    <div>
                      <button
                        onClick={() => setThisWeekExpanded(!thisWeekExpanded)}
                        className="flex items-center gap-2 mb-3 w-full"
                        style={{ cursor: 'pointer' }}
                      >
                        <div 
                          style={{ 
                            fontSize: '12px', 
                            fontWeight: 600, 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.5px',
                            color: '#2563EB',
                          }}
                        >
                          📥 THIS WEEK ({groupedExpenses.thisWeek.length})
                        </div>
                        <div className="flex-1 h-px" style={{ backgroundColor: '#E5E7EB' }} />
                      </button>
                      {thisWeekExpanded && (
                        <div className="space-y-3">
                          {groupedExpenses.thisWeek.slice(0, expandedGroupItems.thisWeek).map(request => (
                            <div 
                              key={request.id}
                              className="bg-white border rounded-lg p-4"
                              style={{ borderColor: '#E5E7EB' }}
                            >
                              <SpendingCard
                                request={request}
                                showEmployee
                                employeeName={employeeNames[request.userId]}
                              />
                              <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t" style={{ borderColor: '#F3F4F6' }}>
                                {renderViewButton(request)}
                                <button
                                  className="px-3 py-1.5 rounded-lg hover:bg-red-50 transition-all"
                                  style={{ fontSize: '13px', fontWeight: 500, color: '#DC2626' }}
                                >
                                  Deny
                                </button>
                                <button
                                  onClick={() => handleStartProcessing(request.id)}
                                  className="px-3 py-1.5 rounded-lg hover:opacity-90 transition-all flex items-center gap-2"
                                  style={{ backgroundColor: '#2563EB', color: 'white', fontSize: '13px', fontWeight: 500 }}
                                >
                                  <Settings className="w-3.5 h-3.5" />
                                  Start Processing
                                </button>
                              </div>
                            </div>
                          ))}
                          {groupedExpenses.thisWeek.length > expandedGroupItems.thisWeek && (
                            <button
                              onClick={() => loadMore('thisWeek')}
                              className="w-full py-2 text-center rounded-lg border transition-colors hover:bg-gray-50"
                              style={{ fontSize: '13px', fontWeight: 500, color: '#2563EB', borderColor: '#E5E7EB' }}
                            >
                              Load More ({groupedExpenses.thisWeek.length - expandedGroupItems.thisWeek} remaining)
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Processing Expenses */}
          {expenseSubTab === 'processing' && (
            <div>
              {expensesByStatus.processing.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div 
                    className="flex items-center justify-center rounded-xl mb-4"
                    style={{ width: '48px', height: '48px', backgroundColor: '#F3F4F6' }}
                  >
                    <Settings className="w-6 h-6" style={{ color: '#9CA3AF' }} />
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#6B7280', marginBottom: '4px' }}>
                    Nothing processing
                  </div>
                  <div style={{ fontSize: '13px', color: '#9CA3AF' }}>
                    No expenses currently being processed
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {expensesByStatus.processing.map(request => (
                    <div 
                      key={request.id}
                      className="bg-white border rounded-lg p-4"
                      style={{ borderColor: '#E5E7EB' }}
                    >
                      <SpendingCard
                        request={request}
                        showEmployee
                        employeeName={employeeNames[request.userId]}
                      />
                      <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t" style={{ borderColor: '#F3F4F6' }}>
                        {renderViewButton(request)}
                        <button
                          className="px-3 py-1.5 rounded-lg hover:bg-red-50 transition-all"
                          style={{ fontSize: '13px', fontWeight: 500, color: '#DC2626' }}
                        >
                          Deny
                        </button>
                        <button
                          onClick={() => handleFinalize(request.id)}
                          className="px-3 py-1.5 rounded-lg hover:opacity-90 transition-all flex items-center gap-2"
                          style={{ backgroundColor: '#059669', color: 'white', fontSize: '13px', fontWeight: 500 }}
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          Mark as Finalized
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Show Expenses Historical View */}
      {activeType === 'expenses' && currentUser.isExpenseAdmin && showHistorical && renderHistoricalView('Expense')}

      {/* Purchases Processing View */}
      {activeType === 'purchases' && currentUser.isPurchaseAdmin && !showHistorical && (
        <div>
          {/* Sub-tab navigation */}
          <div className="flex items-center gap-6 mb-6 border-b" style={{ borderColor: '#E5E7EB' }}>
            <button
              onClick={() => setPurchaseSubTab('approved')}
              className="relative pb-3 transition-colors"
              style={{
                fontSize: '14px',
                fontWeight: 500,
                color: purchaseSubTab === 'approved' ? '#111827' : '#6B7280'
              }}
            >
              Approved ({purchasesByStatus.approved.length})
              {purchaseSubTab === 'approved' && (
                <div 
                  className="absolute bottom-0 left-0 right-0"
                  style={{ height: '2px', backgroundColor: '#2563EB' }}
                />
              )}
            </button>
            <button
              onClick={() => setPurchaseSubTab('processing')}
              className="relative pb-3 transition-colors"
              style={{
                fontSize: '14px',
                fontWeight: 500,
                color: purchaseSubTab === 'processing' ? '#111827' : '#6B7280'
              }}
            >
              Processing ({purchasesByStatus.processing.length})
              {purchaseSubTab === 'processing' && (
                <div 
                  className="absolute bottom-0 left-0 right-0"
                  style={{ height: '2px', backgroundColor: '#2563EB' }}
                />
              )}
            </button>
            <button
              onClick={() => setPurchaseSubTab('ordered')}
              className="relative pb-3 transition-colors"
              style={{
                fontSize: '14px',
                fontWeight: 500,
                color: purchaseSubTab === 'ordered' ? '#111827' : '#6B7280'
              }}
            >
              Ordered ({purchasesByStatus.ordered.length})
              {purchaseSubTab === 'ordered' && (
                <div 
                  className="absolute bottom-0 left-0 right-0"
                  style={{ height: '2px', backgroundColor: '#2563EB' }}
                />
              )}
            </button>
            <button
              onClick={() => setShowHistorical(true)}
              className="relative pb-3 transition-colors flex items-center gap-2"
              style={{
                fontSize: '14px',
                fontWeight: 500,
                color: '#6B7280'
              }}
            >
              Received
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Approved Purchases */}
          {purchaseSubTab === 'approved' && (
            <div>
              {purchasesByStatus.approved.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div 
                    className="flex items-center justify-center rounded-xl mb-4"
                    style={{ width: '48px', height: '48px', backgroundColor: '#F3F4F6' }}
                  >
                    <ShoppingCart className="w-6 h-6" style={{ color: '#9CA3AF' }} />
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#6B7280', marginBottom: '4px' }}>
                    Nothing to process
                  </div>
                  <div style={{ fontSize: '13px', color: '#9CA3AF' }}>
                    No approved purchases waiting for processing
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {purchasesByStatus.approved.map(request => (
                    <div 
                      key={request.id}
                      className="bg-white border rounded-lg p-4"
                      style={{ borderColor: '#E5E7EB' }}
                    >
                      <SpendingCard
                        request={request}
                        showEmployee
                        employeeName={employeeNames[request.userId]}
                      />
                      <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t" style={{ borderColor: '#F3F4F6' }}>
                        {renderViewButton(request)}
                        <button
                          className="px-3 py-1.5 rounded-lg hover:bg-red-50 transition-all"
                          style={{ fontSize: '13px', fontWeight: 500, color: '#DC2626' }}
                        >
                          Deny
                        </button>
                        <button
                          onClick={() => handleStartProcessing(request.id)}
                          className="px-3 py-1.5 rounded-lg hover:opacity-90 transition-all flex items-center gap-2"
                          style={{ backgroundColor: '#2563EB', color: 'white', fontSize: '13px', fontWeight: 500 }}
                        >
                          <Settings className="w-3.5 h-3.5" />
                          Start Processing
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Processing Purchases */}
          {purchaseSubTab === 'processing' && (
            <div>
              {purchasesByStatus.processing.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div 
                    className="flex items-center justify-center rounded-xl mb-4"
                    style={{ width: '48px', height: '48px', backgroundColor: '#F3F4F6' }}
                  >
                    <Settings className="w-6 h-6" style={{ color: '#9CA3AF' }} />
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#6B7280', marginBottom: '4px' }}>
                    Nothing processing
                  </div>
                  <div style={{ fontSize: '13px', color: '#9CA3AF' }}>
                    No purchases currently being processed
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {purchasesByStatus.processing.map(request => (
                    <div 
                      key={request.id}
                      className="bg-white border rounded-lg p-4"
                      style={{ borderColor: '#E5E7EB' }}
                    >
                      <SpendingCard
                        request={request}
                        showEmployee
                        employeeName={employeeNames[request.userId]}
                      />
                      <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t" style={{ borderColor: '#F3F4F6' }}>
                        {renderViewButton(request)}
                        <button
                          className="px-3 py-1.5 rounded-lg hover:bg-red-50 transition-all"
                          style={{ fontSize: '13px', fontWeight: 500, color: '#DC2626' }}
                        >
                          Deny
                        </button>
                        <button
                          onClick={() => handleMarkAsOrdered(request.id)}
                          className="px-3 py-1.5 rounded-lg hover:opacity-90 transition-all flex items-center gap-2"
                          style={{ backgroundColor: '#2563EB', color: 'white', fontSize: '13px', fontWeight: 500 }}
                        >
                          <Package className="w-3.5 h-3.5" />
                          Mark as Ordered
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Ordered Purchases */}
          {purchaseSubTab === 'ordered' && (
            <div>
              {purchasesByStatus.ordered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div 
                    className="flex items-center justify-center rounded-xl mb-4"
                    style={{ width: '48px', height: '48px', backgroundColor: '#F3F4F6' }}
                  >
                    <Package className="w-6 h-6" style={{ color: '#9CA3AF' }} />
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#6B7280', marginBottom: '4px' }}>
                    No ordered purchases
                  </div>
                  <div style={{ fontSize: '13px', color: '#9CA3AF' }}>
                    Ordered purchases awaiting delivery will appear here
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {purchasesByStatus.ordered.map(request => (
                    <div 
                      key={request.id}
                      className="bg-white border rounded-lg p-4"
                      style={{ borderColor: '#E5E7EB' }}
                    >
                      <SpendingCard
                        request={request}
                        showEmployee
                        employeeName={employeeNames[request.userId]}
                      />
                      <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t" style={{ borderColor: '#F3F4F6' }}>
                        {renderViewButton(request)}
                        <button
                          className="px-3 py-1.5 rounded-lg hover:bg-red-50 transition-all"
                          style={{ fontSize: '13px', fontWeight: 500, color: '#DC2626' }}
                        >
                          Deny
                        </button>
                        <button
                          onClick={() => handleMarkAsReceived(request.id)}
                          className="px-3 py-1.5 rounded-lg hover:opacity-90 transition-all flex items-center gap-2"
                          style={{ backgroundColor: '#059669', color: 'white', fontSize: '13px', fontWeight: 500 }}
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          Mark as Received
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Show Purchases Historical View */}
      {activeType === 'purchases' && currentUser.isPurchaseAdmin && showHistorical && renderHistoricalView('Purchase')}
    </div>
  );
}
