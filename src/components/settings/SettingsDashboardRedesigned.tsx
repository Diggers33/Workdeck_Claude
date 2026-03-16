import React, { useState, useEffect, Component, ErrorInfo } from 'react';
import { X, ChevronDown, ChevronUp, Loader2, AlertTriangle } from 'lucide-react';
import { getEssentialCategories, advancedCategories } from '../../data/settings-categories';
import { EssentialCategoryCard } from './EssentialCategoryCard';
import { AdvancedCategoryCard } from './AdvancedCategoryCard';
import { ProgressBanner } from './ProgressBanner';
import { CelebrationModal } from './CelebrationModal';
import { apiClient } from '../../services/api-client';
import { ENDPOINTS } from '../../config/api';

// Error boundary to prevent settings sub-pages from crashing the whole settings panel
class SettingsErrorBoundary extends Component<
  { children: React.ReactNode; onBack: () => void },
  { hasError: boolean; error: string }
> {
  state = { hasError: false, error: '' };
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[SettingsErrorBoundary] Component crashed:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-12 text-center max-w-md">
            <AlertTriangle className="w-12 h-12 text-[#F59E0B] mx-auto mb-4" />
            <h3 className="text-[16px] font-medium text-[#1F2937] mb-2">Something went wrong</h3>
            <p className="text-[13px] text-[#6B7280] mb-4">{this.state.error}</p>
            <button
              onClick={() => { this.setState({ hasError: false, error: '' }); this.props.onBack(); }}
              className="px-4 py-2 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-lg text-[13px] font-medium transition-colors"
            >
              Back to Settings
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

interface SettingsDashboardProps {
  onClose?: () => void;
  userName?: string;
  companyName?: string;
}

export function SettingsDashboardRedesigned({ 
  onClose, 
  userName = 'Admin', 
  companyName = 'IRIS Technology Solutions' 
}: SettingsDashboardProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [configuredData, setConfiguredData] = useState({
    general: { logo: null as string | null, companyName: companyName, location: '', language: 'English' },
    offices: { count: 0, offices: [] as Array<{ name: string; timezone: string; currency: string }> },
    users: { count: 0 },
    types: { costTypes: 0, leaveTypes: 0, projectTypes: 0 },
    clients: { count: 0 },
    staffCategories: { count: 0 },
    policies: { count: 0 },
    workflows: { count: 0 },
    costCenters: { count: 0 },
  });

  useEffect(() => {
    let cancelled = false;
    async function fetchDashboardData() {
      try {
        const [companyRes, usersRes, officesRes, costTypesRes, clientsRes, staffRes, policiesRes, workflowsRes, costCentersRes] = await Promise.all([
          apiClient.get<any>(ENDPOINTS.COMPANY).catch(() => null),
          apiClient.get<any>(ENDPOINTS.USERS).catch(() => null),
          apiClient.get<any>(ENDPOINTS.OFFICES).catch(() => null),
          apiClient.get<any>(ENDPOINTS.COST_TYPES).catch(() => null),
          apiClient.get<any>(ENDPOINTS.CLIENTS).catch(() => null),
          apiClient.get<any>(ENDPOINTS.STAFF_CATEGORIES).catch(() => null),
          apiClient.get<any>(ENDPOINTS.POLICIES).catch(() => null),
          apiClient.get<any>(ENDPOINTS.WORKFLOWS).catch(() => null),
          apiClient.get<any>(ENDPOINTS.COST_CENTERS).catch(() => null),
        ]);
        if (cancelled) return;

        const unwrap = (res: any) => {
          const d = res?.result || res;
          return Array.isArray(d) ? d : [];
        };

        const company = companyRes?.result || companyRes || {};
        const users = unwrap(usersRes);
        const offices = unwrap(officesRes);
        const costTypes = unwrap(costTypesRes);
        const clients = unwrap(clientsRes);
        const staff = unwrap(staffRes);
        const policies = unwrap(policiesRes);
        const workflows = unwrap(workflowsRes);
        const costCenters = unwrap(costCentersRes);

        setConfiguredData({
          general: {
            logo: company.logo || null,
            companyName: company.companyName || company.name || companyName,
            location: company.city || company.location || '',
            language: company.language || 'English',
          },
          offices: {
            count: offices.length,
            offices: offices.map((o: any) => ({
              name: o.name || '',
              timezone: o.timezone || '',
              currency: o.currency || '',
            })),
          },
          users: { count: users.length },
          types: {
            costTypes: costTypes.length,
            leaveTypes: 0,
            projectTypes: 0,
          },
          clients: { count: clients.length },
          staffCategories: { count: staff.length },
          policies: { count: policies.length },
          workflows: { count: workflows.length },
          costCenters: { count: costCenters.length },
        });
      } catch (err) {
        console.error('[SettingsDashboard] Failed to fetch dashboard data:', err);
      } finally {
        if (!cancelled) setDashboardLoading(false);
      }
    }
    fetchDashboardData();
    return () => { cancelled = true; };
  }, [companyName]);

  const essentialCategories = getEssentialCategories(configuredData);

  const essentialsCompleted = essentialCategories.filter(c => c.completed).length;
  const essentialsTotal = essentialCategories.length;

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
  };

  const computeIsNextAction = (category: any, index: number) => {
    return !category.completed && !essentialCategories.slice(0, index).some(c => !c.completed);
  };

  // Render active category screen
  if (activeCategory) {
    const category = [...essentialCategories, ...advancedCategories].find(c => c.id === activeCategory);
    if (category) {
      const Component = category.component;
      return (
        <SettingsErrorBoundary onBack={() => setActiveCategory(null)}>
          <Component onBack={() => setActiveCategory(null)} />
        </SettingsErrorBoundary>
      );
    }
  }

  return (
    <>
      <div className="min-h-screen bg-[#F9FAFB]">
        {/* Header */}
        <div className="bg-white border-b border-[#E5E7EB]">
          <div className="max-w-7xl mx-auto px-8 py-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-[24px] font-medium text-[#1F2937] mb-2">
                  Welcome back, {userName}
                </h1>
                <p className="text-[15px] text-[#6B7280]">
                  {essentialsCompleted < essentialsTotal ? (
                    <>Let's finish setting up <span className="font-medium text-[#1F2937]">{companyName}</span></>
                  ) : (
                    <>Your workspace is ready to go — configure advanced features when needed</>
                  )}
                </p>
              </div>
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-[#F3F4F6] rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-[#6B7280]" />
                </button>
              )}
            </div>

            {/* Progress Banner */}
            <ProgressBanner
              completed={essentialsCompleted}
              total={essentialsTotal}
              onCelebrate={() => setShowCelebration(true)}
            />
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-7xl mx-auto px-8 py-8 pb-32">
          {/* Essentials Section */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-[#0066FF] flex items-center justify-center">
                <span className="text-[14px] font-medium text-white">1</span>
              </div>
              <h2 className="text-[20px] font-medium text-[#1F2937]">Essentials</h2>
              <span className="text-[13px] text-[#6B7280] bg-[#F3F4F6] px-3 py-1 rounded-full">
                Complete these first
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {essentialCategories.map((category, index) => (
                <EssentialCategoryCard
                  key={category.id}
                  category={category}
                  isNextAction={computeIsNextAction(category, index)}
                  onClick={() => handleCategoryClick(category.id)}
                />
              ))}
            </div>
          </div>

          {/* Advanced Section */}
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 mb-4 hover:bg-[#F3F4F6] px-4 py-2 rounded-lg transition-colors w-full md:w-auto"
            >
              <div className="w-8 h-8 rounded-full bg-[#9CA3AF] flex items-center justify-center">
                <span className="text-[14px] font-medium text-white">2</span>
              </div>
              <h2 className="text-[20px] font-medium text-[#1F2937]">Configure when ready</h2>
              <span className="text-[13px] text-[#6B7280] bg-[#F3F4F6] px-3 py-1 rounded-full">
                {advancedCategories.length} optional features
              </span>
              {showAdvanced ? (
                <ChevronUp className="w-5 h-5 text-[#6B7280] ml-auto" />
              ) : (
                <ChevronDown className="w-5 h-5 text-[#6B7280] ml-auto" />
              )}
            </button>

            {showAdvanced ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {advancedCategories.map((category) => (
                  <AdvancedCategoryCard
                    key={category.id}
                    category={category}
                    onClick={() => handleCategoryClick(category.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Teaser card - show first advanced feature */}
                <AdvancedCategoryCard
                  category={advancedCategories[0]}
                  onClick={() => setShowAdvanced(true)}
                />
                
                {/* Expand to see more card */}
                <div className="col-span-1 md:col-span-1 lg:col-span-2">
                  <button
                    onClick={() => setShowAdvanced(true)}
                    className="w-full h-full min-h-[140px] bg-white rounded-lg border-2 border-dashed border-[#E5E7EB] hover:border-[#0066FF] hover:bg-[#F9FAFB] transition-all flex flex-col items-center justify-center gap-2 group"
                  >
                    <div className="flex items-center gap-2 text-[14px] font-medium text-[#6B7280] group-hover:text-[#0066FF] transition-colors">
                      <ChevronDown className="w-4 h-4" />
                      View {advancedCategories.length - 1} more optional features
                    </div>
                    <p className="text-[12px] text-[#9CA3AF]">
                      Policies, Workflows, Clients, and more
                    </p>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Skip CTA */}
          {essentialsCompleted < essentialsTotal && (
            <div className="mt-12 text-center">
              <button className="text-[14px] text-[#6B7280] hover:text-[#1F2937] transition-colors">
                Skip setup and explore Workdeck →
              </button>
            </div>
          )}
        </div>
      </div>

      {showCelebration && (
        <CelebrationModal
          onClose={() => setShowCelebration(false)}
          onContinue={() => {
            setShowCelebration(false);
            setShowAdvanced(true);
          }}
          companyName={companyName}
        />
      )}
    </>
  );
}
