import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { InvoiceEntry } from '../services/dashboard-api';
import { useInvoices } from '../hooks/useApiQueries';

export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'cancelled';

export interface TimeEntry {
  id: string;
  date: string;
  personName: string;
  taskName: string;
  hours: number;
  rate: number;
  amount: number;
  taxable: boolean;
  selected?: boolean;
}

export interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
  taxable: boolean;
  selected?: boolean;
}

export interface Milestone {
  id: string;
  name: string;
  deliveryDate: string;
  amount: number;
  taxable: boolean;
  selected?: boolean;
}

export interface AdditionalItem {
  id: string;
  description: string;
  amount: number;
  taxable: boolean;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail?: string;
  clientAddress?: string;
  projectName: string;
  projectId: string;
  invoiceDate: string;
  dueDate: string;
  poCode?: string;
  title?: string;
  status: InvoiceStatus;
  taxRate: number;
  paymentTerms: 'NET 30' | 'NET 60' | 'NET 90' | 'NET 120';
  timeEntryFormat: 'grouped-person-task' | 'grouped-task' | 'detailed';
  expenseFormat: 'detailed' | 'combined';
  timeEntries: TimeEntry[];
  expenses: Expense[];
  milestones: Milestone[];
  additionalItems: AdditionalItem[];
  notes?: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  paidDate?: string;
}

export interface BillingSettings {
  companyName: string;
  companyLogo?: string;
  companyAddress: string;
  vatNumber?: string;
  bankName?: string;
  iban?: string;
  paymentInstructions?: string;
  defaultTaxRate: number;
  defaultPaymentTerms: 'NET 30' | 'NET 60' | 'NET 90' | 'NET 120';
  defaultTimeEntryFormat: 'grouped-person-task' | 'grouped-task' | 'detailed';
  defaultExpenseFormat: 'detailed' | 'combined';
  defaultCurrency: string;
  invoicePrefix: string;
  includeYear: boolean;
  nextNumber: number;
}

interface BillingContextType {
  invoices: Invoice[];
  settings: BillingSettings;
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  markAsPaid: (id: string) => void;
  cancelInvoice: (id: string) => void;
  updateSettings: (settings: Partial<BillingSettings>) => void;
  getNextInvoiceNumber: () => string;
}

const BillingContext = createContext<BillingContextType | undefined>(undefined);

export const useBilling = () => {
  const context = useContext(BillingContext);
  if (!context) {
    throw new Error('useBilling must be used within BillingProvider');
  }
  return context;
};

// Convert API invoice to context Invoice format
function convertApiInvoice(entry: InvoiceEntry): Invoice {
  const parseAmount = (s: string) => parseFloat(s) || 0;
  const subtotal = entry.items?.reduce((sum, item) => sum + parseAmount(item.amount), 0) || parseAmount(entry.amount);
  const total = parseAmount(entry.total) || subtotal;
  const taxAmount = total - subtotal;

  return {
    id: entry.id,
    invoiceNumber: entry.number || '',
    clientName: entry.client?.name || 'Unknown',
    clientEmail: entry.client?.name ? undefined : undefined,
    projectName: '',
    projectId: '',
    invoiceDate: entry.date || '',
    dueDate: entry.dueDate || '',
    status: (String(entry.status ?? '').toLowerCase() || 'draft') as InvoiceStatus,
    taxRate: subtotal > 0 ? Math.round((taxAmount / subtotal) * 100) : 0,
    paymentTerms: 'NET 30',
    timeEntryFormat: 'grouped-person-task',
    expenseFormat: 'detailed',
    timeEntries: [],
    expenses: [],
    milestones: [],
    additionalItems: [],
    subtotal,
    taxAmount,
    total,
    createdAt: entry.date || new Date().toISOString(),
    updatedAt: entry.date || new Date().toISOString(),
  };
}

export const BillingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [settings, setSettings] = useState<BillingSettings>({
    companyName: 'Workdeck Inc',
    companyAddress: '100 Market Street\nSan Francisco, CA 94105',
    vatNumber: 'US-123456789',
    bankName: 'Chase Bank',
    iban: 'US12 3456 7890 1234 5678 90',
    paymentInstructions: 'Please include invoice number in payment reference.',
    defaultTaxRate: 10,
    defaultPaymentTerms: 'NET 30',
    defaultTimeEntryFormat: 'grouped-person-task',
    defaultExpenseFormat: 'detailed',
    defaultCurrency: 'USD',
    invoicePrefix: 'INV-',
    includeYear: true,
    nextNumber: 5,
  });

  // Fetch real invoices via TanStack Query
  const { data: apiInvoices } = useInvoices();

  useEffect(() => {
    if (apiInvoices && apiInvoices.length > 0) {
      setInvoices(apiInvoices.map(convertApiInvoice));
      setSettings(prev => ({ ...prev, nextNumber: apiInvoices.length + 1 }));
    }
  }, [apiInvoices]);

  const addInvoice = (invoice: Invoice) => {
    setInvoices(prev => [invoice, ...prev]);
    setSettings(prev => ({ ...prev, nextNumber: prev.nextNumber + 1 }));
  };

  const updateInvoice = (id: string, updates: Partial<Invoice>) => {
    setInvoices(prev =>
      prev.map(inv =>
        inv.id === id
          ? { ...inv, ...updates, updatedAt: new Date().toISOString() }
          : inv
      )
    );
  };

  const deleteInvoice = (id: string) => {
    setInvoices(prev => prev.filter(inv => inv.id !== id));
  };

  const markAsPaid = (id: string) => {
    updateInvoice(id, {
      status: 'paid',
      paidDate: new Date().toISOString().split('T')[0],
    });
  };

  const cancelInvoice = (id: string) => {
    updateInvoice(id, { status: 'cancelled' });
  };

  const updateSettings = (newSettings: Partial<BillingSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const getNextInvoiceNumber = (): string => {
    const { invoicePrefix, includeYear, nextNumber } = settings;
    const year = includeYear ? `${new Date().getFullYear()}-` : '';
    const number = String(nextNumber).padStart(3, '0');
    return `${invoicePrefix}${year}${number}`;
  };

  return (
    <BillingContext.Provider
      value={{
        invoices,
        settings,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        markAsPaid,
        cancelInvoice,
        updateSettings,
        getNextInvoiceNumber,
      }}
    >
      {children}
    </BillingContext.Provider>
  );
};