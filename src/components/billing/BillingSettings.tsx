import React, { useState } from 'react';
import { Upload, Save } from 'lucide-react';
import { useBilling } from '../../contexts/BillingContext';
import { toast } from 'sonner';

export const BillingSettings: React.FC = () => {
  const { settings, updateSettings } = useBilling();
  const [formData, setFormData] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateSettings(formData);
    setHasChanges(false);
    toast.success('Settings saved successfully');
  };

  const handleCancel = () => {
    setFormData(settings);
    setHasChanges(false);
  };

  const getPreviewInvoiceNumber = () => {
    const { invoicePrefix, includeYear, nextNumber } = formData;
    const year = includeYear ? `${new Date().getFullYear()}-` : '';
    const number = String(nextNumber).padStart(3, '0');
    return `${invoicePrefix}${year}${number}`;
  };

  return (
    <div className="max-w-4xl mx-auto px-24 py-32">
      <div className="space-y-32">
        {/* Company Information */}
        <div className="space-y-16">
          <h2 className="text-gray-900">Company Information</h2>
          
          <div className="space-y-16">
            <div>
              <label className="block text-gray-700 mb-8">Company Logo</label>
              <div className="flex items-center gap-16">
                <div className="w-80 h-80 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                  {formData.companyLogo ? (
                    <img src={formData.companyLogo} alt="Company logo" className="max-w-full max-h-full" />
                  ) : (
                    <Upload size={24} className="text-gray-400" />
                  )}
                </div>
                <button className="px-16 py-8 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                  Upload Logo
                </button>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-8">Company Name</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                className="w-full px-12 py-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-8">Address</label>
              <textarea
                value={formData.companyAddress}
                onChange={(e) => handleChange('companyAddress', e.target.value)}
                rows={3}
                className="w-full px-12 py-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-8">VAT Number</label>
              <input
                type="text"
                value={formData.vatNumber || ''}
                onChange={(e) => handleChange('vatNumber', e.target.value)}
                placeholder="Optional"
                className="w-full px-12 py-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="space-y-16 pt-24 border-t border-gray-200">
          <h2 className="text-gray-900">Bank Details</h2>
          
          <div className="space-y-16">
            <div>
              <label className="block text-gray-700 mb-8">Bank Name</label>
              <input
                type="text"
                value={formData.bankName || ''}
                onChange={(e) => handleChange('bankName', e.target.value)}
                placeholder="Optional"
                className="w-full px-12 py-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-8">IBAN</label>
              <input
                type="text"
                value={formData.iban || ''}
                onChange={(e) => handleChange('iban', e.target.value)}
                placeholder="Optional"
                className="w-full px-12 py-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-8">Additional Payment Instructions</label>
              <textarea
                value={formData.paymentInstructions || ''}
                onChange={(e) => handleChange('paymentInstructions', e.target.value)}
                rows={3}
                placeholder="Optional"
                className="w-full px-12 py-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Default Settings */}
        <div className="space-y-16 pt-24 border-t border-gray-200">
          <h2 className="text-gray-900">Default Settings</h2>
          
          <div className="grid grid-cols-2 gap-16">
            <div>
              <label className="block text-gray-700 mb-8">Default Tax Rate (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.defaultTaxRate}
                onChange={(e) => handleChange('defaultTaxRate', parseFloat(e.target.value) || 0)}
                className="w-full px-12 py-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-8">Default Payment Terms</label>
              <select
                value={formData.defaultPaymentTerms}
                onChange={(e) => handleChange('defaultPaymentTerms', e.target.value)}
                className="w-full px-12 py-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="NET 30">NET 30</option>
                <option value="NET 60">NET 60</option>
                <option value="NET 90">NET 90</option>
                <option value="NET 120">NET 120</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-8">Default Currency</label>
              <select
                value={formData.defaultCurrency}
                onChange={(e) => handleChange('defaultCurrency', e.target.value)}
                className="w-full px-12 py-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="CAD">CAD - Canadian Dollar</option>
                <option value="AUD">AUD - Australian Dollar</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-8">Default Time Entry Format</label>
            <div className="space-y-8">
              <label className="flex items-center gap-8 cursor-pointer">
                <input
                  type="radio"
                  name="defaultTimeEntryFormat"
                  value="grouped-person-task"
                  checked={formData.defaultTimeEntryFormat === 'grouped-person-task'}
                  onChange={(e) => handleChange('defaultTimeEntryFormat', e.target.value)}
                  className="text-blue-600 focus:ring-blue-600"
                />
                <span className="text-gray-700">Grouped by Person & Task</span>
              </label>
              <label className="flex items-center gap-8 cursor-pointer">
                <input
                  type="radio"
                  name="defaultTimeEntryFormat"
                  value="grouped-task"
                  checked={formData.defaultTimeEntryFormat === 'grouped-task'}
                  onChange={(e) => handleChange('defaultTimeEntryFormat', e.target.value)}
                  className="text-blue-600 focus:ring-blue-600"
                />
                <span className="text-gray-700">Grouped by Task</span>
              </label>
              <label className="flex items-center gap-8 cursor-pointer">
                <input
                  type="radio"
                  name="defaultTimeEntryFormat"
                  value="detailed"
                  checked={formData.defaultTimeEntryFormat === 'detailed'}
                  onChange={(e) => handleChange('defaultTimeEntryFormat', e.target.value)}
                  className="text-blue-600 focus:ring-blue-600"
                />
                <span className="text-gray-700">Detailed (individual entries)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-8">Default Expense Format</label>
            <div className="space-y-8">
              <label className="flex items-center gap-8 cursor-pointer">
                <input
                  type="radio"
                  name="defaultExpenseFormat"
                  value="detailed"
                  checked={formData.defaultExpenseFormat === 'detailed'}
                  onChange={(e) => handleChange('defaultExpenseFormat', e.target.value)}
                  className="text-blue-600 focus:ring-blue-600"
                />
                <span className="text-gray-700">Detailed (individual expenses)</span>
              </label>
              <label className="flex items-center gap-8 cursor-pointer">
                <input
                  type="radio"
                  name="defaultExpenseFormat"
                  value="combined"
                  checked={formData.defaultExpenseFormat === 'combined'}
                  onChange={(e) => handleChange('defaultExpenseFormat', e.target.value)}
                  className="text-blue-600 focus:ring-blue-600"
                />
                <span className="text-gray-700">Combined (single line item)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Invoice Numbering */}
        <div className="space-y-16 pt-24 border-t border-gray-200">
          <h2 className="text-gray-900">Invoice Numbering</h2>
          
          <div className="grid grid-cols-2 gap-16">
            <div>
              <label className="block text-gray-700 mb-8">Prefix</label>
              <input
                type="text"
                value={formData.invoicePrefix}
                onChange={(e) => handleChange('invoicePrefix', e.target.value)}
                placeholder="INV-"
                className="w-full px-12 py-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-8">Next Number</label>
              <input
                type="number"
                min="1"
                value={formData.nextNumber}
                onChange={(e) => handleChange('nextNumber', parseInt(e.target.value) || 1)}
                className="w-full px-12 py-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-8 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.includeYear}
                onChange={(e) => handleChange('includeYear', e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-600"
              />
              <span className="text-gray-700">Include year in invoice number</span>
            </label>
          </div>

          <div className="p-16 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-gray-700 mb-4">Preview</div>
            <div className="text-gray-900">{getPreviewInvoiceNumber()}</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      {hasChanges && (
        <div className="sticky bottom-0 flex items-center justify-end gap-12 mt-32 pt-24 border-t border-gray-200 bg-white">
          <button
            onClick={handleCancel}
            className="px-16 py-8 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-8 px-16 py-8 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Save size={16} />
            Save Settings
          </button>
        </div>
      )}
    </div>
  );
};
