import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, ListTodo, Flag, DollarSign,
  FileText, StickyNote, Settings, X, Save, Loader2, Check, Send
} from 'lucide-react';
import { OverviewSection } from './workspace/OverviewSection';
import { TeamSection } from './workspace/TeamSection';
import { ActivitiesSection } from './workspace/ActivitiesSection';
import { MilestonesSection } from './workspace/MilestonesSection';
import { BudgetSection } from './workspace/BudgetSection';
import { FilesSection } from './workspace/FilesSection';
import { NotesSection } from './workspace/NotesSection';
import { SettingsSection } from './workspace/SettingsSection';
import { apiClient } from '@/services/api-client';
import workdeckLogo from '@/assets/6f22f481b9cda400eddbba38bd4678cd9b214998.png';

interface ProjectWorkspaceProps {
  mode?: 'create' | 'edit';
  projectId?: string;
  projectData?: any;
  onClose?: () => void;
  onSaved?: () => void;
  onSave?: (data: any) => void;  // Called after successful save with project data
}

const NAVIGATION_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'team', label: 'Team & Roles', icon: Users },
  { id: 'activities', label: 'Activities & Tasks', icon: ListTodo },
  { id: 'milestones', label: 'Milestones', icon: Flag },
  { id: 'budget', label: 'Budget & Expenditures', icon: DollarSign },
  { id: 'files', label: 'Files', icon: FileText },
  { id: 'notes', label: 'Notes', icon: StickyNote },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function ProjectWorkspace({ mode = 'edit', projectId, projectData: initialProjectData, onClose, onSaved, onSave }: ProjectWorkspaceProps) {
  const [activeSection, setActiveSection] = useState('overview');
  const [projectData, setProjectData] = useState<any>(initialProjectData || {});
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState<'draft' | 'publish' | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  const isNewProject = mode === 'create' || !projectId;
  const isDraft = projectData.isDraft !== false;

  useEffect(() => {
    if (initialProjectData) {
      setProjectData(initialProjectData);
    }
  }, [initialProjectData]);

  const handleUpdate = (field: string, value: any) => {
    console.log('handleUpdate called:', field, value);
    setProjectData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
    setSaveStatus('idle');
  };

  const formatProjectPayload = (asDraft: boolean, includeTasksAndActivities: boolean = true) => {
    const pid = projectId || projectData.id || projectData.project;
    console.log('formatProjectPayload - activities:', projectData.activities);
    console.log('formatProjectPayload - activities count:', projectData.activities?.length);
    console.log('formatProjectPayload - includeTasksAndActivities:', includeTasksAndActivities);
    if (projectData.activities?.length > 0) {
      console.log('formatProjectPayload - first activity tasks count:', projectData.activities[0]?.tasks?.length);
    }

    const basePayload: any = {
      id: pid,
      project: pid,
      name: projectData.name,
      code: projectData.code,
      startDate: projectData.startDate,
      endDate: projectData.endDate,
      availableHours: projectData.availableHours,
      plannedHours: projectData.plannedHours,
      contractValue: projectData.contractValue,
      billable: projectData.billable,
      timesheet: projectData.timesheet,
      observations: projectData.observations,
      isDraft: asDraft,
      client: projectData.client?.id ? { id: projectData.client.id } :
              typeof projectData.client === 'string' ? projectData.client : undefined,
      costCenter: projectData.costCenter?.id ? { id: projectData.costCenter.id } : undefined,
      financialType: projectData.financialType?.id ? { id: projectData.financialType.id } : undefined,
      // NOTE: Members are NOT included - they use separate endpoints (add-project-member, delete-project-member)
    };

    // Only include activities/tasks for new projects or when explicitly needed
    // For existing projects, tasks/activities are managed via mock endpoints
    if (includeTasksAndActivities) {
      basePayload.activities = (projectData.activities || []).map((a: any, aIdx: number) => {
        const activityId = a.id?.toString().startsWith('new-') ? crypto.randomUUID() : a.id;
        return {
          id: activityId,
          name: a.name,
          position: aIdx,
          availableHours: a.availableHours || '0',
          project: { id: pid },
          tasks: (a.tasks || []).map((t: any, tIdx: number) => {
            // Convert date format from YYYY-MM-DD to DD/MM/YYYY if needed
            const formatDate = (dateStr: string) => {
              if (!dateStr) return null;
              if (dateStr.includes('-') && dateStr.length === 10) {
                const [year, month, day] = dateStr.split('-');
                return `${day}/${month}/${year}`;
              }
              return dateStr;
            };

            // Generate UUID for new tasks (backend requires client-generated UUID)
            const taskId = t.id?.toString().startsWith('new-') ? crypto.randomUUID() : t.id;

            // Debug: log task hours values
            console.log(`[Publish] Task "${t.name}" hours:`, {
              estimatedHours: t.estimatedHours,
              availableHours: t.availableHours,
              plannedHours: t.plannedHours,
              allocations: t.allocations
            });

            return {
              id: taskId,
              activity: { id: activityId },  // Required by backend
              name: t.name || '',
              position: tIdx,
              startDate: formatDate(t.startDate),
              endDate: formatDate(t.endDate),
              plannedHours: t.plannedHours || t.estimatedHours || '0',
              availableHours: t.estimatedHours || t.availableHours || '0',
              description: t.description || '',
              flags: 1,
              // NOTE: Participants are NOT included here - they're managed via
              // mock/add-task-participant + commit-project (Angular pattern)
              // Including them here would overwrite hours set via commit-project
            };
          })
        };
      });
    }

    // Add milestones and budgets
    basePayload.milestones = (projectData.milestones || []).map((m: any) => {
      // Convert date to DD/MM/YYYY format for API
      let deliveryDateFormatted = m.deliveryDate;
      if (m.deliveryDate && m.deliveryDate.includes('-')) {
        const [year, month, day] = m.deliveryDate.split('-');
        deliveryDateFormatted = `${day}/${month}/${year}`;
      }
      return {
        id: m.id?.toString().startsWith('new-') ? undefined : m.id,
        name: m.name,
        description: m.description,
        deliveryDate: deliveryDateFormatted,
        alertDays: m.alertDays || 0,
        color: m.color,
        done: m.done || false,
        task: m.linkedTaskId ? { id: m.linkedTaskId } : undefined,
        activity: m.linkedActivityId ? { id: m.linkedActivityId } : undefined,
      };
    });

    basePayload.budgets = (projectData.budgets || []).map((b: any) => ({
      id: b.id?.toString().startsWith('new-') ? undefined : b.id,
      costType: b.costTypeId ? { id: b.costTypeId } : { name: b.type },
      office: b.officeId ? { id: b.officeId } : undefined,
      department: b.department,
      description: b.description,
      amount: String(b.amount || 0),
      activity: b.linkedActivityId ? { id: b.linkedActivityId } : undefined,
    }));

    return basePayload;
  };

  const validateForPublish = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!projectData.name?.trim()) {
      errors.push('Project name is required');
    }
    
    const hasPM = (projectData.members || []).some((m: any) => m.isProjectManager);
    if (!hasPM) {
      errors.push('Project must have a Project Manager');
    }
    
    const hasTasks = (projectData.activities || []).some((a: any) => 
      (a.tasks || []).some((t: any) => t.name?.trim())
    );
    if (!hasTasks) {
      errors.push('Project must have at least one task to publish');
    }
    
    return { valid: errors.length === 0, errors };
  };

  const saveDraft = async () => {
    setSaving('draft');

    try {
      const pid = projectId || projectData.id || projectData.project;

      // Include tasks in payload
      const payload = formatProjectPayload(true, true);
      console.log('Saving draft:', payload);

      if (isNewProject) {
        await apiClient.post('/commands/sync/create-project', payload);
      } else {
        await apiClient.post('/commands/sync/update-project', payload);
      }

      // Commit queued participant changes AFTER update-project
      if (pid && !isNewProject) {
        console.log('Committing queued participant changes...');
        await apiClient.post('/commands/sync/commit-project', { id: pid });
        console.log('Participant changes committed');
      }
      
      setHasChanges(false);
      setSaveStatus('saved');
      onSaved?.();

      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Failed to save draft:', error);
      setSaveStatus('error');
    } finally {
      setSaving(null);
    }
  };

  const publish = async () => {
    const validation = validateForPublish();
    if (!validation.valid) {
      alert('Cannot publish:\n\n' + validation.errors.join('\n'));
      return;
    }

    setSaving('publish');

    try {
      const pid = projectId || projectData.id || projectData.project;

      // Include tasks in payload - backend needs task structure for commit-project
      const payload = formatProjectPayload(false, true);
      console.log('Publishing project:', payload);

      if (isNewProject) {
        await apiClient.post('/commands/sync/create-project', payload);
      } else {
        await apiClient.post('/commands/sync/update-project', payload);
      }

      // Commit queued participant changes AFTER update-project
      if (pid) {
        console.log('Committing queued participant changes...');
        await apiClient.post('/commands/sync/commit-project', { id: pid });
        console.log('Participant changes committed');
      }
      
      setHasChanges(false);
      setSaveStatus('saved');
      onSaved?.();

      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Failed to publish:', error);
      setSaveStatus('error');
    } finally {
      setSaving(null);
    }
  };

  const renderSection = () => {
    const commonProps = { 
      projectData, 
      projectId,
    };
    
    switch (activeSection) {
      case 'overview':
        return <OverviewSection onNavigate={setActiveSection} {...commonProps} />;
      case 'activities':
        return (
          <ActivitiesSection 
            {...commonProps} 
            onUpdate={(activities) => handleUpdate('activities', activities)}
          />
        );
      case 'team':
        return (
          <TeamSection 
            {...commonProps} 
            onUpdate={(members) => handleUpdate('members', members)} 
          />
        );
      case 'milestones':
        return (
          <MilestonesSection 
            {...commonProps} 
            onUpdate={(milestones) => handleUpdate('milestones', milestones)}
          />
        );
      case 'budget':
        return (
          <BudgetSection 
            {...commonProps} 
            onUpdate={(budgets) => handleUpdate('budgets', budgets)} 
          />
        );
      case 'files':
        return <FilesSection {...commonProps} />;
      case 'notes':
        return (
          <NotesSection 
            {...commonProps} 
            onUpdate={(notes) => handleUpdate('observations', notes)} 
          />
        );
      case 'settings':
        return <SettingsSection {...commonProps} />;
      default:
        return <OverviewSection onNavigate={setActiveSection} {...commonProps} />;
    }
  };

  const scheduledHours = projectData.plannedHours || '0';
  const allocatedHours = projectData.allocatedHours || '0';
  const budget = projectData.contractValue ? `€${parseFloat(projectData.contractValue).toLocaleString()}` : '€0';

  return (
    <div className="fixed inset-0 bg-[#FAFBFC] z-50 flex flex-col">
      {/* Header */}
      <div className="border-b border-[#E5E7EB] bg-white">
        <div className="flex items-center justify-between px-6 h-14">
          <div className="flex items-center gap-4">
            <img src={workdeckLogo} alt="Workdeck" className="h-6" />
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-6 text-sm mr-4">
              <div className="text-center">
                <p className="text-[10px] text-[#6B7280] uppercase tracking-wide">Scheduled</p>
                <p className="font-semibold text-[#111827]">{scheduledHours}h</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-[#6B7280] uppercase tracking-wide">Allocated</p>
                <p className="font-semibold text-[#111827]">{allocatedHours}h</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-[#6B7280] uppercase tracking-wide">Budget</p>
                <p className="font-semibold text-[#111827]">{budget}</p>
              </div>
            </div>

            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-sm text-green-600">
                <Check className="w-4 h-4" />
                Saved
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-sm text-red-600">Save failed</span>
            )}

            <button
              onClick={saveDraft}
              disabled={saving !== null}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors hover:bg-[#F3F4F6] disabled:opacity-50"
              style={{ borderColor: '#D1D5DB', color: '#374151', backgroundColor: 'white' }}
            >
              {saving === 'draft' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Draft
                </>
              )}
            </button>

            <button
              onClick={publish}
              disabled={saving !== null}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              style={{ backgroundColor: '#0066FF', color: 'white' }}
              onMouseEnter={e => { if (saving === null) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0052CC'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = saving === null ? '#0066FF' : '#0066FF'; }}
            >
              {saving === 'publish' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {isDraft ? 'Publish' : 'Update'}
                </>
              )}
            </button>

            <button 
              onClick={onClose}
              className="p-2 hover:bg-[#F3F4F6] rounded-lg transition-colors ml-2"
            >
              <X className="w-5 h-5 text-[#6B7280]" />
            </button>
          </div>
        </div>

        <div className="px-6 py-3 flex items-center gap-4 border-t border-[#F3F4F6]">
          <h1 className="text-xl font-semibold text-[#111827]">
            {projectData.name || 'New Project'}
          </h1>
          <div className="flex items-center gap-3 text-sm text-[#6B7280]">
            {projectData.client?.name && (
              <>
                <Users className="w-4 h-4" />
                <span>{projectData.client.name}</span>
              </>
            )}
            {projectData.code && (
              <>
                <span className="text-[#D1D5DB]">•</span>
                <span>{projectData.code}</span>
              </>
            )}
            {isDraft && (
              <>
                <span className="text-[#D1D5DB]">•</span>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                  Draft
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-56 bg-white border-r border-[#E5E7EB] flex flex-col">
          <nav className="flex-1 p-3">
            {NAVIGATION_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors mb-1"
                  style={{
                    backgroundColor: isActive ? '#EBF2FF' : 'transparent',
                    color: isActive ? '#0066FF' : '#6B7280',
                  }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F3F4F6'; }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
                >
                  <Icon className="w-5 h-5" style={{ color: isActive ? '#0066FF' : '#9CA3AF' }} />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {renderSection()}
        </div>
      </div>
    </div>
  );
}
