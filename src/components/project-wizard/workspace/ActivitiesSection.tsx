import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { GripVertical, Plus, Clock, Users, ChevronDown, Settings, X, Trash2, Search, Loader2 } from 'lucide-react';
import { apiClient } from '@/services/api-client';

interface Task {
  id: string;
  name: string;
  estimatedHours: string;
  plannedHours: string;
  assignedMembers: string[];
  description?: string;
  startDate?: string;
  endDate?: string;
  allocations: { [memberId: string]: number };
}

interface Activity {
  id: string;
  name: string;
  availableHours: string;
  plannedHours: string;
  tasks: Task[];
}

interface ActivitiesSectionProps {
  projectData?: any;
  projectId?: string;
  onUpdate?: (activities: Activity[]) => void;
  onRefresh?: () => void;  // Callback to refresh parent (e.g., Gantt view)
}

const getInitials = (name: string) => {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
};

const getAvatarColor = (index: number) => {
  const colors = [
    'bg-blue-100 text-blue-700',
    'bg-purple-100 text-purple-700',
    'bg-green-100 text-green-700',
    'bg-orange-100 text-orange-700',
    'bg-pink-100 text-pink-700',
    'bg-teal-100 text-teal-700',
  ];
  return colors[index % colors.length];
};

export function ActivitiesSection({ projectData, projectId, onUpdate, onRefresh }: ActivitiesSectionProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [allocationPanelOpen, setAllocationPanelOpen] = useState(false);
  const [allocationTaskId, setAllocationTaskId] = useState<string | null>(null);
  
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Get team members from project data (fallback)
  const projectTeamMembers = (projectData?.members || []).map((m: any) => {
    const user = m.user || {};
    return {
      value: user.id || m.userId,
      label: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown',
      email: user.email || '',
    };
  });

  // All users state for searchable dropdown
  const [allUsers, setAllUsers] = useState<{ value: string; label: string; email: string }[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');

  // Load all users on mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setIsLoadingUsers(true);
        const response = await apiClient.get('/queries/users-summary');
        const users = (response as any).result || response || [];
        setAllUsers(users.map((u: any) => ({
          value: u.id,
          label: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Unknown',
          email: u.email || ''
        })));
      } catch (error) {
        console.error('Failed to load users:', error);
        // Fallback to project team members
        setAllUsers(projectTeamMembers);
      } finally {
        setIsLoadingUsers(false);
      }
    };
    loadUsers();
  }, []);

  // Use allUsers if loaded, otherwise fallback to project members
  const teamMembers = allUsers.length > 0 ? allUsers : projectTeamMembers;

  // Filter users based on search
  const filteredTeamMembers = teamMembers.filter(member => {
    const search = memberSearchTerm.toLowerCase();
    return member.label.toLowerCase().includes(search) || member.email?.toLowerCase().includes(search);
  });

  // Track if we've initialized
  const [initialized, setInitialized] = useState(false);

  // Convert DD/MM/YYYY to YYYY-MM-DD for HTML date inputs
  const convertDateForInput = (dateStr: string) => {
    if (!dateStr) return '';
    // If already in YYYY-MM-DD format
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;
    // Convert from DD/MM/YYYY
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }
    return dateStr;
  };

  // Initialize activities from projectData (only once)
  useEffect(() => {
    if (!initialized && projectData?.activities && projectData.activities.length > 0) {
      const mappedActivities: Activity[] = projectData.activities.map((a: any) => ({
        id: a.id,
        name: a.name || '',
        availableHours: a.availableHours || '0',
        plannedHours: a.plannedHours || '0',
        tasks: (a.tasks || []).map((t: any) => ({
          id: t.id,
          name: t.name || '',
          estimatedHours: t.availableHours || '0',
          plannedHours: t.plannedHours || '0',
          description: t.description || '',
          startDate: convertDateForInput(t.startDate || ''),
          endDate: convertDateForInput(t.endDate || ''),
          assignedMembers: (t.participants || []).map((p: any) => p.user?.id || p.userId),
          allocations: (t.participants || []).reduce((acc: any, p: any) => {
            // Read hours from plannedHours or availableHours (backend may use either)
            acc[p.user?.id || p.userId] = parseFloat(p.plannedHours) || parseFloat(p.availableHours) || 0;
            return acc;
          }, {}),
        })),
      }));
      setActivities(mappedActivities);
      if (!selectedActivityId && mappedActivities.length > 0) {
        setSelectedActivityId(mappedActivities[0].id);
      }
      setInitialized(true);
    }
  }, [projectData, initialized]);

  const selectedActivity = activities.find((a) => a.id === selectedActivityId);
  const allocationTask = selectedActivity?.tasks.find((t) => t.id === allocationTaskId);

  // Update activities and notify parent
  const updateActivitiesAndNotify = (newActivities: Activity[]) => {
    setActivities(newActivities);
    onUpdate?.(newActivities);
  };

  const addActivity = async () => {
    const pid = projectId || projectData?.id;
    const newActivityId = crypto.randomUUID();
    const newTaskId = crypto.randomUUID();
    
    // Get current user for task owner
    const currentUser = projectData?.members?.find((m: any) => m.isProjectManager)?.user || 
                        projectData?.members?.[0]?.user;
    
    try {
      // Create activity via API
      const activityPayload: any = {
        id: newActivityId,
        projectId: pid,
        name: `Activity ${activities.length + 1}`,
        position: activities.length,
        availableHours: '0',
      };
      // Only include parentId if it has a value (not null)
      // parentId: null causes validation error
      
      console.log('Creating activity with payload:', activityPayload);
      await apiClient.post('/commands/mocks/create-project-activity', activityPayload);

      // Commit the activity first so it exists before creating the task
      await apiClient.post('/commands/sync/commit-project', { id: pid });
      console.log('Activity committed');

      // Create a default task for the activity
      const today = new Date();
      const formatDate = (d: Date) => {
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      };
      const todayStr = formatDate(today);

      // Mock endpoint expects isOwner as STRING
      const taskPayload = {
        id: newTaskId,
        projectId: pid,
        activity: { id: newActivityId },
        name: 'New Task',
        description: '',
        position: 0,
        startDate: todayStr,
        endDate: todayStr,
        importance: 2,
        participants: currentUser ? [{
          taskId: newTaskId,
          userId: currentUser.id,
          isOwner: 'true',  // STRING for mock endpoint
          plannedHours: '0',
          availableHours: '0',
          position: 0,
        }] : [],
      };

      console.log('Creating default task with payload:', taskPayload);
      await apiClient.post('/commands/mocks/create-project-task', taskPayload);
      console.log('Activity created successfully');
      
      // Add to local state
      const todayInputFormat = today.toISOString().split('T')[0];
      const newActivity: Activity = {
        id: newActivityId,
        name: `Activity ${activities.length + 1}`,
        availableHours: '0',
        plannedHours: '0',
        tasks: [{
          id: newTaskId,
          name: 'New Task',
          estimatedHours: '0',
          plannedHours: '0',
          assignedMembers: currentUser ? [currentUser.id] : [],
          description: '',
          startDate: todayInputFormat,
          endDate: todayInputFormat,
          allocations: {},
        }],
      };
      
      const newActivities = [...activities, newActivity];
      updateActivitiesAndNotify(newActivities);
      setSelectedActivityId(newActivityId);
      
    } catch (error) {
      console.error('Failed to create activity:', error);
      alert('Failed to create activity. Please try again.');
    }
  };

  const updateActivityName = (activityId: string, name: string) => {
    const newActivities = activities.map((a) => 
      a.id === activityId ? { ...a, name } : a
    );
    updateActivitiesAndNotify(newActivities);
  };

  // Save activity name to API (called on blur)
  const saveActivityName = async (activityId: string, name: string) => {
    if (activityId.startsWith('new-')) return; // Skip temp IDs
    
    const pid = projectId || projectData?.id;
    try {
      await apiClient.post('/commands/mocks/update-project-activity', {
        id: activityId,
        projectId: pid,
        name: name,
      });
      console.log('Activity name updated (will be committed on Update)');
    } catch (error) {
      console.error('Failed to update activity name:', error);
    }
  };

  // Delete activity
  const deleteActivity = async (activityId: string) => {
    // Prevent deleting the last activity
    if (activities.length <= 1) {
      setConfirmDialog({
        open: true,
        title: 'Cannot Delete',
        message: 'A project must have at least one activity.',
        onConfirm: () => setConfirmDialog(null),
      });
      return;
    }
    
    const activity = activities.find(a => a.id === activityId);
    
    setConfirmDialog({
      open: true,
      title: 'Delete Activity',
      message: `Are you sure you want to delete "${activity?.name || 'this activity'}" and all its tasks? This action cannot be undone.`,
      onConfirm: async () => {
        setConfirmDialog(null);
        const pid = projectId || projectData?.id;
        
        try {
          console.log('Deleting activity:', activityId);
          await apiClient.post('/commands/mocks/delete-project-activity', {
            id: activityId,
            projectId: pid,
          });
          console.log('Activity deleted (will be committed on Update)');
          
          // Update local state
          const newActivities = activities.filter(a => a.id !== activityId);
          updateActivitiesAndNotify(newActivities);
          
          // Select another activity if we deleted the selected one
          if (selectedActivityId === activityId && newActivities.length > 0) {
            setSelectedActivityId(newActivities[0].id);
          }
          // Don't call onRefresh - user clicks Update to refresh Gantt
        } catch (error) {
          console.error('Failed to delete activity:', error);
          setConfirmDialog({
            open: true,
            title: 'Error',
            message: 'Failed to delete activity. Please try again.',
            onConfirm: () => setConfirmDialog(null),
          });
        }
      },
    });
  };

  const addTask = async () => {
    if (!selectedActivityId) return;
    
    const pid = projectId || projectData?.id;
    const newTaskId = crypto.randomUUID();
    
    // Get current user from project members (first PM or first member)
    const currentUser = projectData?.members?.find((m: any) => m.isProjectManager)?.user || 
                        projectData?.members?.[0]?.user;
    
    // Create task via API
    try {
      // Get today's date in DD/MM/YYYY format
      const today = new Date();
      const formatDate = (d: Date) => {
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      };
      const todayStr = formatDate(today);
      
      // Mock endpoint expects isOwner as STRING (Angular pattern)
      const taskPayload = {
        id: newTaskId,
        projectId: pid,
        activity: { id: selectedActivityId },
        name: 'New Task',
        description: '',
        position: selectedActivity?.tasks.length || 0,
        startDate: todayStr,
        endDate: todayStr,
        importance: 2,
        // Include at least one owner participant (required by backend)
        participants: currentUser ? [{
          taskId: newTaskId,
          userId: currentUser.id,
          isOwner: 'true',  // STRING for mock endpoint
          plannedHours: '0',
          availableHours: '0',
          position: 0,
        }] : [],
      };

      console.log('Creating task with payload:', taskPayload);
      await apiClient.post('/commands/mocks/create-project-task', taskPayload);

      // Commit to persist
      await apiClient.post('/commands/sync/commit-project', { id: pid });
      console.log('Task created and committed');
      
      // Add the new task to local state (use YYYY-MM-DD for HTML inputs)
      const todayInputFormat = today.toISOString().split('T')[0]; // YYYY-MM-DD
      const newTask: Task = {
        id: newTaskId,
        name: 'New Task',
        estimatedHours: '0',
        plannedHours: '0',
        assignedMembers: currentUser ? [currentUser.id] : [],
        description: '',
        startDate: todayInputFormat,
        endDate: todayInputFormat,
        allocations: {},
      };
      
      const newActivities = activities.map((a) =>
        a.id === selectedActivityId
          ? { ...a, tasks: [...a.tasks, newTask] }
          : a
      );
      updateActivitiesAndNotify(newActivities);
      setExpandedTaskId(newTaskId);  // Auto-expand the new task
      
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('Failed to create task. Please try again.');
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!selectedActivity || selectedActivity.tasks.length <= 1) return;
    
    const pid = projectId || projectData?.id;
    
    try {
      // Delete via API
      await apiClient.post('/commands/mocks/delete-project-task', {
        id: taskId,
        projectId: pid,
      });
      console.log('Task deleted (will be committed on Update)');
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
    
    const newActivities = activities.map((a) =>
      a.id === selectedActivityId 
        ? { ...a, tasks: a.tasks.filter((t) => t.id !== taskId) } 
        : a
    );
    updateActivitiesAndNotify(newActivities);
    if (expandedTaskId === taskId) {
      setExpandedTaskId(null);
    }
  };

  const updateTask = (taskId: string, field: string, value: any) => {
    console.log('updateTask called:', { taskId, field, value });
    const newActivities = activities.map((a) =>
      a.id === selectedActivityId
        ? {
            ...a,
            tasks: a.tasks.map((t) => 
              t.id === taskId ? { ...t, [field]: value } : t
            ),
          }
        : a
    );
    updateActivitiesAndNotify(newActivities);
  };

  // Save task to API (called on blur or after updates)
  const saveTaskToApi = async (taskId: string, updatedFields?: Partial<Task>) => {
    const task = selectedActivity?.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Merge current task with any updated fields
    const taskToSave = updatedFields ? { ...task, ...updatedFields } : task;
    
    const pid = projectId || projectData?.id;
    
    // Format dates from YYYY-MM-DD to DD/MM/YYYY
    const formatDate = (dateStr: string) => {
      if (!dateStr) return null;
      if (dateStr.includes('-') && dateStr.length === 10) {
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
      }
      return dateStr;
    };
    
    const taskPayload = {
      id: taskToSave.id,
      projectId: pid,
      activity: { id: selectedActivityId },
      name: taskToSave.name || 'Untitled Task',
      description: taskToSave.description || '',
      startDate: formatDate(taskToSave.startDate || ''),
      endDate: formatDate(taskToSave.endDate || ''),
      availableHours: taskToSave.estimatedHours || '0',
      importance: 2,
      participants: (taskToSave.assignedMembers || []).map((memberId, idx) => ({
        taskId: taskToSave.id,
        user: { id: memberId },
        userId: memberId,
        isOwner: idx === 0 ? 'true' : 'false',  // String not boolean
        plannedHours: String(taskToSave.allocations?.[memberId] || '0'),
        availableHours: String(taskToSave.allocations?.[memberId] || '0'),
        position: idx,
      })),
    };
    
    try {
      console.log('Saving task to API:', taskPayload);

      // Use mock endpoints (Angular pattern) - changes queued to Redis, committed on Publish
      if (!taskToSave.id?.toString().startsWith('new-')) {
        // Update existing task
        const updatePayload = {
          id: taskToSave.id,
          projectId: pid,
          activity: { id: selectedActivityId },
          name: taskToSave.name || 'Untitled Task',
          availableHours: taskToSave.estimatedHours || '0',
          startDate: taskPayload.startDate,
          endDate: taskPayload.endDate,
          description: taskToSave.description || '',
          importance: 2,
        };
        console.log('[ActivitiesSection] Calling update-project-task:', updatePayload);
        await apiClient.post('/commands/mocks/update-project-task', updatePayload);
        console.log('[ActivitiesSection] Task update queued');
      } else {
        // Create new task
        taskPayload.projectId = pid;
        await apiClient.post('/commands/mocks/create-project-task', taskPayload);
        console.log('Task creation queued');
      }
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
  };

  const openAllocationPanel = (taskId: string) => {
    setAllocationTaskId(taskId);
    setAllocationPanelOpen(true);
  };

  // Update local state only (no API call) - called on every keystroke
  const handleUpdateAllocationLocal = (memberId: string, hours: number) => {
    if (!allocationTaskId) return;

    // Update local state only
    const newActivities = activities.map((a) =>
      a.id === selectedActivityId
        ? {
            ...a,
            tasks: a.tasks.map((t) =>
              t.id === allocationTaskId
                ? { ...t, allocations: { ...t.allocations, [memberId]: hours } }
                : t
            ),
          }
        : a
    );
    updateActivitiesAndNotify(newActivities);
  };

  // Save all allocations to API - called when Accept is clicked
  const saveAllocationsToApi = async () => {
    if (!allocationTaskId) return;

    const pid = projectId || projectData?.id;
    const task = selectedActivity?.tasks.find(t => t.id === allocationTaskId);
    if (!task) return;

    // Queue hours update for each participant
    for (const memberId of task.assignedMembers || []) {
      const hours = task.allocations?.[memberId] || 0;
      const isOwner = task.assignedMembers?.[0] === memberId;

      try {
        await apiClient.post('/commands/mocks/add-task-participant', {
          projectId: pid,
          taskId: allocationTaskId,
          userId: memberId,
          isOwner: isOwner ? 'true' : 'false',
          position: task.assignedMembers?.indexOf(memberId) || 0,
          availableHours: String(hours),
          plannedHours: String(hours),
        });
      } catch (error) {
        console.error('Failed to queue participant hours:', memberId, error);
      }
    }
  };

  const handleMemberToggle = async (taskId: string, memberId: string) => {
    console.log('handleMemberToggle called:', { taskId, memberId });
    const task = selectedActivity?.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const pid = projectId || projectData?.id;
    const isCurrentlySelected = task.assignedMembers.includes(memberId);
    const memberIndex = task.assignedMembers.indexOf(memberId);
    const isOwner = memberIndex === 0; // First member is always the owner
    
    // Prevent removing the last participant
    if (isCurrentlySelected && task.assignedMembers.length === 1) {
      alert('Cannot remove the last participant. A task must have at least one owner.');
      return;
    }
    
    try {
      if (isCurrentlySelected) {
        // Removing a participant
        if (isOwner && task.assignedMembers.length > 1) {
          // Removing the owner - first promote the next person to owner
          const newOwnerId = task.assignedMembers[1];
          console.log('Transferring ownership to:', newOwnerId);

          // Update the new owner first (Angular minimal payload)
          await apiClient.post('/commands/mocks/add-task-participant', {
            projectId: pid,
            taskId: taskId,
            userId: newOwnerId,
            isOwner: 'true',
            position: 0,
            availableHours: String(task.allocations?.[newOwnerId] || '0'),
          });

          // Then remove the old owner (Angular payload structure)
          await apiClient.post('/commands/mocks/delete-task-participant', {
            projectId: pid,
            task: { id: taskId },
            user: { id: memberId },
          });
        } else {
          // Removing a non-owner participant
          console.log('Removing participant:', { taskId, memberId });
          await apiClient.post('/commands/mocks/delete-task-participant', {
            projectId: pid,
            task: { id: taskId },
            user: { id: memberId },
          });
        }
      } else {
        // Adding a participant (Angular minimal payload)
        const isFirstParticipant = task.assignedMembers.length === 0;
        console.log('Adding participant:', { taskId, memberId, isOwner: isFirstParticipant });
        await apiClient.post('/commands/mocks/add-task-participant', {
          projectId: pid,
          taskId: taskId,
          userId: memberId,
          isOwner: isFirstParticipant ? 'true' : 'false',
          position: task.assignedMembers.length,
          availableHours: '0',
        });
      }
      
      console.log('Participant update saved (will be committed on Update)');
      
      // Update local state
      let newMembers: string[];
      if (isCurrentlySelected) {
        newMembers = task.assignedMembers.filter(id => id !== memberId);
      } else {
        newMembers = [...task.assignedMembers, memberId];
      }
      
      updateTask(taskId, 'assignedMembers', newMembers);
      
    } catch (error) {
      console.error('Failed to update participant:', error);
      alert('Failed to update participant. Please try again.');
    }
  };

  // Set a participant as the task owner
  const setTaskOwner = async (taskId: string, memberId: string) => {
    const task = selectedActivity?.tasks.find(t => t.id === taskId);
    if (!task || !task.assignedMembers.includes(memberId)) return;
    
    const pid = projectId || projectData?.id;
    const currentOwnerIndex = 0;
    const currentOwnerId = task.assignedMembers[currentOwnerIndex];
    
    if (currentOwnerId === memberId) return; // Already the owner
    
    try {
      console.log('Setting new owner:', memberId);
      
      // Demote current owner (Angular minimal payload)
      await apiClient.post('/commands/mocks/add-task-participant', {
        projectId: pid,
        taskId: taskId,
        userId: currentOwnerId,
        isOwner: 'false',
        position: 1,
        availableHours: String(task.allocations?.[currentOwnerId] || '0'),
      });

      // Promote new owner (Angular minimal payload)
      await apiClient.post('/commands/mocks/add-task-participant', {
        projectId: pid,
        taskId: taskId,
        userId: memberId,
        isOwner: 'true',
        position: 0,
        availableHours: String(task.allocations?.[memberId] || '0'),
      });
      
      console.log('Owner changed (will be committed on Update)');
      
      // Update local state - move new owner to front
      const newMembers = [memberId, ...task.assignedMembers.filter(id => id !== memberId)];
      updateTask(taskId, 'assignedMembers', newMembers);
      
    } catch (error) {
      console.error('Failed to set owner:', error);
      alert('Failed to change task owner. Please try again.');
    }
  };

  return (
    <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm">
      <div className="flex" style={{ height: '700px' }}>
        {/* Left - Activities List */}
        <div className="w-80 border-r border-[#E5E7EB] flex flex-col">
          <div className="px-5 py-4 border-b border-[#E5E7EB]">
            <h3 className="text-[#111827] font-semibold">Activities</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {activities.map((activity) => (
              <div
                key={activity.id}
                onClick={() => {
                  setSelectedActivityId(activity.id);
                  setExpandedTaskId(null);
                }}
                className={`px-3 py-2.5 rounded-lg border cursor-pointer transition-all ${
                  selectedActivityId === activity.id
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-white border-[#E5E7EB] hover:border-[#D1D5DB]'
                }`}
              >
                <p className={`text-sm font-medium ${selectedActivityId === activity.id ? 'text-blue-900' : 'text-[#374151]'}`}>
                  {activity.name || 'Untitled Activity'}
                </p>
                <p className="text-xs text-[#9CA3AF] mt-0.5">{activity.tasks.length} tasks</p>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-[#E5E7EB]">
            <button onClick={addActivity} className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-colors" style={{ color: '#0066FF' }} onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#EBF2FF')} onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')} type="button">
              <Plus className="w-4 h-4" />
              Add Activity
            </button>
          </div>
        </div>

        {/* Right - Tasks */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedActivity ? (
            <>
              {/* Activity Name Input */}
              <div className="px-6 py-4 border-b border-[#E5E7EB]">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-[#4B5563] text-xs">Activity Name</Label>
                  {activities.length > 1 && (
                    <button
                      type="button"
                      onClick={() => deleteActivity(selectedActivity.id)}
                      className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete Activity
                    </button>
                  )}
                </div>
                <Input
                  value={selectedActivity.name}
                  onChange={(e) => updateActivityName(selectedActivity.id, e.target.value)}
                  onBlur={(e) => saveActivityName(selectedActivity.id, e.target.value)}
                  placeholder="Enter activity name"
                  className="bg-[#FAFAFC] border-[#E5E7EB] h-10"
                />
              </div>

              {/* Tasks List */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-0 border border-[#E5E7EB] rounded-lg overflow-hidden">
                  {selectedActivity.tasks.map((task, index) => {
                    const isExpanded = expandedTaskId === task.id;
                    const assignedNames = task.assignedMembers
                      .map((id) => teamMembers.find((m: any) => m.value === id)?.label)
                      .filter(Boolean);

                    return (
                      <div key={task.id} className={index !== 0 ? 'border-t border-[#E5E7EB]' : ''}>
                        {/* Task Header Row */}
                        <div
                          onClick={() => toggleTaskExpansion(task.id)}
                          className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors hover:bg-[#F9FAFB] ${
                            isExpanded ? 'bg-blue-50' : 'bg-white'
                          }`}
                        >
                          <GripVertical className="w-3.5 h-3.5 text-[#9CA3AF] stroke-[1.5]" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[#374151] truncate">{task.name || 'Untitled task'}</p>
                          </div>
                          {task.estimatedHours && task.estimatedHours !== '0' && (
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-[#F3F4F6] rounded text-xs text-[#4B5563]">
                              <Clock className="w-3 h-3 stroke-[1.5]" />
                              {task.estimatedHours}h
                            </div>
                          )}
                          <div className="flex items-center -space-x-1.5">
                            {assignedNames.slice(0, 3).map((name, idx) => (
                              <div
                                key={idx}
                                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium border-2 border-white ${getAvatarColor(idx)}`}
                                title={name}
                              >
                                {getInitials(name || '')}
                              </div>
                            ))}
                            {assignedNames.length > 3 && (
                              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium border-2 border-white bg-[#F3F4F6] text-[#4B5563]">
                                +{assignedNames.length - 3}
                              </div>
                            )}
                          </div>
                          <ChevronDown className={`w-4 h-4 text-[#9CA3AF] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>

                        {/* Expanded Task Form */}
                        {isExpanded && (
                          <div 
                            className="bg-[#F9FAFB] px-4 py-4 border-t border-[#E5E7EB]"
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <div className="space-y-4">
                              {/* Task Name */}
                              <div>
                                <Label className="text-[#4B5563] text-xs mb-1.5 block">Task Name</Label>
                                <Input
                                  value={task.name}
                                  onChange={(e) => updateTask(task.id, 'name', e.target.value)}
                                  onBlur={(e) => saveTaskToApi(task.id, { name: e.target.value })}
                                  placeholder="Enter task name"
                                  className="bg-white border-[#E5E7EB] h-9 text-sm"
                                />
                              </div>

                              {/* Hours and Members Row */}
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-[#4B5563] text-xs mb-1.5 flex items-center gap-1.5">
                                    <Clock className="w-3 h-3 text-[#9CA3AF] stroke-[1.5]" />
                                    Estimated Hours
                                  </Label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={task.estimatedHours}
                                    onChange={(e) => updateTask(task.id, 'estimatedHours', e.target.value)}
                                    onBlur={(e) => saveTaskToApi(task.id, { estimatedHours: e.target.value })}
                                    placeholder="0"
                                    className="flex w-full rounded-md border border-[#E5E7EB] bg-white px-3 py-1 h-9 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                </div>

                                <div>
                                  <div className="flex items-center justify-between mb-1.5">
                                    <Label className="text-[#4B5563] text-xs flex items-center gap-1.5">
                                      <Users className="w-3 h-3 text-[#9CA3AF] stroke-[1.5]" />
                                      Assigned To
                                      {task.assignedMembers.length > 0 && (
                                        <span className="text-[#9CA3AF]">({task.assignedMembers.length})</span>
                                      )}
                                    </Label>
                                    {task.assignedMembers.length > 0 && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openAllocationPanel(task.id);
                                        }}
                                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                                        type="button"
                                      >
                                        <Settings className="w-3 h-3 stroke-[1.5]" />
                                        Adjust
                                      </button>
                                    )}
                                  </div>

                                  {/* Search Input */}
                                  <div className="relative mb-2">
                                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF]" />
                                    <input
                                      type="text"
                                      value={memberSearchTerm}
                                      onChange={(e) => setMemberSearchTerm(e.target.value)}
                                      placeholder="Search employees..."
                                      className="w-full pl-7 pr-3 py-1.5 text-sm border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                  </div>

                                  {/* Member checkboxes */}
                                  <div className="bg-white border border-[#E5E7EB] rounded-md p-2 max-h-36 overflow-y-auto">
                                    {isLoadingUsers ? (
                                      <div className="flex items-center justify-center py-4 gap-2 text-[#6B7280]">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span className="text-xs">Loading...</span>
                                      </div>
                                    ) : filteredTeamMembers.length > 0 ? (
                                      filteredTeamMembers.map((member: any) => {
                                        const isAssigned = task.assignedMembers.includes(member.value);
                                        const isOwner = task.assignedMembers[0] === member.value;
                                        return (
                                          <div
                                            key={member.value}
                                            className="flex items-center gap-2 py-1 px-1 hover:bg-[#F9FAFB] rounded"
                                          >
                                            <input
                                              type="checkbox"
                                              checked={isAssigned}
                                              onChange={() => handleMemberToggle(task.id, member.value)}
                                              className="w-4 h-4 rounded border-[#D1D5DB] text-blue-600 cursor-pointer"
                                            />
                                            <div className="flex-1 min-w-0">
                                              <span className="text-sm text-[#374151] block truncate">{member.label}</span>
                                              {member.email && (
                                                <span className="text-[10px] text-[#9CA3AF] block truncate">{member.email}</span>
                                              )}
                                            </div>
                                            {isAssigned && (
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  if (!isOwner) setTaskOwner(task.id, member.value);
                                                }}
                                                className={`text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ${
                                                  isOwner
                                                    ? 'bg-blue-100 text-blue-700 font-medium'
                                                    : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-blue-50 hover:text-blue-600 cursor-pointer'
                                                }`}
                                                title={isOwner ? 'Task Owner' : 'Click to make owner'}
                                              >
                                                {isOwner ? 'Owner' : 'Set Owner'}
                                              </button>
                                            )}
                                          </div>
                                        );
                                      })
                                    ) : (
                                      <p className="text-xs text-[#9CA3AF] py-2 text-center">
                                        {memberSearchTerm ? 'No employees match your search' : 'No employees available'}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Dates Row */}
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-[#4B5563] text-xs mb-1.5 block">Start Date</Label>
                                  <Input
                                    type="date"
                                    value={task.startDate || ''}
                                    onChange={(e) => {
                                      const newValue = e.target.value;
                                      updateTask(task.id, 'startDate', newValue);
                                      saveTaskToApi(task.id, { startDate: newValue });
                                    }}
                                    className="bg-white border-[#E5E7EB] h-9 text-sm"
                                  />
                                </div>
                                <div>
                                  <Label className="text-[#4B5563] text-xs mb-1.5 block">End Date</Label>
                                  <Input
                                    type="date"
                                    value={task.endDate || ''}
                                    onChange={(e) => {
                                      const newValue = e.target.value;
                                      updateTask(task.id, 'endDate', newValue);
                                      saveTaskToApi(task.id, { endDate: newValue });
                                    }}
                                    className="bg-white border-[#E5E7EB] h-9 text-sm"
                                  />
                                </div>
                              </div>

                              {/* Description */}
                              <div>
                                <Label className="text-[#4B5563] text-xs mb-1.5 block">Description</Label>
                                <Textarea
                                  value={task.description || ''}
                                  onChange={(e) => updateTask(task.id, 'description', e.target.value)}
                                  onBlur={(e) => saveTaskToApi(task.id, { description: e.target.value })}
                                  placeholder="Add description..."
                                  className="bg-white border-[#E5E7EB] min-h-[60px] text-sm resize-none"
                                />
                              </div>

                              {/* Delete Task */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteTask(task.id);
                                }}
                                disabled={selectedActivity.tasks.length <= 1}
                                className="text-red-600 hover:text-red-700 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                                type="button"
                              >
                                Delete Task
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button onClick={addTask} className="w-full flex items-center justify-center gap-2 py-2 mt-3 text-sm font-medium rounded-lg transition-colors" style={{ color: '#0066FF' }} onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#EBF2FF')} onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')} type="button">
                  <Plus className="w-4 h-4" />
                  Add Task
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-[#6B7280] mb-4">No activities yet</p>
                <Button onClick={addActivity} className="bg-blue-600 hover:bg-blue-700" type="button">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Activity
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Allocation Panel */}
      {allocationTask && allocationPanelOpen && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setAllocationPanelOpen(false)} />
          <div className="fixed right-0 top-0 bottom-0 w-[400px] bg-white shadow-xl z-50 flex flex-col">
            <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <div>
                <h3 className="text-[#111827] font-semibold">Adjust Allocations</h3>
                <p className="text-sm text-[#6B7280] mt-0.5">{allocationTask.name || 'Untitled task'}</p>
              </div>
              <button 
                onClick={() => setAllocationPanelOpen(false)} 
                className="text-[#9CA3AF] hover:text-[#4B5563]"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="space-y-4">
                {allocationTask.assignedMembers.length === 0 ? (
                  <p className="text-sm text-[#6B7280] text-center py-8">No team members assigned to this task</p>
                ) : (
                  allocationTask.assignedMembers.map((memberId) => {
                    const member = teamMembers.find((m: any) => m.value === memberId);
                    if (!member) return null;
                    return (
                      <div key={memberId} className="space-y-2">
                        <Label className="text-sm text-[#374151]">{member.label}</Label>
                        <div className="flex items-center gap-3">
                          <Input
                            type="number"
                            min="0"
                            step="0.5"
                            value={allocationTask.allocations[memberId] || 0}
                            onChange={(e) => handleUpdateAllocationLocal(memberId, Number(e.target.value))}
                            className="flex-1"
                            placeholder="0"
                          />
                          <span className="text-sm text-[#6B7280] w-12">hours</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {allocationTask.assignedMembers.length > 0 && (
                <div className="mt-6 pt-4 border-t border-[#E5E7EB]">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#4B5563]">Total Allocated:</span>
                    <span className="text-[#111827] font-medium">
                      {Object.values(allocationTask.allocations).reduce((sum: number, hours: any) => sum + (Number(hours) || 0), 0)} hours
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-[#E5E7EB] flex items-center justify-end gap-3">
              <Button variant="outline" onClick={() => setAllocationPanelOpen(false)} type="button">
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  await saveAllocationsToApi();
                  setAllocationPanelOpen(false);
                }}
                className="bg-blue-600 hover:bg-blue-700"
                type="button"
              >
                Accept
              </Button>
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
                  className={confirmDialog.title === 'Delete Activity' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}
                  type="button"
                >
                  {confirmDialog.title === 'Delete Activity' ? 'Delete' : 'OK'}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
