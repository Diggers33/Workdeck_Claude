import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useBilling } from '../../contexts/BillingContext';

interface MarkAsPaidModalProps {
  invoiceId: string;
  onClose: () => void;
  onConfirm: (paymentDate: string, reference: string, notes: string) => void;
}

export function MarkAsPaidModal({ invoiceId, onClose, onConfirm }: MarkAsPaidModalProps) {
  const { invoices } = useBilling();
  const invoice = invoices.find(inv => inv.id === invoiceId);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  if (!invoice) return null;

  const handleConfirm = () => {
    onConfirm(paymentDate, reference, notes);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50"
        style={{ width: '480px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b"
          style={{
            padding: '16px 20px',
            borderColor: '#E5E7EB',
          }}
        >
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>
            Mark as Paid
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            style={{ color: '#6B7280' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>
          {/* Invoice Summary */}
          <div
            className="rounded-lg border mb-5"
            style={{
              backgroundColor: '#F9FAFB',
              borderColor: '#E5E7EB',
              padding: '12px 16px',
            }}
          >
            <div style={{ fontSize: '13px', color: '#6B7280' }}>
              {invoice.invoiceNumber} · {invoice.clientName} · €{invoice.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>

          {/* Payment Date and Reference */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label
                className="block mb-2"
                style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}
              >
                Payment Date
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 rounded focus:outline-none focus:ring-2"
                style={{
                  height: '36px',
                  border: '1px solid #E5E7EB',
                  fontSize: '13px',
                  color: '#111827',
                }}
              />
            </div>

            <div>
              <label
                className="block mb-2"
                style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}
              >
                Payment Reference
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Optional..."
                className="w-full px-3 rounded focus:outline-none focus:ring-2"
                style={{
                  height: '36px',
                  border: '1px solid #E5E7EB',
                  fontSize: '13px',
                  color: '#111827',
                }}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label
              className="block mb-2"
              style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}
            >
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add payment notes..."
              className="w-full px-3 py-2 rounded focus:outline-none focus:ring-2 resize-none"
              style={{
                height: '80px',
                border: '1px solid #E5E7EB',
                fontSize: '13px',
                color: '#111827',
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3 border-t"
          style={{
            padding: '16px 20px',
            borderColor: '#E5E7EB',
          }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded hover:bg-gray-100 transition-colors"
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: '#374151',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex items-center gap-2 px-4 py-2 rounded hover:opacity-90 transition-opacity"
            style={{
              backgroundColor: '#059669',
              color: 'white',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            <Check className="w-4 h-4" />
            Confirm Paid
          </button>
        </div>
      </div>
    </>
  );
}
