import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, UserX, Mail, Clock, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/services/api-client';

interface TeamSectionProps {
  projectData?: any;
  projectId?: string;
  onUpdate?: (members: any[]) => void;
}

interface User {
  id?: string;
  user?: string;  // Primary key in Workdeck
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email: string;
  department?: string;
  enabled?: boolean;
  isGuest?: boolean;
}

// Get user ID (handles both 'id' and 'user' as primary key)
const getUserId = (user: User) => user.id || user.user || '';

// Get user full name
const getUserName = (user: User) => {
  if (user.fullName) return user.fullName;
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
};

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

export function TeamSection({ projectData, projectId, onUpdate }: TeamSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [members, setMembers] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isProjectManager, setIsProjectManager] = useState(false);
  const [isWatcher, setIsWatcher] = useState(false);

  // Initialize members from projectData
  useEffect(() => {
    if (projectData?.members) {
      setMembers(projectData.members);
    }
  }, [projectData]);

  // Load available users when dialog opens
  useEffect(() => {
    if (isDialogOpen) {
      loadAvailableUsers();
    }
  }, [isDialogOpen]);

  const loadAvailableUsers = async () => {
    setLoadingUsers(true);
    try {
      // Use users-summary endpoint like Angular app does
      const response = await apiClient.get('/queries/users-summary');
      console.log('Users API response:', response);
      
      // Handle different response structures
      let users: User[] = [];
      if (Array.isArray(response)) {
        users = response;
      } else if (response?.result && Array.isArray(response.result)) {
        users = response.result;
      } else if (response?.data && Array.isArray(response.data)) {
        users = response.data;
      }
      
      // Filter to only enabled, non-guest users
      users = users.filter((u: any) => u.enabled !== false && !u.isGuest);
      
      console.log('Parsed users:', users);
      setAvailableUsers(users);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const openDialog = () => {
    console.log('Opening Add Team Member dialog');
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedUser(null);
    setIsProjectManager(false);
    setIsWatcher(false);
    setUserSearchQuery('');
  };

  const existingMemberIds = members.map((m) => m.userId || m.user?.id || m.user?.user);

  const filteredAvailableUsers = availableUsers.filter((user) => {
    const uId = getUserId(user);
    const isAlreadyMember = existingMemberIds.includes(uId);
    const name = getUserName(user).toLowerCase();
    const email = (user.email || '').toLowerCase();
    const query = userSearchQuery.toLowerCase();
    const matchesSearch = userSearchQuery === '' || name.includes(query) || email.includes(query);
    return !isAlreadyMember && matchesSearch;
  });

  const filteredMembers = members.filter((member) => {
    const user = member.user || {};
    const name = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
    const email = (user.email || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || email.includes(query);
  });

  const addMember = async () => {
    if (!selectedUser) return;

    const memberId = getUserId(selectedUser);
    const pid = projectId || projectData?.id || projectData?.project;

    // Build payload matching backend expectations
    const memberPayload = {
      isProjectManager,
      isWatcher,
      project: { id: pid },
      projectId: pid,
      user: { id: memberId },
      userId: memberId,
    };

    console.log('Adding member with payload:', memberPayload);

    try {
      // Step 1: Queue the member addition in Redis (Angular pattern)
      const addResponse = await apiClient.post('/commands/mocks/add-project-member', memberPayload);
      console.log('Add member response:', addResponse);

      // Step 2: Commit to persist to database (required by Workdeck's two-phase commit system)
      const commitResponse = await apiClient.post('/commands/sync/commit-project', { id: pid });
      console.log('Commit response:', commitResponse);

      // Step 3: Reload project to get fresh members list from the committed response
      const resultData = commitResponse?.result || commitResponse;
      if (resultData?.members) {
        console.log('Updating members from commit response:', resultData.members);
        setMembers(resultData.members);
        // Sync with parent so navigation doesn't lose the update
        onUpdate?.(resultData.members);
      } else {
        // Otherwise fetch fresh project data
        console.log('Fetching fresh project data...');
        const freshProject = await apiClient.get(`/queries/projects/${pid}`);
        const projectData = freshProject?.result || freshProject;
        if (projectData?.members) {
          console.log('Updating members from fresh fetch:', projectData.members);
          setMembers(projectData.members);
          // Sync with parent
          onUpdate?.(projectData.members);
        }
      }

      closeDialog();
    } catch (error) {
      console.error('Failed to add member:', error);
      alert('Failed to add team member. Please try again.');
    }
  };

  const removeMember = async (userId: string) => {
    const pid = projectId || projectData?.id || projectData?.project;

    // Build payload matching Angular's delete-project-member
    const deletePayload = {
      projectId: pid,
      project: { id: pid },
      user: { id: userId },
      userId: userId,
    };

    try {
      // Step 1: Queue the member deletion in Redis (Angular pattern)
      await apiClient.post('/commands/mocks/delete-project-member', deletePayload);
      console.log('Member removal queued:', deletePayload);

      // Step 2: Commit to persist to database
      await apiClient.post('/commands/sync/commit-project', { id: pid });
      console.log('Member removal committed');

      const updatedMembers = members.filter((m) => (m.userId || m.user?.id || m.user?.user) !== userId);
      setMembers(updatedMembers);
    } catch (error) {
      console.error('Failed to remove member:', error);
      alert('Failed to remove team member. Please try again.');
    }
  };

  const getMemberAllocatedHours = (userId: string): number => {
    let totalHours = 0;
    projectData?.activities?.forEach((activity: any) => {
      activity.tasks?.forEach((task: any) => {
        task.participants?.forEach((p: any) => {
          if (p.user?.id === userId || p.userId === userId) {
            totalHours += parseFloat(p.plannedHours) || 0;
          }
        });
      });
    });
    return totalHours;
  };

  return (
    <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm">
      {/* Header */}
      <div className="px-6 py-5 border-b border-[#E5E7EB]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[#111827] text-lg font-semibold">Team & Roles</h2>
            <p className="text-sm text-[#6B7280] mt-1">Manage project team members and their roles</p>
          </div>
          <Button 
            className="bg-blue-600 hover:bg-blue-700" 
            onClick={openDialog}
            type="button"
          >
            <Plus className="w-4 h-4 mr-2 stroke-[1.5]" />
            Add Team Member
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] stroke-[1.5]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search team members..."
            className="pl-9 bg-[#FAFAFC] border-[#E5E7EB]"
          />
        </div>
      </div>

      {/* Team Members List */}
      <div className="p-6">
        <div className="space-y-3">
          {filteredMembers.map((member, idx) => {
            const user = member.user || {};
            const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown';
            const email = user.email || '';
            const userId = member.userId || user.id;
            const allocatedHours = getMemberAllocatedHours(userId);
            const role = member.isProjectManager ? 'Project Manager' : member.isWatcher ? 'Watcher' : user.department || 'Team Member';

            return (
              <div
                key={userId || idx}
                className="flex items-center gap-4 p-4 rounded-lg border border-[#E5E7EB] hover:border-[#D1D5DB] hover:shadow-sm transition-all"
              >
                <div className="relative">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium ${getAvatarColor(idx)}`}>
                    {getInitials(name)}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-[#111827]">{name}</p>
                    <Badge variant="outline" className="text-xs border-[#E5E7EB] text-[#4B5563]">
                      {role}
                    </Badge>
                    {member.isProjectManager && (
                      <Badge className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-100 border-0">
                        PM
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[#6B7280]">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 stroke-[1.5]" />
                      {email}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 stroke-[1.5]" />
                      {allocatedHours}h allocated
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => removeMember(userId)}
                    className="text-[#9CA3AF] hover:text-red-600 transition-colors"
                    title="Remove from project"
                    type="button"
                  >
                    <UserX className="w-4 h-4 stroke-[1.5]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredMembers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[#6B7280]">No team members found</p>
          </div>
        )}
      </div>

      {/* Add Team Member Modal - Custom implementation without Dialog component */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={closeDialog}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-xl w-full max-w-lg mx-4 shadow-2xl z-10">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
              <h2 className="text-lg font-semibold text-[#111827]">Add Team Member</h2>
              <button 
                onClick={closeDialog} 
                className="p-1 hover:bg-[#F3F4F6] rounded"
                type="button"
              >
                <X className="w-5 h-5 text-[#6B7280]" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Search Users */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                <Input
                  placeholder="Search users by name or email..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* User List */}
              <div className="max-h-64 overflow-y-auto border border-[#E5E7EB] rounded-lg mb-4">
                {loadingUsers ? (
                  <div className="p-8 text-center text-[#6B7280]">Loading users...</div>
                ) : filteredAvailableUsers.length > 0 ? (
                  filteredAvailableUsers.map((user, idx) => {
                    const name = getUserName(user);
                    const uId = getUserId(user);
                    const isSelected = getUserId(selectedUser || {} as User) === uId;

                    return (
                      <div
                        key={uId}
                        onClick={() => setSelectedUser(user)}
                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-[#F3F4F6] last:border-b-0 ${
                          isSelected ? 'bg-blue-50' : 'hover:bg-[#F9FAFB]'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${getAvatarColor(idx)}`}>
                          {getInitials(name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#111827] truncate">{name}</p>
                          <p className="text-xs text-[#6B7280] truncate">{user.email}</p>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-[#6B7280]">
                    {userSearchQuery ? 'No users match your search' : 'All users are already team members'}
                  </div>
                )}
              </div>

              {/* Role Options */}
              {selectedUser && (
                <div className="bg-[#F9FAFB] rounded-lg p-4 mb-4">
                  <p className="text-sm font-medium text-[#374151] mb-3">Role Options</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isProjectManager}
                        onChange={(e) => setIsProjectManager(e.target.checked)}
                        className="w-4 h-4 rounded border-[#D1D5DB] text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-[#374151]">Project Manager</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isWatcher}
                        onChange={(e) => setIsWatcher(e.target.checked)}
                        className="w-4 h-4 rounded border-[#D1D5DB] text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-[#374151]">Watcher (view-only access)</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#E5E7EB]">
                <Button variant="outline" onClick={closeDialog} type="button">
                  Cancel
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={addMember}
                  disabled={!selectedUser}
                  type="button"
                >
                  Add Member
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
