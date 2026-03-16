import React, { useState } from 'react';
import { X, Edit2, Printer, Download, Send, MoreVertical, Check, XCircle, Trash2 } from 'lucide-react';
import { useBilling } from '../../contexts/BillingContext';
import { SendInvoiceModal } from './SendInvoiceModal';
import workdeckLogo from 'figma:asset/6f22f481b9cda400eddbba38bd4678cd9b214998.png';

interface InvoiceDocumentViewProps {
  invoiceId: string;
  onClose: () => void;
  onEdit: () => void;
}

export const InvoiceDocumentView: React.FC<InvoiceDocumentViewProps> = ({
  invoiceId,
  onClose,
  onEdit,
}) => {
  const { invoices, settings, markAsPaid, cancelInvoice, deleteInvoice, updateInvoice } = useBilling();
  const invoice = invoices.find(inv => inv.id === invoiceId);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);

  if (!invoice) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="text-center">
          <h2 className="text-gray-900 mb-8">Invoice not found</h2>
          <button
            onClick={onClose}
            className="px-16 py-8 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    alert('PDF export functionality would be implemented here');
  };

  const handleMarkPaid = () => {
    markAsPaid(invoice.id);
    setShowMoreMenu(false);
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel this invoice?')) {
      cancelInvoice(invoice.id);
      setShowMoreMenu(false);
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      deleteInvoice(invoice.id);
      onClose();
    }
  };

  const handleSend = () => {
    if (invoice.status === 'draft') {
      // Update status to pending when sending
      updateInvoice(invoice.id, { status: 'pending' });
    }
    setShowSendModal(true);
  };

  const statusConfig = {
    draft: { label: 'Draft', bgColor: 'bg-gray-100', textColor: 'text-gray-700' },
    pending: { label: 'Pending Payment', bgColor: 'bg-amber-100', textColor: 'text-amber-700' },
    paid: { label: 'Paid', bgColor: 'bg-green-100', textColor: 'text-green-700' },
    cancelled: { label: 'Cancelled', bgColor: 'bg-red-100', textColor: 'text-red-700' },
  };

  // Group time entries by person if format is grouped-person-task
  const groupedTimeEntries = invoice.timeEntries
    .filter(e => e.selected)
    .reduce((acc, entry) => {
      const key = `${entry.personName}-${entry.taskName}`;
      if (!acc[key]) {
        acc[key] = {
          personName: entry.personName,
          taskName: entry.taskName,
          hours: 0,
          rate: entry.rate,
          amount: 0,
        };
      }
      acc[key].hours += entry.hours;
      acc[key].amount += entry.amount;
      return acc;
    }, {} as Record<string, any>);

  return (
    <>
      <div className="h-full flex flex-col bg-gray-100">
        {/* Toolbar */}
        <div className="flex-none bg-white border-b border-gray-200 px-24 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-16">
              <button
                onClick={onClose}
                className="p-8 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X size={20} className="text-gray-600" />
              </button>
              <span
                className={`inline-flex items-center px-12 py-6 rounded-md ${
                  statusConfig[invoice.status].bgColor
                } ${statusConfig[invoice.status].textColor}`}
              >
                {statusConfig[invoice.status].label}
              </span>
            </div>

            <div className="flex items-center gap-8">
              {invoice.status === 'draft' && (
                <button
                  onClick={onEdit}
                  className="flex items-center gap-8 px-12 py-8 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <Edit2 size={16} />
                  Edit
                </button>
              )}
              <button
                onClick={handlePrint}
                className="flex items-center gap-8 px-12 py-8 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                <Printer size={16} />
                Print
              </button>
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-8 px-12 py-8 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                <Download size={16} />
                Export PDF
              </button>
              {(invoice.status === 'draft' || invoice.status === 'pending') && (
                <button
                  onClick={handleSend}
                  className="flex items-center gap-8 px-12 py-8 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Send size={16} />
                  {invoice.status === 'draft' ? 'Send Invoice' : 'Send Reminder'}
                </button>
              )}
              
              <div className="relative">
                <button
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className="p-8 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <MoreVertical size={20} className="text-gray-600" />
                </button>
                
                {showMoreMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowMoreMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-4 w-180 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                      {invoice.status === 'pending' && (
                        <button
                          onClick={handleMarkPaid}
                          className="w-full flex items-center gap-8 px-12 py-8 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Check size={14} />
                          Mark as Paid
                        </button>
                      )}
                      {(invoice.status === 'draft' || invoice.status === 'pending') && (
                        <button
                          onClick={handleCancel}
                          className="w-full flex items-center gap-8 px-12 py-8 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <XCircle size={14} />
                          Cancel Invoice
                        </button>
                      )}
                      {invoice.status === 'draft' && (
                        <button
                          onClick={handleDelete}
                          className="w-full flex items-center gap-8 px-12 py-8 text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Document */}
        <div className="flex-1 overflow-auto py-48">
          <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-48 print:shadow-none print:rounded-none">
            {/* Watermark for paid/cancelled */}
            {(invoice.status === 'paid' || invoice.status === 'cancelled') && (
              <div className="relative mb-24">
                <div className={`text-center py-16 rounded-lg ${
                  invoice.status === 'paid' ? 'bg-green-50 border-2 border-green-300' : 'bg-red-50 border-2 border-red-300'
                }`}>
                  <span className={`text-2xl tracking-wider ${
                    invoice.status === 'paid' ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {invoice.status === 'paid' ? '✓ PAID' : '✗ CANCELLED'}
                  </span>
                  {invoice.status === 'paid' && invoice.paidDate && (
                    <div className="text-green-700 mt-4">on {formatDate(invoice.paidDate)}</div>
                  )}
                </div>
              </div>
            )}

            {/* Header */}
            <div className="flex items-start justify-between mb-48">
              <div>
                <img src={workdeckLogo} alt="Workdeck" className="h-32 mb-12" />
                <div className="text-gray-600 whitespace-pre-line">{settings.companyAddress}</div>
                {settings.vatNumber && (
                  <div className="text-gray-600 mt-8">VAT: {settings.vatNumber}</div>
                )}
              </div>
              <div className="text-right">
                <h1 className="text-gray-900 mb-8">INVOICE</h1>
              </div>
            </div>

            {/* Invoice Meta */}
            <div className="grid grid-cols-2 gap-48 mb-48 pb-32 border-b border-gray-300">
              <div>
                <div className="text-gray-700 mb-4">Bill To</div>
                <div className="text-gray-900">{invoice.clientName}</div>
                {invoice.clientAddress && (
                  <div className="text-gray-600 mt-8 whitespace-pre-line">{invoice.clientAddress}</div>
                )}
              </div>
              <div className="space-y-8">
                <div className="flex justify-between">
                  <span className="text-gray-700">Invoice Number:</span>
                  <span className="text-gray-900">{invoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Invoice Date:</span>
                  <span className="text-gray-900">{formatDate(invoice.invoiceDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Due Date:</span>
                  <span className="text-gray-900">{formatDate(invoice.dueDate)}</span>
                </div>
                {invoice.poCode && (
                  <div className="flex justify-between">
                    <span className="text-gray-700">PO Number:</span>
                    <span className="text-gray-900">{invoice.poCode}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-700">Project:</span>
                  <span className="text-gray-900">{invoice.projectName}</span>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="mb-32">
              <table className="w-full">
                <thead className="border-b-2 border-gray-300">
                  <tr>
                    <th className="text-left py-12 text-gray-700">Description</th>
                    <th className="text-right py-12 text-gray-700 w-100">Qty/Hours</th>
                    <th className="text-right py-12 text-gray-700 w-100">Rate</th>
                    <th className="text-right py-12 text-gray-700 w-120">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Time Entries */}
                  {Object.values(groupedTimeEntries).length > 0 && (
                    <>
                      <tr>
                        <td colSpan={4} className="pt-20 pb-8 text-gray-700">
                          <strong>Professional Services</strong>
                        </td>
                      </tr>
                      {Object.values(groupedTimeEntries).map((group: any, idx) => (
                        <tr key={idx} className="border-b border-gray-100">
                          <td className="py-12 text-gray-900">
                            {group.taskName}
                            <div className="text-gray-600 text-sm">{group.personName}</div>
                          </td>
                          <td className="py-12 text-right text-gray-900 tabular-nums">{group.hours}h</td>
                          <td className="py-12 text-right text-gray-900 tabular-nums">${group.rate}/hr</td>
                          <td className="py-12 text-right text-gray-900 tabular-nums">{formatCurrency(group.amount)}</td>
                        </tr>
                      ))}
                    </>
                  )}

                  {/* Expenses */}
                  {invoice.expenses.filter(e => e.selected).length > 0 && (
                    <>
                      <tr>
                        <td colSpan={4} className="pt-20 pb-8 text-gray-700">
                          <strong>Expenses</strong>
                        </td>
                      </tr>
                      {invoice.expenses
                        .filter(e => e.selected)
                        .map((expense) => (
                          <tr key={expense.id} className="border-b border-gray-100">
                            <td className="py-12 text-gray-900">{expense.description}</td>
                            <td className="py-12 text-right text-gray-900 tabular-nums">1</td>
                            <td className="py-12 text-right text-gray-900 tabular-nums">{formatCurrency(expense.amount)}</td>
                            <td className="py-12 text-right text-gray-900 tabular-nums">{formatCurrency(expense.amount)}</td>
                          </tr>
                        ))}
                    </>
                  )}

                  {/* Milestones */}
                  {invoice.milestones.filter(m => m.selected).length > 0 && (
                    <>
                      <tr>
                        <td colSpan={4} className="pt-20 pb-8 text-gray-700">
                          <strong>Milestones</strong>
                        </td>
                      </tr>
                      {invoice.milestones
                        .filter(m => m.selected)
                        .map((milestone) => (
                          <tr key={milestone.id} className="border-b border-gray-100">
                            <td className="py-12 text-gray-900">
                              {milestone.name}
                              <div className="text-gray-600 text-sm">Delivered: {formatDate(milestone.deliveryDate)}</div>
                            </td>
                            <td className="py-12 text-right text-gray-900 tabular-nums">1</td>
                            <td className="py-12 text-right text-gray-900 tabular-nums">{formatCurrency(milestone.amount)}</td>
                            <td className="py-12 text-right text-gray-900 tabular-nums">{formatCurrency(milestone.amount)}</td>
                          </tr>
                        ))}
                    </>
                  )}

                  {/* Additional Items */}
                  {invoice.additionalItems.length > 0 && (
                    <>
                      <tr>
                        <td colSpan={4} className="pt-20 pb-8 text-gray-700">
                          <strong>Additional Items</strong>
                        </td>
                      </tr>
                      {invoice.additionalItems.map((item) => (
                        <tr key={item.id} className="border-b border-gray-100">
                          <td className="py-12 text-gray-900">{item.description}</td>
                          <td className="py-12 text-right text-gray-900 tabular-nums">1</td>
                          <td className="py-12 text-right text-gray-900 tabular-nums">{formatCurrency(item.amount)}</td>
                          <td className="py-12 text-right text-gray-900 tabular-nums">{formatCurrency(item.amount)}</td>
                        </tr>
                      ))}
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-48">
              <div className="w-280 space-y-12">
                <div className="flex justify-between pb-12">
                  <span className="text-gray-700">Subtotal:</span>
                  <span className="text-gray-900 tabular-nums">{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between pb-12">
                  <span className="text-gray-700">Tax ({invoice.taxRate}%):</span>
                  <span className="text-gray-900 tabular-nums">{formatCurrency(invoice.taxAmount)}</span>
                </div>
                <div className="flex justify-between pt-12 border-t-2 border-gray-300">
                  <span className="text-gray-900">
                    <strong>Total Due:</strong>
                  </span>
                  <span className="text-gray-900 tabular-nums">
                    <strong>{formatCurrency(invoice.total)}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-32 border-t border-gray-300 space-y-24">
              {invoice.notes && (
                <div>
                  <div className="text-gray-700 mb-8">Notes</div>
                  <div className="text-gray-600 whitespace-pre-line">{invoice.notes}</div>
                </div>
              )}

              {settings.bankName && settings.iban && (
                <div>
                  <div className="text-gray-700 mb-8">Payment Details</div>
                  <div className="text-gray-600">
                    <div>Bank: {settings.bankName}</div>
                    <div>IBAN: {settings.iban}</div>
                    {settings.paymentInstructions && (
                      <div className="mt-8">{settings.paymentInstructions}</div>
                    )}
                  </div>
                </div>
              )}

              <div className="text-gray-600 text-sm">
                Payment Terms: {invoice.paymentTerms}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showSendModal && (
        <SendInvoiceModal
          invoice={invoice}
          onClose={() => setShowSendModal(false)}
        />
      )}
    </>
  );
};
