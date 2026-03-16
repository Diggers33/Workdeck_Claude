import React, { useEffect, useState } from 'react';
import { ArrowLeft, Calendar } from 'lucide-react';
import { InvoiceFormData } from './InvoiceCreationFlow';
import { BillingSettings as BillingSettingsType } from '../../contexts/BillingContext';
import type { ClientEntry, ProjectSummary } from '../../services/dashboard-api';
import { useClients, useProjectsSummary } from '../../hooks/useApiQueries';

interface InvoiceSetupStepProps {
  formData: InvoiceFormData;
  updateFormData: (data: Partial<InvoiceFormData>) => void;
  onNext: () => void;
  onCancel: () => void;
  settings: BillingSettingsType;
}

export function InvoiceSetupStep({ formData, updateFormData, onNext, onCancel, settings }: InvoiceSetupStepProps) {
  // Fetch clients and projects via TanStack Query
  const { data: clients = [] } = useClients();
  const { data: projects = [] } = useProjectsSummary();

  // Generate invoice number if not set
  useEffect(() => {
    if (!formData.invoiceNumber) {
      const year = new Date().getFullYear();
      const nextNumber = 46;
      updateFormData({
        invoiceNumber: `INV-${year}-${String(nextNumber).padStart(3, '0')}`,
        invoiceDate: new Date().toISOString().split('T')[0],
        taxRate: settings.defaultTaxRate,
        paymentTerms: settings.defaultPaymentTerms,
      });
    }
  }, []);

  // Calculate due date based on payment terms
  useEffect(() => {
    if (formData.invoiceDate && formData.paymentTerms) {
      const invoiceDate = new Date(formData.invoiceDate);
      const terms = formData.paymentTerms.replace('NET ', '');
      const days = parseInt(terms);
      const dueDate = new Date(invoiceDate);
      dueDate.setDate(dueDate.getDate() + days);
      updateFormData({ dueDate: dueDate.toISOString().split('T')[0] });
    }
  }, [formData.invoiceDate, formData.paymentTerms]);

  const canProceed = formData.clientName && formData.projectName && formData.invoiceNumber;

  const formatDateDisplay = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Page Header */}
      <div
        className="flex-none bg-white border-b flex items-center justify-between px-24"
        style={{
          height: '56px',
          borderColor: '#E5E7EB',
        }}
      >
        <div className="flex items-center gap-12">
          <button
            onClick={onCancel}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-gray-900" style={{ fontSize: '18px', fontWeight: 600 }}>
            New Invoice
          </h1>
        </div>
        <div className="text-gray-500" style={{ fontSize: '14px' }}>
          Step 1/3
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-[800px] mx-auto px-24 py-32 space-y-24">
          {/* Section 1: Invoice Setup */}
          <div className="bg-white border border-gray-200 rounded-xl p-24">
            <h2 className="text-gray-900 mb-20" style={{ fontSize: '14px', fontWeight: 600 }}>
              Invoice Setup
            </h2>

            <div className="space-y-20">
              {/* Row 1: Client + Project */}
              <div className="grid grid-cols-2 gap-16">
                <div>
                  <label className="block text-gray-500 uppercase mb-6" style={{ fontSize: '12px', fontWeight: 500 }}>
                    Client <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={formData.clientName || ''}
                    onChange={(e) => updateFormData({ clientName: e.target.value })}
                    className="w-full px-12 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 bg-white text-gray-900 transition-all"
                    style={{ height: '44px', fontSize: '14px' }}
                  >
                    <option value="">Select client...</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-500 uppercase mb-6" style={{ fontSize: '12px', fontWeight: 500 }}>
                    Project <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={formData.projectName || ''}
                    onChange={(e) => updateFormData({ projectName: e.target.value })}
                    className="w-full px-12 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 bg-white text-gray-900 transition-all"
                    style={{ height: '44px', fontSize: '14px' }}
                  >
                    <option value="">Select project...</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Invoice # + Invoice Date + PO Number */}
              <div className="grid gap-16" style={{ gridTemplateColumns: '30% 30% 40%' }}>
                <div>
                  <label className="block text-gray-500 uppercase mb-6" style={{ fontSize: '12px', fontWeight: 500 }}>
                    Invoice #
                  </label>
                  <input
                    type="text"
                    value={formData.invoiceNumber || ''}
                    onChange={(e) => updateFormData({ invoiceNumber: e.target.value })}
                    className="w-full px-12 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 text-gray-900 transition-all"
                    style={{ height: '44px', fontSize: '14px' }}
                  />
                </div>

                <div>
                  <label className="block text-gray-500 uppercase mb-6" style={{ fontSize: '12px', fontWeight: 500 }}>
                    Invoice Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={formData.invoiceDate || ''}
                      onChange={(e) => updateFormData({ invoiceDate: e.target.value })}
                      className="w-full px-12 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 text-gray-900 transition-all"
                      style={{ height: '44px', fontSize: '14px' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-500 uppercase mb-6" style={{ fontSize: '12px', fontWeight: 500 }}>
                    PO Number
                  </label>
                  <input
                    type="text"
                    value={formData.poNumber || ''}
                    onChange={(e) => updateFormData({ poNumber: e.target.value })}
                    placeholder="Optional"
                    className="w-full px-12 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 text-gray-900 placeholder-gray-400 transition-all"
                    style={{ height: '44px', fontSize: '14px' }}
                  />
                </div>
              </div>

              {/* Row 3: Invoice Title */}
              <div>
                <label className="block text-gray-500 uppercase mb-6" style={{ fontSize: '12px', fontWeight: 500 }}>
                  Invoice Title
                </label>
                <input
                  type="text"
                  value={formData.invoiceTitle || ''}
                  onChange={(e) => updateFormData({ invoiceTitle: e.target.value })}
                  placeholder="e.g., November 2024 Services"
                  className="w-full px-12 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 text-gray-900 placeholder-gray-400 transition-all"
                  style={{ height: '44px', fontSize: '14px' }}
                />
                <p className="text-gray-400 mt-4" style={{ fontSize: '12px' }}>
                  Optional - appears on invoice header
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Billing Period & Terms */}
          <div className="bg-white border border-gray-200 rounded-xl p-24">
            <h2 className="text-gray-900 mb-20" style={{ fontSize: '14px', fontWeight: 600 }}>
              Billing Period & Terms
            </h2>

            <div className="space-y-20">
              {/* Row 1: Billing Period */}
              <div>
                <label className="block text-gray-500 uppercase mb-6" style={{ fontSize: '12px', fontWeight: 500 }}>
                  Billing Period
                </label>
                <div className="flex items-center gap-12">
                  <input
                    type="date"
                    value={formData.billablePeriodStart || ''}
                    onChange={(e) => updateFormData({ billablePeriodStart: e.target.value })}
                    className="flex-1 px-12 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 text-gray-900 transition-all"
                    style={{ height: '44px', fontSize: '14px' }}
                  />
                  <span className="text-gray-400 flex-none">→</span>
                  <input
                    type="date"
                    value={formData.billablePeriodEnd || ''}
                    onChange={(e) => updateFormData({ billablePeriodEnd: e.target.value })}
                    className="flex-1 px-12 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 text-gray-900 transition-all"
                    style={{ height: '44px', fontSize: '14px' }}
                  />
                </div>
                <p className="text-gray-400 mt-4" style={{ fontSize: '12px' }}>
                  Filter time entries and expenses by this date range
                </p>
              </div>

              {/* Row 2: Payment Terms + Due Date + Tax Rate */}
              <div className="grid grid-cols-3 gap-16">
                <div>
                  <label className="block text-gray-500 uppercase mb-6" style={{ fontSize: '12px', fontWeight: 500 }}>
                    Payment Terms
                  </label>
                  <select
                    value={formData.paymentTerms || ''}
                    onChange={(e) => updateFormData({ paymentTerms: e.target.value })}
                    className="w-full px-12 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 bg-white text-gray-900 transition-all"
                    style={{ height: '44px', fontSize: '14px' }}
                  >
                    <option value="NET 15">NET 15</option>
                    <option value="NET 30">NET 30</option>
                    <option value="NET 45">NET 45</option>
                    <option value="NET 60">NET 60</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-500 uppercase mb-6" style={{ fontSize: '12px', fontWeight: 500 }}>
                    Due Date
                  </label>
                  <div
                    className="flex items-center px-12 border border-gray-200 rounded-lg bg-gray-50 text-gray-700"
                    style={{ height: '44px', fontSize: '14px', cursor: 'default' }}
                  >
                    {formData.dueDate ? formatDateDisplay(formData.dueDate) : '—'}
                  </div>
                  <p className="text-gray-400 mt-4" style={{ fontSize: '12px' }}>
                    Auto-calculated
                  </p>
                </div>

                <div>
                  <label className="block text-gray-500 uppercase mb-6" style={{ fontSize: '12px', fontWeight: 500 }}>
                    Tax Rate
                  </label>
                  <div className="flex items-center gap-8">
                    <input
                      type="number"
                      value={formData.taxRate || ''}
                      onChange={(e) => updateFormData({ taxRate: parseFloat(e.target.value) || 0 })}
                      step="0.1"
                      className="flex-1 px-12 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 text-gray-900 tabular-nums text-right transition-all"
                      style={{ height: '44px', fontSize: '14px' }}
                    />
                    <span className="text-gray-500 flex-none" style={{ fontSize: '14px' }}>%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className="flex-none bg-white border-t flex items-center justify-between px-24"
        style={{
          height: '72px',
          borderColor: '#E5E7EB',
        }}
      >
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 transition-colors"
          style={{ fontSize: '14px' }}
        >
          Cancel
        </button>

        <button
          onClick={onNext}
          disabled={!canProceed}
          className="px-20 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-8"
          style={{ height: '44px', fontSize: '14px', fontWeight: 600 }}
        >
          Next: Select Items →
        </button>
      </div>
    </div>
  );
}
