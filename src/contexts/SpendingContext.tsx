import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Receipt, ShoppingCart, Palmtree, User, Coffee, Plane, Car, Home, Laptop, Package } from 'lucide-react';
import { useCurrentUser, useUsers } from '../hooks/useApiQueries';

export type SpendingType = 'Expense' | 'Purchase';

export type SpendingStatus = 
  | 'Draft' 
  | 'Pending' 
  | 'Approved' 
  | 'Denied' 
  | 'Processing' 
  | 'Ordered' 
  | 'Finalized' 
  | 'Received';

export type CostType = 
  | 'Meals' 
  | 'Travel' 
  | 'Accommodation' 
  | 'Equipment' 
  | 'Software' 
  | 'Office Supplies' 
  | 'Marketing' 
  | 'Training' 
  | 'Entertainment' 
  | 'Other';

export interface SpendingLineItem {
  id: string;
  description: string;
  costType: CostType;
  amount: number;
  currency: string;
  vat: number;
  vatRate: number;
  date: string;
  paidBy?: 'Employee' | 'Company Card';
  receiptUrl?: string;
  receiptFilename?: string;
  notes?: string;
  
  // Purchase-specific
  supplier?: string;
  quantity?: number;
  unitPrice?: number;
  sku?: string;
}

export interface SpendingRequest {
  id: string;
  type: SpendingType;
  referenceNumber: string;
  userId: string;
  status: SpendingStatus;
  purpose: string;
  project?: string;
  costCenter?: string;
  office?: string;
  department?: string;
  isAsap?: boolean;
  
  lineItems: SpendingLineItem[];
  
  // Calculated totals
  subtotal: number;
  totalVat: number;
  total: number;
  currencies: string[]; // ['EUR', 'USD']
  
  submittedDate?: string;
  approvedDate?: string;
  approvedBy?: string;
  deniedDate?: string;
  deniedBy?: string;
  denialReason?: string;
  processedDate?: string;
  completedDate?: string;
  
  managerComment?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact?: string;
  email?: string;
  phone?: string;
  verified: boolean;
  purchaseCount: number;
  totalSpent: number;
}

interface SpendingContextType {
  requests: SpendingRequest[];
  suppliers: Supplier[];
  currentUser: {
    id: string;
    name: string;
    isManager: boolean;
    isExpenseAdmin: boolean;
    isPurchaseAdmin: boolean;
    directReports: string[];
  };
  userNames: Record<string, string>;

  createRequest: (type: SpendingType) => SpendingRequest;
  updateRequest: (id: string, updates: Partial<SpendingRequest>) => void;
  deleteRequest: (id: string) => void;
  submitRequest: (id: string) => void;
  approveRequest: (id: string, comment?: string) => void;
  denyRequest: (id: string, reason: string, comment?: string) => void;

  addLineItem: (requestId: string, item: Omit<SpendingLineItem, 'id'>) => void;
  updateLineItem: (requestId: string, itemId: string, updates: Partial<SpendingLineItem>) => void;
  deleteLineItem: (requestId: string, itemId: string) => void;

  addSupplier: (supplier: Omit<Supplier, 'id' | 'purchaseCount' | 'totalSpent'>) => void;
}

const SpendingContext = createContext<SpendingContextType | undefined>(undefined);

export function useSpending() {
  const context = useContext(SpendingContext);
  if (!context) {
    throw new Error('useSpending must be used within SpendingProvider');
  }
  return context;
}

export const costTypeConfig: Record<CostType, { label: string; color: string }> = {
  'Meals': { label: 'Meals & Entertainment', color: '#F59E0B' },
  'Travel': { label: 'Travel', color: '#3B82F6' },
  'Accommodation': { label: 'Accommodation', color: '#8B5CF6' },
  'Equipment': { label: 'Equipment', color: '#10B981' },
  'Software': { label: 'Software & Subscriptions', color: '#6366F1' },
  'Office Supplies': { label: 'Office Supplies', color: '#EC4899' },
  'Marketing': { label: 'Marketing', color: '#F43F5E' },
  'Training': { label: 'Training & Development', color: '#14B8A6' },
  'Entertainment': { label: 'Client Entertainment', color: '#F59E0B' },
  'Other': { label: 'Other', color: '#6B7280' },
};

export function SpendingProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState({
    id: '',
    name: '',
    isManager: false,
    isExpenseAdmin: false,
    isPurchaseAdmin: false,
    directReports: [] as string[],
  });
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [requests, setRequests] = useState<SpendingRequest[]>([]);

  // Fetch current user and users list via TanStack Query
  const { data: apiUser } = useCurrentUser();
  const { data: apiUsers } = useUsers();

  useEffect(() => {
    if (apiUser) {
      const deptMembers = (apiUser.department as any)?.members || [];
      const directReports = deptMembers
        .map((m: any) => m.id)
        .filter((id: string) => id !== apiUser.id);

      setCurrentUser({
        id: apiUser.id,
        name: apiUser.fullName,
        isManager: apiUser.isManager || false,
        isExpenseAdmin: (apiUser as any).isExpenseAdmin || apiUser.isAdmin || false,
        isPurchaseAdmin: (apiUser as any).isPurchaseAdmin || apiUser.isAdmin || false,
        directReports,
      });
    }
  }, [apiUser]);

  useEffect(() => {
    const names: Record<string, string> = {};
    if (apiUsers) {
      apiUsers.forEach(u => { names[u.id] = u.fullName; });
    }
    if (apiUser) {
      names[apiUser.id] = apiUser.fullName;
    }
    if (Object.keys(names).length > 0) {
      setUserNames(names);
    }
  }, [apiUser, apiUsers]);

  const createRequest = (type: SpendingType): SpendingRequest => {
    const now = new Date().toISOString();
    const count = requests.filter(r => r.type === type).length + 1;
    const prefix = type === 'Expense' ? 'EXP' : 'PUR';
    
    const newRequest: SpendingRequest = {
      id: `${prefix.toLowerCase()}-${Date.now()}`,
      type,
      referenceNumber: `${prefix}-2024-${String(count).padStart(4, '0')}`,
      userId: currentUser.id,
      status: 'Draft',
      purpose: '',
      lineItems: [],
      subtotal: 0,
      totalVat: 0,
      total: 0,
      currencies: [],
      createdAt: now,
      updatedAt: now,
    };
    
    setRequests(prev => [newRequest, ...prev]);
    return newRequest;
  };

  const updateRequest = (id: string, updates: Partial<SpendingRequest>) => {
    setRequests(prev => prev.map(req => {
      if (req.id === id) {
        const updated = { ...req, ...updates, updatedAt: new Date().toISOString() };
        
        // Recalculate totals if line items changed
        if (updates.lineItems) {
          const currencies = [...new Set(updates.lineItems.map(item => item.currency))];
          const subtotal = updates.lineItems.reduce((sum, item) => sum + item.amount, 0);
          const totalVat = updates.lineItems.reduce((sum, item) => sum + item.vat, 0);
          const total = subtotal + totalVat;
          
          updated.currencies = currencies;
          updated.subtotal = subtotal;
          updated.totalVat = totalVat;
          updated.total = total;
        }
        
        return updated;
      }
      return req;
    }));
  };

  const deleteRequest = (id: string) => {
    setRequests(prev => prev.filter(req => req.id !== id));
  };

  const submitRequest = (id: string) => {
    setRequests(prev => prev.map(req => {
      if (req.id === id) {
        return {
          ...req,
          status: 'Pending',
          submittedDate: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
      return req;
    }));
  };

  const approveRequest = (id: string, comment?: string) => {
    setRequests(prev => prev.map(req => {
      if (req.id === id) {
        return {
          ...req,
          status: 'Approved',
          approvedDate: new Date().toISOString(),
          approvedBy: currentUser.id,
          managerComment: comment,
          updatedAt: new Date().toISOString(),
        };
      }
      return req;
    }));
  };

  const denyRequest = (id: string, reason: string, comment?: string) => {
    setRequests(prev => prev.map(req => {
      if (req.id === id) {
        return {
          ...req,
          status: 'Denied',
          deniedDate: new Date().toISOString(),
          deniedBy: currentUser.id,
          denialReason: reason,
          managerComment: comment,
          updatedAt: new Date().toISOString(),
        };
      }
      return req;
    }));
  };

  const addLineItem = (requestId: string, item: Omit<SpendingLineItem, 'id'>) => {
    const newItem: SpendingLineItem = {
      ...item,
      id: `item-${Date.now()}`,
    };
    
    setRequests(prev => prev.map(req => {
      if (req.id === requestId) {
        const lineItems = [...req.lineItems, newItem];
        const currencies = [...new Set(lineItems.map(item => item.currency))];
        const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
        const totalVat = lineItems.reduce((sum, item) => sum + item.vat, 0);
        const total = subtotal + totalVat;
        
        return {
          ...req,
          lineItems,
          currencies,
          subtotal,
          totalVat,
          total,
          updatedAt: new Date().toISOString(),
        };
      }
      return req;
    }));
  };

  const updateLineItem = (requestId: string, itemId: string, updates: Partial<SpendingLineItem>) => {
    setRequests(prev => prev.map(req => {
      if (req.id === requestId) {
        const lineItems = req.lineItems.map(item => {
          if (item.id === itemId) {
            return { ...item, ...updates };
          }
          return item;
        });
        
        const currencies = [...new Set(lineItems.map(item => item.currency))];
        const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
        const totalVat = lineItems.reduce((sum, item) => sum + item.vat, 0);
        const total = subtotal + totalVat;
        
        return {
          ...req,
          lineItems,
          currencies,
          subtotal,
          totalVat,
          total,
          updatedAt: new Date().toISOString(),
        };
      }
      return req;
    }));
  };

  const deleteLineItem = (requestId: string, itemId: string) => {
    setRequests(prev => prev.map(req => {
      if (req.id === requestId) {
        const lineItems = req.lineItems.filter(item => item.id !== itemId);
        const currencies = [...new Set(lineItems.map(item => item.currency))];
        const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
        const totalVat = lineItems.reduce((sum, item) => sum + item.vat, 0);
        const total = subtotal + totalVat;
        
        return {
          ...req,
          lineItems,
          currencies,
          subtotal,
          totalVat,
          total,
          updatedAt: new Date().toISOString(),
        };
      }
      return req;
    }));
  };

  const addSupplier = (supplier: Omit<Supplier, 'id' | 'purchaseCount' | 'totalSpent'>) => {
    const newSupplier: Supplier = {
      ...supplier,
      id: `sup-${Date.now()}`,
      purchaseCount: 0,
      totalSpent: 0,
    };
    setSuppliers(prev => [...prev, newSupplier]);
  };

  return (
    <SpendingContext.Provider
      value={{
        requests,
        suppliers,
        currentUser,
        userNames,
        createRequest,
        updateRequest,
        deleteRequest,
        submitRequest,
        approveRequest,
        denyRequest,
        addLineItem,
        updateLineItem,
        deleteLineItem,
        addSupplier,
      }}
    >
      {children}
    </SpendingContext.Provider>
  );
}