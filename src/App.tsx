import React, { useState, useEffect, useCallback, Suspense } from 'react';
import {
  Search,
  Plus,
  Clock,
  Receipt,
  Bell,
  Settings as SettingsIcon,
  User,
  LogOut,
  HelpCircle,
  LayoutGrid,
  Zap,
  ChevronDown
} from 'lucide-react';
import workdeckLogo from 'figma:asset/6f22f481b9cda400eddbba38bd4678cd9b214998.png';

// Static imports - small or always-visible components
import { PendingScreen } from './components/PendingScreen';
import { QuickAccessDropdown } from './components/QuickAccessDropdown';
import { ActiveTimerBar } from './components/my-tasks/ActiveTimerBar';
import { SetTimerDurationModal } from './components/my-tasks/SetTimerDurationModal';
import { TimerExtensionModal } from './components/my-tasks/TimerExtensionModal';
import { Toaster, toast } from 'sonner';
import { TasksProvider, useTasks } from './contexts/TasksContext';
import { UnifiedTasksProvider, useUnifiedTasks } from './contexts/UnifiedTasksContext';
import { LeaveProvider } from './contexts/LeaveContext';
import { SpendingProvider } from './contexts/SpendingContext';
import { BillingProvider } from './contexts/BillingContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { apiClient } from './services/api-client';
import { insightsEngine } from './services/insights-engine';

// Lazy-loaded components - code-split to reduce initial bundle size
const Dashboard = React.lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));
const ProjectTriageBoard = React.lazy(() => import('./components/ProjectTriageBoard').then(m => ({ default: m.ProjectTriageBoard })));
const GanttView = React.lazy(() => import('./components/GanttView').then(m => ({ default: m.GanttView })));
const QuickAccessSearchModal = React.lazy(() => import('./components/QuickAccessSearchModal').then(m => ({ default: m.QuickAccessSearchModal })));
const WidgetConfigModal = React.lazy(() => import('./components/WidgetConfigModal').then(m => ({ default: m.WidgetConfigModal })));
const SettingsDashboardRedesigned = React.lazy(() => import('./components/settings/SettingsDashboardRedesigned').then(m => ({ default: m.SettingsDashboardRedesigned })));
const OnboardingFlow = React.lazy(() => import('./components/onboarding/OnboardingFlow').then(m => ({ default: m.OnboardingFlow })));
const WorkdeckCalendar = React.lazy(() => import('./components/calendar/WorkdeckCalendar').then(m => ({ default: m.WorkdeckCalendar })));
const MyTasksBoard = React.lazy(() => import('./components/my-tasks/MyTasksBoard').then(m => ({ default: m.MyTasksBoard })));
const ResourcePlanner = React.lazy(() => import('./components/ResourcePlanner').then(m => ({ default: m.ResourcePlanner })));
const LeaveView = React.lazy(() => import('./components/leave/LeaveView').then(m => ({ default: m.LeaveView })));
const SpendingView = React.lazy(() => import('./components/spending/SpendingView').then(m => ({ default: m.SpendingView })));
const BillingView = React.lazy(() => import('./components/billing/BillingView').then(m => ({ default: m.BillingView })));
const ReportsView = React.lazy(() => import('./components/analytics/ReportsView').then(m => ({ default: m.ReportsView })));
const AIInsightsView = React.lazy(() => import('./components/analytics/AIInsightsView').then(m => ({ default: m.AIInsightsView })));
const UtilizationView = React.lazy(() => import('./components/analytics/UtilizationView').then(m => ({ default: m.UtilizationView })));
const ForecastingView = React.lazy(() => import('./components/analytics/ForecastingView').then(m => ({ default: m.ForecastingView })));
const LoginScreen = React.lazy(() => import('./components/LoginScreen').then(m => ({ default: m.LoginScreen })));
const MyProfileSettings = React.lazy(() => import('./components/settings/MyProfileSettings').then(m => ({ default: m.MyProfileSettings })));
const TimesheetView = React.lazy(() => import('./components/timesheets/TimesheetView').then(m => ({ default: m.TimesheetView })));

// Suspense fallback - minimal loading indicator
const SuspenseFallback = () => (
  <div className="flex items-center justify-center h-full w-full min-h-[200px]">
    <div className="text-center">
      <div className="h-8 w-8 border-4 border-[#0066FF] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
      <p className="text-sm" style={{ color: '#6B7280' }}>Loading...</p>
    </div>
  </div>
);

// Error boundary to catch failed lazy-load dynamic imports (e.g. dev server restart)
class LazyLoadErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full w-full min-h-[300px]">
          <div className="text-center" style={{ maxWidth: '320px' }}>
            <div className="text-4xl mb-4">⚠️</div>
            <p className="font-semibold mb-2" style={{ color: '#111827', fontSize: '15px' }}>
              Failed to load page
            </p>
            <p className="mb-4" style={{ color: '#6B7280', fontSize: '13px' }}>
              The dev server may have restarted. Please reload the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg text-white text-sm font-medium"
              style={{ backgroundColor: '#0066FF' }}
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

interface TimerState {
  taskId: string | null;
  taskTitle: string | null;
  projectId: string | null;
  projectName: string | null;
  projectColor: string | null;
  startTime: number | null;
  pausedTime: number;
  isPaused: boolean;
  targetDuration?: number;
}

// URL State Management
function parseUrlState() {
  const params = new URLSearchParams(window.location.search);
  return {
    tab: params.get('tab') || 'Dashboard',
    subTab: params.get('subTab') || null,
    view: params.get('view') || null, // 'gantt', 'board', etc.
    projectId: params.get('projectId') || null,
  };
}

function buildUrl(state: { tab?: string; subTab?: string | null; view?: string | null; projectId?: string | null }) {
  const params = new URLSearchParams();
  if (state.tab && state.tab !== 'Dashboard') params.set('tab', state.tab);
  if (state.subTab) params.set('subTab', state.subTab);
  if (state.view) params.set('view', state.view);
  if (state.projectId) params.set('projectId', state.projectId);
  
  const queryString = params.toString();
  return queryString ? `?${queryString}` : '/';
}

function App() {
  const mainContentRef = React.useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Warm the AI Insights cache in the background so it loads fast when the user navigates there
  useEffect(() => {
    insightsEngine.fetchForAIInsights().catch(() => {/* non-critical, silently ignore */});
  }, []);

  // Use unified context for task management
  const { onTimerStop: unifiedTimerStop, fetchUserTasks } = useUnifiedTasks();
  // Legacy context - kept for backwards compatibility during migration
  const { refreshTasks: legacyRefreshTasks } = useTasks();

  // Initialize state from URL
  const initialUrlState = parseUrlState();
  
  const [activeTab, setActiveTabInternal] = useState(initialUrlState.tab);
  const [activeWorkSubTab, setActiveWorkSubTabInternal] = useState(
    initialUrlState.tab === 'Work' && initialUrlState.subTab ? initialUrlState.subTab : 'Projects'
  );
  const [activeTimeSubTab, setActiveTimeSubTabInternal] = useState(
    initialUrlState.tab === 'Time' && initialUrlState.subTab ? initialUrlState.subTab : 'My Calendar'
  );
  const [activeFinanceSubTab, setActiveFinanceSubTabInternal] = useState(
    initialUrlState.tab === 'Finance' && initialUrlState.subTab ? initialUrlState.subTab : 'Spending'
  );
  const [activeAnalyticsSubTab, setActiveAnalyticsSubTabInternal] = useState(
    initialUrlState.tab === 'Analytics' && initialUrlState.subTab ? initialUrlState.subTab : 'Reports'
  );
  const [showGanttView, setShowGanttViewInternal] = useState(initialUrlState.view === 'gantt');
  const [selectedProjectId, setSelectedProjectIdInternal] = useState<string | null>(initialUrlState.projectId);
  
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showWidgetConfig, setShowWidgetConfig] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showQuickAccessDropdown, setShowQuickAccessDropdown] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'member'>('admin');
  const [ganttRefreshKey, setGanttRefreshKey] = useState(0);

  // Update URL when state changes
  const updateUrl = useCallback((newState: { tab?: string; subTab?: string | null; view?: string | null; projectId?: string | null }) => {
    const url = buildUrl(newState);
    window.history.pushState(newState, '', url);
  }, []);

  // Wrapper functions that update both state and URL
  const setActiveTab = useCallback((tab: string) => {
    setActiveTabInternal(tab);
    const subTab = tab === 'Work' ? activeWorkSubTab : 
                   tab === 'Time' ? activeTimeSubTab :
                   tab === 'Finance' ? activeFinanceSubTab :
                   tab === 'Analytics' ? activeAnalyticsSubTab : null;
    setShowGanttViewInternal(false);
    setSelectedProjectIdInternal(null);
    updateUrl({ tab, subTab, view: null, projectId: null });
  }, [activeWorkSubTab, activeTimeSubTab, activeFinanceSubTab, activeAnalyticsSubTab, updateUrl]);

  const setActiveWorkSubTab = useCallback((subTab: string) => {
    setActiveWorkSubTabInternal(subTab);
    setShowGanttViewInternal(false);
    setSelectedProjectIdInternal(null);
    updateUrl({ tab: 'Work', subTab, view: null, projectId: null });
  }, [updateUrl]);

  const setActiveTimeSubTab = useCallback((subTab: string) => {
    setActiveTimeSubTabInternal(subTab);
    updateUrl({ tab: 'Time', subTab, view: null, projectId: null });
  }, [updateUrl]);

  const setActiveFinanceSubTab = useCallback((subTab: string) => {
    setActiveFinanceSubTabInternal(subTab);
    updateUrl({ tab: 'Finance', subTab, view: null, projectId: null });
  }, [updateUrl]);

  const setActiveAnalyticsSubTab = useCallback((subTab: string) => {
    setActiveAnalyticsSubTabInternal(subTab);
    updateUrl({ tab: 'Analytics', subTab, view: null, projectId: null });
  }, [updateUrl]);

  const openGanttView = useCallback((projectId: string) => {
    setSelectedProjectIdInternal(projectId);
    setShowGanttViewInternal(true);
    updateUrl({ tab: 'Work', subTab: 'Projects', view: 'gantt', projectId });
  }, [updateUrl]);

  const closeGanttView = useCallback(() => {
    setShowGanttViewInternal(false);
    setSelectedProjectIdInternal(null);
    updateUrl({ tab: 'Work', subTab: 'Projects', view: null, projectId: null });
  }, [updateUrl]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const urlState = parseUrlState();
      setActiveTabInternal(urlState.tab);
      
      if (urlState.tab === 'Work' && urlState.subTab) {
        setActiveWorkSubTabInternal(urlState.subTab);
      }
      if (urlState.tab === 'Time' && urlState.subTab) {
        setActiveTimeSubTabInternal(urlState.subTab);
      }
      if (urlState.tab === 'Finance' && urlState.subTab) {
        setActiveFinanceSubTabInternal(urlState.subTab);
      }
      if (urlState.tab === 'Analytics' && urlState.subTab) {
        setActiveAnalyticsSubTabInternal(urlState.subTab);
      }
      
      setShowGanttViewInternal(urlState.view === 'gantt');
      setSelectedProjectIdInternal(urlState.projectId);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Widget configuration state
  const [widgets, setWidgets] = useState([
    { id: 'quick-access', name: 'Quick Access', description: 'Frequently used tools and shortcuts', visible: true, gridPosition: 'top-left' },
    { id: 'agenda', name: 'Today\'s Agenda', description: 'Your schedule and meetings', visible: true, gridPosition: 'top-middle' },
    { id: 'red-zone', name: 'Red Zone Projects', description: 'Projects needing attention', visible: true, gridPosition: 'top-right' },
    { id: 'fyi', name: 'FYI', description: 'Important updates and announcements', visible: true, gridPosition: 'middle-left' },
    { id: 'pending-approvals', name: 'Pending Approvals', description: 'Items awaiting your approval', visible: true, gridPosition: 'middle-middle' },
    { id: 'whos-where', name: 'Who\'s Where', description: 'Team availability and location', visible: true, gridPosition: 'middle-right' },
    { id: 'todo', name: 'To-Do List', description: 'Your personal task list', visible: true, gridPosition: 'bottom-left' },
    { id: 'task-overview', name: 'Task Overview', description: 'Summary of all your tasks', visible: true, gridPosition: 'bottom-right' }
  ]);

  // Global timer state
  const [timerState, setTimerState] = useState<TimerState>({
    taskId: null,
    taskTitle: null,
    projectId: null,
    projectName: null,
    projectColor: null,
    startTime: null,
    pausedTime: 0,
    isPaused: false,
  });
  const [showSetDuration, setShowSetDuration] = useState(false);
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [pendingTimerTaskId, setPendingTimerTaskId] = useState<string | null>(null);
  const [pendingTimerTaskInfo, setPendingTimerTaskInfo] = useState<{ title: string; projectId: string; projectName: string; projectColor: string } | null>(null);
  const [timerTick, setTimerTick] = useState(0); // For periodic timer checks
  const extensionShownRef = React.useRef(false); // Track if we've shown extension modal for this timer session
  
  const tabs = ['Dashboard', 'Work', 'Time', 'Finance', 'Analytics'];
  
  const subMenus = {
    Work: ['Projects', 'My Tasks', 'Resource Planner'],
    Time: ['My Calendar', 'Timesheets', 'Leave'],
    Finance: ['Spending', 'Billing'],
    Analytics: ['Reports', 'AI Insights', 'Utilization', 'Forecasting']
  };

  // Keyboard shortcut handler
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearchModal(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        setShowQuickAccessDropdown(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // OAuth callback handler for calendar sync
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const pending = localStorage.getItem('workdeck-calendar-sync-pending');

    if (code && pending) {
      (async () => {
        try {
          const { vendor, from } = JSON.parse(pending);
          const tokenEndpoint = vendor === 'google'
            ? '/calendar/google/v1/token'
            : '/calendar/microsoft/v1/token';

          await apiClient.get(tokenEndpoint, { code });

          localStorage.setItem('workdeck-calendar-sync-result', JSON.stringify({
            success: true,
            vendor,
            from,
          }));
        } catch (err) {
          const vendor = JSON.parse(pending).vendor;
          localStorage.setItem('workdeck-calendar-sync-result', JSON.stringify({
            success: false,
            vendor,
          }));
          console.error('Calendar sync token exchange failed:', err);
        } finally {
          localStorage.removeItem('workdeck-calendar-sync-pending');
          // Clean URL
          window.history.replaceState({}, '', window.location.pathname);
          setShowProfile(true);
        }
      })();
    }
  }, []);

  const getActiveSubTab = () => {
    if (activeTab === 'Work') return activeWorkSubTab;
    if (activeTab === 'Time') return activeTimeSubTab;
    if (activeTab === 'Finance') return activeFinanceSubTab;
    if (activeTab === 'Analytics') return activeAnalyticsSubTab;
    return null;
  };

  const setActiveSubTab = (tab: string) => {
    if (activeTab === 'Work') setActiveWorkSubTab(tab);
    if (activeTab === 'Time') setActiveTimeSubTab(tab);
    if (activeTab === 'Finance') setActiveFinanceSubTab(tab);
    if (activeTab === 'Analytics') setActiveAnalyticsSubTab(tab);
  };

  // Timer functions
  const startTimer = (taskId: string, taskTitle: string, projectId: string, projectName: string, projectColor: string) => {
    setPendingTimerTaskId(taskId);
    setPendingTimerTaskInfo({ title: taskTitle, projectId, projectName, projectColor });
    setShowSetDuration(true);
  };

  const handleStartTimerWithDuration = async (duration?: number) => {
    if (pendingTimerTaskId && pendingTimerTaskInfo) {
      // Reset extension modal state for new timer
      extensionShownRef.current = false;
      setShowExtensionModal(false);

      const startTime = Date.now();

      // Format date for API (DD/MM/YYYY HH:mm:ss+0000)
      const formatDateForApi = (date: Date): string => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}+0000`;
      };

      // Try to start timer on server (so timer/stop will work later)
      if (duration) {
        const finishDate = new Date(startTime + duration * 60 * 1000);
        try {
          await apiClient.post('/commands/sync/timer/start', {
            task: { id: pendingTimerTaskId },
            finishDate: formatDateForApi(finishDate),
          });
          console.log('[Timer] Started on server');
        } catch (err) {
          console.warn('[Timer] Failed to start on server, continuing locally:', err);
        }
      }

      setTimerState({
        taskId: pendingTimerTaskId,
        taskTitle: pendingTimerTaskInfo.title,
        projectId: pendingTimerTaskInfo.projectId,
        projectName: pendingTimerTaskInfo.projectName,
        projectColor: pendingTimerTaskInfo.projectColor,
        startTime: startTime,
        pausedTime: 0,
        isPaused: false,
        targetDuration: duration,
      });
    }
    setShowSetDuration(false);
    setPendingTimerTaskId(null);
    setPendingTimerTaskInfo(null);
  };

  const pauseTimer = () => {
    if (timerState.startTime && !timerState.isPaused) {
      setTimerState(prev => ({
        ...prev,
        pausedTime: prev.pausedTime + (Date.now() - (prev.startTime || 0)),
        startTime: null,
        isPaused: true,
      }));
    }
  };

  const resumeTimer = () => {
    if (timerState.isPaused) {
      setTimerState(prev => ({
        ...prev,
        startTime: Date.now(),
        isPaused: false,
      }));
    }
  };

  const stopTimer = async () => {
    const elapsedMs = getElapsedTime();

    // Format date for API (DD/MM/YYYY HH:mm:ss+0000)
    const formatDateForApi = (date: Date): string => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}+0000`;
    };

    // Try to log time if we have elapsed time and required data
    if (elapsedMs > 0 && timerState.taskId && timerState.startTime && user?.id) {
      let timeLogged = false;

      // First, try the timer/stop endpoint which properly updates task time
      try {
        console.log('[Timer] Attempting timer/stop API...');
        await apiClient.post('/commands/sync/timer/stop', {});
        console.log('[Timer] timer/stop succeeded - time logged to task');
        timeLogged = true;
      } catch (err) {
        console.warn('[Timer] timer/stop failed, trying manual event creation:', err);
      }

      // If timer/stop failed, create calendar event manually
      if (!timeLogged) {
        try {
          const startTime = new Date(timerState.startTime);
          const endTime = new Date(timerState.startTime + elapsedMs);

          const eventPayload: any = {
            id: crypto.randomUUID(),
            title: timerState.taskTitle || 'Timer Entry',
            startAt: formatDateForApi(startTime),
            endAt: formatDateForApi(endTime),
            color: timerState.projectColor || '#3B82F6',
            state: 1,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Madrid',
            timesheet: true,
            billable: false,
            private: false,
            task: { id: timerState.taskId },
            guests: [{ id: user.id }],
            fromUser: user.id,
            creator: { id: user.id },
          };

          if (timerState.projectId) {
            eventPayload.project = { id: timerState.projectId };
          }

          console.log('[Timer] Creating calendar event manually:', eventPayload);
          await apiClient.post('/commands/sync/create-event', eventPayload);
          console.log('[Timer] Calendar event created');
          timeLogged = true;
        } catch (eventErr) {
          console.error('[Timer] Failed to create calendar event:', eventErr);
        }
      }

      if (timeLogged) {
        toast.success(`Timer stopped: ${formatTime(elapsedMs)} logged`);

        // Refresh task contexts
        try {
          // Unified context - primary refresh (updates all views)
          if (timerState.taskId) {
            await unifiedTimerStop(timerState.taskId, timerState.projectId || undefined);
            console.log('[Timer] Unified tasks refreshed');
          }

          // Legacy context (for backwards compatibility during migration)
          await legacyRefreshTasks();
          console.log('[Timer] Legacy tasks refreshed');
        } catch (refreshErr) {
          console.warn('[Timer] Failed to refresh tasks:', refreshErr);
        }

        // Trigger Gantt view refresh if open (legacy, will be removed)
        setGanttRefreshKey(k => k + 1);
        console.log('[Timer] Gantt refresh triggered');
      } else {
        toast.error('Timer stopped but failed to save time');
      }
    } else if (elapsedMs > 0) {
      toast.success(`Timer stopped: ${formatTime(elapsedMs)}`);
    }

    setTimerState({
      taskId: null,
      taskTitle: null,
      projectId: null,
      projectName: null,
      projectColor: null,
      startTime: null,
      pausedTime: 0,
      isPaused: false,
    });
  };

  const getElapsedTime = () => {
    if (timerState.isPaused) {
      return timerState.pausedTime;
    }
    if (timerState.startTime) {
      return timerState.pausedTime + (Date.now() - timerState.startTime);
    }
    return 0;
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const handleExtendTimer = (minutes: number) => {
    setTimerState(prev => ({
      ...prev,
      targetDuration: (prev.targetDuration || 0) + minutes, // Add minutes to minutes
    }));
    // Reset so we can show warning again at the new 2-minute mark
    extensionShownRef.current = false;
    setShowExtensionModal(false);
  };

  const handleFinishTimer = () => {
    stopTimer();
    setShowExtensionModal(false);
  };

  // Timer tick - updates every second when timer is running
  useEffect(() => {
    if (!timerState.taskId || timerState.isPaused || !timerState.startTime) return;

    const interval = setInterval(() => {
      setTimerTick(t => t + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timerState.taskId, timerState.isPaused, timerState.startTime]);

  // Check for 2-minute warning before timer ends AND auto-stop at 0
  useEffect(() => {
    if (!timerState.targetDuration || timerState.isPaused || !timerState.startTime) return;

    const elapsedMs = getElapsedTime();
    const targetMs = timerState.targetDuration * 60 * 1000; // Convert minutes to ms
    const remainingMs = targetMs - elapsedMs;

    // Auto-stop when timer reaches 0
    if (remainingMs <= 0) {
      setShowExtensionModal(false);
      stopTimer();
      return;
    }

    // Show extension modal when 2 minutes or less remaining (only once per timer)
    if (extensionShownRef.current) return;

    // Also require at least (duration - 2 min) to have elapsed to prevent false triggers
    const minElapsedMs = Math.max(10000, targetMs - 120000); // At least 10 seconds or (duration - 2 min)

    if (remainingMs <= 120000 && remainingMs > 0 && elapsedMs >= minElapsedMs) {
      extensionShownRef.current = true;
      setShowExtensionModal(true);
    }
  }, [timerState, timerTick]);

  const renderContent = () => {
    // Show Gantt View if flag is set
    if (showGanttView) {
      return <GanttView projectId={selectedProjectId || undefined} onClose={closeGanttView} refreshKey={ganttRefreshKey} />;
    }

    if (activeTab === 'Dashboard') {
      return (
        <Dashboard 
          showWidgetConfig={showWidgetConfig}
          onCloseWidgetConfig={() => setShowWidgetConfig(false)}
          onConfigureWidgets={() => setShowWidgetConfig(true)}
          onNavigateToProjects={() => {
            setActiveTab('Work');
            setActiveWorkSubTab('Projects');
          }}
        />
      );
    }

    if (activeTab === 'Work' && activeWorkSubTab === 'Projects') {
      return (
        <ProjectTriageBoard 
          onOpenGantt={openGanttView}
        />
      );
    }

    // My Tasks view
    if (activeTab === 'Work' && activeWorkSubTab === 'My Tasks') {
      return <MyTasksBoard onStartTimer={startTimer} />;
    }

    // Resource Planner view
    if (activeTab === 'Work' && activeWorkSubTab === 'Resource Planner') {
      return <ResourcePlanner />;
    }

    // Calendar view
    if (activeTab === 'Time' && activeTimeSubTab === 'My Calendar') {
      return <WorkdeckCalendar />;
    }

    // Leave view (My Leave / Team Leave / Approvals tabs)
    if (activeTab === 'Time' && activeTimeSubTab === 'Leave') {
      return <LeaveView />;
    }

    // Spending view
    if (activeTab === 'Finance' && activeFinanceSubTab === 'Spending') {
      return <SpendingView scrollContainerRef={mainContentRef} />;
    }

    // Billing view
    if (activeTab === 'Finance' && activeFinanceSubTab === 'Billing') {
      return <BillingView scrollContainerRef={mainContentRef} />;
    }

    // Reports view
    if (activeTab === 'Analytics' && activeAnalyticsSubTab === 'Reports') {
      return <ReportsView />;
    }

    // AI Insights view
    if (activeTab === 'Analytics' && activeAnalyticsSubTab === 'AI Insights') {
      return <AIInsightsView />;
    }

    // Timesheets view
    if (activeTab === 'Time' && activeTimeSubTab === 'Timesheets') {
      return <TimesheetView />;
    }

    // Utilization view
    if (activeTab === 'Analytics' && activeAnalyticsSubTab === 'Utilization') {
      return <UtilizationView />;
    }

    // Forecasting view
    if (activeTab === 'Analytics' && activeAnalyticsSubTab === 'Forecasting') {
      return <ForecastingView />;
    }

    // Other analytics placeholders
    if (activeTab === 'Analytics') {
      return <PendingScreen feature={activeAnalyticsSubTab || 'Analytics'} />;
    }

    return <PendingScreen feature={getActiveSubTab() || activeTab} />;
  };

  // Profile page
  if (showProfile) {
    return (
      <Suspense fallback={<SuspenseFallback />}>
        <MyProfileSettings onBack={() => setShowProfile(false)} />
      </Suspense>
    );
  }

  // Settings modal
  if (showSettings) {
    return (
      <Suspense fallback={<SuspenseFallback />}>
        <SettingsDashboardRedesigned onClose={() => setShowSettings(false)} />
      </Suspense>
    );
  }

  // Onboarding flow
  if (showOnboarding) {
    return (
      <Suspense fallback={<SuspenseFallback />}>
        <OnboardingFlow onComplete={() => setShowOnboarding(false)} />
      </Suspense>
    );
  }

  return (
    <BillingProvider>
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: '#FAFAFA' }}>
      <Toaster position="top-right" richColors />
      
      {/* Top Navigation Bar */}
      <div className="flex-shrink-0 bg-white border-b" style={{ borderColor: '#E5E7EB' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 h-14">
          {/* Left - Logo */}
          <div className="flex items-center gap-8">
            <img src={workdeckLogo} alt="Workdeck" className="h-6" />
          </div>

          {/* Center - Search */}
          <div className="flex-1 max-w-xl mx-8">
            <button
              onClick={() => setShowSearchModal(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-left"
              style={{ 
                borderColor: '#E5E7EB', 
                backgroundColor: '#F9FAFB',
                color: '#9CA3AF'
              }}
            >
              <Search className="w-4 h-4" />
              <span className="flex-1">Quick search</span>
              <kbd className="px-2 py-0.5 text-xs rounded" style={{ backgroundColor: '#E5E7EB', color: '#6B7280' }}>⌘K</kbd>
            </button>
          </div>

          {/* Right - Actions */}
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setShowQuickAccessDropdown(true)}
              className="p-2 rounded-lg transition-colors hover:bg-gray-100 relative group"
              title="Quick Actions (⌘J)"
            >
              <Zap className="w-5 h-5" style={{ color: '#6B7280' }} />
            </button>
            <button className="p-2 rounded-lg transition-colors hover:bg-gray-100">
              <Plus className="w-5 h-5" style={{ color: '#6B7280' }} />
            </button>
            <button className="p-2 rounded-lg transition-colors hover:bg-gray-100">
              <Clock className="w-5 h-5" style={{ color: '#6B7280' }} />
            </button>
            <button className="p-2 rounded-lg transition-colors hover:bg-gray-100">
              <Receipt className="w-5 h-5" style={{ color: '#6B7280' }} />
            </button>
            <button className="p-2 rounded-lg transition-colors hover:bg-gray-100 relative">
              <Bell className="w-5 h-5" style={{ color: '#6B7280' }} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* User Menu */}
            <div className="relative ml-2">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1 rounded-lg transition-colors hover:bg-gray-100"
              >
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                  style={{ backgroundColor: '#0066FF' }}
                >
                  {user?.fullName ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??'}
                </div>
                <ChevronDown className="w-4 h-4" style={{ color: '#6B7280' }} />
              </button>

              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                  <div 
                    className="absolute right-0 top-full mt-2 w-56 rounded-lg shadow-lg border z-50 bg-white"
                    style={{ borderColor: '#E5E7EB' }}
                  >
                    <div className="p-3 border-b" style={{ borderColor: '#E5E7EB' }}>
                      <p className="font-medium" style={{ color: '#111827' }}>{user?.fullName || 'User'}</p>
                      <p className="text-sm" style={{ color: '#6B7280' }}>{user?.email || ''}</p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          setShowProfile(true);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors hover:bg-gray-50"
                        style={{ color: '#374151' }}
                      >
                        <User className="w-4 h-4" />
                        My Profile
                      </button>
                      <button 
                        onClick={() => {
                          setShowUserMenu(false);
                          setShowSettings(true);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors hover:bg-gray-50" 
                        style={{ color: '#374151' }}
                      >
                        <SettingsIcon className="w-4 h-4" />
                        Settings
                      </button>
                      <button 
                        onClick={() => {
                          setShowUserMenu(false);
                          setShowWidgetConfig(true);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors hover:bg-gray-50" 
                        style={{ color: '#374151' }}
                      >
                        <LayoutGrid className="w-4 h-4" />
                        Configure Widgets
                      </button>
                      <button className="w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors hover:bg-gray-50" style={{ color: '#374151' }}>
                        <HelpCircle className="w-4 h-4" />
                        Help & Support
                      </button>
                    </div>
                    <div className="border-t py-1" style={{ borderColor: '#E5E7EB' }}>
                      <button 
                        onClick={() => setShowUserMenu(false)}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors hover:bg-gray-50" 
                        style={{ color: '#EF4444' }}
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Main Tabs */}
        <div className="flex items-center gap-1 px-6">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              onMouseEnter={undefined}
              className="px-4 relative transition-colors"
              style={{
                height: '44px',
                color: activeTab === tab ? '#0066FF' : '#6B7280',
                fontSize: '14px',
              }}
            >
              {tab}
              {activeTab === tab && (
                <div 
                  className="absolute bottom-0 left-0 right-0" 
                  style={{ 
                    height: '2px',
                    backgroundColor: '#0066FF',
                  }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Sub Tabs */}
        {activeTab !== 'Dashboard' && subMenus[activeTab as keyof typeof subMenus] && (
          <div className="flex items-center gap-1 px-6" style={{ backgroundColor: '#F9FAFB', borderTop: '1px solid #E5E7EB' }}>
            {subMenus[activeTab as keyof typeof subMenus].map(subTab => (
              <button
                key={subTab}
                onClick={() => setActiveSubTab(subTab)}
                className="px-3 relative transition-colors"
                style={{
                  height: '36px',
                  color: getActiveSubTab() === subTab ? '#111827' : '#6B7280',
                  fontSize: '13px',
                }}
              >
                {subTab}
                {getActiveSubTab() === subTab && (
                  <div 
                    className="absolute bottom-0 left-0 right-0" 
                    style={{ 
                      height: '2px',
                      backgroundColor: '#0066FF',
                    }}
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content Area */}
      <div ref={mainContentRef} className={`flex-1 min-h-0 ${showGanttView ? 'overflow-hidden' : 'overflow-auto'}`}>
        <LazyLoadErrorBoundary>
          <Suspense fallback={<SuspenseFallback />}>
            {renderContent()}
          </Suspense>
        </LazyLoadErrorBoundary>
      </div>

      {/* Active Timer Bar */}
      {timerState.taskId && (
        <ActiveTimerBar
          taskTitle={timerState.taskTitle || ''}
          projectName={timerState.projectName || ''}
          projectColor={timerState.projectColor || '#0066FF'}
          elapsedTime={getElapsedTime()}
          isPaused={timerState.isPaused}
          targetDuration={timerState.targetDuration}
          onPause={pauseTimer}
          onResume={resumeTimer}
          onStop={stopTimer}
        />
      )}

      {/* Modals */}
      {showSearchModal && (
        <Suspense fallback={null}>
          <QuickAccessSearchModal onClose={() => setShowSearchModal(false)} />
        </Suspense>
      )}

      {showQuickAccessDropdown && (
        <QuickAccessDropdown
          onClose={() => setShowQuickAccessDropdown(false)}
          onNavigate={(section, subsection) => {
            setActiveTab(section);
            if (subsection) {
              setActiveSubTab(subsection);
            }
            setShowQuickAccessDropdown(false);
          }}
        />
      )}

      {showWidgetConfig && (
        <Suspense fallback={null}>
          <WidgetConfigModal
            widgets={widgets}
            onClose={() => setShowWidgetConfig(false)}
            onSave={(updatedWidgets) => {
              setWidgets(updatedWidgets);
              setShowWidgetConfig(false);
            }}
          />
        </Suspense>
      )}

      {showSetDuration && (
        <SetTimerDurationModal
          onClose={() => {
            setShowSetDuration(false);
            setPendingTimerTaskId(null);
            setPendingTimerTaskInfo(null);
          }}
          onStart={handleStartTimerWithDuration}
          taskTitle={pendingTimerTaskInfo?.title || ''}
          projectName={pendingTimerTaskInfo?.projectName || ''}
        />
      )}

      {showExtensionModal && (
        <TimerExtensionModal
          taskTitle={timerState.taskTitle || ''}
          projectName={timerState.projectName || ''}
          onExtend={handleExtendTimer}
          onFinish={handleFinishTimer}
          onClose={() => setShowExtensionModal(false)}
        />
      )}
    </div>
    </BillingProvider>
  );
}

export default function WrappedApp() {
  return (
    <AuthProvider>
      <UnifiedTasksProvider>
        <TasksProvider>
          <LeaveProvider>
            <SpendingProvider>
              <AuthenticatedApp />
            </SpendingProvider>
          </LeaveProvider>
        </TasksProvider>
      </UnifiedTasksProvider>
    </AuthProvider>
  );
}

function AuthenticatedApp() {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const [showApp, setShowApp] = useState(false);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-[#0066FF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#737373]">Loading...</p>
        </div>
        <Toaster position="top-right" richColors />
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated && !showApp) {
    return (
      <LazyLoadErrorBoundary>
        <Suspense fallback={<SuspenseFallback />}>
          <LoginScreen onLoginSuccess={() => setShowApp(true)} />
          <Toaster position="top-right" richColors />
        </Suspense>
      </LazyLoadErrorBoundary>
    );
  }

  // Show main app
  return <App />;
}
