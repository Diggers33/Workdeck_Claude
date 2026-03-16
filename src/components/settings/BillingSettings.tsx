import React, { useState } from 'react';
import { ChevronLeft, Save, Receipt, Building2 } from 'lucide-react';

interface BillingSettingsProps {
  onBack: () => void;
}

export function BillingSettings({ onBack }: BillingSettingsProps) {
  const [formData, setFormData] = useState({
    invoiceAddress: '123 Design Street, London SW1A 1AA, UK',
    defaultCurrency: 'GBP',
    vatNumber: 'GB123456789',
    defaultTaxRate: 20,
    bankName: 'HSBC Bank',
    iban: 'GB29 NWBK 6016 1331 9268 19',
    swift: 'HBUKGB4B',
    paymentTerms: 'NET 30',
    timeFormat: '24-hour',
    expenseGrouping: 'by-category'
  });

  const [hasChanges, setHasChanges] = useState(false);

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="bg-white border-b border-[#E5E7EB] sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={onBack} className="p-2 hover:bg-[#F3F4F6] rounded-lg transition-colors">
                <ChevronLeft className="w-5 h-5 text-[#6B7280]" />
              </button>
              <div>
                <h1 className="text-[20px] font-medium text-[#1F2937]">Billing</h1>
                <p className="text-[13px] text-[#6B7280]">Invoice configuration and payment details</p>
              </div>
            </div>
            <button
              disabled={!hasChanges}
              className="px-4 py-2 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-lg text-[14px] font-medium transition-colors disabled:bg-[#D1D5DB] disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-8 pb-24">
        <div className="bg-white rounded-lg border border-[#E5E7EB] divide-y divide-[#E5E7EB]">
          {/* Identity Section */}
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#F0F4FF] flex items-center justify-center">
                <Building2 className="w-5 h-5 text-[#0066FF]" />
              </div>
              <h3 className="text-[15px] font-medium text-[#1F2937]">Invoice Identity</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-1">
                  Invoice address
                </label>
                <textarea
                  value={formData.invoiceAddress}
                  onChange={(e) => updateField('invoiceAddress', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent resize-none"
                />
              </div>
            </div>
          </div>

          {/* Financial Details Section */}
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#F0F4FF] flex items-center justify-center">
                <Receipt className="w-5 h-5 text-[#0066FF]" />
              </div>
              <h3 className="text-[15px] font-medium text-[#1F2937]">Financial Details</h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-[#374151] mb-1">
                    Default currency
                  </label>
                  <select
                    value={formData.defaultCurrency}
                    onChange={(e) => updateField('defaultCurrency', e.target.value)}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                  >
                    <option value="GBP">GBP (£)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#374151] mb-1">
                    Default tax rate (%)
                  </label>
                  <input
                    type="number"
                    value={formData.defaultTaxRate}
                    onChange={(e) => updateField('defaultTaxRate', parseFloat(e.target.value))}
                    min="0"
                    max="100"
                    step="0.5"
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-1">
                  VAT number
                </label>
                <input
                  type="text"
                  value={formData.vatNumber}
                  onChange={(e) => updateField('vatNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Bank Details Section */}
          <div className="p-6">
            <h3 className="text-[15px] font-medium text-[#1F2937] mb-4">Bank Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-1">
                  Bank name
                </label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => updateField('bankName', e.target.value)}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-[#374151] mb-1">
                    IBAN
                  </label>
                  <input
                    type="text"
                    value={formData.iban}
                    onChange={(e) => updateField('iban', e.target.value)}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] font-mono focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#374151] mb-1">
                    SWIFT/BIC
                  </label>
                  <input
                    type="text"
                    value={formData.swift}
                    onChange={(e) => updateField('swift', e.target.value)}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] font-mono focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Terms Section */}
          <div className="p-6">
            <h3 className="text-[15px] font-medium text-[#1F2937] mb-4">Payment Terms</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-2">
                  Default payment schedule
                </label>
                <div className="flex gap-2">
                  {['NET 30', 'NET 60', 'NET 90', 'NET 120'].map(term => (
                    <button
                      key={term}
                      onClick={() => updateField('paymentTerms', term)}
                      className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
                        formData.paymentTerms === term
                          ? 'bg-[#0066FF] text-white'
                          : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]'
                      }`}
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Formatting Section */}
          <div className="p-6">
            <h3 className="text-[15px] font-medium text-[#1F2937] mb-4">Invoice Formatting</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-1">
                  Time display format
                </label>
                <select
                  value={formData.timeFormat}
                  onChange={(e) => updateField('timeFormat', e.target.value)}
                  className="w-full max-w-xs px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                >
                  <option value="24-hour">24-hour (15:30)</option>
                  <option value="12-hour">12-hour (3:30 PM)</option>
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-1">
                  Expense grouping
                </label>
                <select
                  value={formData.expenseGrouping}
                  onChange={(e) => updateField('expenseGrouping', e.target.value)}
                  className="w-full max-w-xs px-3 py-2 border border-[#D1D5DB] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                >
                  <option value="by-category">Group by category</option>
                  <option value="by-date">Group by date</option>
                  <option value="by-project">Group by project</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {hasChanges && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1F2937] text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-4">
          <p className="text-[13px]">You have unsaved changes</p>
          <button
            onClick={() => setHasChanges(false)}
            className="px-3 py-1.5 bg-[#0066FF] hover:bg-[#0052CC] rounded text-[12px] font-medium transition-colors"
          >
            Save now
          </button>
        </div>
      )}
    </div>
  );
}