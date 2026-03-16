import React from 'react';
import { Receipt, ShoppingCart, Paperclip, Zap, Circle, CheckCircle2, XCircle, Settings, Package, CheckCheck } from 'lucide-react';
import { SpendingRequest } from '../../contexts/SpendingContext';

interface SpendingCardProps {
  request: SpendingRequest;
  showEmployee?: boolean;
  employeeName?: string;
  onClick?: () => void;
  onCardClick?: (request: SpendingRequest) => void;
}

export function SpendingCard({ request, showEmployee, employeeName, onClick, onCardClick }: SpendingCardProps) {
  const handleClick = () => {
    if (onCardClick) {
      onCardClick(request);
    } else if (onClick) {
      onClick();
    }
  };

  // Status badge configuration
  const getStatusBadge = (status: SpendingRequest['status']) => {
    switch (status) {
      case 'Draft':
        return {
          icon: <Circle className="w-3 h-3" />,
          text: 'Draft',
          bg: '#F3F4F6',
          color: '#6B7280',
        };
      case 'Pending':
        return {
          icon: <Circle className="w-3 h-3 fill-current animate-pulse" />,
          text: 'Pending',
          bg: '#FEF3C7',
          color: '#B45309',
        };
      case 'Approved':
        return {
          icon: <CheckCircle2 className="w-3 h-3" />,
          text: 'Approved',
          bg: '#ECFDF5',
          color: '#059669',
        };
      case 'Denied':
        return {
          icon: <XCircle className="w-3 h-3" />,
          text: 'Denied',
          bg: '#FEE2E2',
          color: '#DC2626',
        };
      case 'Processing':
        return {
          icon: <Settings className="w-3 h-3" />,
          text: 'Processing',
          bg: '#DBEAFE',
          color: '#2563EB',
        };
      case 'Ordered':
        return {
          icon: <Package className="w-3 h-3" />,
          text: 'Ordered',
          bg: '#E0E7FF',
          color: '#4F46E5',
        };
      case 'Finalized':
        return {
          icon: <CheckCheck className="w-3 h-3" />,
          text: 'Finalized',
          bg: '#ECFDF5',
          color: '#047857',
        };
      case 'Received':
        return {
          icon: <CheckCheck className="w-3 h-3" />,
          text: 'Received',
          bg: '#ECFDF5',
          color: '#047857',
        };
      default:
        return {
          icon: <Circle className="w-3 h-3" />,
          text: status,
          bg: '#F3F4F6',
          color: '#6B7280',
        };
    }
  };

  const statusBadge = getStatusBadge(request.status);
  const typeColor = request.type === 'Expense' ? '#F59E0B' : '#3B82F6';
  const TypeIcon = request.type === 'Expense' ? Receipt : ShoppingCart;

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  // Get age in days
  const getAge = () => {
    if (!request.submittedDate) return null;
    const submitted = new Date(request.submittedDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - submitted.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const age = getAge();

  // Get suppliers for purchases
  const suppliers = request.type === 'Purchase' 
    ? [...new Set(request.lineItems.map(item => item.supplier).filter(Boolean))]
    : [];

  // Get receipt count for expenses
  const receiptCount = request.type === 'Expense'
    ? request.lineItems.filter(item => item.receiptUrl).length
    : 0;

  // Format currency totals
  const formatTotal = () => {
    if (request.currencies.length === 1) {
      const symbol = request.currencies[0] === 'USD' ? '$' : '€';
      return `${symbol}${request.total.toFixed(2)}`;
    } else {
      // Multi-currency
      const eurTotal = request.lineItems
        .filter(item => item.currency === 'EUR')
        .reduce((sum, item) => sum + item.amount + item.vat, 0);
      const usdTotal = request.lineItems
        .filter(item => item.currency === 'USD')
        .reduce((sum, item) => sum + item.amount + item.vat, 0);
      
      if (eurTotal > 0 && usdTotal > 0) {
        return `€${eurTotal.toFixed(2)} + $${usdTotal.toFixed(2)}`;
      } else if (eurTotal > 0) {
        return `€${eurTotal.toFixed(2)}`;
      } else {
        return `$${usdTotal.toFixed(2)}`;
      }
    }
  };

  return (
    <button
      onClick={handleClick}
      className="w-full border rounded-xl text-left transition-all"
      style={{
        backgroundColor: 'white',
        borderColor: '#E5E7EB',
        borderLeft: `4px solid ${typeColor}`,
        padding: '16px 20px',
        marginBottom: '12px',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Row 1: Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <TypeIcon className="w-4 h-4" style={{ color: typeColor }} />
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
            {showEmployee && employeeName ? employeeName : request.referenceNumber}
          </span>
          {age !== null && age > 5 && (
            <span style={{ fontSize: '13px', color: '#F59E0B' }}>⚠️</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {request.isAsap && (
            <div
              className="flex items-center gap-1 px-2 py-1 rounded"
              style={{
                backgroundColor: '#FEF3C7',
                fontSize: '11px',
                fontWeight: 600,
                color: '#B45309',
              }}
            >
              <Zap className="w-3 h-3" />
              ASAP
            </div>
          )}
          <div
            className="flex items-center gap-1 px-2 py-1 rounded"
            style={{
              backgroundColor: statusBadge.bg,
              color: statusBadge.color,
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            {statusBadge.icon}
            {statusBadge.text}
          </div>
        </div>
      </div>

      {/* Row 2: Description */}
      <div style={{ fontSize: '14px', color: '#374151', marginBottom: '8px' }}>
        {showEmployee && request.referenceNumber && (
          <span style={{ color: '#6B7280', marginRight: '8px' }}>
            {request.referenceNumber} ·
          </span>
        )}
        {request.purpose || 'No description'}
      </div>

      {/* Row 3: Details */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2" style={{ fontSize: '13px', color: '#6B7280' }}>
          <span>
            {request.lineItems.length} {request.lineItems.length === 1 ? 'item' : 'items'}
          </span>
          <span>·</span>
          <span style={{ fontWeight: 600, color: '#111827' }}>
            {formatTotal()}
          </span>
          {age !== null && (
            <>
              <span>·</span>
              <span style={{ color: age > 5 ? '#F59E0B' : '#6B7280' }}>
                {age}d ago
              </span>
            </>
          )}
        </div>
        <div style={{ fontSize: '13px', color: '#9CA3AF' }}>
          {formatDate(request.createdAt)}
        </div>
      </div>

      {/* Row 4: Meta */}
      {(request.type === 'Expense' && request.lineItems.length > 0) || 
       (request.type === 'Purchase' && suppliers.length > 0) ? (
        <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '8px' }}>
          {request.type === 'Expense' ? (
            receiptCount > 0 ? (
              <div className="flex items-center gap-1">
                <Paperclip className="w-3 h-3" />
                {receiptCount} {receiptCount === 1 ? 'receipt' : 'receipts'}
              </div>
            ) : (
              <div style={{ color: '#F59E0B' }}>⚠️ No receipts attached</div>
            )
          ) : (
            <div>
              {suppliers.length} {suppliers.length === 1 ? 'supplier' : 'suppliers'}
              {suppliers.length > 0 && `: ${suppliers.slice(0, 2).join(', ')}${suppliers.length > 2 ? '...' : ''}`}
            </div>
          )}
        </div>
      ) : null}
    </button>
  );
}