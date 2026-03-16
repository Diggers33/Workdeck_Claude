import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Calendar, AlertCircle, X } from 'lucide-react';
import { apiClient } from '@/services/api-client';

interface Milestone {
  id: string;
  name: string;
  linkedTo: string;
  linkedTaskId?: string;
  linkedActivityId?: string;
  description: string;
  deliveryDate: string;
  alertDays: number;
  color: string;
  done: boolean;
}

interface MilestonesSectionProps {
  projectData?: any;
  projectId?: string;
  onUpdate?: (milestones: Milestone[]) => void;
  onRefresh?: () => void;
}

const COLORS = [
  { value: '#EF4444', label: 'Red', class: 'bg-red-500' },
  { value: '#F97316', label: 'Orange', class: 'bg-orange-500' },
  { value: '#EAB308', label: 'Yellow', class: 'bg-yellow-500' },
  { value: '#22C55E', label: 'Green', class: 'bg-green-500' },
  { value: '#3B82F6', label: 'Blue', class: 'bg-blue-500' },
  { value: '#8B5CF6', label: 'Purple', class: 'bg-purple-500' },
];

const ALERT_OPTIONS = [
  { value: '7', label: 'One week before' },
  { value: '14', label: 'Two weeks before' },
  { value: '30', label: 'One month before' },
  { value: '0', label: 'None' },
];

export function MilestonesSection({ projectData, projectId, onUpdate, onRefresh }: MilestonesSectionProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newMilestone, setNewMilestone] = useState<Partial<Milestone>>({
    name: '',
    linkedTo: '',
    description: '',
    deliveryDate: '',
    alertDays: 7,
    color: '#3B82F6',
  });

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Get activities and tasks for linking
  const activities = projectData?.activities || [];
  const linkedOptions: { value: string; label: string; type: string }[] = [];
  
  console.log('MilestonesSection - projectData:', projectData);
  console.log('MilestonesSection - activities:', activities);
  
  activities.forEach((activity: any) => {
    if (activity?.id && activity?.name) {
      linkedOptions.push({ value: `activity-${activity.id}`, label: activity.name, type: 'Activity' });
      (activity.tasks || []).forEach((task: any) => {
        if (task?.id && task?.name) {
          linkedOptions.push({ value: `task-${task.id}`, label: `  └ ${task.name}`, type: 'Task' });
        }
      });
    }
  });
  
  console.log('MilestonesSection - linkedOptions:', linkedOptions);

  // Convert DD/MM/YYYY to YYYY-MM-DD for HTML date inputs
  const convertDateForInput = (dateStr: string) => {
    if (!dateStr) return '';
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }
    return dateStr;
  };

  // Convert YYYY-MM-DD to DD/MM/YYYY for API
  const convertDateForApi = (dateStr: string) => {
    if (!dateStr) return '';
    if (dateStr.includes('-') && dateStr.length === 10) {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    }
    return dateStr;
  };

  // Initialize milestones from projectData
  useEffect(() => {
    if (projectData?.milestones) {
      const mappedMilestones: Milestone[] = projectData.milestones.map((m: any) => ({
        id: m.id,
        name: m.name || '',
        linkedTo: m.task ? `task-${m.task.id}` : m.activity ? `activity-${m.activity.id}` : '',
        linkedTaskId: m.task?.id,
        linkedActivityId: m.activity?.id,
        description: m.description || '',
        deliveryDate: convertDateForInput(m.deliveryDate || m.date || ''),
        alertDays: m.alertDays || 0,
        color: m.color || '#3B82F6',
        done: m.done || false,
      }));
      setMilestones(mappedMilestones);
    }
  }, [projectData]);

  const addMilestone = async () => {
    if (!newMilestone.name || !newMilestone.deliveryDate) return;

    const pid = projectId || projectData?.id;
    const newId = crypto.randomUUID();
    
    // Parse linkedTo value
    let taskId = null;
    let activityId = null;
    if (newMilestone.linkedTo?.startsWith('task-')) {
      taskId = newMilestone.linkedTo.replace('task-', '');
    } else if (newMilestone.linkedTo?.startsWith('activity-')) {
      activityId = newMilestone.linkedTo.replace('activity-', '');
    }

    setIsLoading(true);

    try {
      // Create milestone via mocks endpoint
      const payload: any = {
        id: newId,
        projectId: pid,
        project: { id: pid },
        name: newMilestone.name,
        deliveryDate: convertDateForApi(newMilestone.deliveryDate),
        alertDays: newMilestone.alertDays || 0,
        description: newMilestone.description || '',
        color: newMilestone.color || '#3B82F6',
        activity: activityId ? { id: activityId } : undefined,
        task: taskId ? { id: taskId } : undefined,
      };

      console.log('Creating milestone via mock endpoint (Angular upsert pattern)...');
      console.log('Milestone payload:', JSON.stringify(payload, null, 2));

      // Angular uses update-project-milestone for both create and update (upsert)
      await apiClient.post('/commands/mocks/update-project-milestone', payload);
      console.log('Milestone queued successfully');

      // Commit immediately
      console.log('Committing project:', pid);
      console.log('Commit payload:', JSON.stringify({ id: pid }, null, 2));

      try {
        const commitResponse = await apiClient.post('/commands/sync/commit-project', {
          id: pid
        });
        console.log('Commit response status:', commitResponse.status);
        console.log('Commit response data:', JSON.stringify(commitResponse.data, null, 2));
        console.log('Project committed successfully');
      } catch (commitError: any) {
        console.error('Commit failed with error:', commitError);
        console.error('Commit error response:', commitError.response?.data);
        console.error('Commit error status:', commitError.response?.status);
        console.error('Commit error headers:', commitError.response?.headers);
        // Re-throw to be caught by outer catch
        throw commitError;
      }

      // Add to local state
      const milestone: Milestone = {
        id: newId,
        name: newMilestone.name,
        linkedTo: newMilestone.linkedTo || '',
        linkedTaskId: taskId || undefined,
        linkedActivityId: activityId || undefined,
        description: newMilestone.description || '',
        deliveryDate: newMilestone.deliveryDate,
        alertDays: newMilestone.alertDays || 0,
        color: newMilestone.color || '#3B82F6',
        done: false,
      };

      const updatedMilestones = [...milestones, milestone];
      setMilestones(updatedMilestones);
      onUpdate?.(updatedMilestones);
      // Don't call onRefresh here - only refresh when user clicks Update button
      
      setIsDialogOpen(false);
      setNewMilestone({
        name: '',
        linkedTo: '',
        description: '',
        deliveryDate: '',
        alertDays: 7,
        color: '#3B82F6',
      });
    } catch (error) {
      console.error('Failed to create milestone:', error);
      alert('Failed to create milestone. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMilestone = (id: string) => {
    const milestone = milestones.find(m => m.id === id);
    
    setConfirmDialog({
      open: true,
      title: 'Delete Milestone',
      message: `Are you sure you want to delete "${milestone?.name || 'this milestone'}"? This action cannot be undone.`,
      onConfirm: async () => {
        setConfirmDialog(null);
        const pid = projectId || projectData?.id;
        
        try {
          console.log('Deleting milestone:', id);
          await apiClient.post('/commands/mocks/delete-project-milestone', {
            id: id,
            projectId: pid,
          });
          console.log('Milestone deletion queued');
          
          const updatedMilestones = milestones.filter((m) => m.id !== id);
          setMilestones(updatedMilestones);
          onUpdate?.(updatedMilestones);
        } catch (error) {
          console.error('Failed to delete milestone:', error);
          setConfirmDialog({
            open: true,
            title: 'Error',
            message: 'Failed to delete milestone. Please try again.',
            onConfirm: () => setConfirmDialog(null),
          });
        }
      },
    });
  };

  const getColorClass = (color: string) => {
    const colorObj = COLORS.find((c) => c.value === color);
    return colorObj?.class || 'bg-blue-500';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    // Handle both ISO format and dd/mm/yyyy format
    let date: Date;
    if (dateString.includes('/')) {
      const [day, month, year] = dateString.split('/');
      date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else {
      date = new Date(dateString);
    }
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getLinkedName = (linkedTo: string) => {
    const option = linkedOptions.find((o) => o.value === linkedTo);
    return option?.label?.replace('  └ ', '') || '—';
  };

  const getAlertLabel = (days: number) => {
    const option = ALERT_OPTIONS.find((o) => o.value === String(days));
    return option?.label || 'None';
  };

  return (
    <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm">
      {/* Header */}
      <div className="px-6 py-5 border-b border-[#E5E7EB] flex items-center justify-between">
        <div>
          <h2 className="text-[#111827] text-lg font-semibold">Milestones</h2>
          <p className="text-sm text-[#6B7280] mt-1">Track key deliverables and deadlines</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2 stroke-[1.5]" />
          New Milestone
        </Button>
      </div>

      {/* Milestones Table */}
      <div className="p-6">
        {milestones.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-[#E5E7EB]">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                  <th className="w-8"></th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#4B5563]">Milestone Name</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#4B5563]">Linked To</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#4B5563]">Description</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#4B5563]">Delivery Date</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#4B5563]">Alert</th>
                  <th className="w-16"></th>
                </tr>
              </thead>
              <tbody>
                {milestones.map((milestone) => (
                  <tr key={milestone.id} className="border-b border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors">
                    <td className="px-4 py-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: milestone.color }}
                      ></div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#111827] font-medium">{milestone.name}</td>
                    <td className="px-4 py-3 text-sm text-[#4B5563]">{getLinkedName(milestone.linkedTo)}</td>
                    <td className="px-4 py-3 text-sm text-[#4B5563] max-w-xs truncate">{milestone.description || '—'}</td>
                    <td className="px-4 py-3 text-sm text-[#4B5563]">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-[#9CA3AF] stroke-[1.5]" />
                        {formatDate(milestone.deliveryDate)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#4B5563]">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-[#9CA3AF] stroke-[1.5]" />
                        {getAlertLabel(milestone.alertDays)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => deleteMilestone(milestone.id)}
                        className="text-[#9CA3AF] hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 stroke-[1.5]" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-[#F3F4F6] rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7 text-[#9CA3AF]" />
            </div>
            <p className="text-[#6B7280] mb-4">No milestones yet</p>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2 stroke-[1.5]" />
              Create First Milestone
            </Button>
          </div>
        )}
      </div>

      {/* Add Milestone Dialog */}
      {isDialogOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setIsDialogOpen(false)}
          />
          <div 
            className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
          >
            <div 
              className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#111827]">Create New Milestone</h3>
                <button onClick={() => setIsDialogOpen(false)} className="text-[#9CA3AF] hover:text-[#4B5563]">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label>Milestone Name</Label>
                  <Input
                    value={newMilestone.name}
                    onChange={(e) => setNewMilestone({ ...newMilestone, name: e.target.value })}
                    placeholder="Enter milestone name"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Linked Activity or Task (Optional)</Label>
                  <select
                    value={newMilestone.linkedTo || ''}
                    onChange={(e) => setNewMilestone({ ...newMilestone, linkedTo: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-[#E5E7EB] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select activity or task</option>
                    {linkedOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={newMilestone.description}
                    onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                    placeholder="Add milestone description"
                    className="min-h-[80px] resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Delivery Date</Label>
                    <Input
                      type="date"
                      value={newMilestone.deliveryDate}
                      onChange={(e) => setNewMilestone({ ...newMilestone, deliveryDate: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Alert</Label>
                    <select
                      value={String(newMilestone.alertDays || 7)}
                      onChange={(e) => setNewMilestone({ ...newMilestone, alertDays: parseInt(e.target.value) })}
                      className="w-full h-10 px-3 rounded-md border border-[#E5E7EB] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {ALERT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex gap-2">
                    {COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setNewMilestone({ ...newMilestone, color: color.value })}
                        className={`w-8 h-8 rounded-full transition-all ${
                          newMilestone.color === color.value ? 'ring-2 ring-offset-2 ring-[#D1D5DB] scale-110' : ''
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-[#F9FAFB] flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>
                  Cancel
                </Button>
                <Button 
                  onClick={addMilestone} 
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={isLoading || !newMilestone.name || !newMilestone.deliveryDate}
                >
                  {isLoading ? 'Creating...' : 'Create Milestone'}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog?.open && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setConfirmDialog(null)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
              <div className="px-6 py-5 border-b border-[#E5E7EB]">
                <h3 className="text-lg font-semibold text-[#111827]">{confirmDialog.title}</h3>
              </div>
              <div className="px-6 py-5">
                <p className="text-[#4B5563]">{confirmDialog.message}</p>
              </div>
              <div className="px-6 py-4 bg-[#F9FAFB] flex items-center justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setConfirmDialog(null)} 
                  type="button"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={confirmDialog.onConfirm}
                  className={confirmDialog.title === 'Delete Milestone' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}
                  type="button"
                >
                  {confirmDialog.title === 'Delete Milestone' ? 'Delete' : 'OK'}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
