import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { InvoiceSetupStep } from './InvoiceSetupStep';
import { InvoiceLineItemsStep } from './InvoiceLineItemsStep';
import { InvoiceReviewStep } from './InvoiceReviewStep';
import { Invoice, useBilling } from '../../contexts/BillingContext';

interface InvoiceCreationFlowProps {
  invoiceId?: string | null;
  onCancel: () => void;
  onComplete: (invoiceId: string) => void;
}

export type InvoiceFormData = Partial<Invoice>;

export const InvoiceCreationFlow: React.FC<InvoiceCreationFlowProps> = ({
  invoiceId,
  onCancel,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<InvoiceFormData>({});
  const { invoices, addInvoice, updateInvoice, settings } = useBilling();

  // Load existing invoice for editing
  useEffect(() => {
    if (invoiceId) {
      const invoice = invoices.find(inv => inv.id === invoiceId);
      if (invoice) {
        setFormData(invoice);
      }
    }
  }, [invoiceId, invoices]);

  const updateFormData = (data: Partial<InvoiceFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const calculateTotals = (data: InvoiceFormData) => {
    const timeEntriesTotal = (data.timeEntries || [])
      .filter(entry => entry.selected)
      .reduce((sum, entry) => sum + entry.amount, 0);

    const expensesTotal = (data.expenses || [])
      .filter(expense => expense.selected)
      .reduce((sum, expense) => sum + expense.amount, 0);

    const milestonesTotal = (data.milestones || [])
      .filter(milestone => milestone.selected)
      .reduce((sum, milestone) => sum + milestone.amount, 0);

    const additionalItemsTotal = (data.additionalItems || [])
      .reduce((sum, item) => sum + item.amount, 0);

    const subtotal = timeEntriesTotal + expensesTotal + milestonesTotal + additionalItemsTotal;
    const taxAmount = subtotal * ((data.taxRate || 0) / 100);
    const total = subtotal + taxAmount;

    return { subtotal, taxAmount, total };
  };

  const handleSaveDraft = () => {
    const totals = calculateTotals(formData);
    const invoiceData: Invoice = {
      id: invoiceId || `INV-${Date.now()}`,
      invoiceNumber: formData.invoiceNumber || '',
      clientName: formData.clientName || '',
      projectName: formData.projectName || '',
      invoiceDate: formData.invoiceDate || new Date().toISOString().split('T')[0],
      dueDate: formData.dueDate || '',
      status: 'draft',
      timeEntries: formData.timeEntries || [],
      expenses: formData.expenses || [],
      milestones: formData.milestones || [],
      additionalItems: formData.additionalItems || [],
      subtotal: totals.subtotal,
      taxRate: formData.taxRate || 0,
      taxAmount: totals.taxAmount,
      total: totals.total,
      notes: formData.notes || '',
      billablePeriodStart: formData.billablePeriodStart,
      billablePeriodEnd: formData.billablePeriodEnd,
      poNumber: formData.poNumber,
      invoiceTitle: formData.invoiceTitle,
      paymentTerms: formData.paymentTerms,
    };

    if (invoiceId) {
      updateInvoice(invoiceId, invoiceData);
    } else {
      addInvoice(invoiceData);
    }
    onCancel();
  };

  const handleComplete = () => {
    const totals = calculateTotals(formData);
    const invoiceData: Invoice = {
      id: invoiceId || `INV-${Date.now()}`,
      invoiceNumber: formData.invoiceNumber || '',
      clientName: formData.clientName || '',
      projectName: formData.projectName || '',
      invoiceDate: formData.invoiceDate || new Date().toISOString().split('T')[0],
      dueDate: formData.dueDate || '',
      status: 'draft',
      timeEntries: formData.timeEntries || [],
      expenses: formData.expenses || [],
      milestones: formData.milestones || [],
      additionalItems: formData.additionalItems || [],
      subtotal: totals.subtotal,
      taxRate: formData.taxRate || 0,
      taxAmount: totals.taxAmount,
      total: totals.total,
      notes: formData.notes || '',
      billablePeriodStart: formData.billablePeriodStart,
      billablePeriodEnd: formData.billablePeriodEnd,
      poNumber: formData.poNumber,
      invoiceTitle: formData.invoiceTitle,
      paymentTerms: formData.paymentTerms,
    };

    if (invoiceId) {
      updateInvoice(invoiceId, invoiceData);
      onComplete(invoiceId);
    } else {
      const newId = `INV-${Date.now()}`;
      addInvoice({ ...invoiceData, id: newId });
      onComplete(newId);
    }
  };

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Compact Header - 48px */}
      <div
        className="flex-none border-b"
        style={{
          borderColor: '#E5E7EB',
          height: '48px',
        }}
      >
        <div className="flex items-center justify-between h-full" style={{ padding: '0 20px' }}>
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="flex items-center justify-center hover:bg-gray-50 transition-colors rounded"
              style={{
                width: '32px',
                height: '32px',
                color: '#6B7280',
              }}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 style={{ fontSize: '18px', fontWeight: 600, color: '#111827' }}>
              {invoiceId ? 'Edit Invoice' : 'New Invoice'}
            </h1>
          </div>

          <div style={{ fontSize: '13px', fontWeight: 500, color: '#6B7280' }}>
            Step {currentStep}/3
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex">
        {currentStep === 1 && (
          <InvoiceSetupStep
            formData={formData}
            updateFormData={updateFormData}
            onNext={handleNext}
            onCancel={onCancel}
            settings={settings}
          />
        )}

        {currentStep === 2 && (
          <InvoiceLineItemsStep
            formData={formData}
            updateFormData={updateFormData}
            onNext={handleNext}
            onBack={handleBack}
            onSaveDraft={handleSaveDraft}
          />
        )}

        {currentStep === 3 && (
          <InvoiceReviewStep
            formData={formData}
            updateFormData={updateFormData}
            onBack={handleBack}
            onSaveDraft={handleSaveDraft}
            onComplete={handleComplete}
            totals={calculateTotals(formData)}
          />
        )}
      </div>
    </div>
  );
};
