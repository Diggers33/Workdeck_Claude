import React, { useState } from 'react';
import { X, Receipt, ShoppingCart, ArrowLeft, HelpCircle } from 'lucide-react';
import { useSpending, SpendingType } from '../../contexts/SpendingContext';

interface NewRequestModalProps {
  onClose: () => void;
  onRequestCreated?: (requestId: string, type: SpendingType) => void;
}

export function NewRequestModal({ onClose, onRequestCreated }: NewRequestModalProps) {
  const { createRequest } = useSpending();
  const [showHelp, setShowHelp] = useState(false);

  const handleSelectType = (type: SpendingType) => {
    const newRequest = createRequest(type);
    onClose();
    
    // Notify parent if callback provided
    if (onRequestCreated) {
      onRequestCreated(newRequest.id, type);
    }
  };

  if (showHelp) {
    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50"
          onClick={onClose}
        />

        {/* Modal */}
        <div
          className="fixed left-1/2 top-1/2 bg-white rounded-xl z-50"
          style={{
            width: '480px',
            transform: 'translate(-50%, -50%)',
            maxHeight: '90vh',
            overflow: 'auto',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between border-b"
            style={{
              padding: '20px 24px',
              borderColor: '#E5E7EB',
            }}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowHelp(false)}
                className="flex items-center justify-center hover:bg-gray-50 rounded-md transition-colors"
                style={{
                  width: '32px',
                  height: '32px',
                }}
              >
                <ArrowLeft className="w-4 h-4" style={{ color: '#6B7280' }} />
              </button>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#111827' }}>
                Help Me Decide
              </h2>
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center hover:bg-gray-50 rounded-md transition-colors"
              style={{
                width: '32px',
                height: '32px',
              }}
            >
              <X className="w-5 h-5" style={{ color: '#6B7280' }} />
            </button>
          </div>

          {/* Content */}
          <div style={{ padding: '24px' }}>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '16px' }}>
              Let's figure out the right type
            </div>

            <div style={{ fontSize: '14px', color: '#374151', marginBottom: '20px' }}>
              Did you already pay for this yourself?
            </div>

            {/* Yes Option */}
            <button
              onClick={() => handleSelectType('Expense')}
              className="w-full border rounded-xl text-left transition-all mb-4"
              style={{
                padding: '20px',
                borderColor: '#E5E7EB',
                backgroundColor: 'white',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#F59E0B';
                e.currentTarget.style.backgroundColor = '#FFFBEB';
                e.currentTarget.style.borderLeftWidth = '4px';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E5E7EB';
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderLeftWidth = '1px';
              }}
            >
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
                ✓ Yes, I paid with my own money
              </div>
              <div style={{ fontSize: '13px', color: '#6B7280' }}>
                → Creates <span style={{ fontWeight: 600 }}>Expense</span> reimbursement request
              </div>
            </button>

            {/* No Option */}
            <button
              onClick={() => handleSelectType('Purchase')}
              className="w-full border rounded-xl text-left transition-all"
              style={{
                padding: '20px',
                borderColor: '#E5E7EB',
                backgroundColor: 'white',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#3B82F6';
                e.currentTarget.style.backgroundColor = '#EFF6FF';
                e.currentTarget.style.borderLeftWidth = '4px';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E5E7EB';
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderLeftWidth = '1px';
              }}
            >
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
                ✗ No, the company will pay the supplier
              </div>
              <div style={{ fontSize: '13px', color: '#6B7280' }}>
                → Creates <span style={{ fontWeight: 600 }}>Purchase</span> request
              </div>
            </button>

            {/* Examples */}
            <div
              className="rounded-lg mt-6"
              style={{
                backgroundColor: '#F9FAFB',
                padding: '16px',
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>
                💡 Still unsure?
              </div>
              <div className="space-y-2" style={{ fontSize: '13px', color: '#6B7280' }}>
                <div>• Restaurant bill you paid → <span style={{ fontWeight: 600, color: '#F59E0B' }}>Expense</span></div>
                <div>• Vendor invoice to company → <span style={{ fontWeight: 600, color: '#3B82F6' }}>Purchase</span></div>
                <div>• Hotel booked on your card → <span style={{ fontWeight: 600, color: '#F59E0B' }}>Expense</span></div>
                <div>• Software subscription → <span style={{ fontWeight: 600, color: '#3B82F6' }}>Purchase</span></div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed left-1/2 top-1/2 bg-white rounded-xl z-50"
        style={{
          width: '480px',
          transform: 'translate(-50%, -50%)',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b"
          style={{
            padding: '20px 24px',
            borderColor: '#E5E7EB',
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#111827' }}>
            New Request
          </h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center hover:bg-gray-50 rounded-md transition-colors"
            style={{
              width: '32px',
              height: '32px',
            }}
          >
            <X className="w-5 h-5" style={{ color: '#6B7280' }} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '20px' }}>
            What type of request?
          </div>

          {/* Expense Card */}
          <button
            onClick={() => handleSelectType('Expense')}
            className="w-full border rounded-xl text-left transition-all mb-4"
            style={{
              padding: '24px',
              borderColor: '#E5E7EB',
              backgroundColor: 'white',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#F59E0B';
              e.currentTarget.style.backgroundColor = '#FFFBEB';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.1)';
              e.currentTarget.style.borderLeftWidth = '4px';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#E5E7EB';
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderLeftWidth = '1px';
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div 
                className="flex items-center justify-center rounded-lg"
                style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: '#FEF3C7',
                }}
              >
                <Receipt className="w-6 h-6" style={{ color: '#F59E0B' }} />
              </div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>
                Expense Reimbursement
              </div>
            </div>
            <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>
              I paid for something and need to be reimbursed
            </div>
            <div style={{ fontSize: '13px', color: '#9CA3AF', fontStyle: 'italic' }}>
              Examples: Travel, meals, supplies
            </div>
          </button>

          {/* Purchase Card */}
          <button
            onClick={() => handleSelectType('Purchase')}
            className="w-full border rounded-xl text-left transition-all"
            style={{
              padding: '24px',
              borderColor: '#E5E7EB',
              backgroundColor: 'white',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#3B82F6';
              e.currentTarget.style.backgroundColor = '#EFF6FF';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.1)';
              e.currentTarget.style.borderLeftWidth = '4px';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#E5E7EB';
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderLeftWidth = '1px';
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div 
                className="flex items-center justify-center rounded-lg"
                style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: '#DBEAFE',
                }}
              >
                <ShoppingCart className="w-6 h-6" style={{ color: '#3B82F6' }} />
              </div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>
                Purchase Request
              </div>
            </div>
            <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>
              The company needs to buy something from a supplier
            </div>
            <div style={{ fontSize: '13px', color: '#9CA3AF', fontStyle: 'italic' }}>
              Examples: Equipment, software, services
            </div>
          </button>

          {/* Help Link */}
          <div className="border-t mt-6 pt-6" style={{ borderColor: '#E5E7EB' }}>
            <button
              onClick={() => setShowHelp(true)}
              className="flex items-center gap-2 text-left w-full hover:opacity-70 transition-opacity"
            >
              <HelpCircle className="w-4 h-4" style={{ color: '#3B82F6' }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#3B82F6' }}>
                  Not sure which to choose?
                </div>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>
                  Help me decide →
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}