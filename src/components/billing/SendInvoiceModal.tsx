import React, { useState } from 'react';
import { X, Mail } from 'lucide-react';
import { useBilling } from '../../contexts/BillingContext';

interface SendInvoiceModalProps {
  invoiceId: string;
  onClose: () => void;
}

export function SendInvoiceModal({ invoiceId, onClose }: SendInvoiceModalProps) {
  const { invoices } = useBilling();
  const invoice = invoices.find(inv => inv.id === invoiceId);
  const defaultRecipient = invoice?.clientEmail ? [invoice.clientEmail] : [];
  const [recipients, setRecipients] = useState<string[]>(defaultRecipient);
  const [newEmail, setNewEmail] = useState('');
  const [message, setMessage] = useState('');
  const [attachPDF, setAttachPDF] = useState(true);
  const [ccMyself, setCcMyself] = useState(false);

  if (!invoice) return null;

  const handleAddEmail = () => {
    if (newEmail && newEmail.includes('@')) {
      setRecipients([...recipients, newEmail]);
      setNewEmail('');
    }
  };

  const handleRemoveEmail = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    console.log('Sending invoice', invoiceId, 'to', recipients);
    onClose();
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
        style={{ width: '520px', maxHeight: '90vh', overflow: 'auto' }}
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
            Send Invoice
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

          {/* Recipients */}
          <div className="mb-5">
            <label
              className="block mb-2"
              style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}
            >
              Recipients
            </label>
            
            {/* Recipient Tags */}
            <div className="flex flex-wrap gap-2 mb-2">
              {recipients.map((email, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1.5 pl-3 pr-2 py-1 rounded"
                  style={{
                    backgroundColor: '#EFF6FF',
                    border: '1px solid #DBEAFE',
                    fontSize: '13px',
                    color: '#1E40AF',
                  }}
                >
                  {email}
                  <button
                    onClick={() => handleRemoveEmail(index)}
                    className="hover:bg-blue-200 rounded transition-colors"
                    style={{ padding: '2px' }}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Email */}
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Add email address..."
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddEmail();
                  }
                }}
                className="flex-1 px-3 rounded focus:outline-none focus:ring-2"
                style={{
                  height: '36px',
                  border: '1px solid #E5E7EB',
                  fontSize: '13px',
                  color: '#111827',
                }}
              />
              <button
                onClick={handleAddEmail}
                className="px-3 rounded hover:opacity-90 transition-opacity"
                style={{
                  height: '36px',
                  backgroundColor: '#2563EB',
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                Add
              </button>
            </div>
          </div>

          {/* Message */}
          <div className="mb-5">
            <label
              className="block mb-2"
              style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}
            >
              Message (optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a message to include in the email..."
              className="w-full px-3 py-2 rounded focus:outline-none focus:ring-2 resize-none"
              style={{
                height: '80px',
                border: '1px solid #E5E7EB',
                fontSize: '13px',
                color: '#111827',
              }}
            />
          </div>

          {/* Options */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={attachPDF}
                onChange={(e) => setAttachPDF(e.target.checked)}
                className="w-4 h-4 rounded"
                style={{ accentColor: '#2563EB' }}
              />
              <span style={{ fontSize: '13px', color: '#374151' }}>
                Attach PDF
              </span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={ccMyself}
                onChange={(e) => setCcMyself(e.target.checked)}
                className="w-4 h-4 rounded"
                style={{ accentColor: '#2563EB' }}
              />
              <span style={{ fontSize: '13px', color: '#374151' }}>
                CC myself
              </span>
            </label>
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
            onClick={handleSend}
            disabled={recipients.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{
              backgroundColor: '#2563EB',
              color: 'white',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            <Mail className="w-4 h-4" />
            Send Invoice
          </button>
        </div>
      </div>
    </>
  );
}
