import { Edit2, ChevronRight } from 'lucide-react';

const getInitials = (name: string) => {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
};

interface OverviewSectionProps {
  onNavigate: (section: 'activities' | 'team') => void;
  projectData?: any;
}

export function OverviewSection({ onNavigate, projectData }: OverviewSectionProps) {
  // Extract activities from project data
  const activities = projectData?.activities || [];
  
  // Extract team members from project data - API uses 'members' array
  const teamMembers = projectData?.members || [];

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(value || 0);
  };

  // Get color for activity/team member
  const getColor = (index: number) => {
    const colors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-6">
      {/* Project Essentials Card */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[18px] font-semibold text-[#111827]">Project Essentials</h2>
          <button className="flex items-center gap-2 text-[14px] text-[#0066FF] hover:text-[#0052CC] transition-colors">
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
        </div>

        {/* Two Column Grid */}
        <div className="grid grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <p className="text-[12px] text-[#6B7280] mb-1">Project Name</p>
              <p className="text-[14px] text-[#111827]">{projectData?.name || '—'}</p>
            </div>
            <div>
              <p className="text-[12px] text-[#6B7280] mb-1">Project Type</p>
              <p className="text-[14px] text-[#111827]">{projectData?.projectType?.name || '—'}</p>
            </div>
            <div>
              <p className="text-[12px] text-[#6B7280] mb-1">Start Date</p>
              <p className="text-[14px] text-[#111827]">{projectData?.startDate || '—'}</p>
            </div>
            <div>
              <p className="text-[12px] text-[#6B7280] mb-1">Cost Centre</p>
              <p className="text-[14px] text-[#111827]">{projectData?.costCenter?.name || '—'}</p>
            </div>
            <div>
              <p className="text-[12px] text-[#6B7280] mb-1">Contract Value</p>
              <p className="text-[14px] font-semibold text-[#059669]">{formatCurrency(parseFloat(projectData?.contractValue) || 0)}</p>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div>
              <p className="text-[12px] text-[#6B7280] mb-1">Client</p>
              <p className="text-[14px] text-[#111827]">{projectData?.client?.name || 'Internal'}</p>
            </div>
            <div>
              <p className="text-[12px] text-[#6B7280] mb-1">Funding Type</p>
              <p className="text-[14px] text-[#111827]">{projectData?.financialType?.name || '—'}</p>
            </div>
            <div>
              <p className="text-[12px] text-[#6B7280] mb-1">End Date</p>
              <p className="text-[14px] text-[#111827]">{projectData?.endDate || '—'}</p>
            </div>
            <div>
              <p className="text-[12px] text-[#6B7280] mb-1">Available Hours</p>
              <p className="text-[14px] text-[#111827]">{projectData?.availableHours || 0} hours</p>
            </div>
            <div>
              <p className="text-[12px] text-[#6B7280] mb-1">Planned Hours</p>
              <p className="text-[14px] text-[#111827]">{projectData?.plannedHours || 0} hours</p>
            </div>
          </div>
        </div>

        {/* Bottom Row - Full Width */}
        <div className="grid grid-cols-2 gap-8 mt-4 pt-4 border-t border-[#F3F4F6]">
          <div className="flex items-center justify-between">
            <p className="text-[12px] text-[#6B7280]">Billable</p>
            <span className={`px-3 py-1 rounded-md text-[13px] font-medium ${
              projectData?.billable ? 'bg-[#D1FAE5] text-[#065F46]' : 'bg-[#FEE2E2] text-[#991B1B]'
            }`}>
              {projectData?.billable ? 'Yes' : 'No'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[12px] text-[#6B7280]">Timesheet Required</p>
            <span className={`px-3 py-1 rounded-md text-[13px] font-medium ${
              projectData?.timesheet ? 'bg-[#DBEAFE] text-[#1E40AF]' : 'bg-[#F3F4F6] text-[#6B7280]'
            }`}>
              {projectData?.timesheet ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
      </div>

      {/* Activity Overview Card */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[18px] font-semibold text-[#111827]">Activity Overview</h2>
          <button
            onClick={() => onNavigate('activities')}
            className="flex items-center gap-1 text-[14px] text-[#0066FF] hover:text-[#0052CC] hover:underline transition-colors"
          >
            View All
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Table */}
        <div className="mt-4">
          {/* Header Row */}
          <div className="bg-[#F9FAFB] rounded-lg px-4 py-3 grid grid-cols-12 gap-4 mb-2">
            <div className="col-span-4 text-[12px] font-medium text-[#6B7280]">Activity</div>
            <div className="col-span-1 text-[12px] font-medium text-[#6B7280]">Tasks</div>
            <div className="col-span-2 text-[12px] font-medium text-[#6B7280]">Estimated Hours</div>
            <div className="col-span-2 text-[12px] font-medium text-[#6B7280]">Allocated Hours</div>
            <div className="col-span-3 text-[12px] font-medium text-[#6B7280]">Progress</div>
          </div>

          {/* Data Rows */}
          <div className="space-y-0">
            {activities.length > 0 ? (
              activities.slice(0, 5).map((activity: any, idx: number) => {
                const taskCount = activity.tasks?.length || 0;
                const estimatedHours = parseFloat(activity.availableHours) || 0;
                const allocatedHours = parseFloat(activity.plannedHours) || 0;
                const progress = estimatedHours > 0 ? Math.round((allocatedHours / estimatedHours) * 100) : 0;

                return (
                  <div
                    key={activity.id || idx}
                    onClick={() => onNavigate('activities')}
                    className="px-4 py-3 grid grid-cols-12 gap-4 items-center border-b border-[#F3F4F6] hover:bg-[#F9FAFB] cursor-pointer transition-colors"
                    style={{ height: '56px' }}
                  >
                    {/* Activity Name with Color Dot */}
                    <div className="col-span-4 flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: getColor(idx) }}
                      ></div>
                      <span className="text-[14px] text-[#111827] truncate">{activity.name}</span>
                    </div>

                    {/* Tasks */}
                    <div className="col-span-1 text-[14px] text-[#6B7280]">{taskCount}</div>

                    {/* Estimated Hours */}
                    <div className="col-span-2 text-[14px] text-[#6B7280]">{estimatedHours}h</div>

                    {/* Allocated Hours */}
                    <div className="col-span-2 text-[14px] text-[#6B7280]">{allocatedHours}h</div>

                    {/* Progress */}
                    <div className="col-span-3 flex items-center gap-3">
                      <div className="flex-1 h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(progress, 100)}%`,
                            backgroundColor: progress === 0 ? '#E5E7EB' : '#0066FF',
                          }}
                        ></div>
                      </div>
                      <span className="text-[13px] text-[#6B7280] w-10 text-right">{progress}%</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-[#6B7280]">
                No activities yet. Click "View All" to add activities.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Team Overview Card */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[18px] font-semibold text-[#111827]">Team Overview</h2>
          <button
            onClick={() => onNavigate('team')}
            className="border border-[#0066FF] text-[#0066FF] hover:bg-[#EEF2FF] px-4 py-2 rounded-md text-[14px] font-medium transition-colors"
          >
            Manage Team
          </button>
        </div>

        {/* Team Grid - 4 Columns */}
        {teamMembers.length > 0 ? (
          <div className="grid grid-cols-4 gap-4">
            {teamMembers.slice(0, 8).map((member: any, idx: number) => {
              // API structure: member.user contains the user details
              const user = member.user || {};
              const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown';
              const role = member.isProjectManager ? 'Project Manager' : (user.department || 'Team Member');
              const email = user.email || '';

              return (
                <div
                  key={member.userId || idx}
                  className="border border-[#E5E7EB] rounded-lg p-4 text-center hover:shadow-lg transition-shadow"
                >
                  {/* Avatar */}
                  <div
                    className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-[18px] font-semibold text-white mb-3"
                    style={{ backgroundColor: getColor(idx) }}
                  >
                    {getInitials(name)}
                  </div>

                  {/* Name */}
                  <p className="text-[14px] font-semibold text-[#111827] mb-1">{name}</p>

                  {/* Role Badge */}
                  <div className={`px-2 py-1 rounded inline-block mb-2 ${member.isProjectManager ? 'bg-[#DBEAFE]' : 'bg-[#F3F4F6]'}`}>
                    <span className={`text-[12px] ${member.isProjectManager ? 'text-[#1E40AF]' : 'text-[#6B7280]'}`}>{role}</span>
                  </div>

                  {/* Email */}
                  {email && (
                    <p className="text-[12px] text-[#6B7280] mb-2 truncate" title={email}>
                      {email}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-[#6B7280]">
            No team members assigned. Click "Manage Team" to add members.
          </div>
        )}
      </div>
    </div>
  );
}
