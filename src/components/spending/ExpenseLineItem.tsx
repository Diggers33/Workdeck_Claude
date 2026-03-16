import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Trash2, Paperclip, AlertTriangle, Eye, X, Upload } from 'lucide-react';

interface ExpenseLineItemProps {
  item: {
    id: string;
    description: string;
    costType: string;
    amount: number;
    vat: number;
    currency: string;
    date: string;
    paidBy: 'employee' | 'company';
    billable: boolean;
    receipt?: {
      name: string;
      url: string;
    };
  };
  index: number;
  isExpanded: boolean;
  isReadOnly: boolean;
  onToggle: () => void;
  onUpdate: (updates: any) => void;
  onDelete: () => void;
  canDelete: boolean;
}

const costTypes = [
  'Meals & Entertainment',
  'Travel',
  'Accommodation',
  'Office Supplies',
  'Communications',
  'Professional Services',
  'Marketing',
  'Training',
  'Other'
];

const currencies = ['EUR', 'USD', 'GBP'];

export function ExpenseLineItem({
  item,
  index,
  isExpanded,
  isReadOnly,
  onToggle,
  onUpdate,
  onDelete,
  canDelete
}: ExpenseLineItemProps) {
  const [showDeleteButton, setShowDeleteButton] = useState(false);

  const itemTotal = item.amount + item.vat;
  const hasReceipt = !!item.receipt;
  const needsReceipt = item.amount > 25 && !hasReceipt;
  const hasError = !item.description || !item.costType || !item.amount;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpdate({ receipt: { name: file.name, url: URL.createObjectURL(file) } });
    }
  };

  const removeReceipt = () => {
    onUpdate({ receipt: undefined });
  };

  // Truncate description for collapsed view
  const truncatedDescription = item.description.length > 30 
    ? item.description.substring(0, 30) + '...' 
    : item.description;

  // Truncate cost type for collapsed view
  const truncatedCostType = item.costType.length > 8
    ? item.costType.substring(0, 8)
    : item.costType;

  return (
    <div 
      className="mb-2 transition-all"
      style={{
        borderLeft: hasError && !isExpanded ? '3px solid #DC2626' : 'none',
        paddingLeft: hasError && !isExpanded ? '0' : '3px'
      }}
    >
      {/* Collapsed Row */}
      <div
        className="rounded-lg transition-all"
        style={{
          backgroundColor: isExpanded ? 'white' : '#F9FAFB',
          border: isExpanded ? '1px solid #2563EB' : '1px solid #E5E7EB',
          boxShadow: isExpanded ? '0 0 0 3px rgba(37,99,235,0.1)' : 'none',
        }}
        onMouseEnter={() => setShowDeleteButton(true)}
        onMouseLeave={() => setShowDeleteButton(false)}
      >
        {/* Header Row */}
        <div
          onClick={onToggle}
          className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors"
          style={{
            height: '52px',
            padding: '0 16px',
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px',
          }}
        >
          {/* Chevron */}
          <div style={{ width: '24px', flexShrink: 0 }}>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" style={{ color: '#2563EB' }} />
            ) : (
              <ChevronRight className="w-4 h-4" style={{ color: '#9CA3AF' }} />
            )}
          </div>

          {/* Number + Description */}
          <div className="flex-1 min-w-0">
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#6B7280', marginRight: '8px' }}>
              {index + 1}.
            </span>
            <span style={{ fontSize: '14px', color: '#111827' }}>
              {item.description || '[No description]'}
            </span>
          </div>

          {/* Cost Type */}
          <div 
            className="px-2 py-1 rounded"
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: '#6B7280',
              backgroundColor: '#F3F4F6',
              minWidth: '80px',
              textAlign: 'center',
              flexShrink: 0
            }}
          >
            {truncatedCostType || '—'}
          </div>

          {/* Amount */}
          <div style={{ fontSize: '14px', fontWeight: 500, color: '#111827', minWidth: '100px', textAlign: 'right', flexShrink: 0 }}>
            {item.vat > 0 
              ? `€${item.amount.toFixed(0)}+€${item.vat.toFixed(0)}`
              : `€${item.amount.toFixed(0)}`
            }
          </div>

          {/* Receipt Indicator */}
          <div style={{ width: '40px', flexShrink: 0, textAlign: 'center' }}>
            {hasReceipt ? (
              <div 
                className="inline-flex items-center gap-1 px-2 py-1 rounded"
                style={{ backgroundColor: '#ECFDF5', color: '#059669', fontSize: '12px' }}
              >
                <Paperclip className="w-3 h-3" />
                <span>1</span>
              </div>
            ) : needsReceipt ? (
              <div 
                className="inline-flex items-center px-2 py-1 rounded"
                style={{ backgroundColor: '#FEF3C7', color: '#B45309' }}
                title="Receipt recommended"
              >
                <AlertTriangle className="w-4 h-4" />
              </div>
            ) : null}
          </div>

          {/* Delete Button */}
          {!isReadOnly && canDelete && (
            <div style={{ width: '40px', flexShrink: 0, textAlign: 'center' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-2 rounded-lg hover:bg-red-50 transition-all"
                style={{
                  opacity: showDeleteButton ? 1 : 0,
                  color: '#9CA3AF'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#DC2626';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#9CA3AF';
                }}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Expanded Form */}
        {isExpanded && (
          <div 
            className="border-t"
            style={{
              borderColor: '#E5E7EB',
              padding: '20px'
            }}
          >
            {isReadOnly ? (
              // Read-only view
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                      DESCRIPTION
                    </div>
                    <div style={{ fontSize: '14px', color: '#111827' }}>
                      {item.description}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                      COST TYPE
                    </div>
                    <div style={{ fontSize: '14px', color: '#111827' }}>
                      {item.costType}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                      AMOUNT
                    </div>
                    <div style={{ fontSize: '14px', color: '#111827' }}>
                      €{item.amount.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                      VAT
                    </div>
                    <div style={{ fontSize: '14px', color: '#111827' }}>
                      €{item.vat.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                      CURRENCY
                    </div>
                    <div style={{ fontSize: '14px', color: '#111827' }}>
                      {item.currency}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                      DATE
                    </div>
                    <div style={{ fontSize: '14px', color: '#111827' }}>
                      {new Date(item.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                      PAID BY
                    </div>
                    <div style={{ fontSize: '14px', color: '#111827', textTransform: 'capitalize' }}>
                      {item.paidBy}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                      BILLABLE
                    </div>
                    <div style={{ fontSize: '14px', color: '#111827' }}>
                      {item.billable ? 'Yes' : 'No'}
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                    RECEIPT
                  </div>
                  {hasReceipt ? (
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border rounded-lg" style={{ borderColor: '#E5E7EB' }}>
                      <Paperclip className="w-4 h-4" style={{ color: '#6B7280' }} />
                      <span style={{ fontSize: '14px', color: '#111827' }}>{item.receipt!.name}</span>
                      <button
                        onClick={() => window.open(item.receipt!.url, '_blank')}
                        className="ml-auto p-1 hover:bg-gray-200 rounded transition-colors"
                      >
                        <Eye className="w-4 h-4" style={{ color: '#6B7280' }} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ fontSize: '14px', color: '#9CA3AF' }}>
                      No receipt attached
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Editable form
              <div className="space-y-4">
                {/* Row 1: Description + Cost Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div style={{ flex: '1.5' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                      DESCRIPTION <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => onUpdate({ description: e.target.value })}
                      placeholder="What did you pay for?"
                      className="w-full px-3 border rounded-lg"
                      style={{
                        fontSize: '14px',
                        borderColor: !item.description ? '#DC2626' : '#E5E7EB',
                        height: '40px'
                      }}
                    />
                  </div>
                  <div style={{ flex: '1' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                      COST TYPE <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <select
                      value={item.costType}
                      onChange={(e) => onUpdate({ costType: e.target.value })}
                      className="w-full px-3 border rounded-lg"
                      style={{
                        fontSize: '14px',
                        borderColor: !item.costType ? '#DC2626' : '#E5E7EB',
                        height: '40px'
                      }}
                    >
                      <option value="">Select type...</option>
                      {costTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 2: Amount + VAT + Currency + Date */}
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                      AMOUNT <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <input
                      type="number"
                      value={item.amount}
                      onChange={(e) => onUpdate({ amount: parseFloat(e.target.value) || 0 })}
                      step="0.01"
                      min="0"
                      className="w-full px-3 border rounded-lg"
                      style={{
                        fontSize: '14px',
                        borderColor: '#E5E7EB',
                        height: '40px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                      VAT
                    </label>
                    <input
                      type="number"
                      value={item.vat}
                      onChange={(e) => onUpdate({ vat: parseFloat(e.target.value) || 0 })}
                      step="0.01"
                      min="0"
                      className="w-full px-3 border rounded-lg"
                      style={{
                        fontSize: '14px',
                        borderColor: '#E5E7EB',
                        height: '40px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                      CURRENCY <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <select
                      value={item.currency}
                      onChange={(e) => onUpdate({ currency: e.target.value })}
                      className="w-full px-3 border rounded-lg"
                      style={{
                        fontSize: '14px',
                        borderColor: '#E5E7EB',
                        height: '40px'
                      }}
                    >
                      {currencies.map(curr => (
                        <option key={curr} value={curr}>{curr}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                      DATE <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <input
                      type="date"
                      value={item.date}
                      onChange={(e) => onUpdate({ date: e.target.value })}
                      className="w-full px-3 border rounded-lg"
                      style={{
                        fontSize: '14px',
                        borderColor: '#E5E7EB',
                        height: '40px'
                      }}
                    />
                  </div>
                </div>

                {/* Row 3: Paid By + Billable */}
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                      PAID BY <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <div className="flex items-center gap-6" style={{ height: '40px' }}>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={item.paidBy === 'employee'}
                          onChange={() => onUpdate({ paidBy: 'employee' })}
                          className="w-4 h-4"
                          style={{ accentColor: '#2563EB' }}
                        />
                        <span style={{ fontSize: '14px', color: '#374151' }}>Employee</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={item.paidBy === 'company'}
                          onChange={() => onUpdate({ paidBy: 'company' })}
                          className="w-4 h-4"
                          style={{ accentColor: '#2563EB' }}
                        />
                        <span style={{ fontSize: '14px', color: '#374151' }}>Company</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex items-center" style={{ height: '40px' }}>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.billable}
                        onChange={(e) => onUpdate({ billable: e.target.checked })}
                        className="w-4 h-4 rounded"
                        style={{ accentColor: '#2563EB' }}
                      />
                      <span style={{ fontSize: '14px', color: '#374151' }}>Billable to client</span>
                    </label>
                  </div>
                </div>

                {/* Row 4: Receipt Upload */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                    RECEIPT
                  </label>
                  
                  {hasReceipt ? (
                    <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border rounded-lg" style={{ borderColor: '#E5E7EB', height: '44px' }}>
                      <div className="flex items-center gap-2">
                        <Paperclip className="w-4 h-4" style={{ color: '#6B7280' }} />
                        <span style={{ fontSize: '14px', color: '#374151' }}>{item.receipt!.name}</span>
                        <span style={{ fontSize: '13px', color: '#9CA3AF' }}>(245 KB)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => window.open(item.receipt!.url, '_blank')}
                          className="px-2 py-1 hover:bg-gray-200 rounded transition-colors"
                          style={{ fontSize: '13px', color: '#2563EB' }}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={removeReceipt}
                          className="px-2 py-1 hover:bg-red-50 rounded transition-colors"
                          style={{ fontSize: '13px', color: '#DC2626' }}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label 
                      className="flex items-center justify-center border-2 border-dashed rounded-lg cursor-pointer transition-all hover:border-blue-500 hover:bg-blue-50"
                      style={{
                        borderColor: '#D1D5DB',
                        height: '48px',
                        backgroundColor: '#FAFAFA'
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Upload className="w-5 h-5" style={{ color: '#6B7280' }} />
                        <span style={{ fontSize: '13px', color: '#6B7280' }}>
                          Drop file or click to upload · PDF, JPG, PNG up to 10MB
                        </span>
                      </div>
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                      />
                    </label>
                  )}

                  {needsReceipt && !hasReceipt && (
                    <div className="flex items-center gap-2 mt-2">
                      <AlertTriangle className="w-4 h-4" style={{ color: '#B45309' }} />
                      <span style={{ fontSize: '12px', color: '#B45309' }}>
                        Receipt recommended for expenses over €25
                      </span>
                    </div>
                  )}
                </div>

                {/* Row 5: Item Total */}
                <div className="pt-3 border-t" style={{ borderColor: '#E5E7EB' }}>
                  <div className="flex justify-between items-center">
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Item Total
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                      €{itemTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
