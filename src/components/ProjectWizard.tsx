import React, { useState } from 'react';
import { X } from 'lucide-react';
import { OverviewStep } from '../imports/CreateNewProjectWizard';
import { TeamRolesStep } from '../imports/CreateNewProjectWizard';
import { ActivitiesTasksStep } from '../imports/CreateNewProjectWizard';
import { MilestonesStep } from '../imports/CreateNewProjectWizard-177-2569';
import { BudgetExpendituresStep } from '../imports/CreateNewProjectWizard-177-2804';
import { FilesStep } from '../imports/CreateNewProjectWizard-177-3034';
import { NotesStep } from '../imports/CreateNewProjectWizard-177-3227';
import { SettingsStep } from '../imports/CreateNewProjectWizard-177-3561';

interface ProjectWizardProps {
  mode: 'create' | 'edit';
  projectData?: any;
  onClose: () => void;
  onSave?: (data: any) => void;
}

export function ProjectWizard({ mode, projectData, onClose, onSave }: ProjectWizardProps) {
  const [activeSection, setActiveSection] = useState<string>('Overview');
  const [projectFormData, setProjectFormData] = useState(projectData || {
    projectName: '',
    client: '',
    projectCode: '',
    startDate: '',
    endDate: '',
    status: 'Active',
    billable: true,
    teamsheetRequired: false,
    // Add more default fields as needed
  });

  const sections = [
    { id: 'Overview', label: 'Overview', component: OverviewStep },
    { id: 'Team & Roles', label: 'Team & Roles', component: TeamRolesStep },
    { id: 'Activities & Tasks', label: 'Activities & Tasks', component: ActivitiesTasksStep },
    { id: 'Milestones', label: 'Milestones', component: MilestonesStep },
    { id: 'Budget & Expenditures', label: 'Budget & Expenditures', component: BudgetExpendituresStep },
    { id: 'Files', label: 'Files', component: FilesStep },
    { id: 'Notes', label: 'Notes', component: NotesStep },
    { id: 'Settings', label: 'Settings', component: SettingsStep },
  ];

  const ActiveComponent = sections.find(s => s.id === activeSection)?.component || OverviewStep;

  const handleSaveAndClose = () => {
    if (onSave) {
      onSave(projectFormData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-white">
      {/* Header */}
      <div className="h-16 border-b border-[#E5E7EB] flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <h1 className="text-xl text-[#1F2937]">
            {mode === 'create' ? 'Create New Project' : 'Edit Project'}
          </h1>
          {mode === 'edit' && projectData?.projectName && (
            <span className="text-[#6B7280]">• {projectData.projectName}</span>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#F9FAFB] text-[#6B7280] transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar Navigation */}
        <div className="w-64 border-r border-[#E5E7EB] bg-[#FAFBFC] p-4">
          <nav className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full text-left px-3 py-2 rounded text-sm transition-all ${
                  activeSection === section.id
                    ? 'bg-[#EFF6FF] text-[#3B82F6] font-medium'
                    : 'text-[#6B7280] hover:bg-white hover:text-[#111827]'
                }`}
              >
                {section.label}
              </button>
            ))}
          </nav>

          {/* Bottom Actions */}
          <div className="absolute bottom-6 left-4 right-4 space-y-2">
            <button
              onClick={handleSaveAndClose}
              className="w-full h-10 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded transition-all"
            >
              {mode === 'create' ? 'Create Project' : 'Save Changes'}
            </button>
            <button
              onClick={onClose}
              className="w-full h-10 border border-[#E5E7EB] hover:bg-[#F9FAFB] text-[#6B7280] rounded transition-all"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-white">
          <ActiveComponent
            data={projectFormData}
            onChange={setProjectFormData}
            mode={mode}
          />
        </div>
      </div>
    </div>
  );
}
