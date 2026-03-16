import React, { useState, useMemo, useLayoutEffect } from 'react';
import { 
  ArrowLeft, 
  ShoppingCart, 
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
  Download,
  Zap,
  Package,
  CheckCheck
} from 'lucide-react';
import { useSpending, SpendingRequest } from '../../contexts/SpendingContext';
import { AddSupplierModal } from './AddSupplierModal';
import { PurchaseLineItem } from './PurchaseLineItem';

interface PurchaseDetailViewProps {
  requestId: string;
  onBack: () => void;
}

interface LineItem {
  id: string;
  description: string;
  supplier: string;
  productCode: string;
  costType: string;
  quantity: number;
  unitPrice: number;
  vatPercent: number;
  billable: boolean;
  attachments: Array<{
    name: string;
    url: string;
  }>;
}

export function PurchaseDetailView({ requestId, onBack }: PurchaseDetailViewProps) {
  const { requests, updateRequest } = useSpending();
  const purchase = requests.find(r => r.id === requestId && r.type === 'Purchase');

  // Scroll to top when component mounts
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Form state
  const [project, setProject] = useState(purchase?.project || '');
  const [office, setOffice] = useState(purchase?.office || '');
  const [department, setDepartment] = useState(purchase?.department || '');
  const [costCenter, setCostCenter] = useState('');
  const [isAsap, setIsAsap] = useState(false);
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const isReadOnly = purchase?.status !== 'Draft';
  const isDenied = purchase?.status === 'Denied';
  const isAdmin = false; // TODO: Get from context

  // Calculate totals
  const totals = useMemo(() => {
    let subtotal = 0;
    let totalVat = 0;
    let billableAmount = 0;
    const supplierBreakdown: Record<string, { count: number; total: number }> = {};

    lineItems.forEach(item => {
      const itemSubtotal = item.quantity * item.unitPrice;
      const itemVat = itemSubtotal * (item.vatPercent / 100);
      const itemTotal = itemSubtotal + itemVat;

      subtotal += itemSubtotal;
      totalVat += itemVat;

      if (item.billable) {
        billableAmount += itemTotal;
      }

      if (!supplierBreakdown[item.supplier]) {
        supplierBreakdown[item.supplier] = { count: 0, total: 0 };
      }
      supplierBreakdown[item.supplier].count += 1;
      supplierBreakdown[item.supplier].total += itemTotal;
    });

    return {
      subtotal,
      totalVat,
      grandTotal: subtotal + totalVat,
      billableAmount,
      supplierBreakdown,
      itemCount: lineItems.length
    };
  }, [lineItems]);

  // Add new line item
  const addLineItem = () => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      description: '',
      supplier: '',
      productCode: '',
      costType: '',
      quantity: 1,
      unitPrice: 0,
      vatPercent: 21,
      billable: false,
      attachments: []
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

    if (!project) {
      newErrors.project = 'Project is required';
    }

    if (lineItems.length === 0) {
      newErrors.lineItems = 'At least one line item is required';
    }

    lineItems.forEach((item, index) => {
      if (!item.description.trim()) {
        newErrors[`item-${item.id}-description`] = `Item ${index + 1}: Description is required`;
      }
      if (!item.supplier) {
        newErrors[`item-${item.id}-supplier`] = `Item ${index + 1}: Supplier is required`;
      }
      if (!item.costType) {
        newErrors[`item-${item.id}-costType`] = `Item ${index + 1}: Cost type is required`;
      }
      if (item.quantity <= 0) {
        newErrors[`item-${item.id}-quantity`] = `Item ${index + 1}: Quantity must be greater than 0`;
      }
      if (item.unitPrice <= 0) {
        newErrors[`item-${item.id}-unitPrice`] = `Item ${index + 1}: Unit price must be greater than 0`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save draft
  const handleSaveDraft = () => {
    if (purchase) {
      updateRequest(purchase.id, { updatedAt: new Date().toISOString() });
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
    if (purchase) {
      updateRequest(purchase.id, { 
        status: 'Pending',
        updatedAt: new Date().toISOString()
      });
      setShowSubmitModal(false);
      onBack();
    }
  };

  // Get status badge
  const getStatusBadge = () => {
    if (!purchase) return null;

    const badges = {
      'Draft': { icon: Circle, text: 'Draft', bg: '#F3F4F6', color: '#6B7280' },
      'Pending': { icon: Circle, text: 'Pending', bg: '#FEF3C7', color: '#B45309' },
      'Approved': { icon: CheckCircle2, text: 'Approved', bg: '#ECFDF5', color: '#059669' },
      'Denied': { icon: XCircle, text: 'Denied', bg: '#FEE2E2', color: '#DC2626' },
      'Processing': { icon: Settings, text: 'Processing', bg: '#EFF6FF', color: '#2563EB' },
      'Ordered': { icon: Package, text: 'Ordered', bg: '#EFF6FF', color: '#2563EB' },
      'Received': { icon: CheckCheck, text: 'Received', bg: '#F0FDF4', color: '#16A34A' },
    };

    const badge = badges[purchase.status as keyof typeof badges];
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

  if (!purchase) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F9FAFB' }}>
        <div className="text-center">
          <p style={{ fontSize: '14px', color: '#6B7280' }}>Purchase not found</p>
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
              <ShoppingCart className="w-5 h-5" style={{ color: '#3B82F6' }} />
              <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#111827' }}>
                {purchase.referenceNumber}
              </h1>
              {getStatusBadge()}
              {isAsap && (
                <div 
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md"
                  style={{ backgroundColor: '#FEF3C7' }}
                >
                  <Zap className="w-3 h-3" style={{ color: '#B45309' }} />
                  <span style={{ fontSize: '12px', fontWeight: 500, color: '#B45309' }}>
                    ASAP
                  </span>
                </div>
              )}
            </div>
            
            <p style={{ fontSize: '14px', color: '#6B7280' }}>
              {lineItems[0]?.description || 'New Purchase Request'}
            </p>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-3">
            {purchase.status === 'Draft' && (
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

            {purchase.status === 'Pending' && (
              <button
                onClick={() => {
                  updateRequest(purchase.id, { status: 'Draft' });
                }}
                className="px-4 py-2 rounded-lg transition-all hover:bg-gray-50"
                style={{ color: '#374151', fontSize: '14px', fontWeight: 500 }}
              >
                Withdraw
              </button>
            )}

            {(purchase.status === 'Approved' || purchase.status === 'Received') && !isAdmin && (
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

            {purchase.status === 'Denied' && (
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
                    updateRequest(purchase.id, { status: 'Draft' });
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
                  "This purchase exceeds the Q4 budget allocation. Please resubmit in Q1 or request budget increase."
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

          {/* Project */}
          <div className="mb-5">
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              PROJECT <span style={{ color: '#DC2626' }}>*</span>
            </label>
            {isReadOnly ? (
              <div style={{ padding: '12px 0', fontSize: '14px', color: '#111827' }}>
                {project} - Digital Product Passport
              </div>
            ) : (
              <select
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                style={{
                  fontSize: '14px',
                  borderColor: errors.project ? '#DC2626' : '#E5E7EB',
                  height: '44px'
                }}
              >
                <option value="">Select project...</option>
                <option value="BIOGEMSE">BIOGEMSE - Digital Product Passport</option>
                <option value="HALO-TEX">HALO-TEX - Textile Recycling</option>
                <option value="RETAIN">RETAIN - Packaging Solutions</option>
                <option value="Infrastructure">Infrastructure - Internal</option>
              </select>
            )}
            {errors.project && (
              <div style={{ fontSize: '12px', color: '#DC2626', marginTop: '4px' }}>
                {errors.project}
              </div>
            )}
          </div>

          <div style={{ height: '1px', backgroundColor: '#E5E7EB', margin: '20px 0' }} />

          {/* Office and Department */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                OFFICE <span style={{ color: '#DC2626' }}>*</span>
              </label>
              {isReadOnly ? (
                <div style={{ padding: '12px 0', fontSize: '14px', color: '#111827' }}>
                  {office}
                </div>
              ) : (
                <select
                  value={office}
                  onChange={(e) => setOffice(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ fontSize: '14px', borderColor: '#E5E7EB', height: '44px' }}
                >
                  <option value="Barcelona">Barcelona</option>
                  <option value="Dublin">Dublin</option>
                  <option value="Madrid">Madrid</option>
                </select>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                DEPARTMENT <span style={{ color: '#DC2626' }}>*</span>
              </label>
              {isReadOnly ? (
                <div style={{ padding: '12px 0', fontSize: '14px', color: '#111827' }}>
                  {department}
                </div>
              ) : (
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ fontSize: '14px', borderColor: '#E5E7EB', height: '44px' }}
                >
                  <option value="">Select department...</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Sales">Sales</option>
                  <option value="Operations">Operations</option>
                </select>
              )}
            </div>
          </div>

          {/* Cost Center */}
          <div className="mb-5">
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              COST CENTER (optional)
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
                <option value="R&D">R&D</option>
                <option value="Operations">Operations</option>
                <option value="Administration">Administration</option>
              </select>
            )}
          </div>

          <div style={{ height: '1px', backgroundColor: '#E5E7EB', margin: '20px 0' }} />

          {/* ASAP Checkbox */}
          {!isReadOnly && (
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isAsap}
                onChange={(e) => setIsAsap(e.target.checked)}
                className="mt-1 w-4 h-4 rounded"
                style={{ accentColor: '#2563EB' }}
              />
              <div>
                <div className="flex items-center gap-2" style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>
                  <Zap className="w-4 h-4" style={{ color: '#F59E0B' }} />
                  ASAP - Mark as urgent purchase
                </div>
                <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                  This purchase is time-sensitive and needs priority processing
                </div>
              </div>
            </label>
          )}
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
            <PurchaseLineItem
              key={item.id}
              item={item}
              index={index}
              isExpanded={expandedItemId === item.id}
              isReadOnly={isReadOnly}
              onToggle={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)}
              onUpdate={(updates) => updateLineItem(item.id, updates)}
              onDelete={() => deleteLineItem(item.id)}
              onAddSupplier={() => setShowSupplierModal(true)}
              canDelete={lineItems.length > 1}
            />
          ))}
        </div>

        {/* Section 3: Totals */}
        <div className="bg-white border rounded-xl mb-6" style={{ borderColor: '#E5E7EB', padding: '24px' }}>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827', paddingBottom: '16px', borderBottom: '1px solid #E5E7EB', marginBottom: '20px' }}>
            Totals
          </div>

          <div 
            className="rounded-lg"
            style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', padding: '20px' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                PURCHASE SUMMARY
              </div>
              <div style={{ fontSize: '13px', color: '#6B7280' }}>
                Currency: EUR
              </div>
            </div>

            <div style={{ height: '1px', backgroundColor: '#BFDBFE', marginBottom: '12px' }} />

            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between" style={{ fontSize: '14px' }}>
                <span style={{ color: '#374151' }}>Subtotal ({totals.itemCount} items)</span>
                <span style={{ color: '#111827' }}>€{totals.subtotal.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between" style={{ fontSize: '14px' }}>
                <span style={{ color: '#374151' }}>Total VAT</span>
                <span style={{ color: '#111827' }}>€{totals.totalVat.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between pt-2" style={{ fontSize: '18px', borderTop: '1px solid #BFDBFE' }}>
                <span style={{ fontWeight: 600, color: '#111827' }}>Grand Total</span>
                <span style={{ fontWeight: 700, color: '#2563EB' }}>€{totals.grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ height: '1px', backgroundColor: '#BFDBFE', margin: '16px 0' }} />

            <div className="mb-3">
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                SUPPLIERS ON THIS PURCHASE
              </div>
              <div className="space-y-1">
                {Object.entries(totals.supplierBreakdown).map(([supplier, data]) => (
                  <div key={supplier} className="flex items-center gap-2" style={{ fontSize: '13px', color: '#374151' }}>
                    <span>•</span>
                    <span>{supplier} ({data.count} {data.count === 1 ? 'item' : 'items'} - €{data.total.toFixed(2)})</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ height: '1px', backgroundColor: '#BFDBFE', margin: '16px 0' }} />

            <div className="flex items-center justify-between" style={{ fontSize: '14px' }}>
              <span style={{ color: '#374151' }}>Billable amount</span>
              <span style={{ color: '#111827' }}>€{totals.billableAmount.toFixed(2)}</span>
            </div>
          </div>
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
              placeholder="Any additional context, delivery requirements, or notes for the approver..."
              rows={4}
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
              {purchase.status === 'Received' && (
                <div className="flex gap-3">
                  <div 
                    className="flex items-center justify-center rounded-full flex-shrink-0"
                    style={{ width: '32px', height: '32px', backgroundColor: '#ECFDF5', color: '#059669' }}
                  >
                    <CheckCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', color: '#111827' }}>
                      Purchase Admin marked as Received
                    </div>
                    <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>
                      Dec 5, 2024 at 9:00 AM
                    </div>
                    <div style={{ fontSize: '13px', color: '#374151', fontStyle: 'italic', marginTop: '6px' }}>
                      "All items received and verified."
                    </div>
                  </div>
                </div>
              )}

              {(purchase.status === 'Ordered' || purchase.status === 'Received') && (
                <div className="flex gap-3">
                  <div 
                    className="flex items-center justify-center rounded-full flex-shrink-0"
                    style={{ width: '32px', height: '32px', backgroundColor: '#EFF6FF', color: '#2563EB' }}
                  >
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', color: '#111827' }}>
                      Purchase Admin marked as Ordered
                    </div>
                    <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>
                      Dec 1, 2024 at 2:30 PM
                    </div>
                    <div style={{ fontSize: '13px', color: '#374151', fontStyle: 'italic', marginTop: '6px' }}>
                      "PO-2024-0892 sent to suppliers"
                    </div>
                  </div>
                </div>
              )}

              {purchase.status === 'Approved' && (
                <div className="flex gap-3">
                  <div 
                    className="flex items-center justify-center rounded-full flex-shrink-0"
                    style={{ width: '32px', height: '32px', backgroundColor: '#ECFDF5', color: '#059669' }}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', color: '#111827' }}>
                      Sarah Manager approved this purchase
                    </div>
                    <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>
                      Nov 29, 2024 at 3:45 PM
                    </div>
                    <div style={{ fontSize: '13px', color: '#374151', fontStyle: 'italic', marginTop: '6px' }}>
                      "Approved. Good timing for onboarding."
                    </div>
                  </div>
                </div>
              )}

              {purchase.status === 'Pending' && (
                <div className="flex gap-3">
                  <div 
                    className="flex items-center justify-center rounded-full flex-shrink-0"
                    style={{ width: '32px', height: '32px', backgroundColor: '#F3F4F6', color: '#6B7280' }}
                  >
                    <Circle className="w-4 h-4" />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', color: '#111827' }}>
                      You submitted this purchase
                    </div>
                    <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>
                      Nov 28, 2024 at 11:00 AM
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
                    You created this purchase
                  </div>
                  <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>
                    Nov 27, 2024 at 4:30 PM
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
                Submit Purchase?
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
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingCart className="w-4 h-4" style={{ color: '#3B82F6' }} />
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                    {purchase.referenceNumber}
                  </div>
                  {isAsap && (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded" style={{ backgroundColor: '#FEF3C7' }}>
                      <Zap className="w-3 h-3" style={{ color: '#B45309' }} />
                      <span style={{ fontSize: '11px', fontWeight: 500, color: '#B45309' }}>ASAP</span>
                    </div>
                  )}
                </div>
                <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '6px' }}>
                  {lineItems[0]?.description}
                </div>
                <div style={{ fontSize: '13px', color: '#6B7280' }}>
                  {lineItems.length} items · €{totals.grandTotal.toFixed(2)} · {Object.keys(totals.supplierBreakdown).length} {Object.keys(totals.supplierBreakdown).length === 1 ? 'supplier' : 'suppliers'}
                </div>
              </div>

              <p style={{ fontSize: '14px', color: '#374151' }}>
                This will be sent to Sarah Manager for approval.
              </p>
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
                Delete Purchase?
              </h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="hover:bg-gray-100 rounded-lg p-1 transition-colors"
              >
                <X className="w-5 h-5" style={{ color: '#6B7280' }} />
              </button>
            </div>

            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>
              Are you sure you want to delete this purchase? This action cannot be undone.
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

      {/* Add Supplier Modal */}
      {showSupplierModal && (
        <AddSupplierModal
          onClose={() => setShowSupplierModal(false)}
          onSupplierAdded={(supplier) => {
            console.log('Supplier added:', supplier);
            setShowSupplierModal(false);
          }}
        />
      )}
    </div>
  );
}

// Purchase Line Item Card Component
interface PurchaseLineItemCardProps {
  item: LineItem;
  index: number;
  isReadOnly: boolean;
  onUpdate: (updates: Partial<LineItem>) => void;
  onDelete: () => void;
  onAddSupplier: () => void;
  canDelete: boolean;
  errors: Record<string, string>;
}

function PurchaseLineItemCard({ item, index, isReadOnly, onUpdate, onDelete, onAddSupplier, canDelete, errors }: PurchaseLineItemCardProps) {
  const itemSubtotal = item.quantity * item.unitPrice;
  const itemVat = itemSubtotal * (item.vatPercent / 100);
  const itemTotal = itemSubtotal + itemVat;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpdate({ 
        attachments: [...item.attachments, { name: file.name, url: URL.createObjectURL(file) }] 
      });
    }
  };

  const removeAttachment = (attachmentIndex: number) => {
    onUpdate({
      attachments: item.attachments.filter((_, i) => i !== attachmentIndex)
    });
  };

  const costTypes = [
    'Equipment',
    'Software',
    'Cloud Services',
    'Office Supplies',
    'Professional Services',
    'Marketing',
    'Travel',
    'Training',
    'Other'
  ];

  const suppliers = ['TechSupplies Ltd', 'OfficeDepot', 'Amazon AWS'];

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

      {/* Description */}
      <div className="mb-4">
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
          DESCRIPTION <span style={{ color: '#DC2626' }}>*</span>
        </label>
        {isReadOnly ? (
          <div style={{ padding: '12px 0', fontSize: '14px', color: '#111827' }}>
            {item.description}
          </div>
        ) : (
          <>
            <textarea
              value={item.description}
              onChange={(e) => onUpdate({ description: e.target.value })}
              placeholder="What did you pay for?"
              rows={2}
              maxLength={500}
              className="w-full px-3 py-2 border rounded-lg resize-none"
              style={{
                fontSize: '14px',
                borderColor: errors[`item-${item.id}-description`] ? '#DC2626' : '#E5E7EB'
              }}
            />
            <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>
              Max 500 characters
            </div>
            {errors[`item-${item.id}-description`] && (
              <div style={{ fontSize: '12px', color: '#DC2626', marginTop: '4px' }}>
                Description is required
              </div>
            )}
          </>
        )}
      </div>

      {/* Supplier */}
      <div className="mb-4">
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
          SUPPLIER <span style={{ color: '#DC2626' }}>*</span>
        </label>
        {isReadOnly ? (
          <div style={{ padding: '12px 0', fontSize: '14px', color: '#111827' }}>
            {item.supplier}
          </div>
        ) : (
          <>
            <select
              value={item.supplier}
              onChange={(e) => onUpdate({ supplier: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              style={{
                fontSize: '14px',
                borderColor: errors[`item-${item.id}-supplier`] ? '#DC2626' : '#E5E7EB',
                height: '44px'
              }}
            >
              <option value="">Select supplier...</option>
              {suppliers.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button
              onClick={onAddSupplier}
              className="flex items-center gap-1 mt-2 hover:underline"
              style={{ fontSize: '13px', color: '#2563EB', fontWeight: 500 }}
            >
              <Plus className="w-3 h-3" />
              Add New Supplier
            </button>
            {errors[`item-${item.id}-supplier`] && (
              <div style={{ fontSize: '12px', color: '#DC2626', marginTop: '4px' }}>
                Supplier is required
              </div>
            )}
          </>
        )}
      </div>

      {/* Product Code and Cost Type */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
            PRODUCT CODE (optional)
          </label>
          {isReadOnly ? (
            <div style={{ padding: '12px 0', fontSize: '14px', color: '#111827' }}>
              {item.productCode || '—'}
            </div>
          ) : (
            <input
              type="text"
              value={item.productCode}
              onChange={(e) => onUpdate({ productCode: e.target.value })}
              placeholder="SKU or product code"
              className="w-full px-3 py-2 border rounded-lg"
              style={{ fontSize: '14px', borderColor: '#E5E7EB', height: '44px' }}
            />
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
          )}
        </div>
      </div>

      {/* Quantity, Unit Price, VAT % */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
            QUANTITY <span style={{ color: '#DC2626' }}>*</span>
          </label>
          {isReadOnly ? (
            <div style={{ padding: '12px 0', fontSize: '14px', color: '#111827' }}>
              {item.quantity}
            </div>
          ) : (
            <input
              type="number"
              value={item.quantity}
              onChange={(e) => onUpdate({ quantity: parseInt(e.target.value) || 0 })}
              min="1"
              max="1000"
              step="1"
              className="w-full px-3 py-2 border rounded-lg"
              style={{ fontSize: '14px', borderColor: '#E5E7EB', height: '44px' }}
            />
          )}
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
            UNIT PRICE <span style={{ color: '#DC2626' }}>*</span>
          </label>
          {isReadOnly ? (
            <div style={{ padding: '12px 0', fontSize: '14px', color: '#111827' }}>
              €{item.unitPrice.toFixed(2)}
            </div>
          ) : (
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ fontSize: '14px', color: '#6B7280' }}>
                €
              </span>
              <input
                type="number"
                value={item.unitPrice}
                onChange={(e) => onUpdate({ unitPrice: parseFloat(e.target.value) || 0 })}
                step="0.01"
                min="0"
                className="w-full pl-8 pr-3 py-2 border rounded-lg"
                style={{ fontSize: '14px', borderColor: '#E5E7EB', height: '44px' }}
              />
            </div>
          )}
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
            VAT % <span style={{ color: '#DC2626' }}>*</span>
          </label>
          {isReadOnly ? (
            <div style={{ padding: '12px 0', fontSize: '14px', color: '#111827' }}>
              {item.vatPercent}%
            </div>
          ) : (
            <div className="relative">
              <input
                type="number"
                value={item.vatPercent}
                onChange={(e) => onUpdate({ vatPercent: parseFloat(e.target.value) || 0 })}
                min="0"
                max="100"
                step="1"
                className="w-full px-3 py-2 border rounded-lg"
                style={{ fontSize: '14px', borderColor: '#E5E7EB', height: '44px' }}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2" style={{ fontSize: '14px', color: '#6B7280' }}>
                %
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Billable */}
      <div className="mb-4">
        {isReadOnly ? (
          item.billable && (
            <div style={{ padding: '12px 0', fontSize: '14px', color: '#111827' }}>
              Billable to client
            </div>
          )
        ) : (
          <label className="flex items-center gap-2 cursor-pointer">
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

      {/* Attachments */}
      <div className="mb-4">
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
          ATTACHMENTS
        </label>

        {item.attachments.length > 0 && (
          <div className="space-y-2 mb-2">
            {item.attachments.map((attachment, i) => (
              <div 
                key={i}
                className="flex items-center justify-between px-4 py-3 bg-white border rounded-lg"
                style={{ borderColor: '#E5E7EB' }}
              >
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4" style={{ color: '#6B7280' }} />
                  <span style={{ fontSize: '14px', color: '#111827' }}>{attachment.name}</span>
                </div>
                {!isReadOnly && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.open(attachment.url, '_blank')}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      <Eye className="w-4 h-4" style={{ color: '#6B7280' }} />
                    </button>
                    <button
                      onClick={() => removeAttachment(i)}
                      className="p-1 hover:bg-red-50 rounded transition-colors"
                    >
                      <X className="w-4 h-4" style={{ color: '#DC2626' }} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!isReadOnly && (
          <label 
            className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer transition-all hover:border-blue-500 hover:bg-blue-50"
            style={{ borderColor: '#D1D5DB', padding: '16px' }}
          >
            <Upload className="w-5 h-5 mb-2" style={{ color: '#6B7280' }} />
            <div className="text-center">
              <div style={{ fontSize: '13px', color: '#6B7280' }}>
                Drop file here or click to upload
              </div>
            </div>
            <input
              type="file"
              onChange={handleFileUpload}
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Item Calculation */}
      <div className="pt-3 border-t" style={{ borderColor: '#E5E7EB' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
          ITEM CALCULATION
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center justify-between" style={{ fontSize: '13px' }}>
            <span style={{ color: '#374151' }}>Subtotal ({item.quantity} × €{item.unitPrice.toFixed(2)})</span>
            <span style={{ color: '#111827' }}>€{itemSubtotal.toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between" style={{ fontSize: '13px' }}>
            <span style={{ color: '#374151' }}>VAT ({item.vatPercent}%)</span>
            <span style={{ color: '#111827' }}>€{itemVat.toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between pt-1" style={{ fontSize: '14px', borderTop: '1px solid #E5E7EB' }}>
            <span style={{ fontWeight: 600, color: '#111827' }}>Item Total</span>
            <span style={{ fontWeight: 600, color: '#111827' }}>€{itemTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
