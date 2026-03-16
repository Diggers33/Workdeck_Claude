import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Plus, Receipt, ShoppingCart } from 'lucide-react';
import { useSpending, SpendingType } from '../../contexts/SpendingContext';
import { MyRequestsTab } from './MyRequestsTab';
import { PendingApprovalTab } from './PendingApprovalTab';
import { TeamTab } from './TeamTab';
import { ProcessingTab } from './ProcessingTab';
import { NewRequestModal } from './NewRequestModal';
import { ExpenseDetailView } from './ExpenseDetailView';
import { PurchaseDetailView } from './PurchaseDetailView';

type TabType = 'my-requests' | 'pending-approval' | 'team' | 'processing';

interface SpendingViewProps {
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
}

export function SpendingView({ scrollContainerRef }: SpendingViewProps) {
  const { requests, currentUser } = useSpending();
  const [activeTab, setActiveTab] = useState<TabType>('my-requests');
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [detailView, setDetailView] = useState<{ type: SpendingType; requestId: string } | null>(null);

  // Scroll to top when detailView changes
  useEffect(() => {
    if (scrollContainerRef?.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [detailView, scrollContainerRef]);

  // Calculate pending approval count
  const pendingApprovalCount = useMemo(() => {
    if (!currentUser.isManager) return 0;
    return requests.filter(
      req => req.status === 'Pending' && currentUser.directReports.includes(req.userId)
    ).length;
  }, [requests, currentUser]);

  const tabs = [
    { id: 'my-requests' as TabType, label: 'My Requests', visible: true },
    { 
      id: 'pending-approval' as TabType, 
      label: 'Pending Approval', 
      badge: pendingApprovalCount,
      visible: currentUser.isManager 
    },
    { id: 'team' as TabType, label: 'Team', visible: true },
    { 
      id: 'processing' as TabType, 
      label: 'Processing', 
      visible: currentUser.isExpenseAdmin || currentUser.isPurchaseAdmin 
    },
  ].filter(tab => tab.visible);

  const handleRequestCreated = (requestId: string, type: SpendingType) => {
    if (scrollContainerRef?.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    setDetailView({ type, requestId });
  };

  const handleCardClick = (request: any) => {
    if (scrollContainerRef?.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    setDetailView({ type: request.type, requestId: request.id });
  };

  const handleBack = () => {
    if (scrollContainerRef?.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    setDetailView(null);
  };

  // If viewing detail, show that instead
  if (detailView) {
    if (detailView.type === 'Expense') {
      return (
        <ExpenseDetailView
          requestId={detailView.requestId}
          onBack={handleBack}
        />
      );
    }

    // Purchase detail view - placeholder for now
    return (
      <PurchaseDetailView
        requestId={detailView.requestId}
        onBack={handleBack}
      />
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9FAFB' }}>
      {/* Header */}
      <div 
        className="bg-white border-b"
        style={{
          borderColor: '#E5E7EB',
          height: '64px',
        }}
      >
        <div className="flex items-center justify-between h-full" style={{ padding: '0 24px' }}>
          <div className="flex items-center gap-3">
            <button 
              className="flex items-center justify-center hover:bg-gray-50 transition-colors rounded-md"
              style={{
                width: '36px',
                height: '36px',
              }}
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="w-5 h-5" style={{ color: '#6B7280' }} />
            </button>
            <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#111827' }}>
              Spending
            </h1>
          </div>

          <button
            onClick={() => setShowNewRequestModal(true)}
            className="flex items-center gap-2 px-4 rounded-lg transition-colors hover:opacity-90"
            style={{
              height: '40px',
              backgroundColor: '#2563EB',
              color: 'white',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            <Plus className="w-4 h-4" />
            New Request
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b" style={{ borderColor: '#E5E7EB' }}>
        <div className="flex items-center gap-8" style={{ padding: '0 24px' }}>
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative flex items-center gap-2 transition-colors"
                style={{
                  height: '48px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: isActive ? '#111827' : '#6B7280',
                }}
              >
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className="px-2 py-0.5 rounded"
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      backgroundColor: '#FEE2E2',
                      color: '#DC2626',
                    }}
                  >
                    {tab.badge}
                  </span>
                )}
                {isActive && (
                  <div
                    className="absolute bottom-0 left-0 right-0"
                    style={{
                      height: '2px',
                      backgroundColor: '#2563EB',
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div style={{ padding: '24px' }}>
        {activeTab === 'my-requests' && <MyRequestsTab onCardClick={handleCardClick} />}
        {activeTab === 'pending-approval' && <PendingApprovalTab />}
        {activeTab === 'team' && <TeamTab onCardClick={handleCardClick} />}
        {activeTab === 'processing' && <ProcessingTab onCardClick={handleCardClick} />}
      </div>

      {/* New Request Modal */}
      {showNewRequestModal && (
        <NewRequestModal 
          onClose={() => setShowNewRequestModal(false)} 
          onRequestCreated={handleRequestCreated}
        />
      )}
    </div>
  );
}