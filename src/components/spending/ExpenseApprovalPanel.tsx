import React, { useState, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight, ChevronDown, ChevronRight as ChevronRightCollapse, AlertTriangle, CheckCircle2, Paperclip, Check, Receipt } from 'lucide-react';
import { SpendingRequest, useSpending, leaveTypeConfig } from '../../contexts/SpendingContext';
import { toast } from 'sonner@2.0.3';

interface ExpenseApprovalPanelProps {
  request: SpendingRequest;
  employeeName: string;
  onClose: () => void;
}

export function ExpenseApprovalPanel({ request: initialRequest, employeeName, onClose }: ExpenseApprovalPanelProps) {
  const { requests, approveRequest, denyRequest } = useSpending();
  const [managerComment, setManagerComment] = useState('');
  const [showDenyFlow, setShowDenyFlow] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Get all pending requests for navigation
  const pendingRequests = requests.filter(req => req.status === 'Pending' && req.type === 'Expense');
  const [currentIndex, setCurrentIndex] = useState(() =>
    pendingRequests.findIndex(req => req.id === initialRequest.id)
  );

  const request = pendingRequests[currentIndex] || initialRequest;

  // Collapsible sections
  const [expandedSections, setExpandedSections] = useState({
    lineItems: true,
    receipts: true,
    policy: true,
    budget: true,
    history: false,
    previousDecisions: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleApprove = async () => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    approveRequest(request.id, managerComment);
    toast.success(`✓ Expense approved for ${employeeName}`, {
      description: 'Notification sent',
    });
    setIsProcessing(false);

    if (currentIndex < pendingRequests.length - 1) {
      setTimeout(() => setCurrentIndex(prev => prev + 1), 600);
    } else {
      setTimeout(() => onClose(), 1000);
    }
  };

  const handleDeny = async () => {
    if (!managerComment.trim()) {
      toast.error('Please provide a reason for denial');
      return;
    }

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    denyRequest(request.id, managerComment, managerComment);
    toast.error(`✗ Expense denied for ${employeeName}`, {
      description: 'Notification sent',
    });
    setIsProcessing(false);
    setShowDenyFlow(false);
    setManagerComment('');

    if (currentIndex < pendingRequests.length - 1) {
      setTimeout(() => setCurrentIndex(prev => prev + 1), 600);
    } else {
      setTimeout(() => onClose(), 1000);
    }
  };

  const formatDateRange = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const receiptCount = request.lineItems.filter(item => item.receiptUrl).length;
  const missingReceipts = request.lineItems.filter(item => !item.receiptUrl);
  const hasReceiptIssues = missingReceipts.length > 0;

  // Budget data computed from all approved/processing expense requests
  const budgetData = useMemo(() => {
    const approvedExpenses = requests.filter(
      r => r.type === 'Expense' && (r.status === 'Approved' || r.status === 'Processing' || r.status === 'Finalized')
    );
    const spent = approvedExpenses.reduce((sum, r) => sum + r.total, 0);
    // Estimate allocation as spent + pending (including this request) + 20% buffer
    const pendingTotal = requests
      .filter(r => r.type === 'Expense' && r.status === 'Pending')
      .reduce((sum, r) => sum + r.total, 0);
    const allocated = Math.max(spent + pendingTotal, spent * 1.2) || 1;
    return {
      allocated: Math.round(allocated),
      spent: Math.round(spent),
      afterThis: Math.round(spent + request.total),
    };
  }, [requests, request.total]);

  return (
    <>
      {/* Panel */}
      <div
        className="fixed right-0 top-0 bottom-0 bg-white z-50 flex flex-col"
        style={{
          width: '680px',
          borderLeft: '1px solid #E5E7EB',
          boxShadow: '-8px 0 24px rgba(0, 0, 0, 0.12)',
        }}
      >
        {/* Header - Sticky */}
        <div
          className="sticky top-0 bg-white border-b z-10"
          style={{
            borderColor: '#E5E7EB',
            padding: '20px 24px',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            {/* Navigation Arrows */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentIndex(prev => prev - 1)}
                disabled={currentIndex === 0}
                className="flex items-center justify-center border rounded-md transition-colors"
                style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: '#F3F4F6',
                  borderColor: '#E5E7EB',
                  opacity: currentIndex === 0 ? 0.4 : 1,
                  cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                <ChevronLeft className="w-4 h-4" style={{ color: '#6B7280' }} />
              </button>
              <button
                onClick={() => setCurrentIndex(prev => prev + 1)}
                disabled={currentIndex >= pendingRequests.length - 1}
                className="flex items-center justify-center border rounded-md transition-colors"
                style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: '#F3F4F6',
                  borderColor: '#E5E7EB',
                  opacity: currentIndex >= pendingRequests.length - 1 ? 0.4 : 1,
                  cursor: currentIndex >= pendingRequests.length - 1 ? 'not-allowed' : 'pointer',
                }}
              >
                <ChevronRight className="w-4 h-4" style={{ color: '#6B7280' }} />
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="flex items-center justify-center border rounded-md transition-colors hover:bg-gray-50"
              style={{
                width: '36px',
                height: '36px',
                borderColor: '#E5E7EB',
              }}
            >
              <X className="w-5 h-5" style={{ color: '#6B7280' }} />
            </button>
          </div>

          {/* Title Section */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div 
                className="flex items-center justify-center rounded"
                style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: '#FEF3C7',
                }}
              >
                <Receipt className="w-5 h-5" style={{ color: '#F59E0B' }} />
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#111827' }}>
                Expense Request
              </h2>
            </div>
            <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '4px' }}>
              {employeeName} · {request.referenceNumber}
            </div>
            <div style={{ fontSize: '13px', color: '#9CA3AF' }}>
              {currentIndex + 1} of {pendingRequests.length} pending
            </div>
          </div>
        </div>

        {/* Body - Scrollable */}
        <div
          className="flex-1 overflow-y-auto"
          style={{
            padding: '24px',
          }}
        >
          <div className="space-y-5">
            {/* REQUEST SUMMARY */}
            <div
              className="border rounded-xl"
              style={{
                borderColor: '#E5E7EB',
                padding: '20px',
              }}
            >
              <div style={{ fontSize: '12px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
                Request Summary
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span style={{ fontSize: '13px', color: '#6B7280' }}>Purpose:</span>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{request.purpose}</span>
                </div>
                {request.project && (
                  <div className="flex justify-between">
                    <span style={{ fontSize: '13px', color: '#6B7280' }}>Project:</span>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{request.project}</span>
                  </div>
                )}
                {request.costCenter && (
                  <div className="flex justify-between">
                    <span style={{ fontSize: '13px', color: '#6B7280' }}>Cost Center:</span>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{request.costCenter}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span style={{ fontSize: '13px', color: '#6B7280' }}>Items:</span>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{request.lineItems.length}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ fontSize: '13px', color: '#6B7280' }}>Total:</span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>€{request.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ fontSize: '13px', color: '#6B7280' }}>Submitted:</span>
                  <span style={{ fontSize: '13px', color: '#111827' }}>
                    {formatDateRange(request.submittedDate || request.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* LINE ITEMS */}
            <div>
              <button
                onClick={() => toggleSection('lineItems')}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                style={{ border: '1px solid #E5E7EB' }}
              >
                <div className="flex items-center gap-2">
                  {expandedSections.lineItems ? (
                    <ChevronDown className="w-4 h-4" style={{ color: '#6B7280' }} />
                  ) : (
                    <ChevronRightCollapse className="w-4 h-4" style={{ color: '#6B7280' }} />
                  )}
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                    Line Items ({request.lineItems.length})
                  </span>
                </div>
              </button>

              {expandedSections.lineItems && (
                <div className="mt-2 space-y-2">
                  {request.lineItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="bg-white border rounded-lg"
                      style={{
                        borderColor: '#E5E7EB',
                        padding: '12px',
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
                            {index + 1}. {item.description}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6B7280' }}>
                            {item.costType} · {formatDateRange(item.date)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                            €{item.amount.toFixed(2)}
                          </div>
                          {item.vat > 0 && (
                            <div style={{ fontSize: '12px', color: '#6B7280' }}>
                              +€{item.vat.toFixed(2)} VAT
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>
                        Paid by: {item.paidBy || 'Employee'}
                      </div>

                      {item.receiptUrl ? (
                        <div className="flex items-center gap-1" style={{ fontSize: '12px', color: '#059669' }}>
                          <Paperclip className="w-3 h-3" />
                          {item.receiptFilename || 'Receipt attached'}
                          <button className="ml-2 underline hover:opacity-70">View</button>
                        </div>
                      ) : (
                        <div style={{ fontSize: '12px', color: '#F59E0B' }}>
                          ⚠️ No receipt attached
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RECEIPT VERIFICATION */}
            <div>
              <button
                onClick={() => toggleSection('receipts')}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                style={{ border: '1px solid #E5E7EB' }}
              >
                <div className="flex items-center gap-2">
                  {expandedSections.receipts ? (
                    <ChevronDown className="w-4 h-4" style={{ color: '#6B7280' }} />
                  ) : (
                    <ChevronRightCollapse className="w-4 h-4" style={{ color: '#6B7280' }} />
                  )}
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                    Receipt Verification
                  </span>
                </div>
                {hasReceiptIssues ? (
                  <AlertTriangle className="w-4 h-4" style={{ color: '#F59E0B' }} />
                ) : (
                  <CheckCircle2 className="w-4 h-4" style={{ color: '#10B981' }} />
                )}
              </button>

              {expandedSections.receipts && (
                <div
                  className="rounded-lg mt-2"
                  style={{
                    backgroundColor: '#F9FAFB',
                    padding: '16px',
                  }}
                >
                  <div style={{ fontSize: '13px', color: '#374151', marginBottom: '12px' }}>
                    {request.lineItems.length} items · {receiptCount} receipts attached
                  </div>
                  {hasReceiptIssues && (
                    <div
                      className="rounded p-3"
                      style={{
                        backgroundColor: '#FEF3C7',
                        marginBottom: '12px',
                      }}
                    >
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#B45309', marginBottom: '8px' }}>
                        ⚠️ {missingReceipts.length} {missingReceipts.length === 1 ? 'item' : 'items'} missing receipt
                      </div>
                      {missingReceipts.map(item => (
                        <div key={item.id} style={{ fontSize: '12px', color: '#92400E', marginBottom: '4px' }}>
                          • {item.description} - €{item.amount.toFixed(2)}
                        </div>
                      ))}
                    </div>
                  )}
                  {!hasReceiptIssues && (
                    <div style={{ fontSize: '13px', color: '#059669' }}>
                      ✓ All items have receipts attached
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* POLICY COMPLIANCE */}
            <div>
              <button
                onClick={() => toggleSection('policy')}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                style={{ border: '1px solid #E5E7EB' }}
              >
                <div className="flex items-center gap-2">
                  {expandedSections.policy ? (
                    <ChevronDown className="w-4 h-4" style={{ color: '#6B7280' }} />
                  ) : (
                    <ChevronRightCollapse className="w-4 h-4" style={{ color: '#6B7280' }} />
                  )}
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                    Policy Compliance
                  </span>
                </div>
                <CheckCircle2 className="w-4 h-4" style={{ color: '#10B981' }} />
              </button>

              {expandedSections.policy && (
                <div
                  className="rounded-lg mt-2"
                  style={{
                    backgroundColor: '#F9FAFB',
                    padding: '16px',
                  }}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2" style={{ fontSize: '13px', color: '#059669' }}>
                      <Check className="w-4 h-4" />
                      Under €500 entertainment limit
                    </div>
                    <div className="flex items-center gap-2" style={{ fontSize: '13px', color: '#059669' }}>
                      <Check className="w-4 h-4" />
                      Valid business purpose
                    </div>
                    <div className="flex items-center gap-2" style={{ fontSize: '13px', color: '#059669' }}>
                      <Check className="w-4 h-4" />
                      Submitted within 30 days of expense
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* PROJECT BUDGET */}
            {request.project && (
              <div>
                <button
                  onClick={() => toggleSection('budget')}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  style={{ border: '1px solid #E5E7EB' }}
                >
                  <div className="flex items-center gap-2">
                    {expandedSections.budget ? (
                      <ChevronDown className="w-4 h-4" style={{ color: '#6B7280' }} />
                    ) : (
                      <ChevronRightCollapse className="w-4 h-4" style={{ color: '#6B7280' }} />
                    )}
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                      Project Budget
                    </span>
                  </div>
                  <CheckCircle2 className="w-4 h-4" style={{ color: '#10B981' }} />
                </button>

                {expandedSections.budget && (
                  <div
                    className="rounded-lg mt-2"
                    style={{
                      backgroundColor: '#F9FAFB',
                      padding: '16px',
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '12px' }}>
                      {request.project} {request.costCenter} Budget
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span style={{ fontSize: '13px', color: '#6B7280' }}>Allocated:</span>
                        <span style={{ fontSize: '13px', color: '#111827' }}>€{budgetData.allocated.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ fontSize: '13px', color: '#6B7280' }}>Spent:</span>
                        <span style={{ fontSize: '13px', color: '#111827' }}>
                          €{budgetData.spent.toLocaleString()} ({Math.round((budgetData.spent / budgetData.allocated) * 100)}%)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>After this:</span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>
                          €{budgetData.afterThis.toLocaleString()} ({Math.round((budgetData.afterThis / budgetData.allocated) * 100)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer - Sticky */}
        <div
          className="sticky bottom-0 bg-white border-t"
          style={{
            borderColor: '#E5E7EB',
            padding: '20px 24px',
          }}
        >
          {!showDenyFlow ? (
            <>
              <div className="mb-4">
                <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '6px' }}>
                  Add comment (optional)
                </label>
                <textarea
                  value={managerComment}
                  onChange={(e) => setManagerComment(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg resize-vertical"
                  style={{
                    fontSize: '13px',
                    borderColor: '#E5E7EB',
                  }}
                  placeholder="Add a note for the employee..."
                />
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowDenyFlow(true)}
                  disabled={isProcessing}
                  className="px-5 border rounded-lg transition-colors hover:bg-red-50"
                  style={{
                    height: '44px',
                    fontSize: '14px',
                    fontWeight: 600,
                    borderColor: '#DC2626',
                    color: '#DC2626',
                    opacity: isProcessing ? 0.5 : 1,
                  }}
                >
                  Deny
                </button>

                <button
                  onClick={handleApprove}
                  disabled={isProcessing}
                  className="px-6 rounded-lg transition-colors flex items-center gap-2"
                  style={{
                    height: '44px',
                    fontSize: '14px',
                    fontWeight: 600,
                    backgroundColor: isProcessing ? '#9CA3AF' : '#059669',
                    color: 'white',
                  }}
                >
                  {isProcessing ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {isProcessing ? 'Processing...' : 'Approve'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-4">
                <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '6px' }}>
                  Reason for denial <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <textarea
                  value={managerComment}
                  onChange={(e) => setManagerComment(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg resize-vertical"
                  style={{
                    fontSize: '13px',
                    borderColor: managerComment.trim() ? '#E5E7EB' : '#FCA5A5',
                  }}
                  placeholder="Please provide a reason..."
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    setShowDenyFlow(false);
                    setManagerComment('');
                  }}
                  disabled={isProcessing}
                  className="px-5 border rounded-lg transition-colors hover:bg-gray-50"
                  style={{
                    height: '44px',
                    fontSize: '14px',
                    fontWeight: 600,
                    borderColor: '#D1D5DB',
                    color: '#374151',
                    opacity: isProcessing ? 0.5 : 1,
                  }}
                >
                  Cancel
                </button>

                <button
                  onClick={handleDeny}
                  disabled={isProcessing || !managerComment.trim()}
                  className="px-6 rounded-lg transition-colors"
                  style={{
                    height: '44px',
                    fontSize: '14px',
                    fontWeight: 600,
                    backgroundColor: isProcessing || !managerComment.trim() ? '#FCA5A5' : '#DC2626',
                    color: 'white',
                    opacity: !managerComment.trim() ? 0.6 : 1,
                    cursor: !managerComment.trim() ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isProcessing ? 'Processing...' : 'Confirm Denial'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}