import React from 'react';
import { InvoiceFormData } from './InvoiceCreationFlow';

interface InvoiceReviewStepProps {
  formData: InvoiceFormData;
  updateFormData: (data: Partial<InvoiceFormData>) => void;
  onBack: () => void;
  onSaveDraft: () => void;
  onComplete: () => void;
  totals: {
    subtotal: number;
    taxAmount: number;
    total: number;
  };
}

export const InvoiceReviewStep: React.FC<InvoiceReviewStepProps> = ({
  formData,
  updateFormData,
  onBack,
  onSaveDraft,
  onComplete,
  totals,
}) => {
  // Calculate line item details
  const timeEntriesCount = (formData.timeEntries || []).filter(e => e.selected).length;
  const timeEntriesHours = (formData.timeEntries || [])
    .filter(e => e.selected)
    .reduce((sum, e) => sum + e.hours, 0);
  const timeEntriesTotal = (formData.timeEntries || [])
    .filter(e => e.selected)
    .reduce((sum, e) => sum + e.amount, 0);

  const expensesCount = (formData.expenses || []).filter(e => e.selected).length;
  const expensesTotal = (formData.expenses || [])
    .filter(e => e.selected)
    .reduce((sum, e) => sum + e.amount, 0);

  const milestonesCount = (formData.milestones || []).filter(m => m.selected).length;
  const milestonesTotal = (formData.milestones || [])
    .filter(m => m.selected)
    .reduce((sum, m) => sum + m.amount, 0);

  const additionalCount = (formData.additionalItems || []).length;
  const additionalTotal = (formData.additionalItems || []).reduce((sum, item) => sum + item.amount, 0);

  const { subtotal, taxAmount, total } = totals;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-24 py-20">
          <div className="grid grid-cols-12 gap-20">
            {/* Left Column - Invoice Preview Document */}
            <div className="col-span-8">
              {/* Invoice Document */}
              <div className="bg-white border border-gray-200 rounded" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                {/* Document Header */}
                <div className="px-32 pt-32 pb-24 border-b border-gray-200">
                  <div className="flex items-start justify-between mb-24">
                    <div>
                      <div className="text-gray-400 text-xs uppercase tracking-wider mb-6" style={{ letterSpacing: '0.8px' }}>Invoice</div>
                      <div className="text-gray-900" style={{ fontSize: '24px', fontWeight: 600, letterSpacing: '-0.3px' }}>
                        {formData.invoiceNumber}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-900 mb-4" style={{ fontSize: '15px', fontWeight: 600 }}>Workdeck Agency</div>
                      <div className="text-gray-500 text-xs leading-relaxed">
                        123 Design Street<br />
                        San Francisco, CA 94102<br />
                        hello@workdeck.com
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-20">
                    <div>
                      <div className="text-gray-400 text-xs uppercase tracking-wider mb-6" style={{ letterSpacing: '0.8px' }}>Bill To</div>
                      <div className="text-gray-900 mb-2" style={{ fontSize: '14px', fontWeight: 600 }}>{formData.clientName}</div>
                      <div className="text-gray-600 text-xs">{formData.projectName}</div>
                    </div>
                    <div>
                      <div className="grid grid-cols-2 gap-x-12 gap-y-6 text-xs">
                        <div className="text-gray-500">Invoice Date</div>
                        <div className="text-gray-900 text-right">{formData.invoiceDate && formatDate(formData.invoiceDate)}</div>
                        
                        <div className="text-gray-500">Due Date</div>
                        <div className="text-gray-900 text-right">{formData.dueDate && formatDate(formData.dueDate)}</div>
                        
                        {formData.poNumber && (
                          <>
                            <div className="text-gray-500">PO Number</div>
                            <div className="text-gray-900 text-right">{formData.poNumber}</div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="px-32 py-20">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left pb-8 text-gray-500 text-xs uppercase tracking-wider" style={{ letterSpacing: '0.8px', fontWeight: 600 }}>Description</th>
                        <th className="text-right pb-8 text-gray-500 text-xs uppercase tracking-wider" style={{ letterSpacing: '0.8px', fontWeight: 600, width: '100px' }}>Qty</th>
                        <th className="text-right pb-8 text-gray-500 text-xs uppercase tracking-wider" style={{ letterSpacing: '0.8px', fontWeight: 600, width: '120px' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs">
                      {timeEntriesCount > 0 && (
                        <tr className="border-b border-gray-100">
                          <td className="py-12">
                            <div className="text-gray-900 mb-2" style={{ fontSize: '13px', fontWeight: 500 }}>Professional Services - Time</div>
                            <div className="text-gray-500">Billable hours for project work</div>
                          </td>
                          <td className="py-12 text-right text-gray-600 align-top">{timeEntriesHours} hrs</td>
                          <td className="py-12 text-right text-gray-900 tabular-nums align-top">{formatCurrency(timeEntriesTotal)}</td>
                        </tr>
                      )}
                      
                      {expensesCount > 0 && (
                        <tr className="border-b border-gray-100">
                          <td className="py-12">
                            <div className="text-gray-900 mb-2" style={{ fontSize: '13px', fontWeight: 500 }}>Reimbursable Expenses</div>
                            <div className="text-gray-500">Project-related expenses and materials</div>
                          </td>
                          <td className="py-12 text-right text-gray-600 align-top">{expensesCount} items</td>
                          <td className="py-12 text-right text-gray-900 tabular-nums align-top">{formatCurrency(expensesTotal)}</td>
                        </tr>
                      )}
                      
                      {milestonesCount > 0 && (
                        <tr className="border-b border-gray-100">
                          <td className="py-12">
                            <div className="text-gray-900 mb-2" style={{ fontSize: '13px', fontWeight: 500 }}>Milestone Deliverables</div>
                            <div className="text-gray-500">Completed project milestones</div>
                          </td>
                          <td className="py-12 text-right text-gray-600 align-top">{milestonesCount} items</td>
                          <td className="py-12 text-right text-gray-900 tabular-nums align-top">{formatCurrency(milestonesTotal)}</td>
                        </tr>
                      )}
                      
                      {additionalCount > 0 && (
                        <tr className="border-b border-gray-100">
                          <td className="py-12">
                            <div className="text-gray-900 mb-2" style={{ fontSize: '13px', fontWeight: 500 }}>Additional Items</div>
                            <div className="text-gray-500">Miscellaneous charges</div>
                          </td>
                          <td className="py-12 text-right text-gray-600 align-top">{additionalCount} items</td>
                          <td className="py-12 text-right text-gray-900 tabular-nums align-top">{formatCurrency(additionalTotal)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Totals Section */}
                <div className="px-32 pb-32 pt-8">
                  <div className="flex justify-end">
                    <div style={{ width: '280px' }}>
                      <div className="space-y-8 pb-12 mb-12 border-b border-gray-200">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Subtotal</span>
                          <span className="text-gray-900 tabular-nums">{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Tax ({formData.taxRate}%)</span>
                          <span className="text-gray-900 tabular-nums">{formatCurrency(taxAmount)}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between" style={{ fontSize: '16px', fontWeight: 600 }}>
                        <span className="text-gray-900">Total Due</span>
                        <span className="text-gray-900 tabular-nums">{formatCurrency(total)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes Section */}
                {formData.notes && (
                  <div className="px-32 pb-32 pt-8 border-t border-gray-200">
                    <div className="text-gray-500 text-xs uppercase tracking-wider mb-8" style={{ letterSpacing: '0.8px' }}>Notes</div>
                    <div className="text-gray-600 text-xs leading-relaxed whitespace-pre-wrap">{formData.notes}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Notes Editor & Summary */}
            <div className="col-span-4 space-y-16">
              {/* Notes Editor */}
              <div className="bg-white border border-gray-200 rounded p-16">
                <div className="mb-8">
                  <label className="text-gray-900 text-xs block mb-2" style={{ fontWeight: 600 }}>Invoice Notes</label>
                  <p className="text-gray-500 text-xs">Payment terms and instructions</p>
                </div>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => updateFormData({ notes: e.target.value })}
                  placeholder="Thank you for your business. Payment is due within 30 days."
                  rows={6}
                  className="w-full px-10 py-8 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                  style={{ lineHeight: '1.5' }}
                />
              </div>

              {/* Quick Summary */}
              <div className="bg-white border border-gray-200 rounded p-16">
                <div className="text-gray-900 text-xs mb-12" style={{ fontWeight: 600 }}>Summary</div>
                <div className="space-y-8 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Line Items</span>
                    <span className="text-gray-900">
                      {timeEntriesCount + expensesCount + milestonesCount + additionalCount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="text-gray-900 tabular-nums">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tax</span>
                    <span className="text-gray-900 tabular-nums">{formatCurrency(taxAmount)}</span>
                  </div>
                  <div className="flex justify-between pt-8 border-t border-gray-200">
                    <span className="text-gray-900" style={{ fontWeight: 600 }}>Total</span>
                    <span className="text-gray-900 tabular-nums" style={{ fontWeight: 600 }}>{formatCurrency(total)}</span>
                  </div>
                  <div className="flex justify-between pt-8 border-t border-gray-200">
                    <span className="text-gray-500">Due Date</span>
                    <span className="text-gray-900">{formData.dueDate && formatDate(formData.dueDate)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - 48px */}
      <div
        className="flex-none border-t bg-white flex items-center justify-between"
        style={{
          borderColor: '#E5E7EB',
          height: '48px',
          padding: '0 24px',
        }}
      >
        <button
          onClick={onBack}
          className="px-12 py-6 border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <div className="flex gap-8">
          <button
            onClick={onSaveDraft}
            className="px-12 py-6 border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-50 transition-colors"
          >
            Save Draft
          </button>
          <button
            onClick={onComplete}
            className="px-16 py-6 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
            style={{ fontWeight: 600 }}
          >
            Save Invoice
          </button>
        </div>
      </div>
    </div>
  );
};
