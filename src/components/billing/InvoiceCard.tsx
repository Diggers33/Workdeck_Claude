import React from 'react';
import { FileText, Calendar, Clock, MoreVertical, Edit2, Eye, Mail, Check, XCircle, Trash2 } from 'lucide-react';
import { Invoice } from '../../contexts/BillingContext';

interface InvoiceCardProps {
  invoice: Invoice;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onMarkAsPaid?: (id: string) => void;
  onCancel?: (id: string) => void;
  onDelete?: (id: string) => void;
  onSend?: (id: string) => void;
}

export function InvoiceCard({ invoice, onView, onEdit, onMarkAsPaid, onCancel, onDelete, onSend }: InvoiceCardProps) {
  const [showMenu, setShowMenu] = React.useState(false);

  // Status badge configuration
  const getStatusConfig = (status: Invoice['status']) => {
    switch (status) {
      case 'draft':
        return {
          bg: '#F3F4F6',
          color: '#6B7280',
          text: 'Draft',
          borderColor: '#9CA3AF',
        };
      case 'pending':
        return {
          bg: '#FEF3C7',
          color: '#B45309',
          text: 'Pending Payment',
          borderColor: '#F59E0B',
        };
      case 'paid':
        return {
          bg: '#ECFDF5',
          color: '#047857',
          text: 'Paid',
          borderColor: '#10B981',
        };
      case 'cancelled':
        return {
          bg: '#FEE2E2',
          color: '#DC2626',
          text: 'Cancelled',
          borderColor: '#EF4444',
        };
    }
  };

  const statusConfig = getStatusConfig(invoice.status);

  // Calculate days overdue for pending invoices
  const getDaysOverdue = () => {
    if (invoice.status !== 'pending') return null;
    const dueDate = new Date(invoice.dueDate);
    const today = new Date();
    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : null;
  };

  const daysOverdue = getDaysOverdue();

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Count total line items
  const totalItems = invoice.timeEntries.length + invoice.expenses.length + invoice.milestones.length + invoice.additionalItems.length;

  return (
    <div
      onClick={() => onView(invoice.id)}
      className="w-full border rounded-xl text-left transition-all relative"
      style={{
        backgroundColor: 'white',
        borderColor: '#E5E7EB',
        borderLeft: `4px solid ${statusConfig.borderColor}`,
        padding: '20px',
        marginBottom: '12px',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Header Row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4" style={{ color: statusConfig.borderColor }} />
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
            {invoice.invoiceNumber}
          </span>
          {daysOverdue && (
            <span 
              className="flex items-center gap-1 px-2 py-0.5 rounded"
              style={{
                backgroundColor: '#FEE2E2',
                fontSize: '11px',
                fontWeight: 600,
                color: '#DC2626',
              }}
            >
              <Clock className="w-3 h-3" />
              {daysOverdue}d overdue
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <div
            className="px-2 py-1 rounded"
            style={{
              backgroundColor: statusConfig.bg,
              color: statusConfig.color,
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            {statusConfig.text}
          </div>
          
          {/* Actions Menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              style={{ color: '#6B7280' }}
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                  }}
                />
                <div
                  className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg border z-20"
                  style={{
                    borderColor: '#E5E7EB',
                    minWidth: '180px',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onView(invoice.id);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors"
                    style={{ fontSize: '14px', color: '#111827' }}
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  
                  {invoice.status === 'draft' && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(invoice.id);
                          setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors"
                        style={{ fontSize: '14px', color: '#111827' }}
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                      {onSend && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSend(invoice.id);
                            setShowMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors"
                          style={{ fontSize: '14px', color: '#111827' }}
                        >
                          <Mail className="w-4 h-4" />
                          Send
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Delete this draft invoice?')) {
                              onDelete(invoice.id);
                            }
                            setShowMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 transition-colors"
                          style={{ fontSize: '14px', color: '#DC2626' }}
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      )}
                    </>
                  )}
                  
                  {invoice.status === 'pending' && (
                    <>
                      {onMarkAsPaid && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkAsPaid(invoice.id);
                            setShowMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors"
                          style={{ fontSize: '14px', color: '#111827' }}
                        >
                          <Check className="w-4 h-4" />
                          Mark as Paid
                        </button>
                      )}
                      {onSend && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSend(invoice.id);
                            setShowMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors"
                          style={{ fontSize: '14px', color: '#111827' }}
                        >
                          <Mail className="w-4 h-4" />
                          Send Reminder
                        </button>
                      )}
                      {onCancel && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Cancel this invoice?')) {
                              onCancel(invoice.id);
                            }
                            setShowMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 transition-colors"
                          style={{ fontSize: '14px', color: '#DC2626' }}
                        >
                          <XCircle className="w-4 h-4" />
                          Cancel Invoice
                        </button>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Client & Project */}
      <div className="mb-3">
        <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
          {invoice.clientName}
        </div>
        <div style={{ fontSize: '13px', color: '#6B7280' }}>
          {invoice.projectName}
        </div>
      </div>

      {/* Meta Row */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5" style={{ color: '#6B7280', fontSize: '13px' }}>
            <Calendar className="w-3.5 h-3.5" />
            <span>Due {formatDate(invoice.dueDate)}</span>
          </div>
          <span style={{ color: '#D1D5DB' }}>•</span>
          <span style={{ fontSize: '13px', color: '#6B7280' }}>
            {totalItems} item{totalItems !== 1 ? 's' : ''}
          </span>
        </div>
        
        <div style={{ fontSize: '18px', fontWeight: 700, color: '#111827', fontVariantNumeric: 'tabular-nums' }}>
          ${invoice.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>

      {/* Paid date if applicable */}
      {invoice.status === 'paid' && invoice.paidDate && (
        <div className="mt-2 pt-2 border-t" style={{ borderColor: '#F3F4F6' }}>
          <span style={{ fontSize: '12px', color: '#059669' }}>
            ✓ Paid on {formatDate(invoice.paidDate)}
          </span>
        </div>
      )}
    </div>
  );
}
