import React, { useState, useMemo } from 'react';
import { FileText, Circle, Clock, CheckCircle2, XCircle, Edit2, Eye, Mail, Check, ChevronDown, Plus } from 'lucide-react';
import { useBilling, Invoice } from '../../contexts/BillingContext';
import { SendInvoiceModal } from './SendInvoiceModal';
import { MarkAsPaidModal } from './MarkAsPaidModal';

type FilterView = 'all' | 'drafts' | 'pending' | 'overdue' | 'paid' | 'cancelled';

interface InvoiceListViewProps {
  invoices: Invoice[];
  onViewInvoice: (id: string) => void;
  onEditInvoice: (id: string) => void;
  onCreateNew: () => void;
}

export function InvoiceListView({ invoices, onViewInvoice, onEditInvoice, onCreateNew }: InvoiceListViewProps) {
  const { markInvoiceAsPaid, cancelInvoice, deleteInvoice } = useBilling();
  const [activeView, setActiveView] = useState<FilterView>('all');
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [sendModalInvoice, setSendModalInvoice] = useState<string | null>(null);
  const [markPaidModalInvoice, setMarkPaidModalInvoice] = useState<string | null>(null);

  // Calculate overdue invoices
  const getOverdueInvoices = () => {
    const today = new Date();
    return invoices.filter(inv => {
      if (inv.status !== 'pending') return false;
      const dueDate = new Date(inv.dueDate);
      return dueDate < today;
    });
  };

  const overdueInvoices = getOverdueInvoices();

  // Filter invoices by view
  const filteredInvoices = useMemo(() => {
    switch (activeView) {
      case 'all':
        return invoices;
      case 'drafts':
        return invoices.filter(inv => inv.status === 'draft');
      case 'pending':
        return invoices.filter(inv => inv.status === 'pending' && !overdueInvoices.includes(inv));
      case 'overdue':
        return overdueInvoices;
      case 'paid':
        return invoices.filter(inv => inv.status === 'paid');
      case 'cancelled':
        return invoices.filter(inv => inv.status === 'cancelled');
      default:
        return invoices;
    }
  }, [invoices, activeView, overdueInvoices]);

  // Sort invoices
  const sortedInvoices = useMemo(() => {
    return [...filteredInvoices].sort((a, b) => {
      // Priority: draft > overdue > pending > paid > cancelled
      const statusPriority = { draft: 0, pending: 1, paid: 2, cancelled: 3 };
      const aIsOverdue = overdueInvoices.includes(a);
      const bIsOverdue = overdueInvoices.includes(b);
      
      if (aIsOverdue && !bIsOverdue) return -1;
      if (!aIsOverdue && bIsOverdue) return 1;
      
      const priorityDiff = statusPriority[a.status] - statusPriority[b.status];
      if (priorityDiff !== 0) return priorityDiff;
      
      return new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime();
    });
  }, [filteredInvoices, overdueInvoices]);

  // Calculate counts
  const counts = {
    all: invoices.length,
    drafts: invoices.filter(inv => inv.status === 'draft').length,
    pending: invoices.filter(inv => inv.status === 'pending' && !overdueInvoices.includes(inv)).length,
    overdue: overdueInvoices.length,
    paid: invoices.filter(inv => inv.status === 'paid').length,
    cancelled: invoices.filter(inv => inv.status === 'cancelled').length,
  };

  // Calculate totals
  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.total, 0);

  // Format currency
  const formatCurrency = (amount: number) => {
    return `€${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Get days overdue
  const getDaysOverdue = (invoice: Invoice) => {
    if (invoice.status !== 'pending') return null;
    const dueDate = new Date(invoice.dueDate);
    const today = new Date();
    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : null;
  };

  // Render status
  const renderStatus = (invoice: Invoice) => {
    const daysOverdue = getDaysOverdue(invoice);
    
    if (daysOverdue) {
      return (
        <div className="flex items-center gap-1.5" style={{ color: '#DC2626', fontSize: '13px', fontWeight: 500 }}>
          <Clock className="w-3.5 h-3.5" />
          {daysOverdue}d overdue
        </div>
      );
    }

    switch (invoice.status) {
      case 'draft':
        return (
          <div className="flex items-center gap-1.5" style={{ color: '#6B7280', fontSize: '13px', fontWeight: 500 }}>
            <Circle className="w-3.5 h-3.5" />
            Draft
          </div>
        );
      case 'pending':
        return (
          <div className="flex items-center gap-1.5" style={{ color: '#B45309', fontSize: '13px', fontWeight: 500 }}>
            <Circle className="w-3.5 h-3.5 fill-current" />
            Due {formatDate(invoice.dueDate).split(' ').slice(0, 2).join(' ')}
          </div>
        );
      case 'paid':
        return (
          <div className="flex items-center gap-1.5" style={{ color: '#059669', fontSize: '13px', fontWeight: 500 }}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            Paid {invoice.paidDate ? formatDate(invoice.paidDate).split(' ').slice(0, 2).join(' ') : ''}
          </div>
        );
      case 'cancelled':
        return (
          <div className="flex items-center gap-1.5" style={{ color: '#6B7280', fontSize: '13px', fontWeight: 500 }}>
            <XCircle className="w-3.5 h-3.5" />
            Cancelled
          </div>
        );
    }
  };

  // Render hover actions
  const renderActions = (invoice: Invoice) => {
    if (hoveredRow !== invoice.id) return null;

    if (invoice.status === 'draft') {
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditInvoice(invoice.id);
            }}
            className="px-2.5 py-1 rounded hover:bg-gray-100 transition-colors"
            style={{ fontSize: '12px', fontWeight: 500, color: '#374151' }}
          >
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSendModalInvoice(invoice.id);
            }}
            className="px-2.5 py-1 rounded hover:bg-gray-100 transition-colors"
            style={{ fontSize: '12px', fontWeight: 500, color: '#374151' }}
          >
            Send
          </button>
        </div>
      );
    }

    if (invoice.status === 'pending' || getDaysOverdue(invoice)) {
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewInvoice(invoice.id);
            }}
            className="px-2.5 py-1 rounded hover:bg-gray-100 transition-colors"
            style={{ fontSize: '12px', fontWeight: 500, color: '#374151' }}
          >
            View
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSendModalInvoice(invoice.id);
            }}
            className="px-2.5 py-1 rounded hover:bg-gray-100 transition-colors"
            style={{ fontSize: '12px', fontWeight: 500, color: '#374151' }}
          >
            Send Reminder
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMarkPaidModalInvoice(invoice.id);
            }}
            className="px-2.5 py-1 rounded transition-colors"
            style={{ 
              fontSize: '12px', 
              fontWeight: 500, 
              backgroundColor: '#ECFDF5',
              color: '#059669',
            }}
          >
            Mark Paid
          </button>
        </div>
      );
    }

    if (invoice.status === 'paid') {
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewInvoice(invoice.id);
            }}
            className="px-2.5 py-1 rounded hover:bg-gray-100 transition-colors"
            style={{ fontSize: '12px', fontWeight: 500, color: '#374151' }}
          >
            View
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log('Download PDF:', invoice.id);
            }}
            className="px-2.5 py-1 rounded hover:bg-gray-100 transition-colors"
            style={{ fontSize: '12px', fontWeight: 500, color: '#374151' }}
          >
            Download
          </button>
        </div>
      );
    }

    if (invoice.status === 'cancelled') {
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewInvoice(invoice.id);
            }}
            className="px-2.5 py-1 rounded hover:bg-gray-100 transition-colors"
            style={{ fontSize: '12px', fontWeight: 500, color: '#374151' }}
          >
            View
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Saved View Pills - 44px */}
      <div
        className="flex-none border-b overflow-x-auto"
        style={{
          backgroundColor: '#F9FAFB',
          borderColor: '#E5E7EB',
          height: '44px',
        }}
      >
        <div className="flex items-center gap-2 h-full" style={{ padding: '0 20px' }}>
          <button
            onClick={() => setActiveView('all')}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 rounded-md transition-colors"
            style={{
              height: '28px',
              backgroundColor: activeView === 'all' ? '#2563EB' : 'white',
              color: activeView === 'all' ? 'white' : '#374151',
              border: `1px solid ${activeView === 'all' ? '#2563EB' : '#E5E7EB'}`,
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            All {counts.all}
          </button>

          <button
            onClick={() => setActiveView('drafts')}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 rounded-md transition-colors"
            style={{
              height: '28px',
              backgroundColor: activeView === 'drafts' ? '#2563EB' : 'white',
              color: activeView === 'drafts' ? 'white' : '#374151',
              border: `1px solid ${activeView === 'drafts' ? '#2563EB' : '#E5E7EB'}`,
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            Drafts {counts.drafts}
          </button>

          <button
            onClick={() => setActiveView('pending')}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 rounded-md transition-colors"
            style={{
              height: '28px',
              backgroundColor: activeView === 'pending' ? '#2563EB' : 'white',
              color: activeView === 'pending' ? 'white' : '#374151',
              border: `1px solid ${activeView === 'pending' ? '#2563EB' : '#E5E7EB'}`,
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            Pending {counts.pending}
          </button>

          <button
            onClick={() => setActiveView('overdue')}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 rounded-md transition-colors"
            style={{
              height: '28px',
              backgroundColor: activeView === 'overdue' ? '#DC2626' : 'white',
              color: activeView === 'overdue' ? 'white' : '#374151',
              border: `1px solid ${activeView === 'overdue' ? '#DC2626' : '#E5E7EB'}`,
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            Overdue {counts.overdue}
          </button>

          <button
            onClick={() => setActiveView('paid')}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 rounded-md transition-colors"
            style={{
              height: '28px',
              backgroundColor: activeView === 'paid' ? '#2563EB' : 'white',
              color: activeView === 'paid' ? 'white' : '#374151',
              border: `1px solid ${activeView === 'paid' ? '#2563EB' : '#E5E7EB'}`,
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            Paid {counts.paid}
          </button>

          <button
            onClick={() => setActiveView('cancelled')}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 rounded-md transition-colors"
            style={{
              height: '28px',
              backgroundColor: activeView === 'cancelled' ? '#2563EB' : 'white',
              color: activeView === 'cancelled' ? 'white' : '#374151',
              border: `1px solid ${activeView === 'cancelled' ? '#2563EB' : '#E5E7EB'}`,
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            Cancelled {counts.cancelled}
          </button>

          <button
            className="flex-shrink-0 flex items-center justify-center rounded-md transition-colors hover:bg-white"
            style={{
              width: '28px',
              height: '28px',
              border: '1px dashed #E5E7EB',
              color: '#9CA3AF',
            }}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {sortedInvoices.length === 0 ? (
          <div className="flex items-center justify-center" style={{ minHeight: '400px' }}>
            <div className="text-center">
              <FileText className="w-12 h-12 mx-auto mb-3" style={{ color: '#9CA3AF' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
                No invoices
              </h3>
              <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px' }}>
                {activeView === 'all' ? 'Create your first invoice to get started' : 'No invoices match this filter'}
              </p>
              {activeView === 'all' && (
                <button
                  onClick={onCreateNew}
                  className="px-4 py-2 rounded hover:opacity-90 transition-opacity"
                  style={{
                    backgroundColor: '#2563EB',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: 500,
                  }}
                >
                  New Invoice
                </button>
              )}
            </div>
          </div>
        ) : (
          <table className="w-full" style={{ borderCollapse: 'collapse' }}>
            {/* Header */}
            <thead>
              <tr style={{ backgroundColor: '#F9FAFB', height: '36px' }}>
                <th style={{ width: '40px' }}></th>
                <th style={{ width: '120px', textAlign: 'left', padding: '0 12px', fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Invoice
                </th>
                <th style={{ width: '180px', textAlign: 'left', padding: '0 12px', fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Client
                </th>
                <th style={{ textAlign: 'left', padding: '0 12px', fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Project
                </th>
                <th style={{ width: '140px', textAlign: 'right', padding: '0 12px', fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Amount
                </th>
                <th style={{ width: '200px', textAlign: 'left', padding: '0 12px', fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Status
                </th>
                <th style={{ width: '200px' }}></th>
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {sortedInvoices.map((invoice) => {
                const isOverdue = getDaysOverdue(invoice);
                return (
                  <tr
                    key={invoice.id}
                    onClick={() => onViewInvoice(invoice.id)}
                    onMouseEnter={() => setHoveredRow(invoice.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{
                      height: '44px',
                      backgroundColor: hoveredRow === invoice.id ? '#F9FAFB' : 'white',
                      borderBottom: '1px solid #F3F4F6',
                      borderLeft: isOverdue ? '2px solid #DC2626' : 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <td style={{ textAlign: 'center', padding: '0 12px' }}>
                      <FileText className="w-4 h-4" style={{ color: '#6B7280' }} />
                    </td>
                    <td style={{ padding: '0 12px', fontSize: '13px', fontWeight: 500, color: '#111827' }}>
                      {invoice.invoiceNumber}
                    </td>
                    <td style={{ padding: '0 12px', fontSize: '13px', color: '#374151' }}>
                      {invoice.clientName}
                    </td>
                    <td style={{ padding: '0 12px', fontSize: '13px', color: '#374151' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {invoice.projectName}
                      </div>
                    </td>
                    <td style={{ padding: '0 12px', fontSize: '14px', fontWeight: 600, color: '#111827', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {formatCurrency(invoice.total)}
                    </td>
                    <td style={{ padding: '0 12px' }}>
                      {renderStatus(invoice)}
                    </td>
                    <td style={{ padding: '0 12px', textAlign: 'right' }}>
                      {renderActions(invoice)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary Footer - 40px */}
      {sortedInvoices.length > 0 && (
        <div
          className="flex-none border-t flex items-center justify-between"
          style={{
            backgroundColor: '#F9FAFB',
            borderColor: '#E5E7EB',
            height: '40px',
            padding: '0 20px',
          }}
        >
          <div style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>
            {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''} · {formatCurrency(totalAmount)} total
            {overdueAmount > 0 && activeView === 'all' && (
              <span style={{ color: '#DC2626' }}> · {formatCurrency(overdueAmount)} overdue</span>
            )}
          </div>
          
          <button
            className="flex items-center gap-1.5 px-2.5 py-1 rounded hover:bg-white transition-colors"
            style={{
              fontSize: '12px',
              fontWeight: 500,
              color: '#374151',
              border: '1px solid #E5E7EB',
            }}
          >
            Export
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Modals */}
      {sendModalInvoice && (
        <SendInvoiceModal
          invoiceId={sendModalInvoice}
          onClose={() => setSendModalInvoice(null)}
        />
      )}

      {markPaidModalInvoice && (
        <MarkAsPaidModal
          invoiceId={markPaidModalInvoice}
          onClose={() => setMarkPaidModalInvoice(null)}
          onConfirm={(paymentDate, reference, notes) => {
            markInvoiceAsPaid(markPaidModalInvoice, paymentDate, reference, notes);
            setMarkPaidModalInvoice(null);
          }}
        />
      )}
    </div>
  );
}
