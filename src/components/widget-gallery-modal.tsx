import React, { useState } from 'react';
import { 
  X, 
  Check, 
  AlertTriangle, 
  Bell, 
  CheckCircle, 
  Users, 
  Calendar, 
  Briefcase, 
  Target, 
  CreditCard, 
  Receipt, 
  LayoutGrid, 
  Plane,
  GripVertical,
  HelpCircle
} from 'lucide-react';

interface WidgetData {
  id: string;
  name: string;
  description: string;
  size: '1x1' | '1x2' | '2x1';
  category: string;
  preview: React.ReactNode;
}

interface TemplateData {
  id: string;
  name: string;
  widgets: string[];
  preview: React.ReactNode;
}

interface WidgetGalleryModalProps {
  onClose: () => void;
  onSave: (selectedWidgets: string[]) => void;
}

export function WidgetGalleryModal({ onClose, onSave }: WidgetGalleryModalProps) {
  const [selectedWidgets, setSelectedWidgets] = useState<string[]>([]);
  const maxWidgets = 6;

  const widgets: WidgetData[] = [
    {
      id: 'red-zone',
      name: 'Red Zone',
      description: 'Track projects violating your custom thresholds',
      size: '1x1',
      category: 'productivity',
      preview: (
        <div className="h-full bg-gradient-to-br from-red-50 to-red-100 p-3 flex flex-col gap-1.5">
          <div className="flex items-center justify-between bg-white rounded px-2 py-1.5 shadow-sm">
            <span className="text-[9px] text-gray-700 truncate">SUSALGAEFUEL</span>
            <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-[8px] text-white font-bold">7</span>
            </div>
          </div>
          <div className="flex items-center justify-between bg-white rounded px-2 py-1.5 shadow-sm">
            <span className="text-[9px] text-gray-700 truncate">MOBILE APP</span>
            <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-[8px] text-white font-bold">4</span>
            </div>
          </div>
          <div className="flex items-center justify-between bg-white rounded px-2 py-1.5 shadow-sm">
            <span className="text-[9px] text-gray-700 truncate">Q4 CAMPAIGN</span>
            <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-[8px] text-white font-bold">3</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'fyi-queue',
      name: 'FYI Queue',
      description: 'Notifications and updates that don\'t need action',
      size: '1x1',
      category: 'communication',
      preview: (
        <div className="h-full bg-gradient-to-br from-blue-50 to-blue-100 p-3 flex flex-col gap-1.5">
          <div className="flex items-center gap-2 bg-white rounded px-2 py-1.5 shadow-sm">
            <div className="w-5 h-5 bg-blue-500 rounded-full flex-shrink-0"></div>
            <span className="text-[8px] text-gray-700 truncate">Lisa completed Budget</span>
          </div>
          <div className="flex items-center gap-2 bg-white rounded px-2 py-1.5 shadow-sm">
            <div className="w-5 h-5 bg-purple-500 rounded-full flex-shrink-0"></div>
            <span className="text-[8px] text-gray-700 truncate">David updated Timeline</span>
          </div>
          <div className="flex items-center gap-2 bg-white rounded px-2 py-1.5 shadow-sm">
            <div className="w-5 h-5 bg-green-500 rounded-full flex-shrink-0"></div>
            <span className="text-[8px] text-gray-700 truncate">New file shared</span>
          </div>
        </div>
      )
    },
    {
      id: 'pending-approvals',
      name: 'Pending Approvals',
      description: 'Requests waiting for your approval or decision',
      size: '1x1',
      category: 'workflow',
      preview: (
        <div className="h-full bg-gradient-to-br from-amber-50 to-amber-100 p-3 flex flex-col gap-2">
          <div className="bg-white rounded p-2 shadow-sm">
            <div className="text-[9px] font-medium text-gray-800 mb-1.5">Budget Request</div>
            <div className="flex gap-1">
              <div className="flex-1 h-4 bg-green-500 rounded text-[7px] text-white flex items-center justify-center">✓</div>
              <div className="flex-1 h-4 bg-red-500 rounded text-[7px] text-white flex items-center justify-center">✕</div>
            </div>
          </div>
          <div className="bg-white rounded p-2 shadow-sm">
            <div className="text-[9px] font-medium text-gray-800 mb-1.5">Time Off - 3 days</div>
            <div className="flex gap-1">
              <div className="flex-1 h-4 bg-green-500 rounded text-[7px] text-white flex items-center justify-center">✓</div>
              <div className="flex-1 h-4 bg-red-500 rounded text-[7px] text-white flex items-center justify-center">✕</div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'whos-where',
      name: 'Who\'s Where',
      description: 'Real-time team availability and location status',
      size: '1x1',
      category: 'team',
      preview: (
        <div className="h-full bg-gradient-to-br from-green-50 to-green-100 p-3">
          <div className="grid grid-cols-2 gap-2 h-full">
            <div className="bg-white rounded p-2 shadow-sm flex flex-col items-center justify-center gap-1">
              <div className="w-8 h-8 bg-blue-500 rounded-full relative">
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <span className="text-[7px] text-gray-600">Available</span>
            </div>
            <div className="bg-white rounded p-2 shadow-sm flex flex-col items-center justify-center gap-1">
              <div className="w-8 h-8 bg-purple-500 rounded-full relative">
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <span className="text-[7px] text-gray-600">Available</span>
            </div>
            <div className="bg-white rounded p-2 shadow-sm flex flex-col items-center justify-center gap-1">
              <div className="w-8 h-8 bg-pink-500 rounded-full relative">
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-amber-500 border-2 border-white rounded-full"></div>
              </div>
              <span className="text-[7px] text-gray-600">Meeting</span>
            </div>
            <div className="bg-white rounded p-2 shadow-sm flex flex-col items-center justify-center gap-1">
              <div className="w-8 h-8 bg-teal-500 rounded-full relative">
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></div>
              </div>
              <span className="text-[7px] text-gray-600">OOO</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'todo-list',
      name: 'To-do List',
      description: 'Personal quick-capture list and project checklists',
      size: '1x2',
      category: 'productivity',
      preview: (
        <div className="h-full bg-gradient-to-br from-indigo-50 to-indigo-100 p-3 flex flex-col gap-1.5">
          {[
            { text: 'Review Q4 budget', checked: true },
            { text: 'Team standup prep', checked: true },
            { text: 'Client presentation', checked: false },
            { text: 'Update roadmap', checked: false },
            { text: 'Review pull requests', checked: false },
            { text: 'Schedule 1-on-1s', checked: false }
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-white rounded px-2 py-1.5 shadow-sm">
              <div className={`w-3 h-3 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                item.checked ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
              }`}>
                {item.checked && <Check className="w-2 h-2 text-white" />}
              </div>
              <span className={`text-[8px] truncate ${item.checked ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                {item.text}
              </span>
            </div>
          ))}
        </div>
      )
    },
    {
      id: 'agenda',
      name: 'Agenda',
      description: 'Your daily calendar with meetings and focus time',
      size: '1x2',
      category: 'time',
      preview: (
        <div className="h-full bg-gradient-to-br from-violet-50 to-violet-100 p-3 flex flex-col gap-1">
          <div className="text-[9px] font-semibold text-gray-700 mb-1">Tuesday, Nov 18</div>
          {[
            { time: '9:00', title: 'Team Standup', color: 'bg-blue-500' },
            { time: '10:00', title: 'Focus Time', color: 'bg-green-500' },
            { time: '11:30', title: 'Client Call', color: 'bg-purple-500' },
            { time: '13:00', title: 'Lunch', color: 'bg-gray-400' },
            { time: '14:00', title: 'Design Review', color: 'bg-blue-500' },
            { time: '15:30', title: 'Focus Time', color: 'bg-green-500' }
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-white rounded px-2 py-1 shadow-sm">
              <span className="text-[7px] text-gray-500 w-8 flex-shrink-0">{item.time}</span>
              <div className={`w-1 h-4 ${item.color} rounded-full`}></div>
              <span className="text-[8px] text-gray-700 truncate flex-1">{item.title}</span>
            </div>
          ))}
        </div>
      )
    },
    {
      id: 'project-portfolio',
      name: 'Project Portfolio',
      description: 'Overview of all projects with health indicators',
      size: '2x1',
      category: 'projects',
      preview: (
        <div className="h-full bg-gradient-to-br from-cyan-50 to-cyan-100 p-3">
          <div className="grid grid-cols-4 gap-2 h-full">
            {[
              { name: 'Website', progress: 75, status: 'green' },
              { name: 'Mobile', progress: 45, status: 'amber' },
              { name: 'API', progress: 90, status: 'green' },
              { name: 'Marketing', progress: 30, status: 'red' }
            ].map((project, idx) => (
              <div key={idx} className="bg-white rounded p-2 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="text-[8px] font-medium text-gray-800 mb-1 truncate">{project.name}</div>
                  <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${
                        project.status === 'green' ? 'bg-green-500' : 
                        project.status === 'amber' ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-[7px] text-gray-500 mt-1">{project.progress}%</div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'milestones',
      name: 'Milestones',
      description: 'Upcoming project milestones and deadlines',
      size: '1x1',
      category: 'projects',
      preview: (
        <div className="h-full bg-gradient-to-br from-orange-50 to-orange-100 p-3 flex flex-col justify-center">
          <div className="relative">
            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-orange-300"></div>
            {[
              { date: 'Nov 20', title: 'Design Complete' },
              { date: 'Nov 25', title: 'Beta Launch' },
              { date: 'Dec 1', title: 'Full Release' }
            ].map((milestone, idx) => (
              <div key={idx} className="relative pl-7 pb-3 last:pb-0">
                <div className="absolute left-2 top-1 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-white"></div>
                <div className="text-[7px] text-gray-500">{milestone.date}</div>
                <div className="text-[8px] font-medium text-gray-800">{milestone.title}</div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'purchases-queue',
      name: 'Purchases Queue',
      description: 'Pending purchase requests requiring approval',
      size: '1x1',
      category: 'finance',
      preview: (
        <div className="h-full bg-gradient-to-br from-emerald-50 to-emerald-100 p-3 flex flex-col gap-2">
          <div className="bg-white rounded p-2 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[8px] font-medium text-gray-800">Office Supplies</span>
              <span className="text-[9px] font-bold text-green-600">$450</span>
            </div>
            <div className="text-[7px] text-gray-500">Requested by Marina</div>
          </div>
          <div className="bg-white rounded p-2 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[8px] font-medium text-gray-800">Software License</span>
              <span className="text-[9px] font-bold text-green-600">$1,200</span>
            </div>
            <div className="text-[7px] text-gray-500">Requested by David</div>
          </div>
        </div>
      )
    },
    {
      id: 'expenses-queue',
      name: 'Expenses Queue',
      description: 'Expense reports waiting for review',
      size: '1x1',
      category: 'finance',
      preview: (
        <div className="h-full bg-gradient-to-br from-pink-50 to-pink-100 p-3 flex flex-col gap-2">
          <div className="bg-white rounded p-2 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Receipt className="w-3 h-3 text-pink-500" />
              <span className="text-[8px] font-medium text-gray-800">Client Dinner</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[7px] text-gray-500">Tom Brady</span>
              <span className="text-[8px] font-bold text-gray-700">$245</span>
            </div>
          </div>
          <div className="bg-white rounded p-2 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Receipt className="w-3 h-3 text-pink-500" />
              <span className="text-[8px] font-medium text-gray-800">Travel</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[7px] text-gray-500">Anna Smith</span>
              <span className="text-[8px] font-bold text-gray-700">$890</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'task-overview',
      name: 'Task Overview',
      description: 'High-level view of all your assigned tasks',
      size: '2x1',
      category: 'productivity',
      preview: (
        <div className="h-full bg-gradient-to-br from-slate-50 to-slate-100 p-3">
          <div className="grid grid-cols-3 gap-2 h-full">
            {[
              { title: 'To Do', count: 5, color: 'bg-gray-500' },
              { title: 'In Progress', count: 3, color: 'bg-blue-500' },
              { title: 'Done', count: 12, color: 'bg-green-500' }
            ].map((column, idx) => (
              <div key={idx} className="bg-white rounded p-2 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[8px] font-medium text-gray-700">{column.title}</span>
                  <span className="text-[7px] text-gray-500">{column.count}</span>
                </div>
                <div className="space-y-1 flex-1">
                  {[1, 2].map((_, taskIdx) => (
                    <div key={taskIdx} className={`h-4 ${column.color} rounded opacity-${taskIdx === 0 ? 100 : 60}`}></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'next-trips',
      name: 'Next Trips',
      description: 'Upcoming business travel and itineraries',
      size: '1x1',
      category: 'travel',
      preview: (
        <div className="h-full bg-gradient-to-br from-sky-50 to-sky-100 p-3 flex flex-col gap-2">
          <div className="bg-white rounded p-2 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Plane className="w-3 h-3 text-sky-500" />
              <span className="text-[8px] font-medium text-gray-800">San Francisco</span>
            </div>
            <div className="text-[7px] text-gray-500">Nov 22-24 • Client Visit</div>
          </div>
          <div className="bg-white rounded p-2 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Plane className="w-3 h-3 text-sky-500" />
              <span className="text-[8px] font-medium text-gray-800">London</span>
            </div>
            <div className="text-[7px] text-gray-500">Dec 5-8 • Conference</div>
          </div>
        </div>
      )
    }
  ];

  const templates: TemplateData[] = [
    {
      id: 'project-manager',
      name: 'Project Manager',
      widgets: ['red-zone', 'pending-approvals', 'project-portfolio', 'milestones', 'whos-where', 'agenda'],
      preview: (
        <div className="w-full h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded p-2">
          <div className="grid grid-cols-3 gap-1 h-full">
            <div className="bg-white rounded shadow-sm"></div>
            <div className="bg-white rounded shadow-sm"></div>
            <div className="bg-white rounded shadow-sm"></div>
            <div className="col-span-2 bg-white rounded shadow-sm"></div>
            <div className="bg-white rounded shadow-sm"></div>
          </div>
        </div>
      )
    },
    {
      id: 'admin-dashboard',
      name: 'Admin Dashboard',
      widgets: ['pending-approvals', 'purchases-queue', 'expenses-queue', 'whos-where', 'fyi-queue', 'next-trips'],
      preview: (
        <div className="w-full h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded p-2">
          <div className="grid grid-cols-3 gap-1 h-full">
            <div className="bg-white rounded shadow-sm"></div>
            <div className="bg-white rounded shadow-sm"></div>
            <div className="bg-white rounded shadow-sm"></div>
            <div className="bg-white rounded shadow-sm"></div>
            <div className="bg-white rounded shadow-sm"></div>
            <div className="bg-white rounded shadow-sm"></div>
          </div>
        </div>
      )
    },
    {
      id: 'developer-view',
      name: 'Developer View',
      widgets: ['todo-list', 'agenda', 'task-overview', 'red-zone', 'fyi-queue'],
      preview: (
        <div className="w-full h-20 bg-gradient-to-br from-green-100 to-green-200 rounded p-2">
          <div className="grid grid-cols-3 gap-1 h-full">
            <div className="row-span-2 bg-white rounded shadow-sm"></div>
            <div className="col-span-2 bg-white rounded shadow-sm"></div>
            <div className="bg-white rounded shadow-sm"></div>
            <div className="bg-white rounded shadow-sm"></div>
          </div>
        </div>
      )
    }
  ];

  const toggleWidget = (widgetId: string) => {
    if (selectedWidgets.includes(widgetId)) {
      setSelectedWidgets(selectedWidgets.filter(id => id !== widgetId));
    } else {
      if (selectedWidgets.length < maxWidgets) {
        setSelectedWidgets([...selectedWidgets, widgetId]);
      }
    }
  };

  const applyTemplate = (template: TemplateData) => {
    setSelectedWidgets(template.widgets.slice(0, maxWidgets));
  };

  const handleSave = () => {
    onSave(selectedWidgets);
    onClose();
  };

  const getWidgetById = (id: string) => widgets.find(w => w.id === id);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-[680px] max-h-[90vh] flex flex-col overflow-hidden"
        style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER SECTION */}
        <div className="p-6 border-b border-[#E5E7EB] flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl text-[#1F2937] mb-1">Build Your Dashboard</h2>
              <p className="text-sm text-[#6B7280]">Select up to 6 widgets. Drag to reorder.</p>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F9FAFB] text-[#6B7280] hover:text-[#1F2937] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* ROLE TEMPLATES SECTION */}
          <div className="bg-[#EFF6FF] p-5">
            <h3 className="text-base text-[#1F2937] mb-4">Quick Start Templates</h3>
            
            <div className="grid grid-cols-3 gap-3 mb-3">
              {templates.map((template) => (
                <div 
                  key={template.id}
                  className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => applyTemplate(template)}
                >
                  <div className="h-20">
                    {template.preview}
                  </div>
                  <div className="p-3 border-t border-[#E5E7EB]">
                    <h4 className="text-sm text-[#1F2937] mb-1">{template.name}</h4>
                    <p className="text-xs text-[#6B7280]">{template.widgets.length} widgets</p>
                    <button className="w-full mt-2 h-8 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs rounded-md transition-colors">
                      Use Template
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-center text-[#6B7280]">Or customize below ↓</p>
          </div>

          {/* WIDGET GALLERY SECTION */}
          <div className="p-5">
            <div className="grid grid-cols-2 gap-4">
              {widgets.map((widget) => {
                const isSelected = selectedWidgets.includes(widget.id);
                const canSelect = selectedWidgets.length < maxWidgets || isSelected;
                
                return (
                  <div
                    key={widget.id}
                    className={`relative rounded-lg border-2 transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-[#3B82F6] shadow-md' 
                        : 'border-transparent shadow-sm hover:border-[#3B82F6] hover:shadow-md'
                    } ${!canSelect && !isSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
                    style={{ 
                      height: widget.size === '1x2' ? '280px' : '180px'
                    }}
                    onClick={() => canSelect && toggleWidget(widget.id)}
                  >
                    {/* Preview Section */}
                    <div 
                      className={`relative overflow-hidden ${
                        widget.size === '1x2' ? 'h-[200px]' : 'h-[100px]'
                      }`}
                      style={{ borderTopLeftRadius: '6px', borderTopRightRadius: '6px' }}
                    >
                      {widget.preview}
                      
                      {/* Selected overlay */}
                      {isSelected && (
                        <div className="absolute inset-0 bg-blue-500 bg-opacity-10 flex items-center justify-center">
                          <div className="w-12 h-12 bg-[#3B82F6] rounded-full flex items-center justify-center">
                            <Check className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Info Section */}
                    <div className="p-4 bg-white">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="text-base text-[#1F2937]">{widget.name}</h4>
                        <span className="text-[11px] text-[#6B7280] bg-[#F3F4F6] px-2 py-0.5 rounded-full flex-shrink-0">
                          {widget.size}
                        </span>
                      </div>
                      <p className="text-xs text-[#6B7280] line-clamp-2 mb-3">
                        {widget.description}
                      </p>
                      
                      {/* Action button */}
                      {isSelected ? (
                        <div className="flex items-center gap-1.5 text-[#10B981]">
                          <Check className="w-4 h-4" />
                          <span className="text-xs font-medium">Added</span>
                        </div>
                      ) : (
                        <button 
                          className={`text-xs text-[#6B7280] hover:text-[#3B82F6] flex items-center gap-1 transition-colors ${
                            !canSelect ? 'cursor-not-allowed' : ''
                          }`}
                          disabled={!canSelect}
                        >
                          + Add
                        </button>
                      )}
                    </div>

                    {/* Selected badge */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-8 h-8 bg-[#3B82F6] rounded-full flex items-center justify-center shadow-lg">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* FOOTER SECTION */}
        <div className="bg-[#F9FAFB] border-t border-[#E5E7EB] p-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSelectedWidgets([])}
              className="text-xs text-[#6B7280] hover:text-[#1F2937] transition-colors"
            >
              Reset to Default
            </button>
            <div className="relative group">
              <button className="w-5 h-5 flex items-center justify-center text-[#9CA3AF] hover:text-[#6B7280]">
                <HelpCircle className="w-4 h-4" />
              </button>
              <div className="absolute bottom-full left-0 mb-2 w-48 bg-[#1F2937] text-white text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Choose widgets that match your workflow
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs text-[#6B7280] mr-2">
              <span className="font-medium text-[#1F2937]">{selectedWidgets.length}</span> of {maxWidgets} selected
            </div>
            <button 
              onClick={onClose}
              className="h-10 px-5 text-sm text-[#6B7280] hover:text-[#1F2937] transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={selectedWidgets.length === 0}
              className={`h-10 px-6 rounded-md text-sm text-white transition-colors ${
                selectedWidgets.length === 0
                  ? 'bg-[#D1D5DB] cursor-not-allowed'
                  : 'bg-[#3B82F6] hover:bg-[#2563EB]'
              }`}
            >
              Save Dashboard
            </button>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="h-1 bg-[#E5E7EB]">
          <div 
            className="h-full bg-[#3B82F6] transition-all duration-300"
            style={{ width: `${(selectedWidgets.length / maxWidgets) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
