import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Trash2, Paperclip, Plus, Eye, X, Upload } from 'lucide-react';

interface PurchaseLineItemProps {
  item: {
    id: string;
    description: string;
    supplier: string;
    productCode: string;
    costType: string;
    quantity: number;
    unitPrice: number;
    vatPercent: number;
    billable: boolean;
    attachments: Array<{
      name: string;
      url: string;
    }>;
  };
  index: number;
  isExpanded: boolean;
  isReadOnly: boolean;
  onToggle: () => void;
  onUpdate: (updates: any) => void;
  onDelete: () => void;
  onAddSupplier: () => void;
  canDelete: boolean;
}

const costTypes = [
  'Equipment',
  'Software',
  'Cloud Services',
  'Office Supplies',
  'Professional Services',
  'Marketing',
  'Travel',
  'Training',
  'Other'
];

const suppliers = ['TechSupplies Ltd', 'OfficeDepot', 'Amazon AWS'];

export function PurchaseLineItem({
  item,
  index,
  isExpanded,
  isReadOnly,
  onToggle,
  onUpdate,
  onDelete,
  onAddSupplier,
  canDelete
}: PurchaseLineItemProps) {
  const [showDeleteButton, setShowDeleteButton] = useState(false);

  const itemSubtotal = item.quantity * item.unitPrice;
  const itemVat = itemSubtotal * (item.vatPercent / 100);
  const itemTotal = itemSubtotal + itemVat;
  const hasAttachments = item.attachments.length > 0;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpdate({ 
        attachments: [...item.attachments, { name: file.name, url: URL.createObjectURL(file) }] 
      });
    }
  };

  const removeAttachment = (attachmentIndex: number) => {
    onUpdate({
      attachments: item.attachments.filter((_, i) => i !== attachmentIndex)
    });
  };

  // Truncate description for collapsed view
  const truncatedDescription = item.description.length > 25
    ? item.description.substring(0, 25) + '...'
    : item.description;

  return (
    <div className="mb-2 transition-all">
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

          {/* Supplier */}
          <div 
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: '#6B7280',
              minWidth: '120px',
              textAlign: 'left',
              flexShrink: 0
            }}
          >
            {item.supplier || '—'}
          </div>

          {/* Qty × Price */}
          <div style={{ fontSize: '13px', color: '#6B7280', minWidth: '80px', textAlign: 'right', flexShrink: 0 }}>
            {item.quantity}×€{item.unitPrice.toFixed(0)}
          </div>

          {/* Total */}
          <div style={{ fontSize: '14px', fontWeight: 500, color: '#111827', minWidth: '80px', textAlign: 'right', flexShrink: 0 }}>
            €{itemTotal.toFixed(0)}
          </div>

          {/* Attachment Indicator */}
          <div style={{ width: '40px', flexShrink: 0, textAlign: 'center' }}>
            {hasAttachments && (
              <div 
                className="inline-flex items-center gap-1 px-2 py-1 rounded"
                style={{ backgroundColor: '#ECFDF5', color: '#059669', fontSize: '12px' }}
              >
                <Paperclip className="w-3 h-3" />
              </div>
            )}
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
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                    DESCRIPTION
                  </div>
                  <div style={{ fontSize: '14px', color: '#111827' }}>
                    {item.description}
                  </div>
                  <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>
                    Max 500 characters
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                      SUPPLIER
                    </div>
                    <div style={{ fontSize: '14px', color: '#111827' }}>
                      {item.supplier}
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

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                      PRODUCT CODE
                    </div>
                    <div style={{ fontSize: '14px', color: '#111827' }}>
                      {item.productCode || '—'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                      QUANTITY
                    </div>
                    <div style={{ fontSize: '14px', color: '#111827' }}>
                      {item.quantity}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                      UNIT PRICE
                    </div>
                    <div style={{ fontSize: '14px', color: '#111827' }}>
                      €{item.unitPrice.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                      VAT %
                    </div>
                    <div style={{ fontSize: '14px', color: '#111827' }}>
                      {item.vatPercent}%
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
                    ATTACHMENTS
                  </div>
                  {hasAttachments ? (
                    <div className="space-y-2">
                      {item.attachments.map((attachment, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-2 bg-gray-50 border rounded-lg" style={{ borderColor: '#E5E7EB' }}>
                          <Paperclip className="w-4 h-4" style={{ color: '#6B7280' }} />
                          <span style={{ fontSize: '14px', color: '#111827' }}>{attachment.name}</span>
                          <button
                            onClick={() => window.open(attachment.url, '_blank')}
                            className="ml-auto p-1 hover:bg-gray-200 rounded transition-colors"
                          >
                            <Eye className="w-4 h-4" style={{ color: '#6B7280' }} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '14px', color: '#9CA3AF' }}>
                      No attachments
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Editable form
              <div className="space-y-4">
                {/* Description */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                    DESCRIPTION <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <textarea
                    value={item.description}
                    onChange={(e) => onUpdate({ description: e.target.value })}
                    placeholder="What did you pay for?"
                    rows={2}
                    maxLength={500}
                    className="w-full px-3 py-2 border rounded-lg resize-none"
                    style={{
                      fontSize: '14px',
                      borderColor: !item.description ? '#DC2626' : '#E5E7EB'
                    }}
                  />
                  <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>
                    Max 500 characters
                  </div>
                </div>

                {/* Supplier + Cost Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                      SUPPLIER <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <select
                      value={item.supplier}
                      onChange={(e) => onUpdate({ supplier: e.target.value })}
                      className="w-full px-3 border rounded-lg"
                      style={{
                        fontSize: '14px',
                        borderColor: !item.supplier ? '#DC2626' : '#E5E7EB',
                        height: '40px'
                      }}
                    >
                      <option value="">Select supplier...</option>
                      {suppliers.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <button
                      onClick={onAddSupplier}
                      className="flex items-center gap-1 mt-2 hover:underline"
                      style={{ fontSize: '13px', color: '#2563EB', fontWeight: 500 }}
                    >
                      <Plus className="w-3 h-3" />
                      Add New Supplier
                    </button>
                  </div>
                  <div>
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

                {/* Product Code + Quantity + Unit Price */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                      PRODUCT CODE
                    </label>
                    <input
                      type="text"
                      value={item.productCode}
                      onChange={(e) => onUpdate({ productCode: e.target.value })}
                      placeholder="SKU or product code"
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
                      QUANTITY <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => onUpdate({ quantity: parseInt(e.target.value) || 0 })}
                      min="1"
                      max="1000"
                      step="1"
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
                      UNIT PRICE <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ fontSize: '14px', color: '#6B7280' }}>
                        €
                      </span>
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => onUpdate({ unitPrice: parseFloat(e.target.value) || 0 })}
                        step="0.01"
                        min="0"
                        className="w-full pl-8 pr-3 border rounded-lg"
                        style={{
                          fontSize: '14px',
                          borderColor: '#E5E7EB',
                          height: '40px'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* VAT % + Billable */}
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                      VAT % <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <div className="relative" style={{ maxWidth: '200px' }}>
                      <input
                        type="number"
                        value={item.vatPercent}
                        onChange={(e) => onUpdate({ vatPercent: parseFloat(e.target.value) || 0 })}
                        min="0"
                        max="100"
                        step="1"
                        className="w-full px-3 border rounded-lg"
                        style={{
                          fontSize: '14px',
                          borderColor: '#E5E7EB',
                          height: '40px'
                        }}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2" style={{ fontSize: '14px', color: '#6B7280' }}>
                        %
                      </span>
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

                {/* Attachments */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                    ATTACHMENTS
                  </label>
                  
                  {item.attachments.length > 0 && (
                    <div className="space-y-2 mb-2">
                      {item.attachments.map((attachment, i) => (
                        <div 
                          key={i}
                          className="flex items-center justify-between px-3 py-2 bg-gray-50 border rounded-lg"
                          style={{ borderColor: '#E5E7EB', height: '40px' }}
                        >
                          <div className="flex items-center gap-2">
                            <Paperclip className="w-4 h-4" style={{ color: '#6B7280' }} />
                            <span style={{ fontSize: '14px', color: '#374151' }}>{attachment.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => window.open(attachment.url, '_blank')}
                              className="p-1 hover:bg-gray-200 rounded transition-colors"
                            >
                              <Eye className="w-4 h-4" style={{ color: '#6B7280' }} />
                            </button>
                            <button
                              onClick={() => removeAttachment(i)}
                              className="p-1 hover:bg-red-50 rounded transition-colors"
                            >
                              <X className="w-4 h-4" style={{ color: '#DC2626' }} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

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
                        Drop file or click · PDF, JPG, PNG up to 10MB
                      </span>
                    </div>
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Item Total */}
                <div className="pt-3 border-t" style={{ borderColor: '#E5E7EB' }}>
                  <div style={{ fontSize: '13px', color: '#6B7280' }}>
                    Subtotal: €{itemSubtotal.toFixed(2)} · VAT ({item.vatPercent}%): €{itemVat.toFixed(2)} · <span style={{ fontWeight: 600, color: '#111827' }}>Total: €{itemTotal.toFixed(2)}</span>
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
