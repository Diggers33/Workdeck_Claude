import React, { useState, useMemo, useLayoutEffect } from 'react';
import { 
  ArrowLeft, 
  Receipt, 
  Trash2, 
  Plus, 
  Upload, 
  X, 
  Eye, 
  Paperclip,
  Circle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Settings,
  FileText,
  Printer,
  Download
} from 'lucide-react';
import { useSpending, SpendingRequest } from '../../contexts/SpendingContext';
import { ExpenseLineItem } from './ExpenseLineItem';

interface ExpenseDetailViewProps {
  requestId: string;
  onBack: () => void;
}

interface LineItem {
  id: string;
  description: string;
  costType: string;
  amount: number;
  vat: number;
  currency: string;
  date: string;
  paidBy: 'employee' | 'company';
  billable: boolean;
  receipt?: {
    name: string;
    url: string;
  };
}

export function ExpenseDetailView({ requestId, onBack }: ExpenseDetailViewProps) {
  const { requests, updateRequest } = useSpending();
  const expense = requests.find(r => r.id === requestId && r.type === 'Expense');

  // Scroll to top when component mounts
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Form state
  const [purpose, setPurpose] = useState(expense?.purpose || '');
  const [project, setProject] = useState(expense?.project || '');
  const [costCenter, setCostCenter] = useState(expense?.costCenter || '');
  const [activity, setActivity] = useState('');
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const isReadOnly = expense?.status !== 'Draft';
  const isDenied = expense?.status === 'Denied';

  // Calculate totals
  const totals = useMemo(() => {
    const byCurrency: Record<string, {
      subtotal: number;
      vat: number;
      total: number;
      paidByEmployee: number;
      paidByCompany: number;
      billable: number;
      itemCount: number;
    }> = {};

    lineItems.forEach(item => {
      if (!byCurrency[item.currency]) {
        byCurrency[item.currency] = {
          subtotal: 0,
          vat: 0,
          total: 0,
          paidByEmployee: 0,
          paidByCompany: 0,
          billable: 0,
          itemCount: 0
        };
      }

      const itemTotal = item.amount + item.vat;
      byCurrency[item.currency].subtotal += item.amount;
      byCurrency[item.currency].vat += item.vat;
      byCurrency[item.currency].total += itemTotal;
      byCurrency[item.currency].itemCount += 1;

      if (item.paidBy === 'employee') {
        byCurrency[item.currency].paidByEmployee += itemTotal;
      } else {
        byCurrency[item.currency].paidByCompany += itemTotal;
      }

      if (item.billable) {
        byCurrency[item.currency].billable += itemTotal;
      }
    });

    return byCurrency;
  }, [lineItems]);

  // Add new line item
  const addLineItem = () => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      description: '',
      costType: '',
      amount: 0,
      vat: 0,
      currency: 'EUR',
      date: new Date().toISOString().split('T')[0],
      paidBy: 'employee',
      billable: false,
    };
    setLineItems([...lineItems, newItem]);
  };

  // Update line item
  const updateLineItem = (id: string, updates: Partial<LineItem>) => {
    setLineItems(lineItems.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  // Delete line item
  const deleteLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== id));
    }
  };

  // Validate form
  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!purpose.trim()) {
      newErrors.purpose = 'Purpose is required';
    }

    if (lineItems.length === 0) {
      newErrors.lineItems = 'At least one line item is required';
    }

    lineItems.forEach((item, index) => {
      if (!item.description.trim()) {
        newErrors[`item-${item.id}-description`] = `Item ${index + 1}: Description is required`;
      }
      if (!item.costType) {
        newErrors[`item-${item.id}-costType`] = `Item ${index + 1}: Cost type is required`;
      }
      if (item.amount <= 0) {
        newErrors[`item-${item.id}-amount`] = `Item ${index + 1}: Amount must be greater than 0`;
      }
      if (!item.date) {
        newErrors[`item-${item.id}-date`] = `Item ${index + 1}: Date is required`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save draft
  const handleSaveDraft = () => {
    if (expense) {
      updateRequest(expense.id, { purpose });
    }
  };

  // Submit for approval
  const handleSubmit = () => {
    if (validate()) {
      setShowSubmitModal(true);
    }
  };

  // Confirm submit
  const confirmSubmit = () => {
    if (expense) {
      updateRequest(expense.id, { 
        status: 'Pending',
        purpose,
        updatedAt: new Date().toISOString()
      });
      setShowSubmitModal(false);
      onBack();
    }
  };

  // Get status badge
  const getStatusBadge = () => {
    if (!expense) return null;

    const badges = {
      'Draft': { icon: Circle, text: 'Draft', bg: '#F3F4F6', color: '#6B7280' },
      'Pending': { icon: Circle, text: 'Pending', bg: '#FEF3C7', color: '#B45309' },
      'Approved': { icon: CheckCircle2, text: 'Approved', bg: '#ECFDF5', color: '#059669' },
      'Denied': { icon: XCircle, text: 'Denied', bg: '#FEE2E2', color: '#DC2626' },
      'Processing': { icon: Settings, text: 'Processing', bg: '#EFF6FF', color: '#2563EB' },
      'Finalized': { icon: CheckCircle2, text: 'Finalized', bg: '#F0FDF4', color: '#16A34A' },
    };

    const badge = badges[expense.status as keyof typeof badges];
    if (!badge) return null;

    const Icon = badge.icon;

    return (
      <div 
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md"
        style={{ backgroundColor: badge.bg }}
      >
        <Icon className="w-3 h-3" style={{ color: badge.color }} />
        <span style={{ fontSize: '12px', fontWeight: 500, color: badge.color }}>
          {badge.text}
        </span>
      </div>
    );
  };

  // Missing receipts count
  const missingReceiptsCount = lineItems.filter(item => item.amount > 25 && !item.receipt).length;

  if (!expense) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F9FAFB' }}>
        <div className="text-center">
          <p style={{ fontSize: '14px', color: '#6B7280' }}>Expense not found</p>
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 rounded-lg hover:opacity-70 transition-opacity"
            style={{ backgroundColor: '#2563EB', color: 'white', fontSize: '14px', fontWeight: 500 }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9FAFB' }}>
      {/* Sticky Header */}
      <div 
        className="bg-white border-b sticky top-0 z-10"
        style={{ borderColor: '#E5E7EB', padding: '16px 24px' }}
      >
        <div className="flex items-center justify-between">
          {/* Left side */}
          <div className="flex flex-col">
            <button
              onClick={onBack}
              className="flex items-center gap-2 hover:underline transition-all"
              style={{ color: '#6B7280', fontSize: '13px', marginBottom: '12px' }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to My Requests
            </button>
            
            <div className="flex items-center gap-3" style={{ marginBottom: '6px' }}>
              <Receipt className="w-5 h-5" style={{ color: '#F59E0B' }} />
              <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#111827' }}>
                {expense.referenceNumber}
              </h1>
              {getStatusBadge()}
            </div>
            
            <p style={{ fontSize: '14px', color: '#6B7280' }}>
              {purpose || 'No purpose specified'}
            </p>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-3">
            {expense.status === 'Draft' && (
              <>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2 rounded-lg transition-all hover:bg-red-50"
                  style={{ color: '#DC2626', fontSize: '14px', fontWeight: 500 }}
                >
                  Delete Draft
                </button>
                <button
                  onClick={handleSaveDraft}
                  className="px-4 py-2 border rounded-lg transition-all hover:bg-gray-50"
                  style={{ borderColor: '#E5E7EB', color: '#374151', fontSize: '14px', fontWeight: 500 }}
                >
                  Save Draft
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 rounded-lg transition-all hover:opacity-90"
                  style={{ backgroundColor: '#2563EB', color: 'white', fontSize: '14px', fontWeight: 500 }}
                >
                  Submit
                </button>
              </>
            )}

            {expense.status === 'Pending' && (
              <button
                onClick={() => {
                  updateRequest(expense.id, { status: 'Draft' });
                }}
                className="px-4 py-2 rounded-lg transition-all hover:bg-gray-50"
                style={{ color: '#374151', fontSize: '14px', fontWeight: 500 }}
              >
                Withdraw
              </button>
            )}

            {(expense.status === 'Approved' || expense.status === 'Processing' || expense.status === 'Finalized') && (
              <>
                <button
                  className="px-4 py-2 border rounded-lg transition-all hover:bg-gray-50 flex items-center gap-2"
                  style={{ borderColor: '#E5E7EB', color: '#374151', fontSize: '14px', fontWeight: 500 }}
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
                <button
                  className="px-4 py-2 border rounded-lg transition-all hover:bg-gray-50 flex items-center gap-2"
                  style={{ borderColor: '#E5E7EB', color: '#374151', fontSize: '14px', fontWeight: 500 }}
                >
                  <Download className="w-4 h-4" />
                  Export PDF
                </button>
              </>
            )}

            {expense.status === 'Denied' && (
              <>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2 rounded-lg transition-all hover:bg-red-50"
                  style={{ color: '#DC2626', fontSize: '14px', fontWeight: 500 }}
                >
                  Delete
                </button>
                <button
                  onClick={() => {
                    updateRequest(expense.id, { status: 'Draft' });
                  }}
                  className="px-4 py-2 rounded-lg transition-all hover:opacity-90"
                  style={{ backgroundColor: '#2563EB', color: 'white', fontSize: '14px', fontWeight: 500 }}
                >
                  Edit & Resubmit
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px' }}>
        {/* Denied Banner */}
        {isDenied && (
          <div 
            className="mb-6 rounded-lg"
            style={{
              backgroundColor: '#FEE2E2',
              border: '1px solid #FECACA',
              borderLeft: '4px solid #DC2626',
              padding: '16px 20px'
            }}
          >
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 mt-0.5" style={{ color: '#DC2626' }} />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#DC2626', marginBottom: '4px' }}>
                  Request Denied
                </div>
                <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>
                  Denied by Sarah Manager on Nov 28, 2024
                </div>
                <div style={{ fontSize: '14px', color: '#374151', fontStyle: 'italic' }}>
                  "Missing receipts for items over €50. Please attach receipts and resubmit."
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section 1: Basic Information */}
        <div className="bg-white border rounded-xl mb-6" style={{ borderColor: '#E5E7EB', padding: '24px' }}>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827', paddingBottom: '16px', borderBottom: '1px solid #E5E7EB', marginBottom: '20px' }}>
            Basic Information
          </div>

          {/* Purpose */}
          <div className="mb-5">
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              PURPOSE <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              disabled={isReadOnly}
              placeholder="What is this expense for?"
              rows={2}
              className="w-full px-3 py-2 border rounded-lg resize-none"
              style={{
                fontSize: '14px',
                borderColor: errors.purpose ? '#DC2626' : '#E5E7EB',
                boxShadow: errors.purpose ? '0 0 0 3px rgba(220,38,38,0.1)' : undefined,
                backgroundColor: isReadOnly ? '#F9FAFB' : 'white'
              }}
            />
            {!isReadOnly && (
              <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>
                Brief description of what this expense is for
              </div>
            )}
            {errors.purpose && (
              <div style={{ fontSize: '12px', color: '#DC2626', marginTop: '4px' }}>
                {errors.purpose}
              </div>
            )}
          </div>

          {/* Project and Cost Center */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                PROJECT
              </label>
              {isReadOnly ? (
                <div style={{ padding: '12px 0', fontSize: '14px', color: '#111827' }}>
                  {project || '—'}
                </div>
              ) : (
                <select
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ fontSize: '14px', borderColor: '#E5E7EB', height: '44px' }}
                >
                  <option value="">Select project...</option>
                  <option value="BIOGEMSE">BIOGEMSE</option>
                  <option value="SKYTECH">SKYTECH</option>
                  <option value="NEXUS">NEXUS</option>
                </select>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                COST CENTER
              </label>
              {isReadOnly ? (
                <div style={{ padding: '12px 0', fontSize: '14px', color: '#111827' }}>
                  {costCenter || '—'}
                </div>
              ) : (
                <select
                  value={costCenter}
                  onChange={(e) => setCostCenter(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ fontSize: '14px', borderColor: '#E5E7EB', height: '44px' }}
                >
                  <option value="">Select cost center...</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Sales">Sales</option>
                  <option value="Operations">Operations</option>
                </select>
              )}
            </div>
          </div>

          {/* Activity */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              ACTIVITY (optional)
            </label>
            {isReadOnly ? (
              <div style={{ padding: '12px 0', fontSize: '14px', color: '#111827' }}>
                {activity || '—'}
              </div>
            ) : (
              <select
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                style={{ fontSize: '14px', borderColor: '#E5E7EB', height: '44px' }}
              >
                <option value="">Select activity...</option>
                <option value="Client Meeting">Client Meeting</option>
                <option value="Team Event">Team Event</option>
                <option value="Conference">Conference</option>
              </select>
            )}
          </div>
        </div>

        {/* Section 2: Line Items */}
        <div className="bg-white border rounded-xl mb-6" style={{ borderColor: '#E5E7EB', padding: '24px' }}>
          <div className="flex items-center justify-between" style={{ paddingBottom: '16px', borderBottom: '1px solid #E5E7EB', marginBottom: '20px' }}>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>
              Line Items ({lineItems.length})
            </div>
            {!isReadOnly && (
              <button
                onClick={addLineItem}
                className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50 transition-all"
                style={{ borderColor: '#E5E7EB', fontSize: '14px', fontWeight: 500, color: '#374151', height: '36px' }}
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            )}
          </div>

          {lineItems.map((item, index) => (
            <ExpenseLineItem
              key={item.id}
              item={item}
              index={index}
              isExpanded={expandedItemId === item.id}
              isReadOnly={isReadOnly}
              onToggle={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)}
              onUpdate={(updates) => updateLineItem(item.id, updates)}
              onDelete={() => deleteLineItem(item.id)}
              canDelete={lineItems.length > 1}
            />
          ))}
        </div>

        {/* Section 3: Totals */}
        <div className="bg-white border rounded-xl mb-6" style={{ borderColor: '#E5E7EB', padding: '24px' }}>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827', paddingBottom: '16px', borderBottom: '1px solid #E5E7EB', marginBottom: '20px' }}>
            Totals
          </div>

          {Object.entries(totals).map(([currency, data]) => (
            <div 
              key={currency}
              className="rounded-lg mb-4 last:mb-0"
              style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', padding: '20px' }}
            >
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', paddingBottom: '12px', borderBottom: '1px solid #D1FAE5', marginBottom: '12px' }}>
                {currency}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between" style={{ fontSize: '14px' }}>
                  <span style={{ color: '#374151' }}>Subtotal ({data.itemCount} items)</span>
                  <span style={{ color: '#111827' }}>
                    {currency === 'EUR' ? '€' : currency === 'USD' ? '$' : '£'}{data.subtotal.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between" style={{ fontSize: '14px' }}>
                  <span style={{ color: '#374151' }}>VAT</span>
                  <span style={{ color: '#111827' }}>
                    {currency === 'EUR' ? '€' : currency === 'USD' ? '$' : '£'}{data.vat.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2" style={{ fontSize: '16px', borderTop: '1px solid #D1FAE5' }}>
                  <span style={{ fontWeight: 600, color: '#111827' }}>Total</span>
                  <span style={{ fontWeight: 600, color: '#059669' }}>
                    {currency === 'EUR' ? '€' : currency === 'USD' ? '$' : '£'}{data.total.toFixed(2)}
                  </span>
                </div>

                <div className="pt-3 mt-3 space-y-1" style={{ borderTop: '1px solid #D1FAE5' }}>
                  <div className="flex items-center justify-between" style={{ fontSize: '14px' }}>
                    <span style={{ color: '#374151' }}>Paid by employee</span>
                    <span style={{ color: '#111827' }}>
                      {currency === 'EUR' ? '€' : currency === 'USD' ? '$' : '£'}{data.paidByEmployee.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between" style={{ fontSize: '14px' }}>
                    <span style={{ color: '#374151' }}>Paid by company</span>
                    <span style={{ color: '#111827' }}>
                      {currency === 'EUR' ? '€' : currency === 'USD' ? '$' : '£'}{data.paidByCompany.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between" style={{ fontSize: '14px' }}>
                    <span style={{ color: '#374151' }}>Billable amount</span>
                    <span style={{ color: '#111827' }}>
                      {currency === 'EUR' ? '€' : currency === 'USD' ? '$' : '£'}{data.billable.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Section 4: Additional Notes */}
        <div className="bg-white border rounded-xl mb-6" style={{ borderColor: '#E5E7EB', padding: '24px' }}>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827', paddingBottom: '16px', borderBottom: '1px solid #E5E7EB', marginBottom: '20px' }}>
            Additional Notes
          </div>

          {isReadOnly ? (
            <div style={{ fontSize: '14px', color: '#374151' }}>
              {notes || <span style={{ color: '#9CA3AF' }}>No additional notes</span>}
            </div>
          ) : (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional context for the approver..."
              rows={3}
              className="w-full px-3 py-2 border rounded-lg resize-none"
              style={{ fontSize: '14px', borderColor: '#E5E7EB' }}
            />
          )}
        </div>

        {/* Section 5: Activity (for non-draft) */}
        {!isReadOnly && (
          <div className="bg-white border rounded-xl" style={{ borderColor: '#E5E7EB', padding: '24px' }}>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827', paddingBottom: '16px', borderBottom: '1px solid #E5E7EB', marginBottom: '20px' }}>
              Activity
            </div>

            <div className="space-y-4">
              {expense.status === 'Approved' && (
                <div className="flex gap-3">
                  <div 
                    className="flex items-center justify-center rounded-full flex-shrink-0"
                    style={{ width: '32px', height: '32px', backgroundColor: '#DBEAFE', color: '#2563EB' }}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', color: '#111827' }}>
                      Sarah Manager approved this expense
                    </div>
                    <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>
                      Nov 28, 2024 at 2:30 PM
                    </div>
                    <div style={{ fontSize: '13px', color: '#374151', fontStyle: 'italic', marginTop: '6px' }}>
                      "Approved. Please submit receipts digitally next time."
                    </div>
                  </div>
                </div>
              )}

              {expense.status === 'Pending' && (
                <div className="flex gap-3">
                  <div 
                    className="flex items-center justify-center rounded-full flex-shrink-0"
                    style={{ width: '32px', height: '32px', backgroundColor: '#F3F4F6', color: '#6B7280' }}
                  >
                    <Circle className="w-4 h-4" />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', color: '#111827' }}>
                      You submitted this expense
                    </div>
                    <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>
                      Nov 25, 2024 at 10:15 AM
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <div 
                  className="flex items-center justify-center rounded-full flex-shrink-0"
                  style={{ width: '32px', height: '32px', backgroundColor: '#F3F4F6', color: '#6B7280' }}
                >
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: '#111827' }}>
                    You created this expense
                  </div>
                  <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>
                    Nov 24, 2024 at 4:45 PM
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ padding: '20px' }}>
          <div className="bg-white rounded-xl" style={{ width: '100%', maxWidth: '480px', padding: '24px' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827' }}>
                Submit Expense?
              </h3>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="hover:bg-gray-100 rounded-lg p-1 transition-colors"
              >
                <X className="w-5 h-5" style={{ color: '#6B7280' }} />
              </button>
            </div>

            <div className="mb-6">
              <p style={{ fontSize: '14px', color: '#374151', marginBottom: '16px' }}>
                You're submitting:
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
                  {expense.referenceNumber}
                </div>
                <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>
                  {purpose}
                </div>
                <div style={{ fontSize: '13px', color: '#6B7280' }}>
                  {lineItems.length} items · €{Object.values(totals).reduce((sum, t) => sum + t.total, 0).toFixed(2)}
                </div>
              </div>

              <p style={{ fontSize: '14px', color: '#374151', marginBottom: '12px' }}>
                This will be sent to Sarah Manager for approval.
              </p>

              {missingReceiptsCount > 0 && (
                <div className="flex items-start gap-2 p-3 rounded-lg" style={{ backgroundColor: '#FEF3C7' }}>
                  <AlertCircle className="w-4 h-4 mt-0.5" style={{ color: '#B45309' }} />
                  <span style={{ fontSize: '13px', color: '#92400E' }}>
                    {missingReceiptsCount} item{missingReceiptsCount > 1 ? 's are' : ' is'} missing a receipt
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-all"
                style={{ borderColor: '#E5E7EB', fontSize: '14px', fontWeight: 500, color: '#374151' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmSubmit}
                className="flex-1 px-4 py-2 rounded-lg hover:opacity-90 transition-all"
                style={{ backgroundColor: '#2563EB', color: 'white', fontSize: '14px', fontWeight: 500 }}
              >
                Submit for Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ padding: '20px' }}>
          <div className="bg-white rounded-xl" style={{ width: '100%', maxWidth: '420px', padding: '24px' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827' }}>
                Delete Expense?
              </h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="hover:bg-gray-100 rounded-lg p-1 transition-colors"
              >
                <X className="w-5 h-5" style={{ color: '#6B7280' }} />
              </button>
            </div>

            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>
              Are you sure you want to delete this expense? This action cannot be undone.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-all"
                style={{ borderColor: '#E5E7EB', fontSize: '14px', fontWeight: 500, color: '#374151' }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Delete logic here
                  setShowDeleteModal(false);
                  onBack();
                }}
                className="flex-1 px-4 py-2 rounded-lg hover:opacity-90 transition-all"
                style={{ backgroundColor: '#DC2626', color: 'white', fontSize: '14px', fontWeight: 500 }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Line Item Card Component
interface LineItemCardProps {
  item: LineItem;
  index: number;
  isReadOnly: boolean;
  onUpdate: (updates: Partial<LineItem>) => void;
  onDelete: () => void;
  canDelete: boolean;
  errors: Record<string, string>;
}

function LineItemCard({ item, index, isReadOnly, onUpdate, onDelete, canDelete, errors }: LineItemCardProps) {
  const itemTotal = item.amount + item.vat;
  const showReceiptWarning = item.amount > 25 && !item.receipt && !isReadOnly;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpdate({ receipt: { name: file.name, url: URL.createObjectURL(file) } });
    }
  };

  const costTypes = [
    'Meals & Entertainment',
    'Travel',
    'Accommodation',
    'Office Supplies',
    'Training',
    'Communication',
    'Professional Services',
    'Other'
  ];

  const currencies = ['EUR', 'USD', 'GBP', 'CHF'];

  return (
    <div 
      className="rounded-lg mb-4 last:mb-0"
      style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', padding: '20px' }}
    >
      {/* Item Header */}
      <div className="flex items-center justify-between mb-4">
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          ITEM {index + 1}
        </div>
        {!isReadOnly && canDelete && (
          <button
            onClick={onDelete}
            className="p-2 rounded-lg hover:bg-red-50 transition-all"
            style={{ color: '#6B7280' }}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Description and Cost Type */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
            DESCRIPTION <span style={{ color: '#DC2626' }}>*</span>
          </label>
          {isReadOnly ? (
            <div style={{ padding: '12px 0', fontSize: '14px', color: '#111827' }}>
              {item.description}
            </div>
          ) : (
            <>
              <input
                type="text"
                value={item.description}
                onChange={(e) => onUpdate({ description: e.target.value })}
                placeholder="What did you pay for?"
                className="w-full px-3 py-2 border rounded-lg"
                style={{
                  fontSize: '14px',
                  borderColor: errors[`item-${item.id}-description`] ? '#DC2626' : '#E5E7EB',
                  height: '44px'
                }}
              />
              {errors[`item-${item.id}-description`] && (
                <div style={{ fontSize: '12px', color: '#DC2626', marginTop: '4px' }}>
                  Description is required
                </div>
              )}
            </>
          )}
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
            COST TYPE <span style={{ color: '#DC2626' }}>*</span>
          </label>
          {isReadOnly ? (
            <div style={{ padding: '12px 0', fontSize: '14px', color: '#111827' }}>
              {item.costType}
            </div>
          ) : (
            <>
              <select
                value={item.costType}
                onChange={(e) => onUpdate({ costType: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                style={{
                  fontSize: '14px',
                  borderColor: errors[`item-${item.id}-costType`] ? '#DC2626' : '#E5E7EB',
                  height: '44px'
                }}
              >
                <option value="">Select type...</option>
                {costTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {errors[`item-${item.id}-costType`] && (
                <div style={{ fontSize: '12px', color: '#DC2626', marginTop: '4px' }}>
                  Cost type is required
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Amount, VAT, Currency, Date */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
            AMOUNT <span style={{ color: '#DC2626' }}>*</span>
          </label>
          {isReadOnly ? (
            <div style={{ padding: '12px 0', fontSize: '14px', color: '#111827' }}>
              {item.amount.toFixed(2)}
            </div>
          ) : (
            <input
              type="number"
              value={item.amount}
              onChange={(e) => onUpdate({ amount: parseFloat(e.target.value) || 0 })}
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border rounded-lg"
              style={{
                fontSize: '14px',
                borderColor: errors[`item-${item.id}-amount`] ? '#DC2626' : '#E5E7EB',
                height: '44px'
              }}
            />
          )}
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
            VAT
          </label>
          {isReadOnly ? (
            <div style={{ padding: '12px 0', fontSize: '14px', color: '#111827' }}>
              {item.vat.toFixed(2)}
            </div>
          ) : (
            <input
              type="number"
              value={item.vat}
              onChange={(e) => onUpdate({ vat: parseFloat(e.target.value) || 0 })}
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border rounded-lg"
              style={{ fontSize: '14px', borderColor: '#E5E7EB', height: '44px' }}
            />
          )}
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
            CURRENCY <span style={{ color: '#DC2626' }}>*</span>
          </label>
          {isReadOnly ? (
            <div style={{ padding: '12px 0', fontSize: '14px', color: '#111827' }}>
              {item.currency}
            </div>
          ) : (
            <select
              value={item.currency}
              onChange={(e) => onUpdate({ currency: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              style={{ fontSize: '14px', borderColor: '#E5E7EB', height: '44px' }}
            >
              {currencies.map(curr => (
                <option key={curr} value={curr}>{curr}</option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
            DATE <span style={{ color: '#DC2626' }}>*</span>
          </label>
          {isReadOnly ? (
            <div style={{ padding: '12px 0', fontSize: '14px', color: '#111827' }}>
              {new Date(item.date).toLocaleDateString()}
            </div>
          ) : (
            <input
              type="date"
              value={item.date}
              onChange={(e) => onUpdate({ date: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              style={{
                fontSize: '14px',
                borderColor: errors[`item-${item.id}-date`] ? '#DC2626' : '#E5E7EB',
                height: '44px'
              }}
            />
          )}
        </div>
      </div>

      {/* Paid By and Billable */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
            PAID BY <span style={{ color: '#DC2626' }}>*</span>
          </label>
          {isReadOnly ? (
            <div style={{ padding: '12px 0', fontSize: '14px', color: '#111827', textTransform: 'capitalize' }}>
              {item.paidBy}
            </div>
          ) : (
            <div className="flex items-center gap-6" style={{ paddingTop: '8px' }}>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={item.paidBy === 'employee'}
                  onChange={() => onUpdate({ paidBy: 'employee' })}
                  className="w-4 h-4"
                  style={{ accentColor: '#2563EB' }}
                />
                <span style={{ fontSize: '14px', color: '#374151' }}>Employee</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={item.paidBy === 'company'}
                  onChange={() => onUpdate({ paidBy: 'company' })}
                  className="w-4 h-4"
                  style={{ accentColor: '#2563EB' }}
                />
                <span style={{ fontSize: '14px', color: '#374151' }}>Company</span>
              </label>
            </div>
          )}
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
            &nbsp;
          </label>
          {isReadOnly ? (
            item.billable && (
              <div style={{ padding: '12px 0', fontSize: '14px', color: '#111827' }}>
                Billable to client
              </div>
            )
          ) : (
            <label className="flex items-center gap-2 cursor-pointer" style={{ paddingTop: '8px' }}>
              <input
                type="checkbox"
                checked={item.billable}
                onChange={(e) => onUpdate({ billable: e.target.checked })}
                className="w-4 h-4 rounded"
                style={{ accentColor: '#2563EB' }}
              />
              <span style={{ fontSize: '14px', color: '#374151' }}>Billable to client</span>
            </label>
          )}
        </div>
      </div>

      {/* Receipt */}
      <div className="mb-4">
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
          RECEIPT
        </label>

        {item.receipt ? (
          <div 
            className="flex items-center justify-between px-4 py-3 bg-white border rounded-lg"
            style={{ borderColor: '#E5E7EB' }}
          >
            <div className="flex items-center gap-2">
              <Paperclip className="w-4 h-4" style={{ color: '#6B7280' }} />
              <span style={{ fontSize: '14px', color: '#111827' }}>{item.receipt.name}</span>
            </div>
            {!isReadOnly && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.open(item.receipt!.url, '_blank')}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <Eye className="w-4 h-4" style={{ color: '#6B7280' }} />
                </button>
                <button
                  onClick={() => onUpdate({ receipt: undefined })}
                  className="p-1 hover:bg-red-50 rounded transition-colors"
                >
                  <X className="w-4 h-4" style={{ color: '#DC2626' }} />
                </button>
              </div>
            )}
          </div>
        ) : isReadOnly ? (
          <div style={{ padding: '12px 0', fontSize: '14px', color: '#9CA3AF' }}>
            No receipt attached
          </div>
        ) : (
          <>
            <label 
              className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer transition-all hover:border-blue-500 hover:bg-blue-50"
              style={{ borderColor: '#D1D5DB', padding: '24px' }}
            >
              <Upload className="w-6 h-6 mb-2" style={{ color: '#6B7280' }} />
              <div className="text-center">
                <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '4px' }}>
                  Drop file here or click to upload
                </div>
                <div style={{ fontSize: '12px', color: '#9CA3AF' }}>
                  PDF, JPG, PNG up to 10MB
                </div>
              </div>
              <input
                type="file"
                onChange={handleFileUpload}
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
              />
            </label>
            {showReceiptWarning && (
              <div className="flex items-center gap-2 mt-2">
                <AlertCircle className="w-4 h-4" style={{ color: '#B45309' }} />
                <span style={{ fontSize: '12px', color: '#B45309' }}>
                  Receipt recommended for items over €25
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Item Total */}
      <div className="text-right pt-3 border-t" style={{ borderColor: '#E5E7EB' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
          Item Total: {item.currency === 'EUR' ? '€' : item.currency === 'USD' ? '$' : '£'}{itemTotal.toFixed(2)}
          {item.vat > 0 && (
            <span style={{ fontWeight: 400, color: '#6B7280' }}>
              {' '}(€{item.amount.toFixed(2)} + €{item.vat.toFixed(2)} VAT)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
