import React, { useState } from 'react';
import { Search, Plus, FileText, Settings } from 'lucide-react';
import { InvoiceListView } from './InvoiceListView';
import { InvoiceCreationFlow } from './InvoiceCreationFlow';
import { InvoiceDocumentView } from './InvoiceDocumentView';
import { BillingSettings } from './BillingSettings';
import { useBilling } from '../../contexts/BillingContext';

type BillingTab = 'invoices' | 'settings';
type ViewMode = 'list' | 'create' | 'document';

interface BillingViewProps {
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
}

export const BillingView: React.FC<BillingViewProps> = ({ scrollContainerRef }) => {
  const [activeTab, setActiveTab] = useState<BillingTab>('invoices');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { invoices } = useBilling();

  const handleCreateNew = () => {
    setSelectedInvoiceId(null);
    setViewMode('create');
  };

  const handleViewInvoice = (id: string) => {
    setSelectedInvoiceId(id);
    setViewMode('document');
  };

  const handleEditInvoice = (id: string) => {
    setSelectedInvoiceId(id);
    setViewMode('create');
  };

  const handleBackToList = () => {
    setSelectedInvoiceId(null);
    setViewMode('list');
  };

  const handleInvoiceCreated = (id: string) => {
    setSelectedInvoiceId(id);
    setViewMode('document');
  };

  // Filter invoices based on search
  const filteredInvoices = invoices.filter(inv =>
    searchQuery === '' ||
    inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.projectName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Render based on view mode
  if (viewMode === 'create') {
    return (
      <InvoiceCreationFlow
        invoiceId={selectedInvoiceId}
        onCancel={handleBackToList}
        onComplete={handleInvoiceCreated}
      />
    );
  }

  if (viewMode === 'document' && selectedInvoiceId) {
    return (
      <InvoiceDocumentView
        invoiceId={selectedInvoiceId}
        onClose={handleBackToList}
        onEdit={() => handleEditInvoice(selectedInvoiceId)}
      />
    );
  }

  // Main list/settings view
  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Header - 48px */}
      <div 
        className="flex-none border-b"
        style={{
          borderColor: '#E5E7EB',
          height: '48px',
        }}
      >
        <div className="flex items-center justify-between h-full" style={{ padding: '0 20px' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: '#111827' }}>
            Billing
          </h1>

          <div className="flex items-center gap-2">
            <button
              className="flex items-center justify-center hover:bg-gray-50 transition-colors rounded"
              style={{
                width: '32px',
                height: '32px',
                color: '#6B7280',
              }}
            >
              <Search className="w-4 h-4" />
            </button>
            
            <div
              className="flex items-center justify-center rounded"
              style={{
                padding: '0 6px',
                height: '20px',
                backgroundColor: '#F3F4F6',
                fontSize: '11px',
                fontWeight: 500,
                color: '#6B7280',
              }}
            >
              ⌘K
            </div>

            <button
              onClick={handleCreateNew}
              className="flex items-center gap-1.5 px-3 rounded hover:opacity-90 transition-opacity"
              style={{
                height: '32px',
                backgroundColor: '#2563EB',
                color: 'white',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              <Plus className="w-4 h-4" />
              New
            </button>
          </div>
        </div>
      </div>

      {/* Tabs - 48px */}
      <div className="flex-none border-b" style={{ borderColor: '#E5E7EB', height: '48px' }}>
        <div className="flex items-center gap-6 h-full" style={{ padding: '0 20px' }}>
          <button
            onClick={() => setActiveTab('invoices')}
            className="relative h-full flex items-center transition-colors"
            style={{
              color: activeTab === 'invoices' ? '#111827' : '#6B7280',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            Invoices
            {activeTab === 'invoices' && (
              <div
                className="absolute bottom-0 left-0 right-0"
                style={{
                  height: '2px',
                  backgroundColor: '#2563EB',
                }}
              />
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('settings')}
            className="relative h-full flex items-center transition-colors"
            style={{
              color: activeTab === 'settings' ? '#111827' : '#6B7280',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            Settings
            {activeTab === 'settings' && (
              <div
                className="absolute bottom-0 left-0 right-0"
                style={{
                  height: '2px',
                  backgroundColor: '#2563EB',
                }}
              />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto" ref={scrollContainerRef}>
        {activeTab === 'invoices' && (
          <InvoiceListView
            invoices={filteredInvoices}
            onViewInvoice={handleViewInvoice}
            onEditInvoice={handleEditInvoice}
            onCreateNew={handleCreateNew}
          />
        )}
        {activeTab === 'settings' && <BillingSettings />}
      </div>
    </div>
  );
};
