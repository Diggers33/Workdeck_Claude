import React, { useState, useEffect } from 'react';
import { PendingApprovalsWidget } from './widgets/PendingApprovalsWidget';
import { AgendaWidget } from './widgets/AgendaWidget';
import { TodoListWidget } from './widgets/TodoListWidget';
import { FYIWidget } from './widgets/FYIWidget';
import { WhosWhereWidget } from './widgets/WhosWhereWidget';
import { RedZoneWidget } from './widgets/RedZoneWidget';
import { KeyMetricsWidget } from './dashboard/KeyMetricsWidget';
import { ProjectPortfolioWidget } from './widgets/ProjectPortfolioWidget';
import { WidgetConfigModal } from './WidgetConfigModal';
import { AlertModal } from './AlertModal';
import { TaskDetailModal } from './gantt/TaskDetailModal';

interface DashboardProps {
  userRole?: 'project_manager' | 'team_member' | 'executive';
  showWidgetConfig?: boolean;
  onCloseWidgetConfig?: () => void;
  onNavigateToProject?: (projectId: string) => void;
  onNavigateToPortfolio?: () => void;
}

interface WidgetConfig {
  id: string;
  name: string;
  description: string;
  visible: boolean;
}

const STORAGE_KEY = 'workdeck-dashboard-widgets-v2';

// Default widget configurations
const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'project-portfolio', name: 'Project Portfolio', description: 'High-level overview of all active projects with status and progress', visible: true },
  { id: 'key-metrics', name: 'Key Metrics', description: 'Real-time KPIs and performance indicators for your projects', visible: true },
  { id: 'todo', name: 'To-Do List', description: 'Your personal task list with drag-and-drop functionality', visible: true },
  { id: 'agenda', name: 'Agenda', description: 'Upcoming meetings and scheduled events', visible: true },
  { id: 'red-zone', name: 'Red Zone', description: 'Critical issues and urgent items requiring attention', visible: true },
  { id: 'pending-approvals', name: 'Pending Approvals', description: 'Items requiring your review and approval', visible: true },
  { id: 'fyi', name: 'FYI', description: 'Important updates and information you need to be aware of', visible: false },
  { id: 'whos-where', name: "Who's Where", description: 'Team member locations and availability status', visible: false },
];

export function Dashboard({ 
  userRole = 'project_manager', 
  showWidgetConfig = false, 
  onCloseWidgetConfig, 
  onNavigateToProject, 
  onNavigateToPortfolio 
}: DashboardProps) {
  const [draggedTask, setDraggedTask] = useState<any>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [widgetConfigs, setWidgetConfigs] = useState<WidgetConfig[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load widget configs:', e);
    }
    return DEFAULT_WIDGETS;
  });

  // Save to localStorage when configs change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(widgetConfigs));
  }, [widgetConfigs]);

  const handleUpdateTask = (taskId: string, updates: any) => {
    console.log('Task updated:', taskId, updates);
  };

  const handleToggleWidget = (id: string) => {
    setWidgetConfigs(prev => {
      const widget = prev.find(w => w.id === id);
      if (!widget) return prev;

      const visibleCount = prev.filter(w => w.visible).length;
      
      // If enabling and already at max 6
      if (!widget.visible && visibleCount >= 6) {
        setShowAlert(true);
        return prev;
      }

      return prev.map(w => 
        w.id === id ? { ...w, visible: !w.visible } : w
      );
    });
  };

  const handleReorder = (reorderedWidgets: WidgetConfig[]) => {
    setWidgetConfigs(reorderedWidgets);
  };

  const handleSave = () => {
    // Already saved via useEffect
  };

  // Get visible widgets in order
  const visibleWidgets = widgetConfigs.filter(w => w.visible);

  // Render a widget by its ID
  const renderWidget = (id: string, index: number) => {
    // Determine grid position based on index
    // Layout: 2 columns for regular widgets, To-Do and Agenda span 2 rows on right
    const isTallWidget = id === 'todo' || id === 'agenda';
    
    const props: React.CSSProperties = {
      height: '100%',
      minHeight: 0,
    };

    switch (id) {
      case 'project-portfolio':
        return <ProjectPortfolioWidget onProjectClick={onNavigateToProject} onHeaderClick={onNavigateToPortfolio} />;
      case 'key-metrics':
        return <KeyMetricsWidget />;
      case 'todo':
        return (
          <TodoListWidget 
            onDragStart={setDraggedTask} 
            onDragEnd={() => setDraggedTask(null)} 
            onTaskClick={setSelectedTask}
          />
        );
      case 'agenda':
        return <AgendaWidget draggedTask={draggedTask} />;
      case 'red-zone':
        return <RedZoneWidget />;
      case 'pending-approvals':
        return <PendingApprovalsWidget />;
      case 'fyi':
        return <FYIWidget />;
      case 'whos-where':
        return <WhosWhereWidget />;
      default:
        return null;
    }
  };

  // Separate tall widgets (todo, agenda) from regular widgets
  const tallWidgets = visibleWidgets.filter(w => w.id === 'todo' || w.id === 'agenda');
  const regularWidgets = visibleWidgets.filter(w => w.id !== 'todo' && w.id !== 'agenda');

  return (
    <div style={{ background: '#FAFBFC', height: '100%', padding: '16px', position: 'relative' }}>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: tallWidgets.length > 0 
          ? `repeat(2, 1fr) repeat(${tallWidgets.length}, 340px)`
          : 'repeat(2, 1fr)',
        gridTemplateRows: '1fr 1fr',
        gap: '12px',
        height: '100%',
        maxWidth: '1600px',
        margin: '0 auto'
      }}>
        {/* Regular widgets - 2 columns, 2 rows */}
        {regularWidgets.slice(0, 4).map((widget, index) => (
          <div 
            key={widget.id}
            style={{ 
              gridColumn: (index % 2) + 1,
              gridRow: Math.floor(index / 2) + 1,
              minHeight: 0,
              overflow: 'hidden'
            }}
          >
            {renderWidget(widget.id, index)}
          </div>
        ))}

        {/* Tall widgets - right columns, span 2 rows */}
        {tallWidgets.map((widget, index) => (
          <div 
            key={widget.id}
            style={{ 
              gridColumn: 3 + index,
              gridRow: '1 / 3',
              minHeight: 0,
              overflow: 'hidden'
            }}
          >
            {renderWidget(widget.id, index)}
          </div>
        ))}
      </div>

      {/* Widget Configuration Modal */}
      <WidgetConfigModal
        isOpen={showWidgetConfig}
        onClose={() => onCloseWidgetConfig?.()}
        widgets={widgetConfigs}
        onToggleWidget={handleToggleWidget}
        onReorder={handleReorder}
        onSave={handleSave}
      />

      {/* Alert Modal */}
      <AlertModal
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        title="Maximum 6 widgets allowed"
        message="You can only have 6 widgets active at once. Please disable another widget first."
      />

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdateTask={handleUpdateTask}
        />
      )}
    </div>
  );
}
